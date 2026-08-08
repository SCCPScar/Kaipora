// Stamps dist/sw.js with a build-unique cache name. public/sw.js ships with a
// static placeholder ('vproject-v1') because Vite copies public/ files
// verbatim without processing them — this script is what actually varies the
// value per build, so each deploy gets its own cache namespace and the
// service worker's activate handler evicts the previous deploy's assets
// instead of letting them accumulate forever.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const distSwPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'sw.js');
const buildId = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

const original = readFileSync(distSwPath, 'utf8');
const stamped = original.replace(
  /const CACHE_VERSION = '[^']*';/,
  `const CACHE_VERSION = 'vproject-${buildId}';`
);

if (stamped === original) {
  throw new Error('stamp-sw: CACHE_VERSION placeholder not found in dist/sw.js — check public/sw.js still defines it.');
}

writeFileSync(distSwPath, stamped);
console.log(`stamp-sw: dist/sw.js cache namespace set to vproject-${buildId}`);
