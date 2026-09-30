/* 06 249G — "249g, / 규제선 바로 아래로,"
   Fog. The Mavic Mini descends through the frame onto a weighing pad; the reading climbs to 249 g on 16ths (b1),
   the 250 g line is drawn across the landscape like a horizon (b2), the Mini morphs into the Mini 5 Pro at
   249.9 g · 1" 50MP (b3), UNDER 250 G with thirds guides and focus lock (b4).
   Exit: shutter capture (transitions.js) — the frame freezes into a photo that flies to scene 07. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;

  const PAD = { x: 1120, y: 880 };
  const G = { x: 1720, y0: 940, py: 1.52 }; // gauge: 0 g at y0, 1.52 px per g
  const yG = (g) => G.y0 - g * G.py;
  SX.L.photo0 = { cx: 1180, cy: 560, s: 0.4 };

  SX.defineScene({
    id: 6,
    role: '249G',
    bg: 'mist',
    ruler: (lt) => ({ from: 2019, to: 2025, mark: SX.hud.hop(lt, [2019, 2019, 2025, 2025]) }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.ridges = SX.land.ridges(svg, {
        color: C.mist,
        layers: [
          { y: 640, amp: 200, seed: 61, k: -0.04, speed: 5 },
          { y: 720, amp: 160, seed: 62, k: -0.07, speed: 10 },
          { y: 820, amp: 120, seed: 63, k: -0.11, speed: 18 },
        ],
      });
      st.fog = SX.land.clouds(svg, { color: '#F3F5F3', n: 8, y: 700, spread: 260, seed: 66, w: [420, 900], h: [16, 36], speed: 24, op: 0.8 });

      // 250 g line across the landscape + gauge column
      st.line = U.s('line', { y1: yG(D.limitG), y2: yG(D.limitG), x1: 40, stroke: C.ink, 'stroke-width': 3 });
      svg.appendChild(st.line);
      const gauge = U.s('g');
      gauge.appendChild(U.s('rect', { x: G.x - 22, y: yG(300), width: 44, height: 300 * G.py, fill: ui.tone(C.mist, -0.08), stroke: C.ink, 'stroke-width': 2 }));
      for (let g = 0; g <= 300; g += 50) gauge.appendChild(U.s('line', { x1: G.x - 36, x2: G.x - 22, y1: yG(g), y2: yG(g), stroke: C.ink, 'stroke-width': 2 }));
      st.gfill = U.s('rect', { x: G.x - 18, width: 36, fill: C.beacon });
      gauge.appendChild(st.gfill);
      svg.appendChild(gauge);

      // Weighing pad
      svg.append(
        U.s('ellipse', { cx: PAD.x, cy: PAD.y + 8, rx: 300, ry: 30, fill: C.ink, opacity: 0.12 }),
        U.s('rect', { x: PAD.x - 290, y: PAD.y - 4, width: 580, height: 22, rx: 6, fill: ui.tone(C.mist, -0.3), stroke: ui.tone(C.mist, -0.5), 'stroke-width': 2 })
      );
      st.drone = P.layer(svg);
      cam.appendChild(svg);

      for (let g = 0; g <= 300; g += 50) cam.appendChild(U.box(G.x + 34, yG(g) - 10, 'mono sm', `${g}`));
      st.lineTag = ui.tag(cam, 1480, yG(D.limitG) - 58, 'LINE', `${D.limitG} G`);
      st.thirds = ui.thirds(cam);
      st.focus = ui.focus(cam);

      st.count = ui.counter(cam, { x: 120, y: 612, size: 168 });
      st.model = ui.tag(cam, 124, 800, D.mini.date, D.mini.model);
      st.model5 = ui.tag(cam, 124, 800, `${D.mini5.year} · ${D.mini5.cam}`, D.mini5.model);
      st.under = ui.chip(cam, 124, 880, `UNDER ${D.limitG} G`, '✓');

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${D.mini.model} / ${D.mini.date}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['249g,', '규제선 바로 아래로,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      st.ridges.update(lt + 10);
      st.fog.update(lt + 10);

      // Mini descends (b1) and lands; rotors stop once it is weighed
      const land = E.outCubic(U.prog(lt, 0, 0.5));
      const rotor = 1 - E.inQuad(U.prog(lt, 0.5, 0.8));
      const m5 = E.inOutCubic(U.prog(lt, 1.0 - T.LEAD, 1.15));
      const spec = P.lerpSpec(P.QUAD.mini1, P.QUAD.mini5, m5);
      const y = PAD.y - 4 - (1 - land) * 430 + Math.sin(lt * 7) * 4 * (1 - land);
      const polys = P.quadPolys(spec, { x: PAD.x, y, s: 2.25, yaw: 24, pitch: 14 }, { rotor, spin: lt * 30 * (0.2 + rotor) });
      st.drone.draw(polys);

      // Reading: 16th-note steps to 249 g, then 249.9 g with the Mini 5 Pro
      const l0 = Math.max(0, lt); // the scene is already visible during the rack focus before its first beat
      const steps = Math.min(4, Math.floor(l0 / T.E16) + 1);
      let g = l0 < 0.5 ? (D.mini.g * steps) / 4 : D.mini.g;
      if (l0 >= 1.0) g = D.mini5.g;
      const gShow = l0 < 0.5 ? U.lerp((D.mini.g * (steps - 1)) / 4, (D.mini.g * steps) / 4, E.outCubic(U.clamp((l0 - (steps - 1) * T.E16) / 0.08))) : g;
      st.count.set(`${gShow >= 249.5 ? gShow.toFixed(1) : Math.round(gShow)} g`);
      st.gfill.setAttribute('y', yG(gShow).toFixed(1));
      st.gfill.setAttribute('height', (gShow * G.py).toFixed(1));

      // 250 g line draws across on b2
      const lx = E.inOutCubic(U.prog(lt, 0.5 - T.LEAD, 0.75));
      st.line.setAttribute('x2', (40 + (G.x - 60) * lx).toFixed(1));
      st.line.setAttribute('opacity', lx > 0 ? 1 : 0);
      ui.pop(st.lineTag, lt, 0.6, { from: 0.6 });

      st.model.style.opacity = (U.clamp(lt * 5) * (1 - U.clamp((lt - 0.95) * 10))).toFixed(3);
      ui.pop(st.model5, lt, 1.0, { from: 0.7 });
      ui.pop(st.under, lt, 1.5, { from: 0.5 });

      // b4: filming overlays
      const bb = P.bbox(polys);
      const fe = U.prog(lt, 1.5 - T.LEAD, 1.5 + 0.25);
      st.focus.set(bb.x - 20, bb.y - 20, bb.w + 40, bb.h + 40, fe, lt >= 1.5 - T.LEAD ? 1 : 0);
      st.thirds.style.opacity = U.clamp((lt - 1.45) * 6).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
