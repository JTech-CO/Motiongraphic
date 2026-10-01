/* 05 FEATURE — "여섯 빛깔로 / 물들어,"
   Mint background. A wheel split into six 60° sectors; each sector renders the same quasicrystal preset in one of
   the six palettes, sectors growing out on 16ths (4 in b1, 2 in b2) while the 18 colour chips line up on the left;
   6 PALETTES · 18 COLORS (b3); uHue runs 0 → 1 so every sector cycles its colours once and comes back (b4).
   Exit: polar unwrap onto the slider track of scene 06. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const W0 = { cx: 1300, cy: 560, r: 380 };
  SX.L.wheel = W0;
  const IN = [0, 1, 2, 3, 4, 5].map((k) => (k < 4 ? k * T.E16 : 0.5 + (k - 4) * T.E16));
  const SEC = (k) => [-Math.PI / 2 + (k * Math.PI) / 3, -Math.PI / 2 + ((k + 1) * Math.PI) / 3];
  const hueAt = (lt) => E.inOutSine(U.prog(lt, 1.5, 2.0));

  SX.defineScene({
    id: 5,
    role: 'FEATURE',
    bg: 'mint',

    build(cam) {
      const st = {};
      st.total = ui.chip(cam, 124, 880, `${D.palettes.length} PALETTES · COLORS`, String(D.palettes.length * 3));
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `PALETTES / ${D.palettes.length} × 3` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['여섯 빛깔로', '물들어,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.total, lt, 1.0, { from: 0.5 });
    },

    draw(G, st, lt) {
      const hue = hueAt(lt);
      D.palettes.forEach((p, k) => {
        const r = W0.r * E.outCubic(U.prog(lt, IN[k], IN[k] + 0.28));
        if (r <= 1) return;
        G.pattern('quasicrystal', {
          offset: [-(W0.cx - 960) / 540, -(540 - W0.cy) / 540],
          colors: p.colors,
          hue,
          loop: 4,
          circle: [W0.cx, W0.cy, r, 1.5],
          sector: SEC(k),
        });
      });

      G.ink((ctx) => {
        const I = SX.ink;
        const col = { color: C.ink, w: 1.5, alpha: 0.75 };
        I.circle(ctx, W0.cx, W0.cy, W0.r + 18, E.outCubic(U.prog(lt, 0, 0.45)), col);
        for (let a = 0; a < 60; a++) {
          const th = (a / 60) * Math.PI * 2;
          const l = a % 10 === 0 ? 16 : 7;
          if (a / 60 > E.outCubic(U.prog(lt, 0, 0.45))) break;
          I.line(ctx, W0.cx + Math.cos(th) * (W0.r + 18), W0.cy + Math.sin(th) * (W0.r + 18), W0.cx + Math.cos(th) * (W0.r + 18 + l), W0.cy + Math.sin(th) * (W0.r + 18 + l), 1, { color: C.ink, w: 1.2, alpha: 0.6 });
        }
        D.palettes.forEach((p, k) => {
          const [a0, a1] = SEC(k);
          const g = E.outCubic(U.prog(lt, IN[k], IN[k] + 0.25));
          I.line(ctx, W0.cx, W0.cy, W0.cx + Math.cos(a0) * (W0.r + 46), W0.cy + Math.sin(a0) * (W0.r + 46), g, col);
          const am = (a0 + a1) / 2;
          const lx = W0.cx + Math.cos(am) * (W0.r + 70);
          const ly = W0.cy + Math.sin(am) * (W0.r + 70) + 5;
          if (g > 0.3) I.text(ctx, p.key, lx, ly, { color: C.ink, size: 15, align: Math.cos(am) > 0.2 ? 'left' : Math.cos(am) < -0.2 ? 'right' : 'center', alpha: U.clamp((g - 0.3) * 3) });

          // chips: name + three swatches, one row per palette
          const cy = 548 + k * 50;
          const ca = U.clamp((lt - IN[k]) * 6);
          if (ca > 0) {
            I.text(ctx, p.key, 124, cy + 22, { color: C.ink, size: 15, alpha: ca });
            p.colors.forEach((c, j) => I.box(ctx, 270 + j * 46, cy, 38, 30, 3, c, { stroke: C.ink, w: 1.5, alpha: ca }));
          }
        });
        if (lt > 1.45) {
          const a = U.clamp((lt - 1.45) * 8);
          I.text(ctx, `uHue ${hueAt(lt).toFixed(2)}`, W0.cx + W0.r + 40, W0.cy + W0.r - 10, { color: C.ink, size: 18, weight: 700, alpha: a });
          I.line(ctx, W0.cx + W0.r + 40, W0.cy + W0.r + 6, W0.cx + W0.r + 40 + 160 * hueAt(lt), W0.cy + W0.r + 6, 1, { color: C.ink, w: 3, alpha: a });
        }
      });
    },
  });
})((window.SX = window.SX || {}));
