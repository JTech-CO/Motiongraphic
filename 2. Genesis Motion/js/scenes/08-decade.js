/* 08 DECADE — "10년 만에 / 150만 대."
   The exploded cells of 07 converge into the counter, which runs 1,008,804 → 1,510,368 (2025-11)
   while a 10-year dial sweeps 2015-11 → 2025-11. On b4 the G80 (RG3) arrives with its own
   501,517. Exit: iris expanding from the dial (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const K = D.cum15M;

  const DIAL = { cx: 1440, cy: 590, r: 250 };
  SX.L.dial = DIAL;
  const G80 = { x0: 120, ground: 930, s: 0.09 };
  const YEARS = 10;

  SX.defineScene({
    id: 8,
    role: 'DECADE',
    bg: 'dark',
    ruler: (lt) => {
      const y = 2015 + 10 * E.outCubic(U.prog(lt, 0.1, 1.0));
      return { from: 2015, to: y, mark: y };
    },

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, DIAL.cx, DIAL.cy, C.copper, 0.14);
      st.canvas = U.h('canvas', { width: T.W, height: T.H, style: 'left:0;top:0;width:1920px;height:1080px' });
      cam.appendChild(st.canvas);
      st.ctx = st.canvas.getContext('2d');
      const rnd = U.rng(151);
      st.targets = SX.L.cells.map(() => [140 + rnd() * 760, 590 + rnd() * 110]);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `CUMULATIVE / ${K.date}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['10년 만에', '150만 대.'] });
      st.count = ui.counter(cam, { x: 120, y: 560, size: 150 });
      st.countLbl = U.box(124, 724, 'mono', `GLOBAL CUMULATIVE · ${K.date}`);
      cam.appendChild(st.countLbl);

      const svg = U.svgFull();
      st.ring = ui.ring(svg, { cx: DIAL.cx, cy: DIAL.cy, r: DIAL.r, w: 10, color: C.copper, track: C.paper, trackOpacity: 0.16, cap: 'round' });
      st.ticks = U.s('g');
      for (let i = 0; i < YEARS; i++) {
        const a = (i / YEARS) * Math.PI * 2;
        const x1 = DIAL.cx + (DIAL.r + 16) * Math.sin(a);
        const y1 = DIAL.cy - (DIAL.r + 16) * Math.cos(a);
        const x2 = DIAL.cx + (DIAL.r + 30) * Math.sin(a);
        const y2 = DIAL.cy - (DIAL.r + 30) * Math.cos(a);
        st.ticks.appendChild(U.s('line', { x1, y1, x2, y2, stroke: C.paper, 'stroke-width': 2 }));
        const lx = DIAL.cx + (DIAL.r + 58) * Math.sin(a);
        const ly = DIAL.cy - (DIAL.r + 58) * Math.cos(a) + 5;
        st.ticks.appendChild(U.s('text', { x: lx, y: ly, 'text-anchor': 'middle', fill: C.paper, 'font-size': 13, style: 'font-family:var(--f-mono);letter-spacing:.06em', opacity: 0.7, text: i === 0 ? '2015 · 2025' : String(2015 + i) }));
      }
      svg.appendChild(st.ticks);
      st.head0 = U.s('circle', { r: 11, fill: C.paper });
      svg.appendChild(st.head0);
      st.car = SX.cars.build(svg, 'g80', { body: C.paper, window: C.black, detail: C.black, chrome: C.copper, tire: C.black, rim: '#8E8A84', lamp: C.magma });
      cam.appendChild(svg);

      st.ten = ui.counter(cam, { x: DIAL.cx, y: DIAL.cy - 120, size: 190, align: 'center' });
      st.ten.set(String(YEARS));
      st.tenLbl = U.h('div', { class: 'mono', style: `left:${DIAL.cx - 250}px;width:500px;text-align:center;top:${DIAL.cy + 86}px;font-size:15px`, text: `YEARS · ${K.from} → ${K.date}` });
      cam.appendChild(st.tenLbl);

      st.sub = ui.counter(cam, { x: 620, y: 812, size: 64 });
      st.subLbl = U.box(624, 888, 'mono', `G80 CUMULATIVE · ${K.date}`);
      st.subLbl.style.fontSize = '14px';
      cam.appendChild(st.subLbl);
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.05);
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      // Converging particles (from scene 07's explosion)
      const ctx = st.ctx;
      ctx.clearRect(0, 0, T.W, T.H);
      const cv = E.inOutCubic(U.prog(lt, 0, 0.32));
      if (cv < 1) {
        const size = SX.L.cellSize * U.lerp(1, 0.3, cv);
        SX.L.cells.forEach((c, j) => {
          const [tx, ty] = st.targets[j];
          const x = U.lerp(c.ex, tx, cv);
          const y = U.lerp(c.ey, ty, cv);
          ctx.fillStyle = c.kr ? C.paper : C.copper;
          ctx.globalAlpha = 1 - cv * cv;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        });
        ctx.globalAlpha = 1;
      }

      // Counter 1,008,804 → 1,510,368, lands on b3
      const cp = E.outCubic(U.prog(lt, 0.25, 1.0));
      st.count.set(U.fmtInt(U.lerp(D.cum1M.total, K.total, cp)));
      const on = U.clamp((lt - 0.2) * 8);
      st.count.el.style.opacity = on.toFixed(3);
      const pb = lt >= 1.0 ? U.pulse(lt - 1.0, 10, 0.14) : 0;
      st.count.el.style.transform = `scale(${(1 + 0.04 * pb).toFixed(4)})`;
      st.countLbl.style.opacity = U.clamp((lt - 0.25) * 6).toFixed(3);

      // Dial sweep 2015-11 → 2025-11
      const dp = E.inOutCubic(U.prog(lt, 0.1, 1.0));
      const de = ui.enter(lt, 0, 0.45);
      st.ring.set(dp);
      st.ring.g.setAttribute('opacity', de.o.toFixed(3));
      st.ticks.setAttribute('opacity', de.o.toFixed(3));
      st.ticks.setAttribute('transform', `rotate(${((1 - de.e) * -30).toFixed(2)} ${DIAL.cx} ${DIAL.cy})`);
      const a = dp * Math.PI * 2;
      st.head0.setAttribute('cx', (DIAL.cx + DIAL.r * Math.sin(a)).toFixed(1));
      st.head0.setAttribute('cy', (DIAL.cy - DIAL.r * Math.cos(a)).toFixed(1));
      st.head0.setAttribute('opacity', de.o.toFixed(3));
      ui.pop(st.ten.el, lt, 1.0, { from: 0.5 });
      st.tenLbl.style.opacity = U.clamp((lt - 1.05) * 6).toFixed(3);

      // G80 (RG3) + 501,517 on b3 → b4
      const ge = E.outExpo(U.prog(lt, 1.0, 1.4));
      st.car.place(G80.x0 - 700 * (1 - ge), G80.ground, G80.s);
      st.car.setWheels(lt * 6 + (1 - ge) * 20);
      st.car.g.setAttribute('opacity', U.clamp((lt - 1.0) * 8).toFixed(3));
      const sp = E.outCubic(U.prog(lt, 1.0, 1.5));
      st.sub.set(U.fmtInt(K.g80 * sp));
      st.sub.el.style.opacity = st.subLbl.style.opacity = U.clamp((lt - 1.02) * 8).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
