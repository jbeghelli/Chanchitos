'use strict';
/* ====== Terrario vertical a pantalla completa: la colonia de chanchitos ======
   Modelo simple pero basado en su biología real:
   - Humedad (branquias): cada zona del suelo tiene su humedad; se evapora y se riega con el rociador.
   - Cinesis: más rápidos con sequedad, lentos con humedad; buscan la zona húmeda.
   - Nocturnos: de día se esconden bajo la corteza; la luz los asusta y los seca.
   - Comida: hojas, verduras (se enmohecen si sobran). Calcio para mudar el caparazón (en dos mitades).
   - Hembras con marsupio (mochila) que sueltan mancas (crías blancas).
   - Temperatura ideal 18-27 °C; sobre 30 °C sufren. */
const Terr = (() => {
  const TW = 360, TH = 620, GW = 12, GH = 20, DAY = 90;
  const BX = 14, BY = 14, BW = 332, BH = 592;           // caja de vidrio
  const MINX = 28, MAXX = 332, MINY = 30, MAXY = 592;   // zona transitable
  const LAMP = { x: 180, y: 130, r: 165 };
  const NAMES = ['Bolita', 'Pelusa', 'Pepita', 'Migajita', 'Roco', 'Tito', 'Luna', 'Nube', 'Canela', 'Motita', 'Gordi', 'Ñata', 'Coco', 'Pipa', 'Tuerca', 'Pichi', 'Kiwi', 'Maní', 'Chispa', 'Rulo'];
  const CAP_BASE = 22, CAP_BARK = 9, CAP_MAX = 80;

  let T = null;                       // estado de la colonia
  let cv, cx, scale = 1, ox = 0, oy = 0, cw = 0, ch = 0, dpr = 1;
  let raf = 0, last = 0, running = false, ro = null;
  let tool = 'look', sel = null, speed = 1, saveT = 0, advT = 0, infoT = 0, spraying = false, sprayAcc = 0;
  let parts = [], regen = 0, regenN = 0;
  let soilTex = null, humCv = null, decor = [], mossSpots = [];
  const hudCache = {};

  /* ---------- creación / carga ---------- */
  function newIso(o) {
    const sex = o && o.sex || (Math.random() < 0.5 ? 'F' : 'M');
    const age = o && o.age != null ? o.age : rnd(3, 9);
    return Object.assign({
      id: T.nextId++, name: pick(NAMES), sex, age, x: rnd(MINX + 20, MAXX - 20), y: rnd(MINY + 20, MAXY - 20), a: rnd(0, 6.28),
      hyd: 85, food: 70, cal: 70, hp: 100, molt: rnd(0, 0.9), molting: 0, preg: 0, brood: 0, cool: 0, curl: 0,
      shy: rnd(0.3, 1), hid: false, tx: null, ty: null, mode: 'wander', think: 0, eat: null, bark: null, ph: rnd(0, 6), life: rnd(70, 110), cause: ''
    }, o || {});
  }
  function newColony() {
    T = {
      t: DAY * 0.62, isos: [], items: [], hum: new Float32Array(GW * GH), moss: 0.15, lamp: false, vent: 0, heat: 0, nextHeat: DAY * rnd(3, 4),
      nextId: 1, born: 0, lost: 0, mold: 0, temp: 22, light: 0, over: 0
    };
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) T.hum[j * GW + i] = lerp(78, 42, i / (GW - 1)) + rnd(-5, 5);
    T.items.push({ id: T.nextId++, k: 'corteza', x: 90, y: 200, amt: 100, age: 0, mold: 0 });
    T.items.push({ id: T.nextId++, k: 'corteza', x: 250, y: 430, amt: 100, age: 0, mold: 0 });
    T.items.push({ id: T.nextId++, k: 'hoja', x: 120, y: 330, amt: 100, age: 0, mold: 0 });
    T.items.push({ id: T.nextId++, k: 'calcio', x: 230, y: 160, amt: 100, age: 0, mold: 0 });
    // regalo inicial: 2 hembras y 2 machos jóvenes
    ['F', 'M', 'F', 'M'].forEach(s => T.isos.push(newIso({ sex: s, age: rnd(10, 14) })));
    T.isos.forEach(i => { i.molt = rnd(0, 0.6); });
  }
  function ensure() {
    if (T) return;
    const c = G.save.colony;
    if (c && c.isos) {
      T = Object.assign({}, c, { hum: Float32Array.from(c.hum) });
      T.isos.forEach(i => { i.hid = false; i.tx = i.ty = null; i.eat = i.bark = null; i.mode = 'wander'; i.think = 0; });
      T.over = 0; T.lamp = false; T.vent = 0;
    } else newColony();
    buildDecor();
  }
  function serialize() {
    if (!T) return;
    G.save.colony = {
      t: T.t, moss: T.moss, lamp: false, vent: 0, heat: T.heat, nextHeat: T.nextHeat, nextId: T.nextId, born: T.born, lost: T.lost, mold: T.mold, temp: T.temp, light: T.light, over: 0,
      hum: Array.from(T.hum, v => Math.round(v * 10) / 10),
      items: T.items.map(i => ({ id: i.id, k: i.k, x: i.x | 0, y: i.y | 0, amt: +i.amt.toFixed(1), age: +i.age.toFixed(1), mold: +i.mold.toFixed(2) })),
      isos: T.isos.map(i => ({ id: i.id, name: i.name, sex: i.sex, age: +i.age.toFixed(2), x: i.x | 0, y: i.y | 0, a: +i.a.toFixed(2), hyd: +i.hyd.toFixed(1), food: +i.food.toFixed(1), cal: +i.cal.toFixed(1), hp: +i.hp.toFixed(1), molt: +i.molt.toFixed(2), molting: 0, preg: +i.preg.toFixed(1), brood: i.brood, cool: i.cool | 0, curl: 0, shy: +i.shy.toFixed(2), ph: i.ph, life: i.life, cause: '' }))
    };
    persist();
  }
  function addRescued(n) {
    ensure();
    let added = 0;
    for (let k = 0; k < n; k++) {
      if (T.isos.length >= CAP_MAX) break;
      T.isos.push(newIso({ age: rnd(3, 12), hyd: 80, food: 70, cal: 70 })); added++;
    }
    serialize();
    return added;
  }
  function buildDecor() {
    // hojarasca decorativa y manchas de musgo (determinista para que no cambie)
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    decor = []; for (let i = 0; i < 16; i++) decor.push({ x: BX + 20 + r() * (BW - 40), y: BY + 20 + r() * (BH - 40), a: r() * 6.28, l: 14 + r() * 12, c: ['#8a5a2b', '#a06a30', '#6e4620', '#9b7a3a'][(r() * 4) | 0] });
    mossSpots = []; for (let i = 0; i < 14; i++) mossSpots.push({ x: BX + 18 + r() * (BW - 36), y: BY + 18 + r() * (BH - 36), r: 10 + r() * 14 });
    soilTex = document.createElement('canvas'); soilTex.width = BW; soilTex.height = BH;
    const c = soilTex.getContext('2d');
    for (let i = 0; i < 2600; i++) { const v = r(); c.fillStyle = v < 0.5 ? 'rgba(30,18,8,.35)' : v < 0.85 ? 'rgba(255,230,190,.18)' : 'rgba(0,0,0,.25)'; c.fillRect(r() * BW, r() * BH, 1 + r() * 2.5, 1 + r() * 2); }
    humCv = document.createElement('canvas'); humCv.width = GW; humCv.height = GH;
  }

  /* ---------- helpers ---------- */
  const cell = (x, y) => clamp(((y - BY) / BH * GH) | 0, 0, GH - 1) * GW + clamp(((x - BX) / BW * GW) | 0, 0, GW - 1);
  const humAt = (x, y) => T.hum[cell(x, y)];
  function ambient(p) { return p < 0.06 ? p / 0.06 : p < 0.52 ? 1 : p < 0.62 ? 1 - (p - 0.52) / 0.10 : 0; }
  const barks = () => T.items.filter(i => i.k === 'corteza');
  const capacity = () => Math.min(CAP_MAX, CAP_BASE + CAP_BARK * barks().length);
  const stage = i => i.age < 2 ? 'manca' : i.age < 10 ? 'joven' : 'adulto';
  const isoLen = i => lerp(8, 24, clamp(i.age / 12, 0, 1)) + (i.sex === 'F' ? 1.5 : 0);
  function spray(x, y, amt) {
    const R = 52;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const cx_ = BX + (i + 0.5) / GW * BW, cy_ = BY + (j + 0.5) / GH * BH;
      const d = Math.hypot(cx_ - x, cy_ - y); if (d > R + 20) continue;
      T.hum[j * GW + i] = Math.min(100, T.hum[j * GW + i] + amt * Math.max(0, 1 - d / (R + 20)));
    }
    for (let k = 0; k < 3; k++) parts.push({ x: x + rnd(-20, 20), y: y + rnd(-26, -8), vy: rnd(40, 90), life: rnd(0.3, 0.6), t: 'drop' });
  }

  /* ---------- simulación ---------- */
  function stepEnv(dt, off) {
    T.t += dt;
    const p = (T.t / DAY) % 1;
    T.light = ambient(p);
    // ola de calor
    if (T.heat > 0) T.heat -= dt;
    else if (!off && T.t > T.nextHeat) { T.heat = DAY * 0.9; T.nextHeat = T.t + DAY * rnd(5, 8); toast({ ic: '🥵', t: '¡Hoy hace mucho calor!', x: 'Apaga la luz, ventila y rocía agua para que los chanchitos no se sequen.' }); unlockFact('temp'); }
    T.temp = lerp(17.5, 23.5, T.light) + (T.heat > 0 ? 6 : 0) + (T.lamp ? 4 : 0) - (T.vent > 0 ? 1.5 : 0);
    if (T.vent > 0) T.vent -= dt;
    // evaporación
    const e = 0.13 * (1 + 0.06 * (T.temp - 22)) * (1 + (T.lamp ? 0.7 : 0)) * (1 + (T.vent > 0 ? 2 : 0)) * (1 - 0.35 * T.moss);
    const h = T.hum, nh = new Float32Array(h.length); let sum = 0;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const k = j * GW + i, v = h[k];
      const a = (i > 0 ? h[k - 1] : v) + (i < GW - 1 ? h[k + 1] : v) + (j > 0 ? h[k - GW] : v) + (j < GH - 1 ? h[k + GW] : v);
      let nv = v + Math.min(0.4, 0.25 * dt) * (a / 4 - v);
      nv -= e * dt * (0.5 + v / 100 * 0.8);
      nv = clamp(nv, 10, 100); nh[k] = nv; sum += nv;
    }
    T.hum = nh; T.avgHum = sum / nh.length;
    // musgo
    if (T.lamp && T.avgHum > 45) T.moss = Math.min(1, T.moss + 0.0025 * dt);
    else T.moss = Math.max(0.03, T.moss - (T.avgHum < 35 ? 0.003 : 0.0006) * dt);
    // objetos
    let mold = 0;
    for (const it of T.items) {
      if (it.k === 'corteza') continue;
      it.age += dt;
      if (it.k === 'hoja' || it.k === 'verdura') {
        const limit = it.k === 'verdura' ? 40 : 100, hh = humAt(it.x, it.y);
        if (it.age > limit && hh > 50) it.mold = Math.min(1, it.mold + (it.k === 'verdura' ? 0.012 : 0.005) * dt * (hh / 100));
        if (it.mold > 0.5 && !it.said) { it.said = 1; if (!off) { say('¡Hay moho! Saca la comida vieja con la esponja 🧽', '🍄'); unlockFact('mold'); } }
      }
      mold += it.mold;
    }
    T.mold = mold;
    // ventilar reduce moho
    if (T.vent > 0) for (const it of T.items) it.mold = Math.max(0, it.mold - 0.02 * dt);
    T.items = T.items.filter(i => i.amt > 0);
    const over = T.isos.length / capacity();
    T.over = over;
  }

  function stepVitals(dt, off) {
    const isos = T.isos;
    const males = isos.filter(i => i.sex === 'M' && i.age >= 8).length;
    const full = isos.length >= capacity();
    for (let n = isos.length - 1; n >= 0; n--) {
      const s = isos[n];
      s.age += dt / DAY;
      const h = humAt(s.x, s.y), lit = T.lamp && Math.hypot(s.x - LAMP.x, s.y - LAMP.y) < LAMP.r && !s.hid;
      const dry = clamp((45 - h) / 45, 0, 1), k = off ? 0.3 : 1;
      // hidratación
      if (h >= 50 || s.hid && h >= 40) s.hyd = Math.min(100, s.hyd + 2.2 * dt * (h / 100));
      else s.hyd = Math.max(0, s.hyd - (0.15 + dry * 1.0 + (lit ? 0.7 : 0) + (T.temp > 29 ? 0.5 : 0)) * dt * k);
      s.food = Math.max(0, s.food - 0.18 * dt * k);
      s.cal = Math.max(0, s.cal - 0.07 * dt * k);
      // salud
      let dmg = 0, why = '';
      if (s.hyd < 15) { dmg += 0.8; why = 'sed'; }
      if (s.food < 4) { dmg += 0.4; why = why || 'hambre'; }
      if (T.temp > 31) { dmg += 0.7; why = why || 'calor'; }
      if (h > 97) { dmg += 0.5; why = why || 'agua'; }
      if (lit && s.hyd < 50) { dmg += 0.15; why = why || 'luz'; }
      if (s.molt >= 1 && s.cal < 40 && !s.molting) { dmg += 0.12; why = why || 'calcio'; }
      if (T.over > 1.05) dmg += 0.1;
      const near = T.items.reduce((m, it) => it.mold > 0.3 && Math.hypot(it.x - s.x, it.y - s.y) < 40 ? m + it.mold : m, 0);
      if (near) { dmg += 0.25 * near; why = why || 'moho'; }
      if (dmg > 0) { s.hp -= dmg * dt * (off ? 0.3 : 1); s.cause = why; }
      else if (s.hyd > 45 && s.food > 25) s.hp = Math.min(100, s.hp + 0.7 * dt);
      if (off) s.hp = Math.max(40, s.hp);
      // vejez
      if (!off && s.age > s.life) { s.hp = 0; s.cause = 'vejez'; }
      if (s.hp <= 0) { isos.splice(n, 1); T.lost++; if (sel === s) sel = null; if (!off) die(s); continue; }
      // muda
      if (s.molting > 0) {
        s.molting -= dt;
        if (s.molting <= 0) {
          s.molt = 0; s.cal = Math.max(0, s.cal - 25); s.age += 0.4; s.hid = false; s.cal = Math.min(100, s.cal + 8);
          if (!off) { unlockFact('molt2'); parts.push({ x: s.x, y: s.y, t: 'star', life: 1 }); SFX.pop(); }
        }
      } else if (!s.curl || true) {
        s.molt += dt / (s.age < 10 ? 270 : 720) * k;
        if (s.molt >= 1 && s.cal >= 40 && s.hyd > 40 && !off) { s.molting = 32; if (!G.save.facts.molt) unlockFact('molt'); }
      }
      // cría
      if (s.preg > 0) {
        s.preg -= dt;
        if (s.preg <= 0 && !off) {
          const nb = Math.min(capacity() - isos.length, s.brood);
          for (let b = 0; b < nb; b++) { const c = newIso({ age: 0, x: s.x + rnd(-8, 8), y: s.y + rnd(-8, 8), hyd: 80, food: 60, cal: 60, molt: 0.9 }); isos.push(c); }
          T.born += nb; s.cool = 70; s.brood = 0;
          if (nb > 0) { SFX.baby(); unlockFact('marsupium'); setTimeout(() => unlockFact('baby'), 4000); parts.push({ x: s.x, y: s.y, t: 'heart', life: 1.2 }); say(s.name + ' tuvo ' + nb + ' cría' + (nb > 1 ? 's' : '') + ' 👶', '🎒'); }
        }
      } else if (s.cool > 0) s.cool -= dt;
      else if (s.sex === 'F' && s.age >= 10 && males && !full && !off && s.hp > 70 && s.hyd > 60 && s.food > 55 && s.cal > 50 && T.temp > 17 && T.temp < 28 && Math.random() < 0.006 * dt) {
        s.preg = 75; s.brood = 3 + ((s.cal / 25) | 0) + ((Math.random() * 3) | 0); unlockFact('broods');
      }
    }
  }
  function die(s) {
    SFX.die(); (T.causes = T.causes || {})[s.cause || '?'] = ((T.causes || {})[s.cause || '?'] || 0) + 1;
    const why = { sed: 'le faltó humedad 💧', hambre: 'le faltó comida 🍃', calor: 'tuvo demasiado calor 🌡️', agua: 'había demasiada agua 🌊', luz: 'la luz lo secó 💡', calcio: 'le faltó calcio 🦴', moho: 'había moho 🍄', vejez: 'ya era muy viejito 🎂', '': 'se sintió mal' }[s.cause || ''];
    say(s.name + ' se fue a descansar: ' + why, '🕊️');
    if (s.cause === 'sed') unlockFact('gills'); if (s.cause === 'calor') unlockFact('temp'); if (s.cause === 'agua') unlockFact('moisture');
    if (s.cause === 'luz') unlockFact('light'); if (s.cause === 'calcio') unlockFact('calcium'); if (s.cause === 'moho') unlockFact('mold'); if (s.cause === 'vejez') unlockFact('life');
  }

  /* ---------- comportamiento ---------- */
  function think(s) {
    const L = T.light, hereH = humAt(s.x, s.y);
    const lit = T.lamp && Math.hypot(s.x - LAMP.x, s.y - LAMP.y) < LAMP.r;
    s.eat = null; s.bark = null;
    // 1) luz o día: esconderse
    const hide = (L > 0.5 && s.shy > 0.35) || lit;
    const bs = barks();
    // 2) sed
    if (s.hyd < 45 || hereH < 36) {
      let best = null, bv = hereH;
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28, r = 50 + rnd(0, 70), x = clamp(s.x + Math.cos(a) * r, MINX, MAXX), y = clamp(s.y + Math.sin(a) * r, MINY, MAXY), v = humAt(x, y); if (v > bv + 2) { bv = v; best = { x, y }; } }
      if (best) { s.mode = 'seek'; s.tx = best.x; s.ty = best.y; return; }
    }
    // 3) hambre / calcio
    if (s.food < 55 || s.cal < 45) {
      let bestI = null, bd = 1e9;
      for (const it of T.items) {
        if (it.k === 'corteza') continue;
        const want = (it.k === 'calcio' && (s.cal < 70)) || ((it.k === 'hoja' || it.k === 'verdura') && s.food < 60 && it.mold < 0.8);
        if (!want) continue;
        const d = Math.hypot(it.x - s.x, it.y - s.y) - (it.k === 'calcio' && s.cal < 45 ? 80 : 0); if (d < bd) { bd = d; bestI = it; }
      }
      if (bestI && !(hide && L > 0.5 && s.food > 30)) { s.mode = 'food'; s.eat = bestI; s.tx = bestI.x; s.ty = bestI.y; return; }
    }
    if (s.molting > 0) { s.mode = 'still'; s.tx = null; }
    // 4) esconderse
    if (hide || s.molt >= 1) {
      let bb = null, bd = 1e9;
      for (const b of bs) { const d = Math.hypot(b.x - s.x, b.y - s.y); if (d < bd && (b.occ || 0) < 9) { bd = d; bb = b; } }
      if (bb) { s.mode = 'hide'; s.bark = bb; s.tx = bb.x + rnd(-14, 14); s.ty = bb.y + rnd(-8, 8); return; }
      if (lit) { s.mode = 'flee'; s.tx = clamp(s.x + (s.x < LAMP.x ? -1 : 1) * 120, MINX, MAXX); s.ty = clamp(s.y + 160, MINY, MAXY); return; }
    }
    // 5) pasear / juntarse (de noche)
    if (Math.random() < 0.5) {
      let c = null, cd = 90;
      for (const o of T.isos) if (o !== s && !o.hid) { const d = Math.hypot(o.x - s.x, o.y - s.y); if (d < cd && d > 10) { cd = d; c = o; } }
      if (c) { s.mode = 'group'; s.tx = c.x; s.ty = c.y; return; }
    }
    s.mode = 'wander'; const a = rnd(0, 6.28), r = rnd(30, 90); s.tx = clamp(s.x + Math.cos(a) * r, MINX, MAXX); s.ty = clamp(s.y + Math.sin(a) * r, MINY, MAXY);
  }

  function stepMove(dt) {
    const bs = barks(); bs.forEach(b => b.occ = 0);
    for (const s of T.isos) {
      s.ph += dt * 8;
      if (s.curl > 0) { s.curl -= dt; continue; }
      const len = isoLen(s);
      if (s.molting > 0) { s.hid = nearBark(s, bs, true); continue; }
      s.think -= dt;
      if (s.think <= 0) { think(s); s.think = rnd(0.7, 1.8); }
      const h = humAt(s.x, s.y);
      // contacto con vecinos: se frenan (tigmocinesis)
      let touch = 0; for (const o of T.isos) if (o !== s && Math.abs(o.x - s.x) < 14 && Math.abs(o.y - s.y) < 14) touch++;
      let sp = 15 * (len / 20 + 0.4);
      sp *= h < 40 ? 1.7 : h > 70 ? 0.6 : 1;
      if (T.temp < 12) sp *= 0.3; if (T.temp > 30) sp *= 1.3;
      if (touch && s.mode !== 'seek' && s.mode !== 'flee') sp *= 0.25;
      if (T.light > 0.5 && !s.hid && s.mode === 'wander') sp *= 1.2;
      if (s.tx != null) {
        const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - s.a; while (da > Math.PI) da -= 6.28; while (da < -Math.PI) da += 6.28;
        s.a += clamp(da, -5 * dt, 5 * dt) + Math.sin(s.ph * 0.35) * 0.6 * dt;
        if (d < 7) {
          if (s.mode === 'food' && s.eat) { eat(s, dt); sp = 0; }
          else if (s.mode === 'hide') sp = 0;
          else if (s.mode === 'group') sp *= 0.1; else { s.tx = null; sp *= 0.2; }
        }
        s.x += Math.cos(s.a) * sp * dt; s.y += Math.sin(s.a) * sp * dt;
      }
      s.x = clamp(s.x, MINX, MAXX); s.y = clamp(s.y, MINY, MAXY);
      s.hid = nearBark(s, bs, s.mode === 'hide' || T.light > 0.5 || s.molt >= 1);
    }
    // aviso de datos
    if (T.light > 0.5 && T.isos.some(i => i.hid)) unlockFact('nocturnal');
    if (T.isos.length > 5) { let c = 0; for (const a of T.isos) { let n = 0; for (const b of T.isos) if (a !== b && Math.abs(a.x - b.x) < 16 && Math.abs(a.y - b.y) < 16) n++; if (n >= 2) c++; } if (c >= 4) unlockFact('group'); }
  }
  function nearBark(s, bs, allow) {
    if (!allow) return false;
    for (const b of bs) if ((b.occ || 0) < 9 && Math.hypot(b.x - s.x, b.y - s.y) < 24) { b.occ = (b.occ || 0) + 1; return true; }
    return false;
  }
  function eat(s, dt) {
    const it = s.eat; if (!it || it.amt <= 0) { s.eat = null; s.tx = null; return; }
    if (it.k === 'calcio') { it.amt -= 1.2 * dt; s.cal = Math.min(100, s.cal + 9 * dt); unlockFact('calcium'); }
    else { it.amt -= 2.5 * dt; s.food = Math.min(100, s.food + 9 * dt); if (it.mold > 0.4) s.hp -= 2 * dt; if (it.k === 'hoja') unlockFact('decomp'); else unlockFact('veg'); }
    if (s.food >= 98 && it.k !== 'calcio') { s.tx = null; s.eat = null; }
    if (s.cal >= 98 && it.k === 'calcio') { s.tx = null; s.eat = null; }
    if (Math.random() < 0.05 * dt * 20) T.frass = (T.frass || 0) + 1;
    if (T.frass > 40) unlockFact('copper');
  }

  /* ---------- dibujo ---------- */
  function drawIso(s) {
    const len = isoLen(s), W = len * 0.52;
    const white = s.age < 1.5, molt = s.molting > 0, stg2 = molt && s.molting < 16;
    cx.save(); cx.translate(s.x, s.y); cx.rotate(s.a);
    cx.lineJoin = 'round';
    if (s.curl > 0) {
      cx.rotate(s.curl * 8);
      cx.fillStyle = white ? '#f1ede4' : '#707e8c'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 1.5;
      cx.beginPath(); cx.arc(0, 0, W * 0.9, 0, 7); cx.fill(); cx.stroke();
      cx.strokeStyle = 'rgba(25,30,40,.55)'; cx.lineWidth = 1; for (let i = -2; i <= 2; i++) { cx.beginPath(); cx.arc(i * W * 0.4 - W * 0.9, 0, W, -1.2, 1.2); cx.stroke(); }
      cx.restore(); return;
    }
    // patas
    cx.strokeStyle = 'rgba(30,25,20,.8)'; cx.lineWidth = 0.9;
    const mv = s.tx != null && s.mode !== 'hide' ? 1 : 0.15;
    for (let i = 0; i < 7; i++) {
      const x = len * 0.28 - i * len * 0.115, w = W * 0.5 * (1 - Math.abs(i - 3) * 0.06), ph = Math.sin(s.ph * 2 + i * 1.7) * 2.2 * mv;
      cx.beginPath(); cx.moveTo(x, -w); cx.lineTo(x + ph, -w - 3.2); cx.moveTo(x, w); cx.lineTo(x - ph, w + 3.2); cx.stroke();
    }
    // antenas
    cx.lineWidth = 0.9; cx.beginPath(); cx.moveTo(len * 0.5, -W * 0.15); cx.quadraticCurveTo(len * 0.8, -W * 0.7 + Math.sin(s.ph) * 2, len * 0.95, -W * 0.45 + Math.sin(s.ph * 1.3) * 2.5);
    cx.moveTo(len * 0.5, W * 0.15); cx.quadraticCurveTo(len * 0.8, W * 0.7 + Math.cos(s.ph) * 2, len * 0.95, W * 0.45 + Math.cos(s.ph * 1.3) * 2.5); cx.stroke();
    // segmentos
    const base = white ? '#f1ede4' : '#6f7d8b', dark = white ? '#d8d2c4' : '#59666f', pale = '#e6e2d6';
    for (let i = 0; i < 9; i++) {
      const x = len * 0.5 - i * len * 0.115;
      const wd = W * (i === 0 ? 0.55 : i === 8 ? 0.35 : 0.5 + 0.5 * Math.sin((i) / 8 * 3.14) * 0.9);
      const hl = i === 0 ? len * 0.13 : len * 0.085;
      let col = i % 2 ? base : dark;
      if (molt) { const back = i >= 4; col = (!stg2 && back) || (stg2 && !back) ? pale : (i % 2 ? base : dark); }
      cx.fillStyle = col; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 0.9;
      cx.beginPath(); cx.ellipse(x, 0, hl, wd, 0, 0, 7); cx.fill(); cx.stroke();
    }
    cx.fillStyle = 'rgba(255,255,255,.28)'; cx.beginPath(); cx.ellipse(len * 0.05, -W * 0.25, len * 0.3, W * 0.12, 0, 0, 7); cx.fill();
    cx.fillStyle = '#000'; cx.beginPath(); cx.arc(len * 0.52, -W * 0.22, 0.9, 0, 7); cx.arc(len * 0.52, W * 0.22, 0.9, 0, 7); cx.fill();
    if (s.preg > 0) { cx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { cx.beginPath(); cx.arc(len * 0.1 - i * 2.2, (i % 2 ? 1 : -1) * W * 0.35, 1.3, 0, 7); cx.fill(); } }
    cx.restore();
  }
  function bubbleOf(s) {
    if (s.molting > 0) return '👕';
    if (s.hp < 40) return '😢';
    if (s.hyd < 35) return '💧';
    if (s.food < 30) return '🍃';
    if (s.molt >= 1 && s.cal < 40) return '🦴';
    if (T.temp > 30) return '🥵';
    if (s.preg > 0) return '🎒';
    return '';
  }
  function drawBark(b) {
    cx.save(); cx.translate(b.x, b.y);
    cx.fillStyle = '#6a4a2a'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(-34, 6); cx.quadraticCurveTo(-38, -22, -6, -22); cx.quadraticCurveTo(36, -26, 38, 4); cx.quadraticCurveTo(26, 22, -8, 20); cx.quadraticCurveTo(-30, 22, -34, 6); cx.closePath(); cx.fill(); cx.stroke();
    cx.strokeStyle = '#4a3320'; cx.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) { cx.beginPath(); cx.moveTo(-26 + i * 13, -16 + (i % 2) * 3); cx.quadraticCurveTo(-24 + i * 13, 0, -28 + i * 14, 14); cx.stroke(); }
    cx.fillStyle = 'rgba(255,255,255,.12)'; cx.beginPath(); cx.ellipse(-8, -12, 22, 5, -0.1, 0, 7); cx.fill();
    cx.restore();
    if ((b.occ || 0) > 0) {
      cx.save(); cx.font = '800 11px ui-rounded,sans-serif'; cx.textAlign = 'center'; cx.fillStyle = 'rgba(255,255,255,.92)'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2;
      const t = '💤 ' + b.occ; const w = cx.measureText(t).width + 8;
      cx.beginPath(); cx.roundRect(b.x - w / 2, b.y - 40, w, 16, 8); cx.fill(); cx.stroke(); cx.fillStyle = '#1d1a16'; cx.fillText(t, b.x, b.y - 28); cx.restore();
    }
  }
  function drawItem(it) {
    cx.save(); cx.translate(it.x, it.y);
    cx.strokeStyle = '#1d1a16'; cx.lineWidth = 1.6;
    const f = clamp(it.amt / 100, 0.25, 1);
    if (it.k === 'hoja') {
      cx.rotate(it.id * 1.7); cx.scale(f, f);
      cx.fillStyle = it.mold > 0.5 ? '#7d7a4a' : '#b9892b'; cx.beginPath(); cx.moveTo(-16, 0); cx.quadraticCurveTo(0, -14, 16, 0); cx.quadraticCurveTo(0, 12, -16, 0); cx.fill(); cx.stroke();
      cx.beginPath(); cx.moveTo(-16, 0); cx.lineTo(16, 0); cx.stroke();
    } else if (it.k === 'verdura') {
      cx.scale(f, f);
      cx.fillStyle = it.mold > 0.5 ? '#9c8a55' : '#ff8a1f'; cx.beginPath(); cx.arc(0, 0, 11, 0, 7); cx.fill(); cx.stroke();
      cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.beginPath(); cx.arc(0, 0, 6, 0, 7); cx.stroke();
    } else if (it.k === 'calcio') {
      cx.scale(f, f); cx.fillStyle = '#fbf7ea';
      cx.beginPath(); cx.moveTo(-12, 3); cx.quadraticCurveTo(-10, -12, 2, -10); cx.quadraticCurveTo(14, -6, 10, 6); cx.quadraticCurveTo(0, 12, -12, 3); cx.fill(); cx.stroke();
    }
    if (it.mold > 0.25) {
      cx.fillStyle = 'rgba(150,200,120,' + clamp(it.mold, 0.3, 0.9) + ')';
      for (let i = 0; i < 6; i++) { cx.beginPath(); cx.arc(Math.cos(i * 2.1) * 8, Math.sin(i * 2.7) * 6, 3 + it.mold * 3, 0, 7); cx.fill(); }
    }
    cx.restore();
  }

  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.fillStyle = '#16210f'; cx.fillRect(0, 0, cw, ch);
    cx.save(); cx.translate(ox, oy); cx.scale(scale, scale);
    // mesa
    cx.fillStyle = '#3a2a18'; cx.fillRect(-ox / scale, -oy / scale, cw / scale, ch / scale);
    // suelo con humedad
    cx.save(); cx.beginPath(); cx.roundRect(BX, BY, BW, BH, 18); cx.clip();
    const hd = humCv.getContext('2d'), im = hd.createImageData(GW, GH);
    for (let i = 0; i < GW * GH; i++) {
      const t = clamp((T.hum[i] - 15) / 80, 0, 1);
      im.data[i * 4] = lerp(206, 62, t); im.data[i * 4 + 1] = lerp(166, 42, t); im.data[i * 4 + 2] = lerp(112, 26, t); im.data[i * 4 + 3] = 255;
    }
    hd.putImageData(im, 0, 0);
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    cx.drawImage(humCv, BX, BY, BW, BH);
    cx.drawImage(soilTex, BX, BY);
    // hojarasca decorativa
    for (const d of decor) { cx.save(); cx.translate(d.x, d.y); cx.rotate(d.a); cx.globalAlpha = 0.55; cx.fillStyle = d.c; cx.beginPath(); cx.ellipse(0, 0, d.l, d.l * 0.42, 0, 0, 7); cx.fill(); cx.restore(); }
    cx.globalAlpha = 1;
    // musgo
    const nm = Math.floor(T.moss * mossSpots.length);
    for (let i = 0; i < nm; i++) { const m = mossSpots[i]; cx.fillStyle = '#4f9d3a'; for (let k = 0; k < 6; k++) { cx.beginPath(); cx.arc(m.x + Math.cos(k * 1.3 + i) * m.r * 0.55, m.y + Math.sin(k * 1.7 + i) * m.r * 0.45, m.r * 0.38, 0, 7); cx.fill(); } cx.fillStyle = 'rgba(190,255,150,.3)'; cx.beginPath(); cx.arc(m.x - 2, m.y - 2, m.r * 0.3, 0, 7); cx.fill(); }
    // objetos (no corteza)
    for (const it of T.items) if (it.k !== 'corteza') drawItem(it);
    // chanchitos
    const sorted = T.isos.slice().sort((a, b) => a.y - b.y);
    for (const s of sorted) { if (!s.hid) drawIso(s); }
    if (sel) { cx.strokeStyle = '#ffe27a'; cx.lineWidth = 2.5; cx.setLineDash([4, 3]); cx.beginPath(); cx.arc(sel.x, sel.y, isoLen(sel) * 0.8 + 4, 0, 7); cx.stroke(); cx.setLineDash([]); }
    // cortezas encima (esconden)
    for (const b of barks()) drawBark(b);
    // burbujas de necesidades
    cx.font = '15px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (const s of sorted) { if (s.hid) continue; const b = bubbleOf(s); if (!b) continue; cx.fillStyle = 'rgba(255,255,255,.92)'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(s.x, s.y - 22, 10, 0, 7); cx.fill(); cx.stroke(); cx.fillStyle = '#000'; cx.fillText(b, s.x, s.y - 21); }
    cx.textBaseline = 'alphabetic';
    // partículas
    for (const p of parts) {
      if (p.t === 'drop') { cx.fillStyle = 'rgba(120,200,255,' + clamp(p.life * 3, 0, 0.8) + ')'; cx.beginPath(); cx.ellipse(p.x, p.y, 1.8, 3.2, 0, 0, 7); cx.fill(); }
      else { cx.globalAlpha = clamp(p.life, 0, 1); cx.font = '22px sans-serif'; cx.textAlign = 'center'; cx.fillText(p.t === 'heart' ? '💗' : '✨', p.x, p.y - (1 - p.life) * 20); cx.globalAlpha = 1; }
    }
    // luz
    const dark = (1 - T.light) * 0.40;
    if (dark > 0.01) { cx.fillStyle = 'rgba(20,30,90,' + dark + ')'; cx.fillRect(BX, BY, BW, BH); }
    if (T.lamp) {
      const g = cx.createRadialGradient(LAMP.x, LAMP.y, 8, LAMP.x, LAMP.y, LAMP.r + 30);
      g.addColorStop(0, 'rgba(255,240,170,.75)'); g.addColorStop(0.55, 'rgba(255,220,120,.32)'); g.addColorStop(1, 'rgba(255,200,100,0)');
      cx.globalCompositeOperation = 'screen'; cx.fillStyle = g; cx.fillRect(BX, BY, BW, BH); cx.globalCompositeOperation = 'source-over';
    }
    if (T.heat > 0) { cx.fillStyle = 'rgba(255,120,40,.10)'; cx.fillRect(BX, BY, BW, BH); }
    cx.restore();
    // vidrio
    cx.strokeStyle = 'rgba(210,240,255,.9)'; cx.lineWidth = 8; cx.beginPath(); cx.roundRect(BX, BY, BW, BH, 18); cx.stroke();
    cx.strokeStyle = '#1d1a16'; cx.lineWidth = 3; cx.beginPath(); cx.roundRect(BX - 4, BY - 4, BW + 8, BH + 8, 22); cx.stroke();
    cx.beginPath(); cx.roundRect(BX + 4, BY + 4, BW - 8, BH - 8, 14); cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.10)'; cx.beginPath(); cx.moveTo(BX + 30, BY + 6); cx.lineTo(BX + 90, BY + 6); cx.lineTo(BX + 20, BY + 150); cx.lineTo(BX + 6, BY + 150); cx.fill();
    // lámpara
    cx.fillStyle = T.lamp ? '#ffd34d' : '#9a9a9a'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2.5;
    cx.beginPath(); cx.moveTo(LAMP.x - 22, BY + 4); cx.lineTo(LAMP.x + 22, BY + 4); cx.lineTo(LAMP.x + 10, BY + 22); cx.lineTo(LAMP.x - 10, BY + 22); cx.closePath(); cx.fill(); cx.stroke();
    // tapa ventilando
    if (T.vent > 0) { cx.font = '22px sans-serif'; cx.textAlign = 'center'; cx.fillText('🌬️', BX + BW - 30, BY + 26 + Math.sin(T.t * 6) * 3); }
    cx.restore();
  }

  /* ---------- HUD ---------- */
  function setT(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function hud() {
    const p = (T.t / DAY) % 1, day = Math.floor(T.t / DAY) + 1;
    setT('#tDay', (T.light > 0.5 ? '☀️ ' : '🌙 ') + day);
    setT('#tTemp', '🌡 ' + Math.round(T.temp) + '°' + (T.temp > 29 ? ' ⚠' : ''));
    setT('#tHum', '💧 ' + Math.round(T.avgHum || 0) + '%' + (T.avgHum > 88 ? ' ⚠' : T.avgHum < 38 ? ' ⚠' : ''));
    setT('#tCount', '🐛 ' + T.isos.length + '/' + capacity());
    setT('#tSpeed', speed === 1 ? '⏩' : speed === 3 ? '⏩⏩' : '⏩⏩⏩');
  }
  function advice() {
    const n = T.isos.length;
    const avg = k => T.isos.reduce((a, i) => a + i[k], 0) / n;
    let ic = '😊', tx = '¡Tu colonia está feliz! Mira cómo se juntan y se esconden.';
    if (!n) { ic = '🏃'; tx = 'El terrario está vacío. ¡Ve a correr y rescata chanchitos!'; }
    else if (barks().length === 0) { ic = '🪵'; tx = 'No tienen dónde esconderse. Pon corteza 🪵 para que descansen de día.'; }
    else if (T.temp > 29) { ic = '🥵'; tx = 'Hace mucho calor. Apaga la luz 💡, ventila 🌬️ y rocía agua 💧.'; }
    else if (T.avgHum > 88) { ic = '🌊'; tx = '¡Hay demasiada agua! Ventila 🌬️ para que se seque un poco: mojado todo el tiempo causa moho.'; }
    else if (T.avgHum < 40 || avg('hyd') < 45 || T.isos.some(i => i.hyd < 25)) { ic = '💧'; tx = 'Está muy seco. Rocía agua 💧 solo en un lado: deja el otro más seco para que elijan.'; }
    else if (T.lamp && T.light > 0.5) { ic = '💡'; tx = 'La luz los asusta y los seca. Apágala cuando el musgo ya esté verde.'; }
    else if (avg('food') < 40 || T.isos.some(i => i.food < 20)) { ic = '🍃'; tx = 'Tienen hambre. Dales hojas 🍃 o un trocito de verdura 🥕.'; }
    else if (avg('cal') < 40 || T.isos.some(i => i.molt >= 1 && i.cal < 40)) { ic = '🦴'; tx = 'Necesitan calcio para su caparazón. Pon cáscara de huevo 🦴.'; }
    else if (T.mold > 0.6) { ic = '🍄'; tx = 'Hay moho en la comida vieja. Sácala con la esponja 🧽.'; }
    else if (T.isos.length >= capacity()) { ic = '🏠'; tx = 'El terrario está lleno. Pon más cortezas 🪵 o deja libres algunos en el jardín 🌳.'; }
    else if (T.heat > 0) { ic = '🌡️'; tx = 'Es un día de calor. Vigila la humedad.'; }
    else if (T.isos.some(i => i.molting > 0)) { ic = '👕'; tx = 'Alguien está cambiando de piel. ¡No lo molestes!'; }
    else if (T.isos.some(i => i.preg > 0)) { ic = '🎒'; tx = 'Hay mamás con huevitos en su marsupio. ¡Pronto habrá bebés!'; }
    $('#advIc').textContent = ic; $('#advTx').textContent = tx;
  }

  function toolsUI() {
    const inv = G.save.inv;
    const defs = [
      ['look', '🔍', 'Mirar'], ['spray', '💧', 'Rociar'], ['hoja', '🍃', 'Hoja', 'hoja'], ['verdura', '🥕', 'Verdura', 'verdura'], ['calcio', '🦴', 'Calcio', 'calcio'],
      ['corteza', '🪵', 'Corteza', 'corteza'], ['clean', '🧽', 'Sacar'], ['lamp', '💡', 'Luz'], ['vent', '🌬️', 'Ventilar'], ['say', '💬', 'Consejo']
    ];
    const el = $('#tools'); el.innerHTML = '';
    for (const d of defs) {
      const b = document.createElement('button'); b.className = 'tool'; b.dataset.t = d[0];
      b.innerHTML = d[1] + '<small>' + d[2] + '</small>' + (d[3] ? '<span class="n">' + (inv[d[3]] || 0) + '</span>' : '');
      if (d[3] && !(inv[d[3]] > 0)) b.classList.add('zero');
      if (tool === d[0]) b.classList.add('sel');
      if (d[0] === 'lamp' && T.lamp) b.classList.add('on');
      b.onclick = () => pickTool(d[0]);
      el.appendChild(b);
    }
  }
  function pickTool(t) {
    SFX.pop();
    if (t === 'lamp') { T.lamp = !T.lamp; if (T.lamp) unlockFact('light'); say(T.lamp ? 'Luz encendida: las plantas crecen, pero los chanchitos se asustan.' : 'Luz apagada.', '💡'); toolsUI(); return; }
    if (t === 'vent') { T.vent = 25; say('Ventilando 25 segundos: se seca el aire y se va el moho.', '🌬️'); toolsUI(); return; }
    if (t === 'say') { speak($('#advTx').textContent); return; }
    tool = t; if (t !== 'look') { sel = null; $('#info').classList.add('hidden'); }
    if (t === 'spray') say('Toca o arrastra para rociar agua.', '💧');
    toolsUI();
  }

  /* ---------- interacción ---------- */
  function worldPos(e) {
    const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) - ox) / scale, y: ((e.clientY - r.top) - oy) / scale };
  }
  function inBox(p) { return p.x > MINX - 6 && p.x < MAXX + 6 && p.y > MINY - 6 && p.y < MAXY + 6; }
  function onDown(e) {
    const p = worldPos(e); cv.setPointerCapture(e.pointerId);
    if (tool === 'spray') { spraying = true; sprayAt(p); return; }
    if (!inBox(p)) return;
    const inv = G.save.inv;
    if (tool === 'look') {
      let best = null, bd = 30;
      for (const s of T.isos) { if (s.hid) continue; const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } }
      if (best) { sel = best; best.curl = 3; best.tx = null; SFX.pop(); showInfo(); const base = ['legs', 'size', 'crust', 'world', 'life', 'home']; for (const id of base) if (!G.save.facts[id]) { unlockFact(id); break; } }
      else {
        const b = barks().find(b => Math.hypot(b.x - p.x, b.y - p.y) < 36);
        if (b) { const hs = T.isos.filter(s => s.hid && Math.hypot(s.x - b.x, s.y - b.y) < 30); sel = null; $('#info').classList.add('hidden'); say(hs.length ? hs.length + ' chanchito' + (hs.length > 1 ? 's' : '') + ' duermen aquí: ' + hs.map(s => s.name).slice(0, 5).join(', ') : 'Aquí no hay nadie escondido ahora.', '🪵'); }
        else { sel = null; $('#info').classList.add('hidden'); }
      }
      return;
    }
    if (tool === 'hoja' || tool === 'verdura' || tool === 'calcio' || tool === 'corteza') {
      if (!(inv[tool] > 0)) { say('No tienes más. ¡Corre para ganar más!', '🏃'); return; }
      if (tool === 'corteza' && barks().length >= 6) { say('Ya hay mucha corteza, ¡cabe poco más!', '🪵'); return; }
      if (T.items.filter(i => i.k !== 'corteza').length >= 14 && tool !== 'corteza') { say('Hay mucha comida. Deja que se la coman o sácala.', '🍃'); return; }
      inv[tool]--; T.items.push({ id: T.nextId++, k: tool, x: clamp(p.x, MINX, MAXX), y: clamp(p.y, MINY, MAXY), amt: 100, age: 0, mold: 0 });
      SFX.food(); persist(); toolsUI();
      if (tool === 'calcio') unlockFact('calcium'); if (tool === 'corteza') unlockFact('nocturnal');
      return;
    }
    if (tool === 'clean') {
      let best = null, bd = 34;
      for (const it of T.items) { const d = Math.hypot(it.x - p.x, it.y - p.y); if (d < bd) { bd = d; best = it; } }
      if (best) {
        T.items = T.items.filter(i => i !== best); SFX.pop();
        if (best.k === 'corteza') { inv.corteza++; say('Recogiste la corteza. Puedes ponerla en otro lugar.', '🪵'); }
        else if (best.mold > 0.3) { say('¡Bien! Sacaste comida con moho.', '🧽'); unlockFact('mold'); }
        persist(); toolsUI();
      }
    }
  }
  function sprayAt(p) {
    if (!inBox(p)) return;
    spray(p.x, p.y, 10); sprayAcc = 0;
    unlockFact('gills');
    if (T.hum[cell(p.x, p.y)] > 92) { if (!T.saidWet || T.t - T.saidWet > 20) { T.saidWet = T.t; say('¡Cuidado! Demasiada agua en un solo lugar.', '🌊'); unlockFact('moisture'); } }
  }
  let lastSpray = 0;
  function onMove(e) {
    if (!spraying) return;
    const now = performance.now(); if (now - lastSpray < 70) return; lastSpray = now;
    sprayAt(worldPos(e));
  }
  function onUp() { spraying = false; }

  function showInfo() {
    const s = sel, el = $('#info');
    if (!s) { el.classList.add('hidden'); return; }
    const st = stage(s);
    const status = s.molting > 0 ? (s.molting > 16 ? 'Está cambiando la mitad de atrás de su piel 👕' : 'Ahora cambia la mitad de adelante 👕') :
      s.curl > 0 ? 'Se hizo bolita para protegerse ⚽' : s.hid ? 'Descansa bajo la corteza 💤' : s.preg > 0 ? 'Lleva huevitos en su marsupio 🎒' :
      s.mode === 'food' ? 'Va a comer 🍽️' : s.mode === 'seek' ? 'Busca un lugar húmedo 💧' : s.mode === 'hide' ? 'Busca dónde esconderse 🪵' : s.mode === 'group' ? 'Va con sus amigos 👨‍👩‍👧' : 'Paseando 🐾';
    const bar = (v, c) => '<div class="bar"><i style="width:' + clamp(v, 0, 100) + '%;background:' + c + '"></i></div>';
    el.innerHTML = '<h3><span>' + (s.sex === 'F' ? '👩' : '👨') + ' ' + s.name + ' <small>(' + (st === 'manca' ? 'bebé manca' : st) + ', ' + (s.sex === 'F' ? 'hembra' : 'macho') + ', ' + s.age.toFixed(0) + ' días)</small></span><button class="round" id="infoX" style="width:34px;height:34px;font-size:16px">✕</button></h3>' +
      '<div class="bars"><div>💧 ' + bar(s.hyd, '#35b7ff') + '</div><div>🍃 ' + bar(s.food, '#4f9d3a') + '</div><div>🦴 ' + bar(s.cal, '#e8e0c8') + '</div><div>❤️ ' + bar(s.hp, '#e5483b') + '</div></div>' +
      '<p>' + status + '</p><div style="display:flex;gap:8px;margin-top:6px"><button class="chip" id="infoFree">🌳 Dejar libre</button><button class="chip" id="infoSay">🔊 Leer</button></div>';
    el.classList.remove('hidden');
    $('#infoX').onclick = () => { sel = null; el.classList.add('hidden'); };
    $('#infoFree').onclick = () => { if (!sel) return; T.isos = T.isos.filter(i => i !== sel); say(sel.name + ' volvió al jardín 🌳. ¡Libérelos solo donde ya viven chanchitos!', '🌳'); sel = null; el.classList.add('hidden'); serialize(); };
    $('#infoSay').onclick = () => speak(s.name + '. ' + status + '. Tiene ' + Math.round(s.hyd) + ' de agua y ' + Math.round(s.food) + ' de comida.');
  }

  /* ---------- bucle ---------- */
  function resize() {
    if (!cv) return;
    const r = $('#twrap').getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = r.width; ch = r.height; cv.width = cw * dpr; cv.height = ch * dpr;
    scale = Math.min(cw / TW, ch / TH); ox = (cw - TW * scale) / 2; oy = (ch - TH * scale) / 2;
  }
  function loop(now) {
    if (!running) return;
    const dtR = Math.min(0.1, (now - last) / 1000); last = now;
    const dt = dtR * speed;
    // varios pasos si va rápido
    const steps = Math.max(1, Math.ceil(dt / 0.05)), sd = dt / steps;
    for (let i = 0; i < steps; i++) { stepEnv(sd, false); stepVitals(sd, false); stepMove(sd); }
    for (const p of parts) { p.life -= dtR; if (p.t === 'drop') p.y += p.vy * dtR; }
    parts = parts.filter(p => p.life > 0);
    if (spraying && false) {}
    draw();
    advT -= dtR; if (advT <= 0) { advT = 1; hud(); advice(); }
    infoT -= dtR; if (infoT <= 0) { infoT = 0.4; if (sel) { if (!T.isos.includes(sel)) { sel = null; $('#info').classList.add('hidden'); } else if (!spraying) showInfo(); } }
    regen += dtR;
    if (regen >= 15) { regen -= 15; regenN++; const inv = G.save.inv; let ch = false;
      if (regenN % 3 === 0 && inv.hoja < 6) { inv.hoja++; ch = true; }
      if (regenN % 6 === 0 && inv.verdura < 3) { inv.verdura++; ch = true; }
      if (regenN % 8 === 0 && inv.calcio < 3) { inv.calcio++; ch = true; }
      if (ch) toolsUI(); }
    saveT += dtR; if (saveT > 12) { saveT = 0; serialize(); }
    raf = requestAnimationFrame(loop);
  }
  function start() {
    ensure();
    cv = $('#tc'); cx = cv.getContext('2d');
    // ayuda para quien vuelve: avance suave del tiempo mientras no estaba
    const away = G.save.lastSeen ? Math.min(600, (Date.now() - G.save.lastSeen) / 1000) : 0;
    if (away > 30 && T.isos.length && !T.offlineDone) { for (let t = 0; t < away; t += 5) { stepEnv(5, true); stepVitals(5, true); } if (away > 120) say('Mientras no estabas, tus chanchitos se cuidaron solos un ratito 🐛', '🏡'); }
    tool = 'look'; sel = null; speed = 1; parts = []; $('#info').classList.add('hidden');
    resize(); ro = new ResizeObserver(resize); ro.observe($('#twrap'));
    toolsUI(); hud(); advice();
    running = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); serialize(); }
  function init() {
    cv = $('#tc');
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    $('#tBack').onclick = () => show('menu');
    $('#tEnc').onclick = () => show('enc');
    $('#tSpeed').onclick = () => { speed = speed === 1 ? 3 : speed === 3 ? 6 : 1; hud(); SFX.pop(); };
    $('#advSay').onclick = () => speak($('#advTx').textContent);
    document.addEventListener('visibilitychange', () => { if (document.hidden && T) serialize(); });
    window.addEventListener('pagehide', () => { if (T) serialize(); });
  }
  return { init, start, stop, addRescued, get T() { return T; }, step(dt) { ensure(); stepEnv(dt, false); stepVitals(dt, false); stepMove(dt); }, ensure };
})();
