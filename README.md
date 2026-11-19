# NEON COAST — GTA-style Cover Maker

[![GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/)
[![Rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/)
[![Reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/)

A static, fully offline GTA-style cover maker for the `gta6-cover-art-01`
competition. Four illustrated photo panels plus one title — "NEON COAST" —
composed full-bleed into a coastal-city night cover, with three export sizes
and one extra diagonal landscape render.

## How it works

Open `app/index.html` in a browser. No server, no network, no build step.

- **Snapshots (left):** four photo slots. Each snapshot fills its own panel:
  1 fills panel 1, 2 fills panel 2, 3 fills panel 3, 4 fills panel 4. Upload
  your own photo per slot, tilt it (-1.5°, 0°, +1.5°), zoom it with the
  slider, or reset its crop.
- **Cover preview (right):** pick a size — Landscape 1920 × 1080, Portrait
  1080 × 1350, or Square 1080 × 1080 — and edit the cover title. Drag
  inside a photo to pan its crop, scroll over a photo to zoom it, drag a
  panel by its bottom edge to swap panels.
- **Export:** "Export PNG (this size)" saves the active size;
  "Export all 3 sizes" saves all three, one after another.

## Layouts

Every layout is full-bleed: panels cover the whole cover edge to edge, with
no margins, gutters, or borders. The only text on the cover is the title,
set in Anton over a dark scrim.

- **Landscape:** hero-dominant — one large hero panel on the left, three
  stacked panels on the right.
- **Portrait:** hero on top, three panels in a row below.
- **Square:** wide hero banner on top, three panels in a row below.
- **Diagonal landscape:** a separate render (`?layout=diagonal`) — four
  slanted full-height strips. The editor always exports the standard
  layouts.

## Verification

Run the deterministic verifier from the repo root:

```sh
node main.ts
```

It runs 32 checks (files exist, offline, license, badges, owner wallet,
distinct samples, font licenses, Anton-only fonts, layout snippets) and
prints a sorted JSON report. Exit 0 means 32/32 passed.

## Fonts

Display font Anton under the SIL Open Font License 1.1 (see `app/fonts/`).
Original lettering and art direction. No official logos or artwork.
