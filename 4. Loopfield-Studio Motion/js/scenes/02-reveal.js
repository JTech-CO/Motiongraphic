/* 02 REVEAL — "겹겹의 빛이 / 무늬가 되고,"
   From the black left by the fractal zoom, the default preset Prism Bloom opens outward from its centre over
   seven symmetry axes and construction circles (uPetals 7 → 7-FOLD) (b1); preset label and aurora palette (b2);
   its three sliders at their defaults (b3); 473 CHARS · 3 SLIDERS (b4). Exit: kaleido fold into the contact sheet. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = D.prism;

  const CX = 1250;
  const CY = 540;
  SX.L.prism = { cx: CX, cy: CY };

  SX.defineScene({
    id: 2,
    role: 'REVEAL',
    bg: 'night',

    build(cam) {
      const st = {};
      st.tag = ui.tag(cam, 124, 560, 'DEFAULT PRESET · GEOMETRY', 'PRISM BLOOM');
      st.meta = ui.chip(cam, 124, 860, `${P.sliders} SLIDERS · CHARS`, String(P.chars));
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'PRISM BLOOM / DEFAULT PRESET' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['겹겹의 빛이', '무늬가 되고,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.tag, lt, 0.5, { from: 0.6 });
      ui.pop(st.meta, lt, 1.5, { from: 0.5 });
    },

    draw(G, st, lt) {
      const R = 1500 * E.outCubic(U.prog(lt, 0, 0.6));
      G.pattern('prism', { offset: [-(CX - 960) / 540, -(540 - CY) / 540], circle: [CX, CY, R + 1, 60], loop: 4, ramp: [240, 1000, 0.32] });

      G.ink((ctx) => {
        const I = SX.ink;
        const n = P.petals[0];
        const rot = lt * 0.06;
        const col = { color: C.paper, w: 1.2, alpha: 0.32 };
        for (let k = 0; k < n; k++) {
          const a = rot + (k / n) * Math.PI * 2 - Math.PI / 2;
          const p = E.outCubic(U.prog(lt, k * 0.025, 0.35 + k * 0.025));
          I.line(ctx, CX, CY, CX + Math.cos(a) * 760, CY + Math.sin(a) * 760, p, col);
        }
        [140, 280, 420].forEach((r, i) => I.circle(ctx, CX, CY, r, E.outCubic(U.prog(lt, 0.1 + i * 0.06, 0.5 + i * 0.06)), Object.assign({ a0: rot - Math.PI / 2 }, col)));
        if (lt > 0.3) {
          const a = rot - Math.PI / 2;
          I.text(ctx, `${n}-FOLD`, CX + Math.cos(a) * 290 + 14, CY + Math.sin(a) * 290, { color: C.paper, size: 15, alpha: U.clamp((lt - 0.3) * 6) });
        }

        // b2: aurora palette swatch next to the preset tag
        const sw = U.clamp((lt - 0.55) * 6);
        if (sw > 0) {
          I.swatch(ctx, 124, 620, 150, 14, D.palettes[0].colors, { alpha: sw });
          I.text(ctx, D.palettes[0].key, 290, 633, { color: C.paper, size: 13, alpha: sw * 0.8 });
        }

        // b3: the preset's three sliders slide to their defaults
        const rows = [
          ['uPetals', P.petals],
          ['uBands', P.bands],
          ['uTwist', P.twist],
        ];
        rows.forEach(([name, [v, lo, hi]], i) => {
          const t0 = 1.0 + i * T.E16;
          const a = U.clamp((lt - t0 + 0.05) * 8);
          if (a <= 0) return;
          const k = E.outBack(U.prog(lt, t0, t0 + 0.3), 1.6);
          I.slider(ctx, 124, 712 + i * 50, 380, {
            label: `${name}  ${lo}–${hi}`, min: lo, max: hi, value: U.lerp(lo, v, k), shown: String(v),
            color: C.paper, accent: C.peach, bg: C.night, alpha: a,
          });
        });
      });
    },
  });
})((window.SX = window.SX || {}));
