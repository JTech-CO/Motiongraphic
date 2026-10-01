/* WebGL 2 renderer: runs the Loopfield preset shaders inside the motion graphic.
   The shared GLSL header and the pattern() entry point follow the Loopfield GLSL API v1 (dataset §6), so preset
   sources from js/fx/presets.js compile unchanged. Scenes draw into an offscreen target ('A', or 'B' for the
   incoming scene); transitions.js composites the two targets onto the canvas. Everything is driven by t. */
(function (SX) {
  'use strict';
  const { U, T } = SX;
  const W = T.W;
  const H = T.H;

  // Loopfield GLSL API v1 header (uniform names, palette(), hash21, noise2, fbm, stroke) — Loopfield Studio, MIT
  const COMMON = `
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uLoop, uAngle, uTime, uDuration, uZoom, uRotation, uSeed, uHue;
uniform int uFrame;
uniform vec2 uCycle, uOffset;
uniform vec3 uColorA, uColorB, uColorC;
#define PI 3.14159265358979323846
#define TAU 6.28318530717958647692
mat2 rotate(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
vec3 palette(float t) {
  vec3 w = pow(0.5 + 0.5 * cos(TAU * (t + uHue + vec3(0.0, 0.3333333, 0.6666667))), vec3(2.0));
  return (uColorA*w.x + uColorB*w.y + uColorC*w.z) / max(0.0001,w.x+w.y+w.z);
}
float hash21(vec2 p) {
  vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z);
}
float noise2(vec2 p) {
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.0),f.x),f.y);
}
float fbm(vec2 p) {
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*noise2(p);p=rotate(.53)*p*2.03+7.1;a*=.5;}
  return v;
}
float stroke(float d,float width){return 1.0-smoothstep(width,width+max(fwidth(d),0.001),abs(d));}
`;

  const VERT = `#version 300 es
precision highp float;
out vec2 vUV;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUV = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  // Pattern entry: frame rect, circle / sector / rect clip, gain ramp, duotone (ink lines on a light background)
  const PATTERN_MAIN = `
uniform vec4 uRect;
uniform vec4 uCircle;
uniform vec3 uSector;
uniform float uGain, uAlpha;
uniform vec4 uRamp;
uniform vec4 uDuoBg;
uniform vec4 uDuoInk;
out vec4 outColor;
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (2.0*(fc-uRect.xy)-uRect.zw)/uRect.w;
  p = rotate(uRotation)*p/uZoom + uOffset;
  vec3 c = pattern(p);
  if(any(isnan(c))||any(isinf(c))) c = vec3(0);
  c = clamp(c*uGain, 0.0, 1.0);
  float a = uAlpha;
  if(uCircle.z > 0.0){
    vec2 d = fc - uCircle.xy; float r = length(d);
    a *= clamp((uCircle.z - r)/max(uCircle.w, 1.0) + 0.5, 0.0, 1.0);
    if(uSector.z > 0.0){
      float span = uSector.y - uSector.x;
      float rel = mod(atan(-d.y, d.x) - uSector.x, TAU);
      float edge = min(rel, span - rel);
      a *= rel <= span ? clamp(edge*r + 0.5, 0.0, 1.0) : 0.0;
    }
  }
  if(uRamp.w > 0.0) c *= mix(uRamp.z, 1.0, smoothstep(uRamp.x, uRamp.y, fc.x));
  if(uDuoBg.a > 0.0){
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(uDuoBg.rgb, uDuoInk.rgb, clamp(l*uDuoInk.a, 0.0, 1.0));
  }
  outColor = vec4(c, a);
}`;

  const TEX_VERT = `#version 300 es
precision highp float;
in vec4 aPos;
in vec2 aUV;
out vec2 vUV;
void main(){ vUV = aUV; gl_Position = aPos; }`;

  const TEX_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uAlpha;
uniform float uPremul;
out vec4 outColor;
void main(){
  vec4 c = texture(uTex, vUV);
  outColor = uPremul > 0.5 ? c*uAlpha : vec4(c.rgb, c.a*uAlpha);
}`;

  // Loopfield layer composite (dataset §1 F03 blend modes) — same formulas as the app
  const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uBase, uLayer;
uniform float uOpacity;
uniform int uBlend;
out vec4 outColor;
void main(){
  vec3 a=texture(uBase,vUV).rgb; vec4 s=texture(uLayer,vUV); vec3 b=s.rgb;
  vec3 c=b;
  if(uBlend==1)c=1.0-(1.0-a)*(1.0-b);
  if(uBlend==2)c=a+b;
  if(uBlend==3)c=a*b;
  if(uBlend==4)c=abs(a-b);
  outColor=vec4(clamp(mix(a,c,uOpacity*s.a),0.0,1.0),1.0);
}`;

  const DIFF = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uA, uB;
out vec4 outColor;
void main(){ outColor = vec4(abs(texture(uA,vUV).rgb - texture(uB,vUV).rgb), 1.0); }`;

  let gl = null;
  let canvas = null;
  const progs = {};
  const targets = {};
  let cur = null; // current target (null = canvas)
  let quadBuf = null;
  let inkCanvas = null;
  let inkCtx = null;
  let inkTex = null;
  let now = 0;

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').slice(0, 4).join('\n'));
    return s;
  }

  function program(vert, frag) {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vert));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.bindAttribLocation(p, 1, 'aUV');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const loc = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const u = gl.getActiveUniform(p, i);
      loc[u.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, u.name);
    }
    return { p, loc };
  }

  /** @slider lines → [{ name, value }] (Loopfield slider syntax, dataset §1 F06) */
  function sliders(code) {
    const out = [];
    code.split('\n').forEach((line) => {
      const m = line.match(/^\s*\/\/\s*@slider\s+([a-zA-Z_]\w*)\s+([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)/);
      if (m) out.push({ name: m[1], min: +m[2], max: +m[3], value: +m[5] });
    });
    return out;
  }

  function patternProgram(id) {
    const key = 'pat:' + id;
    if (progs[key]) return progs[key];
    const pr = SX.presets.byId(id);
    const sl = sliders(pr.code);
    const frag = `#version 300 es\n${COMMON}\n${sl.map((s) => `uniform float ${s.name};`).join('\n')}\n${pr.code}\n${PATTERN_MAIN}`;
    const P = program(VERT, frag);
    P.preset = pr;
    P.sliders = sl;
    progs[key] = P;
    return P;
  }

  /** Custom fragment (transitions, ink-line shaders): COMMON header + body, full-screen triangle */
  function custom(key, body) {
    if (!progs[key]) progs[key] = program(VERT, `#version 300 es\n${COMMON}\n${body}`);
    return progs[key];
  }

  function target(name, w = W, h = H) {
    if (targets[name]) return targets[name];
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    targets[name] = { name, fb, tex, w, h };
    return targets[name];
  }

  function bind(t) {
    cur = t;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fb : null);
    const w = t ? t.w : W;
    const h = t ? t.h : H;
    gl.viewport(0, 0, w, h);
    gl.disable(gl.SCISSOR_TEST);
  }
  const tw = () => (cur ? cur.w : W);
  const th = () => (cur ? cur.h : H);

  function clear(hex, a = 1) {
    const c = Array.isArray(hex) ? hex : rgb(hex);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(c[0], c[1], c[2], a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Draw a textured quad. pts: 4 corners [x, y, w?] in target px (top-left, top-right, bottom-right, bottom-left) */
  function quad(tex, pts, alpha = 1, premul = false) {
    const P = progs.tex || (progs.tex = program(TEX_VERT, TEX_FRAG));
    gl.useProgram(P.p);
    const uv = [[0, 1], [1, 1], [1, 0], [0, 0]];
    const order = [0, 1, 3, 2]; // triangle strip
    const data = new Float32Array(order.length * 6);
    order.forEach((k, i) => {
      const [x, y, w = 1] = pts[k];
      data.set([(x / tw()) * 2 - 1, 1 - (y / th()) * 2, 0, 1, uv[k][0], uv[k][1]], i * 6);
      data[i * 6] *= w;
      data[i * 6 + 1] *= w;
      data[i * 6 + 3] = w;
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(P.loc.uTex, 0);
    gl.uniform1f(P.loc.uAlpha, alpha);
    gl.uniform1f(P.loc.uPremul, premul ? 1 : 0);
    gl.enable(gl.BLEND);
    if (premul) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disable(gl.BLEND);
  }

  /** Full-target pass of a custom program; uniforms: { name: number | [..] | {tex, unit} } */
  function pass(P, uniforms = {}, blend = false) {
    gl.useProgram(P.p);
    let unit = 0;
    for (const k in uniforms) {
      const v = uniforms[k];
      const l = P.loc[k];
      if (l == null) continue;
      if (v && v.tex) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v.tex);
        gl.uniform1i(l, unit++);
      } else if (typeof v === 'number') gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2fv(l, v);
      else if (v.length === 3) gl.uniform3fv(l, v);
      else gl.uniform4fv(l, v);
    }
    if (P.loc.uResolution) gl.uniform2f(P.loc.uResolution, tw(), th());
    if (blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }

  /**
   * Draw a Loopfield preset.
   * o = { rect [x,y,w,h] (pattern frame, target px), clip [x,y,w,h], circle [cx,cy,r,feather], sector [a0,a1] (radians,
   *       clockwise from +x on screen), loop (s per cycle), phase, zoom, rot (deg), offset [x,y], palette | colors, hue,
   *       params {}, gain, alpha, ramp [x0,x1,min], duo [bgHex, inkHex, gain] }
   */
  function pattern(id, o = {}) {
    const P = patternProgram(id);
    const pr = P.preset;
    const L = P.loc;
    gl.useProgram(P.p);
    const h = th();
    const r = o.rect || [0, 0, tw(), h];
    gl.uniform4f(L.uRect, r[0], h - r[1] - r[3], r[2], r[3]);
    gl.uniform2f(L.uResolution, r[2], r[3]);
    const loop = o.loop || 4;
    const ph = U.mod((o.t != null ? o.t : now) / loop + (o.phase || 0), 1);
    gl.uniform1f(L.uLoop, ph);
    gl.uniform1f(L.uAngle, ph * Math.PI * 2);
    gl.uniform2f(L.uCycle, Math.cos(ph * Math.PI * 2), Math.sin(ph * Math.PI * 2));
    if (L.uTime) gl.uniform1f(L.uTime, ph * loop);
    if (L.uDuration) gl.uniform1f(L.uDuration, loop);
    gl.uniform1f(L.uZoom, (o.zoom || 1) * pr.zoom);
    gl.uniform1f(L.uRotation, ((o.rot || 0) * Math.PI) / 180);
    gl.uniform2fv(L.uOffset, o.offset || [0, 0]);
    if (L.uSeed) gl.uniform1f(L.uSeed, o.seed != null ? o.seed : 3);
    gl.uniform1f(L.uHue, o.hue || 0);
    const cols = o.colors || SX.presets.palettes[o.palette != null ? o.palette : pr.palette];
    gl.uniform3fv(L.uColorA, rgb(cols[0]));
    gl.uniform3fv(L.uColorB, rgb(cols[1]));
    gl.uniform3fv(L.uColorC, rgb(cols[2]));
    P.sliders.forEach((s) => {
      const v = o.params && o.params[s.name] != null ? o.params[s.name] : s.value;
      gl.uniform1f(L[s.name], v);
    });
    gl.uniform1f(L.uGain, o.gain != null ? o.gain : 1);
    gl.uniform1f(L.uAlpha, o.alpha != null ? o.alpha : 1);
    const c = o.circle;
    gl.uniform4f(L.uCircle, c ? c[0] : 0, c ? h - c[1] : 0, c ? c[2] : 0, c ? c[3] || 1.5 : 1);
    gl.uniform3f(L.uSector, o.sector ? o.sector[0] : 0, o.sector ? o.sector[1] : 0, o.sector ? 1 : 0);
    gl.uniform4f(L.uRamp, o.ramp ? o.ramp[0] : 0, o.ramp ? o.ramp[1] : 0, o.ramp ? o.ramp[2] : 1, o.ramp ? 1 : 0);
    if (o.duo) {
      const b = rgb(o.duo[0]);
      const k = rgb(o.duo[1]);
      gl.uniform4f(L.uDuoBg, b[0], b[1], b[2], 1);
      gl.uniform4f(L.uDuoInk, k[0], k[1], k[2], o.duo[2] || 1.5);
    } else gl.uniform4f(L.uDuoBg, 0, 0, 0, 0);
    const clip = o.clip || r;
    gl.enable(gl.SCISSOR_TEST);
    const x0 = Math.max(0, Math.floor(clip[0]));
    const y0 = Math.max(0, Math.floor(h - clip[1] - clip[3]));
    gl.scissor(x0, y0, Math.max(0, Math.ceil(clip[0] + clip[2]) - x0), Math.max(0, Math.ceil(h - clip[1]) - y0));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  }

  /** 2D canvas overlay (line art, construction lines, UI mockups) composited into the current target */
  function ink(draw) {
    inkCtx.setTransform(1, 0, 0, 1, 0, 0);
    inkCtx.clearRect(0, 0, W, H);
    inkCtx.save();
    draw(inkCtx);
    inkCtx.restore();
    gl.bindTexture(gl.TEXTURE_2D, inkTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inkCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    quad(inkTex, [[0, 0], [tw(), 0], [tw(), th()], [0, th()]], 1, true);
  }

  /** Layer composite with Loopfield's blend formulas into target `into` (base + layer → into) */
  function composite(into, base, layer, opacity, blend) {
    const P = progs.comp || (progs.comp = program(VERT, COMPOSITE));
    bind(into);
    gl.useProgram(P.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, base.tex);
    gl.uniform1i(P.loc.uBase, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, layer.tex);
    gl.uniform1i(P.loc.uLayer, 1);
    gl.uniform1f(P.loc.uOpacity, opacity);
    gl.uniform1i(P.loc.uBlend, ['normal', 'screen', 'add', 'multiply', 'difference'].indexOf(blend));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function difference(into, a, b) {
    const P = progs.diff || (progs.diff = program(VERT, DIFF));
    bind(into);
    pass(P, { uA: { tex: a.tex }, uB: { tex: b.tex } });
  }

  SX.gl = {
    COMMON,
    rgb,
    get ok() {
      return !!gl;
    },
    init(cv) {
      canvas = cv;
      gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false, premultipliedAlpha: false });
      if (!gl) return false;
      gl.getExtension('EXT_color_buffer_float');
      quadBuf = gl.createBuffer();
      inkCanvas = document.createElement('canvas');
      inkCanvas.width = W;
      inkCanvas.height = H;
      inkCtx = inkCanvas.getContext('2d');
      inkTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, inkTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      target('A');
      target('B');
      return true;
    },
    /** Compile every preset up front so the first seek is not a stall */
    warm() {
      SX.presets.list.forEach((p) => patternProgram(p.id));
    },
    set time(t) {
      now = t;
    },
    get time() {
      return now;
    },
    target,
    bind,
    clear,
    pattern,
    ink,
    quad,
    pass,
    custom,
    composite,
    difference,
    sliders,
    get size() {
      return [tw(), th()];
    },
  };
})((window.SX = window.SX || {}));
