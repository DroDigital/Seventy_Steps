import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ZONES } from '../src/data/bossTuning';
import { REVIEWED_BODY, REVIEWED_EYES } from '../src/data/reviewedLook';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';

const manifest = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('what the renderer adds to the reviewed art (tools/reviewed_look.py)', () => {
  it('puts every eye inside the form it belongs to, with a colour', () => {
    for (const [key, [x, y, spread, ...rgb]] of Object.entries(REVIEWED_EYES)) {
      const entity = manifest.entities[key];
      expect(entity, key).toBeDefined();
      const frame = manifest.frames[entity.directions.front.actions.idle![0]];
      const [x0, y0, x1, y1] = frame.bounds;
      expect(x * frame.width, key).toBeGreaterThanOrEqual(x0);
      expect(x * frame.width, key).toBeLessThanOrEqual(x1);
      expect(y * frame.height, key).toBeGreaterThanOrEqual(y0);
      expect(y * frame.height, key).toBeLessThanOrEqual(y0 + (y1 - y0) * 0.6); // in the head
      expect(spread).toBeGreaterThan(0);
      expect(spread).toBeLessThanOrEqual(0.07 + 1e-9);
      for (const c of rgb) expect(c).toBeGreaterThanOrEqual(0);
      for (const c of rgb) expect(c).toBeLessThanOrEqual(1);
    }
    expect(Object.keys(REVIEWED_EYES).length).toBeGreaterThanOrEqual(8);
  });
});

describe('the painted body of a boss form (tools/reviewed_look.py)', () => {
  const bosses = Object.entries(manifest.entities).filter(([, e]) => e.assetGroup === 'bosses').map(([key]) => key);

  it('is measured for every boss form, in three bands, each a plausible share of its height', () => {
    expect(Object.keys(REVIEWED_BODY).sort()).toEqual(bosses.sort());
    for (const [key, bands] of Object.entries(REVIEWED_BODY)) {
      expect(bands, key).toHaveLength(3);
      for (const half of bands) {
        expect(half, key).toBeGreaterThan(0);
        expect(half, key).toBeLessThan(0.6);
      }
    }
  });

  it('is cut into the bands the fight has: the tool and the zones name the same heights', () => {
    const tool = readFileSync('tools/reviewed_look.py', 'utf8');
    expect(Number(/^LEGS_TOP = ([\d.]+)/m.exec(tool)?.[1])).toBe(ZONES.legs.top);
    expect(Number(/^TORSO_TOP = ([\d.]+)/m.exec(tool)?.[1])).toBe(ZONES.torso.top);
  });
});
