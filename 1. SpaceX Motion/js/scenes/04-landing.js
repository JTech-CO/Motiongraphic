/* 04 LANDING — "그리고 돌아왔다."
   The booster falls in and decelerates on every beat; legs deploy on b3; touchdown on b4
   completes the 98.07% landing ring. The touchdown shock ring bursts into 05. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const PAD = { x: 1500, y: 900 };
  SX.L.padPoint = PAD;
  const KEYS = [300, 640, 820, 900]; // leg-tip y on b1..b4 (decelerating)
  const RING = { cx: 500, cy: 700, r: 180, w: 22 };

  function boosterY(lt) {
    if (lt < 0) return KEYS[0] + lt * 900;
    if (lt >= 1.5) return KEYS[3];
    const i = Math.floor(lt / T.SPB);
    return U.lerp(KEYS[i], KEYS[i + 1], E.outCubic(U.prog(lt, i * T.SPB, (i + 1) * T.SPB)));
  }

  SX.defineScene({
    id: 4,
    role: 'LANDING',
    bg: 'dark',
    ruler: (lt) => ({ from: D.landing.firstLandingYear, to: 2026, mark: SX.hud.hop(lt, [2015, 2018, 2022, 2026]) }),

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, PAD.x, PAD.y, C.flame, 0.2);

      const svg = U.svgFull();
      st.padG = U.s('g');
      [[220, 30, 0.32], [150, 21, 0.4], [80, 11, 0.5]].forEach(([rx, ry, o]) =>
        st.padG.appendChild(U.s('ellipse', { cx: PAD.x, cy: PAD.y, rx, ry, fill: 'none', stroke: C.paper, 'stroke-width': 1.5, opacity: o })));
      st.padG.append(
        U.s('line', { x1: 1100, y1: PAD.y, x2: 1900, y2: PAD.y, stroke: C.paper, 'stroke-width': 1, opacity: 0.3 }),
        U.s('path', { d: `M${PAD.x - 24} ${PAD.y} H${PAD.x + 24} M${PAD.x} ${PAD.y - 4} V${PAD.y + 4}`, stroke: C.paper, 'stroke-width': 2, opacity: 0.8 })
      );
      st.shock = [0, 1].map(() => U.s('ellipse', { cx: PAD.x, cy: PAD.y, fill: 'none', stroke: C.paper }));
      st.booster = SX.vehicles.f9Booster(C.paper, C.ink);
      st.bg = U.s('g', {}, st.booster.g);
      svg.append(st.padG, ...st.shock, st.bg);

      // Landing success ring
      st.ringSvg = U.svgFull();
      const ticks = U.s('g', { opacity: 0.3 });
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const r0 = RING.r + 22;
        const r1 = RING.r + (i % 10 === 0 ? 38 : 30);
        ticks.appendChild(U.s('line', {
          x1: RING.cx + r0 * Math.sin(a), y1: RING.cy - r0 * Math.cos(a),
          x2: RING.cx + r1 * Math.sin(a), y2: RING.cy - r1 * Math.cos(a),
          stroke: C.paper, 'stroke-width': 1.5,
        }));
      }
      st.ticks = ticks;
      st.ringSvg.appendChild(ticks);
      st.ring = ui.ring(st.ringSvg, { ...RING, color: C.flame, track: C.paper, trackOpacity: 0.14 });
      cam.append(st.ringSvg, svg);

      st.pct = ui.counter(cam, { x: RING.cx, y: RING.cy - 58, size: 84, align: 'center' });
      st.frac = U.h('div', { class: 'mono', style: `left:${RING.cx - 200}px;width:400px;text-align:center;top:${RING.cy + 44}px;font-size:22px` });
      st.lbl = U.h('div', { class: 'mono', style: `left:${RING.cx - 300}px;width:600px;text-align:center;top:${RING.cy + RING.r + 50}px;font-size:15px;opacity:.75`, text: 'STAGE 1 LANDINGS · SUCCESS / ATTEMPTS' });
      cam.append(st.frac, st.lbl);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'FALCON 9 / STAGE 1 RECOVERY' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 150, lines: ['그리고 돌아왔다.'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      // Booster: per-beat deceleration, legs on b3, touchdown on b4
      const y = boosterY(lt);
      const sq = lt >= 1.5 ? 1 - 0.018 * Math.sin(U.prog(lt, 1.5, 1.66) * Math.PI) : 1;
      st.bg.setAttribute('transform', `translate(${PAD.x} ${y.toFixed(2)}) scale(1 ${sq.toFixed(4)})`);
      st.booster.setLegs(E.spring(U.prog(lt, 0.95, 1.4)));
      const burn = lt < 1.5 ? 1 : 0;
      st.booster.setPlume(burn * (90 + 70 * U.noise1(lt * 26, 5)), 34 + 6 * U.noise1(lt * 18, 2));

      const near = U.prog(lt, 0.2, 1.5);
      st.glow.style.opacity = (0.25 + 0.75 * near * (lt < 1.5 ? 1 : 1 - U.prog(lt, 1.5, 1.9) * 0.6)).toFixed(3);
      ui.breathe(st.glow, lt, 0.08);

      const pe = ui.enter(lt, 0, 0.4);
      st.padG.setAttribute('opacity', pe.o.toFixed(3));

      // Touchdown shock rings (pre-roll of the ring burst)
      st.shock.forEach((el, i) => {
        const q = U.prog(lt, 1.5 + i * 0.09, 1.95 + i * 0.05);
        if (lt < 1.5 + i * 0.09) {
          el.setAttribute('opacity', 0);
          return;
        }
        const rx = 140 + 760 * E.outCubic(q);
        el.setAttribute('rx', rx.toFixed(1));
        el.setAttribute('ry', (rx * 0.15).toFixed(1));
        el.setAttribute('stroke-width', (4 - 2.5 * q).toFixed(2));
        el.setAttribute('opacity', (0.8 * (1 - q)).toFixed(3));
      });

      // Ring: completes exactly on touchdown (b4) and holds
      const rp = E.outCubic(U.prog(lt, 0, 1.5));
      st.ring.set((D.landing.ratePct / 100) * rp);
      st.pct.set(`${U.fmtFixed(D.landing.ratePct * rp, 2)}%`);
      U.setText(st.frac, `${Math.round(D.landing.success * rp)} / ${D.landing.attempts}`);
      const re = ui.enter(lt, 0, 0.5);
      const pb = lt >= 1.5 ? U.pulse(lt - 1.5, 10, 0.12) : 0;
      st.ringSvg.style.transformOrigin = `${RING.cx}px ${RING.cy}px`;
      st.ringSvg.style.transform = `scale(${(U.lerp(0.8, 1, re.e) + 0.03 * pb).toFixed(4)})`;
      st.ringSvg.style.opacity = re.o.toFixed(3);
      st.ticks.setAttribute('transform', `rotate(${(lt * 12).toFixed(2)} ${RING.cx} ${RING.cy})`);
      [st.pct.el, st.frac, st.lbl].forEach((el, i) => {
        const e = ui.enter(lt, 0.08 + i * 0.05, 0.4);
        el.style.opacity = (e.o * (i === 2 ? 0.75 : 1)).toFixed(3);
        el.style.transform = `translate3d(0,${((1 - e.e) * 24).toFixed(1)}px,0) scale(${(1 + 0.04 * pb).toFixed(4)})`;
      });
    },
  });
})((window.SX = window.SX || {}));
