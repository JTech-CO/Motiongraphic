/* 05 SPEC — "비행은 3.4배, / 전송은 30배,"
   Foreground: the Phantom 1 morphs into the Mavic 4 Pro (landing gear retracts, arms fold into the X layout,
   the external camera gives way to the round three-lens head). Background: a route over terrain grows from
   ~1 km to 30 km while the camera pulls back (the ~1 km bracket shrinks with the map). A timeline scrub bar
   fills 15 → 51 min. 3.4× and 30× pop on b4. Exit: rack focus (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;
  const F = D.flagship;

  const KM = 380; // map units per km at zoom 1
  const TO = { x: 1010, y: 610 }; // takeoff point on screen
  const Z0 = 380; // px per km at the start (1 km = 380 px)
  const Z1 = 24; // px per km at the end (30 km ≈ 720 px)
  const BAR = { x0: 1000, x1: 1780, y: 842, maxMin: 60 };
  const DRONE = { x: 560, y: 900, s: 1.2 };

  // A meandering 30 km route (km units), rescaled to exactly 30 km of path length
  function route() {
    const raw = [[0, 0], [0.45, -0.22], [1.0, -0.18], [2.4, -0.9], [5, -0.6], [8.5, -2.2], [12.5, -1.4], [17, -3.2], [21.5, -2.4], [26, -3.9], [30, -3.4]];
    const pts = U.polyLengths(raw);
    const k = 30 / pts[pts.length - 1];
    return raw.map(([x, y]) => [x * k * KM, y * k * KM]);
  }

  SX.defineScene({
    id: 5,
    role: 'SPEC',
    bg: 'ridge',
    ruler: (lt) => ({ from: 2013, to: 2025, mark: SX.hud.hop(lt, [2013, 2013, 2025, 2025]), vel: lt > 0.5 && lt < 1.0 ? 2 : 0 }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.world = U.s('g');
      svg.appendChild(st.world);

      // Map: contours over a large area so the pull-back keeps revealing terrain
      st.map = U.s('g');
      const topo = U.s('g', { transform: 'translate(5200 -900)' });
      SX.land.contours(topo, { hills: 150, levels: 6, seed: 505, color: ui.tone(C.ridge, 0.28), op: 0.55, sw: 1.2, width: 17000, height: 9500 });
      topo.querySelector('g').setAttribute('vector-effect', 'non-scaling-stroke');
      topo.querySelectorAll('path').forEach((p) => p.setAttribute('vector-effect', 'non-scaling-stroke'));
      st.map.appendChild(topo);
      const pts = route();
      st.routeLen = U.polyLengths(pts).pop();
      st.routeBase = U.s('path', { d: U.pathD(pts), fill: 'none', stroke: ui.tone(C.ridge, 0.18), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      st.routeLine = U.s('path', { d: U.pathD(pts), fill: 'none', stroke: C.mist, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      st.pts = pts;
      st.acc = U.polyLengths(pts);
      // ~1 km bracket (Phantom 1 range) drawn in map units, so it shrinks as the camera pulls back
      const one = U.slicePoly(pts, st.acc, KM);
      st.oneKm = U.s('path', { d: U.pathD(one), fill: 'none', stroke: C.beacon, 'stroke-linecap': 'round' });
      st.map.append(st.routeBase, st.routeLine, st.oneKm);
      st.world.appendChild(st.map);

      st.takeoff = U.s('g');
      st.takeoff.append(U.s('circle', { r: 14, fill: 'none', stroke: C.mist, 'stroke-width': 3 }), U.s('circle', { r: 4, fill: C.mist }));
      st.head = U.s('circle', { r: 9, fill: C.mist });
      svg.append(st.takeoff, st.head);

      // Scrub bar (flight time)
      const bar = U.s('g');
      bar.appendChild(U.s('rect', { x: BAR.x0, y: BAR.y - 6, width: BAR.x1 - BAR.x0, height: 12, fill: ui.tone(C.ridge, -0.25) }));
      for (let m = 0; m <= BAR.maxMin; m += 5) {
        const x = BAR.x0 + ((BAR.x1 - BAR.x0) * m) / BAR.maxMin;
        bar.appendChild(U.s('rect', { x: x - 1, y: BAR.y + 12, width: 2, height: m % 15 === 0 ? 14 : 7, fill: C.mist, opacity: 0.6 }));
      }
      st.fill = U.s('rect', { x: BAR.x0, y: BAR.y - 6, height: 12, fill: C.mist });
      st.play = U.s('rect', { y: BAR.y - 26, width: 4, height: 52, fill: C.beacon });
      bar.append(st.fill, st.play);
      svg.appendChild(bar);

      st.drone = P.layer(svg);
      cam.appendChild(svg);

      const minX = (m) => BAR.x0 + ((BAR.x1 - BAR.x0) * m) / BAR.maxMin;
      [0, 15, 30, 45, 60].forEach((m) => cam.appendChild(U.box(minX(m) - 20, BAR.y + 30, 'mono sm', String(m))));
      cam.appendChild(U.box(BAR.x0, BAR.y - 60, 'mono sm', 'FLIGHT TIME · MIN'));
      st.m15 = ui.tag(cam, minX(F.from.min) - 3, BAR.y - 116, F.from.model, `${F.from.min} MIN`);
      st.m51 = ui.tag(cam, minX(F.to.min) - 3, BAR.y - 116, F.to.model, `${F.to.min} MIN`);
      st.kmFrom = ui.tag(cam, 0, 0, F.from.model, F.from.kmLabel);
      st.kmTo = ui.tag(cam, 0, 0, F.to.model, F.to.kmLabel);
      st.xFlight = ui.chip(cam, BAR.x1 - 190, BAR.y - 190, 'FLIGHT', F.flightX);
      st.xRange = ui.chip(cam, 1560, 360, 'RANGE', F.rangeX);
      st.model = ui.tag(cam, DRONE.x - 250, 950, `${F.from.year}`, F.from.model);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${F.from.model} → ${F.to.model} / ${F.from.year} → ${F.to.year}` });
      st.headl = ui.headline(cam, { x: 120, y: 212, size: 112, lines: ['비행은 3.4배,', '전송은 30배,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.headl.update(lt, 0.02);

      // FPV-dive arrival: the frame overshoots in scale, then settles
      const arrive = ui.settle(lt, 0.3);
      st.world.setAttribute('transform', `translate(${TO.x} ${TO.y}) scale(${(1 + arrive * 0.25).toFixed(4)}) translate(${-TO.x} ${-TO.y})`);

      // Route grows 0 → ~1 km (b1), then ~1 → 30 km (b2 → b3) while zooming out
      const g1 = E.outCubic(U.prog(lt, 0.05, 0.45));
      const g2 = E.inOutCubic(U.prog(lt, 0.5, 1.0));
      const km = U.lerp(0, 1, g1) + 29 * g2;
      const z = Math.exp(U.lerp(Math.log(Z0), Math.log(Z1), g2));
      const k = z / KM;
      st.map.setAttribute('transform', `translate(${TO.x} ${TO.y}) scale(${k.toFixed(5)})`);
      [st.routeBase, st.routeLine, st.oneKm].forEach((el, i) => el.setAttribute('stroke-width', ((i === 0 ? 10 : i === 1 ? 5 : 9) / k).toFixed(2)));
      st.routeLine.setAttribute('stroke-dasharray', `${(km * KM).toFixed(1)} ${(st.routeLen + 10).toFixed(1)}`);
      st.oneKm.setAttribute('opacity', lt >= 0.45 ? 1 : 0);
      const hp = U.pointAt(st.pts, st.acc, km * KM);
      const hx = TO.x + hp.x * k;
      const hy = TO.y + hp.y * k;
      st.takeoff.setAttribute('transform', `translate(${TO.x} ${TO.y})`);
      st.head.setAttribute('cx', hx.toFixed(1));
      st.head.setAttribute('cy', hy.toFixed(1));
      st.head.setAttribute('r', (8 + 4 * U.pulse(lt, T.E8, 0.1)).toFixed(2));

      // Range labels only at the two data points
      const onePt = U.pointAt(st.pts, st.acc, KM);
      st.kmFrom.style.left = `${(TO.x + onePt.x * k - 40).toFixed(1)}px`;
      st.kmFrom.style.top = `${(TO.y + onePt.y * k + 26).toFixed(1)}px`;
      st.kmFrom.style.opacity = (U.clamp((lt - 0.4) * 6) * (1 - U.clamp((lt - 0.55) * 5))).toFixed(3);
      st.kmTo.style.left = `${(hx - 120).toFixed(1)}px`;
      st.kmTo.style.top = `${(hy + 30).toFixed(1)}px`;
      ui.pop(st.kmTo, lt, 1.0, { from: 0.6 });

      // Flight-time scrub bar 0 → 15 (b1) → 51 (b3)
      const mins = 15 * E.outCubic(U.prog(lt, 0.05, 0.45)) + 36 * E.inOutCubic(U.prog(lt, 0.5, 1.0));
      const xm = BAR.x0 + ((BAR.x1 - BAR.x0) * mins) / BAR.maxMin;
      st.fill.setAttribute('width', Math.max(0, xm - BAR.x0).toFixed(1));
      st.play.setAttribute('x', (xm - 2).toFixed(1));
      ui.pop(st.m15, lt, 0.45, { from: 0.6 });
      ui.pop(st.m51, lt, 1.0, { from: 0.6 });
      ui.pop(st.xFlight, lt, 1.5, { from: 0.5 });
      ui.pop(st.xRange, lt, 1.5 + T.E16, { from: 0.5 });

      // Drone morph b2 → b3, always flying
      const m = E.inOutCubic(U.prog(lt, 0.5, 1.0));
      const spec = P.lerpSpec(P.QUAD.phantom1, P.QUAD.mavic4, m);
      const bob = Math.sin(lt * 5) * 6;
      st.drone.draw(P.quadPolys(spec, { x: DRONE.x, y: DRONE.y + bob + arrive * 60, s: DRONE.s, yaw: 0, pitch: 9 }, { rotor: 1 }));
      U.setText(st.model.firstChild, m < 0.5 ? F.from.model : F.to.model);
      U.setText(st.model.lastChild, String(m < 0.5 ? F.from.year : F.to.year));
      st.model.style.opacity = (1 - 0.8 * Math.sin(Math.PI * m)).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
