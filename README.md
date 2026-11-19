# Neon Coast — GTA-style Cover Maker

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Entry for [gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) — "Make GTA 6 Cover Art".

## What it is

A fully offline cover-art maker. Load your own photos (or use the four bundled
illustrated samples), arrange them in a 2×2 panel grid telling one coastal-city
action story, edit the title, tagline and caption, and export a PNG cover in
three sizes: landscape 1920×1080, portrait 1080×1350, and square 1080×1080.

## V4 — what changed from V3

V3 ("Neon Coast Collage") scored a 65.09% provisional: it read like a vacation
scrapbook, the portrait and square exports collided, and photo slots 3 and 4
were never used. V4 fixes all three, following the advisor diagnosis:

1. **Art direction** — an illustrated 2×2 grid (bold outlines, flat sunset/neon
   colors) with one dominant hero panel, instead of a tilted scrapbook collage.
   No star-rating badge, no Polaroid dressing. Original lettering only.
2. **Aspect-specific compositions** — separate safe-area layouts for landscape,
   portrait and square. Nothing is clipped or stacked at any size.
3. **Four real photo slots** — snapshot 1 fills panel 1, 2 fills panel 2, 3 fills
   panel 3, 4 fills panel 4. Drag the photo inside its frame to pan the crop,
   scroll to zoom, drag a panel by its label bar to swap panels, tilt buttons
   rotate a panel. The instruction text now matches the actual controls.

## How to use

1. Open `app/index.html` in a browser (no server, no network needed).
2. Upload up to four snapshots, or keep the bundled illustrated samples.
3. Drag inside a photo to pan its crop, scroll over it to zoom, use the tilt
   buttons to rotate the panel, drag a panel by its label bar to swap it.
4. Edit the title, tagline and caption.
5. Pick a size and hit **Export PNG**, or **Export all 3 sizes**.

## Verify

```sh
node main.ts
```

`main.ts` (Node 22+, stdlib only, no network) checks the bundle — all files
present, no network/eval references in the app, SPDX license line, the three
README badges, the owner wallet, four distinct samples, and the OFL license
texts — then prints a deterministic JSON report. Run it twice: the output is
byte-identical.

## Files

- `app/index.html`, `app/app.js`, `app/styles.css` — the maker (static, offline).
- `app/samples/` — four illustrated sample scenes in the cover-art style.
- `app/fonts/` — Alfa Slab One and Caveat under the SIL Open Font License 1.1
  (license texts shipped beside the font files).
- `main.ts` — deterministic bundle verifier.
- `LICENSE` — MIT.

All lettering is original. No official logos, artwork, or fonts from the
referenced game are used.
