/* 04 PROOF — "연 20만 대를 / 넘겼다."
   Global annual sales 2015–2025 (§5.1 table) grow section by section; on b3 the 2021 bar breaks
   the 200,000 line (the lamp beam from 03). b4 marks the 2021–2025 plateau and the 2024 peak.
   Exit: bars topple flat and slide into the race-bar rows of scene 05 (match cut). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const CH = { x0: 840, x1: 1830, bx: 860, pitch: 90, bw: 56, base: 900, k: 480 / 200000 };
  CH.thrY = CH.base - D.threshold * CH.k;
  SX.L.chart = { x0: CH.x0, x1: CH.x1, thrY: CH.thrY, base: CH.base };

  const ROWS = D.globalAnnual.map((r, i) => ({ ...r, i, cx: CH.bx + i * CH.pitch + CH.bw / 2, h: Math.max(3, r.v * CH.k) }));
  const LABELED = [2016, 2020, 2021, 2024, 2025];
  // Sections: 2015–17 (b1), 2018–20 (b2), 2021–22 (b3), 2023–25 (8th after b3)
  const SEC = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3];
  const SEC_FIRST = [0, 3, 6, 8];
  const SEC_AT = [0, T.SPB, 2 * T.SPB, 2 * T.SPB + T.E8];
  const sectionStart = (i) => SEC_AT[SEC[i]] + (i - SEC_FIRST[SEC[i]]) * 0.04;

  SX.defineScene({
    id: 4,
    role: 'PROOF',
    bg: 'dark',
    ruler: (lt) => ({ from: 2015, to: 2025, mark: SX.hud.hop(lt, [2017, 2020, 2022, 2025]) }),

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, 1330, 560, C.copper, 0.1);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'GLOBAL SALES / PER YEAR' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['연 20만 대를', '넘겼다.'] });

      const svg = U.svgFull();
      st.base = U.s('line', { x1: CH.x0, x2: CH.x1, y1: CH.base, y2: CH.base, stroke: C.paper, 'stroke-width': 1.5, opacity: 0.5 });
      st.thr = U.s('line', { x1: CH.x0, x2: CH.x1, y1: CH.thrY, y2: CH.thrY, stroke: C.paper, 'stroke-width': 2 });
      svg.append(st.base, st.thr);
      st.bars = ROWS.map((r) => {
        const l = U.s('line', { x1: r.cx, x2: r.cx, y1: CH.base, y2: CH.base, stroke: r.year === 2021 ? C.magma : C.paper, 'stroke-width': CH.bw });
        svg.appendChild(l);
        return l;
      });
      st.bracket = U.s('path', { fill: 'none', stroke: C.copper, 'stroke-width': 2 });
      svg.appendChild(st.bracket);
      cam.appendChild(svg);

      st.thrLbl = U.box(0, CH.thrY - 28, 'mono', `${U.fmtInt(D.threshold)} / YEAR`);
      st.thrLbl.style.cssText += `right:${T.W - CH.x1}px;left:auto;font-size:15px`;
      cam.appendChild(st.thrLbl);
      st.years = ROWS.map((r) => {
        const el = U.box(r.cx - 40, CH.base + 12, 'mono', String(r.year));
        el.style.cssText += 'width:80px;text-align:center;font-size:13px;letter-spacing:.06em;opacity:.7';
        cam.appendChild(el);
        return el;
      });
      st.vals = ROWS.filter((r) => LABELED.includes(r.year)).map((r) => {
        const el = U.box(r.cx - 70, CH.base - r.h - 30, 'mono', U.fmtInt(r.v));
        el.style.cssText += `width:140px;text-align:center;font-size:${r.year === 2024 ? 19 : 15}px;letter-spacing:.04em`;
        if (r.year === 2024) el.style.color = C.copper;
        cam.appendChild(el);
        return { el, r };
      });
      st.plateau = U.box(ROWS[6].cx - CH.bw / 2, 262, 'mono', '200K+ PLATEAU · 2021–2025');
      st.plateau.style.cssText += `color:${C.copper};font-size:14px`;
      cam.appendChild(st.plateau);
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.04);
      const out = ui.exit(lt, 1.62, 0.24);
      st.cap.update(lt, 0, 1.62);
      st.head.update(lt, 0.02, 1.62);

      // 2021 breaks the line → flash on b3
      const t21 = sectionStart(6) + 0.2;
      const flash = lt >= t21 ? Math.exp(-(lt - t21) / 0.12) : 0;
      st.thr.setAttribute('stroke', flash > 0.05 ? C.magma : C.paper);
      st.thr.setAttribute('stroke-width', (2 + 6 * flash).toFixed(2));
      st.thr.setAttribute('opacity', (1 - out).toFixed(3));
      st.base.setAttribute('opacity', (0.5 * (1 - out)).toFixed(3));
      st.thrLbl.style.opacity = (U.clamp((lt + 0.05) * 5) * (1 - out)).toFixed(3);

      // Bars (lines): grow, then topple into scene 05's race rows
      const race = SX.L.race;
      ROWS.forEach((r, i) => {
        const t0 = sectionStart(i);
        const g = E.outBack(U.prog(lt, t0, t0 + 0.32), 1.25);
        let len = r.h * (lt < t0 ? 0 : g);
        const q = U.prog(lt, 1.62 + i * 0.012, 1.95);
        const rot = E.outBack(U.prog(q, 0, 0.55), 1.2);
        const mv = E.inOutCubic(U.prog(q, 0.2, 1));
        const row = race.rowY[i % race.rowY.length];
        const ang = U.rad(U.lerp(-90, 0, rot));
        const x = U.lerp(r.cx, race.x0, mv);
        const y = U.lerp(CH.base, row, mv);
        len = U.lerp(len, race.stub, mv);
        const l = st.bars[i];
        l.setAttribute('x1', x.toFixed(1));
        l.setAttribute('y1', y.toFixed(1));
        l.setAttribute('x2', (x + len * Math.cos(ang)).toFixed(1));
        l.setAttribute('y2', (y + len * Math.sin(ang)).toFixed(1));
        l.setAttribute('stroke-width', U.lerp(CH.bw, race.thick, mv).toFixed(1));
        l.setAttribute('stroke', r.year === 2021 && lt >= t21 ? C.magma : C.paper);
        st.years[i].style.opacity = (0.7 * U.clamp((lt - t0 + 0.1) * 5) * (1 - out)).toFixed(3);
      });
      st.vals.forEach(({ el, r }) => {
        const t0 = sectionStart(r.i) + 0.22;
        const p = U.prog(lt, t0, t0 + 0.2);
        el.style.opacity = (U.clamp(p * 3) * (1 - out)).toFixed(3);
        el.style.transform = `translate3d(0,${((1 - E.outBack(p)) * 16).toFixed(1)}px,0)`;
      });

      // b4: plateau bracket
      const bp = E.outExpo(U.prog(lt, 1.5 - T.LEAD, 1.5 + 0.2));
      const xa = ROWS[6].cx - CH.bw / 2;
      const xb = U.lerp(xa, ROWS[10].cx + CH.bw / 2, bp);
      st.bracket.setAttribute('d', bp > 0 ? `M${xa} 306 V292 H${xb.toFixed(1)} V306` : '');
      st.bracket.setAttribute('opacity', (1 - out).toFixed(3));
      st.plateau.style.opacity = (U.clamp((lt - 1.5) * 6) * (1 - out)).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
