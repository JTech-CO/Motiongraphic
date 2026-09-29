/* Persistent HUD: crop marks, scene id, BPM + 4 beat cells, 2015–2026 year ruler, data line */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  const Y0 = 2015;
  const Y1 = 2026;
  const BRAND = 'GENESIS 2015→2026 · 120 BPM';
  const LABEL_EVERY = 1;
  const RULER_W = 1016;
  const xOf = (y) => ((U.clamp(y, Y0, Y1) - Y0) / (Y1 - Y0)) * RULER_W;

  let root, tl, beats, src, crops, ticks, hl, mark, markTxt;

  SX.hud = {
    build(stage) {
      root = stage.querySelector('#hud');
      crops = ['tl', 'tr', 'bl', 'br'].map((c) => U.h('div', { class: `crop ${c}` }));
      tl = U.h('div', { class: 'hud-tl' });
      beats = [0, 1, 2, 3].map(() => U.h('i'));
      const tr = U.h('div', { class: 'hud-tr' },
        U.h('span', { text: BRAND }),
        U.h('span', { class: 'hud-beats' }, beats));
      src = U.h('div', { class: 'hud-src' });

      const ruler = U.h('div', { class: 'hud-ruler' }, U.h('div', { class: 'base' }));
      ticks = [];
      for (let y = Y0; y <= Y1; y++) {
        const major = (y - Y0) % LABEL_EVERY === 0;
        const tk = U.h('div', { class: `tick${major ? ' major' : ''}`, style: `left:${xOf(y)}px` });
        ruler.appendChild(tk);
        ticks.push({ y, el: tk });
        if (major) ruler.appendChild(U.h('div', { class: 'lbl', style: `left:${xOf(y)}px`, text: String(y) }));
      }
      hl = U.h('div', { class: 'hl' });
      markTxt = U.h('span');
      mark = U.h('div', { class: 'mark' }, markTxt);
      ruler.append(hl, mark);

      root.append(...crops, tl, tr, src, ruler);
    },

    /** sc: { def, lt, slot } of the scene that owns the current beat */
    update(t, sc) {
      const { def, lt } = sc;
      const bg = def.bgAt ? def.bgAt(lt) : def.bg;
      root.style.setProperty('--hud-fg', SX.BG[bg].fg);

      U.setText(tl, `${U.pad(def.id)} / 12 — ${def.role}`);
      U.setText(src, `DATA AS OF ${SX.DATA.asOf} · SRC: ${SX.DATA.sources[def.id - 1]}`);

      const beat = Math.floor(lt / T.SPB + 1e-6);
      const pb = U.pulse(lt, T.SPB, 0.1);
      beats.forEach((b, i) => {
        b.classList.toggle('on', i === beat % 4);
        b.style.transform = i === beat % 4 ? `scale(${(1 + 0.25 * pb).toFixed(3)})` : '';
      });

      const arm = (28 + 5 * pb).toFixed(2) + 'px';
      crops.forEach((c) => {
        c.style.width = arm;
        c.style.height = arm;
      });

      const r = def.ruler(lt);
      const from = Math.min(r.from, r.to);
      const to = Math.max(r.from, r.to);
      hl.style.left = `${xOf(from) - 3}px`;
      hl.style.width = `${xOf(to) - xOf(from) + 6}px`;
      ticks.forEach((tk) => tk.el.classList.toggle('lit', tk.y >= from - 0.01 && tk.y <= to + 0.01));
      mark.style.left = `${xOf(r.mark)}px`;
      U.setText(markTxt, r.label || (r.mark < Y0 - 0.5 ? `◀ ${Math.round(r.mark)}` : String(Math.round(U.clamp(r.mark, Y0, Y1)))));
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
