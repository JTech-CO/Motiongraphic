/* 12 END CARD — "그리고 이제, / 궤도로." (6 beats)
   b1 Starship lifts off · b2 hot staging, ship reaches orbit · b3 26 V3 satellites
   separate on a stagger · b4 subcopy · b5 title + data date · b6 micro-motion only. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const F = D.flight14;

  const EC = { x: 1450, y: 2250 };
  const ER = 1400;
  const OR = 1660;
  const SC0 = 0.75; // stack scale at liftoff
  const SHIP_OFF = 247; // ship base above booster base (vehicle units)
  const TH_L = U.rad(-98);
  const TH_I = U.rad(-82);
  const TH_C = U.rad(-78.5); // coast target at the end of the scene
  const polar = (th, r) => [EC.x + r * Math.cos(th), EC.y + r * Math.sin(th)];

  /** Ship-base trajectory: radial at liftoff, tangent at insertion */
  const pathAt = (s) => {
    const th = TH_L + (TH_I - TH_L) * s * s;
    const r = ER + SHIP_OFF * SC0 + (OR - ER - SHIP_OFF * SC0) * (1 - (1 - s) * (1 - s));
    return polar(th, r);
  };
  const TRAIL = [];
  for (let i = 0; i <= 100; i++) TRAIL.push(pathAt(i / 100));
  const TRAIL_ACC = U.polyLengths(TRAIL);

  function sAt(lt) {
    if (lt < 0.5) return 0.22 * E.inCubic(U.prog(lt, 0, 0.5));
    return 0.22 + 0.78 * E.outCubic(U.prog(lt, 0.5, 1.0));
  }
  /** Ship position + heading (rad) */
  function shipAt(lt) {
    if (lt >= 1.0) {
      const th = TH_I + (TH_C - TH_I) * ((lt - 1.0) / 2.0);
      const [x, y] = polar(th, OR);
      return { x, y, ang: th + Math.PI / 2, th };
    }
    const s = sAt(lt);
    const [x, y] = pathAt(s);
    const [x2, y2] = pathAt(Math.min(1, s + 0.002));
    const [x0, y0] = pathAt(Math.max(0, s - 0.002));
    return { x, y, ang: Math.atan2(y2 - y0, x2 - x0), th: TH_I };
  }

  const N_SAT = F.v3Deployed;
  const release = (j) => 1.0 + j * 0.018;

  SX.defineScene({
    id: 12,
    role: 'END CARD',
    bg: 'dark',
    ruler: (lt) => {
      const y = U.lerp(2002, 2026, E.outCubic(U.prog(lt, 0, 2.0)));
      return { from: 2002, to: y, mark: y };
    },

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, EC.x, EC.y - ER, C.orbit, 0.2);

      const svg = U.svgFull();
      st.world = U.s('g');
      st.world.append(
        U.s('circle', { cx: EC.x, cy: EC.y, r: ER + 34, fill: 'none', stroke: C.paper, 'stroke-width': 1.5, 'stroke-dasharray': '1 9', 'stroke-linecap': 'round', opacity: 0.4 }),
        U.s('circle', { cx: EC.x, cy: EC.y, r: ER, fill: C.ink, stroke: C.paper, 'stroke-width': 1.5, 'stroke-opacity': 0.6 }),
        U.s('circle', { cx: EC.x, cy: EC.y, r: ER - 44, fill: 'none', stroke: C.paper, 'stroke-width': 1, opacity: 0.08 })
      );
      st.orbit = U.s('circle', { cx: EC.x, cy: EC.y, r: OR, fill: 'none', stroke: C.paper, 'stroke-width': 1.5, 'stroke-dasharray': '6 10', opacity: 0.4 });
      st.trail = U.s('path', { fill: 'none', stroke: C.paper, 'stroke-width': 2, opacity: 0.55 });

      const ss = SX.vehicles.starship(C.paper, C.ink);
      st.ss = ss;
      st.boosterG = U.s('g', {}, ss.booster);
      st.shipG = U.s('g', {}, ss.ship);
      st.sats = [];
      const satG = U.s('g');
      for (let j = 0; j < N_SAT; j++) {
        const r = U.s('rect', { x: -6, y: -2.5, width: 12, height: 5, fill: C.paper });
        satG.appendChild(r);
        st.sats.push(r);
      }
      svg.append(st.world, st.orbit, st.trail, satG, st.boosterG, st.shipG);
      cam.appendChild(svg);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `STARSHIP FLIGHT ${F.n} / ${F.booster} · ${F.ship}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 140, lines: ['그리고 이제,', '궤도로.'] });

      st.sub = ui.headline(cam, { x: 122, y: 548, size: 34, stagger: 0.012, lines: [`Starship Flight ${F.n} · ${F.date} · 첫 궤도, V3 ${F.v3Deployed}기 전개`] });
      st.sub.el.classList.add('subcopy');

      st.satN = ui.counter(cam, { x: 1250, y: 452, size: 60 });
      st.satLbl = U.box(1336, 474, 'mono', '× V3 DEPLOYED');

      st.title = ui.headline(cam, { x: 116, y: 762, size: 96, stagger: 0.028, lines: ['SPACEX 2002—2026'] });
      st.title.el.classList.add('title');
      st.date = ui.caption(cam, { x: 122, y: 890, text: `DATA AS OF ${D.asOf}` });
      cam.appendChild(st.satLbl);
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.04);
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      st.sub.update(lt, 1.5);
      st.title.update(lt, 2.0);
      st.date.update(lt, 2.12);

      const we = ui.enter(lt, 0, 0.5);
      st.world.setAttribute('transform', `translate(0 ${((1 - we.e) * 160).toFixed(1)})`);
      st.orbit.setAttribute('stroke-dashoffset', (lt * 30).toFixed(1));
      st.orbit.setAttribute('opacity', (0.4 * U.clamp(lt * 4)).toFixed(3));

      // Trajectory trail
      const s = lt < 1.0 ? sAt(lt) : 1;
      st.trail.setAttribute('d', U.pathD(U.slicePoly(TRAIL, TRAIL_ACC, TRAIL_ACC[TRAIL_ACC.length - 1] * s)));

      // Ship
      const sh = shipAt(lt);
      const scl = lt < 0.5 ? SC0 : U.lerp(SC0, 0.46, E.outCubic(U.prog(lt, 0.5, 1.0)));
      const rot = U.deg(sh.ang) + 90;
      st.shipG.setAttribute('transform', `translate(${sh.x.toFixed(1)} ${sh.y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${scl.toFixed(4)})`);
      st.ss.setShipPlume(lt >= 0.5 && lt < 1.0 ? 55 + 25 * U.noise1(lt * 30, 7) : 0);

      // Booster: attached below the ship until hot staging on b2, then flips and falls away
      if (lt < 0.5) {
        const bx = sh.x - Math.cos(sh.ang) * SHIP_OFF * SC0;
        const by = sh.y - Math.sin(sh.ang) * SHIP_OFF * SC0;
        st.boosterG.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${SC0})`);
        st.ss.setBoosterPlume(lt >= 0 ? 110 + 50 * U.noise1(lt * 28, 9) : 0, 34);
        st.boosterG.style.display = '';
      } else if (lt < 1.4) {
        const sep = shipAt(0.5);
        const u = lt - 0.5;
        const bx = sep.x - Math.cos(sep.ang) * SHIP_OFF * SC0 - 60 * u;
        const by = sep.y - Math.sin(sep.ang) * SHIP_OFF * SC0 + 900 * u * u + 40 * u;
        st.boosterG.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${(U.deg(sep.ang) + 90 - 200 * E.outCubic(U.prog(u, 0, 0.7))).toFixed(2)}) scale(${SC0})`);
        st.ss.setBoosterPlume(0);
        st.boosterG.style.display = '';
      } else st.boosterG.style.display = 'none';

      // V3 satellites: staggered release, drifting back along the orbit
      let n = 0;
      st.sats.forEach((r, j) => {
        const r0 = release(j);
        if (lt < r0) {
          r.setAttribute('opacity', 0);
          return;
        }
        n++;
        const d = U.rad((j + 1) * 0.58) * E.outCubic(U.prog(lt, r0, r0 + 0.7));
        const th = sh.th - d;
        const rr = OR + (U.hash(j, 4) - 0.5) * 14;
        const [x, y] = polar(th, rr);
        r.setAttribute('opacity', 1);
        r.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(U.deg(th) + 90).toFixed(2)})`);
      });
      st.satN.set(String(n));
      const ne = ui.enter(lt, 1.0, 0.4);
      st.satN.el.style.opacity = st.satLbl.style.opacity = ne.o.toFixed(3);
      st.satN.el.style.transform = st.satLbl.style.transform = `translate3d(0,${((1 - ne.e) * 20).toFixed(1)}px,0)`;
    },
  });
})((window.SX = window.SX || {}));
