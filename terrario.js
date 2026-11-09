'use strict';
/* =====================================================================
   TERRARIO (pantalla vertical, vista desde arriba) con los 10 bichos.
   Ver docs/DISENO.md para la tabla de interacciones y las constantes.

   Modelo:
   - Humedad por zonas (12x20). Se evapora; se riega con el rociador.
   - Cada bicho (BUGS[].sim en data.js) tiene hidratación, hambre y salud, y una
     conducta propia: activo de día o de noche, esconderse, caminar/saltar/volar.
   - Interacciones entre bichos (nadie muere por otro bicho; los cazadores solo
     asustan o cazan «presas» que aparecen solas):
       · Limpieza   : los chanchitos comen moho y restos.
       · Pulgones   : aparecen en flores y musgo; la chinita (y la tijereta) los comen.
       · Moscas     : aparecen con comida vieja; la libélula y la araña pollito las cazan.
       · Polinizar  : moscardón y mariposa toman néctar y hacen nacer flores nuevas.
       · Susto      : la araña pollito asusta (el chanchito se hace bolita, otros huyen);
                      el chinchemolle suelta su olor y la hace retroceder.
       · Luz        : el pololo vuela hacia la lámpara de noche; otros la evitan.
       · Canto      : el grillo canta de noche; más rápido con más calor.
       · Percha     : la libélula descansa en ramas y palitos.
       · Camuflaje  : el chinchemolle se confunde cerca de ramas.
   ===================================================================== */
const Terr = (() => {
  const TW = 360, TH = 620, GW = 12, GH = 20, DAY = 90;      // mundo, grilla de humedad, segundos por día
  const BX = 14, BY = 14, BW = 332, BH = 592;                 // caja de vidrio
  const MINX = 28, MAXX = 332, MINY = 30, MAXY = 592;         // zona transitable
  const LAMP = { x: 180, y: 130, r: 165 };
  const NAMES = ['Bolita', 'Pelusa', 'Pepita', 'Migajita', 'Roco', 'Tito', 'Luna', 'Nube', 'Canela', 'Motita', 'Gordi', 'Ñata', 'Coco', 'Pipa', 'Tuerca', 'Pichi', 'Kiwi', 'Maní', 'Chispa', 'Rulo'];
  const CAP_BASE = 60, CAP_BARK = 9, CAP_MAX = 150;           // capacidad del terrario
  const DECOR = ['rama', 'palito', 'piedra', 'pina'];
  const FOODS = ['hoja', 'verdura', 'calcio', 'flor'];
  const EAT_ICON = { hoja: '🍃', verdura: '🥕', calcio: '🦴', flor: '🌺', pulgon: '🌿', mosca: '🪰', moho: '🍄' };

  let T = null;                       // estado de la colonia
  let cv, cx, scale = 1, ox = 0, oy = 0, cw = 0, ch = 0, dpr = 1;
  let raf = 0, last = 0, running = false, ro = null;
  let tool = 'look', sel = null, speed = 1, saveT = 0, advT = 0, infoT = 0, spraying = false;
  let parts = [], regen = 0, regenN = 0;
  let soilTex = null, humCv = null, decor = [], mossSpots = [];
  const hudCache = {};
  const S = b => BUG_BY_ID[b.sp].sim;

  /* ---------- creación / carga ---------- */
  function newBug(sp, o) {
    const sim = BUG_BY_ID[sp].sim;
    return Object.assign({
      id: T.nextId++, sp, name: pick(NAMES), sex: Math.random() < 0.5 ? 'F' : 'M', age: rnd(10, 14), x: rnd(MINX + 20, MAXX - 20), y: rnd(MINY + 20, MAXY - 20), a: rnd(0, 6.28),
      hyd: 85, food: 70, cal: 70, hp: 100, molt: rnd(0, 0.6), molting: 0, preg: 0, brood: 0, cool: 0, curl: 0, shy: rnd(0.3, 1), hid: false, tx: null, ty: null, mode: 'wander', think: 0,
      tgt: null, kind: null, eat: null, bark: null, ph: rnd(0, 6), life: rnd(sim.life[0], sim.life[1]), cause: '', smell: 0, sing: 0, visit: 0, moving: 0
    }, o || {});
  }
  function newColony() {
    T = { t: DAY * 0.62, bugs: [], items: [], hum: new Float32Array(GW * GH), moss: 0.15, lamp: false, vent: 0, heat: 0, nextHeat: DAY * rnd(3, 4), nextId: 1, born: 0, lost: 0, mold: 0, temp: 22, light: 0, over: 0, aphids: [], flies: [], pollen: 0, aphT: 20, flyT: 15 };
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) T.hum[j * GW + i] = lerp(78, 42, i / (GW - 1)) + rnd(-5, 5);
    // el terrario empieza vacío: el niño lo arma de a poco con lo que gana
  }
  function ensure() {
    if (T) return;
    const c = G.save.colony;
    if (c && (c.bugs || c.isos)) {
      T = Object.assign({}, c, { hum: Float32Array.from(c.hum), aphids: [], flies: [], pollen: 0, aphT: 20, flyT: 15 });
      if (!T.bugs) T.bugs = (c.isos || []).map(i => Object.assign(newBug('chanchito', {}), i, { sp: 'chanchito' }));   // guardado antiguo
      delete T.isos;
      T.bugs.forEach(b => { b.hid = false; b.tx = b.ty = null; b.eat = b.bark = b.tgt = null; b.mode = 'wander'; b.think = 0; b.curl = 0; b.molting = 0; b.smell = 0; b.moving = 0; });
      T.over = 0; T.lamp = false; T.vent = 0;
    } else newColony();
    buildDecor();
  }
  function serialize() {
    if (!T || !G.save) return;
    G.save.colony = {
      t: T.t, moss: T.moss, lamp: false, vent: 0, heat: T.heat, nextHeat: T.nextHeat, nextId: T.nextId, born: T.born, lost: T.lost, mold: T.mold, temp: T.temp, light: T.light, over: 0,
      hum: Array.from(T.hum, v => Math.round(v * 10) / 10),
      items: T.items.map(i => ({ id: i.id, k: i.k, x: i.x | 0, y: i.y | 0, amt: +i.amt.toFixed(1), age: +i.age.toFixed(1), mold: +i.mold.toFixed(2) })),
      bugs: T.bugs.map(b => ({ id: b.id, sp: b.sp, name: b.name, sex: b.sex, age: +b.age.toFixed(2), x: b.x | 0, y: b.y | 0, a: +b.a.toFixed(2), hyd: +b.hyd.toFixed(1), food: +b.food.toFixed(1), cal: +b.cal.toFixed(1), hp: +b.hp.toFixed(1), molt: +b.molt.toFixed(2), preg: +b.preg.toFixed(1), brood: b.brood, cool: b.cool | 0, shy: +b.shy.toFixed(2), ph: b.ph, life: b.life }))
    };
    persist();
  }
  function buildDecor() {
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
  const ambient = p => p < 0.06 ? p / 0.06 : p < 0.52 ? 1 : p < 0.62 ? 1 - (p - 0.52) / 0.10 : 0;
  const barks = () => T.items.filter(i => i.k === 'corteza');
  const decors = () => T.items.filter(i => DECOR.includes(i.k));
  const flowers = () => T.items.filter(i => i.k === 'flor' && i.amt > 5);
  const capacity = () => Math.min(CAP_MAX, CAP_BASE + CAP_BARK * barks().length + decors().length);
  const has = sp => T.bugs.some(b => b.sp === sp);
  const stage = b => b.sp !== 'chanchito' ? 'adulto' : b.age < 2 ? 'manca' : b.age < 10 ? 'joven' : 'adulto';
  const bugLen = b => b.sp === 'chanchito' ? lerp(8, 24, clamp(b.age / 12, 0, 1)) + (b.sex === 'F' ? 1.5 : 0) : S(b).len;
  const isFlier = b => S(b).move === 'fly';
  function spray(x, y, amt) {
    const R = 52;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const cx_ = BX + (i + 0.5) / GW * BW, cy_ = BY + (j + 0.5) / GH * BH, d = Math.hypot(cx_ - x, cy_ - y); if (d > R + 20) continue;
      T.hum[j * GW + i] = Math.min(100, T.hum[j * GW + i] + amt * Math.max(0, 1 - d / (R + 20)));
    }
    for (let k = 0; k < 3; k++) parts.push({ x: x + rnd(-20, 20), y: y + rnd(-26, -8), vy: rnd(40, 90), life: rnd(0.3, 0.6), t: 'drop' });
  }
  function addFlower(x, y, amt) { T.items.push({ id: T.nextId++, k: 'flor', x: clamp(x, MINX, MAXX), y: clamp(y, MINY, MAXY), amt: amt || 100, age: 0, mold: 0 }); }

  /* ---------- simulación del ambiente ---------- */
  function stepEnv(dt, off) {
    T.t += dt;
    const p = (T.t / DAY) % 1;
    T.light = ambient(p);
    if (T.heat > 0) T.heat -= dt;
    else if (!off && T.t > T.nextHeat) { T.heat = DAY * 0.9; T.nextHeat = T.t + DAY * rnd(5, 8); toast({ ic: '🥵', t: '¡Hoy hace mucho calor!', x: 'Apaga la luz, ventila y rocía agua para que los bichos no se sequen.' }); unlockFact('temp'); }
    T.temp = lerp(17.5, 23.5, T.light) + (T.heat > 0 ? 6 : 0) + (T.lamp ? 4 : 0) - (T.vent > 0 ? 1.5 : 0);
    if (T.vent > 0) T.vent -= dt;
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
    if (T.lamp && T.avgHum > 45) T.moss = Math.min(1, T.moss + 0.0025 * dt);
    else T.moss = Math.max(0.03, T.moss - (T.avgHum < 35 ? 0.003 : 0.0006) * dt);
    let mold = 0;
    for (const it of T.items) {
      if (it.k === 'corteza' || DECOR.includes(it.k)) continue;
      it.age += dt;
      if (it.k === 'hoja' || it.k === 'verdura') {
        const limit = it.k === 'verdura' ? 40 : 100, hh = humAt(it.x, it.y);
        if (it.age > limit && hh > 50) it.mold = Math.min(1, it.mold + (it.k === 'verdura' ? 0.012 : 0.005) * dt * (hh / 100));
        if (it.mold > 0.5 && !it.said) { it.said = 1; if (!off) { say(has('chanchito') ? '¡Hay moho! Los chanchitos ayudan a limpiar, o sácalo con la esponja 🧽' : '¡Hay moho! Saca la comida vieja con la esponja 🧽', '🍄'); unlockFact('mold'); } }
      }
      mold += it.mold;
    }
    T.mold = mold;
    if (T.vent > 0) for (const it of T.items) it.mold = Math.max(0, it.mold - 0.02 * dt);
    T.items = T.items.filter(i => i.amt > 0);
    T.over = T.bugs.length / capacity();
    if (!off) stepPrey(dt);
  }

  /* pulgones y moscas: «presas» que aparecen solas (nunca son los bichos del niño) */
  function stepPrey(dt) {
    T.aphT -= dt; T.flyT -= dt;
    const fl = flowers();
    if (T.aphT <= 0) {
      T.aphT = rnd(22, 34);
      if (T.aphids.length < 4 && (fl.length || T.moss > 0.35)) {
        const host = fl.length && (T.moss <= 0.35 || Math.random() < 0.6) ? pick(fl) : null, m = pick(mossSpots);
        T.aphids.push({ id: T.nextId++, x: host ? host.x + rnd(-12, 12) : m.x, y: host ? host.y + rnd(-10, 10) : m.y, n: 0.5, host });
        if (!T.saidAph) { T.saidAph = 1; say('¡Llegaron pulgones a las plantas! Una chinita puede comerlos 🐞', '🌿'); }
      }
    }
    for (const a of T.aphids) {
      a.n = Math.min(3, a.n + 0.04 * dt);
      if (a.n >= 2) { if (a.host && a.host.amt > 0) a.host.amt -= 0.4 * dt; else if (!a.host) T.moss = Math.max(0.03, T.moss - 0.0004 * dt); }
    }
    T.aphids = T.aphids.filter(a => a.n > 0 && (!a.host || a.host.amt > 0));
    if (T.flyT <= 0) {
      T.flyT = rnd(18, 32);
      const food = T.items.some(i => (i.k === 'verdura' || i.k === 'hoja') && i.age > 15) || T.mold > 0.2 || Math.random() < 0.35;
      if (T.flies.length < 5 && food) { const e = Math.random() < 0.5; T.flies.push({ id: T.nextId++, x: e ? MINX : MAXX, y: rnd(MINY + 40, MAXY - 40), a: e ? 0 : Math.PI, life: 100, ph: rnd(0, 6) }); }
    }
    for (const f of T.flies) {
      f.life -= dt; f.ph += dt * 30;
      f.a += (Math.sin(f.ph * 0.07 + f.id) * 3.5) * dt;
      f.x += Math.cos(f.a) * 30 * dt; f.y += Math.sin(f.a) * 30 * dt;
      if (f.x < MINX || f.x > MAXX) { f.a = Math.PI - f.a; f.x = clamp(f.x, MINX, MAXX); }
      if (f.y < MINY || f.y > MAXY) { f.a = -f.a; f.y = clamp(f.y, MINY, MAXY); }
    }
    T.flies = T.flies.filter(f => f.life > 0 && !f.dead);
  }

  /* ---------- salud, muda y crías ---------- */
  function stepVitals(dt, off) {
    const bugs = T.bugs;
    const males = bugs.filter(i => i.sp === 'chanchito' && i.sex === 'M' && i.age >= 8).length;
    const full = bugs.length >= capacity();
    for (let n = bugs.length - 1; n >= 0; n--) {
      const s = bugs[n], sim = S(s);
      s.age += dt / DAY;
      const h = humAt(s.x, s.y), lit = T.lamp && Math.hypot(s.x - LAMP.x, s.y - LAMP.y) < LAMP.r && !s.hid && sim.light < 0;
      const k = off ? 0.3 : 1, fly = sim.move === 'fly';
      const dry = clamp((sim.hum[0] - h) / Math.max(10, sim.hum[0]), 0, 1);
      // hidratación
      if (h >= sim.hum[0] + 5 || (s.hid && h >= sim.hum[0])) s.hyd = Math.min(100, s.hyd + 2.2 * dt * (h / 100) * (fly ? 0.7 : 1));
      else s.hyd = Math.max(0, s.hyd - (0.15 + dry * 1.0 + (lit ? 0.7 : 0) + (T.temp > sim.tmax - 2 ? 0.5 : 0)) * sim.hydRate * dt * k);
      s.food = Math.max(0, s.food - sim.foodRate * dt * k);
      if (s.sp === 'chanchito') s.cal = Math.max(0, s.cal - 0.07 * dt * k);
      // salud
      let dmg = 0, why = '';
      if (s.hyd < 15) { dmg += 0.8; why = 'sed'; }
      if (s.food < 4) { dmg += 0.4; why = why || 'hambre'; }
      if (T.temp > sim.tmax + 1) { dmg += 0.7; why = why || 'calor'; }
      if (T.temp < sim.tmin - 4) { dmg += 0.3; why = why || 'frio'; }
      if (h > 97 && sim.hum[1] >= 100) { dmg += 0.5; why = why || 'agua'; }
      if (h > sim.hum[1] + 10 && sim.hum[1] < 100) { dmg += 0.4; why = why || 'agua'; }
      if (lit && s.hyd < 50) { dmg += 0.15; why = why || 'luz'; }
      if (s.sp === 'chanchito' && s.molt >= 1 && s.cal < 40 && !s.molting) { dmg += 0.12; why = why || 'calcio'; }
      if (T.over > 1.05) dmg += 0.1;
      if (s.sp !== 'chanchito') { const near = T.items.reduce((m, it) => it.mold > 0.3 && Math.hypot(it.x - s.x, it.y - s.y) < 40 ? m + it.mold : m, 0); if (near) { dmg += 0.2 * near; why = why || 'moho'; } }
      if (dmg > 0) { s.hp -= dmg * dt * (off ? 0.3 : 1); s.cause = why; }
      else if (s.hyd > 45 && s.food > 25) s.hp = Math.min(100, s.hp + 0.7 * dt);
      if (off) s.hp = Math.max(40, s.hp);
      if (!off && s.age > s.life) { s.hp = 0; s.cause = 'vejez'; }
      if (s.hp <= 0) { bugs.splice(n, 1); T.lost++; if (sel === s) sel = null; if (!off) die(s); continue; }
      if (s.sp !== 'chanchito') continue;
      /* --- solo chanchito: muda en dos mitades y crías en el marsupio --- */
      if (s.molting > 0) {
        s.molting -= dt;
        if (s.molting <= 0) { s.molt = 0; s.cal = Math.min(100, Math.max(0, s.cal - 25) + 8); s.age += 0.4; s.hid = false; if (!off) { unlockFact('molt2'); parts.push({ x: s.x, y: s.y, t: 'star', life: 1 }); SFX.pop(); } }
      } else {
        s.molt += dt / (s.age < 10 ? 270 : 720) * k;
        if (s.molt >= 1 && s.cal >= 40 && s.hyd > 40 && !off) { s.molting = 32; if (!G.save.facts.molt) unlockFact('molt'); }
      }
      if (s.preg > 0) {
        s.preg -= dt;
        if (s.preg <= 0 && !off) {
          const nb = Math.min(capacity() - bugs.length, s.brood);
          for (let b = 0; b < nb; b++) bugs.push(newBug('chanchito', { age: 0, x: s.x + rnd(-8, 8), y: s.y + rnd(-8, 8), hyd: 80, food: 60, cal: 60, molt: 0.9 }));
          T.born += nb; s.cool = 70; s.brood = 0;
          if (nb > 0) { SFX.baby(); unlockFact('marsupium'); setTimeout(() => unlockFact('baby'), 4000); parts.push({ x: s.x, y: s.y, t: 'heart', life: 1.2 }); say(s.name + ' tuvo ' + nb + ' cría' + (nb > 1 ? 's' : '') + ' 👶', '🎒'); }
        }
      } else if (s.cool > 0) s.cool -= dt;
      else if (s.sex === 'F' && s.age >= 10 && males && !full && !off && s.hp > 70 && s.hyd > 60 && s.food > 55 && s.cal > 50 && T.temp > 17 && T.temp < 28 && Math.random() < 0.004 * dt) {
        s.preg = 75; s.brood = 1 + ((s.cal / 40) | 0) + ((Math.random() * 2) | 0); unlockFact('broods');
      }
    }
  }
  function die(s) {
    SFX.die(); (T.causes = T.causes || {})[s.cause || '?'] = ((T.causes || {})[s.cause || '?'] || 0) + 1;
    const why = { sed: 'le faltó humedad 💧', hambre: 'le faltó comida 🍽️', calor: 'tuvo demasiado calor 🌡️', frio: 'tuvo mucho frío 🥶', agua: 'había demasiada agua 🌊', luz: 'la luz lo secó 💡', calcio: 'le faltó calcio 🦴', moho: 'había moho 🍄', vejez: 'ya era muy viejito 🎂', '': 'se sintió mal' }[s.cause || ''];
    say(s.name + ' (' + BUG_BY_ID[s.sp].n + ') se fue a descansar: ' + why, '🕊️');
    if (s.cause === 'sed') unlockFact('gills'); if (s.cause === 'calor' || s.cause === 'frio') unlockFact('temp'); if (s.cause === 'agua') unlockFact('moisture');
    if (s.cause === 'luz') unlockFact('light'); if (s.cause === 'calcio') unlockFact('calcium'); if (s.cause === 'moho') unlockFact('mold');
  }

  /* ---------- conducta ---------- */
  const near = (arr, x, y, maxD, f) => { let best = null, bd = maxD; for (const o of arr) { if (f && !f(o)) continue; const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } } return best; };

  function think(b) {
    const sim = S(b), L = T.light, hereH = humAt(b.x, b.y), fly = sim.move === 'fly';
    const lit = T.lamp && Math.hypot(b.x - LAMP.x, b.y - LAMP.y) < LAMP.r;
    b.eat = b.bark = b.tgt = null; b.kind = null;
    // 0) susto: la araña pollito asusta a los demás
    if (sim.fear) {
      const hunter = T.bugs.find(o => o.sp === 'pollito' && o !== b && Math.hypot(o.x - b.x, o.y - b.y) < 70);
      if (hunter) {
        unlockFact('fear');
        const d = Math.hypot(hunter.x - b.x, hunter.y - b.y);
        if (b.sp === 'chanchito' && d < 45) { b.curl = 2.8; unlockFact('ball'); b.tx = null; return; }
        if (b.sp === 'chinita' && d < 45) { b.curl = 2.2; b.tx = null; return; }
        const a = Math.atan2(b.y - hunter.y, b.x - hunter.x);
        b.mode = 'flee'; b.tx = clamp(b.x + Math.cos(a) * 110, MINX, MAXX); b.ty = clamp(b.y + Math.sin(a) * 110, MINY, MAXY); return;
      }
    }
    // 0b) el chinchemolle suelta olor si hay un cazador cerca
    if (b.sp === 'palo') {
      const h2 = T.bugs.find(o => o.sp === 'pollito' && Math.hypot(o.x - b.x, o.y - b.y) < 55);
      if (h2) { b.smell = 3; unlockFact('palo3'); }
    }
    // 1) sed / demasiada humedad
    const wet = sim.hum[1] < 100 && hereH > sim.hum[1];
    if (b.hyd < 45 || hereH < sim.hum[0] - 5 || wet) {
      let best = null, bv = wet ? 100 - hereH : hereH;
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28, r = 50 + rnd(0, 70), x = clamp(b.x + Math.cos(a) * r, MINX, MAXX), y = clamp(b.y + Math.sin(a) * r, MINY, MAXY), hv = humAt(x, y), v = wet ? 100 - hv : hv; if (v > bv + 2) { bv = v; best = { x, y }; } }
      if (best) { b.mode = 'seek'; b.tx = best.x; b.ty = best.y; return; }
    }
    // 2) hambre y comidas especiales
    const thr = sim.hunter ? 85 : (sim.diet.includes('flor') ? 80 : 55);
    if (b.food < thr || (b.sp === 'chanchito' && b.cal < 45) || (b.sp === 'chanchito' && T.mold > 0.4 && Math.random() < 0.3)) {
      let best = null, bk = null, bd = 1e9;
      const tryT = (o, kind, bonus) => { const d = Math.hypot(o.x - b.x, o.y - b.y) - (bonus || 0); if (d < bd) { bd = d; best = o; bk = kind; } };
      for (const kind of sim.diet) {
        if (kind === 'pulgon') { for (const a of T.aphids) if (a.n > 0.2) tryT(a, 'pulgon'); }
        else if (kind === 'mosca') { for (const f of T.flies) if (!f.dead && Math.hypot(f.x - b.x, f.y - b.y) < (sim.huntR || 999)) tryT(f, 'mosca'); }
        else if (kind === 'moho') { for (const it of T.items) if (it.mold > 0.3 && it.k !== 'corteza') tryT(it, 'moho', 30); }
        else for (const it of T.items) {
          if (it.k !== kind || it.amt < 5) continue;
          if (kind === 'calcio' && b.cal >= 70) continue;
          if ((kind === 'hoja' || kind === 'verdura') && it.mold > 0.8) continue;
          tryT(it, kind, kind === 'calcio' && b.cal < 45 ? 80 : 0);
        }
      }
      if (best && !(sim.act === 'night' && L > 0.5 && b.food > 30 && !sim.hunter)) { b.mode = 'food'; b.tgt = best; b.kind = bk; b.tx = best.x; b.ty = best.y; return; }
    }
    // 3) luz
    if (sim.light > 0 && T.lamp && L < 0.5) { b.mode = 'lamp'; b.tx = LAMP.x; b.ty = LAMP.y; return; }
    // 4) ritmo: de día se esconden los nocturnos; de noche reposan los diurnos
    const hide = sim.hides && ((sim.act === 'night' && L > 0.5 && b.shy > 0.35) || (sim.light < 0 && lit));
    if (hide || (b.sp === 'chanchito' && b.molt >= 1)) {
      let bb = null, bd = 1e9;
      for (const k of barks()) { const d = Math.hypot(k.x - b.x, k.y - b.y); if (d < bd && (k.occ || 0) < 9) { bd = d; bb = k; } }
      if (bb) { b.mode = 'hide'; b.bark = bb; b.tx = bb.x + rnd(-14, 14); b.ty = bb.y + rnd(-8, 8); return; }
      if (lit) { b.mode = 'flee'; b.tx = clamp(b.x + (b.x < LAMP.x ? -1 : 1) * 120, MINX, MAXX); b.ty = clamp(b.y + 160, MINY, MAXY); return; }
    }
    if (sim.act === 'day' && L < 0.35) { b.mode = 'rest'; b.tx = null; return; }
    if (b.molting > 0) { b.mode = 'still'; b.tx = null; return; }
    // 5) percha (libélula) y paseo
    if (b.sp === 'libelula' && Math.random() < 0.5) { const pch = near(T.items, b.x, b.y, 500, i => i.k === 'rama' || i.k === 'palito'); if (pch) { b.mode = 'perch'; b.tx = pch.x + rnd(-14, 14); b.ty = pch.y + rnd(-5, 5); return; } }
    if ((b.sp === 'chanchito' || b.sp === 'tijereta') && Math.random() < 0.5) {
      const c = near(T.bugs, b.x, b.y, 90, o => o !== b && !o.hid && (o.sp === b.sp || Math.random() < 0.3));
      if (c && Math.hypot(c.x - b.x, c.y - b.y) > 10) { b.mode = 'group'; b.tx = c.x; b.ty = c.y; return; }
    }
    if (Math.random() < 0.4) { const ds = T.items.filter(i => DECOR.includes(i.k) || i.k === 'corteza' || (i.k === 'flor' && fly)); if (ds.length) { const d = pick(ds); b.mode = 'wander'; b.tx = d.x + rnd(-12, 12); b.ty = d.y + rnd(-12, 12); return; } }
    b.mode = 'wander'; const a = rnd(0, 6.28), r = fly ? rnd(60, 160) : rnd(30, 90); b.tx = clamp(b.x + Math.cos(a) * r, MINX, MAXX); b.ty = clamp(b.y + Math.sin(a) * r, MINY, MAXY);
  }

  function stepMove(dt) {
    const bs = barks(); bs.forEach(k => k.occ = 0);
    const decorAll = T.items.filter(i => DECOR.includes(i.k) || i.k === 'corteza');
    for (const b of T.bugs) {
      const sim = S(b), fly = sim.move === 'fly';
      b.ph += dt * (fly ? 14 : 8);
      if (b.smell > 0) b.smell -= dt;
      if (b.curl > 0) { b.curl -= dt; b.moving = 0; continue; }
      const len = bugLen(b);
      if (b.molting > 0) { b.hid = nearBark(b, bs, true); b.moving = 0; continue; }
      b.think -= dt;
      if (b.think <= 0) { think(b); b.think = rnd(0.7, 1.8); if (fly) b.think *= 0.8; }
      // el objetivo se mueve (moscas)
      if (b.kind === 'mosca' && b.tgt) { if (b.tgt.dead) { b.tgt = null; b.tx = null; b.think = 0; } else { b.tx = b.tgt.x; b.ty = b.tgt.y; } }
      if ((b.kind === 'pulgon') && b.tgt && b.tgt.n <= 0) { b.tgt = null; b.tx = null; b.think = 0; }
      if (b.mode === 'lamp') { const a = T.t * 1.4 + b.id; b.tx = LAMP.x + Math.cos(a) * 55; b.ty = LAMP.y + Math.sin(a) * 40; }
      const h = humAt(b.x, b.y);
      let touch = 0;
      if (b.sp === 'chanchito' || b.sp === 'tijereta') {
        for (const o of T.bugs) if (o !== b && Math.abs(o.x - b.x) < 14 && Math.abs(o.y - b.y) < 14) touch++;
        for (const it of decorAll) if (Math.abs(it.x - b.x) < 16 && Math.abs(it.y - b.y) < 16) { touch++; break; }
      }
      let sp = sim.spd * (b.sp === 'chanchito' ? len / 22 * 0.6 + 0.4 : 1);
      if (b.sp === 'chanchito') sp *= h < 40 ? 1.7 : h > 70 ? 0.6 : 1;       // cinesis
      if (T.temp < sim.tmin) sp *= 0.4; if (T.temp > sim.tmax - 3) sp *= 1.2;
      if (touch && b.mode !== 'seek' && b.mode !== 'flee') sp *= 0.25;
      if (sim.move === 'hop') sp *= Math.pow(Math.max(0, Math.sin(b.ph * 0.9)), 2) * 3.2;
      if (fly && (b.mode === 'food' && (b.kind === 'mosca'))) sp *= 2.4;
      if (b.mode === 'flee') sp *= 1.8;
      b.moving = 0;
      if (b.tx != null) {
        const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - b.a; while (da > Math.PI) da -= 6.28; while (da < -Math.PI) da += 6.28;
        b.a += clamp(da, -(fly ? 3.2 : 5) * dt, (fly ? 3.2 : 5) * dt) + Math.sin(b.ph * 0.35) * (fly ? 1.2 : 0.6) * dt;
        const reach = b.kind === 'mosca' ? (b.sp === 'pollito' ? 16 : 11) : fly ? 9 : 7;
        if (d < reach) {
          if (b.mode === 'food' && b.tgt) { consume(b, dt); sp = 0; }
          else if (b.mode === 'hide' || b.mode === 'perch' || b.mode === 'rest') sp = 0;
          else if (b.mode === 'group') sp *= 0.1;
          else if (b.mode === 'lamp') { /* sigue orbitando */ }
          else { b.tx = null; sp *= 0.2; }
        }
        b.x += Math.cos(b.a) * sp * dt; b.y += Math.sin(b.a) * sp * dt; b.moving = sp > 1 ? 1 : 0.15;
      }
      b.x = clamp(b.x, MINX, MAXX); b.y = clamp(b.y, MINY, MAXY);
      b.hid = sim.hides && !fly ? nearBark(b, bs, b.mode === 'hide' || (sim.act === 'night' && T.light > 0.5) || b.molt >= 1 && b.sp === 'chanchito') : false;
      // canto del grillo
      if (b.sp === 'grillo' && T.light < 0.5 && !b.hid && T.temp > 12) {
        b.sing -= dt;
        if (b.sing <= 0) { b.sing = lerp(4, 1.4, clamp((T.temp - 15) / 9, 0, 1)); if (parts.length < 40) parts.push({ x: b.x, y: b.y - 8, t: 'note', life: 1.3 }); unlockFact('grillo3'); if (T.temp > 20) unlockFact('grillo2'); }
      }
    }
    if (T.light > 0.5 && T.bugs.some(b => b.hid)) unlockFact('nocturnal');
    const gx = T.bugs.filter(b => b.sp === 'chanchito');
    if (gx.length > 5) { let c = 0; for (const a of gx) { let n = 0; for (const o of gx) if (a !== o && Math.abs(a.x - o.x) < 16 && Math.abs(a.y - o.y) < 16) n++; if (n >= 2) c++; } if (c >= 4) unlockFact('group'); }
    if (T.bugs.some(b => b.sp === 'tijereta' && b.hid)) unlockFact('tijereta3');
    if (T.bugs.some(b => b.sp === 'libelula' && b.mode === 'perch')) unlockFact('libelula4');
    if (T.bugs.some(b => b.sp === 'pollito') && T.light < 0.5) unlockFact('pollito3');
  }
  function nearBark(b, bs, allow) {
    if (!allow) return false;
    for (const k of bs) if ((k.occ || 0) < 9 && Math.hypot(k.x - b.x, k.y - b.y) < 24) { k.occ = (k.occ || 0) + 1; return true; }
    return false;
  }

  /* comer: cada tipo de alimento produce su interacción */
  function consume(b, dt) {
    const t = b.tgt, kind = b.kind;
    if (!t) { b.tx = null; return; }
    if (kind === 'pulgon') {
      t.n -= 1.0 * dt; b.food = Math.min(100, b.food + 12 * dt);
      if (b.sp === 'chinita') unlockFact('chinita3');
      if (t.n <= 0) { b.tgt = null; b.tx = null; unlockFact('food'); parts.push({ x: t.x, y: t.y, t: 'star', life: 0.8 }); }
      return;
    }
    if (kind === 'mosca') {
      if (!t.dead) { t.dead = true; b.food = Math.min(100, b.food + 55); parts.push({ x: t.x, y: t.y, t: 'star', life: 0.8 }); SFX.pop(); unlockFact(b.sp === 'libelula' ? 'libelula3' : 'pollito3'); unlockFact('food'); }
      b.tgt = null; b.tx = null; b.think = rnd(0.5, 1.2); return;
    }
    if (t.amt <= 0) { b.tgt = null; b.tx = null; return; }
    if (kind === 'moho') {
      t.mold = Math.max(0, t.mold - 0.25 * dt); b.food = Math.min(100, b.food + 2.5 * dt); unlockFact('mold'); unlockFact('decomp');
      if (t.mold <= 0.05) { b.tgt = null; b.tx = null; if (!T.saidClean) { T.saidClean = 1; say('¡Los chanchitos limpiaron el moho! 🧹', '🐛'); } }
      return;
    }
    if (kind === 'calcio') { t.amt -= 1.2 * dt; b.cal = Math.min(100, b.cal + 9 * dt); unlockFact('calcium'); if (b.cal >= 98) { b.tgt = null; b.tx = null; } return; }
    if (kind === 'flor') {      // néctar: se alimenta y poliniza
      t.amt -= 0.5 * dt; b.food = Math.min(100, b.food + 5 * dt);
      if (b.sp === 'moscardon' || b.sp === 'mariposa') {
        b.visit += dt; unlockFact(b.sp === 'moscardon' ? 'moscardon2' : 'mariposa3');
        if (b.visit >= 4) {
          b.visit = 0; T.pollen++;
          if (T.pollen >= 2 && flowers().length < 8 && T.items.length < 40) { T.pollen = 0; addFlower(t.x + rnd(-40, 40), t.y + rnd(-40, 40), 70); parts.push({ x: t.x, y: t.y, t: 'flower', life: 1.4 }); SFX.baby(); say('¡' + BUG_BY_ID[b.sp].n + ' polinizó y nació una flor nueva! 🌺', '🌺'); unlockFact('moscardon3'); unlockFact('food'); }
        }
      }
      if (b.food >= 95) { b.tgt = null; b.tx = null; }
      return;
    }
    // hoja / verdura
    if (t.mold > 0.3 && b.sp !== 'chanchito') { b.tgt = null; b.tx = null; return; }
    t.amt -= 2.5 * dt; b.food = Math.min(100, b.food + 9 * dt);
    if (b.sp === 'chanchito' && t.mold > 0.3) { t.mold = Math.max(0, t.mold - 0.25 * dt); }
    if (b.sp === 'chanchito') unlockFact(kind === 'hoja' ? 'decomp' : 'veg');
    if (b.sp === 'pololo') unlockFact('pololo4');
    if (b.sp === 'palo') unlockFact('palo4');
    if (b.sp === 'grillo') unlockFact('grillo4');
    if (b.sp === 'tijereta') unlockFact('tijereta2');
    if (b.food >= 98) { b.tgt = null; b.tx = null; }
  }

  /* ---------- dibujo ---------- */
  function bugState(b) {
    const sim = S(b), fly = sim.move === 'fly';
    return { len: bugLen(b), ph: b.ph, mv: b.moving, wing: fly ? 1 : 0, landed: fly && (b.mode === 'rest' || b.mode === 'perch' || (b.mode === 'food' && b.tgt && Math.hypot(b.tx - b.x, b.ty - b.y) < 10 && b.kind !== 'mosca')),
      curl: b.curl, white: b.sp === 'chanchito' && b.age < 1.5, molt: b.molting > 0 ? (b.molting > 16 ? 1 : 2) : 0, preg: b.preg > 0, sing: b.sing > 0 && b.sing > lerp(4, 1.4, clamp((T.temp - 15) / 9, 0, 1)) - 0.4, smell: b.smell > 0 };
  }
  function drawBug(b) {
    const st = bugState(b);
    if (b.sp === 'palo') { const cam = near(T.items, b.x, b.y, 22, i => i.k === 'rama' || i.k === 'palito'); if (cam) cx.globalAlpha = 0.4; }
    if (isFlier(b) && !st.landed) {   // sombra en el suelo
      cx.fillStyle = 'rgba(0,0,0,.2)'; cx.beginPath(); cx.ellipse(b.x + 8, b.y + 10, st.len * 0.35, st.len * 0.18, b.a, 0, 6.28); cx.fill();
    }
    Art.bug(cx, b.sp, b.x, b.y - (isFlier(b) && !st.landed ? 4 : 0), b.a, st);
    cx.globalAlpha = 1;
  }
  function bubbleOf(b) {
    const sim = S(b);
    if (b.molting > 0) return '👕';
    if (b.hp < 40) return '😢';
    if (b.hyd < 35) return '💧';
    if (b.food < 30) return EAT_ICON[sim.diet[0]];
    if (b.sp === 'chanchito' && b.molt >= 1 && b.cal < 40) return '🦴';
    if (T.temp > sim.tmax) return '🥵';
    if (b.curl > 0) return '😱';
    if (b.preg > 0) return '🎒';
    return '';
  }
  function drawBark(k) {
    cx.save(); cx.translate(k.x, k.y);
    cx.fillStyle = '#6a4a2a'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(-34, 6); cx.quadraticCurveTo(-38, -22, -6, -22); cx.quadraticCurveTo(36, -26, 38, 4); cx.quadraticCurveTo(26, 22, -8, 20); cx.quadraticCurveTo(-30, 22, -34, 6); cx.closePath(); cx.fill(); cx.stroke();
    cx.strokeStyle = '#4a3320'; cx.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) { cx.beginPath(); cx.moveTo(-26 + i * 13, -16 + (i % 2) * 3); cx.quadraticCurveTo(-24 + i * 13, 0, -28 + i * 14, 14); cx.stroke(); }
    cx.fillStyle = 'rgba(255,255,255,.12)'; cx.beginPath(); cx.ellipse(-8, -12, 22, 5, -0.1, 0, 7); cx.fill();
    cx.restore();
    if ((k.occ || 0) > 0) {
      cx.save(); cx.font = '800 11px ui-rounded,sans-serif'; cx.textAlign = 'center'; cx.fillStyle = 'rgba(255,255,255,.92)'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2;
      const t = '💤 ' + k.occ, w = cx.measureText(t).width + 8;
      cx.beginPath(); cx.roundRect(k.x - w / 2, k.y - 40, w, 16, 8); cx.fill(); cx.stroke(); cx.fillStyle = '#1d1a16'; cx.fillText(t, k.x, k.y - 28); cx.restore();
    }
  }
  function drawItem(it) {
    cx.save(); cx.translate(it.x, it.y);
    cx.strokeStyle = '#1d1a16'; cx.lineWidth = 1.6;
    const f = clamp(it.amt / 100, 0.25, 1);
    if (it.k === 'rama') {
      cx.rotate(it.id * 1.3); cx.lineCap = 'round';
      const br = (x0, y0, x1, y1, w) => { cx.lineWidth = w + 3; cx.strokeStyle = '#1d1a16'; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke(); cx.lineWidth = w; cx.strokeStyle = '#7a5530'; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke(); };
      br(-34, 3, 32, -3, 7); br(-6, 1, 14, -22, 4); br(12, -2, 30, 16, 3.5); br(-22, 2, -32, -14, 3);
    } else if (it.k === 'palito') {
      cx.rotate(it.id * 2.1); cx.lineCap = 'round';
      cx.lineWidth = 6; cx.strokeStyle = '#1d1a16'; cx.beginPath(); cx.moveTo(-15, 0); cx.lineTo(15, 2); cx.stroke();
      cx.lineWidth = 3; cx.strokeStyle = '#a77a45'; cx.beginPath(); cx.moveTo(-15, 0); cx.lineTo(15, 2); cx.stroke();
    } else if (it.k === 'piedra') {
      cx.rotate(it.id); cx.fillStyle = '#9b9b9b'; cx.beginPath(); cx.moveTo(-14, 6); cx.quadraticCurveTo(-18, -10, -2, -12); cx.quadraticCurveTo(16, -12, 16, 4); cx.quadraticCurveTo(6, 13, -14, 6); cx.fill(); cx.stroke();
      cx.fillStyle = 'rgba(255,255,255,.35)'; cx.beginPath(); cx.ellipse(-4, -5, 6, 3, -0.3, 0, 7); cx.fill();
    } else if (it.k === 'pina') {
      cx.rotate(it.id * 0.8); cx.fillStyle = '#7a4f2a'; cx.beginPath(); cx.ellipse(0, 0, 15, 9, 0, 0, 7); cx.fill(); cx.stroke();
      cx.strokeStyle = '#4a2f18'; cx.lineWidth = 1.3; for (let i = -10; i <= 10; i += 5) { cx.beginPath(); cx.moveTo(i, -8); cx.quadraticCurveTo(i + 4, 0, i, 8); cx.stroke(); }
    } else if (it.k === 'flor') {
      cx.scale(1.5 * Math.max(0.6, f), 1.5 * Math.max(0.6, f)); Art.copihue(cx, 0, 0, 1, T.t + it.id);
    } else if (it.k === 'hoja') {
      cx.rotate(it.id * 1.7); cx.scale(f, f);
      cx.fillStyle = it.mold > 0.5 ? '#7d7a4a' : '#b9892b'; cx.beginPath(); cx.moveTo(-16, 0); cx.quadraticCurveTo(0, -14, 16, 0); cx.quadraticCurveTo(0, 12, -16, 0); cx.fill(); cx.stroke();
      cx.beginPath(); cx.moveTo(-16, 0); cx.lineTo(16, 0); cx.stroke();
    } else if (it.k === 'verdura') {
      cx.scale(f, f); cx.fillStyle = it.mold > 0.5 ? '#9c8a55' : '#ff8a1f'; cx.beginPath(); cx.arc(0, 0, 11, 0, 7); cx.fill(); cx.stroke();
      cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.beginPath(); cx.arc(0, 0, 6, 0, 7); cx.stroke();
    } else if (it.k === 'calcio') {
      cx.scale(f, f); cx.fillStyle = '#fbf7ea';
      cx.beginPath(); cx.moveTo(-12, 3); cx.quadraticCurveTo(-10, -12, 2, -10); cx.quadraticCurveTo(14, -6, 10, 6); cx.quadraticCurveTo(0, 12, -12, 3); cx.fill(); cx.stroke();
    }
    if (it.mold > 0.25) { cx.fillStyle = 'rgba(150,200,120,' + clamp(it.mold, 0.3, 0.9) + ')'; for (let i = 0; i < 6; i++) { cx.beginPath(); cx.arc(Math.cos(i * 2.1) * 8, Math.sin(i * 2.7) * 6, 3 + it.mold * 3, 0, 7); cx.fill(); } }
    cx.restore();
  }

  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.fillStyle = '#16210f'; cx.fillRect(0, 0, cw, ch);
    cx.save(); cx.translate(ox, oy); cx.scale(scale, scale);
    cx.fillStyle = '#3a2a18'; cx.fillRect(-ox / scale, -oy / scale, cw / scale, ch / scale);
    cx.save(); cx.beginPath(); cx.roundRect(BX, BY, BW, BH, 18); cx.clip();
    const hd = humCv.getContext('2d'), im = hd.createImageData(GW, GH);
    for (let i = 0; i < GW * GH; i++) { const t = clamp((T.hum[i] - 15) / 80, 0, 1); im.data[i * 4] = lerp(206, 62, t); im.data[i * 4 + 1] = lerp(166, 42, t); im.data[i * 4 + 2] = lerp(112, 26, t); im.data[i * 4 + 3] = 255; }
    hd.putImageData(im, 0, 0);
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    cx.drawImage(humCv, BX, BY, BW, BH); cx.drawImage(soilTex, BX, BY);
    for (const d of decor) { cx.save(); cx.translate(d.x, d.y); cx.rotate(d.a); cx.globalAlpha = 0.55; cx.fillStyle = d.c; cx.beginPath(); cx.ellipse(0, 0, d.l, d.l * 0.42, 0, 0, 7); cx.fill(); cx.restore(); }
    cx.globalAlpha = 1;
    const nm = Math.floor(T.moss * mossSpots.length);
    for (let i = 0; i < nm; i++) { const m = mossSpots[i]; cx.fillStyle = '#4f9d3a'; for (let k = 0; k < 6; k++) { cx.beginPath(); cx.arc(m.x + Math.cos(k * 1.3 + i) * m.r * 0.55, m.y + Math.sin(k * 1.7 + i) * m.r * 0.45, m.r * 0.38, 0, 7); cx.fill(); } cx.fillStyle = 'rgba(190,255,150,.3)'; cx.beginPath(); cx.arc(m.x - 2, m.y - 2, m.r * 0.3, 0, 7); cx.fill(); }
    for (const it of T.items) if (it.k !== 'corteza') drawItem(it);
    // pulgones
    for (const a of T.aphids) { cx.fillStyle = '#8fd13f'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 0.6; const n = Math.ceil(a.n * 3); for (let i = 0; i < n; i++) { cx.beginPath(); cx.ellipse(a.x + Math.cos(i * 2.4) * (3 + i), a.y + Math.sin(i * 2.4) * (2 + i * 0.6), 2.4, 1.8, i, 0, 7); cx.fill(); cx.stroke(); } }
    // bichos que caminan (y los que reposan)
    const sorted = T.bugs.slice().sort((a, b) => a.y - b.y), walkers = sorted.filter(b => !isFlier(b) || bugState(b).landed);
    for (const b of walkers) if (!b.hid) drawBug(b);
    if (sel && !sel.hid) { cx.strokeStyle = '#ffe27a'; cx.lineWidth = 2.5; cx.setLineDash([4, 3]); cx.beginPath(); cx.arc(sel.x, sel.y, bugLen(sel) * 0.8 + 4, 0, 7); cx.stroke(); cx.setLineDash([]); }
    for (const k of barks()) drawBark(k);
    // voladores y moscas por encima
    for (const b of sorted) if (isFlier(b) && !bugState(b).landed) drawBug(b);
    for (const f of T.flies) { cx.fillStyle = '#111'; cx.beginPath(); cx.arc(f.x, f.y, 2.2, 0, 7); cx.fill(); cx.fillStyle = 'rgba(220,235,255,.7)'; cx.beginPath(); cx.ellipse(f.x - 1, f.y - 2.5 * Math.sin(f.ph), 2.6, 1.2, 0.5, 0, 7); cx.ellipse(f.x + 1, f.y + 2.5 * Math.sin(f.ph), 2.6, 1.2, -0.5, 0, 7); cx.fill(); }
    cx.font = '15px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (const b of sorted) { if (b.hid) continue; const bb = bubbleOf(b); if (!bb) continue; cx.fillStyle = 'rgba(255,255,255,.92)'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(b.x, b.y - 24, 10, 0, 7); cx.fill(); cx.stroke(); cx.fillStyle = '#000'; cx.fillText(bb, b.x, b.y - 23); }
    cx.textBaseline = 'alphabetic';
    for (const p of parts) {
      if (p.t === 'drop') { cx.fillStyle = 'rgba(120,200,255,' + clamp(p.life * 3, 0, 0.8) + ')'; cx.beginPath(); cx.ellipse(p.x, p.y, 1.8, 3.2, 0, 0, 7); cx.fill(); }
      else { cx.globalAlpha = clamp(p.life, 0, 1); cx.font = '22px sans-serif'; cx.textAlign = 'center'; cx.fillText(p.t === 'heart' ? '💗' : p.t === 'note' ? '♪' : p.t === 'flower' ? '🌺' : '✨', p.x, p.y - (1 - p.life) * 20); cx.globalAlpha = 1; }
    }
    const dark = (1 - T.light) * 0.40;
    if (dark > 0.01) { cx.fillStyle = 'rgba(20,30,90,' + dark + ')'; cx.fillRect(BX, BY, BW, BH); }
    if (T.lamp) {
      const g = cx.createRadialGradient(LAMP.x, LAMP.y, 8, LAMP.x, LAMP.y, LAMP.r + 30);
      g.addColorStop(0, 'rgba(255,240,170,.75)'); g.addColorStop(0.55, 'rgba(255,220,120,.32)'); g.addColorStop(1, 'rgba(255,200,100,0)');
      cx.globalCompositeOperation = 'screen'; cx.fillStyle = g; cx.fillRect(BX, BY, BW, BH); cx.globalCompositeOperation = 'source-over';
    }
    if (T.heat > 0) { cx.fillStyle = 'rgba(255,120,40,.10)'; cx.fillRect(BX, BY, BW, BH); }
    cx.restore();
    cx.strokeStyle = 'rgba(210,240,255,.9)'; cx.lineWidth = 8; cx.beginPath(); cx.roundRect(BX, BY, BW, BH, 18); cx.stroke();
    cx.strokeStyle = '#1d1a16'; cx.lineWidth = 3; cx.beginPath(); cx.roundRect(BX - 4, BY - 4, BW + 8, BH + 8, 22); cx.stroke();
    cx.beginPath(); cx.roundRect(BX + 4, BY + 4, BW - 8, BH - 8, 14); cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.10)'; cx.beginPath(); cx.moveTo(BX + 30, BY + 6); cx.lineTo(BX + 90, BY + 6); cx.lineTo(BX + 20, BY + 150); cx.lineTo(BX + 6, BY + 150); cx.fill();
    cx.fillStyle = T.lamp ? '#ffd34d' : '#9a9a9a'; cx.strokeStyle = '#1d1a16'; cx.lineWidth = 2.5;
    cx.beginPath(); cx.moveTo(LAMP.x - 22, BY + 4); cx.lineTo(LAMP.x + 22, BY + 4); cx.lineTo(LAMP.x + 10, BY + 22); cx.lineTo(LAMP.x - 10, BY + 22); cx.closePath(); cx.fill(); cx.stroke();
    if (T.vent > 0) { cx.font = '22px sans-serif'; cx.textAlign = 'center'; cx.fillText('🌬️', BX + BW - 30, BY + 26 + Math.sin(T.t * 6) * 3); }
    cx.restore();
  }

  /* ---------- HUD y consejero ---------- */
  function setT(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function hud() {
    const day = Math.floor(T.t / DAY) + 1;
    setT('#tDay', (T.light > 0.5 ? '☀️ ' : '🌙 ') + day);
    setT('#tTemp', '🌡 ' + Math.round(T.temp) + '°' + (T.temp > 29 ? ' ⚠' : ''));
    setT('#tHum', '💧 ' + Math.round(T.avgHum || 0) + '%' + (T.avgHum > 88 ? ' ⚠' : T.avgHum < 38 ? ' ⚠' : ''));
    setT('#tCount', '🐞 ' + T.bugs.length + '/' + capacity());
    setT('#tSpeed', speed === 1 ? '⏩' : speed === 3 ? '⏩⏩' : '⏩⏩⏩');
  }
  const NEED_TXT = { hoja: 'hojas 🍃', verdura: 'un trocito de verdura 🥕', flor: 'flores 🌺', pulgon: 'pulgones: salen en flores 🌺 y musgo (dale luz 💡 un rato)', mosca: 'moscas: llegan cuando hay comida vieja (deja verdura 🥕 o hojas)' };
  function advice() {
    const n = T.bugs.length, bag = bagTotal();
    let ic = '😊', tx = '¡Tu terrario está feliz! Mira cómo conviven.';
    const hungry = T.bugs.filter(b => b.food < 25), thirsty = T.bugs.filter(b => b.hyd < 25);
    if (!n) {
      if (bag > 0) { ic = '🎒'; tx = 'Tienes ' + bag + ' bicho' + (bag > 1 ? 's' : '') + ' en la mochila. Toca su casilla abajo y luego la tierra para ponerlo. ¡Dale también una corteza 🪵 y una hoja 🍃!'; }
      else { ic = '🏃'; tx = 'El terrario está vacío. Pasa el nivel 1 (¡llega a la bandera 🏁!) para ganar tu primer bicho.'; }
    }
    else if (!barks().length && T.bugs.some(b => S(b).hides)) { ic = '🪵'; tx = 'Los bichos nocturnos no tienen dónde esconderse de día. Pon corteza 🪵.'; }
    else if (T.temp > 29) { ic = '🥵'; tx = 'Hace mucho calor. Apaga la luz 💡, ventila 🌬️ y rocía agua 💧.'; }
    else if (T.avgHum > 88) { ic = '🌊'; tx = '¡Hay demasiada agua! Ventila 🌬️ para que se seque un poco: tanta humedad causa moho.'; }
    else if (T.avgHum < 40 || thirsty.length) { ic = '💧'; tx = 'Está muy seco' + (thirsty.length ? ' y ' + thirsty[0].name + ' tiene sed' : '') + '. Rocía agua 💧 solo en un lado: deja el otro más seco para que elijan.'; }
    else if (T.lamp && T.light > 0.5 && T.bugs.some(b => S(b).light < 0)) { ic = '💡'; tx = 'La luz asusta y seca a los bichos de sombra. Apágala cuando el musgo ya esté verde.'; }
    else if (hungry.length) { const b = hungry[0], d = S(b).diet[0]; ic = EAT_ICON[d]; tx = BUG_BY_ID[b.sp].n + ' (' + b.name + ') tiene hambre. Dale ' + (NEED_TXT[d] || d) + '.'; }
    else if (T.bugs.some(b => b.sp === 'chanchito' && (b.cal < 40 || (b.molt >= 1 && b.cal < 40)))) { ic = '🦴'; tx = 'Los chanchitos necesitan calcio para su caparazón. Pon cáscara de huevo 🦴.'; }
    else if (T.mold > 0.6) { ic = '🍄'; tx = 'Hay moho en la comida vieja. Los chanchitos ayudan, o sácala con la esponja 🧽.'; }
    else if (bag > 0 && n < capacity()) { ic = '🎒'; tx = 'Tienes ' + bag + ' bicho' + (bag > 1 ? 's' : '') + ' esperando en la mochila. ¡Ponlo en la tierra!'; }
    else if (T.heat > 0) { ic = '🌡️'; tx = 'Es un día de calor. Vigila la humedad.'; }
    else if (T.bugs.some(b => b.molting > 0)) { ic = '👕'; tx = 'Alguien está cambiando de piel. ¡No lo molestes!'; }
    else if (T.aphids.some(a => a.n >= 2) && !has('chinita')) { ic = '🌿'; tx = 'Hay muchos pulgones dañando las plantas. ¡Una chinita 🐞 los comería!'; }
    else if (flowers().length && (has('moscardon') || has('mariposa'))) { ic = '🌺'; tx = 'Los visitantes de las flores ayudan a que nazcan flores nuevas.'; }
    else if (has('grillo') && T.light < 0.5) { ic = '🎶'; tx = 'Escucha: el grillo canta de noche. Con más calor, canta más rápido.'; }
    $('#advIc').textContent = ic; $('#advTx').textContent = tx;
  }

  /* ---------- mochila (casillas) y herramientas ---------- */
  const ITEMS = [['hoja', '🍃', 'una hoja'], ['verdura', '🥕', 'verdura'], ['calcio', '🦴', 'calcio'], ['flor', null, 'una flor'], ['corteza', '🪵', 'una corteza'], ['rama', '🌿', 'una rama'], ['palito', '🥢', 'un palito'], ['piedra', '🪨', 'una piedra'], ['pina', '🌰', 'una piña']];
  const ACTS = [['look', '🔍', 'Mirar'], ['spray', '💧', 'Rociar'], ['clean', '🧽', 'Sacar'], ['lamp', '💡', 'Luz'], ['vent', '🌬️', 'Ventilar'], ['say', '💬', 'Consejo']];
  let flowerIcon = null;
  function flowerImg() { if (flowerIcon) return flowerIcon; const c = document.createElement('canvas'); c.width = c.height = 64; Art.copihue(c.getContext('2d'), 32, 32, 2, 0); return (flowerIcon = c.toDataURL()); }
  function toolsUI() {
    const inv = G.save.inv, hb = $('#hotbar'), keep = hb.scrollLeft; hb.innerHTML = '';
    const add = (id, html, n, label) => {
      const b = document.createElement('button'); b.className = 'slot'; b.dataset.t = id; b.title = label;
      b.innerHTML = html + '<small>' + n + '</small>';
      if (!n) b.classList.add('zero'); if (tool === id) b.classList.add('sel');
      b.onclick = () => pickTool(id); hb.appendChild(b);
    };
    for (const bg of BUGS) if (G.save.found[bg.id]) add('b:' + bg.id, '<img src="' + Art.icon(bg.id, 48) + '" alt="">', G.save.bichos[bg.id] || 0, bg.n);
    for (const [id, em, lb] of ITEMS) add(id, id === 'flor' ? '<img src="' + flowerImg() + '" alt="">' : em, inv[id] || 0, lb);
    hb.scrollLeft = keep;
    const el = $('#tools'); el.innerHTML = '';
    for (const d of ACTS) {
      const b = document.createElement('button'); b.className = 'tool'; b.dataset.t = d[0];
      b.innerHTML = d[1] + '<small>' + d[2] + '</small>';
      if (tool === d[0]) b.classList.add('sel'); if (d[0] === 'lamp' && T.lamp) b.classList.add('on');
      b.onclick = () => pickTool(d[0]); el.appendChild(b);
    }
  }
  function pickTool(t) {
    SFX.pop();
    if (t === 'lamp') { T.lamp = !T.lamp; if (T.lamp) unlockFact('light'); say(T.lamp ? 'Luz encendida: el musgo crece y los pololos vienen, pero los bichos de sombra se asustan.' : 'Luz apagada.', '💡'); toolsUI(); return; }
    if (t === 'vent') { T.vent = 25; say('Ventilando 25 segundos: se seca el aire y se va el moho.', '🌬️'); toolsUI(); return; }
    if (t === 'say') { speak($('#advTx').textContent); return; }
    tool = t; if (t !== 'look') { sel = null; $('#info').classList.add('hidden'); }
    if (t === 'spray') say('Toca o arrastra para rociar agua.', '💧');
    if (t.startsWith('b:')) { const bg = BUG_BY_ID[t.slice(2)], n = G.save.bichos[bg.id] || 0; say(n ? 'Elegiste: ' + bg.n + '. Toca la tierra para ponerlo.' : 'No te quedan ' + bg.n + ' en la mochila. Repite su nivel para ganar otro.', '🎒'); }
    else { const it = ITEMS.find(s => s[0] === t); if (it) { const n = G.save.inv[t] || 0; say(n ? 'Elegiste ' + it[2] + '. Toca la tierra para ponerlo.' : 'No tienes ' + it[2] + '. ¡Corre para ganar más!', it[1] || '🌺'); } }
    if (t === 'clean') say('Toca algo para guardarlo en la mochila. Si es comida, se tira.', '🧽');
    toolsUI();
  }

  /* ---------- interacción ---------- */
  function worldPos(e) { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) - ox) / scale, y: ((e.clientY - r.top) - oy) / scale }; }
  const inBox = p => p.x > MINX - 6 && p.x < MAXX + 6 && p.y > MINY - 6 && p.y < MAXY + 6;
  function placeBug(id, p) {
    const bag = G.save.bichos, bg = BUG_BY_ID[id];
    if (!(bag[id] > 0)) { say('No te quedan ' + bg.n + ' en la mochila. Repite su nivel para ganar otro.', '🏃'); return; }
    if (T.bugs.length >= capacity()) { say('El terrario está lleno. Pon más cortezas o decoración para que quepan más.', '🏠'); return; }
    const sex = (G.save.sexN = (G.save.sexN || 0) + 1) % 2 === 1 ? 'F' : 'M';
    const b = newBug(id, { sex, x: clamp(p.x, MINX, MAXX), y: clamp(p.y, MINY, MAXY), hyd: 85, food: 70, cal: 70, molt: rnd(0.1, 0.6) });
    T.bugs.push(b); bag[id]--; parts.push({ x: b.x, y: b.y, t: 'star', life: 1 }); SFX.baby(); persist(); toolsUI();
    say('¡' + b.name + ', ' + bg.n.toLowerCase() + ', llegó a su nuevo hogar! 🏡', '🐞'); unlockFact('home');
  }
  function onDown(e) {
    const p = worldPos(e); cv.setPointerCapture(e.pointerId);
    if (tool === 'spray') { spraying = true; sprayAt(p); return; }
    if (!inBox(p)) return;
    const inv = G.save.inv;
    if (tool === 'look') {
      const best = near(T.bugs, p.x, p.y, 30, s => !s.hid);
      if (best) {
        sel = best; SFX.pop();
        if (best.sp === 'chanchito') { best.curl = 3; best.tx = null; unlockFact('ball'); }
        if (best.sp === 'palo') { best.smell = 3; unlockFact('palo3'); }
        showInfo();
      } else {
        const k = barks().find(k => Math.hypot(k.x - p.x, k.y - p.y) < 36);
        if (k) { const hs = T.bugs.filter(s => s.hid && Math.hypot(s.x - k.x, s.y - k.y) < 30); sel = null; $('#info').classList.add('hidden'); say(hs.length ? hs.length + ' bicho' + (hs.length > 1 ? 's' : '') + ' duermen aquí: ' + hs.map(s => s.name).slice(0, 5).join(', ') : 'Aquí no hay nadie escondido ahora.', '🪵'); }
        else { sel = null; $('#info').classList.add('hidden'); }
      }
      return;
    }
    if (tool.startsWith('b:')) { placeBug(tool.slice(2), p); return; }
    if (ITEMS.some(s => s[0] === tool)) {
      if (!(inv[tool] > 0)) { say('No tienes más. ¡Corre para ganar más!', '🏃'); return; }
      const food = FOODS.includes(tool);
      if (tool === 'corteza' && barks().length >= 6) { say('Ya hay mucha corteza, ¡cabe poco más!', '🪵'); return; }
      if (DECOR.includes(tool) && decors().length >= 12) { say('Ya hay mucha decoración. Saca algo con la esponja 🧽 para cambiarlo.', '🌿'); return; }
      if (food && T.items.filter(i => FOODS.includes(i.k)).length >= 16) { say('Hay mucha comida. Deja que se la coman o sácala.', '🍃'); return; }
      inv[tool]--; T.items.push({ id: T.nextId++, k: tool, x: clamp(p.x, MINX, MAXX), y: clamp(p.y, MINY, MAXY), amt: 100, age: 0, mold: 0 });
      SFX.food(); persist(); toolsUI();
      if (tool === 'calcio') unlockFact('calcium'); else if (tool === 'corteza') unlockFact('nocturnal'); else if (DECOR.includes(tool)) unlockFact('group');
      return;
    }
    if (tool === 'clean') {
      const bi = near(T.bugs, p.x, p.y, 20, s => !s.hid);
      if (bi) { T.bugs = T.bugs.filter(i => i !== bi); G.save.bichos[bi.sp] = (G.save.bichos[bi.sp] || 0) + 1; if (sel === bi) sel = null; SFX.pop(); say(bi.name + ' volvió a tu mochila 🎒', '🐞'); persist(); toolsUI(); return; }
      const best = near(T.items, p.x, p.y, 34);
      if (best) {
        T.items = T.items.filter(i => i !== best); SFX.pop();
        if (best.k === 'corteza' || DECOR.includes(best.k) || best.k === 'flor') { inv[best.k] = (inv[best.k] || 0) + 1; say('Lo guardaste en la mochila. Puedes ponerlo en otro lugar.', '🎒'); }
        else if (best.mold > 0.3) { say('¡Bien! Sacaste comida con moho.', '🧽'); unlockFact('mold'); }
        persist(); toolsUI();
      }
    }
  }
  function sprayAt(p) {
    if (!inBox(p)) return;
    spray(p.x, p.y, 10); unlockFact('gills');
    if (T.hum[cell(p.x, p.y)] > 92) { if (!T.saidWet || T.t - T.saidWet > 20) { T.saidWet = T.t; say('¡Cuidado! Demasiada agua en un solo lugar.', '🌊'); unlockFact('moisture'); } }
  }
  let lastSpray = 0;
  function onMove(e) { if (!spraying) return; const now = performance.now(); if (now - lastSpray < 70) return; lastSpray = now; sprayAt(worldPos(e)); }
  function onUp() { spraying = false; }

  function showInfo() {
    const s = sel, el = $('#info');
    if (!s) { el.classList.add('hidden'); return; }
    const bg = BUG_BY_ID[s.sp], st = stage(s), sim = S(s);
    const status = s.molting > 0 ? (s.molting > 16 ? 'Está cambiando la mitad de atrás de su piel 👕' : 'Ahora cambia la mitad de adelante 👕') :
      s.curl > 0 ? (s.sp === 'chanchito' ? 'Se hizo bolita para protegerse ⚽' : 'Se quedó quietito del susto 😱') : s.smell > 0 ? 'Soltó su olor fuerte 💨' : s.hid ? 'Descansa bajo la corteza 💤' : s.preg > 0 ? 'Lleva huevitos en su marsupio 🎒' :
      s.mode === 'food' ? 'Va a comer ' + EAT_ICON[s.kind || sim.diet[0]] : s.mode === 'seek' ? 'Busca un lugar mejor de humedad 💧' : s.mode === 'hide' ? 'Busca dónde esconderse 🪵' : s.mode === 'group' ? 'Va con sus amigos 👨‍👩‍👧' : s.mode === 'lamp' ? 'Vuela hacia la luz 💡' : s.mode === 'perch' ? 'Descansa en una ramita 🌿' : s.mode === 'rest' ? 'Reposa 😴' : s.mode === 'flee' ? '¡Huye! 😰' : 'Paseando 🐾';
    const bar = (v, c) => '<div class="bar"><i style="width:' + clamp(v, 0, 100) + '%;background:' + c + '"></i></div>';
    el.innerHTML = '<h3><span><img src="' + Art.icon(s.sp, 32) + '" alt="" style="width:26px;height:26px;vertical-align:middle"> ' + s.name + ' <small>(' + bg.n + (s.sp === 'chanchito' ? ', ' + (st === 'manca' ? 'bebé manca' : st) + ', ' + (s.sex === 'F' ? 'hembra' : 'macho') : '') + ')</small></span><button class="round" id="infoX" style="width:34px;height:34px;font-size:16px">✕</button></h3>' +
      '<div class="bars"><div>💧 ' + bar(s.hyd, '#35b7ff') + '</div><div>' + EAT_ICON[sim.diet[0]] + ' ' + bar(s.food, '#4f9d3a') + '</div>' + (s.sp === 'chanchito' ? '<div>🦴 ' + bar(s.cal, '#e8e0c8') + '</div>' : '<div>🌡 ' + bar(100 - Math.abs(T.temp - (sim.tmin + sim.tmax) / 2) * 5, '#ff9a2e') + '</div>') + '<div>❤️ ' + bar(s.hp, '#e5483b') + '</div></div>' +
      '<p>' + status + '<br><i>' + bg.sci + '</i> · come: ' + bg.eats + '</p><div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap"><button class="chip" id="infoFicha">📖 Ficha</button><button class="chip" id="infoFree">🌳 Dejar libre</button><button class="chip" id="infoSay">🔊 Leer</button></div>';
    el.classList.remove('hidden');
    $('#infoX').onclick = () => { sel = null; el.classList.add('hidden'); };
    $('#infoFicha').onclick = () => show('enc');
    $('#infoFree').onclick = () => { if (!sel) return; T.bugs = T.bugs.filter(i => i !== sel); say(sel.name + ' volvió al jardín 🌳. Solo se deben liberar bichos que ya vivan en tu zona.', '🌳'); sel = null; el.classList.add('hidden'); serialize(); };
    $('#infoSay').onclick = () => speak(s.name + ', ' + bg.n + '. ' + status + '. Tiene ' + Math.round(s.hyd) + ' de agua y ' + Math.round(s.food) + ' de comida.');
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
    const dt = dtR * speed, steps = Math.max(1, Math.ceil(dt / 0.05)), sd = dt / steps;
    for (let i = 0; i < steps; i++) { stepEnv(sd, false); stepVitals(sd, false); stepMove(sd); }
    for (const p of parts) { p.life -= dtR; if (p.t === 'drop') p.y += p.vy * dtR; }
    parts = parts.filter(p => p.life > 0);
    draw();
    advT -= dtR; if (advT <= 0) { advT = 1; hud(); advice(); }
    infoT -= dtR; if (infoT <= 0) { infoT = 0.4; if (sel) { if (!T.bugs.includes(sel)) { sel = null; $('#info').classList.add('hidden'); } else if (!spraying) showInfo(); } }
    regen += dtR;
    if (regen >= 15) { regen -= 15; regenN++; const inv = G.save.inv; let c = false;
      if (regenN % 3 === 0 && inv.hoja < 6) { inv.hoja++; c = true; }
      if (regenN % 6 === 0 && inv.verdura < 3) { inv.verdura++; c = true; }
      if (regenN % 8 === 0 && inv.calcio < 3) { inv.calcio++; c = true; }
      if (c) toolsUI(); }
    saveT += dtR; if (saveT > 12) { saveT = 0; serialize(); }
    raf = requestAnimationFrame(loop);
  }
  function start() {
    ensure();
    cv = $('#tc'); cx = cv.getContext('2d');
    const away = G.save.lastSeen ? Math.min(600, (Date.now() - G.save.lastSeen) / 1000) : 0;
    if (away > 30 && T.bugs.length) { for (let t = 0; t < away; t += 5) { stepEnv(5, true); stepVitals(5, true); } if (away > 120) say('Mientras no estabas, tus bichos se cuidaron solos un ratito 🐞', '🏡'); }
    tool = bagTotal() > 0 && !T.bugs.length ? 'b:' + Object.keys(G.save.bichos).find(k => G.save.bichos[k] > 0) : 'look'; sel = null; speed = 1; parts = []; $('#info').classList.add('hidden');
    resize(); ro = new ResizeObserver(resize); ro.observe($('#twrap'));
    toolsUI(); hud(); advice();
    running = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); serialize(); }
  function reset() { if (T) serialize(); T = null; sel = null; parts = []; running = false; cancelAnimationFrame(raf); }
  function discard() { T = null; sel = null; parts = []; running = false; cancelAnimationFrame(raf); }
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
  return { init, start, stop, reset, discard, get T() { return T; }, step(dt) { ensure(); stepEnv(dt, false); stepVitals(dt, false); stepMove(dt); }, ensure, capacity, place: placeBug };
})();
