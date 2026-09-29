/* 07 MILESTONE — "누적 100만 대,"
   A 1,000-cell grid fills on 16th notes in two colours: Korea 691,177 : overseas 318,627
   (685 : 315 cells, 1 cell ≈ 1,000 units). The counter lands on 1,008,804 on b4 (2023-08).
   Exit: the cells explode outward; scene 08 converges them into its counter (morph). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const K = D.cum1M;

  const G = { cols: 40, rows: 25, pitch: 22, cell: 18, x0: 900, y0: 372 };
  const GC = { x: G.x0 + (G.cols * G.pitch) / 2, y: G.y0 + (G.rows * G.pitch) / 2 };
  const N = G.cols * G.rows;
  const KR_CELLS = Math.round((K.kr / K.total) * N); // 685
  const TICK = N / 12; // cells per 16th note over b1–b3

  // Shared with scene 08: home position, explode target, colour
  const r = U.rng(100880);
  const CELLS = [];
  for (let j = 0; j < N; j++) {
    const col = Math.floor(j / G.rows);
    const row = j % G.rows;
    const x = G.x0 + col * G.pitch + G.cell / 2;
    const y = G.y0 + row * G.pitch + G.cell / 2;
    const a = Math.atan2(y - GC.y, x - GC.x) + (r() - 0.5) * 0.9;
    const dist = 420 + r() * 900;
    const tick = Math.floor(j / TICK);
    CELLS.push({
      x, y, kr: j < KR_CELLS,
      ex: x + Math.cos(a) * dist, ey: y + Math.sin(a) * dist * 0.8,
      spin: (r() - 0.5) * 540,
      t: tick * T.E16 + (j - tick * TICK) * 0.0011,
    });
  }
  SX.L.cells = CELLS;
  SX.L.cellSize = G.cell;

  SX.defineScene({
    id: 7,
    role: 'MILESTONE',
    bg: 'copper',
    ruler: () => ({ from: 2015, to: 2023, mark: 2023 }),

    build(cam) {
      const st = {};
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `CUMULATIVE / ${K.date}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 128, lines: ['누적 100만 대,'] });

      const svg = U.svgFull();
      st.rects = CELLS.map((c) => {
        const el = U.s('rect', { x: c.x - G.cell / 2, y: c.y - G.cell / 2, width: G.cell, height: G.cell, fill: C.ink, opacity: 0.12 });
        svg.appendChild(el);
        return el;
      });
      cam.appendChild(svg);

      st.count = ui.counter(cam, { x: 120, y: 560, size: 110 });
      st.countLbl = U.box(124, 684, 'mono', `GLOBAL CUMULATIVE · ${K.date}`);
      st.legend = U.box(124, 720, 'mono', '1 □ ≈ 1,000 UNITS');
      st.legend.style.cssText += 'font-size:14px;opacity:.7';
      st.kr = U.box(G.x0, 936, 'mono', `KOREA ${U.fmtInt(K.kr)} · ${K.krPct}%`);
      st.os = U.h('div', { class: 'mono', style: `right:${T.W - (G.x0 + G.cols * G.pitch - 4)}px;top:936px`, text: `OVERSEAS ${U.fmtInt(K.overseas)} · ${K.overseasPct}%` });
      cam.append(st.countLbl, st.legend, st.kr, st.os);
      st.stamp = ui.stamp(cam, { x: GC.x, y: GC.y, main: K.date, sub: 'CUMULATIVE 1,000,000+', rot: -6, color: C.ink });
      return st;
    },

    update(st, lt) {
      const out = ui.exit(lt, 1.62, 0.24);
      st.cap.update(lt, 0, 1.62);
      st.head.update(lt, 0.02, 1.62);

      let filled = 0;
      const q = E.outCubic(U.prog(lt, 1.62, 2.0));
      CELLS.forEach((c, j) => {
        const el = st.rects[j];
        const on = lt >= c.t;
        if (on) filled++;
        const p = on ? E.outBack(U.prog(lt, c.t, c.t + 0.12), 2) : 0;
        const sc = on ? p : 1;
        const x = U.lerp(c.x, c.ex, q);
        const y = U.lerp(c.y, c.ey, q);
        el.setAttribute('fill', on ? (c.kr ? C.paper : C.ink) : C.ink);
        el.setAttribute('opacity', on ? 1 : (0.12 * (1 - q)).toFixed(3));
        el.setAttribute('transform', `translate(${(x - c.x).toFixed(1)} ${(y - c.y).toFixed(1)}) rotate(${(c.spin * q).toFixed(1)} ${c.x} ${c.y}) translate(${c.x} ${c.y}) scale(${sc.toFixed(3)}) translate(${-c.x} ${-c.y})`);
      });

      st.count.set(U.fmtInt(Math.round((K.total * filled) / N)));
      const ce = ui.enter(lt, 0, 0.35);
      [st.count.el, st.countLbl, st.legend].forEach((el, i) => {
        el.style.opacity = (ce.o * (1 - out) * (i === 2 ? 0.7 : 1)).toFixed(3);
        el.style.transform = `translate3d(${(-out * 120).toFixed(1)}px,${((1 - ce.e) * 24).toFixed(1)}px,0)`;
      });
      [st.kr, st.os].forEach((el, i) => {
        const p = U.prog(lt, 1.0 + i * 0.1, 1.3 + i * 0.1);
        el.style.opacity = (U.clamp(p * 4) * (1 - out)).toFixed(3);
        el.style.transform = `translate3d(0,${((1 - E.outBack(p)) * 18).toFixed(1)}px,0)`;
      });
      st.stamp.update(lt, 1.5, 1.62);
    },
  });
})((window.SX = window.SX || {}));
