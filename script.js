const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  const setMenuState = (isOpen) => {
    menu.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  };

  let lastTouchTime = 0;

  const toggleMenu = () => {
    const isOpen = menu.classList.contains("open");
    setMenuState(!isOpen);
  };

  menuToggle.addEventListener("touchstart", (event) => {
    event.preventDefault();
    lastTouchTime = Date.now();
    toggleMenu();
  }, { passive: false });

  menuToggle.addEventListener("click", (event) => {
    event.preventDefault();

    if (Date.now() - lastTouchTime < 450) {
      return;
    }

    toggleMenu();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenuState(false);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (!menu.classList.contains("open")) {
      return;
    }

    if (menu.contains(target) || menuToggle.contains(target)) {
      return;
    }

    setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });
}

const galleryVideoPlayer = document.getElementById("galleryVideoPlayer");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const videoSourceList = document.querySelectorAll("#videoSourceList li[data-video-src]");
const servicesSection = document.getElementById("servicos");

if (servicesSection) {
  servicesSection.classList.add("services-stagger-ready");

  let servicesRevealed = false;

  const revealServices = () => {
    if (servicesRevealed) {
      return;
    }

    servicesRevealed = true;
    servicesSection.classList.add("services-animate");
    window.setTimeout(() => servicesSection.classList.add("services-revealed"), 1300);
  };

  // Failsafe for browsers/devices where IntersectionObserver can be inconsistent.
  const servicesFallbackTimeout = window.setTimeout(revealServices, 1800);

  if ("IntersectionObserver" in window) {
    const servicesObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          if (entry.intersectionRatio >= 0.28) {
            revealServices();
            window.clearTimeout(servicesFallbackTimeout);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: [0.2, 0.28, 0.36]
      }
    );

    servicesObserver.observe(servicesSection);
  } else {
    revealServices();
    window.clearTimeout(servicesFallbackTimeout);
  }
}

const serviceModal = document.getElementById("serviceModal");

if (serviceModal && typeof serviceModal.showModal === "function") {
  const root = document.documentElement;
  const modalTitle = document.getElementById("serviceModalTitle");
  const modalContent = document.getElementById("serviceModalContent");
  const modalImage = document.getElementById("serviceModalImage");
  const modalCta = document.getElementById("serviceModalCta");
  const modalClose = serviceModal.querySelector(".service-modal-close");
  const whatsappBase = modalCta ? modalCta.href.split("?")[0] : "";
  let lastTrigger = null;

  const openServiceModal = (trigger) => {
    const card = document.getElementById(trigger.dataset.serviceOpen);
    const details = card?.querySelector(".service-details");

    if (!card || !details) {
      return;
    }

    const title = details.querySelector(".service-details-title")?.textContent.trim() || "";
    const cardImage = card.querySelector(".service-card-media img");
    const content = details.cloneNode(true);

    content.hidden = false;
    content.querySelector(".service-details-title")?.remove();
    modalTitle.textContent = title;
    modalContent.replaceChildren(...content.childNodes);

    if (cardImage) {
      modalImage.src = cardImage.currentSrc || cardImage.src;
      modalImage.alt = cardImage.alt;
    }

    if (modalCta) {
      const message = `Olá! Gostaria de solicitar um orçamento de ${title}.`;
      modalCta.href = `${whatsappBase}?text=${encodeURIComponent(message)}`;
    }

    lastTrigger = trigger;

    // Compensa a barra de rolagem para o fundo não "pular" ao travar o scroll.
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
    root.classList.add("modal-open");

    serviceModal.showModal();
    serviceModal.querySelector(".service-modal-body").scrollTop = 0;
    serviceModal.querySelector(".service-modal-panel").scrollTop = 0;
    modalTitle.focus();
  };

  document.querySelectorAll("[data-service-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => openServiceModal(trigger));
  });

  modalClose?.addEventListener("click", () => serviceModal.close());

  // Clique fora do painel (no fundo escurecido) fecha o modal.
  serviceModal.addEventListener("click", (event) => {
    if (event.target === serviceModal) {
      serviceModal.close();
    }
  });

  // O Escape é tratado nativamente pelo <dialog>, que dispara "close".
  serviceModal.addEventListener("close", () => {
    root.classList.remove("modal-open");
    document.body.style.paddingRight = "";

    if (lastTrigger) {
      lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    }
  });
}

const benefitsMarquee = document.getElementById("beneficios-faixa");
const benefitsMarqueeTrack = document.getElementById("benefitsMarqueeTrack");

if (benefitsMarquee && benefitsMarqueeTrack) {
  const benefitCards = Array.from(benefitsMarqueeTrack.querySelectorAll(".benefit-card"));
  let benefitsPaused = false;

  const setBenefitsPaused = (paused) => {
    benefitsPaused = paused;
    benefitsMarquee.classList.toggle("is-paused", paused);
    benefitCards.forEach((card) => {
      card.setAttribute("aria-pressed", String(paused));
    });
  };

  const toggleBenefitsPaused = () => {
    setBenefitsPaused(!benefitsPaused);
  };

  benefitsMarqueeTrack.addEventListener("click", (event) => {
    const card = event.target.closest(".benefit-card");

    if (!card || !benefitsMarqueeTrack.contains(card)) {
      return;
    }

    toggleBenefitsPaused();
  });

  benefitsMarqueeTrack.addEventListener("keydown", (event) => {
    const card = event.target.closest(".benefit-card");

    if (!card || !benefitsMarqueeTrack.contains(card)) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleBenefitsPaused();
  });

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceMotionQuery.matches) {
    setBenefitsPaused(true);
  }

  reduceMotionQuery.addEventListener?.("change", (event) => {
    if (event.matches) {
      setBenefitsPaused(true);
    }
  });
}

if (galleryVideoPlayer && carouselPrev && carouselNext && videoSourceList.length > 0) {
  const videoSources = Array.from(videoSourceList).map((item) => item.dataset.videoSrc).filter(Boolean);
  let currentIndex = 0;

  const primeInitialVideoFrame = () => {
    if (galleryVideoPlayer.dataset.framePrimed === "true") {
      return;
    }

    const setFirstFrame = () => {
      if (galleryVideoPlayer.dataset.framePrimed === "true") {
        return;
      }

      try {
        galleryVideoPlayer.currentTime = 0.01;
        galleryVideoPlayer.dataset.framePrimed = "true";
      } catch (_error) {
        // Ignore iOS timing edge-cases; metadata listener will retry.
      }
    };

    if (galleryVideoPlayer.readyState >= 1) {
      setFirstFrame();
    }

    galleryVideoPlayer.addEventListener("loadedmetadata", setFirstFrame, { once: true });
    galleryVideoPlayer.addEventListener("loadeddata", setFirstFrame, { once: true });
  };

  // Ensure the player always starts with the first source from the configured list.
  if (videoSources[0]) {
    galleryVideoPlayer.src = videoSources[0];
    galleryVideoPlayer.load();
    primeInitialVideoFrame();
  }

  const setCarouselVideo = (index) => {
    currentIndex = (index + videoSources.length) % videoSources.length;
    const currentSource = videoSources[currentIndex];

    galleryVideoPlayer.pause();
    galleryVideoPlayer.src = currentSource;
    galleryVideoPlayer.dataset.framePrimed = "false";
    galleryVideoPlayer.load();
    primeInitialVideoFrame();
  };

  galleryVideoPlayer.addEventListener("error", () => {
    if (videoSources.length > 1) {
      setCarouselVideo(currentIndex + 1);
    }
  });

  carouselPrev.addEventListener("click", () => {
    setCarouselVideo(currentIndex - 1);
  });

  carouselNext.addEventListener("click", () => {
    setCarouselVideo(currentIndex + 1);
  });
}

const orcamentoForm = document.querySelector(".orcamento-form");

if (orcamentoForm) {
  const orcamentoSucesso = document.getElementById("orcamentoSucesso");

  orcamentoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = (orcamentoForm.querySelector('input[name="nome"]')?.value || "").trim();
    const whatsapp = (orcamentoForm.querySelector('input[name="whatsapp"]')?.value || "").trim();
    const servicoSelect = orcamentoForm.querySelector('select[name="servico"]');
    const mensagem = (orcamentoForm.querySelector('textarea[name="mensagem"]')?.value || "").trim();

    const servico = servicoSelect && servicoSelect.selectedIndex >= 0
      ? servicoSelect.options[servicoSelect.selectedIndex].text
      : "Não informado";

    const textoWhatsapp = [
      "Olá! Gostaria de solicitar um orçamento.",
      "",
      `Nome: ${nome}`,
      `WhatsApp: ${whatsapp}`,
      `Serviço desejado: ${servico}`,
      `Mensagem: ${mensagem}`
    ].join("\n");

    const urlWhatsapp = `https://wa.me/5511942842007?text=${encodeURIComponent(textoWhatsapp)}`;
    window.open(urlWhatsapp, "_blank", "noopener,noreferrer");

    if (orcamentoSucesso) {
      orcamentoSucesso.hidden = false;
    }

    orcamentoForm.reset();
  });
}

const gardenLayer = document.getElementById("gardenLayer");
const gardenTraveler = document.getElementById("gardenTraveler");
const gardenHeroSlot = document.querySelector('[data-garden-slot="hero"]');
const gardenSobreSlot = document.querySelector('[data-garden-slot="sobre"]');
const gardenMain = document.querySelector("main");

if (gardenLayer && gardenTraveler && gardenHeroSlot && gardenSobreSlot && gardenMain) {
  const root = document.documentElement;
  const gardenTilt = gardenTraveler.querySelector(".garden-tilt");
  const gardenImage = gardenTraveler.querySelector("img");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const maxTiltX = 6;
  const maxTiltY = 9;
  let metrics = null;
  let lastProgress = -1;
  let scrollFrame = 0;
  let tiltFrame = 0;
  const tiltTarget = { x: 0, y: 0 };
  const tiltCurrent = { x: 0, y: 0 };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (from, to, t) => from + (to - from) * t;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const isAnimated = () => root.classList.contains("garden-animated");

  const render = () => {
    scrollFrame = 0;

    if (!metrics) {
      return;
    }

    const { from, to, start, end } = metrics;
    const progress = clamp((window.scrollY - start) / (end - start), 0, 1);

    if (progress === lastProgress) {
      return;
    }

    lastProgress = progress;

    // X e escala aceleram no meio do percurso; Y usa smoothstep para que, nas
    // pontas, o jardim acompanhe a página sem trancos ao entrar/sair do trajeto.
    const eased = easeInOutCubic(progress);
    const x = lerp(from.x, to.x, eased);
    const y = lerp(from.y, to.y, smoothstep(progress));
    const scale = lerp(1, to.width / from.width, eased);

    gardenTraveler.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    gardenTraveler.classList.toggle("is-resting", progress < 0.001 || progress > 0.999);
  };

  const requestRender = () => {
    if (!scrollFrame) {
      scrollFrame = window.requestAnimationFrame(render);
    }
  };

  const measure = () => {
    if (!isAnimated()) {
      metrics = null;
      return;
    }

    const scrollY = window.scrollY;
    const viewportHeight = root.clientHeight;
    const mainRect = gardenMain.getBoundingClientRect();
    const heroRect = gardenHeroSlot.getBoundingClientRect();
    const sobreRect = gardenSobreSlot.getBoundingClientRect();

    if (!heroRect.width || !sobreRect.width) {
      return;
    }

    const heroCenter = heroRect.top + scrollY + heroRect.height / 2;
    const sobreCenter = sobreRect.top + scrollY + sobreRect.height / 2;
    const start = Math.max(0, heroCenter - viewportHeight / 2);
    const end = Math.max(start + 1, sobreCenter - viewportHeight / 2);

    metrics = {
      from: { x: heroRect.left - mainRect.left, y: heroRect.top - mainRect.top, width: heroRect.width },
      to: { x: sobreRect.left - mainRect.left, y: sobreRect.top - mainRect.top, width: sobreRect.width },
      start,
      end
    };

    // A camada vai até o fim da segunda seção, com folga para flutuação e sombra.
    gardenLayer.style.height = `${sobreRect.bottom - mainRect.top + sobreRect.height * 0.25}px`;
    gardenTraveler.style.width = `${heroRect.width}px`;
    root.style.setProperty("--garden-entry-x", `${Math.ceil(window.innerWidth - heroRect.left + 24)}px`);

    lastProgress = -1;
    render();
    gardenTraveler.classList.add("is-ready");
  };

  // A entrada lateral só acontece se a página abrir no topo.
  if (window.scrollY > 40) {
    root.classList.add("garden-skip-entry");
  }

  const tiltEnabled = () => isAnimated() && finePointerQuery.matches && !reduceMotionQuery.matches;

  const applyTilt = () => {
    tiltCurrent.x += (tiltTarget.x - tiltCurrent.x) * 0.08;
    tiltCurrent.y += (tiltTarget.y - tiltCurrent.y) * 0.08;

    const settled =
      Math.abs(tiltTarget.x - tiltCurrent.x) < 0.01 && Math.abs(tiltTarget.y - tiltCurrent.y) < 0.01;

    if (settled) {
      tiltCurrent.x = tiltTarget.x;
      tiltCurrent.y = tiltTarget.y;
    }

    gardenTilt.style.transform =
      tiltCurrent.x === 0 && tiltCurrent.y === 0
        ? ""
        : `rotateX(${tiltCurrent.x.toFixed(3)}deg) rotateY(${tiltCurrent.y.toFixed(3)}deg)`;

    tiltFrame = settled ? 0 : window.requestAnimationFrame(applyTilt);
  };

  const requestTilt = () => {
    if (!tiltFrame) {
      tiltFrame = window.requestAnimationFrame(applyTilt);
    }
  };

  const resetTilt = () => {
    tiltTarget.x = 0;
    tiltTarget.y = 0;
    requestTilt();
  };

  if (gardenTilt) {
    gardenTraveler.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !tiltEnabled()) {
        return;
      }

      const rect = gardenTraveler.getBoundingClientRect();
      const offsetX = clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
      const offsetY = clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;

      tiltTarget.x = -offsetY * 2 * maxTiltX;
      tiltTarget.y = offsetX * 2 * maxTiltY;
      requestTilt();
    });

    gardenTraveler.addEventListener("pointerleave", resetTilt);
  }

  const handleMotionChange = () => {
    root.classList.toggle("garden-animated", !reduceMotionQuery.matches);
    root.classList.toggle("garden-static-mode", reduceMotionQuery.matches);
    resetTilt();
    measure();
  };

  reduceMotionQuery.addEventListener?.("change", handleMotionChange);
  finePointerQuery.addEventListener?.("change", resetTilt);

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  const startEntry = () => {
    if (gardenTraveler.classList.contains("is-loaded")) {
      return;
    }

    // Mantém a sequência (textos primeiro, jardim depois) descontando o tempo
    // que a imagem levou para carregar.
    const entryDelay = Math.round(Math.max(0, 1250 - performance.now()));
    root.style.setProperty("--garden-entry-delay", `${entryDelay}ms`);
    root.style.setProperty("--garden-float-delay", `${entryDelay + 1700}ms`);
    gardenTraveler.classList.add("is-loaded");
    measure();
  };

  if (gardenImage) {
    const imageReady = gardenImage.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          gardenImage.addEventListener("load", resolve, { once: true });
          gardenImage.addEventListener("error", resolve, { once: true });
        });

    imageReady
      .then(() => (gardenImage.decode ? gardenImage.decode() : undefined))
      .catch(() => {})
      .then(startEntry);
  } else {
    startEntry();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }

  if ("ResizeObserver" in window) {
    const gardenResizeObserver = new ResizeObserver(() => measure());
    gardenResizeObserver.observe(gardenHeroSlot);
    gardenResizeObserver.observe(gardenSobreSlot);
    gardenResizeObserver.observe(gardenMain);
  }

  measure();
}

if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 900,
    easing: "ease-out-cubic",
    once: true,
    offset: 80
  });
}