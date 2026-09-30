/* 01 HOOK — "2006년 선전, / 부품 하나로 시작해,"
   A flight-controller board seen from straight above, its traces lighting up like a city's roads at night.
   Waypoints 2003 HKUST → 2005 ROBOCON → 2006 DJI along one route (16ths), the unit price pinned like a map
   label on b2, cost and monthly sales on b3, and a location pin dropping onto Shenzhen on b4.
   Exit: crane up (transitions.js) — the board tilts back like the ground as the camera rises. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const MAP = { cx: 1330, cy: 660 };
  const B = 250; // board half size
  const TRACE = ui.tone(C.night, 0.2);
  const LIT = C.mist;

  /** Seeded Manhattan/45° traces from the board's pins out past the frame */
  function makeTraces() {
    const r = U.rng(2006);
    const out = [];
    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    sides.forEach(([nx, ny], si) => {
      for (let k = 0; k < 7; k++) {
        const t = -B * 0.78 + (k / 6) * B * 1.56;
        let p = nx ? [nx * B, t] : [t, ny * B];
        const pts = [p.slice()];
        let dir = [nx, ny];
        let len = 60 + r() * 140;
        for (let seg = 0; seg < 3; seg++) {
          p = [p[0] + dir[0] * len, p[1] + dir[1] * len];
          pts.push(p.slice());
          const turn = r() < 0.5 ? 1 : -1;
          // rotate 45° toward a diagonal, then back to the axis
          dir = seg === 0 ? norm2([dir[0] - turn * dir[1], dir[1] + turn * dir[0]]) : [nx, ny];
          len = seg === 0 ? 80 + r() * 160 : 1600;
        }
        out.push({ pts, side: si, k, order: r() });
      }
    });
    return out;
  }
  const norm2 = (v) => {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };

  SX.defineScene({
    id: 1,
    role: 'HOOK',
    bg: 'night',
    ruler: (lt) => {
      const m = SX.hud.hop(lt, [2003, 2005, 2006, 2006], T.E16 * 2);
      return { from: 2003, to: 2006, mark: m, vel: lt < 0.5 ? 1.5 : 0 };
    },

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.map = U.s('g');
      svg.appendChild(st.map);

      // Traces (dim roads) + lit overlays with moving "headlights"
      st.traces = makeTraces().map((tr) => {
        const d = U.pathD(tr.pts);
        const base = U.s('path', { d, fill: 'none', stroke: TRACE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
        const lit = U.s('path', { d, fill: 'none', stroke: LIT, 'stroke-width': 2.4, 'stroke-dasharray': '3 26', 'stroke-linecap': 'round', opacity: 0 });
        st.map.append(base, lit);
        return Object.assign(tr, { lit });
      });

      // Board: PCB, mounting holes, pin headers, components, IMU box in the middle
      const g = U.s('g');
      g.appendChild(U.s('rect', { x: -B, y: -B, width: B * 2, height: B * 2, rx: 14, fill: ui.tone(C.night, 0.12), stroke: ui.tone(C.night, 0.32), 'stroke-width': 3 }));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.appendChild(U.s('circle', { cx: a * (B - 26), cy: b * (B - 26), r: 11, fill: 'none', stroke: ui.tone(C.night, 0.4), 'stroke-width': 3 })));
      const pinRow = (x0, y0, dx, dy, n) => {
        for (let i = 0; i < n; i++) g.appendChild(U.s('rect', { x: x0 + dx * i - 6, y: y0 + dy * i - 6, width: 12, height: 12, fill: ui.tone(C.night, 0.45) }));
      };
      pinRow(-B + 30, -B * 0.78, 0, (B * 1.56) / 6, 7);
      pinRow(B - 30, -B * 0.78, 0, (B * 1.56) / 6, 7);
      pinRow(-B * 0.78, -B + 30, (B * 1.56) / 6, 0, 7);
      pinRow(-B * 0.78, B - 30, (B * 1.56) / 6, 0, 7);
      const rc = U.rng(61);
      for (let i = 0; i < 26; i++) {
        const w = 10 + rc() * 26;
        const h = 8 + rc() * 14;
        const x = (rc() - 0.5) * B * 1.3;
        const y = (rc() - 0.5) * B * 1.3;
        if (Math.abs(x) < 95 && Math.abs(y) < 95) continue;
        g.appendChild(U.s('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, fill: ui.tone(C.night, 0.28) }));
      }
      g.appendChild(U.s('rect', { x: -70, y: -70, width: 140, height: 140, rx: 10, fill: ui.tone(C.night, 0.3), stroke: ui.tone(C.night, 0.5), 'stroke-width': 3 }));
      g.appendChild(U.s('rect', { x: -34, y: -34, width: 68, height: 68, fill: ui.tone(C.night, 0.45), transform: 'rotate(45)' }));
      st.core = U.s('circle', { r: 10, fill: C.beacon });
      g.appendChild(st.core);
      st.map.appendChild(g);

      // Waypoint route (screen-space overlay follows the map transform)
      st.route = U.s('path', { fill: 'none', stroke: C.mist, 'stroke-width': 2, 'stroke-dasharray': '10 10', opacity: 0.7 });
      st.wps = D.origin.map(() => {
        const c = U.s('g');
        c.append(U.s('circle', { r: 16, fill: 'none', stroke: C.mist, 'stroke-width': 2.5 }), U.s('circle', { r: 5, fill: C.mist }));
        return c;
      });
      svg.append(st.route, ...st.wps);

      // Location pin (teardrop)
      st.pin = U.s('g');
      st.pin.append(
        U.s('ellipse', { cx: 0, cy: 0, rx: 26, ry: 8, fill: C.beacon, opacity: 0.35 }),
        U.s('path', { d: 'M0 0 C-10 -24 -30 -40 -30 -62 A30 30 0 1 1 30 -62 C30 -40 10 -24 0 0Z', fill: C.beacon }),
        U.s('circle', { cx: 0, cy: -62, r: 11, fill: C.night })
      );
      svg.appendChild(st.pin);
      cam.appendChild(svg);

      st.wpTags = D.origin.map((o) => {
        const el = U.box(0, 0, 'mono sm', `${o.year} · ${o.label}`);
        cam.appendChild(el);
        return el;
      });
      st.price = ui.tag(cam, 0, 0, '/ UNIT', D.fcPrice);
      st.cost = ui.tag(cam, 0, 0, `COST ${D.fcCost}`);
      st.month = ui.tag(cam, 0, 0, `${D.fcPerMonth} / MONTH`);
      st.pinTag = U.box(0, 0, 'mono', `${D.founded} · ${D.hq}`);
      cam.appendChild(st.pinTag);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `EST. ${D.founded} / ${D.hq}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 108, lines: ['2006년 선전,', '부품 하나로 시작해,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      // Camera: slow descent + turn over the board
      const rot = -12 + 5 * E.outCubic(U.prog(lt, 0, 2));
      const sc = U.lerp(1.12, 1, E.outCubic(U.prog(lt, 0, 1.2)));
      st.map.setAttribute('transform', `translate(${MAP.cx} ${MAP.cy}) rotate(${rot.toFixed(3)}) scale(${sc.toFixed(4)})`);
      const a = U.rad(rot);
      const toScreen = ([x, y]) => [MAP.cx + sc * (x * Math.cos(a) - y * Math.sin(a)), MAP.cy + sc * (x * Math.sin(a) + y * Math.cos(a))];

      // Roads light up on 16th notes from b2; headlights keep flowing outward
      st.traces.forEach((tr, i) => {
        const on = U.clamp((lt - (0.5 + Math.floor(tr.order * 8) * T.E16)) * 14);
        tr.lit.setAttribute('opacity', (0.9 * on).toFixed(3));
        tr.lit.setAttribute('stroke-dashoffset', (-lt * 260 - i * 7).toFixed(1));
      });
      st.core.setAttribute('r', (10 + 6 * U.pulse(lt, T.SPB, 0.12)).toFixed(2));

      // Waypoint route: enters from the lower left and ends at the board
      const wpW = [[-980, 420], [-650, 330], [-330, 230]];
      const scr = wpW.map(toScreen);
      const board = toScreen([-B * 0.62, B * 0.2]);
      const route = [[40, 1040], ...scr, board];
      const reach = [0, T.E16 * 2, T.E16 * 4];
      const rp = U.clamp(lt / 0.5);
      st.route.setAttribute('d', U.pathD(route.slice(0, 2 + Math.min(3, Math.floor(rp * 4)))));
      st.wps.forEach((w, k) => {
        const [x, y] = scr[k];
        const on = ui.enter(lt, reach[k], 0.3);
        w.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.4 + 0.6 * on.e).toFixed(3)})`);
        w.setAttribute('opacity', on.o.toFixed(3));
        const tag = st.wpTags[k];
        tag.style.left = `${(x + 26).toFixed(1)}px`;
        tag.style.top = `${(y - 38).toFixed(1)}px`;
        tag.style.opacity = on.o.toFixed(3);
      });

      // Price label on b2, cost + monthly on b3 (attached to board corners)
      const pr = toScreen([-B * 0.1, -B]);
      st.price.style.left = `${(pr[0] + 10).toFixed(1)}px`;
      st.price.style.top = `${(pr[1] - 64).toFixed(1)}px`;
      ui.pop(st.price, lt, 0.5, { from: 0.6 });
      const cs = toScreen([B, -B * 0.35]);
      st.cost.style.left = `${(cs[0] + 22).toFixed(1)}px`;
      st.cost.style.top = `${(cs[1] + 4).toFixed(1)}px`;
      ui.pop(st.cost, lt, 1.0, { from: 0.6 });
      st.month.style.left = `${(cs[0] + 22).toFixed(1)}px`;
      st.month.style.top = `${(cs[1] + 54).toFixed(1)}px`;
      ui.pop(st.month, lt, 1.0 + T.E16, { from: 0.6 });

      // b4: location pin drops onto the board centre
      const ctr = toScreen([0, 0]);
      const drop = E.outBack(U.prog(lt, 1.5 - T.LEAD, 1.5 + 0.12), 2.4);
      const py = ctr[1] - (1 - drop) * 260;
      st.pin.setAttribute('transform', `translate(${ctr[0].toFixed(1)} ${py.toFixed(1)}) scale(${(0.8 + 0.2 * drop).toFixed(3)})`);
      st.pin.setAttribute('opacity', lt >= 1.5 - T.LEAD ? 1 : 0);
      st.pinTag.style.left = `${(ctr[0] + 44).toFixed(1)}px`;
      st.pinTag.style.top = `${(ctr[1] - 92).toFixed(1)}px`;
      st.pinTag.style.opacity = U.clamp((lt - 1.5) * 8).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
