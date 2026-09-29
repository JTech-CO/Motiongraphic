/* Model-specific side-profile silhouettes (flat vector + thin line detail).
   Geometry is in millimetres: x from the rear bumper (0) to the front bumper (L), y up from the ground.
   Proportions follow each model's real design; no emblems, wordmarks or logos are drawn.
   Cars face right. place() maps mm → stage px (ground line at `ground`, `s` px per mm). */
(function (SX) {
  'use strict';
  const { U } = SX;

  // ---------- geometry helpers ----------

  /** Catmull-Rom through points; a point with a 3rd element 'c' is a sharp corner. Returns a dense polyline. */
  function spline(pts, closed = false, steps = 10) {
    const n = pts.length;
    const P = (i) => pts[closed ? U.mod(i, n) : U.clamp(i, 0, n - 1)];
    const out = [];
    const segs = closed ? n : n - 1;
    const tan = (i) => {
      const p = P(i);
      if (p[2] === 'c' || (!closed && (i === 0 || i === n - 1))) return [0, 0];
      const a = P(i - 1);
      const b = P(i + 1);
      return [(b[0] - a[0]) * 0.5, (b[1] - a[1]) * 0.5];
    };
    for (let i = 0; i < segs; i++) {
      const p0 = P(i);
      const p1 = P(i + 1);
      const t0 = tan(i);
      const t1 = tan(i + 1);
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        out.push([
          h00 * p0[0] + h10 * t0[0] + h01 * p1[0] + h11 * t1[0],
          h00 * p0[1] + h10 * t0[1] + h01 * p1[1] + h11 * t1[1],
        ]);
      }
    }
    if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  }

  /** Arc points from angle a0 → a1 (radians, y-up orientation) */
  function arc(cx, cy, r, a0, a1, n = 18) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = U.lerp(a0, a1, i / n);
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
  }

  /** Full body outline: top profile (rear-bottom → front-bottom) + underside with wheel arches */
  function bodyOutline(m) {
    const top = spline(m.top, false, 12);
    const archPts = (xc) => {
      const dy = m.sill - m.R;
      const dx = Math.sqrt(Math.max(0, m.Ra * m.Ra - dy * dy));
      const a0 = Math.atan2(dy, dx);
      return arc(xc, m.R, m.Ra, a0, Math.PI - a0, 22);
    };
    return top.concat(archPts(m.xf), archPts(m.xr));
  }

  /** Resample a closed polyline to n points by arc length */
  function resample(pts, n) {
    const closed = pts.concat([pts[0]]);
    const acc = U.polyLengths(closed);
    const total = acc[acc.length - 1];
    const out = [];
    for (let i = 0; i < n; i++) {
      const q = U.pointAt(closed, acc, (total * i) / n);
      out.push([q.x, q.y]);
    }
    return out;
  }

  // ---------- model specs (mm) ----------
  // top: rear-bottom corner → up the tail → roof → windshield → hood → nose → front-bottom corner
  // dlo: side glass outline · pillars: [x1, y1, x2, y2, width] · para: main character line
  const M = {};

  // Hyundai Genesis sedan (DH) — also the 2016 G80 (rebadge). 6-light glass, pre two-line lamps
  M.dh = {
    L: 4990, H: 1480, xr: 1110, xf: 4120, R: 340, Ra: 385, sill: 250,
    top: [[70, 290, 'c'], [0, 520], [15, 790], [70, 935, 'c'], [620, 1000], [1010, 1030, 'c'], [1520, 1370], [1880, 1470], [2600, 1480], [3000, 1440], [3460, 1080, 'c'], [4200, 965], [4760, 875], [4945, 765, 'c'], [4990, 560], [4955, 300], [4880, 200, 'c']],
    dlo: [[3390, 1095, 'c'], [2980, 1405], [1920, 1418], [1580, 1355], [1270, 1102, 'c']],
    pillars: [[2420, 1090, 2440, 1430, 70], [1760, 1100, 1830, 1440, 55]],
    para: [[4700, 835], [3000, 870], [700, 905]],
    lines: [[[3420, 1085], [3420, 380]], [[2430, 1085], [2430, 330]], [[1500, 1095], [1450, 700], [1520, 460]]],
    lamps: { type: 'single', front: [[4990, 770], [4780, 860], [4760, 800], [4975, 700]], rear: [[5, 900], [260, 930], [270, 860], [8, 820]] },
    mirror: [[3330, 1120], [3150, 1185], [3160, 1120]],
  };

  // G90 1st gen (HI / EQ900) — formal flagship, 6-light, long rear overhang
  M.g90hi = {
    L: 5205, H: 1495, xr: 1115, xf: 4275, R: 352, Ra: 398, sill: 255,
    top: [[70, 300, 'c'], [0, 540], [15, 805], [70, 955, 'c'], [700, 1015], [1160, 1045, 'c'], [1610, 1385], [1960, 1490], [2820, 1495], [3230, 1450], [3680, 1095, 'c'], [4420, 985], [4960, 905], [5160, 790, 'c'], [5205, 570], [5165, 305], [5080, 210, 'c']],
    dlo: [[3610, 1108, 'c'], [3180, 1418], [2000, 1432], [1690, 1372], [1340, 1115, 'c']],
    pillars: [[2560, 1105, 2575, 1440, 75], [1880, 1110, 1930, 1445, 60]],
    para: [[4950, 900], [3200, 925], [700, 950]],
    lines: [[[3640, 1095], [3640, 390]], [[2570, 1100], [2570, 340]], [[1590, 1105], [1560, 700], [1600, 470]]],
    lamps: { type: 'single', front: [[5205, 800], [4990, 895], [4970, 830], [5190, 730]], rear: [[5, 930], [300, 960], [310, 890], [8, 850]] },
    mirror: [[3560, 1135], [3370, 1200], [3380, 1135]],
  };

  // G70 (IK) 2017 — compact sport sedan, long hood, cabin set back, fender vent
  M.g70 = {
    L: 4685, H: 1400, xr: 1050, xf: 3885, R: 330, Ra: 372, sill: 240,
    top: [[70, 300, 'c'], [0, 520], [20, 760], [90, 900, 'c'], [460, 950], [830, 990, 'c'], [1360, 1295], [1760, 1390], [2400, 1400], [2760, 1360], [3210, 1060, 'c'], [3900, 935], [4450, 845], [4640, 735, 'c'], [4685, 540], [4645, 300], [4565, 195, 'c']],
    dlo: [[3140, 1078, 'c'], [2750, 1332], [1790, 1347], [1420, 1245], [1180, 1062, 'c']],
    pillars: [[2310, 1075, 2330, 1350, 70]],
    para: [[4450, 820], [2800, 835], [600, 870]],
    lines: [[[3160, 1070], [3160, 360]], [[2320, 1072], [2320, 320]], [[1460, 1075], [1420, 650], [1480, 440]], [[3560, 820], [3470, 600]]],
    lamps: { type: 'single', front: [[4685, 745], [4480, 835], [4460, 780], [4670, 690]], rear: [[5, 860], [250, 895], [255, 830], [8, 790]] },
    mirror: [[3080, 1100], [2900, 1165], [2910, 1100]],
  };

  // GV80 (JX1) 2020 — long hood, raked tailgate, kicked-up quarter glass, parabolic line
  M.gv80 = {
    L: 4945, H: 1715, xr: 1095, xf: 4050, R: 386, Ra: 432, sill: 330,
    top: [[130, 440, 'c'], [18, 700], [30, 1020], [100, 1330], [200, 1600, 'c'], [430, 1690], [1500, 1712], [2500, 1715], [2790, 1684, 'c'], [3430, 1222, 'c'], [4150, 1138], [4760, 1086], [4918, 1010, 'c'], [4945, 780], [4925, 500], [4830, 380, 'c']],
    dlo: [[3380, 1236, 'c'], [2800, 1604], [1400, 1642], [780, 1624], [575, 1505], [650, 1318, 'c']],
    pillars: [[2240, 1245, 2255, 1650, 80], [1180, 1270, 1215, 1652, 78]],
    para: [[4760, 1040], [3700, 1000], [2300, 925], [1000, 960], [210, 1100]],
    lines: [[[3420, 1225], [3420, 470]], [[2250, 1240], [2250, 380]], [[1160, 1265], [1130, 820], [1210, 520]], [[4250, 560], [1450, 560]]],
    lamps: { type: 'two', front: [[[4932, 1030], [4735, 1052]], [[4938, 962], [4745, 982]]], side: [[[3620, 800], [3430, 806]], [[3620, 755], [3430, 761]]], rear: [[[70, 1190], [330, 1202]], [[55, 1118], [325, 1130]]] },
    mirror: [[3350, 1280], [3140, 1350], [3150, 1280]],
  };

  // GV70 (JK1) — coupe-like falling roof, pointed quarter glass, clamshell hood
  M.gv70 = {
    L: 4715, H: 1630, xr: 990, xf: 3865, R: 377, Ra: 420, sill: 320,
    top: [[120, 430, 'c'], [15, 700], [45, 1010], [160, 1300], [235, 1458, 'c'], [600, 1588], [1800, 1628], [2700, 1582, 'c'], [3330, 1168, 'c'], [4150, 1082], [4600, 1012], [4700, 930, 'c'], [4715, 700], [4690, 460], [4600, 345, 'c']],
    dlo: [[3290, 1184, 'c'], [2710, 1540], [1700, 1572], [900, 1502], [470, 1332, 'c']],
    pillars: [[2150, 1190, 2162, 1575, 78], [1150, 1230, 1190, 1530, 72]],
    para: [[4600, 950], [3000, 870], [1300, 895], [330, 1030]],
    lines: [[[4690, 985], [3330, 1150]], [[3320, 1175], [3320, 460]], [[2158, 1185], [2158, 370]], [[1130, 1225], [1100, 800], [1170, 500]]],
    lamps: { type: 'two', front: [[[4706, 958], [4520, 984]], [[4711, 892], [4530, 916]]], side: [[[3440, 760], [3260, 766]], [[3440, 716], [3260, 722]]], rear: [[[95, 1180], [340, 1190]], [[70, 1110], [336, 1120]]] },
    mirror: [[3250, 1225], [3050, 1295], [3060, 1225]],
  };

  // G80 3rd gen (RG3) — fastback-like roofline, long hood, quarter glass (also Electrified G80)
  M.g80 = {
    L: 4995, H: 1465, xr: 1090, xf: 4100, R: 353, Ra: 396, sill: 250,
    top: [[70, 300, 'c'], [0, 540], [20, 800], [95, 965, 'c'], [470, 1012], [860, 1048, 'c'], [1400, 1300], [1900, 1440], [2350, 1465], [2860, 1420, 'c'], [3380, 1072, 'c'], [4200, 962], [4760, 872], [4950, 762, 'c'], [4995, 560], [4952, 300], [4870, 205, 'c']],
    dlo: [[3310, 1090, 'c'], [2850, 1402], [1950, 1428], [1450, 1292], [1060, 1072, 'c']],
    pillars: [[2380, 1088, 2392, 1436, 72], [1620, 1100, 1690, 1390, 55]],
    para: [[4720, 845], [3000, 790], [1200, 840], [360, 945]],
    lines: [[[3340, 1082], [3340, 380]], [[2388, 1082], [2388, 330]], [[1480, 1090], [1440, 700], [1500, 460]]],
    lamps: { type: 'two', front: [[[4948, 800], [4760, 830]], [[4955, 740], [4772, 770]]], side: [[[3560, 710], [3380, 714]], [[3560, 672], [3380, 676]]], rear: [[[12, 890], [340, 912]], [[16, 828], [340, 850]]] },
    mirror: [[3250, 1115], [3060, 1180], [3070, 1115]],
  };

  // G90 2nd gen (RS4) — long and low, ultra-slim full-width two-line lamps
  M.g90 = {
    L: 5275, H: 1490, xr: 1150, xf: 4330, R: 360, Ra: 404, sill: 255,
    top: [[70, 310, 'c'], [0, 560], [20, 820], [100, 972, 'c'], [800, 1030], [1250, 1060, 'c'], [1760, 1392], [2160, 1482], [2900, 1490], [3300, 1446], [3760, 1090, 'c'], [4500, 982], [5050, 892], [5230, 782, 'c'], [5275, 560], [5232, 300], [5150, 208, 'c']],
    dlo: [[3690, 1102, 'c'], [3260, 1420], [2160, 1442], [1790, 1362], [1410, 1112, 'c']],
    pillars: [[2600, 1100, 2610, 1450, 72], [1960, 1110, 2010, 1440, 58]],
    para: [[5000, 872], [2600, 830], [300, 905]],
    lines: [[[3720, 1095], [3720, 380]], [[2605, 1095], [2605, 330]], [[1600, 1105], [1560, 700], [1620, 460]]],
    lamps: { type: 'two', front: [[[5272, 808], [4880, 852]], [[5273, 780], [4890, 824]]], rear: [[[6, 905], [520, 930]], [[6, 877], [520, 902]]] },
    mirror: [[3620, 1130], [3430, 1195], [3440, 1130]],
  };

  // GV60 (JW) — rounded crossover coupe, clamshell hood, window line sweeping up at the rear
  M.gv60 = {
    L: 4515, H: 1580, xr: 770, xf: 3670, R: 360, Ra: 405, sill: 300,
    top: [[95, 400, 'c'], [10, 640], [30, 900], [120, 1160], [235, 1332, 'c'], [430, 1432], [1100, 1554], [1800, 1580], [2500, 1522], [2900, 1352], [3330, 1112, 'c'], [3900, 1032], [4300, 935], [4480, 800], [4515, 600], [4480, 420], [4390, 300, 'c']],
    dlo: [[3280, 1128, 'c'], [2860, 1362], [2400, 1478], [1600, 1500], [900, 1442], [560, 1320, 'c'], [1000, 1252]],
    pillars: [[2080, 1175, 2092, 1490, 72]],
    para: [[4380, 820], [2900, 760], [1200, 790], [300, 900]],
    lines: [[[4470, 900], [3360, 1100]], [[3300, 1120], [3300, 450]], [[2086, 1170], [2086, 360]], [[1000, 1245], [980, 800], [1040, 480]]],
    lamps: { type: 'two', front: [[[4490, 880], [4370, 900]], [[4500, 820], [4380, 840]]], rear: [[[110, 1150], [330, 1162]], [[80, 1085], [328, 1097]]] },
    mirror: [[3200, 1170], [3010, 1235], [3020, 1170]],
  };

  // GV60 Magma — lower, flared arches, bigger wheels, larger spoiler, side skirt
  M.gv60m = Object.assign({}, M.gv60, {
    R: 372, Ra: 420, sill: 285,
    top: M.gv60.top.map((p, i) => {
      const q = [p[0], p[1] > 900 ? p[1] - 20 : p[1] - 10, p[2]];
      if (i === 4) q[1] = 1352; // taller spoiler lip
      return q;
    }),
    dlo: M.gv60.dlo.map((p) => [p[0], p[1] - 20, p[2]]),
    pillars: [[2080, 1155, 2092, 1470, 72]],
    flares: true,
    lines: M.gv60.lines.concat([[[3250, 330], [1180, 330]]]),
  });

  // GV90 (JG1) 2026 — boxy full-size BEV SUV, coach doors (no visible B-pillar)
  M.gv90 = {
    L: 5285, H: 1815, xr: 1080, xf: 4325, R: 410, Ra: 458, sill: 380,
    top: [[112, 450, 'c'], [15, 660], [0, 980], [25, 1300], [80, 1690, 'c'], [260, 1795], [1500, 1815], [2900, 1812], [3120, 1790, 'c'], [3760, 1320, 'c'], [4450, 1240], [5020, 1170], [5250, 1070, 'c'], [5285, 800], [5262, 500], [5160, 380, 'c']],
    dlo: [[3700, 1336, 'c'], [3130, 1740], [1500, 1760], [700, 1750], [520, 1600], [620, 1402, 'c']],
    pillars: [[1280, 1372, 1300, 1762, 95]],
    para: [[5020, 1180], [2600, 1190], [420, 1210]],
    lines: [[[3730, 1325], [3730, 520]], [[2600, 1350], [2600, 440]], [[1270, 1370], [1250, 940], [1310, 580]], [[4150, 580], [1300, 580]]],
    lamps: { type: 'two', front: [[[5282, 1110], [5000, 1136]], [[5285, 1048], [5010, 1074]]], rear: [[[26, 1300], [300, 1310]], [[18, 1230], [298, 1240]]] },
    mirror: [[3620, 1385], [3400, 1460], [3410, 1385]],
  };

  // GMR-001 — LMDh hypercar: high front fenders, bubble cockpit, shark fin into the rear wing
  M.gmr = {
    L: 5100, H: 1060, xr: 950, xf: 4100, R: 356, Ra: 392, sill: 150,
    top: [[40, 260, 'c'], [0, 420], [20, 640, 'c'], [560, 700], [1300, 790], [1950, 900], [2450, 1040], [2800, 1060], [3080, 1020], [3380, 900, 'c'], [3760, 830], [4100, 830], [4420, 760], [4800, 560], [5080, 330, 'c'], [5030, 220], [4760, 170, 'c']],
    dlo: [[3360, 905, 'c'], [3060, 1010], [2620, 1030], [2360, 960, 'c']],
    pillars: [],
    para: [[4700, 600], [3900, 520], [3000, 470], [1600, 440], [500, 430]],
    lines: [[[3700, 840], [3500, 520]], [[2000, 890], [1500, 520]]],
    fin: [[2500, 1045], [560, 1080], [420, 980], [700, 760, 'c'], [1500, 800]],
    wing: { plate: [[-40, 620], [330, 620], [560, 1140], [-40, 1140]], blade: [[-40, 1050], [560, 1072], [560, 1140], [-40, 1118]] },
    lamps: { type: 'two', front: [[[5050, 380], [4880, 470]], [[5010, 330], [4840, 420]]], rear: [[[4, 520], [140, 524]], [[4, 470], [140, 474]]] },
  };

  // ---------- rendering ----------

  const toPath = (pts, closed = true) => U.pathD(pts) + (closed ? 'Z' : '');

  function wheel(parent, cx, cy, R, col) {
    const g = U.s('g');
    g.append(
      U.s('circle', { cx, cy, r: R, fill: col.tire }),
      U.s('circle', { cx, cy, r: R * 0.7, fill: col.rim })
    );
    const spokes = U.s('g');
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + (i % 2 ? 0.1 : 0);
      spokes.appendChild(U.s('line', {
        x1: cx + R * 0.2 * Math.cos(a), y1: cy + R * 0.2 * Math.sin(a),
        x2: cx + R * 0.66 * Math.cos(a), y2: cy + R * 0.66 * Math.sin(a),
        stroke: col.tire, 'stroke-width': R * 0.06,
      }));
    }
    spokes.appendChild(U.s('circle', { cx, cy, r: R * 0.18, fill: col.tire }));
    g.appendChild(spokes);
    parent.appendChild(g);
    return { g, spokes, cx, cy };
  }

  const DEFAULTS = {
    body: '#ECE7DF',
    window: '#121316',
    detail: '#121316',
    chrome: null, // DLO surround line color (null = none)
    para: null, // character-line color (null = detail)
    tire: '#121316',
    rim: '#6B6863',
    lamp: '#ECE7DF',
    detailWidth: 1.6,
    detailOpacity: 0.55,
  };

  function detailLines(m, c) {
    const g = U.s('g', { fill: 'none' });
    const lines = U.s('g', { stroke: c.detail, opacity: c.detailOpacity });
    m.lines.forEach((ln) => lines.appendChild(U.s('path', {
      d: U.pathD(ln.length > 2 ? spline(ln, false, 8) : ln), 'stroke-width': c.detailWidth, 'vector-effect': 'non-scaling-stroke',
    })));
    g.appendChild(lines);
    if (m.para) {
      g.appendChild(U.s('path', {
        d: U.pathD(spline(m.para, false, 10)), stroke: c.para || c.detail, 'stroke-width': c.detailWidth * 1.5,
        'vector-effect': 'non-scaling-stroke', opacity: c.para ? 0.85 : c.detailOpacity,
      }));
    }
    if (c.chrome) {
      g.appendChild(U.s('path', { d: toPath(spline(m.dlo, true, 10)), stroke: c.chrome, 'stroke-width': c.detailWidth * 1.2, 'vector-effect': 'non-scaling-stroke', opacity: 0.9 }));
    }
    return g;
  }

  function lampElements(m, parent, color, initialOpacity = 1) {
    const els = [];
    const L = m.lamps;
    if (L.type === 'single') {
      [L.front, L.rear].forEach((poly) => {
        const el = U.s('path', { d: toPath(poly), fill: color, opacity: initialOpacity });
        parent.appendChild(el);
        els.push(el);
      });
    } else {
      ['front', 'side', 'rear'].forEach((k) => (L[k] || []).forEach(([a, b]) => {
        const el = U.s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, 'stroke-width': k === 'side' ? 22 : 30, 'stroke-linecap': 'round', opacity: initialOpacity });
        parent.appendChild(el);
        els.push(el);
      }));
    }
    return els;
  }

  /**
   * Build a car. Returns { g, spec, place(x0, ground, s), setLamps(p), setWheels(angle), setBody(color) }.
   * place() maps mm → stage px with the rear bumper at x0 and the ground line at `ground`.
   */
  function build(parent, key, opts = {}) {
    const m = M[key];
    const c = Object.assign({}, DEFAULTS, opts);
    const g = U.s('g');
    const bodyEls = [];
    const addBody = (el) => {
      bodyEls.push(el);
      g.appendChild(el);
      return el;
    };

    addBody(U.s('path', { d: toPath(bodyOutline(m)), fill: c.body }));
    if (m.flares) {
      [m.xr, m.xf].forEach((xc) => addBody(U.s('path', {
        d: toPath(arc(xc, m.R, m.Ra + 70, 0.15, Math.PI - 0.15, 20).concat(arc(xc, m.R, m.Ra, Math.PI - 0.2, 0.2, 20))), fill: c.body,
      })));
    }
    if (m.fin) addBody(U.s('path', { d: toPath(spline(m.fin, true, 6)), fill: c.body }));
    if (m.wing) {
      addBody(U.s('path', { d: toPath(m.wing.plate), fill: c.body }));
      g.appendChild(U.s('path', { d: toPath(m.wing.blade), fill: c.window, opacity: 0.35 }));
    }

    const dlo = U.s('path', { d: toPath(spline(m.dlo, true, 10)), fill: c.window, opacity: c.windowOpacity ?? 1 });
    g.appendChild(dlo);
    m.pillars.forEach(([x1, y1, x2, y2, w]) => {
      const p = U.s('line', { x1, y1, x2, y2, stroke: c.body, 'stroke-width': w });
      g.appendChild(p);
      bodyEls.push(p);
    });
    g.appendChild(detailLines(m, c));
    if (m.mirror) addBody(U.s('path', { d: toPath(m.mirror), fill: c.body }));

    const lamps = lampElements(m, g, c.lamp, c.lampOn ?? 1);
    const wheels = [m.xr, m.xf].map((xc) => wheel(g, xc, m.R, m.R, c));
    parent.appendChild(g);

    let last = null;
    return {
      g,
      spec: m,
      lamps,
      place(x0, ground, s) {
        const t = `translate(${x0.toFixed(2)} ${ground.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})`;
        if (t !== last) {
          g.setAttribute('transform', t);
          last = t;
        }
      },
      setLamps(p) {
        lamps.forEach((el) => el.setAttribute('opacity', U.clamp(p).toFixed(3)));
      },
      setWheels(a) {
        wheels.forEach((w) => w.spokes.setAttribute('transform', `rotate(${(-U.deg(a)).toFixed(2)} ${w.cx} ${w.cy})`));
      },
      setBody(col) {
        bodyEls.forEach((el) => el.setAttribute(el.tagName === 'line' ? 'stroke' : 'fill', col));
      },
      setWindow(col) {
        dlo.setAttribute('fill', col);
      },
    };
  }

  /**
   * Morph between two models: body and windows are resampled to equal point counts and interpolated.
   * A's details fade out, B's fade in; B's lamps are controlled separately with setLamps().
   */
  function morph(parent, keyA, keyB, opts = {}) {
    const c = Object.assign({}, DEFAULTS, opts);
    const A = M[keyA];
    const B = M[keyB];
    const bodyA = resample(bodyOutline(A), 420);
    const bodyB = resample(bodyOutline(B), 420);
    const dloA = resample(spline(A.dlo, true, 10), 160);
    const dloB = resample(spline(B.dlo, true, 10), 160);
    const g = U.s('g');
    const body = U.s('path', { fill: c.body });
    const dlo = U.s('path', { fill: c.window });
    g.append(body, dlo);
    const layer = (m) => {
      const l = U.s('g');
      m.pillars.forEach(([x1, y1, x2, y2, w]) => l.appendChild(U.s('line', { x1, y1, x2, y2, stroke: c.body, 'stroke-width': w })));
      l.appendChild(detailLines(m, c));
      if (m.mirror) l.appendChild(U.s('path', { d: toPath(m.mirror), fill: c.body }));
      g.appendChild(l);
      return l;
    };
    const layerA = layer(A);
    const layerB = layer(B);
    const lampsA = U.s('g');
    g.appendChild(lampsA);
    lampElements(A, lampsA, c.lampA || c.lamp);
    const lampsB = lampElements(B, g, c.lamp, 0);

    const wheels = [0, 1].map(() => {
      const parts = [U.s('circle', { fill: c.tire }), U.s('circle', { fill: c.rim }), U.s('circle', { fill: c.tire })];
      g.append(...parts);
      return parts;
    });
    parent.appendChild(g);

    return {
      g,
      A,
      B,
      lampsB,
      place(x0, ground, s) {
        g.setAttribute('transform', `translate(${x0.toFixed(2)} ${ground.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})`);
      },
      set(p) {
        const mix = (a, b) => a.map((q, i) => [U.lerp(q[0], b[i][0], p), U.lerp(q[1], b[i][1], p)]);
        body.setAttribute('d', toPath(mix(bodyA, bodyB)));
        dlo.setAttribute('d', toPath(mix(dloA, dloB)));
        layerA.setAttribute('opacity', (1 - U.clamp(p * 1.6)).toFixed(3));
        layerB.setAttribute('opacity', U.clamp((p - 0.45) * 1.8).toFixed(3));
        lampsA.setAttribute('opacity', (1 - U.clamp(p * 2)).toFixed(3));
        const R = U.lerp(A.R, B.R, p);
        const xs = [U.lerp(A.xr, B.xr, p), U.lerp(A.xf, B.xf, p)];
        wheels.forEach((parts, i) => {
          [R, R * 0.7, R * 0.18].forEach((r, k) => {
            parts[k].setAttribute('cx', xs[i].toFixed(1));
            parts[k].setAttribute('cy', R.toFixed(1));
            parts[k].setAttribute('r', r.toFixed(1));
          });
        });
      },
      setLamps(p) {
        lampsB.forEach((el) => el.setAttribute('opacity', U.clamp(p).toFixed(3)));
      },
    };
  }

  SX.cars = { M, build, morph, spline, bodyOutline };
})((window.SX = window.SX || {}));
