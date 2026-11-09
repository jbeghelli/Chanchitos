'use strict';
/* =====================================================================
   ARTE: dibujo vectorial de los 10 bichos (vista desde arriba), de la flor
   de copihue y los íconos de la mochila. Todo se dibuja con canvas: no hay
   imágenes externas. Cada función dibuja en el origen mirando hacia +x.
   Parámetros (o): len (largo), ph (fase de animación), mv (0..1 cuánto se mueve),
   wing (0..1 aleteo; solo voladores), landed, curl (chanchito), white (cría),
   molt (0 | 1 mitad de atrás | 2 mitad de adelante), preg (lleva huevitos).
   ===================================================================== */
const Art = (() => {
  const INK = '#1d1a16', TAU = Math.PI * 2;
  const ell = (c, x, y, rx, ry, rot, fill, lw) => {
    c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (lw !== 0) { c.strokeStyle = INK; c.lineWidth = lw || 1; c.stroke(); }
  };
  const line = (c, pts, w, col) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.strokeStyle = col || INK; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
  // patas simples: n pares repartidas a lo largo del cuerpo
  function legs(c, n, x0, dx, w, ll, ph, mv, col) {
    for (let i = 0; i < n; i++) {
      const x = x0 - i * dx, s = Math.sin(ph * 2 + i * 1.9) * ll * 0.5 * mv;
      line(c, [x, -w, x + s, -w - ll, x + s * 1.2, -w - ll * 1.25], 1, col || 'rgba(30,25,20,.85)');
      line(c, [x, w, x - s, w + ll, x - s * 1.2, w + ll * 1.25], 1, col || 'rgba(30,25,20,.85)');
    }
  }
  const wingPair = (c, x, len, wid, ang, flap, col) => {
    for (const s of [-1, 1]) {
      c.save(); c.translate(x, 0); c.rotate(s * ang);
      ell(c, -len * 0.4, 0, len * 0.5, wid * (0.35 + 0.65 * flap), 0, col || 'rgba(235,245,255,.55)', 0.7);
      c.restore();
    }
  };

  /* ---- 1. Chanchito de tierra (segmentado, se hace bolita) ---- */
  function chanchito(c, o) {
    const len = o.len, W = len * 0.52;
    if (o.curl > 0) {
      c.rotate(o.curl * 8);
      ell(c, 0, 0, W * 0.9, W * 0.9, 0, o.white ? '#f1ede4' : '#707e8c', 1.5);
      c.strokeStyle = 'rgba(25,30,40,.55)'; c.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * W * 0.4 - W * 0.9, 0, W, -1.2, 1.2); c.stroke(); }
      return;
    }
    legs(c, 7, len * 0.28, len * 0.115, W * 0.45, 3.2, o.ph, o.mv, 'rgba(30,25,20,.8)');
    c.strokeStyle = INK; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(len * 0.5, -W * 0.15); c.quadraticCurveTo(len * 0.8, -W * 0.7 + Math.sin(o.ph) * 2, len * 0.95, -W * 0.45 + Math.sin(o.ph * 1.3) * 2.5);
    c.moveTo(len * 0.5, W * 0.15); c.quadraticCurveTo(len * 0.8, W * 0.7 + Math.cos(o.ph) * 2, len * 0.95, W * 0.45 + Math.cos(o.ph * 1.3) * 2.5); c.stroke();
    const base = o.white ? '#f1ede4' : '#6f7d8b', dark = o.white ? '#d8d2c4' : '#59666f', pale = '#e6e2d6';
    for (let i = 0; i < 9; i++) {
      const x = len * 0.5 - i * len * 0.115;
      const wd = W * (i === 0 ? 0.55 : i === 8 ? 0.35 : 0.5 + 0.5 * Math.sin(i / 8 * 3.14) * 0.9), hl = i === 0 ? len * 0.13 : len * 0.085;
      let col = i % 2 ? base : dark;
      if (o.molt) { const back = i >= 4; col = (o.molt === 1 && back) || (o.molt === 2 && !back) ? pale : col; }
      ell(c, x, 0, hl, wd, 0, col, 0.9);
    }
    ell(c, len * 0.05, -W * 0.25, len * 0.3, W * 0.12, 0, 'rgba(255,255,255,.28)', 0);
    c.fillStyle = '#000'; c.beginPath(); c.arc(len * 0.52, -W * 0.22, 0.9, 0, TAU); c.arc(len * 0.52, W * 0.22, 0.9, 0, TAU); c.fill();
    if (o.preg) { c.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(len * 0.1 - i * 2.2, (i % 2 ? 1 : -1) * W * 0.35, 1.3, 0, TAU); c.fill(); } }
  }

  /* ---- 2. Pololo verde (escarabajo verde metálico) ---- */
  function pololo(c, o) {
    const L = o.len, fl = o.wing > 0 && !o.landed;
    if (fl) wingPair(c, L * 0.12, L * 1.0, L * 0.22, 1.05, 0.4 + 0.6 * Math.abs(Math.sin(o.ph * 3)));
    legs(c, 3, L * 0.22, L * 0.2, L * 0.28, L * 0.22, o.ph, o.mv, '#2a3a22');
    const g = c.createLinearGradient(0, -L * 0.3, 0, L * 0.3); g.addColorStop(0, '#8fe06a'); g.addColorStop(0.5, '#34a64a'); g.addColorStop(1, '#1f6e3a');
    ell(c, -L * 0.08, 0, L * 0.42, L * 0.3, 0, g, 1.2);
    line(c, [-L * 0.45, 0, L * 0.25, 0], 0.9, 'rgba(10,50,20,.7)');
    ell(c, L * 0.3, 0, L * 0.14, L * 0.22, 0, '#27904a', 1);
    ell(c, L * 0.46, 0, L * 0.1, L * 0.13, 0, '#16301c', 1);
    line(c, [L * 0.5, -L * 0.06, L * 0.66, -L * 0.2], 1, INK); line(c, [L * 0.5, L * 0.06, L * 0.66, L * 0.2], 1, INK);
    ell(c, -L * 0.18, -L * 0.1, L * 0.2, L * 0.06, -0.2, 'rgba(255,255,255,.3)', 0);
  }

  /* ---- 3. Chinita (cúpula roja con puntos) ---- */
  function chinita(c, o) {
    const L = o.len, fl = o.wing > 0 && !o.landed;
    if (fl) wingPair(c, 0, L * 1.2, L * 0.24, 1.0, 0.4 + 0.6 * Math.abs(Math.sin(o.ph * 4)));
    legs(c, 3, L * 0.2, L * 0.22, L * 0.38, L * 0.2, o.ph, o.mv, '#1d1a16');
    ell(c, -L * 0.05, 0, L * 0.5, L * 0.46, 0, '#e5352b', 1.2);
    line(c, [-L * 0.55, 0, L * 0.4, 0], 0.9, INK);
    c.fillStyle = INK; for (const [x, y] of [[-0.25, -0.22], [-0.25, 0.22], [0, -0.28], [0, 0.28], [0.2, -0.15], [0.2, 0.15], [-0.4, 0]]) { c.beginPath(); c.arc(L * x, L * y, L * 0.07, 0, TAU); c.fill(); }
    c.beginPath(); c.ellipse(L * 0.42, 0, L * 0.14, L * 0.24, 0, 0, TAU); c.fillStyle = '#17120e'; c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(L * 0.5, -L * 0.1, L * 0.05, 0, TAU); c.arc(L * 0.5, L * 0.1, L * 0.05, 0, TAU); c.fill();
    ell(c, -L * 0.2, -L * 0.2, L * 0.16, L * 0.06, -0.5, 'rgba(255,255,255,.4)', 0);
  }

  /* ---- 4. Tijereta (pinzas atrás) ---- */
  function tijereta(c, o) {
    const L = o.len;
    legs(c, 3, L * 0.25, L * 0.17, L * 0.11, L * 0.2, o.ph, o.mv, '#5a3a22');
    // pinzas (cercos)
    const open = 0.15 + 0.08 * Math.sin(o.ph * 0.7);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-L * 0.44, s * L * 0.04); c.quadraticCurveTo(-L * 0.66, s * (L * 0.1 + open * L), -L * 0.58, s * (L * 0.02 + open * L * 0.5)); c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#5b3a22'; c.lineWidth = 1.5; c.stroke(); }
    for (let i = 0; i < 8; i++) { const x = -L * 0.38 + i * L * 0.075; ell(c, x, 0, L * 0.06, L * (0.07 + 0.05 * Math.sin(i / 7 * 3)), 0, i % 2 ? '#7a4a2a' : '#6a3d22', 0.8); }
    ell(c, L * 0.22, 0, L * 0.12, L * 0.1, 0, '#8b5a34', 0.9);
    ell(c, L * 0.38, 0, L * 0.1, L * 0.09, 0, '#a86a3a', 0.9);
    line(c, [L * 0.44, -L * 0.04, L * 0.7, -L * 0.14 + Math.sin(o.ph) * 1.5], 0.8, INK); line(c, [L * 0.44, L * 0.04, L * 0.7, L * 0.14 + Math.cos(o.ph) * 1.5], 0.8, INK);
  }

  /* ---- 5. Araña pollito (tarántula rosada, peluda) ---- */
  function pollito(c, o) {
    const L = o.len;
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const bx = L * (0.2 - i * 0.12), sw = Math.sin(o.ph * 1.2 + i * 1.6 + (s > 0 ? 1.4 : 0)) * L * 0.06 * o.mv;
      const kx = bx + (i < 2 ? L * 0.1 : -L * 0.1) + sw, ky = s * L * 0.34, fx = bx + (i < 2 ? L * 0.14 : -L * 0.2) + sw * 1.4, fy = s * L * 0.62;
      line(c, [bx, s * L * 0.1, kx, ky, fx, fy], L * 0.09, INK); line(c, [bx, s * L * 0.1, kx, ky, fx, fy], L * 0.06, '#9b6e58');
    }
    ell(c, -L * 0.2, 0, L * 0.34, L * 0.27, 0, '#a77a62', 1.3);
    c.strokeStyle = 'rgba(255,190,200,.55)'; c.lineWidth = 0.8; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, r = L * 0.3; c.beginPath(); c.moveTo(-L * 0.2 + Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.65); c.lineTo(-L * 0.2 + Math.cos(a) * (r + 2), Math.sin(a) * (r * 0.8 + 2)); c.stroke(); }
    ell(c, L * 0.14, 0, L * 0.22, L * 0.19, 0, '#c9a58f', 1.2);
    ell(c, L * 0.2, -L * 0.06, L * 0.05, L * 0.035, 0, '#111', 0); ell(c, L * 0.2, L * 0.06, L * 0.05, L * 0.035, 0, '#111', 0);
    for (const s of [-1, 1]) { line(c, [L * 0.3, s * L * 0.06, L * 0.42, s * L * 0.1], L * 0.07, INK); line(c, [L * 0.3, s * L * 0.06, L * 0.42, s * L * 0.1], L * 0.045, '#b98d78'); }
  }

  /* ---- 6. Moscardón (abejorro anaranjado, peludo) ---- */
  function moscardon(c, o) {
    const L = o.len, fl = !o.landed;
    if (fl) wingPair(c, L * 0.08, L * 0.95, L * 0.24, 0.9, 0.3 + 0.7 * Math.abs(Math.sin(o.ph * 6)));
    else for (const s of [-1, 1]) ell(c, -L * 0.1, s * L * 0.18, L * 0.38, L * 0.1, s * 0.15, 'rgba(235,245,255,.5)', 0.6);
    legs(c, 3, L * 0.16, L * 0.16, L * 0.2, L * 0.15, o.ph, fl ? 0.2 : o.mv, '#3a2410');
    ell(c, -L * 0.22, 0, L * 0.34, L * 0.24, 0, '#e8892b', 1.2);
    c.save(); c.beginPath(); c.ellipse(-L * 0.22, 0, L * 0.34, L * 0.24, 0, 0, TAU); c.clip(); c.fillStyle = '#1a1410'; c.fillRect(-L * 0.46, -L * 0.3, L * 0.12, L * 0.6); c.fillRect(-L * 0.18, -L * 0.3, L * 0.08, L * 0.6); c.restore();
    ell(c, L * 0.12, 0, L * 0.2, L * 0.2, 0, '#f0a040', 1.2);
    ell(c, L * 0.34, 0, L * 0.11, L * 0.13, 0, '#1a1410', 1);
    c.strokeStyle = 'rgba(255,220,160,.7)'; c.lineWidth = 0.7; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.beginPath(); c.moveTo(L * 0.12 + Math.cos(a) * L * 0.15, Math.sin(a) * L * 0.15); c.lineTo(L * 0.12 + Math.cos(a) * L * 0.22, Math.sin(a) * L * 0.22); c.stroke(); }
  }

  /* ---- 7. Chinchemolle (insecto palo) ---- */
  function palo(c, o) {
    const L = o.len;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const bx = L * (0.2 - i * 0.2), sw = Math.sin(o.ph * 1.5 + i * 2 + (s > 0 ? 1.5 : 0)) * L * 0.05 * o.mv;
      line(c, [bx, 0, bx + L * 0.08 + sw, s * L * 0.26, bx - L * 0.08 + sw, s * L * 0.5], L * 0.045, '#6a4e2a');
    }
    c.beginPath(); c.moveTo(-L * 0.5, 0); c.lineTo(L * 0.3, 0); c.strokeStyle = INK; c.lineWidth = L * 0.2; c.lineCap = 'round'; c.stroke();
    c.strokeStyle = '#8a6a3c'; c.lineWidth = L * 0.15; c.stroke();
    c.strokeStyle = 'rgba(60,40,20,.6)'; c.lineWidth = 1; for (let i = 0; i < 9; i++) { const x = -L * 0.45 + i * L * 0.09; c.beginPath(); c.moveTo(x, -L * 0.07); c.lineTo(x, L * 0.07); c.stroke(); }
    ell(c, L * 0.36, 0, L * 0.11, L * 0.1, 0, '#9a7a48', 1);
    line(c, [L * 0.44, -L * 0.04, L * 0.6, -L * 0.12 + Math.sin(o.ph) * 1.5], 0.9, INK); line(c, [L * 0.44, L * 0.04, L * 0.6, L * 0.12 + Math.cos(o.ph) * 1.5], 0.9, INK);
    if (o.smell) { c.fillStyle = 'rgba(160,220,90,.35)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-L * 0.1 + Math.sin(o.ph + i) * L * 0.3, Math.cos(o.ph * 1.3 + i) * L * 0.3, L * 0.22, 0, TAU); c.fill(); } }
  }

  /* ---- 8. Mariposa del chagual (ilustración aproximada) ---- */
  function mariposa(c, o) {
    const L = o.len, fl = !o.landed, f = fl ? 0.25 + 0.75 * Math.abs(Math.sin(o.ph * 2.6)) : 0.35;
    for (const s of [-1, 1]) {
      c.save(); c.scale(1, s);
      // alas traseras (anaranjadas con borde oscuro)
      c.beginPath(); c.moveTo(-L * 0.05, 0); c.quadraticCurveTo(-L * 0.55, L * 0.1 * f, -L * 0.42, L * 0.62 * f); c.quadraticCurveTo(-L * 0.12, L * 0.5 * f, -L * 0.02, 0); c.fillStyle = '#e8742a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
      c.beginPath(); c.moveTo(-L * 0.22, L * 0.34 * f); c.quadraticCurveTo(-L * 0.4, L * 0.55 * f, -L * 0.42, L * 0.62 * f); c.strokeStyle = '#2a1a10'; c.lineWidth = 2; c.stroke();
      // alas delanteras (pardo grisáceo con manchas claras)
      c.beginPath(); c.moveTo(L * 0.1, 0); c.quadraticCurveTo(L * 0.05, L * 0.75 * f, L * 0.45, L * 0.72 * f); c.quadraticCurveTo(L * 0.5, L * 0.3 * f, L * 0.2, 0); c.fillStyle = '#6b5a4a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
      c.fillStyle = '#f2ead8'; for (const [x, y] of [[0.3, 0.5], [0.22, 0.32], [0.38, 0.6]]) { c.beginPath(); c.arc(L * x, L * y * f, L * 0.035, 0, TAU); c.fill(); }
      c.restore();
    }
    ell(c, 0, 0, L * 0.34, L * 0.07, 0, '#2a1d14', 1);
    ell(c, L * 0.36, 0, L * 0.07, L * 0.07, 0, '#1a120c', 1);
    line(c, [L * 0.4, -L * 0.03, L * 0.62, -L * 0.2], 0.9, INK); line(c, [L * 0.4, L * 0.03, L * 0.62, L * 0.2], 0.9, INK);
  }

  /* ---- 9. Libélula / caballito del diablo ---- */
  function libelula(c, o) {
    const L = o.len, fl = !o.landed, f = fl ? 0.7 + 0.3 * Math.sin(o.ph * 5) : 0.9;
    for (const s of [-1, 1]) for (const [x, k] of [[L * 0.2, 1], [L * 0.04, 0.9]]) {
      c.save(); c.translate(x, 0); c.rotate(s * (fl ? 1.35 : 1.2));
      ell(c, -L * 0.28 * k, 0, L * 0.34 * k, L * 0.085 * f, 0, 'rgba(220,240,255,.5)', 0.8);
      c.strokeStyle = 'rgba(40,60,80,.4)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-L * 0.55 * k, 0); c.lineTo(L * 0.05 * k, 0); c.stroke();
      c.restore();
    }
    // abdomen largo y fino
    c.beginPath(); c.moveTo(L * 0.18, 0); c.lineTo(-L * 0.62, 0); c.strokeStyle = INK; c.lineWidth = L * 0.11; c.lineCap = 'round'; c.stroke();
    c.strokeStyle = '#2d8fd6'; c.lineWidth = L * 0.075; c.stroke();
    c.strokeStyle = '#1b2a40'; c.lineWidth = 1.4; for (let i = 0; i < 7; i++) { const x = L * 0.0 - i * L * 0.09; c.beginPath(); c.moveTo(x, -L * 0.04); c.lineTo(x, L * 0.04); c.stroke(); }
    ell(c, L * 0.24, 0, L * 0.13, L * 0.1, 0, '#3aa860', 1);
    ell(c, L * 0.4, 0, L * 0.09, L * 0.15, 0, '#2d8fd6', 1);
    c.fillStyle = '#1b2a40'; c.beginPath(); c.arc(L * 0.42, -L * 0.1, L * 0.055, 0, TAU); c.arc(L * 0.42, L * 0.1, L * 0.055, 0, TAU); c.fill();
  }

  /* ---- 10. Grillo de campo ---- */
  function grillo(c, o) {
    const L = o.len;
    line(c, [L * 0.36, -L * 0.06, L * 0.9, -L * 0.3 + Math.sin(o.ph) * 3, L * 1.3, -L * 0.1], 0.9, INK);
    line(c, [L * 0.36, L * 0.06, L * 0.9, L * 0.3 + Math.cos(o.ph * 1.2) * 3, L * 1.3, L * 0.1], 0.9, INK);
    for (const s of [-1, 1]) line(c, [-L * 0.05, s * L * 0.15, -L * 0.25, s * L * 0.46, -L * 0.52, s * L * 0.28], L * 0.1, '#35241a');
    for (const s of [-1, 1]) { line(c, [L * 0.12, s * L * 0.15, L * 0.22, s * L * 0.38], 1.2, '#35241a'); line(c, [L * 0.25, s * L * 0.15, L * 0.38, s * L * 0.34], 1.2, '#35241a'); }
    ell(c, -L * 0.1, 0, L * 0.42, L * 0.22, 0, '#4a3220', 1.2);
    c.strokeStyle = 'rgba(210,170,110,.6)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-L * 0.45, 0); c.lineTo(L * 0.2, 0); c.stroke();
    if (o.sing) { c.strokeStyle = 'rgba(255,230,160,.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-L * 0.4, -L * 0.15); c.lineTo(L * 0.1, -L * 0.22); c.moveTo(-L * 0.4, L * 0.15); c.lineTo(L * 0.1, L * 0.22); c.stroke(); }
    ell(c, L * 0.38, 0, L * 0.14, L * 0.15, 0, '#5a3d26', 1.2);
    c.fillStyle = '#111'; c.beginPath(); c.arc(L * 0.46, -L * 0.08, 1.2, 0, TAU); c.arc(L * 0.46, L * 0.08, 1.2, 0, TAU); c.fill();
    for (const s of [-1, 1]) line(c, [-L * 0.5, s * L * 0.05, -L * 0.62, s * L * 0.1], 1, INK);
  }

  const DRAW = { chanchito, pololo, chinita, tijereta, pollito, moscardon, palo, mariposa, libelula, grillo };

  /** Dibuja un bicho en (x, y) con ángulo a. */
  function bug(c, sp, x, y, a, o) { c.save(); c.translate(x, y); c.rotate(a); c.lineJoin = 'round'; DRAW[sp](c, o); c.restore(); }

  /** Flor de copihue (flor nacional de Chile): campana roja colgante. (x, y) = centro. */
  function copihue(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.rotate(Math.sin((t || 0) * 2) * 0.08); c.scale(s, s);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = '#2e7a3a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(5, -9, 4, -4); c.stroke();
    c.fillStyle = '#4fa84a'; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(9, -9, 6, 2.6, -0.4, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-4, -6); c.quadraticCurveTo(-10, 0, -9, 12); c.lineTo(-3, 9); c.lineTo(0, 14); c.lineTo(3, 9); c.lineTo(9, 12); c.quadraticCurveTo(10, 0, 4, -6); c.closePath();
    c.fillStyle = '#d6204a'; c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,180,200,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-2, -3); c.lineTo(-3, 9); c.moveTo(2, -3); c.lineTo(3, 9); c.stroke();
    c.fillStyle = '#fff'; for (const [px, py] of [[-5, 5], [5, 5], [0, 7], [-2, 1], [2, 1]]) { c.beginPath(); c.arc(px, py, 0.9, 0, TAU); c.fill(); }
    c.restore();
  }

  const iconCache = {};
  /** Ícono (dataURL PNG) de un bicho para la mochila, tarjetas y selector de niveles. */
  function icon(id, size) {
    size = size || 72; const key = id + size; if (iconCache[key]) return iconCache[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = size * 2; const c = cv.getContext('2d');
    const sp = BUG_BY_ID[id].sim, len = sp.len, k = size * 2 * 0.8 / (Math.max(len, 14) * 1.45);
    c.translate(size, size); c.scale(k, k);
    bug(c, id, 0, 0, -0.45, { len, ph: 0.4, mv: 0, wing: sp.move === 'fly' ? 1 : 0, landed: sp.move !== 'fly' });
    return (iconCache[key] = cv.toDataURL('image/png'));
  }
  return { bug, copihue, icon, DRAW };
})();
