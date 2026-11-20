import { createStudioScene } from './scene3d.js';

/**
 * Pxul.dev (FOLDER) — Controlador Principal del Estudio 3D & 2D
 * Conecta los 7 objetos interactivos 3D con sus funciones reales:
 * Monitor (FOLDER), Laptop (Sobre Mí), Tablet (Servicios),
 * Servidor (Laboratorio Tech), Consola (Bug Squash), Buzón (Contacto),
 * y Lámpara (Tema Claro / Oscuro).
 */

const WINDOW_IDS = {
  proyectos: 'win-proyectos',
  'sobre-mi': 'win-sobre-mi',
  servicios: 'win-servicios',
  laboratorio: 'win-laboratorio',
  minijuego: 'win-minijuego',
  contacto: 'win-contacto',
};

const STORAGE_THEME_KEY = 'pxul_studio_theme_v3';
const STORAGE_MODE_KEY = 'pxul_studio_mode_v3';
const STORAGE_BEST_SCORE_KEY = 'pxul_bug_squash_best_v1';

const state = {
  theme: 'dark',
  mode: '3d',
  activeStation: 'inicio',
  openWindowId: null,
  studio3d: null,
  gameController: null,
};

let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

/* ==========================================================================
   TEMA DUAL (CLARO / OSCURO) SINCRONIZADO CON LA ESCENA 3D
   ========================================================================== */
function applyTheme(nextTheme, persist = true) {
  const theme = nextTheme === 'light' ? 'light' : 'dark';
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#dde6f0' : '#070d1a');
  }

  const dockLabel = document.getElementById('theme-toggle-label');
  if (dockLabel) {
    dockLabel.textContent = theme === 'dark' ? 'Claro' : 'Oscuro';
  }

  const mobileThemeBtn = document.getElementById('mobile-theme-btn');
  if (mobileThemeBtn) {
    mobileThemeBtn.textContent = theme === 'dark' ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro';
  }

  if (state.studio3d) {
    state.studio3d.setTheme(theme);
  }

  if (persist) {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignorar si localStorage está restringido
    }
  }
}

function toggleTheme(announce = false) {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
  if (announce) {
    showToast(next === 'light' ? 'Iluminación de estudio: Modo Claro' : 'Iluminación de estudio: Modo Oscuro');
  }
}

/* ==========================================================================
   INDICADOR DISCRETO DE HOVER SOBRE OBJETOS 3D
   ========================================================================== */
function hideHoverBadge() {
  const badge = document.getElementById('studio-hover-badge');
  if (badge) badge.hidden = true;
}

function updateHoverBadge(stationId, meta, projectedPoint) {
  const badge = document.getElementById('studio-hover-badge');
  const titleEl = document.getElementById('hover-badge-title');
  const actionEl = document.getElementById('hover-badge-action');
  if (!badge || !titleEl || !actionEl) return;

  if (!stationId || !meta || !projectedPoint || !projectedPoint.visible || state.openWindowId || state.mode !== '3d') {
    badge.hidden = true;
    return;
  }

  titleEl.textContent = meta.title;
  actionEl.textContent = meta.action;

  const topbarH = document.getElementById('topbar')?.offsetHeight || 58;
  const clampedX = Math.max(120, Math.min(window.innerWidth - 135, projectedPoint.x));
  const clampedY = Math.max(topbarH + 46, Math.min(window.innerHeight - 96, projectedPoint.y + topbarH - 18));

  badge.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(clampedY)}px, 0) translate(-50%, -100%)`;
  badge.hidden = false;
}

/* ==========================================================================
   MODO 3D / ALTERNATIVA 2D LIGERA
   ========================================================================== */
function setRenderMode(nextMode, persist = true) {
  const mode = nextMode === 'lite' ? 'lite' : '3d';
  state.mode = mode;

  const sceneMount = document.getElementById('scene-mount');
  const heroOverlay = document.getElementById('hero-overlay');
  const liteStage = document.getElementById('lite-stage');
  const modeLabel = document.getElementById('mode-toggle-label');
  const mobileModeBtn = document.getElementById('mobile-mode-btn');

  document.body.classList.toggle('mode-3d', mode === '3d');
  document.body.classList.toggle('mode-lite', mode === 'lite');

  if (mode === 'lite') {
    hideHoverBadge();
    if (sceneMount) sceneMount.hidden = true;
    if (heroOverlay) heroOverlay.hidden = true;
    if (liteStage) liteStage.hidden = false;
    if (state.studio3d) state.studio3d.setPaused(true);
    if (modeLabel) modeLabel.textContent = '3D';
    if (mobileModeBtn) mobileModeBtn.textContent = 'Cambiar a Estudio 3D';
  } else {
    if (sceneMount) sceneMount.hidden = false;
    if (heroOverlay) heroOverlay.hidden = false;
    if (liteStage) liteStage.hidden = true;
    if (modeLabel) modeLabel.textContent = '2D';
    if (mobileModeBtn) mobileModeBtn.textContent = 'Cambiar a Vista 2D';
    if (!state.studio3d) {
      init3DStudio();
    } else {
      state.studio3d.setPaused(false);
    }
  }

  if (persist) {
    try {
      localStorage.setItem(STORAGE_MODE_KEY, mode);
    } catch {
      // Ignorar almacenamiento bloqueado
    }
  }
}

function init3DStudio() {
  const mountEl = document.getElementById('scene-mount');
  if (!mountEl || state.studio3d) return;

  try {
    state.studio3d = createStudioScene({
      mountEl,
      initialTheme: state.theme,
      onSelectStation(stationId) {
        if (stationId === 'tema') {
          toggleTheme(true);
          return;
        }
        navigateToStation(stationId);
      },
      onHoverStation(stationId, meta, projectedPoint) {
        updateHoverBadge(stationId, meta, projectedPoint);
      },
      onWebGLFallback(reason) {
        showToast(reason || 'Activando vista 2D ligera.');
        setRenderMode('lite', false);
      },
    });
  } catch {
    setRenderMode('lite', false);
  }
}

/* ==========================================================================
   NAVEGACIÓN POR OBJETOS & VENTANAS OS
   ========================================================================== */
function syncActiveControls(stationId) {
  document.querySelectorAll('[data-station]').forEach((el) => {
    const isMatch = el.getAttribute('data-station') === stationId;
    if (el.classList.contains('nav-link') || el.classList.contains('dock-btn')) {
      el.classList.toggle('is-active', isMatch);
    }
  });
}

function closeActiveWindow(returnToOverview = true) {
  const layer = document.getElementById('window-layer');
  const heroOverlay = document.getElementById('hero-overlay');

  if (state.openWindowId === 'win-minijuego' && state.gameController) {
    state.gameController.pause();
  }

  Object.values(WINDOW_IDS).forEach((id) => {
    const win = document.getElementById(id);
    if (win) win.hidden = true;
  });

  if (layer) layer.hidden = true;
  if (heroOverlay) heroOverlay.classList.remove('is-hidden');

  state.openWindowId = null;
  state.activeStation = 'inicio';
  syncActiveControls('inicio');

  if (returnToOverview && state.studio3d) {
    state.studio3d.resetCamera();
  }
}

function openStationWindow(stationId) {
  const targetWinId = WINDOW_IDS[stationId];
  if (!targetWinId) return;

  hideHoverBadge();

  if (state.openWindowId === 'win-minijuego' && targetWinId !== 'win-minijuego' && state.gameController) {
    state.gameController.pause();
  }

  Object.values(WINDOW_IDS).forEach((id) => {
    const win = document.getElementById(id);
    if (win) win.hidden = id !== targetWinId;
  });

  const layer = document.getElementById('window-layer');
  const heroOverlay = document.getElementById('hero-overlay');

  if (layer) layer.hidden = false;
  if (heroOverlay) heroOverlay.classList.add('is-hidden');

  state.openWindowId = targetWinId;
  state.activeStation = stationId;
  syncActiveControls(stationId);

  const activeWin = document.getElementById(targetWinId);
  const focusable = activeWin?.querySelector('input, button, a, textarea');
  if (focusable) {
    window.setTimeout(() => focusable.focus({ preventScroll: true }), 40);
  }
}

function navigateToStation(stationId) {
  closeMobileDrawer();

  if (stationId === 'tema') {
    toggleTheme(true);
    return;
  }

  if (stationId === 'inicio') {
    closeActiveWindow(true);
    return;
  }

  if (state.studio3d && state.mode === '3d') {
    state.studio3d.focusStation(stationId);
  }

  openStationWindow(stationId);
}

/* ==========================================================================
   MENÚ MÓVIL, DOCK & TECLADO GLOBAL
   ========================================================================== */
function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const toggle = document.getElementById('menu-toggle');
  if (drawer) drawer.hidden = true;
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function initNavigationAndDock() {
  document.addEventListener('click', (event) => {
    const stationBtn = event.target.closest('[data-station]');
    if (stationBtn) {
      const station = stationBtn.getAttribute('data-station');
      if (station) navigateToStation(station);
      return;
    }

    if (event.target.closest('[data-close-window]') || event.target.id === 'window-scrim') {
      closeActiveWindow(true);
    }
  });

  const brandHome = document.getElementById('brand-home');
  if (brandHome) {
    brandHome.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToStation('inicio');
    });
  }

  const menuToggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  if (menuToggle && drawer) {
    menuToggle.addEventListener('click', () => {
      const nextOpen = drawer.hidden;
      drawer.hidden = !nextOpen;
      menuToggle.setAttribute('aria-expanded', String(nextOpen));
    });
  }

  const themeBtns = [
    document.getElementById('theme-toggle-btn'),
    document.getElementById('mobile-theme-btn'),
    document.getElementById('lite-theme-btn'),
  ];
  themeBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => {
        toggleTheme(true);
        closeMobileDrawer();
      });
    }
  });

  const modeToggle = document.getElementById('mode-toggle-btn');
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      setRenderMode(state.mode === '3d' ? 'lite' : '3d', true);
    });
  }

  const mobileModeBtn = document.getElementById('mobile-mode-btn');
  if (mobileModeBtn) {
    mobileModeBtn.addEventListener('click', () => {
      setRenderMode(state.mode === '3d' ? 'lite' : '3d', true);
      closeMobileDrawer();
    });
  }

  const liteTo3dBtn = document.getElementById('lite-to-3d-btn');
  if (liteTo3dBtn) {
    liteTo3dBtn.addEventListener('click', () => setRenderMode('3d', true));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openDialog = document.querySelector('dialog[open]');
      if (openDialog) {
        openDialog.close();
        return;
      }
      if (state.openWindowId) {
        closeActiveWindow(true);
      } else {
        closeMobileDrawer();
      }
    }
  });
}

/* ==========================================================================
   TYPEWRITER DEL HERO
   ========================================================================== */
function initTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;

  const phrases = [
    'Desarrollador Web Full Stack & Móvil',
    'Apps Android con Kotlin & Jetpack Compose',
    'Soluciones Web con React, PWA y Supabase',
  ];

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = phrases[0];
    return;
  }

  let phraseIdx = 0;
  let charIdx = phrases[0].length;
  let deleting = false;

  function step() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      charIdx += 1;
      el.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        deleting = true;
        window.setTimeout(step, 2200);
        return;
      }
      window.setTimeout(step, 52);
    } else {
      charIdx -= 1;
      el.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        window.setTimeout(step, 340);
        return;
      }
      window.setTimeout(step, 28);
    }
  }

  window.setTimeout(() => {
    deleting = true;
    step();
  }, 2400);
}

/* ==========================================================================
   1. EXPLORADOR FOLDER (PROYECTOS)
   ========================================================================== */
function initFolderExplorer() {
  const folderButtons = Array.from(document.querySelectorAll('.folder-item'));
  const viewButtons = Array.from(document.querySelectorAll('.view-btn'));
  const cards = Array.from(document.querySelectorAll('.project-file-card'));
  const searchInput = document.getElementById('folder-search');
  const clearBtn = document.getElementById('folder-search-clear');
  const grid = document.getElementById('folder-grid');
  const emptyBox = document.getElementById('folder-empty');
  const resetBtn = document.getElementById('folder-reset-btn');
  const statusPath = document.getElementById('folder-status-path');
  const statusCount = document.getElementById('folder-status-count');

  if (!grid || cards.length === 0) return;

  let activeFolder = 'all';

  function renderFilter() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    if (clearBtn) clearBtn.hidden = query.length === 0;

    let visibleCount = 0;
    cards.forEach((card) => {
      const cat = card.getAttribute('data-category') || '';
      const haystack = (card.getAttribute('data-search') || '').toLowerCase();
      const folderOk = activeFolder === 'all' || cat === activeFolder;
      const queryOk = !query || haystack.includes(query);
      const show = folderOk && queryOk;
      card.hidden = !show;
      if (show) visibleCount += 1;
    });

    if (emptyBox) emptyBox.hidden = visibleCount > 0;
    if (statusPath) {
      const folderSlug = activeFolder === 'all' ? 'todos' : activeFolder;
      statusPath.textContent = `~/pxul.dev/proyectos/${folderSlug}`;
    }
    if (statusCount) {
      statusCount.textContent =
        visibleCount === 1 ? '1 elemento mostrado' : `${visibleCount} elementos mostrados`;
    }
  }

  folderButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFolder = btn.getAttribute('data-folder') || 'all';
      folderButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderFilter();
    });
  });

  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-view-mode');
      grid.classList.toggle('is-list', mode === 'list');
      viewButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', renderFilter);
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      renderFilter();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeFolder = 'all';
      if (searchInput) searchInput.value = '';
      folderButtons.forEach((b) => {
        const isAll = b.getAttribute('data-folder') === 'all';
        b.classList.toggle('is-active', isAll);
        b.setAttribute('aria-pressed', String(isAll));
      });
      renderFilter();
    });
  }

  renderFilter();
}

/* ==========================================================================
   2. SOBRE MÍ (COPIAR JSON + TERMINAL INTERACTIVA)
   ========================================================================== */
function initAboutWorkspace() {
  const copyJsonBtn = document.getElementById('copy-json-btn');
  const profileJson = document.getElementById('profile-json');

  if (copyJsonBtn && profileJson) {
    copyJsonBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(profileJson.textContent.trim());
        showToast('Perfil JSON copiado al portapapeles.');
      } catch {
        showToast('No se pudo copiar automáticamente.');
      }
    });
  }

  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  if (!form || !input || !output) return;

  function appendLine(text, className = '') {
    const div = document.createElement('div');
    div.className = `term-line ${className}`.trim();
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    appendLine(`> ${raw}`, 'term-cmd');
    input.value = '';

    switch (cmd) {
      case 'help':
        appendLine('Comandos disponibles: whoami, proyectos, servicios, lab, juego, contacto, tema, clear');
        break;
      case 'whoami':
        appendLine('Alessandro Rodríguez (Pxul.dev) · Ingeniería de Sistemas e IA · Trujillo, Perú', 'term-ok');
        break;
      case 'proyectos':
        appendLine('Abriendo Monitor · Explorador FOLDER...', 'term-ok');
        navigateToStation('proyectos');
        break;
      case 'servicios':
        appendLine('Abriendo Tablet · Servicios...', 'term-ok');
        navigateToStation('servicios');
        break;
      case 'lab':
      case 'laboratorio':
        appendLine('Abriendo Servidor · Laboratorio Tech...', 'term-ok');
        navigateToStation('laboratorio');
        break;
      case 'juego':
      case 'minijuego':
        appendLine('Lanzando Consola · Bug Squash...', 'term-ok');
        navigateToStation('minijuego');
        break;
      case 'contacto':
        appendLine('Abriendo Buzón · Contacto directo...', 'term-ok');
        navigateToStation('contacto');
        break;
      case 'tema':
        toggleTheme(true);
        appendLine(`Tema cambiado a ${state.theme === 'light' ? 'Claro' : 'Oscuro'}.`, 'term-ok');
        break;
      case 'clear':
        output.innerHTML = '';
        appendLine('Terminal limpia. Escribe help para listar comandos.', 'term-muted');
        break;
      default:
        appendLine(`Comando no reconocido: "${raw}". Escribe help para ver opciones.`, 'term-muted');
    }
  });
}

/* ==========================================================================
   3. SERVICIOS (SWITCH DE STOCK + CONSULTA PRECARGADA A CONTACTO)
   ========================================================================== */
function initServicesInteractive() {
  const stockToggle = document.getElementById('demo-stock-toggle');
  const stockLabel = document.getElementById('demo-stock-label');

  if (stockToggle && stockLabel) {
    stockToggle.addEventListener('change', () => {
      const available = stockToggle.checked;
      stockLabel.textContent = available ? 'Disponible' : 'Agotado';
      stockLabel.classList.toggle('stock-on', available);
      stockLabel.classList.toggle('stock-off', !available);
    });
  }

  document.querySelectorAll('[data-service-inquiry]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const serviceName = btn.getAttribute('data-service-inquiry') || 'Consulta de servicio';
      const subjectInput = document.getElementById('contact-subject');
      const hiddenSubject = document.getElementById('form-hidden-subject');
      const messageInput = document.getElementById('contact-message');

      if (subjectInput) subjectInput.value = `Consulta: ${serviceName}`;
      if (hiddenSubject) hiddenSubject.value = `Consulta de servicio (${serviceName}) — Pxul.dev`;
      if (messageInput && !messageInput.value.trim()) {
        messageInput.value = `Hola Alessandro, me interesa conversar sobre el servicio de ${serviceName}.`;
        messageInput.dispatchEvent(new Event('input'));
      }

      navigateToStation('contacto');
      showToast(`Asunto precargado: ${serviceName}`);
    });
  });
}

/* ==========================================================================
   4. LABORATORIO TECNOLÓGICO INTERACTIVO (SERVIDOR)
   ========================================================================== */
function initTechLab() {
  // Tabs del laboratorio
  const tabs = Array.from(document.querySelectorAll('.lab-tab'));
  const panels = {
    solver: document.getElementById('lab-panel-solver'),
    api: document.getElementById('lab-panel-api'),
    realtime: document.getElementById('lab-panel-realtime'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-lab-tab');
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      Object.entries(panels).forEach(([k, panel]) => {
        if (panel) panel.hidden = k !== key;
      });
    });
  });

  // --- Módulo 1: Resolutor de Horarios Backtracking ---
  const courses = [
    {
      name: 'Estructuras',
      slots: [
        { day: 'Lun', hour: '08:00' },
        { day: 'Mar', hour: '10:00' },
      ],
    },
    {
      name: 'IA Aplicada',
      slots: [
        { day: 'Lun', hour: '08:00' },
        { day: 'Mié', hour: '08:00' },
      ],
    },
    {
      name: 'Base de Datos',
      slots: [
        { day: 'Mar', hour: '10:00' },
        { day: 'Jue', hour: '10:00' },
      ],
    },
    {
      name: 'Android Dev',
      slots: [
        { day: 'Mié', hour: '08:00' },
        { day: 'Vie', hour: '10:00' },
      ],
    },
  ];

  // Estado inicial con un cruce intencional para demostrar la detección y resolución
  const selectedSlots = [0, 0, 0, 0];
  const slotButtons = Array.from(document.querySelectorAll('.lab-slot-btn'));
  const matrixEl = document.getElementById('lab-schedule-matrix');
  const solverStatusEl = document.getElementById('lab-solver-status');
  const autoSolveBtn = document.getElementById('lab-auto-solve');

  function renderScheduleMatrix() {
    if (!matrixEl || !solverStatusEl) return;

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const hours = ['08:00', '10:00'];
    const cellMap = new Map();

    courses.forEach((course, idx) => {
      const slot = course.slots[selectedSlots[idx]];
      const key = `${slot.day}-${slot.hour}`;
      if (!cellMap.has(key)) cellMap.set(key, []);
      cellMap.get(key).push(course.name);
    });

    const conflicts = [];
    cellMap.forEach((list, key) => {
      if (list.length > 1) conflicts.push(`${key.replace('-', ' ')} (${list.join(' + ')})`);
    });

    matrixEl.innerHTML = days
      .map((day) => {
        const blocks = hours
          .map((hour) => {
            const key = `${day}-${hour}`;
            const items = cellMap.get(key) || [];
            const cls =
              items.length > 1
                ? 'matrix-cell is-crash'
                : items.length === 1
                ? 'matrix-cell is-filled'
                : 'matrix-cell';
            const label =
              items.length > 1
                ? `CRUCE: ${items.join(' / ')}`
                : items.length === 1
                ? items[0]
                : 'Libre';
            return `<div class="${cls}"><span class="matrix-hour">${hour}</span><strong>${label}</strong></div>`;
          })
          .join('');
        return `<div class="matrix-col"><div class="matrix-day">${day}</div>${blocks}</div>`;
      })
      .join('');

    slotButtons.forEach((btn) => {
      const cIdx = Number(btn.getAttribute('data-course'));
      const sIdx = Number(btn.getAttribute('data-slot'));
      btn.classList.toggle('is-selected', selectedSlots[cIdx] === sIdx);
    });

    if (conflicts.length > 0) {
      solverStatusEl.className = 'lab-status-box is-conflict';
      solverStatusEl.textContent = `Cruce detectado en: ${conflicts.join(' · ')}`;
    } else {
      solverStatusEl.className = 'lab-status-box is-valid';
      solverStatusEl.textContent = 'Horario válido: 0 cruces entre los 4 cursos.';
    }
  }

  function runBacktrackingSolver() {
    const used = new Set();
    const solution = new Array(courses.length).fill(0);

    function backtrack(courseIdx) {
      if (courseIdx === courses.length) return true;
      for (let s = 0; s < courses[courseIdx].slots.length; s++) {
        const slot = courses[courseIdx].slots[s];
        const key = `${slot.day}-${slot.hour}`;
        if (!used.has(key)) {
          used.add(key);
          solution[courseIdx] = s;
          if (backtrack(courseIdx + 1)) return true;
          used.delete(key);
        }
      }
      return false;
    }

    if (backtrack(0)) {
      solution.forEach((val, idx) => {
        selectedSlots[idx] = val;
      });
      renderScheduleMatrix();
      showToast('Backtracking completado: combinación sin cruces encontrada.');
    }
  }

  slotButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cIdx = Number(btn.getAttribute('data-course'));
      const sIdx = Number(btn.getAttribute('data-slot'));
      selectedSlots[cIdx] = sIdx;
      renderScheduleMatrix();
    });
  });

  if (autoSolveBtn) {
    autoSolveBtn.addEventListener('click', runBacktrackingSolver);
  }

  renderScheduleMatrix();

  // --- Módulo 2: Inspector REST / JSON ---
  const payloads = {
    upaos: {
      endpoint: 'GET /api/v1/projects/upao-s',
      latency: '12 ms · Cliente local',
      body: {
        id: 'upao-s-android',
        nombre: 'UPAO S · Aplicación Android',
        plataforma: 'Android Nativo',
        stack: ['Kotlin', 'Jetpack Compose', 'Material 3', 'Retrofit', 'OkHttp', 'DataStore', 'WorkManager'],
        integraciones: ['Canvas LMS', 'GitHub Releases'],
        web: 'https://upaos.netlify.app/',
        repo: 'https://github.com/alessandrorr1007-debug/UPAOS-APK',
      },
    },
    horarios: {
      endpoint: 'GET /api/v1/projects/armador-horarios',
      latency: '9 ms · Cliente local',
      body: {
        id: 'armador-horarios-upao',
        nombre: 'Armador de Horarios UPAO',
        plataforma: 'Web App / PWA Offline',
        motor: 'Backtracking en Web Workers',
        stack: ['JavaScript', 'HTML5', 'CSS3', 'Service Workers', 'localStorage'],
        exportacion: ['PNG', 'PDF', '.ics'],
        app: 'https://alessandrorr1007-debug.github.io/armador-horarios/',
        repo: 'https://github.com/alessandrorr1007-debug/armador-horarios',
      },
    },
    premiumpe: {
      endpoint: 'GET /api/v1/projects/premiumpe',
      latency: '15 ms · Cliente local',
      body: {
        id: 'premiumpe-fullstack',
        nombre: 'PremiumPe · Pases y Membresías',
        plataforma: 'Web Full Stack',
        stack: ['React', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Netlify'],
        web: 'https://premiunpe.netlify.app/',
        repo: 'https://github.com/alessandrorr1007-debug/PremiunPe',
      },
    },
  };

  const apiBtns = Array.from(document.querySelectorAll('.api-endpoint-btn'));
  const apiTitle = document.getElementById('lab-api-title');
  const apiLatency = document.getElementById('lab-api-latency');
  const apiOutput = document.getElementById('lab-api-output');
  const apiCopyBtn = document.getElementById('lab-api-copy');

  function renderApiEndpoint(key) {
    const data = payloads[key] || payloads.upaos;
    if (apiTitle) apiTitle.textContent = data.endpoint;
    if (apiLatency) apiLatency.textContent = data.latency;
    if (apiOutput) apiOutput.textContent = JSON.stringify(data.body, null, 2);
  }

  apiBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-endpoint') || 'upaos';
      apiBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      renderApiEndpoint(key);
    });
  });

  if (apiCopyBtn && apiOutput) {
    apiCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(apiOutput.textContent);
        showToast('Respuesta JSON copiada.');
      } catch {
        showToast('No se pudo copiar el JSON.');
      }
    });
  }

  renderApiEndpoint('upaos');

  // --- Módulo 3: Simulador de Catálogo Reactivo ---
  const prodName = document.getElementById('lab-prod-name');
  const prodPrice = document.getElementById('lab-prod-price');
  const prodStock = document.getElementById('lab-prod-stock');
  const prodStockVal = document.getElementById('lab-prod-stock-val');
  const prevName = document.getElementById('lab-preview-name');
  const prevPrice = document.getElementById('lab-preview-price');
  const prevStock = document.getElementById('lab-preview-stock');
  const prevJson = document.getElementById('lab-preview-json');

  function syncRealtimeCatalog() {
    if (!prodName || !prodPrice || !prodStock) return;
    const name = prodName.value.trim() || 'Pase Digital';
    const price = Math.max(0, Number(prodPrice.value) || 0);
    const stock = Math.max(0, Number(prodStock.value) || 0);

    if (prodStockVal) prodStockVal.textContent = `${stock} disponibles`;
    if (prevName) prevName.textContent = name;
    if (prevPrice) prevPrice.textContent = `S/ ${price.toFixed(2)}`;
    if (prevStock) {
      prevStock.textContent = stock > 0 ? `En stock (${stock})` : 'Agotado';
      prevStock.classList.toggle('is-out', stock === 0);
    }
    if (prevJson) {
      prevJson.textContent = JSON.stringify(
        {
          table: 'catalog_items',
          title: name,
          price_pen: Number(price.toFixed(2)),
          stock,
          active: stock > 0,
        },
        null,
        2
      );
    }
  }

  [prodName, prodPrice, prodStock].forEach((el) => {
    if (el) el.addEventListener('input', syncRealtimeCatalog);
  });
  syncRealtimeCatalog();
}

/* ==========================================================================
   5. MINIJUEGO DE PROGRAMACIÓN: BUG SQUASH (4 CARRILES)
   ========================================================================== */
function initMiniGame() {
  const board = document.getElementById('game-board');
  const tokensLayer = document.getElementById('game-tokens-layer');
  const overlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('game-overlay-title');
  const overlayMsg = document.getElementById('game-overlay-msg');
  const overlayBtn = document.getElementById('game-overlay-btn');
  const startBtn = document.getElementById('game-start-btn');
  const restartBtn = document.getElementById('game-restart-btn');
  const scoreEl = document.getElementById('game-score');
  const streakEl = document.getElementById('game-streak');
  const livesEl = document.getElementById('game-lives');
  const bestEl = document.getElementById('game-best');
  const padBtns = Array.from(document.querySelectorAll('[data-hit-lane]'));

  if (!board || !tokensLayer) return null;

  const BUG_LABELS = ['ERR', 'NaN', '404', 'NULL', 'BUG'];
  const CLEAN_LABELS = ['OK', 'PASS', 'SYNC'];
  const PATCH_LABELS = ['FIX+'];

  let bestScore = 0;
  try {
    bestScore = Number(localStorage.getItem(STORAGE_BEST_SCORE_KEY)) || 0;
  } catch {
    bestScore = 0;
  }

  let running = false;
  let score = 0;
  let streak = 0;
  let lives = 3;
  let spawnTimer = 0;
  let lastTime = 0;
  let rafId = 0;
  let tokenIdCounter = 1;
  let tokens = [];

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (streakEl) streakEl.textContent = String(streak);
    if (livesEl) livesEl.textContent = `${lives} / 3`;
    if (bestEl) bestEl.textContent = String(bestScore);
  }

  function saveBest() {
    if (score > bestScore) {
      bestScore = score;
      try {
        localStorage.setItem(STORAGE_BEST_SCORE_KEY, String(bestScore));
      } catch {
        // Ignorar
      }
    }
  }

  function clearTokens() {
    tokens.forEach((t) => t.el.remove());
    tokens = [];
  }

  function flashPad(lane) {
    const btn = padBtns.find((b) => Number(b.getAttribute('data-hit-lane')) === lane);
    if (!btn) return;
    btn.classList.add('is-flash');
    window.setTimeout(() => btn.classList.remove('is-flash'), 120);
  }

  function removeToken(tokenObj) {
    tokenObj.el.remove();
    tokens = tokens.filter((t) => t.id !== tokenObj.id);
  }

  function handleTokenHit(tokenObj) {
    if (!running) return;
    if (tokenObj.type === 'bug') {
      streak += 1;
      score += 10 + Math.min(streak, 10) * 2;
      saveBest();
    } else if (tokenObj.type === 'patch') {
      streak += 1;
      score += 25;
      if (lives < 3) lives += 1;
      saveBest();
    } else {
      // Clic en código limpio verde penaliza racha
      streak = 0;
      score = Math.max(0, score - 5);
    }
    removeToken(tokenObj);
    syncHud();
  }

  function hitLane(lane) {
    if (!running) return;
    flashPad(lane);

    // Priorizar el bug o patch más cercano a la línea de producción en ese carril
    const candidates = tokens
      .filter((t) => t.lane === lane && (t.type === 'bug' || t.type === 'patch'))
      .sort((a, b) => b.y - a.y);

    if (candidates.length > 0) {
      handleTokenHit(candidates[0]);
      return;
    }

    // Si el jugador dispara en un carril donde solo hay código limpio cercano
    const clean = tokens.filter((t) => t.lane === lane && t.type === 'clean').sort((a, b) => b.y - a.y);
    if (clean.length > 0) {
      handleTokenHit(clean[0]);
    }
  }

  function spawnToken() {
    const lane = Math.floor(Math.random() * 4);
    const roll = Math.random();
    let type = 'bug';
    let label = BUG_LABELS[Math.floor(Math.random() * BUG_LABELS.length)];

    if (roll > 0.74 && roll <= 0.92) {
      type = 'clean';
      label = CLEAN_LABELS[Math.floor(Math.random() * CLEAN_LABELS.length)];
    } else if (roll > 0.92) {
      type = 'patch';
      label = PATCH_LABELS[0];
    }

    const el = document.createElement('button');
    el.type = 'button';
    el.className = `code-token is-${type}`;
    el.textContent = label;
    el.style.left = `${lane * 25}%`;
    el.style.top = '-42px';

    const tokenObj = {
      id: tokenIdCounter++,
      lane,
      type,
      y: -42,
      speed: 74 + Math.min(score * 0.45, 95) + Math.random() * 20,
      el,
    };

    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      handleTokenHit(tokenObj);
    });

    tokensLayer.appendChild(el);
    tokens.push(tokenObj);
  }

  function endGame() {
    running = false;
    cancelAnimationFrame(rafId);
    saveBest();
    syncHud();

    if (overlayTitle) overlayTitle.textContent = 'Build detenido · Fin de partida';
    if (overlayMsg) {
      overlayMsg.textContent = `Lograste ${score} puntos (Récord: ${bestScore}). ¿Listo para otro deploy limpio?`;
    }
    if (overlayBtn) overlayBtn.textContent = 'Jugar de nuevo';
    if (overlay) overlay.hidden = false;
    if (startBtn) startBtn.hidden = true;
    if (restartBtn) restartBtn.hidden = false;
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTime) lastTime = ts;
    const dt = Math.min((ts - lastTime) / 1000, 0.06);
    lastTime = ts;

    const boardH = board.clientHeight - 30;
    const spawnInterval = Math.max(0.48, 1.15 - score * 0.0025);
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnToken();
    }

    const toRemove = [];
    tokens.forEach((t) => {
      t.y += t.speed * dt;
      t.el.style.top = `${Math.round(t.y)}px`;

      if (t.y + 38 >= boardH) {
        toRemove.push(t);
        if (t.type === 'bug') {
          lives -= 1;
          streak = 0;
        } else if (t.type === 'clean') {
          score += 5;
          saveBest();
        }
      }
    });

    if (toRemove.length > 0) {
      toRemove.forEach(removeToken);
      syncHud();
      if (lives <= 0) {
        endGame();
        return;
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  function startGame() {
    clearTokens();
    score = 0;
    streak = 0;
    lives = 3;
    spawnTimer = 0.7;
    lastTime = 0;
    running = true;
    syncHud();

    if (overlay) overlay.hidden = true;
    if (startBtn) startBtn.hidden = true;
    if (restartBtn) restartBtn.hidden = false;

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    if (overlayTitle) overlayTitle.textContent = 'Partida en pausa';
    if (overlayMsg) overlayMsg.textContent = `Puntuación actual: ${score} pts · Builds restantes: ${lives}/3.`;
    if (overlayBtn) overlayBtn.textContent = 'Continuar';
    if (overlay) overlay.hidden = false;
  }

  function resumeOrStart() {
    if (lives <= 0 || score === 0) {
      startGame();
      return;
    }
    running = true;
    lastTime = 0;
    if (overlay) overlay.hidden = true;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  if (startBtn) startBtn.addEventListener('click', startGame);
  if (restartBtn) restartBtn.addEventListener('click', startGame);
  if (overlayBtn) overlayBtn.addEventListener('click', resumeOrStart);

  padBtns.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      hitLane(Number(btn.getAttribute('data-hit-lane')));
    });
  });

  document.addEventListener('keydown', (e) => {
    if (state.openWindowId !== 'win-minijuego' || !running) return;
    if (['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      hitLane(Number(e.key) - 1);
    }
  });

  syncHud();
  return { pause: pauseGame, start: startGame };
}

/* ==========================================================================
   MODALES <dialog> DE PROYECTOS
   ========================================================================== */
function initProjectModals() {
  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const dialogId = trigger.getAttribute('data-modal');
      const dialog = dialogId ? document.getElementById(dialogId) : null;
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  });

  document.querySelectorAll('dialog.project-dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-close-modal]')) {
        dialog.close();
      }
    });
  });
}

/* ==========================================================================
   6. CONTACTO: COPIAR CORREO + FORMSUBMIT CON VALIDACIONES
   ========================================================================== */
function initContactForm() {
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('arodriguezr1020@gmail.com');
        showToast('Correo arodriguezr1020@gmail.com copiado.');
      } catch {
        showToast('Correo: arodriguezr1020@gmail.com');
      }
    });
  }

  const form = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const subjectInput = document.getElementById('contact-subject');
  const messageInput = document.getElementById('contact-message');
  const charCount = document.getElementById('message-char-count');
  const submitBtn = document.getElementById('contact-submit-btn');
  const feedback = document.getElementById('form-feedback');

  if (!form || !nameInput || !emailInput || !subjectInput || !messageInput) return;

  const setError = (id, msg) => {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  };

  messageInput.addEventListener('input', () => {
    if (charCount) charCount.textContent = `${messageInput.value.length} / 1000`;
  });

  function validateForm() {
    let valid = true;
    setError('error-name', '');
    setError('error-email', '');
    setError('error-subject', '');
    setError('error-message', '');

    if (nameInput.value.trim().length < 2) {
      setError('error-name', 'Ingresa tu nombre (mínimo 2 caracteres).');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      setError('error-email', 'Ingresa un correo electrónico válido.');
      valid = false;
    }

    if (subjectInput.value.trim().length < 3) {
      setError('error-subject', 'Indica un asunto breve para tu consulta.');
      valid = false;
    }

    if (messageInput.value.trim().length < 10) {
      setError('error-message', 'Cuéntame un poco más (mínimo 10 caracteres).');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando mensaje...';
    }
    if (feedback) feedback.hidden = true;

    const formData = new FormData(form);
    const hiddenSubject = document.getElementById('form-hidden-subject');
    if (hiddenSubject) {
      formData.set('_subject', `${subjectInput.value.trim()} — Pxul.dev`);
    }

    try {
      const response = await fetch('https://formsubmit.co/ajax/arodriguezr1020@gmail.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      if (!response.ok) throw new Error('Error de envío');

      if (feedback) {
        feedback.className = 'form-feedback is-success';
        feedback.textContent = 'Mensaje enviado correctamente. Te responderé pronto a tu correo.';
        feedback.hidden = false;
      }
      form.reset();
      if (charCount) charCount.textContent = '0 / 1000';
      showToast('Mensaje enviado con éxito.');
    } catch {
      if (feedback) {
        feedback.className = 'form-feedback is-error';
        feedback.textContent =
          'No se pudo enviar automáticamente. Puedes escribir directamente a arodriguezr1020@gmail.com.';
        feedback.hidden = false;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar mensaje';
      }
    }
  });
}

/* ==========================================================================
   INICIALIZACIÓN GENERAL
   ========================================================================== */
function bootstrap() {
  let savedTheme = 'dark';
  let savedMode = '3d';

  try {
    const storedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      savedTheme = storedTheme;
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      savedTheme = 'light';
    }

    const storedMode = localStorage.getItem(STORAGE_MODE_KEY);
    if (storedMode === 'lite' || storedMode === '3d') {
      savedMode = storedMode;
    }
  } catch {
    // Usar valores predeterminados
  }

  applyTheme(savedTheme, false);
  initNavigationAndDock();
  initTypewriter();
  initFolderExplorer();
  initAboutWorkspace();
  initServicesInteractive();
  initTechLab();
  state.gameController = initMiniGame();
  initProjectModals();
  initContactForm();

  // En pantallas muy pequeñas con preferencia de movimiento reducido, iniciar en 2D ligero salvo elección previa
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preferLiteAuto = savedMode === 'lite' || (reducedMotion && window.innerWidth < 640);
  setRenderMode(preferLiteAuto ? 'lite' : '3d', false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
