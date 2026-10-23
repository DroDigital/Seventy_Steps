import { describe, expect, it } from 'vitest';
import type { MarkLook } from '../src/data/moves';
import { ELEMENTS } from '../src/render/fxKit';
import { lookOf } from '../src/render/attackLook';
import { CLOUDS, MATTER, matterLook } from '../src/render/matterLook';
import { upAt, lifespan } from '../src/render/strikeTentacles';
import { wallGeometry } from '../src/render/surgeView';

const LOOKS: readonly MarkLook[] = ['tentacle', 'star', 'flame', 'bolt'];

describe('the matter of the new attacks (round 70)', () => {
  it('names an element, a colour and a recorded sound for every look of marked ground', () => {
    for (const k of LOOKS) {
      expect(ELEMENTS[MATTER[k].motif], k).toBeDefined();
      expect(MATTER[k].sound, k).toBeTruthy();
      expect(MATTER[k].gain, k).toBeGreaterThan(0);
    }
  });

  it('keeps a horror\'s own colours for a tentacle, and gives flame, stars and lightning their own whoever strikes', () => {
    const cthulhu = lookOf('cthulhu');
    const hastur = lookOf('hastur');
    expect(matterLook(cthulhu, 'tentacle').danger).toEqual(cthulhu.danger);
    expect(matterLook(cthulhu, undefined)).toBe(cthulhu);
    for (const k of ['star', 'flame', 'bolt'] as const) expect(matterLook(cthulhu, k).danger, k).toEqual(matterLook(hastur, k).danger);
    expect(matterLook(cthulhu, 'flame').danger[0]).toBeGreaterThan(matterLook(cthulhu, 'flame').danger[2]); // orange, not blue
    expect(matterLook(cthulhu, 'flame').motif).toBe('flame');
  });

  it('gives the two clouds colours of their own', () => {
    expect(CLOUDS.toxic.billow[0][1]).toBeGreaterThan(CLOUDS.toxic.billow[0][2]); // bile
    expect(CLOUDS.dream.billow[0][2]).toBeGreaterThan(CLOUDS.dream.billow[0][1]); // violet
  });

  it('draws a wave as a whole wall: finite, a ragged crest, one unit tall', () => {
    const geo = wallGeometry();
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count * 3; i++) expect(Number.isFinite(pos.array[i])).toBe(true);
    geo.computeBoundingBox();
    expect(geo.boundingBox!.min.x).toBeCloseTo(-1);
    expect(geo.boundingBox!.max.x).toBeCloseTo(1);
    expect(geo.boundingBox!.max.y).toBeGreaterThan(0.9);
    expect(geo.boundingBox!.max.y).toBeLessThanOrEqual(1.05);
    expect(new Set(Array.from({ length: pos.count }, (_, i) => pos.getY(i).toFixed(3))).size).toBeGreaterThan(8);
    expect(geo.getAttribute('color').count).toBe(pos.count);
  });

  it('brings a tentacle up fast, holds it, and takes it down', () => {
    expect(upAt(-1)).toBe(0);
    expect(upAt(0.1)).toBeGreaterThan(0.2);
    expect(upAt(0.3)).toBe(1);
    expect(upAt(lifespan - 0.05)).toBeLessThan(0.1);
    expect(upAt(lifespan + 1)).toBe(0);
  });
});
