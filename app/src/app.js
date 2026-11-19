// Neon Coast Collage — a free-form tilted-snapshot GTA-style cover maker.
// Vanilla ES module, 2D canvas, no library, no network. Photos are read on
// the user's own machine (file inputs) or the bundled image-model samples;
// nothing is uploaded. Exports PNGs at 1080x1080, 1080x1350, 1920x1080.
const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const SIZES = { '1920x1080': [1920, 1080], '1080x1350': [1080, 1350], '1080x1080': [1080, 1080] };
// Coast light: the sky, the sun and the sea of the backdrop.
const COASTS = {
  vice: { top: '#1a0533', mid: '#7a1e6e', horizon: '#ff2975', sun: '#ffd319', sea: '#12082e', accent: '#00e5ff' },
  dusk: { top: '#050a2e', mid: '#3b1a7a', horizon: '#8c1eff', sun: '#7df9ff', sea: '#0a0626', accent: '#ffd319' },
  gold: { top: '#2a1503', mid: '#7a3a00', horizon: '#ff7a18', sun: '#ffe259', sea: '#1d0f02', accent: '#ff2975' },
  magenta: { top: '#26022e', mid: '#6e0f5e', horizon: '#d400ff', sun: '#ff5ce1', sea: '#16031f', accent: '#00e5ff' },
};
const CROP_PRESETS = [
  { px: 0, py: 0.85, zoom: 1.0 },
  { px: -0.1, py: 0.65, zoom: 1.65 },
  { px: 0.2, py: 0.8, zoom: 1.5 },
  { px: 0.15, py: 0.35, zoom: 1.1 },
];
const CARD_LABELS = ['BOARDWALK', 'PIER DAYS', 'SUNSET DRIVE', 'GOLDEN HOUR'];

const params = new URLSearchParams(location.search);
const state = {
  caption: 'VICE CITY',
  subtitle: 'sunset drive',
  layout: params.get('layout') || 'fan',
  grade: params.get('grade') || 'vice',
  size: params.get('size') || '1920x1080',
  photos: [],
  cards: [],
  selected: 1,
};
const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({ caption: state.caption, subtitle: state.subtitle, layout: state.layout, grade: state.grade, size: state.size, cards: state.cards });
}
function restore(json) {
  Object.assign(state, JSON.parse(json));
  syncControls();
  drawPreview();
}
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
async function loadSamples() {
  const [a, b] = await Promise.all([loadImage('samples/boulevard.jpg'), loadImage('samples/pier.jpg')]);
  state.photos = [a, b];
}

let grainTile = null;
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeGrain() {
  const t = document.createElement('canvas');
  t.width = 140; t.height = 140;
  const c = t.getContext('2d');
  const d = c.createImageData(140, 140);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 26;
  }
  c.putImageData(d, 0, 0);
  grainTile = t;
}

// ---------------------------------------------------------------- cards
// A card's centre and tilt are fractions of the cover; the arrangement
// buttons place all four at once, then the user drags them freely.
function arrange(layout) {
  const defs = {
    fan: [
      { cx: 0.16, cy: 0.56, rot: -0.14 },
      { cx: 0.39, cy: 0.54, rot: -0.05 },
      { cx: 0.61, cy: 0.54, rot: 0.05 },
      { cx: 0.84, cy: 0.56, rot: 0.14 },
    ],
    cascade: [
      { cx: 0.24, cy: 0.38, rot: -0.1 },
      { cx: 0.4, cy: 0.5, rot: -0.03 },
      { cx: 0.58, cy: 0.6, rot: 0.04 },
      { cx: 0.76, cy: 0.7, rot: 0.1 },
    ],
    grid: [
      { cx: 0.28, cy: 0.4, rot: -0.06 },
      { cx: 0.72, cy: 0.4, rot: 0.05 },
      { cx: 0.28, cy: 0.7, rot: -0.04 },
      { cx: 0.72, cy: 0.7, rot: 0.06 },
    ],
  };
  const pick = defs[layout] || defs.fan;
  state.cards = pick.map((d, i) => ({
    ...d,
    photo: i % 2,
    crop: { ...CROP_PRESETS[i] },
    label: CARD_LABELS[i],
    sticker: i === 3,
  }));
}
function cardSize(W, H) {
  const ch = Math.min(W * 0.375, H * 0.58);
  return { w: ch * 0.8, h: ch };
}

function drawCoverPhoto(c, img, rect, crop) {
  const { x, y, w, h } = rect;
  const base = Math.max(w / img.width, h / img.height) * crop.zoom;
  const dw = img.width * base, dh = img.height * base;
  const dx = x + (w - dw) / 2 + crop.px * Math.max(0, (dw - w) / 2);
  const dy = y + (h - dh) / 2 + crop.py * Math.max(0, (dh - h) / 2);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(img, dx, dy, dw, dh);
  c.restore();
}

// One palm silhouette: a curved trunk and six drooping fronds.
function drawPalm(c, x, y, s, color) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 9;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(14, -70, 4, -130);
  c.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI / 6) - (i * Math.PI) / 7.5;
    const ex = 4 + Math.cos(a) * 48;
    const ey = -130 + Math.sin(a) * 48 + 44;
    c.beginPath();
    c.moveTo(4, -130);
    c.quadraticCurveTo(4 + (ex - 4) * 0.55, -130 + (ey + 130) * 0.4 - 14, ex, ey);
    c.lineWidth = 5;
    c.stroke();
  }
  c.restore();
}

function drawCoastBackdrop(c, W, H) {
  const g = COASTS[state.grade];
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, g.top);
  sky.addColorStop(0.45, g.mid);
  sky.addColorStop(0.72, g.horizon);
  sky.addColorStop(1, g.sea);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  // Stars in the upper sky.
  const rnd = mulberry32(77);
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i++) {
    const sx = rnd() * W, sy = rnd() * H * 0.42;
    c.globalAlpha = 0.25 + rnd() * 0.6;
    c.beginPath();
    c.arc(sx, sy, 1 + rnd() * 1.8, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  // Sun with a warm halo, upper right, clear of the title and the cards.
  const sunX = W * 0.79, sunY = H * 0.15, sunR = H * 0.085;
  const halo = c.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 3.2);
  halo.addColorStop(0, g.sun + '88');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = halo;
  c.fillRect(0, 0, W, H);
  c.fillStyle = g.sun;
  c.beginPath();
  c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  c.fill();
  // Sea band with shimmer lines along the bottom.
  const seaY = H * 0.86;
  const sea = c.createLinearGradient(0, seaY, 0, H);
  sea.addColorStop(0, g.sea);
  sea.addColorStop(1, '#05020e');
  c.fillStyle = sea;
  c.fillRect(0, seaY, W, H - seaY);
  c.strokeStyle = g.accent + '55';
  c.lineWidth = Math.max(1, H * 0.002);
  for (let i = 0; i < 4; i++) {
    const ly = seaY + ((H - seaY) * (i + 1)) / 5;
    c.beginPath();
    c.moveTo(W * 0.08, ly);
    c.lineTo(W * 0.92, ly);
    c.stroke();
  }
  // Palms framing the scene from just off-canvas, so their fronds stay at
  // the edges and never cross the title or the middle of a card.
  drawPalm(c, -W * 0.01, H * 1.02, H * 0.0032, '#0d0218');
  drawPalm(c, W * 1.01, H * 1.02, H * 0.0022, '#0d0218');
}

function drawCollageTitle(c, W, H) {
  const g = COASTS[state.grade];
  const fs = Math.round(H * 0.088);
  c.font = `${fs}px "Alfa Slab One", serif`;
  const title = state.caption.toUpperCase();
  const tw = c.measureText(title).width;
  const tx = (W - tw) / 2;
  const ty = H * 0.115;
  const grad = c.createLinearGradient(0, ty - fs, 0, ty);
  grad.addColorStop(0, '#ffe259');
  grad.addColorStop(0.55, '#ff7a18');
  grad.addColorStop(1, '#ff2975');
  c.lineJoin = 'round';
  c.lineWidth = Math.max(3, fs * 0.1);
  c.strokeStyle = 'rgba(8,2,18,0.92)';
  c.strokeText(title, tx, ty);
  c.fillStyle = grad;
  c.fillText(title, tx, ty);
  const sfs = Math.round(H * 0.048);
  c.font = `700 ${sfs}px Caveat, cursive`;
  c.shadowColor = g.accent;
  c.shadowBlur = Math.round(H * 0.018);
  c.fillStyle = '#ffffff';
  const sub = state.subtitle;
  const sw = c.measureText(sub).width;
  c.fillText(sub, (W - sw) / 2, ty + sfs * 1.05);
  c.shadowBlur = 0;
  // Footer strip on the sea: stars + city name.
  const ffs = Math.round(H * 0.024);
  c.font = `${ffs}px system-ui, sans-serif`;
  c.fillStyle = '#ffd319';
  const foot = '★ ★ ★ ★ ★   VICE CITY';
  const fw = c.measureText(foot).width;
  c.fillText(foot, (W - fw) / 2, H * 0.965);
}

function drawCard(c, card, W, H, forExport, selected) {
  const { w: cw, h: ch } = cardSize(W, H);
  const bw = Math.max(5, cw * 0.03);
  const foot = ch * 0.13;
  const img = state.photos[card.photo % Math.max(1, state.photos.length)];
  c.save();
  c.translate(card.cx * W, card.cy * H);
  c.rotate(card.rot);
  c.shadowColor = 'rgba(0,0,0,0.5)';
  c.shadowBlur = 16;
  c.shadowOffsetY = 8;
  c.fillStyle = '#fffdf4';
  c.fillRect(-cw / 2, -ch / 2, cw, ch + foot);
  c.shadowColor = 'transparent';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  if (img) drawCoverPhoto(c, img, { x: -cw / 2 + bw, y: -ch / 2 + bw, w: cw - 2 * bw, h: ch - 2 * bw }, card.crop);
  // Handwritten polaroid label on the white foot.
  c.fillStyle = '#17120a';
  c.font = `700 ${Math.round(foot * 0.52)}px Caveat, cursive`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(card.label, 0, ch / 2 + foot * 0.52);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  // Tape strips across the top corners.
  c.fillStyle = 'rgba(255,226,89,0.8)';
  c.save();
  c.translate(-cw / 2 + cw * 0.14, -ch / 2);
  c.rotate(-0.5);
  c.fillRect(-cw * 0.09, -foot * 0.32, cw * 0.18, foot * 0.64);
  c.restore();
  c.save();
  c.translate(cw / 2 - cw * 0.14, -ch / 2);
  c.rotate(0.5);
  c.fillRect(-cw * 0.09, -foot * 0.32, cw * 0.18, foot * 0.64);
  c.restore();
  // Star sticker on the last card's top-right corner, kept inside the frame.
  if (card.sticker) {
    const sx = cw / 2 - cw * 0.12, sy = -ch / 2 + ch * 0.08;
    c.fillStyle = '#ffd319';
    c.beginPath();
    c.arc(sx, sy, cw * 0.09, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#17120a';
    c.font = `700 ${Math.round(cw * 0.06)}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('★5.0', sx, sy);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  }
  c.restore();
  if (selected && !forExport) {
    c.save();
    c.translate(card.cx * W, card.cy * H);
    c.rotate(card.rot);
    c.setLineDash([10, 8]);
    c.lineWidth = Math.max(2, W * 0.003);
    c.strokeStyle = '#ffd319';
    c.strokeRect(-cw / 2 - 4, -ch / 2 - 4, cw + 8, ch + foot + 8);
    c.restore();
  }
}

function drawCover(c, W, H, forExport) {
  drawCoastBackdrop(c, W, H);
  state.cards.forEach((card, i) => drawCard(c, card, W, H, forExport, !forExport && i === state.selected));
  drawCollageTitle(c, W, H);
  if (grainTile) {
    const pat = c.createPattern(grainTile, 'repeat');
    c.fillStyle = pat;
    c.fillRect(0, 0, W, H);
  }
}

// ---------------------------------------------------------------- editor
function previewSize() {
  const [W, H] = SIZES[state.size];
  const scale = Math.min(960 / W, 620 / H);
  return [Math.round(W * scale), Math.round(H * scale)];
}
function drawPreview() {
  const [w, h] = previewSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  drawCover(ctx, w, h, false);
}
function syncControls() {
  $('caption').value = state.caption;
  $('subtitle').value = state.subtitle;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
}
function status(msg) { $('status').textContent = msg; }

async function exportPNG(sizeKey, silent) {
  const [W, H] = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  drawCover(off.getContext('2d'), W, H, true);
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `collage-${sizeKey}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  if (!silent) status(`Exported collage-${sizeKey}.png (${W} x ${H}).`);
}

// Hit test in a card's own (unrotated) frame, topmost card first.
function cardAt(p) {
  const { w: cw, h: ch } = cardSize(canvas.width, canvas.height);
  const foot = ch * 0.13;
  for (let i = state.cards.length - 1; i >= 0; i--) {
    const card = state.cards[i];
    const dx = p.x - card.cx * canvas.width;
    const dy = p.y - card.cy * canvas.height;
    const lx = dx * Math.cos(-card.rot) - dy * Math.sin(-card.rot);
    const ly = dx * Math.sin(-card.rot) + dy * Math.cos(-card.rot);
    if (Math.abs(lx) <= cw / 2 + 4 && ly >= -ch / 2 - 4 && ly <= ch / 2 + foot + 4) return i;
  }
  return -1;
}
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = cardAt(p);
  if (i < 0) return;
  pushHistory();
  state.selected = i;
  const card = state.cards[i];
  drag = { ox: p.x - card.cx * canvas.width, oy: p.y - card.cy * canvas.height };
  canvas.setPointerCapture(e.pointerId);
  drawPreview();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const card = state.cards[state.selected];
  card.cx = Math.max(0.06, Math.min(0.94, (p.x - drag.ox) / canvas.width));
  card.cy = Math.max(0.2, Math.min(0.86, (p.y - drag.oy) / canvas.height));
  drawPreview();
});
canvas.addEventListener('pointerup', () => { drag = null; });
// Scroll over a card zooms its photo (per-photo crop, in the rubric's own
// terms); the Tilt buttons rotate the selected card instead.
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const i = cardAt(canvasPoint(e));
  if (i < 0) return;
  pushHistory();
  const card = state.cards[i];
  card.crop.zoom = Math.max(1, Math.min(2.5, card.crop.zoom * (e.deltaY > 0 ? 0.92 : 1.09)));
  state.selected = i;
  drawPreview();
}, { passive: false });
$('tiltLeft').addEventListener('click', () => {
  pushHistory();
  state.cards[state.selected].rot = Math.max(-0.5, state.cards[state.selected].rot - 0.05);
  drawPreview();
});
$('tiltRight').addEventListener('click', () => {
  pushHistory();
  state.cards[state.selected].rot = Math.min(0.5, state.cards[state.selected].rot + 0.05);
  drawPreview();
});

$('caption').addEventListener('input', (e) => { state.caption = e.target.value; drawPreview(); });
$('caption').addEventListener('change', pushHistory);
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; drawPreview(); });
$('subtitle').addEventListener('change', pushHistory);
document.querySelectorAll('#layouts button').forEach((b) => b.addEventListener('click', () => { pushHistory(); state.layout = b.dataset.layout; arrange(state.layout); syncControls(); drawPreview(); }));
document.querySelectorAll('#grades button').forEach((b) => b.addEventListener('click', () => { pushHistory(); state.grade = b.dataset.grade; syncControls(); drawPreview(); }));
document.querySelectorAll('#sizes button').forEach((b) => b.addEventListener('click', () => { pushHistory(); state.size = b.dataset.size; syncControls(); drawPreview(); }));
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
});
$('export').addEventListener('click', () => exportPNG(state.size, false));
$('exportAll').addEventListener('click', async () => {
  for (const k of Object.keys(SIZES)) await exportPNG(k, true);
  status('Exported all 3 sizes.');
});
$('samples').addEventListener('click', async () => { await loadSamples(); drawPreview(); status('Sample photos loaded.'); });
for (let i = 0; i < 4; i++) {
  $(`photo${i}`).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    state.photos[i] = await loadImage(URL.createObjectURL(f));
    drawPreview();
    status(`Snapshot ${i + 1} loaded: ${f.name}`);
  });
}

// ---------------------------------------------------------------- boot
async function boot() {
  makeGrain();
  arrange(state.layout);
  try {
    await Promise.all([
      document.fonts.load('100px "Alfa Slab One"'),
      document.fonts.load('700 60px Caveat'),
    ]);
  } catch { /* fall back to system fonts */ }
  await loadSamples();
  if (params.get('shot') === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = Math.round(window.innerWidth);
    canvas.height = Math.round(window.innerHeight);
    drawCover(ctx, canvas.width, canvas.height, true);
  } else {
    syncControls();
    drawPreview();
  }
  window.__ready = true;
}
boot();
