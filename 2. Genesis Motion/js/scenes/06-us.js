/* 06 US — "미국에선 / 12배,"
   US annual sales (§5.4, CarBuzz B column) draw as a line 2016 → 2025. Infiniti appears only as
   its three data points (no line: the file has no series between them). A cross marker flags
   the 2024 pass; "~12×" lands on b4. Exit: motion-blur slide (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const X = (year) => 840 + (year - 2016) * 104;
  const Y = (v) => 880 - v * (580 / 150000);
  const PTS = D.us.map((p) => [X(p.year), Y(p.v)]);
  // Segment windows: 2016→2019 (b1), 2019→2022 (b2), 2022→2025 (b3)
  const WIN = [[0, 0.5], [0.5, 1.0], [1.0, 1.35]];
  const PASS = D.us.findIndex((p) => p.year === D.usPassYear);

  function headAt(lt) {
    // returns fractional index along PTS (0..9)
    for (let k = WIN.length - 1; k >= 0; k--) {
      if (lt >= WIN[k][0]) return k * 3 + 3 * E.inOutSine(U.prog(lt, WIN[k][0], WIN[k][1]));
    }
    return 0;
  }

  SX.defineScene({
    id: 6,
    role: 'US',
    bg: 'paper',
    ruler: (lt) => ({ from: 2016, to: 2025, mark: 2016 + headAt(lt) }),

    build(cam) {
      const st = {};
      st.tex = U.h('div', { class: 'diamonds' });
      cam.appendChild(st.tex);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'UNITED STATES / ANNUAL SALES' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['미국에선', '12배,'] });

      const svg = U.svgFull();
      st.axis = U.s('g');
      [50000, 100000, 150000].forEach((v) => {
        st.axis.append(
          U.s('line', { x1: 830, x2: 1800, y1: Y(v), y2: Y(v), stroke: C.ink, 'stroke-width': 1, opacity: 0.16 }),
          U.s('text', { x: 818, y: Y(v) + 5, 'text-anchor': 'end', fill: C.ink, 'font-size': 13, opacity: 0.6, style: 'font-family:var(--f-mono);letter-spacing:.08em', text: `${v / 1000}K` })
        );
      });
      st.axis.appendChild(U.s('line', { x1: 830, x2: 1800, y1: 880, y2: 880, stroke: C.ink, 'stroke-width': 1.5, opacity: 0.5 }));
      D.us.forEach((p) => st.axis.appendChild(U.s('text', { x: X(p.year), y: 906, 'text-anchor': 'middle', fill: C.ink, 'font-size': 13, opacity: 0.65, style: 'font-family:var(--f-mono);letter-spacing:.06em', text: String(p.year) })));
      svg.appendChild(st.axis);

      st.line = U.s('path', { fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      svg.appendChild(st.line);
      st.dots = PTS.map(([x, y]) => {
        const c = U.s('circle', { cx: x, cy: y, r: 0, fill: C.ink });
        svg.appendChild(c);
        return c;
      });
      st.inf = D.infiniti.map((p) => {
        const c = U.s('circle', { cx: X(p.year), cy: Y(p.v), r: 0, fill: C.paper, stroke: C.copper, 'stroke-width': 3 });
        svg.appendChild(c);
        return c;
      });
      st.cross = U.s('g', { stroke: C.magma, 'stroke-width': 3, fill: 'none' });
      const [px, py] = PTS[PASS];
      st.cross.append(U.s('circle', { cx: px, cy: py, r: 24 }), U.s('path', { d: `M${px - 40} ${py} H${px - 28} M${px + 28} ${py} H${px + 40} M${px} ${py - 40} V${py - 28} M${px} ${py + 28} V${py + 40}` }));
      svg.appendChild(st.cross);
      cam.appendChild(svg);

      st.infLbls = D.infiniti.map((p, i) => {
        const el = U.box(X(p.year) + (i === 0 ? 18 : -8), Y(p.v) + (i === 0 ? -10 : 16), 'mono', i === 0 ? `INFINITI ${U.fmtInt(p.v)}` : U.fmtInt(p.v));
        el.style.cssText += `font-size:13px;color:${C.copper};${i ? 'transform-origin:100% 0' : ''}`;
        if (i) el.style.transform = 'translateX(-100%)';
        cam.appendChild(el);
        return el;
      });
      st.passLbl = U.box(px - 300, py - 78, 'mono', `PASSES INFINITI · ${D.usPassYear}`);
      st.passLbl.style.cssText += `font-size:14px;color:${C.magma}`;
      st.first = U.box(PTS[0][0] - 20, PTS[0][1] + 16, 'mono', U.fmtInt(D.us[0].v));
      st.first.style.fontSize = '14px';
      st.last = U.box(PTS[9][0] - 150, PTS[9][1] - 56, 'mono', '');
      st.last.style.cssText += 'width:150px;text-align:right';
      st.last.appendChild(U.h('b', { text: U.fmtInt(D.us[9].v), style: 'font-family:var(--f-display);font-weight:900;font-size:30px;letter-spacing:-.01em' }));
      cam.append(st.passLbl, st.first, st.last);

      st.mult = ui.counter(cam, { x: 120, y: 560, size: 190 });
      st.mult.set(`~${D.usMultiple}×`);
      st.multLbl = U.box(124, 772, 'mono', `2016 ${U.fmtInt(D.us[0].v)} → 2025 ${U.fmtInt(D.us[9].v)}`);
      cam.appendChild(st.multLbl);
      return st;
    },

    update(st, lt) {
      st.tex.style.transform = `translate3d(${(-lt * 10).toFixed(1)}px,${(lt * 6).toFixed(1)}px,0)`;
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      st.axis.setAttribute('opacity', U.clamp((lt + 0.1) * 5).toFixed(3));

      const h = headAt(lt);
      const i = Math.floor(h);
      const f = h - i;
      const pts = PTS.slice(0, i + 1);
      if (i < PTS.length - 1) pts.push([U.lerp(PTS[i][0], PTS[i + 1][0], f), U.lerp(PTS[i][1], PTS[i + 1][1], f)]);
      st.line.setAttribute('d', U.pathD(pts));
      st.dots.forEach((c, k) => {
        const reached = h >= k - 1e-6;
        c.setAttribute('r', reached ? (6 * E.outBack(U.clamp((h - k) * 3 + 0.34))).toFixed(2) : 0);
      });
      st.first.style.opacity = U.clamp(lt * 6).toFixed(3);
      ui.pop(st.last, lt, 1.35, { from: 0.6 });

      st.inf.forEach((c, k) => {
        const t0 = 1.0 + k * 0.1;
        const p = U.prog(lt, t0, t0 + 0.25);
        c.setAttribute('r', lt < t0 ? 0 : (9 * E.outBack(p, 2.2)).toFixed(2));
        st.infLbls[k].style.opacity = U.clamp((lt - t0) * 6).toFixed(3);
      });
      const cp = U.prog(lt, 1.23, 1.45);
      st.cross.setAttribute('opacity', lt < 1.23 ? 0 : U.clamp(cp * 4).toFixed(3));
      const [px, py] = PTS[PASS];
      st.cross.setAttribute('transform', `translate(${px} ${py}) scale(${U.lerp(1.8, 1, E.outBack(cp)).toFixed(3)}) translate(${-px} ${-py}) rotate(${(lt * 20).toFixed(1)} ${px} ${py})`);
      st.passLbl.style.opacity = U.clamp((lt - 1.3) * 6).toFixed(3);

      ui.pop(st.mult.el, lt, 1.5, { from: 0.55, s: 2.6 });
      st.multLbl.style.opacity = U.clamp((lt - 1.55) * 6).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
