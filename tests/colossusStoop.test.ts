/**
 * The colossi's stoop on reviewed art: seven bosses have a drawn bow and hold, and a pose halfway between it and the idle
 * (later deliveries, packed by tools/add_reviewed_frames.py). While the body is stooped (hurt.ts: recovering from its own
 * blow, or reeling) the billboard comes down through the halfway pose, bows once and holds, from any side, and stands up
 * through the halfway pose again; one that has no such art is drawn as before.
 */
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FEEDBACK } from '../src/data/tuning';
import { createCreatureViews } from '../src/render/creatureViews';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import { resolveDirectionalClip } from '../src/render/sprites/directional';
import { reviewedClips, type ReviewedEntity, type ReviewedManifest } from '../src/render/sprites/reviewed';
import type { Fight } from '../src/systems/fightTypes';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

const COLOSSI = ['cthulhu', 'father_dagon', 'mother_hydra', 'ghatanothoa', 'colossus_pyramids', 'azathoth', 'shub_niggurath'];
const pack = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('the stoop in the pack', () => {
  it('is two frames of each colossus, from the front, on the canvas and ground line of its idle, lower than it', () => {
    for (const key of COLOSSI) {
      const front = pack.entities[key].directions.front.actions;
      expect(front.stoop, key).toHaveLength(2);
      const idle = pack.frames[front.idle![0]];
      const [bow, hold] = front.stoop!.map((id) => pack.frames[id]);
      for (const f of [bow, hold]) {
        expect([f.width, f.height], key).toEqual([idle.width, idle.height]);
        expect(f.bounds[3], key).toBe(idle.bounds[3]); // the same ground
        expect(f.bounds[3] - f.bounds[1], key).toBeLessThan((idle.bounds[3] - idle.bounds[1]) * 1.01); // no taller than it stood
      }
      expect(bow.sourceSha256, key).not.toBe(hold.sourceSha256);
      expect(Object.keys(pack.entities[key].directions.back.actions), key).not.toContain('stoop'); // front only
    }
    const others = Object.entries(pack.entities).filter(([key]) => !COLOSSI.includes(key));
    expect(others.filter(([, e]) => e.directions.front.actions.stoop)).toEqual([]);
  });

  it('is shown from any side, for those that have it, by the front clip', () => {
    const clips = reviewedClips(pack.entities.cthulhu, 'cthulhu');
    for (const direction of ['front', 'left', 'back', 'right'] as const) for (const pose of ['stoop', 'stoop_mid'] as const) expect(resolveDirectionalClip(clips, direction, pose)).toBe(clips.front![pose]);
    expect(resolveDirectionalClip(reviewedClips(pack.entities.deep_one, 'deep_one'), 'front', 'stoop')).toBeUndefined();
    expect(resolveDirectionalClip(reviewedClips(pack.entities.deep_one, 'deep_one'), 'front', 'stoop_mid')).toBeUndefined();
  });

  it('has a halfway frame for each colossus, on the canvas and ground line of its idle, no taller than it and no lower than the bow, and not the bow, hold or idle', () => {
    for (const key of COLOSSI) {
      const front = pack.entities[key].directions.front.actions;
      expect(front.stoop_mid, key).toHaveLength(1);
      const [idle, bow, hold, mid] = [front.idle![0], front.stoop![0], front.stoop![1], front.stoop_mid![0]].map((id) => pack.frames[id]);
      expect([mid.width, mid.height], key).toEqual([idle.width, idle.height]);
      expect(mid.bounds[3], key).toBe(idle.bounds[3]);
      const high = (f: typeof mid) => f.bounds[3] - f.bounds[1];
      expect(high(mid), key).toBeLessThanOrEqual(high(idle));
      expect(high(mid), key).toBeGreaterThanOrEqual(high(bow));
      if (!['azathoth', 'shub_niggurath'].includes(key)) { // a mound's heights barely change: the halfway shape differs instead
        expect(high(mid), key).toBeLessThan(high(idle));
        expect(high(mid), key).toBeGreaterThan(high(bow));
      }
      for (const other of [idle, bow, hold]) expect(mid.sourceSha256, key).not.toBe(other.sourceSha256);
      expect(Object.keys(pack.entities[key].directions.back.actions), key).not.toContain('stoop_mid'); // front only
    }
    expect(Object.entries(pack.entities).filter(([key, e]) => !COLOSSI.includes(key) && e.directions.front.actions.stoop_mid)).toEqual([]);
  });
});

/** A colossus with a stoop (frames 1 and 2) and a Deep One without, each with an idle (frame 0). */
function viewsOver(mid = false) {
  const view = (actions: ReviewedEntity['directions']['front']['actions']): ReviewedEntity['directions']['front'] => ({ sourceDirection: 'front', mirror: false, actions });
  const entity = (id: string, assetGroup: ReviewedEntity['assetGroup'], stoop: boolean): ReviewedEntity => {
    const common = { idle: [0], move: [0], attack: [0], hurt: [3] };
    const front = view(stoop ? { ...common, stoop: [1, 2], ...(mid && { stoop_mid: [4] }) } : common);
    return { id, name: id, assetGroup, scale: 2, scaleUnit: 'metres', page: 0, directions: { front, back: view(common), left: view(common), right: view(common) } };
  };
  const frames = ['idle', 'bow', 'hold', 'hurt', 'mid'].map((name, i) => ({ source: `${name}.png`, sourceSha256: '', pixelSha256: '', width: 64, height: 64, bounds: [8, 4, 56, 62] as [number, number, number, number], page: 0, x: i * 70, y: 0 }));
  const manifest: ReviewedManifest = {
    format: 'seventy-steps-reviewed-atlas-v1', entityCount: 2, frameCount: frames.length,
    pages: [{ file: 'page.png', width: 512, height: 128, sha256: '' }], frames,
    entities: { ghatanothoa: entity('ghatanothoa', 'bosses', true), deep_one: entity('deep_one', 'sprites', false) },
  };
  const atlas: SpriteAtlas = {
    width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3),
    reviewed: { manifest, pages: [{} as HTMLImageElement] },
  };
  const g = createGame();
  const views = createCreatureViews(new THREE.Scene(), g, atlas);
  return { g, views };
}
const camera = (z: number): THREE.PerspectiveCamera => {
  const c = new THREE.PerspectiveCamera();
  c.position.set(0, 1.6, z);
  return c;
};

describe('a colossus that is stooped', () => {
  it('bows once and holds, until it stands again, and bows afresh the next time', () => {
    const { g, views } = viewsOver();
    const god = spawnCreature(g, 'ghatanothoa', { x: 0, z: 0, yaw: 0 })!;
    const state = (time: number, from = camera(12)) => {
      views.update(1, time, from);
      const [f] = views.debugFrames();
      return [f.state, f.frame, f.source];
    };
    expect(state(10)).toEqual(['idle', 0, 'idle.png']);

    g.ecs.c.actor.get(god)!.move = 'stagger'; // reeling: its head is down (hurt.ts)
    expect(state(20)).toEqual(['stoop', 0, 'bow.png']);
    expect(state(20 + FEEDBACK.bowSeconds / 2)).toEqual(['stoop', 0, 'bow.png']);
    expect(state(20 + FEEDBACK.bowSeconds + 0.01)).toEqual(['stoop', 1, 'hold.png']);
    expect(state(40)).toEqual(['stoop', 1, 'hold.png']); // held, not repeated

    g.ecs.c.actor.get(god)!.move = null;
    expect(state(41)).toEqual(['idle', 0, 'idle.png']);
    g.ecs.c.actor.get(god)!.move = 'stagger';
    expect(state(50)).toEqual(['stoop', 0, 'bow.png']);
  });

  it('comes down through its halfway pose, bows and holds, and stands up through it again', () => {
    const { g, views } = viewsOver(true);
    const god = spawnCreature(g, 'ghatanothoa', { x: 0, z: 0, yaw: 0 })!;
    const state = (time: number) => {
      views.update(1, time, camera(12));
      const [f] = views.debugFrames();
      return [f.state, f.frame, f.source];
    };
    expect(state(10)).toEqual(['idle', 0, 'idle.png']);
    g.ecs.c.actor.get(god)!.move = 'stagger';
    expect(state(20)).toEqual(['stoop_mid', 0, 'mid.png']); // its head comes down through the halfway pose,
    expect(state(20 + FEEDBACK.midSeconds / 2)).toEqual(['stoop_mid', 0, 'mid.png']);
    expect(state(20 + FEEDBACK.midSeconds + 0.01)).toEqual(['stoop', 0, 'bow.png']); // bows,
    expect(state(20 + FEEDBACK.midSeconds + FEEDBACK.bowSeconds + 0.01)).toEqual(['stoop', 1, 'hold.png']); // and holds
    expect(state(40)).toEqual(['stoop', 1, 'hold.png']);
    g.ecs.c.actor.get(god)!.move = null;
    expect(state(41)).toEqual(['stoop_mid', 0, 'mid.png']); // then comes up through the halfway pose,
    expect(state(41 + FEEDBACK.riseSeconds / 2)).toEqual(['stoop_mid', 0, 'mid.png']);
    expect(state(41 + FEEDBACK.riseSeconds + 0.01)).toEqual(['idle', 0, 'idle.png']); // and is on its feet
    g.ecs.c.actor.get(god)!.move = 'stagger';
    expect(state(50)).toEqual(['stoop_mid', 0, 'mid.png']); // and does it again the next time
  });

  it('without the halfway pose, bows at once and stands at once, as before', () => {
    const { g, views } = viewsOver(false);
    const god = spawnCreature(g, 'ghatanothoa', { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.actor.get(god)!.move = 'stagger';
    views.update(1, 20, camera(12));
    expect(views.debugFrames()[0]).toMatchObject({ state: 'stoop', frame: 0 });
    g.ecs.c.actor.get(god)!.move = null;
    views.update(1, 20.01, camera(12));
    expect(views.debugFrames()[0].state).toBe('idle');
  });

  it('is stooped from beside it or behind it too, by the front pose', () => {
    const { g, views } = viewsOver();
    const god = spawnCreature(g, 'ghatanothoa', { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.actor.get(god)!.move = 'stagger';
    views.update(1, 5, camera(-12)); // from behind it
    expect(views.debugFrames()[0]).toMatchObject({ direction: 'back', state: 'stoop', source: 'bow.png' });
  });

  it('is stooped after a blow of its own, for its recovery and a little after', () => {
    const { g, views } = viewsOver();
    const god = spawnCreature(g, 'ghatanothoa', { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.fight.set(god, { stoopUntil: g.frame + 30 } as unknown as Fight); // the one field the stoop reads
    views.update(1, 5, camera(12));
    expect(views.debugFrames()[0].state).toBe('stoop');
    g.frame += 31;
    views.update(1, 6, camera(12));
    expect(views.debugFrames()[0].state).toBe('idle');
  });

  it('shows its hurt art as before where there is no stoop art', () => {
    const { g, views } = viewsOver();
    const deep = spawnCreature(g, 'deep_one', { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.actor.get(deep)!.move = 'stagger';
    views.update(1, 5, camera(12));
    expect(views.debugFrames()[0]).toMatchObject({ state: 'hurt', source: 'hurt.png' });
  });
});
