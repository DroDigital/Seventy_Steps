import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { CHUNK_CRITTERS } from '../src/data/fauna';
import { REGIONS } from '../src/data/regions';
import { birth, live } from '../src/render/critterLife';
import { setPiece } from '../src/world/arenaSet';
import { lanternMoths, nestsOf } from '../src/world/haunts';
import { lanternModelFlame } from '../src/world/lanternModels';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';
import { chunkOf } from '../src/world/worldMap';

describe('moths about the new oil lantern models', () => {
  it('selects some lit lanterns deterministically and keeps their orbit about the scaled, turned flame', () => {
    for (const of of ['lightpost', 'lantern']) {
      const p = setPiece({ of, lit: 'lamp', size: 1.4 }, 100, 200, 5, 1.2, createRng(7))!;
      let chosen = 0;
      for (let seed = 0; seed < 32; seed++) {
        p.seed = seed;
        const moths = lanternMoths(p);
        expect(lanternMoths(p)).toEqual(moths);
        if (!moths.length) continue;
        chosen++;
        expect(moths.length).toBeGreaterThanOrEqual(2);
        expect(moths.length).toBeLessThanOrEqual(3);
        const flame = lanternModelFlame(p)!;
        for (const nest of moths) {
          expect(nest).toMatchObject({ critter: 'moth', ...flame });
          const l = birth(nest);
          let moved = 0;
          for (let i = 1; i <= 300; i++) {
            live(l, 1 / 60, i / 60, flame, 0);
            const d = Math.hypot(l.x - flame.x, l.z - flame.z);
            moved = Math.max(moved, d);
            expect(d).toBeLessThan(0.7);
            expect(Math.abs(l.y - flame.y)).toBeLessThan(0.31);
          }
          expect(moved).toBeGreaterThan(0.3);
        }
      }
      expect(chosen).toBeGreaterThan(0);
      expect(chosen).toBeLessThan(32);
      expect(lanternMoths({ ...p, set: { ...p.set!, lit: undefined } })).toEqual([]);
      expect(lanternMoths({ ...p, set: { ...p.set!, id: 'candles' } })).toEqual([]);
    }
  });

  it('includes approach and arena lanterns in the streamed nests, including the otherwise silent Yuggoth', () => {
    const yuggoth = REGIONS.find((r) => r.id === 'yuggoth')!;
    const approaches = [...regionPlan(yuggoth).props.values()].flat().filter((p) => lanternMoths(p).length);
    const arenas = worldLayout().arenas.filter((a) => a.region === yuggoth.id).flatMap((a) => a.decor).filter((p) => lanternMoths(p).length);
    for (const group of [approaches, arenas]) {
      expect(group.length).toBeGreaterThan(0);
      let present = 0;
      for (const p of group) {
        const nests = nestsOf(chunkOf(p.x), chunkOf(p.z));
        expect(nests.length).toBeLessThanOrEqual(CHUNK_CRITTERS);
        for (const expected of lanternMoths(p)) if (nests.some((n) => n.seed === expected.seed && n.x === expected.x && n.y === expected.y && n.z === expected.z)) present++;
      }
      expect(present).toBeGreaterThan(0);
    }
  });
});
