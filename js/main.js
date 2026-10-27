/* ==========================================================================
   PORTAFOLIO PROFESIONAL - PAUL RODRÍGUEZ (PXUL RR)
   Lógica JavaScript: Partículas, Typewriter, ScrollSpy, Navegación & Interacciones
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializaciones
  initParticles();
  initTypewriter();
  initNavbar();
  initScrollSpy();
  initCustomCursor();
  initCopyEmail();
  initContactForm();
  initScrollReveal();
  initProjectModals();
  initCvModal();
});

/* ==========================================================================
   1. CANVAS DE PARTÍCULAS / CONSTELACIÓN INTERACTIVA
   ========================================================================== */
function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  
  // Parámetros
  const particleCount = window.innerWidth < 768 ? 45 : 85;
  const maxDistance = 120;
  let mouse = { x: null, y: null, radius: 140 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 1.8 + 0.8;
      this.baseAlpha = Math.random() * 0.4 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Rebote en bordes
      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;

      // Reacción al ratón
      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.hypot(dx, dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const dirX = dx / dist;
          const dirY = dy / dist;
          this.x -= dirX * force * 1.2;
          this.y -= dirY * force * 1.2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${this.baseAlpha})`;
      ctx.fill();
    }
  }

  // Crear partículas iniciales
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Conectar partículas cercanas con líneas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDistance) {
          const opacity = (1 - dist / maxDistance) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Actualizar y dibujar partículas
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   2. EFECTO TYPEWRITER MULTI-ROL
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

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 70;

  function typeEffect() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      charIndex--;
      typingSpeed = 35;
    } else {
      charIndex++;
      typingSpeed = 70;
    }

    element.textContent = currentRole.substring(0, charIndex);

    if (!isDeleting && charIndex === currentRole.length) {
      typingSpeed = 1800; // Pausa al finalizar palabra
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typingSpeed = 400; // Pausa antes de empezar nueva palabra
    }

    setTimeout(typeEffect, typingSpeed);
  }

  setTimeout(typeEffect, 500);
}

/* ==========================================================================
   3. BARRA DE NAVEGACIÓN Y MENÚ MÓVIL
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  // Efecto glassmorphic al scrollear
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Toggle menú móvil
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Cerrar menú al hacer clic en un enlace
    links.forEach(link => {
      link.addEventListener('click', () => {
        toggleBtn.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}

/* ==========================================================================
   4. SCROLLSPY (ENLACES ACTIVOS AL SCROLLEAR)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   5. CURSOR PERSONALIZADO ULTRA-SUAVE
   ========================================================================== */
function initCustomCursor() {
  // Solo en dispositivos de escritorio con puntero fino
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const dot = document.querySelector('.custom-cursor-dot');
  const ring = document.querySelector('.custom-cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  // Animación interpolada para el aro exterior
  function renderCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Detección de elementos clickeables para agrandar el cursor
  const interactives = document.querySelectorAll('a, button, input, textarea, .clickable, .project-card, .skill-category-card, .service-card');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ==========================================================================
   6. COPIAR CORREO AL PORTAPAPELES + NOTIFICACIÓN TOAST
   ========================================================================== */
function initCopyEmail() {
  const copyBtns = document.querySelectorAll('.copy-email-btn');
  const toast = document.getElementById('toast');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'arodriguezr1020@gmail.com';

      navigator.clipboard.writeText(email).then(() => {
        showToast('✓ ¡Correo copiado al portapapeles!');
      }).catch(() => {
        showToast('✉ arodriguezr1020@gmail.com');
      });
    });
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   7. FORMULARIO DE CONTACTO DIRECTO AL CORREO (FORMSUBMIT API)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Enviando mensaje a Alessandro...</span>';
    submitBtn.disabled = true;

    try {
      // Envío directo a tu correo arodriguezr1020@gmail.com vía FormSubmit API
      const response = await fetch('https://formsubmit.co/ajax/arodriguezr1020@gmail.com', {
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
          _subject: `Nuevo mensaje de ${name} desde tu Portafolio Web`,
          _template: 'table',
          _captcha: 'false'
        })
      });

      const data = await response.json();

      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;

      if (response.ok && (data.success === true || data.success === 'true')) {
        form.reset();
        if (feedback) {
          feedback.className = 'form-feedback success';
          feedback.textContent = `¡Gracias, ${name}! Tu mensaje fue recibido por el servicio de envío. Te responderé al correo que indicaste.`;
          feedback.style.display = 'block';

          setTimeout(() => {
            feedback.style.display = 'none';
          }, 9000);
        }
        showToast('✓ Mensaje enviado exitosamente a mi correo');
      } else {
        throw new Error(data.message || 'Error en el envío');
      }
    } catch (err) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;

      // Conserva los campos para reintentar y ofrece una alternativa explícita.
      const mailtoUrl = `mailto:arodriguezr1020@gmail.com?subject=${encodeURIComponent(`Contacto desde Portafolio - ${name}`)}&body=${encodeURIComponent(`Hola Alessandro,\n\nMi nombre es: ${name}\nMi correo: ${email}\n\nMensaje:\n${message}`)}`;
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'No pudimos confirmar el envío. ';
        if (err instanceof Error && err.message && err.message !== 'Failed to fetch') {
          const reason = document.createElement('p');
          reason.textContent = `Respuesta del servicio: ${err.message}`;
          feedback.append(reason);
        }
        const directButton = document.createElement('button');
        directButton.type = 'button';
        directButton.className = 'project-link-btn outline';
        directButton.textContent = 'Continuar con envío directo';
        directButton.addEventListener('click', () => {
          if (form.reportValidity()) HTMLFormElement.prototype.submit.call(form);
        });
        feedback.append(directButton, document.createElement('br'));
        feedback.append('También puedes ');
        const emailLink = document.createElement('a');
        emailLink.href = mailtoUrl;
        emailLink.textContent = 'enviar el mensaje desde tu aplicación de correo';
        feedback.append(emailLink);
        feedback.style.display = 'block';
      }
      showToast('No se confirmó el envío. Tu mensaje sigue en el formulario.');
    }
  });
}

/* ==========================================================================
   8. ANIMACIÓN REVEAL AL HACER SCROLL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.fade-in-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   9. MODALES NATIVOS (<dialog>) CON LIGHT DISMISS Y ACCESIBILIDAD
   ========================================================================== */
function initProjectModals() {
  const openButtons = document.querySelectorAll('.open-modal-btn');
  const dialogs = document.querySelectorAll('dialog.project-modal');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-modal');
      const dialog = document.getElementById(modalId);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  });

  dialogs.forEach(dialog => {
    // Botones de cierre dentro del modal
    const closeBtns = dialog.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(closeBtn => {
      closeBtn.addEventListener('click', () => dialog.close());
    });

    // Fallback de light-dismiss para navegadores que aún no soportan closedby
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );

        if (!isDialogContent) {
          dialog.close();
        }
      });
    }
  });
}

/* ==========================================================================
   10. MODAL DE CURRÍCULUM VITAE (CV INTERACTIVO)
   ========================================================================== */
function initCvModal() {
  const cvButtons = document.querySelectorAll('.open-cv-btn');
  const cvDialog = document.getElementById('modal-cv');
  if (!cvDialog) return;

  cvButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof cvDialog.showModal === 'function') {
        cvDialog.showModal();
      }
    });
  });
}

