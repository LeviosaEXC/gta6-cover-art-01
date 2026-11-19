# NEON COAST — GTA-style Cover Maker

[![Neon Coast — gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/)
[![Neon Coast rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/)
[![Neon Coast reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/)

A static, fully offline cover maker for the **gta6-cover-art-01** competition.
Build a GTA-style cover for a fictional coastal city: four illustrated photo
panels and one big title, **NEON COAST**, set in Anton.

## What it makes

- **Landscape 1920 × 1080** — hero-dominant: the boulevard chase fills the
  left 60%, with the boardwalk, heist standoff, and night skate stacked on
  the right.
- **Portrait 1080 × 1350** — hero on top, three panels in a row below.
- **Square 1080 × 1080** — banner layout: the boulevard fills the top 55%,
  three panels below.
- **Diagonal landscape** — a separate render (`?layout=diagonal`): four
  slanted full-height strips, each 480 wide with a 60 slant.

Every layout is full-bleed: panels cover the cover edge to edge, no margins,
no gutters, no borders. The only text on the cover is the title, over a dark
scrim. The four scenes are a neon boulevard getaway, a ferris wheel over the
pier at sunset, a heist standoff against the police, and a skateboard under
neon lights.

## Using the editor

Open `app/index.html` in a browser (no server and no network needed).

- Pick a size: Landscape, Portrait, or Square.
- Each Snapshot card fills its own panel. Upload a photo to replace a panel,
  drag inside the photo to pan its crop, scroll over it to zoom, and use the
  tilt buttons to rotate it. "Reset crop" restores the defaults.
- Drag a panel by its bottom edge onto another panel to swap the two.
- Edit the cover title; it is always rendered in Anton.
- "Export PNG (this size)" downloads the current size; "Export all 3 sizes"
  downloads all three, one after another.

Scene-only views for screenshots: add `?scene=cover` to hide the editor UI
and show just the cover, and `?layout=diagonal` for the diagonal render.

## Verification

`main.ts` is a deterministic verifier (Node 22+, standard library only, no
network). From the repo root, run:

```sh
node main.ts
```

It runs 32 checks — all files present, no network or dynamic-code references
in the app files, the MIT SPDX first line, the three badges above, the owner
wallet, four distinct sample images, both font licences, the Anton-only font
rule, and the four layout markers — and prints a sorted JSON report. It exits
0 only when all 32 pass, and running it twice gives byte-identical output.

## Fonts

Display font **Anton** and handwriting font **Caveat**, both under the SIL
Open Font License 1.1 (licence texts in `app/fonts/`). No other display font
is used or bundled.

## Licence

MIT — see `LICENSE`.
