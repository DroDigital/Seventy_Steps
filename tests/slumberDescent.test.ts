/**
 * The Stairs of Slumber's descent (round 105): no curtain in the arch between two flights over the void, the descent's share of the
 * depth, the mist's exponential gain, and the stairs' lights: dimmed, and gutter rarely, more as the mind fails.
 */

import { describe, expect, it } from 'vitest';
import { SLUMBER } from '../src/data/tuning';
import { markStairLights, stairDim, stairGutter, stairWaver } from '../src/render/stairLights';
import type { LightSpot } from '../src/render/worldLights';
import { isAbyss } from '../src/world/abyssStair';
import { descentAt, descentGain, descentSpan } from '../src/world/descent';
import { gatePlan } from '../src/world/gatePlan';
import { worldLayout } from '../src/world/placements';
import type { RoomLayout } from '../src/world/dungeonKit';

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

  it('is 0 out of the stairs', () => {
    expect(descentAt(1e6, -500, 1e6)).toBe(0);
  });

  it('thickens the mist exponentially, from 1 at the head to SLUMBER.mist.max at the bottom', () => {
    expect(descentGain(0)).toBe(1);
    expect(descentGain(1)).toBeCloseTo(SLUMBER.mist.max, 9);
    const gains = Array.from({ length: 11 }, (_, i) => descentGain(i / 10));
    gains.slice(1).forEach((g, i) => expect(g).toBeGreaterThan(gains[i]));
    expect(descentGain(0.5)).toBeLessThan(1 + (SLUMBER.mist.max - 1) / 2); // convex: it lags the straight line
    const early = (gains[2] - gains[1]) / (gains[1] - gains[0]);
    const late = (gains[10] - gains[9]) / (gains[9] - gains[8]);
    expect(late).toBeGreaterThan(early); // each step down adds more than the last
  });
});

describe("the stairs' lights", () => {
  it('dims a light on the stairs and leaves the rest', () => {
    expect(stairDim({ x: 0, y: 0, z: 0, kind: 'torch', stairs: true })).toBe(SLUMBER.light.dim);
    expect(stairDim({ x: 0, y: 0, z: 0, kind: 'torch' })).toBe(1);
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
    expect(lights[1].stairs).toBe(true);
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
    const lamp: LightSpot = { x: 3, y: 1, z: -2, kind: 'torch', stairs: true };
    for (let t = 0; t < 30; t += 0.1) expect(Number.isFinite(stairWaver(lamp, 0.1, t, 0.5))).toBe(true);
  });
});
