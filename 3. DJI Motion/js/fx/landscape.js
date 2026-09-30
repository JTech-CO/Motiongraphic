/* Flat landscape kit shared by every scene: seeded ridgelines with parallax, topographic contours,
   flat cloud banks and a single-colour sun. Depth comes from value steps of one hue (aerial perspective).
   Everything is generated once from seeds and moved from t only. */
(function (SX) {
  'use strict';
  const { U, ui } = SX;

  /** Periodic value noise: repeats every `per` lattice cells */
  function pnoise(x, per, seed) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return U.lerp(U.hash(U.mod(i, per), seed), U.hash(U.mod(i + 1, per), seed), u);
  }

  /** Ridge profile height (0..1) at x px for a tile of width `period` */
  function ridgeH(x, period, seed, rough = 1) {
    const oct = [[260, 0.55], [110, 0.3 * rough], [44, 0.15 * rough]];
    let v = 0;
    let sum = 0;
    oct.forEach(([w, a], k) => {
      const per = Math.max(1, Math.round(period / w));
      const n = pnoise((x / period) * per, per, seed + k * 17);
      v += a * (k === 0 ? n : 1 - Math.abs(2 * n - 1)); // ridged detail on top of soft swells
      sum += a;
    });
    return v / sum;
  }

  const land = {};

  /**
   * Parallax ridges. o = { color (hex), layers: [{ y, amp, seed, k (tone), speed (px/s), rough }], period }
   * Returns { g, update(t, dx = 0, dy = 0) } — near layers move faster.
   */
  land.ridges = (parent, o) => {
    const period = o.period || 1920;
    const g = U.s('g');
    const layers = o.layers.map((L) => {
      const pts = [];
      for (let x = 0; x <= period * 2 + 16; x += 16) {
        pts.push([x, L.y - L.amp * ridgeH(U.mod(x, period), period, L.seed, L.rough ?? 1)]);
      }
      const d = `M0 ${1400}` + pts.map((p) => `L${p[0]} ${p[1].toFixed(1)}`).join('') + `L${period * 2 + 16} 1400Z`;
      const el = U.s('path', { d, fill: L.fill || ui.tone(o.color, L.k) });
      g.appendChild(el);
      return { el, L };
    });
    parent.appendChild(g);
    return {
      g,
      layers,
      update(t, dx = 0, dy = 0) {
        layers.forEach(({ el, L }, i) => {
          const depth = (i + 1) / layers.length; // 0 far … 1 near
          const x = -U.mod(t * L.speed + dx * depth, period);
          el.setAttribute('transform', `translate(${x.toFixed(1)} ${(dy * depth).toFixed(1)})`);
        });
      },
    };
  };

  /**
   * Topographic contours for top-down maps. o = { hills: n, levels, seed, color, width, height, op }
   * Returns { g } (move / scale it with transforms).
   */
  land.contours = (parent, o) => {
    const g = U.s('g', { fill: 'none', stroke: o.color, 'stroke-width': o.sw || 1.4, opacity: o.op ?? 0.35 });
    const r = U.rng(o.seed || 7);
    const W = o.width || 2400;
    const H = o.height || 1400;
    for (let h = 0; h < (o.hills || 7); h++) {
      const cx = r() * W - (W - 1920) / 2;
      const cy = r() * H - (H - 1080) / 2;
      const R = 180 + r() * 380;
      const levels = o.levels || 7;
      const s1 = Math.floor(r() * 1000);
      for (let k = 0; k < levels; k++) {
        const rr = R * (1 - k / (levels + 0.6));
        const pts = [];
        for (let a = 0; a < 48; a++) {
          const th = (a / 48) * Math.PI * 2;
          const m = 1 + 0.28 * (pnoise((a / 48) * 6, 6, s1 + k * 3) - 0.5) + 0.12 * (pnoise((a / 48) * 13, 13, s1 + 99) - 0.5);
          pts.push([cx + Math.cos(th) * rr * m, cy + Math.sin(th) * rr * m * 0.82]);
        }
        g.appendChild(U.s('path', { d: U.pathD(pts) + 'Z' }));
      }
    }
    parent.appendChild(g);
    return { g };
  };

  /** One flat cloud: bumpy top, flat base. Returns path d centred at (0,0) */
  land.cloudPath = (w, h, seed) => {
    const r = U.rng(seed);
    const n = 3 + Math.floor(r() * 3);
    let d = `M${(-w / 2).toFixed(1)} 0`;
    let x = -w / 2;
    for (let i = 0; i < n; i++) {
      const seg = (w / n) * (0.8 + r() * 0.4);
      const x2 = Math.min(w / 2, x + seg);
      const rise = h * (0.55 + r() * 0.45) * (i === 0 || i === n - 1 ? 0.7 : 1);
      d += `C${(x + seg * 0.05).toFixed(1)} ${(-rise).toFixed(1)} ${(x2 - seg * 0.05).toFixed(1)} ${(-rise).toFixed(1)} ${x2.toFixed(1)} 0`;
      x = x2;
    }
    return d + `L${(-w / 2).toFixed(1)} 0Z`;
  };

  /**
   * Cloud bank. o = { color, n, y, spread, seed, w: [min,max], h: [min,max], speed, op, band }
   * update(t, dy) scrolls the bank horizontally (wraps across 2400 px).
   */
  land.clouds = (parent, o) => {
    const g = U.s('g');
    const r = U.rng(o.seed || 3);
    const items = [];
    for (let i = 0; i < (o.n || 6); i++) {
      const w = U.lerp(o.w[0], o.w[1], r());
      const h = U.lerp(o.h[0], o.h[1], r());
      const el = U.s('path', { d: land.cloudPath(w, h, Math.floor(r() * 1e6)), fill: o.color, opacity: o.op ?? 1 });
      g.appendChild(el);
      items.push({ el, x: r() * 2400 - 240, y: o.y + (r() - 0.5) * (o.spread || 0), k: 0.7 + r() * 0.6 });
    }
    if (o.band) g.appendChild(U.s('rect', { x: -100, y: o.y, width: 2200, height: o.band, fill: o.color, opacity: o.op ?? 1 }));
    parent.appendChild(g);
    return {
      g,
      update(t, dy = 0) {
        items.forEach((c) => {
          const x = U.mod(c.x - t * (o.speed || 20) * c.k, 2400) - 240;
          c.el.setAttribute('transform', `translate(${x.toFixed(1)} ${(c.y + dy).toFixed(1)})`);
        });
      },
    };
  };

  /** Single-colour sun disc with a thin ring */
  land.sun = (parent, x, y, r, color, ringOp = 0.35) => {
    const g = U.s('g');
    g.append(
      U.s('circle', { cx: x, cy: y, r: r * 1.35, fill: 'none', stroke: color, 'stroke-width': 2, opacity: ringOp }),
      U.s('circle', { cx: x, cy: y, r, fill: color })
    );
    parent.appendChild(g);
    return g;
  };

  SX.land = land;
})((window.SX = window.SX || {}));
