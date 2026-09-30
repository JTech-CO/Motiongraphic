/* DATA: every value shown on screen, copied from dataset/DJI_dataset_2006-2026.md (as of 2026-09-29).
   Scenes read only from here. Table ids (T01…T13) refer to the dataset sections.
   DJI is private: revenue and shipment figures are press / wiki / analyst estimates → flagged `est`. */
(function (SX) {
  'use strict';

  SX.DATA = {
    asOf: '2026-09-29',

    // T01 · T02 · T04 — founding and the flight-controller business
    founded: '2006-01-18',
    hq: 'SHENZHEN',
    origin: [
      { year: 2003, label: 'HKUST' }, // T02: 汪滔 HKUST 입학
      { year: 2005, label: 'ROBOCON' }, // T02: ABU Robocon 3위
      { year: 2006, label: 'DJI' }, // T02: 2006-01 설립
    ],
    fcPrice: 'CNY 50,000', // T01 초기 자금: 비행제어기 CNY 50,000/대
    fcCost: '~15,000', // 원가 ~15,000
    fcPerMonth: '~20', // T04: 2006–08 FC 월판매 ~20 units/mo

    // T02 · T07a — Phantom 1
    phantom: { model: 'PHANTOM 1', date: '2013-01', price: 'USD 629', rtf: 'READY TO FLY · GPS', cam: 'CAMERA MOUNT' },

    // T04 · T03 — 2014 units and revenue around it
    units2014: 400000, // T04: 2014 드론 판매 400000 (대부분 Phantom)
    iconUnits: 1000, // one formation icon ≈ 1,000 units (derived)
    rev2013: '~$131M', // T03 mid 0.131 (est.)
    rev2014: '~$0.5B', // T03 mid 0.50 (est.)

    // T05 — 2025 Dedrone detections (single-source composition, sums to 100)
    detections: {
      year: 2025,
      source: 'DEDRONE',
      parts: [
        { key: 'DJI', pct: 83.48 },
        { key: 'DIY · FPV', pct: 9.82 },
        { key: 'AUTEL', pct: 1.4 },
        { key: 'OTHER', pct: 5.3 },
      ],
    },

    // T10 — flagship evolution
    flagship: {
      from: { model: 'PHANTOM 1', year: 2013, min: 15, km: 1, kmLabel: '~1 KM' },
      to: { model: 'MAVIC 4 PRO', year: 2025, min: 51, km: 30, kmLabel: '30 KM' },
      flightX: '3.4×',
      rangeX: '30×',
    },
    focal: ['28MM', '168MM'], // T11: Mavic 4 Pro 28–168mm equiv

    // T07c · T10 · T12 — the 249 g line
    mini: { model: 'MAVIC MINI', date: '2019-10', g: 249 },
    mini5: { model: 'MINI 5 PRO', year: 2025, g: 249.9, cam: '1" 50MP' },
    limitG: 250, // T12: 250 g / C0–C3 / Remote ID

    // T04 · T08 — Osmo Pocket
    pocket: { model: 'OSMO POCKET', year: 2018 },
    pocket3: {
      model: 'OSMO POCKET 3',
      units2024: 5000000, // >5,000,000 (2024)
      guidance: [300000, 400000], // 내부 초기 가이던스 30–40만 (reported)
      cum: '10,000,000+', // >10,000,000 cumulative, 2025 Q3
      cumWhen: '2025 Q3',
      source: '36KR / LEIFENG',
    },

    // T06 — global action-cam revenue share (two points) + IDC handheld shipments (separate definition)
    actionCam: {
      left: { when: '2022–23', dji: 25, djiLabel: '<25% EST.', gopro: 75, goproLabel: '>75%' },
      right: { when: '2025 Q1–Q3', dji: 66, gopro: 18, insta: 13 },
      source: 'CHANSON',
    },
    handheldIdc: { when: 'Q2 2026', pct: 73, source: 'IDC' },

    // T03 — revenue points used on the log-scale climb (all estimates)
    revenue: [
      { year: 2011, usd: 4.2e6, label: '~$4.2M' },
      { year: 2013, usd: 131e6, label: '~$131M' },
      { year: 2015, usd: 1e9, label: '~$1B' },
      { year: 2025, usd: 11.5e9, label: '~$11.5B', note: 'CNY 80B' },
    ],

    // T12 — United States
    us: [
      { date: '2020-12', label: 'ENTITY LIST' },
      { date: '2022-10', label: 'DOD LIST' },
      { date: '2025-12-22', label: 'FCC COVERED LIST', note: 'NEW MODELS NOT AUTHORIZED', note2: 'EXISTING MODELS STILL SOLD' },
      { date: '2026-02-20', label: '9TH CIRCUIT · FILED' },
    ],

    // HUD source line per scene (table id + source)
    sources: [
      'T01 · T02 FORBES / WIKI',
      'T02 · T07A DJI',
      'T03 · T04 ZH WIKI / SCMP',
      'T05 DEDRONE',
      'T10 DJI SPECS',
      'T07C · T10 · T12',
      'T04 · T08 36KR / LEIFENG',
      'T06 CHANSON · IDC',
      'T03 EST. · EN WIKI',
      'T12 BIS · DOD · FCC',
      'T02–T12 PER CUT',
      'T10 · T04 · T11',
    ],
  };
})((window.SX = window.SX || {}));
