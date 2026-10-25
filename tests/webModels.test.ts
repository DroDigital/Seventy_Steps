/** Round 78: the models taken from free web sources (tools/models/boss/manifest_web.py, docs/WEB_PARTS.md): each credited, and a set of its own. */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSS_INFO } from '../src/data/models/bossIndex';
import { GATE_INFO } from '../src/data/models/gateIndex';
import { MODEL_INFO } from '../src/data/models/index';
import { WEB_INFO } from '../src/data/models/webIndex';

describe('the web set', () => {
  const credits = readFileSync('src/data/models/CREDITS.md', 'utf8');

  it('is a set of its own: no id is in another, and all are in the merged table', () => {
    for (const id of Object.keys(WEB_INFO)) {
      expect(BOSS_INFO[id], id).toBeUndefined();
      expect(GATE_INFO[id], id).toBeUndefined();
      expect(MODEL_INFO[id], id).toBeDefined();
    }
  });

  it('credits every source its models come from, names the licence, and names every model', () => {
    const kits = new Set(Object.values(WEB_INFO).map((i) => i.kit));
    expect(kits.size).toBeGreaterThan(0);
    for (const k of kits) expect(credits, `credits of web source ${k}`).toContain(`## Web source ${k} `);
    for (const id of Object.keys(WEB_INFO)) expect(credits, `credits name ${id}`).toContain(`\`${id}\``);
    expect(credits).toMatch(/CC0 1\.0/);
  });

  it('keeps every part to 1,500 faces', () => {
    for (const [id, info] of Object.entries(WEB_INFO)) expect(info.tris, id).toBeLessThanOrEqual(1500);
  });
});
