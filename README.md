# NEON COAST — GTA-style Cover Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/)
[![rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/)
[![reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/)

A static, fully offline GTA-style cover maker for the **gta6-cover-art-01** competition. Four illustrated photo panels plus one title — "NEON COAST" — composed into three export sizes and one extra diagonal landscape render. No network, no build step: open `app/index.html` in a browser and it just works.

## What it does

- **Three export sizes, full-bleed:** Landscape 1920 × 1080 (hero left, three panels right), Portrait 1080 × 1350 (hero on top, three panels below), Square 1080 × 1080 (banner hero, three panels below).
- **Diagonal landscape render:** open with `?layout=diagonal` for four slanted full-height strips that fill the whole canvas with artwork — no background showing through.
- **Four snapshots:** Boulevard Chase, Boardwalk Lights, Heist Standoff, and Night Skate. Each snapshot fills its own panel; one photo can fill several panels, or use four different photos.
- **Editor:** drag a photo inside its frame to pan the crop, scroll over a photo to zoom it, tilt a panel −1.5° / 0° / +1.5°, drag a panel by its bottom edge to swap panels, upload your own photos, and edit the cover title.
- **Export:** "Export PNG (this size)" saves the active size; "Export all 3 sizes" saves all three, one after another.

## Layouts

| Size | Composition |
| --- | --- |
| Landscape 1920 × 1080 | Hero 1152 × 1080 left, three 768 × 360 panels right |
| Portrait 1080 × 1350 | Hero 1080 × 810 top, three 360 × 540 panels below |
| Square 1080 × 1080 | Banner hero 1080 × 594, three 360 × 486 panels below |
| Diagonal landscape | Four slanted strips, 480 wide, slant 60, full height |

The only text drawn on the cover itself is the title, set in Anton over a dark scrim. The sample posters carry printed lettering of their own, so each layout keeps its focal point on the action band and crops the printed title and tagline out of frame.

## Files

- `main.ts` — deterministic verifier (Node 22+, standard library only). Run `node main.ts` from the repo root: 32 checks, exit 0 when all pass.
- `app/index.html` — the editor page.
- `app/app.js` — all cover logic: layouts, focal crop, diagonal render, export, and editor interactions.
- `app/styles.css` — editor styling.
- `app/fonts/` — Anton and Caveat under the SIL Open Font License 1.1.
- `app/samples/` — the four sample photos.
- `screenshots/` — cover and editor captures.

## Fonts

Display font **Anton** and handwriting font **Caveat**, both under the SIL Open Font License 1.1 (see `app/fonts/OFL-Anton.txt` and `app/fonts/OFL-Caveat.txt`).

## License

MIT. See [LICENSE](LICENSE).
