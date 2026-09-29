/* 03 ORBIT — "네 번째에 / 궤도에 올랐다."
   Trajectory arc draws over the Earth's curve (b1–b3) and reaches orbit on b4
   with a 2008-09-28 stamp. The frame then spins 180° around the rocket (→ 04). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const EC = { x: 1060, y: 2800 }; // Earth center
  const ER = 2000;
  const OR = 2230; // orbit radius
  const TH_L = U.rad(-108); // launch
  const TH_I = U.rad(-80); // orbit insertion
  const TH_E = U.rad(-77.5); // coast end (spin pivot)

  const polar = (th, r) => [EC.x + r * Math.cos(th), EC.y + r * Math.sin(th)];

  // Launch → insertion (radial at liftoff, tangent at insertion), then coast along orbit
  const ascent = [];
  for (let i = 0; i <= 90; i++) {
    const s = i / 90;
    ascent.push(polar(TH_L + (TH_I - TH_L) * Math.pow(s, 1.6), ER + (OR - ER) * (1 - (1 - s) * (1 - s))));
  }
  const coast = [];
  for (let i = 1; i <= 20; i++) coast.push(polar(TH_I + ((TH_E - TH_I) * i) / 20, OR));
  const PTS = ascent.concat(coast);
  const ACC = U.polyLengths(PTS);
  const ASC_LEN = ACC[ascent.length - 1];
  const TOTAL = ACC[ACC.length - 1];

  const INS = polar(TH_I, OR);
  SX.L.orbitPivot = polar(TH_E, OR);

  SX.defineScene({
    id: 3,
    role: 'ORBIT',
    bg: 'orange',
    ruler: () => ({ from: 2008, to: 2008, mark: 2008 }),

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, INS[0], INS[1], C.paper, 0.2);

      const svg = U.svgFull();
      st.world = U.s('g');
      st.world.append(
        U.s('circle', { cx: EC.x, cy: EC.y, r: 2070, fill: 'none', stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '1 9', 'stroke-linecap': 'round', opacity: 0.5 }),
        U.s('circle', { cx: EC.x, cy: EC.y, r: ER, fill: C.ink }),
        U.s('circle', { cx: EC.x, cy: EC.y, r: ER - 36, fill: 'none', stroke: C.paper, 'stroke-width': 1, opacity: 0.16 }),
        U.s('circle', { cx: EC.x, cy: EC.y, r: ER - 96, fill: 'none', stroke: C.paper, 'stroke-width': 1, opacity: 0.1 })
      );
      st.orbit = U.s('circle', { cx: EC.x, cy: EC.y, r: OR, fill: 'none', stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '6 12' });
      st.path = U.s('path', { fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

      const L = polar(TH_L, ER);
      st.launchTick = U.s('g', {},
        U.s('line', { x1: L[0], y1: L[1], x2: L[0], y2: L[1] + 40, stroke: C.paper, 'stroke-width': 2 }),
        U.s('circle', { cx: L[0], cy: L[1], r: 6, fill: C.paper }));
      st.insTick = U.s('circle', { cx: INS[0], cy: INS[1], r: 11, fill: 'none', stroke: C.ink, 'stroke-width': 3 });

      const rocket = SX.vehicles.falcon1(C.ink, C.flame);
      st.plume = U.s('polygon', { fill: C.paper });
      st.rocket = U.s('g', {}, U.s('g', { transform: 'scale(0.36)' }, st.plume, rocket.g));
      st.all = U.s('g', {}, st.world, st.orbit, st.path, st.launchTick, st.insTick, st.rocket);
      svg.appendChild(st.all);
      cam.appendChild(svg);

      st.launchLbl = U.box(L[0] + 22, L[1] + 24, 'mono', `${D.falcon1.site} · LIFTOFF`);
      st.launchLbl.style.color = C.paper;
      st.orbitLbl = U.box(INS[0] + 230, INS[1] + 6, 'mono', 'ORBIT');
      cam.append(st.launchLbl, st.orbitLbl);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'FALCON 1 · FLIGHT 04 / ORBIT' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['네 번째에', '궤도에 올랐다.'] });
      st.first = ui.caption(cam, { x: 120, y: 530, text: 'FIRST PRIVATE LIQUID-FUEL ROCKET TO ORBIT' });
      st.stamp = ui.stamp(cam, { x: INS[0] - 20, y: INS[1] - 150, main: D.falcon1.firstOrbit, sub: 'FLIGHT 04 · ORBIT', rot: -6, color: C.ink });
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.06);

      const w = ui.enter(lt, 0, 0.55);
      const rise = (1 - w.e) * 260;
      st.all.setAttribute('transform', `translate(0 ${rise.toFixed(2)})`);
      const og = ui.enter(lt, 0.1, 0.5);
      st.orbit.setAttribute('opacity', (0.45 * og.o).toFixed(3));
      st.orbit.setAttribute('stroke-dashoffset', (-lt * 40).toFixed(1));

      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      st.first.update(lt, 1.5);

      // Ascent reaches insertion exactly on b4 (1.5), then coasts
      const a = E.inOutCubic(U.prog(lt, 0.02, 1.5));
      const len = lt < 1.5 ? ASC_LEN * a : ASC_LEN + (TOTAL - ASC_LEN) * E.outQuad(U.prog(lt, 1.5, 2.0));
      st.path.setAttribute('d', U.pathD(U.slicePoly(PTS, ACC, Math.max(len, 0.5))));
      const hp = U.pointAt(PTS, ACC, Math.max(len, 0.5));
      const ang = len < 2 ? -90 : U.deg(hp.ang);
      st.rocket.setAttribute('transform', `translate(${hp.x.toFixed(1)} ${hp.y.toFixed(1)}) rotate(${(ang + 90).toFixed(2)})`);
      const burn = lt < 1.5 ? 1 : 1 - U.prog(lt, 1.5, 1.6);
      const pl = burn * (60 + 50 * U.noise1(lt * 24, 3));
      st.plume.setAttribute('points', `-9,4 9,4 0,${(4 + pl).toFixed(1)}`);

      const lp = ui.enter(lt, 0.05, 0.35);
      st.launchTick.setAttribute('opacity', lp.o.toFixed(3));
      st.launchLbl.style.opacity = lp.o.toFixed(3);
      st.launchLbl.style.transform = `translate3d(0,${((1 - lp.e) * 20 + rise).toFixed(1)}px,0)`;

      const ip = ui.enter(lt, 1.5, 0.4);
      st.insTick.setAttribute('opacity', ip.o.toFixed(3));
      st.insTick.setAttribute('r', (11 + 26 * (1 - ip.e)).toFixed(2));
      st.orbitLbl.style.opacity = (ip.o * 0.8).toFixed(3);
      st.stamp.update(lt, 1.5);
    },
  });
})((window.SX = window.SX || {}));
