/* 11 MONTAGE — numbers only. Eight hard cuts on 8th notes, 5-color rotation.
   Repeated data changes form: 37 (tally → big number), 2,213 t (counter → stacked bar),
   $85.7B (chip → big number). The last cut closes as an iris into the dark end card. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const M = D.montage;
  const S = D.share2025;

  const CUTS = [
    { bg: 'dark', big: `~${M.block5SuccessPct}%`, size: 280, label: 'FALCON 9 BLOCK 5 · SUCCESS RATE', sub: `SINCE ${M.block5Since}`, yr: [2018, 2026] },
    { bg: 'orange', big: String(D.reuse.recordFlights), size: 460, top: 236, label: `FLIGHTS · ONE BOOSTER · ${D.reuse.recordBooster}`, yr: [2026, 2026] },
    { bg: 'blue', big: U.fmtInt(D.starlink.launched), size: 300, label: `STARLINK SATELLITES LAUNCHED · ${D.starlink.launchedDate}`, yr: [2019, 2026] },
    { bg: 'paper', big: `${U.fmtInt(S.massT)} t`, size: 280, label: 'MASS TO ORBIT · 2025', kind: 'mass', yr: [2025, 2025] },
    { bg: 'yellow', big: `$${U.fmtFixed(M.fy2025RevenueM / 1000, 2)}B`, size: 280, label: 'FY2025 REVENUE', kind: 'mix', yr: [2025, 2025] },
    { bg: 'dark', kind: 'height', yr: [2023, 2026] },
    { bg: 'orange', big: `$${D.ipo.proceedsB}B`, size: 300, label: 'IPO PROCEEDS · INCL. GREENSHOE', yr: [2026, 2026] },
    { bg: 'blue', big: String(M.starshipFlights), size: 460, top: 206, label: 'STARSHIP INTEGRATED FLIGHTS', kind: 'flights', yr: [2023, 2026] },
  ];
  const cutAt = (lt) => U.clamp(Math.floor(lt / T.E8), 0, CUTS.length - 1);

  function segBar(parent, x, y, w, segs, labels) {
    const bar = U.h('div', { class: 'segbar abs', style: `left:${x}px;top:${y}px;width:${w}px;transform-origin:0 50%` });
    segs.forEach(([frac, color]) => bar.appendChild(U.h('i', { style: `width:${(frac * 100).toFixed(2)}%;background:${color}` })));
    const lbl = U.h('div', { class: 'seglabels mono abs', style: `left:${x}px;top:${y + 44}px;width:${w}px` });
    labels.forEach((t) => lbl.appendChild(U.h('span', { text: t })));
    parent.append(bar, lbl);
    return { bar, lbl };
  }

  SX.defineScene({
    id: 11,
    role: 'MONTAGE',
    bg: 'dark',
    bgAt: (lt) => CUTS[cutAt(lt)].bg,
    ruler: (lt) => {
      const c = CUTS[cutAt(lt)];
      return { from: c.yr[0], to: c.yr[1], mark: c.yr[1] };
    },

    build(cam) {
      const st = { cuts: [] };
      CUTS.forEach((c, k) => {
        const el = U.h('div', { class: `cut bg-${c.bg}` });
        cam.appendChild(el);
        const o = { el, c, anim: [] };
        el.appendChild(U.box(120, 172, 'mono cut-idx', `${U.pad(k + 1)} / 08`));

        if (c.kind === 'height') {
          const k2 = 700 / M.heightStarshipM;
          const base = 920;
          o.big = ui.counter(el, { x: 120, y: 360, size: 250 });
          o.big.set(`${M.heightStarshipM} m`);
          o.lbl = U.box(126, 640, 'mono', 'STARSHIP · HEIGHT');
          o.lbl.style.fontSize = '22px';
          o.sub = U.box(126, 680, 'mono', `FALCON 9 · ${M.heightF9m} m`);
          o.sub.style.cssText += 'font-size:18px;opacity:.7';
          el.append(o.lbl, o.sub);
          const svg = U.svgFull();
          const ss = SX.vehicles.starship(C.paper, C.space);
          const f9 = SX.vehicles.f9Full(C.paper, C.space);
          const sSc = (M.heightStarshipM * k2) / 400;
          const fSc = (M.heightF9m * k2) / 400;
          o.rockets = U.s('g', {},
            U.s('g', { transform: `translate(1560 ${base}) scale(${sSc})` }, ss.booster, U.s('g', { transform: `translate(0 ${ss.shipOffset})` }, ss.ship)),
            U.s('g', { transform: `translate(1300 ${base}) scale(${fSc})` }, f9.g));
          const guides = U.s('g', { stroke: C.paper, 'stroke-width': 1.5 });
          [[M.heightStarshipM, 1560], [M.heightF9m, 1300]].forEach(([h, x]) => {
            const y = base - h * k2;
            guides.append(
              U.s('line', { x1: 1160, y1: y, x2: x + 60, y2: y, 'stroke-dasharray': '4 6', opacity: 0.55 }),
              U.s('text', { x: 1150, y: y + 5, 'text-anchor': 'end', fill: C.paper, stroke: 'none', 'font-size': 16, style: 'font-family:var(--f-mono);letter-spacing:.1em', text: `${h} m` }));
          });
          guides.appendChild(U.s('line', { x1: 1160, y1: base, x2: 1700, y2: base, opacity: 0.5 }));
          svg.append(guides, o.rockets);
          el.appendChild(svg);
        } else {
          o.big = ui.counter(el, { x: 960, y: c.top ?? 300, size: c.size, align: 'center' });
          o.big.set(c.big);
          const ly = (c.top ?? 300) + c.size * 1.1 + 26;
          o.lbl = U.box(0, ly, 'mono cut-label', c.label);
          el.appendChild(o.lbl);
          if (c.sub) {
            o.sub = U.box(0, ly + 40, 'mono cut-label', c.sub);
            o.sub.style.cssText += 'font-size:17px;opacity:.7';
            el.appendChild(o.sub);
          }
          if (c.kind === 'mass') {
            o.bars = segBar(el, 560, ly + 70, 800, [[S.customerT / S.massT, C.flame], [S.internalT / S.massT, C.ink]],
              [`CUSTOMER ${S.customerT} t`, `INTERNAL ${U.fmtInt(S.internalT)} t`]);
          }
          if (c.kind === 'mix') {
            const cols = [C.ink, C.orbit, C.flame];
            o.bars = segBar(el, 560, ly + 70, 800, M.fy2025Mix.map((m, i) => [m.pct / 100, cols[i]]),
              M.fy2025Mix.map((m) => `${m.key} ${m.pct.toFixed(1)}%`));
          }
          if (c.kind === 'flights') {
            const row = U.svgFull();
            const n = M.starshipFlights;
            const x0 = 960 - (n * 44 - 16) / 2;
            o.ticks = [];
            for (let i = 0; i < n; i++) {
              const last = i === n - 1;
              const r = U.s('rect', {
                x: x0 + i * 44, y: ly + 64, width: 28, height: 28,
                fill: last ? C.signal : 'none', stroke: last ? C.signal : C.paper, 'stroke-width': 2,
              });
              row.appendChild(r);
              o.ticks.push(r);
            }
            el.appendChild(row);
            o.sub = U.box(0, ly + 112, 'mono cut-label', `F${n} · ${D.flight14.date} · FIRST ORBIT`);
            o.sub.style.cssText += 'font-size:17px';
            el.appendChild(o.sub);
          }
        }
        st.cuts.push(o);
      });
      return st;
    },

    update(st, lt) {
      const k = cutAt(lt);
      st.cuts.forEach((o, i) => {
        o.el.style.display = i === k ? '' : 'none';
        if (i !== k) return;
        const c = lt - i * T.E8;
        const s = U.lerp(1.14, 1, E.outExpo(U.prog(c, 0, 0.2)));
        const dx = -16 * (c / T.E8);
        o.big.el.style.transform = `translate3d(${dx.toFixed(1)}px,0,0) scale(${s.toFixed(4)})`;
        const wipe = E.outExpo(U.prog(c, 0.02, 0.15));
        [o.lbl, o.sub].forEach((el) => {
          if (el) el.style.clipPath = `inset(0 ${((1 - wipe) * 100).toFixed(1)}% 0 0)`;
        });
        if (o.bars) {
          const g = E.outExpo(U.prog(c, 0.03, 0.18));
          o.bars.bar.style.transform = `scaleX(${g.toFixed(4)})`;
          o.bars.lbl.style.clipPath = `inset(0 ${((1 - wipe) * 100).toFixed(1)}% 0 0)`;
        }
        if (o.ticks) {
          o.ticks.forEach((r, j) => r.setAttribute('opacity', c >= j * 0.008 ? 1 : 0));
        }
        if (o.rockets) {
          const r = E.outExpo(U.prog(c, 0, 0.2));
          o.rockets.setAttribute('transform', `translate(0 ${((1 - r) * 90).toFixed(1)})`);
        }
      });
    },
  });
})((window.SX = window.SX || {}));
