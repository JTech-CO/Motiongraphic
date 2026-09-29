/* 10 IPO — "나스닥에 / 올랐다."
   SPCX closing-price line draws point by point: IPO (b1) → D1 (b2) → ATH (8th) → ATL (b3)
   → 09-28 close (b4). Then the line shoots straight up and hard-cuts into the montage. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = D.ipo.points;

  const XS = [820, 1050, 1280, 1510, 1740];
  const yOf = (v) => 880 - ((v - 80) * 630) / 160;
  const PTS = P.map((p, i) => [XS[i], yOf(p.v)]);
  const AT = [0, 0.5, 0.75, 1.0, 1.5]; // point landing times
  const SEG = [[0.25, 0.5], [0.5, 0.75], [0.75, 1.0], [1.25, 1.5]]; // segment draw windows
  const STYLE = ['', '', 'hot', 'below', 'solid'];

  SX.defineScene({
    id: 10,
    role: 'IPO',
    bg: 'paper',
    ruler: () => ({ from: 2026, to: 2026, mark: 2026 }),

    build(cam) {
      const st = {};
      st.grid = U.h('div', { class: 'blueprint' });
      cam.appendChild(st.grid);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${D.ipo.exchange}: ${D.ipo.ticker} / ${D.ipo.listed}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 150, lines: ['나스닥에', '올랐다.'] });

      const svg = U.svgFull();
      st.axis = U.s('g');
      [100, 150, 200].forEach((v) => {
        st.axis.append(
          U.s('line', { x1: 780, y1: yOf(v), x2: 1800, y2: yOf(v), stroke: C.ink, 'stroke-width': 1, opacity: 0.18 }),
          U.s('text', { x: 770, y: yOf(v) + 5, 'text-anchor': 'end', fill: C.ink, 'font-size': 14, opacity: 0.6, style: 'font-family:var(--f-mono);letter-spacing:.08em', text: `$${v}` })
        );
      });
      P.forEach((p, i) =>
        st.axis.appendChild(U.s('text', { x: XS[i], y: 922, 'text-anchor': 'middle', fill: C.ink, 'font-size': 14, opacity: 0.7, style: 'font-family:var(--f-mono);letter-spacing:.08em', text: p.date })));
      st.ref = U.s('line', { x1: 780, y1: yOf(P[0].v), x2: 1800, y2: yOf(P[0].v), stroke: C.flame, 'stroke-width': 2, 'stroke-dasharray': '8 8' });
      st.line = U.s('path', { fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      st.rise = U.s('line', { stroke: C.flame, 'stroke-width': 6, 'stroke-linecap': 'round' });
      st.dots = PTS.map(([x, y]) => U.s('circle', { cx: x, cy: y, r: 10, fill: C.ink, stroke: C.paper, 'stroke-width': 3 }));
      svg.append(st.axis, st.ref, st.line, st.rise, ...st.dots);
      cam.appendChild(svg);

      st.refLbl = U.box(788, yOf(P[0].v) + 10, 'mono', `IPO $${P[0].v}`);
      st.refLbl.style.color = C.flame;
      cam.appendChild(st.refLbl);

      st.chips = P.map((p, i) => {
        const el = U.h('div', { class: `price-chip ${STYLE[i]}` },
          U.h('span', { class: 'k', text: p.key }),
          U.h('span', { class: 'v', text: `$${U.fmtFixed(p.v, 2)}` }));
        const below = STYLE[i] === 'below';
        el.style.left = `${PTS[i][0]}px`;
        el.style.top = `${PTS[i][1] + (below ? 26 : -26)}px`;
        el._base = `translate(-50%, ${below ? '0' : '-100%'})`;
        cam.appendChild(el);
        return el;
      });
      st.delta = U.box(PTS[4][0], PTS[4][1] + 26, 'mono', `+${D.ipo.vsIpoPct}% VS IPO`);
      st.delta.style.fontSize = '15px';
      st.delta.style.color = C.flame;
      cam.appendChild(st.delta);

      st.kpi = [
        ui.chip(cam, 120, 560, 'RAISED', `$${D.ipo.proceedsB}B`),
        ui.chip(cam, 120, 632, 'VALUATION', `$${D.ipo.valuationT}T`),
      ];
      st.kpiNote = U.box(122, 710, 'mono', 'INCL. GREENSHOE · PRICED 06-11');
      st.kpiNote.style.cssText += 'font-size:13px;opacity:.65';
      cam.appendChild(st.kpiNote);
      return st;
    },

    update(st, lt) {
      st.grid.style.transform = `translate3d(${(-lt * 10).toFixed(1)}px,${(-lt * 10).toFixed(1)}px,0)`;
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      const ae = ui.enter(lt, -0.05, 0.4);
      st.axis.setAttribute('opacity', ae.o.toFixed(3));
      const refP = E.outCubic(U.prog(lt, 0, 0.3));
      st.ref.setAttribute('x2', U.lerp(780, 1800, refP).toFixed(1));
      st.refLbl.style.opacity = U.clamp(lt * 5).toFixed(3);

      // Line: completed segments + the one currently drawing
      const pts = [PTS[0]];
      SEG.forEach(([a, b], i) => {
        const p = E.inOutCubic(U.prog(lt, a, b));
        if (p <= 0) return;
        const A = PTS[i];
        const B = PTS[i + 1];
        pts.push([U.lerp(A[0], B[0], p), U.lerp(A[1], B[1], p)]);
      });
      st.line.setAttribute('d', pts.length > 1 ? U.pathD(pts) : '');

      st.dots.forEach((d, i) => {
        const p = U.prog(lt, AT[i], AT[i] + 0.3);
        d.setAttribute('r', (lt < AT[i] ? 0 : 10 * E.outBack(p, 2.4)).toFixed(2));
      });
      st.chips.forEach((el, i) => ui.pop(el, lt, AT[i], { base: el._base, from: 0.3 }));
      ui.pop(st.delta, lt, 1.58, { from: 0.6, base: 'translateX(-50%)' });
      st.kpi.forEach((el, i) => ui.pop(el, lt, 0.12 + i * 0.08, { from: 0.6 }));
      st.kpiNote.style.opacity = (0.65 * U.clamp((lt - 0.3) * 5)).toFixed(3);

      // Exit: vertical launch from the last point, camera tilts up with it
      const rp = E.inExpo(U.prog(lt, 1.7, 1.98));
      const [lx, ly] = PTS[4];
      st.rise.setAttribute('x1', lx);
      st.rise.setAttribute('y1', ly);
      st.rise.setAttribute('x2', lx);
      st.rise.setAttribute('y2', (ly - rp * 900).toFixed(1));
      st.rise.style.opacity = lt >= 1.7 ? 1 : 0;
    },
  });
})((window.SX = window.SX || {}));
