// Shared toolkit for Nordvra ads: palette (live site tokens), Figtree, logo, layout, text motion,
// price cards, colour-band scenes and the standard end card. Every helper is a pure function of t.
import { clamp, spring, track } from '../../lib/motion.js';
import { ICONS } from '../../lib/icons.js';
export { clamp, spring, track };

export const C = {
  canvas: '#FAF7F2', surface: '#FFFFFF', muted2: '#F2EDE4', ink: '#1A2420', muted: '#4D5853',
  brand: '#0B5D4B', brandStrong: '#084536', brandSoft: '#E1EFE9', border: '#DDD5C8',
  rut: '#0E5A5E', rutSoft: '#DCEFEF', rot: '#9C4221', rotSoft: '#FBE9DD',
  warnSoft: '#FCF1D8', success: '#1D6B3B', danger: '#A3232A', dangerSoft: '#FCEBEC', white: '#FFFFFF',
};
export const PHONE = '072-222 88 00';

const asset = (p) => new URL(p, import.meta.url).href;
for (const [file, range] of [['Figtree-latin.woff2', undefined], ['Figtree-latin-ext.woff2', 'U+0100-024F, U+1E00-1EFF']]) {
  const f = new FontFace('Figtree', `url(${asset('../../assets/fonts/' + file)})`, { weight: '300 900', ...(range && { unicodeRange: range }) });
  document.fonts.add(await f.load());
}
await Promise.all(['900', '800', '700', '600', '500'].map((w) => document.fonts.load(`${w} 40px Figtree`, 'åäöÅÄÖ–')));

export const c = document.getElementById('c');
export const g = c.getContext('2d');
c.width = innerWidth; c.height = innerHeight;
export const W = c.width, H = c.height, S = W / 1080;
export const vertical = H / W > 1.5;
// Reels covers the top 14 % and bottom 35 % of a 9:16 frame; the 4:5 feed has no overlay.
export const TOP = vertical ? 0.14 * H : 0.06 * H, BOTTOM = vertical ? 0.65 * H : 0.94 * H;
export const X = 72 * S, CW = W - 2 * X;

export const load = (src) => { const i = new Image(); i.src = src; return i.decode().then(() => i); };
export const LOGO = await load(asset('../../assets/logo.png'));

export const sUI = (t) => spring(t, 260, 22), sType = (t) => spring(t, 170, 26);
export const sWipe = (t) => spring(t, 180, 27), sCalm = (t) => spring(t, 90, 19);
export const lerp = (a, b, k) => a + (b - a) * k;
export const font = (w, px) => `${w} ${px * S}px Figtree`;
export function mix(h1, h2, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(h1), b = p(h2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], clamp(k)))).join(',')})`;
}

export function rrect(x, y, w, h, r, fill, stroke, lw = 3 * S) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
}

export function wrap(text, maxW) {
  const words = text.split(' '), out = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
  }
  return [...out, line];
}

// Largest size up to `px` at which `text` fits `maxW` on one line.
export function fit(text, weight, px, maxW) {
  g.font = font(weight, px);
  const w = g.measureText(text).width;
  return w > maxW ? px * maxW / w : px;
}

// Lines slide up out of a mask and leave the same way. Returns the y below the block.
export function lines(t, list, tIn, tOut, y, px, color, weight = 800, lh = 1.06, x0 = X, ease = sType) {
  g.font = font(weight, px); g.fillStyle = color; g.textBaseline = 'top';
  const h = px * S * lh;
  list.forEach((line, i) => {
    const e = ease(t - (tIn + i * 0.07)), x = tOut == null ? 0 : ease(t - (tOut + i * 0.04));
    if (e <= 0 || x >= 1) return;
    const top = y + i * h;
    g.save(); g.beginPath(); g.rect(0, top - h * 0.12, W, h * 1.32); g.clip();
    g.fillText(line, x0, top + (1 - e) * h * 1.4 - x * h * 1.4);
    g.restore();
  });
  return y + list.length * h;
}

// A paragraph: wrapped to `maxW`, then animated like `lines`.
export function para(t, text, tIn, tOut, y, px, color, weight = 800, maxW = CW, lh = 1.06, x0 = X, ease = sType) {
  g.font = font(weight, px);
  return lines(t, wrap(text, maxW), tIn, tOut, y, px, color, weight, lh, x0, ease);
}

const ICON = {};
for (const [name, svg] of Object.entries(ICONS)) {
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`, 'image/svg+xml');
  ICON[name] = [...doc.documentElement.children].map((el) => {
    const a = (k) => Number(el.getAttribute(k) || 0), p = new Path2D();
    if (el.tagName === 'path') p.addPath(new Path2D(el.getAttribute('d')));
    else if (el.tagName === 'rect') p.roundRect(a('x'), a('y'), a('width'), a('height'), a('rx'));
    else if (el.tagName === 'circle') p.arc(a('cx'), a('cy'), a('r'), 0, Math.PI * 2);
    else if (el.tagName === 'line') { p.moveTo(a('x1'), a('y1')); p.lineTo(a('x2'), a('y2')); }
    return p;
  });
}
export function icon(name, x, y, size, color, lw = 2.25) {
  g.save(); g.translate(x, y); g.scale(size / 24, size / 24);
  g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color;
  ICON[name].forEach((p) => g.stroke(p));
  g.restore();
}

// Check mark drawn on as k goes 0 → 1.
export function check(x, y, size, k, color, lw = 3) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(size / 24, size / 24);
  g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color;
  const len = 12 * Math.SQRT2;
  g.setLineDash([len * clamp(k), len]);
  g.beginPath(); g.moveTo(6, 12.5); g.lineTo(10, 16.5); g.lineTo(18, 8.5); g.stroke();
  g.restore();
}

export function arrow(x, y, size, color) {
  g.strokeStyle = color; g.lineWidth = size * 0.13; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + size, y);
  g.moveTo(x + size * 0.6, y - size * 0.4); g.lineTo(x + size, y); g.lineTo(x + size * 0.6, y + size * 0.4); g.stroke();
}

// A live price card screenshot, scaled to `w`, springing up into place. Returns its height.
export function card(img, x, y, w, k, rot = 0, push = 1) {
  const h = w * img.height / img.width;
  if (k <= 0) return h;
  g.save();
  g.translate(x + w / 2, y + h / 2 + (1 - k) * 200 * S);
  g.rotate((rot + (1 - k) * 5) * Math.PI / 180);
  g.scale(lerp(0.9, 1, k) * push, lerp(0.9, 1, k) * push);
  g.shadowColor = 'rgba(26,36,32,0.16)'; g.shadowBlur = 36 * S; g.shadowOffsetY = 14 * S;
  rrect(-w / 2, -h / 2, w, h, 26 * S, C.surface);
  g.shadowColor = 'transparent';
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 26 * S); g.clip();
  g.drawImage(img, -w / 2, -h / 2, w, h);
  g.restore();
  rrect(x, y, w, h, 26 * S, null, k >= 0.999 ? C.border : null, 2 * S);
  return h;
}

// A CC0 photo in a rounded frame with a slow push-in.
export function photo(img, rect, k, push = 1, fx = 0.5, fy = 0.5) {
  if (k <= 0) return;
  const { x, y, w, h } = rect, r = 30 * S;
  g.save();
  g.translate(x + w / 2, y + h / 2 + (1 - k) * 160 * S); g.scale(lerp(0.92, 1, k), lerp(0.92, 1, k)); g.translate(-(x + w / 2), -(y + h / 2));
  g.beginPath(); g.roundRect(x, y, w, h, r); g.clip();
  const s = Math.max(w / img.width, h / img.height) * push, iw = img.width * s, ih = img.height * s;
  g.filter = 'saturate(0.92) contrast(1.04)';
  g.drawImage(img, x + clamp(w / 2 - fx * iw, w - iw, 0), y + clamp(h / 2 - fy * ih, h - ih, 0), iw, ih);
  g.restore();
}

export function chip(text, x, y, k, fill = C.brandSoft, color = C.brandStrong, px = 36) {
  g.font = font(600, px);
  const w = g.measureText(text).width + 60 * S, h = px * S * 1.9;
  if (k > 0) {
    g.save(); g.translate(x + w / 2, y + h / 2); g.scale(k, k); g.translate(-(x + w / 2), -(y + h / 2));
    rrect(x, y, w, h, h / 2, fill);
    g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, x + 30 * S, y + h / 2);
    g.restore();
  }
  return w;
}

// Scenes: each owns a colour band that rises from the bottom over the one before.
export function bands(t, scenes, lead = 0.3) {
  g.filter = 'none';
  g.fillStyle = scenes[0].bg; g.fillRect(0, 0, W, H);
  scenes.forEach((sc, i) => {
    const next = scenes[i + 1];
    if (t < sc.start - lead || (next && t > next.start + 0.6)) return;
    const k = i === 0 ? 1 : sWipe(t - (sc.start - lead));
    const top = H * (1 - k), r = 90 * S * (1 - k);
    g.save();
    g.beginPath(); g.roundRect(0, top, W, H - top + r, [r, r, 0, 0]); g.fillStyle = sc.bg; g.fill();
    g.clip();
    sc.draw(t, sc.start);
    g.restore();
  });
}

// The standard ending: logo, headline, call-to-action pill, chips and fine print.
export function endCard(t, s, { head, cta = 'Gör en förfrågan – 2 minuter', chips = ['Ingen bokningsavgift', 'Hela Sverige'], fine = [] }) {
  const logoH = 150 * S, l = sUI(t - s);
  const lw = logoH * LOGO.width / LOGO.height;
  g.save(); g.beginPath(); g.rect(0, TOP - 10 * S, W, logoH + 20 * S); g.clip();
  g.drawImage(LOGO, X - 6 * S, TOP + (1 - l) * logoH * 1.2, lw, logoH);
  g.restore();
  const hp = Math.min(...head.map((h) => fit(h, 800, 112, CW)));
  const y = lines(t, head, s + 0.1, null, TOP + logoH + 44 * S, hp, C.ink);
  const pill = { x: X, y: y + 44 * S, w: CW, h: 136 * S };
  const p = sUI(t - (s + 0.3));
  if (p > 0) {
    g.save(); g.translate(pill.x, pill.y + pill.h / 2); g.scale(p, p); g.translate(-pill.x, -(pill.y + pill.h / 2));
    rrect(pill.x, pill.y, pill.w, pill.h, pill.h / 2, C.brand);
    g.beginPath(); g.roundRect(pill.x, pill.y, pill.w, pill.h, pill.h / 2); g.clip();
    const e = sType(t - (s + 0.5)), ty = pill.y + pill.h / 2 + (1 - e) * 80 * S;
    g.font = font(700, fit(cta, 700, 46, pill.w - 190 * S)); g.fillStyle = C.white; g.textBaseline = 'middle';
    g.fillText(cta, pill.x + 52 * S, ty);
    arrow(pill.x + pill.w - 100 * S, ty, 46 * S, C.white);
    g.restore();
  }
  let cx = X;
  const cy = pill.y + pill.h + 32 * S;
  chips.forEach((txt, i) => { cx += chip(txt, cx, cy, sUI(t - (s + 0.8 + i * 0.2))) + 16 * S; });
  if (fine.length) lines(t, fine, s + 1.2, null, cy + 104 * S, 28, C.muted, 500, 1.35);
}

// A number that counts up from `from` to `to` between t0 and t0 + dur (eased, no overshoot).
export function count(t, t0, dur, from, to) {
  const u = clamp((t - t0) / dur);
  return from + (to - from) * (1 - Math.pow(1 - u, 3));
}
export const kr = (n) => Math.round(n).toLocaleString('sv-SE').replace(/ /g, ' ');

// Seeded pseudo-random in [0, 1): the same input always gives the same value.
export const rand = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
