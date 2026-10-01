/* 11 MONTAGE — numbers only
   Eight hard cuts on 8th notes, each a different preset full-bleed with one number on a colour plate:
   32 PRESETS (kaleido) / 4 LAYERS (orbital) / 5 BLENDS (moiré) / 6 PALETTES (plasma) / 3840×2160 (hex pulse) /
   3,600 FRAMES (log spiral) / 0 ACCOUNTS (cellular glass) / 32/32 LOOP CHECK (gyroid). Plates rotate through the
   five colours. Exit: Sierpinski subdivision. */
(function (SX) {
  'use strict';
  const { U, E, T, ui } = SX;
  const D = SX.DATA;
  const CUT = T.E8;
  const uhd = D.resolutions[3];

  const CUTS = [
    { preset: 'kaleido', palette: 4, value: '32', label: 'PRESETS', plate: 'paper' },
    { preset: 'orbital', palette: 1, value: String(D.layersMax), label: 'LAYERS', plate: 'mint' },
    { preset: 'moire', palette: 5, value: String(D.blends.length), label: 'BLENDS', plate: 'violet' },
    { preset: 'plasma', palette: 0, value: String(D.palettes.length), label: 'PALETTES', plate: 'night' },
    { preset: 'hex-pulse', palette: 2, value: `${uhd.w}×${uhd.h}`, label: 'UHD', plate: 'peach' },
    { preset: 'spiral', palette: 3, value: U.fmtInt(D.maxFrames), label: 'FRAMES MAX', plate: 'paper' },
    { preset: 'voronoi', palette: 4, value: '0', label: 'ACCOUNTS', plate: 'mint' },
    { preset: 'gyroid', palette: 0, value: D.loopCheck.match, label: 'LOOP CHECK · SAMPLE', plate: 'violet' },
  ];
  const cutAt = (lt) => U.clamp(Math.floor(lt / CUT + 1e-6), 0, CUTS.length - 1);

  SX.defineScene({
    id: 11,
    role: 'MONTAGE',
    bg: 'night',

    build(cam) {
      const st = { cuts: [] };
      CUTS.forEach((c, k) => {
        const plate = U.h('div', { class: `plate bg-${c.plate}`, style: 'left:96px;top:400px' });
        const title = U.h('div', { class: 'title', style: `font-size:${c.value.length > 6 ? 150 : 220}px`, text: c.value });
        const label = U.h('div', { class: 'mono', text: c.label });
        plate.append(title, label);
        const idx = U.h('div', { class: 'cut-idx', style: 'left:120px;top:172px', text: `CUT ${U.pad(k + 1)} / ${U.pad(CUTS.length)}` });
        const name = U.h('div', { class: 'cut-name', style: 'right:120px;top:172px', text: SX.presets.byId(c.preset).name });
        cam.append(plate, idx, name);
        st.cuts.push({ plate, idx, name });
      });
      return st;
    },

    update(st, lt) {
      const k = cutAt(lt);
      const ct = lt - k * CUT;
      st.cuts.forEach((c, i) => {
        const on = i === k;
        c.plate.style.display = c.idx.style.display = c.name.style.display = on ? '' : 'none';
      });
      ui.pop(st.cuts[k].plate, ct, 0, { dur: 0.16, from: 0.9 });
    },

    draw(G, st, lt) {
      const k = cutAt(lt);
      const ct = lt - k * CUT;
      const c = CUTS[k];
      const q = E.outExpo(U.clamp(ct / CUT));
      G.pattern(c.preset, { palette: c.palette, zoom: U.lerp(1.18, 1, q), rot: (k % 2 ? -1 : 1) * 6 * (1 - q), loop: 2 });
    },
  });
})((window.SX = window.SX || {}));
