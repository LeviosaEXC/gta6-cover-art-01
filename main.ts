const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;

const appFiles = [
  "app/index.html",
  "app/app.js",
  "app/styles.css",
  "app/fonts/Anton-Regular.ttf",
  "app/fonts/OFL-Anton.txt",
  "app/fonts/Caveat.ttf",
  "app/fonts/OFL-Caveat.txt",
  "app/samples/sample1-hero.jpg",
  "app/samples/sample2-ferris.jpg",
  "app/samples/sample3-heist.jpg",
  "app/samples/sample4-skate.jpg",
];

const repoFiles = [
  "LICENSE",
  "README.md",
  ".makefun/owner.json",
  "main.ts",
];

const allFiles = appFiles.concat(repoFiles).sort();

function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function isFile(rel) {
  try {
    return fs.statSync(path.join(root, rel)).isFile();
  } catch (e) {
    return false;
  }
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const checks = [];

function addCheck(name, passed, detail) {
  checks.push({ name: name, passed: passed, detail: detail });
}

for (const rel of allFiles) {
  if (isFile(rel)) {
    const size = fs.statSync(path.join(root, rel)).size;
    addCheck("exists:" + rel, true, String(size) + " bytes");
  } else {
    addCheck("exists:" + rel, false, "missing");
  }
}

const forbidden = [
  "http://",
  "https://",
  "eval",
  "new Function",
  "serviceWorker",
  "document.cookie",
  "XMLHttpRequest",
  "fetch",
  "WebSocket",
];

for (const rel of ["app/index.html", "app/app.js", "app/styles.css"]) {
  if (!isFile(rel)) {
    addCheck("offline:" + rel, false, "missing");
    continue;
  }
  const text = readText(rel);
  const found = forbidden.filter(function (p) { return text.indexOf(p) !== -1; });
  if (found.length === 0) {
    addCheck("offline:" + rel, true, "no network/eval refs");
  } else {
    addCheck("offline:" + rel, false, "found: " + found.join(", "));
  }
}

if (isFile("LICENSE")) {
  const first = readText("LICENSE").split("\n")[0].trim();
  addCheck("license:spdx-first-line", first === "SPDX-License-Identifier: MIT", first);
} else {
  addCheck("license:spdx-first-line", false, "missing");
}

const badges = [
  ["competition", "https://make.fun/badge/gta6-cover-art-01.svg"],
  ["rank", "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg"],
  ["reward", "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg"],
];

for (const pair of badges) {
  const label = pair[0];
  const url = pair[1];
  const fileName = url.split("/").pop();
  if (!isFile("README.md")) {
    addCheck("readme:badge:" + fileName, false, "missing README");
    continue;
  }
  const text = readText("README.md");
  addCheck("readme:badge:" + fileName, text.indexOf(url) !== -1, url);
}

if (isFile(".makefun/owner.json")) {
  let ok = false;
  let detail = "unparsable";
  try {
    const parsed = JSON.parse(readText(".makefun/owner.json"));
    ok = parsed.wallet === "3yBDPgQMqvpj4cH7bAcrzw2Y9JcjsG4MfKAhrgvmMtp3";
    detail = ok ? "wallet matches" : "wallet mismatch";
  } catch (e) {
    detail = "invalid JSON";
  }
  addCheck("owner:wallet", ok, detail);
} else {
  addCheck("owner:wallet", false, "missing");
}

const samplePaths = [
  "app/samples/sample1-hero.jpg",
  "app/samples/sample2-ferris.jpg",
  "app/samples/sample3-heist.jpg",
  "app/samples/sample4-skate.jpg",
];
if (samplePaths.every(isFile)) {
  const hashes = samplePaths.map(function (p) { return sha256(path.join(root, p)); });
  const distinct = new Set(hashes).size;
  addCheck("samples:four-distinct", distinct === 4, String(distinct) + " distinct hashes");
} else {
  addCheck("samples:four-distinct", false, "missing sample");
}

const oflPhrases = [
  "SIL OPEN FONT LICENSE",
  "Version 1.1",
  "Permission is hereby granted, free of charge",
];
for (const name of ["OFL-Anton.txt", "OFL-Caveat.txt"]) {
  const rel = "app/fonts/" + name;
  if (!isFile(rel)) {
    addCheck("ofl:" + name, false, "missing");
    continue;
  }
  const text = readText(rel);
  const missing = oflPhrases.filter(function (p) { return text.indexOf(p) === -1; });
  addCheck("ofl:" + name, missing.length === 0, missing.length === 0 ? "all phrases present" : "missing: " + missing.join(", "));
}

const alfaAbsent = !isFile("app/fonts/AlfaSlabOne-Regular.ttf") && !isFile("app/fonts/OFL-AlfaSlabOne.txt");
addCheck("fonts:alfa-absent", alfaAbsent, alfaAbsent ? "no Alfa Slab One files" : "Alfa Slab One file present");

const appTextFiles = ["app/index.html", "app/app.js", "app/styles.css"];
let antonOk = true;
let antonDetail = "Anton present in all three app files, no Alfa refs";
for (const rel of appTextFiles) {
  if (!isFile(rel)) {
    antonOk = false;
    antonDetail = "missing " + rel;
    break;
  }
  const text = readText(rel);
  if (text.indexOf("Anton") === -1 || text.indexOf("Alfa") !== -1) {
    antonOk = false;
    antonDetail = "check failed in " + rel;
    break;
  }
}
addCheck("fonts:anton-in-app", antonOk, antonDetail);

const layoutSnippets = [
  ["layouts:landscape-v1-hero", "w: 1152, h: 1080"],
  ["layouts:portrait-hero-top", "w: 1080, h: 810"],
  ["layouts:square-banner", "w: 1080, h: 594"],
  ["layouts:diagonal-landscape", "slant: 60"],
];
const appJs = isFile("app/app.js") ? readText("app/app.js") : "";
for (const pair of layoutSnippets) {
  addCheck(pair[0], appJs.indexOf(pair[1]) !== -1, pair[1]);
}

checks.sort(function (a, b) {
  if (a.name < b.name) { return -1; }
  if (a.name > b.name) { return 1; }
  return 0;
});

const files = {};
for (const rel of allFiles) {
  if (isFile(rel)) {
    files[rel] = sha256(path.join(root, rel));
  }
}

const passed = checks.filter(function (c) { return c.passed; }).length;

const report = {
  bundle: "gta6-cover-art-01",
  entry: "Neon Coast final (per-orientation layouts, Anton)",
  checks: checks,
  files: files,
  passed: passed,
  total: checks.length,
};

process.stdout.write(JSON.stringify(report, null, 2) + "\n");
process.exit(passed === checks.length ? 0 : 1);
