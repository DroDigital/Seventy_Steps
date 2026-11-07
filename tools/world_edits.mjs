#!/usr/bin/env node
/**
 * The world editor's export taken into the game (round 110; docs/WORLD_EDITOR.md).
 *
 *   node tools/world_edits.mjs apply <export.json>      writes src/data/worldEdits.ts
 *   node tools/world_edits.mjs describe <export.json>   one line for each edit (for a PR's body)
 *
 * Needs Node 22.18 or later (it runs src/world/edits/editFile.ts as it is). Then `npm run check`:
 * tests/worldEdits.test.ts finds every edit's target in the world.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describeEdit, editProblem, isEditFile, readDataFile, takeExport, writeDataFile } from '../src/world/edits/editFile.ts';

const DATA = fileURLToPath(new URL('../src/data/worldEdits.ts', import.meta.url));
const [cmd, path] = process.argv.slice(2);
if (!['apply', 'describe'].includes(cmd ?? '') || !path) {
  console.error('usage: node tools/world_edits.mjs apply|describe <export.json>');
  process.exit(2);
}
const file = JSON.parse(readFileSync(path, 'utf8'));
if (!isEditFile(file)) {
  console.error(`${path}: not a world edit file (format seventy-steps-world-edits, version 1)`);
  process.exit(1);
}
const problems = file.edits.map((e, i) => [i, editProblem(e)]).filter(([, p]) => p);
if (problems.length) {
  for (const [i, p] of problems) console.error(`edit ${i}: ${p}`);
  process.exit(1);
}
if (file.note) console.log(`Note: ${file.note}`);
if (cmd === 'describe') {
  for (const e of file.edits) console.log(`- ${describeEdit(e)}`);
  process.exit(0);
}
const text = readFileSync(DATA, 'utf8');
const before = readDataFile(text).edits;
const after = takeExport(before, file);
writeFileSync(DATA, writeDataFile(text, after));
console.log(`src/data/worldEdits.ts: ${before.length} edits before, ${after.length} now. Run npm run check.`);
