import { describe, expect, it } from 'vitest';
import { colliderGap, type Collider } from '../src/world/colliders';

/** Round 72: how near a point is to a collider's edge (what a candle before a ring keeps clear of: the pylon of the Colossus is two towers 85 m apart, no circle fits it). */
describe('the gap between a point and a collider', () => {
  it('is the distance to a cylinder\'s side, and nothing within it', () => {
    const c: Collider = { kind: 'cylinder', x: 10, z: 0, radius: 2, y0: 0, y1: 3 };
    expect(colliderGap(c, 15, 0)).toBeCloseTo(3);
    expect(colliderGap(c, 10, 1)).toBe(0);
  });

  it('is the distance to a box\'s nearest edge or corner', () => {
    const c: Collider = { kind: 'box', min: { x: 0, y: 0, z: 0 }, max: { x: 4, y: 3, z: 2 } };
    expect(colliderGap(c, 7, 1)).toBeCloseTo(3);
    expect(colliderGap(c, 7, 6)).toBeCloseTo(5);
    expect(colliderGap(c, 2, 1)).toBe(0);
  });

  it('is measured in an oriented box\'s own frame', () => {
    const c: Collider = { kind: 'obox', x: 0, z: 0, hx: 4, hz: 1, yaw: Math.PI / 2, y0: 0, y1: 3 };
    expect(colliderGap(c, 0, 7)).toBeCloseTo(3); // turned a quarter, its long side runs along z
    expect(colliderGap(c, 3, 0)).toBeCloseTo(2);
    expect(colliderGap(c, 0, 2)).toBe(0);
  });

  it('is the real distance from the towers of the Colossus\'s pylon, not that from a circle about the piece', () => {
    const towers: Collider[] = [-18.9, 18.9].map((x) => ({ kind: 'obox', x, z: 0, hx: 14.05, hz: 4.7, yaw: 0, y0: 0, y1: 30 }));
    expect(Math.min(...towers.map((c) => colliderGap(c, 0, -7.5)))).toBeCloseTo(Math.hypot(4.85, 2.8));
    expect(Math.min(...towers.map((c) => colliderGap(c, 0, 0)))).toBeCloseTo(4.85); // the gate between them
  });
});
