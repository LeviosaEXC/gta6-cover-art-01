// Neon Coast Collage — entry program (Node 22, standard library only).
//
// Copies app/ and screenshots/ into the directory named by
// MAKEFUN_OUTPUT_DIR, then writes dossier.json — byte for byte what the
// kit's buildDossier computes from those two directories. Run it twice and
// the output is identical, because the copy is a plain tree copy and the
// dossier is canonical JSON over the copied files.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  console.error('MAKEFUN_OUTPUT_DIR is not set');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${outDir} (dossier ${dossier.length} bytes)`);
