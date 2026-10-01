/* Scene-to-scene transitions, each built from the math of a library pattern (or an app feature) as a GLSL pass
   that reads the outgoing scene (uA) and the incoming scene (uB). Index k = transition from scene k+1 to k+2.
   lead = 5 frames before the beat; p reaches 1 on the last frame before the beat. The outgoing DOM text follows
   with a light CSS move (dom), the incoming DOM text lands on the beat (engine). Geometry that has to match a
   scene (prism centre, contact-sheet grid, palette wheel, slider track, Julia centre) comes from SX.L. */
(function (SX) {
  'use strict';
  const { U, E, T } = SX;
  const LEAD = T.frames(5);

  const HEAD = `
in vec2 vUV;
uniform sampler2D uA, uB;
uniform float uP;
uniform vec4 uK, uK2;
out vec4 outColor;
const vec2 R = vec2(1920.0, 1080.0);
vec3 A(vec2 uv){ return texture(uA, uv).rgb; }
vec3 B(vec2 uv){ return texture(uB, uv).rgb; }
// stage px (y down) <-> uv (y up)
vec2 toUV(vec2 s){ return vec2(s.x/R.x, 1.0 - s.y/R.y); }
vec2 stagePx(){ return vec2(vUV.x*R.x, (1.0 - vUV.y)*R.y); }
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
`;

  const GLSL = {
    // 01 → 02 · fractal zoom: scene 01 zooms ×64 into the cardioid itself; the prism grows out of the black it leaves
    zoom: `
void main(){
  vec3 a = A(vUV), b = B(vUV);
  float dark = 1.0 - smoothstep(0.03, 0.22, lum(a));
  float k = smoothstep(0.3, 1.0, uP);
  outColor = vec4(mix(a, b, clamp(dark*k + step(0.999, uP), 0.0, 1.0)), 1.0);
}`,

    // 02 → 03 · kaleido fold: angular fold 1 → 2 → 4 → 8 around the prism centre (uK.xy), then the contact-sheet
    // cells (uK2 = x, y, cell w, cell h; 8×4, gap uK.z) open from their centres onto scene 03
    kaleido: `
void main(){
  vec2 s = stagePx();
  vec2 d = s - uK.xy;
  float n = pow(2.0, floor(clamp(uP*4.0, 0.0, 3.0)));
  float seg = TAU/n;
  float a = atan(d.y, d.x);
  float r = length(d);
  float af = abs(mod(a + PI, seg) - seg*0.5);
  vec3 col = A(toUV(uK.xy + r*vec2(cos(af), sin(af))));
  float k = smoothstep(0.5, 1.0, uP);
  vec2 g = s - uK2.xy;
  vec2 pitch = uK2.zw + uK.z;
  vec2 cell = floor(g/pitch);
  vec2 f = g - cell*pitch - uK2.zw*0.5;
  bool inGrid = cell.x >= 0.0 && cell.y >= 0.0 && cell.x < 8.0 && cell.y < 4.0;
  bool open = inGrid && abs(f.x) < uK2.z*0.5*k && abs(f.y) < uK2.w*0.5*k;
  if(open || uP > 0.999) col = B(vUV);
  else if(k > 0.0 && !inGrid) col = mix(col, B(vUV), k);
  outColor = vec4(col, 1.0);
}`,

    // 03 → 04 · Truchet flip: quarter discs grow from a hashed corner of every tile, centre first; the arc front is a line
    truchet: `
void main(){
  vec2 s = stagePx();
  float size = 120.0;
  vec2 cell = floor(s/size), f = s/size - cell;
  float h = hash21(cell + 3.0);
  vec2 corner = vec2(h > 0.5 ? 1.0 : 0.0, fract(h*7.0) > 0.5 ? 1.0 : 0.0);
  float delay = 0.45*length((cell + 0.5)*size - R*0.5)/length(R*0.5);
  float q = smoothstep(delay, delay + 0.55, uP);
  float d = length(f - corner);
  vec3 col = d < q*1.42 ? B(vUV) : A(vUV);
  float line = 1.0 - smoothstep(0.0, 2.5/size, abs(d - q*1.42));
  col = mix(col, uK.rgb, line*step(0.001, q)*step(q, 0.999));
  outColor = vec4(uP > 0.999 ? B(vUV) : col, 1.0);
}`,

    // 04 → 05 · blend sweep: five bands cross the frame in Loopfield's blend order normal · screen · add · multiply · difference
    blend: `
void main(){
  float x = 1.0 - vUV.x;
  vec3 a = A(vUV), b = B(vUV), c = a;
  for(int k = 0; k < 5; k++){
    float front = uP*1.6 - float(k)*0.15;
    if(x < front){
      if(k == 0) c = b;
      if(k == 1) c = 1.0 - (1.0 - a)*(1.0 - b);
      if(k == 2) c = min(a + b, 1.0);
      if(k == 3) c = a*b;
      if(k == 4) c = abs(a - b);
    }
  }
  if(x < uP*1.6 - 0.75) c = b;
  float edge = 0.0;
  for(int k = 0; k < 5; k++) edge = max(edge, 1.0 - smoothstep(0.0, 0.0016, abs(x - (uP*1.6 - float(k)*0.15))));
  c = mix(c, uK.rgb, edge*0.9);
  outColor = vec4(uP > 0.999 ? b : c, 1.0);
}`,

    // 05 → 06 · polar unwrap: the palette wheel (centre uK.xy, radius uK.z) is read in polar coordinates and laid out as a
    // horizontal band that narrows onto the slider track of scene 06 (uK2 = track y, x0, x1)
    polar: `
void main(){
  vec2 s = stagePx();
  float m = smoothstep(0.0, 0.6, uP);
  float yb = mix(uK.y, uK2.x, smoothstep(0.3, 1.0, uP));
  float hh = mix(uK.z, 2.0, smoothstep(0.45, 1.0, uP));
  float u = (s.x - uK2.y)/(uK2.z - uK2.y);
  float v = (s.y - (yb - hh))/(2.0*hh);
  vec3 col;
  if(abs(s.y - yb) < hh && u >= 0.0 && u <= 1.0){
    float th = u*TAU - PI*0.5;
    vec2 src = uK.xy + v*uK.z*vec2(cos(th), sin(th));
    col = A(toUV(mix(s, src, m)));
  } else {
    col = mix(A(vUV), B(vUV), m);
  }
  outColor = vec4(uP > 0.999 ? B(vUV) : col, 1.0);
}`,

    // 06 → 07 · domain warp: fbm-displaced coordinates melt the line art; the Julia comes through where the field rises
    warp: `
void main(){
  vec2 q = vUV*vec2(3.6, 2.0);
  vec2 w = vec2(fbm(q + 1.7), fbm(q + vec2(5.2, 1.3))) - 0.5;
  vec3 a = A(vUV + w*0.22*uP);
  vec3 b = B(vUV - w*0.22*(1.0 - uP));
  float field = fbm(q*1.4 + w*2.0);
  float mask = smoothstep(field - 0.06, field + 0.06, uP*1.25 - 0.1);
  outColor = vec4(uP > 0.999 ? B(vUV) : mix(a, b, mask), 1.0);
}`,

    // 07 → 08 · log-spiral twirl around the Julia centre (uK.xy): one full turn, strongest at the centre, then unwinding
    twirl: `
void main(){
  vec2 s = stagePx();
  vec2 d = s - uK.xy;
  float r = length(d)/R.y;
  float fall = 1.0/(1.0 + 2.6*r);
  float e = uP*uP*(3.0 - 2.0*uP);
  vec2 da = rotate(TAU*e*fall*fall)*d;
  vec2 db = rotate(-TAU*(1.0 - e)*fall*fall)*d;
  float mask = smoothstep(0.35, 0.9, uP + 0.25*(1.0 - fall));
  vec3 col = mix(A(toUV(uK.xy + da)), B(toUV(uK.xy + db)), mask);
  outColor = vec4(uP > 0.999 ? B(vUV) : col, 1.0);
}`,

    // 08 → 09 · resolution step: the output frame coarsens into 64 px blocks, the next scene refines from 64 px back to 1
    pixel: `
void main(){
  vec2 s = stagePx();
  bool first = uP < 0.5;
  float k = first ? uP/0.5 : (1.0 - uP)/0.5;
  float size = floor(mix(1.0, 64.0, k*k));
  vec2 c = (floor(s/size) + 0.5)*size;
  vec2 uv = size <= 1.0 ? vUV : toUV(c);
  outColor = vec4(first ? A(uv) : B(uv), 1.0);
}`,

    // 09 → 10 · Voronoi shatter: jittered cells shrink and drift outward one by one, revealing the next scene
    voronoi: `
vec2 site(vec2 c){ return c + 0.5 + 0.38*(vec2(hash21(c + 11.0), hash21(c + 37.0)) - 0.5); }
void main(){
  vec2 s = stagePx();
  float size = 150.0;
  vec2 g = s/size, cell = floor(g);
  vec3 col = B(vUV);
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
    vec2 cj = cell + vec2(float(i), float(j));
    vec2 sj = site(cj);
    float delay = 0.35*hash21(cj + 5.0);
    float q = smoothstep(delay, delay + 0.6, uP);
    float sc = 1.0 - q;
    if(sc <= 0.001) continue;
    vec2 dir = normalize(sj*size - R*0.5 + 0.001);
    vec2 off = dir*q*(160.0/size);
    vec2 y = sj + (g - sj - off)/sc;
    vec2 yc = floor(y);
    float best = 1e9; vec2 bc = vec2(0);
    for(int b = -1; b <= 1; b++) for(int a = -1; a <= 1; a++){
      vec2 ck = yc + vec2(float(a), float(b));
      float dd = length(site(ck) - y);
      if(dd < best){ best = dd; bc = ck; }
    }
    if(bc == cj) col = A(toUV(y*size));
  }
  outColor = vec4(uP > 0.999 ? B(vUV) : col, 1.0);
}`,

    // 10 → 11 · hexagonal pulse: hex cells flip around their vertical axis, from the centre outward
    hex: `
float hexd(vec2 f){ f = abs(f); return max(f.x*0.8660254 + f.y*0.5, f.y); }
void main(){
  vec2 s = stagePx();
  float size = 74.0;
  vec2 q = s/size, tile = vec2(1.7320508, 1.0)*1.0;
  vec2 a = mod(q, tile) - tile*0.5, b = mod(q - tile*0.5, tile) - tile*0.5;
  vec2 f = dot(a, a) < dot(b, b) ? a : b;
  vec2 c = (q - f)*size;
  float delay = 0.5*length(c - R*0.5)/length(R*0.5);
  float k = smoothstep(delay, delay + 0.5, uP);
  float sx = cos(PI*k);
  vec3 col = uK.rgb;
  if(abs(sx) > 0.02){
    vec2 g = vec2(f.x/abs(sx), f.y);
    if(hexd(g) < 0.5 - 0.03){
      vec2 uv = toUV(c + g*size);
      col = k < 0.5 ? A(uv) : B(uv);
    }
  }
  outColor = vec4(uP > 0.999 ? B(vUV) : col, 1.0);
}`,

    // 11 → 12 · Sierpinski subdivision: one triangle level per frame, every removed triangle opens onto the end card
    sierpinski: `
void main(){
  vec2 s = stagePx();
  vec2 p = vec2((s.x - 960.0)/1300.0, (1250.0 - s.y)/1300.0);
  vec2 q = vec2((p.x + 1.0)*0.5, p.y/1.7320508*1.0);
  q.x -= q.y*0.5;
  bool hole = false;
  float depth = floor(uP*6.0) + 1.0;
  for(int i = 0; i < 7; i++){
    if(float(i) >= depth) break;
    q *= 2.0;
    if(q.x < 1.0 && q.y < 1.0 && q.x + q.y > 1.0){ hole = true; break; }
    q = fract(q);
  }
  outColor = vec4(hole || uP > 0.999 ? B(vUV) : A(vUV), 1.0);
}`,
  };

  const progs = {};
  const program = (name) => progs[name] || (progs[name] = SX.gl.custom('tr:' + name, HEAD + GLSL[name]));
  const COPY = `
in vec2 vUV;
uniform sampler2D uA;
out vec4 outColor;
void main(){ outColor = vec4(texture(uA, vUV).rgb, 1.0); }`;

  const rgb4 = (hex) => SX.gl.rgb(hex).concat(1);
  const fade = (p, out, extra = '') => {
    out.root.style.opacity = (1 - U.clamp((p - 0.15) / 0.55)).toFixed(3);
    if (extra) out.root.style.transform = extra;
  };

  const mk = (glsl, uniforms, dom) => ({ lead: LEAD, glsl, uniforms, dom });

  SX.transitions = {
    list: [
      mk('zoom', () => ({}), (p, out) => {
        const z = SX.L.zoomTarget || [960, 540];
        out.root.style.transformOrigin = `${z[0]}px ${z[1]}px`;
        fade(p, out, `scale(${(1 + 2.5 * E.inExpo(p)).toFixed(4)})`);
      }), //                                                                01 → 02
      mk('kaleido', () => {
        const g = SX.L.grid;
        return { uK: [SX.L.prism.cx, SX.L.prism.cy, g.gap, 0], uK2: [g.x, g.y, g.w, g.h] };
      }, (p, out) => fade(p, out)), //                                       02 → 03
      mk('truchet', () => ({ uK: rgb4(SX.C.violet) }), (p, out) => fade(p, out)), // 03 → 04
      mk('blend', () => ({ uK: rgb4(SX.C.paper) }), (p, out) => fade(p, out, `translate3d(${(-120 * p).toFixed(1)}px,0,0)`)), // 04 → 05
      mk('polar', () => {
        const w = SX.L.wheel;
        const k = SX.L.track;
        return { uK: [w.cx, w.cy, w.r, 0], uK2: [k.y, k.x0, k.x1, 0] };
      }, (p, out) => fade(p, out)), //                                       05 → 06
      mk('warp', () => ({}), (p, out) => {
        fade(p, out);
        out.root.style.filter = `blur(${(6 * p).toFixed(1)}px)`;
      }), //                                                                 06 → 07
      mk('twirl', () => ({ uK: [SX.L.julia.cx, SX.L.julia.cy, 0, 0] }), (p, out) => {
        out.root.style.transformOrigin = `${SX.L.julia.cx}px ${SX.L.julia.cy}px`;
        fade(p, out, `rotate(${(40 * E.inCubic(p)).toFixed(2)}deg)`);
      }), //                                                                 07 → 08
      mk('pixel', () => ({}), (p, out) => fade(p, out)), //                  08 → 09
      mk('voronoi', () => ({}), (p, out) => fade(p, out, `scale(${(1 - 0.08 * p).toFixed(4)})`)), // 09 → 10
      mk('hex', () => ({ uK: rgb4(SX.C.night) }), (p, out) => fade(p, out)), // 10 → 11
      mk('sierpinski', () => ({}), (p, out) => fade(p, out)), //             11 → 12
    ],

    init() {
      if (!SX.gl.ok) return;
      Object.keys(GLSL).forEach(program);
      progs.copy = SX.gl.custom('copy', COPY);
    },

    /** Put the frame on the canvas: plain copy of target A, or the transition pass over A and B */
    present(tr, p) {
      const A = SX.gl.target('A');
      if (!tr) {
        SX.gl.pass(progs.copy, { uA: { tex: A.tex } });
        return;
      }
      const B = SX.gl.target('B');
      const u = Object.assign({ uK: [0, 0, 0, 0], uK2: [0, 0, 0, 0] }, tr.uniforms());
      SX.gl.pass(program(tr.glsl), Object.assign({ uA: { tex: A.tex }, uB: { tex: B.tex }, uP: p }, u));
    },
  };
})((window.SX = window.SX || {}));
