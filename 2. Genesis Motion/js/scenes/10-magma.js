/* 10 MAGMA — "고성능은 / 마그마로 달구고,"
   The GV60 Magma drives in with speed streaks; stopwatch 0 → 3.4 s (0–100 km/h) lands on b3,
   641 HP (US Boost) on b4, 264 km/h pops. Exit: RGB split, then a hard cut into the montage. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const MG = D.magma;

  const CAR = { x0: 780, ground: 880, s: 0.22 };
  const STREAKS = Array.from({ length: 14 }, (_, i) => ({
    y: 560 + U.hash(i, 21) * 320,
    len: 160 + U.hash(i, 22) * 520,
    x: U.hash(i, 23) * 2400,
    k: 0.6 + U.hash(i, 24) * 1.2,
    w: U.hash(i, 25) > 0.7 ? 5 : 2,
  }));

  SX.defineScene({
    id: 10,
    role: 'MAGMA',
    bg: 'magma',
    ruler: () => ({ from: 2025, to: 2026, mark: 2025.9 }),

    build(cam) {
      const st = {};
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${MG.model} / ${MG.premiere}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 120, lines: ['고성능은', '마그마로 달구고,'] });

      const svg = U.svgFull();
      st.streaks = STREAKS.map((s) => {
        const l = U.s('line', { y1: s.y, y2: s.y, stroke: C.ink, 'stroke-width': s.w, 'stroke-linecap': 'round', opacity: 0.35 });
        svg.appendChild(l);
        return l;
      });
      st.car = SX.cars.build(svg, 'gv60m', {
        body: C.ink, window: C.paper, windowOpacity: 0.3, detail: C.magma, chrome: C.paper, para: C.paper,
        tire: C.black, rim: C.paper, lamp: C.paper,
      });
      cam.appendChild(svg);

      st.watch = ui.counter(cam, { x: 120, y: 560, size: 130 });
      st.watchLbl = U.box(124, 700, 'mono', `0–100 KM/H · ${MG.model}`);
      st.hp = ui.counter(cam, { x: 120, y: 752, size: 84 });
      st.hpLbl = U.box(124, 848, 'mono', MG.hpNote);
      cam.append(st.watchLbl, st.hpLbl);
      st.vmax = ui.chip(cam, 1420, 430, 'V-MAX', `${MG.vmax} KM/H`);
      return st;
    },

    update(st, lt, sc) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      const inP = E.outExpo(U.prog(lt, 0, 0.45));
      const dx = -1500 * (1 - inP);
      const bob = Math.sin(lt * 38) * 1.5;
      st.car.place(CAR.x0 + dx, CAR.ground + bob, CAR.s);
      st.car.setWheels((lt * 2600 - dx) / (372 * CAR.s));

      STREAKS.forEach((s, i) => {
        const x = U.mod(s.x - lt * 2600 * s.k, 2600) - 500;
        const l = st.streaks[i];
        l.setAttribute('x1', x.toFixed(1));
        l.setAttribute('x2', (x + s.len).toFixed(1));
        l.setAttribute('opacity', (0.35 * U.clamp(lt * 4)).toFixed(3));
      });

      // Stopwatch lands on b3, HP on b4
      const wp = E.outCubic(U.prog(lt, 0.05, 1.0));
      st.watch.set(`${(MG.zeroTo100 * wp).toFixed(1)} s`);
      const hp = E.outCubic(U.prog(lt, 1.0, 1.5));
      st.hp.set(`${Math.round(MG.hp * hp)} HP`);
      const we = ui.enter(lt, 0.02, 0.4);
      [st.watch.el, st.watchLbl].forEach((el) => {
        el.style.opacity = we.o.toFixed(3);
        el.style.transform = `translate3d(0,${((1 - we.e) * 24).toFixed(1)}px,0)`;
      });
      const he = ui.enter(lt, 0.98, 0.4);
      [st.hp.el, st.hpLbl].forEach((el) => {
        el.style.opacity = he.o.toFixed(3);
        el.style.transform = `translate3d(0,${((1 - he.e) * 24).toFixed(1)}px,0)`;
      });
      ui.pop(st.vmax, lt, 1.5, { from: 0.5 });

      // RGB split on the last frames before the hard cut
      const f = Math.round(lt * T.FPS);
      if (lt >= 2.0 - 5 / T.FPS) {
        const j = 8 + U.hash(f, 31) * 16;
        sc.cam.style.filter = `drop-shadow(${j.toFixed(1)}px 0 0 ${C.glacier}) drop-shadow(${(-j).toFixed(1)}px 0 0 ${C.paper})`;
        sc.cam.style.transform += ` translate3d(${((U.hash(f, 32) - 0.5) * 30).toFixed(1)}px,0,0)`;
      } else sc.cam.style.filter = '';
    },
  });
})((window.SX = window.SX || {}));
