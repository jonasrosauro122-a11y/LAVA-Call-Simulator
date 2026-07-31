#!/usr/bin/env node
// LAVA project doctor — detects and cleans the specific junk that keeps appearing after
// zip/upload round-trips, so the project typechecks and builds cleanly. Safe by design:
// it only removes files it can positively identify as junk, and never touches canonical code.
//
//   Run:  npm run doctor        (report + fix)
//         npm run doctor -- --check   (report only, non-zero exit if issues found)
//
// What it cleans:
//   1) Stray 1-byte files literally named `as` injected into source directories.
//   2) Duplicate learning-lib files copied into src/lib/ (the real ones live in
//      src/learning/lib/). A src/lib copy is only removed when the canonical file exists.

import { readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const checkOnly = process.argv.includes('--check');

const DUP_LIB_FILES = [
  'achievements', 'certification', 'challenges', 'gamificationApi', 'leaderboard',
  'learningApi', 'progressEngine', 'rankEngine', 'streak', 'xpEngine',
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
      walk(p, out);
    } else {
      out.push({ path: p, name, size: st.size });
    }
  }
  return out;
}

const found = { asJunk: [], libDupes: [] };

if (existsSync(SRC)) {
  for (const f of walk(SRC)) {
    // 1) stray 1-byte `as` files
    if (f.name === 'as' && f.size <= 2) found.asJunk.push(f.path);
  }
  // 2) duplicate learning-lib files misplaced in src/lib
  const libDir = join(SRC, 'lib');
  const canonicalDir = join(SRC, 'learning', 'lib');
  for (const base of DUP_LIB_FILES) {
    const dupe = join(libDir, `${base}.ts`);
    const canonical = join(canonicalDir, `${base}.ts`);
    if (existsSync(dupe) && existsSync(canonical)) found.libDupes.push(dupe);
  }
}

const total = found.asJunk.length + found.libDupes.length;
const rel = (p) => p.replace(ROOT + '/', '');

if (total === 0) {
  console.log('✓ doctor: project is clean — no known junk found.');
  process.exit(0);
}

console.log(`doctor: found ${total} junk item(s):`);
if (found.asJunk.length) console.log(`  • ${found.asJunk.length} stray 'as' file(s)`);
if (found.libDupes.length) {
  console.log(`  • ${found.libDupes.length} duplicate learning-lib file(s) in src/lib:`);
  for (const p of found.libDupes) console.log(`      ${rel(p)}`);
}

if (checkOnly) {
  console.log("doctor: run 'npm run doctor' to remove these.");
  process.exit(1);
}

for (const p of [...found.asJunk, ...found.libDupes]) rmSync(p, { force: true });
console.log(`✓ doctor: removed ${total} junk item(s). Run 'npm run typecheck' to confirm.`);
process.exit(0);
