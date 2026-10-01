/* Construction-line kit for the 2D overlay that SX.gl.ink() composites into a scene: lines, circles, arcs and
   rectangles that draw on with a progress value p (0…1), plus mono labels and small UI mockup parts
   (slider, chip, palette swatches). Pure: every call draws from its arguments only. */
(function (SX) {
  'use strict';
  const { U } = SX;

  const MONO = "'SX Mono', 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace";
  const DISPLAY = "'SX Display', 'Pretendard Variable', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

  const ink = {};
  ink.MONO = MONO;
  ink.DISPLAY = DISPLAY;

  function style(ctx, o) {
    ctx.strokeStyle = o.color || SX.C.paper;
    ctx.lineWidth = o.w || 1.5;
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.lineCap = 'round';
    ctx.setLineDash(o.dash || []);
  }

  /** Line from (x1,y1) toward (x2,y2), drawn to fraction p */
  ink.line = (ctx, x1, y1, x2, y2, p = 1, o = {}) => {
    if (p <= 0) return;
    style(ctx, o);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(U.lerp(x1, x2, p), U.lerp(y1, y2, p));
    ctx.stroke();
  };

  /** Circle drawn as an arc sweeping from angle a0 (radians, clockwise on screen) */
  ink.circle = (ctx, cx, cy, r, p = 1, o = {}) => {
    if (p <= 0 || r <= 0) return;
    style(ctx, o);
    const a0 = o.a0 != null ? o.a0 : -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a0 + Math.PI * 2 * U.clamp(p));
    ctx.stroke();
  };

  /** Rectangle traced clockwise from its top-left corner */
  ink.rect = (ctx, x, y, w, h, p = 1, o = {}) => {
    if (p <= 0) return;
    style(ctx, o);
    const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
    const total = 2 * (w + h);
    let left = total * U.clamp(p);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const seg = Math.hypot(bx - ax, by - ay);
      const k = Math.min(1, left / seg);
      ctx.lineTo(U.lerp(ax, bx, k), U.lerp(ay, by, k));
      left -= seg;
    }
    ctx.stroke();
  };

  /** Crop / registration marks at the four corners of a box */
  ink.marks = (ctx, x, y, w, h, len = 14, o = {}) => {
    style(ctx, o);
    ctx.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]].forEach(([cx, cy, sx, sy]) => {
      ctx.moveTo(cx - sx * 6, cy);
      ctx.lineTo(cx - sx * (6 + len), cy);
      ctx.moveTo(cx, cy - sy * 6);
      ctx.lineTo(cx, cy - sy * (6 + len));
    });
    ctx.stroke();
  };

  /** Mono label (uppercase micro label by default) */
  ink.text = (ctx, str, x, y, o = {}) => {
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.fillStyle = o.color || SX.C.paper;
    ctx.font = `${o.weight || 400} ${o.size || 15}px ${o.font || MONO}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.track != null ? o.track : 0.14 * (o.size || 15)}px`;
    ctx.fillText(str, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };

  /** Loopfield-style slider row: label · track · thumb · value box */
  ink.slider = (ctx, x, y, w, o) => {
    const { label, min, max, value, color = SX.C.ink, accent = SX.C.violet, alpha = 1, shown } = o;
    const k = (value - min) / (max - min);
    ink.text(ctx, label, x, y - 16, { color, size: 15, alpha });
    ink.text(ctx, shown != null ? shown : String(value), x + w, y - 16, { color, size: 15, align: 'right', alpha, weight: 700 });
    ink.line(ctx, x, y, x + w, y, 1, { color, w: 3, alpha: alpha * 0.35 });
    ink.line(ctx, x, y, x + w * k, y, 1, { color: accent, w: 3, alpha });
    ctx.globalAlpha = alpha;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + w * k, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = o.bg || SX.C.night;
    ctx.stroke();
  };

  /** Three-colour palette chip (Loopfield palette swatch) */
  ink.swatch = (ctx, x, y, w, h, colors, o = {}) => {
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(x + (i * w) / 3, y, w / 3 + 0.5, h);
    });
    if (o.stroke) {
      ctx.strokeStyle = o.stroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    }
  };

  /** Filled rounded rectangle */
  ink.box = (ctx, x, y, w, h, r, fill, o = {}) => {
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (o.stroke) {
      ctx.setLineDash([]);
      ctx.strokeStyle = o.stroke;
      ctx.lineWidth = o.w || 1.5;
      ctx.stroke();
    }
  };

  SX.ink = ink;
})((window.SX = window.SX || {}));
