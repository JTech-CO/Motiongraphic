/* 07 PROOF — "끝과 처음이 / 맞물린 루프는,"
   The Julia orbit preset: c travels a closed circle of radius 0.028 around −0.745 + 0.185i once per two beats, so the
   fractal breathes and returns to the same shape (b1, b2). On b3 the frame at phase 0 and the frame one full turn
   later are rendered side by side and differenced: black, MATCH. b4: the loop check with its conditions (4 samples,
   320×180, MAE ≤ 0.5/255, 32/32) marked as a sample check, not a proof. Exit: log-spiral twirl. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const J = D.julia;

  const CX = 1300;
  const CY = 540;
  SX.L.julia = { cx: CX, cy: CY };
  const LOOP = 1.0; // one orbit of c every two beats
  const WIN = [124, 384, 644].map((x) => [x, 640, 240, 135]);
  const DIAL = { x: 1660, y: 800, r: 104 };
  const INSET = { x: 1530, y: 120, w: 270, h: 170 };

  const julia = (o = {}) => Object.assign({ offset: [-(CX - 960) / 540, -(540 - CY) / 540], loop: LOOP, palette: 1 }, o);

  SX.defineScene({
    id: 7,
    role: 'PROOF',
    bg: 'night',

    build(cam) {
      const st = {};
      st.check = ui.chip(cam, 124, 860, `LOOP CHECK · ${D.loopCheck.samples} SAMPLES · ${D.loopCheck.size} · ${D.loopCheck.mae}`, D.loopCheck.match);
      st.note = U.box(124, 930, 'mono sm', 'SAMPLE CHECK, NOT A PROOF');
      cam.appendChild(st.note);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `JULIA ORBIT / PHASE 0 → ${D.loop.lastPhase}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['끝과 처음이', '맞물린 루프는,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.check, lt, 1.5, { from: 0.5 });
      st.note.style.opacity = (0.8 * U.clamp((lt - 1.6) * 6)).toFixed(3);
    },

    draw(G, st, lt) {
      G.pattern('julia', julia());

      // b3: phase 0 and phase 1 side by side, then their difference
      const wa = U.clamp((lt - (1.0 - T.LEAD)) * 7);
      if (wa > 0) {
        const t0 = Math.floor(SX.gl.time / LOOP) * LOOP;
        G.bind(G.target('P0', 480, 270));
        G.pattern('julia', julia({ t: t0 }));
        G.bind(G.target('P1', 480, 270));
        G.pattern('julia', julia({ t: t0 + LOOP }));
        G.difference(G.target('PD', 480, 270), G.target('P0'), G.target('P1'));
        G.bind(G.target(G.main));
        ['P0', 'P1', 'PD'].forEach((n, i) => {
          const a = U.clamp((lt - (1.0 - T.LEAD) - i * T.E16 * 0.5) * 7);
          const [x, y, w, h] = WIN[i];
          G.quad(G.target(n).tex, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], a);
        });
      }

      G.ink((ctx) => {
        const I = SX.ink;
        const ph = U.mod(SX.gl.time / LOOP, 1);

        // phase dial: 240 ticks (default 8 s × 30 fps), hand at the current phase
        const da = U.clamp(lt * 6);
        for (let k = 0; k < D.loop.frames; k++) {
          const a = (k / D.loop.frames) * Math.PI * 2 - Math.PI / 2;
          const l = k % 30 === 0 ? 14 : 5;
          if (k / D.loop.frames > E.outCubic(U.prog(lt, 0, 0.4))) break;
          I.line(ctx, DIAL.x + Math.cos(a) * DIAL.r, DIAL.y + Math.sin(a) * DIAL.r, DIAL.x + Math.cos(a) * (DIAL.r - l), DIAL.y + Math.sin(a) * (DIAL.r - l), 1, { color: C.paper, w: 1.2, alpha: 0.7 * da });
        }
        const ha = ph * Math.PI * 2 - Math.PI / 2;
        I.line(ctx, DIAL.x, DIAL.y, DIAL.x + Math.cos(ha) * (DIAL.r - 18), DIAL.y + Math.sin(ha) * (DIAL.r - 18), 1, { color: C.peach, w: 3, alpha: da });
        I.text(ctx, `PHASE 0 → ${D.loop.lastPhase} · N = ${D.loop.frames}`, DIAL.x + DIAL.r, DIAL.y + DIAL.r + 34, { color: C.paper, size: 14, align: 'right', alpha: da });

        // c-plane inset: the closed orbit of c, magnified
        const ia = U.clamp((lt - 0.15) * 6);
        I.box(ctx, INSET.x, INSET.y, INSET.w, INSET.h, 4, C.night, { stroke: C.paper, w: 1.2, alpha: 0.88 * ia });
        const ox = INSET.x + INSET.w / 2;
        const oy = INSET.y + 72;
        I.line(ctx, ox - 100, oy, ox + 100, oy, 1, { color: C.paper, w: 1, alpha: 0.3 * ia });
        I.line(ctx, ox, oy - 52, ox, oy + 52, 1, { color: C.paper, w: 1, alpha: 0.3 * ia });
        I.circle(ctx, ox, oy, 44, ia, { color: C.paper, w: 1.4, alpha: 0.7 * ia, a0: 0 });
        ctx.globalAlpha = ia;
        ctx.fillStyle = C.peach;
        ctx.beginPath();
        ctx.arc(ox + Math.cos(ph * Math.PI * 2) * 44, oy - Math.sin(ph * Math.PI * 2) * 44, 6, 0, Math.PI * 2);
        ctx.fill();
        I.text(ctx, `c = ${J.real} + ${J.imag}i`.replace('-', '−'), INSET.x + 14, INSET.y + INSET.h - 32, { color: C.paper, size: 13, alpha: ia, track: 1 });
        I.text(ctx, `ORBIT ${J.orbit}`, INSET.x + 14, INSET.y + INSET.h - 12, { color: C.paper, size: 13, alpha: ia, track: 1 });

        // b3 window labels
        if (wa > 0) {
          ['PHASE 0', 'PHASE 1', 'DIFFERENCE'].forEach((s, i) => {
            const [x, y, w] = WIN[i];
            I.text(ctx, s, x, y - 10, { color: C.paper, size: 13, alpha: wa });
            I.rect(ctx, x, y, w, 135, 1, { color: C.paper, w: 1, alpha: 0.6 * wa });
          });
          I.text(ctx, '=', WIN[2][0] - 15, WIN[2][1] + 75, { color: C.paper, size: 22, align: 'center', alpha: wa });
          I.text(ctx, '−', WIN[1][0] - 15, WIN[1][1] + 75, { color: C.paper, size: 22, align: 'center', alpha: wa });
          const ma = U.clamp((lt - 1.12) * 6);
          I.text(ctx, 'MATCH · NO DUPLICATE FRAME', WIN[2][0], WIN[2][1] + 135 + 26, { color: C.peach, size: 14, weight: 700, alpha: ma });
        }
      });
    },
  });
})((window.SX = window.SX || {}));
