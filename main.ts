// NEON COAST — the gta6-cover-art-01 entry program.
// Handoff only: copies app/ and screenshots/ into the output directory,
// then writes dossier.json built from exactly what was handed in.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const outputDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outputDir) {
  console.error('error: MAKEFUN_OUTPUT_DIR is not set');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));

mkdirSync(outputDir, { recursive: true });
cpSync(join(here, 'app'), join(outputDir, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`dossier written: ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
