'use strict';
/* ====== Corredor: el niño avanza solo; saltar, agacharse o lanzar poder ====== */

/* --- Personaje estilo recortable (cara = foto del niño) --- */
function drawKid(ctx, x, y, t, o) {
  // (x,y) = pies. o: {state:'run'|'jump'|'duck'|'idle', hurt, power, scale, faceImg}
  o = o || {};
  const s = o.scale || 1, st = o.state || 'run';
  const ink = '#1d1a16';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = ink;
  const sw = st === 'run' ? Math.sin(t * 14) : st === 'jump' ? 0.9 : 0;
  const duck = st === 'duck';
  const bodyH = duck ? 18 : 30;
  const legH = duck ? 8 : 16;
  const bob = st === 'run' ? Math.abs(Math.sin(t * 14)) * 2.5 : 0;
  ctx.translate(0, -bob);
  // frasco en la espalda
  ctx.save(); ctx.translate(-17, -legH - bodyH * 0.55);
  ctx.fillStyle = 'rgba(190,230,255,.85)'; ctx.beginPath(); ctx.roundRect(-8, -9, 15, 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e5483b'; ctx.fillRect(-9, -13, 17, 5); ctx.strokeRect(-9, -13, 17, 5);
  ctx.fillStyle = 'rgba(90,100,115,.9)'; for (let i = 0; i < Math.min(3, (o.jar | 0)); i++) { ctx.beginPath(); ctx.arc(-3 + i * 4, 6, 3, 0, 7); ctx.fill(); }
  ctx.restore();
  // piernas
  ctx.fillStyle = '#2f5fb5';
  const lx = [ -5 + sw * 6, 6 - sw * 6 ];
  for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.roundRect(lx[i] - 5, -legH, 10, legH, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(lx[i] - 5, -4, 14, 5, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2f5fb5';
  }
  // tronco (chaqueta)
  ctx.fillStyle = o.hurt ? '#ff8a8a' : '#f2a31b';
  ctx.beginPath(); ctx.roundRect(-13, -legH - bodyH, 26, bodyH + 2, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d98a0f'; ctx.fillRect(-1, -legH - bodyH + 3, 2.5, bodyH - 6);
  // brazos
  const ay = -legH - bodyH + 8;
  ctx.fillStyle = '#f2a31b';
  const up = st === 'jump' || o.power;
  for (let i = 0; i < 2; i++) {
    ctx.save(); ctx.translate(i ? 12 : -12, ay);
    ctx.rotate(up ? (i ? -2.2 : -1.2) : (i ? -sw : sw) * 0.9);
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 17, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4cf9f'; ctx.beginPath(); ctx.arc(0, 18, 4.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2a31b';
    ctx.restore();
  }
  // cabeza grande
  const hr = 23, hx = 2, hy = -legH - bodyH - hr + 6 + (duck ? 3 : 0);
  ctx.save(); ctx.translate(hx, hy);
  if (st === 'jump') ctx.rotate(-0.08);
  ctx.beginPath(); ctx.arc(0, 0, hr, 0, 7); ctx.fillStyle = '#f4cf9f'; ctx.fill();
  if (o.faceImg) {
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, hr, 0, 7); ctx.clip();
    ctx.drawImage(o.faceImg, -hr, -hr, hr * 2, hr * 2); ctx.restore();
  } else {
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(-7, -2, 2.6, 0, 7); ctx.arc(7, -2, 2.6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 5, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, hr, 0, 7); ctx.stroke();
  // gorro que rebota (tapa de la cabeza a lo recortable)
  const flip = st === 'run' ? Math.abs(Math.sin(t * 14)) * 3 : st === 'jump' ? -3 : 0;
  ctx.save(); ctx.translate(0, -flip);
  ctx.fillStyle = '#e5483b';
  ctx.beginPath(); ctx.arc(0, -4, hr + 1, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-hr + 1, -hr * 0.55, hr * 2 - 2, 6, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, -hr - 3, 5, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

/* --- Chanchito (en bolita, rodando) --- */
function drawBall(ctx, x, y, r, rot, white) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = white ? '#f1ede4' : '#7b8896'; ctx.strokeStyle = '#1d1a16'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, 7); ctx.clip();
  ctx.strokeStyle = 'rgba(30,35,45,.55)'; ctx.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * r * 0.55 - r * 1.1, 0, r * 1.15, -1.4, 1.4); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.35, r * 0.2, -0.6, 0, 7); ctx.fill();
  ctx.restore(); ctx.restore();
}

const Runner = (() => {
  const LW = 400;
  let cv, cx, W, H, S, LH, VW = 400, groundY;
  let raf = 0, last = 0, running = false, paused = false, over = false;
  let st;           // estado de la carrera
  const keys = {};
  const BIOMES = [
    { name: 'Jardín',  sky: ['#8fd3ff', '#d8f3ff'], hill: '#7cc45a', hill2: '#5fae48', ground: '#6bbf4a', dirt: '#6b4a2b', start: 0 },
    { name: 'Bosque',  sky: ['#ffb36b', '#ffe3b0'], hill: '#4f8f3d', hill2: '#3d7a35', ground: '#4a9a3a', dirt: '#5a3d22', start: 450 },
    { name: 'Noche',   sky: ['#1b2250', '#3b4a8a'], hill: '#26502f', hill2: '#1d4026', ground: '#2f7a3a', dirt: '#3a2814', start: 950 }
  ];

  function resize() {
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = r.width * d; cv.height = r.height * d; W = r.width; H = r.height;
    S = Math.min(cv.width / LW, cv.height / 300); VW = cv.width / S; LH = cv.height / S;
    groundY = Math.min(LH * 0.66, LH - 76);
  }

  function newState() {
    return {
      t: 0, dist: 0, speed: 175, hearts: 3, count: 0, charge: 1, prog: 0,
      py: 0, vy: 0, onGround: true, duck: 0, inv: 0, powerFx: 0, shot: 0,
      obs: [], picks: [], proj: [], parts: [], pops: [], spawn: 1.2,
      gain: { hoja: 0, verdura: 0, calcio: 0, corteza: 0 }, seen: {}, ended: false, hurtT: 0
    };
  }

  function start() {
    cv = $('#rc'); cx = cv.getContext('2d');
    resize(); st = newState(); over = false; paused = false;
    $('#pauseOv').classList.add('hidden'); $('#resOv').classList.add('hidden');
    updHUD();
    if (!G.save.facts.crust) unlockFact('crust', true);
    running = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
  }
  function stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); }

  function jump() {
    if (!running || paused || over) return;
    if (st.onGround) { st.vy = -740; st.onGround = false; st.duck = 0; SFX.jump(); }
  }
  function duck() {
    if (!running || paused || over) return;
    if (st.onGround) { if (st.duck <= 0) SFX.duck(); st.duck = 0.65; }
    else st.vy = Math.max(st.vy, 520);  // caer rápido
  }
  function power() {
    if (!running || paused || over) return;
    if (st.charge < 1) { beep(200, 140, 0.1, 'square', 0.05); flashPower(); return; }
    st.charge--; st.powerFx = 0.3; SFX.power();
    st.proj.push({ x: 128, y: groundY + st.py - (st.duck > 0 ? 18 : 34), vx: 560, life: 1.2 });
    updHUD();
  }
  let pwFlash = 0;
  function flashPower() { pwFlash = 0.3; }

  /* --- Generador de obstáculos y tesoros --- */
  function chans(x, y, n, dx, dy) { for (let i = 0; i < n; i++) st.picks.push({ k: 'c', x: x + i * dx, y: y + (typeof dy === 'function' ? dy(i, n) : i * dy), r: 12, rot: rnd(0, 6) }); }
  const arc = (h) => (i, n) => -Math.sin((i + 0.5) / n * Math.PI) * h;
  function spawnPattern() {
    const x0 = VW + 60, g = groundY;
    const lvl = st.dist / 450;
    const r = Math.random();
    if (r < 0.22) { // piedra + arco de chanchitos
      st.obs.push({ k: 'rock', x: x0 + 60, y: g, w: 40, h: 30 });
      chans(x0 + 20, g - 30, 5, 24, arc(88));
    } else if (r < 0.40) { // suelo seco y caliente
      st.obs.push({ k: 'dry', x: x0 + 90, y: g, w: 110, h: 12 });
      chans(x0 + 40, g - 26, 6, 26, arc(95));
    } else if (r < 0.58) { // pájaro: agacharse
      st.obs.push({ k: 'bird', x: x0 + 40, y: g - 52, w: 52, h: 30, ph: rnd(0, 6) });
      chans(x0 - 10, g - 14, 6, 28, 0);
    } else if (r < 0.76) { // araña: poder o saltar
      st.obs.push({ k: 'spider', x: x0 + 20, y: g, w: 40, h: 26, ph: rnd(0, 6), hp: 1 });
      chans(x0 + 120, g - 14, 4, 26, 0);
    } else if (r < 0.88) { // pura carrera de chanchitos
      chans(x0, g - 14, 7, 26, 0);
    } else if (r < 0.95 || lvl < 0.3) { // regalo
      const kk = pick(['hoja', 'hoja', 'verdura', 'calcio', 'corteza']);
      st.picks.push({ k: kk, x: x0 + 30, y: g - 44, r: 16, rot: 0 });
      chans(x0 + 80, g - 14, 3, 26, 0);
    } else if (lvl >= 0.8) { // combinado
      st.obs.push({ k: 'rock', x: x0 + 40, y: g, w: 40, h: 30 });
      st.obs.push({ k: 'bird', x: x0 + 300, y: g - 52, w: 52, h: 30, ph: 0 });
      chans(x0 + 190, g - 90, 3, 24, 0);
    } else { chans(x0, g - 14, 5, 26, 0); }
    const gapPx = rnd(300, 400) - Math.min(70, st.dist / 20);
    st.spawn = gapPx / st.speed;
  }

  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function puff(x, y, col, n) { for (let i = 0; i < (n || 8); i++) st.parts.push({ x, y, vx: rnd(-120, 120), vy: rnd(-200, 40), life: rnd(0.3, 0.6), c: col || '#fff', r: rnd(2, 4) }); }
  function pop(x, y, txt) { st.pops.push({ x, y, txt, life: 0.9 }); }

  function hurt(why) {
    if (st.inv > 0) return;
    st.hearts--; st.inv = 1.6; st.hurtT = 0.4; SFX.hurt();
    puff(100, groundY + st.py - 30, '#ff6b6b', 10);
    if (why === 'dry' && !st.seen.dry) { st.seen.dry = 1; unlockFact('moisture'); }
    updHUD();
    if (st.hearts <= 0) endRun();
  }

  function update(dt) {
    st.t += dt;
    st.speed = Math.min(300, 175 + st.dist * 0.12);
    st.dist += st.speed * dt / 40;
    // jugador
    if (!st.onGround) { st.vy += 1900 * dt; st.py += st.vy * dt; if (st.py >= 0) { st.py = 0; st.vy = 0; st.onGround = true; } }
    if (st.duck > 0) st.duck -= dt;
    if (keys.ArrowDown || keys.s) { if (st.onGround) st.duck = Math.max(st.duck, 0.1); }
    if (st.inv > 0) st.inv -= dt; if (st.powerFx > 0) st.powerFx -= dt; if (st.hurtT > 0) st.hurtT -= dt;
    // caja del jugador
    const ducking = st.duck > 0 && st.onGround;
    const pb = { x: 92, y: groundY + st.py - (ducking ? 30 : 58), w: 28, h: ducking ? 30 : 58 };
    // generar
    st.spawn -= dt; if (st.spawn <= 0) spawnPattern();
    const dx = st.speed * dt;
    // obstáculos
    for (const o of st.obs) {
      o.x -= dx + (o.k === 'spider' ? 55 * dt : o.k === 'bird' ? 35 * dt : 0);
      if (o.k === 'bird') o.y += Math.sin(st.t * 5 + o.ph) * 0.4;
      const bx = { x: o.x - o.w / 2 + 6, y: o.y - o.h + 4, w: o.w - 12, h: o.h - 8 };
      if (o.k === 'bird') { bx.y = o.y - 6; bx.h = o.h - 4; }
      if (o.k === 'dry') { bx.y = o.y - 10; bx.h = 12; bx.x = o.x - o.w / 2 + 4; bx.w = o.w - 8; }
      if (hit(pb, bx)) { o.dead = o.k !== 'dry' && o.k !== 'rock' ? true : o.dead; hurt(o.k); if (o.k === 'spider' || o.k === 'bird') { puff(o.x, o.y - 10, '#222', 6); } }
      if (!st.seen[o.k] && o.x < VW - 40 && o.x > 100) {
        st.seen[o.k] = 1;
        if (o.k === 'spider' || o.k === 'bird') unlockFact('predators');
        if (o.k === 'dry') { say('¡Suelo seco y caliente! Salta sobre él: los chanchitos odian la sequedad.', '🏜️'); }
        if (o.k === 'rock') { /* sin aviso */ }
      }
    }
    st.obs = st.obs.filter(o => o.x > -80 && !o.dead);
    // recolectables
    for (const p of st.picks) {
      p.x -= dx; p.rot += dt * 9;
      const dxp = p.x - (106), dyp = p.y - (groundY + st.py - (ducking ? 15 : 28));
      if (!p.taken && Math.hypot(dxp, dyp * 0.8) < p.r + 22) {
        p.taken = true; collect(p);
      }
    }
    st.picks = st.picks.filter(p => p.x > -40 && !p.taken);
    // proyectiles
    for (const p of st.proj) {
      p.x += p.vx * dt; p.life -= dt;
      for (const o of st.obs) {
        if (o.k === 'spider' || o.k === 'bird') {
          if (Math.abs(p.x - o.x) < o.w / 2 + 8 && Math.abs(p.y - (o.y - o.h / 2)) < 30) {
            o.dead = true; p.life = 0; puff(o.x, o.y - 12, '#35b7ff', 12); SFX.pop(); pop(o.x, o.y - 40, '¡Splash!');
          }
        }
      }
    }
    st.proj = st.proj.filter(p => p.life > 0 && p.x < VW + 40);
    // partículas
    for (const q of st.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt; q.life -= dt; }
    st.parts = st.parts.filter(q => q.life > 0);
    for (const q of st.pops) { q.y -= 30 * dt; q.life -= dt; }
    st.pops = st.pops.filter(q => q.life > 0);
    if (pwFlash > 0) pwFlash -= dt;
    $('#rDist').textContent = Math.floor(st.dist) + ' m';
  }

  function collect(p) {
    if (p.k === 'c') {
      st.count++; st.prog++; SFX.pick(); puff(p.x, p.y, '#bcd', 5);
      if (st.count === 1) unlockFact('ball');
      if (st.prog >= 5) { st.prog = 0; if (st.charge < 3) { st.charge++; pop(106, groundY + st.py - 80, '+1 💧'); SFX.food(); } }
      $('#rCount').textContent = '🐛 ' + st.count;
      updHUD();
    } else {
      st.gain[p.k]++; SFX.food();
      const nm = { hoja: '🍃 Hoja', verdura: '🥕 Zanahoria', calcio: '🦴 Calcio', corteza: '🪵 Corteza' }[p.k];
      pop(106, groundY + st.py - 80, '+' + nm);
      if (p.k === 'hoja') unlockFact('decomp'); else if (p.k === 'verdura') unlockFact('veg'); else if (p.k === 'calcio') unlockFact('calcium'); else unlockFact('home');
    }
  }

  function updHUD() {
    $('#hearts').textContent = '❤️'.repeat(Math.max(0, st.hearts)) + '🖤'.repeat(Math.max(0, 3 - st.hearts));
    let h = ''; for (let i = 0; i < 3; i++) h += '<i class="' + (i < st.charge ? 'on' : '') + '"></i>';
    h += '<b>' + st.prog + '/5</b>';
    $('#power').innerHTML = h;
    $('#bPower').classList.toggle('empty', st.charge < 1);
  }

  function endRun() {
    if (over) return; over = true; st.ended = true;
    // las recompensas pasan a la colonia / inventario
    Terr.addRescued(st.count);
    const inv = G.save.inv; for (const k in st.gain) inv[k] = (inv[k] || 0) + st.gain[k];
    const meters = Math.floor(st.dist);
    const newBest = meters > G.save.best; if (newBest) G.save.best = meters;
    G.save.runs++; G.save.rescued += st.count; persist();
    SFX.win(); $('#toast').innerHTML = '';
    const pend = (G.pending || []).slice(0, 1).map(id => FACT_BY_ID[id]);
    let fs = pend; if (!fs.length) { const f0 = pick(FACTS.filter(f => !['crust'].includes(f.id))); unlockFact(f0.id, true); fs = [f0]; }
    const f = fs[0];
    const nm = G.save.name ? G.save.name + ', ' : '';
    $('#resCard').innerHTML =
      '<h2>' + (st.count ? '¡Bien hecho, ' + nm.replace(', ', '') + '!' : '¡Buen intento!') + '</h2>' +
      '<div class="stats"><div>🐛 ' + st.count + '<small>rescatados</small></div><div>🏃 ' + meters + '<small>metros</small></div><div>⭐ ' + G.save.best + '<small>récord' + (newBest ? ' nuevo' : '') + '</small></div></div>' +
      '<p>' + (st.count ? 'Tus ' + st.count + ' chanchitos ya están en tu terrario 🏡' : 'Salta, agáchate y usa el poder para rescatar chanchitos.') +
      (Object.values(st.gain).some(v => v) ? '<br>Ganaste: ' + [['hoja', '🍃'], ['verdura', '🥕'], ['calcio', '🦴'], ['corteza', '🪵']].filter(a => st.gain[a[0]]).map(a => a[1] + '×' + st.gain[a[0]]).join(' ') : '') + '</p>' +
      fs.map((ff, i) => '<div class="factbox"><span class="ic">' + ff.ic + '</span><div><b>' + (pend.length ? '📖 ¡Dato nuevo! ' : '') + ff.t + '</b>' + ff.x + '</div><button class="round resSay" data-i="' + i + '">🔊</button></div>').join('') +
      '<button class="big azul" id="resTerr">🏡 IR AL TERRARIO</button><button class="big verde" id="resAgain">🏃 CORRER OTRA VEZ</button><button class="big gris" id="resMenu">MENÚ</button>';
    document.querySelectorAll('.resSay').forEach(b => b.onclick = () => { const ff = fs[+b.dataset.i]; speak(ff.t + '. ' + ff.x); });
    $('#resTerr').onclick = () => show('terr');
    $('#resAgain').onclick = () => { stop(); start(); };
    $('#resMenu').onclick = () => show('menu');
    setTimeout(() => $('#resOv').classList.remove('hidden'), 450);
  }

  /* --- Dibujo --- */
  function biomeAt(d) { let i = 0; for (let k = 0; k < BIOMES.length; k++) if (d >= BIOMES[k].start) i = k; return BIOMES[i]; }
  const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; };

  function draw() {
    cx.setTransform(S, 0, 0, S, 0, 0);
    const b = biomeAt(st.dist), nb = BIOMES[Math.min(BIOMES.length - 1, BIOMES.indexOf(b) + 1)];
    const tt = b === nb ? 0 : clamp((st.dist - (nb.start - 60)) / 60, 0, 1);
    const sky = cx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, mix(b.sky[0], nb.sky[0], tt)); sky.addColorStop(1, mix(b.sky[1], nb.sky[1], tt));
    cx.fillStyle = sky; cx.fillRect(0, 0, VW, LH);
    const night = b.name === 'Noche' || tt > 0.5 && nb.name === 'Noche';
    // sol / luna
    cx.fillStyle = night ? '#f4f1d8' : '#fff3a0'; cx.beginPath(); cx.arc(390, groundY * 0.28, 26, 0, 7); cx.fill();
    if (night) { cx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 24; i++) { cx.fillRect((i * 97 + 31) % VW, (i * 53) % (groundY * 0.7), 2, 2); } }
    // nubes
    cx.fillStyle = night ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.85)';
    for (let i = 0; i < 4; i++) { const x = ((i * 190 - st.dist * 6) % (VW + 200) + VW + 200) % (VW + 200) - 100, y = groundY * (0.18 + (i % 3) * 0.12); cx.beginPath(); cx.ellipse(x, y, 42, 14, 0, 0, 7); cx.ellipse(x + 24, y - 8, 28, 14, 0, 0, 7); cx.fill(); }
    // colinas
    const hill = (col, off, amp, sp, base) => { cx.fillStyle = col; cx.beginPath(); cx.moveTo(0, groundY); for (let x = 0; x <= VW; x += 12) cx.lineTo(x, groundY - base - Math.sin((x + st.dist * sp) / off) * amp); cx.lineTo(VW, groundY); cx.fill(); };
    hill(mix(b.hill2, nb.hill2, tt), 70, 22, 14, 46); hill(mix(b.hill, nb.hill, tt), 45, 14, 26, 18);
    // árboles de fondo
    for (let i = 0; i < 5; i++) { const x = ((i * 140 - st.dist * 38) % (VW + 160) + VW + 160) % (VW + 160) - 60; cx.fillStyle = '#4a3320'; cx.fillRect(x - 3, groundY - 52, 6, 52); cx.fillStyle = mix('#3f8f3a', '#1e5a2c', night ? 1 : tt); cx.beginPath(); cx.arc(x, groundY - 62, 22, 0, 7); cx.arc(x - 14, groundY - 50, 15, 0, 7); cx.arc(x + 14, groundY - 50, 15, 0, 7); cx.fill(); }
    // suelo
    cx.fillStyle = mix(b.ground, nb.ground, tt); cx.fillRect(0, groundY, VW, 16);
    cx.fillStyle = mix(b.dirt, nb.dirt, tt); cx.fillRect(0, groundY + 16, VW, LH - groundY);
    cx.strokeStyle = '#1d1a16'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(0, groundY + 16); cx.lineTo(VW, groundY + 16); cx.stroke();
    cx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 40; i++) { const x = ((i * 53 - st.dist * 40) % VW + VW) % VW; cx.fillRect(x, groundY + 24 + (i * 37) % Math.max(10, LH - groundY - 30), 8, 3); }
    cx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 30; i++) { const x = ((i * 31 - st.dist * 40) % VW + VW) % VW; cx.fillRect(x, groundY + 2, 2, 7); }
    // obstáculos
    for (const o of st.obs) drawObs(o);
    for (const p of st.picks) drawPick(p);
    // proyectiles
    for (const p of st.proj) {
      cx.fillStyle = '#35b7ff'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(p.x, p.y, 9, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = 'rgba(255,255,255,.7)'; cx.beginPath(); cx.arc(p.x - 3, p.y - 3, 3, 0, 7); cx.fill();
      cx.fillStyle = 'rgba(53,183,255,.5)'; for (let i = 1; i < 4; i++) { cx.beginPath(); cx.arc(p.x - i * 12, p.y, 7 - i * 1.5, 0, 7); cx.fill(); }
    }
    // jugador
    const ducking = st.duck > 0 && st.onGround;
    const state = !st.onGround ? 'jump' : ducking ? 'duck' : 'run';
    if (!(st.inv > 0 && Math.floor(st.t * 14) % 2)) {
      cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(106, groundY + 14, 22 - Math.min(10, -st.py / 10), 5, 0, 0, 7); cx.fill();
      drawKid(cx, 106, groundY + st.py + 12, st.t, { state, hurt: st.hurtT > 0, power: st.powerFx > 0, faceImg: G.faceImg, jar: Math.min(3, st.count) });
    }
    // partículas y textos
    for (const q of st.parts) { cx.globalAlpha = clamp(q.life * 2.5, 0, 1); cx.fillStyle = q.c; cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, 7); cx.fill(); } cx.globalAlpha = 1;
    cx.font = '900 18px ui-rounded,Arial Rounded MT Bold,sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 4;
    for (const q of st.pops) { cx.globalAlpha = clamp(q.life * 2, 0, 1); cx.strokeStyle = '#1d1a16'; cx.strokeText(q.txt, q.x, q.y); cx.fillStyle = '#fff'; cx.fillText(q.txt, q.x, q.y); } cx.globalAlpha = 1;
    // aviso de bioma
    if (st.dist < 3) { bigText('🌳 JARDÍN'); }
    for (let i = 1; i < BIOMES.length; i++) { const d = st.dist - BIOMES[i].start; if (d >= 0 && d < 4) bigText((i === 1 ? '🌲 ' : '🌙 ') + BIOMES[i].name.toUpperCase()); }
    if (st.dist < 4 && st.t > 0.3) { cx.fillStyle = 'rgba(0,0,0,.45)'; }
  }
  function bigText(t) {
    cx.font = '900 34px ui-rounded,Arial Rounded MT Bold,sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 6; cx.strokeStyle = '#1d1a16';
    cx.strokeText(t, VW / 2, groundY * 0.4); cx.fillStyle = '#ffe27a'; cx.fillText(t, VW / 2, groundY * 0.4);
  }

  function drawObs(o) {
    cx.lineWidth = 2.5; cx.strokeStyle = '#1d1a16';
    if (o.k === 'rock') {
      cx.fillStyle = '#9a9a9a'; cx.beginPath(); cx.moveTo(o.x - 22, o.y + 12); cx.quadraticCurveTo(o.x - 22, o.y - 22, o.x - 4, o.y - 20); cx.quadraticCurveTo(o.x + 22, o.y - 22, o.x + 22, o.y + 12); cx.closePath(); cx.fill(); cx.stroke();
      cx.fillStyle = '#b8b8b8'; cx.beginPath(); cx.ellipse(o.x - 6, o.y - 10, 7, 4, -0.4, 0, 7); cx.fill();
    } else if (o.k === 'dry') {
      cx.fillStyle = '#e3c27a'; cx.beginPath(); cx.roundRect(o.x - o.w / 2, o.y - 4, o.w, 18, 6); cx.fill(); cx.stroke();
      cx.strokeStyle = '#b8924a'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(o.x - 40, o.y + 2); cx.lineTo(o.x - 28, o.y + 9); cx.lineTo(o.x - 14, o.y + 1); cx.moveTo(o.x + 10, o.y + 3); cx.lineTo(o.x + 24, o.y + 10); cx.lineTo(o.x + 36, o.y + 2); cx.stroke();
      cx.font = '22px sans-serif'; cx.textAlign = 'center'; cx.fillText('☀️', o.x, o.y - 14 + Math.sin(st.t * 4) * 2);
    } else if (o.k === 'bird') {
      const fl = Math.sin(st.t * 14 + o.ph);
      cx.fillStyle = '#5b6f9a'; cx.beginPath(); cx.ellipse(o.x, o.y + 8, 22, 12, 0, 0, 7); cx.fill(); cx.stroke();
      cx.beginPath(); cx.arc(o.x - 18, o.y + 2, 9, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = '#ffb300'; cx.beginPath(); cx.moveTo(o.x - 26, o.y + 1); cx.lineTo(o.x - 38, o.y + 5); cx.lineTo(o.x - 26, o.y + 8); cx.fill(); cx.stroke();
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(o.x - 20, o.y, 3, 0, 7); cx.fill(); cx.fillStyle = '#000'; cx.beginPath(); cx.arc(o.x - 21, o.y, 1.4, 0, 7); cx.fill();
      cx.fillStyle = '#7b8fc0'; cx.beginPath(); cx.moveTo(o.x - 4, o.y + 4); cx.quadraticCurveTo(o.x + 4, o.y - 22 * fl - 6, o.x + 20, o.y - 16 * fl); cx.quadraticCurveTo(o.x + 10, o.y + 4, o.x - 4, o.y + 6); cx.fill(); cx.stroke();
    } else if (o.k === 'spider') {
      const t = st.t * 12 + o.ph;
      cx.strokeStyle = '#1d1a16'; cx.lineWidth = 3;
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
        const ph = Math.sin(t + i) * 4;
        cx.beginPath(); cx.moveTo(o.x + sd * 4, o.y - 12); cx.lineTo(o.x + sd * (16 + i * 2), o.y - 22 + i * 3 + ph); cx.lineTo(o.x + sd * (24 + i * 3), o.y + 12 + (ph > 0 ? 0 : -2)); cx.stroke();
      }
      cx.fillStyle = '#5a2d82'; cx.beginPath(); cx.ellipse(o.x + 6, o.y - 12, 15, 11, 0, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = '#7a3da8'; cx.beginPath(); cx.arc(o.x - 10, o.y - 12, 8, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(o.x - 13, o.y - 14, 2.6, 0, 7); cx.arc(o.x - 7, o.y - 14, 2.6, 0, 7); cx.fill();
      cx.fillStyle = '#e5483b'; cx.beginPath(); cx.arc(o.x - 13, o.y - 14, 1.2, 0, 7); cx.arc(o.x - 7, o.y - 14, 1.2, 0, 7); cx.fill();
    }
  }
  function drawPick(p) {
    if (p.k === 'c') { drawBall(cx, p.x, p.y + Math.sin(st.t * 6 + p.x * 0.05) * 1.5, 11, p.rot); return; }
    cx.font = '30px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    const e = { hoja: '🍃', verdura: '🥕', calcio: '🦴', corteza: '🪵' }[p.k];
    cx.fillStyle = 'rgba(255,255,255,.55)'; cx.beginPath(); cx.arc(p.x, p.y, 20, 0, 7); cx.fill();
    cx.fillStyle = '#000'; cx.fillText(e, p.x, p.y + 2 + Math.sin(st.t * 5) * 3); cx.textBaseline = 'alphabetic';
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused && !over) update(dt);
    else if (over) { for (const q of st.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt; q.life -= dt; } st.parts = st.parts.filter(q => q.life > 0); }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function setPaused(p) { if (over) return; paused = p; $('#pauseOv').classList.toggle('hidden', !p); }

  function init() {
    const bind = (id, fn) => {
      const el = $(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('down'); fn(); });
      const up = () => el.classList.remove('down');
      el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
      el.addEventListener('contextmenu', e => e.preventDefault());
    };
    bind('#bJump', jump); bind('#bDuck', duck); bind('#bPower', power);
    $('#bPause').onclick = () => setPaused(true);
    $('#bResume').onclick = () => setPaused(false);
    $('#bQuit').onclick = () => { setPaused(false); endRun(); };
    window.addEventListener('keydown', e => {
      if (current !== 'runner') return;
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); }
      else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); duck(); }
      else if (e.key === 'x' || e.key === 'z' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); power(); }
      else if (e.key === 'p' || e.key === 'Escape') setPaused(!paused);
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });
    document.addEventListener('visibilitychange', () => { if (document.hidden && running && !over) setPaused(true); });
  }

  return { init, start, stop, get state() { return st; } , addGain() {} };
})();
