"use strict";

// NEON COAST — GTA-style cover maker. Static, offline, four photo panels
// plus the title only. Three export sizes, one extra diagonal render.

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

var TITLE_FONT = '"Anton", "Trebuchet MS", sans-serif';
var FALLBACK_FILL = "#2a1650";

function titleSpec(sizeKey) {
  if (sizeKey === "landscape") return { x: 48, y: 155, size: 140, scrim: 340 };
  return { x: 36, y: 112, size: 84, scrim: 230 };
}

function layoutFor(sizeKey) {
  if (sizeKey === "portrait") {
    return {
      title: titleSpec("portrait"),
      strip: 40,
      rects: [
        { panel: 0, x: 0, y: 0, w: 1080, h: 810, fy: 0.55, zoom: 1.1 },
        { panel: 1, x: 0, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
        { panel: 2, x: 360, y: 810, w: 360, h: 540, fy: 0.58, zoom: 1.5 },
        { panel: 3, x: 720, y: 810, w: 360, h: 540, fy: 0.62, zoom: 1.8 },
      ],
    };
  }
  if (sizeKey === "square") {
    return {
      title: titleSpec("square"),
      strip: 38,
      rects: [
        { panel: 0, x: 0, y: 0, w: 1080, h: 594, fy: 0.56 },
        { panel: 1, x: 0, y: 594, w: 360, h: 486, fy: 0.58, zoom: 1.5 },
        { panel: 2, x: 360, y: 594, w: 360, h: 486, fy: 0.58, zoom: 1.5 },
        { panel: 3, x: 720, y: 594, w: 360, h: 486, fy: 0.60, zoom: 1.7 },
      ],
    };
  }
  return {
    title: titleSpec("landscape"),
    strip: 46,
    rects: [
      { panel: 0, x: 0, y: 0, w: 1152, h: 1080, fy: 0.49, zoom: 1.15 },
      { panel: 1, x: 1152, y: 0, w: 768, h: 360, fy: 0.48 },
      { panel: 2, x: 1152, y: 360, w: 768, h: 360, fy: 0.56 },
      { panel: 3, x: 1152, y: 720, w: 768, h: 360, fy: 0.48 },
    ],
  };
}

function diagonalLayout() {
  return {
    title: titleSpec("landscape"),
    strip: 46,
    rects: [
      { panel: 0, x: 0, y: 0, w: 480, h: 1080, fy: 0.50, zoom: 1.6, slant: 60 },
      { panel: 1, x: 480, y: 0, w: 480, h: 1080, fy: 0.60, zoom: 1.5, slant: 60 },
      { panel: 2, x: 960, y: 0, w: 480, h: 1080, fy: 0.58, zoom: 1.5, slant: 60 },
      { panel: 3, x: 1440, y: 0, w: 480, h: 1080, fy: 0.62, zoom: 1.55, slant: 60 },
    ],
  };
}

function layoutToDraw() {
  if (state.layoutOverride === "diagonal" && state.size === "landscape") {
    return diagonalLayout();
  }
  return layoutFor(state.size);
}

function makePanel(i) {
  var s = SAMPLES[i];
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
    tilt: 0,
  };
}

var state = {
  size: "landscape",
  title: "NEON COAST",
  layoutOverride: null,
  panels: [makePanel(0), makePanel(1), makePanel(2), makePanel(3)],
};

var canvas = document.getElementById("cover");
var ctx = canvas.getContext("2d");

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Focal crop: source window centred on (fx, fy), clamped inside the image.
// User pan (ox, oy) is added on top, in source pixels.
function cropWindow(panel, rect, img) {
  var layoutZoom = rect.zoom || 1;
  var effZoom = layoutZoom * panel.zoom;
  var tiltFactor = panel.tilt !== 0 ? 1.02 : 1;
  var scale = Math.max(rect.w / img.width, rect.h / img.height) * effZoom * tiltFactor;
  var dw = rect.w / scale;
  var dh = rect.h / scale;
  if (dw > img.width) dw = img.width;
  if (dh > img.height) dh = img.height;
  var fy = rect.fy !== undefined ? rect.fy : panel.fy;
  var fx = rect.fx !== undefined ? rect.fx : panel.fx;
  var sx = clamp(fx * img.width - dw / 2, 0, img.width - dw);
  var sy = clamp(fy * img.height - dh / 2, 0, img.height - dh);
  if (effZoom <= 1) {
    panel.ox = 0;
    panel.oy = 0;
  } else {
    sx = clamp(sx + panel.ox, 0, img.width - dw);
    sy = clamp(sy + panel.oy, 0, img.height - dh);
  }
  return { sx: sx, sy: sy, dw: dw, dh: dh, scale: scale, effZoom: effZoom };
}

function clipRect(c, rect) {
  c.beginPath();
  if (rect.slant) {
    var s = rect.slant;
    var w = c.canvas.width;
    var tlX = rect.x + s;
    var trX = rect.x + rect.w + s;
    var brX = rect.x + rect.w - s;
    var blX = rect.x - s;
    // The outer strips run off the canvas at one corner each: strip 1
    // runs off the left edge at the bottom, so its top-left corner
    // triangle would stay uncovered; strip 4 runs off the right edge
    // at the top, so its bottom-right corner triangle would stay
    // uncovered. Extend the outer strip's outer edge to the canvas
    // edge so the four strips tile the whole canvas with no corner
    // of background showing. Inner strips are unchanged.
    if (blX < 0) tlX = 0;
    if (trX > w) {
      trX = w;
      brX = w;
    }
    c.moveTo(tlX, rect.y);
    c.lineTo(trX, rect.y);
    c.lineTo(brX, rect.y + rect.h);
    c.lineTo(blX, rect.y + rect.h);
    c.closePath();
  } else {
    c.rect(rect.x, rect.y, rect.w, rect.h);
  }
  c.clip();
}

function drawPanel(c, panel, rect) {
  c.save();
  clipRect(c, rect);
  var cx = rect.x + rect.w / 2;
  var cy = rect.y + rect.h / 2;
  var drawW = rect.w;
  var drawH = rect.h;
  var effRect = rect;
  if (rect.slant) {
    // A slanted panel is a parallelogram, not an axis-aligned rectangle:
    // its bounding box is 2 * slant wider than the strip, so an image
    // drawn at strip width leaves uncovered triangles at the top-right
    // and bottom-left corners, where the page background shows through.
    // Draw the image over the full bounding box (plus a small margin,
    // so a tilted panel still covers the top and bottom edges) and let
    // the parallelogram clip shape it. The crop is recomputed against
    // the expanded size, so the image is not stretched.
    drawW = rect.w + 2 * rect.slant + 16;
    drawH = rect.h + 32;
    effRect = {
      panel: rect.panel,
      x: rect.x,
      y: rect.y,
      w: drawW,
      h: drawH,
      fy: rect.fy,
      fx: rect.fx,
      zoom: rect.zoom,
    };
  }
  if (panel.loaded && panel.img) {
    var win = cropWindow(panel, effRect, panel.img);
    c.translate(cx, cy);
    if (panel.tilt !== 0) c.rotate((panel.tilt * Math.PI) / 180);
    c.drawImage(panel.img, win.sx, win.sy, win.dw, win.dh, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    c.fillStyle = FALLBACK_FILL;
    c.fillRect(cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  }
  c.restore();
}

function drawCover(c, sizeKey) {
  var size = SIZES[sizeKey];
  var layout = sizeKey === state.size ? layoutToDraw() : layoutFor(sizeKey);
  var grad = c.createLinearGradient(0, 0, 0, size.h);
  grad.addColorStop(0, "#1b1035");
  grad.addColorStop(0.45, "#4b1560");
  grad.addColorStop(0.75, "#b81e6e");
  grad.addColorStop(1, "#ff7a18");
  c.fillStyle = grad;
  c.fillRect(0, 0, size.w, size.h);
  for (var i = 0; i < layout.rects.length; i++) {
    drawPanel(c, state.panels[layout.rects[i].panel], layout.rects[i]);
  }
  var t = layout.title;
  var scrim = c.createLinearGradient(0, 0, 0, t.scrim);
  scrim.addColorStop(0, "rgba(10, 5, 25, 0.78)");
  scrim.addColorStop(1, "rgba(10, 5, 25, 0)");
  c.fillStyle = scrim;
  c.fillRect(0, 0, size.w, t.scrim);
  c.font = t.size + "px " + TITLE_FONT;
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  c.shadowColor = "rgba(255, 46, 136, 0.9)";
  c.shadowBlur = 0;
  c.shadowOffsetX = 4;
  c.shadowOffsetY = 4;
  c.fillStyle = "#ffffff";
  c.fillText(state.title, t.x, t.y);
  c.shadowColor = "rgba(0, 0, 0, 0)";
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;
}

function renderPreview() {
  var size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(ctx, state.size);
}

function exportPNG(sizeKey) {
  var size = SIZES[sizeKey];
  var off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext("2d"), sizeKey);
  off.toBlob(function (blob) {
    if (!blob) return;
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "neon-coast-" + sizeKey + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }, "image/png");
}

// ---- slots UI ----

function buildSlots() {
  var host = document.getElementById("slots");
  host.innerHTML = "";
  state.panels.forEach(function (panel, i) {
    var card = document.createElement("div");
    card.className = "slot";

    var head = document.createElement("div");
    head.className = "slot-head";
    var strong = document.createElement("strong");
    strong.textContent = "Snapshot " + (i + 1);
    var span = document.createElement("span");
    span.textContent = "fills panel " + (i + 1) + " — " + panel.label;
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
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        setPanelImage(i, String(reader.result));
      };
      reader.readAsDataURL(file);
    });
    card.appendChild(fileInput);

    var controls = document.createElement("div");
    controls.className = "slot-controls";

    [["-1.5", -1.5], ["0", 0], ["+1.5", 1.5]].forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ghost";
      b.textContent = pair[0] + "°";
      b.addEventListener("click", function () {
        panel.tilt = pair[1];
        renderPreview();
      });
      controls.appendChild(b);
    });

    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "1";
    slider.max = "3";
    slider.step = "0.05";
    slider.value = String(panel.zoom);
    slider.setAttribute("aria-label", "Zoom panel " + (i + 1));
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

function setPanelImage(i, dataUrl) {
  return new Promise(function (resolve) {
    var panel = state.panels[i];
    var img = new Image();
    img.onload = function () {
      panel.img = img;
      panel.loaded = true;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.fx = 0.5;
      panel.fy = SAMPLES[i].fy;
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

// ---- pointer interaction ----

function canvasPoint(e) {
  var r = canvas.getBoundingClientRect();
  var scaleX = canvas.width / r.width;
  var scaleY = canvas.height / r.height;
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY,
    scaleX: scaleX,
    scaleY: scaleY,
  };
}

function hitPanel(p) {
  var layout = layoutToDraw();
  for (var i = layout.rects.length - 1; i >= 0; i--) {
    var rect = layout.rects[i];
    if (p.y < rect.y || p.y > rect.y + rect.h) continue;
    var t = (p.y - rect.y) / rect.h;
    var shift = rect.slant ? rect.slant * (1 - 2 * t) : 0;
    var u = p.x - shift;
    if (u >= rect.x && u <= rect.x + rect.w) return { rect: rect, index: i };
  }
  return null;
}

var drag = null;

canvas.addEventListener("pointerdown", function (e) {
  var p = canvasPoint(e);
  var hit = hitPanel(p);
  if (!hit) return;
  var panel = state.panels[hit.rect.panel];
  var inStrip = p.y > hit.rect.y + hit.rect.h - layoutToDraw().strip;
  drag = {
    mode: inStrip ? "swap" : "pan",
    panelIndex: hit.rect.panel,
    panel: panel,
    rect: hit.rect,
    startX: p.x,
    startY: p.y,
    lastX: p.x,
    lastY: p.y,
    hover: hit.rect.panel,
  };
  canvas.setPointerCapture(e.pointerId);
  e.preventDefault();
});

canvas.addEventListener("pointermove", function (e) {
  if (!drag) return;
  var p = canvasPoint(e);
  if (drag.mode === "pan") {
    var win = drag.panel.img
      ? cropWindow(drag.panel, drag.rect, drag.panel.img)
      : null;
    if (win) {
      drag.panel.ox -= (p.x - drag.lastX) / win.scale;
      drag.panel.oy -= (p.y - drag.lastY) / win.scale;
    }
    drag.lastX = p.x;
    drag.lastY = p.y;
    renderPreview();
  } else {
    var hit = hitPanel(p);
    drag.hover = hit ? hit.rect.panel : drag.panelIndex;
  }
});

canvas.addEventListener("pointerup", function () {
  if (!drag) return;
  if (drag.mode === "swap" && drag.hover !== drag.panelIndex) {
    var a = state.panels[drag.panelIndex];
    state.panels[drag.panelIndex] = state.panels[drag.hover];
    state.panels[drag.hover] = a;
    buildSlots();
  }
  drag = null;
  renderPreview();
});

canvas.addEventListener("wheel", function (e) {
  var p = canvasPoint(e);
  var hit = hitPanel(p);
  if (!hit) return;
  e.preventDefault();
  var panel = state.panels[hit.rect.panel];
  var factor = e.deltaY < 0 ? 1.08 : 0.93;
  panel.zoom = clamp(panel.zoom * factor, 1, 3);
  var slider = document.querySelectorAll("#slots .slot-controls input[type=range]")[hit.rect.panel];
  if (slider) slider.value = String(panel.zoom);
  renderPreview();
}, { passive: false });

// ---- controls ----

document.querySelectorAll("[data-size]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    state.size = btn.getAttribute("data-size");
    document.querySelectorAll("[data-size]").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    renderPreview();
  });
});

document.getElementById("export-one").addEventListener("click", function () {
  exportPNG(state.size);
});

document.getElementById("export-all").addEventListener("click", function () {
  var keys = ["landscape", "portrait", "square"];
  keys.forEach(function (key, i) {
    setTimeout(function () { exportPNG(key); }, i * 250);
  });
});

document.getElementById("title-input").addEventListener("input", function (e) {
  state.title = e.target.value.toUpperCase();
  renderPreview();
});

// ---- test hooks ----

function probePanels() {
  var size = SIZES[state.size];
  var off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  var c = off.getContext("2d");
  drawCover(c, state.size);
  var layout = layoutToDraw();
  return layout.rects.map(function (rect) {
    var x = Math.floor(rect.x + rect.w / 2);
    var y = Math.floor(rect.y + rect.h / 2 - 10);
    var d = c.getImageData(x, y, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
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
  probePanels: probePanels,
};

// ---- init ----

function loadSamples() {
  return Promise.all(
    state.panels.map(function (panel) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          panel.img = img;
          panel.loaded = true;
          resolve();
        };
        img.onerror = function () {
          panel.loaded = false;
          resolve();
        };
        img.src = panel.file;
      });
    }),
  );
}

function init() {
  var params = new URLSearchParams(window.location.search);
  var sizeParam = params.get("size");
  if (sizeParam && SIZES[sizeParam]) state.size = sizeParam;
  if (params.get("layout") === "diagonal") state.layoutOverride = "diagonal";
  if (params.get("scene") === "cover") document.body.classList.add("scene-cover");
  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-size") === state.size);
  });
  buildSlots();
  renderPreview();
  try {
    var loads = [
      document.fonts.load('140px Anton'),
      document.fonts.load('84px Anton'),
    ];
    Promise.all(loads).catch(function () {});
    document.fonts.ready.then(function () { renderPreview(); });
  } catch (err) {
    // System fonts are enough; the cover still renders.
  }
  loadSamples().then(function () {
    renderPreview();
    document.body.setAttribute("data-ready", "ready");
  });
}

init();
