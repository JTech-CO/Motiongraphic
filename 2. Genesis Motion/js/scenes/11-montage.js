/* 11 MONTAGE — numbers only. Eight hard cuts on 8th notes in the 5-colour rotation.
   Repeated data changes form: 1,510,368 (counter → big number), 65.4% (ring → number),
   ~12× (hero number → cut), GV70 / GV60 Magma / GV90 / GMR-001 appear with their silhouettes.
   Exit: the 24-hour dial of the last cut sweeps the frame away (clock wipe, transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const CUTS = [
    { bg: 'dark', big: U.fmtInt(D.cum15M.total), label: `GLOBAL CUMULATIVE · ${D.cum15M.date}`, yr: [2015, 2025] },
    { bg: 'copper', big: U.fmtInt(D.best.v), label: `BEST YEAR · ${D.best.year}`, yr: [2024, 2024] },
    { bg: 'glacier', big: U.fmtInt(D.mix2024[0].v), label: `GV70 · #1 MODEL · 2024`, car: 'gv70', yr: [2024, 2024] },
    { bg: 'paper', big: `~${D.suvSharePct}%`, label: 'SUV SHARE · 2024', yr: [2024, 2024] },
    { bg: 'magma', big: `~${D.usMultiple}×`, label: 'UNITED STATES · 2016 → 2025', yr: [2016, 2025] },
    { bg: 'dark', big: `${D.magma.zeroTo100} s`, label: `0–100 KM/H · ${D.magma.model}`, car: 'gv60m', yr: [2025, 2026] },
    { bg: 'copper', big: `${D.gv90.batteryKwh} kWh`, label: `GV90 · BATTERY · ${D.gv90.reveal}`, car: 'gv90', yr: [2026, 2026] },
    { bg: 'glacier', big: '24H', label: `LE MANS · ${D.racing.leMans} · FINISHED`, car: 'gmr', dial: true, yr: [2026, 2026] },
  ];
  const cutAt = (lt) => U.clamp(Math.floor(lt / T.E8), 0, CUTS.length - 1);
  SX.L.montageDial = { cx: 1380, cy: 560, r: 430 };

  const CAR_COLORS = {
    dark: { body: C.paper, window: C.black, detail: C.black, chrome: C.copper, tire: C.black, rim: '#8E8A84', lamp: C.magma },
    copper: { body: C.ink, window: C.glacier, detail: C.copper, chrome: C.paper, para: C.paper, tire: C.black, rim: '#7A4F33', lamp: C.paper },
    glacier: { body: C.ink, window: C.paper, detail: C.glacier, chrome: C.paper, tire: C.ink, rim: '#5F6E7A', lamp: C.paper },
  };

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
        const o = { el, c };
        el.appendChild(U.box(120, 172, 'mono cut-idx', `${U.pad(k + 1)} / 08`));
        if (c.car) {
          const svg = U.svgFull();
          if (c.dial) {
            const d = SX.L.montageDial;
            const ticks = U.s('g', { stroke: C.ink, 'stroke-width': 3, opacity: 0.35 });
            for (let i = 0; i < 24; i++) {
              const a = (i / 24) * Math.PI * 2;
              ticks.appendChild(U.s('line', {
                x1: d.cx + (d.r - 14) * Math.sin(a), y1: d.cy - (d.r - 14) * Math.cos(a),
                x2: d.cx + d.r * Math.sin(a), y2: d.cy - d.r * Math.cos(a),
              }));
            }
            svg.appendChild(ticks);
            o.hand = U.s('line', { x1: d.cx, y1: d.cy, x2: d.cx, y2: d.cy - d.r + 30, stroke: C.magma, 'stroke-width': 6, 'stroke-linecap': 'round' });
            svg.appendChild(o.hand);
          }
          o.car = SX.cars.build(svg, c.car, CAR_COLORS[c.bg]);
          el.appendChild(svg);
          o.big = ui.counter(el, { x: 120, y: 330, size: 170 });
          o.lbl = U.box(126, 530, 'mono cut-label', c.label);
        } else {
          o.big = ui.counter(el, { x: 960, y: 330, size: 300, align: 'center' });
          o.lbl = U.box(0, 680, 'mono cut-label', c.label);
          o.lbl.style.cssText += 'width:1920px;text-align:center';
        }
        o.big.set(c.big);
        el.appendChild(o.lbl);
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
        o.lbl.style.clipPath = `inset(0 ${((1 - wipe) * 100).toFixed(1)}% 0 0)`;
        if (o.car) {
          const L = o.car.spec.L;
          const sc = 820 / L;
          const r = E.outExpo(U.prog(c, 0, 0.2));
          o.car.place(990 + (1 - r) * 160, 870, sc);
          o.car.setWheels(lt * 8);
        }
        if (o.hand) {
          const d = SX.L.montageDial;
          o.hand.setAttribute('transform', `rotate(${(E.outCubic(U.prog(c, 0, 0.25)) * 360).toFixed(1)} ${d.cx} ${d.cy})`);
        }
      });
    },
  });
})((window.SX = window.SX || {}));
