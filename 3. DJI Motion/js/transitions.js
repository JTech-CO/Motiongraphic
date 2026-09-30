/* Scene-to-scene transitions, all built as camera moves. Index k = transition from scene k+1 to k+2.
   lead = seconds before the beat when the move starts (5 frames); every move accelerates into the beat and the
   incoming scene decelerates out of it (ui.settle), like a gimbal or drone camera stopping smoothly.
   Night scenes have transparent roots, so they get an explicit background while they are transformed. */
(function (SX) {
  'use strict';
  const { U, E, T } = SX;
  const W = T.W;
  const H = T.H;
  const LEAD = T.frames(5);
  let layer = null;
  let over = null; // SVG overlay for streaks, dive lines, clouds, horizon
  const parts = {};

  const cut = { lead: 0 };
  const opaque = (sc) => {
    if (sc.def.bg === 'night') sc.root.style.background = SX.C.night;
  };
  const show = (k) => Object.keys(parts).forEach((n) => (parts[n].style.display = n === k ? '' : 'none'));

  // 01 → 02 · crane up: the top-down board tilts back like a ground plane as the camera rises and
  // pitches to the horizon; the dawn scene drops in from above
  const craneUp = {
    lead: LEAD,
    apply(p, out, inn) {
      const e = E.inCubic(p);
      opaque(out);
      out.root.style.zIndex = 2;
      out.root.style.transformOrigin = '960px 1080px';
      out.root.style.transform = `perspective(1300px) rotateX(${(78 * e).toFixed(2)}deg) scale(${(1 - 0.2 * e).toFixed(4)})`;
      inn.root.style.transform = `translate3d(0,${(-(1 - e) * 520).toFixed(1)}px,0)`;
    },
  };

  // 02 → 03 · tilt up: everything slides down past the frame, the sky comes in from the top
  const tiltUp = {
    lead: LEAD,
    apply(p, out, inn) {
      const e = E.inCubic(p);
      out.root.style.transform = `translate3d(0,${(e * H * 0.9).toFixed(1)}px,0) scale(${(1 + 0.06 * e).toFixed(4)})`;
      inn.root.style.transform = `translate3d(0,${(-(1 - e) * H * 0.9).toFixed(1)}px,0)`;
    },
  };

  // 03 → 04 · pitch down: the sky face folds up and away, the top-down map folds in from below
  const pitchDown = {
    lead: LEAD,
    apply(p, out, inn) {
      const e = E.inCubic(p);
      opaque(inn);
      const cube = (a) => `perspective(1700px) translate3d(0,0,-540px) rotateX(${a.toFixed(2)}deg) translate3d(0,0,540px)`;
      out.root.style.transform = cube(88 * e);
      inn.root.style.transform = cube(-88 * (1 - e));
      out.root.style.zIndex = e < 0.5 ? 2 : 1;
    },
  };

  // 04 → 05 · FPV dive: plunge through the radar centre with radial motion lines
  const fpvDive = {
    lead: LEAD,
    apply(p, out, inn) {
      const c = SX.L.radar;
      const e = E.inExpo(p);
      opaque(out);
      out.root.style.zIndex = 2;
      out.root.style.transformOrigin = `${c.cx}px ${c.cy}px`;
      out.root.style.transform = `scale(${(1 + 9 * e).toFixed(4)})`;
      out.root.style.opacity = (1 - U.clamp((p - 0.55) / 0.45)).toFixed(3);
      inn.root.style.transformOrigin = `${c.cx}px ${c.cy}px`;
      inn.root.style.transform = `scale(${(0.7 + 0.3 * E.outCubic(p)).toFixed(4)})`;
      show('dive');
      parts.dive.setAttribute('opacity', Math.sin(Math.PI * p).toFixed(3));
      parts.dive.querySelectorAll('line').forEach((l, k) => {
        const a = (k / 36) * Math.PI * 2 + U.hash(k, 9) * 0.1;
        const r0 = 80 + 900 * e + U.hash(k, 3) * 200;
        const r1 = r0 + 160 + 500 * e;
        l.setAttribute('x1', (c.cx + Math.cos(a) * r0).toFixed(1));
        l.setAttribute('y1', (c.cy + Math.sin(a) * r0).toFixed(1));
        l.setAttribute('x2', (c.cx + Math.cos(a) * r1).toFixed(1));
        l.setAttribute('y2', (c.cy + Math.sin(a) * r1).toFixed(1));
      });
    },
    idle() {
      if (parts.dive) parts.dive.style.display = 'none';
    },
  };

  // 05 → 06 · rack focus: the foreground drops out of focus while the next shot pulls sharp
  const rackFocus = {
    lead: LEAD,
    apply(p, out, inn) {
      const e = E.inOutCubic(p);
      out.root.style.filter = `blur(${(22 * e).toFixed(1)}px)`;
      out.root.style.transform = `scale(${(1 + 0.05 * e).toFixed(4)})`;
      inn.root.style.filter = `blur(${(22 * (1 - e)).toFixed(1)}px)`;
      inn.root.style.transform = `scale(${(1.05 - 0.05 * e).toFixed(4)})`;
      inn.root.style.opacity = U.clamp(e * 1.6).toFixed(3);
    },
  };

  // 06 → 07 · shutter capture: a flash, then the frame freezes into a photo that flies toward scene 07
  const shutter = {
    lead: LEAD,
    apply(p, out) {
      const e = E.outCubic(p);
      const R = SX.L.photo0;
      out.root.style.zIndex = 2;
      out.root.style.transformOrigin = '960px 540px';
      out.root.style.transform = `translate3d(${((R.cx - 960) * e).toFixed(1)}px,${((R.cy - 540) * e).toFixed(1)}px,0) scale(${U.lerp(1, R.s, e).toFixed(4)})`;
      out.root.style.outline = `${(22 * e).toFixed(1)}px solid ${SX.C.mist}`;
      show('flash');
      parts.flash.setAttribute('opacity', (p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75).toFixed(3));
    },
    idle() {
      if (parts.flash) parts.flash.style.display = 'none';
    },
  };

  // 07 → 08 · hyperlapse: the frame smears into horizontal light trails
  const hyperlapse = {
    lead: LEAD,
    apply(p, out) {
      const e = E.inCubic(p);
      out.root.style.zIndex = 2;
      out.root.style.transformOrigin = '960px 540px';
      out.root.style.transform = `scaleX(${(1 + 5 * e).toFixed(3)}) scaleY(${(1 - 0.35 * e).toFixed(3)})`;
      out.root.style.opacity = (1 - e).toFixed(3);
      show('trails');
      parts.trails.querySelectorAll('rect').forEach((r, k) => {
        const len = 200 + 1600 * e * (0.5 + U.hash(k, 5));
        r.setAttribute('x', (960 - len / 2 + (U.hash(k, 7) - 0.5) * 900).toFixed(1));
        r.setAttribute('width', len.toFixed(1));
        r.setAttribute('opacity', (U.clamp(p * 3) * (0.25 + U.hash(k, 2) * 0.6)).toFixed(3));
      });
    },
    idle() {
      if (parts.trails) parts.trails.style.display = 'none';
    },
  };

  // 08 → 09 · orbit: the camera swings around the crossing point; the layers shear past each other
  const orbit = {
    lead: LEAD,
    apply(p, out, inn) {
      const e = E.inCubic(p);
      opaque(out);
      const cube = (a) => `perspective(2200px) translate3d(0,0,-960px) rotateY(${a.toFixed(2)}deg) translate3d(0,0,960px)`;
      out.root.style.transform = cube(-80 * e);
      inn.root.style.transform = cube(80 * (1 - e));
      out.root.style.zIndex = e < 0.5 ? 2 : 1;
    },
  };

  // 09 → 10 · cloud pass: a cloud deck rises through the frame; scene 10 starts inside it and clears it
  const cloudPass = {
    lead: LEAD,
    apply(p) {
      show('cloud');
      parts.cloud.setAttribute('transform', `translate(0 ${(H - (H + 260) * E.inCubic(p)).toFixed(1)})`);
    },
    idle() {
      if (parts.cloud) parts.cloud.style.display = 'none';
    },
  };

  // 11 → 12 · gimbal horizon wipe: the last cut rolls, but the horizon line stays level and sweeps down,
  // leaving the end card above it
  const gimbalWipe = {
    lead: LEAD,
    apply(p, out, inn) {
      const e = E.inOutCubic(p);
      const y = H * e;
      out.root.style.transformOrigin = '960px 540px';
      out.root.style.transform = `rotate(${(-11 * E.inCubic(p)).toFixed(2)}deg) scale(1.2)`;
      opaque(inn);
      inn.root.style.zIndex = 2;
      inn.root.style.clipPath = `inset(0px 0px ${(H - y).toFixed(1)}px 0px)`;
      show('horizon');
      parts.horizon.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
    },
    idle() {
      if (parts.horizon) parts.horizon.style.display = 'none';
    },
  };

  /** Cloud deck with bumpy top and bottom edges, 1600 px tall (also used by scene 10 to clear) */
  function cloudMass(parent) {
    const g = U.s('g');
    const r = U.rng(909);
    const edge = (y0, dir) => {
      let d = '';
      let x = -60;
      while (x < W + 60) {
        const w = 120 + r() * 220;
        const hgt = (40 + r() * 110) * dir;
        d += `C${(x + w * 0.1).toFixed(0)} ${(y0 - hgt).toFixed(0)} ${(x + w * 0.9).toFixed(0)} ${(y0 - hgt).toFixed(0)} ${(x + w).toFixed(0)} ${y0}`;
        x += w;
      }
      return { d, end: x };
    };
    const top = edge(0, 1);
    const bot = edge(1600, -1);
    // bottom edge path runs left→right too; walk it backwards by mirroring into a closed shape
    g.append(
      U.s('path', { d: `M-60 0${top.d}L${top.end} 1600L-60 1600Z`, fill: SX.C.mist }),
      U.s('path', { d: `M-60 1600${bot.d}L${bot.end} 1600Z`, fill: SX.C.mist }),
      U.s('path', { d: `M-60 60${edge(60, 0.6).d}`, fill: 'none', stroke: SX.ui.tone(SX.C.mist, -0.12), 'stroke-width': 3 })
    );
    parent.appendChild(g);
    return g;
  }

  SX.transitions = {
    list: [
      craneUp, //    01 → 02
      tiltUp, //     02 → 03
      pitchDown, //  03 → 04
      fpvDive, //    04 → 05
      rackFocus, //  05 → 06
      shutter, //    06 → 07
      hyperlapse, // 07 → 08
      orbit, //      08 → 09
      cloudPass, //  09 → 10
      cut, //        10 → 11 zoom steps 28MM → 168MM inside scene 10, then a hard cut
      gimbalWipe, // 11 → 12
    ],
    cloudMass,
    init(layerEl) {
      layer = layerEl;
      over = U.svgFull();
      over.style.position = 'absolute';
      layer.appendChild(over);

      parts.dive = U.s('g', { stroke: SX.C.mist, 'stroke-width': 3, 'stroke-linecap': 'round' });
      for (let k = 0; k < 36; k++) parts.dive.appendChild(U.s('line'));
      parts.flash = U.s('rect', { x: 0, y: 0, width: W, height: H, fill: '#FFFFFF' });
      parts.trails = U.s('g', { fill: SX.C.mist });
      for (let k = 0; k < 30; k++) parts.trails.appendChild(U.s('rect', { y: (30 + U.hash(k, 11) * (H - 60)).toFixed(0), height: (1 + Math.floor(U.hash(k, 13) * 4)).toFixed(0) }));
      parts.cloud = U.s('g');
      cloudMass(parts.cloud);
      parts.horizon = U.s('g');
      parts.horizon.append(
        U.s('rect', { x: 0, y: -2, width: W, height: 4, fill: SX.C.mist }),
        ...[-1, 1].map((s) => U.s('rect', { x: 960 + s * 120 - 30, y: -9, width: 60, height: 3, fill: SX.C.mist }))
      );
      Object.values(parts).forEach((el) => {
        el.style.display = 'none';
        over.appendChild(el);
      });
    },
  };
})((window.SX = window.SX || {}));
