/* 12 END CARD — "하늘에서, / 손 안까지." (6 beats)
   Dusk. Letterbox opens and the Mavic 4 Pro hovers over the ridges (b1); its round camera head turns to face us
   and the focus brackets lock on the lens (b2). Match: the camera head carries into the Osmo Pocket 3's gimbal
   head while the view drops to hand height, the Mavic receding into the sky (b3). Sub-copy (b4), title and
   data date with the final hit (b5), then only the ridges and the hover keep moving while the bars retract (b6). */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;
  const F = D.flagship;

  const HOVER = { x: 1300, y: 560, s: 1.35 };
  const FAR = { x: 1560, y: 330, s: 0.42 };
  const POCKET = { x: 1400, y: 1110, s: 3.9 };
  const SUN = { x: 1600, y: 770, r: 100 };

  SX.defineScene({
    id: 12,
    role: 'END CARD',
    bg: 'night',
    ruler: (lt) => ({ from: 2006, to: 2006 + 20 * E.inOutCubic(U.prog(lt, 0, 1.5)), mark: U.lerp(2006, 2026, E.inOutCubic(U.prog(lt, 0, 1.5))) }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      // Dusk: stepped glow toward the horizon (night → a little beacon), sun half-set behind the far ridge
      [[380, 0.05], [520, 0.1], [640, 0.17], [760, 0.26]].forEach(([y, k]) => svg.appendChild(U.s('rect', { x: -100, y, width: 2120, height: 1180 - y, fill: ui.mix(C.night, C.beacon, k) })));
      st.sun = SX.land.sun(svg, SUN.x, SUN.y, SUN.r, C.beacon, 0.45);
      st.ridges = SX.land.ridges(svg, {
        color: C.night,
        layers: [
          { y: 850, amp: 170, seed: 121, fill: ui.mix(C.night, C.beacon, 0.08), speed: 5 },
          { y: 940, amp: 150, seed: 122, fill: ui.tone(C.night, 0.02), speed: 11 },
          { y: 1030, amp: 110, seed: 123, fill: ui.tone(C.night, -0.4), speed: 22, rough: 1.2 },
        ],
      });
      // Products are dark grey like the real ones; a warm rim light from the low sun keeps their outline readable
      const rim = ui.mix(C.mist, C.beacon, 0.3);
      st.mavicRim = P.layer(svg, { stroke: 0 });
      st.mavic = P.layer(svg);
      st.pocketRim = P.layer(svg, { stroke: 0 });
      st.pocket = P.layer(svg);
      st.rim = rim;
      cam.appendChild(svg);
      st.focus = ui.focus(cam);

      st.head = ui.headline(cam, { x: 120, y: 212, size: 128, lines: ['하늘에서,', '손 안까지.'], lineDelay: [null, 1.0] });
      st.sub = U.h('div', { class: 'subcopy', style: 'left:124px;top:520px;font-size:40px' });
      st.sub1 = U.h('div', { text: `Mavic 4 Pro · ${F.to.min}분 · ${F.to.km} km` });
      st.sub2 = U.h('div', { text: 'Osmo Pocket 3 · 누적 1,000만 대+' });
      st.sub.append(st.sub1, st.sub2);
      cam.appendChild(st.sub);
      st.title = U.h('div', { class: 'title', style: 'left:120px;top:700px;font-size:104px;transform-origin:0 50%', text: 'DJI 2006—2026' });
      st.asof = U.box(124, 826, 'mono', `DATA AS OF ${D.asOf}`);
      cam.append(st.title, st.asof);
      return st;
    },

    update(st, lt) {
      st.head.update(lt, 0.02);
      // Letterbox opens on b1, retracts on b6
      SX.letterbox(E.outExpo(U.prog(lt, 0, 0.4)) * (1 - E.inOutCubic(U.prog(lt, 2.5, 2.95))));

      // Gimbal-wipe arrival settles, ridges glide
      const arrive = ui.settle(lt, 0.35);
      st.ridges.update(lt + 30, 0, arrive * 80);
      st.sun.setAttribute('transform', `translate(0 ${(arrive * 40).toFixed(1)})`);

      // Mavic: hover, yaw to face the camera on b2; on b3 it recedes into the sky
      const face = E.inOutCubic(U.prog(lt, 0.5, 0.85));
      const away = E.inOutCubic(U.prog(lt, 1.0 - T.LEAD, 1.45));
      const bob = Math.sin(lt * 4.6) * 6;
      const mv = {
        x: U.lerp(HOVER.x, FAR.x, away),
        y: U.lerp(HOVER.y, FAR.y, away) + bob * (1 - 0.6 * away),
        s: U.lerp(HOVER.s, FAR.s, away),
        yaw: U.lerp(22, 0, face) + 10 * away,
        pitch: 7,
        anchors: {},
      };
      const mPolys = P.quadPolys(P.QUAD.mavic4, mv, { rotor: 1, spin: lt * 30 });
      st.mavic.draw(mPolys);
      st.mavicRim.draw(P.mono(mPolys, st.rim));
      st.mavicRim.g.setAttribute('transform', `translate(${(3 * mv.s / HOVER.s + 0.6).toFixed(2)} -2)`);

      // b2: focus brackets lock on the camera head
      const hd = mv.anchors.head;
      const fr = hd ? hd[3] * 1.9 : 60;
      const fe = U.prog(lt, 0.5 + 0.25, 1.0);
      if (hd) st.focus.set(hd[0] - fr, hd[1] - fr, fr * 2, fr * 2, fe, lt >= 0.75 && lt < 1.05 ? 1 - U.prog(lt, 0.98, 1.05) : 0);

      // b3: the Pocket 3 rises from the camera-head point to hand height (match on the gimbal head)
      const m = E.inOutCubic(U.prog(lt, 1.0 - T.LEAD, 1.4));
      if (m > 0.001 && hd) {
        const headZ = P.HAND.pocket3.head.z * POCKET.s; // screen px from the grip base to the head centre
        const s = U.lerp(POCKET.s * 0.35, POCKET.s, m);
        const baseX = U.lerp(HOVER.x, POCKET.x, m);
        const baseY = U.lerp(HOVER.y + (headZ * 0.35), POCKET.y, m) + Math.sin(lt * 2.2) * 3;
        const pp = P.pocketPolys(P.HAND.pocket3, { x: baseX, y: baseY, s, yaw: U.lerp(0, 14, m), pitch: 4 }, { screen: 1 });
        st.pocket.draw(pp);
        st.pocketRim.draw(P.mono(pp, st.rim));
        st.pocketRim.g.setAttribute('transform', 'translate(4 -3)');
        [st.pocket, st.pocketRim].forEach((L) => L.g.setAttribute('opacity', U.clamp(m * 3).toFixed(3)));
      } else {
        st.pocket.draw([]);
        st.pocketRim.draw([]);
      }

      // Copy: b4 sub-copy, b5 title + data date
      st.sub1.style.opacity = U.clamp((lt - 1.5) * 6).toFixed(3);
      st.sub2.style.opacity = U.clamp((lt - 1.5 - T.E8) * 6).toFixed(3);
      st.sub.style.transform = `translate3d(0,${((1 - E.outCubic(U.prog(lt, 1.5, 1.8))) * 24).toFixed(1)}px,0)`;
      ui.pop(st.title, lt, 2.0, { from: 0.85, dur: 0.4 });
      st.asof.style.opacity = U.clamp((lt - 2.0 - T.E8) * 6).toFixed(3);
    },
  });
})((window.SX = window.SX || {}));
