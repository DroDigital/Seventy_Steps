/**
 * The creatures' own shapes, told by the creature views (round 94; render/creatureViews.ts): a body that stands in the world casts its picture, larger
 * for a horror, none for a spectre or the Colour, and round 92's Shub-Niggurath, Nug and Yeb cast with the rest, on the real library's pictures.
 */
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CAST } from '../src/data/fxTuning';
import { loomOf } from '../src/render/castPlan';
import { LANTERN_CASTER } from '../src/render/colliderShadow';
import { createCreatureViews } from '../src/render/creatureViews';
import { CASTER } from '../src/render/moonShadow';
import { castSilhouettes } from '../src/render/silhouetteCasters';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedEntity, ReviewedManifest } from '../src/render/sprites/reviewed';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

/** One frame for every view and action: enough for the views to draw whatever it is shown. */
function entity(id: string, assetGroup: ReviewedEntity['assetGroup'], scale: number): ReviewedEntity {
  const view = (): ReviewedEntity['directions']['front'] => ({ sourceDirection: 'front', mirror: false, actions: { idle: [0], move: [0], attack: [0], hurt: [0] } });
  return { id, name: id, assetGroup, scale, scaleUnit: 'metres', page: 0, directions: { front: view(), back: view(), left: view(), right: view() } };
}

const HEIGHT: Record<string, number> = { azathoth: 14, shub_niggurath: 18 }; // the painted horrors of the library, by their height in metres (the others are sprites, drawn by the side)

function viewsOver(ids: string[], real?: ReviewedManifest, drawn: string[] = []) {
  const g = createGame();
  const manifest: ReviewedManifest = real ?? {
    format: 'seventy-steps-reviewed-atlas-v1', entityCount: ids.length, frameCount: 1,
    pages: [{ file: 'page.png', width: 128, height: 128, sha256: '' }],
    frames: [{ source: 'f.png', sourceSha256: '', pixelSha256: '', width: 64, height: 64, bounds: [8, 4, 56, 62], page: 0, x: 0, y: 0 }],
    entities: Object.fromEntries(ids.map((id) => [id, entity(id, id in HEIGHT ? 'bosses' : 'sprites', HEIGHT[id] ?? 2)])),
  };
  const atlas: SpriteAtlas = {
    width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), eyes: new Float32Array(4), eyeColors: new Float32Array(3),
    frames: new Map(drawn.map((id) => [id, { idle: [0], move: [0], attack: [0], hurt: [0], stoop: [0], stoop_mid: [0], flight: [0] } as unknown as SpriteAtlas['frames'] extends Map<string, infer F> ? F : never])), // (a creature the library has no picture of, drawn by the procedural atlas)
    reviewed: { manifest, pages: manifest.pages.map(() => ({}) as HTMLImageElement) },
  };
  const scene = new THREE.Scene();
  const views = createCreatureViews(scene, g, atlas);
  const info = (): Float32Array => ((castSilhouettes.scene.children[1] as THREE.InstancedMesh).geometry.getAttribute('aCast') as THREE.InstancedBufferAttribute).array as Float32Array;
  /** Every cut-out the views have told this frame, on whichever sprite page (the fallback batch is the scene's first mesh, the pages follow): how much taller and broader it is than its body. */
  const casting = (): { tall: number; wide: number }[] => (castSilhouettes.scene.children as THREE.InstancedMesh[]).flatMap((mesh) => {
    const a = mesh.geometry.getAttribute('aCast') as THREE.InstancedBufferAttribute;
    return Array.from({ length: a.count }, (_, i) => ({ on: a.getX(i), tall: a.getY(i), wide: a.getZ(i) })).filter((c) => c.on === 1);
  });
  return { g, views, info, scene, casting };
}

describe('the creatures\' own shapes, told by the creature views', () => {
  it('cast for a body that stands in the world, larger for a horror, and not for a spectre', () => {
    const { g, views, info } = viewsOver(['deep_one', 'azathoth', 'moon_bog_wraith']);
    spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(castSilhouettes.scene.children).toHaveLength(2); // the fallback batch and one reviewed page
    expect(info()[0]).toBe(1);
    const small = info()[1];
    expect(small).toBeGreaterThan(1);
    expect(info()[3]).toBeGreaterThan(0); // its feet's height over its picture's bottom

    spawnCreature(g, 'azathoth', { x: 0, z: -9, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    const casting = [0, 1, 2, 3].map((i) => ({ on: info()[i * 4], tall: info()[i * 4 + 1] })).filter((c) => c.on === 1);
    expect(casting.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...casting.map((c) => c.tall))).toBeGreaterThan(small + 0.1);
    // (its echoes, drawn beside it, cast none: only the body does)
    expect(casting.length).toBe(2);

    const none = viewsOver(['moon_bog_wraith']);
    spawnCreature(none.g, 'moon_bog_wraith', { x: 0, z: 6, yaw: 0 });
    none.views.update(1, 1, new THREE.PerspectiveCamera());
    expect(none.info()[0]).toBe(0);
  });

  it('cast for every creature that has a picture in the library: Shub-Niggurath, Nug and Yeb among them, whatever it is painted as', () => {
    for (const id of ['shub_niggurath', 'nug', 'yeb']) {
      const { g, views, info } = viewsOver([id]);
      spawnCreature(g, id, { x: 0, z: 8, yaw: 0 });
      views.update(1, 1, new THREE.PerspectiveCamera());
      expect(info()[0], id).toBe(1);
      expect(info()[1], id).toBeGreaterThan(1);
    }
  });

  it('cast from the real library too: round 92\'s new Shub-Niggurath, Nug and Yeb each throw a cut-out larger than their body, the more the taller they are drawn', () => {
    const real = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;
    const tall: Record<string, number> = {};
    for (const id of ['shub_niggurath', 'nug', 'yeb']) {
      expect(real.entities[id], id).toBeDefined();
      const { g, views, casting } = viewsOver([id], real);
      spawnCreature(g, id, { x: 0, z: 10, yaw: 0 });
      views.update(1, 1, new THREE.PerspectiveCamera());
      const rows = casting();
      expect(rows.length, id).toBeGreaterThanOrEqual(1);
      tall[id] = Math.max(...rows.map((r) => r.tall));
      expect(tall[id], id).toBeGreaterThan(loomOf(2.5).tall); // a horror's shadow is more than a man's
    }
    expect(tall.shub_niggurath).toBeGreaterThan(tall.nug); // the All-Mother stands over the twins
    expect(tall.shub_niggurath).toBeLessThanOrEqual(1 + CAST.loom.base + CAST.loom.size + CAST.loom.deep + 1e-6);
  });

  it('cast from the procedural atlas too, for a creature the library has no picture of, and none for the Colour, which lies outside the light', () => {
    const { g, views } = viewsOver([], undefined, ['ghoul', 'colour_out_of_space']);
    const drawn = (): number[] => [...((castSilhouettes.scene.children[0] as THREE.InstancedMesh).geometry.getAttribute('aCast') as THREE.InstancedBufferAttribute).array].filter((_, i) => i % 4 === 0);
    spawnCreature(g, 'ghoul', { x: 0, z: 6, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(drawn().slice(0, 2)).toEqual([1, 0]);
    spawnCreature(g, 'colour_out_of_space', { x: 3, z: 9, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(drawn().filter((on) => on === 1)).toHaveLength(1); // (the ghoul alone)
  });

  it('are all a creature stands in the shadow passes as: no rounded stand-in body is put in the world\'s scene any more', () => {
    const { g, views, scene } = viewsOver(['deep_one']);
    spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    const moon = new THREE.Layers();
    moon.set(CASTER);
    const lantern = new THREE.Layers();
    lantern.set(LANTERN_CASTER);
    scene.traverse((o) => {
      expect(o.layers.test(moon)).toBe(false);
      expect(o.layers.test(lantern)).toBe(false);
    });
  });

  it('are collected every frame, and forgotten when no creature is drawn', () => {
    const { g, views, info } = viewsOver(['deep_one']);
    const id = spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 })!;
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(info()[0]).toBe(1);
    g.ecs.c.model.delete(id);
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(info()[0]).toBe(0);
  });
});
