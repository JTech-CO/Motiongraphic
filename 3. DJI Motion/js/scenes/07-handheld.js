/* 07 HANDHELD — "하늘 다음은 / 손 안,"
   The photo captured at the end of 06 floats in; the Osmo Pocket (2018) rises (b1), becomes the Pocket 3 whose
   screen pivots to landscape and receives the photo (b2). A bar breaks through the reported internal guidance
   band (300,000–400,000) to 5,000,000+ units in 2024 (b3); 10,000,000+ cumulative by 2025 Q3 (b4).
   Exit: hyperlapse (transitions.js) — the frame smears into light trails that become 08's lines. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;
  const PK = D.pocket3;

  const POCKET = { x: 1010, y: 1030, s: 4.0 };
  const AX = { x: 1520, y0: 930, h: 600, max: 5000000 }; // bar axis
  const yU = (u) => AX.y0 - (u / AX.max) * AX.h;
  const WAIT = { cx: 560, cy: 760, s: 0.25 };

  /** Small copy of scene 06 for the photo (fog, 250 g line, pad, Mini 5 Pro) */
  function photo(parent) {
    const svg = U.s('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' });
    svg.appendChild(U.s('rect', { width: 1920, height: 1080, fill: C.mist }));
    SX.land.ridges(svg, {
      color: C.mist,
      layers: [
        { y: 640, amp: 200, seed: 61, k: -0.04, speed: 0 },
        { y: 720, amp: 160, seed: 62, k: -0.07, speed: 0 },
        { y: 820, amp: 120, seed: 63, k: -0.11, speed: 0 },
      ],
    }).update(0);
    svg.appendChild(U.s('line', { x1: 40, x2: 1660, y1: 560, y2: 560, stroke: C.ink, 'stroke-width': 3 }));
    svg.appendChild(U.s('rect', { x: 830, y: 876, width: 580, height: 22, rx: 6, fill: ui.tone(C.mist, -0.3) }));
    P.layer(svg).draw(P.quadPolys(P.QUAD.mini5, { x: 1120, y: 876, s: 2.25, yaw: 24, pitch: 14 }, { rotor: 0, spin: 0.4 }));
    const el = U.h('div', { style: 'left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;overflow:hidden' }, svg);
    parent.appendChild(el);
    return el;
  }

  SX.defineScene({
    id: 7,
    role: 'HANDHELD',
    bg: 'sky',
    ruler: (lt) => ({ from: 2018, to: 2025, mark: SX.hud.hop(lt, [2018, 2024, 2024, 2025]) }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.clouds = SX.land.clouds(svg, { color: ui.tone(C.sky, 0.5), n: 6, y: 420, spread: 300, seed: 71, w: [240, 520], h: [28, 64], speed: 16, op: 0.8 });
      st.ridges = SX.land.ridges(svg, {
        color: C.sky,
        layers: [
          { y: 1000, amp: 150, seed: 71, k: -0.1, speed: 8 },
          { y: 1060, amp: 110, seed: 72, k: -0.2, speed: 18 },
        ],
      });

      // Bars: reported guidance band and the 2024 units bar
      const bars = U.s('g');
      bars.appendChild(U.s('line', { x1: AX.x - 340, x2: AX.x + 250, y1: AX.y0, y2: AX.y0, stroke: C.ink, 'stroke-width': 3 }));
      st.band = U.s('rect', { x: AX.x - 340, width: 590, y: yU(PK.guidance[1]), height: yU(PK.guidance[0]) - yU(PK.guidance[1]), fill: C.ink, opacity: 0.35 });
      st.bar = U.s('rect', { x: AX.x, width: 130, fill: C.ink });
      st.barCap = U.s('path', { fill: C.ink });
      bars.append(st.band, st.bar, st.barCap);
      svg.appendChild(bars);
      st.pocket = P.layer(svg);
      cam.appendChild(svg);

      st.photo = photo(cam);
      st.bandTag = U.h('div', { class: 'mono sm', style: `left:${AX.x - 334}px;top:${yU(PK.guidance[1]) - 52}px;line-height:1.5` });
      st.bandTag.append(U.h('div', { text: 'INTERNAL GUIDANCE · REPORTED' }), U.h('div', { text: `${U.fmtInt(PK.guidance[0])}–${U.fmtInt(PK.guidance[1])}` }));
      cam.appendChild(st.bandTag);
      st.unitTag = ui.tag(cam, AX.x - 6, yU(AX.max) - 74, `2024 · ${PK.source}`, '5,000,000+');
      st.cum = ui.chip(cam, 124, 860, `CUMULATIVE · ${PK.cumWhen}`, PK.cum);
      st.model = ui.tag(cam, POCKET.x + 110, 560, String(D.pocket.year), D.pocket.model);
      st.model3 = ui.tag(cam, POCKET.x + 110, 560, 'UNITS · 2024', PK.model);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${PK.model} / UNITS · 2024` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['하늘 다음은', '손 안,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      st.clouds.update(lt + 12);
      st.ridges.update(lt + 12);

      // Pocket rises (b1), becomes Pocket 3 (b2) and turns its screen to landscape
      const rise = E.outCubic(U.prog(lt, 0.05, 0.45));
      const m = E.inOutCubic(U.prog(lt, 0.45, 0.62));
      const scr = E.inOutCubic(U.prog(lt, 0.55, 0.8));
      const spec = P.lerpSpec(P.HAND.pocket1, P.HAND.pocket3, m);
      const view = { x: POCKET.x, y: POCKET.y + (1 - rise) * 720, s: POCKET.s, yaw: 14 * (1 - scr), pitch: 5, anchors: {} };
      st.pocket.draw(P.pocketPolys(spec, view, { screen: scr }));
      st.model.style.opacity = (U.clamp((lt - 0.2) * 6) * (1 - m)).toFixed(3);
      st.model3.style.opacity = U.clamp((m - 0.5) * 3).toFixed(3);

      // Photo: from the shutter frame (photo0) → waiting spot (b1) → into the screen (b2)
      const s0 = SX.L.photo0;
      const scn = view.anchors.screen;
      const tgt = { cx: scn.x, cy: scn.y, s: Math.min((2 * scn.hw) / 1920, (2 * scn.hh) / 1080) * 0.98 };
      const a = E.outCubic(U.prog(lt, 0, 0.4));
      const b = E.inOutCubic(U.prog(lt, 0.55, 0.8));
      const cx = U.lerp(U.lerp(s0.cx, WAIT.cx, a), tgt.cx, b);
      const cy = U.lerp(U.lerp(s0.cy, WAIT.cy, a), tgt.cy, b);
      const s = U.lerp(U.lerp(s0.s, WAIT.s, a), tgt.s, b);
      const tilt = (1 - b) * Math.sin(lt * 3) * 2;
      st.photo.style.transform = `translate(${(cx - 960 * s).toFixed(1)}px,${(cy - 540 * s).toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${tilt.toFixed(2)}deg)`;
      st.photo.style.outline = `${(22 * (1 - b)).toFixed(1)}px solid ${C.mist}`;

      // Bars: guidance band (b2), bar breaks through to 5,000,000+ (b3)
      const be = U.clamp((lt - 0.5) * 5);
      st.band.setAttribute('opacity', (0.35 * be).toFixed(3));
      st.bandTag.style.opacity = be.toFixed(3);
      const g = E.outBack(U.prog(lt, 1.0 - T.LEAD, 1.0 + 0.2), 1.4);
      const top = yU(AX.max * U.clamp(g, 0, 1.08));
      st.bar.setAttribute('y', top.toFixed(1));
      st.bar.setAttribute('height', Math.max(0, AX.y0 - top).toFixed(1));
      st.barCap.setAttribute('d', g > 0.02 ? `M${AX.x} ${top.toFixed(1)}L${AX.x + 65} ${(top - 34).toFixed(1)}L${AX.x + 130} ${top.toFixed(1)}Z` : '');
      ui.pop(st.unitTag, lt, 1.05, { from: 0.6 });
      ui.pop(st.cum, lt, 1.5, { from: 0.5 });
    },
  });
})((window.SX = window.SX || {}));
