/* 02 REVEAL — "세단 세 대로 / 시작해,"
   A 3D card deck fans out on the beats: G90 (HI, 2015-12) → G80 (DH, 2016) → G70 (IK, 2017),
   each with its launch-generation side profile. 57,451 (2016 global) counts on b3 and lands on b4.
   Exit: the G80 card fills the frame (ink → copper) and its car/name carry into scene 03. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const DECK = { cx: 1290, cy: 600 };
  const CARD = { w: 540, h: 330 };
  const FAN = [
    { dx: -330, dy: 40, rot: -8, z: 1, at: 0.0 },
    { dx: 0, dy: -10, rot: 0, z: 3, at: 0.5 },
    { dx: 330, dy: 40, rot: 8, z: 2, at: 1.0 },
  ];
  const G80 = 1; // index of the card that carries into scene 03

  // Where the G80 card's car and name sit in stage coordinates at rest
  const cardRect = (i) => ({ x: DECK.cx + FAN[i].dx - CARD.w / 2, y: DECK.cy + FAN[i].dy - CARD.h / 2 });
  const carIn = (i, L) => {
    const s = 470 / L;
    const r = cardRect(i);
    return { x0: r.x + (CARD.w - L * s) / 2, ground: r.y + CARD.h - 34, s };
  };

  SX.defineScene({
    id: 2,
    role: 'REVEAL',
    bg: 'paper',
    ruler: (lt) => ({ from: 2015, to: 2017, mark: SX.hud.hop(lt, [2015, 2016, 2017, 2016]) }),

    build(cam) {
      const st = {};
      st.tex = U.h('div', { class: 'diamonds' });
      cam.appendChild(st.tex);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'G90 · G80 · G70 / 2015–2017' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 132, lines: ['세단 세 대로', '시작해,'] });

      st.count = ui.counter(cam, { x: 120, y: 590, size: 120 });
      st.countLbl = U.box(124, 722, 'mono', `2016 · GLOBAL SALES`);
      cam.appendChild(st.countLbl);

      st.deck = U.h('div', { class: 'deck' });
      cam.appendChild(st.deck);
      st.cards = D.firstSedans.map((m, i) => {
        const el = U.h('div', { class: 'card', style: `left:${DECK.cx}px;top:${DECK.cy}px;z-index:${FAN[i].z}` });
        el.append(
          U.h('div', { class: 'card-name', text: m.model }),
          U.h('div', { class: 'card-meta' }, U.h('div', { text: `${m.code} · ${m.date}` }), U.h('div', { text: `${m.role} SEDAN`, style: 'opacity:.65' }))
        );
        const svg = U.s('svg', { width: CARD.w, height: CARD.h, viewBox: `0 0 ${CARD.w} ${CARD.h}` });
        svg.appendChild(U.s('line', { x1: 24, y1: CARD.h - 34, x2: CARD.w - 24, y2: CARD.h - 34, stroke: C.paper, 'stroke-opacity': 0.25 }));
        const car = SX.cars.build(svg, m.car, { body: C.paper, window: C.ink, detail: C.ink, tire: '#2A2B2E', rim: '#8E8A84', lamp: C.glacier });
        const L = car.spec.L;
        const s = 470 / L;
        car.place((CARD.w - L * s) / 2, CARD.h - 34, s);
        el.appendChild(svg);
        st.deck.appendChild(el);
        return { el, car, svg };
      });

      // Carry-over layer for the exit (card fill + G80 car + name)
      st.fill = U.h('div', { class: 'card-fill', style: 'left:0;top:0;width:0;height:0;display:none' });
      cam.appendChild(st.fill);
      st.overSvg = U.svgFull();
      st.overCar = SX.cars.build(st.overSvg, 'dh', { body: C.paper, window: C.ink, detail: C.ink, tire: '#2A2B2E', rim: '#8E8A84', lamp: C.glacier });
      cam.appendChild(st.overSvg);
      st.overName = U.h('div', { class: 'model-name', text: 'G80', style: 'left:0;top:0;transform-origin:0 0;display:none' });
      cam.appendChild(st.overName);
      return st;
    },

    update(st, lt) {
      st.tex.style.transform = `translate3d(${(-lt * 10).toFixed(1)}px,${(-lt * 6).toFixed(1)}px,0)`;
      const out = ui.exit(lt, 1.62, 0.26);
      st.cap.update(lt, 0, 1.62);
      st.head.update(lt, 0.02, 1.62);

      // 57,451 counts on b3, lands on b4
      const cp = E.outCubic(U.prog(lt, 1.0, 1.5));
      st.count.set(U.fmtInt(D.global2016 * cp));
      const ce = ui.enter(lt, 0.95, 0.4);
      [st.count.el, st.countLbl].forEach((el) => {
        el.style.opacity = (ce.o * (1 - out)).toFixed(3);
        el.style.transform = `translate3d(${(-out * 120).toFixed(1)}px,${((1 - ce.e) * 26).toFixed(1)}px,0)`;
      });

      // Cards fan out on b1 / b2 / b3
      const m = E.inOutCubic(U.prog(lt, 1.6, 2.0));
      st.cards.forEach((c, i) => {
        const f = FAN[i];
        const en = ui.enter(lt, f.at, 0.55);
        const float = Math.sin(lt * 2.2 + i) * 4;
        let x = U.lerp(0, f.dx, en.e);
        let y = U.lerp(260, f.dy, en.e) + float;
        const rot = U.lerp(0, f.rot, en.e);
        if (i !== G80) x += (i < G80 ? -1 : 1) * 900 * out;
        c.el.style.opacity = (en.o * (i === G80 && lt >= 1.6 ? 0 : 1)).toFixed(3);
        c.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotateY(${(rot * 1.6).toFixed(2)}deg) rotateZ(${rot.toFixed(2)}deg)`;
        c.car.setWheels(lt * 3);
      });

      // Exit: G80 card grows into the copper frame of scene 03; car and name move to their new places
      const on = lt >= 1.6;
      st.fill.style.display = on ? '' : 'none';
      st.overSvg.style.display = on ? '' : 'none';
      st.overName.style.display = on ? '' : 'none';
      if (!on) return;
      const r = cardRect(G80);
      const fx = U.lerp(r.x, 0, m);
      const fy = U.lerp(r.y, 0, m);
      st.fill.style.left = `${fx.toFixed(1)}px`;
      st.fill.style.top = `${fy.toFixed(1)}px`;
      st.fill.style.width = `${U.lerp(CARD.w, T.W, m).toFixed(1)}px`;
      st.fill.style.height = `${U.lerp(CARD.h, T.H, m).toFixed(1)}px`;
      st.fill.style.background = mix(C.ink, C.copper, m);

      const a = carIn(G80, 4990);
      const b = SX.L.pivotCar;
      st.overCar.place(U.lerp(a.x0, b.x0, m), U.lerp(a.ground, b.ground, m), U.lerp(a.s, b.s, m));
      st.overCar.setBody(mix(C.paper, C.ink, m));
      st.overCar.setWindow(mix(C.ink, C.glacier, m));
      st.overCar.setWheels(lt * 3);

      const n = SX.L.pivotName;
      const nx = U.lerp(r.x + 26, n.x, m);
      const ny = U.lerp(r.y + 20, n.y, m);
      const ns = U.lerp(84 / 128, 1, m);
      st.overName.style.transform = `translate3d(${nx.toFixed(1)}px,${ny.toFixed(1)}px,0) scale(${ns.toFixed(4)})`;
      st.overName.style.color = mix(C.paper, C.ink, m);
    },
  });

  function mix(a, b, p) {
    const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
    const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(U.lerp(v, pb[i], p))).join(',')})`;
  }
  SX.mixHex = mix;
})((window.SX = window.SX || {}));
