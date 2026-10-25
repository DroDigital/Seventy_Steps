/**
 * What a person has that moves of itself (round 83; render/figureSway.ts, render/figureGaze.ts, render/swingTrails.ts): the
 * investigator's lantern and scarf tail, a person's head following the investigator, and the track of a blow.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FIGURE_LIFE, SWING_TRAIL } from '../src/data/fxTuning';
import { easeGaze, gazeAt, gazeTurn, newGaze } from '../src/render/figureGaze';
import { buildFigure } from '../src/render/figures';
import { edgeOf, trailAlpha } from '../src/render/swingTrails';

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
