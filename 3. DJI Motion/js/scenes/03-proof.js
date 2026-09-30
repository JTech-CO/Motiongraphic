/* 03 PROOF — "이듬해 / 40만 대,"
   The sky fills with a Phantom formation in perspective (far rows small, near rows large):
   1 → 4 → 16 → 64 on 16th notes in b1, then 400 icons by b3 (1 icon ≈ 1,000 units) while 400,000 counts in.
   Revenue labels 2013 ~$131M (b1) and 2014 ~$0.5B (b4) are estimates.
   Exit: pitch down (transitions.js) — the formation folds flat into the map of scene 04. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;

  const ROWS = 16;
  const COLS = 25;
  const N = ROWS * COLS; // 400 = 400,000 ÷ 1,000

  function sprite() {
    const cv = document.createElement('canvas');
    cv.width = 300;
    cv.height = 170;
    const ctx = cv.getContext('2d');
    const polys = P.quadPolys(P.QUAD.phantom1, { x: 150, y: 150, s: 0.62, yaw: 22, pitch: 5 }, { rotor: 1 });
    ctx.lineJoin = 'round';
    polys.forEach((q) => {
      ctx.globalAlpha = q.op;
      ctx.fillStyle = q.fill;
      ctx.beginPath();
      q.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
      if (q.op >= 0.999) {
        ctx.strokeStyle = ui.tone(q.fill, -0.35);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    });
    return cv;
  }

  SX.defineScene({
    id: 3,
    role: 'PROOF',
    bg: 'sky',
    ruler: (lt) => ({ from: 2013, to: 2014, mark: SX.hud.hop(lt, [2013, 2013, 2014, 2014]) }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.clouds = SX.land.clouds(svg, { color: ui.tone(C.sky, 0.55), n: 7, y: 420, spread: 360, seed: 31, w: [220, 520], h: [30, 70], speed: 18, op: 0.85 });
      st.ridges = SX.land.ridges(svg, {
        color: C.sky,
        layers: [
          { y: 1010, amp: 120, seed: 31, k: -0.12, speed: 10 },
          { y: 1070, amp: 90, seed: 32, k: -0.24, speed: 22 },
        ],
      });
      cam.appendChild(svg);

      st.cv = U.h('canvas', { class: 'full', width: T.W, height: T.H });
      cam.appendChild(st.cv);
      st.ctx = st.cv.getContext('2d');
      st.img = sprite();

      // Formation slots (row 0 = far), appearance order grows outward from the centre
      const r = U.rng(314);
      st.slots = [];
      for (let row = 0; row < ROWS; row++) {
        const q = row / (ROWS - 1);
        const y = 250 + Math.pow(q, 1.25) * 660;
        const sc = 0.16 + q * 0.62;
        const width = 560 + q * 1060; // near rows stay right of the counter column
        for (let c = 0; c < COLS; c++) {
          const x = 1460 + (c - (COLS - 1) / 2) * (width / (COLS - 1)) + (r() - 0.5) * 10;
          const dist = Math.hypot((c - 12) / 12, (row - 8) / 8) + r() * 0.35;
          st.slots.push({ x, y: y + (r() - 0.5) * 8, sc, dist, ph: r() * 6.28 });
        }
      }
      const order = st.slots.map((s, i) => i).sort((a, b) => st.slots[a].dist - st.slots[b].dist);
      order.forEach((idx, k) => (st.slots[idx].rank = k));
      st.draw = st.slots.slice().sort((a, b) => a.y - b.y); // far → near

      st.count = ui.counter(cam, { x: 120, y: 520, size: 150 });
      st.countLbl = U.box(124, 686, 'mono', `UNITS · 2014 · MOSTLY PHANTOM`);
      cam.appendChild(st.countLbl);
      st.icon = ui.tag(cam, 1180, 178, '1 ICON ≈ 1,000 UNITS');
      st.rev13 = ui.tag(cam, 124, 760, '2013 · EST.', D.rev2013);
      st.rev14 = ui.tag(cam, 124, 832, '2014 · EST.', D.rev2014);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'UNITS SOLD / 2014' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 128, lines: ['이듬해', '40만 대,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      const arrive = ui.settle(lt, 0.35);
      const dy = -arrive * 160;
      st.clouds.update(lt + 4, dy * 0.5);
      st.ridges.update(lt + 4, 0, dy);

      // How many drones are in the sky: 16ths in b1, then fill to 400 by b3
      let n;
      if (lt < 0.5) n = [1, 4, 16, 64][U.clamp(Math.floor(lt / T.E16), 0, 3)];
      else n = Math.round(U.lerp(64, N, E.outCubic(U.prog(lt, 0.5, 1.0))));
      st.count.set(U.fmtInt(n * D.iconUnits));

      const ctx = st.ctx;
      ctx.clearRect(0, 0, T.W, T.H);
      const glide = -38 * lt;
      const iw = st.img.width;
      const ih = st.img.height;
      for (const s of st.draw) {
        if (s.rank >= n) continue;
        const born = s.rank < 64 ? [0, 1, 4, 16].findIndex((v, i) => s.rank < [1, 4, 16, 64][i]) * T.E16 : U.lerp(0.5, 1.0, (s.rank - 64) / (N - 64));
        const pop = E.outBack(U.clamp((lt - born) / 0.12), 2);
        const k = s.sc * pop;
        if (k <= 0.01) continue;
        const x = s.x + glide * (0.4 + s.sc);
        const y = s.y + dy * (0.3 + s.sc) + Math.sin(lt * 5 + s.ph) * 3 * s.sc;
        ctx.drawImage(st.img, x - (iw * k) / 2, y - ih * 0.88 * k, iw * k, ih * k);
      }

      ui.pop(st.icon, lt, 0.5, { from: 0.6 });
      ui.pop(st.rev13, lt, 0.05, { from: 0.6 });
      ui.pop(st.rev14, lt, 1.5, { from: 0.6 });
      const ce = ui.enter(lt, 0.02, 0.4);
      st.count.el.style.opacity = ce.o.toFixed(3);
      st.countLbl.style.opacity = U.clamp((lt - 0.2) * 5).toFixed(3);
      const pb = lt >= 1.0 ? U.pulse(lt - 1.0, 10, 0.14) : 0;
      st.count.el.style.transform = `scale(${(1 + 0.05 * pb).toFixed(4)})`;
    },
  });
})((window.SX = window.SX || {}));
