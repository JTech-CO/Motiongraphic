/* Scene-to-scene transitions. Index k = transition from scene k+1 to k+2.
   lead = seconds before the beat when the transition starts (3–5 frames).
   Transitions with lead 0 are match cuts / covers handled inside the outgoing scene. */
(function (SX) {
  'use strict';
  const { U, E, T } = SX;
  const W = T.W;
  const H = T.H;
  let layer = null;
  let burstSvg = null;
  let burstRings = [];

  const cut = { lead: 0 };

  // 01 → 02: GENESIS splits into vertical strips; scene 02 opens inside them
  const stripShutter = {
    lead: T.LEAD,
    apply(p, out, inn) {
      const n = 8;
      const cw = W / n;
      const pts = [];
      for (let k = 0; k < n; k++) {
        const e = E.inCubic(U.prog(p, U.hash(k, 5) * 0.25, 1));
        const c = cw * (k + 0.5);
        const half = (cw / 2 + 1) * e;
        const a = (c - half).toFixed(1);
        const b = (c + half).toFixed(1);
        pts.push(`${a}px 0px`, `${a}px ${H}px`, `${b}px ${H}px`, `${b}px 0px`);
      }
      inn.root.style.zIndex = 2;
      inn.root.style.clipPath = `polygon(${pts.join(',')})`;
    },
  };

  // 05 → 06: the SUV ring bursts outward, paper inside it
  const ringBurst = {
    lead: T.LEAD,
    apply(p, out, inn) {
      const c = SX.L.mixRing;
      const r = 2200 * E.inOutCubic(p) + c.r * (1 - p);
      inn.root.style.zIndex = 2;
      inn.root.style.clipPath = `circle(${r.toFixed(1)}px at ${c.cx}px ${c.cy}px)`;
      burstSvg.style.display = '';
      burstRings.forEach((ring, i) => {
        ring.setAttribute('cx', c.cx);
        ring.setAttribute('cy', c.cy);
        ring.setAttribute('r', Math.max(0, r * (i ? 0.78 : 1) + (i ? 0 : 8)).toFixed(1));
        ring.setAttribute('opacity', p >= 1 ? 0 : 1);
      });
    },
    idle() {
      if (burstSvg) burstSvg.style.display = 'none';
    },
  };

  // 06 → 07: motion-blur slide
  const blurSlide = {
    lead: T.LEAD,
    apply(p, out, inn) {
      const e = E.inOutCubic(p);
      const blur = Math.sin(p * Math.PI) * 26;
      out.root.style.transform = `translate3d(${(-W * e).toFixed(1)}px,0,0)`;
      out.root.style.filter = `blur(${blur.toFixed(1)}px)`;
      inn.root.style.zIndex = 2;
      inn.root.style.transform = `translate3d(${(W * (1 - e)).toFixed(1)}px,0,0)`;
      inn.root.style.filter = `blur(${blur.toFixed(1)}px)`;
    },
  };

  // 08 → 09: iris opens from the 10-year dial
  const iris = {
    lead: T.LEAD,
    apply(p, out, inn) {
      const d = SX.L.dial;
      const r = U.lerp(d.r, 2000, E.inCubic(p));
      inn.root.style.zIndex = 2;
      inn.root.style.clipPath = `circle(${r.toFixed(1)}px at ${d.cx}px ${d.cy}px)`;
    },
  };

  // 09 → 10: horizontal slices tear off in alternating directions
  const slice = {
    lead: T.LEAD,
    apply(p, out, inn, ctx) {
      layer.textContent = '';
      out.root.style.visibility = 'hidden';
      const K = 12;
      const bh = H / K;
      for (let k = 0; k < K; k++) {
        const clone = out.root.cloneNode(true);
        clone.style.visibility = 'visible';
        clone.style.display = '';
        clone.style.clipPath = `inset(${(k * bh).toFixed(1)}px 0px ${(H - (k + 1) * bh).toFixed(1)}px 0px)`;
        const dir = k % 2 ? 1 : -1;
        const q = E.inCubic(U.prog(p, U.hash(k, 31) * 0.4, 1));
        const jit = (U.hash(ctx.frame * 16 + k, 7) - 0.5) * 70 * (1 - q);
        clone.style.transform = `translate3d(${(dir * W * 1.05 * q + jit).toFixed(1)}px,0,0)`;
        layer.appendChild(clone);
      }
      [SX.C.magma, SX.C.paper, SX.C.ink].forEach((col, i) => {
        const y = U.hash(ctx.frame * 3 + i, 41) * H;
        const bar = U.h('div', { style: `position:absolute;left:0;width:${W}px;top:${y.toFixed(0)}px;height:${(4 + U.hash(ctx.frame, i) * 12).toFixed(0)}px;background:${col}` });
        bar.style.transform = `translateX(${((U.hash(ctx.frame + i, 43) - 0.5) * 400).toFixed(0)}px)`;
        layer.appendChild(bar);
      });
    },
    idle() {
      if (layer && layer.firstChild) layer.textContent = '';
    },
  };

  // 11 → 12: the 24-hour dial hand sweeps the frame away (clock wipe from 12 o'clock).
  // The dark end card is transparent, so the outgoing cut is clipped to the not-yet-swept sector.
  const clockWipe = {
    lead: T.LEAD,
    apply(p, out) {
      const d = SX.L.montageDial;
      const th = E.inCubic(p) * Math.PI * 2;
      const R = 2600;
      const pts = [`${d.cx}px ${d.cy}px`];
      const span = Math.PI * 2 - th;
      const steps = Math.max(2, Math.ceil(span / 0.15));
      for (let i = 0; i <= steps; i++) {
        const a = th + (span * i) / steps;
        pts.push(`${(d.cx + R * Math.sin(a)).toFixed(1)}px ${(d.cy - R * Math.cos(a)).toFixed(1)}px`);
      }
      out.root.style.zIndex = 2;
      out.root.style.clipPath = span > 0.001 ? `polygon(${pts.join(',')})` : 'circle(0px at 0 0)';
    },
  };

  SX.transitions = {
    list: [
      stripShutter, // 01 → 02
      cut, //          02 → 03 card fill match cut (in scene 02)
      cut, //          03 → 04 lamp beams → chart lines (in scene 03)
      cut, //          04 → 05 bars topple into race rows (in scene 04)
      ringBurst, //    05 → 06
      blurSlide, //    06 → 07
      cut, //          07 → 08 explode → converge (07 + 08)
      iris, //         08 → 09
      slice, //        09 → 10
      cut, //          10 → 11 RGB split + hard cut (in scene 10)
      clockWipe, //    11 → 12
    ],
    init(layerEl) {
      layer = layerEl;
      burstSvg = U.svgFull();
      burstSvg.style.position = 'absolute';
      burstSvg.style.zIndex = 2;
      burstSvg.style.display = 'none';
      burstRings = [
        U.s('circle', { fill: 'none', stroke: SX.C.ink, 'stroke-width': 14 }),
        U.s('circle', { fill: 'none', stroke: SX.C.ink, 'stroke-width': 4 }),
      ];
      burstSvg.append(...burstRings);
      layer.parentNode.appendChild(burstSvg);
    },
  };
})((window.SX = window.SX || {}));
