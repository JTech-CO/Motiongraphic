/* Musical timeline: 120 BPM, 1 scene = 4 beats (scene 12 = 6 beats).
   All times derive from integer beat indices, so beat→frame never drifts. */
(function (SX) {
  'use strict';

  const FPS = 30;
  const BPM = 120;
  const W = 1920;
  const H = 1080;
  const SPB = 60 / BPM; // seconds per beat (0.5)
  const SCENE_BEATS = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6];

  let acc = 0;
  const SLOTS = SCENE_BEATS.map((beats, index) => {
    const slot = {
      index,
      startBeat: acc,
      beats,
      start: (acc * 60) / BPM,
      end: ((acc + beats) * 60) / BPM,
      dur: (beats * 60) / BPM,
    };
    acc += beats;
    return slot;
  });

  const TOTAL_BEATS = acc;
  const DURATION = (TOTAL_BEATS * 60) / BPM;
  const TOTAL_FRAMES = (TOTAL_BEATS * 60 * FPS) / BPM; // 750, exact integer

  SX.T = {
    FPS, BPM, W, H, SPB, SCENE_BEATS, SLOTS, TOTAL_BEATS, DURATION, TOTAL_FRAMES,
    E8: SPB / 2, // eighth note
    E16: SPB / 4, // sixteenth note
    E32: SPB / 8,
    LEAD: 4 / FPS, // transitions start 4 frames before the beat
    /** beat index → frame index (exact: beat × 15) */
    beatFrame: (b) => (b * 60 * FPS) / BPM,
    beatTime: (b) => (b * 60) / BPM,
    frameTime: (f) => f / FPS,
    beatAt: (t) => (t * BPM) / 60,
    frames: (n) => n / FPS,
    sceneIndexAt(t) {
      for (let i = SLOTS.length - 1; i >= 0; i--) if (t >= SLOTS[i].start) return i;
      return 0;
    },
  };
})((window.SX = window.SX || {}));
