/**
 * The demo's leak check (docs/DEMO_BUILD.md): the demo's build is read for every id, name and file of the full game that it must not
 * hold, and every file it does hold must be one the demo ships (tools/demo/assets.ts, read from the build's own bundle). The canary
 * builds the whole game the same way and must fail the same check: a check that passes everything proves nothing.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, test } from 'vitest';
import { demoShip } from '../tools/demo/assets.ts';
import { buildDemo } from '../tools/demo/build.ts';
import { buildLiterals, checkBuild, type Report } from '../tools/demo/leak.ts';
import { forbidden } from '../tools/demo/leak/catalog.ts';
import { allowedFile } from '../tools/demo/leak/allowed.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CACHE = join(ROOT, 'node_modules/.cache/demo-leak/');
const DEMO = join(CACHE, 'demo');
const TIMEOUT = 240_000;
const shown = (r: Report): string[] => r.hits.slice(0, 80).map((h) => `${h.kind} ${h.file}: ${h.what}`);

describe('the demo build holds nothing of the rest of the game', () => {
  beforeAll(async () => {
    await buildDemo(DEMO);
  }, TIMEOUT);

  test('no forbidden id, name or file, and only the files the demo ships', () => {
    const shipped = new Set(demoShip(ROOT, buildLiterals(DEMO)).files);
    const report = checkBuild(DEMO, forbidden(), (f) => allowedFile(f, shipped));
    expect(shown(report)).toEqual([]);
  }, TIMEOUT);

  test('every file the demo ships is in its build', () => {
    const shipped = demoShip(ROOT, buildLiterals(DEMO)).files;
    expect(shipped.filter((f) => !existsSync(join(DEMO, f)))).toEqual([]);
  }, TIMEOUT);

  test('the canary: the whole game, built the same way, is caught', async () => {
    const out = join(CACHE, 'canary');
    await buildDemo(out, []);
    const shipped = new Set(demoShip(ROOT, buildLiterals(out)).files);
    const report = checkBuild(out, forbidden(), (f) => allowedFile(f, shipped));
    expect(report.hits.length).toBeGreaterThan(100);
  }, TIMEOUT);

  test('its edition marker says demo', () => {
    expect(JSON.parse(readFileSync(join(DEMO, 'edition.json'), 'utf8'))).toEqual({ edition: 'demo' });
  }, TIMEOUT);
});
