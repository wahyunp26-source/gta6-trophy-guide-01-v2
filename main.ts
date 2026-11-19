// Leonida 55 — hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
// The guide is this directory's app/ folder: plain static files served with
// app/ at the root, app/index.html opens in desktop Chrome and works offline.
// This program copies app/ and screenshots/ from beside this file to /output
// (or MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with buildDossier from the vendored make.fun library. vendor/ is unchanged.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
