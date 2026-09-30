/* 10 WALL — "미국은 / 신제품 문을 닫았지만,"
   The cloud from 09 clears off a red map. Hatched restricted zones grow like airspace limits:
   2020-12 ENTITY LIST (b1), 2022-10 DOD LIST (b2), 2025-12-22 FCC COVERED LIST (b3) — the last one swallows the
   NEW MODELS pin (locked) while the EXISTING MODELS pin stays outside (still sold). 2026-02-20 9TH CIRCUIT · FILED (b4).
   Exit: zoom steps 28MM → 168MM on the last two 16ths, then a hard cut. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const US = D.us;

  const ZONES = [
    { cx: 1240, cy: 560, r: 150, t0: T.E8 - T.LEAD, irr: 0 }, // after the cloud clears, on the 8th
    { cx: 1300, cy: 640, r: 270, t0: 0.5 - T.LEAD, irr: 0.05 },
    { cx: 1380, cy: 640, r: 420, t0: 1.0 - T.LEAD, irr: 0.12 },
  ];
  const PIN = { x: 1580, y: 400 };
  const OLD = { x: 860, y: 900 };
  const ZOOM = [{ t: 1.75, z: 2.2 }, { t: 1.875, z: 6 }]; // 168 / 28 = 6×

  function zonePath(z, seed) {
    const r = U.rng(seed);
    const waves = [2, 3, 5].map((f) => ({ f, ph: r() * Math.PI * 2, a: 0.5 / f + r() * 0.2 }));
    const pts = [];
    for (let a = 0; a < 72; a++) {
      const th = (a / 72) * Math.PI * 2;
      const m = 1 + z.irr * waves.reduce((v, w) => v + w.a * Math.sin(w.f * th + w.ph), 0); // periodic: no seam
      pts.push([Math.cos(th) * z.r * m, Math.sin(th) * z.r * m]);
    }
    return U.pathD(pts) + 'Z';
  }

  function pinShape(fill) {
    const g = U.s('g');
    g.appendChild(U.s('path', { d: 'M0 0C-9 -16 -26 -30 -26 -50A26 26 0 1 1 26 -50C26 -30 9 -16 0 0Z', fill, stroke: C.mist, 'stroke-width': 2.5 }));
    return g;
  }

  /** Tiny top-view quad inside a pin head */
  function quadIcon(parent, col) {
    const g = U.s('g', { transform: 'translate(0 -50)', stroke: col, 'stroke-width': 2.4, fill: 'none' });
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([x, y]) => {
      g.appendChild(U.s('line', { x1: 0, y1: 0, x2: x, y2: y }));
      g.appendChild(U.s('circle', { cx: x, cy: y, r: 5 }));
    });
    g.appendChild(U.s('rect', { x: -4, y: -5.5, width: 8, height: 11, rx: 2, fill: col, stroke: 'none' }));
    parent.appendChild(g);
    return g;
  }

  SX.defineScene({
    id: 10,
    role: 'WALL',
    bg: 'beacon',
    ruler: (lt) => ({ from: 2020, to: 2026, mark: SX.hud.hop(lt, [2020, 2022, 2025, 2026]) }),

    build(cam) {
      const st = {};
      st.lens = U.h('div', { class: 'layer full', style: 'transform-origin:0 0' });
      cam.appendChild(st.lens);
      const svg = U.svgFull();
      st.lens.appendChild(svg);

      // Hatch pattern (user space, so overlapping zones share one set of lines)
      const defs = U.s('defs');
      const pat = U.s('pattern', { id: 'dji-hatch', patternUnits: 'userSpaceOnUse', width: 16, height: 16, patternTransform: 'rotate(45)' });
      pat.appendChild(U.s('rect', { x: 0, y: 0, width: 2.6, height: 16, fill: C.ink }));
      defs.appendChild(pat);
      svg.appendChild(defs);

      st.map = U.s('g');
      svg.appendChild(st.map);
      SX.land.contours(st.map, { hills: 10, levels: 7, seed: 1010, color: ui.tone(C.beacon, -0.3), op: 0.6, sw: 1.4 });
      const grid = U.s('g', { stroke: ui.tone(C.beacon, -0.18), 'stroke-width': 1, opacity: 0.6 });
      for (let x = -120; x <= 2040; x += 240) grid.appendChild(U.s('line', { x1: x, x2: x, y1: -100, y2: 1180 }));
      for (let y = -60; y <= 1140; y += 240) grid.appendChild(U.s('line', { x1: -120, x2: 2040, y1: y, y2: y }));
      st.map.appendChild(grid);

      // Zones (outline + faint fill + hatch), largest drawn first
      st.zones = ZONES.map((z, i) => {
        const d = zonePath(z, 70 + i);
        const g = U.s('g');
        g.append(
          U.s('path', { d, fill: C.ink, opacity: 0.08 }),
          U.s('path', { d, fill: 'url(#dji-hatch)', opacity: 0.42 }),
          U.s('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': 3.5 })
        );
        return { z, g };
      });
      st.zones.slice().reverse().forEach((Z) => st.map.appendChild(Z.g));
      st.badges = ZONES.map((z, i) => {
        const g = U.s('g');
        g.append(U.s('rect', { x: -17, y: -17, width: 34, height: 34, fill: C.ink }), U.s('text', { x: 0, y: 8, 'text-anchor': 'middle', fill: C.beacon, 'font-family': 'var(--f-mono)', 'font-size': 22, 'font-weight': 700, text: String(i + 1) }));
        st.map.appendChild(g);
        return g;
      });

      // Pins: NEW MODELS (gets locked inside zone 3), EXISTING MODELS (outside, check)
      st.pin = pinShape(C.ink);
      quadIcon(st.pin, C.beacon);
      st.lock = U.s('g');
      st.lock.append(
        U.s('path', { d: 'M-8 0V-8A8 8 0 0 1 8 -8V0', fill: 'none', stroke: C.ink, 'stroke-width': 4 }),
        U.s('rect', { x: -13, y: -1, width: 26, height: 20, rx: 3, fill: C.mist, stroke: C.ink, 'stroke-width': 3 }),
        U.s('rect', { x: -2, y: 5, width: 4, height: 8, fill: C.ink })
      );
      st.pin.appendChild(st.lock);
      st.old = pinShape(C.ink);
      quadIcon(st.old, C.mist);
      st.old.appendChild(U.s('path', { d: 'M18 -84L26 -76L42 -94', fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      st.map.append(st.old, st.pin);

      // Map labels
      st.pinTag = ui.tag(st.lens, PIN.x + 36, PIN.y - 40, 'NEW MODELS');
      st.oldTag = ui.tag(st.lens, OLD.x + 36, OLD.y - 40, 'EXISTING MODELS');
      st.call = U.h('div', { class: 'mono', style: `left:${PIN.x - 430}px;top:${PIN.y - 150}px;padding:10px 14px;background:${C.mist};color:${C.ink};border:2px solid ${C.ink};line-height:1.6` });
      st.call.append(U.h('div', { text: US[2].note, style: 'font-weight:700' }), U.h('div', { text: US[2].note2 }));
      st.lens.appendChild(st.call);

      // Legend (left column)
      st.legend = US.slice(0, 3).map((u, i) => ui.tag(st.lens, 124, 540 + i * 64, `${u.date} · ${u.label}`, String(i + 1)));
      st.court = ui.chip(st.lens, 124, 760, US[3].label, US[3].date);

      st.cap = ui.caption(st.lens, { x: 120, y: 172, text: 'UNITED STATES / 2020 → 2026' });
      st.head = ui.headline(st.lens, { x: 120, y: 212, size: 104, lines: ['미국은', '신제품 문을 닫았지만,'] });

      // Cloud from 09 clearing upward
      st.cloud = U.svgFull();
      st.cloudG = SX.transitions.cloudMass(st.cloud);
      cam.appendChild(st.cloud);

      // Viewfinder zoom readout (outside the lens, not magnified)
      st.zoomUi = U.h('div', { style: 'left:1520px;top:872px;display:flex;align-items:center;gap:14px' });
      st.zoomLbl = U.h('div', { class: 'zoom-lbl mono', text: D.focal[0] });
      const bar = U.h('div', { style: 'position:relative;width:150px;height:2px;background:currentColor' });
      st.zoomDot = U.h('i', { style: 'position:absolute;top:-6px;left:0;width:14px;height:14px;border-radius:50%;background:currentColor' });
      bar.appendChild(st.zoomDot);
      st.zoomUi.append(st.zoomLbl, bar);
      cam.appendChild(st.zoomUi);
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);

      // Cloud clears (continues the 09 → 10 cloud pass)
      const cy = -260 - 1600 * E.outCubic(U.prog(lt, 0, 0.35));
      st.cloudG.setAttribute('transform', `translate(0 ${cy.toFixed(1)})`);
      st.cloud.style.display = lt < 0.36 ? '' : 'none';

      // Zones grow on b1 · b2 · b3
      st.zones.forEach(({ z, g }, i) => {
        const p = U.prog(lt, z.t0, z.t0 + 0.32);
        const k = p <= 0 ? 0 : E.outBack(p, 1.3);
        g.setAttribute('transform', `translate(${z.cx} ${z.cy}) scale(${Math.max(0.001, k).toFixed(4)})`);
        g.setAttribute('opacity', p > 0 ? 1 : 0);
        const bk = E.outBack(U.prog(lt, z.t0 + 0.2, z.t0 + 0.34), 2.4);
        const top = z.cy - z.r * (1 + z.irr * 0.3) + 4;
        st.badges[i].setAttribute('transform', `translate(${z.cx} ${top.toFixed(1)}) scale(${bk.toFixed(4)})`);
        ui.pop(st.legend[i], lt, z.t0 + 0.12, { from: 0.6 });
      });

      // Pins: new models locked when zone 3 lands (b3); existing pin stays outside
      const pe = E.outBack(U.prog(lt, 0.1, 0.3), 2);
      const shake = lt > 1.0 && lt < 1.3 ? Math.sin(lt * 90) * 5 * (1 - U.prog(lt, 1.0, 1.3)) : 0;
      st.pin.setAttribute('transform', `translate(${(PIN.x + shake).toFixed(1)} ${PIN.y}) scale(${pe.toFixed(4)})`);
      const le = E.outBack(U.prog(lt, 1.02, 1.16), 2.6);
      st.lock.setAttribute('transform', `translate(24 -84) scale(${le.toFixed(4)})`);
      st.old.setAttribute('transform', `translate(${OLD.x} ${OLD.y}) scale(${E.outBack(U.prog(lt, 0.2, 0.4), 2).toFixed(4)})`);
      ui.pop(st.pinTag, lt, 0.2, { from: 0.6 });
      ui.pop(st.oldTag, lt, 0.3, { from: 0.6 });
      ui.pop(st.call, lt, 1.1, { from: 0.7 });
      ui.pop(st.court, lt, 1.5, { from: 0.5 });

      // Zoom steps on the last two 16ths, centred on the locked pin (it drifts to frame centre)
      let z = 1;
      ZOOM.forEach((s, i) => {
        const prev = i ? ZOOM[i - 1].z : 1;
        z *= 1 + (s.z / prev - 1) * E.outExpo(U.prog(lt, s.t, s.t + T.frames(3)));
      });
      const zp = Math.log(z) / Math.log(6);
      const px = PIN.x;
      const py = PIN.y - 50;
      const sx = U.lerp(px, 960, zp);
      const sy = U.lerp(py, 540, zp);
      st.lens.style.transform = z > 1.0001 ? `translate(${(sx - px * z).toFixed(1)}px,${(sy - py * z).toFixed(1)}px) scale(${z.toFixed(4)})` : '';
      st.zoomUi.style.opacity = U.clamp((lt - 1.45) * 8).toFixed(3);
      U.setText(st.zoomLbl, lt >= ZOOM[1].t ? D.focal[1] : D.focal[0]);
      st.zoomDot.style.left = `${(136 * zp).toFixed(1)}px`;
    },
  });
})((window.SX = window.SX || {}));
