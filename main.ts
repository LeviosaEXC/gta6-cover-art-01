// Deterministic bundle verifier for gta6-cover-art-01 ("Neon Coast").
// Node 22+, standard library only, no network. Run: node main.ts
// Prints a sorted JSON report to stdout; exit 0 when all checks pass.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const APP_FILES = [
  "app/app.js",
  "app/fonts/Anton-Regular.ttf",
  "app/fonts/Caveat.ttf",
  "app/fonts/OFL-Anton.txt",
  "app/fonts/OFL-Caveat.txt",
  "app/index.html",
  "app/samples/sample1-hero.jpg",
  "app/samples/sample2-ferris.jpg",
  "app/samples/sample3-heist.jpg",
  "app/samples/sample4-skate.jpg",
  "app/styles.css",
];

const REPO_FILES = [".makefun/owner.json", "LICENSE", "README.md", "main.ts"];

const ALL_FILES = [...APP_FILES, ...REPO_FILES].sort();

const BADGES = [
  "https://make.fun/badge/gta6-cover-art-01.svg",
  "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg",
  "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg",
];

const OFFLINE_PATTERNS = [
  "http://",
  "https://",
  "eval(",
  "new Function",
  "serviceWorker",
  "document.cookie",
  "XMLHttpRequest",
  "fetch",
  "WebSocket",
];

const WALLET = "3yBDPgQMqvpj4cH7bAcrzw2Y9JcjsG4MfKAhrgvmMtp3";

const LAYOUT_SNIPPETS = [
  ["layouts:landscape-v1-hero", "w: 1152, h: 1080"],
  ["layouts:portrait-hero-top", "w: 1080, h: 810"],
  ["layouts:square-banner", "w: 1080, h: 594"],
  ["layouts:diagonal-landscape", "slant: 60"],
];

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function readText(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function check(name, passed, detail) {
  return { name, passed, detail };
}

const checks = [];

// exists (15)
for (const rel of ALL_FILES) {
  const full = join(ROOT, rel);
  let ok = false;
  let detail = "missing";
  try {
    if (existsSync(full) && statSync(full).isFile()) {
      ok = true;
      detail = String(statSync(full).size);
    }
  } catch {
    ok = false;
    detail = "missing";
  }
  checks.push(check("exists:" + rel, ok, detail));
}

// offline (3)
for (const rel of ["app/index.html", "app/app.js", "app/styles.css"]) {
  let content = "";
  try {
    content = readText(rel);
  } catch {
    content = "";
  }
  const found = OFFLINE_PATTERNS.filter((p) => content.includes(p));
  checks.push(
    check(
      "offline:" + rel,
      found.length === 0,
      found.length === 0 ? "no network/eval refs" : "found: " + found.join(", "),
    ),
  );
}

// license (1)
let licenseFirst = "";
try {
  licenseFirst = readText("LICENSE").split("\n")[0].trim();
} catch {
  licenseFirst = "";
}
checks.push(
  check(
    "license:spdx-first-line",
    licenseFirst === "SPDX-License-Identifier: MIT",
    licenseFirst,
  ),
);

// readme badges (3)
let readme = "";
try {
  readme = readText("README.md");
} catch {
  readme = "";
}
for (const url of BADGES) {
  const badgeName = url.slice(url.lastIndexOf("/") + 1);
  checks.push(check("readme:badge:" + badgeName, readme.includes(url), url));
}

// owner (1)
let ownerOk = false;
let ownerDetail = "unparsable";
try {
  const parsed = JSON.parse(readText(".makefun/owner.json"));
  ownerOk = parsed && parsed.wallet === WALLET;
  ownerDetail = ownerOk ? WALLET : "wallet mismatch";
} catch {
  ownerOk = false;
  ownerDetail = "unparsable";
}
checks.push(check("owner:wallet", ownerOk, ownerDetail));

// samples (1)
const sampleHashes = [];
for (const rel of [
  "app/samples/sample1-hero.jpg",
  "app/samples/sample2-ferris.jpg",
  "app/samples/sample3-heist.jpg",
  "app/samples/sample4-skate.jpg",
]) {
  try {
    sampleHashes.push(sha256(join(ROOT, rel)));
  } catch {
    sampleHashes.push("missing");
  }
}
checks.push(
  check(
    "samples:four-distinct",
    new Set(sampleHashes).size === 4,
    String(new Set(sampleHashes).size) + " distinct hashes",
  ),
);

// ofl (2)
for (const name of ["OFL-Anton.txt", "OFL-Caveat.txt"]) {
  let content = "";
  try {
    content = readText("app/fonts/" + name);
  } catch {
    content = "";
  }
  const phrases = [
    "SIL OPEN FONT LICENSE",
    "Version 1.1",
    "Permission is hereby granted, free of charge",
  ];
  const missing = phrases.filter((p) => !content.includes(p));
  checks.push(
    check(
      "ofl:" + name,
      missing.length === 0,
      missing.length === 0 ? "all phrases present" : "missing: " + missing.join(", "),
    ),
  );
}

// fonts (2)
const alfaTtf = existsSync(join(ROOT, "app/fonts/AlfaSlabOne-Regular.ttf"));
const alfaOfl = existsSync(join(ROOT, "app/fonts/OFL-AlfaSlabOne.txt"));
checks.push(
  check("fonts:alfa-absent", !alfaTtf && !alfaOfl, alfaTtf || alfaOfl ? "present" : "absent"),
);
let antonOk = true;
for (const rel of ["app/index.html", "app/app.js", "app/styles.css"]) {
  let content = "";
  try {
    content = readText(rel);
  } catch {
    content = "";
  }
  if (!content.includes("Anton") || content.includes("Alfa")) antonOk = false;
}
checks.push(
  check("fonts:anton-in-app", antonOk, antonOk ? "Anton in all app files" : "check failed"),
);

// layouts (4)
let appJs = "";
try {
  appJs = readText("app/app.js");
} catch {
  appJs = "";
}
for (const [name, snippet] of LAYOUT_SNIPPETS) {
  checks.push(check(name, appJs.includes(snippet), snippet));
}

checks.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const files = {};
for (const rel of ALL_FILES) {
  try {
    files[rel] = sha256(join(ROOT, rel));
  } catch {
    // absent files are left out of the map
  }
}

const passed = checks.filter((c) => c.passed).length;
const report = {
  bundle: "gta6-cover-art-01",
  entry: "Neon Coast final (per-orientation layouts, Anton)",
  checks,
  files,
  passed,
  total: checks.length,
};

process.stdout.write(JSON.stringify(report, null, 2) + "\n");
process.exit(passed === checks.length ? 0 : 1);
