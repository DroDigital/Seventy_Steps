import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getEntity, variantOf } from '../src/data/registry';
import { createCreatureViews } from '../src/render/creatureViews';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';
import { fightSystem, resetFight } from '../src/systems/bossFight';
import { bodyOf } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';
import { parseSave, snapshot } from '../src/systems/save';
import { worldLayout } from '../src/world/placements';
import { bossGame, calm, engage } from './bossHelpers';
import { goTo, record, run, slay } from './worldHelpers';

const pack = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;
const atlas: SpriteAtlas = {
  width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3),
  reviewed: { manifest: pack, pages: pack.pages.map(() => ({}) as HTMLImageElement) },
};
const model = 'creature:high_priest#eldritch';

describe('the High Priest reveals its true form in phase two', () => {
  it('binds the approved eldritch art in phases two and three, from every direction and during every pose', () => {
    const b = bossGame('high_priest');
    const { g, boss, fight } = b;
    const views = createCreatureViews(new THREE.Scene(), g, atlas);
    const camera = new THREE.PerspectiveCamera();
    const actor = g.ecs.c.actor.get(boss)!;
    const tr = g.ecs.c.transform.get(boss)!;
    const h = g.ecs.c.health.get(boss)!;
    engage(b);
    calm(b);
    expect(g.ecs.c.model.get(boss)).toBe('creature:high_priest');

    for (const [fraction, phase] of [[0.49, 1], [0.19, 2]]) {
      h.hp = h.max * fraction;
      fightSystem(g);
      expect(fight.phase).toBe(phase);
      expect(g.ecs.c.model.get(boss)).toBe(model);
      expect(h.hp / h.max).toBeCloseTo(fraction);
      expect(g.ecs.c.body.get(boss)).toMatchObject(bodyOf(variantOf(getEntity('high_priest')!, 'eldritch')!));
      expect(g.ecs.c.brain.get(boss)!.def.attacks.map(a => a.move)).toContain(phase === 1 ? 'dream_cloud' : 'sweep_beam');

      for (const [direction, x, z] of [['front', 0, 8], ['left', 8, 0], ['back', 0, -8], ['right', -8, 0]] as const) {
        camera.position.set(tr.pos.x + x, tr.pos.y + 1.6, tr.pos.z + z);
        for (const move of [null, 'evade', phase === 1 ? 'dream_cloud' : 'sweep_beam', 'stagger'] as const) {
          actor.move = move;
          actor.frame = 10;
          views.update(1, 5, camera);
          const drawn = views.debugFrames().find(frame => frame.id === boss);
          expect(drawn, `${phase}/${direction}/${move}`).toMatchObject({ key: 'high_priest#eldritch', direction });
          expect(drawn!.source).toMatch(/^sprites\/high_priest\/eldritch\/64x64\//);
          expect(views.painted.has(boss)).toBe(true);
        }
      }
    }
  });

  it('stays revealed when sanity recovers, and resumes sanity swaps after a reset', () => {
    const b = bossGame('high_priest');
    const { g, boss, fight } = b;
    engage(b);
    const h = g.ecs.c.health.get(boss)!;
    h.hp *= 0.49;
    fightSystem(g);
    for (const sanity of [20, 100]) {
      setSanity(g, sanity);
      expect(g.ecs.c.model.get(boss)).toBe(model);
    }
    resetFight(g, boss, fight);
    expect(g.ecs.c.model.get(boss)).toBe('creature:high_priest');
    expect(h.hp / h.max).toBeCloseTo(0.49);
    setSanity(g, 20);
    expect(g.ecs.c.model.get(boss)).toBe(model);
    setSanity(g, 100);
    expect(g.ecs.c.model.get(boss)).toBe('creature:high_priest');
    engage(b);
    expect(fight.phase).toBe(1);
    expect(g.ecs.c.model.get(boss)).toBe(model);
  });

  it('keeps an explicitly requested eldritch preview through resets', () => {
    const { g, boss, fight } = bossGame('high_priest', 'eldritch');
    resetFight(g, boss, fight);
    setSanity(g, 100);
    expect(g.ecs.c.model.get(boss)).toBe(model);
  });

  it('restores the masked first phase when the investigator respawns', () => {
    const b = bossGame('high_priest');
    const { g, boss, fight } = b;
    engage(b);
    calm(b);
    const h = g.ecs.c.health.get(boss)!;
    h.hp *= 0.19;
    fightSystem(g);
    expect(g.ecs.c.model.get(boss)).toBe(model);
    const respawned = record(g, 'Respawned');
    slay(g, boss);
    for (let i = 0; i < 400 && respawned.length === 0; i++) run(g, 1);
    expect(respawned).toHaveLength(1);
    expect(fight.phase).toBe(0);
    expect(fight.engaged).toBe(false);
    expect(h.hp).toBe(h.max);
    expect(g.ecs.c.model.get(boss)).toBe('creature:high_priest');
  });

  it('reveals the wounded phase again after a world save is reloaded', () => {
    const g = createWorldGame();
    const spawn = worldLayout().spawns.find(s => s.id === 'boss:high_priest')!;
    goTo(g, spawn.at.x, spawn.at.z + 4);
    run(g, 1);
    const boss = g.overworld!.alive.get(spawn.id)!;
    expect(boss).toBeDefined();
    const h = g.ecs.c.health.get(boss)!;
    h.hp = h.max * 0.19;
    const saved = parseSave(JSON.stringify(snapshot(g)))!;
    const loaded = createWorldGame({ save: saved });
    run(loaded, 1);
    const back = loaded.overworld!.alive.get(spawn.id)!;
    expect(back).toBeDefined();
    const health = loaded.ecs.c.health.get(back)!;
    expect(health.hp / health.max).toBeCloseTo(0.19);
    Object.assign(loaded.ecs.c.brain.get(back)!, { state: 'engage', target: loaded.player.id });
    fightSystem(loaded);
    expect(loaded.ecs.c.fight.get(back)!.phase).toBe(2);
    expect(loaded.ecs.c.model.get(back)).toBe(model);
    expect(health.hp / health.max).toBeCloseTo(0.19);
  });
});
