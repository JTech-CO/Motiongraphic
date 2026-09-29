/* 05 REUSE — "한 대로 37번,"
   37 tally marks for B1067 accumulate on 16th notes; the B1088 turnaround clock
   spins to 09D 03:39:28. Then every tally mark topples flat and slides into
   the bar origins of scene 06 (match cut). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const TALLY_BOTTOM = 690;
  const TALLY_H = 190;
  const BOOSTER_X = 1680;
  const CLOCK = { x: 178, y: 842, r: 50 };

  // Build the 37 marks: groups of four verticals + one diagonal
  const MARKS = [];
  for (let i = 0; i < D.reuse.recordFlights; i++) {
    const g = Math.floor(i / 5);
    const j = i % 5;
    const x0 = 120 + g * 150;
    if (j < 4) {
      MARKS.push({ g, j, x: x0 + 12 + j * 28, y: TALLY_BOTTOM, ang: -90, len: TALLY_H });
    } else {
      const dx = 124;
      const dy = -146;
      MARKS.push({ g, j, x: x0 - 4, y: TALLY_BOTTOM - 22, ang: U.deg(Math.atan2(dy, dx)), len: Math.hypot(dx, dy) });
    }
  }
  const markStart = (m) => m.g * T.E16 + m.j * 0.02;

  const T_SEC = (() => {
    const t = D.reuse.turnaround;
    return t.d * 86400 + t.h * 3600 + t.m * 60 + t.s;
  })();
  const fmtClock = (sec) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${U.pad(d)}D ${U.pad(h)}:${U.pad(m)}:${U.pad(s)}`;
  };

  SX.defineScene({
    id: 5,
    role: 'REUSE',
    bg: 'blue',
    ruler: (lt) => ({ from: 2017, to: 2026, mark: SX.hud.hop(lt, [2017, 2020, 2023, 2026]) }),

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, BOOSTER_X, 560, C.paper, 0.12);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${D.reuse.recordBooster} / REUSE RECORD` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 150, lines: [`한 대로 ${D.reuse.recordFlights}번,`] });

      const svg = U.svgFull();
      st.marks = MARKS.map(() => {
        const l = U.s('line', { stroke: C.paper, 'stroke-width': 10, 'stroke-linecap': 'round' });
        svg.appendChild(l);
        return l;
      });

      // Turnaround dial
      st.dial = U.s('g');
      st.dial.appendChild(U.s('circle', { cx: CLOCK.x, cy: CLOCK.y, r: CLOCK.r, fill: 'none', stroke: C.paper, 'stroke-width': 2 }));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        st.dial.appendChild(U.s('line', {
          x1: CLOCK.x + (CLOCK.r - 10) * Math.sin(a), y1: CLOCK.y - (CLOCK.r - 10) * Math.cos(a),
          x2: CLOCK.x + (CLOCK.r - 4) * Math.sin(a), y2: CLOCK.y - (CLOCK.r - 4) * Math.cos(a),
          stroke: C.paper, 'stroke-width': 2,
        }));
      }
      st.hand = U.s('line', { x1: CLOCK.x, y1: CLOCK.y, x2: CLOCK.x, y2: CLOCK.y - CLOCK.r + 12, stroke: C.signal, 'stroke-width': 4, 'stroke-linecap': 'round' });
      st.dial.append(st.hand, U.s('circle', { cx: CLOCK.x, cy: CLOCK.y, r: 5, fill: C.paper }));
      svg.appendChild(st.dial);

      st.booster = SX.vehicles.f9Booster(C.paper, C.ink, D.reuse.recordBooster);
      st.booster.setLegs(1);
      st.bg = U.s('g', {}, st.booster.g);
      svg.appendChild(st.bg);
      cam.appendChild(svg);

      st.count = ui.counter(cam, { x: 1290, y: 520, size: 104 });
      st.countLbl = U.box(1294, 636, 'mono', 'FLIGHTS');
      st.bLbl = U.h('div', { class: 'mono', style: `right:${T.W - BOOSTER_X + 80}px;top:394px;text-align:right;line-height:1.6`, text: `RECORD ${D.reuse.recordDate}` });
      st.clock = ui.counter(cam, { x: 258, y: 800, size: 64 });
      st.clockLbl = U.box(262, 880, 'mono', `SHORTEST TURNAROUND · ${D.reuse.turnaroundBooster}`);
      cam.append(st.countLbl, st.bLbl, st.clockLbl);
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.05);
      st.cap.update(lt, 0, 1.6);
      st.head.update(lt, 0.02, 1.6);

      const rows = SX.L.cadenceRows;
      let shown = 0;
      MARKS.forEach((m, i) => {
        const t0 = markStart(m);
        const el = st.marks[i];
        if (lt < t0) {
          el.setAttribute('opacity', 0);
          return;
        }
        shown++;
        el.setAttribute('opacity', 1);
        const grow = E.outBack(U.prog(lt, t0, t0 + 0.14), 1.4);
        // Match cut: topple flat, then slide into scene 06's bar origin
        const row = rows[i % rows.length];
        const q = U.prog(lt, 1.6 + i * 0.004, 1.95);
        const rot = E.outBack(U.prog(q, 0, 0.55), 1.2);
        const mv = E.inOutCubic(U.prog(q, 0.2, 1));
        const ang = U.rad(U.lerp(m.ang, 0, rot));
        const x = U.lerp(m.x, SX.L.cadenceX0, mv);
        const y = U.lerp(m.y, row.y, mv);
        const len = U.lerp(m.len * grow, SX.L.cadenceStub, mv);
        el.setAttribute('x1', x.toFixed(2));
        el.setAttribute('y1', y.toFixed(2));
        el.setAttribute('x2', (x + len * Math.cos(ang)).toFixed(2));
        el.setAttribute('y2', (y + len * Math.sin(ang)).toFixed(2));
        el.setAttribute('stroke-width', U.lerp(10, 20, U.prog(q, 0.5, 1)).toFixed(2));
        el.setAttribute('stroke-linecap', q > 0.9 ? 'butt' : 'round');
      });

      const out = ui.exit(lt, 1.62, 0.26);
      const pb = lt >= 1.5 ? U.pulse(lt - 1.5, 10, 0.14) : 0;
      st.count.set(String(shown));
      const ce = ui.enter(lt, 0, 0.4);
      st.count.el.style.opacity = (ce.o * (1 - out)).toFixed(3);
      st.count.el.style.transform = `translate3d(${(-out * 80).toFixed(1)}px,0,0) scale(${(1 + 0.08 * pb).toFixed(4)})`;
      st.countLbl.style.opacity = st.count.el.style.opacity;

      // Turnaround clock: counts to 09D 03:39:28 by b3, holds
      const cp = E.outCubic(U.prog(lt, 0.12, 1.0));
      const sec = T_SEC * cp;
      st.clock.set(fmtClock(sec));
      st.hand.setAttribute('transform', `rotate(${((sec / 86400) * 360).toFixed(2)} ${CLOCK.x} ${CLOCK.y})`);
      const ke = ui.enter(lt, 0.1, 0.45);
      const kx = (-out * 80).toFixed(1);
      st.clock.el.style.opacity = st.clockLbl.style.opacity = (ke.o * (1 - out)).toFixed(3);
      st.clock.el.style.transform = `translate3d(${kx}px,${((1 - ke.e) * 30).toFixed(1)}px,0)`;
      st.clockLbl.style.transform = `translate3d(${kx}px,0,0)`;
      st.dial.setAttribute('opacity', (ke.o * (1 - out)).toFixed(3));
      st.dial.setAttribute('transform', `translate(${kx} 0)`);

      // B1067 rises in, then launches off the top as the tallies fall
      const be = ui.enter(lt, 0, 0.5);
      const launch = 1300 * E.inExpo(U.prog(lt, 1.58, 2.0));
      st.bg.setAttribute('transform', `translate(${BOOSTER_X} ${(940 + (1 - be.e) * 420 - launch).toFixed(1)}) scale(0.92)`);
      st.booster.setPlume(lt > 1.58 ? 120 + 60 * U.noise1(lt * 30, 4) : 0, 40);
      const le = ui.enter(lt, 0.2, 0.4);
      st.bLbl.style.opacity = (le.o * 0.85 * (1 - out)).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
