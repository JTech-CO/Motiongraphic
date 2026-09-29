/* 09 EV — "전기차를 먼저 선언했지만, / 아직 4%,"
   The gauge needle stands at the 2021-09 pledge (100% EV from 2025) and falls to the 2024 reality:
   BEV 4.0% (9,206 units). The three BEVs sit beside it. On b4 the toggle flips EV ONLY → EV + HEV
   (2024-08 revision). Exit: slice glitch (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const V = D.ev;

  const GA = { cx: 1380, cy: 880, r: 320 };
  const CARS = { ground: 700, s: 0.055, xs: [120, 400, 705] };

  function pctAt(lt) {
    const up = E.spring(U.prog(lt, 0, 0.4));
    const down = E.spring(U.prog(lt, T.SPB, 2 * T.SPB), 5, 1.4);
    return U.lerp(100 * U.clamp(up, 0, 1.08), V.bevPct, down);
  }
  const pt = (pct, r) => {
    const a = Math.PI * (1 - pct / 100);
    return [GA.cx + r * Math.cos(a), GA.cy - r * Math.sin(a)];
  };

  SX.defineScene({
    id: 9,
    role: 'EV',
    bg: 'glacier',
    ruler: (lt) => ({ from: 2021, to: 2024, mark: SX.hud.hop(lt, [2021, 2021, 2024, 2024]) }),

    build(cam) {
      const st = {};
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'ELECTRIFICATION / PLEDGE VS SALES' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 96, lines: ['전기차를 먼저 선언했지만,', '아직 4%,'] });

      const svg = U.svgFull();
      const [lx, ly] = pt(0, GA.r);
      const [rx, ry] = pt(100, GA.r);
      svg.appendChild(U.s('path', { d: `M${lx} ${ly} A${GA.r} ${GA.r} 0 0 1 ${rx} ${ry}`, fill: 'none', stroke: C.ink, 'stroke-width': 18, opacity: 0.14 }));
      st.fillArc = U.s('path', { fill: 'none', stroke: C.ink, 'stroke-width': 18 });
      svg.appendChild(st.fillArc);
      [0, 25, 50, 75, 100].forEach((p) => {
        const [x1, y1] = pt(p, GA.r + 18);
        const [x2, y2] = pt(p, GA.r + 34);
        const [tx, ty] = pt(p, GA.r + 62);
        svg.append(
          U.s('line', { x1, y1, x2, y2, stroke: C.ink, 'stroke-width': 3 }),
          U.s('text', { x: tx, y: ty + 5, 'text-anchor': 'middle', fill: C.ink, 'font-size': 15, style: 'font-family:var(--f-mono);letter-spacing:.06em', text: `${p}%` })
        );
      });
      st.needle = U.s('line', { x1: GA.cx, y1: GA.cy, stroke: C.magma, 'stroke-width': 8, 'stroke-linecap': 'round' });
      svg.append(st.needle, U.s('circle', { cx: GA.cx, cy: GA.cy, r: 18, fill: C.ink }));

      st.cars = V.bevModels.map((m, i) => {
        const car = SX.cars.build(svg, m.car, { body: C.ink, window: C.paper, detail: C.glacier, tire: C.ink, rim: '#5F6E7A', lamp: C.paper, detailOpacity: 0 });
        const lbl = U.box(CARS.xs[i], CARS.ground + 14, 'mono', m.model);
        lbl.style.fontSize = '12px';
        cam.appendChild(lbl);
        return { car, lbl };
      });
      cam.appendChild(svg);

      st.read = ui.counter(cam, { x: GA.cx, y: GA.cy - 170, size: 118, align: 'center' });
      st.readLbl = U.h('div', { class: 'mono', style: `left:${GA.cx - 300}px;width:600px;text-align:center;top:${GA.cy + 24}px;font-size:15px`, text: `${V.bevYear} · BEV ${U.fmtInt(V.bevUnits)} UNITS · GLOBAL SHARE` });
      st.pledge = U.h('div', { class: 'mono', style: 'left:1500px;top:500px;font-size:14px;line-height:1.7' },
        U.h('div', { text: `${V.pledgeDate} · PLEDGE` }), U.h('div', { text: V.pledge, style: 'opacity:.75' }));
      cam.append(st.readLbl, st.pledge);

      st.knob = U.h('div', { class: 'toggle-knob' });
      st.lblA = U.h('span', { text: 'EV ONLY' });
      st.lblB = U.h('span', { text: 'EV + HEV' });
      st.toggle = U.h('div', { class: 'toggle', style: 'left:120px;top:820px' }, st.lblA, U.h('div', { class: 'toggle-pill' }, st.knob), st.lblB, U.h('span', { text: V.revisedDate, style: 'opacity:.7;font-size:15px' }));
      cam.appendChild(st.toggle);
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      const pct = pctAt(lt);
      const [nx, ny] = pt(pct, GA.r - 40);
      st.needle.setAttribute('x2', nx.toFixed(1));
      st.needle.setAttribute('y2', ny.toFixed(1));
      const [lx, ly] = pt(0, GA.r);
      const [fx, fy] = pt(U.clamp(pct, 0, 100), GA.r);
      st.fillArc.setAttribute('d', pct > 0.2 ? `M${lx} ${ly} A${GA.r} ${GA.r} 0 0 1 ${fx.toFixed(1)} ${fy.toFixed(1)}` : '');
      const shown = U.clamp(pct, 0, 100);
      st.read.set(shown < 10 ? `${shown.toFixed(1)}%` : `${Math.round(shown)}%`);
      st.read.el.style.opacity = U.clamp((lt + 0.02) * 6).toFixed(3);
      ui.pop(st.pledge, lt, 0.1, { from: 0.7 });
      st.pledge.style.opacity = (U.clamp((lt - 0.1) * 6) * (lt > T.SPB ? U.lerp(1, 0.45, U.prog(lt, T.SPB, 0.8)) : 1)).toFixed(3);
      st.readLbl.style.opacity = U.clamp((lt - 1.0) * 6).toFixed(3);

      st.cars.forEach(({ car, lbl }, i) => {
        const e = ui.enter(lt, 0.05 + i * 0.06, 0.45);
        car.place(CARS.xs[i], CARS.ground + (1 - e.e) * 40, CARS.s);
        car.g.setAttribute('opacity', e.o.toFixed(3));
        car.setWheels(lt * 5);
        lbl.style.opacity = e.o.toFixed(3);
      });

      // b4: toggle EV ONLY → EV + HEV
      const tp = E.outBack(U.prog(lt, 1.5 - T.LEAD, 1.5 + 0.1), 2);
      st.knob.style.transform = `translateX(${(tp * 56).toFixed(1)}px)`;
      st.lblA.style.opacity = (1 - 0.6 * U.clamp(tp)).toFixed(3);
      st.lblB.style.opacity = (0.4 + 0.6 * U.clamp(tp)).toFixed(3);
      const te = ui.enter(lt, 0.3, 0.4);
      st.toggle.style.opacity = te.o.toFixed(3);
      st.toggle.style.transform = `translate3d(0,${((1 - te.e) * 20).toFixed(1)}px,0)`;
    },
  });
})((window.SX = window.SX || {}));
