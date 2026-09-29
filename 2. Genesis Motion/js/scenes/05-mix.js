/* 05 MIX — "가장 많이 팔린 건 / GV70,"
   2024 sales by model (§3.1) as race bars with model silhouettes. Rows arrive shuffled,
   re-rank twice on 8th notes, GV70 (73,564 · 32.0%) takes #1 on b3, and the four SUV rows
   close a ~65.4% ring on b4. Exit: ring burst (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const ROW = { y0: 320, pitch: 70, icon: 960, label: 1080, x0: 1260, max: 400, thick: 36 };
  const RING = { cx: 360, cy: 760, r: 120, w: 26 };
  SX.L.race = { rowY: D.mix2024.map((_, i) => ROW.y0 + i * ROW.pitch), x0: ROW.x0, stub: 16, thick: ROW.thick };
  SX.L.mixRing = RING;

  const K = ROW.max / D.mix2024[0].v;
  // Slot per model over time: shuffled → second shuffle (b2) → ranked (8th after b2)
  const ORDER_A = [5, 2, 7, 0, 3, 6, 1, 4];
  const ORDER_B = [1, 0, 4, 3, 2, 6, 5, 7];
  const slotY = (slot) => ROW.y0 + slot * ROW.pitch;
  function rowY(m, lt) {
    const a = slotY(ORDER_A[m]);
    const b = slotY(ORDER_B[m]);
    const c = slotY(m);
    const p1 = E.spring(U.prog(lt, T.SPB - T.LEAD, T.SPB + 0.2));
    const p2 = E.spring(U.prog(lt, T.SPB + T.E8 - T.LEAD, T.SPB + T.E8 + 0.2));
    return U.lerp(U.lerp(a, b, p1), c, p2);
  }

  SX.defineScene({
    id: 5,
    role: 'MIX',
    bg: 'glacier',
    ruler: () => ({ from: 2024, to: 2024, mark: 2024 }),

    build(cam) {
      const st = {};
      st.cap = ui.caption(cam, { x: 120, y: 172, text: '2024 / SALES BY MODEL' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 108, lines: ['가장 많이 팔린 건', 'GV70,'] });

      const svg = U.svgFull();
      st.rows = D.mix2024.map((m, i) => {
        const g = U.s('g');
        const bar = U.s('line', { stroke: C.ink, 'stroke-width': ROW.thick });
        g.appendChild(bar);
        const car = SX.cars.build(g, m.car, { body: C.ink, window: C.paper, detail: C.glacier, tire: C.ink, rim: '#5F6E7A', lamp: C.paper, detailOpacity: 0 });
        svg.appendChild(g);
        const label = U.box(ROW.label, 0, 'row-label', m.model);
        const value = U.h('div', { class: 'row-value abs' }, U.h('b', { text: U.fmtInt(m.v) }), `${m.pct.toFixed(1)}%`);
        cam.append(label, value);
        return { m, i, g, bar, car, label, value };
      });
      st.ring = ui.ring(svg, { cx: RING.cx, cy: RING.cy, r: RING.r, w: RING.w, color: C.ink, track: C.ink, trackOpacity: 0.15 });
      cam.appendChild(svg);
      st.ringNum = ui.counter(cam, { x: RING.cx, y: RING.cy - 34, size: 56, align: 'center' });
      st.ringLbl = U.h('div', { class: 'mono', style: `left:${RING.cx - 150}px;width:300px;text-align:center;top:${RING.cy + 30}px;font-size:14px`, text: 'SUV SHARE · 2024' });
      cam.appendChild(st.ringLbl);
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      const hi = U.prog(lt, 1.0 - T.LEAD, 1.0);
      const suvHi = U.prog(lt, 1.5 - T.LEAD, 1.5);
      st.rows.forEach((r) => {
        const y = rowY(r.i, lt);
        const g = E.outBack(U.prog(lt, 0.02 + r.i * 0.03, 0.4 + r.i * 0.03), 1.2);
        const len = SX.L.race.stub + (r.m.v * K - SX.L.race.stub) * g;
        r.bar.setAttribute('x1', ROW.x0);
        r.bar.setAttribute('x2', (ROW.x0 + Math.max(2, len)).toFixed(1));
        r.bar.setAttribute('y1', y.toFixed(1));
        r.bar.setAttribute('y2', y.toFixed(1));
        const isTop = r.i === 0;
        r.bar.setAttribute('stroke', isTop && hi > 0.5 ? C.magma : C.ink);
        const dim = suvHi > 0 && !r.m.suv ? 1 - 0.6 * suvHi : 1;
        r.bar.setAttribute('opacity', dim.toFixed(3));

        const s = 100 / r.car.spec.L;
        const ie = ui.enter(lt, 0.05 + r.i * 0.03, 0.4);
        r.car.place(ROW.icon + (1 - ie.e) * -60, y + 18, s);
        r.car.g.setAttribute('opacity', (ie.o * dim).toFixed(3));
        r.car.setWheels(lt * 4);

        r.label.style.top = `${(y - 10).toFixed(1)}px`;
        r.label.style.opacity = (ie.o * dim).toFixed(3);
        r.value.style.left = `${(ROW.x0 + len + 14).toFixed(1)}px`;
        r.value.style.top = `${(y - 17).toFixed(1)}px`;
        r.value.style.opacity = (U.clamp((lt - 0.3 - r.i * 0.03) * 5) * dim).toFixed(3);
        r.value.style.color = isTop && hi > 0.5 ? C.ink : '';
        r.value.style.transform = isTop ? `scale(${(1 + 0.25 * E.outBack(U.prog(lt, 1.0, 1.3))).toFixed(3)})` : '';
        r.value.style.transformOrigin = '0 50%';
      });

      // SUV share ring: fills on b3, lands on b4
      const rp = E.outCubic(U.prog(lt, 1.0, 1.5));
      st.ring.set((D.suvSharePct / 100) * rp);
      const re = ui.enter(lt, 0.9, 0.4);
      st.ring.g.setAttribute('opacity', re.o.toFixed(3));
      st.ring.g.setAttribute('transform', `translate(${RING.cx} ${RING.cy}) scale(${U.lerp(0.7, 1, re.e).toFixed(4)}) translate(${-RING.cx} ${-RING.cy})`);
      st.ringNum.set(`${ui.approx(D.suvShareApprox)}${U.fmtFixed(D.suvSharePct * rp, 1)}%`);
      [st.ringNum.el, st.ringLbl].forEach((el) => (el.style.opacity = re.o.toFixed(3)));
    },
  });
})((window.SX = window.SX || {}));
