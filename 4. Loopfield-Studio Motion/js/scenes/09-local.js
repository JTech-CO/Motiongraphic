/* 09 FEATURE — "계정도 업로드도 없이 / 내 기기 안에서,"
   Peach. A laptop drawn as construction line art; its screen runs the Cellular glass preset (b1). Inside the device the
   pipeline LAYERS → WEBGL 2 → WEBCODECS · H.264 → MP4 links up on 16ths (b2). Outside, the account, backend, upload
   and tracking icons have their connections cut and read 0 (b3). b4: the native on-device encode sample with its
   conditions. Exit: Voronoi shatter. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const N = D.nativeEncode;

  const S = [940, 470, 640, 360];
  const BEZ = [924, 454, 672, 392];
  const ICONS = [[230, 600], [460, 600], [230, 760], [460, 760]];
  const CHIP = { x: 962, y: 626, w: 140, h: 38, gap: 12 };

  function icon(ctx, k, x, y, a) {
    const I = SX.ink;
    const o = { color: C.ink, w: 2.5, alpha: a };
    ctx.setLineDash([]);
    if (k === 0) {
      I.circle(ctx, x, y - 12, 13, 1, o);
      ctx.beginPath();
      ctx.arc(x, y + 30, 26, Math.PI, Math.PI * 2);
      ctx.stroke();
    } else if (k === 1) {
      [-22, -2, 18].forEach((dy) => {
        I.box(ctx, x - 30, y + dy - 8, 60, 16, 3, null, { stroke: C.ink, w: 2.5, alpha: a });
        ctx.fillStyle = C.ink;
        ctx.fillRect(x + 18, y + dy - 2, 5, 4);
      });
    } else if (k === 2) {
      ctx.beginPath();
      ctx.arc(x - 14, y + 4, 14, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x + 2, y - 8, 18, Math.PI, Math.PI * 1.95);
      ctx.arc(x + 20, y + 6, 12, Math.PI * 1.4, Math.PI * 0.5);
      ctx.closePath();
      ctx.stroke();
      I.line(ctx, x, y + 14, x, y - 6, 1, o);
      I.line(ctx, x - 7, y + 1, x, y - 6, 1, o);
      I.line(ctx, x + 7, y + 1, x, y - 6, 1, o);
    } else {
      I.circle(ctx, x, y, 22, 1, o);
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => I.line(ctx, x + dx * 14, y + dy * 14, x + dx * 30, y + dy * 30, 1, o));
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
    }
  }

  SX.defineScene({
    id: 9,
    role: 'FEATURE',
    bg: 'peach',

    build(cam) {
      const st = {};
      st.encode = ui.chip(cam, 124, 912, `ON-DEVICE ENCODE · ${N.size} · ${N.fps} FPS · ${N.frames} FRAMES`, N.mb);
      st.encode2 = U.box(124, 970, 'mono sm', `WEBCODECS · ${N.codec} · ${N.seconds} S · ${N.date}`);
      cam.appendChild(st.encode2);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'LOCAL-FIRST / NO ACCOUNT · NO UPLOAD' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 104, lines: ['계정도 업로드도 없이', '내 기기 안에서,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.encode, lt, 1.5, { from: 0.5 });
      st.encode2.style.opacity = U.clamp((lt - 1.6) * 6).toFixed(3);
    },

    draw(G, st, lt) {
      const on = E.outCubic(U.prog(lt, 0.1, 0.4));
      if (on > 0) {
        const h = S[3] * on;
        const r = [S[0], S[1] + (S[3] - h) / 2, S[2], h];
        G.pattern('voronoi', { rect: S, clip: r, loop: 4 });
      }

      G.ink((ctx) => {
        const I = SX.ink;
        const dr = E.outCubic(U.prog(lt, 0, 0.35));
        const o = { color: C.ink, w: 3, alpha: 1 };
        ctx.lineJoin = 'round';
        I.rect(ctx, BEZ[0], BEZ[1], BEZ[2], BEZ[3], dr, o);
        I.rect(ctx, S[0], S[1], S[2], S[3], dr, { color: C.ink, w: 1.5, alpha: 0.8 });
        const by = BEZ[1] + BEZ[3];
        I.line(ctx, BEZ[0] - 40, by + 14, BEZ[0] + BEZ[2] + 40, by + 14, dr, o);
        I.line(ctx, BEZ[0] - 40, by + 14, BEZ[0] - 70, by + 44, dr, o);
        I.line(ctx, BEZ[0] + BEZ[2] + 40, by + 14, BEZ[0] + BEZ[2] + 70, by + 44, dr, o);
        I.line(ctx, BEZ[0] - 70, by + 44, BEZ[0] + BEZ[2] + 70, by + 44, dr, o);
        I.marks(ctx, BEZ[0] - 20, BEZ[1] - 20, BEZ[2] + 40, BEZ[3] + 104, 18, { color: C.ink, w: 1.5, alpha: 0.6 * dr });

        // b2: the pipeline inside the device
        const band = U.clamp((lt - 0.45) * 8);
        if (band > 0) {
          I.box(ctx, S[0], CHIP.y - 34, S[2], CHIP.h + 68, 0, C.night, { alpha: 0.72 * band });
          I.text(ctx, 'ON THIS DEVICE', S[0] + 16, CHIP.y - 12, { color: C.paper, size: 12, alpha: band });
        }
        D.pipeline.forEach((name, i) => {
          const t0 = 0.5 + i * T.E16;
          const a = U.clamp((lt - t0) * 8);
          if (a <= 0) return;
          const x = CHIP.x + i * (CHIP.w + CHIP.gap);
          I.box(ctx, x, CHIP.y, CHIP.w, CHIP.h, 4, i === 3 ? C.peach : C.paper, { alpha: a });
          I.text(ctx, name, x + CHIP.w / 2, CHIP.y + 24, { color: C.ink, size: 11, weight: 700, align: 'center', alpha: a, track: 1 });
          if (i < 3) {
            const ap = E.outCubic(U.prog(lt, t0 + 0.04, t0 + T.E16));
            I.line(ctx, x + CHIP.w + 2, CHIP.y + CHIP.h / 2, x + CHIP.w + CHIP.gap - 2, CHIP.y + CHIP.h / 2, ap, { color: C.paper, w: 2.5, alpha: a });
          }
        });

        // outside the device: what is not there
        D.zeros.forEach((name, k) => {
          const [x, y] = ICONS[k];
          const a = U.clamp((lt - 0.15 - k * 0.04) * 6);
          icon(ctx, k, x, y, a);
          I.text(ctx, name, x, y + 62, { color: C.ink, size: 13, align: 'center', alpha: a });
          const cut = E.outCubic(U.prog(lt, 1.0 - T.LEAD + k * 0.03, 1.1 + k * 0.03));
          if (cut > 0) {
            I.line(ctx, x - 40, y + 40, x + 40, y - 40, cut, { color: C.ink, w: 3, alpha: 1 });
            I.text(ctx, '0', x + 70, y + 24, { color: C.ink, size: 52, weight: 900, font: SX.ink.DISPLAY, track: 0, alpha: cut });
          }
        });
      });
    },
  });
})((window.SX = window.SX || {}));
