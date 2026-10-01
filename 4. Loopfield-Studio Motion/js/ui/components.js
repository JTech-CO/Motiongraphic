/* Reusable motion components. Each exposes update(lt, ...) and derives
   its full visual state from the scene-local time lt (seconds). */
(function (SX) {
  'use strict';
  const { U, E, T } = SX;

  SX.scenes = SX.scenes || [];
  SX.defineScene = (def) => SX.scenes.push(def);

  const ui = {};

  /** Spring entrance progress for an element that starts at t0 */
  ui.enter = (lt, t0, dur = 0.45) => {
    const p = U.prog(lt, t0, t0 + dur);
    return { p, e: E.spring(p), o: U.clamp(p * 4) };
  };

  /** expo.in exit progress (0 = present, 1 = gone) */
  ui.exit = (lt, t0, dur = 0.24) => E.inExpo(U.prog(lt, t0, t0 + dur));

  /** Back-overshoot pop: sets scale + opacity; `base` keeps other transforms */
  ui.pop = (el, lt, t0, { dur = 0.34, from = 0.4, base = '', s = 2.2 } = {}) => {
    const p = U.prog(lt, t0, t0 + dur);
    const sc = lt < t0 ? from : U.lerp(from, 1, E.outBack(p, s));
    el.style.opacity = lt < t0 ? 0 : U.clamp(p * 5).toFixed(3);
    el.style.transform = `${base} scale(${sc.toFixed(4)})`;
    return p;
  };

  /** Camera-move settle for the first frames of a scene (expo.out after a whip) */
  ui.settle = (lt, dur = 0.3) => 1 - E.outExpo(U.prog(lt, 0, dur));

  /**
   * Headline: per-character spring rise, 45ms stagger, expo.in exit.
   * lines: array of strings or arrays of (string | Node). Nodes animate as one unit.
   */
  ui.headline = (parent, o) => {
    const el = U.h('div', {
      class: 'headline',
      style: `left:${o.x}px;top:${o.y}px;font-size:${o.size || 132}px`,
    });
    const units = [];
    o.lines.forEach((line, li) => {
      const ln = U.h('div', { class: 'hl-line' });
      const parts = Array.isArray(line) ? line : [line];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          Array.from(part).forEach((ch) => {
            const sp = U.h('span', { class: 'ch' });
            sp.textContent = ch;
            ln.appendChild(sp);
            units.push({ el: sp, line: li });
          });
        } else {
          part.classList.add('ch');
          ln.appendChild(part);
          units.push({ el: part, line: li });
        }
      });
      el.appendChild(ln);
    });
    parent.appendChild(el);

    const lineDelay = o.lineDelay || [];
    const stagger = o.stagger ?? 0.045;
    const perLine = [];
    units.forEach((u, gi) => {
      perLine[u.line] = (perLine[u.line] ?? -1) + 1;
      u.k = lineDelay[u.line] != null ? perLine[u.line] : gi;
    });

    return {
      el,
      units,
      /** exitAt: time the expo.in exit starts (null = stays) */
      update(lt, t0 = 0, exitAt = null) {
        units.forEach((u) => {
          const start = t0 + (lineDelay[u.line] || 0) + u.k * stagger;
          const p = U.prog(lt, start, start + 0.5);
          let y = (1 - E.spring(p)) * 0.62;
          let op = U.clamp(p * 4);
          if (exitAt != null) {
            const q = E.inExpo(U.prog(lt, exitAt + u.k * 0.01, exitAt + u.k * 0.01 + 0.24));
            y -= q * 0.9;
            op *= 1 - q;
          }
          u.el.style.transform = `translate3d(0,${y.toFixed(4)}em,0)`;
          u.el.style.opacity = op.toFixed(3);
        });
      },
    };
  };

  /** Mono caption with typing + blinking block cursor (blink on 8th notes) */
  ui.caption = (parent, o) => {
    const el = U.h('div', { class: 'caption', style: `left:${o.x}px;top:${o.y}px` });
    const txt = U.h('span', { class: 'cap-txt' });
    const cur = U.h('span', { class: 'cap-cur' });
    el.append(txt, cur);
    parent.appendChild(el);
    const full = o.text;
    return {
      el,
      update(lt, t0 = 0, exitAt = null) {
        const n = U.clamp(Math.floor((lt - t0) * 48), 0, full.length);
        U.setText(txt, full.slice(0, n));
        const typing = lt >= t0 && n < full.length;
        const blink = Math.floor(U.mod(lt, 1000) / T.E8) % 2 === 0;
        cur.style.opacity = lt < t0 ? 0 : typing || blink ? 1 : 0;
        const q = exitAt == null ? 0 : ui.exit(lt, exitAt, 0.2);
        el.style.opacity = lt < t0 ? 0 : 1 - q;
        el.style.transform = `translate3d(0,${(-q * 30).toFixed(2)}px,0)`;
      },
    };
  };

  /** Big number with fixed-width digit cells (never jitters while counting) */
  ui.counter = (parent, o) => {
    const el = U.h('div', { class: `counter ${o.cls || ''}` });
    el.style.fontSize = `${o.size}px`;
    el.style.top = `${o.y}px`;
    if (o.align === 'right') {
      el.style.right = `${T.W - o.x}px`;
      el.style.transformOrigin = '100% 50%';
    } else if (o.align === 'center') {
      el.style.left = `${o.x - 1000}px`;
      el.style.width = '2000px';
      el.style.textAlign = 'center';
    } else {
      el.style.left = `${o.x}px`;
      el.style.transformOrigin = '0 50%';
    }
    parent.appendChild(el);
    const spans = [];
    let last = null;
    return {
      el,
      set(str) {
        if (str === last) return;
        last = str;
        const chars = Array.from(str);
        while (spans.length < chars.length) {
          const sp = U.h('span');
          el.appendChild(sp);
          spans.push(sp);
        }
        spans.forEach((sp, i) => {
          if (i >= chars.length) {
            sp.style.display = 'none';
            return;
          }
          const c = chars[i];
          sp.style.display = '';
          sp.textContent = c;
          sp.className = /[0-9]/.test(c) ? 'd' : c === ',' || c === '.' ? 'p' : 'o';
        });
      },
    };
  };

  /** Bordered mono chip, optional bold value */
  ui.chip = (parent, x, y, label, value, cls = '') => {
    const el = U.h('div', { class: `chip ${cls}`, style: `left:${x}px;top:${y}px` });
    el.appendChild(document.createTextNode(label));
    if (value != null) el.appendChild(U.h('b', { text: value }));
    parent.appendChild(el);
    return el;
  };

  /** Map-style tag: optional bold value + mono label with a leader bar */
  ui.tag = (parent, x, y, label, value = null) => {
    const el = U.h('div', { class: 'tag', style: `left:${x}px;top:${y}px` });
    if (value != null) el.appendChild(U.h('b', { text: value }));
    el.appendChild(document.createTextNode(label));
    parent.appendChild(el);
    return el;
  };

  /** Beat-synced breathing */
  ui.breathe = (el, lt, amp = 0.05) => {
    const b = U.pulse(lt, T.SPB, 0.16);
    el.style.transform = `scale(${(1 + amp * b + 0.02 * Math.sin(lt * 2)).toFixed(4)})`;
  };

  function hexRGB(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const toHex = (rgb) => '#' + rgb.map((v) => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');

  /** Mix two hex colors → hex */
  ui.mix = (a, b, p) => {
    const x = hexRGB(a);
    const y = hexRGB(b);
    return toHex(x.map((v, i) => U.lerp(v, y[i], p)));
  };
  /** Tonal step of one hue: k > 0 toward white, k < 0 toward black */
  ui.tone = (hex, k) => (k >= 0 ? ui.mix(hex, '#ffffff', k) : ui.mix(hex, '#000000', -k));
  ui.hexA = (hex, a) => {
    const [r, g, b] = hexRGB(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  SX.ui = ui;
  SX.C = {
    night: '#080b12', paper: '#f7f4ed', mint: '#65fbd5', violet: '#ac76ff', peach: '#ffb86c', ink: '#111318',
  };
  SX.BG = {
    night: { bg: SX.C.night, fg: SX.C.paper },
    paper: { bg: SX.C.paper, fg: SX.C.ink },
    mint: { bg: SX.C.mint, fg: SX.C.ink },
    violet: { bg: SX.C.violet, fg: SX.C.ink },
    peach: { bg: SX.C.peach, fg: SX.C.ink },
  };
})((window.SX = window.SX || {}));
