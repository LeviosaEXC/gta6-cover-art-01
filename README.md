# NEON COAST — GTA-style Cover Maker

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/)
[![Rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/)
[![Reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/)

A static, offline cover maker for **gta6-cover-art-01**: four illustrated photo panels plus one title, composed into a GTA-style cover. No network requests, no official logos or artwork — original lettering and art direction only.

## What it does

- Four snapshot slots, each filling its own panel. Upload your own photo per slot, or keep the four built-in neon-city samples.
- Drag a photo inside its frame to pan the crop, scroll over a photo to zoom it, tilt a panel with the tilt buttons, or drag a panel by its bottom edge onto another panel to swap them.
- Three export sizes, full-bleed with no gutters or borders:
  - Landscape 1920 × 1080
  - Portrait 1080 × 1350
  - Square 1080 × 1080
- A separate diagonal landscape render (four slanted full-height strips) is available at `?layout=diagonal`.
- The cover title is the only text drawn on the cover, set in Anton over a dark scrim.

## Use

Open `app/index.html` in a browser. Pick a size, edit the title, arrange the four snapshots, then export the current size or all three sizes as PNG files named `neon-coast-<size>.png`.

Scene mode (`?scene=cover`) hides the editor and shows only the cover — handy for screenshots.

## Files

- `app/index.html` — editor page
- `app/app.js` — cover maker logic (layouts, crop, draw, export)
- `app/styles.css` — editor styling
- `app/samples/` — four built-in sample photos
- `app/fonts/` — Anton display font under the SIL Open Font License 1.1 (see the OFL texts in `app/fonts/`)
- `main.ts` — entry program: hands `app/` and `screenshots/` to the output directory and writes `dossier.json`
- `screenshots/` — four renders of the app (landscape cover, editor, diagonal cover, square cover)

## License

MIT — see `LICENSE`.
