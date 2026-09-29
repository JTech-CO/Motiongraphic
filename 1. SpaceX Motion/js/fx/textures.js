/* Global textures: parallax star field (dark scenes), film grain, stamp ink mask.
   All seeded and driven by t — no timers, no Math.random. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  // Base star drift (px/s) per scene. Dark scenes only; others are covered by opaque backgrounds.
  const DRIFT = [[-46, 0], null, null, [0, -95], null, null, null, [-14, 0], null, null, null, [0, 30]];
  const LAYERS = [
    { n: 150, size: 1.1, alpha: 0.38, speed: 0.4 },
    { n: 70, size: 1.6, alpha: 0.62, speed: 1.0 },
    { n: 28, size: 2.3, alpha: 0.85, speed: 1.9 },
  ];

  let ctx = null;
  let grainEl = null;
  const stars = [];

  function driftOffset(t) {
    let ox = 0;
    let oy = 0;
    T.SLOTS.forEach((slot, i) => {
      const v = DRIFT[i];
      if (!v) return;
      const dt = U.clamp(t, slot.start, slot.end) - slot.start;
      ox += v[0] * dt;
      oy += v[1] * dt;
    });
    return [ox, oy];
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
      ctx = stage.querySelector('#starfield').getContext('2d');
      const r = U.rng(2002);
      LAYERS.forEach((L, li) => {
        for (let i = 0; i < L.n; i++) {
          stars.push({ x: r() * T.W, y: r() * T.H, s: L.size * (0.7 + r() * 0.6), a: L.alpha * (0.6 + r() * 0.4), k: L.speed, li });
        }
      });

      // Film grain tile
      const grain = noiseDataURL(256, 1409, (d, o, rnd) => {
        const v = Math.floor(rnd() * 255);
        d[o] = d[o + 1] = d[o + 2] = v;
        d[o + 3] = 255;
      });
      grainEl = stage.querySelector('#grain');
      grainEl.style.backgroundImage = `url(${grain.url()})`;

      // Stamp ink mask: mostly opaque with speckle voids and a few worn patches
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
      const [ox, oy] = driftOffset(t);
      ctx.clearRect(0, 0, T.W, T.H);
      ctx.fillStyle = SX.C.paper;
      for (const st of stars) {
        const x = U.mod(st.x + ox * st.k, T.W);
        const y = U.mod(st.y + oy * st.k, T.H);
        ctx.globalAlpha = st.a;
        ctx.fillRect(x, y, st.s, st.s);
      }
      ctx.globalAlpha = 1;

      const f = Math.round(t * T.FPS);
      grainEl.style.backgroundPosition = `${Math.floor(U.hash(f, 3) * 256)}px ${Math.floor(U.hash(f, 9) * 256)}px`;
    },
  };
})((window.SX = window.SX || {}));
