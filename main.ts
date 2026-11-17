// GRIDFALL: Last Current — the entry program for make.fun's best-game-01 bounty.
//
// The game is game/: plain static files (index.html and its ES modules), no library and no
// network request. This program copies game/ and screenshots/ from beside itself to /output and
// writes /output/dossier.json, the summary the judge reads, with the vendored make.fun library.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: they refuse an entry the scorer would refuse. text_max_bytes shapes the
// dossier's bytes; the others cap the screenshots and game/ the exact way the gate does.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Build log for the entrant: what the grader's snapshot now holds.
const gameTop = readdirSync(join(out, 'game')).length;
const shots = readdirSync(join(out, 'screenshots')).length;
console.log(`GRIDFALL entry written to ${out}: game/ ${gameTop} top-level entries, ${shots} screenshots, dossier ${dossier.length} bytes`);
