"use strict";

var SIZES = {
  landscape: { w: 1920, h: 1080, label: "Landscape 1920 x 1080" },
  portrait: { w: 1080, h: 1350, label: "Portrait 1080 x 1350" },
  square: { w: 1080, h: 1080, label: "Square 1080 x 1080" },
};

var SAMPLES = [
  { file: "samples/sample1-hero.jpg", label: "Boulevard Chase", caption: "Neon boulevard - the getaway", fy: 0.49 },
  { file: "samples/sample2-ferris.jpg", label: "Boardwalk Lights", caption: "Ferris wheel over the pier", fy: 0.48 },
  { file: "samples/sample3-heist.jpg", label: "Heist Standoff", caption: "Heist vs police - the standoff", fy: 0.56 },
  { file: "samples/sample4-skate.jpg", label: "Night Skate", caption: "Skateboard under neon", fy: 0.48 },
];

function layoutLandscape() {
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    strip: 46,
    rects: [
      { x: 0, y: 0, w: 1152, h: 1080, fy: 0.49, zoom: 1.15 },
      { x: 1152, y: 0, w: 768, h: 360, fy: 0.48 },
      { x: 1152, y: 360, w: 768, h: 360, fy: 0.56 },
      { x: 1152, y: 720, w: 768, h: 360, fy: 0.48 },
    ],
  };
}

function layoutPortrait() {
  return {
    title: { x: 36, y: 112, size: 84, scrim: 230 },
    strip: 40,
    rects: [
      { x: 0, y: 0, w: 1080, h: 810, fy: 0.55, zoom: 1.1 },
      { x: 0, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
      { x: 360, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
      { x: 720, y: 810, w: 360, h: 540, fy: 0.62, zoom: 1.8 },
    ],
  };
}

function layoutSquare() {
  return {
    title: { x: 36, y: 112, size: 84, scrim: 230 },
    strip: 38,
    rects: [
      { x: 0, y: 0, w: 1080, h: 594, fy: 0.56 },
      { x: 0, y: 594, w: 360, h: 486, fy: 0.58, zoom: 1.5 },
      { x: 360, y: 594, w: 360, h: 486, fy: 0.58, zoom: 1.5 },
      { x: 720, y: 594, w: 360, h: 486, fy: 0.60, zoom: 1.7 },
    ],
  };
}

function diagonalLayout() {
  return {
    title: { x: 48, y: 155, size: 140, scrim: 340 },
    strip: 46,
    rects: [
      { x: 0, y: 0, w: 480, h: 1080, fy: 0.50, zoom: 1.6, slant: 60 },
      { x: 480, y: 0, w: 480, h: 1080, fy: 0.60, zoom: 1.5, slant: 60 },
      { x: 960, y: 0, w: 480, h: 1080, fy: 0.58, zoom: 1.5, slant: 60 },
      { x: 1440, y: 0, w: 480, h: 1080, fy: 0.62, zoom: 1.55, slant: 60 },
    ],
  };
}

function layoutFor(size) {
  if (size === "portrait") { return layoutPortrait(); }
  if (size === "square") { return layoutSquare(); }
  return layoutLandscape();
}

var state = {
  size: "landscape",
  title: "NEON COAST",
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
      tilt: 0,
    };
  }),
};

function layoutToDraw() {
  if (state.layoutOverride === "diagonal" && state.size === "landscape") {
    return diagonalLayout();
  }
  return layoutFor(state.size);
}

function clamp(v, lo, hi) {
  if (v < lo) { return lo; }
  if (v > hi) { return hi; }
  return v;
}

function rectPath(ctx, rect) {
  var x = rect.x;
  var y = rect.y;
  var w = rect.w;
  var h = rect.h;
  var slant = rect.slant || 0;
  ctx.beginPath();
  if (slant) {
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w + slant, y);
    ctx.lineTo(x + w - slant, y + h);
    ctx.lineTo(x - slant, y + h);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
}

function hitPanel(layout, px, py) {
  for (var i = layout.rects.length - 1; i >= 0; i--) {
    var r = layout.rects[i];
    if (py < r.y || py > r.y + r.h) { continue; }
    var t = (py - r.y) / r.h;
    var slant = r.slant || 0;
    var left = r.x + slant * (1 - 2 * t);
    var right = left + r.w;
    if (px >= left && px <= right) { return i; }
  }
  return -1;
}

function drawPanel(ctx, rect, panel) {
  if (!panel.loaded || !panel.image) {
    ctx.save();
    rectPath(ctx, rect);
    ctx.fillStyle = "#2a1650";
    ctx.fill();
    ctx.restore();
    return;
  }
  var img = panel.image;
  var fx = rect.fx !== undefined ? rect.fx : panel.fx;
  var fy = rect.fy !== undefined ? rect.fy : panel.fy;
  var effZoom = (rect.zoom || 1) * panel.zoom;
  var tilted = (panel.tilt !== 0) || !!rect.slant;
  var base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  var scale = base * effZoom * (tilted ? 1.02 : 1);
  var dw = img.naturalWidth * scale;
  var dh = img.naturalHeight * scale;
  var cx = rect.x + rect.w / 2;
  var cy = rect.y + rect.h / 2;
  var ox = panel.ox;
  var oy = panel.oy;
  if (effZoom <= 1) {
    ox = 0;
    oy = 0;
    panel.ox = 0;
    panel.oy = 0;
  }
  var focalX = (0.5 - fx) * dw;
  var focalY = (0.5 - fy) * dh;
  var totalX = focalX + ox;
  var totalY = focalY + oy;
  var maxX = Math.max(0, (dw - rect.w) / 2);
  var maxY = Math.max(0, (dh - rect.h) / 2);
  totalX = clamp(totalX, -maxX, maxX);
  totalY = clamp(totalY, -maxY, maxY);
  var drawX = cx - dw / 2 + totalX;
  var drawY = cy - dh / 2 + totalY;
  ctx.save();
  rectPath(ctx, rect);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate((panel.tilt * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  ctx.drawImage(img, drawX, drawY, dw, dh);
  ctx.restore();
}

function drawCover(ctx, layout) {
  var size = SIZES[state.size];
  var grad = ctx.createLinearGradient(0, 0, 0, size.h);
  grad.addColorStop(0, "#1b1035");
  grad.addColorStop(0.45, "#4b1560");
  grad.addColorStop(0.75, "#b81e6e");
  grad.addColorStop(1, "#ff7a18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size.w, size.h);
  for (var i = 0; i < 4; i++) {
    drawPanel(ctx, layout.rects[i], state.panels[i]);
  }
  var t = layout.title;
  var scrim = ctx.createLinearGradient(0, 0, 0, t.scrim);
  scrim.addColorStop(0, "rgba(10, 5, 25, 0.78)");
  scrim.addColorStop(1, "rgba(10, 5, 25, 0)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, size.w, t.scrim);
  ctx.save();
  ctx.font = t.size + 'px "Anton", "Trebuchet MS", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255, 46, 136, 0.9)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.title, t.x, t.y);
  ctx.restore();
}

function drawCoverForSize(ctx, sizeKey) {
  var savedSize = state.size;
  state.size = sizeKey;
  var size = SIZES[sizeKey];
  var layout = layoutFor(sizeKey);
  var grad = ctx.createLinearGradient(0, 0, 0, size.h);
  grad.addColorStop(0, "#1b1035");
  grad.addColorStop(0.45, "#4b1560");
  grad.addColorStop(0.75, "#b81e6e");
  grad.addColorStop(1, "#ff7a18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size.w, size.h);
  for (var i = 0; i < 4; i++) {
    drawPanel(ctx, layout.rects[i], state.panels[i]);
  }
  var t = layout.title;
  var scrim = ctx.createLinearGradient(0, 0, 0, t.scrim);
  scrim.addColorStop(0, "rgba(10, 5, 25, 0.78)");
  scrim.addColorStop(1, "rgba(10, 5, 25, 0)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, size.w, t.scrim);
  ctx.save();
  ctx.font = t.size + 'px "Anton", "Trebuchet MS", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255, 46, 136, 0.9)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.title, t.x, t.y);
  ctx.restore();
  state.size = savedSize;
}

function renderPreview() {
  var canvas = document.getElementById("cover");
  if (!canvas) { return; }
  var size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  var ctx = canvas.getContext("2d");
  drawCover(ctx, layoutToDraw());
}

function downloadCanvas(canvas, name) {
  var a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function exportPNG(sizeKey) {
  var key = sizeKey || state.size;
  var size = SIZES[key];
  if (!size) { return; }
  var off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  var ctx = off.getContext("2d");
  drawCoverForSize(ctx, key);
  downloadCanvas(off, "neon-coast-" + key + ".png");
}

function loadImage(src) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { resolve(null); };
    img.src = src;
  });
}

function setPanelImage(index, dataUrl) {
  return loadImage(dataUrl).then(function (img) {
    var panel = state.panels[index];
    if (!panel) { return; }
    if (img) {
      panel.image = img;
      panel.loaded = true;
    } else {
      panel.image = null;
      panel.loaded = false;
    }
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    panel.fx = 0.5;
    panel.fy = SAMPLES[index].fy;
    panel.tilt = 0;
    var slot = document.querySelectorAll(".slot")[index];
    if (slot) {
      var preview = slot.querySelector("img");
      if (preview && img) { preview.src = dataUrl; }
      var slider = slot.querySelector('input[type="range"]');
      if (slider) { slider.value = "1"; }
    }
    renderPreview();
  });
}

function probePanels() {
  var size = SIZES[state.size];
  var layout = layoutToDraw();
  var off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  var ctx = off.getContext("2d");
  drawCover(ctx, layout);
  var out = [];
  for (var i = 0; i < 4; i++) {
    var r = layout.rects[i];
    var px = Math.floor(r.x + r.w / 2);
    var py = Math.floor(r.y + r.h / 2 - 10);
    px = clamp(px, 0, size.w - 1);
    py = clamp(py, 0, size.h - 1);
    var d = ctx.getImageData(px, py, 1, 1).data;
    out.push({ r: d[0], g: d[1], b: d[2] });
  }
  return out;
}

function buildSlots() {
  var host = document.getElementById("slots");
  if (!host) { return; }
  host.innerHTML = "";
  state.panels.forEach(function (panel, index) {
    var card = document.createElement("div");
    card.className = "slot";
    var head = document.createElement("div");
    head.className = "slot-head";
    var strong = document.createElement("strong");
    strong.textContent = "Snapshot " + (index + 1);
    var span = document.createElement("span");
    span.textContent = "fills panel " + (index + 1) + " \u2014 " + panel.label;
    head.appendChild(strong);
    head.appendChild(span);
    card.appendChild(head);
    var img = document.createElement("img");
    img.alt = panel.label;
    img.src = panel.file;
    card.appendChild(img);
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) { return; }
      var reader = new FileReader();
      reader.onload = function () {
        setPanelImage(index, String(reader.result));
      };
      reader.readAsDataURL(file);
    });
    card.appendChild(fileInput);
    var controls = document.createElement("div");
    controls.className = "slot-controls";
    var tilts = [-1.5, 0, 1.5];
    tilts.forEach(function (deg) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ghost";
      b.textContent = deg === 0 ? "0\u00b0" : (deg > 0 ? "+" : "") + deg + "\u00b0";
      b.addEventListener("click", function () {
        panel.tilt = deg;
        renderPreview();
      });
      controls.appendChild(b);
    });
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "1";
    slider.max = "3";
    slider.step = "0.05";
    slider.value = "1";
    slider.setAttribute("aria-label", "Zoom panel " + (index + 1));
    slider.addEventListener("input", function () {
      panel.zoom = parseFloat(slider.value);
      renderPreview();
    });
    controls.appendChild(slider);
    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "ghost";
    reset.textContent = "Reset crop";
    reset.addEventListener("click", function () {
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.tilt = 0;
      slider.value = "1";
      renderPreview();
    });
    controls.appendChild(reset);
    card.appendChild(controls);
    host.appendChild(card);
  });
}

function bindCanvas() {
  var canvas = document.getElementById("cover");
  if (!canvas) { return; }
  var drag = null;
  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      scaleX: scaleX,
      scaleY: scaleY,
    };
  }
  canvas.addEventListener("pointerdown", function (e) {
    var p = toCanvas(e);
    var layout = layoutToDraw();
    var idx = hitPanel(layout, p.x, p.y);
    if (idx < 0) { return; }
    var r = layout.rects[idx];
    var fromStrip = p.y > r.y + r.h - layout.strip * p.scaleY;
    drag = {
      index: idx,
      startX: p.x,
      startY: p.y,
      lastX: p.x,
      lastY: p.y,
      fromStrip: fromStrip,
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!drag) { return; }
    var p = toCanvas(e);
    var dx = p.x - drag.lastX;
    var dy = p.y - drag.lastY;
    if (Math.abs(p.x - drag.startX) + Math.abs(p.y - drag.startY) > 4) {
      drag.moved = true;
    }
    if (!drag.fromStrip && drag.moved) {
      var panel = state.panels[drag.index];
      panel.ox += dx;
      panel.oy += dy;
      drag.lastX = p.x;
      drag.lastY = p.y;
      renderPreview();
    }
  });
  canvas.addEventListener("pointerup", function (e) {
    if (!drag) { return; }
    var p = toCanvas(e);
    var layout = layoutToDraw();
    if (drag.fromStrip && drag.moved) {
      var target = hitPanel(layout, p.x, p.y);
      if (target >= 0 && target !== drag.index) {
        var tmp = state.panels[drag.index];
        state.panels[drag.index] = state.panels[target];
        state.panels[target] = tmp;
        buildSlots();
      }
    }
    drag = null;
    renderPreview();
  });
  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    var p = toCanvas(e);
    var layout = layoutToDraw();
    var idx = hitPanel(layout, p.x, p.y);
    if (idx < 0) { return; }
    var panel = state.panels[idx];
    var factor = e.deltaY < 0 ? 1.08 : 0.93;
    panel.zoom = clamp(panel.zoom * factor, 1, 3);
    var slot = document.querySelectorAll(".slot")[idx];
    if (slot) {
      var slider = slot.querySelector('input[type="range"]');
      if (slider) { slider.value = String(panel.zoom); }
    }
    renderPreview();
  }, { passive: false });
}

function bindUI() {
  var sizeButtons = document.querySelectorAll("[data-size]");
  sizeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-size");
      if (!SIZES[key]) { return; }
      state.size = key;
      sizeButtons.forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderPreview();
    });
  });
  var one = document.getElementById("export-one");
  if (one) {
    one.addEventListener("click", function () { exportPNG(state.size); });
  }
  var all = document.getElementById("export-all");
  if (all) {
    all.addEventListener("click", function () {
      var keys = ["landscape", "portrait", "square"];
      keys.forEach(function (key, i) {
        setTimeout(function () { exportPNG(key); }, i * 250);
      });
    });
  }
  var titleInput = document.getElementById("title-input");
  if (titleInput) {
    titleInput.addEventListener("input", function () {
      state.title = titleInput.value.toUpperCase();
      renderPreview();
    });
  }
}

function init() {
  var params = new URLSearchParams(window.location.search);
  var sizeParam = params.get("size");
  if (sizeParam && SIZES[sizeParam]) {
    state.size = sizeParam;
  }
  if (params.get("layout") === "diagonal") {
    state.layoutOverride = "diagonal";
  }
  if (params.get("scene") === "cover") {
    document.body.classList.add("scene-cover");
  }
  var sizeButtons = document.querySelectorAll("[data-size]");
  sizeButtons.forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-size") === state.size);
  });
  var titleInput = document.getElementById("title-input");
  if (titleInput) {
    titleInput.value = state.title;
  }
  buildSlots();
  bindUI();
  bindCanvas();
  var loads = state.panels.map(function (panel) {
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
  var fontLoad = Promise.resolve();
  try {
    if (document.fonts && document.fonts.load) {
      fontLoad = Promise.all([
        document.fonts.load('140px "Anton"'),
        document.fonts.load('84px "Anton"'),
      ]).then(function () { return document.fonts.ready; }).catch(function () { return null; });
    }
  } catch (err) {
    fontLoad = Promise.resolve();
  }
  Promise.all(loads.concat([fontLoad])).then(function () {
    renderPreview();
    document.body.setAttribute("data-ready", "ready");
  });
  renderPreview();
}

diagonalLayout.rects = diagonalLayout().rects;
diagonalLayout.title = diagonalLayout().title;
diagonalLayout.strip = diagonalLayout().strip;

window.__cover = {
  state: state,
  layoutFor: layoutFor,
  diagonalLayout: diagonalLayout,
  layoutToDraw: layoutToDraw,
  exportPNG: exportPNG,
  renderPreview: renderPreview,
  setPanelImage: setPanelImage,
  probePanels: probePanels,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
