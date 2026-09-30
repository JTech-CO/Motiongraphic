/* Global textures: horizontal speed streaks (visible behind the transparent night scenes) and film grain.
   All seeded and driven by t — no timers, no Math.random. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  // Streak drift (px/s) per scene. Only scene 08 (action / speed) streaks; the others keep the canvas still.
  const DRIFT = [0, 0, 0, 0, 0, 0, 0, -2800, 0, 0, 0, 0];
  const SHOW = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
  const N = 70;

  let ctx = null;
  let grainEl = null;
  const streaks = [];

  function offset(t) {
    let o = 0;
    T.SLOTS.forEach((slot, i) => {
      if (!DRIFT[i]) return;
      o += DRIFT[i] * (U.clamp(t, slot.start - 0.2, slot.end) - (slot.start - 0.2));
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
      const r = U.rng(2006);
      for (let i = 0; i < N; i++) {
        const depth = r();
        streaks.push({
          x: r() * (T.W + 800),
          y: 90 + r() * (T.H - 180),
          len: 120 + depth * 620,
          w: depth > 0.82 ? 3 : depth > 0.5 ? 2 : 1,
          a: 0.05 + depth * 0.3,
          k: 0.3 + depth * 1.4,
        });
      }
      const grain = noiseDataURL(256, 1409, (d, o, rnd) => {
        const v = Math.floor(rnd() * 255);
        d[o] = d[o + 1] = d[o + 2] = v;
        d[o + 3] = 255;
      });
      grainEl = stage.querySelector('#grain');
      grainEl.style.backgroundImage = `url(${grain.url()})`;
    },

    update(t) {
      ctx.clearRect(0, 0, T.W, T.H);
      const i = T.sceneIndexAt(t);
      if (SHOW[i] || (SHOW[i + 1] && t > T.SLOTS[i].end - 0.2)) {
        const o = offset(t);
        ctx.fillStyle = SX.C.mist;
        const span = T.W + 800;
        for (const s of streaks) {
          const x = U.mod(s.x + o * s.k, span) - 800;
          ctx.globalAlpha = s.a;
          ctx.fillRect(x, s.y, s.len, s.w);
        }
        ctx.globalAlpha = 1;
      }
      const f = Math.round(t * T.FPS);
      grainEl.style.backgroundPosition = `${Math.floor(U.hash(f, 3) * 256)}px ${Math.floor(U.hash(f, 9) * 256)}px`;
    },
  };
})((window.SX = window.SX || {}));
