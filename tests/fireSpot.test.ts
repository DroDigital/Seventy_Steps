/**
 * A fire is its pixel flame (round 87; render/fireSpot.ts, flames.ts): the code-built cones of embers, flame and core that stood beneath the
 * pixel flames (and by themselves at the candles, pylons, towers' braziers, sconces and braziers of the dungeons) are no longer built. What is
 * left is the light (and with it the halo, the hearth's sound, the smoke), set so the flame's foot rests where the cone's did.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { MODEL_INFO } from '../src/data/models';
import { REGIONS } from '../src/data/regions';
import { LIGHTS } from '../src/data/tuning';
import { fireSpot, flameSize } from '../src/render/fireSpot';
import { clearOf } from '../src/render/lightSight';
import { loadModels } from '../src/render/modelKit';
import { brazier } from '../src/render/dungeonFurniture';
import { propJob } from '../src/render/propMeshes';
import { propPieces } from '../src/render/propShapes';
import { sconce } from '../src/render/sconces';
import { setPieces } from '../src/render/setShapes';
import type { LightSpot } from '../src/render/worldLights';
import { setPiece } from '../src/world/arenaSet';
import { propColliders, type Prop } from '../src/world/props';

beforeAll(loadModels);

const base: Prop = { kind: 'firepit', x: 0, y: 0, z: 0, w: 0.7, d: 0.7, h: 0.5, yaw: 0, seed: 3 };
const set = (id: string, lit: 'fire' | 'torch' | 'lamp' | undefined, w = 1, h = 4): Prop => ({ kind: 'set', x: 0, y: 0, z: 0, w, d: w, h, yaw: 0, seed: 5, set: { id, scale: 1, ...(lit && { lit }) } });

describe('a fire is a light and its pixel flame, no cone (round 87)', () => {
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

  it('seats a flame under a light of its own height: the foot where it is asked, the light where it is said', () => {
    const spot = fireSpot('fire', [1, 2, 3], 1.5, 5);
    expect(spot.at).toEqual([1, 5, 3]);
    expect(spot.seat).toBe(-3); // the flame's foot, 3 m under the light
    expect(fireSpot('fire', [1, 2, 3], 1.5).seat).toBeUndefined(); // (by its kind's base otherwise)
  });
});

/** The light spots the world makes of a set piece, and the farthest a walker's eye is kept from seeing the fire by the piece's own colliders. */
function lights(p: Prop): { p: Prop; spots: LightSpot[]; hidden: number } {
  let spots: LightSpot[] = [];
  const job = propJob([p], REGIONS[0]!, (_m, l) => (spots = l));
  while (!job.next().done);
  const world = { colliders: propColliders(p), off: new Set<number>(), ground: () => -100, contain: () => undefined } as never;
  let hidden = 0;
  for (const s of spots) for (let a = 0; a < 8; a++) for (let d = 3; d <= 80; d++) {
    const eye = { x: Math.cos((a * Math.PI) / 4) * d, y: 1.7, z: Math.sin((a * Math.PI) / 4) * d };
    if (clearOf(world, eye, s, LIGHTS.sight.pull, LIGHTS.sight.lift) === false) hidden = Math.max(hidden, d);
  }
  return { p, spots, hidden };
}
const piece = (id: string, lit: 'fire' | 'torch'): Prop => setPiece({ of: id, size: 1, lit }, 0, 0, 0, 0.3, createRng(7))!;
const house = (id: string, w: number, h: number): Prop => ({ kind: 'set', x: 0, y: 0, z: 0, w, d: w, h, yaw: 0.3, seed: 1, set: { id, scale: 1, round: id !== 'house_tower_square', lit: 'fire' } }); // (as world/houseParts.ts stands a tower)

describe('a fire with no cone is seen from as far as the cone\'s was (round 87)', () => {
  it('a set\'s flame keeps the light where the cone\'s was and stands the pixel flame on its foot', () => {
    const { p, spots } = lights(piece('px_brazier', 'fire'));
    const [sx, sy] = [p.set!.scale ?? 1, p.set!.scale ?? 1];
    const [, ay] = MODEL_INFO.px_brazier.anchors![0]!;
    expect(spots).toHaveLength(1);
    expect(spots[0].y).toBeCloseTo(p.y - 0.15 + ay * sy + 0.3, 6); // (the cone's foot and its width: as before)
    expect(spots[0].y + spots[0].seat!).toBeCloseTo(p.y - 0.15 + ay * sy, 6); // the flame's foot in the bowl
    expect(sx).toBe(1);
  });

  it('a lit brazier model has no baked cone of flame beside its pixel flame', () => {
    const glow = setPieces(setPiece({ of: 'px_brazier', size: 1, lit: 'fire' }, 0, 0, 0, 0, createRng(1))!, [0.5, 0.5, 0.5]).filter((q) => q.mat === 'glow' && q.geo);
    expect(glow).toHaveLength(0);
  });

  it('the towers\' and the pylon\'s fires are not hidden from the ground by their own colliders any farther than the cones\' were', () => {
    // [the piece as the houses and the courts stand it, the farthest metres it was hidden from a walker's eye with its cone: measured on the code before round 87]
    const cases = [
      ['the Black Man\'s gate flank', house('house_tower_round', 2.4, 8), 28],
      ['the Reservoir\'s', house('house_tower_square', 3.64, 12), 56],
      ['the Court at the Centre\'s lane pylon', { ...piece('pylon', 'torch'), w: 1.19, d: 1.19, h: 6.3 }, 7],
    ] as const;
    for (const [name, p, was] of cases) {
      const { spots, hidden } = lights(p);
      expect(spots.length, name).toBeGreaterThan(0);
      expect(hidden, name).toBeLessThanOrEqual(was + 3);
    }
  });
});
