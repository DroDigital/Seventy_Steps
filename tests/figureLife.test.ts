/**
 * What a person has that moves of itself (round 78; render/figureSway.ts, render/gaze.ts, render/swingTrails.ts): the
 * investigator's lantern and scarf tail, a person's head following the investigator, and the track of a blow.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FIGURE_LIFE, SWING_TRAIL } from '../src/data/fxTuning';
import { applySway, newSway, stepSway, type SwayInput } from '../src/render/figureSway';
import { easeGaze, gazeAt, gazeTurn, newGaze } from '../src/render/gaze';
import { buildFigure } from '../src/render/figures';
import { edgeOf, trailAlpha } from '../src/render/swingTrails';

const still: SwayInput = { dt: 1 / 60, ax: 0, az: 0, speed: 0, yawRate: 0, stride: 0, time: 0, upright: 1 };
const run = (s = newSway(), frames: number, input: Partial<SwayInput> = {}): ReturnType<typeof newSway> => {
  for (let i = 0; i < frames; i++) stepSway(s, { ...still, time: i / 60, ...input });
  return s;
};

describe('the lantern on its strap', () => {
  it('hangs still when the body is still, and settles after a shove', () => {
    const s = run(newSway(), 60);
    expect([s.lx, s.lz]).toEqual([0, 0]);
    run(s, 4, { az: 40 }); // a start from standing
    expect(Math.abs(s.lz)).toBeGreaterThan(0.02);
    run(s, 180);
    expect(Math.abs(s.lz)).toBeLessThan(0.01);
    expect(Math.abs(s.lvz)).toBeLessThan(0.05);
  });

  it('swings back when the body starts forward, and out to the left when it turns hard to the right', () => {
    const s = run(newSway(), 8, { az: 20 });
    expect(s.lz).toBeLessThan(0); // hangs behind
    const t = run(newSway(), 8, { ax: -20 }); // (accelerating to the right)
    expect(t.lx).toBeGreaterThan(0);
  });

  it('never goes through the body nor past its most, at any shove', () => {
    const s = newSway();
    for (let i = 0; i < 600; i++) {
      stepSway(s, { ...still, ax: Math.sin(i * 0.9) * 400, az: Math.cos(i * 0.7) * 400 });
      expect(s.lx).toBeGreaterThanOrEqual(FIGURE_LIFE.lantern.inward - 1e-9);
      expect(s.lx).toBeLessThanOrEqual(FIGURE_LIFE.lantern.most + 1e-9);
      expect(Math.abs(s.lz)).toBeLessThanOrEqual(FIGURE_LIFE.lantern.most + 1e-9);
      expect(Number.isFinite(s.lx + s.lz + s.sb + s.ss)).toBe(true);
    }
  });

  it('is the same at any frame rate: a shove of a tenth of a second, a second on, ends near the same at 30 and at 144 frames a second', () => {
    const at = (fps: number): number => {
      const s = newSway();
      for (let i = 0; i < fps; i++) stepSway(s, { ...still, dt: 1 / fps, az: i / fps < 0.1 ? 8 : 0 });
      return s.lz;
    };
    expect(Math.abs(at(30) - at(144))).toBeLessThan(0.03);
  });
});

describe('the scarf\'s tail', () => {
  it('droops a little at rest and streams back with the pace, never past its most', () => {
    const rest = run(newSway(), 120);
    expect(rest.sb).toBeCloseTo(FIGURE_LIFE.scarf.droop, 2);
    const walk = run(newSway(), 120, { speed: 2 });
    const fast = run(newSway(), 120, { speed: 6 });
    expect(walk.sb).toBeGreaterThan(rest.sb);
    expect(fast.sb).toBeGreaterThan(walk.sb);
    expect(run(newSway(), 120, { speed: 50 }).sb).toBeLessThan(FIGURE_LIFE.scarf.most + FIGURE_LIFE.scarf.droop + FIGURE_LIFE.scarf.flutter + 0.1);
  });

  it('is flung to the right in a turn to the left, and comes back', () => {
    const s = run(newSway(), 60, { yawRate: 4 });
    expect(s.ss).toBeLessThan(-0.05);
    run(s, 180);
    expect(Math.abs(s.ss)).toBeLessThan(0.01);
  });

  it('is laid on the groups, and let be as the body goes over', () => {
    const f = buildFigure('player');
    expect(f.loose).toBeDefined();
    const s = run(newSway(), 90, { speed: 5, az: 10 });
    applySway(s, 1, f.loose!.lantern, f.loose!.scarf);
    expect(f.loose!.scarf.rotation.x).toBeCloseTo(s.sb, 6);
    expect(f.loose!.lantern.rotation.z).toBeCloseTo(s.lx, 6);
    applySway(s, 0, f.loose!.lantern, f.loose!.scarf);
    expect(Math.abs(f.loose!.scarf.rotation.x) + Math.abs(f.loose!.lantern.rotation.z)).toBe(0);
  });
});

describe('the lantern and the scarf on the figure', () => {
  it('are groups of their own: the flame is carried by the lantern, and the people have none', () => {
    const f = buildFigure('player');
    let up: THREE.Object3D | null = f.flame!;
    let hung = false;
    while (up) { hung ||= up === f.loose!.lantern; up = up.parent; }
    expect(hung).toBe(true);
    expect(buildFigure('npc:gilman').loose).toBeUndefined();
  });
});

describe('a head following the investigator', () => {
  it('turns toward one in front, more for one at the side, and not at all for one behind or far away', () => {
    const ahead = gazeAt(0, 0, 3, 0)!; // a figure facing +z with the investigator straight ahead
    expect(ahead.yaw).toBeCloseTo(0, 6);
    const left = gazeAt(0, 3, 3, 0)!; // to their left (+x)
    expect(left.yaw).toBeGreaterThan(0.5);
    const right = gazeAt(0, -3, 3, 0)!;
    expect(right.yaw).toBeLessThan(-0.5);
    expect(gazeAt(0, 0, -3, 0)).toBeNull(); // behind
    expect(gazeAt(0, 0, FIGURE_LIFE.gaze.range + 1, 0)).toBeNull();
    expect(gazeAt(0, 0, 0.2, 0)).toBeNull(); // too near to look at
  });

  it('turns no further than a head may, looks down at a lower face and up at a higher, and lets go in the corner of the eye', () => {
    const wide = gazeAt(0, 6, 1, 0)!;
    expect(Math.abs(wide.yaw)).toBeLessThanOrEqual(FIGURE_LIFE.gaze.turn + 1e-9);
    expect(gazeAt(0, 0, 3, -1.5)!.pitch).toBeGreaterThan(0); // below the eyes: looks down
    expect(gazeAt(0, 0, 3, 1.5)!.pitch).toBeLessThan(0);
    expect(Math.abs(gazeAt(0, 0, 1, 30)!.pitch)).toBeLessThanOrEqual(FIGURE_LIFE.gaze.pitch + 1e-9);
    expect(gazeAt(0, 5, -2.9, 0)?.weight ?? 0).toBeLessThan(gazeAt(0, 2, 3, 0)!.weight);
  });

  it('is eased in and out, and given nothing to one who is at an act', () => {
    const g = newGaze();
    const to = gazeAt(0, 3, 3, 0)!;
    for (let i = 0; i < 6; i++) easeGaze(g, to, 1, 1 / 60);
    expect(g.weight).toBeGreaterThan(0);
    expect(g.weight).toBeLessThan(to.weight); // not at once
    for (let i = 0; i < 240; i++) easeGaze(g, to, 1, 1 / 60);
    expect(g.weight).toBeCloseTo(to.weight, 2);
    expect(gazeTurn(g).yaw).toBeCloseTo(to.yaw * to.weight, 2);
    for (let i = 0; i < 600; i++) easeGaze(g, null, 1, 1 / 60);
    expect(gazeTurn(g)).toEqual({ yaw: 0, pitch: 0 });
    const busy = newGaze();
    for (let i = 0; i < 240; i++) easeGaze(busy, to, 0, 1 / 60); // an act holds the head
    expect(gazeTurn(busy).yaw).toBe(0);
  });
});

describe('the track of a blow', () => {
  it('is brightest as it is laid and gone after its life', () => {
    expect(trailAlpha(0)).toBeCloseTo(SWING_TRAIL.alpha, 6);
    expect(trailAlpha(SWING_TRAIL.life * 0.5)).toBeLessThan(trailAlpha(0));
    expect(trailAlpha(SWING_TRAIL.life)).toBe(0);
    expect(trailAlpha(-1)).toBe(0);
  });

  it('is cut from a weapon\'s own farthest point, and its base is nearer the hand', () => {
    const f = buildFigure('player');
    const cane = f.arms!.cane as THREE.Mesh;
    const { tip, base } = edgeOf(cane);
    expect(tip.length()).toBeGreaterThan(0.8); // the ferrule of the cane
    expect(base.length()).toBeLessThan(tip.length());
    expect(base.length()).toBeGreaterThan(0.1);
    expect(edgeOf(cane).tip).toBe(tip); // read once
  });
});
