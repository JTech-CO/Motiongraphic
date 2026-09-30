/* Persistent HUD in a camera-viewfinder style: corner brackets, scene id, ● REC + timecode (from the
   timeline, not telemetry), BPM + 4 beat cells, and a 2006–2026 flight path with waypoints on which a
   small drone marker glides to the years each scene covers. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  const Y0 = 2006;
  const Y1 = 2026;
  const BRAND = 'DJI 2006→2026 · 120 BPM';
  const PW = 1040;
  const xOf = (y) => ((U.clamp(y, Y0, Y1) - Y0) / (Y1 - Y0)) * PW;
  const yOf = (x) => 40 - 14 * Math.sin((x / PW) * Math.PI); // gentle climb-and-descend arc
  const LABELS = [2006, 2010, 2015, 2020, 2026];

  let root, tl, rec, recDot, beats, src, vf, path, lit, dots, marker, markTxt;

  function arcD(x0, x1) {
    let d = '';
    for (let x = x0; x <= x1 + 0.01; x += 8) d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${yOf(Math.min(x, x1)).toFixed(1)}`;
    return d;
  }

  SX.hud = {
    build(stage) {
      root = stage.querySelector('#hud');
      vf = ['tl', 'tr', 'bl', 'br'].map((c) => U.h('div', { class: `vf ${c}` }));
      tl = U.h('div');
      recDot = U.h('i');
      rec = U.h('span');
      const tlBox = U.h('div', { class: 'hud-tl' }, tl, U.h('div', { class: 'hud-rec' }, recDot, rec));
      beats = [0, 1, 2, 3].map(() => U.h('i'));
      const tr = U.h('div', { class: 'hud-tr' }, U.h('span', { text: BRAND }), U.h('span', { class: 'hud-beats' }, beats));
      src = U.h('div', { class: 'hud-src' });

      path = U.s('svg', { class: 'hud-path', width: PW, height: 64, viewBox: `0 0 ${PW} 64` });
      path.appendChild(U.s('path', { d: arcD(0, PW), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2, opacity: 0.45, 'stroke-dasharray': '2 6' }));
      lit = U.s('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round' });
      path.appendChild(lit);
      dots = [];
      for (let y = Y0; y <= Y1; y++) {
        const x = xOf(y);
        const c = U.s('circle', { cx: x, cy: yOf(x), r: 2.2, fill: 'currentColor', opacity: 0.55 });
        path.appendChild(c);
        dots.push({ y, c });
        if (LABELS.includes(y)) path.appendChild(U.s('text', { x, y: 62, 'text-anchor': 'middle', text: String(y), opacity: 0.75 }));
      }
      // Tiny top-view quad marker
      marker = U.s('g');
      [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(([dx, dy]) => {
        marker.appendChild(U.s('line', { x1: 0, y1: 0, x2: dx, y2: dy, stroke: 'currentColor', 'stroke-width': 2 }));
        marker.appendChild(U.s('circle', { cx: dx, cy: dy, r: 3.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }));
      });
      marker.appendChild(U.s('rect', { x: -3.5, y: -4.5, width: 7, height: 9, rx: 2, fill: 'currentColor' }));
      markTxt = U.s('text', { y: -14, 'text-anchor': 'middle' });
      const mg = U.s('g');
      mg.append(marker, markTxt);
      path.appendChild(mg);
      marker.parentG = mg;

      root.append(...vf, tlBox, tr, src, path);
    },

    /** sc: { def, lt, slot } of the scene that owns the current beat */
    update(t, sc) {
      const { def, lt } = sc;
      const bg = def.bgAt ? def.bgAt(lt) : def.bg;
      // Over the letterbox bars the HUD switches to the light tone
      root.style.setProperty('--hud-fg', SX.letterbox.value > 0.5 ? SX.C.mist : SX.BG[bg].fg);

      U.setText(tl, `${U.pad(def.id)} / 12 — ${def.role}`);
      const f = Math.min(T.TOTAL_FRAMES - 1, Math.floor(t * T.FPS + 1e-6));
      U.setText(rec, `REC 00:00:${U.pad(Math.floor(f / T.FPS))}:${U.pad(f % T.FPS)}`);
      recDot.style.opacity = U.mod(t, T.SPB) < T.SPB / 2 ? 1 : 0.25;
      U.setText(src, `DATA AS OF ${SX.DATA.asOf} · SRC: ${SX.DATA.sources[def.id - 1]}`);

      const beat = Math.floor(lt / T.SPB + 1e-6);
      const pb = U.pulse(lt, T.SPB, 0.1);
      beats.forEach((b, i) => {
        b.classList.toggle('on', i === beat % 4);
        b.style.transform = i === beat % 4 ? `scale(${(1 + 0.25 * pb).toFixed(3)})` : '';
      });
      const arm = (44 + 8 * pb).toFixed(2) + 'px';
      vf.forEach((c) => {
        c.style.width = arm;
        c.style.height = arm;
      });

      const r = def.ruler(lt);
      const from = Math.min(r.from, r.to);
      const to = Math.max(r.from, r.to);
      lit.setAttribute('d', to - from < 0.05 ? arcD(xOf(from) - 2, xOf(from) + 2) : arcD(xOf(from), xOf(to)));
      dots.forEach((d) => d.c.setAttribute('opacity', d.y >= from - 0.01 && d.y <= to + 0.01 ? 1 : 0.4));
      const mx = xOf(r.mark);
      const slope = (yOf(mx + 1) - yOf(mx - 1)) / 2;
      const bank = U.clamp((r.vel || 0) * 6, -18, 18);
      marker.parentG.setAttribute('transform', `translate(${mx.toFixed(1)} ${(yOf(mx) - 1).toFixed(1)})`);
      marker.setAttribute('transform', `rotate(${(U.deg(Math.atan(slope)) + bank).toFixed(2)})`);
      markTxt.textContent = r.label || (r.mark < Y0 - 0.5 ? `◀ ${Math.round(r.mark)}` : String(Math.round(U.clamp(r.mark, Y0, Y1))));
    },
  };

  /** Ruler helper for scenes: marker hops to years[beat] on each beat (lands in 4 frames) */
  SX.hud.hop = (lt, years, step = T.SPB) => {
    let v = years[0];
    for (let i = 1; i < years.length; i++) {
      v += (years[i] - years[i - 1]) * SX.E.outCubic(U.prog(lt, i * step - T.LEAD, i * step));
    }
    return v;
  };
})((window.SX = window.SX || {}));
