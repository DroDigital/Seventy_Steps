import { describe, expect, it } from 'vitest';
import { WORLD } from '../src/data/tuning';
import { BLEND, edgeShare, neighbourOf } from '../src/world/regionBlend';
import { regionOfChunk } from '../src/world/worldMap';

/** Every place two regions' chunks meet side by side, with the chunk each side of it. */
function borders(): { a: [number, number]; b: [number, number]; vertical: boolean }[] {
  const out: { a: [number, number]; b: [number, number]; vertical: boolean }[] = [];
  for (let cx = -12; cx < 24; cx++) {
    for (let cz = -4; cz < 16; cz++) {
      const a = regionOfChunk(cx, cz);
      for (const [dx, dz] of [[1, 0], [0, 1]] as const) {
        const b = regionOfChunk(cx + dx, cz + dz);
        if (a && b && a.id !== b.id) out.push({ a: [cx, cz], b: [cx + dx, cz + dz], vertical: dx === 1 });
      }
    }
  }
  return out;
}

describe('where two regions meet, their grounds meet in a band (round 55)', () => {
  const all = borders();

  it('has borders to blend', () => {
    expect(all.length).toBeGreaterThan(5);
  });

  it('gives each side of a border the same share of the same ground at the border: no step is left there', () => {
    let checked = 0;
    for (const { a, b, vertical } of all) {
      const [ra, rb] = [regionOfChunk(...a)!, regionOfChunk(...b)!];
      const [na, nb] = [neighbourOf(...a), neighbourOf(...b)];
      if (na?.region.id !== rb.id || nb?.region.id !== ra.id) continue; // (a corner: the chunk blends toward the one beside it most)
      const line = vertical ? (a[0] + 1) * WORLD.chunk : (a[1] + 1) * WORLD.chunk;
      for (const along of [0.15, 0.5, 0.85]) {
        const s = (vertical ? a[1] : a[0]) * WORLD.chunk + along * WORLD.chunk;
        for (const swell of [-1, -0.3, 0, 0.6, 1]) {
          const eps = 0.01;
          const [xa, za] = vertical ? [line - eps, s] : [s, line - eps];
          const [xb, zb] = vertical ? [line + eps, s] : [s, line + eps];
          const ofA = 1 - edgeShare(ra, na, xa, za, swell); // the share of A's ground on A's side...
          const ofB = edgeShare(rb, nb, xb, zb, swell); // ...and on B's, where it is the neighbour's
          expect(Math.abs(ofA - ofB), `${ra.id}|${rb.id} swell ${swell}`).toBeLessThan(0.02);
        }
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('is the region\'s own ground alone beyond the band, and the other\'s share falls toward it from the border', () => {
    for (const { a, b, vertical } of all.slice(0, 40)) {
      const [ra, na] = [regionOfChunk(...a)!, neighbourOf(...a)];
      if (!na || na.region.id !== regionOfChunk(...b)!.id) continue;
      const line = vertical ? (a[0] + 1) * WORLD.chunk : (a[1] + 1) * WORLD.chunk;
      const mid = (vertical ? a[1] : a[0]) * WORLD.chunk + WORLD.chunk / 2;
      const at = (back: number): number => {
        const [x, z] = vertical ? [line - back, mid] : [mid, line - back];
        return edgeShare(ra, na, x, z, 0);
      };
      expect(at(BLEND.band + BLEND.swell + 1)).toBe(0);
      expect(at(0.01)).toBeCloseTo(0.5, 1);
      let last = at(0.01);
      for (let back = 2; back <= BLEND.band; back += 2) {
        const now = at(back);
        expect(now).toBeLessThanOrEqual(last + 1e-9);
        last = now;
      }
    }
  });
});
