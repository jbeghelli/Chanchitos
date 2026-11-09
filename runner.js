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
  ctx.fillStyle = '#d6204a'; for (let i = 0; i < Math.min(3, (o.jar | 0)); i++) { ctx.beginPath(); ctx.arc(-3 + i * 4, 6, 3, 0, 7); ctx.fill(); }
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

const Runner = (() => {
  const LW = 400;
  const GIFTS = ['hoja', 'hoja', 'verdura', 'calcio', 'corteza', 'rama', 'palito', 'piedra', 'pina'];
  const GIFT_ICON = { heart: '❤️', hoja: '🍃', verdura: '🥕', calcio: '🦴', corteza: '🪵', rama: '🌿', palito: '🥢', piedra: '🪨', pina: '🌰' };
  const GIFT_NAME = { hoja: 'Hoja', verdura: 'Zanahoria', calcio: 'Calcio', corteza: 'Corteza', rama: 'Rama', palito: 'Palito', piedra: 'Piedra', pina: 'Piña' };
  let cv, cx, W, H, S, LH, VW = 400, groundY;
  let raf = 0, last = 0, running = false, paused = false, over = false;
  let st;           // estado de la carrera
  const keys = {};
  function resize() {
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = r.width * d; cv.height = r.height * d; W = r.width; H = r.height;
    S = Math.min(cv.width / LW, cv.height / 300); VW = cv.width / S; LH = cv.height / S;
    groundY = Math.min(LH * 0.66, LH - 76);
  }

  function newState() {
    const level = clamp(G.runLevel || G.save.level || 1, 1, 10), len = LEVELS[level - 1].len;
    const cp = G.cp && G.cp.level === level ? G.cp.dist : 0;
    return {
      t: 0, dist: cp, len, speed: 170, hearts: 3, count: 0, charge: 1, prog: 0, level, cp, cpSet: !!cp, hearted: {}, flag: false, finishing: 0, won: false, stopSpawn: false,
      banner: { txt: (['🌳', '🌲', '🌙'][(level - 1) % 3]) + ' NIVEL ' + level, sub: cp ? '🚩 Sigues desde la mitad' : '', t: 2.4 },
      py: 0, vy: 0, onGround: true, duck: 0, inv: 0, powerFx: 0, shot: 0, holdDuck: false,
      obs: [], picks: [], proj: [], parts: [], pops: [], spawn: 1.2,
      gain: { hoja: 0, verdura: 0, calcio: 0, corteza: 0, rama: 0, palito: 0, piedra: 0, pina: 0 }, seen: {}, ended: false, hurtT: 0
    };
  }

  function start() {
    cv = $('#rc'); cx = cv.getContext('2d');
    resize(); st = newState(); over = false; paused = false;
    $('#pauseOv').classList.add('hidden'); $('#resOv').classList.add('hidden');
    updHUD(); updProg();
    { const h = $('#hint'); h.classList.remove('off'); clearTimeout(Runner._ht); Runner._ht = setTimeout(() => h.classList.add('off'), 5500); }
    if (!G.save.facts.crust) unlockFact('crust', true);
    running = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
  }
  function stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); }

  function jump() {
    if (!running || paused || over) return;
    if (st.onGround) { $('#hint').classList.add('off'); st.vy = -740; st.onGround = false; st.duck = 0; SFX.jump(); }
  }
  function duck() {
    if (!running || paused || over) return;
    if (st.onGround) { if (st.duck <= 0) SFX.duck(); st.duck = 0.65; }
    else st.vy = Math.max(st.vy, 520);  // caer rápido
  }
  // mantener apretado: agachado mientras dure el toque
  function duckHold(on) {
    if (!running || paused || over) return;
    st.holdDuck = on;
    if (on) { if (st.onGround) { if (st.duck <= 0) SFX.duck(); st.duck = 0.12; } else st.vy = Math.max(st.vy, 520); }
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
  const pickW = list => { let t = 0; for (const [, w] of list) t += w; let r = Math.random() * t; for (const [k, w] of list) { if ((r -= w) < 0) return k; } return list[0][0]; };
  function spawnPattern() {
    const x0 = VW + 60, g = groundY;
    const prog = clamp(st.dist / st.len, 0, 1);
    const d = clamp(prog * 0.6 + Math.min(0.4, (st.level - 1) * 0.1), 0, 1);     // dificultad 0..1
    const easy = st.level === 1 && prog < 0.1;                                       // comienzo tranquilo
    const L = [['rock', 22], ['line', 12], ['gift', 7]];
    if (!easy) {
      L.push(['dry', 14], ['bird', 14 + d * 6], ['lizard', 8 + d * 12]);
      if (d > 0.25) L.push(['rock2', 8 + d * 8], ['lizardrock', 8 + d * 6]);
      if (d > 0.4) L.push(['drybird', 10], ['birdlizard', 8 + d * 6], ['trio', 6 + d * 6]);
    }
    // corazón extra en 25%, 50% y 75% del nivel
    for (const q of [0.25, 0.5, 0.75]) if (prog >= q && !st.hearted[q] && st.hearts < 3) { st.hearted[q] = 1; st.picks.push({ k: 'heart', x: x0 + 20, y: g - 50, r: 16, rot: 0 }); }
    const k = pickW(L);
    if (k === 'rock') { st.obs.push({ k: 'rock', x: x0 + 60, y: g, w: 40, h: 30 }); chans(x0 + 20, g - 30, 5, 24, arc(88)); }
    else if (k === 'dry') { st.obs.push({ k: 'dry', x: x0 + 70, y: g, w: 60, h: 12 }); chans(x0 + 28, g - 26, 5, 24, arc(95)); }
    else if (k === 'bird') { st.obs.push({ k: 'bird', x: x0 + 40, y: g - 52, w: 52, h: 30, ph: rnd(0, 6) }); chans(x0 - 10, g - 14, 6, 28, 0); }
    else if (k === 'lizard') { st.obs.push({ k: 'lizard', x: x0 + 20, y: g, w: 40, h: 26, ph: rnd(0, 6), hp: 1 }); chans(x0 + 120, g - 14, 4, 26, 0); }
    else if (k === 'line') chans(x0, g - 14, 7, 26, 0);
    else if (k === 'gift') { st.picks.push({ k: pick(GIFTS), x: x0 + 30, y: g - 44, r: 16, rot: 0 }); chans(x0 + 80, g - 14, 3, 26, 0); }
    else if (k === 'rock2') { st.obs.push({ k: 'rock', x: x0 + 40, y: g, w: 40, h: 30 }, { k: 'rock', x: x0 + 270, y: g, w: 40, h: 30 }); chans(x0 + 10, g - 30, 4, 24, arc(80)); chans(x0 + 240, g - 30, 4, 24, arc(80)); }
    else if (k === 'lizardrock') { st.obs.push({ k: 'lizard', x: x0 + 20, y: g, w: 40, h: 26, ph: rnd(0, 6), hp: 1 }, { k: 'rock', x: x0 + 300, y: g, w: 40, h: 30 }); chans(x0 + 270, g - 30, 4, 24, arc(85)); }
    else if (k === 'drybird') { st.obs.push({ k: 'dry', x: x0 + 40, y: g, w: 60, h: 12 }, { k: 'bird', x: x0 + 320, y: g - 52, w: 52, h: 30, ph: 0 }); chans(x0 + 270, g - 14, 4, 26, 0); }
    else if (k === 'birdlizard') { st.obs.push({ k: 'bird', x: x0 + 20, y: g - 52, w: 52, h: 30, ph: 1 }, { k: 'lizard', x: x0 + 330, y: g, w: 40, h: 26, ph: 2, hp: 1 }); chans(x0 + 120, g - 14, 4, 26, 0); }
    else if (k === 'trio') { st.obs.push({ k: 'rock', x: x0 + 30, y: g, w: 40, h: 30 }, { k: 'bird', x: x0 + 290, y: g - 52, w: 52, h: 30, ph: 0 }, { k: 'rock', x: x0 + 560, y: g, w: 40, h: 30 }); chans(x0 + 400, g - 14, 4, 26, 0); }
    const reach = k === 'rock2' ? 300 : k === 'lizardrock' ? 340 : k === 'drybird' ? 360 : k === 'birdlizard' ? 370 : k === 'trio' ? 600 : 0;
    const gapPx = Math.max(240, rnd(290, 380) * (1 - 0.25 * d)) + reach;
    st.spawn = gapPx / st.speed;
  }

  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function puff(x, y, col, n) { for (let i = 0; i < (n || 8); i++) st.parts.push({ x, y, vx: rnd(-120, 120), vy: rnd(-200, 40), life: rnd(0.3, 0.6), c: col || '#fff', r: rnd(2, 4) }); }
  function pop(x, y, txt) { st.pops.push({ x, y, txt, life: 0.9 }); }

  function hurt(why) {
    if (st.inv > 0 || st.finishing) return;
    st.hearts--; st.inv = 1.6; st.hurtT = 0.4; SFX.hurt();
    puff(100, groundY + st.py - 30, '#ff6b6b', 10);
    if (why === 'dry' && !st.seen.dry) { st.seen.dry = 1; unlockFact('moisture'); }
    updHUD();
    if (st.hearts <= 0) endRun(false);
  }

  function update(dt) {
    st.t += dt;
    const prog = clamp(st.dist / st.len, 0, 1);
    if (st.finishing) { st.finishing += dt; st.speed = Math.max(0, st.speed - 260 * dt); }
    else st.speed = lerp(st.speed, Math.min(290, 170 + (st.level - 1) * 12 + 40 * prog), Math.min(1, dt * 0.6));
    st.dist += st.speed * dt / 40;
    if (!st.finishing) {
      const toFlag = (VW + 60 - 106) / 40;
      if (!st.cpSet && st.dist >= st.len / 2) { st.cpSet = true; G.cp = { level: st.level, dist: st.len / 2 }; st.banner = { txt: '🚩 ¡MITAD!', sub: 'Si te caes, sigues desde aquí', t: 2.2 }; SFX.food(); }
      if (!st.stopSpawn && st.dist >= st.len - toFlag - 9) st.stopSpawn = true;
      if (!st.flag && st.dist >= st.len - toFlag) { st.flag = true; st.obs.push({ k: 'flag', x: VW + 60, y: groundY, w: 30, h: 100 }); }
    }
    // jugador
    if (!st.onGround) { st.vy += 1900 * dt; st.py += st.vy * dt; if (st.py >= 0) { st.py = 0; st.vy = 0; st.onGround = true; } }
    if (st.duck > 0) st.duck -= dt;
    if (keys.ArrowDown || keys.s || st.holdDuck) { if (st.onGround) st.duck = Math.max(st.duck, 0.12); }
    if (st.inv > 0) st.inv -= dt; if (st.powerFx > 0) st.powerFx -= dt; if (st.hurtT > 0) st.hurtT -= dt;
    // caja del jugador
    const ducking = st.duck > 0 && st.onGround;
    const pb = { x: 92, y: groundY + st.py - (ducking ? 30 : 58), w: 28, h: ducking ? 30 : 58 };
    // generar
    st.spawn -= dt; if (st.spawn <= 0 && !st.stopSpawn) spawnPattern();
    const dx = st.speed * dt;
    // obstáculos
    for (const o of st.obs) {
      if (o.k === 'flag') { o.x -= dx; if (!st.finishing && o.x <= 112) finishLevel(); continue; }
      o.x -= dx + (o.k === 'lizard' ? 55 * dt : o.k === 'bird' ? 35 * dt : 0);
      if (o.k === 'bird') o.y += Math.sin(st.t * 5 + o.ph) * 0.4;
      const bx = { x: o.x - o.w / 2 + 6, y: o.y - o.h + 4, w: o.w - 12, h: o.h - 8 };
      if (o.k === 'bird') { bx.y = o.y - 6; bx.h = o.h - 4; }
      if (o.k === 'dry') { bx.y = o.y - 8; bx.h = 12; bx.x = o.x - o.w / 2 + 8; bx.w = o.w - 16; }
      if (!st.finishing && hit(pb, bx)) { o.dead = o.k !== 'dry' && o.k !== 'rock' ? true : o.dead; hurt(o.k); if (o.k === 'lizard' || o.k === 'bird') { puff(o.x, o.y - 10, '#222', 6); } }
      if (!st.seen[o.k] && o.x < VW - 40 && o.x > 100) {
        st.seen[o.k] = 1;
        if (o.k === 'lizard' || o.k === 'bird') unlockFact('predators');
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
        if (o.k === 'lizard' || o.k === 'bird') {
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
    if (st.banner) { st.banner.t -= dt; if (st.banner.t <= 0) st.banner = null; }
    if (st.t - (st._pt || 0) > 0.25) { st._pt = st.t; updProg(); }
  }

  function collect(p) {
    if (p.k === 'c') {
      st.count++; st.prog++; SFX.pick(); puff(p.x, p.y, '#ff9ab0', 5); updProg();
      if (st.prog >= 5) { st.prog = 0; if (st.charge < 3) { st.charge++; pop(106, groundY + st.py - 80, '+1 💧'); SFX.food(); } }
      updHUD();
    } else if (p.k === 'heart') {
      st.hearts = Math.min(3, st.hearts + 1); SFX.food(); pop(106, groundY + st.py - 80, '+1 ❤️'); updHUD();
    } else {
      st.gain[p.k]++; SFX.food();
      pop(106, groundY + st.py - 80, '+' + GIFT_ICON[p.k] + ' ' + GIFT_NAME[p.k]);
      if (p.k === 'hoja') unlockFact('decomp'); else if (p.k === 'verdura') unlockFact('veg'); else if (p.k === 'calcio') unlockFact('calcium'); else if (p.k === 'corteza') unlockFact('home'); else unlockFact('group');
    }
  }
  function updProg() {
    $('#rDist').textContent = '⭐' + st.level + ' · 🌺' + st.count;
    $('#rCount').textContent = '🏁 ' + Math.round(clamp(st.dist / st.len, 0, 1) * 100) + '%';
  }
  function finishLevel() {
    if (st.finishing) return;
    st.finishing = 0.001; st.inv = 99; st.won = true; SFX.win();
    st.banner = { txt: '🏁 ¡META!', sub: '', t: 3 };
    for (let i = 0; i < 40; i++) st.parts.push({ x: rnd(60, VW - 60), y: rnd(20, groundY * 0.6), vx: rnd(-40, 40), vy: rnd(-60, 40), life: rnd(0.8, 1.6), c: pick(['#ffe27a', '#ff6b6b', '#6bd0ff', '#7be07b', '#fff']), r: rnd(3, 5) });
    // premio: el bicho de este nivel (el primero es «nuevo»; repetir el nivel da otro igual)
    st.reward = LEVELS[st.level - 1].bug; st.rewardNew = giveBug(st.reward, 1);
    G.save.done[st.level] = true;
    if (st.level >= (G.save.level || 1) && st.level < 10) G.save.level = st.level + 1;
    G.save.best = Math.max(G.save.best || 0, st.level); G.cp = null; persist();
    setTimeout(() => endRun(true), 2300);
  }
  function updHUD() {
    $('#hearts').textContent = '❤️'.repeat(Math.max(0, st.hearts)) + '🖤'.repeat(Math.max(0, 3 - st.hearts));
    let h = ''; for (let i = 0; i < 3; i++) h += '<i class="' + (i < st.charge ? 'on' : '') + '"></i>';
    h += '<b>' + st.prog + '/5</b>';
    $('#power').innerHTML = h;
    $('#bPower').classList.toggle('empty', st.charge < 1);
  }

  function endRun(won) {
    if (over) return; over = true; st.ended = true;
    const inv = G.save.inv; for (const k in st.gain) inv[k] = (inv[k] || 0) + st.gain[k];
    const flores = Math.floor(st.count / 10); inv.flor = (inv.flor || 0) + flores;   // cada 10 copihues = 1 flor para el terrario
    G.save.runs++; G.save.rescued += st.count; persist();
    if (!won) SFX.hurt();
    $('#toast').innerHTML = '';
    const pend = (G.pending || []).slice(0, 1).map(id => FACT_BY_ID[id]);
    let fs = pend; if (!fs.length) { const f0 = pick(FACTS.filter(f => f.bug === 'general')); unlockFact(f0.id, true); fs = [f0]; }
    const nm = G.save.name ? G.save.name : '';
    const found = Object.keys(st.gain).filter(k => st.gain[k]).map(k => GIFT_ICON[k] + '×' + st.gain[k]).join(' ');
    const cpOk = !won && G.cp && G.cp.level === st.level;
    const pct = Math.round(clamp(st.dist / st.len, 0, 1) * 100);
    let reward = '';
    if (won) { const b = BUG_BY_ID[st.reward];
      reward = '<div class="reward"><img src="' + Art.icon(b.id, 96) + '" alt=""><div><small>' + (st.rewardNew ? '¡NUEVO BICHO!' : 'Otro más para tu mochila') + '</small><b>' + b.n + '</b><i>' + b.sci + '</i></div></div>'; }
    $('#resCard').innerHTML =
      '<h2>' + (won ? '🏁 ¡Nivel ' + st.level + ' completo!' : '¡Casi' + (nm ? ', ' + nm : '') + '!') + '</h2>' + reward +
      '<div class="stats"><div>🌺 ' + st.count + '<small>copihues' + (flores ? ' (+' + flores + ' flor' + (flores > 1 ? 'es' : '') + ' 🎒)' : '') + '</small></div><div>🏁 ' + pct + '%<small>del camino</small></div><div>🎒 ' + bagTotal() + '<small>bichos en tu mochila</small></div></div>' +
      '<p>' + (won ? 'Ve al terrario y pon a tu nuevo bicho en la tierra 🏡' : cpOk ? 'Llegaste a la mitad. Puedes seguir desde la bandera 🚩' : 'Llega hasta la bandera 🏁 para ganar el bicho de este nivel: <b>' + BUG_BY_ID[LEVELS[st.level - 1].bug].n + '</b>.') + (found ? '<br>Encontraste: ' + found : '') + '</p>' +
      fs.map((ff, i) => '<div class="factbox"><span class="ic">' + ff.ic + '</span><div><b>' + (pend.length ? '📖 ¡Dato nuevo! ' : '') + ff.t + '</b>' + ff.x + '</div><button class="round resSay" data-i="' + i + '">🔊</button></div>').join('') +
      (won ? '<button class="big azul" id="resTerr">🏡 PONERLO EN EL TERRARIO</button>' + (st.level < 10 ? '<button class="big verde" id="resAgain">▶ NIVEL ' + (st.level + 1) + '</button>' : '<button class="big verde" id="resAgain">🔁 JUGAR OTRA VEZ</button>')
           : '<button class="big verde" id="resAgain">' + (cpOk ? '🚩 SEGUIR DESDE LA MITAD' : '🔁 INTENTAR OTRA VEZ') + '</button><button class="big azul" id="resTerr">🏡 IR AL TERRARIO</button>') +
      '<button class="big gris" id="resMenu">MENÚ</button>';
    document.querySelectorAll('.resSay').forEach(b => b.onclick = () => { const ff = fs[+b.dataset.i]; speak(ff.t + '. ' + ff.x); });
    $('#resTerr').onclick = () => show('terr');
    $('#resAgain').onclick = () => { G.runLevel = won && st.level < 10 ? st.level + 1 : st.level; stop(); start(); };
    $('#resMenu').onclick = () => show('menu');
    setTimeout(() => $('#resOv').classList.remove('hidden'), won ? 100 : 450);
  }

  /* --- Dibujo --- */
  function drawDeco(b, night) {
    const kind = b.deco, shade = night ? 0.55 : 1;
    const dark = (col, k) => { const c = [1, 3, 5].map(i => parseInt(col.substr(i, 2), 16)); return 'rgb(' + c.map(v => Math.round(v * k)).join(',') + ')'; };
    const sc = (i, gap, sp) => ((i * gap - st.dist * sp) % (VW + gap * 1.2) + VW + gap * 1.2) % (VW + gap * 1.2) - gap * 0.5;
    const g = groundY;
    if (kind === 'trees') for (let i = 0; i < 5; i++) { const x = sc(i, 140, 38); cx.fillStyle = '#4a3320'; cx.fillRect(x - 3, g - 52, 6, 52); cx.fillStyle = night ? '#1e5a2c' : '#3f8f3a'; cx.beginPath(); cx.arc(x, g - 62, 22, 0, 7); cx.arc(x - 14, g - 50, 15, 0, 7); cx.arc(x + 14, g - 50, 15, 0, 7); cx.fill(); }
    else if (kind === 'bushes') for (let i = 0; i < 7; i++) { const x = sc(i, 95, 38); cx.fillStyle = dark('#4f9d3a', shade); cx.beginPath(); cx.arc(x, g - 10, 18, 0, 7); cx.arc(x - 16, g - 4, 13, 0, 7); cx.arc(x + 16, g - 4, 13, 0, 7); cx.fill(); cx.fillStyle = '#ff7a9a'; for (let k = 0; k < 3; k++) { cx.beginPath(); cx.arc(x - 9 + k * 9, g - 14 + (k % 2) * 6, 2.4, 0, 7); cx.fill(); } }
    else if (kind === 'pines') for (let i = 0; i < 6; i++) { const x = sc(i, 110, 38), h = 70 + (i % 3) * 14; cx.fillStyle = '#4a3320'; cx.fillRect(x - 3, g - 14, 6, 14); cx.fillStyle = dark('#1f6b3a', shade); for (let k = 0; k < 3; k++) { cx.beginPath(); cx.moveTo(x, g - h + k * 18); cx.lineTo(x - 22 + k * 3, g - 14 - (2 - k) * 14); cx.lineTo(x + 22 - k * 3, g - 14 - (2 - k) * 14); cx.closePath(); cx.fill(); } }
    else if (kind === 'cactus') for (let i = 0; i < 5; i++) { const x = sc(i, 120, 38), h = 56 + (i % 3) * 12; cx.fillStyle = '#5a9a4a'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2; cx.beginPath(); cx.roundRect(x - 7, g - h, 14, h, 7); cx.fill(); cx.stroke(); cx.beginPath(); cx.roundRect(x - 22, g - h * 0.7, 9, 24, 4); cx.fill(); cx.stroke(); cx.beginPath(); cx.roundRect(x + 13, g - h * 0.55, 9, 20, 4); cx.fill(); cx.stroke(); }
    else if (kind === 'chagual') for (let i = 0; i < 5; i++) { const x = sc(i, 130, 38); cx.strokeStyle = '#4a7a3a'; cx.lineWidth = 3; for (let k = -3; k <= 3; k++) { cx.beginPath(); cx.moveTo(x, g); cx.quadraticCurveTo(x + k * 9, g - 22, x + k * 14, g - 34 + Math.abs(k) * 4); cx.stroke(); } if (i % 2 === 0) { cx.strokeStyle = '#6a8a4a'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, g - 8); cx.lineTo(x, g - 78); cx.stroke(); cx.fillStyle = '#c8d86a'; for (let k = 0; k < 5; k++) { cx.beginPath(); cx.arc(x + (k % 2 ? 4 : -4), g - 80 + k * 7, 3.4, 0, 7); cx.fill(); } } }
    else if (kind === 'reeds') { cx.fillStyle = 'rgba(70,170,230,.85)'; cx.fillRect(0, g - 20, VW, 20); cx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 14; i++) cx.fillRect(sc(i, 40, 30), g - 14 + (i % 3) * 5, 14, 2);
      for (let i = 0; i < 9; i++) { const x = sc(i, 70, 38); cx.strokeStyle = '#4a7a3a'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(x, g); cx.lineTo(x + 2, g - 50 - (i % 3) * 10); cx.stroke(); cx.fillStyle = '#6b4226'; cx.beginPath(); cx.roundRect(x - 1, g - 62 - (i % 3) * 10, 6, 16, 3); cx.fill(); } }
    else if (kind === 'rocks') for (let i = 0; i < 6; i++) { const x = sc(i, 110, 38), w = 30 + (i % 3) * 14; cx.fillStyle = dark('#8a8680', shade); cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x - w, g); cx.lineTo(x - w * 0.6, g - w * 0.9); cx.lineTo(x + w * 0.1, g - w * 1.2); cx.lineTo(x + w, g); cx.closePath(); cx.fill(); cx.stroke(); }
  }

  function draw() {
    cx.setTransform(S, 0, 0, S, 0, 0);
    const b = LEVELS[st.level - 1].biome, night = !!b.stars;
    const sky = cx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, b.sky[0]); sky.addColorStop(1, b.sky[1]);
    cx.fillStyle = sky; cx.fillRect(0, 0, VW, LH);
    // sol / luna y estrellas
    cx.fillStyle = b.sun === 'moon' ? '#f4f1d8' : '#fff3a0'; cx.beginPath(); cx.arc(VW - 60, groundY * 0.28, 26, 0, 7); cx.fill();
    if (night) { cx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 24; i++) { cx.fillRect((i * 97 + 31) % VW, (i * 53) % (groundY * 0.7), 2, 2); } }
    // nubes
    cx.fillStyle = night ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.85)';
    for (let i = 0; i < 4; i++) { const x = ((i * 190 - st.dist * 6) % (VW + 200) + VW + 200) % (VW + 200) - 100, y = groundY * (0.18 + (i % 3) * 0.12); cx.beginPath(); cx.ellipse(x, y, 42, 14, 0, 0, 7); cx.ellipse(x + 24, y - 8, 28, 14, 0, 0, 7); cx.fill(); }
    // colinas
    const hill = (col, off, amp, sp, base) => { cx.fillStyle = col; cx.beginPath(); cx.moveTo(0, groundY); for (let x = 0; x <= VW; x += 12) cx.lineTo(x, groundY - base - Math.sin((x + st.dist * sp) / off) * amp); cx.lineTo(VW, groundY); cx.fill(); };
    hill(b.hill2, 70, 22, 14, 46); hill(b.hill, 45, 14, 26, 18);
    drawDeco(b, night);
    // suelo
    cx.fillStyle = b.ground; cx.fillRect(0, groundY, VW, 16);
    cx.fillStyle = b.dirt; cx.fillRect(0, groundY + 16, VW, LH - groundY);
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
    const state = st.finishing && st.speed < 30 ? 'idle' : !st.onGround ? 'jump' : ducking ? 'duck' : 'run';
    if (!(st.inv > 0 && Math.floor(st.t * 14) % 2)) {
      cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(106, groundY + 14, 22 - Math.min(10, -st.py / 10), 5, 0, 0, 7); cx.fill();
      drawKid(cx, 106, groundY + st.py + 12, st.t, { state, hurt: st.hurtT > 0, power: st.powerFx > 0 || (st.finishing && st.speed < 30), faceImg: G.faceImg, jar: Math.min(3, st.count) });
    }
    // partículas y textos
    for (const q of st.parts) { cx.globalAlpha = clamp(q.life * 2.5, 0, 1); cx.fillStyle = q.c; cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, 7); cx.fill(); } cx.globalAlpha = 1;
    cx.font = '900 18px ui-rounded,Arial Rounded MT Bold,sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 4;
    for (const q of st.pops) { cx.globalAlpha = clamp(q.life * 2, 0, 1); cx.strokeStyle = '#1d1a16'; cx.strokeText(q.txt, q.x, q.y); cx.fillStyle = '#fff'; cx.fillText(q.txt, q.x, q.y); } cx.globalAlpha = 1;
    // aviso de bioma
    if (st.banner) { cx.globalAlpha = clamp(st.banner.t * 1.5, 0, 1); bigText(st.banner.txt, st.banner.sub); cx.globalAlpha = 1; }
  }
  function bigText(t, sub) {
    cx.font = '900 34px ui-rounded,Arial Rounded MT Bold,sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 6; cx.strokeStyle = '#1d1a16';
    cx.strokeText(t, VW / 2, groundY * 0.4); cx.fillStyle = '#ffe27a'; cx.fillText(t, VW / 2, groundY * 0.4);
    if (sub) { cx.font = '800 16px ui-rounded,Arial Rounded MT Bold,sans-serif'; cx.lineWidth = 4; cx.strokeText(sub, VW / 2, groundY * 0.4 + 28); cx.fillStyle = '#fff'; cx.fillText(sub, VW / 2, groundY * 0.4 + 28); }
  }

  function drawObs(o) {
    cx.lineWidth = 2.5; cx.strokeStyle = '#1d1a16';
    if (o.k === 'flag') {
      cx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { cx.fillStyle = i % 2 ? '#1d1a16' : '#fff'; cx.fillRect(o.x - 70 + i * 24, o.y + 12, 24, 6); }
      cx.fillStyle = '#d8d8d8'; cx.fillRect(o.x - 3, o.y - 100, 6, 112); cx.strokeRect(o.x - 3, o.y - 100, 6, 112);
      cx.fillStyle = '#ffd34d'; cx.beginPath(); cx.arc(o.x, o.y - 102, 6, 0, 7); cx.fill(); cx.stroke();
      const w = Math.sin(st.t * 6) * 4; cx.beginPath(); cx.moveTo(o.x + 3, o.y - 96); cx.lineTo(o.x + 52, o.y - 82 + w); cx.lineTo(o.x + 3, o.y - 62); cx.closePath(); cx.fillStyle = '#e5483b'; cx.fill(); cx.stroke();
      cx.font = '900 14px sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.fillText('🏁', o.x + 22, o.y - 76 + w / 2);
    } else if (o.k === 'rock') {
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
    } else if (o.k === 'lizard') {
      // lagartija (mira a la izquierda, viene hacia el niño)
      const t = st.t * 14 + o.ph;
      cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2.4; cx.lineCap = 'round';
      for (const [dx, ph] of [[-8, 0], [10, 2.2]]) for (const sd of [0, 1]) { const sw = Math.sin(t + ph + sd * 3) * 5; cx.beginPath(); cx.moveTo(o.x + dx, o.y - 8); cx.lineTo(o.x + dx + sw, o.y - 1); cx.stroke(); }
      cx.beginPath(); cx.moveTo(o.x + 18, o.y - 12); cx.quadraticCurveTo(o.x + 36, o.y - 10 + Math.sin(t * 0.5) * 3, o.x + 46, o.y - 20); cx.lineWidth = 6; cx.strokeStyle = '#1d1a16'; cx.stroke(); cx.lineWidth = 3.6; cx.strokeStyle = '#6a8f3a'; cx.stroke();
      cx.fillStyle = '#6a8f3a'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2.2;
      cx.beginPath(); cx.ellipse(o.x + 4, o.y - 12, 20, 9, 0, 0, 7); cx.fill(); cx.stroke();
      cx.beginPath(); cx.ellipse(o.x - 20, o.y - 13, 10, 7.5, -0.1, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = '#c8e07a'; cx.beginPath(); cx.ellipse(o.x + 2, o.y - 16, 12, 3, 0, 0, 7); cx.fill();
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(o.x - 22, o.y - 16, 2.8, 0, 7); cx.fill(); cx.fillStyle = '#111'; cx.beginPath(); cx.arc(o.x - 23, o.y - 16, 1.3, 0, 7); cx.fill();
    }
  }
  function drawPick(p) {
    if (p.k === 'c') { Art.copihue(cx, p.x, p.y + Math.sin(st.t * 6 + p.x * 0.05) * 1.5, 1.05, st.t + p.x); return; }
    cx.font = '30px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    const e = GIFT_ICON[p.k];
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
    bind('#bPower', power);
    // toque en la pantalla = saltar; mantener apretado = agacharse
    const area = $('#rc'); let holdTimer = 0, holding = false, ptr = null;
    area.addEventListener('pointerdown', e => {
      e.preventDefault(); if (ptr !== null || paused || over) return;
      ptr = e.pointerId; holding = false;
      try { area.setPointerCapture(e.pointerId); } catch (x) {}
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => { holding = true; duckHold(true); }, 170);
    });
    const release = e => {
      if (e.pointerId !== ptr) return;
      ptr = null; clearTimeout(holdTimer);
      if (holding) { holding = false; if (st) st.holdDuck = false; }
      else if (e.type === 'pointerup') jump();
    };
    area.addEventListener('pointerup', release); area.addEventListener('pointercancel', release);
    area.addEventListener('contextmenu', e => e.preventDefault());
    $('#bPause').onclick = () => setPaused(true);
    $('#bResume').onclick = () => setPaused(false);
    $('#bQuit').onclick = () => { setPaused(false); endRun(); };
    window.addEventListener('keydown', e => {
      if (current !== 'runner') return;
      keys[e.key] = true;
      if (e.repeat) { if (e.key === 'ArrowDown' || e.key === 's') e.preventDefault(); return; }
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
