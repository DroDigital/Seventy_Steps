import { describe, expect, it } from 'vitest';
import { LOOKS } from '../src/data/looks';
import { INK } from '../src/data/uiMood';
import { BONE } from '../src/ui/hudKit';
import { inkDelays, inkSeed, realmTint } from '../src/ui/inkTitle';

describe('the ink of a title (round 80)', () => {
  it('begins at the middle and ends at the ends, the same each time', () => {
    const a = inkDelays(11, 5, 1.1, 0);
    expect(inkDelays(11, 5, 1.1, 0)).toEqual(a);
    expect(a[5]).toBe(0); // the middle letter
    expect(a[0]).toBeCloseTo(1.1);
    expect(a[10]).toBeCloseTo(1.1);
    for (let i = 5; i < 10; i++) expect(a[i + 1]).toBeGreaterThanOrEqual(a[i]); // monotone outward, on each side
    for (let i = 5; i > 0; i--) expect(a[i - 1]).toBeGreaterThanOrEqual(a[i]);
    expect(a[3]).toBeCloseTo(a[7]); // and alike on both sides
  });

  it('strays by the jitter and no more, and never outside the span', () => {
    const plain = inkDelays(24, 9, 1, 0);
    const loose = inkDelays(24, 9, 1, INK.jitter);
    loose.forEach((d, i) => {
      expect(Math.abs(d - plain[i])).toBeLessThanOrEqual(INK.jitter + 1e-9);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(1);
    });
    expect(inkDelays(24, 10, 1, INK.jitter)).not.toEqual(loose); // another seed, another stagger
  });

  it('sinks away from the ends in, and a one-letter word is not divided by nothing', () => {
    const out = inkDelays(9, 3, 0.8, 0, true);
    expect(out[4]).toBeCloseTo(0.8); // the middle goes last
    expect(out[0]).toBe(0);
    expect(inkDelays(1, 3, 1, 0)).toEqual([0]);
    expect(inkDelays(0, 3, 1)).toEqual([]);
  });

  it('every word has its own seed, the same each time', () => {
    expect(inkSeed('ARKHAM')).toBe(inkSeed('ARKHAM'));
    expect(inkSeed('ARKHAM')).not.toBe(inkSeed('DUNWICH'));
  });

  it('a realm\'s title is its bone turned toward its accent, and never hard to read', () => {
    const luma = (h: string): number => (0.2126 * parseInt(h.slice(1, 3), 16) + 0.7152 * parseInt(h.slice(3, 5), 16) + 0.0722 * parseInt(h.slice(5, 7), 16)) / 255;
    const seen = new Set<string>();
    for (const id of Object.keys(LOOKS)) {
      const tint = realmTint(id);
      expect(tint, id).toMatch(/^#[0-9a-f]{6}$/);
      expect(luma(tint), id).toBeGreaterThan(0.5);
      seen.add(tint);
    }
    expect(seen.size).toBeGreaterThan(Object.keys(LOOKS).length / 2); // the realms are not all one colour
    expect(realmTint('nowhere')).toBe(BONE);
    expect(realmTint(null)).toBe(BONE);
  });
});
