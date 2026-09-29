/* 120 BPM track synthesized with WebAudio.
   One scheduling function drives both the live player and the OfflineAudioContext WAV render,
   so the MP4 soundtrack and the in-browser playback are identical.
   Kick 1·3, clap 2·4, hats on 8ths (16ths in the montage), per-scene sub drone,
   launch rumble + filter sweep in scenes 03/12, final hit with reverb tail on scene 12 b5. */
(function (SX) {
  'use strict';
  const { U, T } = SX;

  const SR = 48000;
  // Sub-drone root (Hz) per scene: A A F F C C G G D F E A
  const ROOT = [55, 55, 43.65, 43.65, 65.41, 65.41, 49.0, 49.0, 73.42, 43.65, 41.2, 55];
  const MONTAGE = 10; // scene index with 16th-note hats
  const FINAL_BEAT = 48; // scene 12 · b5
  const LAUNCHES = [[T.SLOTS[2].start, T.SLOTS[2].end], [T.SLOTS[11].start, T.SLOTS[11].start + 1.6]];

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
    const brown = noiseBuffer(ctx, 4, 13, true);

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

    function rumble(t0, t1) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 3;
      lp.frequency.setValueAtTime(110, t0);
      lp.frequency.exponentialRampToValueAtTime(1900, t1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.55, t0 + 0.25);
      g.gain.setValueAtTime(0.55, t1 - 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t1);
      const s = noiseSrc(brown, t0, t1 - t0);
      s.connect(lp);
      lp.connect(g);
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
      [110, 164.81, 220, 261.63, 329.63].forEach((f, i) => {
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

    drone();
    LAUNCHES.forEach(([a, b]) => rumble(a, b));
    T.SLOTS.slice(1).forEach((slot) => whoosh(slot.start));

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
      const a = U.h('a', { href: URL.createObjectURL(blob), download: 'spacex-2002-2026-120bpm.wav' });
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
