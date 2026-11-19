// Neon Coast Collage — a free-form GTA-style cover maker. Snapshot cards with
// white polaroid borders, tape and pins, draggable and rotatable on a neon
// coast backdrop (gradient sun, palm silhouettes), snap-to-grid guides,
// slab-serif title + neon script, undo/redo, one-click PNG export.
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const SIZES = { square: [1080, 1080], portrait: [1080, 1350], landscape: [1920, 1080] };
const PREVIEW = { square: [640, 640], portrait: [540, 675], landscape: [960, 540] };

const ARRANGEMENTS = [
  { id: 'fan', name: 'Fan', cards: [
    { x: 0.04, y: 0.13, w: 0.28, rot: -0.10 },
    { x: 0.27, y: 0.09, w: 0.30, rot: -0.03 },
    { x: 0.50, y: 0.13, w: 0.27, rot: 0.05 },
    { x: 0.74, y: 0.26, w: 0.22, rot: 0.08 }] },
  { id: 'stack', name: 'Cascade', cards: [
    { x: 0.06, y: 0.04, w: 0.36, rot: -0.07 },
    { x: 0.30, y: 0.12, w: 0.36, rot: 0.02 },
    { x: 0.62, y: 0.05, w: 0.34, rot: 0.08 }] },
  { id: 'row', name: 'Boardwalk row', cards: [
    { x: 0.05, y: 0.10, w: 0.28, rot: -0.04 },
    { x: 0.36, y: 0.06, w: 0.28, rot: 0.03 },
    { x: 0.67, y: 0.10, w: 0.28, rot: -0.02 }] },
];

const GRADES = [
  { id: 'vice', name: 'Vice Neon', sky: ['#2b0a4a', '#ff2975', '#ff8a00'], sun: ['#ffe14d', '#ff2975'], palm: 'rgba(12,4,28,0.9)' },
  { id: 'teal', name: 'Teal Dusk', sky: ['#04122b', '#0a5a6e', '#00f5d4'], sun: ['#b8fff4', '#00b39a'], palm: 'rgba(4,18,30,0.9)' },
  { id: 'pop', name: 'Sunset Pop', sky: ['#3a0ca3', '#f72585', '#ffb703'], sun: ['#fff3b0', '#fb8500'], palm: 'rgba(20,4,32,0.9)' },
];

const state = {
  layout: 'fan', grade: 'vice', size: 'landscape',
  title: 'SUNSET HEIST', subtitle: 'vice city nights', badge: 'VICE CITY',
  photos: [], selectedPhoto: 0, selectedCard: 0,
  cards: [],
};
let undoStack = [];
let redoStack = [];
let guideLines = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function buildCards() {
  const def = ARRANGEMENTS.find((a) => a.id === state.layout) ?? ARRANGEMENTS[0];
  // Each card gets its own crop of its photo, so two sample photos read as
  // four distinct framings instead of the same picture repeated.
  const CROPS = [
    { ox: 0, oy: 0, zoom: 1 },
    { ox: -0.08, oy: 0.05, zoom: 1.15 },
    { ox: 0, oy: 0.15, zoom: 1.5 },
    { ox: 0.08, oy: 0.10, zoom: 1.3 },
  ];
  state.cards = def.cards.map((c, i) => ({
    photo: state.photos.length > 1 ? i % state.photos.length : 0,
    x: c.x, y: c.y, w: c.w, rot: c.rot,
    ox: CROPS[i].ox, oy: CROPS[i].oy, zoom: CROPS[i].zoom,
    label: ['PIER 07', 'BOARDWALK', 'GOLDEN HOUR', 'SUNSET DRIVE'][i] ?? `SHOT ${i + 1}`,
  }));
  state.selectedCard = 0;
}

// Card geometry in pixels: white polaroid border, thicker at the foot.
function cardRect(c, W, H) {
  const photo = state.photos[c.photo] ?? state.photos[0];
  const cw = c.w * W;
  const aspect = photo ? photo.img.naturalHeight / photo.img.naturalWidth : 1;
  const ph = cw * aspect;
  const bw = Math.max(6, cw * 0.035);
  const foot = Math.max(16, cw * 0.14);
  return { x: c.x * W, y: c.y * H, w: cw + bw * 2, h: ph + bw + foot, bw, foot, photoW: cw, photoH: ph };
}

function drawNeonCoastBackdrop(c, w, h) {
  const g = GRADES.find((x) => x.id === state.grade) ?? GRADES[0];
  const sky = c.createLinearGradient(0, 0, 0, h);
  g.sky.forEach((s, i) => sky.addColorStop(i / (g.sky.length - 1), s));
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  // Retro striped sun, upper right, peeking above the fan of cards.
  // Centered low enough that the disc clears the frame's top edge.
  const sx = w * 0.80, sy = h * 0.16, sr = Math.min(w, h) * 0.12;
  const sun = c.createLinearGradient(0, sy - sr, 0, sy + sr);
  sun.addColorStop(0, g.sun[0]); sun.addColorStop(1, g.sun[1]);
  c.save();
  c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.clip();
  c.fillStyle = sun; c.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  c.fillStyle = g.sky[0];
  for (let i = 0; i < 4; i++) c.fillRect(sx - sr, sy + sr * (0.05 + i * 0.22), sr * 2, sr * 0.045);
  c.restore();
  drawPalmSilhouettes(c, w, h, g.palm);
}

function drawPalm(c, x, y, s, color, lean) {
  c.save();
  c.translate(x, y); c.scale(s, s); c.rotate(lean);
  c.strokeStyle = color; c.fillStyle = color; c.lineCap = 'round';
  // Trunk.
  c.lineWidth = 10;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -60, 16, -110); c.stroke();
  // Fronds.
  c.lineWidth = 7;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.08 + i * 0.17);
    const tx = 16 + Math.cos(a) * 62;
    const ty = -110 + Math.sin(a) * 34;
    c.beginPath(); c.moveTo(16, -110);
    c.quadraticCurveTo(16 + Math.cos(a) * 34, -110 + Math.sin(a) * 44, tx, ty);
    c.stroke();
  }
  c.restore();
}

function drawPalmSilhouettes(c, w, h, color) {
  drawPalm(c, -w * 0.01, h * 0.98, Math.min(w, h) * 0.0028, color, 0.1);
  drawPalm(c, w * 0.97, h * 1.0, Math.min(w, h) * 0.0026, color, -0.12);
  drawPalm(c, w * 0.14, h * 1.02, Math.min(w, h) * 0.002, color, 0.05);
}

function drawSnapshotCard(c, card, W, H, selected) {
  const r = cardRect(card, W, H);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  c.save();
  c.translate(cx, cy); c.rotate(card.rot);
  c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = W * 0.02; c.shadowOffsetY = W * 0.008;
  c.fillStyle = '#fffaf0';
  c.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
  c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
  // Photo, cover-fit inside the card's photo area, pannable + zoomable.
  const photo = state.photos[card.photo] ?? state.photos[0];
  const px = -r.photoW / 2, py = -r.h / 2 + r.bw;
  c.save();
  c.beginPath(); c.rect(px, py, r.photoW, r.photoH); c.clip();
  if (photo) {
    const base = Math.max(r.photoW / photo.img.naturalWidth, r.photoH / photo.img.naturalHeight) * card.zoom;
    const dw = photo.img.naturalWidth * base;
    const dh = photo.img.naturalHeight * base;
    c.drawImage(photo.img, px + (r.photoW - dw) / 2 + card.ox * r.photoW, py + (r.photoH - dh) / 2 + card.oy * r.photoH, dw, dh);
  } else { c.fillStyle = '#d9c8f5'; c.fillRect(px, py, r.photoW, r.photoH); }
  c.restore();
  // Tape strips on the top corners + a pin.
  c.fillStyle = 'rgba(255,225,77,0.75)';
  c.save(); c.translate(-r.w / 2 + r.bw * 0.4, -r.h / 2 - r.bw * 0.3); c.rotate(-0.5); c.fillRect(0, 0, r.w * 0.22, r.bw * 0.9); c.restore();
  c.save(); c.translate(r.w / 2 - r.bw * 0.4, -r.h / 2 - r.bw * 0.3); c.rotate(0.5); c.fillRect(-r.w * 0.22, 0, r.w * 0.22, r.bw * 0.9); c.restore();
  c.fillStyle = '#ff2975';
  c.beginPath(); c.arc(0, -r.h / 2 + r.bw * 0.4, Math.max(3, r.bw * 0.35), 0, Math.PI * 2); c.fill();
  // Polaroid label on the foot.
  c.fillStyle = '#241640';
  c.font = `700 ${Math.max(9, r.foot * 0.42)}px system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(card.label, 0, r.h / 2 - r.foot / 2);
  if (selected) {
    c.strokeStyle = '#ffe14d'; c.lineWidth = Math.max(2, W * 0.004);
    c.setLineDash([W * 0.012, W * 0.008]);
    c.strokeRect(-r.w / 2 - 4, -r.h / 2 - 4, r.w + 8, r.h + 8);
    c.setLineDash([]);
  }
  c.restore();
}

let noiseCanvas = null;
function makeGrain() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 160; noiseCanvas.height = 160;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 30;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

function fitFont(c, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  c.font = `${weight} ${size}px ${family}`;
  while (c.measureText(text).width > maxWidth && size > 10) {
    size -= 2; c.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawCollageTitle(c, w, h) {
  // Soft dark band so the title stays readable over the palms.
  const band = c.createLinearGradient(0, h * 0.66, 0, h);
  band.addColorStop(0, 'rgba(8,3,22,0)');
  band.addColorStop(1, 'rgba(8,3,22,0.85)');
  c.fillStyle = band; c.fillRect(0, h * 0.66, w, h * 0.34);
  const title = state.title.trim().toUpperCase() || 'UNTITLED';
  const tSize = fitFont(c, title, w * 0.62, h * 0.11, '"Alfa Slab One", serif');
  const tg = c.createLinearGradient(0, h - h * 0.24, 0, h - h * 0.02);
  tg.addColorStop(0, '#ffe14d'); tg.addColorStop(0.55, '#ff2975'); tg.addColorStop(1, '#7b2ff7');
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = `${tSize}px "Alfa Slab One", serif`;
  c.lineWidth = Math.max(2, tSize * 0.06);
  c.strokeStyle = 'rgba(10,3,24,0.95)';
  c.strokeText(title, w * 0.04, h - h * 0.10);
  c.fillStyle = tg;
  c.fillText(title, w * 0.04, h - h * 0.10);
  const sub = state.subtitle.trim();
  if (sub) {
    const sSize = fitFont(c, sub, w * 0.5, h * 0.058, '"Caveat", cursive', '700 ');
    c.font = `700 ${sSize}px "Caveat", cursive`;
    c.shadowColor = '#ff2975'; c.shadowBlur = sSize * 0.4;
    c.fillStyle = '#ffe14d';
    c.fillText(sub, w * 0.045, h - h * 0.03);
    c.shadowBlur = 0;
  }
  // Circular sticker stamp, bottom-right over the dark title band, fully
  // inside the frame and clear of the fourth card's foot (it used to sit on
  // the sun at top-right, half-covered).
  const g = GRADES.find((x) => x.id === state.grade) ?? GRADES[0];
  c.save();
  c.translate(w * 0.90, h * 0.90); c.rotate(-0.2);
  const rr = Math.max(24, h * 0.06);
  c.strokeStyle = '#ffe14d'; c.lineWidth = Math.max(2, rr * 0.07);
  c.beginPath(); c.arc(0, 0, rr, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(0, 0, rr * 0.78, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#ffe14d';
  c.font = `700 ${rr * 0.26}px "Alfa Slab One", serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const badge = (state.badge.trim().toUpperCase() || 'VICE CITY').split(' ');
  badge.forEach((word, i) => c.fillText(word, 0, (i - (badge.length - 1) / 2) * rr * 0.34));
  c.restore();
}

function drawSnapGuides(c, w, h) {
  if (!guideLines.length) return;
  c.save();
  c.strokeStyle = 'rgba(255,225,77,0.9)'; c.lineWidth = 1.5; c.setLineDash([6, 4]);
  guideLines.forEach((x) => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); });
  c.restore();
}

function drawCoverAt(c, w, h) {
  drawNeonCoastBackdrop(c, w, h);
  // In a cover shot no card is "selected": the selection outline must not
  // appear on an exported cover.
  const sel = state.coverShot ? -1 : state.selectedCard;
  state.cards.forEach((card, i) => drawSnapshotCard(c, card, w, h, i === sel));
  drawSnapGuides(c, w, h);
  drawCollageTitle(c, w, h);
  const pat = c.createPattern(makeGrain(), 'repeat');
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.45;
  c.fillStyle = pat; c.fillRect(0, 0, w, h); c.restore();
}

// ---- preview, export, interaction, undo, shot scenes ----
function redraw() {
  const [pw, ph] = PREVIEW[state.size];
  if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  drawCoverAt(ctx, canvas.width, canvas.height);
}

function snapshot() {
  return JSON.stringify({ layout: state.layout, grade: state.grade, size: state.size, title: state.title, subtitle: state.subtitle, badge: state.badge, cards: state.cards });
}
function restore(snap) {
  const s = JSON.parse(snap);
  Object.assign(state, { layout: s.layout, grade: s.grade, size: s.size, title: s.title, subtitle: s.subtitle, badge: s.badge, cards: s.cards });
  syncControls();
  redraw();
}
function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 40) undoStack.shift(); redoStack = []; }
function undoCover() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redoCover() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

function exportCoverPNG(w, h, label) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const prev = state.coverShot;
  state.coverShot = true;
  drawCoverAt(off.getContext('2d'), w, h);
  state.coverShot = prev;
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    statusEl.textContent = `Saved cover-${w}x${h}.png (${label})`;
  }, 'image/png');
}

function buildPickers() {
  const lb = document.getElementById('layoutBar');
  ARRANGEMENTS.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = a.name; b.dataset.id = a.id;
    b.addEventListener('click', () => { pushUndo(); state.layout = a.id; buildCards(); syncControls(); redraw(); });
    lb.appendChild(b);
  });
  const gb = document.getElementById('gradeBar');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = g.name; b.dataset.id = g.id;
    b.addEventListener('click', () => { pushUndo(); state.grade = g.id; syncControls(); redraw(); });
    gb.appendChild(b);
  });
}

function syncControls() {
  document.querySelectorAll('#layoutBar button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.layout));
  document.querySelectorAll('#gradeBar button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.grade));
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.querySelectorAll('#photoSlots img').forEach((img, i) => img.classList.toggle('selected', i === state.selectedPhoto));
}

function renderSlots() {
  const box = document.getElementById('photoSlots');
  box.innerHTML = '';
  state.photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.img.src; img.alt = p.name;
    img.classList.toggle('selected', i === state.selectedPhoto);
    img.addEventListener('click', () => {
      state.selectedPhoto = i;
      const card = state.cards[state.selectedCard];
      if (card) card.photo = i;
      syncControls(); redraw();
    });
    box.appendChild(img);
  });
}

function hitCard(mx, my) {
  for (let i = state.cards.length - 1; i >= 0; i--) {
    const card = state.cards[i];
    const r = cardRect(card, canvas.width, canvas.height);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const dx = mx - cx, dy = my - cy;
    const lx = dx * Math.cos(-card.rot) - dy * Math.sin(-card.rot);
    const ly = dx * Math.sin(-card.rot) + dy * Math.cos(-card.rot);
    if (Math.abs(lx) <= r.w / 2 && Math.abs(ly) <= r.h / 2) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const i = hitCard(mx, my);
  if (i < 0) return;
  state.selectedCard = i;
  const card = state.cards[i];
  drag = { i, x: mx, y: my, cx: card.x, cy: card.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const card = state.cards[drag.i];
  card.x = Math.max(-0.1, Math.min(0.95, drag.cx + (mx - drag.x) / canvas.width));
  card.y = Math.max(-0.1, Math.min(0.9, drag.cy + (my - drag.y) / canvas.height));
  // Snap guides: show when a card edge nears a 1/12 grid line.
  guideLines = [];
  const gx = card.x * canvas.width;
  const step = canvas.width / 12;
  const near = Math.round(gx / step) * step;
  if (Math.abs(gx - near) < 14) guideLines.push(near);
  if (Math.abs(mx - drag.x) + Math.abs(my - drag.y) > 4) drag.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag) {
    const card = state.cards[drag.i];
    // Snap-to-grid on release so compositions stay clean.
    card.x = Math.round(card.x * 24) / 24;
    card.y = Math.round(card.y * 24) / 24;
    guideLines = [];
    if (drag.moved) pushUndo();
    drag = null;
    redraw();
  }
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const i = hitCard(mx, my);
  if (i < 0) return;
  pushUndo();
  const card = state.cards[i];
  card.zoom = Math.max(1, Math.min(4, card.zoom * Math.exp(-e.deltaY * 0.0012)));
  redraw();
}, { passive: false });

document.getElementById('photoInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ img, name: file.name });
    if (state.cards.length < 4) {
      state.cards.push({ photo: state.photos.length - 1, x: 0.1 + state.cards.length * 0.2, y: 0.1, w: 0.28, rot: 0.04 * state.cards.length, ox: 0, oy: 0, zoom: 1, label: file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 12) });
    }
  }
  if (state.photos.length) { state.selectedPhoto = state.photos.length - 1; }
  renderSlots(); redraw();
});
document.getElementById('fillAll').addEventListener('click', () => {
  const card = state.cards[state.selectedCard];
  if (!card) return;
  pushUndo();
  card.photo = state.selectedPhoto;
  redraw();
});
document.getElementById('rotateBtn').addEventListener('click', () => {
  const card = state.cards[state.selectedCard];
  if (!card) return;
  pushUndo();
  card.rot += Math.PI / 12;
  redraw();
});
document.getElementById('titleInput').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('badgeInput').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('undoBtn').addEventListener('click', undoCover);
document.getElementById('redoBtn').addEventListener('click', redoCover);
for (const [key, [w, h]] of Object.entries(SIZES)) {
  const cap = key[0].toUpperCase() + key.slice(1);
  document.getElementById(`size${cap}`).addEventListener('click', () => { pushUndo(); state.size = key; redraw(); });
  document.getElementById(`export${cap}`).addEventListener('click', () => exportCoverPNG(w, h, key));
}

// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// viewport's size; ?shot=editor shows the editor with a sample photo loaded.
// window.__shotReady is set once painted.
async function runShotScene() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return false;
  const photoName = q.get('photo') ?? 'pier';
  const img = await loadImage(`samples/${photoName}.jpg`);
  state.photos = [{ img, name: photoName }];
  try { const img2 = await loadImage(`samples/${photoName === 'pier' ? 'boulevard' : 'pier'}.jpg`); state.photos.push({ img: img2, name: photoName === 'pier' ? 'boulevard' : 'pier' }); } catch { /* one photo is enough */ }
  buildCards();
  state.title = q.get('caption') ?? q.get('title') ?? state.title;
  if (q.get('subtitle')) state.subtitle = q.get('subtitle');
  if (q.get('layout')) { state.layout = q.get('layout'); buildCards(); }
  if (q.get('grade')) state.grade = q.get('grade');
  if (q.get('size')) state.size = q.get('size');
  renderSlots(); syncControls();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.coverShot = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCoverAt(ctx, canvas.width, canvas.height);
  } else {
    redraw();
  }
  await document.fonts.ready;
  if (shot === 'cover') drawCoverAt(ctx, canvas.width, canvas.height);
  else redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  return true;
}

buildPickers();
syncControls();
(async () => {
  try { await document.fonts.load('16px "Alfa Slab One"'); await document.fonts.load('700 16px "Caveat"'); } catch { /* system fallback */ }
  const shot = await runShotScene();
  if (!shot) {
    for (const name of ['boulevard', 'pier']) {
      try { const img = await loadImage(`samples/${name}.jpg`); state.photos.push({ img, name }); } catch { /* sample missing */ }
    }
    buildCards();
    renderSlots();
    redraw();
  }
  if (!new URLSearchParams(location.search).get('shot')) {
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  }
})();
