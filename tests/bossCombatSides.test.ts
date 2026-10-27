/**
 * The seven bosses' combat art from their left and their back (a later delivery, packed by tools/add_reviewed_frames.py):
 * a boss that swings or reels while the investigator circles it is drawn from the side they see, not facing the camera;
 * its right is its left mirrored once; a creature without such art is drawn as before. Yog-Sothoth, drawn again whole in
 * round 56, and Shub-Niggurath, in round 92, under the rule that attack and hurt are front art only, have none: from the
 * side they show their front. Azathoth's redraw follows the same front-only rule.
 */
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCreatureViews } from '../src/render/creatureViews';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import { resolveDirectionalClip } from '../src/render/sprites/directional';
import { reviewedClips, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

const BOSSES = ['cthulhu', 'father_dagon', 'mother_hydra', 'ghatanothoa', 'colossus_pyramids', 'dunwich_horror'];
const pack = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('the bosses\' left and back combat art in the pack', () => {
  it('is an attack and a hurt for each, as many frames as the front has, on the canvas of its view\'s idle', () => {
    for (const key of BOSSES) {
      const views = pack.entities[key].directions;
      for (const direction of ['left', 'back'] as const) for (const action of ['attack', 'hurt'] as const) {
        const own = views[direction].actions[action]!, front = views.front.actions[action]!;
        expect(own, `${key}/${direction}/${action}`).toHaveLength(front.length);
        const idle = pack.frames[views[direction].actions.idle![0]];
        for (const id of own) {
          expect([pack.frames[id].width, pack.frames[id].height]).toEqual([idle.width, idle.height]);
          expect(pack.frames[id].page, key).toBeGreaterThanOrEqual(4); // a later delivery's page
          expect(front.map((f) => pack.frames[f].sourceSha256), key).not.toContain(pack.frames[id].sourceSha256);
        }
      }
    }
  });

  it('is shown from the side seen, its right the left mirrored once, and nothing else of the pack changes', () => {
    for (const key of BOSSES) {
      const clips = reviewedClips(pack.entities[key], key);
      for (const action of ['attack', 'hurt'] as const) {
        expect(resolveDirectionalClip(clips, 'left', action)!.frames, key).toEqual(pack.entities[key].directions.left.actions[action]);
        expect(resolveDirectionalClip(clips, 'back', action)!.frames, key).toEqual(pack.entities[key].directions.back.actions[action]);
        const right = resolveDirectionalClip(clips, 'right', action)!;
        expect(right.frames, key).toEqual(pack.entities[key].directions.left.actions[action]);
        expect(right.mirror_horizontal, key).toBe(!pack.entities[key].directions.left.mirror);
        expect(resolveDirectionalClip(clips, 'front', action)!.frames, key).toEqual(pack.entities[key].directions.front.actions[action]);
      }
      expect(resolveDirectionalClip(clips, 'right', 'move')!.frames, key).toEqual(pack.entities[key].directions.right.actions.move); // its walk on the right is its own
    }
    const small = reviewedClips(pack.entities.deep_one, 'deep_one'); // a creature without it: the front's, as before
    for (const direction of ['left', 'back', 'right'] as const) expect(resolveDirectionalClip(small, direction, 'attack')!.frames).toEqual(pack.entities.deep_one.directions.front.actions.attack);
  });
});

function viewsOver() {
  const atlas: SpriteAtlas = {
    width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3),
    reviewed: { manifest: pack, pages: pack.pages.map(() => ({}) as HTMLImageElement) },
  };
  const g = createGame();
  return { g, views: createCreatureViews(new THREE.Scene(), g, atlas) };
}
/** A camera at `x`, `z` about a creature at the origin facing +z: at +x it sees its left, at -x its right, at -z its back. */
const camera = (x: number, z: number): THREE.PerspectiveCamera => {
  const c = new THREE.PerspectiveCamera();
  c.position.set(x, 1.6, z);
  return c;
};

describe('a boss swinging or reeling, seen from beside it or behind it', () => {
  const seen = (key: string, move: string, at: [number, number]) => {
    const { g, views } = viewsOver();
    const boss = spawnCreature(g, key, { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.unseen.delete(boss); // (the Dunwich Horror is unseen until it is revealed)
    const a = g.ecs.c.actor.get(boss)!;
    a.move = move;
    a.frame = 10;
    views.update(1, 5, camera(...at));
    return views.debugFrames().find((f) => f.key === key)!;
  };

  it('swings from the side it is seen: its left drawn, its back drawn, its right the left mirrored', () => {
    expect(seen('cthulhu', 'slam', [12, 0])).toMatchObject({ direction: 'left', state: 'attack', mirror: false });
    expect(seen('cthulhu', 'slam', [12, 0]).source).toMatch(/cthulhu\/movement\/left\/attack_\d\.png$/);
    expect(seen('cthulhu', 'slam', [0, -12]).source).toMatch(/cthulhu\/movement\/back\/attack_\d\.png$/);
    const right = seen('cthulhu', 'slam', [-12, 0]);
    expect(right).toMatchObject({ direction: 'right', state: 'attack', mirror: true });
    expect(right.source).toMatch(/cthulhu\/movement\/left\/attack_\d\.png$/);
    expect(seen('cthulhu', 'slam', [0, 12]).source).toMatch(/cthulhu\/movement\/front\/attack_\d\.png$/); // from the front, as it was
  });

  it('reels from the side it is seen too', () => {
    expect(seen('dunwich_horror', 'stagger', [12, 0]).source).toMatch(/dunwich_horror\/movement\/left\/hurt_\d\.png$/); // (the colossi that stoop show the stoop instead)
    expect(seen('dunwich_horror', 'stagger', [0, -12]).source).toMatch(/dunwich_horror\/movement\/back\/hurt_\d\.png$/);
    expect(seen('dunwich_horror', 'stagger', [-12, 0])).toMatchObject({ state: 'hurt', mirror: true });
  });

  it('is front art only for Yog-Sothoth, Shub-Niggurath and Azathoth, whatever the side they are seen from', () => {
    for (const [key, move] of [['yog_sothoth', 'beam'], ['shub_niggurath', 'tentacle_burst'], ['azathoth', 'roar']] as const) {
      const views = pack.entities[key].directions;
      for (const direction of ['left', 'back', 'right'] as const) expect(Object.keys(views[direction].actions).sort(), `${key}/${direction}`).toEqual(['idle', 'move']);
      for (const at of [[12, 0], [0, -12], [-12, 0]] as [number, number][]) {
        expect(seen(key, move, at).source, `${key} ${at}`).toMatch(new RegExp(`${key}/movement/front/attack_\\d\\.png$`));
        if (key === 'yog_sothoth') expect(seen(key, 'stagger', at).source, `${key} ${at}`).toMatch(/yog_sothoth\/movement\/front\/hurt_\d\.png$/); // (a colossus that stoops shows the stoop when it reels)
      }
    }
  });

  it('is unchanged for a creature that has no such art: it swings facing the camera, as before', () => {
    const swing = seen('deep_one', 'lunge', [12, 0]);
    expect(swing.state).toBe('attack');
    expect(swing.source).toMatch(/deep_one\/64x64\/front\/attack_\d\.png$/);
  });
});
