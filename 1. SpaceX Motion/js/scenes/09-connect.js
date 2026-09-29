/* 09 CONNECT — "1,200만 회선을 / 잇고,"
   Subscribers step through seven §4.2 points on 8th notes (12.0M lands on b4),
   a 14×12 dot matrix lights 167 countries & markets, ARPU pops on b3.
   Exit: slice glitch (see transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const SERIES = D.starlink.subs;
  const STEP_AT = SERIES.map((_, k) => k * T.E8);
  const MX = { x: 1180, y: 290, cols: 14, rows: 12, cell: 36, r: 11 };

  function valueAt(lt) {
    let v = 0;
    for (let k = 0; k < SERIES.length; k++) {
      const p = E.outCubic(U.prog(lt, STEP_AT[k] - TWEEN, STEP_AT[k]));
      if (p <= 0) break;
      v = U.lerp(k ? SERIES[k - 1].v : 0, SERIES[k].v, p);
    }
    return v;
  }
  const TWEEN = 0.1;
  // Series label switches when that step's tween starts
  const stepIndex = (lt) => {
    let k = 0;
    for (let i = 0; i < SERIES.length; i++) if (lt >= STEP_AT[i] - TWEEN) k = i;
    return k;
  };
  const fmtSubs = (v) => (v < 1 ? `${Math.round(v * 1000)}K` : `${v.toFixed(1)}M`);
  const dotStart = (j) => 0.1 + Math.floor(j / MX.cols) * T.E32 + (j % MX.cols) * 0.008;

  SX.defineScene({
    id: 9,
    role: 'CONNECT',
    bg: 'blue',
    ruler: (lt) => {
      const k = stepIndex(lt);
      return { from: 2021, to: 2026, mark: SX.hud.hop(lt, SERIES.map((s) => s.year), T.E8), label: SERIES[k].label };
    },

    build(cam) {
      const st = {};
      st.dots = U.h('div', { class: 'dotgrid' });
      cam.appendChild(st.dots);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'STARLINK / SUBSCRIBERS' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 128, lines: ['1,200만 회선을', '잇고,'] });
      st.count = ui.counter(cam, { x: 120, y: 560, size: 150 });
      st.stepLbl = U.box(124, 724, 'mono', '');
      st.stepLbl.style.fontSize = '20px';
      cam.appendChild(st.stepLbl);

      const svg = U.svgFull();
      st.cells = [];
      for (let j = 0; j < MX.cols * MX.rows; j++) {
        const cx = MX.x + (j % MX.cols) * MX.cell + MX.cell / 2;
        const cy = MX.y + Math.floor(j / MX.cols) * MX.cell + MX.cell / 2;
        const lit = j < D.starlink.countries;
        const c = U.s('circle', lit
          ? { cx, cy, r: 0, fill: C.paper }
          : { cx, cy, r: MX.r - 1, fill: 'none', stroke: C.paper, 'stroke-width': 2, opacity: 0.5 });
        svg.appendChild(c);
        st.cells.push({ c, lit, j });
      }
      cam.appendChild(svg);

      st.cty = ui.counter(cam, { x: MX.x, y: MX.y + MX.rows * MX.cell + 26, size: 80 });
      st.ctyLbl = U.box(MX.x + 170, MX.y + MX.rows * MX.cell + 40, 'mono', 'COUNTRIES & MARKETS');
      st.ctyDate = U.box(MX.x + 170, MX.y + MX.rows * MX.cell + 68, 'mono', D.starlink.arpuDate);
      st.ctyDate.style.opacity = 0.7;
      st.arpu = ui.chip(cam, MX.x, MX.y + MX.rows * MX.cell + 128, 'ARPU', `$${D.starlink.arpu} / MO`);
      cam.append(st.ctyLbl, st.ctyDate);
      return st;
    },

    update(st, lt) {
      st.dots.style.backgroundPosition = '0 0';
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      const k = stepIndex(lt);
      const v = valueAt(lt);
      const atRest = lt >= STEP_AT[k];
      st.count.set(`${atRest && SERIES[k].approx ? '~' : ''}${fmtSubs(v)}`);
      U.setText(st.stepLbl, `${SERIES[k].label} · SERVICE LINES`);
      const pb = U.pulse(lt, T.E8, 0.08);
      st.count.el.style.opacity = U.clamp((lt + 0.02) * 6).toFixed(3);
      st.count.el.style.transform = `scale(${(1 + 0.025 * pb).toFixed(4)})`;
      st.stepLbl.style.opacity = U.clamp((lt - 0.05) * 6).toFixed(3);

      // Dot matrix scan on 32nd notes → 167 by ~b3
      let lit = 0;
      st.cells.forEach(({ c, lit: isLit, j }) => {
        if (!isLit) {
          c.setAttribute('opacity', (0.5 * U.clamp((lt - 0.9) * 5)).toFixed(3));
          return;
        }
        const t0 = dotStart(j);
        const p = U.prog(lt, t0, t0 + 0.16);
        if (lt >= t0) lit++;
        c.setAttribute('r', (MX.r * (lt < t0 ? 0 : E.outBack(p, 2.2))).toFixed(2));
      });
      st.cty.set(String(lit));
      const ce = ui.enter(lt, 0.1, 0.4);
      [st.cty.el, st.ctyLbl, st.ctyDate].forEach((el, i) => {
        el.style.opacity = (ce.o * (i === 2 ? 0.7 : 1)).toFixed(3);
        el.style.transform = `translate3d(0,${((1 - ce.e) * 20).toFixed(1)}px,0)`;
      });
      ui.pop(st.arpu, lt, 1.0, { from: 0.5 });

      // Pre-glitch jitter frames before the slice transition
      const f = Math.round(lt * T.FPS);
      if (lt >= 1.72) {
        const jx = (U.hash(f, 21) - 0.5) * 36;
        const jy = (U.hash(f, 22) - 0.5) * 8;
        st.dots.style.backgroundPosition = `${(jx * 0.5).toFixed(1)}px ${jy.toFixed(1)}px`;
        st.count.el.style.transform += ` translate3d(${jx.toFixed(1)}px,0,0)`;
      }
    },
  });
})((window.SX = window.SX || {}));
