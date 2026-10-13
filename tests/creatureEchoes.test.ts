import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCreatureViews } from '../src/render/creatureViews';
import { ECHOES, echoDrift } from '../src/render/eldritch';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedEntity, ReviewedManifest } from '../src/render/sprites/reviewed';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

/** One frame for every view and action: enough for the views to draw whatever it is shown. */
function entity(id: string, assetGroup: ReviewedEntity['assetGroup'], scale: number): ReviewedEntity {
  const view = (): ReviewedEntity['directions']['front'] => ({ sourceDirection: 'front', mirror: false, actions: { idle: [0], move: [0], attack: [0], hurt: [0] } });
  return { id, name: id, assetGroup, scale, scaleUnit: 'metres', page: 0, directions: { front: view(), back: view(), left: view(), right: view() } };
}

function viewsOver(ids: string[]) {
  const g = createGame();
  const manifest: ReviewedManifest = {
    format: 'seventy-steps-reviewed-atlas-v1', entityCount: ids.length, frameCount: 1,
    pages: [{ file: 'page.png', width: 128, height: 128, sha256: '' }],
    frames: [{ source: 'f.png', sourceSha256: '', pixelSha256: '', width: 64, height: 64, bounds: [8, 4, 56, 62], page: 0, x: 0, y: 0 }],
    entities: Object.fromEntries(ids.map((id) => [id, entity(id, id === 'azathoth' ? 'bosses' : 'sprites', 2)])),
  };
  const atlas: SpriteAtlas = {
    width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3),
    reviewed: { manifest, pages: [{} as HTMLImageElement] },
  };
  const scene = new THREE.Scene();
  const views = createCreatureViews(scene, g, atlas);
  const reviewed = () => scene.children.find((c) => (c as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material?.uniforms?.uReviewed?.value === 1) as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  return { g, views, reviewed, scene };
}

const halos = (scene: THREE.Scene): number => {
  const mesh = scene.children.find((c) => (c as THREE.Mesh<THREE.InstancedBufferGeometry>).geometry?.getAttribute?.('aHalo')) as THREE.Mesh<THREE.InstancedBufferGeometry>;
  return mesh.geometry.instanceCount;
};

describe('an outer god on reviewed art', () => {
  it('drifts about itself within its drift', () => {
    for (const [i, e] of ECHOES.entries()) for (const t of [0, 3.7, 40]) {
      const d = echoDrift(i, t, 30);
      expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(Math.SQRT2 * e.drift * 30 + 1e-9);
    }
  });

  it('is drawn with its echoes, each dithered by its own share; a lesser creature is drawn once', () => {
    const { g, views, reviewed } = viewsOver(['azathoth', 'deep_one']);
    spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(reviewed().count).toBe(1);

    const god = spawnCreature(g, 'azathoth', { x: 0, z: -9, yaw: 0 })!;
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(g.ecs.c.model.get(god)).toBe('creature:azathoth');
    expect(reviewed().count).toBe(1 + 1 + ECHOES.length);
    const opacity = Array.from({ length: reviewed().count }, (_, i) => reviewed().geometry.getAttribute('aInfo').getY(i));
    for (const e of ECHOES) expect(opacity.some((o) => Math.abs(o - (1 - e.ghost)) < 1e-6)).toBe(true);
    for (let i = 0; i < reviewed().count; i++) expect(reviewed().geometry.getAttribute('aInfo').getW(i)).toBe(0); // authored bodies and echoes use ordinary lighting, with no rim override
    expect(views.debugFrames().filter((f) => f.key === 'azathoth')).toHaveLength(1); // the echoes are not the diagnostics' business
  });
});

describe('the eyes of a reviewed form', () => {
  const camera = () => {
    const c = new THREE.PerspectiveCamera();
    c.position.set(0, 1.6, 9);
    return c;
  };

  it('glow as the investigator nears, in the dark, from the front only', () => {
    const { g, views, scene } = viewsOver(['ghoul', 'deep_one']);
    const ghoul = spawnCreature(g, 'ghoul', { x: 0, z: 0, yaw: 0 })!; // faces +z: the camera at +z sees its front
    views.update(1, 1, camera());
    expect(g.ecs.c.model.get(ghoul)).toBe('creature:ghoul');
    expect(views.debugFrames()[0].direction).toBe('front');
    expect(halos(scene)).toBe(1);

    const back = new THREE.PerspectiveCamera();
    back.position.set(0, 1.6, -9);
    views.update(1, 1, back);
    expect(views.debugFrames()[0].direction).toBe('back');
    expect(halos(scene)).toBe(0);
  });

  it('are the pack\'s own: a form without them has none', () => {
    const { g, views, scene } = viewsOver(['deep_one']);
    spawnCreature(g, 'deep_one', { x: 0, z: 0, yaw: 0 });
    views.update(1, 1, camera());
    expect(halos(scene)).toBe(0);
  });
});
