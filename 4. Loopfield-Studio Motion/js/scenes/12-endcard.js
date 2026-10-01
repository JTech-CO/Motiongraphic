/* 12 END CARD — "다음 무한 루프는, / 여기서." (6 beats)
   A cyan-and-violet Julia (the OG image's composition) breathes on the right while c completes one orbit over the
   whole card. b2 draws the Loopfield orbit logo as construction lines; b3 types the domain Loopfield.studio;
   b4 sub-copy; b5 "Create your next infinite loop." with the version line and the final hit; b6 holds while the
   orbit closes and the HUD phase stops at 0.999 = (N−1)/N. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;

  const JX = 1580;
  const LOGO = { x: 124, y: 560, s: 132 / 64 }; // favicon geometry (64-unit box) scaled to 132 px
  const DUR = T.SLOTS[11].dur;

  SX.defineScene({
    id: 12,
    role: 'END CARD',
    bg: 'night',

    build(cam) {
      const st = {};
      st.domain = U.h('div', { class: 'domain', style: 'left:286px;top:572px;font-size:118px' });
      st.domainTxt = U.h('span');
      st.cursor = U.h('span', { class: 'cur' });
      st.domain.append(st.domainTxt, st.cursor);
      cam.appendChild(st.domain);
      st.sub = U.h('div', { class: 'subcopy', style: 'left:124px;top:742px;font-size:38px', text: `프리셋 ${D.releases[1].presets} · 레이어 ${D.layersMax} · 4K MP4 · 계정 없음` });
      st.og = U.h('div', { class: 'subcopy', style: 'left:124px;top:806px;font-size:46px', text: D.ogLine });
      st.ver = U.box(126, 884, 'mono', `${D.name.toUpperCase()} ${D.version} · ${D.license} · ${D.maker.toUpperCase()} · SNAPSHOT ${D.snapshot}`);
      cam.append(st.sub, st.og, st.ver);
      st.head = ui.headline(cam, { x: 120, y: 212, size: 116, lines: ['다음 무한 루프는,', '여기서.'], lineDelay: [null, 1.0] });
      return st;
    },

    update(st, lt) {
      st.head.update(lt, 0.02);
      const s = D.domain;
      const n = Math.floor(s.length * U.clamp((lt - 1.0) / 0.32));
      U.setText(st.domainTxt, s.slice(0, Math.max(0, n)));
      st.domain.style.opacity = lt >= 1.0 ? 1 : 0;
      const typing = n < s.length;
      st.cursor.style.opacity = lt < 1.0 ? 0 : typing || Math.floor(lt / T.E8) % 2 === 0 ? 1 : 0;
      const sub = ui.enter(lt, 1.5, 0.4);
      st.sub.style.opacity = sub.o.toFixed(3);
      st.sub.style.transform = `translate3d(0,${((1 - sub.e) * 24).toFixed(1)}px,0)`;
      ui.pop(st.og, lt, 2.0, { from: 0.9, dur: 0.4 });
      st.ver.style.opacity = U.clamp((lt - 2.0 - T.E8) * 6).toFixed(3);
    },

    draw(G, st, lt) {
      const zoom = 1 + 0.06 * E.inOutSine(U.prog(lt, 0, DUR));
      G.pattern('julia', {
        offset: [-(JX - 960) / 540 / zoom, 0],
        zoom,
        palette: 2,
        t: lt,
        loop: DUR,
        ramp: [1060, 1640, 0.06],
        params: { uOrbit: D.julia.orbit },
      });

      G.ink((ctx) => {
        const I = SX.ink;
        const k = LOGO.s;
        const ox = LOGO.x;
        const oy = LOGO.y;
        const a = U.clamp((lt - 0.5) * 8);
        if (a <= 0) return;
        I.box(ctx, ox + 1 * k, oy + 1 * k, 62 * k, 62 * k, 17 * k, C.ink, { stroke: '#364462', w: 2, alpha: a });
        const cx = ox + 32 * k;
        const cy = oy + 32 * k;
        const ell = (rot, color, p) => {
          if (p <= 0) return;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(U.rad(rot));
          ctx.globalAlpha = a;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.8 * k * 0.9;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.ellipse(0, 0, 24 * k, 11 * k, 0, 0, Math.PI * 2 * p);
          ctx.stroke();
          ctx.restore();
        };
        ell(-35, C.mint, E.outCubic(U.prog(lt, 0.5, 0.72)));
        ell(35, C.violet, E.outCubic(U.prog(lt, 0.6, 0.82)));
        I.circle(ctx, cx, cy, 6 * k, E.outCubic(U.prog(lt, 0.7, 0.88)), { color: C.paper, w: 2.8 * k * 0.9, alpha: a });
        // the small dot travels its orbit once over the card and ends where the favicon has it
        const d = E.outBack(U.prog(lt, 0.85, 1.0), 2);
        if (d > 0) {
          const home = Math.atan2(18.5 - 32, 51.5 - 32);
          const ang = home + Math.PI * 2 * E.inOutSine(U.prog(lt, 1.0, DUR));
          const r = Math.hypot(51.5 - 32, 18.5 - 32) * k;
          ctx.globalAlpha = a;
          ctx.fillStyle = '#a5fff0';
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 3.8 * k * d, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
  });
})((window.SX = window.SX || {}));
