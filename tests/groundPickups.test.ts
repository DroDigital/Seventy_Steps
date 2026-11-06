import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildFigure } from '../src/render/figures';
import { poseGroundPickup } from '../src/render/groundPickups';

describe('ground pickup figures', () => {
  it('leaves the Echo casket open down to its wooden bottom', () => {
    const cache = buildFigure('cache');
    const shell = cache.body.children.find((object) => object instanceof THREE.Mesh)!;
    cache.root.updateMatrixWorld(true);
    for (const x of [-0.2, 0, 0.2]) for (const z of [-0.1, 0, 0.1]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, 0.31, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObject(shell)[0];
      expect(hit, `opening at ${x}, ${z}`).toBeDefined();
      expect(hit.point.y, `opening at ${x}, ${z}`).toBeCloseTo(0.0625, 4);
    }
  });

  it('builds finite geometry for the Echo casket and cartridge box', () => {
    for (const model of ['cache', 'ammo']) {
      const figure = buildFigure(model);
      let meshes = 0;
      figure.root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        meshes++;
        const positions = object.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          expect(Number.isFinite(positions.getX(i) + positions.getY(i) + positions.getZ(i))).toBe(true);
        }
      });
      expect(meshes).toBeGreaterThan(1);
    }
  });

  it('animates the light and glints while the containers stay grounded', () => {
    const cache = buildFigure('cache');
    const ammo = buildFigure('ammo');
    const orbit = cache.root.getObjectByName('cache-orbit')!;
    const gleam = ammo.root.getObjectByName('ammo-gleam')!;
    poseGroundPickup(cache, 1);
    poseGroundPickup(ammo, 1);
    expect(orbit.rotation.y).toBeCloseTo(0.42);
    expect(gleam.scale.x).not.toBe(1);
    expect(cache.body.position.y).toBe(0);
    expect(ammo.body.position.y).toBe(0);
  });
});
