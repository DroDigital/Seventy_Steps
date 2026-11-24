/**
 * Every thing on a hall's wall, in every way it can be built, stays on its own stretch of the wall and within reach of it (moved
 * out of dungeonProps.test.ts on 2026-11-24: every kind, on both walls, from twenty-four seeds, some twelve seconds, so it runs
 * with the audits, `npm run audit`, and in CI).
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { DEPTH, place, type Out } from '../src/render/dungeonFurniture';
import { KIT_ITEMS, type KitItem } from '../src/render/kitItems';
import { LORE_ITEMS, type LoreItem } from '../src/render/loreItems';

const C: [number, number, number] = [0.6, 0.6, 0.58];
const each = (out: Out): THREE.BufferGeometry[] => Object.values(out).flat();
const points = (g: THREE.BufferGeometry): THREE.Vector3[] => {
  const pos = g.getAttribute('position');
  return Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
};

/** A wall along x, its face at z = 0, the room toward +z, or turned the other way round. */
const walls = [{ at: (s: number, d: number) => ({ x: s, z: d }), alongX: true }, { at: (s: number, d: number) => ({ x: -d, z: -s }), alongX: false }];

describe('the things on a hall\'s wall, every way (an audit)', () => {
  it('builds every thing on a hall\'s wall, in every way it can be, on its own stretch of the wall and within reach of it', () => {
    const kinds = [...Object.keys(KIT_ITEMS), ...Object.keys(LORE_ITEMS)] as (KitItem | LoreItem)[];
    for (const item of kinds) for (const [w, wall] of walls.entries()) for (let seed = 1; seed <= 24; seed++) {
      const out: Out = { wall: [], wood: [], beam: [], trim: [], glow: [], shine: [] };
      place(item, { wall, s: 0, y: 0, c: C, rng: createRng(seed * 7919 + w), out });
      const geos = each(out);
      expect(geos.length, item).toBeGreaterThan(0);
      for (const g of geos) {
        expect(g.getAttribute('color'), `${item} colour`).toBeDefined();
        for (const p of points(g)) {
          expect(Number.isFinite(p.x + p.y + p.z), item).toBe(true);
          const [s, d] = w ? [-p.z, -p.x] : [p.x, p.z];
          expect(d, `${item} seed ${seed}: off the wall`).toBeLessThan(DEPTH + 0.06);
          expect(d, `${item} seed ${seed}: into the wall`).toBeGreaterThan(-0.02);
          expect(p.y, `${item} seed ${seed}: under the floor`).toBeGreaterThan(-0.3); // (stones and a leaning block are sunk a little in it, as the halls' test allows)
          if (item in KIT_ITEMS) expect(Math.abs(s), `${item} seed ${seed}: along the wall`).toBeLessThan(1.45);
        }
      }
    }
  });
});
