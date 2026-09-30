/* 08 CROSSOVER — "액션캠마저 / 고프로를 넘었고,"
   Night, speed streaks. Two light trails shoot in from the left and stop on the 2022–23 points (GoPro >75%,
   DJI <25% EST.) (b1), then streak to 2025 Q1–Q3 (b2) and cross; DJI 66% · GoPro 18% land with the crossing
   marker, Insta360 13% and the Osmo Action 5 Pro at the end of DJI's trail (b3). IDC chip on b4.
   The bounds (>75%, <25%) are drawn as open rings; the 2025 values as solid dots.
   Exit: orbit (transitions.js) around the frame centre. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;
  const A = D.actionCam;

  const X0 = 1060; // 2022–23
  const X1 = 1600; // 2025 Q1–Q3
  const Y = (pct) => 900 - pct * 6; // 0% at 900, 100% at 300
  const SERIES = [
    { key: 'GOPRO', col: C.mist, w: 6, y0: Y(A.left.gopro), y1: Y(A.right.gopro), l0: A.left.goproLabel, l1: `${A.right.gopro}%`, open: true },
    { key: 'DJI', col: C.beacon, w: 9, y0: Y(A.left.dji), y1: Y(A.right.dji), l0: A.left.djiLabel, l1: `${A.right.dji}%`, open: true },
  ];
  // Crossing point of the two segments
  const G = SERIES[0];
  const Dj = SERIES[1];
  const uX = (Dj.y0 - G.y0) / (G.y1 - G.y0 - (Dj.y1 - Dj.y0));
  const CROSS = { x: X0 + (X1 - X0) * uX, y: G.y0 + (G.y1 - G.y0) * uX };

  SX.defineScene({
    id: 8,
    role: 'CROSSOVER',
    bg: 'night',
    ruler: (lt) => ({ from: 2022, to: 2025, mark: SX.hud.hop(lt, [2022, 2022, 2025, 2025]), vel: lt > 0.5 && lt < 1.0 ? 2 : 0 }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.chart = U.s('g');
      svg.appendChild(st.chart);

      // Axes + faint 25% grid
      const ax = U.s('g', { stroke: C.mist });
      [0, 25, 50, 75, 100].forEach((p) => ax.appendChild(U.s('line', { x1: X0, x2: X1, y1: Y(p), y2: Y(p), 'stroke-width': 1, opacity: p === 0 ? 0.5 : 0.16, 'stroke-dasharray': p === 0 ? '' : '3 7' })));
      [X0, X1].forEach((x) => ax.appendChild(U.s('line', { x1: x, x2: x, y1: Y(100) - 20, y2: Y(0), 'stroke-width': 2, opacity: 0.55 })));
      st.chart.appendChild(ax);
      st.axes = ax;

      // Trails: entry streak (horizontal) + slope segment
      st.lines = SERIES.map((s) => {
        const entry = U.s('line', { y1: s.y0, y2: s.y0, stroke: s.col, 'stroke-width': s.w, 'stroke-linecap': 'round' });
        const tail = U.s('line', { y1: s.y0, y2: s.y0, stroke: s.col, 'stroke-width': Math.max(1, s.w / 3), opacity: 0.35 });
        const len = Math.hypot(X1 - X0, s.y1 - s.y0);
        const slope = U.s('line', { x1: X0, y1: s.y0, x2: X1, y2: s.y1, stroke: s.col, 'stroke-width': s.w, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${len + 10}` });
        const d0 = U.s('circle', { cx: X0, cy: s.y0, r: 11, fill: C.night, stroke: s.col, 'stroke-width': 4 });
        const d1 = U.s('circle', { cx: X1, cy: s.y1, r: 12, fill: s.col });
        st.chart.append(tail, entry, slope, d0, d1);
        return { s, entry, tail, slope, d0, d1, len };
      });
      st.insta = U.s('circle', { cx: X1, cy: Y(A.right.insta), r: 9, fill: C.sky });
      st.cross = U.s('g');
      st.cross.append(
        U.s('circle', { cx: CROSS.x, cy: CROSS.y, r: 26, fill: 'none', stroke: C.mist, 'stroke-width': 2 }),
        U.s('line', { x1: CROSS.x - 40, x2: CROSS.x + 40, y1: CROSS.y, y2: CROSS.y, stroke: C.mist, 'stroke-width': 1.5 }),
        U.s('line', { x1: CROSS.x, x2: CROSS.x, y1: CROSS.y - 40, y2: CROSS.y + 40, stroke: C.mist, 'stroke-width': 1.5 })
      );
      st.chart.append(st.insta, st.cross);
      st.cam5 = P.layer(st.chart);
      cam.appendChild(svg);

      // Labels
      cam.appendChild(U.box(X0 - 60, Y(0) + 22, 'mono sm', A.left.when));
      cam.appendChild(U.box(X1 - 80, Y(0) + 22, 'mono sm', A.right.when));
      cam.appendChild(U.box(X0 - 60, Y(100) - 56, 'mono sm', 'ACTION CAM · REVENUE SHARE · GLOBAL'));
      st.l0 = SERIES.map((s, i) => ui.tag(cam, X0 + 22, s.y0 + (i === 0 ? -56 : 16), s.key, s.l0));
      st.l1 = SERIES.map((s, i) => ui.tag(cam, X1 + 26, s.y1 + (i === 0 ? -48 : -22), s.key, s.l1));
      st.l1[1].style.borderLeftColor = C.beacon;
      st.l0[1].style.borderLeftColor = C.beacon;
      st.lInsta = ui.tag(cam, X1 + 26, Y(A.right.insta) + 6, 'INSTA360', `${A.right.insta}%`);
      st.lInsta.style.borderLeftColor = C.sky;
      st.lCam = ui.tag(cam, X1 - 300, Y(A.right.dji) - 170, 'OSMO ACTION 5 PRO');
      st.idc = ui.chip(cam, 124, 860, `HANDHELD SMART CAMS · ${D.handheldIdc.when} · ${D.handheldIdc.source}`, `${D.handheldIdc.pct}%`);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `ACTION CAM SHARE / ${A.left.when} → ${A.right.when} · ${A.source}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 116, lines: ['액션캠마저', '고프로를 넘었고,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      // Tracking shot alongside the trails
      st.chart.setAttribute('transform', `translate(${(-lt * 12).toFixed(1)} 0)`);
      st.axes.setAttribute('opacity', U.clamp(lt * 5).toFixed(3));

      // b1: trails shoot in from the left and stop on the 2022–23 points
      const inP = E.outExpo(U.prog(lt, 0, 0.36));
      // b2 → b3: slope segments grow to 2025
      const g = E.inOutCubic(U.prog(lt, 0.5, 1.0));
      st.lines.forEach((L, i) => {
        const head = U.lerp(-300 - i * 180, X0, inP);
        const tailLen = 900 * (1 - inP) + 60;
        L.entry.setAttribute('x1', (head - tailLen * 0.35).toFixed(1));
        L.entry.setAttribute('x2', head.toFixed(1));
        L.tail.setAttribute('x1', (head - tailLen).toFixed(1));
        L.tail.setAttribute('x2', head.toFixed(1));
        const fade = 1 - U.clamp((lt - 0.36) * 4);
        L.entry.setAttribute('opacity', fade.toFixed(3));
        L.tail.setAttribute('opacity', (0.35 * fade).toFixed(3));
        L.slope.setAttribute('stroke-dasharray', `${(L.len * g).toFixed(1)} ${(L.len + 10).toFixed(1)}`);
        L.d0.setAttribute('opacity', lt >= 0.3 ? 1 : 0);
        L.d0.setAttribute('r', (11 * E.outBack(U.prog(lt, 0.3, 0.45), 2.5)).toFixed(2));
        L.d1.setAttribute('r', (12 * E.outBack(U.prog(lt, 1.0, 1.15), 2.5)).toFixed(2));
        ui.pop(st.l0[i], lt, 0.34 + i * T.E16, { from: 0.6 });
        ui.pop(st.l1[i], lt, 1.0 + (1 - i) * T.E16, { from: 0.6 });
      });

      // b3: crossing marker, Insta360, Action 5 Pro at the end of DJI's trail
      const cp = U.prog(lt, 1.0, 1.2);
      st.cross.setAttribute('opacity', lt >= 1.0 ? (1 - 0.5 * U.clamp((lt - 1.3) * 3)).toFixed(3) : 0);
      st.cross.setAttribute('transform', `translate(${CROSS.x} ${CROSS.y}) scale(${U.lerp(1.8, 1, E.outCubic(cp)).toFixed(3)}) translate(${-CROSS.x} ${-CROSS.y})`);
      st.insta.setAttribute('r', (9 * E.outBack(U.prog(lt, 1.0 + T.E16, 1.15 + T.E16), 2.5)).toFixed(2));
      ui.pop(st.lInsta, lt, 1.0 + T.E8, { from: 0.6 });
      const ce = E.outBack(U.prog(lt, 1.0 + T.E8, 1.3), 1.6);
      if (ce > 0.01) {
        const bob = Math.sin(lt * 6) * 4;
        st.cam5.draw(P.actionPolys(P.HAND.action5, { x: X1 - 150, y: Y(A.right.dji) - 40 + bob, s: 2.1 * ce, yaw: -24, pitch: 10 }));
      } else st.cam5.draw([]);
      ui.pop(st.lCam, lt, 1.0 + T.E8 + T.E16, { from: 0.6 });

      ui.pop(st.idc, lt, 1.5, { from: 0.5 });
    },
  });
})((window.SX = window.SX || {}));
