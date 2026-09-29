/* 02 FAILURE — "세 번 실패하고,"
   Five Falcon 1 launch slots. FAILED stamps land on b1–b3 (2006, 2007, 2008),
   slot 4 lights on b4. A trajectory arc springs from slot 4's nose and
   widens until it floods the frame orange (arc wipe into 03). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const SLOT_X0 = 140;
  const SLOT_STEP = 337;
  const SLOT_Y = 470;
  const ROTS = [-12, -7, -15];

  SX.defineScene({
    id: 2,
    role: 'FAILURE',
    bg: 'paper',
    ruler: (lt) => ({ from: 2006, to: 2009, mark: SX.hud.hop(lt, [2006, 2007, 2008, 2008]) }),

    build(cam) {
      const st = { slots: [], stamps: [] };
      st.grid = U.h('div', { class: 'blueprint' });
      cam.appendChild(st.grid);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `FALCON 1 / ${D.falcon1.site}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 150, lines: ['세 번 실패하고,'] });

      st.meta1 = U.h('div', { class: 'mono', style: 'right:120px;top:236px;font-size:18px', text: `FALCON 1 · ${D.falcon1.attempts} ATTEMPTS` });
      st.meta2 = U.h('div', { class: 'mono', style: 'right:120px;top:266px;font-size:18px' });
      cam.append(st.meta1, st.meta2);

      D.falcon1.flights.forEach((f, k) => {
        const x = SLOT_X0 + k * SLOT_STEP;
        const el = U.h('div', { class: 'slot', style: `left:${x}px;top:${SLOT_Y}px` });
        const fill = U.h('div', { class: 'slot-fill', style: 'clip-path:inset(100% 0 0 0)' });
        const top = U.h('div', { class: 'slot-top' }, U.h('span', { text: `FLIGHT ${U.pad(f.n)}` }), U.h('span', { text: 'F1' }));
        const year = U.h('div', { class: 'slot-year', text: String(f.year) });
        const status = U.h('span', { text: '—' });
        const bottom = U.h('div', { class: 'slot-bottom' }, U.h('span', { text: D.falcon1.site }), status);

        const svg = U.s('svg', { width: 292, height: 440, viewBox: '0 0 292 440' });
        const tower = 'M198 400 V252 M208 400 V252 ' + [270, 292, 314, 336, 358, 380].map((y) => `M198 ${y} H208`).join(' ');
        svg.append(
          U.s('line', { x1: 56, y1: 400, x2: 236, y2: 400, stroke: C.ink, 'stroke-width': 2 }),
          U.s('path', { d: tower, stroke: C.ink, 'stroke-width': 1.5, fill: 'none', opacity: 0.55 })
        );
        const rocket = SX.vehicles.falcon1(C.ink, C.paper);
        const rg = U.s('g', { transform: 'translate(146 398)' }, rocket.g);
        svg.appendChild(rg);

        el.append(fill, svg, top, year, bottom);
        cam.appendChild(el);
        st.slots.push({ el, fill, rg, status, f, x });
        if (!f.ok) {
          st.stamps.push(ui.stamp(cam, {
            x: x + 146, y: SLOT_Y + 250, main: 'FAILED', sub: `FLIGHT ${U.pad(f.n)} · ${f.year}`, rot: ROTS[k], color: C.flame,
          }));
        }
      });

      // Trajectory arc from slot 4's rocket nose, off the top-right edge
      const s4 = st.slots[3];
      st.arcPts = U.bezierPts([s4.x + 146, SLOT_Y + 176], [s4.x + 160, 380], [1560, 150], [2140, 80], 90);
      st.arcAcc = U.polyLengths(st.arcPts);
      st.arcSvg = U.svgFull();
      st.arc = U.s('path', { fill: 'none', stroke: C.flame, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      st.arcHead = U.s('circle', { r: 8, fill: C.flame });
      st.arcSvg.append(st.arc, st.arcHead);
      cam.appendChild(st.arcSvg);
      return st;
    },

    update(st, lt) {
      st.grid.style.transform = `translate3d(${(-lt * 14).toFixed(1)}px,${(-lt * 6).toFixed(1)}px,0)`;
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      const landed = [0, 1, 2].filter((k) => lt >= k * T.SPB).length;
      U.setText(st.meta2, `FAILURES ${U.pad(Math.max(0, landed))}`);
      st.meta1.style.opacity = st.meta2.style.opacity = U.clamp((lt + 0.1) * 4).toFixed(2);

      st.slots.forEach((sl, k) => {
        const en = ui.enter(lt, -T.LEAD + k * 0.05, 0.45);
        let y = (1 - en.e) * 120;
        const tLand = k * T.SPB;
        if (!sl.f.ok && lt >= tLand) y += Math.sin(U.prog(lt, tLand, tLand + 0.18) * Math.PI) * 10;
        sl.el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
        sl.el.style.opacity = (en.o * (k === 4 ? 0.55 : 1)).toFixed(3);

        if (!sl.f.ok) {
          const failed = lt >= tLand;
          sl.rg.style.opacity = failed ? 0.25 : 1;
          U.setText(sl.status, failed ? 'FAILED' : '—');
        }
      });

      // b4: slot 4 lights up (fill rises in the 4 frames before the beat)
      const s4 = st.slots[3];
      const lit = E.inCubic(U.prog(lt, 1.5 - T.LEAD, 1.5));
      s4.fill.style.clipPath = `inset(${((1 - lit) * 100).toFixed(2)}% 0 0 0)`;
      U.setText(s4.status, lt >= 1.5 ? 'ORBIT' : '—');
      const liftR = lt >= 1.5 ? -30 * E.outBack(U.prog(lt, 1.5, 1.85)) : 0;
      s4.rg.setAttribute('transform', `translate(146 ${(398 + liftR).toFixed(2)})`);

      st.stamps.forEach((sp, k) => sp.update(lt, k * T.SPB));

      // Arc: draws 1.6 → 1.867, then widens to cover the frame on the beat
      if (lt < 1.6) {
        st.arcSvg.style.display = 'none';
        return;
      }
      st.arcSvg.style.display = '';
      const total = st.arcAcc[st.arcAcc.length - 1];
      const len = total * E.outCubic(U.prog(lt, 1.6, 2.0 - T.LEAD));
      st.arc.setAttribute('d', U.pathD(U.slicePoly(st.arcPts, st.arcAcc, len)));
      const head = U.pointAt(st.arcPts, st.arcAcc, len);
      st.arcHead.setAttribute('cx', head.x.toFixed(1));
      st.arcHead.setAttribute('cy', head.y.toFixed(1));
      const w = 7 + 4600 * E.inCubic(U.prog(lt, 2.0 - T.LEAD, 2.0));
      st.arc.setAttribute('stroke-width', w.toFixed(1));
    },
  });
})((window.SX = window.SX || {}));
