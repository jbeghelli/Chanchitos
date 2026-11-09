'use strict';
(function boot() {
  G.all = loadAll();
  G.muted = !!G.all.muted;
  G.save = G.all.kids.find(k => k.id === G.all.cur) || null;   // se elige quién juega en la primera pantalla
  G.save = null; loadFaceImg();
  $('#bNewKid').onclick = () => { audio(); newKid(); };
  $('#bOpts').onclick = openOpts;
  $('#bOptClose').onclick = () => $('#optOv').classList.add('hidden');
  $('#bResetAll').onclick = () => confirmBox('¿Borrar <b>TODO</b>? Se pierden todos los niños, sus fotos, mochilas, terrarios y progreso. No se puede deshacer.', 'SÍ, BORRAR TODO', () => { resetAll(); $('#optOv').classList.add('hidden'); openWho(); });
  $('#hello').onclick = () => show('who');
  $('#bRun').onclick = () => { audio(); openLevels(); };
  $('#lvClose').onclick = () => $('#lvOv').classList.add('hidden');
  $('#bTerr').onclick = () => { audio(); show('terr'); };
  $('#bFace').onclick = () => show('face');
  $('#bEnc').onclick = () => show('enc');
  $('#eBack').onclick = () => show('menu');
  $('#bMute').onclick = () => { G.muted = !G.muted; persist(); if (G.muted && window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {} else audio(); refreshMenu(); };
  // niño que respira en el menú
  const mk = $('#menukid'), mx = mk.getContext('2d');
  function menuLoop(t) {
    if (current === 'menu') {
      const r = mk.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      if (mk.width !== (r.width * d | 0)) { mk.width = r.width * d; mk.height = r.height * d; }
      mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, mk.width, mk.height);
      const s = Math.min(mk.width / 120, mk.height / 130);
      mx.setTransform(1, 0, 0, 1, 0, 0);
      mx.translate(mk.width * 0.42, mk.height * 0.97); mx.scale(s * 1.05, s * 1.05);
      drawKid(mx, 0, 0, t / 1000, { state: 'idle', faceImg: G.faceImg, jar: 3, power: Math.sin(t / 700) > 0.7 });
      // flores de copihue
      Art.copihue(mx, 50, -14, 1.4, t / 500); Art.copihue(mx, 74, -10, 1.1, t / 400 + 1);
    }
    requestAnimationFrame(menuLoop);
  }
  requestAnimationFrame(menuLoop);
  for (const f of [initFaceUI, () => Runner.init(), () => Terr.init()]) { try { f(); } catch (e) { console.error(e); } }
  show('who');
  // aviso de primera vez
  window.G = G; window.Terr = Terr; window.Runner = Runner;
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
