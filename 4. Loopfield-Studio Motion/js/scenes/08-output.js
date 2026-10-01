/* 08 PROOF — "4K까지 / 그대로 뽑히고,"
   Violet. Output frames drawn to true scale (0.22 px per pixel) from a shared bottom-right corner: 1080p, then DCI 2K a
   16th later (b1), QHD (b2), UHD 3840×2160 (b3). The hexagonal-pulse preset fills the current frame as ink lines,
   its cell count growing with the frame width. b3 adds the landscape / portrait / square output matrix (10 outputs);
   b4 the time axis: 24 · 30 · 60 FPS · 2–60 S · MAX 3,600 FRAMES · 180 MBPS CAP. Exit: resolution step. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const K = 0.22;
  const RIGHT = 1800;
  const BOTTOM = 960;
  const IN = [0, T.E16, 0.5, 1.0];
  const rectOf = (r) => [RIGHT - r.w * K, BOTTOM - r.h * K, r.w * K, r.h * K];
  // output matrix: landscape · portrait · square (DCI 2K is landscape only) = 10 outputs
  const MK = 0.028;
  const ROWS = D.resolutions.map((r) => ({ r, kinds: r.key === 'DCI 2K' ? ['L'] : ['L', 'P', 'S'] }));

  SX.defineScene({
    id: 8,
    role: 'PROOF',
    bg: 'violet',

    build(cam) {
      const st = {};
      st.outputs = ui.tag(cam, 124, 500, 'OUTPUTS · LANDSCAPE · PORTRAIT · SQUARE', String(D.outputs));
      st.time = ui.chip(cam, 124, 916, `${D.fps.join(' · ')} FPS · ${D.seconds} S · MAX ${U.fmtInt(D.maxFrames)} FRAMES · ${D.bitrateCap} CAP`);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'OUTPUT / 1080p → UHD' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['4K까지', '그대로 뽑히고,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.outputs, lt, 1.0, { from: 0.6 });
      ui.pop(st.time, lt, 1.5, { from: 0.5 });
    },

    draw(G, st, lt) {
      // current (largest reached) frame grows from the previous size on its beat
      let k = 0;
      IN.forEach((t0, i) => {
        if (lt >= t0) k = i;
      });
      const prev = rectOf(D.resolutions[Math.max(0, k - 1)]);
      const next = rectOf(D.resolutions[k]);
      const g = k === 0 ? E.outBack(U.prog(lt, 0, 0.3), 1.4) : E.outCubic(U.prog(lt, IN[k], IN[k] + 0.22));
      const r = k === 0 ? [RIGHT - next[2] * g, BOTTOM - next[3] * g, next[2] * g, next[3] * g] : prev.map((v, i) => U.lerp(v, next[i], g));
      const cells = 5 * (U.lerp(D.resolutions[Math.max(0, k - 1)].w, D.resolutions[k].w, g) / 1920);
      if (r[2] > 2) {
        G.pattern('hex-pulse', {
          rect: r,
          clip: r,
          loop: 2,
          params: { uCells: Math.min(10, cells) },
          duo: [C.violet, C.ink, 2.2],
        });
      }

      G.ink((ctx) => {
        const I = SX.ink;
        D.resolutions.forEach((res, i) => {
          if (lt < IN[i]) return;
          const rr = i === k ? r : rectOf(res);
          const a = U.clamp((lt - IN[i]) * 8);
          I.rect(ctx, rr[0], rr[1], rr[2], rr[3], 1, { color: C.ink, w: i === k ? 3 : 1.5, alpha: a });
          I.marks(ctx, rr[0], rr[1], rr[2], rr[3], 10, { color: C.ink, w: 1.5, alpha: a * 0.8 });
          const ly = rr[1] + (i === 0 && k > 0 ? 28 : 0); // 1080p and DCI 2K share a top edge
          I.box(ctx, rr[0] + 1, ly + 1, 300, 26, 0, C.violet, { alpha: a });
          I.text(ctx, `${res.key} · ${res.w}×${res.h} · ${res.mp} MP`, rr[0] + 10, ly + 19, { color: C.ink, size: 14, weight: i === k ? 700 : 400, alpha: a, track: 1.2 });
        });

        // b3: output matrix at true aspect
        let y = 556;
        ROWS.forEach(({ r: res, kinds }, ri) => {
          const hMax = Math.max(...kinds.map((kd) => (kd === 'L' ? res.h : res.w) * MK));
          kinds.forEach((kd, ci) => {
            const t0 = 1.0 + (ri * 3 + ci) * 0.03;
            const a = U.clamp((lt - t0) * 8);
            if (a <= 0) return;
            const w = (kd === 'P' ? res.h : kd === 'S' ? res.h : res.w) * MK;
            const h = (kd === 'L' ? res.h : kd === 'S' ? res.h : res.w) * MK;
            const x = [124, 250, 320][ci];
            I.rect(ctx, x, y + (hMax - h), w, h, 1, { color: C.ink, w: 1.5, alpha: a });
          });
          if (lt >= 1.0) I.text(ctx, res.key, 400, y + hMax - 2, { color: C.ink, size: 13, alpha: U.clamp((lt - 1.0 - ri * 0.06) * 8) });
          y += hMax + 18;
        });
      });
    },
  });
})((window.SX = window.SX || {}));
