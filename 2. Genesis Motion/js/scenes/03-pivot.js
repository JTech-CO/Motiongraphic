/* 03 PIVOT — "SUV로 / 판을 바꿨고,"
   The G80 (DH) sedan morphs into the GV80 (JX1) SUV while its name gains a "V" (G80 → GV80).
   2019 77,135 → 2020 132,450 (+71.7%). On b4 the two-line lamps light for the first time;
   their beams stretch into the 200,000 threshold and baseline of scene 04 (match cut). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const CAR = { x0: 760, ground: 820, s: 0.2 };
  const NAME = { x: 1080, y: 300 };
  SX.L.pivotCar = CAR;
  SX.L.pivotName = NAME;
  const BAR = { base: 900, w: 130, xs: [120, 300], k: 300 / 132450 };

  SX.defineScene({
    id: 3,
    role: 'PIVOT',
    bg: 'copper',
    ruler: (lt) => ({ from: 2019, to: 2020, mark: SX.hud.hop(lt, [2019, 2019, 2020, 2020]) }),

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, 1270, 640, C.paper, 0.16);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `GV80 / ${D.gv80.code} · ${D.gv80.date}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['SUV로', '판을 바꿨고,'] });

      st.svg = U.svgFull();
      st.beams = [0, 1].map(() => U.s('line', { stroke: C.paper, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }));
      st.morph = SX.cars.morph(st.svg, 'dh', 'gv80', {
        body: C.ink, window: C.glacier, detail: C.copper, chrome: C.paper, para: C.paper,
        tire: C.black, rim: '#7A4F33', lamp: C.paper, lampA: C.glacier,
      });
      st.svg.append(...st.beams);

      // Bars 2019 / 2020
      st.bars = [D.pivot.y2019, D.pivot.y2020].map((v, i) => {
        const r = U.s('rect', { x: BAR.xs[i], width: BAR.w, fill: i ? C.ink : 'none', stroke: C.ink, 'stroke-width': 3 });
        st.svg.appendChild(r);
        return r;
      });
      cam.appendChild(st.svg);
      st.yearLbls = [2019, 2020].map((y, i) => {
        const el = U.box(BAR.xs[i], BAR.base + 12, 'mono', String(y));
        el.style.width = `${BAR.w}px`;
        el.style.textAlign = 'center';
        cam.appendChild(el);
        return el;
      });
      st.v2019 = U.box(BAR.xs[0], 0, 'mono', U.fmtInt(D.pivot.y2019));
      st.v2019.style.cssText += `width:${BAR.w}px;text-align:center;font-size:18px`;
      cam.appendChild(st.v2019);
      st.count = ui.counter(cam, { x: BAR.xs[1] + BAR.w / 2, y: 0, size: 40, align: 'center' });
      st.yoy = ui.chip(cam, BAR.xs[1] + BAR.w + 18, 0, `+${D.pivot.yoyPct}%`, null);

      // Name label: G + V + 80
      st.nG = U.h('span', { text: 'G' });
      st.nVGlyph = U.h('span', { text: 'V', style: 'display:inline-block' });
      st.nV = U.h('span', {}, st.nVGlyph);
      st.n80 = U.h('span', { text: '80' });
      st.name = U.h('div', { class: 'model-name', style: `left:${NAME.x}px;top:${NAME.y}px;transform-origin:0 0` }, st.nG, st.nV, st.n80);
      st.date = U.box(NAME.x + 4, NAME.y + 138, 'mono', `${D.gv80.code} · ${D.gv80.date} · FIRST SUV`);
      cam.append(st.name, st.date);
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.05);
      const out = ui.exit(lt, 1.62, 0.26);
      st.cap.update(lt, 0, 1.62);
      st.head.update(lt, 0.02, 1.62);

      // Sedan → SUV morph on b2–b3
      const m = E.inOutCubic(U.prog(lt, 0.5, 1.2));
      st.morph.set(m);
      const drive = 1500 * E.inExpo(U.prog(lt, 1.62, 2.0));
      st.morph.place(CAR.x0 + drive, CAR.ground, CAR.s);
      const lamp = E.outCubic(U.prog(lt, 1.5 - T.LEAD, 1.5));
      st.morph.setLamps(lamp);

      // Name: the V slides in with the morph
      // Measure the glyph itself (not the clipped wrapper) so the width never feeds back frame to frame
      const vNat = st.nVGlyph.offsetWidth || 80;
      const ve = E.spring(U.prog(lt, 0.5, 0.95));
      st.nV.style.width = `${(vNat * U.clamp(ve, 0, 1.2)).toFixed(1)}px`;
      st.nV.style.transform = `scale(${U.clamp(ve, 0, 1.2).toFixed(3)})`;
      st.name.style.opacity = (1 - out).toFixed(3);
      st.name.style.transform = `translate3d(0,${(-out * 60).toFixed(1)}px,0)`;
      const de = ui.enter(lt, 0.55, 0.4);
      st.date.style.opacity = (de.o * (1 - out)).toFixed(3);

      // Bars: 2019 from the start, 2020 grows on b3 and lands on b4
      const e19 = ui.enter(lt, 0, 0.45);
      const h19 = D.pivot.y2019 * BAR.k * U.clamp(e19.e, 0, 1.1);
      const p20 = E.outCubic(U.prog(lt, 1.0, 1.5));
      const h20 = D.pivot.y2020 * BAR.k * p20;
      const barOut = 1 - out;
      [[st.bars[0], h19], [st.bars[1], h20]].forEach(([r, h]) => {
        r.setAttribute('y', (BAR.base - h * barOut).toFixed(1));
        r.setAttribute('height', Math.max(0, h * barOut).toFixed(1));
      });
      st.yearLbls.forEach((el) => (el.style.opacity = (e19.o * barOut).toFixed(3)));
      st.v2019.style.top = `${(BAR.base - h19 - 30).toFixed(1)}px`;
      st.v2019.style.opacity = (e19.o * barOut).toFixed(3);
      st.count.set(U.fmtInt(D.pivot.y2020 * p20));
      st.count.el.style.top = `${(BAR.base - h20 - 52).toFixed(1)}px`;
      st.count.el.style.opacity = (U.clamp((lt - 1.0) * 8) * barOut).toFixed(3);
      st.yoy.style.top = `${(BAR.base - D.pivot.y2020 * BAR.k - 4).toFixed(1)}px`;
      ui.pop(st.yoy, lt, 1.5, { from: 0.5 });
      if (out > 0) st.yoy.style.opacity = (1 - out).toFixed(3);

      // Lamp beams → scene 04 threshold (y 420) and baseline (y 900)
      const chart = SX.L.chart;
      const b = E.inOutCubic(U.prog(lt, 1.55, 2.0));
      const lampY = [CAR.ground - 1030 * CAR.s, CAR.ground - 962 * CAR.s];
      const lampX = CAR.x0 + 4930 * CAR.s;
      st.beams.forEach((l, i) => {
        const y = U.lerp(lampY[i], i ? chart.base : chart.thrY, b);
        const x2 = U.lerp(lampX + 40 * lamp, chart.x1, b);
        const x1 = U.lerp(lampX, chart.x0, b);
        l.setAttribute('x1', x1.toFixed(1));
        l.setAttribute('x2', x2.toFixed(1));
        l.setAttribute('y1', y.toFixed(1));
        l.setAttribute('y2', y.toFixed(1));
        l.setAttribute('opacity', lt >= 1.5 - T.LEAD ? lamp : 0);
        l.setAttribute('stroke-width', U.lerp(4, i ? 1.5 : 2, b).toFixed(2));
      });
    },
  });
})((window.SX = window.SX || {}));
