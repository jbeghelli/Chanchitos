'use strict';
/* ====== Núcleo: estado, guardado, sonido, voz, datos curiosos, navegación, foto ====== */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];

const G = { save: null, faceImg: null, muted: false };

function defaultSave() {
  return {
    name: '', faceURL: null,
    inv: { hoja: 6, verdura: 2, calcio: 2, flor: 3, corteza: 1, rama: 1, palito: 2, piedra: 1, pina: 1 },
    bichos: {},      // mochila: cuántos bichos de cada especie esperan para ponerse en el terrario
    found: {},       // especies ganadas alguna vez (se muestran en la Bichopedia)
    done: {},        // niveles completados
    sexN: 0, level: 1, v: 4,   // level = nivel más alto desbloqueado (1 a 10)
    best: 0, facts: {}, colony: null, lastSeen: 0, runs: 0, rescued: 0, muted: false
  };
}
/* ====== Varios niños: cada uno con su foto, mochila, terrario y progreso ====== */
const ALL_KEY = 'chanchitos_v3';
function normKid(k) {
  const d = defaultSave(), r = Object.assign(d, k || {});
  r.inv = k && k.inv ? Object.assign({}, Object.fromEntries(Object.keys(d.inv).map(x => [x, 0])), k.inv) : Object.assign({}, d.inv);
  r.bichos = Object.assign({}, r.bichos); r.found = Object.assign({}, r.found); r.done = Object.assign({}, r.done);
  if (k && k.v !== 4) {   // guardado de la versión «solo chanchitos»: se convierte
    const lv = Math.min(10, k.level || 1);
    for (let l = 1; l < lv; l++) { r.done[l] = true; const id = LEVELS[l - 1].bug; r.found[id] = true; r.bichos[id] = (r.bichos[id] || 0) + 1; }
    if (k.inv && k.inv.chans) { r.found.chanchito = true; r.bichos.chanchito = (r.bichos.chanchito || 0) + k.inv.chans; }
    delete r.inv.chans; r.level = lv; r.v = 4;
  }
  if (r.inv.chans !== undefined) delete r.inv.chans;
  return r;
}
function loadAll() {
  let all = null;
  try { all = JSON.parse(localStorage.getItem(ALL_KEY)); } catch (e) {}
  if (!all || !Array.isArray(all.kids)) {
    all = { kids: [], cur: null, muted: false };
    try {   // viene de una versión de un solo niño
      const o2 = JSON.parse(localStorage.getItem('chanchitos_v2')), o1 = JSON.parse(localStorage.getItem('chanchitos_v1'));
      const o = o2 || (o1 && { name: o1.name, faceURL: o1.faceURL, facts: o1.facts });
      if (o) { const k = normKid(o); k.id = 'k' + Date.now(); if (!k.name) k.name = 'Niño 1'; all.kids.push(k); all.cur = k.id; all.muted = !!o.muted; }
    } catch (e) {}
  }
  all.kids = all.kids.map(k => { const n = normKid(k); n.id = k.id || 'k' + Math.random().toString(36).slice(2); return n; });
  return all;
}
function persist() {
  try { if (G.save) G.save.lastSeen = Date.now(); G.all.muted = G.muted; localStorage.setItem(ALL_KEY, JSON.stringify(G.all)); } catch (e) {}
}
function loadFaceImg() {
  G.faceImg = null;
  if (G.save && G.save.faceURL) { const im = new Image(); im.onload = () => { G.faceImg = im; }; im.src = G.save.faceURL; }
}
function selectKid(id) {
  const k = G.all.kids.find(k => k.id === id); if (!k) return;
  Terr.reset(); G.save = k; G.all.cur = id; G.cp = null; G.pending = []; loadFaceImg(); persist(); show('menu');
}
function newKid() {
  Terr.reset();
  const k = normKid({}); k.id = 'k' + Date.now(); k.name = '';
  G.all.kids.push(k); G.save = k; G.all.cur = k.id; G.cp = null; G.newKid = true; G.faceImg = null; persist(); show('face');
}
function deleteKid(id) {
  const wasCur = G.save && G.save.id === id;
  if (wasCur) { Terr.discard(); G.save = null; G.faceImg = null; }
  G.all.kids = G.all.kids.filter(k => k.id !== id);
  if (wasCur) G.all.cur = null;
  persist();
}
function resetAll() {
  Terr.discard(); G.save = null; G.faceImg = null; G.cp = null;
  G.all = { kids: [], cur: null, muted: G.muted };
  try { ['chanchitos_v1', 'chanchitos_v2', ALL_KEY].forEach(k => localStorage.removeItem(k)); } catch (e) {}
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
}
function confirmBox(msg, yesLabel, fn) {
  $('#confMsg').innerHTML = msg; $('#confYes').textContent = yesLabel;
  $('#confYes').onclick = () => { $('#confOv').classList.add('hidden'); fn(); };
  $('#confNo').onclick = () => $('#confOv').classList.add('hidden');
  $('#confOv').classList.remove('hidden');
}
function kidAvatar(k) {
  return k.faceURL ? '<img src="' + k.faceURL + '" alt="">' : '<span>🧒</span>';
}
function openWho() {
  const l = $('#kids'); l.innerHTML = '';
  for (const k of G.all.kids) {
    const b = document.createElement('button'); b.className = 'kid'; b.dataset.id = k.id;
    const cnt = k.colony ? (k.colony.bugs || k.colony.isos || []).length : 0;
    const nBag = Object.values(k.bichos || {}).reduce((a, b) => a + b, 0), nSp = Object.keys(k.found || {}).length;
    b.innerHTML = '<div class="av">' + kidAvatar(k) + '</div><div class="nm">' + (k.name || 'Sin nombre').replace(/</g, '&lt;') + '<small>⭐ Nivel ' + (k.level || 1) + ' · 🐞 ' + nSp + ' de 10 bichos · 🏡 ' + cnt + ' en el terrario · 🎒 ' + nBag + '</small></div>';
    b.onclick = () => { audio(); selectKid(k.id); };
    l.appendChild(b);
  }
  if (!G.all.kids.length) { const p = document.createElement('p'); p.className = 'hint2'; p.textContent = 'Toca «Nuevo niño» para empezar.'; l.appendChild(p); }
}
function openOpts() {
  const l = $('#optList'); l.innerHTML = '';
  for (const k of G.all.kids) {
    const b = document.createElement('button'); b.className = 'big gris'; b.style.fontSize = '17px';
    b.textContent = '🗑 Borrar a ' + (k.name || 'Sin nombre');
    b.onclick = () => confirmBox('¿Borrar a <b>' + (k.name || 'Sin nombre').replace(/</g, '&lt;') + '</b>? Se pierden su foto, su mochila, su terrario y su progreso.', 'SÍ, BORRAR', () => { deleteKid(k.id); openWho(); openOpts(); });
    l.appendChild(b);
  }
  $('#optOv').classList.remove('hidden');
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
const SCREENS = ['who', 'menu', 'runner', 'terr', 'face', 'enc'];
let current = 'who';
function show(name) {
  const prev = current;
  if (prev === 'runner' && name !== 'runner') Runner.stop();
  if (prev === 'terr' && name !== 'terr') Terr.stop();
  current = name;
  SCREENS.forEach(s => $('#' + s).classList.toggle('hidden', s !== name));
  $('#toast').innerHTML = ''; $('#toast').dataset.scr = name; G.pending = [];
  if (name === 'who') openWho();
  if (name === 'menu') refreshMenu();
  if (name === 'runner') Runner.start();
  if (name === 'terr') Terr.start();
  if (name === 'face') openFace();
  if (name === 'enc') openEnc();
  if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
}

function refreshMenu() {
  const n = G.save.name || '';
  $('#hello').textContent = '👋 ¡Hola, ' + n + '!  ·  cambiar de niño';
  $('#bFace').style.animation = G.save.faceURL ? '' : 'pulse 1.3s ease-in-out infinite';
  const c = G.save.colony ? (G.save.colony.bugs || G.save.colony.isos || []).length : 0, bag = bagTotal();
  $('#colSub').textContent = (c ? c + ' bicho' + (c > 1 ? 's' : '') + ' en tu terrario' : 'cuida a tus bichos') + (bag ? ' · 🎒 ' + bag + ' por poner' : '');
  $('#encSub').textContent = Object.keys(G.save.found).length + ' de 10 bichos · ' + factsUnlockedCount() + ' de ' + FACTS.length + ' datos';
  $('#bMute').textContent = G.muted ? '🔇' : '🔊';
  $('#runSub').textContent = 'nivel ' + (G.save.level || 1) + ' de 10 · cada meta te da un bicho';
}

/* ====== Ganar bichos ====== */
/** Agrega `n` bichos de la especie `id` a la mochila y desbloquea sus 2 primeros datos. */
function giveBug(id, n) {
  const s = G.save; s.bichos[id] = (s.bichos[id] || 0) + (n || 1);
  const first = !s.found[id]; s.found[id] = true;
  if (first) { unlockFact(id + '1', true); unlockFact(id + '2', true); }
  persist(); return first;
}
const bagTotal = () => Object.values(G.save.bichos).reduce((a, b) => a + b, 0);

/* ====== Selector de nivel ====== */
function openLevels() {
  const g = $('#lvGrid'); g.innerHTML = '';
  for (const L of LEVELS) {
    const open = L.n <= (G.save.level || 1), done = !!G.save.done[L.n], b = BUG_BY_ID[L.bug];
    const t = document.createElement('button'); t.className = 'lvTile' + (open ? '' : ' lock') + (done ? ' done' : '');
    t.innerHTML = '<img src="' + Art.icon(L.bug, 64) + '" alt="" class="' + (done ? '' : 'sil') + '"><b>' + L.n + '</b><small>' + (open ? L.name : 'Bloqueado') + '</small>' + (done ? '<i>✓</i>' : open ? '' : '<i>🔒</i>');
    if (open) t.onclick = () => { $('#lvOv').classList.add('hidden'); G.runLevel = L.n; audio(); show('runner'); };
    g.appendChild(t);
  }
  $('#lvOv').classList.remove('hidden');
}

/* ====== Bichopedia (una ficha por bicho, con datos y fuentes) ====== */
function openEnc() {
  const l = $('#enclist'); l.innerHTML = '';
  const factHtml = (f) => '<div class="fact"><span class="ic">' + f.ic + '</span><div><b>' + f.t + '</b><span>' + f.x + '</span></div><button class="round" data-say="' + f.id + '">🔊</button></div>';
  const lockHtml = n => n > 0 ? '<div class="fact lock"><span class="ic">❓</span><div><b>' + n + ' dato' + (n > 1 ? 's' : '') + ' secreto' + (n > 1 ? 's' : '') + '</b><span>Cuida a este bicho en el terrario para descubrirlos.</span></div></div>' : '';
  for (const b of BUGS) {
    const ok = !!G.save.found[b.id], fs = FACTS.filter(f => f.bug === b.id), got = fs.filter(f => G.save.facts[f.id]);
    const d = document.createElement('details'); d.className = 'bcard' + (ok ? '' : ' lock');
    const head = '<summary><span class="bi">' + (ok ? '<img src="' + Art.icon(b.id, 64) + '" alt="">' : '❓') + '</span><span class="bt"><b>' + (ok ? b.n : 'Bicho secreto ' + b.lvl) + '</b><small>' + (ok ? '<i>' + b.sci + '</i> · ' + got.length + '/' + fs.length + ' datos' : 'Pasa el nivel ' + b.lvl + ' (' + b.habitat + ')') + '</small></span></summary>';
    let body = '';
    if (ok) {
      body = '<div class="chips"><span>' + b.grp + '</span><span>' + b.origin + '</span><span>' + b.size + '</span></div>' +
        '<p><b>📍 Dónde vive:</b> ' + b.where + '</p><p><b>🍽️ Qué come:</b> ' + b.eats + '</p>' +
        got.map(factHtml).join('') + lockHtml(fs.length - got.length) +
        '<p class="srcs"><b>Fuentes:</b> ' + b.src.map(k => '<a href="' + SRC[k].u + '" target="_blank" rel="noopener">' + SRC[k].t + '</a>').join(' · ') + '</p>';
    }
    d.innerHTML = head + '<div class="bbody">' + body + '</div>'; l.appendChild(d);
  }
  const gf = FACTS.filter(f => f.bug === 'general'), gg = gf.filter(f => G.save.facts[f.id]);
  const d = document.createElement('details'); d.className = 'bcard';
  d.innerHTML = '<summary><span class="bi">🏡</span><span class="bt"><b>Cuidar el terrario</b><small>' + gg.length + '/' + gf.length + ' datos</small></span></summary><div class="bbody">' + gg.map(factHtml).join('') + lockHtml(gf.length - gg.length) + '</div>';
  l.appendChild(d);
  const s = document.createElement('div'); s.className = 'src';
  s.innerHTML = 'La información de cada ficha viene de las fuentes que se enlazan en ella. Más detalle en <b>docs/BICHOS.md</b> del repositorio.';
  l.appendChild(s);
  l.querySelectorAll('[data-say]').forEach(b => b.onclick = e => { e.stopPropagation(); const f = FACT_BY_ID[b.dataset.say]; speak(f.t + '. ' + f.x); });
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
    G.save.name = $('#nameIn').value.trim() || 'Niño ' + G.all.kids.length;
    if (Face.img) setFaceURL(exportFace());
    G.newKid = false; persist(); SFX.win(); show('menu');
  };
  $('#bFaceClear').onclick = () => { Face.img = null; setFaceURL(null); drawFace(); };
}
