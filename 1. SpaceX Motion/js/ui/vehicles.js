/* Generic, simplified launch-vehicle silhouettes (flat vector + thin line detail).
   Not official artwork: no logos, marks or mission patches. Origins are bottom-center. */
(function (SX) {
  'use strict';
  const { U } = SX;
  const s = U.s;

  const trap = (x, y0, y1, w0, w1) =>
    `${x - w0 / 2},${y0} ${x + w0 / 2},${y0} ${x + w1 / 2},${y1} ${x - w1 / 2},${y1}`;

  const V = {};

  /** Falcon 1 — height ≈ 222 */
  V.falcon1 = (body, detail) => {
    const g = s('g');
    g.append(
      s('polygon', { points: trap(0, -10, 5, 14, 22), fill: body }),
      s('rect', { x: -12, y: -190, width: 24, height: 180, fill: body }),
      s('path', { d: 'M-12 -190 C-12 -208 -6 -219 0 -222 C6 -219 12 -208 12 -190 Z', fill: body }),
      s('line', { x1: -12, y1: -122, x2: 12, y2: -122, stroke: detail, 'stroke-width': 2 }),
      s('line', { x1: -12, y1: -176, x2: 12, y2: -176, stroke: detail, 'stroke-width': 1.5 }),
      s('line', { x1: 0, y1: -170, x2: 0, y2: -132, stroke: detail, 'stroke-width': 1.5, opacity: 0.6 })
    );
    return { g };
  };

  /** Falcon 9 first stage with landing legs. Leg tips sit at y = 0 when deployed. */
  V.f9Booster = (body, detail, label = null) => {
    const g = s('g');
    const plume = s('polygon', { points: '0,0 0,0 0,0', fill: SX.C.flame });
    const legs = [-1, 1].map((side) => {
      const leg = s('line', {
        x1: side * 30, y1: -96, x2: side * 30, y2: -246,
        stroke: body, 'stroke-width': 7, 'stroke-linecap': 'round',
      });
      const foot = s('circle', { cx: side * 30, cy: -246, r: 5, fill: body });
      return { side, leg, foot };
    });
    g.appendChild(plume);
    legs.forEach((l) => g.append(l.leg, l.foot));
    g.append(
      s('rect', { x: -30, y: -560, width: 60, height: 480, fill: body }),
      s('rect', { x: -30, y: -560, width: 60, height: 42, fill: detail }),
      s('rect', { x: -56, y: -548, width: 26, height: 16, fill: body }),
      s('rect', { x: 30, y: -548, width: 26, height: 16, fill: body }),
      s('path', { d: 'M-50 -548 V-532 M-43 -548 V-532 M-36 -548 V-532 M36 -548 V-532 M43 -548 V-532 M50 -548 V-532', stroke: detail, 'stroke-width': 1.5 }),
      s('line', { x1: -30, y1: -330, x2: 30, y2: -330, stroke: detail, 'stroke-width': 1.5, opacity: 0.5 }),
      s('rect', { x: -30, y: -80, width: 60, height: 22, fill: detail }),
      s('polygon', { points: trap(-19, -58, -44, 12, 17), fill: detail }),
      s('polygon', { points: trap(0, -58, -44, 12, 17), fill: detail }),
      s('polygon', { points: trap(19, -58, -44, 12, 17), fill: detail })
    );
    if (label) {
      g.appendChild(
        s('text', {
          x: 0, y: 0, fill: detail, style: 'font-family:var(--f-mono)', 'font-size': 26,
          'letter-spacing': 6, 'text-anchor': 'middle', transform: 'translate(9 -300) rotate(-90)',
          text: label,
        })
      );
    }

    return {
      g,
      /** phi: 0 = folded against the body, 1 = deployed */
      setLegs(phi) {
        const a = U.rad(129.8) * phi;
        legs.forEach(({ side, leg, foot }) => {
          const x = side * 30 + side * 150 * Math.sin(a);
          const y = -96 - 150 * Math.cos(a);
          leg.setAttribute('x2', x.toFixed(2));
          leg.setAttribute('y2', y.toFixed(2));
          foot.setAttribute('cx', x.toFixed(2));
          foot.setAttribute('cy', y.toFixed(2));
        });
      },
      setPlume(len, w = 36) {
        plume.setAttribute('points', len <= 0 ? '0,0 0,0 0,0' : `${-w / 2},-44 ${w / 2},-44 0,${(-44 + len).toFixed(1)}`);
      },
    };
  };

  /** Full Falcon 9 (for height comparison). Height 400 = 70 m */
  V.f9Full = (body, detail) => {
    const g = s('g');
    g.append(
      s('polygon', { points: trap(0, -14, 0, 16, 22), fill: body }),
      s('rect', { x: -10.5, y: -352, width: 21, height: 338, fill: body }),
      s('path', { d: 'M-12.5 -352 V-372 C-12.5 -388 -6 -398 0 -400 C6 -398 12.5 -388 12.5 -372 V-352 Z', fill: body }),
      s('rect', { x: -10.5, y: -262, width: 21, height: 16, fill: detail }),
      s('rect', { x: -10.5, y: -30, width: 21, height: 10, fill: detail })
    );
    return { g };
  };

  /** Starship stack. Height 400 = 121 m, width 30 = 9 m. Booster and ship are separate groups. */
  V.starship = (body, detail) => {
    const booster = s('g');
    const bPlume = s('polygon', { points: '0,0 0,0 0,0', fill: SX.C.flame });
    booster.append(
      bPlume,
      s('rect', { x: -16, y: -12, width: 32, height: 12, fill: body }),
      s('rect', { x: -15, y: -235, width: 30, height: 225, fill: body }),
      s('rect', { x: -15, y: -247, width: 30, height: 12, fill: detail }),
      s('path', { d: 'M-10 -245 V-237 M-4 -245 V-237 M2 -245 V-237 M8 -245 V-237', stroke: body, 'stroke-width': 1.5 }),
      s('rect', { x: -24, y: -230, width: 9, height: 8, fill: body }),
      s('rect', { x: 15, y: -230, width: 9, height: 8, fill: body }),
      s('line', { x1: -15, y1: -120, x2: 15, y2: -120, stroke: detail, 'stroke-width': 1, opacity: 0.45 }),
      s('line', { x1: -15, y1: -12, x2: 15, y2: -12, stroke: detail, 'stroke-width': 1.5 })
    );

    const ship = s('g');
    const sPlume = s('polygon', { points: '0,0 0,0 0,0', fill: SX.C.flame });
    ship.append(
      sPlume,
      s('rect', { x: -15, y: -120, width: 30, height: 120, fill: body }),
      s('path', { d: 'M-15 -120 C-15 -138 -8 -150 0 -153 C8 -150 15 -138 15 -120 Z', fill: body }),
      s('polygon', { points: '-15,-134 -24,-128 -24,-114 -15,-112', fill: body }),
      s('polygon', { points: '15,-134 24,-128 24,-114 15,-112', fill: body }),
      s('polygon', { points: '-15,-32 -27,-22 -27,-2 -15,-2', fill: body }),
      s('polygon', { points: '15,-32 27,-22 27,-2 15,-2', fill: body }),
      s('line', { x1: -15, y1: -60, x2: 15, y2: -60, stroke: detail, 'stroke-width': 1, opacity: 0.45 }),
      s('line', { x1: 0, y1: -118, x2: 0, y2: -4, stroke: detail, 'stroke-width': 1, opacity: 0.25 })
    );

    const plume = (el, len, w, y0 = 0) =>
      el.setAttribute('points', len <= 0 ? '0,0 0,0 0,0' : `${-w / 2},${y0} ${w / 2},${y0} 0,${(y0 + len).toFixed(1)}`);

    return {
      booster,
      ship,
      shipOffset: -247, // ship origin relative to booster origin when stacked
      setBoosterPlume: (len, w = 30) => plume(bPlume, len, w),
      setShipPlume: (len, w = 18) => plume(sPlume, len, w),
    };
  };

  SX.vehicles = V;
})((window.SX = window.SX || {}));
