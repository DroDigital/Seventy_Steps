import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createParticles, PARTICLE_SHAPES } from '../src/render/particles';

function rig() {
  const scene = new THREE.Scene();
  const fx = createParticles(scene);
  const batch = scene.children[0] as THREE.InstancedMesh;
  const attr = (name: string): THREE.BufferAttribute => batch.geometry.getAttribute(name) as THREE.BufferAttribute;
  const camera = new THREE.PerspectiveCamera();
  return { fx, batch, attr, camera };
}
const base = { x: 0, y: 1, z: 0, life: 1, size: 1, color: [1, 0.5, 0.25] as const };

describe('particles v2 (round 51)', () => {
  it('draws each shape, spins, and lets a streak lie along its flight', () => {
    const { fx, batch, attr, camera } = rig();
    PARTICLE_SHAPES.forEach((shape, i) => fx.spawn({ ...base, x: i, shape, spin: 2, rot: 0.5, vx: shape === 'streak' ? 10 : 0 }));
    fx.update(0, camera);
    fx.update(0.5, camera); // clamped to 0.1 s per frame: a long gap does not fling them
    expect(batch.count).toBe(PARTICLE_SHAPES.length);
    const shapes = attr('aShape');
    PARTICLE_SHAPES.forEach((_, i) => expect(shapes.getX(i)).toBe(i));
    expect(shapes.getY(0)).toBeCloseTo(0.5 + 2 * 0.1, 5); // spin × age
    expect(shapes.getZ(2)).toBeGreaterThan(1.5); // the streak is stretched by its speed...
    expect(shapes.getZ(0)).toBe(1); // ...and nothing else is
  });

  it('shifts colour over a life, holds its alpha first, then fades to nothing and is gone', () => {
    const { fx, batch, attr, camera } = rig();
    fx.spawn({ ...base, life: 1, colorEnd: [0, 0, 0], hold: 0.5, alpha: 0.8 });
    const colors = attr('aColor');
    let t = 0;
    const step = (to: number): void => { while (t < to - 1e-9) fx.update((t = Math.min(to, t + 0.05)), camera); };
    step(0);
    fx.update(0.01, camera);
    expect(colors.getW(0)).toBeCloseTo(0.8, 5);
    step(0.4);
    expect(colors.getW(0)).toBeCloseTo(0.8, 5); // held
    expect(colors.getX(0)).toBeCloseTo(0.6, 1); // 40% of the way to black
    step(0.75);
    expect(colors.getW(0)).toBeCloseTo(0.8 * 0.5, 1); // half faded
    step(1.1);
    expect(batch.count).toBe(0);
  });

  it('is pulled down by gravity and up by a negative one, and slowed by drag', () => {
    const { fx, batch, camera } = rig();
    fx.spawn({ ...base, gravity: 10 });
    fx.spawn({ ...base, x: 5, gravity: -10 });
    fx.spawn({ ...base, x: 9, vx: 8, drag: 3 });
    fx.update(0, camera);
    for (let i = 1; i <= 5; i++) fx.update(i * 0.05, camera);
    const m = batch.instanceMatrix.array;
    expect(m[13]!).toBeLessThan(1);
    expect(m[16 + 13]!).toBeGreaterThan(1);
    expect(m[32 + 12]! - 9).toBeLessThan(8 * 0.25); // drag held it short of the free flight
  });

  it('keeps to its capacity, dropping the oldest', () => {
    const { fx, batch, camera } = rig();
    for (let i = 0; i < 2600; i++) fx.spawn({ ...base, x: i, life: 5 });
    fx.update(0, camera);
    fx.update(0.01, camera);
    expect(batch.count).toBe(2400);
    expect(batch.instanceMatrix.array[12]!).toBeGreaterThanOrEqual(200); // the first 200 are gone
  });
});
