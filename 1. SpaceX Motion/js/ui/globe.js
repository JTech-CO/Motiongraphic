/* Shared orthographic globe used by scene 07 (SVG morph) and scene 08 (canvas).
   Same projection in both → the ring-to-globe match cut lines up exactly. */
(function (SX) {
  'use strict';

  const TILT = 0.42; // view from slightly above the equator (rad)
  const cT = Math.cos(TILT);
  const sT = Math.sin(TILT);

  const globe = {
    center: { x: 1250, y: 560 },
    R: 300,
    TILT,
    /** Globe spin as a function of global time (continuous across scenes) */
    spin: (t) => 0.32 * t,

    /** Tilt a unit-sphere/world vector into view space → [X, Y, z] */
    view(x, y, z, cx, cy, R) {
      const y2 = y * cT - z * sT;
      const z2 = y * sT + z * cT;
      return [cx + R * x, cy - R * y2, z2];
    },

    /** Latitude/longitude wireframe split into front/back runs of screen points */
    lines(t, cx, cy, R) {
      const spin = globe.spin(t);
      const polys = [];
      const D = Math.PI / 180;
      for (let k = 0; k < 12; k++) {
        const lon = k * 30 * D + spin;
        const pts = [];
        for (let i = 0; i <= 36; i++) {
          const lat = (-90 + i * 5) * D;
          pts.push(globe.view(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon), cx, cy, R));
        }
        polys.push(pts);
      }
      for (const latDeg of [-60, -30, 0, 30, 60]) {
        const lat = latDeg * D;
        const pts = [];
        for (let i = 0; i <= 72; i++) {
          const lon = i * 5 * D + spin;
          pts.push(globe.view(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon), cx, cy, R));
        }
        polys.push(pts);
      }
      const front = [];
      const back = [];
      for (const pts of polys) {
        let run = [pts[0]];
        let isFront = pts[0][2] >= 0;
        for (let i = 1; i < pts.length; i++) {
          const f = pts[i][2] >= 0;
          if (f !== isFront) {
            run.push(pts[i]);
            (isFront ? front : back).push(run);
            run = [pts[i]];
            isFront = f;
          } else run.push(pts[i]);
        }
        if (run.length > 1) (isFront ? front : back).push(run);
      }
      return { front, back };
    },
  };

  SX.globe = globe;
})((window.SX = window.SX || {}));
