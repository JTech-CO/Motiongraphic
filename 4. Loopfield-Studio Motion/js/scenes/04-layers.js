/* 04 FEATURE — "네 겹으로 / 포개지고,"
   Four layer planes in an exploded perspective stack. L1 PRISM · NORMAL · 100% · AURORA (b1) and L2 ORBITAL ·
   SCREEN · 28% · ROT 20° · PHASE 0.12 · CANDY drop in from example 01 「겹쳐지는 궤도」 (b2); L3 INTERFERENCE · ADD
   and L4 MOIRÉ · DIFFERENCE (demo pair) on 16ths while the five blend names cycle (b3); the stack folds flat into
   the composite computed with Loopfield's blend formulas (b4). Exit: blend sweep. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const CX = 1300;
  const CY = 570;
  const PW = 760;
  const PH = 428;
  const F = 2400;
  const LAYERS = D.example01.layers.concat([
    { preset: 'interference', label: 'INTERFERENCE', blend: 'add', opacity: 0.45, palette: 2, rot: 0, phase: 0, demo: true },
    { preset: 'moire', label: 'MOIRÉ', blend: 'difference', opacity: 0.22, palette: 5, rot: 0, phase: 0, demo: true },
  ]);
  const IN = [0.0, 0.5, 1.0, 1.0 + T.E16];

  function project(x, y, z, rx, rz) {
    const x1 = x * Math.cos(rz) - y * Math.sin(rz);
    const y1 = x * Math.sin(rz) + y * Math.cos(rz);
    const y2 = y1 * Math.cos(rx) - z * Math.sin(rx);
    const z2 = y1 * Math.sin(rx) + z * Math.cos(rx);
    const k = F / (F - z2);
    return [CX + x1 * k, CY + y2 * k, (F - z2) / F];
  }

  function label(L) {
    const pct = `${Math.round(L.opacity * 100)}%`;
    return L.demo ? `${L.label} · ${L.blend.toUpperCase()}` : [L.label, L.blend.toUpperCase(), pct, L.rot ? `ROT ${L.rot}°` : '', L.phase ? `PHASE ${L.phase}` : '', D.palettes[L.palette].key].filter(Boolean).join(' · ');
  }

  SX.defineScene({
    id: 4,
    role: 'FEATURE',
    bg: 'night',

    build(cam) {
      const st = {};
      st.example = ui.tag(cam, 124, 820, 'EXAMPLE 01', D.example01.name);
      st.blend = ui.tag(cam, 124, 880, 'BLEND', D.blends[0]);
      st.max = ui.chip(cam, 124, 946, `LAYERS ${D.layersMax} MAX · BLENDS ${D.blends.length} · NEW LAYER = ${D.newLayerBlend}`);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `LAYERS / ${D.layersMax} MAX · ${D.blends.length} BLENDS` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['네 겹으로', '포개지고,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.example, lt, 0.5, { from: 0.6 });
      const bi = U.clamp(Math.floor((lt - 1.0) / 0.1), 0, D.blends.length - 1);
      U.setText(st.blend.firstChild, D.blends[bi]);
      ui.pop(st.blend, lt, 1.0, { from: 0.7 });
      ui.pop(st.max, lt, 1.5, { from: 0.5 });
    },

    draw(G, st, lt) {
      // each layer renders into its own target, like the app's per-layer targets
      LAYERS.forEach((L, i) => {
        G.bind(G.target('L' + i, 960, 540));
        G.clear('#000000');
        G.pattern(L.preset, { palette: L.palette, rot: L.rot, phase: L.phase, loop: 4 });
      });
      // Loopfield composite over the default background
      G.bind(G.target('CB', 960, 540));
      G.clear(C.night);
      let base = G.target('CB');
      LAYERS.forEach((L, i) => {
        const into = G.target(i % 2 ? 'C1' : 'C0', 960, 540);
        G.composite(into, base, G.target('L' + i), L.opacity, L.blend);
        base = into;
      });
      const comp = base;

      G.bind(G.target(G.main));
      const m = E.inOutCubic(U.prog(lt, 1.5, 1.85));
      const rx = U.rad(U.lerp(58, 0, m));
      const rz = U.rad(U.lerp(-32, 0, m));
      const gap = U.lerp(150, 0, m);
      const planes = [];
      LAYERS.forEach((L, i) => {
        const t0 = IN[i];
        if (lt < t0) return;
        const drop = 1 - E.outCubic(U.prog(lt, t0, t0 + 0.3));
        const z = (i - 1.5) * gap + drop * 320;
        const pts = [[-PW / 2, -PH / 2], [PW / 2, -PH / 2], [PW / 2, PH / 2], [-PW / 2, PH / 2]].map(([x, y]) => project(x, y, z, rx, rz));
        const alpha = U.clamp((lt - t0) * 5) * (1 - U.clamp((m - 0.6) / 0.4));
        G.quad(G.target('L' + i).tex, pts, 0.92 * alpha);
        planes.push({ L, pts, alpha });
      });
      const ca = U.clamp((m - 0.55) / 0.45);
      if (ca > 0) G.quad(comp.tex, [[-PW / 2, -PH / 2], [PW / 2, -PH / 2], [PW / 2, PH / 2], [-PW / 2, PH / 2]].map(([x, y]) => project(x, y, 0, rx, rz)), ca);

      G.ink((ctx) => {
        const I = SX.ink;
        planes.forEach(({ L, pts, alpha }, i) => {
          ctx.globalAlpha = 0.55 * alpha;
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([]);
          ctx.beginPath();
          pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.stroke();
          const [x, y] = pts.reduce((m, q) => (q[0] < m[0] ? q : m)); // leftmost corner
          I.text(ctx, `L${i + 1} · ${label(L)}`, x - 16, y + 5, { color: C.paper, size: 14, align: 'right', alpha: alpha * U.clamp((lt - IN[i] - 0.1) * 6) });
        });
        if (ca > 0) {
          const p0 = project(-PW / 2, PH / 2, 0, rx, rz);
          I.text(ctx, 'COMPOSITE', p0[0], p0[1] + 28, { color: C.paper, size: 14, alpha: ca });
        }
      });
    },
  });
})((window.SX = window.SX || {}));
