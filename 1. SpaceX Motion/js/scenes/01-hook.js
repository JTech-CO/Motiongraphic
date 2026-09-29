/* 01 HOOK — "2002년, / 1억 달러로"
   Year odometer rolls 2002→2026 on 16th notes, rewinds with a glitch to 2002 (b3),
   ~$100M counts up on b3 and holds b4, then shoots upward leaving a paper trail. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const TRAIL_X = 1440;
  const COUNTER_BOTTOM = 905;
  SX.L.hookTrailX = TRAIL_X;

  const FWD = [2002, 2006, 2010, 2014, 2018, 2022, 2026];

  /** Displayed year (float) as a pure function of scene time */
  function yearAt(lt) {
    if (lt < 0) return 2002;
    if (lt < 0.75) {
      const k = Math.min(5, Math.floor(lt / T.E16));
      const w = (lt - k * T.E16) / T.E16;
      return U.lerp(FWD[k], FWD[k + 1], E.outExpo(U.clamp(w / 0.7)));
    }
    if (lt < 1.0) return U.lerp(2026, 2002, E.inOutCubic(U.prog(lt, 0.75, 1.0)));
    return 2002;
  }

  /** Odometer wheel positions (thousands → units), each 0..10 */
  function wheels(Y) {
    const out = [];
    for (let k = 3; k >= 0; k--) {
      const p10 = Math.pow(10, k);
      if (k === 0) out.push(U.mod(Y, 10));
      else out.push((Math.floor(Y / p10) % 10) + Math.max(0, U.mod(Y, p10) - (p10 - 1)));
    }
    return out;
  }

  function makeRoller(cls) {
    const row = U.h('span', { class: `roller-row ${cls}` });
    const strips = [];
    for (let i = 0; i < 4; i++) {
      const strip = U.h('span', { class: 'roll-strip' });
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach((d) => strip.appendChild(U.h('span', { text: String(d) })));
      row.appendChild(U.h('span', { class: 'roll-col' }, strip));
      strips.push(strip);
    }
    return {
      row,
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
      return { from: 2002, to: y, mark: y };
    },

    build(cam) {
      const st = {};
      st.glow = ui.glow(cam, TRAIL_X, 800, C.flame, 0.16);

      st.guides = U.svgFull();
      st.guideG = U.s('g');
      [240, 360, 500, 660].forEach((r, i) =>
        st.guideG.appendChild(U.s('circle', {
          cx: TRAIL_X, cy: 800, r, fill: 'none', stroke: C.paper,
          'stroke-width': 1, opacity: 0.1 + i * 0.02, 'stroke-dasharray': i % 2 ? '2 10' : '1 6',
        })));
      st.guides.appendChild(st.guideG);
      cam.appendChild(st.guides);

      st.cap = ui.caption(cam, { x: 120, y: 250, text: `EST. ${D.company.founded} / ${D.company.foundedPlace}` });

      // Roller + two chroma ghosts for the rewind glitch
      const wrap = U.h('span', { class: 'roller' });
      st.ghostA = makeRoller('ghost');
      st.ghostB = makeRoller('ghost');
      st.ghostA.row.style.color = C.flame;
      st.ghostB.row.style.color = C.orbit;
      st.main = makeRoller('main');
      wrap.append(st.ghostA.row, st.ghostB.row, st.main.row);
      st.rollerWrap = wrap;

      st.head = ui.headline(cam, {
        x: 120, y: 296, size: 176,
        lines: [[wrap, '년,'], '1억 달러로'],
        lineDelay: [null, 1.0],
      });

      st.lblTop = U.h('div', { class: 'mono', style: 'right:120px;top:668px', text: 'FOUNDER CAPITAL · APPROX.' });
      st.counter = ui.counter(cam, { x: 1800, y: 700, size: 204, align: 'right' });
      st.lblBot = U.h('div', { class: 'mono', style: 'right:120px;top:920px;opacity:.7', text: 'FROM PAYPAL STAKE SALE · 2002' });
      st.trail = U.h('div', { class: 'trail', style: `left:${TRAIL_X - 2}px;top:0;height:0` });
      cam.append(st.lblTop, st.lblBot, st.trail);
      return st;
    },

    update(st, lt) {
      ui.breathe(st.glow, lt, 0.06);
      st.guideG.setAttribute('transform', `rotate(${(lt * 9).toFixed(2)} ${TRAIL_X} 800)`);

      // Roller
      const Y = yearAt(lt);
      st.main.set(Y);
      const v = Math.abs(yearAt(lt + 1 / 120) - Y) * 120;
      st.rollerWrap.style.filter = v > 1 ? `blur(${Math.min(3.5, v * 0.018).toFixed(2)}px)` : 'none';
      const glitch = lt >= 0.75 && lt < 1.0;
      const step = Math.floor(lt / T.E32);
      const jx = glitch ? (U.hash(step, 11) - 0.5) * 30 : 0;
      st.main.row.style.transform = `translate3d(${jx.toFixed(1)}px,0,0)`;
      [[st.ghostA, -1], [st.ghostB, 1]].forEach(([g, side]) => {
        g.set(Y);
        g.row.style.opacity = glitch ? 0.9 : 0;
        const off = side * (8 + U.hash(step, side > 0 ? 5 : 6) * 14);
        g.row.style.transform = `translate3d(${(jx + off).toFixed(1)}px,${(side * U.hash(step, 8) * 6).toFixed(1)}px,0)`;
      });

      st.cap.update(lt, 0, 1.78);
      st.head.update(lt, 0, 1.78);

      // ~$100M: counts on b3 (1.0→1.5), holds b4, then launches upward
      const cp = E.outCubic(U.prog(lt, 1.0, 1.5));
      st.counter.set(`${ui.approx(D.company.initialCapitalApprox)}$${Math.round(D.company.initialCapitalM * cp)}M`);
      const lift = 1150 * E.inExpo(U.prog(lt, 1.72, 2.0));
      const en = ui.enter(lt, 1.0, 0.45);
      const sc = lt < 1.0 ? 0.86 : U.lerp(0.86, 1, en.e);
      st.counter.el.style.opacity = lt < 1.0 ? 0 : en.o;
      st.counter.el.style.transform = `translate3d(0,${(-lift).toFixed(1)}px,0) scale(${sc.toFixed(4)})`;

      const lblOut = ui.exit(lt, 1.76, 0.2);
      [st.lblTop, st.lblBot].forEach((el, i) => {
        const p = U.prog(lt, 1.05 + i * 0.06, 1.35 + i * 0.06);
        el.style.opacity = (U.clamp(p * 3) * (1 - lblOut) * (i ? 0.7 : 1)).toFixed(3);
        el.style.transform = `translate3d(${((1 - E.outCubic(p)) * 40).toFixed(1)}px,${(-lblOut * 40).toFixed(1)}px,0)`;
      });

      // Paper trail under the rising number → becomes the strip reveal of scene 02
      if (lt >= 1.72) {
        const top = COUNTER_BOTTOM - lift;
        const bottom = COUNTER_BOTTOM + 175 * E.outExpo(U.prog(lt, 1.72, 1.8));
        st.trail.style.display = '';
        st.trail.style.top = `${top.toFixed(1)}px`;
        st.trail.style.height = `${Math.max(0, bottom - top).toFixed(1)}px`;
      } else st.trail.style.display = 'none';
    },
  });
})((window.SX = window.SX || {}));
