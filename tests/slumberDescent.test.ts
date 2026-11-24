/**
 * The Stairs of Slumber's descent (round 105): no curtain in the arch between two flights over the void, the descent's share of the
 * depth, the mist's gain (round 120: thick from the head, climbing fast), and the stairs' lights: dimmed by their depth (round 120),
 * and gutter rarely, more as the mind fails.
 */

import { describe, expect, it } from 'vitest';
import { SLUMBER } from '../src/data/tuning';
import { markStairLights, stairDim, stairFlame, stairGutter, stairWaver } from '../src/render/stairLights';
import type { LightSpot } from '../src/render/worldLights';
import { isAbyss } from '../src/world/abyssStair';
import { descentAt, descentGain, descentRise, descentSpan } from '../src/world/descent';
import { gatePlan } from '../src/world/gatePlan';
import { worldLayout } from '../src/world/placements';
import { roomAt, type RoomLayout } from '../src/world/dungeonKit';
import { newelFires } from '../src/render/stairNewels';
import { dungeonJob } from '../src/render/siteMeshes';

const slumber = () => {
  const L = worldLayout().dungeons.map((d) => d.layout).find((l) => l.def.id === 'slumber');
  if (!L) throw new Error('no Stairs of Slumber in the world');
  return L;
};
const floorOf = (r: RoomLayout): number => Math.min(r.level, r.level + (r.def.kind === 'stair' ? r.rise : 0));

describe('the curtain', () => {
  it('hangs no door in an arch between two flights over the void', () => {
    const arches = slumber().doors.filter((d) => isAbyss(d.a) && isAbyss(d.b));
    expect(arches.length).toBeGreaterThan(0);
    const doors = gatePlan(worldLayout()).doors;
    for (const a of arches) expect(doors.some((o) => Math.abs(o.x - a.x) < 0.01 && Math.abs(o.z - a.z) < 0.01)).toBe(false);
  });
});

describe('the descent', () => {
  it('is 0 at the head of the stairs and 1 on the deepest floor', () => {
    const L = slumber();
    const { top, bottom } = descentSpan(L);
    expect(top).toBeGreaterThan(bottom);
    const head = L.rooms.find((r) => r.def.id === 'threshold')!;
    expect(descentAt(head.x, top, head.z)).toBe(0);
    const deepest = L.rooms.reduce((a, b) => (floorOf(b) < floorOf(a) ? b : a));
    expect(descentAt(deepest.x, bottom, deepest.z)).toBeCloseTo(1, 6);
  });

  it('is none out of the stairs', () => {
    expect(descentAt(1e6, -500, 1e6)).toBeNull();
  });

  it('thickens the mist from the head of the stairs, climbing fast toward SLUMBER.mist.max, and leaves it alone off them (round 120)', () => {
    expect(descentGain(null)).toBe(1);
    expect(descentGain(undefined)).toBe(1);
    expect(descentGain(0)).toBe(SLUMBER.mist.head);
    expect(SLUMBER.mist.head).toBeGreaterThan(1.5); // thick from the first step: asked, "increasing fog density early in the descent"
    expect(descentGain(1)).toBeCloseTo(SLUMBER.mist.max, 9);
    const gains = Array.from({ length: 11 }, (_, i) => descentGain(i / 10));
    gains.slice(1).forEach((g, i) => expect(g).toBeGreaterThan(gains[i]));
    expect(descentRise(1 / 3)).toBeGreaterThan(0.6); // most of the climb in the first third
    expect(gains[1] - gains[0]).toBeGreaterThan(3 * (gains[10] - gains[9])); // it intensifies fast at first, and the last steps add little
  });
});

describe("the stairs' lights", () => {
  it('dims a light on the stairs by its depth, every step down darker, and leaves the rest (round 120)', () => {
    const at = (stairs?: number): LightSpot => ({ x: 0, y: 0, z: 0, kind: 'torch', ...(stairs !== undefined && { stairs }) });
    expect(stairDim(at())).toBe(1);
    expect(stairDim(at(0))).toBeCloseTo(SLUMBER.light.top, 9);
    expect(stairDim(at(1))).toBeCloseTo(SLUMBER.light.bottom, 9);
    const dims = Array.from({ length: 11 }, (_, i) => stairDim(at(i / 10)));
    dims.slice(1).forEach((d, i) => expect(d).toBeLessThan(dims[i]));
    expect(SLUMBER.light.bottom / SLUMBER.light.top).toBeLessThan(0.25); // the deepest torches burn at a quarter of the first ones' light, or less
    expect(stairFlame(at())).toBe(1);
    expect(stairFlame(at(1))).toBeCloseTo(1 - SLUMBER.light.shrink, 9);
    expect(stairFlame(at(0.6))).toBeLessThan(stairFlame(at(0.1)));
  });

  it('marks only the lights of the descent, below the head', () => {
    const L = slumber();
    const { top } = descentSpan(L);
    const lights: LightSpot[] = [
      { x: 0, y: top + 2, z: 0, kind: 'torch' },
      { x: 0, y: top - 3, z: 0, kind: 'torch' },
    ];
    markStairLights(L, lights);
    expect(lights[0].stairs).toBeUndefined();
    expect(lights[1].stairs).toBeGreaterThan(0);
    expect(lights[1].stairs).toBeLessThan(0.2);
    const { bottom } = descentSpan(L);
    const deep: LightSpot[] = [{ x: 0, y: bottom + 1.95, z: 0, kind: 'torch' }];
    markStairLights(L, deep);
    expect(deep[0].stairs).toBeCloseTo(1, 1); // a torch on the deepest floor stands at the whole of the descent
  });

  it('gutters rarely when the mind is calm, more often as it fails, and never a light beyond its share', () => {
    const windowsWithDip = (seed: number, madness: number): number => {
      const W = SLUMBER.flicker.window;
      let windows = 0;
      for (let w = 0; w < 200; w++) {
        let dipped = false;
        for (let k = 0; k < 240 && !dipped; k++) dipped = stairGutter(seed, w * W + (k / 240) * W, madness) < 1;
        if (dipped) windows++;
      }
      return windows;
    };
    const calm = windowsWithDip(0.05, 0);
    const failing = windowsWithDip(0.05, 1);
    expect(failing).toBeGreaterThan(calm);
    expect(calm).toBeLessThan(200 * 0.25);
    expect(windowsWithDip(0.9, 1)).toBe(0);
  });

  it('dims a gutter no further than its depth', () => {
    for (let t = 0; t < 600; t += 0.01) {
      const g = stairGutter(0.05, t, 1);
      expect(g).toBeGreaterThanOrEqual(1 - SLUMBER.flicker.depth - 1e-9);
      expect(g).toBeLessThanOrEqual(1);
    }
  });

  it("wavers steadily between its gutters", () => {
    const lamp: LightSpot = { x: 3, y: 1, z: -2, kind: 'torch', stairs: 0.5 };
    for (let t = 0; t < 30; t += 0.1) expect(Number.isFinite(stairWaver(lamp, 0.1, t, 0.5))).toBe(true);
  });

  it("marks the decorative lights of the descent too: the braziers of its cavern and gate are dimmed as the stairs are", () => {
    const d = worldLayout().dungeons.find((x) => x.layout.def.id === 'slumber');
    if (!d) throw new Error('no Stairs of Slumber in the world');
    let lights: LightSpot[] = [];
    const job = dungeonJob(d, (_meshes, out) => {
      lights = out;
    });
    let step = job.next();
    while (!step.done) step = job.next();
    const { top } = descentSpan(d.layout);
    const below = lights.filter((l) => l.y < top + 1);
    expect(below.length).toBeGreaterThan(0);
    expect(below.every((l) => typeof l.stairs === 'number')).toBe(true);
    expect(lights.filter((l) => l.y >= top + 1).some((l) => l.stairs !== undefined)).toBe(false);
  });
});

describe("the stairs' fires (round 120: fewer torches, and the deeper the fewer)", () => {
  it('burns few of its newels: both pylons and a middle newel on the seventy steps, one pylon a flight below them, one on every other flight in the depths', () => {
    expect(newelFires(0, 0)).toMatchObject({ middle: true, pylons: 2 });
    expect(newelFires(0.3, 3)).toMatchObject({ middle: false, pylons: 1 });
    expect(newelFires(0.8, 4).pylons + newelFires(0.8, 5).pylons).toBe(1);
  });

  it('hangs no wall torch over the void, and lights the whole descent with a third of the lights it had', () => {
    const d = worldLayout().dungeons.find((x) => x.layout.def.id === 'slumber');
    if (!d) throw new Error('no Stairs of Slumber in the world');
    let lights: LightSpot[] = [];
    const job = dungeonJob(d, (_meshes, out) => {
      lights = out;
    });
    let step = job.next();
    while (!step.done) step = job.next();
    const over = (l: LightSpot) => isAbyss(roomAt(d.layout, l.x, l.z));
    expect(lights.filter((l) => l.kind === 'torch' && over(l))).toEqual([]);
    expect(lights.filter(over).length).toBeLessThanOrEqual(20); // sixteen flights: their newels' few fires (round 104 lit 108)
    expect(lights.length).toBeLessThan(182 / 2); // the whole descent, halls and all (182 before round 120)
  });
});
