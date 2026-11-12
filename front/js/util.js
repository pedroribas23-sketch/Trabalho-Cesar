/* =========================================================
   KENNEDITO — utilidades
   ========================================================= */
'use strict';

const GAME_W = 640;
const GAME_H = 360;
const TAU = Math.PI * 2;

const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sign = (v) => (v < 0 ? -1 : 1);
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const approach = (value, target, step) => {
  if (value < target) return Math.min(value + step, target);
  return Math.max(value - step, target);
};

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function hash2(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return s - Math.floor(s);
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t) { return t * t * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return dist(cx, cy, nx, ny) <= r;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function fillRoundRect(ctx, x, y, w, h, r, fill) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
function strokeRoundRect(ctx, x, y, w, h, r, stroke, lw = 1) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function fmtTime(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}
function fmtTimeMs(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—';
  return fmtTime(Math.floor(ms / 1000));
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy - y + lineHeight;
}

function glowCircle(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function scanlines(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.restore();
}

function groundShadow(ctx, x, y, w, alpha = 0.3) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.22, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function bracketCorner(ctx, x, y, w, h, color, size = 14, lw = 1.5) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size);
  ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h);
  ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size);
  ctx.stroke();
  ctx.restore();
}

function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

function fillCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function strokeCircle(ctx, x, y, r, color, lw = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

/* =========================================================
   Texto no canvas.
   Por padrao usa a fonte bitmap 5x7 do jogo (pixelfont.js),
   que mantem a mesma gracao da arte. As funcoes do sistema
   continuam disponiveis para textos que exigem outra fonte.
   ========================================================= */

function drawPixelText(ctx, text, x, y, size, color, align = 'left', font = 'monospace') {
  // texto pequeno demais para a fonte bitmap: usa a fonte do sistema
  if (size < 5.5) {
    ctx.save();
    ctx.font = 'bold ' + size + 'px ' + font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }
  const scale = Math.max(1, Math.round(size / 7));
  drawBitmapText(ctx, text, x, y - (KC_FONT_H * scale) / 2, size, color, { align: align, scale: scale });
}

function drawOutlinedText(ctx, text, x, y, size, color, outline = '#000', align = 'center', font = 'monospace') {
  const scale = Math.max(1, Math.round(size / 7));
  drawBitmapText(ctx, text, x, y - (KC_FONT_H * scale) / 2, size, color, {
    align: align,
    scale: scale,
    outline: outline
  });
}

function hexToRgba(hex, alpha) {
  if (hex.startsWith('rgb')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

function safeStorageGet(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function safeStorageSet(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch (e) { /* armazenamento bloqueado */ }
}
