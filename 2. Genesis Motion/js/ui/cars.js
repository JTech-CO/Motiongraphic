/* Model side profiles for the Genesis line-up: flat vector with light shading.
   Geometry is in millimetres: x from the rear bumper (0) to the front bumper (L), y up from the ground. Cars face right.
   Body outlines, glass lines, door cuts, fender garnish and the placement of the two-line lamps were measured from
   studio side profiles of each model (scaled by wheelbase, ends corrected for perspective) and redrawn as simplified
   splines. No emblems, wordmarks or logos are drawn. place() maps mm → stage px (ground line at `ground`, `s` px per mm). */
(function (SX) {
  'use strict';
  const { U } = SX;
  let uid = 0;

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

  /** Wheel-arch arc: from the front side (+x) at height yA, over the top, to the rear side at height yB */
  function archArc(cx, cy, r, yA, yB, n = 28) {
    const a0 = Math.asin(U.clamp((yA - cy) / r, -1, 1));
    const a1 = Math.PI - Math.asin(U.clamp((yB - cy) / r, -1, 1));
    return arc(cx, cy, r, a0, a1, n);
  }

  /** Body outline in segments that correspond from model to model (so two bodies can be morphed) */
  function segments(m) {
    const yF = m.lowF.length ? m.lowF[m.lowF.length - 1][1] : m.sill;
    const yR = m.lowR.length ? m.lowR[0][1] : m.sill;
    return {
      top: spline(m.top, false, 12),
      lowF: m.lowF,
      af: archArc(m.xf, m.R + (m.lift || 0), m.Ra, yF, m.sill),
      ar: archArc(m.xr, m.R + (m.liftR || 0), m.RaR || m.Ra, m.sill, yR),
      lowR: m.lowR,
    };
  }
  const joinSegs = (s) => s.top.concat(s.lowF, s.af, s.ar, s.lowR);
  const bodyOutline = (m) => joinSegs(segments(m));

  /** Resample an open polyline to n points by arc length (endpoints kept) */
  function resampleOpen(pts, n) {
    if (pts.length < 2) return Array.from({ length: n }, () => (pts[0] ? [pts[0][0], pts[0][1]] : [0, 0]));
    const acc = U.polyLengths(pts);
    const total = acc[acc.length - 1];
    const out = [];
    for (let i = 0; i < n; i++) {
      const q = U.pointAt(pts, acc, (total * i) / (n - 1));
      out.push([q.x, q.y]);
    }
    return out;
  }

  /** Resample a closed polyline to n points by arc length */
  function resampleClosed(pts, n) {
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

  /** Strip along p → q: width w at p, w * taper at q (used for lamps, garnish and pillars) */
  function strip(p, q, w, taper = 1, extend = 0) {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = [p[0] - ux * extend, p[1] - uy * extend];
    const b = [q[0] + ux * extend, q[1] + uy * extend];
    const h0 = w / 2;
    const h1 = (w * taper) / 2;
    return [[a[0] - uy * h0, a[1] + ux * h0], [b[0] - uy * h1, b[1] + ux * h1], [b[0] + uy * h1, b[1] - ux * h1], [a[0] + uy * h0, a[1] - ux * h0]];
  }

  /** Lower all points above `above` mm by dy (used to derive the lowered Magma body) */
  const lower = (pts, dy, above = 480) => pts.map((p) => {
    const q = [p[0], p[1] > above ? p[1] - dy : p[1]];
    if (p[2]) q.push(p[2]);
    return q;
  });

  // ---------- model specs (mm) ----------
  // top: rear-bottom corner → tail → roof → windshield → hood → front-bottom corner. lowF/lowR: bumper undersides to the arches.
  // dlo: side glass outline · rglass: tailgate glass seen from the side · posts: pillars that split the glass [top, bottom]
  // cuts: door shut lines · para: main character line
  // lampF/lampR: two-line lamp strips [forward end, rear end] · lampF1/lampR1: single lamp units (pre two-line generations)
  // garn: two-line fender garnish · clad: dark lower trim · lw: lamp strip widths [front, rear] · wheel: rim design
  const M = {};

  // Hyundai Genesis sedan (DH) — also the 2016 Genesis G80. 6-light glass, single headlamp units
  M.dh = {
    L: 4990, WB: 3010, xr: 1165, xf: 4175, R: 340, Ra: 385, RaR: 370, sill: 195, rim: 0.71, wheel: 'multi',
    top: [[75, 225, 'c'], [25, 345], [5, 580], [25, 700], [75, 880], [110, 1080], [125, 1115, 'c'], [330, 1135], [670, 1210], [1005, 1320], [1325, 1415], [1620, 1455], [1920, 1470], [2215, 1465], [2515, 1445], [2755, 1410], [2870, 1355], [3050, 1270], [3260, 1165], [3500, 1045, 'c'], [3705, 1030], [4005, 995], [4320, 945], [4655, 880], [4795, 835], [4900, 760], [4970, 665], [4990, 580], [4985, 425], [4980, 285, 'c']],
    lowF: [[4930, 225], [4655, 165], [4575, 165]],
    lowR: [[775, 190], [600, 195], [315, 210]],
    dlo: [[3275, 1000, 'c'], [3110, 1120], [2870, 1295], [2665, 1385], [2215, 1400], [1620, 1385], [1385, 1355], [1180, 1275], [1020, 1135, 'c'], [1465, 1035], [2515, 1030], [2990, 1020]],
    posts: [[[2270, 1400], [2285, 1030]], [[1500, 1380], [1475, 1035]]], postW: [85, 45],
    cuts: [[[3500, 970], [3525, 225]], [[2330, 1020], [2345, 195]], [[1250, 1025], [1235, 880], [1325, 700], [1440, 590]]],
    handles: [[[2650, 940], [2410, 940]], [[1560, 955], [1325, 955]]],
    para: [[4320, 865], [3230, 890], [2040, 915], [670, 945]],
    crease: [[3500, 520], [1440, 545]],
    trim: [[3645, 285], [1710, 285]],
    lampF1: [[4940, 760], [4750, 800], [4455, 810], [4590, 760], [4835, 690], [4935, 635]],
    lampR1: [[640, 960], [400, 990], [100, 1000], [90, 925], [300, 920], [520, 935]],
    mirror: [[3245, 1000], [3245, 1070], [3205, 1120], [3110, 1125], [3065, 1100], [3070, 1035], [3120, 1010], [3195, 1000]],
  };

  // G90 1st gen (HI / EQ900) — formal flagship: long deck, 6-light glass with a rounded quarter window
  M.g90hi = {
    L: 5205, WB: 3160, xr: 1225, xf: 4385, R: 350, Ra: 395, RaR: 385, sill: 255, rim: 0.69, wheel: 'multi',
    top: [[70, 325, 'c'], [10, 480], [0, 660], [15, 870], [45, 1060, 'c'], [135, 1095], [385, 1120], [635, 1165], [930, 1270], [1330, 1390], [1570, 1455], [1850, 1470], [2200, 1470], [2550, 1455], [2830, 1425], [3110, 1340], [3390, 1180], [3670, 1035, 'c'], [3850, 1025], [4125, 990], [4495, 955], [4915, 895], [5080, 840], [5170, 745], [5205, 620], [5200, 465], [5185, 340, 'c']],
    lowF: [[5120, 255], [4845, 240]],
    lowR: [[775, 260], [300, 270]],
    dlo: [[3435, 1015, 'c'], [3250, 1150], [2970, 1320], [2760, 1400], [2550, 1420], [1850, 1425], [1500, 1410], [1375, 1350], [1320, 1195], [1330, 1025, 'c'], [2160, 1020], [3000, 1015]],
    posts: [[[2495, 1420], [2520, 1015]], [[1770, 1425], [1755, 1020]]], postW: [85, 45],
    cuts: [[[3710, 1025], [3725, 270]], [[2570, 1020], [2580, 260]], [[1330, 1020], [1330, 870], [1470, 660], [1545, 545]]],
    handles: [[[2885, 860], [2620, 860]], [[1625, 875], [1360, 875]]],
    para: [[4705, 815], [3280, 845], [1880, 880], [300, 920]],
    crease: [[3725, 520], [1600, 530]],
    trim: [[3880, 290], [1750, 290]],
    lampF1: [[5140, 745], [4905, 805], [4635, 825], [4770, 760], [5005, 705], [5120, 665]],
    lampR1: [[470, 905], [270, 975], [45, 995], [40, 850], [220, 840], [400, 870]],
    mirror: [[3435, 970], [3440, 1070], [3405, 1135], [3305, 1150], [3250, 1115], [3255, 1025], [3320, 995], [3390, 975]],
  };

  // G70 (IK) 2017 — compact sport sedan: long hood, short deck, hooked quarter glass, low fender vent
  M.g70 = {
    L: 4685, WB: 2835, xr: 1050, xf: 3885, R: 331, Ra: 375, RaR: 360, sill: 225, rim: 0.73, wheel: 'five',
    top: [[45, 230, 'c'], [0, 305], [5, 445], [5, 540], [30, 600], [75, 665], [85, 730], [95, 790], [105, 835], [95, 890], [80, 945, 'c'], [190, 955], [260, 965], [440, 1000], [615, 1040], [795, 1105], [975, 1165], [1140, 1215], [1390, 1285], [1610, 1315], [1925, 1330], [2080, 1335], [2235, 1325], [2455, 1310], [2645, 1265], [2770, 1205], [2960, 1115], [3145, 1015], [3255, 945, 'c'], [3395, 930], [3650, 920], [3805, 905], [3970, 885], [4150, 855], [4330, 815], [4505, 755], [4595, 705], [4650, 665], [4670, 600], [4680, 510], [4680, 385], [4665, 290], [4695, 220, 'c']],
    lowF: [[4680, 195], [4400, 170], [4285, 165]],
    lowR: [[665, 180], [465, 195], [180, 225]],
    dlo: [[3020, 920, 'c'], [2865, 1015], [2645, 1150], [2425, 1265], [2235, 1285], [1925, 1285], [1610, 1265], [1435, 1205], [1090, 1080, 'c'], [1420, 940], [2080, 930], [2705, 920]],
    posts: [[[2065, 1285], [2135, 930]], [[1445, 1205], [1420, 940]]], postW: [80, 40],
    cuts: [[[3210, 905], [3230, 665], [3240, 230]], [[2145, 925], [2165, 225]], [[1405, 920], [1250, 695], [1345, 510], [1470, 390]]],
    handles: [[[2455, 790], [2220, 790]], [[1500, 820], [1265, 820]]],
    para: [[3680, 550], [2705, 645], [1455, 730], [440, 830]],
    crease: [[3145, 315], [1455, 315]],
    vent: [[3430, 420], [3270, 385], [3245, 315], [3405, 350]],
    lampF1: [[4655, 690], [4470, 710], [4250, 695], [4280, 645], [4505, 610], [4640, 575]],
    lampR1: [[475, 835], [260, 860], [80, 855], [80, 735], [260, 745], [405, 785]],
    mirror: [[3045, 910], [3050, 980], [3025, 1015], [2960, 1030], [2870, 1020], [2860, 965], [2895, 930], [2990, 920], [3010, 900]],
  };

  // G70 after the 2021 facelift — same body, two-line quad lamps front and rear
  M.g70fl = Object.assign({}, M.g70, {
    lampF1: null, lampR1: null, lw: [22, 24],
    lampF: [[[4540, 690], [4275, 670]], [[4615, 595], [4380, 570]]],
    lampR: [[[455, 845], [80, 830]], [[365, 745], [80, 720]]],
  });

  // GV80 (JX1) 2020 — long hood, flat roof, quarter glass that kicks up to a point, crest garnish with two lines
  M.gv80 = {
    L: 4945, WB: 2955, xr: 1110, xf: 4065, R: 385, Ra: 480, RaR: 480, sill: 270, rim: 0.725, wheel: 'twin',
    top: [[50, 340, 'c'], [10, 390], [0, 535], [15, 685], [40, 815], [60, 945], [60, 1040], [50, 1090, 'c'], [85, 1140], [155, 1205], [235, 1270], [320, 1335], [400, 1400], [435, 1445], [420, 1480], [375, 1525, 'c'], [470, 1545], [580, 1565], [760, 1590], [1090, 1640], [1450, 1670], [1775, 1680], [2100, 1685], [2360, 1675], [2490, 1665], [2590, 1645], [2685, 1605], [2785, 1575], [2880, 1540], [3075, 1440], [3205, 1365], [3335, 1285], [3465, 1205], [3500, 1185, 'c'], [3660, 1165], [3855, 1150], [4050, 1135], [4230, 1115], [4415, 1085], [4595, 1065], [4745, 1025], [4845, 985], [4895, 945], [4925, 880], [4940, 780], [4945, 650], [4940, 520], [4925, 360, 'c']],
    lowF: [[4815, 295], [4650, 260], [4570, 230]],
    lowR: [[580, 280], [320, 305]],
    dlo: [[3075, 1195, 'c'], [2945, 1325], [2815, 1465], [2685, 1570], [2555, 1595], [2165, 1600], [1775, 1590], [1415, 1560], [1125, 1510], [695, 1425, 'c'], [815, 1390], [1190, 1230, 'c'], [1775, 1205], [2425, 1195]],
    rglass: [[425, 1520], [375, 1520], [250, 1360], [140, 1235], [60, 1105], [100, 1100], [210, 1240], [375, 1410], [500, 1490]],
    posts: [[[2185, 1595], [2270, 1200]], [[1395, 1550], [1205, 1235]]], postW: [75, 55],
    cuts: [[[3350, 1155], [3375, 880], [3385, 390], [3375, 275]], [[2275, 1195], [2300, 270]], [[1185, 1205], [1135, 1040], [1140, 935], [1240, 815], [1415, 715], [1530, 585]]],
    handles: [[[2590, 965], [2410, 965]], [[1500, 980], [1320, 980]]],
    para: [[4395, 1000], [3400, 970], [2425, 935], [1610, 920], [945, 960], [470, 1010]],
    crease: [[3595, 435], [1515, 435]],
    clad: [[3595, 425], [1515, 425], [1500, 270], [3610, 270]],
    lw: [26, 26],
    lampF: [[[4835, 935], [4395, 915]], [[4870, 795], [4560, 780]]],
    lampR: [[[470, 1010], [60, 995]], [[360, 895], [60, 875]]],
    lensR: [[425, 990], [60, 980], [60, 895], [340, 905]],
    garn: [[[3840, 950], [3415, 935]], [[3725, 855], [3435, 840]]], gw: 22,
    mirror: [[3165, 1110], [3155, 1205], [3110, 1285], [2995, 1305], [2915, 1275], [2895, 1205], [2945, 1165], [3045, 1145], [3075, 1105]],
  };

  // GV70 (JK1) — compact, sloping roof, long blade-shaped quarter glass, clamshell hood line
  M.gv70 = {
    L: 4715, WB: 2875, xr: 1000, xf: 3875, R: 370, Ra: 450, RaR: 480, sill: 215, rim: 0.72, wheel: 'five',
    top: [[85, 310, 'c'], [25, 350], [5, 445], [15, 540], [25, 665], [50, 760], [65, 885], [75, 975], [115, 1045], [185, 1110], [230, 1170], [375, 1235], [480, 1300], [550, 1345, 'c'], [520, 1385], [485, 1425, 'c'], [610, 1455], [790, 1485], [965, 1515], [1155, 1550], [1440, 1575], [1760, 1590], [2075, 1590], [2235, 1580], [2390, 1560], [2520, 1520], [2645, 1480], [2770, 1420], [2900, 1355], [3025, 1280], [3150, 1200], [3280, 1120], [3325, 1100, 'c'], [3500, 1085], [3660, 1075], [3985, 1045], [4165, 1020], [4340, 980], [4515, 930], [4600, 895], [4660, 840], [4690, 760], [4700, 665], [4710, 540], [4700, 410], [4715, 310, 'c']],
    lowF: [[4670, 255], [4485, 220], [4350, 195]],
    lowR: [[475, 245], [230, 285]],
    dlo: [[3025, 1075, 'c'], [2900, 1170], [2710, 1315], [2520, 1450], [2390, 1495], [2075, 1505], [1760, 1505], [1345, 1465], [965, 1345], [420, 1155, 'c'], [790, 1145], [1315, 1125], [2075, 1100], [2710, 1085]],
    rglass: [[605, 1515], [455, 1400], [325, 1280], [225, 1165], [265, 1160], [365, 1260], [500, 1385], [630, 1480]],
    posts: [[[2055, 1505], [2120, 1085]], [[1370, 1465], [1330, 1125]]], postW: [75, 40],
    cuts: [[[3200, 1060], [3240, 790], [3265, 350], [3255, 220]], [[2125, 1085], [2145, 215]], [[1310, 1115], [1080, 950], [1125, 730], [1285, 570]]],
    handles: [[[2425, 945], [2185, 945]], [[1425, 945], [1190, 945]]],
    para: [[4165, 830], [3340, 835], [2390, 815], [1440, 790], [790, 855], [435, 935]],
    hood: [[4200, 965], [3660, 1040], [3215, 1075]],
    clad: [[3435, 360], [1410, 360], [1395, 215], [3455, 215]],
    lw: [22, 22],
    lampF: [[[4640, 865], [4165, 855]], [[4640, 775], [4305, 765]]],
    lampR: [[[435, 980], [85, 975]], [[365, 900], [65, 895]]],
    mirror: [[3055, 1020], [3065, 1110], [3025, 1185], [2930, 1220], [2835, 1195], [2820, 1125], [2865, 1075], [2960, 1060], [3010, 1015]],
  };

  // G80 3rd gen (RG3) — coupe-like roof that runs into the deck, pointed quarter glass, crest garnish
  M.g80 = {
    L: 4995, WB: 3010, xr: 1160, xf: 4170, R: 352, Ra: 435, RaR: 400, sill: 265, rim: 0.72, wheel: 'five',
    top: [[60, 300, 'c'], [20, 360], [0, 490], [10, 640], [55, 700, 'c'], [100, 780], [105, 875], [75, 990, 'c'], [160, 1020], [335, 1070], [510, 1120], [685, 1185], [860, 1245], [1035, 1305], [1210, 1350], [1530, 1425], [1850, 1460], [2175, 1470], [2400, 1465], [2625, 1440], [2815, 1385], [2980, 1330], [3140, 1255], [3300, 1180], [3460, 1100], [3525, 1060, 'c'], [3655, 1045], [3785, 1025], [4105, 990], [4450, 945], [4730, 885], [4870, 825], [4935, 755], [4970, 665], [4990, 540], [4990, 375], [4985, 265, 'c']],
    lowF: [[4890, 230], [4730, 210], [4610, 200]],
    lowR: [[740, 220], [370, 255]],
    dlo: [[3125, 1020, 'c'], [3010, 1090], [2815, 1215], [2590, 1335], [2400, 1385], [2175, 1395], [1850, 1385], [1595, 1370], [1370, 1295], [1055, 1115, 'c'], [1270, 1065], [1850, 1045], [2495, 1035]],
    posts: [[[2265, 1405], [2310, 1025]], [[1570, 1375], [1530, 1040]]], postW: [75, 40],
    cuts: [[[3460, 1010], [3480, 825], [3495, 540], [3480, 270]], [[2310, 1025], [2330, 270]], [[1070, 1100], [1085, 925], [1190, 755], [1370, 680]]],
    handles: [[[2655, 850], [2465, 850]], [[1560, 840], [1400, 840]]],
    para: [[4485, 780], [3945, 840], [3140, 870], [2175, 880], [1210, 865], [440, 835]],
    crease: [[3685, 400], [1560, 410]],
    trim: [[3720, 325], [1560, 325]],
    lw: [24, 22],
    lampF: [[[4905, 725], [4505, 705]], [[4920, 635], [4645, 610]]],
    lampR: [[[440, 840], [95, 835]], [[395, 790], [95, 780]]],
    garn: [[[3945, 770], [3540, 755]], [[3845, 680], [3540, 665]]], gw: 20,
    mirror: [[3205, 1005], [3230, 1080], [3180, 1140], [3010, 1155], [2940, 1115], [2945, 1040], [3010, 1010], [3100, 995], [3120, 955], [3170, 955]],
  };

  // G90 2nd gen (RS4) — long and low, ultra-slim two-line lamps, wedge-shaped rear lamps, flush handles
  M.g90 = {
    L: 5275, WB: 3180, xr: 1270, xf: 4450, R: 356, Ra: 460, RaR: 460, lift: 25, sill: 225, rim: 0.71, wheel: 'twist',
    top: [[210, 305, 'c'], [85, 345], [40, 460], [20, 590], [35, 660], [100, 735], [130, 850], [145, 950], [145, 1015, 'c'], [360, 1050], [540, 1090], [725, 1140], [905, 1210], [1090, 1275], [1270, 1335], [1435, 1390], [1755, 1455], [2080, 1480], [2400, 1485], [2725, 1470], [2885, 1445], [3050, 1400], [3210, 1345], [3370, 1270], [3530, 1190], [3695, 1105], [3790, 1060, 'c'], [3920, 1035], [3985, 1015], [4180, 995], [4340, 980], [4505, 965], [4690, 940], [4875, 900], [5055, 865], [5165, 825], [5225, 765], [5255, 680], [5270, 565], [5265, 435], [5270, 320, 'c']],
    lowF: [[5130, 240], [4930, 210]],
    lowR: [[760, 270], [540, 275]],
    dlo: [[3305, 1025, 'c'], [3175, 1115], [2985, 1235], [2755, 1345], [2565, 1395], [2340, 1410], [2080, 1415], [1885, 1405], [1670, 1360], [1500, 1255], [1335, 1105, 'c'], [1595, 1060], [2080, 1045], [2725, 1035]],
    posts: [[[2510, 1410], [2555, 1035]], [[1860, 1400], [1835, 1050]]], postW: [75, 35],
    cuts: [[[3695, 1005], [3770, 840], [3790, 595], [3750, 235]], [[2565, 1035], [2590, 230]], [[1375, 1090], [1445, 920], [1545, 725], [1690, 535], [1755, 405]]],
    handles: [[[2925, 860], [2695, 860]], [[1855, 900], [1620, 900]]],
    para: [[4765, 780], [4245, 845], [3370, 890], [2400, 905], [1435, 940], [580, 925]],
    crease: [[3950, 365], [1755, 370]],
    trim: [[3970, 305], [1725, 305]],
    lw: [16, 18],
    lampF: [[[5220, 760], [4780, 745]], [[5220, 700], [4930, 685]]],
    lampR: [[[535, 805], [115, 875]], [[620, 775], [100, 780]]],
    garn: [[[4190, 810], [3815, 805]], [[4115, 740], [3815, 730]]], gw: 14,
    mirror: [[3540, 960], [3525, 1015], [3500, 1115], [3450, 1160], [3355, 1170], [3315, 1140], [3315, 1055], [3375, 1025], [3460, 1015], [3480, 960]],
  };

  // GV60 (JW) — crossover coupe: clamshell nose, crescent chrome over the glass, floating roof spoiler
  M.gv60 = {
    L: 4515, WB: 2900, xr: 765, xf: 3665, R: 360, Ra: 440, RaR: 440, sill: 250, rim: 0.69, wheel: 'turbine',
    top: [[35, 290, 'c'], [5, 345], [0, 455], [0, 570], [15, 700], [35, 810], [50, 875], [80, 960], [85, 1055], [70, 1090], [50, 1130, 'c'], [185, 1140], [320, 1175], [525, 1245], [725, 1320], [905, 1395], [1080, 1435], [1365, 1465], [1655, 1480], [1940, 1480], [2225, 1465], [2400, 1435], [2570, 1380], [2800, 1250], [3030, 1105], [3245, 980, 'c'], [3375, 950], [3660, 910], [4000, 875], [4305, 820], [4405, 760], [4475, 680], [4500, 585], [4510, 455], [4515, 345], [4510, 245, 'c']],
    lowF: [[4340, 220], [4175, 240]],
    lowR: [[250, 275], [135, 275]],
    dlo: [[2915, 990, 'c'], [2745, 1135], [2540, 1305], [2415, 1380], [2225, 1395], [1655, 1400], [1220, 1385], [1080, 1365], [1005, 1275], [975, 1130], [980, 1050, 'c'], [1575, 1025], [2320, 1010], [2695, 1005]],
    crescent: [[2540, 1320], [2415, 1395], [2225, 1410], [1655, 1415], [1220, 1405], [1070, 1380], [990, 1290], [960, 1130], [965, 1035]],
    rglass: [[920, 1365], [620, 1275], [290, 1180], [105, 1135], [195, 1115], [330, 1140], [730, 1245], [900, 1305]],
    roofBand: [120, 2420, 45],
    posts: [[[2005, 1395], [2010, 1010]], [[1210, 1385], [1195, 1030]]], postW: [70, 40],
    cuts: [[[3090, 975], [3110, 250]], [[2000, 1005], [2005, 250]], [[950, 990], [935, 730], [1005, 605], [1085, 570]]],
    handles: [[[2270, 855], [2055, 855]], [[1330, 890], [1110, 890]]],
    para: [[3260, 805], [2510, 825], [1760, 835], [935, 850], [510, 905], [180, 950]],
    clad: [[3255, 370], [1105, 370], [1105, 250], [3255, 250]],
    lw: [20, 26],
    lampF: [[[4405, 755], [4195, 775]], [[4435, 715], [4260, 725]]],
    lampR: [[[420, 970], [65, 960]], [[320, 880], [45, 865]]],
    lensR: [[400, 955], [65, 950], [50, 880], [310, 890]],
    mirror: [[2935, 995], [2945, 1055], [2920, 1120], [2855, 1140], [2770, 1130], [2760, 1070], [2790, 1035], [2855, 1020], [2880, 990]],
  };

  // GV60 Magma — 20 mm lower, 21-inch wheels, flared arches, deeper skirts, extended spoiler, orange calipers
  M.gv60m = Object.assign({}, M.gv60, {
    R: 363, sill: 215, rim: 0.74, flares: 55, caliper: '#FF5F1F',
    top: lower(M.gv60.top, 20).map((p, i) => (i === 10 ? [5, 1135, 'c'] : p)),
    dlo: lower(M.gv60.dlo, 20),
    crescent: lower(M.gv60.crescent, 20),
    rglass: lower(M.gv60.rglass, 20),
    roofBand: [60, 2420, 45],
    posts: M.gv60.posts.map((l) => lower(l, 20)),
    cuts: M.gv60.cuts.map((l) => lower(l, 20)),
    handles: M.gv60.handles.map((l) => lower(l, 20)),
    para: lower(M.gv60.para, 20),
    clad: [[3265, 390], [1095, 390], [1095, 205], [3265, 205]],
    lampF: M.gv60.lampF.map((l) => lower(l, 20)),
    lampR: M.gv60.lampR.map((l) => lower(l, 20)),
    lensR: lower(M.gv60.lensR, 20),
    mirror: lower(M.gv60.mirror, 20),
  });

  // GV90 (JG1) 2026 — full-size BEV SUV: high flat hood, long flat roof, upright tail, lamp lines running along the fender
  M.gv90 = {
    L: 5285, WB: 3245, xr: 1145, xf: 4390, R: 405, Ra: 520, RaR: 520, sill: 230, rim: 0.75, wheel: 'twist',
    top: [[65, 355, 'c'], [25, 430], [12, 520], [15, 620], [12, 760], [8, 895], [15, 1025], [30, 1115], [50, 1205], [90, 1250], [145, 1295], [200, 1380], [275, 1470], [365, 1560], [455, 1640], [555, 1680], [655, 1715], [1145, 1745], [1720, 1765], [2295, 1765], [2695, 1750], [2915, 1720], [3050, 1680], [3180, 1625], [3360, 1525], [3580, 1375], [3755, 1255], [3790, 1225, 'c'], [4025, 1220], [4475, 1215], [4720, 1195], [4965, 1165], [5115, 1100], [5205, 1025], [5240, 940], [5255, 820], [5265, 700], [5270, 585], [5272, 450], [5265, 320, 'c']],
    lowF: [[5195, 275], [5010, 230], [4925, 185]],
    lowR: [[620, 185], [425, 275], [215, 320]],
    dlo: [[3580, 1215, 'c'], [3360, 1405], [3140, 1560], [2870, 1680], [2695, 1700], [2250, 1700], [1365, 1690], [605, 1670], [480, 1480], [465, 1255, 'c'], [1810, 1240], [2695, 1225]],
    posts: [[[2495, 1695], [2510, 1230]], [[1475, 1690], [1455, 1245]]], postW: [60, 60],
    cuts: [[[3720, 1205], [3755, 430]], [[2595, 1225], [2595, 240]], [[1345, 1240], [1320, 940], [1455, 725], [1535, 700]]],
    handles: [[[2940, 1035], [2650, 1035]], [[1765, 1060], [1475, 1060]]],
    para: [[4570, 885], [3580, 860], [2250, 840], [1145, 885], [360, 940]],
    trim: [[3910, 415], [1630, 415]],
    clad: [[3910, 400], [1630, 400], [1630, 230], [3910, 230]],
    lw: [18, 16],
    lampF: [[[5210, 1010], [4595, 1025]], [[5185, 940], [4620, 950]]],
    lampR: [[[360, 1060], [15, 1060]], [[350, 990], [15, 990]]],
    garn: [[[4200, 1025], [3755, 1015]], [[4135, 950], [3755, 940]]], gw: 16,
    mirror: [[3545, 1205], [3560, 1315], [3515, 1380], [3405, 1400], [3335, 1360], [3335, 1255], [3405, 1225], [3490, 1215]],
  };

  // GMR-001 — LMDh hypercar: long low nose, high front fenders, bubble canopy, shark fin into the rear wing
  M.gmr = {
    L: 5100, WB: 3150, xr: 950, xf: 4100, R: 360, Ra: 400, sill: 140, rim: 0.64, wheel: 'race',
    top: [[40, 300, 'c'], [0, 450], [30, 660, 'c'], [600, 720], [1300, 800], [1900, 880], [2350, 1000], [2650, 1060], [2950, 1062], [3200, 1010], [3420, 905, 'c'], [3700, 880], [3950, 900], [4180, 905], [4450, 840], [4750, 700], [5000, 500], [5100, 330, 'c'], [5070, 230], [4850, 170, 'c']],
    lowF: [[4700, 160], [4520, 160]],
    lowR: [[560, 160], [150, 190]],
    dlo: [[3380, 915, 'c'], [3180, 1000], [2900, 1035], [2600, 1025], [2420, 975, 'c'], [2900, 955]],
    posts: [],
    cuts: [[[3700, 850], [3480, 520]], [[2050, 900], [1600, 520]]],
    para: [[4800, 560], [4000, 520], [3000, 480], [1600, 450], [500, 440]],
    clad: [[4480, 300], [1400, 300], [1400, 140], [4480, 140]],
    fin: [[2600, 1050], [600, 1090], [450, 1000], [720, 780, 'c'], [1500, 820]],
    wing: { plate: [[-40, 640], [330, 640], [560, 1150], [-40, 1150]], blade: [[-40, 1060], [560, 1080], [560, 1150], [-40, 1128]] },
    lw: [30, 30],
    lampF: [[[5040, 420], [4830, 520]], [[5000, 360], [4800, 450]]],
    lampR: [[[140, 560], [4, 555]], [[140, 500], [4, 495]]],
  };

  // ---------- rendering ----------

  const toPath = (pts, closed = true) => U.pathD(pts) + (closed ? 'Z' : '');

  const DEFAULTS = {
    body: '#ECE7DF',
    window: '#121316',
    detail: '#121316',
    chrome: null, // glass surround, trim and garnish colour (null = detail)
    para: null, // character-line colour (null = detail)
    tire: '#121316',
    rim: '#6B6863',
    lamp: '#ECE7DF',
    well: null, // wheel-well colour (null = tire)
    trim: null, // lower cladding colour (null = tire)
    caliper: null,
    detailWidth: 1.4,
    detailOpacity: 0.5,
    shade: '#000',
    shadeOpacity: 0.16,
    hi: '#fff',
    hiOpacity: 0.08,
  };

  // Rim designs, drawn around (0, 0) with rim radius r
  function radial(n, r, w0, w1, off = 0) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const P = (rad, w) => [[rad * ca - w * sa, rad * sa + w * ca], [rad * ca + w * sa, rad * sa - w * ca]];
      const [h1, h2] = P(r * 0.2, (w0 * r) / 2);
      const [o1, o2] = P(r * 0.97, (w1 * r) / 2);
      out.push([h1, o1, o2, h2]);
    }
    return out;
  }
  function curved(n, r, w, twist, off = 0) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const base = off + (i / n) * Math.PI * 2;
      const L = [];
      const R = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const rad = r * U.lerp(0.2, 0.97, t);
        const a = base + twist * t * t;
        const hw = (w * r * U.lerp(1, 0.55, t)) / 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        L.push([rad * ca - hw * sa, rad * sa + hw * ca]);
        R.push([rad * ca + hw * sa, rad * sa - hw * ca]);
      }
      out.push(L.concat(R.reverse()));
    }
    return out;
  }
  const SPOKES = {
    five: (r) => radial(5, r, 0.2, 0.26),
    twin: (r) => radial(5, r, 0.08, 0.1, -0.12).concat(radial(5, r, 0.08, 0.1, 0.12)),
    multi: (r) => radial(15, r, 0.06, 0.08),
    twist: (r) => curved(12, r, 0.08, 0.3),
    turbine: (r) => curved(6, r, 0.26, 0.65),
    race: (r) => radial(6, r, 0.13, 0.15),
  };

  /** Wheel drawn around (0, 0): tyre, sidewall, dark barrel, optional caliper, rotating spokes, rim lip */
  function wheel(parent, m, c) {
    const R = m.R;
    const r = R * (m.rim || 0.72);
    const g = U.s('g');
    g.append(
      U.s('circle', { r: R, fill: c.tire }),
      U.s('circle', { r: R * 0.9, fill: 'none', stroke: c.rim, 'stroke-width': R * 0.05, opacity: 0.18 }),
      U.s('circle', { r, fill: c.tire })
    );
    const cal = c.caliper || m.caliper;
    if (cal) g.appendChild(U.s('path', { d: toPath(arc(0, 0, r * 0.78, 0.35, 1.25, 10).concat(arc(0, 0, r * 0.5, 1.25, 0.35, 10))), fill: cal }));
    const spokes = U.s('g');
    SPOKES[m.wheel || 'five'](r).forEach((p) => spokes.appendChild(U.s('path', { d: toPath(p), fill: c.rim })));
    spokes.append(U.s('circle', { r: r * 0.22, fill: c.rim }), U.s('circle', { r: r * 0.08, fill: c.tire }));
    g.append(spokes, U.s('circle', { r: r * 0.975, fill: 'none', stroke: c.rim, 'stroke-width': r * 0.05 }));
    parent.appendChild(g);
    return { g, spokes };
  }

  /** Shading and lower trim, clipped to the body */
  function under(m, c, clip) {
    const g = U.s('g', { 'clip-path': `url(#${clip})` });
    if (m.para) {
      const p = spline(m.para, false, 10);
      if (c.shadeOpacity > 0) {
        const lo = [[m.L + 400, p[0][1]]].concat(p, [[-400, p[p.length - 1][1]], [-400, -60], [m.L + 400, -60]]);
        g.appendChild(U.s('path', { d: toPath(lo), fill: c.shade, opacity: c.shadeOpacity }));
        g.appendChild(U.s('rect', { x: -400, y: -60, width: m.L + 800, height: m.sill + 170, fill: c.shade, opacity: c.shadeOpacity }));
      }
      if (c.hiOpacity > 0) {
        const band = p.map(([x, y]) => [x, y + 25]).concat(p.slice().reverse().map(([x, y]) => [x, y + 170]));
        g.appendChild(U.s('path', { d: toPath(band), fill: c.hi, opacity: c.hiOpacity }));
      }
    }
    if (m.clad) g.appendChild(U.s('path', { d: toPath(m.clad), fill: c.trim || c.tire, opacity: 0.85 }));
    if (m.vent) g.appendChild(U.s('path', { d: toPath(m.vent), fill: c.tire }));
    return g;
  }

  /** Pillars, glass surround, door cuts, character lines, handles, garnish and mirror */
  function over(m, c, clip) {
    const g = U.s('g');
    const bodyEls = [];
    const glassEls = [];
    const dark = U.s('g', { 'clip-path': `url(#${clip})`, opacity: c.windowOpacity ?? 1 });
    if (m.roofBand) {
      // Gloss-black roof: a band under the roofline between x0 and x1
      const [x0, x1, t] = m.roofBand;
      const top = spline(m.top, false, 12).filter((p) => p[0] >= x0 && p[0] <= x1);
      const band = top.map(([x, y]) => [x, y + 20]).concat(top.slice().reverse().map(([x, y]) => [x, y - t]));
      glassEls.push(dark.appendChild(U.s('path', { d: toPath(band), fill: c.window })));
    }
    if (m.rglass) glassEls.push(dark.appendChild(U.s('path', { d: toPath(spline(m.rglass, true, 6)), fill: c.window })));
    g.appendChild(dark);
    (m.posts || []).forEach(([t, b], i) => {
      const w = (m.postW || [70, 40])[i] || 40;
      const el = U.s('path', { d: toPath(strip(t, b, w, 1, 40)), fill: c.body });
      g.appendChild(el);
      bodyEls.push(el);
    });
    const chromeCol = c.chrome || c.detail;
    if (c.chrome) {
      g.appendChild(U.s('path', { d: toPath(spline(m.dlo, true, 10)), fill: 'none', stroke: c.chrome, 'stroke-width': c.detailWidth * 1.3, 'vector-effect': 'non-scaling-stroke', opacity: 0.9 }));
    }
    if (m.crescent && c.detailOpacity > 0) {
      g.appendChild(U.s('path', { d: U.pathD(spline(m.crescent, false, 8)), fill: 'none', stroke: chromeCol, 'stroke-width': 26, 'stroke-linecap': 'round', opacity: 0.9 }));
    }
    const d = U.s('g', { 'clip-path': `url(#${clip})`, fill: 'none', 'stroke-linecap': 'round' });
    const line = (pts, col, w, op) => d.appendChild(U.s('path', {
      d: U.pathD(pts.length > 2 ? spline(pts, false, 8) : pts), stroke: col, 'stroke-width': w, 'vector-effect': 'non-scaling-stroke', opacity: op,
    }));
    (m.cuts || []).forEach((l) => line(l, c.detail, c.detailWidth, c.detailOpacity));
    if (m.crease) line(m.crease, c.detail, c.detailWidth, c.detailOpacity * 0.7);
    if (m.hood) line(m.hood, c.detail, c.detailWidth, c.detailOpacity * 0.8);
    if (m.para) line(m.para, c.para || c.detail, c.detailWidth * 1.4, c.para ? 0.85 : c.detailOpacity);
    if (m.trim) line(m.trim, chromeCol, c.detailWidth * 1.4, c.chrome ? 0.8 : c.detailOpacity);
    (m.handles || []).forEach(([a, b]) => d.appendChild(U.s('path', { d: U.pathD([a, b]), stroke: c.detail, 'stroke-width': 26, opacity: Math.min(1, c.detailOpacity * 1.4) })));
    (m.garn || []).forEach(([p, q]) => d.appendChild(U.s('path', { d: toPath(strip(q, p, m.gw || 18, 0.25)), fill: chromeCol, stroke: 'none', opacity: c.detailOpacity > 0 ? 0.9 : 0 })));
    g.appendChild(d);
    if (m.mirror) {
      const el = U.s('path', { d: toPath(spline(m.mirror, true, 6)), fill: c.body });
      g.appendChild(el);
      bodyEls.push(el);
    }
    return { g, bodyEls, glassEls };
  }

  /** Lamps, clipped to the body so they always sit on the surface */
  function lampLayer(m, c, clip, color, initial = 1) {
    const g = U.s('g', { 'clip-path': `url(#${clip})`, fill: color, opacity: initial });
    const [wf, wr] = m.lw || [24, 24];
    (m.lampF || []).forEach(([p, q]) => g.appendChild(U.s('path', { d: toPath(strip(p, q, wf, 0.35)) })));
    (m.lampR || []).forEach(([p, q]) => g.appendChild(U.s('path', { d: toPath(strip(q, p, wr, 0.35)) })));
    if (m.lensR) g.appendChild(U.s('path', { d: toPath(m.lensR), opacity: 0.35 }));
    if (m.lampF1) g.appendChild(U.s('path', { d: toPath(spline(m.lampF1, true, 6)) }));
    if (m.lampR1) g.appendChild(U.s('path', { d: toPath(spline(m.lampR1, true, 6)) }));
    return g;
  }

  /** Subtle reflection across the glass */
  function glassSheen(m, c, clip) {
    const xs = m.dlo.map((p) => p[0]);
    const ys = m.dlo.map((p) => p[1]);
    const x0 = Math.min(...xs);
    const w = Math.max(...xs) - x0;
    const y0 = Math.min(...ys) - 200;
    const y1 = Math.max(...ys) + 200;
    return U.s('path', {
      d: toPath([[x0 + 0.5 * w, y0], [x0 + 0.64 * w, y0], [x0 + 0.78 * w, y1], [x0 + 0.64 * w, y1]]),
      fill: c.hi, opacity: c.hiOpacity > 0 ? 0.07 : 0, 'clip-path': `url(#${clip})`,
    });
  }

  /** Extra body parts outside the main outline (arch flares, fin, wing) */
  function extras(m, c, g, bodyEls) {
    if (m.flares) {
      // Flared arch lips: a raised band just outside each arch
      [[m.xr, m.RaR || m.Ra], [m.xf, m.Ra]].forEach(([xc, ra]) => {
        const el = U.s('path', { d: toPath(arc(xc, m.R, ra + m.flares, 0.2, Math.PI - 0.2, 24).concat(arc(xc, m.R, ra, Math.PI - 0.2, 0.2, 24))), fill: c.body });
        g.appendChild(el);
        bodyEls.push(el);
        g.appendChild(U.s('path', { d: U.pathD(arc(xc, m.R, ra + m.flares, 0.25, Math.PI - 0.25, 24)), fill: 'none', stroke: c.detail, 'stroke-width': c.detailWidth * 1.3, 'vector-effect': 'non-scaling-stroke', opacity: Math.min(1, c.detailOpacity * 1.5) }));
      });
    }
    if (m.fin) {
      const el = U.s('path', { d: toPath(spline(m.fin, true, 6)), fill: c.body });
      g.appendChild(el);
      bodyEls.push(el);
    }
    if (m.wing) {
      const el = U.s('path', { d: toPath(m.wing.plate), fill: c.body });
      g.append(el, U.s('path', { d: toPath(m.wing.blade), fill: c.window, opacity: 0.35 }));
      bodyEls.push(el);
    }
  }

  function clipDefs(id, bodyD, glassD) {
    const defs = U.s('defs');
    const cb = U.s('clipPath', { id: `${id}b` });
    const cg = U.s('clipPath', { id: `${id}g` });
    const pb = U.s('path', { d: bodyD });
    const pg = U.s('path', { d: glassD });
    cb.appendChild(pb);
    cg.appendChild(pg);
    defs.append(cb, cg);
    return { defs, pb, pg };
  }

  const placeT = (x0, ground, s) => `translate(${x0.toFixed(2)} ${ground.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})`;

  /**
   * Build a car. Returns { g, spec, place(x0, ground, s), setLamps(p), setWheels(angle), setBody(color), setWindow(color) }.
   * place() maps mm → stage px with the rear bumper at x0 and the ground line at `ground`.
   */
  function build(parent, key, opts = {}) {
    const m = M[key];
    const c = Object.assign({}, DEFAULTS, opts);
    const id = `car${++uid}`;
    const g = U.s('g');
    const seg = segments(m);
    const bodyD = toPath(joinSegs(seg));
    const glassD = toPath(spline(m.dlo, true, 10));
    g.appendChild(clipDefs(id, bodyD, glassD).defs);

    [seg.af, seg.ar].forEach((a) => g.appendChild(U.s('path', { d: toPath(a), fill: c.well || c.tire })));
    const body = U.s('path', { d: bodyD, fill: c.body });
    g.appendChild(body);
    const bodyEls = [body];
    extras(m, c, g, bodyEls);
    g.appendChild(under(m, c, `${id}b`));
    const glass = U.s('path', { d: glassD, fill: c.window, opacity: c.windowOpacity ?? 1 });
    g.append(glass, glassSheen(m, c, `${id}g`));
    const ov = over(m, c, `${id}b`);
    g.appendChild(ov.g);
    bodyEls.push(...ov.bodyEls);
    const lamps = lampLayer(m, c, `${id}b`, c.lamp, c.lampOn ?? 1);
    g.appendChild(lamps);
    const wheels = [m.xr, m.xf].map((xc) => {
      const w = wheel(g, m, c);
      w.g.setAttribute('transform', `translate(${xc} ${m.R})`);
      return w;
    });
    parent.appendChild(g);

    let last = null;
    return {
      g,
      spec: m,
      lamps,
      place(x0, ground, s) {
        const t = placeT(x0, ground, s);
        if (t !== last) {
          g.setAttribute('transform', t);
          last = t;
        }
      },
      setLamps(p) {
        lamps.setAttribute('opacity', U.clamp(p).toFixed(3));
      },
      setWheels(a) {
        wheels.forEach((w) => w.spokes.setAttribute('transform', `rotate(${(-U.deg(a)).toFixed(2)})`));
      },
      setBody(col) {
        bodyEls.forEach((el) => el.setAttribute('fill', col));
      },
      setWindow(col) {
        [glass, ...ov.glassEls].forEach((el) => el.setAttribute('fill', col));
      },
    };
  }

  /**
   * Morph between two models: outline segments, arches and glass are resampled to matching point counts and
   * interpolated; A's details and lamps fade out, B's details fade in; B's lamps are controlled with setLamps().
   */
  function morph(parent, keyA, keyB, opts = {}) {
    const c = Object.assign({}, DEFAULTS, opts);
    const A = M[keyA];
    const B = M[keyB];
    const id = `car${++uid}`;
    const N = { top: 360, lowF: 8, af: 40, ar: 40, lowR: 8 };
    const sa = segments(A);
    const sb = segments(B);
    const ra = {};
    const rb = {};
    Object.keys(N).forEach((k) => {
      ra[k] = resampleOpen(sa[k], N[k]);
      rb[k] = resampleOpen(sb[k], N[k]);
    });
    const ga = resampleClosed(spline(A.dlo, true, 10), 200);
    const gb = resampleClosed(spline(B.dlo, true, 10), 200);

    const g = U.s('g');
    const cd = clipDefs(id, '', '');
    g.appendChild(cd.defs);
    const wells = [0, 1].map(() => U.s('path', { fill: c.well || c.tire }));
    const body = U.s('path', { fill: c.body });
    g.append(...wells, body);
    const underA = under(A, c, `${id}b`);
    const underB = under(B, c, `${id}b`);
    const glass = U.s('path', { fill: c.window });
    const overA = over(A, c, `${id}b`);
    const overB = over(B, c, `${id}b`);
    const lampsA = lampLayer(A, c, `${id}b`, c.lampA || c.lamp, 1);
    const lampsB = lampLayer(B, c, `${id}b`, c.lamp, 0);
    g.append(underA, underB, glass, overA.g, overB.g, lampsA, lampsB);
    const wa = [0, 1].map(() => wheel(g, A, c));
    const wb = [0, 1].map(() => wheel(g, B, c));
    parent.appendChild(g);

    return {
      g,
      A,
      B,
      lampsB,
      place(x0, ground, s) {
        g.setAttribute('transform', placeT(x0, ground, s));
      },
      set(p) {
        const mix = (a, b) => a.map((q, i) => [U.lerp(q[0], b[i][0], p), U.lerp(q[1], b[i][1], p)]);
        const s = {};
        Object.keys(N).forEach((k) => (s[k] = mix(ra[k], rb[k])));
        const d = toPath(joinSegs(s));
        body.setAttribute('d', d);
        cd.pb.setAttribute('d', d);
        wells[0].setAttribute('d', toPath(s.af));
        wells[1].setAttribute('d', toPath(s.ar));
        glass.setAttribute('d', toPath(mix(ga, gb)));
        const fa = (1 - U.clamp(p * 1.6)).toFixed(3);
        const fb = U.clamp((p - 0.45) * 1.8).toFixed(3);
        [underA, overA.g].forEach((el) => el.setAttribute('opacity', fa));
        [underB, overB.g].forEach((el) => el.setAttribute('opacity', fb));
        lampsA.setAttribute('opacity', (1 - U.clamp(p * 2)).toFixed(3));
        const R = U.lerp(A.R, B.R, p);
        const xs = [U.lerp(A.xr, B.xr, p), U.lerp(A.xf, B.xf, p)];
        [[wa, A], [wb, B]].forEach(([ws, S], j) => ws.forEach((w, i) => {
          w.g.setAttribute('transform', `translate(${xs[i].toFixed(1)} ${R.toFixed(1)}) scale(${(R / S.R).toFixed(4)})`);
          w.g.setAttribute('opacity', (j ? U.clamp(p * 2 - 0.5) : 1).toFixed(3));
        }));
      },
      setLamps(p) {
        lampsB.setAttribute('opacity', U.clamp(p).toFixed(3));
      },
    };
  }

  /** Forward tips of the front lamps (mm) — where light beams start */
  function anchor(key) {
    const m = M[key];
    if (m.lampF) return m.lampF.map(([p]) => [p[0], p[1]]);
    return [m.lampF1.reduce((a, p) => (p[0] > a[0] ? p : a))];
  }

  SX.cars = { M, build, morph, spline, bodyOutline, anchor };
})((window.SX = window.SX || {}));
