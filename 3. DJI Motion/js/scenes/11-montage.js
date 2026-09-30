/* 11 MONTAGE — numbers only
   Eight hard cuts on 8th notes, and every cut changes the camera angle (shot type top right):
   WIDE 2006-01-18 · LOW ANGLE 400,000 · TOP-DOWN 83.48% · TELE 168MM 30× · CLOSE-UP 249 g ·
   HANDHELD 10,000,000+ · FPV 66% · WIDE ~$11.5B EST. Backgrounds rotate night → sky → mist → ridge → beacon → night → sky → mist.
   Exit: gimbal horizon wipe (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;
  const CUT = T.E8;

  const CUTS = [
    { bg: 'night', shot: 'WIDE', value: D.founded, label: `FOUNDED · ${D.hq}`, year: 2006, size: 170 },
    { bg: 'sky', shot: 'LOW ANGLE', value: U.fmtInt(D.units2014), label: 'UNITS · 2014', year: 2014, size: 200 },
    { bg: 'mist', shot: 'TOP-DOWN', value: `${D.detections.parts[0].pct.toFixed(2)}%`, label: `DJI · DRONE DETECTIONS ${D.detections.year} · ${D.detections.source}`, year: 2025, size: 200 },
    { bg: 'ridge', shot: `TELE ${D.focal[1]}`, value: D.flagship.rangeX, label: `RANGE · ${D.flagship.from.model} → ${D.flagship.to.model}`, year: 2025, size: 240 },
    { bg: 'beacon', shot: 'CLOSE-UP', value: `${D.mini.g} g`, label: `${D.mini.model} · ${D.mini.date}`, year: 2019, size: 220 },
    { bg: 'night', shot: 'HANDHELD', value: D.pocket3.cum, label: `${D.pocket3.model} · CUMULATIVE · ${D.pocket3.cumWhen}`, year: 2025, size: 150 },
    { bg: 'sky', shot: 'FPV', value: `${D.actionCam.right.dji}%`, label: `DJI · ACTION CAM SHARE · ${D.actionCam.right.when}`, year: 2025, size: 220 },
    { bg: 'mist', shot: 'WIDE', value: D.revenue[3].label, label: `REVENUE ${D.revenue[3].year} · EST.`, year: 2025, size: 190 },
  ];
  const cutAt = (lt) => U.clamp(Math.floor(lt / CUT + 1e-6), 0, CUTS.length - 1);

  // ---------- per-cut visuals (drawn once; animated with group transforms) ----------

  function board(g) {
    const fg = C.mist;
    g.appendChild(U.s('rect', { x: -170, y: -170, width: 340, height: 340, rx: 10, fill: ui.tone(C.night, 0.1), stroke: fg, 'stroke-width': 2.5 }));
    g.appendChild(U.s('rect', { x: -52, y: -52, width: 104, height: 104, fill: ui.tone(C.night, 0.3), stroke: fg, 'stroke-width': 2 }));
    const r = U.rng(606);
    for (let k = 0; k < 28; k++) {
      const side = k % 4;
      const t = -120 + r() * 240;
      const a = [[-52, t * 0.4], [52, t * 0.4], [t * 0.4, -52], [t * 0.4, 52]][side];
      const b = [[-170, t], [170, t], [t, -170], [t, 170]][side];
      const mid = side < 2 ? [U.lerp(a[0], b[0], 0.5), a[1]] : [a[0], U.lerp(a[1], b[1], 0.5)];
      const mid2 = side < 2 ? [mid[0] + (b[0] - mid[0]) * 0.3, b[1]] : [b[0], mid[1] + (b[1] - mid[1]) * 0.3];
      g.appendChild(U.s('path', { d: U.pathD([a, mid, mid2, b, [b[0] * 2.2, b[1] * 2.2]]), fill: 'none', stroke: fg, 'stroke-width': 2, opacity: 0.35 + r() * 0.6 }));
    }
    [[-120, -120], [120, -120], [-120, 120], [120, 120]].forEach(([x, y]) => g.appendChild(U.s('circle', { cx: x, cy: y, r: 9, fill: 'none', stroke: fg, 'stroke-width': 2 })));
  }

  function formation(g) {
    [[0, 0, 1.5], [-290, 210, 0.8], [330, 170, 0.8], [-110, 340, 0.5], [230, 380, 0.45], [420, -70, 0.6]].forEach(([x, y, s]) => {
      P.layer(g).draw(P.quadPolys(P.QUAD.phantom1, { x, y, s, yaw: 18, pitch: -12 }, { rotor: 1 }));
    });
  }

  function radar(g) {
    for (let k = 1; k <= 4; k++) g.appendChild(U.s('circle', { r: 80 * k, fill: 'none', stroke: C.ink, 'stroke-width': k === 4 ? 2.5 : 1.2, opacity: k === 4 ? 0.8 : 0.35 }));
    g.appendChild(U.s('path', { d: 'M0 0L0 -320A320 320 0 0 1 277 -160Z', fill: C.ink, opacity: 0.08 }));
    const r = U.rng(8348);
    for (let i = 0; i < 220; i++) {
      const rr = Math.sqrt(0.03 + r() * 0.97) * 310;
      const th = r() * Math.PI * 2;
      g.appendChild(U.s('circle', { cx: Math.cos(th) * rr, cy: Math.sin(th) * rr, r: 4.2, fill: i < 184 ? C.beacon : ui.tone(C.mist, -0.35) }));
    }
  }

  function clouds(g) {
    SX.land.sun(g, 380, -250, 70, C.beacon, 0.4);
    const c = SX.land.clouds(g, { color: '#F8F9F7', n: 9, y: 180, spread: 60, seed: 118, w: [320, 700], h: [50, 120], speed: 0, op: 1, band: 600 });
    c.update(0);
    c.g.setAttribute('transform', 'translate(-960 0)');
    g.appendChild(U.s('line', { x1: -1100, x2: 1100, y1: 120, y2: 120, stroke: C.ink, 'stroke-width': 1, opacity: 0.2 }));
  }

  function streaks(g) {
    const r = U.rng(66);
    for (let i = 0; i < 26; i++) {
      g.appendChild(U.s('rect', { x: -1400 + r() * 2400, y: -480 + r() * 960, width: 200 + r() * 700, height: 1 + Math.floor(r() * 3), fill: C.ink, opacity: 0.15 + r() * 0.35 }));
    }
  }

  SX.defineScene({
    id: 11,
    role: 'MONTAGE',
    bg: 'night',
    roll: 0,
    bgAt: (lt) => (lt > 1.9 ? 'night' : CUTS[cutAt(lt)].bg), // the gimbal wipe reveals the night end card
    ruler: (lt) => ({ from: 2006, to: 2025, mark: CUTS[cutAt(lt)].year }),

    build(cam) {
      const st = { cuts: [] };
      CUTS.forEach((c, k) => {
        const el = U.h('div', { class: `cut bg-${c.bg}` });
        const svg = U.svgFull();
        const g = U.s('g');
        const fx = U.s('g');
        svg.append(fx, g);
        el.appendChild(svg);
        cam.appendChild(el);
        const cut = { el, g, fx, c };

        if (k === 0) {
          board(g);
          cut.at = { x: 1440, y: 560, s: 0.9 };
        } else if (k === 1) {
          formation(g);
          fx.appendChild(U.s('path', { d: 'M0 1080L0 1010L300 985L620 1000L980 970L1400 995L1920 975L1920 1080Z', fill: ui.tone(C.sky, -0.25) }));
          cut.at = { x: 1420, y: 440, s: 1 };
        } else if (k === 2) {
          radar(g);
          cut.at = { x: 1400, y: 580, s: 1 };
        } else if (k === 3) {
          P.layer(g).draw(P.quadPolys(P.QUAD.mavic4, { x: 0, y: 0, s: 2.7, yaw: -14, pitch: 7 }, { rotor: 1 }));
          fx.appendChild(U.s('rect', { x: 0, y: 690, width: 1920, height: 390, fill: ui.tone(C.ridge, -0.2) }));
          cut.at = { x: 1420, y: 640, s: 1 };
        } else if (k === 4) {
          P.layer(g).draw(P.quadPolys(P.QUAD.mini1, { x: 0, y: 0, s: 3.6, yaw: 30, pitch: 16 }, { rotor: 0, spin: 0.3 }));
          cut.at = { x: 1360, y: 700, s: 1 };
        } else if (k === 5) {
          fx.appendChild(U.s('circle', { cx: 1440, cy: 560, r: 330, fill: ui.tone(C.night, 0.1) }));
          P.layer(g).draw(P.pocketPolys(P.HAND.pocket3, { x: 0, y: 0, s: 4.3, yaw: 16, pitch: 4 }, { screen: 1 }));
          cut.at = { x: 1440, y: 1000, s: 1 };
        } else if (k === 6) {
          streaks(fx);
          fx.setAttribute('transform', 'translate(960 540)');
          P.layer(g).draw(P.actionPolys(P.HAND.action5, { x: 0, y: 0, s: 4.2, yaw: -26, pitch: 8 }));
          cut.at = { x: 1400, y: 700, s: 1 };
        } else {
          clouds(g);
          cut.at = { x: 1000, y: 640, s: 1 };
        }

        cut.value = U.h('div', { class: 'title', style: `left:120px;top:${540 - c.size * 0.55}px;font-size:${c.size}px;transform-origin:0 50%`, text: c.value });
        cut.label = U.box(124, 540 + c.size * 0.5 + 18, 'mono', c.label);
        cut.idx = U.box(0, 0, 'mono cut-idx', `CUT ${U.pad(k + 1)} / ${U.pad(CUTS.length)}`);
        cut.shot = U.box(0, 0, 'mono cut-shot', c.shot);
        cut.shot.style.left = '';
        cut.idx.style.left = '';
        cut.shot.style.top = '';
        cut.idx.style.top = '';
        el.append(cut.value, cut.label, cut.idx, cut.shot);
        st.cuts.push(cut);
      });
      return st;
    },

    update(st, lt) {
      const k = cutAt(lt);
      const ct = lt - k * CUT; // time inside the cut
      const q = E.outExpo(U.clamp(ct / CUT));
      st.cuts.forEach((cut, i) => (cut.el.style.display = i === k ? '' : 'none'));
      const cut = st.cuts[k];
      const a = cut.at;
      let tr = '';
      let fxTr = null;
      if (k === 0) tr = `scale(${U.lerp(0.94, 1, q).toFixed(4)})`; // wide push-in
      else if (k === 1) tr = `translate(0 ${U.lerp(60, 0, q).toFixed(1)})`; // low angle tilt up
      else if (k === 2) tr = `rotate(${U.lerp(6, 0, q).toFixed(3)})`; // top-down yaw
      else if (k === 3) tr = `translate(${U.lerp(-70, 0, q).toFixed(1)} 0)`; // tele pan
      else if (k === 4) tr = `scale(${U.lerp(1.12, 1, q).toFixed(4)})`; // close-up settle
      else if (k === 5) tr = `translate(${(Math.sin(ct * 47) * 5).toFixed(1)} ${(Math.cos(ct * 39) * 4).toFixed(1)}) rotate(${(Math.sin(ct * 31) * 0.8).toFixed(3)})`; // handheld shake
      else if (k === 6) {
        tr = `rotate(-8) scale(${U.lerp(1.1, 1, q).toFixed(4)})`; // FPV bank + rush
        fxTr = `translate(${(960 - ct * 5200).toFixed(1)} 540) rotate(-8)`;
      } else tr = `translate(${(-ct * 60).toFixed(1)} 0)`; // wide drift
      cut.g.setAttribute('transform', `translate(${a.x} ${a.y}) scale(${a.s}) ${tr}`);
      if (fxTr) cut.fx.setAttribute('transform', fxTr);

      // Number and label pop on the cut
      ui.pop(cut.value, ct, 0, { dur: 0.18, from: 0.86 });
      cut.label.style.opacity = U.clamp((ct - 0.03) * 12).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
