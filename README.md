# Neon Coast — GTA-style Cover Maker

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Entry for [gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) — "Make GTA 6 Cover Art".

## What it is

A fully offline cover-art maker. Load your own photos (or use the four bundled
illustrated samples), arrange them in a per-aspect layout telling one coastal-city
action story, edit the title, and export a PNG cover in
three sizes: landscape 1920×1080, portrait 1080×1350, and square 1080×1080.

## Final (submit #2) — per-orientation layouts + Anton

Each aspect gets its own composition, all full-bleed edge to edge with no
margins, no gutters and no per-panel names. The only text on the cover is
the title "NEON COAST", overlaid in Anton — the bold condensed OFL display
font that replaces the rejected Alfa Slab One (removed entirely: font file,
license text and every reference). The drawn sun, the tagline and the bottom
caption from V4 are gone; panel swapping now works by dragging a panel by
its bottom edge (the handle is invisible, so the cover stays clean).

- **Landscape 1920×1080 — V1 hero-dominant:** one big boulevard panel on
  the left (60% of the width, full height) with the other three panels
  stacked on the right.
- **Portrait 1080×1350 — V3 diagonal:** four full-height slanted strips
  side by side (boulevard / ferris / heist / skate), leaning right at the
  top, with sunset-gradient wedges in the outer corners.
- **Square 1080×1080 — banner:** the boulevard hero spans the full width
  on top (55% of the height), with the other three panels in a row below.

V3 diagonal and V10 banner-bottom are kept as backup layouts in `variants/`
(uncommitted).

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
   buttons to rotate the panel, drag a panel by its bottom edge to swap it.
4. Edit the title.
5. Pick a size and hit **Export PNG**, or **Export all 3 sizes**.

## Verify

```sh
node main.ts
```

`main.ts` (Node 22+, stdlib only, no network) checks the bundle — all files
present, no network/eval references in the app, SPDX license line, the three
README badges, the owner wallet, four distinct samples, the OFL license
texts, the font swap (Anton present and referenced, Alfa Slab One fully
gone), and the three per-orientation layouts (V1 hero landscape, diagonal
portrait, banner square) — then prints a deterministic JSON report. Run it twice: the output is
byte-identical.

## Files

- `app/index.html`, `app/app.js`, `app/styles.css` — the maker (static, offline).
- `app/samples/` — four illustrated sample scenes in the cover-art style.
- `app/fonts/` — Anton (title) and Caveat under the SIL Open Font License 1.1
  (license texts shipped beside the font files).
- `main.ts` — deterministic bundle verifier.
- `LICENSE` — MIT.

All lettering is original. No official logos, artwork, or fonts from the
referenced game are used.
