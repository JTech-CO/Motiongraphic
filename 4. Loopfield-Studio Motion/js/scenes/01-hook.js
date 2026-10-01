/* 01 HOOK — "수식 한 줄이 / 끝없이 피어나,"
   The Mandelbrot preset on construction lines of the complex plane (Re, Im, |c| = 2). The iteration count doubles
   on every 16th (1 → 128, b1–b2) so the set grows out of the formula, lands on the preset default uIterations 160
   (b3), then the zoom breath starts (b4). Exit: fractal zoom ×64 (the uZoom maximum) into the cardioid. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const LEAD = T.frames(5);

  const BASE = 1.3; // preset: c = p · 1.3 · exp(uBreath · cos uAngle) + (−0.55, 0.02)
  const CTR = [-0.55, 0.02];
  const PZ = SX.presets.byId('mandelbrot').zoom; // preset zoom 1.05
  const SHIFT = 0.55; // set centre sits 0.55 frame-heights right of the stage centre
  const TARGET = [-0.15, 0.0]; // zoom target inside the main cardioid (ends black)

  /** Camera for time lt: zoom, offset, breath scale; plus c → stage px mapping for the construction lines */
  function view(lt) {
    const breath = 0.28 * E.inOutSine(U.prog(lt, 1.5, 1.8)); // uBreath 0 → default 0.28 on b4
    const loop = 4;
    const ang = ((SX.gl.time / loop) % 1) * Math.PI * 2;
    const scale = BASE * Math.exp(breath * Math.cos(ang));
    const ex = E.inQuad(U.prog(lt, 2 - LEAD, 2)); // exit zoom
    const zm = Math.pow(D.zoomMax, ex);
    const zt = zm * PZ;
    // keep the target where it is, then drift it to the stage centre while zooming
    const s0 = [((TARGET[0] - CTR[0]) / scale - -SHIFT / PZ) * PZ, ((TARGET[1] - CTR[1]) / scale) * PZ];
    const s = [U.lerp(s0[0], 0, ex), U.lerp(s0[1], 0, ex)];
    const off = [(TARGET[0] - CTR[0]) / scale - s[0] / zt, (TARGET[1] - CTR[1]) / scale - s[1] / zt];
    const toPx = (c) => {
      const sx = ((c[0] - CTR[0]) / scale - off[0]) * zt;
      const sy = ((c[1] - CTR[1]) / scale - off[1]) * zt;
      return [960 + sx * 540, 540 - sy * 540];
    };
    return { breath, zm, off, scale, zt, toPx, loop };
  }
  SX.L.zoomTarget = [960 + 0.55 * 540, 540];

  SX.defineScene({
    id: 1,
    role: 'HOOK',
    bg: 'night',

    build(cam) {
      const st = {};
      st.iter = ui.tag(cam, 124, 600, 'uIterations · DEFAULT', String(D.mandelbrot.iterations));
      st.meta = ui.tag(cam, 124, 680, `MANDELBROT · FRACTAL · ${D.mandelbrot.chars} CHARS`);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'z ← z² + c / MANDELBROT' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['수식 한 줄이', '끝없이 피어나,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.iter, lt, 1.0, { from: 0.6 });
      ui.pop(st.meta, lt, 1.5, { from: 0.6 });
    },

    draw(G, st, lt) {
      const v = view(lt);
      const step = Math.floor(Math.max(0, lt) / T.E16);
      const iters = lt < 1.0 ? Math.pow(2, Math.min(7, step)) : D.mandelbrot.iterations;
      G.pattern('mandelbrot', {
        zoom: v.zm,
        offset: v.off,
        loop: v.loop,
        params: { uIterations: iters, uBreath: v.breath },
      });

      G.ink((ctx) => {
        const o = v.toPx([0, 0]);
        const k = 1 - U.clamp((lt - 1.75) * 6); // construction fades before the zoom
        const col = { color: C.paper, w: 1.4, alpha: 0.45 * k };
        ink(ctx, o, v, lt, col);
        // iteration steps: 8 cells filling on 16ths, the ninth (160) on b3
        for (let i = 0; i < 9; i++) {
          const on = i < 8 ? lt >= i * T.E16 : lt >= 1.0;
          const x = 124 + i * 22;
          SX.ink.box(ctx, x, 556, 14, 14, 2, on ? (i === 8 ? C.peach : C.paper) : null, { stroke: C.paper, alpha: 0.85 * U.clamp(lt * 8) });
        }
      });
    },
  });

  function ink(ctx, o, v, lt, col) {
    const I = SX.ink;
    const a1 = E.outCubic(U.prog(lt, 0, 0.3));
    I.line(ctx, o[0], o[1], o[0] + 1100, o[1], a1, col);
    I.line(ctx, o[0], o[1], o[0] - 1500, o[1], a1, col);
    I.line(ctx, o[0], o[1], o[0], o[1] - 700, a1, col);
    I.line(ctx, o[0], o[1], o[0], o[1] + 700, a1, col);
    const r2 = v.toPx([2, 0])[0] - o[0];
    I.circle(ctx, o[0], o[1], r2, E.outCubic(U.prog(lt, 0.1, 0.5)), Object.assign({ dash: [6, 8] }, col));
    I.circle(ctx, o[0], o[1], r2 / 2, E.outCubic(U.prog(lt, 0.2, 0.55)), col);
    const lab = { color: C.paper, size: 15, alpha: col.alpha * 1.6 };
    if (lt > 0.25) {
      I.text(ctx, 'Re', o[0] + 520, o[1] - 12, lab);
      I.text(ctx, 'Im', o[0] + 12, o[1] - 330, lab);
    }
  }
})((window.SX = window.SX || {}));
