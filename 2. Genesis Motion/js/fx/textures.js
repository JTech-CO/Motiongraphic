/* Global textures: passing light streaks (dark scenes), film grain, stamp ink mask.
   All seeded and driven by t — no timers, no Math.random. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  // Streak drift (px/s) per scene. Dark scenes only; the others cover this canvas with opaque backgrounds.
  const DRIFT = [-760, 0, 0, -170, 0, 0, 0, -90, 0, 0, 0, -260];
  const N = 46;

  let ctx = null;
  let grainEl = null;
  const streaks = [];

  function offset(t) {
    let o = 0;
    T.SLOTS.forEach((slot, i) => {
      if (!DRIFT[i]) return;
      o += DRIFT[i] * (U.clamp(t, slot.start, slot.end) - slot.start);
    });
    return o;
  }

  function noiseDataURL(size, seed, fn) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    const r = U.rng(seed);
    for (let i = 0; i < size * size; i++) fn(img.data, i * 4, r);
    g.putImageData(img, 0, 0);
    return { canvas: c, g, url: () => c.toDataURL('image/png') };
  }

  SX.fx = {
    build(stage) {
      ctx = stage.querySelector('#streaks').getContext('2d');
      const r = U.rng(2015);
      for (let i = 0; i < N; i++) {
        const depth = r();
        streaks.push({
          x: r() * (T.W + 400),
          y: 120 + r() * (T.H - 240),
          len: 60 + depth * 320,
          w: depth > 0.8 ? 2 : 1,
          a: 0.06 + depth * 0.22,
          k: 0.35 + depth * 1.3,
        });
      }

      const grain = noiseDataURL(256, 1409, (d, o, rnd) => {
        const v = Math.floor(rnd() * 255);
        d[o] = d[o + 1] = d[o + 2] = v;
        d[o + 3] = 255;
      });
      grainEl = stage.querySelector('#grain');
      grainEl.style.backgroundImage = `url(${grain.url()})`;

      const mask = noiseDataURL(220, 928, (d, o, rnd) => {
        const v = rnd();
        d[o] = d[o + 1] = d[o + 2] = 0;
        d[o + 3] = v < 0.07 ? 0 : v < 0.16 ? 150 : 255;
      });
      const mr = U.rng(77);
      mask.g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 16; i++) {
        mask.g.fillStyle = `rgba(0,0,0,${0.25 + mr() * 0.45})`;
        mask.g.beginPath();
        mask.g.arc(mr() * 220, mr() * 220, 3 + mr() * 11, 0, Math.PI * 2);
        mask.g.fill();
      }
      document.documentElement.style.setProperty('--stamp-mask', `url(${mask.url()})`);
    },

    update(t) {
      const o = offset(t);
      ctx.clearRect(0, 0, T.W, T.H);
      ctx.fillStyle = SX.C.paper;
      const span = T.W + 400;
      for (const s of streaks) {
        const x = U.mod(s.x + o * s.k, span) - 400;
        ctx.globalAlpha = s.a;
        ctx.fillRect(x, s.y, s.len, s.w);
      }
      ctx.globalAlpha = 1;

      const f = Math.round(t * T.FPS);
      grainEl.style.backgroundPosition = `${Math.floor(U.hash(f, 3) * 256)}px ${Math.floor(U.hash(f, 9) * 256)}px`;
    },
  };
})((window.SX = window.SX || {}));
