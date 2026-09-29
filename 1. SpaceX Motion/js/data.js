/* DATA — every on-screen fact, copied from dataset/SpaceX_Dataset_2002-2026.md (snapshot 2026-09-29 KST).
   Scenes read only from here. `approx: true` renders a leading "~".
   Ranges were resolved to one representative value by the file's §8 priority
   (company filings > independent catalogs > press); see prompt/STORYBOARD.md §1. */
(function (SX) {
  'use strict';

  SX.DATA = Object.freeze({
    asOf: '2026-09-29',

    company: {
      founded: '2002-03-14', // §0
      foundedPlace: 'EL SEGUNDO, CA', // §0
      initialCapitalM: 100, // §1 "약 $100M"
      initialCapitalApprox: true,
    },

    falcon1: {
      // §2.1: 5 attempts, 2 successes, 3 failures. Years from §2.2 (2006:1, 2007:1, 2008:2, 2009:1)
      attempts: 5,
      failures: 3,
      site: 'KWAJALEIN', // §2.3
      flights: [
        { n: 1, year: 2006, ok: false },
        { n: 2, year: 2007, ok: false },
        { n: 3, year: 2008, ok: false },
        { n: 4, year: 2008, ok: true, date: '2008-09-28' }, // §1 4th attempt, first orbit
        { n: 5, year: 2009, ok: true },
      ],
      firstOrbit: '2008-09-28', // §1
    },

    landing: {
      // §2.4
      success: 661,
      attempts: 674,
      ratePct: 98.07,
      firstLandingYear: 2015, // §1 2015-12
    },

    reuse: {
      // §2.4
      recordBooster: 'B1067',
      recordFlights: 37,
      recordDate: '2026-08-25',
      turnaroundBooster: 'B1088',
      turnaround: { d: 9, h: 3, m: 39, s: 28 },
    },

    // §2.2 "SpaceX 총 궤도/시험" column only. null = year not in table (left blank).
    launchesByYear: [
      { year: 2006, v: 1 },
      { year: 2007, v: 1 },
      { year: 2008, v: 2 },
      { year: 2009, v: 1 },
      { year: 2010, v: 2 },
      { year: 2011, v: null },
      { year: 2012, v: 2 },
      { year: 2013, v: 3 },
      { year: 2014, v: 6 },
      { year: 2015, v: 7 },
      { year: 2016, v: 8, approx: true }, // 8~9, no filing → Falcon success column value
      { year: 2017, v: 18 },
      { year: 2018, v: 21 },
      { year: 2019, v: 13 },
      { year: 2020, v: 25 },
      { year: 2021, v: 31 },
      { year: 2022, v: 61 },
      { year: 2023, v: 98 },
      { year: 2024, v: 138 }, // 136~138 → S-1 operating metric 138
      { year: 2025, v: 170 },
      { year: 2026, v: 113, approx: true, ytd: true }, // ~113+ as of 09-29
    ],

    share2025: {
      launchSharePct: 50, // §2.2 ~50%
      worldLaunches: 330, // §2.2 세계 ~330
      massSharePct: 80, // §1 ~80%+
      massT: 2213, // §2.2 filing
      customerT: 312, // §2.2 filing
      internalT: 1901, // §2.2 filing
    },

    starlink: {
      // §4.1 in-orbit series (chart is approximate; final value from the table)
      inOrbit: [
        { label: '2019', year: 2019.5, v: 60, approx: true },
        { label: '2020', year: 2020.5, v: 900, approx: true },
        { label: '2021', year: 2021.5, v: 1800, approx: true },
        { label: '2023', year: 2023.5, v: 4400, approx: true },
        { label: '2024', year: 2024.5, v: 6500, approx: true },
        { label: '2025 END', year: 2025.95, v: 9400, approx: true },
        { label: '2026-09-10', year: 2026.7, v: 11133 },
      ],
      launched: 12935, // §4.1 2026-09-10
      launchedDate: '2026-09-10',
      // §4.2 subscriptions (millions)
      subs: [
        { label: '2021', year: 2021.5, v: 0.145, approx: true },
        { label: '2022', year: 2022.5, v: 1.0, approx: true },
        { label: '2023', year: 2023.5, v: 2.3, approx: true },
        { label: '2024 END', year: 2024.95, v: 4.6, approx: true },
        { label: '2025 Q2', year: 2025.4, v: 6.0 },
        { label: '2026-03-31', year: 2026.25, v: 10.3 },
        { label: '2026-06-30', year: 2026.5, v: 12.0 },
      ],
      countries: 167, // §4.2 2026-06-30
      arpu: 66, // §4.2 $/mo 2026-06-30
      arpuDate: '2026-06-30',
    },

    ipo: {
      ticker: 'SPCX', // §0
      exchange: 'NASDAQ',
      listed: '2026-06-12',
      proceedsB: 85.7, // §6.1 incl. greenshoe
      valuationT: 1.77, // §6.1
      // §6.2 closing-price points
      points: [
        { key: 'IPO', date: '06-11', v: 135.0 },
        { key: 'D1 CLOSE', date: '06-12', v: 160.95 },
        { key: 'ATH', date: '06-16', v: 225.64 },
        { key: 'ATL', date: '08-03', v: 104.83 },
        { key: '09-28 CLOSE', date: '09-28', v: 145.47 },
      ],
      vsIpoPct: 7.76, // §6.2
    },

    montage: {
      block5SuccessPct: 99.84, // §2.1 ~99.84%
      block5Since: '2018-05',
      fy2025RevenueM: 18674, // §5.1
      fy2025Mix: [
        { key: 'CONNECTIVITY', pct: 61.0 },
        { key: 'SPACE', pct: 21.9 },
        { key: 'AI', pct: 17.1 },
      ],
      heightF9m: 70, // §3.3
      heightStarshipM: 121, // §3.3
      starshipFlights: 14, // §2.1 / §2.5
    },

    flight14: {
      // §2.5
      n: 14,
      date: '2026-09-28',
      booster: 'B21',
      ship: 'S41',
      v3Deployed: 26,
    },

    // HUD source line per scene, named by §8 priority
    sources: [
      '§1 MILESTONES',
      '§2.1 · §2.3 WIKIPEDIA / KEEPTRACK',
      '§1 MILESTONES · WIKIPEDIA',
      '§2.4 SPACEXNOW / KEEPTRACK',
      '§2.4 SPACEXNOW / KEEPTRACK',
      '§2.2 S-1 / 10-Q + TRACKERS',
      '§1 · §2.2 S-1 / 10-Q',
      '§4.1 McDOWELL / CELESTRAK',
      '§4.2 S-1 / 10-Q',
      '§6 NASDAQ / REUTERS / YAHOO',
      '§2–§6 · §8 ORDER PER CUT',
      '§2.5 SFN / NSF / CNN',
    ],
  });
})((window.SX = window.SX || {}));
