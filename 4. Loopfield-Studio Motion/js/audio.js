/* 120 BPM track synthesized with WebAudio.
   One scheduling function drives both the live player and the OfflineAudioContext WAV render,
   so the MP4 soundtrack and the in-browser playback are identical.
   Kick 1·3, clap 2·4, hats on 8ths (16ths in the montage), per-scene sub drone, a soft arpeggio on the
   Lissajous 3:4 ratio (dataset §5 lissajous defaults), a filtered sweep plus a short synth gesture before every
   pattern-math transition, iteration ticks (01), preset blips (03), slider zipper (06), the repeating loop motif
   and MATCH chime (07), resolution steps (08), encode ticks (09), typing clicks and the compile rise (10),
   final hit + reverb (12 b5). The soundtrack is decoration: Loopfield itself exports silent MP4 (dataset §1 F34). */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  const SR = 48000;
  // Sub-drone root (Hz) per scene: D D Bb Bb F F C C G A D D
  const ROOT = [73.42, 73.42, 58.27, 58.27, 87.31, 87.31, 65.41, 65.41, 49.0, 55.0, 73.42, 73.42];
  const MONTAGE = 10; // scene index with 16th-note hats
  const FINAL_BEAT = 48; // scene 12 · b5
  const S = (i) => T.SLOTS[i]; // scene slot by index

  function noiseBuffer(ctx, sec, seed, brown = false) {
    const len = Math.ceil(sec * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    const r = U.rng(seed);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = r() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return buf;
  }

  function impulse(ctx, sec, seed) {
    const len = Math.ceil(sec * ctx.sampleRate);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      const r = U.rng(seed + ch);
      for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  /** Schedule the whole 25 s track into any BaseAudioContext */
  function schedule(ctx, dest) {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.6, 0);
    master.gain.setValueAtTime(0.6, T.DURATION - 0.3);
    master.gain.linearRampToValueAtTime(0.0001, T.DURATION);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    master.connect(comp);
    comp.connect(dest);

    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.6, 71);
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.55;
    verb.connect(verbOut);
    verbOut.connect(master);

    const white = noiseBuffer(ctx, 1.2, 11);

    const env = (g, t, peak, attack, decay) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    };
    const noiseSrc = (buf, t, dur, offset = 0) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.start(t, offset, dur);
      return s;
    };

    function kick(t, v) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
      env(g, t, v, 0.003, 0.42);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.5);
      const c = noiseSrc(white, t, 0.02, 0.3);
      const cg = ctx.createGain();
      env(cg, t, 0.25 * v, 0.001, 0.015);
      c.connect(cg);
      cg.connect(master);
    }

    function clap(t, v = 0.42) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      [0, 0.011, 0.022].forEach((d) => {
        g.gain.setValueAtTime(v, t + d);
        g.gain.exponentialRampToValueAtTime(v * 0.25, t + d + 0.009);
      });
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      const s = noiseSrc(white, t, 0.22, 0.1);
      s.connect(bp);
      bp.connect(g);
      g.connect(master);
      const send = ctx.createGain();
      send.gain.value = 0.25;
      g.connect(send);
      send.connect(verb);
    }

    function hat(t, v, len) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7200;
      const g = ctx.createGain();
      env(g, t, v, 0.001, len);
      const s = noiseSrc(white, t, len + 0.02, U.hash(Math.round(t * 1000), 3) * 0.8);
      s.connect(hp);
      hp.connect(g);
      g.connect(master);
    }

    function whoosh(tEnd, v = 0.1) {
      const t0 = tEnd - 0.32;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(500, t0);
      bp.frequency.exponentialRampToValueAtTime(5200, tEnd);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, tEnd);
      g.gain.exponentialRampToValueAtTime(0.0001, tEnd + 0.08);
      const s = noiseSrc(white, t0, 0.45, 0.4);
      s.connect(bp);
      bp.connect(g);
      g.connect(master);
    }

    /** Short tone with an exponential envelope */
    function blip(t, f, v = 0.08, dur = 0.12, type = 'sine', send = 0.2) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      const g = ctx.createGain();
      env(g, t, v, 0.004, dur);
      o.connect(g);
      g.connect(master);
      if (send) {
        const s = ctx.createGain();
        s.gain.value = send;
        g.connect(s);
        s.connect(verb);
      }
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    /** Pitch glide between two frequencies */
    function glide(t0, t1, f0, f1, v = 0.06, type = 'sine') {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(f1, t1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + (t1 - t0) * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.06);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      o.connect(lp);
      lp.connect(g);
      g.connect(master);
      o.start(t0);
      o.stop(t1 + 0.1);
    }

    function click(t, v = 0.12, f = 3200) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = 3;
      const g = ctx.createGain();
      env(g, t, v, 0.001, 0.025);
      const s = noiseSrc(white, t, 0.04, U.hash(Math.round(t * 1000), 7) * 0.9);
      s.connect(bp);
      bp.connect(g);
      g.connect(master);
    }

    function drone() {
      const end = T.beatTime(FINAL_BEAT);
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o2.type = 'triangle';
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      T.SLOTS.forEach((slot, i) => {
        o1.frequency.setTargetAtTime(ROOT[i], slot.start, 0.015);
        o2.frequency.setTargetAtTime(ROOT[i] * 2, slot.start, 0.015);
      });
      g1.gain.setValueAtTime(0.0001, 0);
      g1.gain.exponentialRampToValueAtTime(0.17, 0.08);
      g1.gain.setValueAtTime(0.17, end - 0.05);
      g1.gain.exponentialRampToValueAtTime(0.0001, end + 0.2);
      g2.gain.setValueAtTime(0.05, 0);
      g2.gain.setValueAtTime(0.05, end - 0.05);
      g2.gain.exponentialRampToValueAtTime(0.0001, end + 0.2);
      o1.connect(g1);
      o2.connect(lp);
      lp.connect(g2);
      g1.connect(master);
      g2.connect(master);
      o1.start(0);
      o2.start(0);
      o1.stop(end + 0.3);
      o2.stop(end + 0.3);
    }

    function finalHit(t) {
      kick(t, 1);
      [73.42, 146.83, 220, 293.66, 349.23, 440].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i < 2 ? 'sine' : 'triangle';
        o.frequency.value = f;
        const g = ctx.createGain();
        env(g, t, 0.09, 0.01, 2.2);
        o.connect(g);
        g.connect(master);
        g.connect(verb);
        o.start(t);
        o.stop(t + 2.4);
      });
      const s = noiseSrc(white, t, 0.3, 0.6);
      const g = ctx.createGain();
      env(g, t, 0.3, 0.002, 0.25);
      s.connect(g);
      g.connect(verb);
    }

    // Transition gestures (one per pattern-math transition, landing on the beat b)
    const gesture = [
      (b) => glide(b - 0.32, b, 180, 1800, 0.06), // zoom ×64
      (b) => [0.16, 0.11, 0.06].forEach((d, k) => click(b - d, 0.14, 2400 + k * 900)), // fold 1 → 8
      (b) => {
        for (let k = 0; k < 6; k++) click(b - 0.18 + k * 0.03, 0.09, 1800 + k * 300); // Truchet tiles
      },
      (b) => [0, 1, 2, 3, 4].forEach((k) => blip(b - 0.16 + k * 0.032, 660 * Math.pow(2, k / 5), 0.05, 0.05, 'triangle', 0)), // 5 blends
      (b) => glide(b - 0.3, b, 1400, 220, 0.05, 'triangle'), // polar unwrap
      (b) => glide(b - 0.32, b, 300, 520, 0.05, 'sawtooth'), // domain warp
      (b) => glide(b - 0.3, b, 2200, 330, 0.05), // twirl
      (b) => [0, 1, 2, 3].forEach((k) => blip(b - 0.16 + k * 0.04, 110 * (4 - k), 0.05, 0.035, 'square', 0)), // resolution
      (b) => {
        for (let k = 0; k < 8; k++) click(b - 0.2 + k * 0.025, 0.08, 1200 + k * 500); // Voronoi shatter
      },
      (b) => [0, 1, 2, 3, 4, 5].forEach((k) => click(b - 0.15 + k * 0.025, 0.1, 4200 - k * 300)), // hex flips
      (b) => [880, 660, 440].forEach((f, k) => blip(b - 0.15 + k * 0.05, f, 0.06, 0.06, 'triangle', 0.3)), // Sierpinski levels
    ];

    drone();
    T.SLOTS.slice(1).forEach((slot, i) => {
      whoosh(slot.start, 0.07);
      gesture[i](slot.start);
    });

    // Arpeggio on the Lissajous 3:4 ratio (scenes 02–10), 16ths off the beat, quiet
    const ARP = [2, 8 / 3, 3, 4];
    for (let i = 1; i <= 9; i++) {
      for (let k = 0; k < 16; k++) {
        if (k % 4 === 0) continue;
        blip(S(i).start + k * T.E16, ROOT[i] * ARP[k % 4] * 2, 0.022, 0.09, 'triangle', 0.15);
      }
    }

    // 01 · iterations double on 16ths (b1–b2), 160 lands on b3
    for (let k = 0; k < 8; k++) blip(S(0).start + k * T.E16, 330 * Math.pow(2, k / 6), 0.06, 0.06, 'square', 0.05);
    blip(S(0).start + 2 * T.SPB, 659.25, 0.07, 0.6, 'sine', 0.4);
    // 03 · twelve presets light up (b1), then twenty (b2)
    for (let k = 0; k < 12; k++) blip(S(2).start + (k * T.SPB) / 12, 523.25 * Math.pow(2, k / 24), 0.035, 0.05, 'sine', 0.1);
    for (let k = 0; k < 20; k++) blip(S(2).start + T.SPB + (k * T.SPB) / 20, 659.25 * Math.pow(2, k / 30), 0.03, 0.04, 'sine', 0.1);
    // 06 · slider zipper following the thumb (2 → 12 on 16ths), back to 5 on b3
    [2, 3, 4, 5, 6, 8, 10, 12].forEach((v, k) => blip(S(5).start + k * T.E16, 180 + v * 40, 0.04, 0.08, 'sawtooth', 0));
    glide(S(5).start + 2 * T.SPB - 0.04, S(5).start + 2 * T.SPB + 0.14, 660, 380, 0.04, 'sawtooth');
    // 07 · the same two-beat motif twice, MATCH chime on b3
    for (let rep = 0; rep < 2; rep++) {
      [1, 1.5, 2, 1.5].forEach((m, k) => blip(S(6).start + rep * 2 * T.SPB + k * T.E8, 261.63 * m, 0.05, 0.16, 'triangle', 0.25));
    }
    blip(S(6).start + 2 * T.SPB, 1318.5, 0.05, 0.9, 'sine', 0.5);
    blip(S(6).start + 2 * T.SPB, 1975.5, 0.03, 0.7, 'sine', 0.5);
    // 08 · one step per resolution; pitch follows the frame width (1920 → 2048 → 2560 → 3840)
    [[0, 1920], [T.E16, 2048], [T.SPB, 2560], [2 * T.SPB, 3840]].forEach(([dt, w]) => blip(S(7).start + dt, (220 * w) / 1920, 0.06, 0.25, 'triangle', 0.25));
    // 09 · encode ticks along the pipeline (b2)
    for (let k = 0; k < 8; k++) click(S(8).start + T.SPB + k * T.E16 * 0.5, 0.06, 5200);
    // 10 · typing (b1–b2) and the compile rise (b3)
    for (let k = 0; k < 24; k++) click(S(9).start + k * 0.04 + U.hash(k, 4) * 0.01, 0.07, 2600 + U.hash(k, 9) * 1600);
    glide(S(9).start + 2 * T.SPB - 0.12, S(9).start + 2 * T.SPB + 0.05, 330, 990, 0.05, 'triangle');

    for (let b = 0; b < T.TOTAL_BEATS; b++) {
      const t = T.beatTime(b);
      if (b === FINAL_BEAT) {
        finalHit(t);
        continue;
      }
      if (b > FINAL_BEAT) continue; // last beat: reverb tail only
      const inBar = b % 4;
      if (inBar === 0 || inBar === 2) kick(t, inBar === 0 ? 0.95 : 0.8);
      else clap(t);
      const scene = T.sceneIndexAt(t + 1e-6);
      const div = scene === MONTAGE ? 4 : 2;
      for (let k = 0; k < div; k++) {
        const ht = t + (k * T.SPB) / div;
        const offbeat = k === div / 2;
        hat(ht, offbeat ? 0.16 : 0.09, offbeat ? 0.07 : 0.035);
      }
    }
  }

  async function renderBuffer() {
    const oc = new OfflineAudioContext(2, Math.round(SR * T.DURATION), SR);
    schedule(oc, oc.destination);
    return oc.startRendering();
  }

  function encodeWav(buf) {
    const ch = buf.numberOfChannels;
    const len = buf.length;
    const out = new ArrayBuffer(44 + len * ch * 2);
    const v = new DataView(out);
    const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF');
    v.setUint32(4, 36 + len * ch * 2, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, ch, true);
    v.setUint32(24, buf.sampleRate, true);
    v.setUint32(28, buf.sampleRate * ch * 2, true);
    v.setUint16(32, ch * 2, true);
    v.setUint16(34, 16, true);
    str(36, 'data');
    v.setUint32(40, len * ch * 2, true);
    const data = [];
    for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < ch; c++) {
        const s = Math.max(-1, Math.min(1, data[c][i]));
        v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        o += 2;
      }
    }
    return out;
  }

  // ---------- live playback ----------
  let actx = null;
  let buffer = null;
  let src = null;
  let out = null;
  let startedAt = 0;
  let offset = 0;
  let muted = false;

  async function ensureBuffer() {
    if (!buffer) buffer = await renderBuffer();
    return buffer;
  }

  SX.audio = {
    schedule,
    renderBuffer,
    encodeWav,

    /** WAV of the full track (OfflineAudioContext) */
    async renderWav() {
      return encodeWav(await ensureBuffer());
    },

    /** Base64 WAV, used by tools/render.mjs */
    async renderWavBase64() {
      const bytes = new Uint8Array(await this.renderWav());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    },

    async downloadWav() {
      const blob = new Blob([await this.renderWav()], { type: 'audio/wav' });
      const a = U.h('a', { href: URL.createObjectURL(blob), download: 'loopfield-studio-120bpm.wav' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },

    async play(from) {
      if (!actx) {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        out = actx.createGain();
        out.connect(actx.destination);
      }
      await actx.resume();
      await ensureBuffer();
      this.stop();
      out.gain.value = muted ? 0 : 1;
      src = actx.createBufferSource();
      src.buffer = buffer;
      src.connect(out);
      startedAt = actx.currentTime + 0.04;
      offset = from;
      src.start(startedAt, Math.min(from, T.DURATION - 0.01));
    },

    stop() {
      if (src) {
        try {
          src.stop();
        } catch (e) {
          /* already stopped */
        }
        src.disconnect();
        src = null;
      }
    },

    /** Playback clock (seconds into the track), compensated for output latency */
    now() {
      if (!actx || !src) return null;
      const lat = actx.outputLatency || actx.baseLatency || 0;
      return offset + Math.max(0, actx.currentTime - startedAt - lat);
    },

    setMuted(m) {
      muted = m;
      if (out) out.gain.value = m ? 0 : 1;
    },
    get muted() {
      return muted;
    },
  };
})((window.SX = window.SX || {}));
