/* 08 STARLINK — "하늘엔 / 1만 1천 기,"
   Wireframe globe; satellites lift off the surface and join orbital shells, stepping
   through the §4.1 in-orbit series on 8th notes to 11,133 (canvas, ~11k dots).
   Exit: zoom in, dots snap to a 30px grid, grid cells swell into blue (→ 09). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const SERIES = D.starlink.inOrbit;
  const N = SERIES[SERIES.length - 1].v;
  const STEP_AT = SERIES.map((_, k) => k * T.E8); // e0..e6 → last lands on b4
  const TWEEN = 0.1;
  const GRID = 30;
  const COLS = T.W / GRID;
  const ROWS = T.H / GRID;

  /** Displayed in-orbit count at scene time lt */
  function countAt(lt) {
    let v = 0;
    for (let k = 0; k < SERIES.length; k++) {
      const prev = k ? SERIES[k - 1].v : 0;
      const p = E.outCubic(U.prog(lt, STEP_AT[k] - TWEEN, STEP_AT[k]));
      if (p <= 0) break;
      v = U.lerp(prev, SERIES[k].v, p);
    }
    return v;
  }
  // Series label switches when that step's tween starts
  const stepIndex = (lt) => {
    let k = 0;
    for (let i = 0; i < SERIES.length; i++) if (lt >= STEP_AT[i] - TWEEN) k = i;
    return k;
  };

  // Seeded constellation (shell mix loosely modeled on 53° / 43° / 70° / 97.6° shells)
  const SHELLS = [
    { inc: 53, w: 0.58, alt: 1.1 },
    { inc: 43, w: 0.15, alt: 1.13 },
    { inc: 70, w: 0.12, alt: 1.16 },
    { inc: 97.6, w: 0.15, alt: 1.2 },
  ];
  const BUF = { x: new Float32Array(N), y: new Float32Array(N), c: new Uint8Array(N) };
  const SAT = { inc: new Float32Array(N), raan: new Float32Array(N), u0: new Float32Array(N), alt: new Float32Array(N), spd: new Float32Array(N), born: new Float32Array(N), jit: new Float32Array(N) };
  (function seed() {
    const r = U.rng(19052024);
    for (let i = 0; i < N; i++) {
      let x = r();
      let sh = SHELLS[0];
      for (const s of SHELLS) {
        if (x < s.w) {
          sh = s;
          break;
        }
        x -= s.w;
      }
      SAT.inc[i] = U.rad(sh.inc + (r() - 0.5) * 1.2);
      SAT.raan[i] = r() * Math.PI * 2;
      SAT.u0[i] = r() * Math.PI * 2;
      SAT.alt[i] = sh.alt + (r() - 0.5) * 0.025;
      SAT.spd[i] = 0.55 + r() * 0.1;
      SAT.jit[i] = r();
    }
    // Birth time of each dot = moment the tweened counter passes its index
    for (let k = 0; k < SERIES.length; k++) {
      const prev = k ? SERIES[k - 1].v : 0;
      for (let i = prev; i < SERIES[k].v; i++) {
        const f = (i - prev + 1) / (SERIES[k].v - prev);
        const x = 1 - Math.cbrt(1 - f); // inverse of outCubic
        SAT.born[i] = STEP_AT[k] - TWEEN + TWEEN * x;
      }
    }
  })();

  SX.defineScene({
    id: 8,
    role: 'STARLINK',
    bg: 'dark',
    ruler: (lt) => {
      const k = stepIndex(lt);
      return { from: 2019, to: 2026, mark: SX.hud.hop(lt, SERIES.map((s) => s.year), T.E8), label: SERIES[k].label };
    },

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, SX.globe.center.x, SX.globe.center.y, C.orbit, 0.22);
      st.canvas = U.h('canvas', { width: T.W, height: T.H, style: 'left:0;top:0;width:1920px;height:1080px' });
      cam.appendChild(st.canvas);
      st.ctx = st.canvas.getContext('2d');

      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'STARLINK / IN ORBIT' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 136, lines: ['하늘엔', '1만 1천 기,'] });
      st.count = ui.counter(cam, { x: 120, y: 600, size: 132 });
      st.stepLbl = U.box(124, 748, 'mono', '');
      st.stepLbl.style.fontSize = '20px';
      st.srcLbl = U.box(124, 782, 'mono', 'McDOWELL / CELESTRAK · WORKING ~11.1K');
      st.srcLbl.style.opacity = 0.6;
      cam.append(st.stepLbl, st.srcLbl);
      return st;
    },

    update(st, lt, sc) {
      const t = sc.slot.start + lt;
      const ctx = st.ctx;
      const G = SX.globe.center;
      const R = SX.globe.R;
      ui.breathe(st.glow, lt, 0.05);

      st.cap.update(lt, 0, 1.55);
      st.head.update(lt, 0.02, 1.55);

      // Counter + series label
      const k = stepIndex(lt);
      const v = countAt(lt);
      const atRest = lt >= STEP_AT[k];
      st.count.set(atRest ? `${ui.approx(SERIES[k].approx)}${U.fmtInt(SERIES[k].v)}` : U.fmtInt(v));
      U.setText(st.stepLbl, `${SERIES[k].label} · IN ORBIT`);
      const out = ui.exit(lt, 1.55, 0.25);
      const pb = U.pulse(lt, T.E8, 0.08);
      st.count.el.style.opacity = (U.clamp((lt + 0.05) * 6) * (1 - out)).toFixed(3);
      st.count.el.style.transform = `translate3d(${(-out * 120).toFixed(1)}px,0,0) scale(${(1 + 0.025 * pb).toFixed(4)})`;
      [st.stepLbl, st.srcLbl].forEach((el, i) => {
        el.style.opacity = (U.clamp((lt - 0.1 * i) * 5) * (1 - out) * (i ? 0.6 : 1)).toFixed(3);
        el.style.transform = `translate3d(${(-out * 120).toFixed(1)}px,0,0)`;
      });

      // Exit phases
      const zoom = 1 + 0.9 * E.inCubic(U.prog(lt, 1.55, 2.0 - T.LEAD));
      const wireA = 1 - U.prog(lt, 1.6, 1.8);
      const fill = E.inCubic(U.prog(lt, 2.0 - T.LEAD, 2.0));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, T.W, T.H);

      // Globe wireframe (zoomed about its center)
      if (wireA > 0) {
        const lines = SX.globe.lines(t, G.x, G.y, R * zoom);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = SX.ui.hexA(C.paper, 0.12 * wireA);
        ctx.beginPath();
        lines.back.forEach((pl) => pl.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))));
        ctx.stroke();
        ctx.fillStyle = SX.ui.hexA(C.space, 0.9 * wireA);
        ctx.beginPath();
        ctx.arc(G.x, G.y, R * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = SX.ui.hexA(C.paper, 0.42 * wireA);
        ctx.beginPath();
        lines.front.forEach((pl) => pl.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))));
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = SX.ui.hexA(C.paper, 0.85 * wireA);
        ctx.beginPath();
        ctx.arc(G.x, G.y, R * zoom, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Satellites
      const cT = Math.cos(SX.globe.TILT);
      const sT = Math.sin(SX.globe.TILT);
      // One projection pass into typed buffers, then one draw pass per style
      let n = 0;
      for (let i = 0; i < N; i++) {
        const born = SAT.born[i];
        if (lt < born) continue;
        const age = lt - born;
        const u = SAT.u0[i] + t * SAT.spd[i];
        const inc = SAT.inc[i];
        const su = Math.sin(u);
        // circular orbit in the equatorial plane → incline about x → RAAN about the polar axis
        const x0 = Math.cos(u);
        const y0 = su * Math.sin(inc);
        const z0 = su * Math.cos(inc);
        const cO = Math.cos(SAT.raan[i]);
        const sO = Math.sin(SAT.raan[i]);
        const x = x0 * cO + z0 * sO;
        const z = -x0 * sO + z0 * cO;
        const y2 = y0 * cT - z * sT;
        const z2 = y0 * sT + z * cT;
        const alt = 1 + (SAT.alt[i] - 1) * E.outCubic(U.clamp(age / 0.3));
        let X = G.x + R * zoom * alt * x;
        let Y = G.y - R * zoom * alt * y2;
        const q = lt < 1.6 ? 0 : E.inOutCubic(U.prog(lt, 1.6 + 0.08 * SAT.jit[i], 1.84));
        if (q === 0 && z2 < 0 && (x * x + y2 * y2) * alt * alt < 1) continue; // behind the globe
        if (q > 0) {
          const cell = i % (COLS * ROWS);
          X = U.lerp(X, (cell % COLS) * GRID + GRID / 2, q);
          Y = U.lerp(Y, Math.floor(cell / COLS) * GRID + GRID / 2, q);
        }
        BUF.x[n] = X;
        BUF.y[n] = Y;
        BUF.c[n] = age < 0.22 && q === 0 ? 2 : z2 >= 0 || q > 0.3 ? 1 : 0;
        n++;
      }
      const styles = [SX.ui.hexA(C.paper, 0.3), SX.ui.hexA(C.paper, 0.92), C.signal];
      for (let pass = 0; pass < 3; pass++) {
        ctx.fillStyle = styles[pass];
        const sz = pass === 2 ? 3 : 2;
        for (let j = 0; j < n; j++) if (BUF.c[j] === pass) ctx.fillRect(BUF.x[j] - sz / 2, BUF.y[j] - sz / 2, sz, sz);
      }

      // Grid cells swell into blue on the last 4 frames
      if (fill > 0) {
        const sz = U.lerp(2, GRID + 1, fill);
        ctx.fillStyle = C.orbit;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) ctx.fillRect(c * GRID + GRID / 2 - sz / 2, r * GRID + GRID / 2 - sz / 2, sz, sz);
        }
      }
    },
  });
})((window.SX = window.SX || {}));
