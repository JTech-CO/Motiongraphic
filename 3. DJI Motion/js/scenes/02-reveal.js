/* 02 REVEAL — "팬텀으로 / 하늘을 열었고,"
   Dawn ridges; the Phantom 1 sits on the ground (3/4 front), spins up on b2 and lifts off, focus brackets
   lock on b3 with its label, the USD 629 tag pops on b4 while it hovers. Letterbox 2.39:1.
   Exit: tilt up (transitions.js) into the sky of scene 03. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const P = SX.prod;

  const GROUND = 905;
  const DRONE = { x: 1260, s: 1.55, yaw: 26, pitch: 11 };

  SX.defineScene({
    id: 2,
    role: 'REVEAL',
    bg: 'mist',
    ruler: () => ({ from: 2013, to: 2013, mark: 2013 }),

    build(cam) {
      const st = {};
      const svg = U.svgFull();
      st.sun = SX.land.sun(svg, 1560, 560, 74, '#F8F9F7', 0.5);
      st.clouds = SX.land.clouds(svg, { color: '#F4F6F4', n: 5, y: 330, spread: 160, seed: 21, w: [260, 520], h: [26, 60], speed: 14, op: 0.9 });
      st.ridges = SX.land.ridges(svg, {
        color: C.mist,
        layers: [
          { y: 700, amp: 220, seed: 11, k: -0.07, speed: 6 },
          { y: 780, amp: 190, seed: 12, k: -0.14, speed: 14 },
          { y: 860, amp: 150, seed: 13, k: -0.24, speed: 26, rough: 1.3 },
          { y: 960, amp: 90, seed: 14, fill: ui.tone(C.ridge, -0.1), speed: 48, rough: 0.6 },
        ],
      });
      st.shadow = U.s('ellipse', { rx: 250, ry: 22, fill: C.night, opacity: 0.2 });
      svg.appendChild(st.shadow);
      st.drone = P.layer(svg);
      cam.appendChild(svg);

      st.focus = ui.focus(cam);
      st.name = ui.tag(cam, 0, 0, D.phantom.date, D.phantom.model);
      st.rtf = U.box(0, 0, 'mono sm', D.phantom.rtf);
      st.camTag = U.box(0, 0, 'mono sm', `↙ ${D.phantom.cam}`);
      cam.append(st.rtf, st.camTag);
      st.price = ui.chip(cam, 0, 0, 'PRICE', D.phantom.price, '');

      st.cap = ui.caption(cam, { x: 120, y: 172, text: `${D.phantom.model} / ${D.phantom.date} · READY TO FLY` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 128, lines: ['팬텀으로', '하늘을 열었고,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      const lb = E.outExpo(U.prog(lt, 0, 0.4)) * (1 - E.inCubic(U.prog(lt, 1.8, 2.0)));
      SX.letterbox(lb);

      // Crane-up arrival: the dawn drops into place, ridges keep gliding
      const arrive = ui.settle(lt, 0.35);
      st.ridges.update(lt + 2, 0, -arrive * 260);
      st.clouds.update(lt + 2, -arrive * 120);
      st.sun.setAttribute('transform', `translate(0 ${(-arrive * 60).toFixed(1)})`);

      // Spin-up on b2, lift-off b2→b3, hover after
      const rotor = E.inQuad(U.prog(lt, 0.5, 0.85));
      const spin = lt * 40 * (0.2 + rotor);
      const lift = E.inOutCubic(U.prog(lt, 0.62, 1.15));
      const bob = Math.sin(lt * 5.2) * 5 * lift;
      const y = GROUND - lift * 190 + bob - arrive * 60;
      const polys = P.quadPolys(P.QUAD.phantom1, { x: DRONE.x, y, s: DRONE.s, yaw: DRONE.yaw + 4 * lift, pitch: DRONE.pitch }, { rotor, spin });
      st.drone.draw(polys);
      st.shadow.setAttribute('cx', DRONE.x);
      st.shadow.setAttribute('cy', GROUND + 6 - arrive * 60);
      st.shadow.setAttribute('rx', (250 * (1 - 0.35 * lift)).toFixed(1));
      st.shadow.setAttribute('opacity', (0.2 * (1 - 0.6 * lift)).toFixed(3));

      // b3: focus lock + labels
      const bb = P.bbox(polys);
      const fe = U.prog(lt, 1.0 - T.LEAD, 1.0 + 0.25);
      st.focus.set(bb.x - 24, bb.y - 24, bb.w + 48, bb.h + 48, fe, lt >= 1.0 - T.LEAD ? 1 : 0);
      st.name.style.left = `${(bb.x + bb.w * 0.55).toFixed(1)}px`;
      st.name.style.top = `${(bb.y - 74).toFixed(1)}px`;
      ui.pop(st.name, lt, 1.0, { from: 0.7 });
      st.rtf.style.left = `${(bb.x + 2).toFixed(1)}px`;
      st.rtf.style.top = `${(bb.y + bb.h + 36).toFixed(1)}px`;
      st.rtf.style.opacity = U.clamp((lt - 1.05) * 6).toFixed(3);
      st.camTag.style.left = `${(DRONE.x + 60).toFixed(1)}px`;
      st.camTag.style.top = `${(y - 70).toFixed(1)}px`;
      st.camTag.style.opacity = U.clamp((lt - 1.0 - T.E16 * 2) * 6).toFixed(3);

      // b4: price
      st.price.style.left = `${(bb.x + bb.w - 160).toFixed(1)}px`;
      st.price.style.top = `${(bb.y + bb.h + 24).toFixed(1)}px`;
      ui.pop(st.price, lt, 1.5, { from: 0.5 });
    },
  });
})((window.SX = window.SX || {}));
