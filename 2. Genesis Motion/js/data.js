/* DATA — every on-screen fact, copied from dataset/genesis_brand_dataset.md (as of 2026-09-29).
   Scenes read only from here. `approx: true` renders a leading "~".
   Rules (prompt/Genesis Prompt.txt): annual table and cumulative reports are never mixed,
   US series = CarBuzz (B) column, GV80 + Coupe stay combined, no rumours or targets.
   See prompt/STORYBOARD.md §1 for the full data-usage table. */
(function (SX) {
  'use strict';

  SX.DATA = Object.freeze({
    asOf: '2026-09-29',

    brand: {
      launched: '2015-11-04', // §0 · §1
      // §1 timeline stops used by the year roller
      lineage: [
        { year: 2003, label: 'CONCEPT GENESIS' },
        { year: 2008, label: 'GENESIS SEDAN' },
        { year: 2015, label: 'INDEPENDENT BRAND' },
      ],
    },

    // §1 · §3 first three sedans (generation at launch)
    firstSedans: [
      { model: 'G90', code: 'HI', date: '2015-12', car: 'g90hi', role: 'FLAGSHIP' },
      { model: 'G80', code: 'DH', date: '2016', car: 'dh', role: 'MID-SIZE' },
      { model: 'G70', code: 'IK', date: '2017', car: 'g70', role: 'SPORT' },
    ],
    global2016: 57451, // §5.1

    gv80: { code: 'JX1', date: '2020-01' }, // §1
    pivot: { y2019: 77135, y2020: 132450, yoyPct: 71.7 }, // §5.1

    // §5.1 global annual (table; not the cumulative reports)
    globalAnnual: [
      { year: 2015, v: 384 },
      { year: 2016, v: 57451 },
      { year: 2017, v: 78586 },
      { year: 2018, v: 85389 },
      { year: 2019, v: 77135 },
      { year: 2020, v: 132450 },
      { year: 2021, v: 201450 },
      { year: 2022, v: 215128 },
      { year: 2023, v: 225189 },
      { year: 2024, v: 229532 },
      { year: 2025, v: 221482 },
    ],
    threshold: 200000, // §5.1 milestone "연 20만" (2021)

    // §3.1 2024 global by model (share of 229,532). GV80 + Coupe is one combined cell.
    mix2024: [
      { model: 'GV70', v: 73564, pct: 32.0, car: 'gv70', suv: true },
      { model: 'GV80 + COUPE', v: 68026, pct: 29.6, car: 'gv80', suv: true },
      { model: 'G80', v: 52277, pct: 22.8, car: 'g80' },
      { model: 'G70', v: 15962, pct: 7.0, car: 'g70fl' },
      { model: 'G90', v: 10111, pct: 4.4, car: 'g90' },
      { model: 'GV60', v: 4286, pct: 1.9, car: 'gv60', suv: true },
      { model: 'ELECTRIFIED GV70', v: 4153, pct: 1.8, car: 'gv70', suv: true },
      { model: 'ELECTRIFIED G80', v: 767, pct: 0.3, car: 'g80' },
    ],
    suvSharePct: 65.4, // §3.1 "≈ 150,029 (65.4%)"
    suvShareApprox: true,
    best: { year: 2024, v: 229532 }, // §5.1 annual maximum

    // §5.4 US brand annual, B column (CarBuzz)
    us: [
      { year: 2016, v: 6948 },
      { year: 2017, v: 20612 },
      { year: 2018, v: 9940 },
      { year: 2019, v: 21237 },
      { year: 2020, v: 16384 },
      { year: 2021, v: 49630 },
      { year: 2022, v: 56198 },
      { year: 2023, v: 68798 },
      { year: 2024, v: 75003 },
      { year: 2025, v: 82331 },
    ],
    infiniti: [
      { year: 2016, v: 137970 },
      { year: 2024, v: 58070 },
      { year: 2025, v: 52846 },
    ],
    usPassYear: 2024, // §5.4 "2024부터 Infiniti 추월"
    usMultiple: 12, // §5.4 "≈ 12배"

    // §1 · §5.1–5.3 cumulative 1M
    cum1M: { date: '2023-08', total: 1008804, kr: 691177, krPct: 68, overseas: 318627, overseasPct: 32 },
    // §1 · §5.1 cumulative 1.5M (10th anniversary)
    cum15M: { date: '2025-11', total: 1510368, g80: 501517, from: '2015-11' },

    ev: {
      pledgeDate: '2021-09', // §0 · §4.1
      pledge: 'ALL NEW MODELS EV FROM 2025',
      bevPct: 4.0, // §4.3
      bevUnits: 9206,
      bevYear: 2024,
      revisedDate: '2024-08', // §0 · §4.1
      bevModels: [
        { model: 'GV60', car: 'gv60' },
        { model: 'ELECTRIFIED G80', car: 'g80' },
        { model: 'ELECTRIFIED GV70', car: 'gv70' },
      ],
    },

    magma: {
      model: 'GV60 MAGMA', // §7.1 · §7.2
      premiere: '2025-11-20',
      zeroTo100: 3.4,
      vmax: 264,
      hp: 641, // "641 hp (US) 또는 650 hp" → US value
      hpNote: 'US BOOST',
    },

    racing: { car: 'GMR-001', wecDebut: '2026-04', leMans: '2026-06' }, // §7.3
    gv90: { code: 'JG1', reveal: '2026-08-19', lengthMm: 5285, batteryKwh: 123.5 }, // §8

    // HUD source line per scene (§12 source keys)
    sources: [
      '§1 HMG "TEN YEARS OF GENESIS"',
      '§1 · §3 WIKIPEDIA · §5.1',
      '§1 · §5.1 WIKIPEDIA (HMG)',
      '§5.1 WIKIPEDIA (HMG) · YONHAP',
      '§3.1 WIKIPEDIA LIST OF GENESIS VEHICLES',
      '§5.4 CARBUZZ',
      '§5.1–5.3 HANKYOREH 2023-09',
      '§5.1 YONHAP 2026-01-04',
      '§4 GENESIS.COM · PRESS REPORTS',
      '§7.2 GENESIS.COM · PR NEWSWIRE',
      '§3–§8 PER CUT',
      '§7.3 · §8 GENESIS.COM · WIKIPEDIA',
    ],
  });
})((window.SX = window.SX || {}));
