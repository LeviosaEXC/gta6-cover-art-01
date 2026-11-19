# NEON COAST — GTA-style Cover Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/)
[![rank](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg)](https://make.fun/)
[![reward](https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg)](https://make.fun/)

A static, offline GTA-style cover maker for the **gta6-cover-art-01** competition.
Four illustrated photo panels plus the title only — "NEON COAST" — with three
export sizes and one extra diagonal landscape render.

## The cover

Four scenes from one neon coastal city, in a full-bleed digital-painting style:

1. **Boulevard Chase** — neon boulevard, the getaway (hero panel)
2. **Boardwalk Lights** — ferris wheel over the pier
3. **Heist Standoff** — heist vs police, the standoff
4. **Night Skate** — skateboard under neon

Each orientation gets its own layout, tuned so the printed titles on the source
posters stay out of frame while the action stays centred:

- **Landscape 1920 x 1080** — hero-dominant: the hero fills the left 1152 px,
  the other three panels stack on the right.
- **Portrait 1080 x 1350** — hero on top (1080 x 810), three panels below.
- **Square 1080 x 1080** — banner: the hero spans the top 55%, three panels
  below.
- **Diagonal landscape** — a separate render (`?layout=diagonal`): four
  slanted full-height strips, 480 px wide, slant 60.

The only text drawn on the cover is the title itself, set in Anton over a dark
scrim. No panel names, no logos, no official artwork.

## Use it

Open `app/index.html` in a browser. No server and no network needed — every
asset (photos, fonts) is local.

- Pick a size: Landscape, Portrait, or Square.
- **Export PNG (this size)** downloads the current size; **Export all 3 sizes**
  downloads all three.
- Each Snapshot card fills its own panel. Upload a photo to replace one, drag
  inside the photo to pan its crop, scroll over it to zoom, use the tilt
  buttons to rotate it, or hit **Reset crop**.
- Drag a panel by its bottom edge onto another panel to swap the two panels.
- Edit the **Cover title** field to change the title (uppercased automatically).

Query parameters:

- `?size=portrait` (or `landscape` / `square`) — start on that size.
- `?layout=diagonal` — render the diagonal landscape layout.
- `?scene=cover` — hide the editor and show only the cover.

## Verify

Run the deterministic bundle verifier from the repo root:

```sh
node main.ts
```

It runs 32 checks (all files present, offline, licence, README badges, owner
wallet, distinct samples, font licences, Anton-only fonts, and the four layout
snippets) and exits 0 when all 32 pass.

## Fonts and licence

Display font Anton under the SIL Open Font License 1.1 — see `app/fonts/`.
Original lettering and art direction. No official logos or artwork.
