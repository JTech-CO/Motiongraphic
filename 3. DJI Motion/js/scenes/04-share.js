/* 04 SHARE — "하늘에서 잡힌 드론 / 열에 여덟,"
   Night topographic map from straight above. A radar sweep passes over 1,000 detection dots and colours them
   by maker (Dedrone 2025: DJI 83.48 / DIY·FPV 9.82 / Autel 1.40 / other 5.30 → 835 : 98 : 14 : 53 dots,
   largest-remainder rounding; labels use the source values). 83.48% lands on b3, legend on b4.
   Exit: FPV dive (transitions.js) through the radar centre. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const R = { cx: 1440, cy: 600, r: 360 };
  SX.L.radar = R;
  const SWEEP = [0.25, 1.0]; // one full revolution, lands on b3

  /** Largest-remainder split of 1,000 dots */
  function allocate(parts, total) {
    const raw = parts.map((p) => (p.pct / 100) * total);
    const n = raw.map(Math.floor);
    let left = total - n.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
      if (left > 0) {
        n[i]++;
        left--;
      }
    });
    return n;
  }

  SX.defineScene({
    id: 4,
    role: 'SHARE',
    bg: 'night',
    ruler: () => ({ from: 2025, to: 2025, mark: 2025 }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.map = U.s('g');
      st.contours = SX.land.contours(st.map, { hills: 9, levels: 8, seed: 404, color: ui.tone(C.night, 0.42), op: 0.55, sw: 1.3 });
      svg.appendChild(st.map);

      // Radar scope
      const scope = U.s('g', { fill: 'none', stroke: C.mist });
      for (let k = 1; k <= 4; k++) scope.appendChild(U.s('circle', { cx: R.cx, cy: R.cy, r: (R.r * k) / 4, 'stroke-width': k === 4 ? 2.5 : 1.2, opacity: k === 4 ? 0.7 : 0.3 }));
      scope.append(
        U.s('line', { x1: R.cx - R.r, x2: R.cx + R.r, y1: R.cy, y2: R.cy, 'stroke-width': 1, opacity: 0.25 }),
        U.s('line', { x1: R.cx, x2: R.cx, y1: R.cy - R.r, y2: R.cy + R.r, 'stroke-width': 1, opacity: 0.25 })
      );
      for (let a = 0; a < 72; a++) {
        const th = (a / 72) * Math.PI * 2;
        const l = a % 6 === 0 ? 16 : 7;
        scope.appendChild(U.s('line', { x1: R.cx + Math.cos(th) * R.r, y1: R.cy + Math.sin(th) * R.r, x2: R.cx + Math.cos(th) * (R.r + l), y2: R.cy + Math.sin(th) * (R.r + l), 'stroke-width': 1.5, opacity: 0.6 }));
      }
      st.scope = scope;
      svg.appendChild(scope);
      st.wedge = U.s('path', { fill: C.mist, opacity: 0.1 });
      st.arm = U.s('line', { stroke: C.mist, 'stroke-width': 3, 'stroke-linecap': 'round' });
      svg.append(st.wedge, st.arm);
      cam.appendChild(svg);

      st.cv = U.h('canvas', { class: 'full', width: T.W, height: T.H });
      cam.appendChild(st.cv);
      st.ctx = st.cv.getContext('2d');

      // Dots: uniform in the disc, categories shuffled
      const parts = D.detections.parts;
      const counts = allocate(parts, 1000);
      const cols = [C.beacon, C.mist, C.sky, ui.tone(C.ridge, 0.25)];
      const cat = [];
      counts.forEach((c, i) => {
        for (let k = 0; k < c; k++) cat.push(i);
      });
      const r = U.rng(4848);
      for (let i = cat.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [cat[i], cat[j]] = [cat[j], cat[i]];
      }
      st.dots = cat.map((c) => {
        const rr = Math.sqrt(0.02 + r() * 0.98) * (R.r - 10);
        const th = r() * Math.PI * 2;
        const ang = U.mod(th + Math.PI / 2, Math.PI * 2); // angle measured clockwise from 12 o'clock
        return { x: R.cx + Math.cos(th) * rr, y: R.cy + Math.sin(th) * rr, c, col: cols[c], ang, ph: r() };
      });
      st.djiTotal = counts[0];

      st.count = ui.counter(cam, { x: 120, y: 560, size: 164 });
      st.countLbl = U.box(124, 732, 'mono', `DRONE DETECTIONS · ${D.detections.year} · ${D.detections.source}`);
      cam.appendChild(st.countLbl);
      st.legend = parts.slice(1).map((p, i) => {
        const el = U.h('div', { class: 'tag', style: `left:124px;top:${790 + i * 44}px;border-left-color:${cols[i + 1]}` });
        el.appendChild(U.h('b', { text: `${p.pct.toFixed(2)}%` }));
        el.appendChild(document.createTextNode(p.key));
        cam.appendChild(el);
        return el;
      });
      st.djiTag = ui.tag(cam, R.cx + R.r + 30, R.cy - 20, 'DJI');
      st.djiTag.style.borderLeftColor = C.beacon;

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `DRONE DETECTIONS / ${D.detections.year} · ${D.detections.source}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 104, lines: ['하늘에서 잡힌 드론', '열에 여덟,'], lineDelay: [null, 1.5] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      // Pitch-down arrival: the map settles from a slight tilt, then drifts like a hovering camera
      const arrive = ui.settle(lt, 0.35);
      st.map.setAttribute('transform', `translate(${(-lt * 14).toFixed(1)} ${(arrive * 120).toFixed(1)}) rotate(${(lt * 1.2).toFixed(3)} 960 540)`);

      const sw = U.prog(lt, SWEEP[0], SWEEP[1]);
      const th = -Math.PI / 2 + sw * Math.PI * 2 + Math.max(0, lt - SWEEP[1]) * 2.6;
      const x2 = R.cx + Math.cos(th) * R.r;
      const y2 = R.cy + Math.sin(th) * R.r;
      st.arm.setAttribute('x1', R.cx);
      st.arm.setAttribute('y1', R.cy);
      st.arm.setAttribute('x2', x2.toFixed(1));
      st.arm.setAttribute('y2', y2.toFixed(1));
      st.arm.setAttribute('opacity', lt >= SWEEP[0] ? 0.9 : 0);
      const tail = 0.9;
      const a0 = th - tail;
      st.wedge.setAttribute('d', `M${R.cx} ${R.cy}L${(R.cx + Math.cos(a0) * R.r).toFixed(1)} ${(R.cy + Math.sin(a0) * R.r).toFixed(1)}A${R.r} ${R.r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`);
      st.wedge.setAttribute('opacity', lt >= SWEEP[0] ? 0.1 : 0);

      // Dots: settle in during b1, coloured once the sweep passes them
      const ctx = st.ctx;
      ctx.clearRect(0, 0, T.W, T.H);
      const swept = sw * Math.PI * 2;
      let dji = 0;
      const dim = ui.tone(C.night, 0.45);
      for (const d of st.dots) {
        const inP = U.clamp((lt - d.ph * 0.25) / 0.12);
        if (inP <= 0) continue;
        const on = lt >= SWEEP[1] || (lt >= SWEEP[0] && d.ang <= swept);
        if (on && d.c === 0) dji++;
        ctx.fillStyle = on ? d.col : dim;
        const age = on ? U.clamp((swept - d.ang) * 3 + (lt >= SWEEP[1] ? 1 : 0)) : 0;
        const rad = (on ? 4.2 + 3 * (1 - age) : 3) * inP;
        ctx.beginPath();
        ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      const shown = lt >= SWEEP[1] ? D.detections.parts[0].pct : (dji / st.djiTotal) * D.detections.parts[0].pct;
      st.count.set(`${shown.toFixed(2)}%`);
      st.count.el.style.opacity = U.clamp((lt - 0.2) * 6).toFixed(3);
      st.countLbl.style.opacity = U.clamp((lt - 0.3) * 6).toFixed(3);
      const pb = lt >= SWEEP[1] ? U.pulse(lt - SWEEP[1], 10, 0.14) : 0;
      st.count.el.style.transform = `scale(${(1 + 0.05 * pb).toFixed(4)})`;
      st.legend.forEach((el, i) => ui.pop(el, lt, 1.5 + i * T.E16, { from: 0.6 }));
      ui.pop(st.djiTag, lt, 1.0, { from: 0.6 });
    },
  });
})((window.SX = window.SX || {}));
