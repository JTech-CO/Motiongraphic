/* Film grain over the whole stage. Seeded noise tile, offset per frame from t (no timers, no Math.random). */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  let grainEl = null;

  SX.fx = {
    build(stage) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      const img = g.createImageData(256, 256);
      const r = U.rng(1409);
      for (let i = 0; i < 256 * 256; i++) {
        const v = Math.floor(r() * 255);
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grainEl = stage.querySelector('#grain');
      grainEl.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
    },

    update(t) {
      const f = Math.round(t * T.FPS);
      grainEl.style.backgroundPosition = `${Math.floor(U.hash(f, 3) * 256)}px ${Math.floor(U.hash(f, 9) * 256)}px`;
    },
  };
})((window.SX = window.SX || {}));
