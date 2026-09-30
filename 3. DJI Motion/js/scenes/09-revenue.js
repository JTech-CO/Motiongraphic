/* 09 REVENUE — "매출은 / 약 115억 달러,"
   A vertical world on a log scale: altitude = log10(USD) (420 px per decade, $1M at the ground).
   The camera follows a climbing Mavic 4 Pro: 2011 ~$4.2M near the ridges (b1), 2013 ~$131M (b2),
   2015 ~$1B at the cloud deck (b3), 2025 ~$11.5B above the clouds with the sun (b4). All values are estimates.
   Exit: cloud pass (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;
  const REV = D.revenue;

  const DEC = 420; // px per decade
  const alt = (usd) => (Math.log10(usd) - 6) * DEC;
  const GROUND = 862; // world y of $1M
  const wy = (a) => GROUND - a; // world y of an altitude
  const DRONE = { x: 1180, y: 600, s: 0.8 };
  const RULER_X = 1730;
  const CLOUD_A = alt(1e9); // top of the cloud deck
  const KEYS = REV.map((r) => alt(r.usd));

  /** Cloud deck on the right side of the frame (keeps the left column readable):
      one shape with a bumpy top, a rounded left end and a softly scalloped base */
  function deck(parent, o) {
    const r = U.rng(o.seed);
    const B = o.band;
    const x0 = o.x0;
    let d = `M${x0} ${B / 2}C${x0} ${B * 0.1} ${x0 + 20} 0 ${x0 + 70} 0`;
    let x = x0 + 70;
    while (x < 2200) {
      const w = U.lerp(180, 420, r());
      const h = U.lerp(o.h[0], o.h[1], r());
      d += `C${(x + w * 0.04).toFixed(0)} ${(-h).toFixed(0)} ${(x + w * 0.96).toFixed(0)} ${(-h).toFixed(0)} ${(x + w).toFixed(0)} 0`;
      x += w;
    }
    d += `L${x.toFixed(0)} ${B}`;
    while (x > x0 + 70) {
      const w = Math.min(x - (x0 + 70), U.lerp(160, 320, r()));
      const h = U.lerp(10, 26, r());
      d += `C${(x - w * 0.1).toFixed(0)} ${(B + h).toFixed(0)} ${(x - w * 0.9).toFixed(0)} ${(B + h).toFixed(0)} ${(x - w).toFixed(0)} ${B}`;
      x -= w;
    }
    d += `C${x0 + 20} ${B} ${x0} ${B * 0.9} ${x0} ${B / 2}Z`;
    const el = U.s('path', { d, fill: o.color });
    parent.appendChild(el);
    return el;
  }

  SX.defineScene({
    id: 9,
    role: 'REVENUE',
    bg: 'ridge',
    ruler: (lt) => ({ from: 2011, to: 2025, mark: SX.hud.hop(lt, REV.map((r) => r.year)), vel: lt > 1.4 ? 3 : 0 }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.world = U.s('g');
      svg.appendChild(st.world);
      const w = st.world;
      cam.appendChild(svg);

      // Upper atmosphere: tonal steps getting deeper with altitude, then the sun
      [-0.06, -0.12, -0.18, -0.24, -0.3].forEach((k, i) => {
        const a0 = CLOUD_A - 260 + i * 220;
        w.appendChild(U.s('rect', { x: -200, y: wy(a0 + (i === 4 ? 3000 : 220)), width: 2320, height: i === 4 ? 3000 : 220, fill: ui.tone(C.ridge, k) }));
      });
      SX.land.sun(w, 1500, wy(alt(11.5e9) + 270), 80, C.mist, 0.3);

      // Ground ridges
      st.ridges = SX.land.ridges(w, {
        color: C.ridge,
        layers: [
          { y: wy(-40), amp: 220, seed: 91, k: 0.12, speed: 6 },
          { y: wy(-140), amp: 180, seed: 92, k: -0.18, speed: 12 },
          { y: wy(-240), amp: 130, seed: 93, k: -0.36, speed: 20 },
        ],
      });

      st.decades = ['$1M', '$10M', '$100M', '$1B', '$10B'].map((l, k) => {
        const el = U.box(RULER_X + 12, 0, 'mono sm', l);
        el.style.cssText += `;padding:3px 6px;background:${ui.tone(C.ridge, -0.45)}`;
        el._a = k * DEC;
        cam.appendChild(el);
        return el;
      });

      // Data levels: dashed line across + tag
      st.levels = REV.map((r, k) => {
        const a = KEYS[k];
        const line = U.s('line', { x1: 980, x2: RULER_X - 30, y1: wy(a), y2: wy(a), stroke: C.mist, 'stroke-width': 2, 'stroke-dasharray': '10 8' });
        w.appendChild(line);
        const tag = ui.tag(cam, 1370, 0, `${r.year} · EST.${r.note ? ' · ' + r.note : ''}`, r.label);
        tag._a = a;
        tag.style.background = ui.tone(C.ridge, -0.45); // readable over sky and cloud
        return { line, tag };
      });

      // Cloud deck: back bank at the deck, drone, front bank slightly lower
      st.back = deck(w, { x0: 860, color: ui.tone(C.mist, -0.1), seed: 95, h: [50, 110], band: 230 });
      st.back.setAttribute('transform', `translate(0 ${wy(CLOUD_A - 60)})`);

      // Log altitude ruler (decades labelled, 2–9 minor ticks)
      const rl = U.s('g', { stroke: C.mist });
      rl.appendChild(U.s('line', { x1: RULER_X, x2: RULER_X, y1: wy(-60), y2: wy(alt(3e10)), 'stroke-width': 2, opacity: 0.6 }));
      for (let e = 6; e <= 10; e++) {
        for (let m = 1; m <= 9; m++) {
          const a = alt(m * Math.pow(10, e));
          if (a > alt(3e10)) break;
          rl.appendChild(U.s('line', { x1: RULER_X - (m === 1 ? 26 : 10), x2: RULER_X, y1: wy(a), y2: wy(a), 'stroke-width': m === 1 ? 2.5 : 1.2, opacity: m === 1 ? 0.9 : 0.5 }));
        }
      }
      w.appendChild(rl);

      st.drone = P.layer(svg);
      st.front = deck(svg, { x0: 940, color: C.mist, seed: 96, h: [40, 90], band: 150 });

      st.count = ui.counter(cam, { x: 120, y: 560, size: 150 });
      st.countLbl = U.box(124, 724, 'mono', '');
      cam.appendChild(st.countLbl);
      cam.appendChild(U.box(RULER_X - 12, 150, 'mono sm', 'LOG SCALE'));

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'REVENUE · USD · ALL ESTIMATES / 2011 → 2025' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['매출은', '약 115억 달러,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      // Drone altitude: climbs to the next level on each beat (lands 4 frames after the beat)
      let a = KEYS[0];
      for (let k = 1; k < KEYS.length; k++) a += (KEYS[k] - KEYS[k - 1]) * E.inOutCubic(U.prog(lt, k * T.SPB - 0.3, k * T.SPB + T.LEAD));
      const camA = a - KEYS[0];
      const off = camA + (DRONE.y - wy(KEYS[0])); // world → screen y offset
      st.world.setAttribute('transform', `translate(0 ${off.toFixed(1)})`);
      st.ridges.update(lt + 9);
      st.back.setAttribute('transform', `translate(${(-lt * 14).toFixed(1)} ${wy(CLOUD_A - 60).toFixed(1)})`);
      st.front.setAttribute('transform', `translate(${(-lt * 30).toFixed(1)} ${(wy(CLOUD_A - 200) + off).toFixed(1)})`);
      const sy = (alt0) => wy(alt0) + off;

      st.decades.forEach((el) => {
        const y = sy(el._a) - 9;
        el.style.top = `${y.toFixed(1)}px`;
        el.style.opacity = y > 120 && y < 1000 ? 1 : 0;
      });

      // Level tags pop as the drone reaches them
      st.levels.forEach((L, k) => {
        L.tag.style.top = `${(sy(L.tag._a) - 50).toFixed(1)}px`;
        ui.pop(L.tag, lt, k * T.SPB, { from: 0.6 });
        L.line.setAttribute('opacity', lt >= k * T.SPB - 0.3 ? 0.6 : 0.2);
      });

      const climbing = [1, 2, 3].some((k) => lt > k * T.SPB - 0.3 && lt < k * T.SPB + T.LEAD);
      const bob = Math.sin(lt * 5) * 5;
      st.drone.draw(P.quadPolys(P.QUAD.mavic4, { x: DRONE.x, y: DRONE.y + bob, s: DRONE.s, yaw: -20, pitch: climbing ? 2 : 8 }, { rotor: 1 }));

      // Counter shows the level just reached
      const k = U.clamp(Math.floor(lt / T.SPB + 1e-6), 0, REV.length - 1);
      st.count.set(REV[k].label);
      U.setText(st.countLbl, `REVENUE · ${REV[k].year} · EST.${REV[k].note ? ' · ' + REV[k].note : ''}`);
      const ce = ui.enter(lt, 0.02, 0.4);
      st.count.el.style.opacity = ce.o.toFixed(3);
      st.countLbl.style.opacity = U.clamp((lt - 0.15) * 5).toFixed(3);
      const pb = U.pulse(lt, T.SPB, 0.12);
      st.count.el.style.transform = `scale(${(1 + 0.04 * pb).toFixed(4)})`;
    },
  });
})((window.SX = window.SX || {}));
