// app.js — Neon Coast cover maker (gta6-cover-art-01, final).
// Static, offline, no network. Canvas cover renderer with three
// aspect-specific hero-dominant layouts (V1), four photo slots,
// per-panel crop/zoom/tilt. The cover is full-bleed photos plus the
// title only, set in Anton.
"use strict";

const SIZES = {
  landscape: { w: 1920, h: 1080, label: "Landscape 1920 x 1080" },
  portrait: { w: 1080, h: 1350, label: "Portrait 1080 x 1350" },
  square: { w: 1080, h: 1080, label: "Square 1080 x 1080" },
};

const SAMPLES = [
  // fy is the focal height (fraction of the image) the crop window
  // centres on. Three samples are portrait posters with big baked-in
  // title text at the top and a tagline at the bottom; the focal point
  // keeps the action band centred and those baked texts out of frame.
  // (fx stays centred for all four.) These are the landscape defaults;
  // each aspect layout may override fy/zoom per panel.
  { file: "samples/sample1-hero.jpg", label: "Boulevard Chase", cap: "Neon boulevard - the getaway", fy: 0.49 },
  { file: "samples/sample2-ferris.jpg", label: "Boardwalk Lights", cap: "Ferris wheel over the pier", fy: 0.48 },
  { file: "samples/sample3-heist.jpg", label: "Heist Standoff", cap: "Heist vs police - the standoff", fy: 0.56 },
  { file: "samples/sample4-skate.jpg", label: "Night Skate", cap: "Skateboard under neon", fy: 0.48 },
];

// One layout per aspect, all FULL-BLEED and HERO-DOMINANT (the V1
// cover): the four panels tile the whole cover edge to edge, no margin,
// no gutter, no border, square corners. Panel 1 is the big hero;
// panels 2-4 share the remaining space. No per-panel names are drawn
// anywhere; the only text on the cover is the title, overlaid on the
// hero with a dark scrim behind it. Each rect carries its own fy/zoom
// defaults so the baked-in poster texts stay out of frame at every
// aspect; the user's zoom slider multiplies the layout zoom.
// strip is the invisible swap handle: dragging a panel by its bottom
// edge swaps it with another panel (no label bar is drawn).
function layoutFor(sizeKey) {
  if (sizeKey === "portrait") {
    return {
      // Hero on top (60% of the height), three panels in a row below.
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      rects: [
        { x: 0, y: 0, w: 1080, h: 810, fy: 0.55, zoom: 1.1 },
        { x: 0, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
        // The skate poster's baked-in title ("CRUISE / WELCOME TO NEON
        // BAY") sits at ~12-33% height, so this panel zooms tighter
        // (window 0.34-0.90) to keep it out while the face stays in.
        { x: 720, y: 810, w: 360, h: 540, fy: 0.62, zoom: 1.8 },
      ],
      strip: 40,
    };
  }
  if (sizeKey === "square") {
    return {
      // Hero on top (60% of the height), three panels in a row below.
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      rects: [
        { x: 0, y: 0, w: 1080, h: 648, fy: 0.56 },
        { x: 0, y: 648, w: 360, h: 432, fy: 0.58, zoom: 1.3 },
        { x: 360, y: 648, w: 360, h: 432, fy: 0.56, zoom: 1.4 },
        // Same baked-title dodge as portrait (window 0.35-0.85).
        { x: 720, y: 648, w: 360, h: 432, fy: 0.60, zoom: 1.6 },
      ],
      strip: 38,
    };
  }
  return {
    // V1: big hero on the left (60% of the width, full height), three
    // panels stacked on the right.
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    rects: [
      { x: 0, y: 0, w: 1152, h: 1080, fy: 0.49, zoom: 1.15 },
      { x: 1152, y: 0, w: 768, h: 360, fy: 0.48 },
      { x: 1152, y: 360, w: 768, h: 360, fy: 0.56 },
      { x: 1152, y: 720, w: 768, h: 360, fy: 0.48 },
    ],
    strip: 46,
  };
}

const state = {
  size: "landscape",
  title: "NEON COAST",
  panels: SAMPLES.map((s) => ({
    label: s.label, cap: s.cap, file: s.file,
    img: null, loaded: false,
    fx: 0.5, fy: s.fy,
    zoom: 1, ox: 0, oy: 0, tilt: 0,
  })),
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("cannot load " + src));
    img.src = src;
  });
}

async function loadSamples() {
  const jobs = state.panels.map(async (p) => {
    try {
      p.img = await loadImage(p.file);
      p.loaded = true;
    } catch (e) {
      p.img = null;
      p.loaded = false;
    }
  });
  await Promise.all(jobs);
}

async function ensureFonts() {
  try {
    await document.fonts.load('140px "Anton"');
    await document.fonts.load('84px "Anton"');
    await document.fonts.ready;
  } catch (e) {
    // Fall back to system fonts; the cover still draws.
  }
}

// Effective crop for a panel in a rect: the layout's fy/zoom defaults
// (per aspect) combined with the user's zoom multiplier.
function effCrop(p, rect) {
  return {
    fy: rect.fy !== undefined ? rect.fy : p.fy,
    zoom: (rect.zoom || 1) * p.zoom,
  };
}

// Focal offset for a panel: how far the crop window recentres from the
// image middle, in screen px, so the focal point (fx, fy) lands in the
// middle of the frame. mx/my are the hard limits the total offset may
// reach before the image stops covering the frame.
function focalOffset(p, rect) {
  if (!p.img) return { fox: 0, foy: 0, mx: 0, my: 0 };
  const e = effCrop(p, rect);
  const base = Math.max(rect.w / p.img.naturalWidth, rect.h / p.img.naturalHeight);
  const dw = p.img.naturalWidth * base * e.zoom;
  const dh = p.img.naturalHeight * base * e.zoom;
  const mx = Math.max(0, (dw - rect.w) / 2);
  const my = Math.max(0, (dh - rect.h) / 2);
  const fox = Math.max(-mx, Math.min(mx, dw * (0.5 - p.fx)));
  const foy = Math.max(-my, Math.min(my, dh * (0.5 - e.fy)));
  return { fox, foy, mx, my };
}

function clampCrop(p, rect) {
  const f = focalOffset(p, rect);
  if (effCrop(p, rect).zoom <= 1) { p.ox = 0; p.oy = 0; return; }
  // User pan (ox/oy) rides on top of the focal offset; the sum must stay
  // inside the cover limits.
  p.ox = Math.max(-(f.mx - Math.abs(f.fox)), Math.min(f.mx - Math.abs(f.fox), p.ox));
  p.oy = Math.max(-(f.my - Math.abs(f.foy)), Math.min(f.my - Math.abs(f.foy), p.oy));
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPanel(ctx, p, rect) {
  ctx.save();
  // Square corners, no frame stroke: with gap 0 the panels tile
  // edge-to-edge and the grid reads as one continuous image. No label
  // strip is drawn: panels are image only, no per-photo names.
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 0);
  ctx.clip();
  if (p.img && p.loaded) {
    clampCrop(p, rect);
    const e = effCrop(p, rect);
    const base = Math.max(rect.w / p.img.naturalWidth, rect.h / p.img.naturalHeight);
    // A tilted panel is drawn slightly oversized so its rotated corners
    // still cover the frame and no background wedge shows at the seam.
    const over = p.tilt === 0 ? 1 : 1.02;
    const dw = p.img.naturalWidth * base * e.zoom * over;
    const dh = p.img.naturalHeight * base * e.zoom * over;
    const f = focalOffset(p, rect);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((p.tilt * Math.PI) / 180);
    ctx.drawImage(p.img, -dw / 2 + f.fox + p.ox, -dh / 2 + f.foy + p.oy, dw, dh);
    ctx.rotate((-p.tilt * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  } else {
    ctx.fillStyle = "#2a1650";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

function drawCover(ctx, sizeKey) {
  const size = SIZES[sizeKey];
  const L = layoutFor(sizeKey);
  const W = size.w;
  const H = size.h;

  // Sunset backdrop, only visible where a panel fails to load.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1b1035");
  bg.addColorStop(0.45, "#4b1560");
  bg.addColorStop(0.75, "#b81e6e");
  bg.addColorStop(1, "#ff7a18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Four panels in the aspect-specific hero-dominant grid, full-bleed.
  for (let i = 0; i < 4; i++) {
    drawPanel(ctx, state.panels[i], L.rects[i]);
  }

  // The only text on the cover: the title, overlaid on the hero with
  // a dark scrim behind it so it stays readable over any scene.
  const g = ctx.createLinearGradient(0, 0, 0, L.title.scrim);
  g.addColorStop(0, "rgba(10, 5, 25, 0.78)");
  g.addColorStop(1, "rgba(10, 5, 25, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, L.title.scrim);
  ctx.save();
  ctx.font = L.title.size + 'px "Anton", "Trebuchet MS", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255, 46, 136, 0.9)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.title, L.title.x, L.title.y);
  ctx.restore();
}

function renderPreview() {
  const canvas = document.getElementById("cover");
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  drawCover(ctx, state.size);
}

function exportPNG(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext("2d"), sizeKey);
  return new Promise((resolve) => off.toBlob((b) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(b);
  }, "image/png"));
}

function downloadPNG(sizeKey) {
  exportPNG(sizeKey).then((url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "neon-coast-" + sizeKey + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

function buildSlots() {
  const host = document.getElementById("slots");
  state.panels.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "slot";
    card.innerHTML =
      '<div class="slot-head"><strong>Snapshot ' + (i + 1) + '</strong>' +
      '<span>fills panel ' + (i + 1) + ' &mdash; ' + p.label + '</span></div>' +
      '<img alt="Snapshot ' + (i + 1) + ' preview">' +
      '<input type="file" accept="image/*" aria-label="Upload snapshot ' + (i + 1) + '">' +
      '<div class="slot-controls">' +
      '<button type="button" class="ghost tilt-btn" data-tilt="-1.5">&orarr; -1.5&deg;</button>' +
      '<button type="button" class="ghost tilt-btn" data-tilt="0">0&deg;</button>' +
      '<button type="button" class="ghost tilt-btn" data-tilt="1.5">+1.5&deg;</button>' +
      '<input type="range" min="1" max="3" step="0.05" value="1" aria-label="Zoom snapshot ' + (i + 1) + '">' +
      '<button type="button" class="ghost reset-btn">Reset crop</button>' +
      '</div>';
    const img = card.querySelector("img");
    img.src = p.file;
    const fileInput = card.querySelector('input[type="file"]');
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        loadImage(reader.result).then((im) => {
          p.img = im;
          p.loaded = true;
          p.zoom = 1; p.ox = 0; p.oy = 0;
          p.fx = 0.5; p.fy = 0.5;
          img.src = reader.result;
          renderPreview();
        });
      };
      reader.readAsDataURL(file);
    });
    card.querySelectorAll(".tilt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        p.tilt = parseFloat(btn.dataset.tilt || "0");
        renderPreview();
      });
    });
    const zoom = card.querySelector('input[type="range"]');
    zoom.addEventListener("input", () => {
      p.zoom = parseFloat(zoom.value);
      renderPreview();
    });
    card.querySelector(".reset-btn").addEventListener("click", () => {
      p.zoom = 1; p.ox = 0; p.oy = 0; p.tilt = 0;
      zoom.value = "1";
      renderPreview();
    });
    host.appendChild(card);
  });
}

function canvasPoint(evt) {
  const canvas = document.getElementById("cover");
  const r = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - r.left) / r.width) * canvas.width,
    y: ((evt.clientY - r.top) / r.height) * canvas.height,
  };
}

function hitPanel(pt) {
  const L = layoutFor(state.size);
  for (let i = 0; i < 4; i++) {
    const rc = L.rects[i];
    if (pt.x >= rc.x && pt.x <= rc.x + rc.w && pt.y >= rc.y && pt.y <= rc.y + rc.h) {
      const onStrip = pt.y >= rc.y + rc.h - L.strip;
      return { index: i, onStrip, rect: rc };
    }
  }
  return null;
}

function bindPointer() {
  const canvas = document.getElementById("cover");
  let drag = null;
  canvas.addEventListener("pointerdown", (evt) => {
    const hit = hitPanel(canvasPoint(evt));
    if (!hit) return;
    canvas.setPointerCapture(evt.pointerId);
    drag = {
      index: hit.index, onStrip: hit.onStrip,
      startX: evt.clientX, startY: evt.clientY,
      moved: false, ox: state.panels[hit.index].ox, oy: state.panels[hit.index].oy,
    };
  });
  canvas.addEventListener("pointermove", (evt) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const dx = (evt.clientX - drag.startX) * sx;
    const dy = (evt.clientY - drag.startY) * sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.onStrip) {
      // Drag the photo inside its frame: pan the crop.
      const p = state.panels[drag.index];
      p.ox = drag.ox + dx;
      p.oy = drag.oy + dy;
      renderPreview();
    }
  });
  canvas.addEventListener("pointerup", (evt) => {
    if (!drag) return;
    if (drag.onStrip && drag.moved) {
      // Drag the panel by its label bar: swap it with the panel under the pointer.
      const hit = hitPanel(canvasPoint(evt));
      if (hit && hit.index !== drag.index) {
        const tmp = state.panels[drag.index];
        state.panels[drag.index] = state.panels[hit.index];
        state.panels[hit.index] = tmp;
        buildSlotsRefresh();
      }
    }
    drag = null;
    renderPreview();
  });
  canvas.addEventListener("wheel", (evt) => {
    const hit = hitPanel(canvasPoint(evt));
    if (!hit) return;
    evt.preventDefault();
    const p = state.panels[hit.index];
    p.zoom = Math.max(1, Math.min(3, p.zoom * (evt.deltaY < 0 ? 1.08 : 0.93)));
    renderPreview();
  }, { passive: false });
}

function buildSlotsRefresh() {
  const host = document.getElementById("slots");
  host.innerHTML = "";
  buildSlots();
}

function bindControls() {
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.size = btn.dataset.size || "landscape";
      renderPreview();
    });
  });
  document.getElementById("title-input").addEventListener("input", (e) => {
    state.title = e.target.value.toUpperCase();
    renderPreview();
  });
  document.getElementById("export-one").addEventListener("click", () => downloadPNG(state.size));
  document.getElementById("export-all").addEventListener("click", () => {
    ["landscape", "portrait", "square"].forEach((k, i) => {
      setTimeout(() => downloadPNG(k), i * 250);
    });
  });
}

// Test hooks used by the headless verification pass. They only read or
// replace panel images through the same code paths as the UI.
window.__cover = {
  state,
  layoutFor,
  exportPNG,
  renderPreview,
  async setPanelImage(index, dataUrl) {
    const p = state.panels[index];
    p.img = await loadImage(dataUrl);
    p.loaded = true;
    p.zoom = 1; p.ox = 0; p.oy = 0;
    renderPreview();
  },
  probePanels(sizeKey) {
    const size = SIZES[sizeKey];
    const off = document.createElement("canvas");
    off.width = size.w;
    off.height = size.h;
    const ctx = off.getContext("2d");
    drawCover(ctx, sizeKey);
    const L = layoutFor(sizeKey);
    return L.rects.map((rc) => {
      const d = ctx.getImageData(
        Math.floor(rc.x + rc.w / 2), Math.floor(rc.y + rc.h / 2 - 10), 1, 1).data;
      return { r: d[0], g: d[1], b: d[2] };
    });
  },
};

async function init() {
  const params = new URLSearchParams(window.location.search);
  const scene = params.get("scene") || "editor";
  const sizeParam = params.get("size");
  if (sizeParam && SIZES[sizeParam]) state.size = sizeParam;
  if (scene === "cover") document.body.classList.add("scene-cover");
  await loadSamples();
  await ensureFonts();
  if (scene !== "cover") {
    buildSlots();
    bindPointer();
    bindControls();
  }
  renderPreview();
  document.body.dataset.ready = "ready";
}

init();
