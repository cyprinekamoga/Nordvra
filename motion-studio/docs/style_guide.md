# Style guide – Nordvra ads

Taken from the live site (nordvra.netlify.app, October 2026), not invented.

## Palette (live CSS tokens)
| Role | Hex | Use |
|---|---|---|
| Canvas | `#FAF7F2` | Background. Flat, never a gradient |
| Surface | `#FFFFFF` | Tiles and cards |
| Ink | `#1A2420` | Display type and body |
| Muted | `#4D5853` | Secondary lines |
| Brand (the one accent) | `#0B5D4B` | Checks, filled tiles, CTA |
| Brand strong | `#084536` | Pressed/filled states |
| Brand soft | `#E1EFE9` | Selected tile tint |
| RUT / RUT soft | `#0E5A5E` / `#DCEFEF` | Only on the real "RUT 50 %" badge |
| Border | `#DDD5C8` | Card edges |

## Type
- Figtree (variable 300–900), the site's font. `assets/fonts/Figtree-latin.woff2` (+ latin-ext).
- Display: 800, tight leading (0.95), tracking −2 %. UI: 600 and 500.
- Phone readability: nothing under 34 px on a 1080-wide frame; fine print 30 px minimum.

## Layout
- Left-aligned, asymmetric. Text starts at x = 72. No centred title cards.
- 9:16 (1080×1920) safe area for Reels: key content between y = 270 and y = 1250.
  The top 14 % and bottom 35 % are covered by Reels UI.
- 4:5 (1080×1350) feed: same timeline, the grid moves up and the card scales to fit.

## Motion
- Closed-form springs from `lib/motion.js`. UI: k 260, d 22 (a hair of overshoot).
  Type: k 170, d 26 (no overshoot).
- Text enters with a clipped slide-up and leaves the same way. Nothing fades in on its own.
- One container that never cuts: the four quiz tiles merge into a single card that keeps morphing
  (size, radius, fill) through the list and into the price card.
- Cuts and pops land on the 120 BPM grid (one beat = 0.5 s).

## Icons
Lucide (`lib/icons.js`), the same line icons the app uses, 2.25 px stroke at 24 px, drawn large.

## Banned here (on top of CLAUDE.md)
Stock photos of smiling cleaners, gradients, glow, confetti, "halva priset", a "−50 %" on items
where the deduction is smaller (second-hand transport), and plain TV installation as a RUT example.
