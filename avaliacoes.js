// Avaliações de clientes: formulário, envio à API e carrossel com os dados do banco.
(() => {
  const section = document.getElementById("depoimentos");
  const form = document.getElementById("reviewForm");

  if (!section || !form) {
    return;
  }

  const API_BASE_URL = String(window.SiteConfig?.apiBaseUrl || "/api").replace(/\/+$/, "");
  const ENDPOINT = `${API_BASE_URL}/avaliacoes`;
  const POLL_INTERVAL_MS = 30000;
  const REQUEST_TIMEOUT_MS = 15000;
  const SCROLL_SPEED_PX_S = 28;
  const TOUCH_RESUME_DELAY_MS = 2500;
  const NOME_LIMITES = [2, 60];
  const COMENTARIO_LIMITES = [10, 1000];

  const submitButton = document.getElementById("reviewSubmit");
  const statusEl = document.getElementById("reviewStatus");
  const counterEl = document.getElementById("reviewComentarioContador");
  const starsWrap = document.getElementById("reviewStars");
  const starLabels = Array.from(starsWrap.querySelectorAll("label"));
  const starInputs = Array.from(starsWrap.querySelectorAll('input[name="nota"]'));
  const ratingFieldset = form.querySelector(".review-rating");
  const fields = {
    nome: form.elements.namedItem("nome"),
    servico: form.elements.namedItem("servico"),
    comentario: form.elements.namedItem("comentario"),
    consentimento: form.elements.namedItem("consentimento"),
    website: form.elements.namedItem("website"),
  };

  const loadingEl = document.getElementById("reviewsLoading");
  const emptyEl = document.getElementById("reviewsEmpty");
  const errorEl = document.getElementById("reviewsError");
  const retryButton = document.getElementById("reviewsRetry");
  const loadErrorText = errorEl?.querySelector("p");
  const viewport = document.getElementById("reviewsViewport");
  const track = document.getElementById("reviewsTrack");
  const noteEl = document.getElementById("reviewsNote");
  const countEl = document.getElementById("reviewsCount");
  const toggleButton = document.getElementById("reviewsToggle");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  const countChars = (text) => Array.from(text).length;

  const createKey = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  // A mesma chave é reenviada em novas tentativas do mesmo envio; o servidor
  // devolve o registro já gravado em vez de duplicá-lo. Só muda após o sucesso.
  let idempotencyKey = createKey();
  let startedAt = Date.now();
  let isSubmitting = false;

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      // Uma regra de rewrite ou página 404 pode devolver HTML no lugar da API.
      const isJson = (response.headers.get("content-type") || "").includes("application/json");
      let body = null;

      if (isJson) {
        try {
          body = await response.json();
        } catch (_error) {
          body = null;
        }
      }

      return { response, body, isJson };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  // ---------- Formulário ----------

  const selectedRating = () => Number(starInputs.find((input) => input.checked)?.value || 0);

  const paintStars = (value) => {
    starLabels.forEach((label, index) => {
      label.classList.toggle("is-filled", index < value);
    });
  };

  starInputs.forEach((input) => {
    input.addEventListener("change", () => {
      paintStars(selectedRating());
      setFieldError("nota", "");
    });
  });

  starLabels.forEach((label, index) => {
    label.addEventListener("mouseenter", () => paintStars(index + 1));
  });

  starsWrap.addEventListener("mouseleave", () => paintStars(selectedRating()));

  const updateCounter = () => {
    const total = countChars(fields.comentario.value);
    counterEl.textContent = `${total}/${COMENTARIO_LIMITES[1]}`;
    counterEl.classList.toggle("is-over", total > COMENTARIO_LIMITES[1]);
  };

  fields.comentario.addEventListener("input", updateCounter);

  function setFieldError(name, message) {
    const errorBox = form.querySelector(`[data-error-for="${name}"]`);

    if (errorBox) {
      errorBox.textContent = message || "";
    }

    const invalid = message ? "true" : "false";

    if (name === "nota") {
      ratingFieldset.classList.toggle("is-invalid", Boolean(message));
      starInputs.forEach((input) => input.setAttribute("aria-invalid", invalid));
      return;
    }

    fields[name]?.setAttribute("aria-invalid", invalid);
  }

  const FIELD_ORDER = ["nome", "servico", "nota", "comentario", "consentimento"];

  // Ao corrigir um campo, a mensagem de erro dele some.
  ["nome", "servico", "comentario", "consentimento"].forEach((name) => {
    const eventName = name === "nome" || name === "comentario" ? "input" : "change";
    fields[name].addEventListener(eventName, () => {
      if (fields[name].getAttribute("aria-invalid") === "true") {
        setFieldError(name, "");
      }
    });
  });

  function showErrors(errors) {
    FIELD_ORDER.forEach((name) => setFieldError(name, errors[name]));
  }

  function focusFirstInvalid(errors) {
    const first = FIELD_ORDER.find((name) => errors[name]);

    if (first === "nota") {
      starInputs[0].focus();
    } else if (first) {
      fields[first].focus();
    }
  }

  // Mesmas regras do servidor, para respostas imediatas. O servidor valida de novo.
  function validate() {
    const errors = {};
    const nome = fields.nome.value.replace(/\s+/g, " ").trim();
    const comentario = fields.comentario.value.trim();
    const nota = selectedRating();
    const tamanhoNome = countChars(nome);
    const tamanhoComentario = countChars(comentario);

    if (tamanhoNome < NOME_LIMITES[0] || tamanhoNome > NOME_LIMITES[1]) {
      errors.nome = `Informe um nome entre ${NOME_LIMITES[0]} e ${NOME_LIMITES[1]} caracteres.`;
    }

    if (!fields.servico.value) {
      errors.servico = "Selecione o serviço realizado.";
    }

    if (nota < 1 || nota > 5) {
      errors.nota = "Selecione uma nota de 1 a 5 estrelas.";
    }

    if (tamanhoComentario < COMENTARIO_LIMITES[0] || tamanhoComentario > COMENTARIO_LIMITES[1]) {
      errors.comentario = `O comentário deve ter entre ${COMENTARIO_LIMITES[0]} e ${COMENTARIO_LIMITES[1]} caracteres.`;
    }

    if (!fields.consentimento.checked) {
      errors.consentimento = "É preciso autorizar a publicação do nome e do comentário.";
    }

    return {
      errors,
      data: { nome, servico: fields.servico.value, nota, comentario, consentimento: true },
    };
  }

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-success", type === "success");
    statusEl.classList.toggle("is-error", type === "error");
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    submitButton.setAttribute("aria-busy", String(busy));
    submitButton.querySelector("span").textContent = busy ? "Enviando…" : "Enviar avaliação";
  }

  function resetForm() {
    form.reset();
    paintStars(0);
    updateCounter();
    showErrors({});
    idempotencyKey = createKey();
    startedAt = Date.now();
  }

  const MESSAGES = {
    network: "Não foi possível conectar ao servidor de avaliações.",
    timeout: "O servidor de avaliações demorou demais para responder.",
    notFound: "O serviço de avaliações não foi encontrado neste endereço.",
    unavailable: "O serviço de avaliações está temporariamente indisponível.",
  };

  // Classifica a falha: rede/tempo esgotado, rota inexistente (ou HTML no lugar
  // da API), serviço indisponível (ex.: banco fora do ar) ou erro do servidor.
  function describeFailure(result, error) {
    if (!result) {
      return error?.name === "AbortError" ? MESSAGES.timeout : MESSAGES.network;
    }

    if (!result.isJson || result.response.status === 404) {
      return MESSAGES.notFound;
    }

    if (result.response.status === 503) {
      return result.body?.message || MESSAGES.unavailable;
    }

    return null;
  }

  const statusMessages = {
    429: "Muitas avaliações enviadas a partir desta conexão. Tente novamente mais tarde.",
    500: "O servidor não conseguiu salvar sua avaliação. Seus dados foram mantidos; tente novamente.",
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const { errors, data } = validate();
    showErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus("Revise os campos destacados.", "error");
      focusFirstInvalid(errors);
      return;
    }

    isSubmitting = true;
    setBusy(true);
    setStatus("");

    try {
      const result = await request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          idempotencyKey,
          iniciadoEm: startedAt,
          website: fields.website.value,
        }),
      });

      const { response, body } = result;
      const saved = body?.avaliacao;

      // Sucesso só depois da confirmação do banco (201 criado ou 200 já gravado).
      if ((response.status === 201 || response.status === 200) && saved?.id) {
        addReview(saved);
        resetForm();
        setStatus("Obrigado! Sua avaliação foi publicada.", "success");
        return;
      }

      if (body?.errors) {
        showErrors(body.errors);
        focusFirstInvalid(body.errors);
      }

      if (response.status === 409 && !/já foi enviada/i.test(body?.message || "")) {
        idempotencyKey = createKey();
      }

      const failure = describeFailure(result);

      setStatus(
        failure
          ? `${failure} Seus dados foram mantidos; tente novamente em instantes.`
          : body?.message || statusMessages[response.status] || statusMessages[500],
        "error"
      );
    } catch (error) {
      setStatus(
        `${describeFailure(null, error)} Seus dados foram mantidos; verifique a conexão e tente novamente.`,
        "error"
      );
    } finally {
      isSubmitting = false;
      setBusy(false);
    }
  });

  // ---------- Cards ----------

  let reviews = [];
  let signature = "";

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    // Sempre textContent: comentários e nomes nunca são interpretados como HTML.
    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function buildCard(review, isClone) {
    const card = createElement("article", "review-card");
    card.dataset.reviewId = review.id;

    const quote = createElement("div", "review-card-quote");
    quote.setAttribute("aria-hidden", "true");
    quote.appendChild(createElement("i", "fa-solid fa-quote-left"));

    const nota = Math.min(Math.max(Number(review.nota) || 0, 0), 5);
    const stars = createElement("div", "review-card-stars");
    stars.setAttribute("role", "img");
    stars.setAttribute("aria-label", `Nota ${nota} de 5`);

    for (let index = 1; index <= 5; index += 1) {
      const star = createElement("i", `fa-solid fa-star ${index <= nota ? "is-on" : "is-off"}`);
      star.setAttribute("aria-hidden", "true");
      stars.appendChild(star);
    }

    const text = createElement("p", "review-card-text", review.comentario);
    const more = createElement("button", "review-card-more", "Ler mais");
    more.type = "button";
    more.hidden = true;
    more.setAttribute("aria-expanded", "false");

    if (!isClone) {
      text.id = `review-text-${review.id}`;
      more.setAttribute("aria-controls", text.id);
    }

    const nome = String(review.nome || "").trim();
    const person = createElement("div", "review-card-person");
    const avatar = createElement("span", "review-card-avatar", (Array.from(nome)[0] || "?").toLocaleUpperCase("pt-BR"));
    avatar.setAttribute("aria-hidden", "true");
    const meta = createElement("div", "review-card-meta");
    const time = createElement("time", "review-card-date", formatDate(review.criadoEm));
    time.dateTime = review.criadoEm;

    meta.append(
      createElement("p", "review-card-name", nome),
      createElement("p", "review-card-service", review.servicoNome || ""),
      time
    );
    person.append(avatar, meta);
    card.append(quote, stars, text, more, person);

    if (isClone) {
      more.tabIndex = -1;
    }

    return card;
  }

  function buildGroup(isClone) {
    const group = createElement("div", "reviews-track-group");

    if (isClone) {
      // Cópia apenas visual para fechar o ciclo: fora da árvore de acessibilidade e do foco.
      group.setAttribute("aria-hidden", "true");
      group.dataset.clone = "true";
    }

    reviews.forEach((review) => group.appendChild(buildCard(review, isClone)));
    return group;
  }

  // "Ler mais" só aparece quando o texto realmente ultrapassa o limite de linhas.
  function updateMoreButtons() {
    track.querySelectorAll(".review-card").forEach((card) => {
      const text = card.querySelector(".review-card-text");
      const more = card.querySelector(".review-card-more");

      if (card.classList.contains("is-expanded")) {
        more.hidden = false;
        return;
      }

      more.hidden = text.scrollHeight <= text.clientHeight + 1;
    });
  }

  track.addEventListener("click", (event) => {
    const more = event.target.closest(".review-card-more");

    if (!more) {
      return;
    }

    const card = more.closest(".review-card");
    const expand = !card.classList.contains("is-expanded");

    // Atualiza o card original e a cópia visual juntos.
    track.querySelectorAll(`.review-card[data-review-id="${CSS.escape(card.dataset.reviewId)}"]`).forEach((item) => {
      item.classList.toggle("is-expanded", expand);
      const button = item.querySelector(".review-card-more");
      button.textContent = expand ? "Ler menos" : "Ler mais";
      button.setAttribute("aria-expanded", String(expand));
    });

    scheduleLayout();
  });

  function showState(state) {
    loadingEl.hidden = state !== "loading";
    errorEl.hidden = state !== "error";
    emptyEl.hidden = state !== "empty";
    viewport.hidden = state !== "list";
    noteEl.hidden = state !== "list";

    if (state !== "list") {
      toggleButton.hidden = true;
    }
  }

  function render() {
    if (reviews.length === 0) {
      track.replaceChildren();
      showState("empty");
      return;
    }

    showState("list");
    countEl.textContent = reviews.length === 1 ? "1 avaliação publicada" : `${reviews.length} avaliações publicadas`;
    track.replaceChildren(buildGroup(false));
    scheduleLayout();
  }

  function setReviews(list) {
    const nextSignature = list.map((review) => review.id).join(",");

    if (nextSignature === signature && reviews.length === list.length) {
      return;
    }

    reviews = list;
    signature = nextSignature;
    render();
  }

  function addReview(review) {
    const list = [review, ...reviews.filter((item) => item.id !== review.id)];
    setReviews(list);
    position = 0;
    viewport.scrollLeft = 0;
  }

  // ---------- Carrossel ----------

  let loopWidth = 0;
  let isLooping = false;
  let position = 0;
  let lastFrame = 0;
  let layoutFrame = 0;
  let touchTimer = 0;
  const pauseReasons = new Set();

  function applyToggleState() {
    const userPaused = pauseReasons.has("user");
    toggleButton.setAttribute("aria-pressed", String(userPaused));
    toggleButton.querySelector("span").textContent = userPaused ? "Retomar" : "Pausar";
    toggleButton.querySelector("i").className = `fa-solid ${userPaused ? "fa-play" : "fa-pause"}`;
  }

  function layoutCarousel() {
    layoutFrame = 0;
    track.querySelector('[data-clone="true"]')?.remove();

    const group = track.firstElementChild;

    if (!group || viewport.hidden) {
      isLooping = false;
      return;
    }

    updateMoreButtons();

    const overflowing = group.scrollWidth > viewport.clientWidth + 1;
    viewport.classList.toggle("is-static", !overflowing);

    // Poucas avaliações cabem na área: ficam paradas, sem repetições.
    isLooping = overflowing && !reduceMotionQuery.matches;
    toggleButton.hidden = !isLooping;

    if (isLooping) {
      const clone = buildGroup(true);
      track.appendChild(clone);
      track.querySelectorAll('[data-clone="true"] .review-card').forEach((card) => {
        const original = group.querySelector(`.review-card[data-review-id="${CSS.escape(card.dataset.reviewId)}"]`);

        if (original?.classList.contains("is-expanded")) {
          card.classList.add("is-expanded");
          card.querySelector(".review-card-more").textContent = "Ler menos";
        }
      });
      updateMoreButtons();
      loopWidth = clone.offsetLeft - group.offsetLeft;
      position = loopWidth > 0 ? position % loopWidth : 0;
    } else {
      loopWidth = 0;
      position = Math.min(position, Math.max(0, group.scrollWidth - viewport.clientWidth));
    }

    viewport.scrollLeft = position;
  }

  function scheduleLayout() {
    if (!layoutFrame) {
      layoutFrame = window.requestAnimationFrame(layoutCarousel);
    }
  }

  function tick(timestamp) {
    const delta = lastFrame ? Math.min(timestamp - lastFrame, 64) : 0;
    lastFrame = timestamp;

    if (isLooping && loopWidth > 0 && pauseReasons.size === 0 && !document.hidden) {
      position += (SCROLL_SPEED_PX_S * delta) / 1000;

      if (position >= loopWidth) {
        position -= loopWidth;
      }

      viewport.scrollLeft = position;
    }

    window.requestAnimationFrame(tick);
  }

  // Rolagem manual (toque, trackpad, teclado): o avanço automático continua de onde a pessoa parou.
  viewport.addEventListener("scroll", () => {
    if (Math.abs(viewport.scrollLeft - position) <= 2) {
      return;
    }

    position = viewport.scrollLeft;

    if (isLooping && loopWidth > 0 && position >= loopWidth) {
      position -= loopWidth;
      viewport.scrollLeft = position;
    }
  }, { passive: true });

  viewport.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      pauseReasons.add("hover");
    }
  });

  viewport.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      pauseReasons.delete("hover");
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") {
      window.clearTimeout(touchTimer);
      pauseReasons.add("touch");
    }
  });

  const releaseTouch = () => {
    window.clearTimeout(touchTimer);
    touchTimer = window.setTimeout(() => pauseReasons.delete("touch"), TOUCH_RESUME_DELAY_MS);
  };

  viewport.addEventListener("pointerup", releaseTouch);
  viewport.addEventListener("pointercancel", releaseTouch);
  viewport.addEventListener("touchend", releaseTouch, { passive: true });

  viewport.addEventListener("focusin", () => pauseReasons.add("focus"));
  viewport.addEventListener("focusout", (event) => {
    if (!viewport.contains(event.relatedTarget)) {
      pauseReasons.delete("focus");
    }
  });

  toggleButton.addEventListener("click", () => {
    if (pauseReasons.has("user")) {
      pauseReasons.delete("user");
    } else {
      pauseReasons.add("user");
    }

    applyToggleState();
  });

  reduceMotionQuery.addEventListener?.("change", scheduleLayout);

  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleLayout).observe(viewport);
  } else {
    window.addEventListener("resize", scheduleLayout);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleLayout).catch(() => {});
  }

  // ---------- Carregamento e atualização periódica ----------

  let hasLoaded = false;
  let isFetching = false;

  async function loadReviews() {
    if (isFetching) {
      return;
    }

    isFetching = true;

    if (!hasLoaded) {
      showState("loading");
    }

    let result = null;

    try {
      result = await request(ENDPOINT, { headers: { Accept: "application/json" } });
      const { response, body } = result;

      if (!response.ok || !Array.isArray(body?.avaliacoes)) {
        throw new Error(`HTTP ${response.status}`);
      }

      hasLoaded = true;
      setReviews(body.avaliacoes);

      if (body.avaliacoes.length === 0) {
        showState("empty");
      }
    } catch (error) {
      // Numa atualização periódica que falhe, mantém os cards já exibidos.
      if (!hasLoaded) {
        const message = result ? describeFailure(result) : describeFailure(null, error);
        loadErrorText.textContent = message || "Não foi possível carregar as avaliações agora.";
        showState("error");
      }
    } finally {
      isFetching = false;
    }
  }

  retryButton.addEventListener("click", loadReviews);

  window.setInterval(() => {
    if (!document.hidden) {
      loadReviews();
    }
  }, POLL_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && hasLoaded) {
      loadReviews();
    }
  });

  applyToggleState();
  updateCounter();
  loadReviews();
  window.requestAnimationFrame(tick);
})();
