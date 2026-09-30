/* Render engine: render(t) derives the entire frame from t (no timers, seeded randomness).
   Handles scene activation, transition windows, HUD, letterbox, textures and the beat-grid overlay. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  let scenes = [];
  let stage = null;
  let grid = null;
  let now = 0;

  function runScene(sc, t) {
    const lt = t - sc.slot.start;
    // Gliding camera: slow breath + a gentle bank; both return to rest at the scene edges so match cuts line up
    const u = U.clamp(lt / sc.slot.dur);
    const drift = 1 + 0.014 * Math.sin(Math.PI * u);
    const roll = 0.45 * Math.sin(2 * Math.PI * u) * (sc.def.roll ?? 1);
    sc.cam.style.transform = `rotate(${roll.toFixed(3)}deg) scale(${drift.toFixed(5)})`;
    sc.def.update(sc.st, lt, sc);
  }

  function buildGrid() {
    grid = { el: stage.querySelector('#beatgrid') };
    for (let k = 0; k <= 12; k++) {
      grid.el.appendChild(U.h('div', { class: 'bg-col', style: `left:${96 + k * 144}px` }));
    }
    grid.flash = U.h('div', { class: 'bg-flash' });
    grid.read = U.h('div', { class: 'bg-read' });
    grid.cells = [0, 1, 2, 3].map(() => U.h('i'));
    grid.el.append(U.h('div', { class: 'bg-safe' }), grid.flash, grid.read, U.h('div', { class: 'bg-cells' }, grid.cells));
  }

  function updateGrid(t, i) {
    if (grid.el.hidden) return;
    const b = Math.floor(T.beatAt(t) + 1e-6);
    const f = Math.round(t * T.FPS);
    grid.flash.style.opacity = U.pulse(t, T.SPB, 0.08).toFixed(3);
    U.setText(grid.read,
      `SCENE ${U.pad(i + 1)} · BEAT ${U.pad(b + 1)}/${T.TOTAL_BEATS} · BAR ${Math.floor(b / 4) + 1}.${(b % 4) + 1} · F ${U.pad(f, 3)}/${T.TOTAL_FRAMES} · ${t.toFixed(3)}s`);
    grid.cells.forEach((c, k) => c.classList.toggle('on', k === b % 4));
  }

  SX.engine = {
    build(stageEl) {
      stage = stageEl;
      const host = stage.querySelector('#scenes');
      SX.scenes.sort((a, b) => a.id - b.id);
      scenes = SX.scenes.map((def, i) => {
        const root = U.h('section', { class: `scene bg-${def.bg}`, 'data-scene': U.pad(def.id) });
        const cam = U.h('div', { class: 'cam' });
        root.appendChild(cam);
        host.appendChild(root);
        const sc = { def, slot: T.SLOTS[i], root, cam, st: null };
        sc.st = def.build(cam, sc) || {};
        return sc;
      });
      SX.transitions.init(stage.querySelector('#transition-layer'));
      SX.letterbox.build(stage);
      SX.fx.build(stage);
      SX.hud.build(stage);
      buildGrid();
    },

    render(tIn) {
      const t = U.clamp(tIn, 0, T.DURATION - 1e-6);
      now = t;
      const i = T.sceneIndexAt(t);
      const cur = scenes[i];
      const nxt = scenes[i + 1];
      const tr = SX.transitions.list[i];
      const lead = tr && nxt ? tr.lead : 0;
      const winStart = cur.slot.end - lead;
      const inWin = lead > 0 && t >= winStart;

      scenes.forEach((sc, k) => {
        const active = k === i || (inWin && k === i + 1);
        const r = sc.root.style;
        r.display = active ? '' : 'none';
        r.clipPath = r.transform = r.transformOrigin = r.zIndex = r.visibility = r.filter = r.background = r.opacity = r.outline = '';
      });

      runScene(cur, t);
      if (inWin) runScene(nxt, t);

      SX.transitions.list.forEach((x, k) => {
        if (x.idle && !(inWin && k === i)) x.idle();
      });
      // p reaches 1 on the last frame before the beat, so the cut lands on the beat
      if (inWin) tr.apply(U.prog(t + 1 / T.FPS, winStart, cur.slot.end), cur, nxt, { t, frame: Math.round(t * T.FPS) });

      SX.letterbox.flush();
      SX.fx.update(t);
      SX.hud.update(t, { def: cur.def, lt: t - cur.slot.start, slot: cur.slot });
      updateGrid(t, i);
    },

    get time() {
      return now;
    },

    setGrid(on) {
      grid.el.hidden = !on;
      this.render(now);
    },
  };
})((window.SX = window.SX || {}));
