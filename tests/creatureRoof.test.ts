import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { kitOf } from '../src/data/kits';
import { REVIEWED_MATTER } from '../src/data/reviewedLook';
import { FX } from '../src/data/tuning';
import { createCreatureRoof, type CreatureRoof } from '../src/render/creatureRoof';
import { createCreatureViews } from '../src/render/creatureViews';
import { PLAIN, toneForForm } from '../src/render/spriteTone';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedEntity, ReviewedManifest } from '../src/render/sprites/reviewed';
import { worldUniforms } from '../src/render/worldMaterial';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';
import { roofedAt } from '../src/world/terrain';

const SEPIA = [0.46, 0.44, 0.41] as const; // a form of the older art, drawn dull (round 83)
const COLD = [0.3, 0.45, 0.6] as const; // a cold realm's mid-tone

/** Lays a creature's share from `from` to `to` seconds in steps of a twentieth, as the views do each frame. */
function run(roof: CreatureRoof, id: number, roofed: boolean, from: number, to: number): number {
  let sky = NaN;
  for (let i = 1; i <= Math.round((to - from) * 20); i++) sky = roof.sky(id, roofed, from + i / 20);
  return sky;
}

describe("a drawn creature's share of the open sky (round 96: render/creatureRoof.ts)", () => {
  it('is the open sky for a creature in the air, and a roof for one under it from the first sight', () => {
    const roof = createCreatureRoof();
    expect(roof.sky(1, false, 0)).toBe(1);
    expect(roof.sky(2, true, 0)).toBe(0); // (a creature first seen indoors is not faded in from the sky)
  });

  it("comes off at a roof's door quickly: each frame closes its share of the gap, as the coat does", () => {
    const roof = createCreatureRoof();
    roof.sky(1, false, 0);
    expect(run(roof, 1, true, 0, 0.2)).toBeCloseTo((1 - 0.05 / FX.spriteRoof[0]) ** 4, 6); // four frames of a twentieth
    expect(run(roof, 1, true, 0.2, FX.spriteRoof[0])).toBeLessThan(0.4); // most of the way in one time constant
    expect(run(roof, 1, true, FX.spriteRoof[0], 5)).toBeLessThan(0.01);
  });

  it('goes back on under the sky more slowly, over its own time constant, FX.spriteRoof[1]', () => {
    const roof = createCreatureRoof();
    roof.sky(1, true, 0);
    expect(run(roof, 1, false, 0, FX.spriteRoof[0])).toBeLessThan(0.2); // (after the door's time, still well short of the sky)
    expect(run(roof, 1, false, FX.spriteRoof[0], 30)).toBeGreaterThan(0.999);
    expect(FX.spriteRoof[1]).toBeGreaterThan(FX.spriteRoof[0]);
  });

  it('forgets a creature no longer drawn, so one that comes back is not eased from where it left', () => {
    const roof = createCreatureRoof();
    roof.sky(1, true, 0);
    roof.sky(2, true, 0);
    roof.forget(new Set([1]));
    expect(roof.sky(1, false, 0.05)).toBeCloseTo(0.05 / FX.spriteRoof[1], 6); // (kept: eased out of the roof)
    expect(roof.sky(2, false, 0.05)).toBe(1); // (forgotten: first seen in the air)
  });

  it("under a roof a creature's tone is the one it was drawn with; in the air it takes its realm's", () => {
    expect(toneForForm('deep_one', SEPIA, COLD, FX.spriteGrade * 0)).toEqual(PLAIN);
    expect(Math.abs(toneForForm('deep_one', SEPIA, COLD, FX.spriteGrade).sin)).toBeGreaterThan(0.05);
  });

  it('is what the creature views read each frame, for every reviewed picture (creatureViews.ts)', () => {
    const src = readFileSync('src/render/creatureViews.ts', 'utf8');
    expect(src).toContain('sky = roofs.sky(id, roofedAt(x, z), time)');
    expect(src).toContain('(worldUniforms.uSpriteGrade.value as number) * sky');
  });

  it('resets a hidden creature on reappearance while a continuously drawn creature keeps easing', () => {
    const direction = (): ReviewedEntity['directions']['front'] => ({ sourceDirection: 'front', mirror: false, actions: { idle: [0], move: [0], attack: [0], hurt: [0] } });
    const entity: ReviewedEntity = { id: 'deep_one', name: 'deep_one', assetGroup: 'sprites', scale: 2, scaleUnit: 'metres', page: 0, directions: { front: direction(), back: direction(), left: direction(), right: direction() } };
    const manifest: ReviewedManifest = { format: 'seventy-steps-reviewed-atlas-v1', entityCount: 1, frameCount: 1, pages: [{ file: 'p.png', width: 128, height: 128, sha256: '' }], frames: [{ source: 'f.png', sourceSha256: '', pixelSha256: '', width: 64, height: 64, bounds: [8, 4, 56, 62], page: 0, x: 0, y: 0 }], entities: { deep_one: entity } };
    const atlas: SpriteAtlas = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3), reviewed: { manifest, pages: [{} as HTMLImageElement] } };
    const dungeon = worldLayout().dungeons.find((d) => kitOf(d.layout.def.id).roof !== 'open')!.layout;
    const outside = { x: dungeon.rect.x0 - 20, z: dungeon.rect.z0 - 20 };
    const inside = dungeon.rooms[0];
    expect(roofedAt(outside.x, outside.z)).toBe(false);
    expect(roofedAt(inside.x, inside.z)).toBe(true);
    const game = createGame(), scene = new THREE.Scene(), views = createCreatureViews(scene, game, atlas);
    const hidden = spawnCreature(game, 'deep_one', { ...outside, yaw: 0 })!;
    const visible = spawnCreature(game, 'deep_one', { ...outside, yaw: 0 })!;
    const camera = new THREE.PerspectiveCamera();
    const tint = worldUniforms.uSpriteTints.value[2] as THREE.Vector3;
    const originalTint = tint.clone(), originalGrade = worldUniforms.uSpriteGrade.value;
    const mesh = scene.children.find((child) => (child as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material?.uniforms?.uReviewed?.value === 1) as THREE.InstancedMesh;
    try {
      tint.set(...COLD);
      worldUniforms.uSpriteGrade.value = 1;
      views.update(1, 0, camera);
      for (const id of [hidden, visible]) {
        const tr = game.ecs.c.transform.get(id)!;
        tr.pos.x = tr.prev.x = inside.x;
        tr.pos.z = tr.prev.z = inside.z;
      }
      views.update(1, 0.05, camera);
      game.ecs.c.brain.get(hidden)!.state = 'hidden';
      views.update(1, 0.1, camera);
      expect(views.debugFrames().map((frame) => frame.id)).toEqual([visible]);
      game.ecs.c.brain.get(hidden)!.state = 'idle';
      views.update(1, 0.15, camera);
      expect(views.debugFrames().map((frame) => frame.id)).toEqual([hidden, visible]);
      const tone = mesh.geometry.getAttribute('aTone');
      expect(tone.getX(0)).toBeCloseTo(PLAIN.cos, 6);
      expect(tone.getY(0)).toBeCloseTo(PLAIN.sin, 6);
      const easing = (1 - 0.05 / FX.spriteRoof[0]) ** 3;
      const expected = toneForForm('deep_one', REVIEWED_MATTER.deep_one, COLD, easing);
      expect(tone.getX(1)).toBeCloseTo(expected.cos, 6);
      expect(tone.getY(1)).toBeCloseTo(expected.sin, 6);
    } finally {
      tint.copy(originalTint);
      worldUniforms.uSpriteGrade.value = originalGrade;
    }
  });
});
