/* 10 PROCESS — "다섯 줄이면 / 충분하니,"
   Code mode split 56 : 44 (dataset F23). The starter preset is typed into the editor — lines 1–3 on b1, 4–6 on b2
   (its source, verbatim from the Loopfield repository) — compiled on b3 so the preview lights up with its rings;
   on b4 the uDensity slider moves inside its range 2–20. Exit: hexagonal pulse into the montage. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const ST = D.starter;

  const WIN = { x: 96, y: 520, w: 1728, h: 470, bar: 38 };
  const SPLIT = WIN.x + Math.round((WIN.w * D.codeSplit) / 100);
  const PREV = [WIN.x + 1, WIN.y + WIN.bar, SPLIT - WIN.x - 2, WIN.h - WIN.bar - 1];
  const CODE = SX.presets.byId('starter').code.split('\n');
  const TOK = { comment: '#94a69d', type: '#9ab7ff', number: '#edbe8e', func: '#83ded5', text: '#dde6f4' };

  function tokens(line) {
    if (/^\s*\/\//.test(line)) return [[line, TOK.comment]];
    const out = [];
    const re = /(\b(?:vec2|vec3|float|return)\b)|(\b\d+(?:\.\d+)?\b)|(\b(?:sin|length|palette|pattern)\b)|([^\w]+|\w+)/g;
    let m;
    while ((m = re.exec(line))) out.push([m[0], m[1] ? TOK.type : m[2] ? TOK.number : m[3] ? TOK.func : TOK.text]);
    return out;
  }
  // lines 1–3 type during b1, 4–6 during b2
  const shownChars = (i, lt) => {
    const t0 = i < 3 ? (i * T.SPB) / 3 : T.SPB + ((i - 3) * T.SPB) / 3;
    return Math.floor(CODE[i].length * U.clamp((lt - t0) / (T.SPB / 3)));
  };
  const density = (lt) => (lt < 1.5 ? ST.density[0] : ST.density[0] + 8 * Math.sin(Math.PI * U.prog(lt, 1.5, 2.0)));

  SX.defineScene({
    id: 10,
    role: 'PROCESS',
    bg: 'night',

    build(cam) {
      const st = {};
      st.api = ui.tag(cam, SPLIT + 24, 466, `${D.entry} · CHARS`, String(ST.chars));
      st.limits = ui.chip(cam, SPLIT + 24, 396, `${D.sourceMax} CHARS · ${D.slidersPerLayer} SLIDERS / LAYER`);
      st.cap = ui.caption(cam, { x: 120, y: 172, text: `CODE MODE / ${D.entry}` });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 124, lines: ['다섯 줄이면', '충분하니,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.api, lt, 1.0, { from: 0.6 });
      ui.pop(st.limits, lt, 1.5, { from: 0.6 });
    },

    draw(G, st, lt) {
      const comp = E.outCubic(U.prog(lt, 1.0 - T.LEAD, 1.0 + 0.3));
      G.ink((ctx) => {
        const I = SX.ink;
        I.box(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 10, '#07090d', { stroke: '#303640', w: 1.5, alpha: U.clamp(lt * 8) });
      });
      if (comp > 0) {
        const cx = PREV[0] + PREV[2] / 2;
        const cy = PREV[1] + PREV[3] / 2;
        G.pattern('starter', {
          rect: PREV,
          clip: PREV,
          circle: [cx, cy, 700 * comp, 30],
          loop: 2,
          params: { uDensity: density(lt) },
        });
      }

      G.ink((ctx) => {
        const I = SX.ink;
        const a = U.clamp(lt * 8);
        // title bar, split line, editor gutter
        I.line(ctx, WIN.x, WIN.y + WIN.bar, WIN.x + WIN.w, WIN.y + WIN.bar, 1, { color: '#303640', w: 1.5, alpha: a });
        I.line(ctx, SPLIT, WIN.y, SPLIT, WIN.y + WIN.h, 1, { color: '#303640', w: 2, alpha: a });
        I.text(ctx, 'starter.glsl', SPLIT + 52, WIN.y + 25, { color: C.paper, size: 13, alpha: a, track: 0.5 });
        ctx.globalAlpha = a;
        ctx.fillStyle = C.peach;
        ctx.fillRect(SPLIT + 30, WIN.y + 15, 9, 9);
        I.text(ctx, 'Ctrl+Enter', WIN.x + WIN.w - 20, WIN.y + 25, { color: comp > 0 ? C.peach : '#929ba9', size: 13, align: 'right', alpha: a, track: 0.5 });
        I.text(ctx, `${D.codeSplit} : ${100 - D.codeSplit}`, SPLIT - 14, WIN.y + 25, { color: '#929ba9', size: 13, align: 'right', alpha: a, track: 0.5 });
        I.text(ctx, 'PREVIEW', WIN.x + 18, WIN.y + 25, { color: '#929ba9', size: 13, alpha: a });

        // code with line numbers, typed line by line
        const x0 = SPLIT + 70;
        const y0 = WIN.y + WIN.bar + 50;
        const lh = 38;
        CODE.forEach((line, i) => {
          I.text(ctx, String(i + 1), SPLIT + 46, y0 + i * lh, { color: '#778294', size: 18, align: 'right', alpha: a, track: 0 });
          const n = shownChars(i, lt);
          if (n <= 0) return;
          let x = x0;
          let left = n;
          ctx.font = `400 19px ${I.MONO}`;
          for (const [s, col] of tokens(line)) {
            if (left <= 0) break;
            const part = s.slice(0, left);
            I.text(ctx, part, x, y0 + i * lh, { color: col, size: 19, track: 0, alpha: a });
            ctx.font = `400 19px ${I.MONO}`;
            x += ctx.measureText(part).width;
            left -= s.length;
          }
          const typing = n < line.length || (i === CODE.length - 1 && lt < 1.0);
          if (typing && Math.floor(lt / T.E16) % 2 === 0) {
            ctx.globalAlpha = a;
            ctx.fillStyle = C.paper;
            ctx.fillRect(x + 2, y0 + i * lh - 18, 10, 22);
          }
        });

        // preview: compile hint before b3, slider after
        if (comp <= 0) I.text(ctx, 'Ctrl+Enter', PREV[0] + PREV[2] / 2, PREV[1] + PREV[3] / 2, { color: '#5b6573', size: 20, align: 'center', alpha: a });
        if (comp > 0) {
          ctx.globalAlpha = 0.55 * (1 - comp);
          ctx.strokeStyle = C.peach;
          ctx.lineWidth = 4;
          ctx.strokeRect(PREV[0] + 2, PREV[1] + 2, PREV[2] - 4, PREV[3] - 4);
          I.box(ctx, PREV[0] + 20, PREV[1] + PREV[3] - 70, 400, 52, 6, C.night, { alpha: 0.82 * comp });
          I.slider(ctx, PREV[0] + 40, PREV[1] + PREV[3] - 32, 360, {
            label: `uDensity  ${ST.density[1]}–${ST.density[2]}`, min: ST.density[1], max: ST.density[2], value: density(lt),
            shown: density(lt).toFixed(0), color: C.paper, accent: C.peach, bg: C.night, alpha: comp,
          });
        }
      });
    },
  });
})((window.SX = window.SX || {}));
