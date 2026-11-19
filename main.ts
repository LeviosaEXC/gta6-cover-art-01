import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type Check = { detail: string; name: string; pass: boolean };

const root: string = path.dirname(fileURLToPath(import.meta.url));

const appFiles: string[] = [
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

const repoFiles: string[] = [
  "LICENSE",
  "README.md",
  ".makefun/owner.json",
  "main.ts",
];

const allFiles: string[] = [...appFiles, ...repoFiles];

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function readText(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function existsFile(rel: string): boolean {
  const p: string = path.join(root, rel);
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function fileSize(rel: string): number {
  return fs.statSync(path.join(root, rel)).size;
}

const checks: Check[] = [];

for (const rel of allFiles) {
  if (existsFile(rel)) {
    checks.push({ detail: String(fileSize(rel)), name: "exists:" + rel, pass: true });
  } else {
    checks.push({ detail: "missing", name: "exists:" + rel, pass: false });
  }
}

const forbidden: string[] = [
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
  if (!existsFile(rel)) {
    checks.push({ detail: "missing", name: "offline:" + rel, pass: false });
    continue;
  }
  const content: string = readText(rel);
  const found: string[] = forbidden.filter((pat) => content.includes(pat));
  checks.push({
    detail: found.length === 0 ? "no network/eval refs" : found.join(", "),
    name: "offline:" + rel,
    pass: found.length === 0,
  });
}

if (existsFile("LICENSE")) {
  const first: string = readText("LICENSE").split("\n")[0].trim();
  checks.push({
    detail: first,
    name: "license:spdx-first-line",
    pass: first === "SPDX-License-Identifier: MIT",
  });
} else {
  checks.push({ detail: "missing", name: "license:spdx-first-line", pass: false });
}

const badges: string[] = [
  "https://make.fun/badge/gta6-cover-art-01.svg",
  "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/rank.svg",
  "https://make.fun/badge/gta6-cover-art-01/LeviosaEXC/gta6-cover-art-01/reward.svg",
];

for (const url of badges) {
  const badgeName: string = url.split("/").pop() as string;
  if (!existsFile("README.md")) {
    checks.push({ detail: "missing README.md", name: "readme:badge:" + badgeName, pass: false });
    continue;
  }
  const readme: string = readText("README.md");
  checks.push({
    detail: readme.includes(url) ? url : "absent",
    name: "readme:badge:" + badgeName,
    pass: readme.includes(url),
  });
}

if (existsFile(".makefun/owner.json")) {
  let wallet: string = "";
  let ok: boolean = false;
  try {
    const parsed = JSON.parse(readText(".makefun/owner.json")) as { wallet?: unknown };
    wallet = typeof parsed.wallet === "string" ? parsed.wallet : "";
    ok = wallet === "3yBDPgQMqvpj4cH7bAcrzw2Y9JcjsG4MfKAhrgvmMtp3";
  } catch {
    ok = false;
  }
  checks.push({ detail: wallet, name: "owner:wallet", pass: ok });
} else {
  checks.push({ detail: "missing", name: "owner:wallet", pass: false });
}

const sampleFiles: string[] = [
  "app/samples/sample1-hero.jpg",
  "app/samples/sample2-ferris.jpg",
  "app/samples/sample3-heist.jpg",
  "app/samples/sample4-skate.jpg",
];
if (sampleFiles.every((rel) => existsFile(rel))) {
  const hashes: string[] = sampleFiles.map((rel) =>
    sha256(fs.readFileSync(path.join(root, rel))),
  );
  const distinct: number = new Set(hashes).size;
  checks.push({
    detail: String(distinct) + " distinct hashes",
    name: "samples:four-distinct",
    pass: distinct === 4,
  });
} else {
  checks.push({ detail: "missing sample", name: "samples:four-distinct", pass: false });
}

const oflPhrases: string[] = [
  "SIL OPEN FONT LICENSE",
  "Version 1.1",
  "Permission is hereby granted, free of charge",
];
for (const name of ["OFL-Anton.txt", "OFL-Caveat.txt"]) {
  const rel: string = "app/fonts/" + name;
  if (!existsFile(rel)) {
    checks.push({ detail: "missing", name: "ofl:" + name, pass: false });
    continue;
  }
  const content: string = readText(rel);
  const missing: string[] = oflPhrases.filter((phrase) => !content.includes(phrase));
  checks.push({
    detail: missing.length === 0 ? "all phrases present" : "missing: " + missing.join(", "),
    name: "ofl:" + name,
    pass: missing.length === 0,
  });
}

const alfaTtf: boolean = existsFile("app/fonts/AlfaSlabOne-Regular.ttf");
const alfaOfl: boolean = existsFile("app/fonts/OFL-AlfaSlabOne.txt");
checks.push({
  detail: alfaTtf || alfaOfl ? "present" : "absent",
  name: "fonts:alfa-absent",
  pass: !alfaTtf && !alfaOfl,
});

const appTextFiles: string[] = ["app/index.html", "app/app.js", "app/styles.css"];
if (appTextFiles.every((rel) => existsFile(rel))) {
  const contents: string[] = appTextFiles.map((rel) => readText(rel));
  const allAnton: boolean = contents.every((c) => c.includes("Anton"));
  const anyAlfa: boolean = contents.some((c) => c.includes("Alfa"));
  checks.push({
    detail: allAnton && !anyAlfa ? "Anton in all three, no Alfa" : "mismatch",
    name: "fonts:anton-in-app",
    pass: allAnton && !anyAlfa,
  });
} else {
  checks.push({ detail: "missing app file", name: "fonts:anton-in-app", pass: false });
}

const layoutNeedles: Array<[string, string]> = [
  ["layouts:landscape-v1-hero", "w: 1152, h: 1080"],
  ["layouts:portrait-hero-top", "w: 1080, h: 810"],
  ["layouts:square-banner", "w: 1080, h: 594"],
  ["layouts:diagonal-landscape", "slant: 60"],
];
if (existsFile("app/app.js")) {
  const js: string = readText("app/app.js");
  for (const [name, needle] of layoutNeedles) {
    checks.push({ detail: needle, name, pass: js.includes(needle) });
  }
} else {
  for (const [name, needle] of layoutNeedles) {
    checks.push({ detail: needle, name, pass: false });
  }
}

checks.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const files: Record<string, string> = {};
for (const rel of [...allFiles].sort()) {
  if (existsFile(rel)) {
    files[rel] = sha256(fs.readFileSync(path.join(root, rel)));
  }
}

const passed: number = checks.filter((c) => c.pass).length;
const report = {
  bundle: "gta6-cover-art-01",
  checks,
  entry: "Neon Coast final (per-orientation layouts, Anton)",
  files,
  passed,
  total: checks.length,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = passed === checks.length ? 0 : 1;
