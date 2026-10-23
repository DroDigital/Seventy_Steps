import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { loadModels } from '../src/render/modelKit';
import { propJob } from '../src/render/propMeshes';
import { setPieces } from '../src/render/setShapes';
import { createWorldLights, type LightSpot } from '../src/render/worldLights';
import { lanternModelFlame } from '../src/world/lanternModels';
import type { Prop } from '../src/world/props';

beforeAll(loadModels);

const prop = (id: string, scale = 1, yaw = 0): Prop => ({
  kind: 'set', x: 11, y: 4, z: -9, w: 0.4 * scale, d: 0.7 * scale,
  h: (id === 'lightpost' ? 3.8 : 0.55) * scale, yaw, seed: 2, set: { id, scale, lit: 'lamp' },
});
const bounds = (g: THREE.BufferGeometry): THREE.Box3 => {
  g.computeBoundingBox();
  return g.boundingBox!;
};

describe('oil flames remain within their baked lantern housings', () => {
  it.each([0.65, 1, 1.8])('fits both lanterns at scale %s, below their caps and clear of the frame', (k) => {
    for (const id of ['lightpost', 'lantern']) {
      const pieces = setPieces(prop(id, k), [1, 1, 1]);
      const flames = pieces.filter((p) => p.light);
      expect(flames).toHaveLength(1);
      const flame = bounds(flames[0].geo);
      // The post's actual baked glass supplies the enclosure, rather than a second copy of the flame offsets.
      const cage = id === 'lightpost' ? bounds(pieces.find((p) => p.mat === 'glass')!.geo) :
        new THREE.Box3(new THREE.Vector3(-0.09, 0.195, -0.09).multiplyScalar(k), new THREE.Vector3(0.09, 0.312, 0.09).multiplyScalar(k));
      expect(cage.containsBox(flame)).toBe(true);
      expect(flame.containsPoint(new THREE.Vector3(...flames[0].at!))).toBe(true);
      expect(pieces.some((p) => p.mat === 'leaf')).toBe(false);
      for (const piece of pieces) piece.geo.dispose();
    }
  });

  it.each([0, Math.PI / 2, 2.6])('turns the off-centre light, flame and halo with the housing (yaw %s)', (yaw) => {
    for (const id of ['lightpost', 'lantern']) {
      const p = prop(id, 1.7, yaw);
      let spots: LightSpot[] = [];
      let meshes: THREE.Mesh[] = [];
      const job = propJob([p], REGIONS[0], (m, l) => { meshes = m; spots = l; });
      while (!job.next().done) { /* finish the sliced prop build */ }
      expect(spots).toHaveLength(1);
      const spot = spots[0];
      const anchor = lanternModelFlame(p)!;
      expect([spot.x, spot.y, spot.z]).toEqual([anchor.x, anchor.y, anchor.z]);
      if (id === 'lightpost') {
        expect(Math.hypot(spot.x - p.x, spot.z - p.z)).toBeCloseTo(0.384 * 1.7);
        expect(spot.y).toBeCloseTo(p.y - 0.15 + 3.12 * 1.7);
      }
      const lights = createWorldLights();
      lights.add(1, spots);
      lights.update(new THREE.Vector3(spot.x + 5, spot.y, spot.z + 5), 0, null);
      const halo = lights.halos.geometry.getAttribute('aHalo');
      expect(halo.getX(0)).toBeCloseTo(spot.x);
      expect(halo.getY(0)).toBeCloseTo(spot.y);
      expect(halo.getZ(0)).toBeCloseTo(spot.z);
      expect(halo.getW(0)).toBeCloseTo((id === 'lightpost' ? 0.5 : 0.24) * 1.7);
      const glass = meshes.find((m) => (m.material as THREE.ShaderMaterial).transparent);
      if (id === 'lightpost') {
        const material = glass!.material as THREE.ShaderMaterial;
        expect(material.depthWrite).toBe(false);
        expect(material.uniforms.uOpacity.value).toBeLessThan(0.2);
        // Blending glass must preserve the framebuffer alpha used to mark creatures and anomaly hues.
        expect(material.blendSrcAlpha).toBe(THREE.ZeroFactor);
        expect(material.blendDstAlpha).toBe(THREE.OneFactor);
      }
      for (const mesh of meshes) mesh.geometry.dispose();
      lights.halos.geometry.dispose();
      (lights.halos.material as THREE.Material).dispose();
    }
  });

  it('leaves an unlit lantern dark and other models on their existing rendering path', () => {
    const dark = prop('lantern');
    delete dark.set!.lit;
    expect(lanternModelFlame(dark)).toBeNull();
    expect(setPieces(dark, [1, 1, 1]).some((p) => p.light)).toBe(false);
    expect(lanternModelFlame(prop('altar_stone'))).toBeNull();
    expect(setPieces(prop('altar_stone'), [1, 1, 1]).filter((p) => p.light)).toHaveLength(1);
  });
});
