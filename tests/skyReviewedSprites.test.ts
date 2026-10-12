import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createSkyLife } from '../src/render/skyLife';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';
import { createGame } from '../src/systems/game';

describe('reviewed artwork for sky visitors', () => {
  it('uses authored page rectangles, camera-relative views, one mirror and the original canvas aspect', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const g = createGame();
      g.overworld = { region: 'yuggoth' } as NonNullable<typeof g.overworld>;
      const frames = Array.from({ length: 12 }, (_, i) => ({ source: `${i}.png`, sourceSha256: '', pixelSha256: '', width: 64, height: 128, bounds: [0, 0, 64, 128] as [number, number, number, number], page: 0, x: (i % 6) * 70, y: Math.floor(i / 6) * 140 }));
      const manifest: ReviewedManifest = {
        format: 'seventy-steps-reviewed-atlas-v1', entityCount: 1, frameCount: frames.length,
        pages: [{ file: 'page.png', width: 512, height: 512, sha256: '' }], frames,
        entities: { mi_go: {
          id: 'mi_go', name: 'Mi-Go', assetGroup: 'sprites', scale: 2.6, scaleUnit: 'metres square billboard side', page: 0,
          directions: {
            front: { sourceDirection: 'front', mirror: false, actions: { idle: [0], move: [0, 1, 2, 3] } },
            back: { sourceDirection: 'back', mirror: false, actions: { idle: [8], move: [8, 9, 10, 11] } },
            left: { sourceDirection: 'left', mirror: false, actions: { idle: [4], move: [4, 5, 6, 7] } },
            right: { sourceDirection: 'left', mirror: true, actions: { idle: [4], move: [4, 5, 6, 7] } },
          },
        } },
      };
      const atlas: SpriteAtlas = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map([['mi_go', { idle: [0, 0], move: [0, 0], attack: [0, 0, 0], hurt: [0, 0] }]]), eyes: new Float32Array(4), eyeColors: new Float32Array(3) };
      const scene = new THREE.Scene();
      const sky = createSkyLife(scene, g, { flock() {}, update() {}, lives: () => [] }, { atlas, texture: new THREE.Texture(), reviewed: { manifest, textures: [new THREE.Texture()] } }, () => {});
      const camera = new THREE.PerspectiveCamera();
      sky.update(camera, 0, false); // starts the region's visitor clock
      sky.update(camera, 26, false); // deterministic first Mi-Go pass
      const [legacy, reviewed] = scene.children as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
      expect(legacy.count).toBe(0);
      expect(reviewed.count).toBe(1);
      expect(reviewed.material.uniforms.uReviewed.value).toBe(1);
      expect(reviewed.geometry.getAttribute('aWeird').getX(0)).toBe(0);
      const pose = new THREE.Matrix4();
      reviewed.getMatrixAt(0, pose);
      const at = new THREE.Vector3().setFromMatrixPosition(pose);
      const size = new THREE.Vector3().setFromMatrixScale(pose);
      expect(size.x).toBeCloseTo(3.4); // the sky-visitor size is metres across
      expect(size.y).toBeCloseTo(6.8); // its source canvas is 64 by 128
      camera.position.set(at.x, at.y, at.z - 100); // random yaw is pi: this sees its face
      sky.update(camera, 26, false);
      const cells = reviewed.geometry.getAttribute('aCell');
      const info = reviewed.geometry.getAttribute('aInfo');
      expect([cells.getX(0), cells.getY(0), cells.getZ(0), cells.getW(0)]).toEqual([0, 0, 0.125, 0.25]);
      expect(info.getZ(0)).toBe(0);
      camera.position.set(at.x + 100, at.y, at.z); // its right-facing view explicitly mirrors left
      sky.update(camera, 26, false);
      expect(cells.getX(0)).toBeCloseTo(280 / 512);
      expect(info.getZ(0)).toBe(1);
      camera.position.set(at.x - 100, at.y, at.z); // independently chooses left with no extra reflection
      sky.update(camera, 26, false);
      expect(cells.getX(0)).toBeCloseTo(280 / 512);
      expect(info.getZ(0)).toBe(0);
    } finally {
      random.mockRestore();
    }
  });
});
