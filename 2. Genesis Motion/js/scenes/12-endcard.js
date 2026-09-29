/* 12 END CARD — "그리고 이제, / 르망과 GV90." (6 beats)
   b1 headline · b2 GMR-001 streaks across, Le Mans 24H finish stamp · b3 two lines of light
   reveal the GV90 (5,285 mm) · b4 subcopy · b5 title + data date · b6 micro-motion only. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const V = D.gv90;
  const R = D.racing;

  const GV = { x0: 900, ground: 720, s: 0.17 };
  const GMR = { ground: 720, s: 0.15 };
  const LAMP_Y = SX.cars.anchor('gv90').map((p) => GV.ground - p[1] * GV.s);

  SX.defineScene({
    id: 12,
    role: 'END CARD',
    bg: 'dark',
    ruler: (lt) => {
      const y = U.lerp(2015, 2026, E.outCubic(U.prog(lt, 0, 2.0)));
      return { from: 2015, to: y, mark: y };
    },

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, GV.x0 + (V.lengthMm * GV.s) / 2, GV.ground - 150, C.copper, 0.14);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${R.car} / GV90 · ${V.code}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['그리고 이제,', '르망과 GV90.'], lineDelay: [null, 1.0] });

      const svg = U.svgFull();
      const defs = U.s('defs');
      const clip = U.s('clipPath', { id: 'gv90-reveal' });
      st.clipRect = U.s('rect', { x: 0, y: 0, width: 0, height: T.H });
      clip.appendChild(st.clipRect);
      defs.appendChild(clip);
      svg.appendChild(defs);

      st.road = U.s('line', { x1: 120, x2: 1800, y1: GV.ground, y2: GV.ground, stroke: C.paper, 'stroke-width': 1, opacity: 0.25 });
      svg.appendChild(st.road);
      st.beams = LAMP_Y.map((y) => {
        const l = U.s('line', { y1: y, y2: y, stroke: C.paper, 'stroke-width': 3, 'stroke-linecap': 'round' });
        svg.appendChild(l);
        return l;
      });
      st.gvG = U.s('g', { 'clip-path': 'url(#gv90-reveal)' });
      svg.appendChild(st.gvG);
      st.gv = SX.cars.build(st.gvG, 'gv90', { body: C.paper, window: C.black, detail: C.black, chrome: C.copper, tire: C.black, rim: '#8E8A84', lamp: C.magma });
      st.gv.place(GV.x0, GV.ground, GV.s);

      st.gmr = SX.cars.build(svg, 'gmr', { body: C.paper, window: C.black, detail: C.black, tire: C.black, rim: C.magma, lamp: C.magma });
      st.gmrStreaks = [0, 1, 2].map((i) => {
        const l = U.s('line', { stroke: C.paper, 'stroke-width': 2, opacity: 0.5 });
        svg.appendChild(l);
        return l;
      });

      const x1 = GV.x0;
      const x2 = GV.x0 + V.lengthMm * GV.s;
      st.dim = U.s('g', { stroke: C.paper, 'stroke-width': 1.5, fill: 'none' });
      st.dim.append(U.s('path', { d: `M${x1} ${GV.ground + 22} V${GV.ground + 40} M${x2} ${GV.ground + 22} V${GV.ground + 40} M${x1} ${GV.ground + 31} H${x2}` }));
      svg.appendChild(st.dim);
      cam.appendChild(svg);

      st.dimLbl = U.h('div', { class: 'mono', style: `left:${x1}px;width:${x2 - x1}px;text-align:center;top:${GV.ground + 44}px;font-size:14px`, text: `LENGTH ${U.fmtInt(V.lengthMm)} MM · REVEALED ${V.reveal}` });
      cam.appendChild(st.dimLbl);

      st.stamp = ui.stamp(cam, { x: 1560, y: 272, main: 'LE MANS 24H', sub: `${R.leMans} · FINISHED · ${R.car}`, rot: -6, color: C.magma });
      st.sub = ui.headline(cam, { x: 122, y: 548, size: 30, stagger: 0.012, lines: [`GV90 · ${V.reveal} 공개`, 'Genesis Magma Racing 르망 24시 첫 완주'] });
      st.sub.el.classList.add('subcopy');
      st.title = ui.headline(cam, { x: 116, y: 812, size: 96, stagger: 0.028, lines: ['GENESIS 2015—2026'] });
      st.title.el.classList.add('title');
      st.date = ui.caption(cam, { x: 122, y: 928, text: `DATA AS OF ${D.asOf}` });
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.04);
      st.cap.update(lt, 0);
      st.head.update(lt, 0);
      st.sub.update(lt, 1.5);
      st.title.update(lt, 2.0);
      st.date.update(lt, 2.12);
      st.road.setAttribute('opacity', (0.25 * U.clamp(lt * 4)).toFixed(3));

      // b2: GMR-001 streaks across (Le Mans)
      const gp = U.prog(lt, T.SPB - 0.05, 2 * T.SPB + 0.05);
      const Lg = 5100 * GMR.s;
      const gx = U.lerp(-Lg - 120, T.W + 120, E.inOutSine(gp));
      const gOn = gp > 0 && gp < 1;
      st.gmr.g.setAttribute('opacity', gOn ? 1 : 0);
      st.gmr.place(gx, GMR.ground, GMR.s);
      st.gmr.setWheels(gp * 80);
      st.gmrStreaks.forEach((l, i) => {
        const y = GMR.ground - (180 + i * 40) * (GMR.s / 0.15) * 0.9;
        l.setAttribute('x1', (gx - 520 + i * 90).toFixed(1));
        l.setAttribute('x2', (gx - 40).toFixed(1));
        l.setAttribute('y1', y.toFixed(1));
        l.setAttribute('y2', y.toFixed(1));
        l.setAttribute('opacity', gOn ? 0.5 : 0);
      });
      st.stamp.update(lt, 2 * T.SPB);

      // b3: two lines of light, then the GV90 is revealed front → rear
      const lp = E.outExpo(U.prog(lt, 2 * T.SPB, 2 * T.SPB + 0.2));
      const front = GV.x0 + V.lengthMm * GV.s;
      st.beams.forEach((l) => {
        l.setAttribute('x1', (front - (front - GV.x0 + 120) * lp).toFixed(1));
        l.setAttribute('x2', (front + 30).toFixed(1));
        l.setAttribute('opacity', lp > 0 ? (0.9 * (1 - 0.6 * U.prog(lt, 1.5, 1.9))).toFixed(3) : 0);
      });
      const rv = E.inOutCubic(U.prog(lt, 1.1, 1.45));
      const rx = front + 40 - (front - GV.x0 + 80) * rv;
      st.clipRect.setAttribute('x', rx.toFixed(1));
      st.clipRect.setAttribute('width', Math.max(0, front + 60 - rx).toFixed(1));
      st.gv.setLamps(U.clamp((lt - 1.1) * 6));
      st.gv.setWheels(lt * 0.6);
      const dp = U.prog(lt, 1.3, 1.6);
      st.dim.setAttribute('opacity', U.clamp(dp * 3).toFixed(3));
      st.dimLbl.style.opacity = U.clamp((lt - 1.35) * 5).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
