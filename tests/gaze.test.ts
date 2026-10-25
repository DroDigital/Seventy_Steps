import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createTurn, halfWidth, inView, newGaze, offsetTo, outOfView, readGaze, wrap } from '../src/render/gaze';

const camera = (yaw: number, fov = 60, aspect = 16 / 9): THREE.PerspectiveCamera => {
  const c = new THREE.PerspectiveCamera(fov, aspect);
  c.position.set(10, 1.6, 20);
  c.rotation.set(0, yaw + Math.PI, 0); // yaw 0 faces +z: a three camera looks down -z, so it is turned about
  c.updateMatrixWorld(true);
  return c;
};

describe('gaze: where the lens looks', () => {
  it('reads the heading (yaw 0 faces +z), the position and the width of the picture', () => {
    for (const yaw of [0, 0.7, -2.1, 3]) {
      const g = readGaze(camera(yaw), newGaze());
      expect(wrap(g.look - yaw)).toBeCloseTo(0, 6);
      expect([g.x, g.y, g.z]).toEqual([10, 1.6, 20]);
      expect(g.half).toBeCloseTo(halfWidth(60, 16 / 9), 9);
    }
    expect(halfWidth(60, 1)).toBeCloseTo(Math.PI / 6, 9);
    expect(halfWidth(60, 16 / 9)).toBeGreaterThan(Math.PI / 6);
  });

  it('puts a place ahead at 0, to the side by its bearing, and behind at about ±π', () => {
    const g = readGaze(camera(0), newGaze());
    expect(offsetTo(g, 10, 40)).toBeCloseTo(0, 9);
    expect(Math.abs(offsetTo(g, 30, 20))).toBeCloseTo(Math.PI / 2, 6);
    expect(Math.abs(offsetTo(g, 10, 0))).toBeCloseTo(Math.PI, 6);
    expect(offsetTo(g, 30, 20)).toBeGreaterThan(0); // (toward +x, which is toward the bearing's increase)
  });

  it('is in view inside the edge of the picture, with a margin, and out beyond it', () => {
    const g = readGaze(camera(0, 60, 1), newGaze());
    const at = (a: number): [number, number] => [10 + Math.sin(a) * 30, 20 + Math.cos(a) * 30];
    expect(inView(g, ...at(0.3))).toBe(true);
    expect(inView(g, ...at(0.6))).toBe(false); // the half-width is π/6 = 0.52
    expect(inView(g, ...at(0.45), 0.1)).toBe(false);
    expect(outOfView(g, ...at(0.6))).toBe(true);
    expect(outOfView(g, ...at(0.6), 0.2)).toBe(false);
    expect(outOfView(g, ...at(0.8), 0.2)).toBe(true);
  });
});

describe('gaze: how fast the lens turns', () => {
  it('reads a steady swing, signed, and a still lens as none', () => {
    const t = createTurn();
    let rate = 0;
    for (let i = 0; i <= 60; i++) rate = t.update(0.04 * i, i / 30); // 1.2 rad/s
    expect(rate).toBeGreaterThan(1.0);
    expect(rate).toBeLessThan(1.3);
    for (let i = 0; i <= 60; i++) rate = t.update(10, 3 + i / 30);
    expect(Math.abs(rate)).toBeLessThan(0.05);
    const back = createTurn();
    for (let i = 0; i <= 30; i++) rate = back.update(-0.04 * i, i / 30);
    expect(rate).toBeLessThan(-0.9);
  });

  it('wraps across ±π and takes a long gap, or the same frame twice, for no swing', () => {
    const t = createTurn();
    t.update(3.1, 0);
    expect(t.update(-3.1, 1 / 30)).toBeGreaterThan(0); // across the seam it is a small turn the same way
    const gap = createTurn();
    gap.update(0, 0);
    expect(gap.update(2, 5)).toBe(0); // a menu, a cutscene, a journey
    const same = createTurn();
    same.update(0, 1);
    expect(same.update(1, 1)).toBe(0);
  });
});
