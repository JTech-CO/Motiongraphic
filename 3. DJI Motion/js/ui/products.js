/* DJI products as small 3D part rigs (millimetres), projected to flat shaded polygons.
   Dimensions follow the official specs (Phantom 1 350 mm diagonal, Mavic 4 Pro 328.7×390.5×135.2 mm unfolded,
   Mavic Mini 160×202×55, Mini 5 Pro 304×380×91 with props, Osmo Pocket 121.9×36.9×28.6,
   Osmo Pocket 3 139.7×42.2×33.5, Osmo Action 5 Pro 70.5×44.2×32.8); part shapes and colours follow official
   product photos. No logos or printed text are drawn.
   World axes: x right, y forward (the product's front), z up; the ground is z = 0.
   view = { x, y (screen px of the origin), s (px per mm), yaw, pitch (deg), f (perspective, mm) } */
(function (SX) {
  'use strict';
  const { U, ui } = SX;
  const D2R = Math.PI / 180;

  // ---------- vector helpers ----------
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const LIGHT = norm([-0.4, 0.55, 0.75]); // upper front-left

  /** Convex hull (Andrew's monotone chain) of 2D points */
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [];
    for (const q of p) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    const up = [];
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    up.pop();
    lo.pop();
    return lo.concat(up);
  }

  /** Camera: yaw about z, then pitch (looking down), mild perspective */
  function camera(v) {
    const yaw = (v.yaw || 0) * D2R;
    const pitch = (v.pitch || 0) * D2R;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const f = v.f || 2600;
    return {
      eye: [cp * sy, cp * cy, sp], // unit vector toward the camera, world space
      p(q) {
        const xr = q[0] * cy - q[1] * sy;
        const yr = q[0] * sy + q[1] * cy;
        const depth = yr * cp + q[2] * sp;
        const k = f / (f - depth);
        return [v.x + xr * k * v.s, v.y + (-q[2] * cp + yr * sp) * k * v.s, depth];
      },
    };
  }

  const shade = (hex, n) => ui.tone(hex, U.lerp(-0.34, 0.14, (dot(n, LIGHT) + 1) / 2));

  // ---------- primitives → polygons { d, pts, fill, op } ----------

  function polyFrom(cam, pts3, fill, op = 1, bias = 0) {
    let d = 0;
    const pts = pts3.map((q) => {
      const r = cam.p(q);
      d += r[2];
      return [r[0], r[1]];
    });
    return { d: d / pts3.length + bias, pts, fill, op };
  }

  /** Oriented box from its 8 corners; only faces turned to the camera are emitted */
  function boxCorners(c, u, v, w, su, sv, sw) {
    const P = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) for (const e of [-1, 1]) {
      P.push(add(add(add(c, mul(u, (a * su) / 2)), mul(v, (b * sv) / 2)), mul(w, (e * sw) / 2)));
    }
    return P; // index = (a+1)/2*4 + (b+1)/2*2 + (e+1)/2
  }
  const FACES = [
    { idx: [4, 5, 7, 6], n: 'u' }, { idx: [0, 2, 3, 1], n: '-u' },
    { idx: [2, 6, 7, 3], n: 'v' }, { idx: [0, 1, 5, 4], n: '-v' },
    { idx: [1, 3, 7, 5], n: 'w' }, { idx: [0, 4, 6, 2], n: '-w' },
  ];
  function box(out, cam, c, size, color, o = {}) {
    const u = o.u || [1, 0, 0];
    const v = o.v || [0, 1, 0];
    const w = o.w || [0, 0, 1];
    const P = boxCorners(c, u, v, w, size[0], size[1], size[2]);
    const center = cam.p(c)[2];
    for (const f of FACES) {
      const base = f.n.replace('-', '');
      const nv = mul(base === 'u' ? u : base === 'v' ? v : w, f.n[0] === '-' ? -1 : 1);
      if (dot(nv, cam.eye) <= 0.02) continue;
      const poly = polyFrom(cam, f.idx.map((i) => P[i]), o.flat ? color : shade(color, nv), o.op ?? 1, 0);
      poly.d = center + (o.bias || 0) + dot(nv, cam.eye) * 0.01;
      out.push(poly);
    }
  }
  /** Beam between two points (arms, legs): width across, height up */
  function beam(out, cam, p, q, wd, ht, color, o = {}) {
    const u = norm(sub(q, p));
    let v = cross([0, 0, 1], u);
    if (Math.hypot(v[0], v[1], v[2]) < 1e-6) v = [1, 0, 0];
    v = norm(v);
    const w = cross(u, v);
    const len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    box(out, cam, mul(add(p, q), 0.5), [len, wd, ht], color, Object.assign({}, o, { u, v, w }));
  }
  /** Superellipsoid shell: silhouette + lit top cap + shaded underside */
  function shell(out, cam, c, r, n, color, o = {}) {
    const all = [];
    const topCap = [];
    const lowCap = [];
    const e = 2 / n;
    const sp = (x) => Math.sign(x) * Math.pow(Math.abs(x), e);
    for (let i = 0; i <= 8; i++) {
      const th = -Math.PI / 2 + (i / 8) * Math.PI;
      for (let j = 0; j < 18; j++) {
        const ph = (j / 18) * Math.PI * 2;
        const q = [c[0] + r[0] * sp(Math.cos(th)) * sp(Math.cos(ph)), c[1] + r[1] * sp(Math.cos(th)) * sp(Math.sin(ph)), c[2] + r[2] * sp(Math.sin(th))];
        const s2 = cam.p(q);
        all.push([s2[0], s2[1]]);
        if (Math.sin(th) > 0.5) topCap.push([s2[0], s2[1]]);
        if (Math.sin(th) < -0.45) lowCap.push([s2[0], s2[1]]);
      }
    }
    const d = cam.p(c)[2] + (o.bias || 0);
    out.push({ d, pts: hull(all), fill: color, op: o.op ?? 1 });
    if (lowCap.length > 2) out.push({ d: d + 0.001, pts: hull(lowCap), fill: ui.tone(color, -0.2), op: o.op ?? 1 });
    if (topCap.length > 2 && cam.eye[2] > 0.05) out.push({ d: d + 0.002, pts: hull(topCap), fill: ui.tone(color, 0.12), op: o.op ?? 1 });
  }
  /** Circle points in the plane perpendicular to axis a */
  function ring(c, a, r, k = 22) {
    a = norm(a);
    let t = cross(a, [0, 0, 1]);
    if (Math.hypot(t[0], t[1], t[2]) < 1e-6) t = [1, 0, 0];
    t = norm(t);
    const b = cross(a, t);
    const P = [];
    for (let i = 0; i < k; i++) {
      const th = (i / k) * Math.PI * 2;
      P.push(add(c, add(mul(t, r * Math.cos(th)), mul(b, r * Math.sin(th)))));
    }
    return P;
  }
  /** Cylinder along axis a from base c, length h: side silhouette + the visible cap */
  function cyl(out, cam, c, a, r, h, color, o = {}) {
    a = norm(a);
    const top = add(c, mul(a, h));
    const r0 = ring(c, a, r, 18);
    const r1 = ring(top, a, r, 18);
    const d = cam.p(mul(add(c, top), 0.5))[2] + (o.bias || 0);
    const side = r0.concat(r1).map((q) => cam.p(q)).map((q) => [q[0], q[1]]);
    out.push({ d, pts: hull(side), fill: ui.tone(color, -0.08), op: o.op ?? 1 });
    const facing = dot(a, cam.eye);
    const cap = facing >= 0 ? r1 : r0;
    if (Math.abs(facing) > 0.04) out.push(polyFrom(cam, cap, o.cap || ui.tone(color, 0.1), o.op ?? 1, 0));
    out[out.length - 1].d = d + 0.002;
  }
  /** Flat disc facing axis a (lens, button, prop blur) */
  function disc(out, cam, c, a, r, color, op = 1, bias = 0, k = 24) {
    if (r <= 0.01) return;
    const poly = polyFrom(cam, ring(c, a, r, k), color, op, 0);
    poly.d = cam.p(c)[2] + bias;
    out.push(poly);
  }
  /** Flat quad in a plane: center c, axes e1/e2 (unit), half sizes, rotation in-plane */
  function plate(out, cam, c, e1, e2, hw, hh, color, rot = 0, op = 1, bias = 0) {
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    const a1 = add(mul(e1, cr), mul(e2, sr));
    const a2 = add(mul(e1, -sr), mul(e2, cr));
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => add(c, add(mul(a1, i * hw), mul(a2, j * hh))));
    const poly = polyFrom(cam, pts, color, op, 0);
    poly.d = cam.p(c)[2] + bias;
    out.push(poly);
  }

  // ---------- quadcopter rig ----------
  // Shared structure for Phantom 1, Mavic 4 Pro, Mavic Mini and Mini 5 Pro, so any two can be interpolated.
  const QUAD = {};

  QUAD.phantom1 = {
    body: { c: [0, 0, 150], r: [98, 98, 42], n: 2.6 },
    arms: [
      { root: [-50, 50, 150], tip: [-124, 124, 150] }, { root: [50, 50, 150], tip: [124, 124, 150] },
      { root: [-50, -50, 150], tip: [-124, -124, 150] }, { root: [50, -50, 150], tip: [124, -124, 150] },
    ],
    armW: 30, armH: 22, band: [0.52, 0.82], motorR: 14, motorH: 26, propR: 100, feetH: 0,
    gear: { h: 1, x: 70, y: 58, z: 118 },
    gopro: { c: [0, 18, 86], size: [60, 30, 40] },
    head: { c: [0, 60, 70], r: 0, depth: 0 },
    gimbal: { c: [0, 70, 30], size: [0, 0, 0], lensR: 0 },
    sensors: 0,
    col: { body: '#ECEFEE', arm: '#ECEFEE', band: '#E5412E', motor: '#9AA3AA', prop: '#DCE1E0', cam: '#3C444C', lens: '#111316', glint: '#7EA6CC', gear: '#E4E8E7' },
  };
  QUAD.mavic4 = {
    body: { c: [0, -12, 84], r: [48, 118, 40], n: 3.6 },
    arms: [
      { root: [-40, 62, 104], tip: [-172, 122, 112] }, { root: [40, 62, 104], tip: [172, 122, 112] },
      { root: [-38, -72, 62], tip: [-164, -132, 58] }, { root: [38, -72, 62], tip: [164, -132, 58] },
    ],
    armW: 20, armH: 16, band: [0.52, 0.82], motorR: 16, motorH: 22, propR: 120, feetH: 1,
    gear: { h: 0, x: 70, y: 58, z: 60 },
    gopro: { c: [0, 18, 60], size: [0, 0, 0] },
    head: { c: [0, 112, 58], r: 40, depth: 46 },
    gimbal: { c: [0, 70, 30], size: [0, 0, 0], lensR: 0 },
    sensors: 1,
    col: { body: '#3A424A', arm: '#343B42', band: '#343B42', motor: '#262C31', prop: '#15191D', cam: '#2B3238', lens: '#0B0D10', glint: '#7EA6CC', gear: '#2B3238' },
  };
  QUAD.mini1 = {
    body: { c: [0, 0, 40], r: [31, 64, 22], n: 3.0 },
    arms: [
      { root: [-26, 44, 46], tip: [-89, 68, 50] }, { root: [26, 44, 46], tip: [89, 68, 50] },
      { root: [-24, -40, 30], tip: [-86, -64, 30] }, { root: [24, -40, 30], tip: [86, -64, 30] },
    ],
    armW: 11, armH: 8, band: [0.52, 0.82], motorR: 9, motorH: 12, propR: 60, feetH: 1,
    gear: { h: 0, x: 30, y: 30, z: 20 },
    gopro: { c: [0, 10, 20], size: [0, 0, 0] },
    head: { c: [0, 70, 24], r: 0, depth: 0 },
    gimbal: { c: [0, 70, 22], size: [24, 20, 22], lensR: 7 },
    sensors: 0,
    col: { body: '#D6DBDA', arm: '#CDD3D2', band: '#CDD3D2', motor: '#8E979E', prop: '#9AA3AA', cam: '#2E353B', lens: '#0B0D10', glint: '#7EA6CC', gear: '#C6CCCB' },
  };
  QUAD.mini5 = {
    body: { c: [0, 0, 52], r: [36, 72, 27], n: 3.2 },
    arms: [
      { root: [-30, 50, 58], tip: [-112, 80, 62] }, { root: [30, 50, 58], tip: [112, 80, 62] },
      { root: [-28, -45, 40], tip: [-108, -75, 40] }, { root: [28, -45, 40], tip: [108, -75, 40] },
    ],
    armW: 13, armH: 9, band: [0.52, 0.82], motorR: 11, motorH: 14, propR: 75, feetH: 1,
    gear: { h: 0, x: 30, y: 30, z: 26 },
    gopro: { c: [0, 10, 26], size: [0, 0, 0] },
    head: { c: [0, 80, 28], r: 0, depth: 0 },
    gimbal: { c: [0, 80, 27], size: [44, 32, 38], lensR: 13 },
    sensors: 1,
    col: { body: '#58636D', arm: '#505B64', band: '#505B64', motor: '#2E353B', prop: '#20262B', cam: '#262C31', lens: '#0B0D10', glint: '#7EA6CC', gear: '#48525B' },
  };

  /** Interpolate two quad specs (all numeric fields and colours) */
  function lerpSpec(a, b, p) {
    if (typeof a === 'number') return U.lerp(a, b, p);
    if (typeof a === 'string') return ui.mix(a, b, p);
    if (Array.isArray(a)) return a.map((x, i) => lerpSpec(x, b[i], p));
    const o = {};
    for (const k in a) o[k] = lerpSpec(a[k], b[k], p);
    return o;
  }

  /** Quadcopter polygons. st = { spin (rad), rotor (0 blades … 1 blur disc) } */
  function quadPolys(q, view, st = {}) {
    const cam = camera(view);
    const out = [];
    const C = q.col;
    const rotor = st.rotor ?? 0;
    const spin = st.spin ?? 0;

    // Phantom-style landing gear: two legs per side and a ground skid
    if (q.gear.h > 0.02) {
      const g = q.gear;
      const zTop = g.z;
      const op = U.clamp(g.h * 3);
      for (const sx of [-1, 1]) {
        const skidZ = zTop * (1 - g.h);
        for (const sy of [-1, 1]) beam(out, cam, [sx * g.x * 0.8, sy * g.y * 0.8, zTop], [sx * g.x, sy * g.y, skidZ + 3], 8, 8, C.gear, { op });
        beam(out, cam, [sx * g.x, -g.y * 1.35, skidZ + 3], [sx * g.x, g.y * 1.35, skidZ + 3], 9, 7, C.gear, { op });
      }
    }

    // Arms (front arms carry the Phantom's red band)
    q.arms.forEach((a, i) => {
      if (i < 2 && q.band) {
        const P = (t) => add(a.root, mul(sub(a.tip, a.root), t));
        beam(out, cam, a.root, P(q.band[0]), q.armW, q.armH, C.arm);
        beam(out, cam, P(q.band[0]), P(q.band[1]), q.armW * 1.02, q.armH * 1.02, C.band);
        beam(out, cam, P(q.band[1]), a.tip, q.armW, q.armH, C.arm);
      } else beam(out, cam, a.root, a.tip, q.armW, q.armH, C.arm);
      // Mavic-style legs under the motors
      if (q.feetH > 0.02) {
        const zb = a.tip[2] - q.armH / 2;
        const len = zb * U.clamp(q.feetH);
        beam(out, cam, [a.tip[0] * 0.92, a.tip[1] * 0.92, zb], [a.tip[0] * 0.9, a.tip[1] * 0.9, zb - len + 2], 6, 6, C.gear, { op: U.clamp(q.feetH * 3) });
      }
      // Motor + rotor
      const mb = [a.tip[0], a.tip[1], a.tip[2] - q.motorH * 0.25];
      cyl(out, cam, mb, [0, 0, 1], q.motorR, q.motorH, C.motor);
      const hub = [a.tip[0], a.tip[1], mb[2] + q.motorH + 2];
      const dir = i === 0 || i === 3 ? 1 : -1;
      if (rotor < 0.98) {
        const ang = spin * dir + i * 0.7;
        for (const k of [0, Math.PI]) {
          const e = [hub[0] + Math.cos(ang + k) * q.propR, hub[1] + Math.sin(ang + k) * q.propR, hub[2]];
          beam(out, cam, hub, e, q.propR * 0.13, 2.5, C.prop, { op: 1 - rotor, flat: true, bias: 0.5 });
        }
      }
      if (rotor > 0.02) disc(out, cam, hub, [0, 0, 1], q.propR, C.prop, 0.28 * rotor, 0.6);
    });

    // Body shell
    shell(out, cam, q.body.c, q.body.r, q.body.n, C.body);

    // Front sensor windows (Mavic 4 Pro, Mini 5 Pro)
    if (q.sensors > 0.02) {
      const yf = q.body.c[1] + q.body.r[1] * 0.93;
      for (const sx of [-1, 1]) {
        plate(out, cam, [sx * q.body.r[0] * 0.42, yf, q.body.c[2] + q.body.r[2] * 0.35], [1, 0, 0], [0, 0, 1], q.body.r[0] * 0.16, q.body.r[2] * 0.16, C.lens, 0, U.clamp(q.sensors), 0.004);
      }
    }

    // Phantom 1: external camera on a mount under the shell
    const gp = q.gopro;
    if (gp.size[0] > 1) {
      beam(out, cam, [0, gp.c[1], q.body.c[2] - q.body.r[2] * 0.7], [0, gp.c[1], gp.c[2] + gp.size[2] / 2], 8, 8, C.cam);
      box(out, cam, gp.c, gp.size, C.cam);
      disc(out, cam, [gp.c[0] - gp.size[0] * 0.18, gp.c[1] + gp.size[1] / 2 + 0.5, gp.c[2] + 2], [0, 1, 0], gp.size[2] * 0.26, C.lens, 1, 0.01);
    }

    // Mavic 4 Pro: round rotating camera head with three lenses
    const hd = q.head;
    if (hd.r > 1) {
      cyl(out, cam, [hd.c[0], hd.c[1] - hd.depth / 2, hd.c[2]], [0, 1, 0], hd.r, hd.depth, C.cam, { cap: ui.tone(C.cam, 0.06) });
      const yF = hd.c[1] + hd.depth / 2 + 0.6;
      const L = [[-0.3, 0.02, 0.44], [0.42, 0.34, 0.22], [0.44, -0.3, 0.2]];
      L.forEach(([dx, dz, rr], k) => {
        const c = [hd.c[0] + dx * hd.r, yF, hd.c[2] + dz * hd.r];
        disc(out, cam, c, [0, 1, 0], rr * hd.r * 1.12, ui.tone(C.cam, -0.3), 1, 0.02 + k * 0.001);
        disc(out, cam, [c[0], c[1] + 0.2, c[2]], [0, 1, 0], rr * hd.r * 0.82, C.lens, 1, 0.025 + k * 0.001);
        disc(out, cam, [c[0] - rr * hd.r * 0.25, c[1] + 0.4, c[2] + rr * hd.r * 0.25], [0, 1, 0], rr * hd.r * 0.22, C.glint, 0.7, 0.03 + k * 0.001);
      });
      if (view.anchors) view.anchors.head = cam.p([hd.c[0], yF, hd.c[2]]).concat([hd.r * view.s]);
    }

    // Mini-style gimbal camera block
    const gb = q.gimbal;
    if (gb.size[0] > 1) {
      box(out, cam, gb.c, gb.size, C.cam);
      disc(out, cam, [gb.c[0], gb.c[1] + gb.size[1] / 2 + 0.5, gb.c[2]], [0, 1, 0], gb.lensR, C.lens, 1, 0.01);
      disc(out, cam, [gb.c[0] - gb.lensR * 0.3, gb.c[1] + gb.size[1] / 2 + 0.8, gb.c[2] + gb.lensR * 0.3], [0, 1, 0], gb.lensR * 0.3, C.glint, 0.7, 0.012);
    }

    if (view.anchors) view.anchors.body = cam.p(q.body.c);
    out.sort((a, b) => a.d - b.d);
    return out;
  }

  // ---------- handhelds ----------
  const HAND = {};
  HAND.pocket1 = {
    grip: [36.9, 28.6, 88], neck: 7, head: { box: [26, 22, 22], z: 107, lensR: 5.5, yoke: 1 },
    screen: { w: 19, h: 19, z: 70 }, buttons: [{ x: -7, z: 40, r: 4.2 }, { x: 7, z: 40, r: 4.2 }], rec: 0,
    col: { grip: '#23282D', screen: '#0B0D10', head: '#23282D', lens: '#0B0D10', glint: '#7EA6CC', btn: '#3A424A', rec: '#E5412E' },
  };
  HAND.pocket3 = {
    grip: [42.2, 33.5, 97], neck: 8, head: { box: [34, 28, 30], z: 120, lensR: 11, yoke: 1 },
    screen: { w: 32, h: 44, z: 66 }, buttons: [{ x: -9, z: 30, r: 5.5 }, { x: 9, z: 30, r: 0 }], rec: 1,
    col: { grip: '#262B30', screen: '#0B0D10', head: '#262B30', lens: '#0B0D10', glint: '#7EA6CC', btn: '#3A424A', rec: '#E5412E' },
  };

  /** Osmo Pocket / Pocket 3. st = { screen: 0 portrait … 1 landscape (Pocket 3 screen pivot) } */
  function pocketPolys(h, view, st = {}) {
    const cam = camera(view);
    const out = [];
    const C = h.col;
    const [gw, gd, gh] = h.grip;
    box(out, cam, [0, 0, gh / 2], h.grip, C.grip);
    // bottom chamfer hint
    plate(out, cam, [0, gd / 2 + 0.3, 5], [1, 0, 0], [0, 0, 1], gw * 0.46, 3, ui.tone(C.grip, -0.25), 0, 1, 0.001);
    // neck + yoke + camera head
    box(out, cam, [0, 0, gh + h.neck / 2], [gw * 0.42, gd * 0.5, h.neck], ui.tone(C.grip, -0.1));
    const hb = h.head.box;
    const hz = h.head.z;
    beam(out, cam, [hb[0] / 2 + 3, 0, gh + h.neck - 1], [hb[0] / 2 + 3, 0, hz + 2], 5, 8, ui.tone(C.head, 0.04));
    box(out, cam, [0, 0, hz], hb, C.head);
    const yF = hb[1] / 2 + 0.5;
    disc(out, cam, [0, yF, hz], [0, 1, 0], h.head.lensR * 1.35, ui.tone(C.head, -0.3), 1, 0.01);
    disc(out, cam, [0, yF + 0.3, hz], [0, 1, 0], h.head.lensR, C.lens, 1, 0.012);
    disc(out, cam, [-h.head.lensR * 0.3, yF + 0.6, hz + h.head.lensR * 0.3], [0, 1, 0], h.head.lensR * 0.3, C.glint, 0.75, 0.014);

    // Screen: Pocket 3's screen module pivots from portrait to landscape and overhangs the grip
    const s = h.screen;
    const rot = (st.screen || 0) * (Math.PI / 2);
    const yS = gd / 2 + 1.2 + 2.5 * h.rec * (st.screen || 0);
    if (h.rec > 0.5) plate(out, cam, [0, yS - 0.4, s.z], [1, 0, 0], [0, 0, 1], s.w / 2 + 2, s.h / 2 + 2, ui.tone(C.grip, 0.12), rot, 1, 0.02);
    plate(out, cam, [0, yS, s.z], [1, 0, 0], [0, 0, 1], s.w / 2, s.h / 2, C.screen, rot, 1, 0.021);
    if (view.anchors) {
      const a = cam.p([0, yS, s.z]);
      view.anchors.screen = { x: a[0], y: a[1], hw: ((rot > 0.78 ? s.h : s.w) / 2) * view.s, hh: ((rot > 0.78 ? s.w : s.h) / 2) * view.s, rot };
    }
    h.buttons.forEach((b) => disc(out, cam, [b.x, gd / 2 + 0.6, b.z], [0, 1, 0], b.r, C.btn, 1, 0.01));
    if (h.rec > 0.02) {
      disc(out, cam, [9, gd / 2 + 0.6, 30], [0, 1, 0], 5.6 * h.rec, C.rec, 1, 0.01);
      disc(out, cam, [9, gd / 2 + 0.9, 30], [0, 1, 0], 3.8 * h.rec, C.btn, 1, 0.011);
    }
    out.sort((a, b) => a.d - b.d);
    return out;
  }

  HAND.action5 = {
    body: [70.5, 32.8, 44.2],
    col: { body: '#23282D', screen: '#0B0D10', ring: '#E5412E', lens: '#0B0D10', glint: '#7EA6CC', trim: '#3A424A' },
  };
  function actionPolys(h, view) {
    const cam = camera(view);
    const out = [];
    const [w, d, ht] = h.body;
    const C = h.col;
    box(out, cam, [0, 0, ht / 2], h.body, C.body);
    const yF = d / 2 + 0.5;
    plate(out, cam, [-w * 0.2, yF, ht / 2], [1, 0, 0], [0, 0, 1], w * 0.2, ht * 0.32, C.screen, 0, 1, 0.01);
    disc(out, cam, [w * 0.22, yF + 0.3, ht / 2], [0, 1, 0], ht * 0.39, C.trim, 1, 0.01);
    disc(out, cam, [w * 0.22, yF + 0.6, ht / 2], [0, 1, 0], ht * 0.34, C.ring, 1, 0.012);
    disc(out, cam, [w * 0.22, yF + 0.9, ht / 2], [0, 1, 0], ht * 0.27, C.lens, 1, 0.014);
    disc(out, cam, [w * 0.18, yF + 1.2, ht * 0.58], [0, 1, 0], ht * 0.07, C.glint, 0.75, 0.016);
    box(out, cam, [-w * 0.3, 0, ht + 1.5], [8, 6, 3], C.trim);
    out.sort((a, b) => a.d - b.d);
    return out;
  }

  // ---------- renderers ----------

  /** SVG layer that re-uses <path> elements; draw(polys) each frame */
  function layer(parent, o = {}) {
    const g = U.s('g', { 'stroke-linejoin': 'round', 'stroke-width': o.stroke ?? 1.3 });
    parent.appendChild(g);
    const pool = [];
    return {
      g,
      draw(polys) {
        while (pool.length < polys.length) {
          const p = U.s('path');
          g.appendChild(p);
          pool.push(p);
        }
        pool.forEach((el, i) => {
          const q = polys[i];
          if (!q) {
            el.setAttribute('d', '');
            return;
          }
          el.setAttribute('d', U.pathD(q.pts) + 'Z');
          el.setAttribute('fill', q.fill);
          el.setAttribute('stroke', q.op >= 0.999 && !q.noStroke ? ui.tone(q.fill, -0.35) : 'none');
          el.setAttribute('opacity', q.op >= 0.999 ? 1 : q.op.toFixed(3));
        });
      },
    };
  }

  /** Paint polygons on a 2D canvas (sprites, particle fields) */
  function paint(ctx, polys) {
    for (const q of polys) {
      ctx.globalAlpha = q.op;
      ctx.fillStyle = q.fill;
      ctx.beginPath();
      q.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Screen bounding box of polygons (for focus brackets) */
  function bbox(polys) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    polys.forEach((q) => q.pts.forEach(([x, y]) => {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /** Recolour every polygon to one tone (silhouette mode for tiny icons) */
  const mono = (polys, fill) => polys.map((q) => Object.assign({}, q, { fill }));

  SX.prod = {
    QUAD, HAND, lerpSpec, quadPolys, pocketPolys, actionPolys, layer, paint, mono, hull, bbox,
  };
})((window.SX = window.SX || {}));
