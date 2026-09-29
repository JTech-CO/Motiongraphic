/* 06 CADENCE — "1년에 / 170번."
   Launches per year (§2.2 "SpaceX 총 궤도/시험" only) grow section by section on b1–b3,
   2025 = 170 is highlighted on b4. Then the longest bar bends into a closed ring (→ 07). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const X0 = 850;
  const ROW_Y0 = 215;
  const ROW_H = 35;
  const BAR_H = 20;
  const MAXV = 170;
  const SCALE = 900 / MAXV;
  const STUB = 8;
  const LABELED = [2008, 2017, 2022, 2024, 2026];

  const ROWS = D.launchesByYear.map((r, i) => ({ ...r, i, y: ROW_Y0 + i * ROW_H }));
  const R2025 = ROWS.find((r) => r.year === 2025);
  SX.L.cadenceX0 = X0;
  SX.L.cadenceStub = STUB;
  SX.L.cadenceRows = ROWS.filter((r) => r.v != null).map((r) => ({ year: r.year, y: r.y }));

  const section = (i) => (i < 7 ? 0 : i < 14 ? 1 : 2);
  const growStart = (r) => section(r.i) * T.SPB + (r.i % 7) * 0.03;

  const hexToRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const mixHex = (a, b, p) => {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    return `rgb(${A.map((v, i) => Math.round(U.lerp(v, B[i], p))).join(',')})`;
  };

  /** Arc of length L starting at (sx, sy) heading +x, bending clockwise with curvature k */
  function bentBar(sx, sy, L, k, n = 140) {
    const pts = [];
    for (let j = 0; j <= n; j++) {
      const s = (L * j) / n;
      if (k < 1e-7) pts.push([sx + s, sy]);
      else {
        const th = s * k;
        pts.push([sx + Math.sin(th) / k, sy + (1 - Math.cos(th)) / k]);
      }
    }
    return pts;
  }

  SX.defineScene({
    id: 6,
    role: 'CADENCE',
    bg: 'paper',
    ruler: (lt) => ({ from: 2006, to: 2026, mark: SX.hud.hop(lt, [2012, 2019, 2026, 2025]) }),

    build(cam) {
      const st = {};
      st.grid = U.h('div', { class: 'blueprint' });
      cam.appendChild(st.grid);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'ORBITAL + TEST LAUNCHES / PER YEAR' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 170, lines: ['1년에', `${R2025.v}번.`] });

      const svg = U.svgFull();
      const defs = U.s('defs');
      const pat = U.s('pattern', { id: 'sx-hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
      pat.appendChild(U.s('rect', { width: 3, height: 8, fill: C.ink }));
      defs.appendChild(pat);
      svg.appendChild(defs);

      st.axis = U.s('g');
      [50, 100, 150].forEach((v) => {
        const x = X0 + v * SCALE;
        st.axis.append(
          U.s('line', { x1: x, y1: ROW_Y0 - 22, x2: x, y2: ROW_Y0 + 20 * ROW_H + 16, stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '3 6', opacity: 0.3 }),
          U.s('text', { x, y: ROW_Y0 - 32, 'text-anchor': 'middle', fill: C.ink, 'font-size': 14, style: 'font-family:var(--f-mono);letter-spacing:.1em', opacity: 0.6, text: String(v) })
        );
      });
      st.axis.appendChild(U.s('line', { x1: X0, y1: ROW_Y0 - 22, x2: X0, y2: ROW_Y0 + 20 * ROW_H + 16, stroke: C.ink, 'stroke-width': 2 }));
      svg.appendChild(st.axis);

      st.rows = ROWS.map((r) => {
        const yl = U.s('text', {
          x: X0 - 18, y: r.y + 5, 'text-anchor': 'end', fill: C.ink, 'font-size': 15,
          style: 'font-family:var(--f-mono);letter-spacing:.08em', text: String(r.year),
        });
        svg.appendChild(yl);
        const o = { r, yl };
        if (r.v != null) {
          o.bar = U.s('rect', { x: X0, y: r.y - BAR_H / 2, height: BAR_H, width: STUB, fill: r.ytd ? 'url(#sx-hatch)' : C.ink });
          svg.appendChild(o.bar);
          if (r.ytd) {
            o.outline = U.s('rect', { x: X0, y: r.y - BAR_H / 2, height: BAR_H, width: STUB, fill: 'none', stroke: C.ink, 'stroke-width': 2 });
            svg.appendChild(o.outline);
          }
          if (LABELED.includes(r.year)) {
            o.lbl = U.s('text', {
              y: r.y + 5, fill: C.ink, 'font-size': 15, style: 'font-family:var(--f-mono);letter-spacing:.08em',
              text: `${ui.approx(r.approx)}${r.v}${r.ytd ? ' YTD' : ''}`,
            });
            svg.appendChild(o.lbl);
          }
        } else {
          yl.setAttribute('opacity', 0.3); // year not in the table → left blank
        }
        return o;
      });

      st.hiLbl = U.s('text', {
        y: R2025.y + 11, fill: C.flame, 'font-size': 34,
        style: 'font-family:var(--f-display);font-weight:900', text: String(R2025.v),
      });
      st.bend = U.s('path', { fill: 'none', 'stroke-linejoin': 'round' });
      svg.append(st.hiLbl, st.bend);
      cam.appendChild(svg);
      return st;
    },

    update(st, lt) {
      st.grid.style.transform = `translate3d(${(-lt * 12).toFixed(1)}px,${(lt * 5).toFixed(1)}px,0)`;
      st.cap.update(lt, 0, 1.62);
      st.head.update(lt, 0.02, 1.62);

      const hi = U.prog(lt, 1.5 - T.LEAD, 1.5);
      const out = U.prog(lt, 1.62, 1.86);
      // "170" in the headline turns flame on b4
      st.head.units.forEach((u) => {
        if (u.line === 1 && /[0-9]/.test(u.el.textContent)) u.el.style.color = hi >= 1 ? C.flame : '';
      });

      st.axis.setAttribute('opacity', (U.clamp((lt + 0.13) * 5) * (1 - E.inExpo(out))).toFixed(3));

      st.rows.forEach((o) => {
        const { r } = o;
        const ye = ui.enter(lt, -0.1 + r.i * 0.012, 0.3);
        const yOut = E.inExpo(U.prog(lt, 1.62 + (20 - r.i) * 0.006, 1.84 + (20 - r.i) * 0.006));
        o.yl.setAttribute('transform', `translate(${((1 - ye.e) * -30 - yOut * 60).toFixed(1)} 0)`);
        o.yl.style.opacity = ((r.v == null ? 0.3 : 1) * ye.o * (1 - yOut) * (1 - 0.55 * hi * (r === R2025 ? 0 : 1))).toFixed(3);
        if (!o.bar) return;

        const t0 = growStart(r);
        const p = U.prog(lt, t0, t0 + 0.3);
        const target = r.v * SCALE;
        let w = lt < t0 ? STUB : STUB + (target - STUB) * E.outBack(p, 1.3);
        const retract = E.inExpo(U.prog(lt, 1.62 + (20 - r.i) * 0.008, 1.82 + (20 - r.i) * 0.008));
        w *= 1 - retract;
        const isHi = r === R2025;
        o.bar.setAttribute('width', Math.max(0, w).toFixed(2));
        if (o.outline) o.outline.setAttribute('width', Math.max(0, w).toFixed(2));
        o.bar.setAttribute('fill', isHi && hi >= 0.5 ? C.flame : r.ytd ? 'url(#sx-hatch)' : C.ink);
        const dim = isHi ? 1 : 1 - 0.55 * hi;
        o.bar.style.opacity = dim.toFixed(3);
        if (o.outline) o.outline.style.opacity = dim.toFixed(3);
        if (isHi) o.bar.style.display = lt >= 1.62 ? 'none' : '';

        if (o.lbl) {
          const lp = U.prog(lt, t0 + 0.18, t0 + 0.36);
          o.lbl.setAttribute('x', (X0 + w + 12).toFixed(1));
          o.lbl.style.opacity = (U.clamp(lp * 3) * dim * (1 - E.inExpo(out))).toFixed(3);
        }
      });

      // b4 highlight label
      const lp = U.prog(lt, 1.5, 1.8);
      st.hiLbl.setAttribute('x', (X0 + R2025.v * SCALE + 16).toFixed(1));
      st.hiLbl.style.opacity = lt < 1.5 ? 0 : (U.clamp(lp * 5) * (1 - E.inExpo(U.prog(lt, 1.64, 1.8)))).toFixed(3);
      st.hiLbl.setAttribute('transform-origin', `${X0 + R2025.v * SCALE + 16} ${R2025.y}`);
      st.hiLbl.setAttribute('transform', `scale(${lt < 1.5 ? 0.5 : U.lerp(0.5, 1, E.outBack(lp, 2.4)).toFixed(4)})`);

      // Bend: 2025 bar → closed ring at scene 07's outer ring
      if (lt < 1.62) {
        st.bend.style.display = 'none';
        return;
      }
      const ring = SX.L.shareRing;
      const m = E.inOutCubic(U.prog(lt, 1.62, 2.0));
      const sx = U.lerp(X0, ring.cx, m);
      const sy = U.lerp(R2025.y, ring.cy - ring.rOuter, m);
      const L = U.lerp(R2025.v * SCALE, 2 * Math.PI * ring.rOuter, m);
      const k = Math.pow(m, 1.35) / ring.rOuter;
      st.bend.style.display = '';
      st.bend.setAttribute('d', U.pathD(bentBar(sx, sy, L, k)) + (m >= 1 ? 'Z' : ''));
      st.bend.setAttribute('stroke-width', U.lerp(BAR_H, ring.w, m).toFixed(2));
      st.bend.setAttribute('stroke', mixHex(C.flame, C.ink, U.prog(m, 0.35, 0.9)));
    },
  });
})((window.SX = window.SX || {}));
