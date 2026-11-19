'use strict';

const SIZES = {
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' }
};

const SAMPLES = [
  { file: 'samples/sample1-hero.jpg', label: 'Boulevard Chase', caption: 'Neon boulevard - the getaway', fy: 0.49 },
  { file: 'samples/sample2-ferris.jpg', label: 'Boardwalk Lights', caption: 'Ferris wheel over the pier', fy: 0.48 },
  { file: 'samples/sample3-heist.jpg', label: 'Heist Standoff', caption: 'Heist vs police - the standoff', fy: 0.56 },
  { file: 'samples/sample4-skate.jpg', label: 'Night Skate', caption: 'Skateboard under neon', fy: 0.48 }
];

const TITLE_FONT = '"Anton", "Trebuchet MS", sans-serif';

const canvas = document.getElementById('cover');

function layoutFor(size) {
  if (size === 'portrait') {
    return {
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      strip: 40,
      rects: [
        { x: 0, y: 0, w: 1080, h: 810, fx: 0.5, fy: 0.55, zoom: 1.1 },
        { x: 0, y: 810, w: 360, h: 540, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 810, w: 360, h: 540, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 720, y: 810, w: 360, h: 540, fx: 0.5, fy: 0.62, zoom: 1.8 }
      ]
    };
  }
  if (size === 'square') {
    return {
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      strip: 38,
      rects: [
        { x: 0, y: 0, w: 1080, h: 594, fx: 0.5, fy: 0.56, zoom: 1 },
        { x: 0, y: 594, w: 360, h: 486, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 594, w: 360, h: 486, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 720, y: 594, w: 360, h: 486, fx: 0.5, fy: 0.60, zoom: 1.7 }
      ]
    };
  }
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    strip: 46,
    rects: [
      { x: 0, y: 0, w: 1152, h: 1080, fx: 0.5, fy: 0.49, zoom: 1.15 },
      { x: 1152, y: 0, w: 768, h: 360, fx: 0.5, fy: 0.48, zoom: 1 },
      { x: 1152, y: 360, w: 768, h: 360, fx: 0.5, fy: 0.56, zoom: 1 },
      { x: 1152, y: 720, w: 768, h: 360, fx: 0.5, fy: 0.48, zoom: 1 }
    ]
  };
}

function diagonalLayout() {
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    strip: 46,
    rects: [
      { x: 0, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.50, zoom: 1.6, slant: 60 },
      { x: 480, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.60, zoom: 1.5, slant: 60 },
      { x: 960, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.58, zoom: 1.5, slant: 60 },
      { x: 1440, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.62, zoom: 1.55, slant: 60 }
    ]
  };
}

const state = {
  size: 'landscape',
  title: 'NEON COAST',
  layoutOverride: null,
  panels: SAMPLES.map(function (s) {
    return {
      label: s.label,
      caption: s.caption,
      file: s.file,
      image: null,
      loaded: false,
      fx: 0.5,
      fy: s.fy,
      sampleFy: s.fy,
      zoom: 1,
      ox: 0,
      oy: 0,
      tilt: 0
    };
  })
};

function layoutToDraw() {
  if (state.layoutOverride === 'diagonal' && state.size === 'landscape') return diagonalLayout();
  return layoutFor(state.size);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function rectPath(ctx, r) {
  const s = r.slant || 0;
  ctx.beginPath();
  ctx.moveTo(r.x + s, r.y);
  ctx.lineTo(r.x + r.w + s, r.y);
  ctx.lineTo(r.x + r.w - s, r.y + r.h);
  ctx.lineTo(r.x - s, r.y + r.h);
  ctx.closePath();
}

function hitPanel(layout, px, py) {
  for (let i = layout.rects.length - 1; i >= 0; i--) {
    const r = layout.rects[i];
    const s = r.slant || 0;
    if (py < r.y || py > r.y + r.h) continue;
    const t = r.h === 0 ? 0 : (py - r.y) / r.h;
    const left = r.x + s - 2 * s * t;
    const right = r.x + r.w + s - 2 * s * t;
    if (px >= left && px <= right) return i;
  }
  return -1;
}

function drawPanel(ctx, panel, rect) {
  const effZoom = (rect.zoom || 1) * (panel.zoom || 1);
  if (effZoom <= 1) {
    panel.ox = 0;
    panel.oy = 0;
  }
  if (!panel.loaded || !panel.image) {
    ctx.save();
    rectPath(ctx, rect);
    ctx.fillStyle = '#2a1650';
    ctx.fill();
    ctx.restore();
    return;
  }
  const img = panel.image;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const fx = rect.fx !== undefined ? rect.fx : panel.fx;
  const fy = rect.fy !== undefined ? rect.fy : panel.fy;
  let scale = Math.max(rect.w / iw, rect.h / ih) * effZoom;
  if ((rect.slant || 0) !== 0 || (panel.tilt || 0) !== 0) scale *= 1.02;
  const dw = iw * scale;
  const dh = ih * scale;
  let dx = rect.x + rect.w / 2 - fx * dw;
  let dy = rect.y + rect.h / 2 - fy * dh;
  const panX = effZoom <= 1 ? 0 : (panel.ox || 0);
  const panY = effZoom <= 1 ? 0 : (panel.oy || 0);
  dx += panX;
  dy += panY;
  dx = clamp(dx, rect.x + rect.w - dw, rect.x);
  dy = clamp(dy, rect.y + rect.h - dh, rect.y);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  rectPath(ctx, rect);
  ctx.clip();
  ctx.translate(cx, cy);
  if (panel.tilt) ctx.rotate(panel.tilt * Math.PI / 180);
  ctx.translate(-cx, -cy);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawCover(ctx, sizeKey, layout) {
  const size = SIZES[sizeKey];
  const grad = ctx.createLinearGradient(0, 0, 0, size.h);
  grad.addColorStop(0, '#1b1035');
  grad.addColorStop(0.45, '#4b1560');
  grad.addColorStop(0.75, '#b81e6e');
  grad.addColorStop(1, '#ff7a18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size.w, size.h);
  for (let i = 0; i < 4; i++) drawPanel(ctx, state.panels[i], layout.rects[i]);
  const t = layout.title;
  const scrim = ctx.createLinearGradient(0, 0, 0, t.scrim);
  scrim.addColorStop(0, 'rgba(10, 5, 25, 0.78)');
  scrim.addColorStop(1, 'rgba(10, 5, 25, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, size.w, t.scrim);
  ctx.font = t.size + 'px ' + TITLE_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.9)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.title, t.x, t.y);
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function renderPreview() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state.size, layoutToDraw());
}

function exportPNG(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const ctx = off.getContext('2d');
  drawCover(ctx, sizeKey, layoutFor(sizeKey));
  off.toBlob(function (blob) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neon-coast-' + sizeKey + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }, 'image/png');
}

function setPanelImage(index, dataUrl) {
  return new Promise(function (resolve) {
    const panel = state.panels[index];
    const img = new Image();
    img.onload = function () {
      panel.image = img;
      panel.loaded = true;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.fx = 0.5;
      panel.fy = panel.sampleFy;
      const slotImg = document.querySelector('[data-slot-img="' + index + '"]');
      if (slotImg) slotImg.src = dataUrl;
      const slider = document.querySelector('[data-slot-zoom="' + index + '"]');
      if (slider) slider.value = '1';
      renderPreview();
      resolve(true);
    };
    img.onerror = function () { resolve(false); };
    img.src = dataUrl;
  });
}

function probePanels() {
  const size = SIZES[state.size];
  const layout = layoutToDraw();
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const ctx = off.getContext('2d');
  drawCover(ctx, state.size, layout);
  const out = [];
  for (let i = 0; i < layout.rects.length; i++) {
    const r = layout.rects[i];
    const x = Math.floor(r.x + r.w / 2);
    const y = Math.floor(r.y + r.h / 2 - 10);
    const d = ctx.getImageData(x, y, 1, 1).data;
    out.push({ r: d[0], g: d[1], b: d[2] });
  }
  return out;
}

function buildSlots() {
  const host = document.getElementById('slots');
  host.textContent = '';
  state.panels.forEach(function (panel, index) {
    const card = document.createElement('div');
    card.className = 'slot';
    const head = document.createElement('div');
    head.className = 'slot-head';
    const strong = document.createElement('strong');
    strong.textContent = 'Snapshot ' + (index + 1);
    const span = document.createElement('span');
    span.textContent = 'fills panel ' + (index + 1) + ' — ' + panel.label;
    head.appendChild(strong);
    head.appendChild(span);
    card.appendChild(head);
    const img = document.createElement('img');
    img.setAttribute('data-slot-img', String(index));
    img.src = panel.file;
    img.alt = panel.label;
    card.appendChild(img);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('aria-label', 'Upload photo for panel ' + (index + 1));
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () { setPanelImage(index, String(reader.result)); };
      reader.readAsDataURL(file);
    });
    card.appendChild(input);
    const controls = document.createElement('div');
    controls.className = 'slot-controls';
    [-1.5, 0, 1.5].forEach(function (deg) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ghost';
      b.textContent = (deg > 0 ? '+' : '') + deg + '°';
      b.addEventListener('click', function () {
        panel.tilt = deg;
        renderPreview();
      });
      controls.appendChild(b);
    });
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '3';
    slider.step = '0.05';
    slider.value = '1';
    slider.setAttribute('data-slot-zoom', String(index));
    slider.setAttribute('aria-label', 'Zoom panel ' + (index + 1));
    slider.addEventListener('input', function () {
      panel.zoom = parseFloat(slider.value) || 1;
      renderPreview();
    });
    controls.appendChild(slider);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ghost';
    reset.textContent = 'Reset crop';
    reset.addEventListener('click', function () {
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.tilt = 0;
      panel.fx = 0.5;
      panel.fy = panel.sampleFy;
      slider.value = '1';
      renderPreview();
    });
    controls.appendChild(reset);
    card.appendChild(controls);
    host.appendChild(card);
  });
}

function canvasPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - rect.left) * (canvas.width / rect.width),
    y: (ev.clientY - rect.top) * (canvas.height / rect.height)
  };
}

let drag = null;

canvas.addEventListener('pointerdown', function (ev) {
  const p = canvasPoint(ev);
  const layout = layoutToDraw();
  const idx = hitPanel(layout, p.x, p.y);
  if (idx < 0) return;
  const r = layout.rects[idx];
  const inStrip = p.y > r.y + r.h - layout.strip;
  drag = {
    index: idx,
    swap: inStrip,
    startX: p.x,
    startY: p.y,
    ox: state.panels[idx].ox,
    oy: state.panels[idx].oy,
    moved: false
  };
  try { canvas.setPointerCapture(ev.pointerId); } catch (err) { /* pointer already gone */ }
  ev.preventDefault();
});

canvas.addEventListener('pointermove', function (ev) {
  if (!drag) return;
  const p = canvasPoint(ev);
  const dx = p.x - drag.startX;
  const dy = p.y - drag.startY;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
  if (drag.swap) return;
  const panel = state.panels[drag.index];
  panel.ox = drag.ox + dx;
  panel.oy = drag.oy + dy;
  renderPreview();
});

canvas.addEventListener('pointerup', function (ev) {
  if (!drag) return;
  const p = canvasPoint(ev);
  const layout = layoutToDraw();
  if (drag.swap) {
    const target = hitPanel(layout, p.x, p.y);
    if (target >= 0 && target !== drag.index) {
      const tmp = state.panels[drag.index];
      state.panels[drag.index] = state.panels[target];
      state.panels[target] = tmp;
      buildSlots();
    }
  }
  drag = null;
  renderPreview();
});

canvas.addEventListener('pointercancel', function () {
  drag = null;
});

canvas.addEventListener('wheel', function (ev) {
  ev.preventDefault();
  const p = canvasPoint(ev);
  const layout = layoutToDraw();
  const idx = hitPanel(layout, p.x, p.y);
  if (idx < 0) return;
  const panel = state.panels[idx];
  const factor = ev.deltaY < 0 ? 1.08 : 0.93;
  panel.zoom = clamp((panel.zoom || 1) * factor, 1, 3);
  const slider = document.querySelector('[data-slot-zoom="' + idx + '"]');
  if (slider) slider.value = String(panel.zoom);
  renderPreview();
}, { passive: false });

function loadImage(file) {
  return new Promise(function (resolve) {
    const img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { resolve(null); };
    img.src = file;
  });
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const sizeParam = params.get('size');
  if (sizeParam && SIZES[sizeParam]) state.size = sizeParam;
  if (params.get('layout') === 'diagonal') state.layoutOverride = 'diagonal';
  if (params.get('scene') === 'cover') document.body.classList.add('scene-cover');
  buildSlots();
  document.querySelectorAll('[data-size]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const key = btn.getAttribute('data-size');
      if (!SIZES[key]) return;
      state.size = key;
      document.querySelectorAll('[data-size]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      renderPreview();
    });
    if (btn.getAttribute('data-size') === state.size) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  const titleInput = document.getElementById('title-input');
  if (titleInput) {
    titleInput.addEventListener('input', function () {
      state.title = titleInput.value.toUpperCase();
      renderPreview();
    });
  }
  const exportOne = document.getElementById('export-one');
  if (exportOne) exportOne.addEventListener('click', function () { exportPNG(state.size); });
  const exportAll = document.getElementById('export-all');
  if (exportAll) exportAll.addEventListener('click', function () {
    const keys = ['landscape', 'portrait', 'square'];
    keys.forEach(function (key, i) {
      setTimeout(function () { exportPNG(key); }, i * 250);
    });
  });
  const fontLoads = [];
  try {
    if (document.fonts && document.fonts.load) {
      fontLoads.push(document.fonts.load('140px Anton').catch(function () { return null; }));
      fontLoads.push(document.fonts.load('84px Anton').catch(function () { return null; }));
    }
  } catch (err) { /* continue with system fonts */ }
  const imageLoads = state.panels.map(function (panel) {
    return loadImage(panel.file).then(function (img) {
      if (img) {
        panel.image = img;
        panel.loaded = true;
      } else {
        panel.image = null;
        panel.loaded = false;
      }
    });
  });
  Promise.all(fontLoads.concat(imageLoads)).then(function () {
    const done = function () {
      renderPreview();
      document.body.setAttribute('data-ready', 'ready');
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(done, done);
    } else {
      done();
    }
  }).catch(function () {
    renderPreview();
    document.body.setAttribute('data-ready', 'ready');
  });
  renderPreview();
}

window.__cover = {
  state: state,
  layoutFor: layoutFor,
  diagonalLayout: diagonalLayout,
  layoutToDraw: layoutToDraw,
  exportPNG: exportPNG,
  renderPreview: renderPreview,
  setPanelImage: setPanelImage,
  probePanels: probePanels
};

init();
