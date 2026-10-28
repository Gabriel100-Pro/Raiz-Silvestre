// Contato: todo link de WhatsApp do site sai daqui, com a mensagem já codificada.
const WHATSAPP_URL = "https://wa.me/5511942842007";
const buildWhatsappLink = (message) =>
  message ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;

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
      modalCta.href = buildWhatsappLink(message);
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

    window.open(buildWhatsappLink(textoWhatsapp), "_blank", "noopener,noreferrer");

    if (orcamentoSucesso) {
      orcamentoSucesso.hidden = false;
    }

    orcamentoForm.reset();
  });
}

const siteHeader = document.getElementById("siteHeader");
const heroSection = document.getElementById("hero");
const heroVideo = document.getElementById("heroVideo");
const heroTitle = document.getElementById("heroTitle");
const heroMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Barra do cabeçalho: fica mais opaca e um pouco mais baixa após rolar.
if (siteHeader) {
  let headerFrame = 0;

  const updateHeader = () => {
    headerFrame = 0;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!headerFrame) {
        headerFrame = window.requestAnimationFrame(updateHeader);
      }
    },
    { passive: true }
  );
  updateHeader();
}

// Vídeo de fundo: só toca com a hero visível e sem pedido de movimento reduzido.
if (heroVideo && heroSection) {
  let heroVisible = true;

  const syncVideo = () => {
    if (heroVisible && !heroMotionQuery.matches) {
      const playing = heroVideo.play();

      if (playing && typeof playing.catch === "function") {
        playing.catch(() => {});
      }
    } else {
      heroVideo.pause();
    }
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      // Também congela as animações CSS da hero enquanto ela está fora da tela.
      heroSection.classList.toggle("is-paused", !heroVisible);
      syncVideo();
    }).observe(heroSection);
  }

  heroMotionQuery.addEventListener?.("change", syncVideo);
  syncVideo();
}

// Parallax: cada camada da hero acompanha o mouse numa intensidade própria
// (data-depth), o que dá a impressão de a raiz estar suspensa no ambiente.
if (heroSection) {
  const depthLayers = Array.from(heroSection.querySelectorAll("[data-depth]")).map((element) => ({
    element,
    depth: Number(element.dataset.depth) || 0
  }));
  const parallaxQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let parallaxFrame = 0;

  const applyParallax = () => {
    current.x += (target.x - current.x) * 0.055;
    current.y += (target.y - current.y) * 0.055;

    const settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;

    if (settled) {
      current.x = target.x;
      current.y = target.y;
    }

    depthLayers.forEach(({ element, depth }) => {
      const x = (current.x * depth * 22).toFixed(2);
      const y = (current.y * depth * 12).toFixed(2);
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    parallaxFrame = settled ? 0 : window.requestAnimationFrame(applyParallax);
  };

  const requestParallax = () => {
    if (!parallaxFrame) {
      parallaxFrame = window.requestAnimationFrame(applyParallax);
    }
  };

  const handleParallaxMove = (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const rect = heroSection.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    requestParallax();
  };

  const handleParallaxLeave = () => {
    target.x = 0;
    target.y = 0;
    requestParallax();
  };

  // Liga os ouvintes só quando há mouse e movimento permitido.
  const syncParallax = () => {
    const enabled = parallaxQuery.matches && !heroMotionQuery.matches;

    heroSection.removeEventListener("pointermove", handleParallaxMove);
    heroSection.removeEventListener("pointerleave", handleParallaxLeave);

    if (enabled) {
      heroSection.addEventListener("pointermove", handleParallaxMove);
      heroSection.addEventListener("pointerleave", handleParallaxLeave);
    } else {
      handleParallaxLeave();
    }
  };

  parallaxQuery.addEventListener?.("change", syncParallax);
  heroMotionQuery.addEventListener?.("change", syncParallax);
  syncParallax();
}

// Título: "Raiz Silvestre" se transforma em "Seu jardim, uma nova forma de
// viver." com o mouse por cima; no toque, cada toque alterna as frases.
// A transição em si é CSS (.is-alt); aqui só se liga e desliga a classe.
if (heroTitle) {
  const setAlt = (isAlt) => heroTitle.classList.toggle("is-alt", isAlt);

  heroTitle.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      setAlt(true);
    }
  });

  heroTitle.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      setAlt(false);
    }
  });

  heroTitle.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") {
      setAlt(!heroTitle.classList.contains("is-alt"));
    }
  });
}

// Botões dos pacotes: cada um abre o WhatsApp com a mensagem do próprio plano.
document.querySelectorAll("[data-whatsapp-message]").forEach((link) => {
  link.href = buildWhatsappLink(link.dataset.whatsappMessage);
});

// Revela um bloco ao entrar na tela (adiciona .is-visible uma única vez).
const revealOnView = (element, onReveal, threshold = 0.25) => {
  const reveal = () => {
    element.classList.add("is-visible");
    onReveal?.();
  };

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      reveal();
    }
  }, { threshold }).observe(element);
};

// Indicadores: os números contam de zero até o valor de data-count.
// Com movimento reduzido, o valor final aparece direto.
const statsSection = document.getElementById("numeros");

if (statsSection) {
  const statValues = Array.from(statsSection.querySelectorAll(".stat-value[data-count]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const formatStat = (element, value) =>
    `${element.dataset.prefix || ""}${value}${element.dataset.suffix || ""}`;

  const countUp = (element, delay) => {
    const target = Number(element.dataset.count) || 0;
    const duration = 1600;
    let start = 0;

    const step = (now) => {
      start = start || now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatStat(element, Math.round(target * eased));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.setTimeout(() => window.requestAnimationFrame(step), delay);
  };

  statsSection.classList.add("stats-ready");

  if (!reduceMotion) {
    statValues.forEach((element) => {
      element.textContent = formatStat(element, 0);
    });
  }

  revealOnView(statsSection, () => {
    if (!reduceMotion) {
      statValues.forEach((element, index) => countUp(element, 250 + index * 140));
    }
  }, 0.2);
}

const pacotesSection = document.getElementById("pacotes");

if (pacotesSection) {
  pacotesSection.classList.add("pacotes-ready");
  revealOnView(pacotesSection, null, 0.12);
}

if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 900,
    easing: "ease-out-cubic",
    once: true,
    offset: 80
  });
}