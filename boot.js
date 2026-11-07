'use strict';
(function boot() {
  G.save = loadSave();
  G.muted = !!G.save.muted;
  if (G.save.faceURL) { const im = new Image(); im.onload = () => { G.faceImg = im; }; im.src = G.save.faceURL; }
  initFaceUI(); Runner.init(); Terr.init();
  $('#bRun').onclick = () => { audio(); show('runner'); };
  $('#bTerr').onclick = () => { audio(); show('terr'); };
  $('#bFace').onclick = () => show('face');
  $('#bEnc').onclick = () => show('enc');
  $('#eBack').onclick = () => show('menu');
  $('#bMute').onclick = () => { G.muted = !G.muted; G.save.muted = G.muted; persist(); if (G.muted && window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {} else audio(); refreshMenu(); };
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
      // chanchitos en bolita
      drawBall(mx, 46, -9, 9, t / 400); drawBall(mx, 66, -9, 9, t / 300 + 1);
    }
    requestAnimationFrame(menuLoop);
  }
  requestAnimationFrame(menuLoop);
  show('menu');
  // aviso de primera vez
  if (!G.save.faceURL) $('#bFace').style.animation = 'pulse 1.3s ease-in-out infinite';
  window.G = G; window.Terr = Terr; window.Runner = Runner;
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
