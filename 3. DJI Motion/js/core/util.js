/* Core helpers: math, easing, seeded randomness, DOM/SVG builders.
   Everything here is pure; scenes compute their whole state from t. */
(function (SX) {
  'use strict';

  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, p) => a + (b - a) * p;
  /** Normalized progress of t across [a, b], clamped to 0..1 */
  const prog = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
  const mod = (a, n) => ((a % n) + n) % n;
  const deg = (r) => (r * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;

  /** mulberry32: seeded PRNG */
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Stateless integer hash → [0, 1) */
  function hash(i, seed = 0) {
    let x = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }

  /** Smooth 1D value noise → [0, 1) */
  function noise1(x, seed = 0) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(hash(i, seed), hash(i + 1, seed), u);
  }

  /** Exponential pulse that peaks on every beat onset */
  const pulse = (t, period, decay = 0.12) => Math.exp(-mod(t, period) / decay);

  // ---------- easing ----------
  const E = {
    linear: (p) => p,
    inQuad: (p) => p * p,
    outQuad: (p) => 1 - (1 - p) * (1 - p),
    inCubic: (p) => p * p * p,
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    inQuart: (p) => p * p * p * p,
    outQuart: (p) => 1 - Math.pow(1 - p, 4),
    inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
    inExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
    outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inOutExpo: (p) =>
      p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
    outBack: (p, s = 1.70158) => {
      const c3 = s + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
    },
    /** Damped spring, settles at 1 by p = 1 (~15% overshoot) */
    spring: (p, decay = 6, freq = 1.6) => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      return 1 - Math.exp(-decay * p) * Math.cos(2 * Math.PI * freq * p);
    },
  };

  // ---------- DOM ----------
  const SVGNS = 'http://www.w3.org/2000/svg';

  function applyAttrs(el, attrs) {
    if (!attrs) return;
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
  }

  function appendKids(el, kids) {
    for (const k of kids.flat()) {
      if (k == null || k === false) continue;
      el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    }
  }

  /** HTML element builder */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    applyAttrs(el, attrs);
    appendKids(el, kids);
    return el;
  }

  /** SVG element builder */
  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    applyAttrs(el, attrs);
    appendKids(el, kids);
    return el;
  }

  /** Full-stage SVG canvas */
  const svgFull = (cls = '') => s('svg', { class: `full ${cls}`, width: 1920, height: 1080, viewBox: '0 0 1920 1080' });

  /** Positioned absolute div */
  const box = (x, y, cls = '', text = null) => {
    const el = h('div', { class: cls, style: `left:${x}px;top:${y}px` });
    if (text != null) el.textContent = text;
    return el;
  };

  /** Only touch the DOM when the value really changes */
  function setText(el, str) {
    if (el._t !== str) {
      el._t = str;
      el.textContent = str;
    }
  }

  const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
  const fmtFixed = (n, d) =>
    n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const f3 = (n) => (Math.round(n * 1000) / 1000).toString();

  /** Polyline → SVG path "d" */
  const pathD = (pts) => {
    if (!pts.length) return '';
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += `L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    return d;
  };

  /** Cumulative length table for a polyline */
  function polyLengths(pts) {
    const acc = [0];
    for (let i = 1; i < pts.length; i++) {
      acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return acc;
  }

  /** Point + tangent angle at arc-length `len` along a polyline */
  function pointAt(pts, acc, len) {
    const total = acc[acc.length - 1];
    const L = clamp(len, 0, total);
    let i = 1;
    while (i < acc.length - 1 && acc[i] < L) i++;
    const seg = acc[i] - acc[i - 1] || 1;
    const p = (L - acc[i - 1]) / seg;
    const a = pts[i - 1];
    const b = pts[i];
    return { x: lerp(a[0], b[0], p), y: lerp(a[1], b[1], p), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), i };
  }

  /** Polyline truncated at arc-length `len` */
  function slicePoly(pts, acc, len) {
    if (len <= 0) return [];
    const q = pointAt(pts, acc, len);
    return pts.slice(0, q.i).concat([[q.x, q.y]]);
  }

  /** Cubic bezier sampled to a polyline */
  function bezierPts(p0, p1, p2, p3, n = 80) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return out;
  }

  SX.U = {
    clamp, lerp, prog, mod, deg, rad, rng, hash, noise1, pulse,
    h, s, svgFull, box, setText,
    fmtInt, fmtFixed, pad, f3,
    pathD, polyLengths, pointAt, slicePoly, bezierPts,
  };
  SX.E = E;
  SX.L = SX.L || {}; // shared layout anchors for cross-scene match cuts
})((window.SX = window.SX || {}));
