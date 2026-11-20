'use strict';

var SIZES = {
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' }
};

var SAMPLES = [
  { file: 'samples/sample1-hero.jpg', label: 'Boulevard Chase', caption: 'Neon boulevard - the getaway', fy: 0.49 },
  { file: 'samples/sample2-ferris.jpg', label: 'Boardwalk Lights', caption: 'Ferris wheel over the pier', fy: 0.48 },
  { file: 'samples/sample3-heist.jpg', label: 'Heist Standoff', caption: 'Heist vs police - the standoff', fy: 0.56 },
  { file: 'samples/sample4-skate.jpg', label: 'Night Skate', caption: 'Skateboard under neon', fy: 0.48 }
];

function layoutFor(sizeKey) {
  if (sizeKey === 'portrait') {
    return {
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      rects: [
        { x: 0, y: 0, w: 1080, h: 810, fx: 0.5, fy: 0.55, zoom: 1.1 },
        { x: 0, y: 810, w: 360, h: 540, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 810, w: 360, h: 540, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 720, y: 810, w: 360, h: 540, fx: 0.5, fy: 0.62, zoom: 1.8 }
      ],
      strip: 40
    };
  }
  if (sizeKey === 'square') {
    return {
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      rects: [
        { x: 0, y: 0, w: 1080, h: 594, fx: 0.5, fy: 0.56, zoom: 1 },
        { x: 0, y: 594, w: 360, h: 486, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 594, w: 360, h: 486, fx: 0.5, fy: 0.58, zoom: 1.5 },
        { x: 720, y: 594, w: 360, h: 486, fx: 0.5, fy: 0.60, zoom: 1.7 }
      ],
      strip: 38
    };
  }
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    rects: [
      { x: 0, y: 0, w: 1152, h: 1080, fx: 0.5, fy: 0.49, zoom: 1.15 },
      { x: 1152, y: 0, w: 768, h: 360, fx: 0.5, fy: 0.48, zoom: 1 },
      { x: 1152, y: 360, w: 768, h: 360, fx: 0.5, fy: 0.56, zoom: 1 },
      { x: 1152, y: 720, w: 768, h: 360, fx: 0.5, fy: 0.48, zoom: 1 }
    ],
    strip: 46
  };
}

function diagonalLayout() {
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    rects: [
      { x: 0, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.50, zoom: 1.6, slant: 60 },
      { x: 480, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.60, zoom: 1.5, slant: 60 },
      { x: 960, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.58, zoom: 1.5, slant: 60 },
      { x: 1440, y: 0, w: 480, h: 1080, fx: 0.5, fy: 0.62, zoom: 1.55, slant: 60 }
    ],
    strip: 46
  };
}

function layoutToDraw() {
  if (state.layoutOverride === 'diagonal' && state.size === 'landscape') {
    return diagonalLayout();
  }
  return layoutFor(state.size);
}

var state = {
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
      zoom: 1,
      ox: 0,
      oy: 0,
      tilt: 0
    };
  })
};

var canvas = document.getElementById('cover');
var ctx = canvas.getContext('2d');

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function effectiveCrop(panel, rect) {
  var fx = rect.fx !== undefined ? rect.fx : panel.fx;
  var fy = rect.fy !== undefined ? rect.fy : panel.fy;
  var baseZoom = rect.zoom !== undefined ? rect.zoom : 1;
  return { fx: fx, fy: fy, zoom: baseZoom * panel.zoom };
}

function clipRect(c, rect) {
  c.beginPath();
  if (rect.slant) {
    var s = rect.slant;
    c.moveTo(rect.x + s, rect.y);
    c.lineTo(rect.x + rect.w + s, rect.y);
    c.lineTo(rect.x + rect.w - s, rect.y + rect.h);
    c.lineTo(rect.x - s, rect.y + rect.h);
    c.closePath();
  } else {
    c.rect(rect.x, rect.y, rect.w, rect.h);
  }
  c.clip();
}

function drawPanel(c, panel, rect) {
  c.save();
  clipRect(c, rect);
  var crop = effectiveCrop(panel, rect);
  if (crop.zoom <= 1) {
    panel.ox = 0;
    panel.oy = 0;
  }
  if (!panel.loaded || !panel.image) {
    c.fillStyle = '#2a1650';
    c.fillRect(rect.x - 80, rect.y - 80, rect.w + 160, rect.h + 160);
    c.restore();
    return;
  }
  var img = panel.image;
  var iw = img.naturalWidth || img.width;
  var ih = img.naturalHeight || img.height;
  var baseScale = Math.max(rect.w / iw, rect.h / ih);
  var slanted = !!rect.slant || panel.tilt !== 0;
  var scale = baseScale * crop.zoom * (slanted ? 1.02 : 1);
  var dw = iw * scale;
  var dh = ih * scale;
  var maxShiftX = Math.max(0, (dw - rect.w) / 2);
  var maxShiftY = Math.max(0, (dh - rect.h) / 2);
  var focalX = clamp(-(crop.fx - 0.5) * dw, -maxShiftX, maxShiftX);
  var focalY = clamp(-(crop.fy - 0.5) * dh, -maxShiftY, maxShiftY);
  var shiftX = clamp(focalX + panel.ox, -maxShiftX, maxShiftX);
  var shiftY = clamp(focalY + panel.oy, -maxShiftY, maxShiftY);
  var dx = rect.x + rect.w / 2 - dw / 2 + shiftX;
  var dy = rect.y + rect.h / 2 - dh / 2 + shiftY;
  var cx = rect.x + rect.w / 2;
  var cy = rect.y + rect.h / 2;
  if (panel.tilt !== 0) {
    c.translate(cx, cy);
    c.rotate(panel.tilt * Math.PI / 180);
    c.translate(-cx, -cy);
  }
  c.drawImage(img, dx, dy, dw, dh);
  c.restore();
}

function drawCover(c, sizeKey, layout) {
  var size = SIZES[sizeKey];
  var w = size.w;
  var h = size.h;
  var grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1b1035');
  grad.addColorStop(0.45, '#4b1560');
  grad.addColorStop(0.75, '#b81e6e');
  grad.addColorStop(1, '#ff7a18');
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
  for (var i = 0; i < 4; i++) {
    drawPanel(c, state.panels[i], layout.rects[i]);
  }
  var t = layout.title;
  var scrim = c.createLinearGradient(0, 0, 0, t.scrim);
  scrim.addColorStop(0, 'rgba(10, 5, 25, 0.78)');
  scrim.addColorStop(1, 'rgba(10, 5, 25, 0)');
  c.fillStyle = scrim;
  c.fillRect(0, 0, w, t.scrim);
  c.save();
  c.font = t.size + 'px "Anton", "Trebuchet MS", sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.shadowColor = 'rgba(255, 46, 136, 0.9)';
  c.shadowBlur = 0;
  c.shadowOffsetX = 4;
  c.shadowOffsetY = 4;
  c.fillStyle = '#ffffff';
  c.fillText(state.title, t.x, t.y);
  c.restore();
}

function renderPreview() {
  var size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(ctx, state.size, layoutToDraw());
}

function downloadCanvas(off, name) {
  return new Promise(function (resolve) {
    off.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); resolve(); }, 100);
    }, 'image/png');
  });
}

function exportPNG(sizeKey) {
  var key = sizeKey || state.size;
  var size = SIZES[key];
  var off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), key, layoutFor(key));
  return downloadCanvas(off, 'neon-coast-' + key + '.png');
}

function exportAll() {
  var keys = ['landscape', 'portrait', 'square'];
  var chain = Promise.resolve();
  keys.forEach(function (key, idx) {
    chain = chain.then(function () {
      if (idx > 0) {
        return new Promise(function (res) { setTimeout(res, 250); });
      }
    }).then(function () { return exportPNG(key); });
  });
  return chain;
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error('failed to load ' + src)); };
    img.src = src;
  });
}

function setPanelImage(index, dataUrl) {
  return loadImage(dataUrl).then(function (img) {
    var panel = state.panels[index];
    panel.image = img;
    panel.loaded = true;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    var slotImg = document.querySelector('.slot-img[data-panel="' + index + '"]');
    if (slotImg) { slotImg.src = dataUrl; }
    renderPreview();
  });
}

function probePanels() {
  var size = SIZES[state.size];
  var layout = layoutToDraw();
  var off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  var c = off.getContext('2d');
  drawCover(c, state.size, layout);
  return layout.rects.map(function (rect) {
    var px = Math.floor(rect.x + rect.w / 2);
    var py = Math.floor(rect.y + rect.h / 2 - 10);
    var d = c.getImageData(px, py, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  });
}

function hitPanel(clientX, clientY) {
  var bounds = canvas.getBoundingClientRect();
  var x = (clientX - bounds.left) * (canvas.width / bounds.width);
  var y = (clientY - bounds.top) * (canvas.height / bounds.height);
  var layout = layoutToDraw();
  for (var i = layout.rects.length - 1; i >= 0; i--) {
    var r = layout.rects[i];
    if (y < r.y || y > r.y + r.h) { continue; }
    if (r.slant) {
      var t = (y - r.y) / r.h;
      var left = r.x + r.slant - 2 * r.slant * t;
      var right = r.x + r.w + r.slant - 2 * r.slant * t;
      if (x >= left && x <= right) { return { index: i, x: x, y: y, rect: r }; }
    } else if (x >= r.x && x <= r.x + r.w) {
      return { index: i, x: x, y: y, rect: r };
    }
  }
  return null;
}

function buildSlots() {
  var host = document.getElementById('slots');
  host.innerHTML = '';
  state.panels.forEach(function (panel, i) {
    var card = document.createElement('div');
    card.className = 'slot';

    var head = document.createElement('div');
    head.className = 'slot-head';
    var strong = document.createElement('strong');
    strong.textContent = 'Snapshot ' + (i + 1);
    var span = document.createElement('span');
    span.textContent = 'fills panel ' + (i + 1) + ' — ' + panel.label;
    head.appendChild(strong);
    head.appendChild(span);
    card.appendChild(head);

    var preview = document.createElement('img');
    preview.className = 'slot-img';
    preview.setAttribute('data-panel', String(i));
    preview.alt = panel.label;
    preview.src = panel.file;
    card.appendChild(preview);

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) { return; }
      var reader = new FileReader();
      reader.onload = function () {
        var sample = SAMPLES[i];
        panel.fx = 0.5;
        panel.fy = sample.fy;
        setPanelImage(i, String(reader.result));
      };
      reader.readAsDataURL(file);
    });
    card.appendChild(fileInput);

    var controls = document.createElement('div');
    controls.className = 'slot-controls';

    [-1.5, 0, 1.5].forEach(function (deg) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ghost';
      b.textContent = (deg > 0 ? '+' : '') + deg + '°';
      b.addEventListener('click', function () {
        panel.tilt = deg;
        renderPreview();
      });
      controls.appendChild(b);
    });

    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '3';
    slider.step = '0.05';
    slider.value = '1';
    slider.setAttribute('aria-label', 'Zoom panel ' + (i + 1));
    slider.addEventListener('input', function () {
      panel.zoom = parseFloat(slider.value);
      renderPreview();
    });
    controls.appendChild(slider);

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ghost';
    reset.textContent = 'Reset crop';
    reset.addEventListener('click', function () {
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.tilt = 0;
      slider.value = '1';
      renderPreview();
    });
    controls.appendChild(reset);

    card.appendChild(controls);
    host.appendChild(card);
  });
}

function bindToolbar() {
  var sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.size = btn.getAttribute('data-size');
      sizeBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderPreview();
    });
  });
  document.getElementById('export-one').addEventListener('click', function () {
    exportPNG(state.size);
  });
  document.getElementById('export-all').addEventListener('click', function () {
    exportAll();
  });
  var titleInput = document.getElementById('title-input');
  titleInput.addEventListener('input', function () {
    state.title = titleInput.value.toUpperCase();
    renderPreview();
  });
}

function bindCanvas() {
  var drag = null;
  canvas.addEventListener('pointerdown', function (ev) {
    var hit = hitPanel(ev.clientX, ev.clientY);
    if (!hit) { return; }
    var layout = layoutToDraw();
    var inStrip = hit.y >= hit.rect.y + hit.rect.h - layout.strip;
    drag = {
      index: hit.index,
      startX: hit.x,
      startY: hit.y,
      lastX: hit.x,
      lastY: hit.y,
      mode: inStrip ? 'swap' : 'pan',
      moved: false
    };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', function (ev) {
    if (!drag) { return; }
    var hit = hitPanel(ev.clientX, ev.clientY);
    if (!hit) { return; }
    var dx = hit.x - drag.lastX;
    var dy = hit.y - drag.lastY;
    drag.lastX = hit.x;
    drag.lastY = hit.y;
    if (Math.abs(hit.x - drag.startX) + Math.abs(hit.y - drag.startY) > 4) {
      drag.moved = true;
    }
    if (drag.mode === 'pan') {
      var panel = state.panels[drag.index];
      panel.ox += dx;
      panel.oy += dy;
      renderPreview();
    }
  });
  canvas.addEventListener('pointerup', function (ev) {
    if (!drag) { return; }
    if (drag.mode === 'swap' && drag.moved) {
      var hit = hitPanel(ev.clientX, ev.clientY);
      if (hit && hit.index !== drag.index) {
        var tmp = state.panels[drag.index];
        state.panels[drag.index] = state.panels[hit.index];
        state.panels[hit.index] = tmp;
        buildSlots();
        renderPreview();
      }
    }
    drag = null;
  });
  canvas.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var hit = hitPanel(ev.clientX, ev.clientY);
    if (!hit) { return; }
    var panel = state.panels[hit.index];
    var factor = ev.deltaY < 0 ? 1.08 : 0.93;
    panel.zoom = clamp(panel.zoom * factor, 1, 3);
    var slider = document.querySelectorAll('.slot-controls input[type="range"]')[hit.index];
    if (slider) { slider.value = String(panel.zoom); }
    renderPreview();
  }, { passive: false });
}

function init() {
  var params = new URLSearchParams(window.location.search);
  var sizeParam = params.get('size');
  if (sizeParam && SIZES[sizeParam]) {
    state.size = sizeParam;
  }
  if (params.get('layout') === 'diagonal') {
    state.layoutOverride = 'diagonal';
  }
  if (params.get('scene') === 'cover') {
    document.body.classList.add('scene-cover');
  }
  buildSlots();
  bindToolbar();
  bindCanvas();
  document.querySelectorAll('.size-btn').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-size') === state.size);
  });
  var loads = state.panels.map(function (panel) {
    return loadImage(panel.file).then(function (img) {
      panel.image = img;
      panel.loaded = true;
    }).catch(function () {
      panel.loaded = false;
    });
  });
  var fontLoad = Promise.resolve();
  try {
    fontLoad = Promise.all([
      document.fonts.load('140px Anton'),
      document.fonts.load('84px Anton')
    ]).then(function () { return document.fonts.ready; }).catch(function () {});
  } catch (e) {
    fontLoad = Promise.resolve();
  }
  Promise.all([Promise.all(loads), fontLoad]).then(function () {
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
