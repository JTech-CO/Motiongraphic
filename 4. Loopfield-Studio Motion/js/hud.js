/* Persistent HUD in a shader-editor style. Top left: scene id and the global phase uLoop (= t ÷ 25, a decorative
   value derived from the timeline; the last frame reads 0.999 = (N−1)/N). Top right: brand, BPM, 4 beat cells.
   Bottom: data source line and a Loopfield-style transport (play glyph · seconds · 12 scene segments · 25s / 30fps). */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  let root, tl, phase, beats, src, time, fill, head;

  SX.hud = {
    build(stage) {
      root = stage.querySelector('#hud');
      const crops = ['tl', 'tr', 'bl', 'br'].map((c) => U.h('div', { class: `crop ${c}` }));
      tl = U.h('div');
      phase = U.h('div', { class: 'hud-phase' });
      const tlBox = U.h('div', { class: 'hud-tl' }, tl, phase);
      beats = [0, 1, 2, 3].map(() => U.h('i'));
      const tr = U.h('div', { class: 'hud-tr' }, U.h('span', { text: 'LOOPFIELD · 120 BPM' }), U.h('span', { class: 'hud-beats' }, beats));
      src = U.h('div', { class: 'hud-src' });

      time = U.h('span', { class: 'hud-time' });
      const scrub = U.h('div', { class: 'hud-scrub' }, U.h('i', { class: 'rail' }));
      T.SLOTS.forEach((s) => scrub.appendChild(U.h('i', { class: 'tick', style: `left:${((s.start / T.DURATION) * 100).toFixed(3)}%` })));
      scrub.appendChild(U.h('i', { class: 'tick', style: 'left:100%' }));
      fill = U.h('i', { class: 'fill' });
      head = U.h('i', { class: 'head' });
      scrub.append(fill, head);
      const transport = U.h('div', { class: 'hud-transport' }, U.h('i', { class: 'hud-play' }), time, scrub,
        U.h('span', { text: `${T.DURATION}s / ${T.FPS}fps` }));

      root.append(...crops, tlBox, tr, src, transport);
    },

    /** sc: { def, lt } of the scene that owns the current beat */
    update(t, sc) {
      const { def, lt } = sc;
      const bg = def.bgAt ? def.bgAt(lt) : def.bg;
      root.style.setProperty('--hud-fg', SX.BG[bg].fg);

      U.setText(tl, `${U.pad(def.id)} / 12 — ${def.role}`);
      const f = Math.min(T.TOTAL_FRAMES - 1, Math.floor(t * T.FPS + 1e-6));
      phase.textContent = '';
      phase.append('uLoop ', U.h('b', { text: (f / T.TOTAL_FRAMES).toFixed(3) }));
      U.setText(src, `SNAPSHOT ${SX.DATA.snapshot} · SRC: ${SX.DATA.sources[def.id - 1]}`);

      const beat = Math.floor(lt / T.SPB + 1e-6);
      const pb = U.pulse(lt, T.SPB, 0.1);
      beats.forEach((b, i) => {
        b.classList.toggle('on', i === beat % 4);
        b.style.transform = i === beat % 4 ? `scale(${(1 + 0.25 * pb).toFixed(3)})` : '';
      });

      U.setText(time, `${(f / T.FPS).toFixed(2)}s`);
      const k = ((f / T.FPS) / T.DURATION) * 100;
      fill.style.width = `${k.toFixed(3)}%`;
      head.style.left = `${k.toFixed(3)}%`;
    },
  };
})((window.SX = window.SX || {}));
