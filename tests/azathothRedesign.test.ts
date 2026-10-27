import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FEEDBACK } from '../src/data/tuning';
import { createCreatureViews } from '../src/render/creatureViews';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import { resolveDirectionalClip, type SpriteAction, type SpriteDirection } from '../src/render/sprites/directional';
import { reviewedClips, reviewedSize, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';
import { alphaBounds, crop, pngRgba } from './reviewedPackHelpers';

const ASSETS = 'public/creatures/reviewed';
const DIRECTIONS = ['front', 'left', 'back', 'right'] as const;
const FRONT_ACTIONS = ['idle', 'move', 'attack', 'hurt', 'stoop', 'stoop_mid'] as const;
const OTHER_ACTIONS = ['idle', 'move'] as const;
const FRAME_COUNTS: Record<string, number> = { idle: 2, move: 4, attack: 3, hurt: 2, stoop: 2, stoop_mid: 1 };
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const pathname = (direction: SpriteDirection, action: SpriteAction, index: number): string =>
  `bosses/azathoth/movement/${direction}/${action}_${index}.png`;

interface ApprovedFrame { path: string; sha256: string; rgbaSha256: string; width: number; height: number; bounds: number[] }
interface SourceEntity {
  key: string; sprite_scale: number;
  directions: Record<SpriteDirection, { source_direction: string; mirror_horizontal: boolean; actions: Record<string, { frame_count: number; frames: { name: string; path: string; sha256: string }[] }> }>;
}
/** This fixture records the hashes of the exact user-approved delivery, independent of the atlas. */
const approved = JSON.parse(readFileSync('tests/fixtures/azathoth-redesign.json', 'utf8')) as { frames: ApprovedFrame[] };
const reference = new Map(approved.frames.map(frame => [frame.path, frame]));
const pack = JSON.parse(readFileSync(`${ASSETS}/index.json`, 'utf8')) as ReviewedManifest;
const source = JSON.parse(readFileSync(`${ASSETS}/source-index.json`, 'utf8')) as { entities: SourceEntity[] };
const pages = pack.pages.map(page => pngRgba(readFileSync(`${ASSETS}/${page.file}`)));

function reflect(pixels: Uint8Array): Uint8Array {
  const out = new Uint8Array(pixels.length);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    out.set(pixels.subarray(i, i + 4), (y * 128 + 127 - x) * 4);
  }
  return out;
}

describe('the approved Azathoth sprite redesign', () => {
  it('contains all 32 delivered poses, in order and with their exact PNG and rendered RGBA hashes', () => {
    expect(approved.frames).toHaveLength(32);
    const entity = pack.entities.azathoth;
    const original = source.entities.find(entry => entry.key === 'azathoth')!;
    expect(entity.scale).toBe(30);
    expect(original.sprite_scale).toBe(30);
    const clips = reviewedClips(entity, 'azathoth');
    let count = 0;
    for (const direction of DIRECTIONS) {
      const view = entity.directions[direction], from = direction === 'right' ? 'left' : direction;
      const expectedActions: readonly SpriteAction[] = direction === 'front' ? FRONT_ACTIONS : OTHER_ACTIONS;
      expect(view.sourceDirection, direction).toBe(from);
      expect(view.mirror, direction).toBe(direction === 'right');
      expect(Object.keys(view.actions).sort(), direction).toEqual([...expectedActions].sort());
      expect(Object.keys(original.directions[direction].actions).sort(), direction).toEqual([...expectedActions].sort());
      for (const action of expectedActions) {
        const ids = view.actions[action]!;
        const clip = resolveDirectionalClip(clips, direction, action)!;
        expect(ids, `${direction}/${action}`).toHaveLength(FRAME_COUNTS[action]);
        expect(clip.frames).toEqual(ids);
        expect(clip.mirror_horizontal).toBe(direction === 'right');
        expect(original.directions[direction].actions[action].frame_count).toBe(FRAME_COUNTS[action]);
        for (const [n, id] of ids.entries()) {
          const wanted = reference.get(pathname(direction, action, n))!;
          const author = reference.get(pathname(from, action, n))!;
          expect(wanted, `${direction}/${action}/${n}`).toBeDefined();
          expect(author, `${from}/${action}/${n}`).toBeDefined();
          const frame = pack.frames[id], pixels = crop(frame, pages[frame.page]);
          const rendered = clip.mirror_horizontal ? reflect(pixels) : pixels;
          expect([frame.width, frame.height]).toEqual([128, 128]);
          expect(frame.source).toBe(author.path);
          expect(frame.sourceSha256).toBe(author.sha256);
          expect(frame.pixelSha256).toBe(author.rgbaSha256);
          expect(hash(pixels)).toBe(author.rgbaSha256);
          expect(hash(rendered)).toBe(wanted.rgbaSha256);
          expect(alphaBounds(rendered, 128, 128)).toEqual(wanted.bounds);
          expect(wanted.bounds[3]).toBe(124);
          const entry = original.directions[direction].actions[action].frames[n];
          expect(entry.path).toBe(author.path);
          expect(entry.sha256).toBe(author.sha256);
          count++;
        }
      }
    }
    expect(count).toBe(32);
    // The 26 unique drawn images are packed once; no old side/back combat survives.
    const paths = pack.frames.filter(f => f.source.startsWith('bosses/azathoth/movement/')).map(f => f.source).sort();
    expect(paths).toEqual(approved.frames.filter(f => !f.path.includes('/right/')).map(f => f.path).sort());
  });

  it('uses the new front combat and stoop poses from every side, without mirroring them', () => {
    const clips = reviewedClips(pack.entities.azathoth, 'azathoth');
    for (const direction of DIRECTIONS) for (const action of ['attack', 'hurt', 'stoop', 'stoop_mid'] as const) {
      const clip = resolveDirectionalClip(clips, direction, action)!;
      expect(clip, `${direction}/${action}`).toEqual(clips.front![action]);
      expect(clip.mirror_horizontal).toBe(false);
      expect(clip.frames.map(id => pack.frames[id].source)).toEqual(
        Array.from({ length: FRAME_COUNTS[action] }, (_, n) => pathname('front', action, n)),
      );
    }
  });

  it('keeps the 30-metre painted height and places the authored ground line on the game floor', () => {
    const entity = pack.entities.azathoth, frame = pack.frames[entity.directions.front.actions.idle![0]];
    const size = reviewedSize(entity, pack);
    expect(size.width).toBe(size.height);
    expect(size.height * (frame.bounds[3] - frame.bounds[1]) / frame.height).toBeCloseTo(30, 8);
    expect(size.groundOffset).toBeCloseTo(size.height * (1 - 124 / 128), 8);
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
/** Azathoth faces +z; cameras at +x, -z, -x see its left, back, and right. */
function camera(x: number, z: number): THREE.PerspectiveCamera {
  const result = new THREE.PerspectiveCamera();
  result.position.set(x, 1.6, z);
  return result;
}

describe('the game renderer using the redesigned Azathoth', () => {
  it.each([['front', 0, 80], ['left', 80, 0], ['back', 0, -80], ['right', -80, 0]] as const)(
    'shows its front attack without mirroring when seen from %s', (direction, x, z) => {
      const { g, views } = viewsOver();
      const boss = spawnCreature(g, 'azathoth', { x: 0, z: 0, yaw: 0 })!;
      const actor = g.ecs.c.actor.get(boss)!;
      actor.move = 'roar'; actor.frame = 10;
      views.update(1, 5, camera(x, z));
      expect(views.debugFrames().find(f => f.key === 'azathoth')).toMatchObject({ direction, state: 'attack', mirror: false, source: expect.stringMatching(/azathoth\/movement\/front\/attack_\d\.png$/) });
    },
  );

  it.each([['front', 0, 80], ['left', 80, 0], ['back', 0, -80], ['right', -80, 0]] as const)(
    'shows the same mid, bow, hold and rise sequence seen from %s', (direction, x, z) => {
      const { g, views } = viewsOver();
      const boss = spawnCreature(g, 'azathoth', { x: 0, z: 0, yaw: 0 })!;
      const actor = g.ecs.c.actor.get(boss)!;
      const seen = (time: number) => {
        views.update(1, time, camera(x, z));
        return views.debugFrames().find(f => f.key === 'azathoth')!;
      };
      expect(seen(10)).toMatchObject({ direction, state: 'idle' });
      actor.move = 'stagger';
      expect(seen(20)).toMatchObject({ direction, state: 'stoop_mid', mirror: false, source: pathname('front', 'stoop_mid', 0) });
      expect(seen(20 + FEEDBACK.midSeconds + 0.01)).toMatchObject({ direction, state: 'stoop', frame: 0, source: pathname('front', 'stoop', 0) });
      expect(seen(20 + FEEDBACK.midSeconds + FEEDBACK.bowSeconds + 0.01)).toMatchObject({ direction, state: 'stoop', frame: 1, source: pathname('front', 'stoop', 1) });
      actor.move = null;
      expect(seen(40)).toMatchObject({ direction, state: 'stoop_mid', mirror: false, source: pathname('front', 'stoop_mid', 0) });
      expect(seen(40 + FEEDBACK.riseSeconds + 0.01)).toMatchObject({ direction, state: 'idle' });
    },
  );
});
