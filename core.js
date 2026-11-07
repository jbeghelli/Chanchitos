'use strict';
/* ====== Núcleo: estado, guardado, sonido, voz, datos curiosos, navegación, foto ====== */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];

const SAVE_KEY = 'chanchitos_v1';
const G = { save: null, faceImg: null, muted: false };

function defaultSave() {
  return {
    name: '', faceURL: null,
    inv: { hoja: 6, verdura: 2, calcio: 2, corteza: 2 },
    best: 0, facts: {}, colony: null, lastSeen: 0, runs: 0, rescued: 0, muted: false
  };
}
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return Object.assign(defaultSave(), s); } catch (e) {}
  return defaultSave();
}
function persist() {
  try { G.save.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {}
}

/* ====== Sonido (sintetizado, sin archivos) ====== */
let AC = null;
function audio() {
  if (G.muted) return null;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { return null; }
  return AC;
}
function beep(f0, f1, dur, type = 'square', vol = 0.12, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SFX = {
  jump: () => beep(380, 760, 0.16, 'square', 0.09),
  duck: () => beep(300, 160, 0.12, 'triangle', 0.1),
  power: () => { beep(900, 200, 0.22, 'sawtooth', 0.07); beep(500, 900, 0.1, 'sine', 0.08, 0.05); },
  pick: () => { beep(880, 1320, 0.08, 'square', 0.07); },
  food: () => { beep(520, 780, 0.1, 'triangle', 0.1); beep(780, 1040, 0.1, 'triangle', 0.1, 0.09); },
  hurt: () => { beep(220, 70, 0.3, 'sawtooth', 0.12); },
  splash: () => { beep(1400, 500, 0.18, 'sine', 0.05); beep(1000, 300, 0.2, 'sine', 0.04, 0.05); },
  pop: () => beep(600, 1000, 0.07, 'sine', 0.08),
  baby: () => { beep(700, 1000, 0.08, 'triangle', 0.1); beep(1000, 1400, 0.1, 'triangle', 0.1, 0.1); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => beep(f, f, 0.14, 'square', 0.08, i * 0.11)); },
  die: () => { beep(400, 100, 0.5, 'sine', 0.1); }
};

/* ====== Voz (leer en voz alta, para quienes aún no leen) ====== */
function speak(text) {
  try {
    if (G.muted || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[🐛💧🍃🥕🦴🪵💡🌬🧽🔍🌡☀️🌙]/gu, ''));
    const vs = speechSynthesis.getVoices();
    const v = vs.find(v => /es[-_]CL/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang));
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-CL';
    u.rate = 0.92; u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ====== Datos curiosos (Chanciclopedia) ======
   Fuentes: UF/IFAS EDIS IN1099 (Armadillidium vulgare), BioKIDS (U. Michigan), scaber.org,
   ZooKeys 176 (agregación), revisión SciELO sobre cobre en isópodos, guías de cuidado de isópodos. */
const FACTS = [
  { id: 'crust', ic: '🦀', t: 'No son insectos', x: 'Los chanchitos de tierra no son insectos. Son crustáceos, ¡primos del camarón y del cangrejo! Son los crustáceos que mejor viven en tierra firme.' },
  { id: 'legs', ic: '🦵', t: '¡14 patas!', x: 'Tienen 7 pares de patas, o sea 14. Los insectos tienen solo 6 patas. Y las antenas largas les sirven para tocar y oler el camino.' },
  { id: 'gills', ic: '💧', t: 'Respiran con branquias', x: 'Respiran con branquias escondidas bajo la cola, como los peces y los cangrejos. Las branquias deben estar húmedas, por eso siempre buscan lugares con humedad.' },
  { id: 'kinesis', ic: '🏃', t: 'Corren si hay sequedad', x: 'Cuando el aire está seco se mueven más rápido, y cuando hay humedad se calman. Así, andando y andando, encuentran un lugar húmedo.' },
  { id: 'ball', ic: '⚽', t: 'Se hacen bolita', x: 'Al asustarse, el chanchito Armadillidium vulgare se enrolla en una bolita para proteger su panza blandita. Pero ojo: no todos los isópodos pueden hacerlo, ¡algunos solo corren!' },
  { id: 'nocturnal', ic: '🌙', t: 'Les gusta la oscuridad', x: 'Prefieren la sombra y la noche. De día se esconden bajo piedras, troncos y cortezas; por eso en tu terrario necesitan escondites.' },
  { id: 'group', ic: '👨‍👩‍👧', t: 'Les gusta juntarse', x: 'Se juntan en grupitos: así pierden menos agua y están más protegidos. Les encanta tocar cosas, ¡incluso a otros chanchitos!' },
  { id: 'decomp', ic: '🍂', t: 'Los recicladores', x: 'Comen hojas secas, madera podrida y hongos. Al comer y hacer caquita, devuelven nutrientes a la tierra. ¡Son recicladores de la naturaleza!' },
  { id: 'veg', ic: '🥕', t: 'Verduras con cuidado', x: 'Les gustan las verduras blanditas, como la zanahoria. Pero si sobra comida, aparece moho. Retira lo que no se coma en uno o dos días.' },
  { id: 'calcium', ic: '🦴', t: 'Caparazón de calcio', x: 'Su armadura está hecha con calcio. Por eso en los terrarios se les da cáscara de huevo o hueso de jibia para que puedan fabricar un caparazón nuevo.' },
  { id: 'molt', ic: '👕', t: 'Cambian de piel en dos partes', x: 'Cuando crecen, mudan su caparazón en dos mitades: primero la de atrás y después la de adelante. Por un ratito se ven mitad claros y mitad oscuros.' },
  { id: 'molt2', ic: '🥚', t: 'Usan el calcio de nuevo', x: 'Guardan calcio en pequeñas manchas blancas del cuerpo y lo usan para endurecer la piel nueva. A veces se comen la piel que dejaron.' },
  { id: 'marsupium', ic: '🎒', t: 'La mochila de mamá', x: 'La mamá lleva los huevos en una bolsa en la panza, llamada marsupio, con un líquido que alimenta a las crías. Las crías nacen blancas y pequeñitas: se llaman mancas.' },
  { id: 'broods', ic: '👶', t: 'Varias camadas', x: 'Una mamá puede tener hasta tres camadas en una temporada. Los huevos tardan unas 3 o 4 semanas, y las crías se quedan un tiempito más en la bolsa.' },
  { id: 'baby', ic: '🍼', t: 'Mudan al primer día', x: 'Las crías mudan su piel por primera vez el mismo día en que salen de la bolsa de mamá. ¡Por eso necesitan calcio desde chiquitas!' },
  { id: 'copper', ic: '🔵', t: 'Sangre con cobre', x: 'Su sangre lleva cobre, como un metal. Los científicos creen que por eso a veces se comen su propia caquita: las bacterias de la caquita ayudan a recuperar cobre.' },
  { id: 'predators', ic: '🕷️', t: '¡Tienen enemigos!', x: 'Arañas, ciempiés, sapos y pájaros se los comen. Hay arañas cazadoras de chanchitos que parecen hechas para eso. Por eso se esconden y se enrollan.' },
  { id: 'temp', ic: '🌡️', t: 'Ni mucho calor ni mucho frío', x: 'Viven bien entre 18 y 27 grados. Sobre los 30 grados sufren, y con mucho frío se quedan lentos y casi dormidos.' },
  { id: 'moisture', ic: '🏜️', t: 'Un lado húmedo y otro seco', x: 'En un buen terrario hay una parte más húmeda y otra más seca, para que cada chanchito elija dónde estar. Todo mojado tampoco sirve: aparece moho y se pueden ahogar.' },
  { id: 'mold', ic: '🍄', t: 'Cuidado con el moho', x: 'La humedad y la comida vieja hacen crecer moho. Ventilar un poquito y sacar la comida que sobra mantiene sano al terrario.' },
  { id: 'light', ic: '💡', t: 'La luz los asusta', x: 'No necesitan lámpara para vivir. La luz fuerte y el calor los secan y los asustan. El musgo sí necesita luz, así que hay que dar luz un ratito a la plantita.' },
  { id: 'size', ic: '📏', t: 'Chiquitos pero firmes', x: 'Un chanchito adulto mide hasta unos 18 milímetros, como una uña pequeña. ¡Y no muerden ni pican a las personas!' },
  { id: 'life', ic: '🎂', t: '¡Viven años!', x: 'Pueden vivir entre 2 y 5 años si los cuidan bien. En la naturaleza suelen vivir menos.' },
  { id: 'world', ic: '🌍', t: 'Viajeros del mundo', x: 'Este chanchito es originario de Europa, pero hoy vive en jardines de muchos países del mundo.' },
  { id: 'home', ic: '🏠', t: 'Su casa ideal', x: 'Un buen hogar tiene tierra suelta, hojas secas, trozos de corteza para esconderse, algo de calcio y humedad. ¡Justo lo que hay en el terrario!' }
];
const FACT_BY_ID = Object.fromEntries(FACTS.map(f => [f.id, f]));

function factsUnlockedCount() { return Object.keys(G.save.facts).length; }

function unlockFact(id, silent) {
  const f = FACT_BY_ID[id]; if (!f) return;
  if (G.save.facts[id]) return;
  G.save.facts[id] = Date.now();
  persist();
  if (!silent) { if (current === 'runner') (G.pending = G.pending || []).push(id); else toast(f, true); }
}

function toast(f, isNew) {
  const box = $('#toast');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<span class="ic">' + f.ic + '</span><div><b>' + (isNew ? '📖 ¡Dato nuevo! ' : '') + f.t + '</b>' + f.x + '</div><button class="round">🔊</button>';
  el.querySelector('button').onclick = e => { e.stopPropagation(); speak(f.t + '. ' + f.x); };
  el.onclick = () => el.remove();
  box.appendChild(el);
  while (box.children.length > 1) box.firstChild.remove();
  SFX.pop();
  setTimeout(() => { el.remove(); }, 8000);
}
function say(text, ic) { toast({ ic: ic || '🐛', t: text, x: '' }, false); }

/* ====== Navegación ====== */
const SCREENS = ['menu', 'runner', 'terr', 'face', 'enc'];
let current = 'menu';
function show(name) {
  const prev = current;
  if (prev === 'runner' && name !== 'runner') Runner.stop();
  if (prev === 'terr' && name !== 'terr') Terr.stop();
  current = name;
  SCREENS.forEach(s => $('#' + s).classList.toggle('hidden', s !== name));
  $('#toast').innerHTML = ''; $('#toast').dataset.scr = name; G.pending = [];
  if (name === 'menu') refreshMenu();
  if (name === 'runner') Runner.start();
  if (name === 'terr') Terr.start();
  if (name === 'face') openFace();
  if (name === 'enc') openEnc();
  if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
}

function refreshMenu() {
  const n = G.save.name;
  const h = $('#hello'); h.classList.toggle('hidden', !n); h.textContent = '¡Hola, ' + n + '! 👋';
  const c = G.save.colony ? G.save.colony.isos.length : 0;
  $('#colSub').textContent = c ? c + ' chanchitos en tu colonia' : 'cuida tu colonia';
  $('#encSub').textContent = factsUnlockedCount() + ' de ' + FACTS.length + ' datos descubiertos';
  $('#bMute').textContent = G.muted ? '🔇' : '🔊';
}

/* ====== Chanciclopedia ====== */
function openEnc() {
  const l = $('#enclist'); l.innerHTML = '';
  FACTS.forEach(f => {
    const ok = !!G.save.facts[f.id];
    const d = document.createElement('div');
    d.className = 'fact' + (ok ? '' : ' lock');
    d.innerHTML = ok
      ? '<span class="ic">' + f.ic + '</span><div><b>' + f.t + '</b><span>' + f.x + '</span></div><button class="round">🔊</button>'
      : '<span class="ic">❓</span><div><b>Dato secreto</b><span>Sigue jugando y cuidando a tus chanchitos para descubrirlo.</span></div>';
    if (ok) d.querySelector('button').onclick = () => speak(f.t + '. ' + f.x);
    l.appendChild(d);
  });
  const s = document.createElement('div'); s.className = 'src';
  s.textContent = 'Basado en: UF/IFAS (EENY630), BioKIDS de la U. de Michigan, scaber.org, ZooKeys 176 y guías de cuidado de isópodos.';
  l.appendChild(s);
}

/* ====== Mi cara: recorte de la foto ====== */
const Face = { img: null, zoom: 1, ox: 0, oy: 0, base: 1, ptrs: new Map(), pinch0: 0, zoom0: 1 };
function openFace() {
  $('#nameIn').value = G.save.name || '';
  Face.img = G.faceImg || null;
  Face.zoom = 1; Face.ox = 0; Face.oy = 0; $('#fZoom').value = 1;
  if (Face.img) Face.base = 300 / Math.min(Face.img.width, Face.img.height);
  drawFace();
}
function loadFaceFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    Face.img = im; Face.base = 300 / Math.min(im.width, im.height);
    Face.zoom = 1; Face.ox = 0; Face.oy = 0; $('#fZoom').value = 1; drawFace();
    URL.revokeObjectURL(url);
  };
  im.onerror = () => say('No pude abrir esa foto. Prueba con otra.', '😕');
  im.src = url;
}
function faceDraw(ctx, img, size, zoom, ox, oy, base) {
  const k = base * zoom * (size / 300);
  const w = img.width * k, h = img.height * k;
  ctx.drawImage(img, size / 2 - w / 2 + ox * (size / 300), size / 2 - h / 2 + oy * (size / 300), w, h);
}
function clampFace() {
  if (!Face.img) return;
  const k = Face.base * Face.zoom;
  const mx = Math.max(0, (Face.img.width * k - 300) / 2), my = Math.max(0, (Face.img.height * k - 300) / 2);
  Face.ox = clamp(Face.ox, -mx, mx); Face.oy = clamp(Face.oy, -my, my);
}
function drawFace() {
  const c = $('#fc'), x = c.getContext('2d');
  x.clearRect(0, 0, 300, 300);
  x.fillStyle = '#e8c9a0'; x.fillRect(0, 0, 300, 300);
  if (!Face.img) {
    x.fillStyle = '#1d1a16'; x.font = 'bold 20px sans-serif'; x.textAlign = 'center';
    x.fillText('📷 Elige una foto', 150, 150); return;
  }
  clampFace();
  faceDraw(x, Face.img, 300, Face.zoom, Face.ox, Face.oy, Face.base);
}
function exportFace() {
  if (!Face.img) return null;
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const x = c.getContext('2d');
  x.fillStyle = '#e8c9a0'; x.fillRect(0, 0, 160, 160);
  faceDraw(x, Face.img, 160, Face.zoom, Face.ox, Face.oy, Face.base);
  return c.toDataURL('image/jpeg', 0.88);
}
function setFaceURL(url) {
  G.save.faceURL = url;
  if (!url) { G.faceImg = null; persist(); return; }
  const im = new Image(); im.onload = () => { G.faceImg = im; }; im.src = url;
  persist();
}
function initFaceUI() {
  const c = $('#fc');
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); Face.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (Face.ptrs.size === 2) { const [a, b] = [...Face.ptrs.values()]; Face.pinch0 = Math.hypot(a.x - b.x, a.y - b.y); Face.zoom0 = Face.zoom; } });
  c.addEventListener('pointermove', e => {
    const p = Face.ptrs.get(e.pointerId); if (!p) return;
    const r = c.getBoundingClientRect(), s = 300 / r.width;
    if (Face.ptrs.size === 1) { Face.ox += (e.clientX - p.x) * s; Face.oy += (e.clientY - p.y) * s; }
    p.x = e.clientX; p.y = e.clientY;
    if (Face.ptrs.size === 2) { const [a, b] = [...Face.ptrs.values()]; Face.zoom = clamp(Face.zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / Face.pinch0, 1, 4); $('#fZoom').value = Face.zoom; }
    drawFace();
  });
  const up = e => Face.ptrs.delete(e.pointerId);
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); Face.zoom = clamp(Face.zoom * (e.deltaY < 0 ? 1.06 : 0.94), 1, 4); $('#fZoom').value = Face.zoom; drawFace(); }, { passive: false });
  $('#fZoom').oninput = e => { Face.zoom = +e.target.value; drawFace(); };
  $('#bCam').onclick = () => $('#fileCam').click();
  $('#bGal').onclick = () => $('#fileGal').click();
  $('#fileCam').onchange = e => { loadFaceFile(e.target.files[0]); e.target.value = ''; };
  $('#fileGal').onchange = e => { loadFaceFile(e.target.files[0]); e.target.value = ''; };
  $('#bFaceOk').onclick = () => {
    G.save.name = $('#nameIn').value.trim();
    if (Face.img) setFaceURL(exportFace());
    $('#bFace').style.animation = G.save.faceURL ? '' : 'pulse 1.3s ease-in-out infinite';
    persist(); SFX.win(); show('menu');
  };
  $('#bFaceClear').onclick = () => { Face.img = null; setFaceURL(null); drawFace(); };
}
