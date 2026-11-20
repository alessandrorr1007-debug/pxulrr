import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Pxul.dev (FOLDER) — Estudio Tecnológico 3D Completo
 * Habitación arquitectónica cerrada (paredes, ventana exterior, piso de madera,
 * estantería, planta, parlantes, taza con vapor animado) + 7 objetos interactivos:
 * Monitor (Proyectos FOLDER), Laptop (Sobre Mí), Tablet (Servicios),
 * Buzón (Contacto), Servidor (Laboratorio), Consola (Minijuego), Lámpara (Tema).
 */

const CAMERA_PRESETS = {
  inicio: {
    pos: [3.95, 2.58, 4.15],
    target: [0.0, 1.15, -0.35],
  },
  proyectos: {
    pos: [0.04, 1.62, 1.48],
    target: [0.0, 1.50, -0.68],
  },
  'sobre-mi': {
    pos: [-1.95, 1.72, 1.62],
    target: [-1.26, 1.06, -0.18],
  },
  servicios: {
    pos: [1.85, 1.66, 1.82],
    target: [1.05, 1.02, 0.24],
  },
  contacto: {
    pos: [-1.25, 1.56, 2.18],
    target: [-1.02, 1.04, 0.56],
  },
  laboratorio: {
    pos: [2.42, 1.78, 1.68],
    target: [1.56, 1.28, -0.45],
  },
  minijuego: {
    pos: [0.42, 1.56, 2.02],
    target: [0.16, 1.04, 0.42],
  },
};

const STATION_META = {
  proyectos: {
    title: 'Monitor · Explorador FOLDER',
    action: 'Abrir carpetas y proyectos',
    anchorOffset: [0, 0.98, 0.08],
  },
  'sobre-mi': {
    title: 'Laptop · Sobre Mí',
    action: 'Perfil, trayectoria y terminal',
    anchorOffset: [0, 0.54, 0],
  },
  servicios: {
    title: 'Tablet · Servicios',
    action: 'Explorar 8 soluciones',
    anchorOffset: [0, 0.46, 0],
  },
  contacto: {
    title: 'Buzón · Contacto',
    action: 'Enviar mensaje directo',
    anchorOffset: [0, 0.44, 0],
  },
  laboratorio: {
    title: 'Servidor · Laboratorio Tech',
    action: 'Abrir sandbox interactivo',
    anchorOffset: [0, 0.94, 0],
  },
  minijuego: {
    title: 'Consola · Bug Squash',
    action: 'Jugar minijuego de código',
    anchorOffset: [0, 0.42, 0],
  },
  tema: {
    title: 'Lámpara de Estudio',
    action: 'Cambiar modo Claro / Oscuro',
    anchorOffset: [0, 1.05, 0.1],
  },
};

const THEME_PALETTES = {
  dark: {
    bg: 0x070d1a,
    fog: 0x070d1a,
    fogDensity: 0.022,
    keyColor: 0xffe8c7,
    keyIntensity: 1.85,
    hemiSky: 0x7dd3fc,
    hemiGround: 0x1e293b,
    hemiIntensity: 0.72,
    windowLightColor: 0x38bdf8,
    windowLightIntensity: 1.55,
    lampIntensity: 5.2,
    lampColor: 0xffd599,
    bulbEmissive: 0xffcf82,
    bulbIntensity: 3.1,
    coveEmissive: 0x38bdf8,
    coveIntensity: 1.65,
    wallMain: 0x121b2e,
    wallSide: 0x0e1627,
    slatWood: 0x3b2a1e,
    deskWood: 0x3d2c20,
    floorTint: 0x9aa4b5,
    rugColor: 0x131d31,
    skyTop: '#061024',
    skyBottom: '#142c54',
    windowStars: true,
    envIntensity: 0.72,
  },
  light: {
    bg: 0xdbe6f2,
    fog: 0xdbe6f2,
    fogDensity: 0.015,
    keyColor: 0xfff6e5,
    keyIntensity: 2.45,
    hemiSky: 0xf8fbff,
    hemiGround: 0xc2b5a3,
    hemiIntensity: 1.25,
    windowLightColor: 0xfff5e0,
    windowLightIntensity: 2.2,
    lampIntensity: 1.6,
    lampColor: 0xffe8bf,
    bulbEmissive: 0xfff4d9,
    bulbIntensity: 1.0,
    coveEmissive: 0x0284c7,
    coveIntensity: 0.65,
    wallMain: 0xeaf0f7,
    wallSide: 0xdfe8f2,
    slatWood: 0x9e7552,
    deskWood: 0x8d6748,
    floorTint: 0xffffff,
    rugColor: 0x334155,
    skyTop: '#7cc4f8',
    skyBottom: '#e8f4fd',
    windowStars: false,
    envIntensity: 1.0,
  },
};

const _v3A = new THREE.Vector3();
const _colorTarget = new THREE.Color();

function detectSoftwareWebGL() {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return { supported: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

function finalizeColorTexture(canvas, maxAnisotropy, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

/* ==========================================================================
   TEXTURAS PROCEDURALES DEL ESTUDIO Y PANTALLAS
   ========================================================================== */

function createWoodFloorTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#5c4636';
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 64;
  for (let row = 0; row < 8; row++) {
    const y = row * plankH;
    const offset = (row % 2) * 128;
    for (let col = -1; col < 3; col++) {
      const x = col * 256 + offset;
      const shade = ((row * 7 + col * 13) % 16) - 8;
      ctx.fillStyle = `rgb(${108 + shade}, ${82 + shade}, ${62 + shade})`;
      ctx.fillRect(x + 1, y + 1, 254, plankH - 2);

      // Vetas suaves de madera
      ctx.strokeStyle = 'rgba(35, 22, 12, 0.14)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 8 + g * 9);
        ctx.bezierCurveTo(x + 80, y + 6 + g * 9, x + 170, y + 12 + g * 9, x + 250, y + 8 + g * 9);
        ctx.stroke();
      }
    }
  }

  return finalizeColorTexture(c, maxAnisotropy, 3, 3);
}

function createWindowBackdropTexture(theme, maxAnisotropy) {
  const pal = THEME_PALETTES[theme] || THEME_PALETTES.dark;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  if (pal.windowStars) {
    // Estrellas sutiles y luna/resplandor nocturno
    ctx.fillStyle = 'rgba(224, 242, 254, 0.8)';
    for (let i = 0; i < 42; i++) {
      const sx = (i * 97) % 500 + 6;
      const sy = (i * 53) % 240 + 14;
      const r = (i % 3 === 0) ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const moon = ctx.createRadialGradient(380, 110, 6, 380, 110, 82);
    moon.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
    moon.addColorStop(0.3, 'rgba(56, 189, 248, 0.35)');
    moon.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = moon;
    ctx.fillRect(290, 20, 180, 180);
  } else {
    // Nubes suaves de día
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    [[120, 130, 64], [170, 124, 48], [340, 160, 58], [390, 155, 42]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Horizonte urbano suave al fondo
  ctx.fillStyle = pal.windowStars ? '#0a1529' : '#9ab4cf';
  const buildings = [
    [0, 340, 72, 172], [68, 300, 66, 212], [130, 355, 84, 157],
    [210, 278, 76, 234], [282, 330, 90, 182], [368, 295, 74, 217], [438, 345, 76, 167],
  ];
  buildings.forEach(([bx, by, bw, bh]) => {
    ctx.fillRect(bx, by, bw, bh);
    if (pal.windowStars) {
      ctx.fillStyle = 'rgba(253, 224, 139, 0.55)';
      for (let wy = by + 16; wy < 492; wy += 24) {
        for (let wx = bx + 12; wx < bx + bw - 14; wx += 18) {
          if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 7, 10);
        }
      }
      ctx.fillStyle = '#0a1529';
    }
  });

  return finalizeColorTexture(c, maxAnisotropy);
}

function createMonitorScreenTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1024, 512);
  grad.addColorStop(0, '#070f20');
  grad.addColorStop(1, '#0d1d38');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = '#0c162b';
  ctx.fillRect(0, 0, 1024, 34);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 14px monospace';
  ctx.fillText('<Pxul.dev />', 18, 22);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px monospace';
  ctx.fillText('pxul.dev / proyectos / todos', 150, 22);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(34, 52, 956, 420, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#111d36';
  ctx.beginPath();
  ctx.roundRect(34, 52, 956, 42, [14, 14, 0, 0]);
  ctx.fill();
  ['#ef4444', '#f59e0b', '#22c55e'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(60 + i * 18, 73, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 13px monospace';
  ctx.fillText('FOLDER — Explorador de Proyectos (3 publicados)', 130, 78);

  // Sidebar carpetas
  ctx.fillStyle = 'rgba(8, 15, 30, 0.92)';
  ctx.fillRect(36, 94, 198, 376);
  const folders = [
    ['todos/', '3', true],
    ['android/', '1', false],
    ['web-pwa/', '1', false],
    ['fullstack/', '1', false],
  ];
  folders.forEach(([name, count, active], idx) => {
    const y = 126 + idx * 46;
    if (active) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.roundRect(48, y - 18, 174, 34, 8);
      ctx.fill();
    }
    ctx.fillStyle = active ? '#38bdf8' : '#94a3b8';
    ctx.font = '600 14px monospace';
    ctx.fillText(name, 64, y + 4);
    ctx.fillStyle = '#64748b';
    ctx.fillText(count, 200, y + 4);
  });

  const cards = [
    { title: 'UPAO S', sub: 'Kotlin · Compose · M3', accent: '#38bdf8', tag: 'Android' },
    { title: 'Armador Horarios', sub: 'JS · Web Workers · PWA', accent: '#60a5fa', tag: 'Web PWA' },
    { title: 'PremiumPe', sub: 'React · Vite · Supabase', accent: '#818cf8', tag: 'Full Stack' },
  ];
  cards.forEach((card, i) => {
    const x = 256 + i * 240;
    const y = 118;
    ctx.fillStyle = '#0c162b';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, 224, 320, 12);
    ctx.fill();
    ctx.stroke();

    const pGrad = ctx.createLinearGradient(x, y, x + 224, y + 150);
    pGrad.addColorStop(0, '#102447');
    pGrad.addColorStop(1, '#081326');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 12, 200, 148, 8);
    ctx.fill();

    ctx.fillStyle = card.accent;
    ctx.fillRect(x + 26, y + 32, 74, 8);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.fillRect(x + 26, y + 52, 164, 6);
    ctx.fillRect(x + 26, y + 68, 128, 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + 26, y + 90, 80, 48, 6);
    ctx.roundRect(x + 114, y + 90, 82, 48, 6);
    ctx.fill();

    ctx.fillStyle = card.accent;
    ctx.font = '600 12px monospace';
    ctx.fillText(card.tag, x + 16, y + 188);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 18px sans-serif';
    ctx.fillText(card.title, x + 16, y + 218);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px monospace';
    ctx.fillText(card.sub, x + 16, y + 246);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.beginPath();
    ctx.roundRect(x + 16, y + 272, 192, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '600 13px sans-serif';
    ctx.fillText('Explorar ->', x + 70, y + 293);
  });

  return finalizeColorTexture(c, maxAnisotropy);
}

function createLaptopScreenTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 480;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#070e1c';
  ctx.fillRect(0, 0, 768, 480);
  ctx.fillStyle = '#111d36';
  ctx.fillRect(0, 0, 768, 38);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '600 15px monospace';
  ctx.fillText('alessandro_developer.json — Sobre Mí', 22, 24);

  const lines = [
    ['{', '#94a3b8'],
    ['  "desarrollador": "Alessandro Rodríguez",', '#38bdf8'],
    ['  "alias": "Pxul.dev / PX",', '#7dd3fc'],
    ['  "carrera": "Ing. de Sistemas e IA",', '#e2e8f0'],
    ['  "ubicacion": "Trujillo, Perú",', '#e2e8f0'],
    ['  "enfoque": ["Web Full Stack", "Android", "APIs"],', '#60a5fa'],
    ['  "disponible": true', '#4ade80'],
    ['}', '#94a3b8'],
    ['', '#94a3b8'],
    ['pxul@studio:~$ whoami', '#38bdf8'],
    ['> Desarrollador Web & Móvil · +3 años', '#cbd5e1'],
  ];
  ctx.font = '500 19px monospace';
  lines.forEach(([text, color], idx) => {
    ctx.fillStyle = color;
    ctx.fillText(text, 28, 86 + idx * 33);
  });

  return finalizeColorTexture(c, maxAnisotropy);
}

function createTabletScreenTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#081225';
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 20px sans-serif';
  ctx.fillText('Servicios · Soluciones', 28, 46);

  const items = ['Web a Medida', 'Catálogos', 'Android', 'Chatbots', 'Supabase', 'APIs REST'];
  items.forEach((label, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 28 + col * 234;
    const y = 74 + row * 94;
    ctx.fillStyle = '#111e38';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 218, 78, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(label, x + 18, y + 36);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 18, y + 52, 84, 6);
  });

  return finalizeColorTexture(c, maxAnisotropy);
}

function createArcadeScreenTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 288;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#060c18';
  ctx.fillRect(0, 0, 384, 288);

  // 4 carriles de minijuego de código
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.strokeRect(24 + i * 86, 52, 78, 200);
  }

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 16px monospace';
  ctx.fillText('BUG SQUASH · CODE', 24, 34);

  // Bloques cayendo
  const blocks = [
    [30, 86, 'JS', '#0284c7'],
    [116, 138, 'BUG', '#ef4444'],
    [202, 72, 'KT', '#0ea5e9'],
    [288, 166, '404', '#ef4444'],
  ];
  blocks.forEach(([x, y, txt, col]) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(x, y, 66, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px monospace';
    ctx.fillText(txt, x + 16, y + 23);
  });

  return finalizeColorTexture(c, maxAnisotropy);
}

function createPosterTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0c162b';
  ctx.fillRect(0, 0, 384, 512);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 336, 464);

  // Geometría arquitectónica Bauhaus-Tech
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(192, 196, 86, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(72, 260, 240, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 32px monospace';
  ctx.fillText('<PXUL/>', 96, 368);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 16px monospace';
  ctx.fillText('SYSTEMS · AI · WEB', 98, 408);

  return finalizeColorTexture(c, maxAnisotropy);
}

function createKeyboardTexture(maxAnisotropy) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, 512, 192);
  const rows = 5;
  const cols = 14;
  const pad = 10;
  const keyW = (512 - pad * 2) / cols;
  const keyH = (192 - pad * 2) / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (r === 4 && col > 3 && col < 10) continue;
      const isAccent = (r === 0 && col === 0) || (r === 2 && col === 13);
      ctx.fillStyle = isAccent ? '#0284c7' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(pad + col * keyW + 3, pad + r * keyH + 3, keyW - 6, keyH - 6, 5);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#27364f';
  ctx.beginPath();
  ctx.roundRect(pad + 4 * keyW + 3, pad + 4 * keyH + 3, keyW * 6 - 6, keyH - 6, 5);
  ctx.fill();

  return finalizeColorTexture(c, maxAnisotropy);
}

/* ==========================================================================
   CONSTRUCTOR PRINCIPAL DEL ESTUDIO 3D
   ========================================================================== */

export function createStudioScene({
  mountEl,
  initialTheme = 'dark',
  onSelectStation,
  onHoverStation,
  onWebGLFallback,
}) {
  const probe = detectSoftwareWebGL();
  if (!probe.supported || !mountEl) {
    if (onWebGLFallback) onWebGLFallback('WebGL no disponible en este navegador.');
    return null;
  }

  const isSoftwareGl = probe.isSoftwareGl;
  const disposables = { geometries: [], materials: [], textures: [] };
  const trackGeo = (g) => { disposables.geometries.push(g); return g; };
  const trackMat = (m) => { disposables.materials.push(m); return m; };
  const trackTex = (t) => { disposables.textures.push(t); return t; };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
  } catch (err) {
    if (onWebGLFallback) onWebGLFallback(err?.message || 'Error al iniciar WebGL.');
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'studio-webgl-canvas';
  renderer.domElement.setAttribute('aria-label', 'Estudio tecnológico 3D interactivo de Pxul.dev');
  mountEl.innerHTML = '';
  mountEl.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;

  const scene = new THREE.Scene();
  const initialPalette = THEME_PALETTES[initialTheme] || THEME_PALETTES.dark;
  scene.background = new THREE.Color(initialPalette.bg);
  scene.fog = new THREE.FogExp2(initialPalette.fog, initialPalette.fogDensity);

  // RoomEnvironment PBR obligatorio
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = initialPalette.envIntensity;
  pmrem.dispose();
  trackTex(envTex);

  const width = mountEl.clientWidth || window.innerWidth;
  const height = mountEl.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(39, width / height, 0.1, 45);
  camera.position.set(...CAMERA_PRESETS.inicio.pos);
  renderer.setSize(width, height, false);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...CAMERA_PRESETS.inicio.target);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 1.65;
  controls.maxDistance = 6.8;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI / 2 - 0.08;
  controls.minAzimuthAngle = -0.25;
  controls.maxAzimuthAngle = Math.PI * 0.48;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;
  controls.update();

  // Rig de iluminación cálido/frío de estudio interior
  const hemiLight = new THREE.HemisphereLight(
    initialPalette.hemiSky,
    initialPalette.hemiGround,
    initialPalette.hemiIntensity
  );
  hemiLight.position.set(0, 6, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(initialPalette.keyColor, initialPalette.keyIntensity);
  keyLight.position.set(3.8, 5.4, 4.2);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 16;
  const sb = 4.6;
  keyLight.shadow.camera.left = -sb;
  keyLight.shadow.camera.right = sb;
  keyLight.shadow.camera.top = sb;
  keyLight.shadow.camera.bottom = -sb;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Luz proveniente de la ventana lateral izquierda
  const windowLight = new THREE.DirectionalLight(
    initialPalette.windowLightColor,
    initialPalette.windowLightIntensity
  );
  windowLight.position.set(-4.2, 2.8, 0.4);
  scene.add(windowLight);

  // Lámpara cálida sobre el escritorio
  const lampLight = new THREE.PointLight(
    initialPalette.lampColor,
    initialPalette.lampIntensity,
    7.2,
    1.8
  );
  lampLight.position.set(1.92, 1.88, -0.78);
  scene.add(lampLight);

  /* ========================================================================
     MATERIALES PBR ARQUITECTÓNICOS
     ======================================================================== */
  const woodFloorTex = trackTex(createWoodFloorTexture(maxAnisotropy));
  const floorMat = trackMat(new THREE.MeshStandardMaterial({
    map: woodFloorTex,
    color: initialPalette.floorTint,
    roughness: 0.72,
    metalness: 0.04,
  }));

  const rugMat = trackMat(new THREE.MeshStandardMaterial({
    color: initialPalette.rugColor,
    roughness: 0.96,
    metalness: 0.0,
  }));

  const wallMainMat = trackMat(new THREE.MeshStandardMaterial({
    color: initialPalette.wallMain,
    roughness: 0.88,
    metalness: 0.02,
  }));

  const wallSideMat = trackMat(new THREE.MeshStandardMaterial({
    color: initialPalette.wallSide,
    roughness: 0.88,
    metalness: 0.02,
  }));

  const slatWoodMat = trackMat(new THREE.MeshStandardMaterial({
    color: initialPalette.slatWood,
    roughness: 0.58,
    metalness: 0.05,
  }));

  const deskWoodMat = trackMat(new THREE.MeshStandardMaterial({
    color: initialPalette.deskWood,
    roughness: 0.48,
    metalness: 0.08,
  }));

  const darkMetalMat = trackMat(new THREE.MeshStandardMaterial({
    color: 0x162033,
    roughness: 0.34,
    metalness: 0.85,
  }));

  const brushedAlumMat = trackMat(new THREE.MeshPhysicalMaterial({
    color: 0xc2cfde,
    roughness: 0.22,
    metalness: 0.92,
    clearcoat: 0.25,
  }));

  const matteChassisMat = trackMat(new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.62,
    metalness: 0.32,
  }));

  const accentBlueMat = trackMat(new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.9,
    roughness: 0.22,
    metalness: 0.4,
  }));

  const coveMat = trackMat(new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: initialPalette.coveEmissive,
    emissiveIntensity: initialPalette.coveIntensity,
    roughness: 0.18,
    metalness: 0.1,
  }));

  const bulbMat = trackMat(new THREE.MeshStandardMaterial({
    color: 0xfff7e6,
    emissive: initialPalette.bulbEmissive,
    emissiveIntensity: initialPalette.bulbIntensity,
    roughness: 0.14,
  }));

  const glassMat = trackMat(new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: isSoftwareGl ? 0.3 : 0.24,
    depthWrite: false,
    clearcoat: 1.0,
  }));

  /* ========================================================================
     1. HABITACIÓN ARQUITECTÓNICA (PISO, PAREDES, VENTANA, DECORACIÓN)
     ======================================================================== */
  const roomGroup = new THREE.Group();

  // Piso de madera cálida (6.6 x 6.0)
  const floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.8, 0.12, 6.2)), floorMat);
  floor.position.set(0.2, -0.06, 0.4);
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // Alfombra tejida debajo del escritorio (offset +0.015 sin Z-fighting)
  const rug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.9, 0.022, 3.0)), rugMat);
  rug.position.set(0.05, 0.011, 0.28);
  rug.receiveShadow = true;
  roomGroup.add(rug);

  // Pared trasera (z = -1.78)
  const backWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.8, 3.8, 0.18)), wallMainMat);
  backWall.position.set(0.2, 1.9, -1.78);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  // Zócalos arquitectónicos
  const baseboardBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.6, 0.12, 0.04)), darkMetalMat);
  baseboardBack.position.set(0.2, 0.06, -1.68);
  roomGroup.add(baseboardBack);

  const baseboardLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.04, 0.12, 6.1)), darkMetalMat);
  baseboardLeft.position.set(-3.12, 0.06, 0.4);
  roomGroup.add(baseboardLeft);

  // Panel acústico de listones de madera detrás del monitor (InstancedMesh)
  const slatCount = 24;
  const slatGeo = trackGeo(new THREE.BoxGeometry(0.06, 3.25, 0.045));
  const slats = new THREE.InstancedMesh(slatGeo, slatWoodMat, slatCount);
  const _dummy = new THREE.Object3D();
  for (let i = 0; i < slatCount; i++) {
    _dummy.position.set(-1.35 + i * 0.118, 1.72, -1.67);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    slats.setMatrixAt(i, _dummy.matrix);
  }
  slats.instanceMatrix.needsUpdate = true;
  slats.castShadow = true;
  slats.receiveShadow = true;
  slats.computeBoundingSphere();
  roomGroup.add(slats);

  // Tira de luz ambiental superior detrás de los listones
  const wallCove = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.85, 0.032, 0.03)), coveMat);
  wallCove.position.set(0.0, 3.34, -1.66);
  roomGroup.add(wallCove);

  // Pared lateral izquierda con ventana panorámica empotrada (x = -3.2)
  const leftWallBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 3.8, 1.55)), wallSideMat);
  leftWallBack.position.set(-3.2, 1.9, -0.95);
  leftWallBack.receiveShadow = true;
  roomGroup.add(leftWallBack);

  const leftWallFront = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 3.8, 1.85)), wallSideMat);
  leftWallFront.position.set(-3.2, 1.9, 2.55);
  leftWallFront.receiveShadow = true;
  roomGroup.add(leftWallFront);

  const leftWallBottom = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 1.05, 1.85)), wallSideMat);
  leftWallBottom.position.set(-3.2, 0.525, 0.72);
  leftWallBottom.receiveShadow = true;
  roomGroup.add(leftWallBottom);

  const leftWallTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.75, 1.85)), wallSideMat);
  leftWallTop.position.set(-3.2, 3.425, 0.72);
  roomGroup.add(leftWallTop);

  // Marco de ventana + alféizar + vista exterior (cielo/ciudad dinámica)
  const windowSill = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.055, 1.92)), deskWoodMat);
  windowSill.position.set(-3.12, 1.06, 0.72);
  windowSill.castShadow = true;
  roomGroup.add(windowSill);

  const mullionV = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 2.02, 0.05)), darkMetalMat);
  mullionV.position.set(-3.18, 2.05, 0.72);
  roomGroup.add(mullionV);

  const mullionH = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.05, 1.85)), darkMetalMat);
  mullionH.position.set(-3.18, 2.08, 0.72);
  roomGroup.add(mullionH);

  const skyDarkTex = trackTex(createWindowBackdropTexture('dark', maxAnisotropy));
  const skyLightTex = trackTex(createWindowBackdropTexture('light', maxAnisotropy));
  const windowSkyMat = trackMat(new THREE.MeshBasicMaterial({
    map: initialTheme === 'light' ? skyLightTex : skyDarkTex,
  }));
  const windowSky = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.9, 2.1)), windowSkyMat);
  windowSky.rotation.y = Math.PI / 2;
  windowSky.position.set(-3.36, 2.05, 0.72);
  roomGroup.add(windowSky);

  // Estantería flotante superior izquierda + libros + planta decorativa
  const shelf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.38, 0.05, 0.28)), deskWoodMat);
  shelf.position.set(-2.15, 2.38, -1.56);
  shelf.castShadow = true;
  roomGroup.add(shelf);

  const bookColors = [0x0284c7, 0x1e293b, 0x38bdf8, 0xc2410c, 0x334155];
  bookColors.forEach((col, i) => {
    const h = 0.26 + (i % 3) * 0.04;
    const book = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.055, h, 0.2)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 }))
    );
    book.position.set(-2.65 + i * 0.068, 2.405 + h / 2, -1.56);
    book.castShadow = true;
    roomGroup.add(book);
  });

  // Planta en maceta cerámica sobre el estante
  const potMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 }));
  const leafMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 }));
  const pot = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.085, 0.065, 0.14, 16)), potMat);
  pot.position.set(-1.72, 2.475, -1.55);
  roomGroup.add(pot);
  for (let l = 0; l < 5; l++) {
    const angle = (l / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.045, 0.18, 6)), leafMat);
    leaf.position.set(-1.72 + Math.cos(angle) * 0.04, 2.59, -1.55 + Math.sin(angle) * 0.04);
    leaf.rotation.z = Math.cos(angle) * 0.45;
    leaf.rotation.x = Math.sin(angle) * 0.45;
    roomGroup.add(leaf);
  }

  // Cuadro arquitectónico en la pared trasera derecha
  const frameOuter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.98, 0.04)), darkMetalMat);
  frameOuter.position.set(2.38, 2.25, -1.68);
  frameOuter.castShadow = true;
  roomGroup.add(frameOuter);

  const posterTex = trackTex(createPosterTexture(maxAnisotropy));
  const posterMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.68, 0.9)),
    trackMat(new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.4 }))
  );
  posterMesh.position.set(2.38, 2.25, -1.656);
  roomGroup.add(posterMesh);

  // Planta alta en esquina izquierda junto a la ventana
  const floorPot = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.16, 0.38, 18)), potMat);
  floorPot.position.set(-2.66, 0.19, -1.16);
  floorPot.castShadow = true;
  roomGroup.add(floorPot);
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2;
    const stem = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.09, 0.56, 7)), leafMat);
    stem.position.set(-2.66 + Math.cos(a) * 0.09, 0.56 + (b % 2) * 0.08, -1.16 + Math.sin(a) * 0.09);
    stem.rotation.z = -Math.cos(a) * 0.35;
    stem.rotation.x = Math.sin(a) * 0.35;
    roomGroup.add(stem);
  }

  scene.add(roomGroup);

  /* ========================================================================
     2. ESCRITORIO PRINCIPAL + PARLANTES DE ESTUDIO + TAZA CON VAPOR
     ======================================================================== */
  const deskGroup = new THREE.Group();
  const DESK_TOP_Y = 0.80;

  const deskSlab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.45, 0.08, 1.88)), deskWoodMat);
  deskSlab.position.set(0.05, DESK_TOP_Y - 0.04, -0.18);
  deskSlab.castShadow = true;
  deskSlab.receiveShadow = true;
  deskGroup.add(deskSlab);

  const deskFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.15, 0.045, 1.6)), darkMetalMat);
  deskFrame.position.set(0.05, DESK_TOP_Y - 0.095, -0.18);
  deskGroup.add(deskFrame);

  const legGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.72, 0.08));
  [[-1.95, 0.36, -0.92], [2.05, 0.36, -0.92], [-1.95, 0.36, 0.56], [2.05, 0.36, 0.56]].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, darkMetalMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    deskGroup.add(leg);
  });

  // Tapete de escritorio (offset +0.01)
  const deskMat = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.15, 0.012, 0.86)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92 }))
  );
  deskMat.position.set(0.02, DESK_TOP_Y + 0.006, 0.14);
  deskMat.receiveShadow = true;
  deskGroup.add(deskMat);

  // Tira LED trasera del escritorio
  const deskLed = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 0.024, 0.02)), coveMat);
  deskLed.position.set(0.05, DESK_TOP_Y - 0.02, -1.13);
  deskGroup.add(deskLed);

  // Par de parlantes de estudio (decoración realista en el escritorio)
  [-1.08, 1.08].forEach((sx) => {
    const spk = new THREE.Group();
    spk.position.set(sx, DESK_TOP_Y, -0.78);
    spk.rotation.y = sx < 0 ? 0.22 : -0.22;
    const box = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.32, 0.22)), matteChassisMat);
    box.position.y = 0.16;
    box.castShadow = true;
    spk.add(box);
    const woofer = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.058, 0.058, 0.016, 18)), darkMetalMat);
    woofer.rotation.x = Math.PI / 2;
    woofer.position.set(0, 0.12, 0.11);
    spk.add(woofer);
    const tweeter = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 16)), accentBlueMat);
    tweeter.rotation.x = Math.PI / 2;
    tweeter.position.set(0, 0.24, 0.11);
    spk.add(tweeter);
    deskGroup.add(spk);
  });

  // Teclado minimalista decorativo frente al monitor
  const kbTex = trackTex(createKeyboardTexture(maxAnisotropy));
  const kbBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.026, 0.26)), darkMetalMat);
  kbBase.position.set(-0.28, DESK_TOP_Y + 0.024, 0.12);
  kbBase.rotation.x = 0.06;
  deskGroup.add(kbBase);
  const kbTop = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.7, 0.22)),
    trackMat(new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.65 }))
  );
  kbTop.rotation.x = -Math.PI / 2 + 0.06;
  kbTop.position.set(-0.28, DESK_TOP_Y + 0.039, 0.12);
  deskGroup.add(kbTop);

  // Taza de café cerámica con partículas de vapor animado
  const mugGroup = new THREE.Group();
  mugGroup.position.set(-0.62, DESK_TOP_Y, 0.44);
  const mugBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.058, 0.052, 0.11, 18)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.28 }))
  );
  mugBody.position.y = 0.055;
  mugBody.castShadow = true;
  mugGroup.add(mugBody);
  const mugCoffee = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.048, 16)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x3b1f12, roughness: 0.2 }))
  );
  mugCoffee.rotation.x = -Math.PI / 2;
  mugCoffee.position.y = 0.106;
  mugGroup.add(mugCoffee);
  const mugHandle = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.032, 0.008, 8, 16, Math.PI)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.28 }))
  );
  mugHandle.rotation.z = -Math.PI / 2;
  mugHandle.position.set(0.056, 0.056, 0);
  mugGroup.add(mugHandle);

  const steamPuffs = [];
  const steamGeo = trackGeo(new THREE.SphereGeometry(0.018, 8, 8));
  for (let s = 0; s < 3; s++) {
    const sm = trackMat(new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }));
    const puff = new THREE.Mesh(steamGeo, sm);
    puff.position.set(0, 0.14 + s * 0.07, 0);
    mugGroup.add(puff);
    steamPuffs.push({ mesh: puff, mat: sm, phase: s * 2.1 });
  }
  deskGroup.add(mugGroup);

  scene.add(deskGroup);

  /* ========================================================================
     UTILIDAD PARA REGISTRAR LOS 7 OBJETOS INTERACTIVOS REALES
     ======================================================================== */
  const stations = new Map();
  const proxyMeshes = [];

  function registerStation(id, group, proxySize, proxyOffset = [0, 0.3, 0]) {
    const baseY = group.position.y;
    const haloGeo = trackGeo(new THREE.RingGeometry(0.11, 0.145, 28));
    const haloMat = trackMat(new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    const hoverHalo = new THREE.Mesh(haloGeo, haloMat);
    hoverHalo.rotation.x = -Math.PI / 2;
    hoverHalo.position.set(0, 0.018, 0);
    hoverHalo.scale.set(proxySize[0] * 3.0, proxySize[2] * 3.0, 1);
    group.add(hoverHalo);

    const proxy = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(proxySize[0], proxySize[1], proxySize[2])),
      trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    proxy.position.set(...proxyOffset);
    proxy.userData.stationId = id;
    group.add(proxy);
    proxyMeshes.push(proxy);

    stations.set(id, {
      id,
      group,
      baseY,
      haloMat,
      hoverAmount: 0,
      anchorOffset: new THREE.Vector3(...(STATION_META[id]?.anchorOffset || [0, 0.5, 0])),
    });
  }

  /* ========================================================================
     OBJETO 1: MONITOR ULTRAWIDE → PROYECTOS (FOLDER)
     ======================================================================== */
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0.0, DESK_TOP_Y, -0.68);

  const monBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.024, 0.32)), brushedAlumMat);
  monBase.position.y = 0.012;
  monBase.castShadow = true;
  monitorGroup.add(monBase);

  const monNeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.44, 0.055)), brushedAlumMat);
  monNeck.position.set(0, 0.23, -0.07);
  monNeck.rotation.x = -0.14;
  monitorGroup.add(monNeck);

  const monChassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.74, 0.86, 0.052)), matteChassisMat);
  monChassis.position.set(0, 0.72, 0);
  monChassis.castShadow = true;
  monitorGroup.add(monChassis);

  const monChin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.74, 0.036, 0.058)), brushedAlumMat);
  monChin.position.set(0, 0.30, 0.002);
  monitorGroup.add(monChin);

  const monScreenTex = trackTex(createMonitorScreenTexture(maxAnisotropy));
  const monScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.66, 0.78)),
    trackMat(new THREE.MeshStandardMaterial({
      map: monScreenTex,
      emissiveMap: monScreenTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.65,
      roughness: 0.14,
    }))
  );
  monScreen.position.set(0, 0.73, 0.028);
  monitorGroup.add(monScreen);

  const monBias = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, 0.024, 0.018)), coveMat);
  monBias.position.set(0, 0.72, -0.032);
  monitorGroup.add(monBias);

  scene.add(monitorGroup);
  registerStation('proyectos', monitorGroup, [1.82, 1.18, 0.46], [0, 0.60, 0]);

  /* ========================================================================
     OBJETO 2: LAPTOP WORKSTATION → SOBRE MÍ
     ======================================================================== */
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(-1.42, DESK_TOP_Y, -0.14);
  laptopGroup.rotation.y = 0.48;

  const lapBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.024, 0.50)), brushedAlumMat);
  lapBase.position.y = 0.012;
  lapBase.castShadow = true;
  laptopGroup.add(lapBase);

  const lapKeys = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.64, 0.24)),
    trackMat(new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.72 }))
  );
  lapKeys.rotation.x = -Math.PI / 2;
  lapKeys.position.set(0, 0.026, -0.05);
  laptopGroup.add(lapKeys);

  const lapTrackpad = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.004, 0.13)), darkMetalMat);
  lapTrackpad.position.set(0, 0.025, 0.15);
  laptopGroup.add(lapTrackpad);

  const lapLidPivot = new THREE.Group();
  lapLidPivot.position.set(0, 0.024, -0.24);
  lapLidPivot.rotation.x = -0.26;

  const lapLid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.46, 0.018)), brushedAlumMat);
  lapLid.position.set(0, 0.23, 0);
  lapLid.castShadow = true;
  lapLidPivot.add(lapLid);

  const lapScreenTex = trackTex(createLaptopScreenTexture(maxAnisotropy));
  const lapScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.69, 0.41)),
    trackMat(new THREE.MeshStandardMaterial({
      map: lapScreenTex,
      emissiveMap: lapScreenTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.58,
      roughness: 0.15,
    }))
  );
  lapScreen.position.set(0, 0.23, 0.011);
  lapLidPivot.add(lapScreen);

  laptopGroup.add(lapLidPivot);
  scene.add(laptopGroup);
  registerStation('sobre-mi', laptopGroup, [0.84, 0.54, 0.62], [0, 0.26, -0.04]);

  /* ========================================================================
     OBJETO 3: TABLET DE PROTOTIPADO → SERVICIOS
     ======================================================================== */
  const tabletGroup = new THREE.Group();
  tabletGroup.position.set(1.12, DESK_TOP_Y, 0.26);
  tabletGroup.rotation.y = -0.36;

  const tabStand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.026, 0.28)), brushedAlumMat);
  tabStand.position.y = 0.013;
  tabStand.castShadow = true;
  tabletGroup.add(tabStand);

  const tabPivot = new THREE.Group();
  tabPivot.position.set(0, 0.026, -0.02);
  tabPivot.rotation.x = -0.34;

  const tabBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.52, 0.37, 0.02)), matteChassisMat);
  tabBody.position.y = 0.185;
  tabBody.castShadow = true;
  tabPivot.add(tabBody);

  const tabTex = trackTex(createTabletScreenTexture(maxAnisotropy));
  const tabScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.47, 0.32)),
    trackMat(new THREE.MeshStandardMaterial({
      map: tabTex,
      emissiveMap: tabTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.58,
      roughness: 0.15,
    }))
  );
  tabScreen.position.set(0, 0.185, 0.012);
  tabPivot.add(tabScreen);
  tabletGroup.add(tabPivot);

  // Stylus de diseño apoyado al frente
  const pen = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 10)), brushedAlumMat);
  pen.rotation.z = Math.PI / 2;
  pen.position.set(0, 0.036, 0.10);
  tabletGroup.add(pen);

  scene.add(tabletGroup);
  registerStation('servicios', tabletGroup, [0.68, 0.44, 0.38], [0, 0.21, 0]);

  /* ========================================================================
     OBJETO 4: BUZÓN DE ESCRITORIO → CONTACTO (con bandera animada)
     ======================================================================== */
  const mailboxGroup = new THREE.Group();
  mailboxGroup.position.set(-1.14, DESK_TOP_Y, 0.48);
  mailboxGroup.rotation.y = 0.36;

  const mbBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.028, 0.44)), darkMetalMat);
  mbBase.position.y = 0.014;
  mbBase.castShadow = true;
  mailboxGroup.add(mbBase);

  const mbBodyMat = trackMat(new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.28,
    metalness: 0.48,
    clearcoat: 0.5,
  }));

  // Cuerpo abovedado del buzón (caja + cilindro superior)
  const mbLower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.17, 0.38)), mbBodyMat);
  mbLower.position.set(0, 0.11, 0);
  mbLower.castShadow = true;
  mailboxGroup.add(mbLower);

  const mbArch = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 22, 1, false, 0, Math.PI)), mbBodyMat);
  mbArch.rotation.x = Math.PI / 2;
  mbArch.rotation.z = Math.PI / 2;
  mbArch.position.set(0, 0.195, 0);
  mbArch.castShadow = true;
  mailboxGroup.add(mbArch);

  // Puerta frontal + ranura de sobres
  const mbDoor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.21, 0.19, 0.016)), brushedAlumMat);
  mbDoor.position.set(0, 0.145, 0.192);
  mailboxGroup.add(mbDoor);

  const mbSlot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.022, 0.02)), matteChassisMat);
  mbSlot.position.set(0, 0.20, 0.198);
  mailboxGroup.add(mbSlot);

  // Sobre blanco sobresaliendo ligeramente
  const envelope = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.12, 0.008, 0.09)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 }))
  );
  envelope.position.set(0, 0.20, 0.225);
  envelope.rotation.x = 0.08;
  mailboxGroup.add(envelope);

  // Bandera articulada lateral animada
  const flagPivot = new THREE.Group();
  flagPivot.position.set(0.132, 0.16, 0.06);
  const flagArm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.014, 0.16, 0.016)), brushedAlumMat);
  flagArm.position.y = 0.08;
  flagPivot.add(flagArm);
  const flagTip = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.016, 0.055, 0.075)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.35, roughness: 0.35 }))
  );
  flagTip.position.set(0, 0.145, -0.032);
  flagPivot.add(flagTip);
  mailboxGroup.add(flagPivot);

  scene.add(mailboxGroup);
  registerStation('contacto', mailboxGroup, [0.44, 0.42, 0.56], [0, 0.20, 0.02]);

  /* ========================================================================
     OBJETO 5: SERVIDOR / RACK MODULAR → LABORATORIO TECNOLÓGICO
     ======================================================================== */
  const serverGroup = new THREE.Group();
  serverGroup.position.set(1.66, DESK_TOP_Y, -0.42);
  serverGroup.rotation.y = -0.28;

  const srvChassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.86, 0.54)), matteChassisMat);
  srvChassis.position.y = 0.45;
  srvChassis.castShadow = true;
  serverGroup.add(srvChassis);

  const srvTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.48, 0.03, 0.56)), brushedAlumMat);
  srvTop.position.y = 0.895;
  serverGroup.add(srvTop);

  // 3 módulos rack frontales con barras de actividad luminosas
  const serverLedBars = [];
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.16, 0.02)), darkMetalMat);
    blade.position.set(0, 0.22 + i * 0.23, 0.272);
    serverGroup.add(blade);

    const ledMat = trackMat(new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
      roughness: 0.2,
    }));
    const ledBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.018, 0.014)), ledMat);
    ledBar.position.set(-0.04, 0.22 + i * 0.23, 0.285);
    serverGroup.add(ledBar);
    serverLedBars.push({ mat: ledMat, phase: i * 1.4 });
  }

  // Ventiladores iluminados visibles por el cristal izquierdo
  const serverFans = [];
  for (let i = 0; i < 3; i++) {
    const fanRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.08, 0.013, 10, 24)), accentBlueMat);
    fanRing.rotation.y = Math.PI / 2;
    fanRing.position.set(-0.232, 0.22 + i * 0.23, 0);
    serverGroup.add(fanRing);
    serverFans.push(fanRing);
  }

  const srvGlass = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.46, 0.74)), glassMat);
  srvGlass.rotation.y = -Math.PI / 2;
  srvGlass.position.set(-0.238, 0.45, 0);
  srvGlass.renderOrder = 3;
  serverGroup.add(srvGlass);

  scene.add(serverGroup);
  registerStation('laboratorio', serverGroup, [0.58, 0.96, 0.64], [0, 0.48, 0]);

  /* ========================================================================
     OBJETO 6: CONSOLA MINI ARCADE → MINIJUEGO DE PROGRAMACIÓN
     ======================================================================== */
  const arcadeGroup = new THREE.Group();
  arcadeGroup.position.set(0.24, DESK_TOP_Y, 0.44);
  arcadeGroup.rotation.y = -0.14;

  const arcBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.14, 0.32)), darkMetalMat);
  arcBase.position.y = 0.07;
  arcBase.castShadow = true;
  arcadeGroup.add(arcBase);

  const arcTower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.28, 0.20)), matteChassisMat);
  arcTower.position.set(0, 0.24, -0.06);
  arcTower.castShadow = true;
  arcadeGroup.add(arcTower);

  const arcMarquee = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.34, 0.045, 0.04)), accentBlueMat);
  arcMarquee.position.set(0, 0.365, 0.042);
  arcadeGroup.add(arcMarquee);

  const arcScreenTex = trackTex(createArcadeScreenTexture(maxAnisotropy));
  const arcScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.29, 0.20)),
    trackMat(new THREE.MeshStandardMaterial({
      map: arcScreenTex,
      emissiveMap: arcScreenTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.72,
      roughness: 0.16,
    }))
  );
  arcScreen.position.set(0, 0.235, 0.045);
  arcScreen.rotation.x = -0.16;
  arcadeGroup.add(arcScreen);

  // Palanca arcade + 2 botones de acción
  const stickShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 10)), brushedAlumMat);
  stickShaft.position.set(-0.09, 0.165, 0.09);
  arcadeGroup.add(stickShaft);
  const stickBall = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.02, 12, 12)), accentBlueMat);
  stickBall.position.set(-0.09, 0.195, 0.09);
  arcadeGroup.add(stickBall);

  const btnRed = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 14)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.45 }))
  );
  btnRed.position.set(0.05, 0.145, 0.085);
  arcadeGroup.add(btnRed);

  const btnCyan = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 14)), accentBlueMat);
  btnCyan.position.set(0.11, 0.145, 0.10);
  arcadeGroup.add(btnCyan);

  scene.add(arcadeGroup);
  registerStation('minijuego', arcadeGroup, [0.46, 0.44, 0.40], [0, 0.21, 0]);

  /* ========================================================================
     OBJETO 7: LÁMPARA ARQUITECTÓNICA → MODO CLARO / OSCURO
     ======================================================================== */
  const lampGroup = new THREE.Group();
  lampGroup.position.set(1.94, DESK_TOP_Y, -0.82);
  lampGroup.rotation.y = -0.72;

  const lampBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.15, 0.17, 0.036, 22)), darkMetalMat);
  lampBase.position.y = 0.018;
  lampBase.castShadow = true;
  lampGroup.add(lampBase);

  const lampLower = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.02, 0.72, 12)), brushedAlumMat);
  lampLower.position.set(0, 0.36, -0.08);
  lampLower.rotation.x = -0.22;
  lampGroup.add(lampLower);

  const lampJoint = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.036, 14, 14)), accentBlueMat);
  lampJoint.position.set(0, 0.70, -0.15);
  lampGroup.add(lampJoint);

  const lampUpper = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.016, 0.018, 0.56, 12)), brushedAlumMat);
  lampUpper.position.set(0, 0.88, 0.04);
  lampUpper.rotation.x = 0.82;
  lampGroup.add(lampUpper);

  const shadePts = [
    new THREE.Vector2(0.03, 0.14),
    new THREE.Vector2(0.06, 0.12),
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.145, 0.0),
  ];
  const lampShade = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(shadePts, 24)), darkMetalMat);
  lampShade.position.set(0, 0.96, 0.24);
  lampShade.rotation.x = 0.22;
  lampShade.castShadow = true;
  lampGroup.add(lampShade);

  const lampBulb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.06, 14, 12)), bulbMat);
  lampBulb.position.set(0, 0.99, 0.25);
  lampGroup.add(lampBulb);

  scene.add(lampGroup);
  registerStation('tema', lampGroup, [0.46, 1.15, 0.58], [0, 0.56, 0.04]);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  /* ========================================================================
     INTERACCIÓN, CÁMARA SUAVE Y TRANSICIÓN DE TEMA
     ======================================================================== */
  let currentTheme = initialTheme === 'light' ? 'light' : 'dark';
  let themeTransitioning = false;

  const camDesiredPos = new THREE.Vector3(...CAMERA_PRESETS.inicio.pos);
  const camDesiredTarget = new THREE.Vector3(...CAMERA_PRESETS.inicio.target);
  let isCameraTransitioning = false;
  let activeStationId = null;
  let hoveredStationId = null;
  let isPaused = false;
  let isDisposed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  controls.addEventListener('start', () => {
    isCameraTransitioning = false;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-9, -9);
  let pointerDownX = 0;
  let pointerDownY = 0;
  let lastMoveTime = 0;

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickStation(event) {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(proxyMeshes, false);
    return hits.length > 0 ? hits[0].object.userData.stationId : null;
  }

  function getProjectedPoint(stationId) {
    const st = stations.get(stationId);
    if (!st) return null;
    _v3A.copy(st.group.position).add(st.anchorOffset);
    _v3A.project(camera);
    const w = renderer.domElement.clientWidth || window.innerWidth;
    const h = renderer.domElement.clientHeight || window.innerHeight;
    return {
      x: ((_v3A.x + 1) / 2) * w,
      y: ((-_v3A.y + 1) / 2) * h,
      visible: _v3A.z < 1,
    };
  }

  function emitHoverInfo(id) {
    if (!onHoverStation) return;
    if (!id) {
      onHoverStation(null, null, null);
      return;
    }
    onHoverStation(id, STATION_META[id] || null, getProjectedPoint(id));
  }

  function handlePointerMove(event) {
    const now = performance.now();
    if (now - lastMoveTime < 32) return;
    lastMoveTime = now;

    const hitId = pickStation(event);
    if (hitId !== hoveredStationId) {
      hoveredStationId = hitId;
      renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
      emitHoverInfo(hitId);
    } else if (hitId) {
      emitHoverInfo(hitId);
    }
  }

  function handlePointerDown(event) {
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    if (!hoveredStationId) renderer.domElement.style.cursor = 'grabbing';
  }

  function handlePointerUp(event) {
    const dist = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY);
    renderer.domElement.style.cursor = hoveredStationId ? 'pointer' : 'grab';
    if (dist > 7) return;

    const hitId = pickStation(event);
    if (hitId && onSelectStation) {
      onSelectStation(hitId);
    }
  }

  function handlePointerLeave() {
    if (hoveredStationId) {
      hoveredStationId = null;
      emitHoverInfo(null);
    }
  }

  renderer.domElement.addEventListener('pointermove', handlePointerMove, { passive: true });
  renderer.domElement.addEventListener('pointerdown', handlePointerDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', handlePointerUp, { passive: true });
  renderer.domElement.addEventListener('pointerleave', handlePointerLeave, { passive: true });

  function handleContextLost(e) {
    e.preventDefault();
    isPaused = true;
    if (onWebGLFallback) onWebGLFallback('Contexto WebGL pausado temporalmente.');
  }
  function handleContextRestored() {
    isPaused = false;
  }
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

  function handleResize() {
    if (isDisposed || !mountEl) return;
    const w = mountEl.clientWidth || window.innerWidth;
    const h = mountEl.clientHeight || window.innerHeight;
    if (!w || !h) return;

    camera.aspect = w / h;
    camera.fov = w < 640 ? 52 : w < 960 ? 45 : 39;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  }
  window.addEventListener('resize', handleResize, { passive: true });
  handleResize();

  const clock = new THREE.Clock();
  let frameId = 0;

  function afterDraw(cb) {
    const gl = renderer.getContext();
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 6);
    } else {
      frameId = window.setTimeout(cb, 90);
    }
  }

  function updateThemeMaterials(dt) {
    const pal = THEME_PALETTES[currentTheme] || THEME_PALETTES.dark;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-5.5 * dt);

    _colorTarget.setHex(pal.bg);
    scene.background.lerp(_colorTarget, alpha);
    scene.fog.color.lerp(_colorTarget, alpha);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, pal.fogDensity, alpha);

    keyLight.intensity = THREE.MathUtils.lerp(keyLight.intensity, pal.keyIntensity, alpha);
    hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, pal.hemiIntensity, alpha);
    _colorTarget.setHex(pal.hemiSky);
    hemiLight.color.lerp(_colorTarget, alpha);
    _colorTarget.setHex(pal.hemiGround);
    hemiLight.groundColor.lerp(_colorTarget, alpha);

    windowLight.intensity = THREE.MathUtils.lerp(windowLight.intensity, pal.windowLightIntensity, alpha);
    _colorTarget.setHex(pal.windowLightColor);
    windowLight.color.lerp(_colorTarget, alpha);

    lampLight.intensity = THREE.MathUtils.lerp(lampLight.intensity, pal.lampIntensity, alpha);
    bulbMat.emissiveIntensity = THREE.MathUtils.lerp(bulbMat.emissiveIntensity, pal.bulbIntensity, alpha);
    coveMat.emissiveIntensity = THREE.MathUtils.lerp(coveMat.emissiveIntensity, pal.coveIntensity, alpha);

    _colorTarget.setHex(pal.wallMain);
    wallMainMat.color.lerp(_colorTarget, alpha);
    _colorTarget.setHex(pal.wallSide);
    wallSideMat.color.lerp(_colorTarget, alpha);
    _colorTarget.setHex(pal.slatWood);
    slatWoodMat.color.lerp(_colorTarget, alpha);
    _colorTarget.setHex(pal.deskWood);
    deskWoodMat.color.lerp(_colorTarget, alpha);
    _colorTarget.setHex(pal.floorTint);
    floorMat.color.lerp(_colorTarget, alpha);
    _colorTarget.setHex(pal.rugColor);
    rugMat.color.lerp(_colorTarget, alpha);

    scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity, pal.envIntensity, alpha);

    if (Math.abs(keyLight.intensity - pal.keyIntensity) < 0.01) {
      themeTransitioning = false;
    }
  }

  function tick() {
    if (isDisposed) return;

    if (isPaused || document.hidden) {
      frameId = window.setTimeout(tick, 250);
      return;
    }

    const dt = Math.min(clock.getDelta(), 0.08);
    const elapsed = clock.getElapsedTime();

    if (isCameraTransitioning) {
      const k = reducedMotion ? 1 : 1 - Math.exp(-5.4 * dt);
      camera.position.lerp(camDesiredPos, k);
      controls.target.lerp(camDesiredTarget, k);

      if (
        camera.position.distanceToSquared(camDesiredPos) < 0.0008 &&
        controls.target.distanceToSquared(camDesiredTarget) < 0.0008
      ) {
        camera.position.copy(camDesiredPos);
        controls.target.copy(camDesiredTarget);
        isCameraTransitioning = false;
      }
    }

    if (themeTransitioning) {
      updateThemeMaterials(dt);
    }

    // Hover lift & halo discreto
    stations.forEach((st, id) => {
      const targetHover = hoveredStationId === id || activeStationId === id ? 1 : 0;
      st.hoverAmount = THREE.MathUtils.damp(st.hoverAmount, targetHover, 9, dt);
      const lift = id === 'tema' ? 0 : st.hoverAmount * 0.022;
      st.group.position.y = st.baseY + lift;
      st.haloMat.opacity = st.hoverAmount * (currentTheme === 'dark' ? 0.55 : 0.4);
    });

    if (!reducedMotion) {
      // Ventiladores y actividad de servidor
      serverFans.forEach((fan, idx) => {
        fan.rotation.x = elapsed * (1.2 + idx * 0.35);
      });
      serverLedBars.forEach((led) => {
        led.mat.emissiveIntensity = 0.75 + Math.sin(elapsed * 2.6 + led.phase) * 0.4;
      });

      // Bandera del buzón saluda suavemente al hacer hover
      const flagTargetRot = hoveredStationId === 'contacto' ? -0.35 : Math.sin(elapsed * 1.4) * 0.06;
      flagPivot.rotation.x = THREE.MathUtils.damp(flagPivot.rotation.x, flagTargetRot, 8, dt);

      // Vapor suave de la taza de café
      steamPuffs.forEach((puff) => {
        const cycle = ((elapsed * 0.38 + puff.phase) % 1);
        puff.mesh.position.y = 0.13 + cycle * 0.24;
        puff.mesh.position.x = Math.sin(elapsed * 1.8 + puff.phase) * 0.018;
        puff.mesh.scale.setScalar(0.65 + cycle * 1.15);
        puff.mat.opacity = Math.sin(cycle * Math.PI) * 0.26;
      });
    }

    if (hoveredStationId) {
      emitHoverInfo(hoveredStationId);
    }

    controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  return {
    focusStation(stationId) {
      const preset = CAMERA_PRESETS[stationId] || CAMERA_PRESETS.inicio;
      activeStationId = stationId === 'inicio' ? null : stationId;
      camDesiredPos.set(...preset.pos);
      camDesiredTarget.set(...preset.target);
      isCameraTransitioning = true;
    },

    resetCamera() {
      activeStationId = null;
      camDesiredPos.set(...CAMERA_PRESETS.inicio.pos);
      camDesiredTarget.set(...CAMERA_PRESETS.inicio.target);
      isCameraTransitioning = true;
    },

    setTheme(nextTheme) {
      currentTheme = nextTheme === 'light' ? 'light' : 'dark';
      windowSkyMat.map = currentTheme === 'light' ? skyLightTex : skyDarkTex;
      windowSkyMat.needsUpdate = true;
      themeTransitioning = true;
    },

    setPaused(paused) {
      isPaused = Boolean(paused);
    },

    dispose() {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();

      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
