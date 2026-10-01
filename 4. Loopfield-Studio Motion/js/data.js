/* DATA: every value shown on screen, copied from dataset/loopfield-studio-dataset.md (snapshot 2026-10-01).
   Scenes read only from here. Section numbers (§) refer to the dataset. Preset GLSL lives in js/fx/presets.js. */
(function (SX) {
  'use strict';

  SX.DATA = {
    snapshot: '2026-10-01',
    name: 'Loopfield Studio',
    version: '1.1.0',
    license: 'MIT',
    maker: 'JTech Co.',
    domain: 'Loopfield.studio', // user-specified end-card domain (dataset run URL: jtech-co.github.io/Loopfield-Studio/)
    ogLine: 'Create your next infinite loop.', // §0 OG title "Loopfield Studio - Create your next infinite loop"

    // §5 presets and §16 versions
    releases: [
      { version: 'v1.0.0', presets: 12, date: '2026-09-22' },
      { version: 'v1.1.0', presets: 32, added: 20, date: '2026-09-22' },
    ],
    categories: [
      { key: 'geometry', label: 'GEOMETRY', n: 13 },
      { key: 'organic', label: 'ORGANIC', n: 8 },
      { key: 'fractal', label: 'FRACTAL', n: 6 },
      { key: 'volume', label: 'VOLUME', n: 4 },
      { key: 'code', label: 'CODE', n: 1 },
    ],
    sliderTotal: 70,

    // §5 slider spec and code length for the presets that carry on-screen numbers
    mandelbrot: { iterations: 160, chars: 659 },
    prism: { petals: [7, 3, 16], bands: [9, 3, 18], twist: [1.2, 0, 3], chars: 473, sliders: 3 },
    rose: { petals: [5, 2, 12], roses: [5, 2, 8] },
    julia: { real: -0.745, imag: 0.185, orbit: 0.028, iterations: 144 },
    starter: { chars: 190, density: [8, 2, 20] },

    // §3 ranges and defaults
    zoomMax: 64,
    defaultPreset: 'PRISM BLOOM',
    newLayerBlend: 'SCREEN',

    // §1 F02 · F03 · §11 example 01
    layersMax: 4,
    blends: ['NORMAL', 'SCREEN', 'ADD', 'MULTIPLY', 'DIFFERENCE'],
    example01: {
      name: '겹쳐지는 궤도',
      layers: [
        { preset: 'prism', label: 'PRISM', blend: 'normal', opacity: 1, palette: 0, rot: 0, phase: 0 },
        { preset: 'orbital', label: 'ORBITAL', blend: 'screen', opacity: 0.28, palette: 4, rot: 20, phase: 0.12 },
      ],
    },

    // §4 palettes (names in English for micro labels; colours = dataset values, same as SX.presets.palettes)
    palettes: [
      { key: 'AURORA', colors: ['#65fbd5', '#ac76ff', '#ffb86c'] },
      { key: 'SUNSET', colors: ['#ff543e', '#ffc879', '#a63cff'] },
      { key: 'GLACIER', colors: ['#b7fbff', '#409eff', '#6862ef'] },
      { key: 'ANALOG', colors: ['#fce5b4', '#e6a065', '#647b73'] },
      { key: 'CANDY', colors: ['#ff64bc', '#6fe8ff', '#fff1a3'] },
      { key: 'MONO', colors: ['#f7f4ed', '#8a929d', '#dbe6ed'] },
    ],

    // §1 F06 · F07
    sliderSyntax: '@slider name min max step default | label',
    slidersPerLayer: 16,

    // §2.2 · §12.4 loop
    loop: { frames: 240, lastPhase: '(N−1)/N' },
    loopCheck: { samples: 4, size: '320×180', mae: 'MAE ≤ 0.5/255', match: '32/32' },

    // §2.1 · §2.2 · §2.3 output
    resolutions: [
      { key: '1080p', w: 1920, h: 1080, mp: '2.074' },
      { key: 'DCI 2K', w: 2048, h: 1080, mp: '2.212' },
      { key: 'QHD', w: 2560, h: 1440, mp: '3.686' },
      { key: 'UHD', w: 3840, h: 2160, mp: '8.294' },
    ],
    outputs: 10,
    fps: [24, 30, 60],
    seconds: '2–60',
    maxFrames: 3600,
    bitrateCap: '180 MBPS',

    // §1 F30 · F36 · §14 local-first, §12.5 native encode sample
    zeros: ['ACCOUNT', 'BACKEND', 'UPLOAD', 'TRACKING'],
    pipeline: ['LAYERS', 'WEBGL 2', 'WEBCODECS · H.264', 'MP4'],
    nativeEncode: { size: '1920×1080', fps: 24, seconds: 2, frames: 48, codec: 'AVC1.640028', mb: '~5.7 MB', date: '2026-09-26' },

    // §1 F08 · F23 · §6 code mode
    codeSplit: 56,
    sourceMax: '48,000',
    entry: 'pattern(vec2 p)',

    // HUD source line per scene (dataset section)
    sources: [
      '§5 MANDELBROT',
      '§3 · §5 PRISM BLOOM',
      '§5 PRESETS · §16',
      '§1 F02 F03 · §11',
      '§4 PALETTES',
      '§1 F06 F07 · §5',
      '§2.2 · §12.4',
      '§2.1 – §2.3',
      '§1 · §12.5 · §14',
      '§1 F23 · §5 · §6',
      '§1 – §12 PER CUT',
      '§0 · §5',
    ],
  };
})((window.SX = window.SX || {}));
