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
      strip: 40,
      rects: [
        { x: 0, y: 0, w: 1080, h: 810, fy: 0.55, zoom: 1.1 },
        { x: 0, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
        { x: 720, y: 810, w: 360, h: 540, fy: 0.62, zoom: 1.8 }
      ]
    };
  }
  if (sizeKey === 'square') {
    return {
      title: { x: 36, y: 112, size: 84, scrim: 230 },
      strip: 38,
      rects: [
        { x: 0, y: 0, w: 1080, h: 594, fy: 0.56 },
        { x: 0, y: 594, w: 360, h: 486, fy: 0.58, zoom: 1.5 },
        { x: 360, y: 594, w: 360, h: 486, fy: 0.58, zoom: 1.5 },
        { x: 720, y: 594, w: 360, h: 486, fy: 0.6, zoom: 1.7 }
      ]
    };
  }
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    strip: 46,
    rects: [
      { x: 0, y: 0, w: 1152, h: 1080, fy: 0.49, zoom: 1.15 },
      { x: 1152, y: 0, w: 768, h: 360, fy: 0.48 },
      { x: 1152, y: 360, w: 768, h: 360, fy: 0.56 },
      { x: 1152, y: 720, w: 768, h: 360, fy: 0.48 }
    ]
  };
}

function diagonalLayout() {
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    strip: 46,
    rects: [
      { x: 0, y: 0, w: 480, h: 1080, fy: 0.5, zoom: 1.6, slant: 60 },
      { x: 480, y: 0, w: 480, h: 1080, fy: 0.6, zoom: 1.5, slant: 60 },
      { x: 960, y: 0, w: 480, h: 1080, fy: 0.58, zoom: 1.5, slant: 60 },
      { x: 1440, y: 0, w: 480, h: 1080, fy: 0.62, zoom: 1.55, slant: 60 }
    ]
  };
}

function layoutToDraw(sizeKey) {
  if (state.layoutOverride === 'diagonal' && sizeKey === 'landscape') {
    return diagonalLayout();
  }
  return layoutFor(sizeKey);
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
      img: null,
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

function effectiveZoom(panel, rect) {
  return (rect.zoom || 1) * panel.zoom;
}

function clipRect(ctx, rect, canvasW) {
  var slant = rect.slant || 0;
  ctx.beginPath();
  if (slant) {
    var leftTop = rect.x <= 0 ? 0 : rect.x + slant;
    var leftBottom = rect.x <= 0 ? 0 : rect.x - slant;
    var rightTop = rect.x + rect.w >= canvasW ? canvasW : rect.x + rect.w + slant;
    var rightBottom = rect.x + rect.w >= canvasW ? canvasW : rect.x + rect.w - slant;
    ctx.moveTo(leftTop, rect.y);
    ctx.lineTo(rightTop, rect.y);
    ctx.lineTo(rightBottom, rect.y + rect.h);
    ctx.lineTo(leftBottom, rect.y + rect.h);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
}

function drawPanel(ctx, panel, rect) {
  var canvasW = ctx.canvas.width;
  var slant = rect.slant || 0;
  var drawX = slant ? rect.x - slant : rect.x;
  var drawW = slant ? rect.w + 2 * slant : rect.w;
  var drawY = rect.y;
  var drawH = rect.h;
  ctx.save();
  clipRect(ctx, rect, canvasW);
  if (!panel.loaded || !panel.img) {
    ctx.fillStyle = '#2a1650';
    ctx.fillRect(drawX - 2, drawY - 2, drawW + 4, drawH + 4);
    ctx.restore();
    return;
  }
  var img = panel.img;
  var zoomEff = effectiveZoom(panel, rect);
  var boost = (slant || panel.tilt) ? 1.02 : 1;
  var scale = Math.max(drawW / img.naturalWidth, drawH / img.naturalHeight) * zoomEff * boost;
  var sw = img.naturalWidth * scale;
  var sh = img.naturalHeight * scale;
  var fx = rect.fx !== undefined ? rect.fx : panel.fx;
  var fy = rect.fy !== undefined ? rect.fy : panel.fy;
  var ox = panel.ox;
  var oy = panel.oy;
  if (zoomEff <= 1) {
    ox = 0;
    oy = 0;
  }
  var dx = drawX + drawW / 2 - fx * sw + ox;
  var dy = drawY + drawH / 2 - fy * sh + oy;
  dx = Math.min(Math.max(dx, drawX + drawW - sw), drawX);
  dy = Math.min(Math.max(dy, drawY + drawH - sh), drawY);
  var cx = drawX + drawW / 2;
  var cy = drawY + drawH / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (panel.tilt) {
    ctx.rotate(panel.tilt * Math.PI / 180);
  }
  ctx.translate(-cx, -cy);
  ctx.drawImage(img, dx, dy, sw, sh);
  ctx.restore();
  ctx.restore();
}

function drawCover(ctx, sizeKey) {
  var size = SIZES[sizeKey];
  var layout = layoutToDraw(sizeKey);
  var bg = ctx.createLinearGradient(0, 0, 0, size.h);
  bg.addColorStop(0, '#1b1035');
  bg.addColorStop(0.45, '#4b1560');
  bg.addColorStop(0.75, '#b81e6e');
  bg.addColorStop(1, '#ff7a18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size.w, size.h);
  for (var i = 0; i < 4; i++) {
    drawPanel(ctx, state.panels[i], layout.rects[i]);
  }
  var t = layout.title;
  var scrim = ctx.createLinearGradient(0, 0, 0, t.scrim);
  scrim.addColorStop(0, 'rgba(10, 5, 25, 0.78)');
  scrim.addColorStop(1, 'rgba(10, 5, 25, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, size.w, t.scrim);
  ctx.font = t.size + 'px Anton, "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.9)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.title, t.x, t.y);
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function renderPreview() {
  var canvas = document.getElementById('cover');
  if (!canvas) {
    return;
  }
  var size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  var ctx = canvas.getContext('2d');
  drawCover(ctx, state.size);
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob(function (blob) {
    if (!blob) {
      return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }, 'image/png');
}

function exportPNG(sizeKey) {
  var key = sizeKey || state.size;
  var size = SIZES[key];
  var canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  var ctx = canvas.getContext('2d');
  drawCover(ctx, key);
  downloadCanvas(canvas, 'neon-coast-' + key + '.png');
}

function setPanelImage(index, dataUrl) {
  return new Promise(function (resolve) {
    var panel = state.panels[index];
    var img = new Image();
    img.onload = function () {
      panel.img = img;
      panel.loaded = true;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.fx = 0.5;
      panel.fy = SAMPLES[index].fy;
      buildSlots();
      renderPreview();
      resolve(true);
    };
    img.onerror = function () {
      panel.loaded = false;
      renderPreview();
      resolve(false);
    };
    img.src = dataUrl;
  });
}

function buildSlots() {
  var slots = document.getElementById('slots');
  if (!slots) {
    return;
  }
  slots.innerHTML = '';
  state.panels.forEach(function (panel, i) {
    var slot = document.createElement('div');
    slot.className = 'slot';
    var head = document.createElement('div');
    head.className = 'slot-head';
    var strong = document.createElement('strong');
    strong.textContent = 'Snapshot ' + (i + 1);
    var span = document.createElement('span');
    span.textContent = 'fills panel ' + (i + 1) + ' — ' + panel.label;
    head.appendChild(strong);
    head.appendChild(span);
    slot.appendChild(head);
    var preview = document.createElement('img');
    preview.alt = panel.label;
    preview.src = panel.img ? panel.img.src : panel.file;
    slot.appendChild(preview);
    var cap = document.createElement('p');
    cap.className = 'slot-cap';
    cap.textContent = panel.caption;
    slot.appendChild(cap);
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        setPanelImage(i, String(reader.result));
      };
      reader.readAsDataURL(file);
    });
    slot.appendChild(fileInput);
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
    slider.value = String(panel.zoom);
    slider.setAttribute('aria-label', 'Zoom snapshot ' + (i + 1));
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
    slot.appendChild(controls);
    slots.appendChild(slot);
  });
}

function pointInRect(px, py, rect, canvasW) {
  var slant = rect.slant || 0;
  if (!slant) {
    return px >= rect.x && px < rect.x + rect.w && py >= rect.y && py < rect.y + rect.h;
  }
  var leftTop = rect.x <= 0 ? 0 : rect.x + slant;
  var leftBottom = rect.x <= 0 ? 0 : rect.x - slant;
  var rightTop = rect.x + rect.w >= canvasW ? canvasW : rect.x + rect.w + slant;
  var rightBottom = rect.x + rect.w >= canvasW ? canvasW : rect.x + rect.w - slant;
  var poly = [
    [leftTop, rect.y],
    [rightTop, rect.y],
    [rightBottom, rect.y + rect.h],
    [leftBottom, rect.y + rect.h]
  ];
  var inside = false;
  for (var a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    var xi = poly[a][0];
    var yi = poly[a][1];
    var xj = poly[b][0];
    var yj = poly[b][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function hitPanel(canvas, clientX, clientY) {
  var box = canvas.getBoundingClientRect();
  var px = (clientX - box.left) * (canvas.width / box.width);
  var py = (clientY - box.top) * (canvas.height / box.height);
  var layout = layoutToDraw(state.size);
  for (var i = 0; i < 4; i++) {
    if (pointInRect(px, py, layout.rects[i], canvas.width)) {
      return { index: i, x: px, y: py, rect: layout.rects[i], layout: layout };
    }
  }
  return null;
}

function bindCanvas() {
  var canvas = document.getElementById('cover');
  if (!canvas) {
    return;
  }
  var drag = null;
  canvas.addEventListener('pointerdown', function (ev) {
    var hit = hitPanel(canvas, ev.clientX, ev.clientY);
    if (!hit) {
      return;
    }
    canvas.setPointerCapture(ev.pointerId);
    var nearBottom = hit.y >= hit.rect.y + hit.rect.h - hit.layout.strip;
    drag = { index: hit.index, x: hit.x, y: hit.y, swap: nearBottom, moved: false };
  });
  canvas.addEventListener('pointermove', function (ev) {
    if (!drag) {
      return;
    }
    var hit = hitPanel(canvas, ev.clientX, ev.clientY);
    if (!hit) {
      return;
    }
    if (drag.swap) {
      drag.moved = true;
      drag.over = hit.index;
      return;
    }
    var panel = state.panels[drag.index];
    panel.ox += hit.x - drag.x;
    panel.oy += hit.y - drag.y;
    drag.x = hit.x;
    drag.y = hit.y;
    drag.moved = true;
    renderPreview();
  });
  canvas.addEventListener('pointerup', function (ev) {
    if (!drag) {
      return;
    }
    if (drag.swap && drag.moved) {
      var hit = hitPanel(canvas, ev.clientX, ev.clientY);
      if (hit && hit.index !== drag.index) {
        var tmp = state.panels[drag.index];
        state.panels[drag.index] = state.panels[hit.index];
        state.panels[hit.index] = tmp;
        buildSlots();
      }
    }
    drag = null;
    renderPreview();
  });
  canvas.addEventListener('wheel', function (ev) {
    var hit = hitPanel(canvas, ev.clientX, ev.clientY);
    if (!hit) {
      return;
    }
    ev.preventDefault();
    var panel = state.panels[hit.index];
    var factor = ev.deltaY < 0 ? 1.08 : 0.93;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * factor));
    renderPreview();
  }, { passive: false });
}

function loadSamples() {
  state.panels.forEach(function (panel) {
    var img = new Image();
    img.onload = function () {
      panel.img = img;
      panel.loaded = true;
      renderPreview();
    };
    img.onerror = function () {
      panel.loaded = false;
      renderPreview();
    };
    img.src = panel.file;
  });
}

function loadFonts() {
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('140px Anton');
      document.fonts.load('84px Anton');
      document.fonts.ready.then(function () { renderPreview(); }).catch(function () {});
    }
  } catch (err) {
    renderPreview();
  }
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
  bindCanvas();
  var sizeButtons = document.querySelectorAll('[data-size]');
  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-size');
      if (!SIZES[key]) {
        return;
      }
      state.size = key;
      sizeButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderPreview();
    });
  });
  var exportOne = document.getElementById('export-one');
  if (exportOne) {
    exportOne.addEventListener('click', function () { exportPNG(state.size); });
  }
  var exportAll = document.getElementById('export-all');
  if (exportAll) {
    exportAll.addEventListener('click', function () {
      var keys = ['landscape', 'portrait', 'square'];
      keys.forEach(function (key, i) {
        setTimeout(function () { exportPNG(key); }, i * 250);
      });
    });
  }
  var titleInput = document.getElementById('title-input');
  if (titleInput) {
    titleInput.addEventListener('input', function () {
      state.title = titleInput.value.toUpperCase();
      renderPreview();
    });
  }
  loadSamples();
  loadFonts();
  renderPreview();
  document.body.setAttribute('data-ready', 'ready');
}

function probePanels(sizeKey) {
  var key = sizeKey || state.size;
  var size = SIZES[key];
  var layout = layoutToDraw(key);
  var canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  var ctx = canvas.getContext('2d', { willReadFrequently: true });
  drawCover(ctx, key);
  return layout.rects.map(function (rect) {
    var x = Math.floor(rect.x + rect.w / 2);
    var y = Math.floor(rect.y + rect.h / 2 - 10);
    var data = ctx.getImageData(x, y, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2] };
  });
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
