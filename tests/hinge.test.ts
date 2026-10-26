import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { bendOf, bendTo } from '../src/render/hinge';

const turn = (axis: 'x' | 'y' | 'z', angle: number): THREE.Quaternion => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(+(axis === 'x'), +(axis === 'y'), +(axis === 'z')), angle);

describe('a joint’s bend about x, read from its quaternion (render/hinge.ts)', () => {
  it('reads a bend past a right angle as the bend, though its Euler angles read folded', () => {
    for (const bend of [-2.6, -1.9, -0.4, 0, 0.4, 1.55, 1.9, 2.6]) {
      const j = new THREE.Group();
      j.quaternion.copy(turn('x', bend));
      expect(bendOf(j), `${bend}`).toBeCloseTo(bend, 6);
    }
    const j = new THREE.Group();
    j.rotation.order = 'YXZ'; // (the figures' joints)
    j.quaternion.copy(turn('x', 2.2));
    expect(Math.abs(j.rotation.y)).toBeGreaterThan(3); // (the fold: x = π − 2.2, y = z = π)
  });

  it('sets the bend and leaves the turn about the other axes as it was', () => {
    for (const start of [0.3, 1.2, 2.2, -1.7]) {
      const j = new THREE.Group();
      const swing = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, Math.cos(0.5), Math.sin(0.5)), 0.4); // (a turn about an axis across x)
      j.quaternion.copy(swing).multiply(turn('x', start));
      bendTo(j, 1.9);
      expect(bendOf(j), `from ${start}`).toBeCloseTo(1.9, 6);
      expect(j.quaternion.clone().multiply(turn('x', -1.9)).angleTo(swing), `from ${start}`).toBeLessThan(1e-6);
    }
  });
});
