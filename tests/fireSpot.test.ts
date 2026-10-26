/**
 * A fire is its pixel flame (round 84; render/fireSpot.ts, flames.ts): the code-built cones of embers, flame and core that stood beneath the
 * pixel flames (and by themselves at the candles, pylons, towers' braziers, sconces and braziers of the dungeons) are no longer built. What is
 * left is the light (and with it the halo, the hearth's sound, the smoke), set so the flame's foot rests where the cone's did.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { LIGHTS } from '../src/data/tuning';
import { fireSpot, flameSize } from '../src/render/fireSpot';
import { loadModels } from '../src/render/modelKit';
import { brazier } from '../src/render/dungeonFurniture';
import { propPieces } from '../src/render/propShapes';
import { sconce } from '../src/render/sconces';
import { setPieces } from '../src/render/setShapes';
import type { Prop } from '../src/world/props';

beforeAll(loadModels);

const base: Prop = { kind: 'firepit', x: 0, y: 0, z: 0, w: 0.7, d: 0.7, h: 0.5, yaw: 0, seed: 3 };
const set = (id: string, lit: 'fire' | 'torch' | 'lamp' | undefined, w = 1, h = 4): Prop => ({ kind: 'set', x: 0, y: 0, z: 0, w, d: w, h, yaw: 0, seed: 5, set: { id, scale: 1, ...(lit && { lit }) } });

describe('a fire is a light and its pixel flame, no cone (round 84)', () => {
  it('seats the flame\'s foot where it is asked: the light stands its kind\'s base above it, scaled by the size', () => {
    for (const kind of ['fire', 'torch', 'lamp'] as const) {
      const f = LIGHTS.flames[kind]!;
      const one = fireSpot(kind, [1, 2, 3]);
      expect(one.at).toEqual([1, 2 - f.base, 3]);
      expect(one.flame).toBe(1);
      expect(fireSpot(kind, [0, 1, 0], 2).at[1]).toBeCloseTo(1 - f.base * 2, 9);
      expect(one.light).toBe(kind);
    }
    expect(fireSpot('window', [0, 1, 0]).at).toEqual([0, 1, 0]); // (no flame to seat for a kind that has none)
  });

  it('reads a set\'s flame width as a size between half and twice its kind\'s', () => {
    expect(flameSize()).toBe(1);
    expect(flameSize(0.45)).toBeCloseTo(1.5, 9);
    expect(flameSize(0.01)).toBe(0.5);
    expect(flameSize(9)).toBe(2);
  });

  it('a firepit keeps its stones and logs and has one light, and no glowing geometry', () => {
    const pieces = propPieces(base, [0.5, 0.5, 0.5]);
    expect(pieces.filter((p) => p.mat === 'glow' && p.geo)).toHaveLength(0);
    expect(pieces.filter((p) => p.mat === 'stone' && p.geo)).toHaveLength(1);
    expect(pieces.filter((p) => p.mat === 'wood' && p.geo)).toHaveLength(1);
    const lights = pieces.filter((p) => p.light);
    expect(lights).toHaveLength(1);
    expect(lights[0]).toMatchObject({ light: 'fire', at: [0, 0.6, 0] });
  });

  it('a sconce is iron and a light; a brazier iron and the place of its fire', () => {
    const s = sconce({ x: 10, z: 20, across: 1, alongX: true, floor: 3 }, 1);
    expect(Object.keys(s).sort()).toEqual(['iron', 'light']);
    expect(s.iron.getAttribute('position').count).toBeGreaterThan(0);
    expect(s.light.kind).toBe('torch');
    const b = brazier(4, 5, 2);
    expect(Object.keys(b).sort()).toEqual(['at', 'iron']);
    expect(b.iron.length).toBeGreaterThan(0);
    expect(b.at).toEqual({ x: 4, y: 3.7, z: 5 });
  });

  it('a pylon\'s fire and a lit tower\'s brazier are a light and no flame built; an unlit tower has none', () => {
    expect(setPieces(set('pylon', undefined, 1.6, 5), [1, 1, 1]).filter((p) => p.light)).toHaveLength(1); // (a pylon always burns)
    for (const [id, lit, w, h] of [['pylon', 'fire', 1.6, 5], ['house_tower_round', 'fire', 3, 9], ['house_tower_square', 'torch', 3, 9]] as const) {
      const pieces = setPieces(set(id, lit, w, h), [1, 1, 1]);
      const fires = pieces.filter((p) => p.light);
      expect(fires.length, id).toBeGreaterThan(0);
      for (const f of fires) {
        expect(f.geo, id).toBeUndefined();
        expect(f.at, id).toBeDefined();
        expect(f.flame, id).toBeGreaterThanOrEqual(0.5);
        expect(f.flame, id).toBeLessThanOrEqual(2);
      }
      if (id !== 'pylon') expect(setPieces(set(id, undefined, w, h), [1, 1, 1]).filter((p) => p.light), `${id} unlit`).toHaveLength(0);
    }
  });
});
