/* 06 FEATURE — "슬라이더 하나에 / 모양이 바뀌고,"
   Paper. The rose preset's polar equation drawn as ink lines (same formula as Rhodonea garden) over a polar-lattice
   construction. The uPetals thumb steps on 16ths 2 → 12 and the curve follows (b1–b2), snaps back to the default 5
   (b3), then uRoses adds layers 2 → 5 (b4). Exit: domain warp into the Julia of scene 07. */
(function (SX) {
  'use strict';
  const { U, E, T, ui, C } = SX;
  const D = SX.DATA;
  const R0 = D.rose;

  const RC = { x: 1350, y: 470, s: 380 }; // rose centre and px per pattern unit
  const TRACK = { y: 900, x0: 640, x1: 1720 };
  SX.L.track = TRACK;
  const PET = { x0: 640, x1: 1300 };
  const ROS = { x0: 1400, x1: 1720 };
  const STEPS = [2, 3, 4, 5, 6, 8, 10, 12];

  // Same curve as the rose preset: radius = (.85 − k·.07) · |cos(a · uPetals + .16 sin(uAngle + k·.5))|, as ink lines
  const ROSE_INK = `
in vec2 vUV;
uniform vec4 uRect;
uniform float uPetals, uRoses, uReveal;
uniform vec3 uInk, uAccent;
out vec4 outColor;
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (2.0*(fc - uRect.xy) - uRect.zw)/uRect.w;
  float r = length(p), a = atan(p.y, p.x);
  float px = 2.0/uRect.w;
  float alpha = 0.0; vec3 col = uInk;
  for(int i = 0; i < 8; i++){
    if(float(i) >= uRoses) break;
    float k = float(i);
    float th = a*uPetals + .16*sin(uAngle + k*.5);
    float radius = (.85 - k*.07)*abs(cos(th));
    float d = r - radius;
    // analytic gradient (fwidth inside a loop with break is undefined on some drivers)
    float drda = (.85 - k*.07)*uPetals*sin(th)*sign(cos(th));
    float g = sqrt(1.0 + (drda*drda)/max(r*r, 1e-4));
    float line = clamp(1.6 - abs(d)/(px*g), 0.0, 1.0);
    float w = i == 0 ? 1.0 : 0.62 - k*0.07;
    if(line*w > alpha){ alpha = line*w; col = i == 0 ? uAccent : uInk; }
  }
  float sweep = mod(-a + PI*0.5, TAU)/TAU;
  alpha *= step(sweep, uReveal);
  outColor = vec4(col, alpha);
}`;

  function petalsAt(lt) {
    if (lt < 1.0) return STEPS[U.clamp(Math.floor(Math.max(0, lt) / T.E16), 0, 7)];
    return R0.petals[0];
  }
  function thumbAt(lt) {
    const v = lt < 1.0 ? STEPS[U.clamp(Math.floor(Math.max(0, lt) / T.E16), 0, 7)] : R0.petals[0];
    if (lt < 1.0) {
      const k = U.clamp(Math.floor(Math.max(0, lt) / T.E16), 0, 7);
      const prev = k ? STEPS[k - 1] : STEPS[0];
      return U.lerp(prev, v, E.outCubic(U.clamp((lt - k * T.E16) / 0.06)));
    }
    return U.lerp(12, v, E.spring(U.prog(lt, 1.0 - T.LEAD, 1.0 + 0.35)));
  }
  const rosesAt = (lt) => (lt < 1.5 ? R0.roses[1] : Math.min(R0.roses[0], R0.roses[1] + 1 + Math.floor((lt - 1.5) / T.E16)));

  SX.defineScene({
    id: 6,
    role: 'FEATURE',
    bg: 'paper',

    build(cam) {
      const st = {};
      st.range = ui.tag(cam, 124, 600, `uPetals ${R0.petals[1]}–${R0.petals[2]} · DEFAULT`, String(R0.petals[0]));
      st.syntax = U.box(124, 676, 'mono sm', D.sliderSyntax);
      st.syntax.style.textTransform = 'none';
      cam.appendChild(st.syntax);
      st.limit = ui.chip(cam, 124, 760, 'SLIDERS / LAYER', String(D.slidersPerLayer));
      st.cap = ui.caption(cam, { x: 120, y: 172, text: '@slider uPetals / RHODONEA GARDEN' });
      st.head = ui.headline(cam, { x: 120, y: 212, size: 116, lines: ['슬라이더 하나에', '모양이 바뀌고,'] });
      return st;
    },

    update(st, lt) {
      st.cap.update(lt, 0);
      st.head.update(lt, 0.02);
      ui.pop(st.range, lt, 1.0, { from: 0.6 });
      st.syntax.style.opacity = U.clamp((lt - 1.05) * 6).toFixed(3);
      ui.pop(st.limit, lt, 1.5, { from: 0.5 });
    },

    draw(G, st, lt) {
      G.ink((ctx) => {
        // polar lattice behind the rose
        const I = SX.ink;
        const col = { color: C.ink, w: 1, alpha: 0.14 };
        [0.33, 0.66, 1].forEach((k, i) => I.circle(ctx, RC.x, RC.y, RC.s * 0.85 * k, E.outCubic(U.prog(lt, i * 0.05, 0.4 + i * 0.05)), col));
        for (let s = 0; s < 24; s++) {
          const a = (s / 24) * Math.PI * 2;
          I.line(ctx, RC.x, RC.y, RC.x + Math.cos(a) * RC.s * 0.92, RC.y + Math.sin(a) * RC.s * 0.92, E.outCubic(U.prog(lt, 0.05, 0.4)), col);
        }
      });

      const h = G.size[1];
      const P = G.custom('rose-ink', ROSE_INK);
      const loop = 4;
      const ang = ((SX.gl.time / loop) % 1) * Math.PI * 2;
      G.pass(P, {
        uRect: [RC.x - 960, h - RC.y - RC.s, 1920, RC.s * 2],
        uPetals: petalsAt(lt),
        uRoses: rosesAt(lt),
        uReveal: E.outCubic(U.prog(lt, 0, 0.3)),
        uAngle: ang,
        uInk: SX.gl.rgb(C.ink),
        uAccent: SX.gl.rgb(C.violet),
      }, true);

      G.ink((ctx) => {
        const I = SX.ink;
        const a = U.clamp(lt * 8);
        // uPetals slider with integer ticks
        for (let v = R0.petals[1]; v <= R0.petals[2]; v++) {
          const x = U.lerp(PET.x0, PET.x1, (v - R0.petals[1]) / (R0.petals[2] - R0.petals[1]));
          I.line(ctx, x, TRACK.y + 12, x, TRACK.y + (v === R0.petals[0] ? 26 : 19), 1, { color: C.ink, w: 1.5, alpha: 0.5 * a });
        }
        I.slider(ctx, PET.x0, TRACK.y, PET.x1 - PET.x0, {
          label: 'uPetals', min: R0.petals[1], max: R0.petals[2], value: thumbAt(lt), shown: String(petalsAt(lt)),
          color: C.ink, accent: C.violet, bg: C.paper, alpha: a,
        });
        const ra = U.clamp((lt - 1.4) * 8);
        I.slider(ctx, ROS.x0, TRACK.y, ROS.x1 - ROS.x0, {
          label: 'uRoses', min: R0.roses[1], max: R0.roses[2], value: rosesAt(lt), shown: String(rosesAt(lt)),
          color: C.ink, accent: C.ink, bg: C.paper, alpha: 0.35 + 0.65 * ra,
        });
      });
    },
  });
})((window.SX = window.SX || {}));
