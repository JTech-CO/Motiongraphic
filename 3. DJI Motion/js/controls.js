/* Player chrome: play/pause, scrub bar (scene segments + beat ticks), scene jump,
   beat-grid overlay toggle, sound toggle, WAV export. Keyboard shortcuts included. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  const icon = (...kids) => U.s('svg', { width: 12, height: 14, viewBox: '0 0 12 14', 'aria-hidden': 'true' }, ...kids);
  const iconPlay = () => icon(U.s('path', { d: 'M1 1 L11 7 L1 13 Z', fill: 'currentColor' }));
  const iconPause = () =>
    icon(
      U.s('rect', { x: 1, y: 1, width: 3.5, height: 12, fill: 'currentColor' }),
      U.s('rect', { x: 7.5, y: 1, width: 3.5, height: 12, fill: 'currentColor' })
    );

  const fmt = (t) => {
    const m = Math.floor(t / 60);
    return `${U.pad(m)}:${U.pad(Math.floor(t % 60))}.${U.pad(Math.floor((t % 1) * 100))}`;
  };

  SX.controls = {
    build(root, player) {
      const playIcon = iconPlay();
      const pauseIcon = iconPause();
      pauseIcon.style.display = 'none';
      const playBtn = U.h('button', { class: 'play', type: 'button', 'aria-label': 'Play' }, playIcon, pauseIcon);
      const cur = U.h('b');
      const frame = U.h('span', { class: 'c-frame' });
      const time = U.h('div', { class: 'c-time' }, cur, ` / ${fmt(T.DURATION)} `, frame);

      const segs = U.h('div', { class: 'c-segs' });
      const segEls = T.SLOTS.map((slot, i) => {
        const seg = U.h('div', { class: 'c-seg', style: `flex:${slot.beats} 1 0;--bw:calc(100% / ${slot.beats})` }, U.h('span', { text: U.pad(i + 1) }));
        segs.appendChild(seg);
        return seg;
      });
      const fill = U.h('div', { class: 'c-fill' });
      const head = U.h('div', { class: 'c-head' });
      const scrub = U.h('div', { class: 'c-scrub', role: 'slider', 'aria-label': 'Timeline', 'aria-valuemin': 0, 'aria-valuemax': T.DURATION, tabindex: 0 }, segs, fill, head);

      const sceneBtns = T.SLOTS.map((slot, i) => {
        const b = U.h('button', { type: 'button', title: `Scene ${U.pad(i + 1)}`, text: U.pad(i + 1) });
        b.addEventListener('click', () => player.seek(slot.start));
        return b;
      });
      const gridBtn = U.h('button', { type: 'button', 'aria-pressed': 'false', title: 'Beat grid (G)', text: 'GRID' });
      const soundBtn = U.h('button', { type: 'button', 'aria-pressed': 'true', title: 'Sound (M)', text: 'SOUND' });
      const wavBtn = U.h('button', { type: 'button', title: 'Export WAV (OfflineAudioContext)', text: 'WAV' });

      root.append(playBtn, time, scrub, U.h('div', { class: 'c-scenes' }, sceneBtns), gridBtn, soundBtn, wavBtn);

      playBtn.addEventListener('click', () => player.toggle());
      gridBtn.addEventListener('click', () => toggleGrid());
      soundBtn.addEventListener('click', () => toggleMute());
      wavBtn.addEventListener('click', async () => {
        wavBtn.disabled = true;
        try {
          await SX.audio.downloadWav();
        } finally {
          wavBtn.disabled = false;
        }
      });

      function toggleGrid() {
        const on = gridBtn.getAttribute('aria-pressed') !== 'true';
        gridBtn.setAttribute('aria-pressed', String(on));
        SX.engine.setGrid(on);
      }
      function toggleMute() {
        const m = !SX.audio.muted;
        SX.audio.setMuted(m);
        soundBtn.setAttribute('aria-pressed', String(!m));
      }

      // Scrubbing
      let dragging = false;
      let wasPlaying = false;
      const tAt = (e) => {
        const r = segs.getBoundingClientRect();
        return U.clamp((e.clientX - r.left) / r.width) * T.DURATION;
      };
      scrub.addEventListener('pointerdown', (e) => {
        dragging = true;
        wasPlaying = player.playing;
        if (wasPlaying) player.pause();
        scrub.setPointerCapture(e.pointerId);
        player.seek(tAt(e));
      });
      scrub.addEventListener('pointermove', (e) => {
        if (dragging) player.seek(tAt(e));
      });
      const end = () => {
        if (!dragging) return;
        dragging = false;
        if (wasPlaying) player.play();
      };
      scrub.addEventListener('pointerup', end);
      scrub.addEventListener('pointercancel', end);

      // Keyboard
      window.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const t = player.t;
        const step = e.shiftKey ? T.SPB : 1 / T.FPS;
        const i = T.sceneIndexAt(t);
        const map = {
          ' ': () => player.toggle(),
          ArrowLeft: () => player.seek(t - step),
          ArrowRight: () => player.seek(t + step),
          '[': () => player.seek(T.SLOTS[Math.max(0, t - T.SLOTS[i].start < 0.1 ? i - 1 : i)].start),
          ']': () => player.seek(T.SLOTS[Math.min(T.SLOTS.length - 1, i + 1)].start),
          Home: () => player.seek(0),
          End: () => player.seek(T.DURATION),
          g: toggleGrid,
          G: toggleGrid,
          m: toggleMute,
          M: toggleMute,
        };
        const fn = map[e.key];
        if (!fn) return;
        e.preventDefault();
        fn();
      });

      this.update = (tNow, playing) => {
        U.setText(cur, fmt(tNow));
        U.setText(frame, `· F ${U.pad(Math.min(T.TOTAL_FRAMES - 1, Math.floor(tNow * T.FPS + 1e-6)), 3)}`);
        const pct = (tNow / T.DURATION) * 100;
        fill.style.width = `${pct}%`;
        head.style.left = `${pct}%`;
        scrub.setAttribute('aria-valuenow', tNow.toFixed(2));
        const idx = T.sceneIndexAt(tNow);
        segEls.forEach((s, k) => s.classList.toggle('on', k === idx));
        sceneBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === idx)));
        if (playBtn._p !== playing) {
          playBtn._p = playing;
          playIcon.style.display = playing ? 'none' : '';
          pauseIcon.style.display = playing ? '' : 'none';
          playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        }
      };
      this.setGridPressed = (on) => gridBtn.setAttribute('aria-pressed', String(on));
    },
    update() {},
  };
})((window.SX = window.SX || {}));
