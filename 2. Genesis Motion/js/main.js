/* Boot: build the stage, fit it to the viewport, wire the player clock.
   URL params: ?capture (1:1 stage, no chrome) · ?t=12.5 (start time) · ?grid (beat grid on) */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  const params = new URLSearchParams(location.search);
  const capture = params.has('capture');
  const stage = document.getElementById('stage');
  const viewport = document.getElementById('viewport');

  function fit() {
    if (capture) {
      stage.style.transform = 'none';
      return;
    }
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const s = Math.min(vw / T.W, vh / T.H);
    const x = (vw - T.W * s) / 2;
    const y = (vh - T.H * s) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }

  const player = {
    t: 0,
    playing: false,
    busy: false,
    perf0: 0,
    t0: 0,
    audioOk: false,

    clock() {
      const a = this.audioOk ? SX.audio.now() : null;
      return a != null ? a : this.t0 + (performance.now() - this.perf0) / 1000;
    },

    async play() {
      if (this.playing || this.busy) return;
      if (this.t >= T.DURATION - 1 / T.FPS) this.t = 0;
      this.busy = true;
      try {
        await SX.audio.play(this.t);
        this.audioOk = true;
      } catch (e) {
        this.audioOk = false; // visuals keep running on the performance clock
      }
      this.busy = false;
      this.t0 = this.t;
      this.perf0 = performance.now();
      this.playing = true;
      bigplay.hidden = true;
      requestAnimationFrame(tick);
    },

    pause() {
      this.playing = false;
      SX.audio.stop();
      SX.controls.update(this.t, false);
    },

    toggle() {
      if (this.playing) this.pause();
      else this.play();
    },

    seek(t) {
      this.t = U.clamp(t, 0, T.DURATION);
      SX.engine.render(this.t);
      SX.controls.update(this.t, this.playing);
      if (this.playing) {
        this.playing = false;
        SX.audio.stop();
        this.play();
      }
    },
  };

  function tick() {
    if (!player.playing) return;
    let t = player.clock();
    if (t >= T.DURATION) {
      t = T.DURATION;
      player.t = t;
      SX.engine.render(t);
      player.pause();
      return;
    }
    player.t = t;
    SX.engine.render(t);
    SX.controls.update(t, true);
    requestAnimationFrame(tick);
  }

  if (capture) document.body.classList.add('capture');

  const bigplay = U.h('button', { id: 'bigplay', type: 'button', text: 'PLAY · SPACE' });
  bigplay.addEventListener('click', () => player.play());
  document.body.appendChild(bigplay);
  if (capture) bigplay.hidden = true;

  SX.engine.build(stage);
  SX.controls.build(document.getElementById('controls'), player);
  fit();
  window.addEventListener('resize', fit);

  if (params.has('grid')) {
    SX.engine.setGrid(true);
    SX.controls.setGridPressed(true);
  }
  const t0 = parseFloat(params.get('t'));
  player.seek(Number.isFinite(t0) ? t0 : 0);

  // Public API (used by tools/render.mjs)
  window.seek = (t) => player.seek(t);
  window.render = (t) => SX.engine.render(t);
  window.SX_PLAYER = player;
  document.fonts.ready.then(() => {
    SX.engine.render(player.t);
    window.SX_READY = true;
  });
})((window.SX = window.SX || {}));
