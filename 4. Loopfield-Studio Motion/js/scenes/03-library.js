/* 03 PROOF — "32가지 패턴으로 / 갈라져,"
   A paper contact sheet of 8 × 4 cells, each rendering a real preset. v1.0.0's 12 presets light up on 16ths (b1),
   v1.1.0's 20 more follow (b2); the cells regroup by category with a stacked bar 13 · 8 · 6 · 4 · 1 (b3);
   32 and 70 SLIDERS hold (b4). Exit: Truchet tile flip. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const G0 = { x: 330, y: 520, w: 173, h: 97, gap: 12, cols: 8 };
  SX.L.grid = G0;
  const CAT_COL = { geometry: C.violet, organic: C.mint, fractal: C.peach, volume: C.ink, code: '#8a929d' };
  const LIST = SX.presets.list;
  // rank after regrouping: category order of the dataset, preset order within a category
  const ORDER = D.categories.map((c) => c.key);
  const RANK = LIST.map((p, i) => i).sort((a, b) => ORDER.indexOf(LIST[a].category) - ORDER.indexOf(LIST[b].category) || a - b);
  const POS_AFTER = [];
  RANK.forEach((idx, r) => (POS_AFTER[idx] = r));

  const cellXY = (k) => [G0.x + (k % G0.cols) * (G0.w + G0.gap), G0.y + Math.floor(k / G0.cols) * (G0.h + G0.gap)];
  const litAt = (i) => (i < 12 ? Math.floor(i / 3) * T.E16 : 0.5 + Math.floor((i - 12) / 5) * T.E16);

  SX.defineScene({
    id: 3,
    role: 'PROOF',
    bg: 'paper',

    build(cam) {
      const st = {};
      st.count = ui.counter(cam, { x: 1798, y: 228, size: 200, align: 'right' });
      st.ver = U.box(1378, 440, 'mono', '');
      st.ver.style.width = '420px';
      st.ver.style.textAlign = 'right';
      cam.appendChild(st.ver);
      st.sliders = ui.tag(cam, 1560, 468, 'SLIDERS', String(D.sliderTotal));
      st.cap = ui.caption(cam, { x: 120, y: 172, text: 'PRESET LIBRARY / v1.0.0 → v1.1.0' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 116, lines: ['32가지 패턴으로', '갈라져,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      const lit = LIST.filter((p, i) => lt >= litAt(i)).length;
      st.count.set(String(Math.max(0, lit)));
      st.count.el.style.opacity = U.clamp(lt * 8).toFixed(3);
      const pb = U.pulse(Math.max(0, lt - 0.5), T.SPB, 0.12) * (lt >= 0.5 ? 1 : 0);
      st.count.el.style.transform = `scale(${(1 + 0.04 * pb).toFixed(4)})`;
      const r = lt < 0.5 ? D.releases[0] : D.releases[1];
      U.setText(st.ver, lt < 0.5 ? `PRESETS · ${r.version} · ${r.date}` : `PRESETS · ${r.version} · +${r.added} · ${r.date}`);
      st.ver.style.opacity = U.clamp(lt * 6).toFixed(3);
      ui.pop(st.sliders, lt, 1.5, { from: 0.6 });
    },

    draw(G, st, lt) {
      const move = E.inOutCubic(U.prog(lt, 1.0 - T.LEAD, 1.3));
      const place = (i) => {
        const a = cellXY(i);
        const b = cellXY(POS_AFTER[i]);
        return [U.lerp(a[0], b[0], move), U.lerp(a[1], b[1], move)];
      };

      // cells: real preset renders, popping in on 16ths
      LIST.forEach((p, i) => {
        const t0 = litAt(i);
        if (lt < t0) return;
        const k = E.outBack(U.prog(lt, t0, t0 + 0.18), 2);
        const [x, y] = place(i);
        const w = G0.w * k;
        const h = G0.h * k;
        const rect = [x + (G0.w - w) / 2, y + (G0.h - h) / 2, w, h];
        G.pattern(p.id, { rect, clip: rect, loop: 4, phase: i * 0.13 });
      });

      G.ink((ctx) => {
        const I = SX.ink;
        const gw = G0.cols * G0.w + (G0.cols - 1) * G0.gap;
        const gh = 4 * G0.h + 3 * G0.gap;
        I.marks(ctx, G0.x - 10, G0.y - 10, gw + 20, gh + 20, 16, { color: C.ink, w: 1.5, alpha: 0.7 });
        // empty slots
        for (let k = 0; k < 32; k++) {
          const [x, y] = cellXY(k);
          I.rect(ctx, x + 0.5, y + 0.5, G0.w - 1, G0.h - 1, U.clamp(lt * 5), { color: C.ink, w: 1, alpha: 0.18, dash: [4, 5] });
        }
        // labels and category underline per lit cell
        LIST.forEach((p, i) => {
          const t0 = litAt(i);
          if (lt < t0 + 0.08) return;
          const [x, y] = place(i);
          ctx.font = `400 10px ${I.MONO}`;
          const tw = ctx.measureText(p.id.toUpperCase()).width + 14;
          I.box(ctx, x + 4, y + 4, tw, 16, 2, C.paper, { alpha: 0.92 });
          I.text(ctx, p.id.toUpperCase(), x + 9, y + 15.5, { color: C.ink, size: 10, track: 1 });
          if (move > 0) {
            ctx.globalAlpha = move;
            ctx.fillStyle = CAT_COL[p.category];
            ctx.fillRect(x, y + G0.h - 5, G0.w, 5);
          }
        });
        // b3: stacked category bar
        const bp = E.outCubic(U.prog(lt, 1.05, 1.45));
        if (bp > 0) {
          let x = G0.x;
          const y = G0.y + gh + 18;
          D.categories.forEach((c) => {
            const w = ((gw - 8) * c.n) / 32;
            ctx.globalAlpha = 1;
            ctx.fillStyle = CAT_COL[c.key];
            ctx.fillRect(x, y, w * bp, 8);
            if (bp > 0.6) I.text(ctx, `${c.label} ${c.n}`, x, y + 28, { color: C.ink, size: 13, alpha: U.clamp((bp - 0.6) * 3) });
            x += w + 2;
          });
        }
      });
    },
  });
})((window.SX = window.SX || {}));
