/* 01 HOOK — "2015년 11월 4일, / 배지를 뗐다."
   The Hyundai Genesis sedan (DH) drives in under a "HYUNDAI GENESIS" nameplate while the year
   roller flicks 2003 → 2008 → 2015 on 16th notes. On b2 the HYUNDAI letters peel off one by one,
   b3 leaves GENESIS alone, b4 stamps 2015-11-04. Exit: strip shutter (transitions.js). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const CAR = { x0: 720, ground: 960, s: 0.2204 };
  const PLATE_CX = CAR.x0 + (4990 * CAR.s) / 2;
  const LINEAGE = D.brand.lineage;

  /** Displayed year as a pure function of scene time (lands on 2015 exactly on b2) */
  function yearAt(lt) {
    if (lt < 0.1) return LINEAGE[0].year;
    if (lt < 0.25) return U.lerp(LINEAGE[0].year, LINEAGE[1].year, E.outExpo(U.prog(lt, 0.1, 0.25)));
    if (lt < 0.5 - T.LEAD) return LINEAGE[1].year;
    if (lt < 0.5) return U.lerp(LINEAGE[1].year, LINEAGE[2].year, E.inOutCubic(U.prog(lt, 0.5 - T.LEAD, 0.5)));
    return LINEAGE[2].year;
  }

  function wheels(Y) {
    const out = [];
    for (let k = 3; k >= 0; k--) {
      const p10 = Math.pow(10, k);
      if (k === 0) out.push(U.mod(Y, 10));
      else out.push((Math.floor(Y / p10) % 10) + Math.max(0, U.mod(Y, p10) - (p10 - 1)));
    }
    return out;
  }

  function makeRoller() {
    const row = U.h('span', { class: 'roller-row' });
    const strips = [];
    for (let i = 0; i < 4; i++) {
      const strip = U.h('span', { class: 'roll-strip' });
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach((d) => strip.appendChild(U.h('span', { text: String(d) })));
      row.appendChild(U.h('span', { class: 'roll-col' }, strip));
      strips.push(strip);
    }
    return {
      el: U.h('span', { class: 'roller' }, row),
      set(Y) {
        wheels(Y).forEach((pos, i) => {
          strips[i].style.transform = `translate3d(0,${(-pos).toFixed(4)}em,0)`;
        });
      },
    };
  }

  SX.defineScene({
    id: 1,
    role: 'HOOK',
    bg: 'dark',
    ruler: (lt) => {
      const y = yearAt(lt);
      return { from: 2015, to: 2015, mark: y };
    },

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, PLATE_CX, 760, C.copper, 0.14);

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `EST. ${D.brand.launched} / INDEPENDENT BRAND` });
      st.roller = makeRoller();
      st.head = ui.headline(cam, {
        x: 120, y: 212, size: 124,
        lines: [[st.roller.el, '년 11월 4일,'], '배지를 뗐다.'],
        lineDelay: [null, 1.0],
      });

      st.lineage = U.box(884, 470, 'mono', '');
      st.lineage.style.opacity = 0.75;
      cam.appendChild(st.lineage);

      // Nameplate: flex row centred over the car; "HYUNDAI " collapses as its letters fall
      st.hyLetters = [];
      st.hy = U.h('span', { style: 'display:inline-flex;overflow:visible;white-space:pre' });
      'HYUNDAI '.split('').forEach((ch) => {
        const sp = U.h('span', { text: ch });
        st.hy.appendChild(sp);
        st.hyLetters.push(sp);
      });
      st.hyWrap = U.h('span', { style: 'display:inline-block;overflow:visible' }, st.hy);
      st.gen = U.h('span', { text: 'GENESIS', style: 'display:inline-block' });
      st.plate = U.h('div', {
        class: 'nameplate',
        style: `left:0;width:${(PLATE_CX * 2).toFixed(0)}px;top:512px;display:flex;justify-content:center`,
      }, st.hyWrap, st.gen);
      cam.appendChild(st.plate);

      st.svg = U.svgFull();
      st.underline = [0, 1].map(() => U.s('line', { stroke: C.paper, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      st.svg.append(...st.underline);
      st.car = SX.cars.build(st.svg, 'dh', {
        body: C.paper, window: C.black, detail: C.black, tire: C.black, rim: '#8E8A84', lamp: C.glacier,
      });
      cam.appendChild(st.svg);

      st.stamp = ui.stamp(cam, { x: 420, y: 790, main: D.brand.launched, sub: 'INDEPENDENT BRAND', rot: -8, color: C.magma });
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.05);
      st.cap.update(lt, 0);
      st.head.update(lt, 0);

      const Y = yearAt(lt);
      st.roller.set(Y);
      const idx = Y >= 2015 ? 2 : Y >= 2008 ? 1 : 0;
      U.setText(st.lineage, `${LINEAGE[idx].year} · ${LINEAGE[idx].label}`);
      st.lineage.style.opacity = (0.75 * U.clamp((lt + 0.05) * 6)).toFixed(3);

      // Car drives in from the left and keeps rolling
      const inP = E.outExpo(U.prog(lt, 0, 0.42));
      const dx = -1100 * (1 - inP);
      st.car.place(CAR.x0 + dx, CAR.ground, CAR.s);
      const travel = lt * 700 - dx;
      st.car.setWheels(travel / (340 * CAR.s));

      // Plate letters: HYUNDAI peels off on 32nd notes during b2
      const pe = ui.enter(lt, 0.02, 0.4);
      st.plate.style.opacity = pe.o.toFixed(3);
      st.plate.style.transform = `translate3d(0,${((1 - pe.e) * 40).toFixed(1)}px,0)`;
      st.hyLetters.forEach((sp, k) => {
        const t0 = 0.5 + k * T.E32;
        const q = U.prog(lt, t0, t0 + 0.34);
        const dir = U.hash(k, 3) > 0.5 ? 1 : -1;
        sp.style.transform = `translate3d(${(dir * 40 * q).toFixed(1)}px,${(480 * E.inQuad(q)).toFixed(1)}px,0) rotate(${(dir * (25 + 40 * U.hash(k, 4)) * q).toFixed(1)}deg)`;
        sp.style.opacity = (1 - E.inQuad(q)).toFixed(3);
      });
      // Collapse the gap so GENESIS re-centres over the car on b3
      // offsetWidth ignores the falling letters' transforms, so the width stays stable
      const natural = st.hyLetters.reduce((w, sp) => w + sp.offsetWidth, 0);
      const collapse = E.spring(U.prog(lt, 1.0, 1.45));
      st.hyWrap.style.width = `${(natural * (1 - collapse)).toFixed(1)}px`;
      const gs = 1 + 0.16 * E.spring(U.prog(lt, 1.0, 1.5));
      st.gen.style.transform = `scale(${gs.toFixed(4)})`;
      st.gen.style.color = lt >= 1.0 ? C.paper : '';

      // Two-line light underline under GENESIS on b3
      const ul = E.outExpo(U.prog(lt, 1.05, 1.4));
      const half = 300 * ul;
      [604, 618].forEach((y, i) => {
        const l = st.underline[i];
        l.setAttribute('x1', (PLATE_CX - half).toFixed(1));
        l.setAttribute('x2', (PLATE_CX + half).toFixed(1));
        l.setAttribute('y1', y);
        l.setAttribute('y2', y);
        l.setAttribute('opacity', ul > 0 ? 0.9 : 0);
      });

      st.stamp.update(lt, 1.5);
    },
  });
})((window.SX = window.SX || {}));
