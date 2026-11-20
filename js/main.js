/* ==========================================================================
   PXUL.DEV — PORTAFOLIO PROFESIONAL DE ALESSANDRO RODRÍGUEZ
   Lógica Frontend: Partículas optimizadas, Typewriter, Navegación accesible,
   ScrollSpy con IntersectionObserver, Terminal interactiva, Filtros, Modales,
   Validación de formulario y soporte completo de prefers-reduced-motion.
   ========================================================================== */

const EMAIL_ADDRESS = 'arodriguezr1020@gmail.com';
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initTypewriter();
  initNavbar();
  initScrollProgress();
  initScrollSpy();
  initScrollReveal();
  initPointerEffects();
  initTerminal();
  initFilters();
  initServiceInquiry();
  initModals();
  initCopyEmail();
  initContactForm();
});

/* ==========================================================================
   1. CANVAS DE PARTÍCULAS OPTIMIZADO (DPR, VISIBILITY PAUSE, REDUCED MOTION)
   ========================================================================== */
function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animationId = null;
  let resizeTimer = null;

  const maxDistance = 128;
  const maxDistSq = maxDistance * maxDistance;
  const mouse = { x: null, y: null, radiusSq: 140 * 140 };

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 1.5 + 0.75;
      this.alpha = Math.random() * 0.36 + 0.16;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0 && distSq < mouse.radiusSq) {
          const dist = Math.sqrt(distSq);
          const force = (140 - dist) / 140;
          this.x -= (dx / dist) * force * 0.9;
          this.y -= (dy / dist) * force * 0.9;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
      ctx.fill();
    }
  }

  function setupCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = width < 768 ? 28 : width < 1200 ? 48 : 64;
    particles = Array.from({ length: targetCount }, () => new Particle());
  }

  function renderFrame(shouldMove) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      if (shouldMove) p1.update();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const opacity = (1 - Math.sqrt(distSq) / maxDistance) * 0.14;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      p1.draw();
    }
  }

  function stopLoop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function startLoop() {
    stopLoop();
    if (reducedMotionQuery.matches) {
      renderFrame(false);
      return;
    }
    if (document.hidden) return;

    const tick = () => {
      renderFrame(true);
      animationId = requestAnimationFrame(tick);
    };
    animationId = requestAnimationFrame(tick);
  }

  setupCanvas();
  startLoop();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupCanvas();
      startLoop();
    }, 180);
  }, { passive: true });

  if (finePointerQuery.matches) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', startLoop);
  }
}

/* ==========================================================================
   2. EFECTO TYPEWRITER MULTI-ROL (CON FALLBACK PARA REDUCED MOTION)
   ========================================================================== */
function initTypewriter() {
  const element = document.getElementById('typing-text');
  if (!element) return;

  const roles = [
    'Estudiante de Ingeniería de Sistemas e Inteligencia Artificial',
    'Desarrollador Web Full Stack',
    'Creador de Chatbots & Automatizaciones',
    'Desarrollador Móvil Android',
    'Creador de Catálogos Digitales',
    'Desarrollador de Paneles de Gestión',
    'Integración de APIs & Servicios',
    'Bases de Datos & Backend',
    'Planificadores & Herramientas de Cálculo',
    'Aplicaciones Web Progresivas (PWA)',
    'Publicación Web & Distribución de APKs'
  ];

  if (reducedMotionQuery.matches) {
    element.textContent = roles[0];
    return;
  }

  let roleIndex = 0;
  let charIndex = roles[0].length;
  let isDeleting = true;
  let timerId = null;

  function step() {
    if (reducedMotionQuery.matches) {
      element.textContent = roles[0];
      return;
    }

    const currentRole = roles[roleIndex];
    let delay = 62;

    if (isDeleting) {
      charIndex--;
      delay = 28;
    } else {
      charIndex++;
      delay = 62;
    }

    element.textContent = currentRole.slice(0, charIndex);

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      delay = 1900;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 360;
    }

    timerId = setTimeout(step, delay);
  }

  timerId = setTimeout(step, 1800);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && timerId) {
      clearTimeout(timerId);
      timerId = null;
    } else if (!document.hidden && !timerId && !reducedMotionQuery.matches) {
      timerId = setTimeout(step, 600);
    }
  });
}

/* ==========================================================================
   3. NAVEGACIÓN RESPONSIVA Y MENÚ MÓVIL ACCESIBLE
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.getElementById('nav-menu');
  const backdrop = document.getElementById('nav-backdrop');
  if (!navbar) return;

  let isMenuOpen = false;

  const setMenuOpen = (open) => {
    isMenuOpen = open;
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
      toggleBtn.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    }
    if (navLinks) navLinks.classList.toggle('open', open);
    if (backdrop) backdrop.classList.toggle('visible', open);
    document.body.classList.toggle('nav-open', open);
  };

  let scrollTicking = false;
  const updateScrolled = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateScrolled);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrolled();

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => setMenuOpen(!isMenuOpen));

    navLinks.querySelectorAll('a, button').forEach((item) => {
      item.addEventListener('click', () => {
        if (isMenuOpen) setMenuOpen(false);
      });
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      if (isMenuOpen) setMenuOpen(false);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      setMenuOpen(false);
      toggleBtn?.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820 && isMenuOpen) {
      setMenuOpen(false);
    }
  }, { passive: true });
}

/* ==========================================================================
   4. BARRA DE PROGRESO DE LECTURA (COMPOSITOR-ONLY SCALEX)
   ========================================================================== */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  let ticking = false;

  const updateProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollHeight > 0 ? Math.min(Math.max(window.scrollY / scrollHeight, 0), 1) : 0;
    bar.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  updateProgress();
}

/* ==========================================================================
   5. SCROLLSPY CON INTERSECTION OBSERVER (SIN LAYOUT THRASHING)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link'));
  if (!sections.length || !navLinks.length) return;

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isMatch);
      if (isMatch) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }, {
    rootMargin: '-32% 0px -58% 0px',
    threshold: 0
  });

  sections.forEach((section) => observer.observe(section));
}

/* ==========================================================================
   6. REVELADO SUAVE AL DESPLAZARSE (UNOBSERVE TRAS APARECER)
   ========================================================================== */
function initScrollReveal() {
  const elements = document.querySelectorAll('.fade-in-section');
  if (!elements.length) return;

  if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -32px 0px'
  });

  elements.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   7. CURSOR INTERACTIVO SUTIL + SPOTLIGHT EN TARJETAS (SOLO DESKTOP FINE)
   ========================================================================== */
function initPointerEffects() {
  if (!finePointerQuery.matches || reducedMotionQuery.matches) return;

  const ring = document.getElementById('cursor-ring');
  const dot = document.getElementById('cursor-dot');
  const root = document.documentElement;

  if (ring && dot) {
    root.classList.add('pointer-ready');

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId = null;

    const animateRing = () => {
      ringX += (targetX - ringX) * 0.22;
      ringY += (targetY - ringY) * 0.22;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      if (Math.abs(targetX - ringX) > 0.2 || Math.abs(targetY - ringY) > 0.2) {
        rafId = requestAnimationFrame(animateRing);
      } else {
        ringX = targetX;
        ringY = targetY;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        rafId = null;
      }
    };

    const interactiveSelector = 'a, button, input, textarea, [role="tab"]';

    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      if (!root.classList.contains('pointer-active')) {
        ringX = targetX;
        ringY = targetY;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        root.classList.add('pointer-active');
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(animateRing);
      }

      const isInteractive = Boolean(e.target?.closest?.(interactiveSelector));
      root.classList.toggle('pointer-hover', isInteractive);
    }, { passive: true });

    const hidePointer = () => {
      root.classList.remove('pointer-active', 'pointer-hover');
    };

    root.addEventListener('pointerleave', hidePointer);
    window.addEventListener('blur', hidePointer);
  }

  // Spotlight sutil por tarjeta
  document.querySelectorAll('.spotlight-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    }, { passive: true });
  });
}

/* ==========================================================================
   8. TERMINAL INTERACTIVA (PESTAÑAS JSON / CLI + COPIAR JSON)
   ========================================================================== */
function initTerminal() {
  const tabs = document.querySelectorAll('[data-terminal-tab]');
  const panelJson = document.getElementById('panel-json');
  const panelCli = document.getElementById('panel-cli');
  const copyJsonBtn = document.getElementById('copy-json-btn');
  const jsonCode = document.getElementById('developer-json-code');
  const cliForm = document.getElementById('cli-form');
  const cliInput = document.getElementById('cli-input');
  const cliOutput = document.getElementById('cli-output');
  const quickBtns = document.querySelectorAll('.cli-cmd-btn');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-terminal-tab');
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });

      if (panelJson && panelCli) {
        const showJson = target === 'json';
        panelJson.hidden = !showJson;
        panelJson.classList.toggle('active', showJson);
        panelCli.hidden = showJson;
        panelCli.classList.toggle('active', !showJson);

        if (!showJson) {
          cliInput?.focus();
        }
      }
    });
  });

  if (copyJsonBtn && jsonCode) {
    copyJsonBtn.addEventListener('click', () => {
      const text = jsonCode.textContent || '';
      copyToClipboard(text, 'Perfil JSON copiado al portapapeles');
    });
  }

  if (!cliForm || !cliInput || !cliOutput) return;

  const appendCliLine = (text, className = 'cli-line') => {
    const p = document.createElement('p');
    p.className = className;
    p.textContent = text;
    cliOutput.appendChild(p);
    cliOutput.scrollTop = cliOutput.scrollHeight;
  };

  const runCommand = (rawCmd) => {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;

    appendCliLine(`pxul@dev:~$ ${rawCmd.trim()}`, 'cli-line cli-command-echo');

    switch (cmd) {
      case 'help':
        appendCliLine('Comandos disponibles: whoami, stack, proyectos, servicios, cv, contacto, email, clear');
        break;
      case 'whoami':
        appendCliLine('Alessandro Rodríguez (PX) — Estudiante de Ingeniería de Sistemas e Inteligencia Artificial en Trujillo, Perú. Desarrollador Web Full Stack y Android nativo.');
        break;
      case 'stack':
        appendCliLine('Web: React, JavaScript, HTML5, CSS3, Tailwind CSS, Vite, PWA · Android: Kotlin, Jetpack Compose, Material 3 · Datos: Supabase, PostgreSQL, MySQL, Python.');
        break;
      case 'proyectos':
        appendCliLine('1) UPAO S (Android · Kotlin/Compose)  2) Armador de Horarios UPAO (PWA · Web Workers)  3) PremiumPe (React · Supabase). Desplazando a Proyectos...');
        document.getElementById('proyectos')?.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
        break;
      case 'servicios':
        appendCliLine('Desarrollo Web, Catálogos Digitales, Apps Android, Chatbots WhatsApp, Bases de Datos, APIs, Planificadores y Publicación. Desplazando a Servicios...');
        document.getElementById('servicios')?.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
        break;
      case 'contacto':
        appendCliLine(`Correo: ${EMAIL_ADDRESS} · GitHub: github.com/alessandrorr1007-debug. Desplazando a Contacto...`);
        document.getElementById('contacto')?.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
        break;
      case 'email':
        copyToClipboard(EMAIL_ADDRESS, 'Correo copiado al portapapeles');
        appendCliLine(`Correo copiado: ${EMAIL_ADDRESS}`);
        break;
      case 'cv': {
        appendCliLine('Abriendo Currículum Vitae imprimible...');
        const cvDialog = document.getElementById('modal-cv');
        if (cvDialog && typeof cvDialog.showModal === 'function') {
          cvDialog.showModal();
        }
        break;
      }
      case 'clear':
        cliOutput.innerHTML = '';
        appendCliLine('Terminal limpia. Escribe "help" para ver los comandos disponibles.', 'cli-line cli-muted');
        break;
      default:
        appendCliLine(`Comando no reconocido: "${cmd}". Escribe "help" para ver las opciones.`);
        break;
    }
  };

  cliForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runCommand(cliInput.value);
    cliInput.value = '';
  });

  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd') || '';
      runCommand(cmd);
    });
  });
}

/* ==========================================================================
   9. FILTROS INTERACTIVOS DE HABILIDADES Y PROYECTOS
   ========================================================================== */
function initFilters() {
  // Filtro de Habilidades
  const skillBtns = document.querySelectorAll('[data-skill-filter]');
  const skillCards = document.querySelectorAll('[data-skill-category]');

  skillBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-skill-filter');
      skillBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });

      skillCards.forEach((card) => {
        const cat = card.getAttribute('data-skill-category');
        card.classList.toggle('is-hidden', selected !== 'all' && cat !== selected);
      });
    });
  });

  // Filtro de Proyectos
  const projectBtns = document.querySelectorAll('[data-project-filter]');
  const projectCards = document.querySelectorAll('[data-project-category]');

  projectBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-project-filter');
      projectBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });

      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-project-category');
        card.classList.toggle('is-hidden', selected !== 'all' && cat !== selected);
      });
    });
  });
}

/* ==========================================================================
   10. CONEXIÓN INTERACTIVA SERVICIOS -> FORMULARIO DE CONTACTO
   ========================================================================== */
function initServiceInquiry() {
  const serviceButtons = document.querySelectorAll('.service-inquire-btn');
  const banner = document.getElementById('selected-service-banner');
  const serviceNameEl = document.getElementById('selected-service-name');
  const clearBtn = document.getElementById('clear-service-btn');
  const subjectInput = document.getElementById('form-subject');
  const messageInput = document.getElementById('message');
  const contactSection = document.getElementById('contacto');

  const clearService = () => {
    if (banner) banner.hidden = true;
    if (serviceNameEl) serviceNameEl.textContent = '';
    if (subjectInput) subjectInput.value = 'Nuevo mensaje desde tu Portafolio Web';
  };

  serviceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const service = btn.getAttribute('data-service');
      if (!service) return;

      if (banner && serviceNameEl) {
        serviceNameEl.textContent = service;
        banner.hidden = false;
      }
      if (subjectInput) {
        subjectInput.value = `Consulta sobre ${service} — Portafolio Pxul.dev`;
      }
      if (messageInput && !messageInput.value.trim()) {
        messageInput.value = `Hola Alessandro, me gustaría consultar sobre el servicio de ${service}. `;
        messageInput.dispatchEvent(new Event('input'));
      }

      contactSection?.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
      setTimeout(() => {
        document.getElementById('name')?.focus();
      }, reducedMotionQuery.matches ? 0 : 450);
    });
  });

  clearBtn?.addEventListener('click', clearService);
}

/* ==========================================================================
   11. MODALES NATIVOS (<dialog>) DE PROYECTOS Y CV
   ========================================================================== */
function initModals() {
  const dialogs = document.querySelectorAll('dialog.project-modal');
  let lastFocusedTrigger = null;

  const openDialog = (dialog, trigger) => {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    lastFocusedTrigger = trigger || document.activeElement;
    dialog.showModal();
  };

  // Botones para abrir modales de proyectos
  document.querySelectorAll('.open-modal-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-modal');
      if (!modalId) return;
      openDialog(document.getElementById(modalId), btn);
    });
  });

  // Botones para abrir modal de CV
  const cvDialog = document.getElementById('modal-cv');
  document.querySelectorAll('.open-cv-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDialog(cvDialog, btn);
    });
  });

  // Botón imprimir / guardar PDF del CV
  const printBtn = document.getElementById('print-cv-btn');
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  dialogs.forEach((dialog) => {
    dialog.querySelectorAll('.modal-close-btn, .modal-close-action').forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => dialog.close());
    });

    // Restaurar foco al elemento que abrió el modal
    dialog.addEventListener('close', () => {
      if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
        lastFocusedTrigger.focus();
      }
    });

    // Light-dismiss al hacer clic en el backdrop
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!inside) dialog.close();
    });
  });
}

/* ==========================================================================
   12. COPIAR CORREO + NOTIFICACIONES TOAST ACCESIBLES
   ========================================================================== */
let toastTimeoutId = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage);
    }).catch(() => {
      showToast(text);
    });
  } else {
    showToast(text);
  }
}

function initCopyEmail() {
  document.querySelectorAll('.copy-email-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      copyToClipboard(EMAIL_ADDRESS, 'Correo copiado al portapapeles');
    });
  });
}

/* ==========================================================================
   13. FORMULARIO DE CONTACTO CON VALIDACIÓN INLINE Y FORMSUBMIT API
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const counter = document.getElementById('message-counter');
  const submitBtn = document.getElementById('contact-submit-btn');
  const subjectInput = document.getElementById('form-subject');

  if (!form || !nameInput || !emailInput || !messageInput || !submitBtn) return;

  const setFieldError = (input, errorId, message) => {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  const validateName = () => {
    const val = nameInput.value.trim();
    if (!val) return setFieldError(nameInput, 'name-error', 'Ingresa tu nombre.');
    if (val.length < 2) return setFieldError(nameInput, 'name-error', 'El nombre debe tener al menos 2 caracteres.');
    return setFieldError(nameInput, 'name-error', '');
  };

  const validateEmail = () => {
    const val = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) return setFieldError(emailInput, 'email-error', 'Ingresa tu correo electrónico.');
    if (!emailPattern.test(val)) return setFieldError(emailInput, 'email-error', 'Ingresa un correo electrónico válido.');
    return setFieldError(emailInput, 'email-error', '');
  };

  const validateMessage = () => {
    const val = messageInput.value.trim();
    if (!val) return setFieldError(messageInput, 'message-error', 'Escribe tu mensaje o consulta.');
    if (val.length < 10) return setFieldError(messageInput, 'message-error', 'Cuéntame un poco más (mínimo 10 caracteres).');
    return setFieldError(messageInput, 'message-error', '');
  };

  const updateCounter = () => {
    if (!counter) return;
    const len = messageInput.value.trim().length;
    counter.textContent = `${len} ${len === 1 ? 'carácter' : 'caracteres'}`;
  };

  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('blur', validateEmail);
  messageInput.addEventListener('blur', validateMessage);

  nameInput.addEventListener('input', () => {
    if (nameInput.getAttribute('aria-invalid') === 'true') validateName();
  });
  emailInput.addEventListener('input', () => {
    if (emailInput.getAttribute('aria-invalid') === 'true') validateEmail();
  });
  messageInput.addEventListener('input', () => {
    updateCounter();
    if (messageInput.getAttribute('aria-invalid') === 'true') validateMessage();
  });
  updateCounter();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const validName = validateName();
    const validEmail = validateEmail();
    const validMessage = validateMessage();

    if (!validName || !validEmail || !validMessage) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      showToast('Revisa los campos marcados antes de enviar.');
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    const customSubject = subjectInput?.value || `Nuevo mensaje de ${name} desde tu Portafolio Web`;

    const labelSpan = submitBtn.querySelector('.btn-label');
    const originalLabel = labelSpan ? labelSpan.textContent : 'Enviar Mensaje';

    if (labelSpan) labelSpan.textContent = 'Enviando mensaje...';
    submitBtn.disabled = true;

    if (feedback) {
      feedback.className = 'form-feedback';
      feedback.textContent = '';
    }

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${EMAIL_ADDRESS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Nombre: name,
          email: email,
          _replyto: email,
          _url: 'https://alessandrorr1007-debug.github.io/pxulrr/',
          Mensaje: message,
          _subject: customSubject,
          _template: 'table',
          _captcha: 'false'
        })
      });

      const data = await response.json();

      if (response.ok && (data.success === true || data.success === 'true')) {
        form.reset();
        updateCounter();
        const banner = document.getElementById('selected-service-banner');
        if (banner) banner.hidden = true;
        if (subjectInput) subjectInput.value = 'Nuevo mensaje desde tu Portafolio Web';

        if (feedback) {
          feedback.className = 'form-feedback success';
          feedback.textContent = `Mensaje enviado. Gracias, ${name}, recibí tu consulta y responderé al correo que indicaste.`;
        }
        showToast('Mensaje enviado exitosamente');
      } else {
        throw new Error(data.message || 'Error en el envío');
      }
    } catch (err) {
      const mailtoUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(`Contacto desde Portafolio - ${name}`)}&body=${encodeURIComponent(`Hola Alessandro,\n\nMi nombre es: ${name}\nMi correo: ${email}\n\nMensaje:\n${message}`)}`;

      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'No pudimos confirmar el envío automático. Tu mensaje se conserva en el formulario.';

        if (err instanceof Error && err.message && err.message !== 'Failed to fetch') {
          const reason = document.createElement('p');
          reason.textContent = `Detalle: ${err.message}`;
          feedback.append(reason);
        }

        const actions = document.createElement('div');
        actions.className = 'feedback-actions';

        const directButton = document.createElement('button');
        directButton.type = 'button';
        directButton.className = 'project-link-btn outline';
        directButton.textContent = 'Continuar con envío directo';
        directButton.addEventListener('click', () => {
          HTMLFormElement.prototype.submit.call(form);
        });

        const emailLink = document.createElement('a');
        emailLink.href = mailtoUrl;
        emailLink.textContent = 'Enviar desde tu aplicación de correo';

        actions.append(directButton, emailLink);
        feedback.append(actions);
      }

      showToast('No se confirmó el envío. Puedes reintentar o usar tu app de correo.');
    } finally {
      if (labelSpan) labelSpan.textContent = originalLabel;
      submitBtn.disabled = false;
    }
  });
}
