/* 07 SHARE — "세계 발사의 / 절반,"
   Double ring gauge: inner = ~50% of world launches, outer = ~80% of mass to orbit (2025),
   2,213 t counts up in the middle. Both rings then collapse into one circle and grow
   lat/long lines — the globe of scene 08. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const S = D.share2025;

  const RING = { cx: 1300, cy: 560, rOuter: 330, rInner: 250, w: 26 };
  SX.L.shareRing = RING;

  SX.defineScene({
    id: 7,
    role: 'SHARE',
    bg: 'yellow',
    ruler: () => ({ from: 2025, to: 2025, mark: 2025 }),

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, RING.cx, RING.cy, C.paper, 0.28);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: '2025 / GLOBAL SHARE' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 136, lines: ['세계 발사의', '절반,'] });

      const svg = U.svgFull();
      st.wire = U.s('g');
      st.wireBack = U.s('path', { fill: 'none', stroke: C.ink, 'stroke-width': 1.2 });
      st.wireFront = U.s('path', { fill: 'none', stroke: C.ink, 'stroke-width': 1.6 });
      st.wire.append(st.wireBack, st.wireFront);
      st.outer = ui.ring(svg, { cx: RING.cx, cy: RING.cy, r: RING.rOuter, w: RING.w, color: C.ink, track: C.ink, trackOpacity: 1 });
      st.inner = ui.ring(svg, { cx: RING.cx, cy: RING.cy, r: RING.rInner, w: RING.w, color: C.orbit, track: C.ink, trackOpacity: 0.12 });
      svg.appendChild(st.wire);
      st.ends = [0, 1].map(() => {
        const g = U.s('g');
        g.append(U.s('circle', { r: 9, fill: C.signal, stroke: C.ink, 'stroke-width': 3 }));
        svg.appendChild(g);
        return g;
      });
      cam.appendChild(svg);

      st.endLbls = [`${ui.approx(true)}${S.massSharePct}% MASS`, `${ui.approx(true)}${S.launchSharePct}% LAUNCHES`].map((t) => {
        const el = U.box(0, 0, 'mono', t);
        cam.appendChild(el);
        return el;
      });

      st.mass = ui.counter(cam, { x: RING.cx, y: RING.cy - 70, size: 104, align: 'center' });
      st.massLbl = U.h('div', { class: 'mono', style: `left:${RING.cx - 300}px;width:600px;text-align:center;top:${RING.cy + 48}px`, text: 'MASS TO ORBIT · 2025' });
      cam.appendChild(st.massLbl);

      st.legend = [
        { y: 560, color: C.orbit, pct: S.launchSharePct, lbl: `OF WORLD ORBITAL LAUNCHES · WORLD ~${S.worldLaunches}` },
        { y: 728, color: C.ink, pct: S.massSharePct, lbl: 'OF MASS TO ORBIT · 2025' },
      ].map((o) => {
        const sw = U.box(120, o.y + 30, '');
        sw.style.cssText += `width:22px;height:22px;background:${o.color}`;
        const num = ui.counter(cam, { x: 160, y: o.y, size: 92 });
        const lbl = U.box(122, o.y + 104, 'mono', o.lbl);
        cam.append(sw, lbl);
        return { ...o, sw, num, lbl };
      });
      return st;
    },

    update(st, lt, sc) {
      const t = sc.slot.start + lt;
      ui.breathe(st.glow, lt, 0.05);
      st.cap.update(lt, 0, 1.55);
      st.head.update(lt, 0.02, 1.55);

      const pIn = E.outCubic(U.prog(lt, 0.05, 0.85));
      const pOut = E.outCubic(U.prog(lt, 0.2, 1.0));
      const m = E.inOutCubic(U.prog(lt, 1.55, 2.0));
      const G = SX.globe.center;
      const pb = lt >= 1.5 ? U.pulse(lt - 1.5, 10, 0.14) : 0;

      // Outer ring: the bent bar arrives solid ink, then becomes a gauge track
      const ocx = U.lerp(RING.cx, G.x, m);
      const ocy = U.lerp(RING.cy, G.y, m);
      const orr = U.lerp(RING.rOuter, SX.globe.R, m) * (1 + 0.012 * pb);
      st.outer.geom(ocx, ocy, orr, U.lerp(RING.w, 2.5, m));
      st.outer.track.setAttribute('opacity', (U.lerp(1, 0.14, E.outCubic(U.prog(lt, 0, 0.3))) * (1 - m)).toFixed(3));
      st.outer.setAbs(U.lerp((S.massSharePct / 100) * pOut, 1, m));

      const ie = ui.enter(lt, 0, 0.45);
      const irr = U.lerp(RING.rInner * U.lerp(0.6, 1, ie.e), SX.globe.R, m) * (1 + 0.012 * pb);
      st.inner.geom(ocx, ocy, irr, U.lerp(RING.w, 2.5, m));
      st.inner.g.setAttribute('opacity', ie.o.toFixed(3));
      st.inner.track.setAttribute('opacity', (0.12 * (1 - m)).toFixed(3));
      st.inner.setAbs(U.lerp((S.launchSharePct / 100) * pIn, 1, m));
      st.inner.fill.setAttribute('stroke', m > 0.5 ? C.ink : C.orbit);

      // Fill-end markers + labels (b3)
      [[orr, (S.massSharePct / 100) * pOut, 34], [irr, (S.launchSharePct / 100) * pIn, -34]].forEach(([r, f, dr], i) => {
        const a = f * Math.PI * 2;
        const x = ocx + r * Math.sin(a);
        const y = ocy - r * Math.cos(a);
        const pe = U.prog(lt, 1.0 + i * 0.06, 1.3 + i * 0.06);
        const vis = lt >= 1.0 ? U.clamp(pe * 4) * (1 - E.inExpo(U.prog(lt, 1.55, 1.75))) : 0;
        st.ends[i].setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${U.lerp(0.3, 1, E.outBack(pe, 2.5)).toFixed(3)})`);
        st.ends[i].setAttribute('opacity', vis.toFixed(3));
        const lx = ocx + (r + dr) * Math.sin(a);
        const ly = ocy - (r + dr) * Math.cos(a);
        const el = st.endLbls[i];
        el.style.left = `${lx.toFixed(1)}px`;
        el.style.top = `${ly.toFixed(1)}px`;
        el.style.transform = `translate(${i === 0 ? '0' : '-100%'},-50%)`;
        el.style.opacity = vis.toFixed(3);
      });

      // Globe wireframe sprouts inside the merged circle
      const wg = E.spring(U.prog(m, 0.35, 1));
      if (m > 0.35) {
        const lines = SX.globe.lines(t, G.x, G.y, SX.globe.R * U.clamp(wg, 0, 1.2));
        st.wireFront.setAttribute('d', lines.front.map(U.pathD).join(''));
        st.wireBack.setAttribute('d', lines.back.map(U.pathD).join(''));
        st.wireFront.setAttribute('opacity', (0.85 * U.prog(m, 0.35, 0.8)).toFixed(3));
        st.wireBack.setAttribute('opacity', (0.2 * U.prog(m, 0.35, 0.8)).toFixed(3));
        st.wire.style.display = '';
      } else st.wire.style.display = 'none';

      // Center: 2,213 t counts by b3, holds
      const out = ui.exit(lt, 1.55, 0.24);
      const mp = E.outCubic(U.prog(lt, 0.1, 1.0));
      st.mass.set(`${U.fmtInt(S.massT * mp)} t`);
      const me = ui.enter(lt, 0.06, 0.45);
      st.mass.el.style.opacity = (me.o * (1 - out)).toFixed(3);
      st.mass.el.style.transform = `translate3d(0,${((1 - me.e) * 30 - out * 40).toFixed(1)}px,0) scale(${(1 + 0.04 * pb).toFixed(4)})`;
      st.massLbl.style.opacity = (me.o * (1 - out) * 0.8).toFixed(3);

      st.legend.forEach((o, i) => {
        const p = i === 0 ? pIn : pOut;
        o.num.set(`~${Math.round(o.pct * p)}%`);
        const e = ui.enter(lt, 0.08 + i * 0.12, 0.45);
        const x = ((1 - e.e) * -50 - out * 120).toFixed(1);
        [o.sw, o.num.el, o.lbl].forEach((el) => {
          el.style.opacity = (e.o * (1 - out)).toFixed(3);
          el.style.transform = `translate3d(${x}px,0,0)`;
        });
      });
    },
  });
})((window.SX = window.SX || {}));
