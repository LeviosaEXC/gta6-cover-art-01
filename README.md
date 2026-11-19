# Neon Coast Collage

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/)
[![rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/)
[![reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/)

A GTA-style cover art maker for the [gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) competition on make.fun. No grid: four tilted snapshot cards with tape and handwritten captions on a neon coast — a purple starry sky, a low sun, palm silhouettes. Drag the cards anywhere, scroll to zoom each photo, tilt them with the Tilt buttons, then export a cover as PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080.

## Run it

Serve `app/` with any static file server and open `app/index.html` in desktop Chrome. It works fully offline: every script, font, and sample photo is a file under `app/`, and your own photos are read on your machine, never uploaded.

## What is inside

- `app/index.html`, `app/style.css`, `app/src/app.js` — the editor and the cover renderer (vanilla ES module, 2D canvas, no library).
- `app/samples/` — two image-model-made sample photos, free to use.
- `app/fonts/` — Alfa Slab One and Caveat under the SIL Open Font License (license texts ship beside them).
- `screenshots/` — the cover and the editor, captured in a real browser.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `vendor/makefun-app.ts`.
