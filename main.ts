// main.ts — gta6-cover-art-01 "Neon Coast" cover maker (final).
// Deterministic bundle verifier. Node 22+, stdlib only, no network.
// Usage: node main.ts
// Prints a sorted JSON report of every bundle check to stdout and exits
// 0 when all checks pass, 1 otherwise. Running it twice produces
// byte-identical output: no timestamps, no random values, sorted keys.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

type Check = { name: string; ok: boolean; detail: string };

const ROOT = process.cwd();
const WALLET = "3yBDPgQMqvpj4cH7bAcrzw2Y9JcjsG4MfKAhrgvmMtp3";

const APP_FILES: string[] = [
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

const REPO_FILES: string[] = [
  "LICENSE",
  "README.md",
  ".makefun/owner.json",
  "main.ts",
];

const FORBIDDEN_IN_APP: RegExp[] = [
  /https?:\/\//,
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /serviceWorker/,
  /document\.cookie/,
  /XMLHttpRequest/,
  /fetch\s*\(/,
  /WebSocket/,
];

function sha256(path: string): string {
  const data = readFileSync(path);
  return createHash("sha256").update(data).digest("hex");
}

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

function checkFilesExist(files: string[], checks: Check[]): void {
  for (const rel of files) {
    const full = join(ROOT, rel);
    const ok = existsSync(full) && statSync(full).isFile();
    checks.push({
      name: "exists:" + rel,
      ok,
      detail: ok ? "present, " + statSync(full).size + " bytes" : "missing",
    });
  }
}

function checkNoNetworkInApp(checks: Check[]): void {
  const textFiles = ["app/index.html", "app/app.js", "app/styles.css"];
  for (const rel of textFiles) {
    const body = readText(join(ROOT, rel));
    const hits: string[] = [];
    for (const re of FORBIDDEN_IN_APP) {
      if (re.test(body)) hits.push(String(re));
    }
    checks.push({
      name: "offline:" + rel,
      ok: hits.length === 0,
      detail: hits.length === 0 ? "no network/eval refs" : "forbidden: " + hits.join(", "),
    });
  }
}

function checkLicense(checks: Check[]): void {
  const first = readText(join(ROOT, "LICENSE")).split("\n")[0].trim();
  checks.push({
    name: "license:spdx-first-line",
    ok: first === "SPDX-License-Identifier: MIT",
    detail: "first line is: " + first,
  });
}

function checkReadme(checks: Check[]): void {
  const body = readText(join(ROOT, "README.md"));
  const badges = [
    "https://make.fun/badge/gta6-cover-art-01.svg",
    "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg",
    "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg",
  ];
  for (const badge of badges) {
    checks.push({
      name: "readme:badge:" + badge.split("/").pop(),
      ok: body.includes(badge),
      detail: body.includes(badge) ? "badge present" : "badge missing",
    });
  }
}

function checkOwner(checks: Check[]): void {
  const raw = readText(join(ROOT, ".makefun/owner.json"));
  let parsed: { wallet?: string } = {};
  try {
    parsed = JSON.parse(raw) as { wallet?: string };
  } catch {
    parsed = {};
  }
  checks.push({
    name: "owner:wallet",
    ok: parsed.wallet === WALLET,
    detail: parsed.wallet === WALLET ? "agent wallet recorded" : "wallet mismatch",
  });
}

function checkSamplesDistinct(checks: Check[]): void {
  const hashes = new Set<string>();
  for (let i = 1; i <= 4; i++) {
    hashes.add(sha256(join(ROOT, "app/samples/sample" + i + "-" +
      ["hero", "ferris", "heist", "skate"][i - 1] + ".jpg")));
  }
  checks.push({
    name: "samples:four-distinct",
    ok: hashes.size === 4,
    detail: hashes.size + " distinct sample images",
  });
}

function checkOfl(checks: Check[]): void {
  for (const name of ["OFL-Anton.txt", "OFL-Caveat.txt"]) {
    const body = readText(join(ROOT, "app/fonts/" + name));
    const ok = body.includes("SIL OPEN FONT LICENSE") &&
      body.includes("Version 1.1") &&
      body.includes("Permission is hereby granted, free of charge");
    checks.push({
      name: "ofl:" + name,
      ok,
      detail: ok ? "OFL 1.1 text present" : "OFL text incomplete",
    });
  }
}

function checkLayouts(checks: Check[]): void {
  // The three per-orientation compositions must be the ones in the app:
  // V1 hero-dominant landscape, V3 diagonal portrait, banner square.
  const src = readText(join(ROOT, "app/app.js"));
  const cases: Array<[string, string, string]> = [
    ["layouts:landscape-v1-hero", "w: 1152, h: 1080", "landscape hero rect missing"],
    ["layouts:portrait-diagonal", "slant: 75", "portrait diagonal strips missing"],
    ["layouts:square-banner", "w: 1080, h: 594", "square banner hero missing"],
  ];
  for (const [name, needle, detail] of cases) {
    const ok = src.includes(needle);
    checks.push({ name, ok, detail: ok ? needle : detail });
  }
}

function checkFontSwap(checks: Check[]): void {
  // The rejected title font must be fully gone; the final title font
  // (Anton) must be the one the app actually references.
  const alfaGone =
    !existsSync(join(ROOT, "app/fonts/AlfaSlabOne-Regular.ttf")) &&
    !existsSync(join(ROOT, "app/fonts/OFL-AlfaSlabOne.txt"));
  checks.push({
    name: "fonts:alfa-absent",
    ok: alfaGone,
    detail: alfaGone ? "no Alfa Slab One files in the bundle" : "Alfa Slab One still present",
  });
  const appFiles = ["app/index.html", "app/app.js", "app/styles.css"];
  const usesAnton = appFiles.every((rel) => readText(join(ROOT, rel)).includes("Anton"));
  const noAlfa = appFiles.every((rel) => !readText(join(ROOT, rel)).includes("Alfa"));
  checks.push({
    name: "fonts:anton-in-app",
    ok: usesAnton && noAlfa,
    detail: usesAnton && noAlfa ? "Anton referenced, no Alfa references" : "font references wrong",
  });
}

function main(): number {
  const checks: Check[] = [];
  checkFilesExist(APP_FILES, checks);
  checkFilesExist(REPO_FILES, checks);
  checkNoNetworkInApp(checks);
  checkLicense(checks);
  checkReadme(checks);
  checkOwner(checks);
  checkSamplesDistinct(checks);
  checkOfl(checks);
  checkFontSwap(checks);
  checkLayouts(checks);

  const files: Record<string, string> = {};
  for (const rel of [...APP_FILES, ...REPO_FILES].sort()) {
    const full = join(ROOT, rel);
    if (existsSync(full)) files[rel] = sha256(full);
  }

  const passed = checks.filter((c) => c.ok).length;
  const report = {
    bundle: "gta6-cover-art-01",
    entry: "Neon Coast final (per-orientation layouts, Anton)",
    checks: checks.sort((a, b) => a.name.localeCompare(b.name)),
    files,
    passed,
    total: checks.length,
  };
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  return passed === checks.length ? 0 : 1;
}

process.exit(main());
