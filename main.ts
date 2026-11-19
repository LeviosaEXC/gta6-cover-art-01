import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

const ROOT: string = process.cwd();

const APP_FILES: string[] = [
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

const REPO_FILES: string[] = [
  ".makefun/owner.json",
  "LICENSE",
  "README.md",
  "main.ts",
];

const ALL_FILES: string[] = [...APP_FILES, ...REPO_FILES].sort();

const WALLET: string = "3yBDPgQMqvpj4cH7bAcrzw2Y9JcjsG4MfKAhrgvmMtp3";

const BADGES: string[] = [
  "https://make.fun/badge/gta6-cover-art-01.svg",
  "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg",
  "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg",
];

const OFFLINE_PATTERNS: string[] = [
  "http://",
  "https://",
  "eval",
  "Function",
  "serviceWorker",
  "document.cookie",
  "XMLHttpRequest",
  "fetch",
  "WebSocket",
];

const OFL_PHRASES: string[] = [
  "SIL OPEN FONT LICENSE",
  "Version 1.1",
  "Permission is hereby granted, free of charge",
];

type Check = { name: string; passed: boolean; detail: string };

function sha256(rel: string): string {
  const buf: Buffer = fs.readFileSync(path.join(ROOT, rel));
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readText(rel: string): string | null {
  const full: string = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

function isFile(rel: string): boolean {
  const full: string = path.join(ROOT, rel);
  try {
    return fs.statSync(full).isFile();
  } catch {
    return false;
  }
}

function sizeOf(rel: string): number {
  return fs.statSync(path.join(ROOT, rel)).size;
}

const checks: Check[] = [];

// exists (15)
for (const rel of ALL_FILES) {
  if (isFile(rel)) {
    checks.push({ name: "exists:" + rel, passed: true, detail: sizeOf(rel) + " bytes" });
  } else {
    checks.push({ name: "exists:" + rel, passed: false, detail: "missing" });
  }
}

// offline (3)
for (const rel of ["app/index.html", "app/app.js", "app/styles.css"]) {
  const content: string | null = readText(rel);
  if (content === null) {
    checks.push({ name: "offline:" + rel, passed: false, detail: "missing" });
  } else {
    const found: string[] = OFFLINE_PATTERNS.filter((p: string) => content.includes(p));
    if (found.length === 0) {
      checks.push({ name: "offline:" + rel, passed: true, detail: "no network/eval refs" });
    } else {
      checks.push({ name: "offline:" + rel, passed: false, detail: "found: " + found.join(", ") });
    }
  }
}

// license (1)
{
  const content: string | null = readText("LICENSE");
  if (content === null) {
    checks.push({ name: "license:spdx-first-line", passed: false, detail: "missing" });
  } else {
    const first: string = content.split("\n")[0].trim();
    checks.push({
      name: "license:spdx-first-line",
      passed: first === "SPDX-License-Identifier: MIT",
      detail: first,
    });
  }
}

// readme badges (3)
{
  const content: string | null = readText("README.md");
  for (const url of BADGES) {
    const base: string = url.split("/").pop() as string;
    if (content === null) {
      checks.push({ name: "readme:badge:" + base, passed: false, detail: "missing README.md" });
    } else if (content.includes(url)) {
      checks.push({ name: "readme:badge:" + base, passed: true, detail: "contains " + url });
    } else {
      checks.push({ name: "readme:badge:" + base, passed: false, detail: "missing " + url });
    }
  }
}

// owner (1)
{
  const content: string | null = readText(".makefun/owner.json");
  if (content === null) {
    checks.push({ name: "owner:wallet", passed: false, detail: "missing" });
  } else {
    try {
      const parsed = JSON.parse(content) as { wallet?: unknown };
      const wallet: unknown = parsed.wallet;
      checks.push({
        name: "owner:wallet",
        passed: wallet === WALLET,
        detail: typeof wallet === "string" ? wallet : "wallet field missing",
      });
    } catch {
      checks.push({ name: "owner:wallet", passed: false, detail: "invalid JSON" });
    }
  }
}

// samples (1)
{
  const sampleFiles: string[] = [
    "app/samples/sample1-hero.jpg",
    "app/samples/sample2-ferris.jpg",
    "app/samples/sample3-heist.jpg",
    "app/samples/sample4-skate.jpg",
  ];
  const hashes: string[] = [];
  let allPresent: boolean = true;
  for (const rel of sampleFiles) {
    if (isFile(rel)) hashes.push(sha256(rel));
    else allPresent = false;
  }
  const distinct: number = new Set(hashes).size;
  checks.push({
    name: "samples:four-distinct",
    passed: allPresent && distinct === 4,
    detail: distinct + " distinct hashes",
  });
}

// ofl (2)
for (const name of ["OFL-Anton.txt", "OFL-Caveat.txt"]) {
  const content: string | null = readText("app/fonts/" + name);
  if (content === null) {
    checks.push({ name: "ofl:" + name, passed: false, detail: "missing" });
  } else {
    const missingPhrases: string[] = OFL_PHRASES.filter((p: string) => !content.includes(p));
    if (missingPhrases.length === 0) {
      checks.push({ name: "ofl:" + name, passed: true, detail: "contains required phrases" });
    } else {
      checks.push({ name: "ofl:" + name, passed: false, detail: "missing: " + missingPhrases.join(", ") });
    }
  }
}

// fonts (2)
{
  const alfaPresent: boolean =
    isFile("app/fonts/AlfaSlabOne-Regular.ttf") || isFile("app/fonts/OFL-AlfaSlabOne.txt");
  checks.push({
    name: "fonts:alfa-absent",
    passed: !alfaPresent,
    detail: alfaPresent ? "Alfa Slab One files present" : "no Alfa Slab One files",
  });
}
{
  const appPaths: string[] = ["app/index.html", "app/app.js", "app/styles.css"];
  let allAnton: boolean = true;
  let anyAlfa: boolean = false;
  for (const rel of appPaths) {
    const content: string | null = readText(rel);
    if (content === null || !content.includes("Anton")) allAnton = false;
    if (content !== null && content.includes("Alfa")) anyAlfa = true;
  }
  checks.push({
    name: "fonts:anton-in-app",
    passed: allAnton && !anyAlfa,
    detail: allAnton && !anyAlfa ? "Anton in all app files, no Alfa refs" : "Anton/Alfa mismatch",
  });
}

// layouts (4)
{
  const content: string | null = readText("app/app.js");
  const wanted: Array<[string, string]> = [
    ["layouts:landscape-v1-hero", "w: 1152, h: 1080"],
    ["layouts:portrait-hero-top", "w: 1080, h: 810"],
    ["layouts:square-banner", "w: 1080, h: 594"],
    ["layouts:diagonal-landscape", "slant: 60"],
  ];
  for (const [name, snippet] of wanted) {
    if (content === null) {
      checks.push({ name, passed: false, detail: "missing app/app.js" });
    } else if (content.includes(snippet)) {
      checks.push({ name, passed: true, detail: "contains `" + snippet + "`" });
    } else {
      checks.push({ name, passed: false, detail: "missing `" + snippet + "`" });
    }
  }
}

checks.sort((a: Check, b: Check) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const files: Record<string, string> = {};
for (const rel of ALL_FILES) {
  if (isFile(rel)) files[rel] = sha256(rel);
}

const passed: number = checks.filter((c: Check) => c.passed).length;
const total: number = checks.length;

const report = {
  bundle: "gta6-cover-art-01",
  entry: "Neon Coast final (per-orientation layouts, Anton)",
  checks: checks,
  files: files,
  passed: passed,
  total: total,
};

process.stdout.write(JSON.stringify(report, null, 2) + "\n");
process.exitCode = passed === total ? 0 : 1;
