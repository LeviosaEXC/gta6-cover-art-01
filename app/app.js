// app.js — Neon Coast cover maker (gta6-cover-art-01 V4).
// Static, offline, no network. Canvas cover renderer with three
// aspect-specific layouts, four photo slots, per-panel crop/zoom/tilt.
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
  // (fx stays centred for all four.)
  { file: "samples/sample1-hero.jpg", label: "Boulevard Chase", cap: "Neon boulevard - the getaway", fy: 0.58 },
  { file: "samples/sample2-ferris.jpg", label: "Boardwalk Lights", cap: "Ferris wheel over the pier", fy: 0.48 },
  { file: "samples/sample3-heist.jpg", label: "Heist Standoff", cap: "Heist vs police - the standoff", fy: 0.62 },
  { file: "samples/sample4-skate.jpg", label: "Night Skate", cap: "Skateboard under neon", fy: 0.48 },
];

// One layout per aspect. No shared card positions: each size gets its
// own title, sun, tagline, grid and caption geometry, so nothing
// collides at any ratio. Hero panel (index 0) is dominant in all three.
function layoutFor(sizeKey) {
  if (sizeKey === "portrait") {
    return {
      // Gap 0: the four panels tile edge-to-edge with no gutter, no
      // border and square corners, so the grid reads as one continuous
      // image instead of four separate boxes.
      margin: 20, gap: 0,
      title: { x: 20, y: 100, size: 76 },
      sun: { x: 1014, y: 66, r: 44 },
      tagline: { x: 20, y: 144, size: 34 },
      rects: [
        { x: 20, y: 174, w: 1040, h: 520 },
        { x: 20, y: 694, w: 520, h: 252 },
        { x: 540, y: 694, w: 520, h: 252 },
        { x: 20, y: 946, w: 1040, h: 246 },
      ],
      strip: 40, labelSize: 24, caption: { y: 1256, size: 38 },
    };
  }
  if (sizeKey === "square") {
    return {
      margin: 20, gap: 0,
      title: { x: 20, y: 94, size: 72 },
      sun: { x: 1016, y: 64, r: 42 },
      tagline: { x: 20, y: 138, size: 32 },
      rects: [
        { x: 20, y: 168, w: 1040, h: 400 },
        { x: 20, y: 568, w: 520, h: 190 },
        { x: 540, y: 568, w: 520, h: 190 },
        { x: 20, y: 758, w: 1040, h: 182 },
      ],
      strip: 38, labelSize: 23, caption: { y: 1012, size: 36 },
    };
  }
  return {
    margin: 24, gap: 0,
    title: { x: 24, y: 128, size: 108 },
    sun: { x: 1830, y: 88, r: 64 },
    tagline: { x: 24, y: 178, size: 42 },
    rects: [
      { x: 24, y: 208, w: 1120, h: 486 },
      { x: 1144, y: 208, w: 752, h: 486 },
      { x: 24, y: 694, w: 912, h: 294 },
      { x: 936, y: 694, w: 960, h: 294 },
    ],
    strip: 46, labelSize: 28, caption: { y: 1042, size: 42 },
  };
}

const state = {
  size: "landscape",
  title: "NEON COAST",
  tagline: "Four panels. One night. One coastal city.",
  caption: "The night the coast lit up.",
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
    await document.fonts.load('108px "Alfa Slab One"');
    await document.fonts.load('76px "Alfa Slab One"');
    await document.fonts.load('42px "Caveat"');
    await document.fonts.ready;
  } catch (e) {
    // Fall back to system fonts; the cover still draws.
  }
}

// Focal offset for a panel: how far the crop window recentres from the
// image middle, in screen px, so the focal point (fx, fy) lands in the
// middle of the frame. mx/my are the hard limits the total offset may
// reach before the image stops covering the frame.
function focalOffset(p, rect) {
  if (!p.img) return { fox: 0, foy: 0, mx: 0, my: 0 };
  const base = Math.max(rect.w / p.img.naturalWidth, rect.h / p.img.naturalHeight);
  const dw = p.img.naturalWidth * base * p.zoom;
  const dh = p.img.naturalHeight * base * p.zoom;
  const mx = Math.max(0, (dw - rect.w) / 2);
  const my = Math.max(0, (dh - rect.h) / 2);
  const fox = Math.max(-mx, Math.min(mx, dw * (0.5 - p.fx)));
  const foy = Math.max(-my, Math.min(my, dh * (0.5 - p.fy)));
  return { fox, foy, mx, my };
}

function clampCrop(p, rect) {
  const f = focalOffset(p, rect);
  if (p.zoom <= 1) { p.ox = 0; p.oy = 0; return; }
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

function drawPanel(ctx, p, rect, strip, labelSize) {
  ctx.save();
  // Square corners, no frame stroke: with gap 0 the panels tile
  // edge-to-edge and the grid reads as one continuous image.
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 0);
  ctx.clip();
  if (p.img && p.loaded) {
    clampCrop(p, rect);
    const base = Math.max(rect.w / p.img.naturalWidth, rect.h / p.img.naturalHeight);
    // A tilted panel is drawn slightly oversized so its rotated corners
    // still cover the frame and no background wedge shows at the seam.
    const over = p.tilt === 0 ? 1 : 1.02;
    const dw = p.img.naturalWidth * base * p.zoom * over;
    const dh = p.img.naturalHeight * base * p.zoom * over;
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
  // Caption strip: dark band at the panel bottom, label inside it.
  ctx.fillStyle = "rgba(12, 5, 28, 0.78)";
  ctx.fillRect(rect.x, rect.y + rect.h - strip, rect.w, strip);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 " + labelSize + "px 'Trebuchet MS', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(p.label, rect.x + 16, rect.y + rect.h - strip / 2 + 1, rect.w - 32);
  ctx.restore();
}

function drawCover(ctx, sizeKey) {
  const size = SIZES[sizeKey];
  const L = layoutFor(sizeKey);
  const W = size.w;
  const H = size.h;

  // Sunset backdrop.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1b1035");
  bg.addColorStop(0.45, "#4b1560");
  bg.addColorStop(0.75, "#b81e6e");
  bg.addColorStop(1, "#ff7a18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Sun: top-right of the title band, clear of the title text.
  const sunGrad = ctx.createRadialGradient(L.sun.x, L.sun.y, 4, L.sun.x, L.sun.y, L.sun.r);
  sunGrad.addColorStop(0, "#fff3b0");
  sunGrad.addColorStop(0.55, "#ffb347");
  sunGrad.addColorStop(1, "#ff5e62");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(L.sun.x, L.sun.y, L.sun.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 243, 176, 0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Title: original display lettering.
  ctx.save();
  ctx.font = L.title.size + 'px "Alfa Slab One", "Trebuchet MS", serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255, 46, 136, 0.9)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.title, L.title.x, L.title.y);
  ctx.restore();

  // Tagline in handwriting.
  ctx.save();
  ctx.font = L.tagline.size + 'px "Caveat", cursive';
  ctx.fillStyle = "#ffd166";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(state.tagline, L.tagline.x, L.tagline.y);
  ctx.restore();

  // Four panels in the aspect-specific grid.
  for (let i = 0; i < 4; i++) {
    drawPanel(ctx, state.panels[i], L.rects[i], L.strip, L.labelSize);
  }

  // Bottom cover caption, centred, clear of the grid.
  ctx.save();
  ctx.font = L.caption.size + 'px "Caveat", cursive';
  ctx.fillStyle = "#ffe9f3";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(state.caption, W / 2, L.caption.y);
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
  document.getElementById("tagline-input").addEventListener("input", (e) => {
    state.tagline = e.target.value;
    renderPreview();
  });
  document.getElementById("caption-input").addEventListener("input", (e) => {
    state.caption = e.target.value;
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
