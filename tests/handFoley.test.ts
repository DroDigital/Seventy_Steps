import { describe, expect, it } from 'vitest';
import { HAND_FRAMES } from '../src/data/foleySounds';
import { createFoley } from '../src/render/audio/foley';
import type { Sampler } from '../src/render/audio/sampler';
import { createWorldGame } from '../src/systems/game';
import { spawnPool } from '../src/systems/hazards';

const sampler: Sampler = { load: async () => undefined, buffer: () => null, settled: () => true, forget: () => undefined, play: () => true };
const place = (): { gain: number; pan: number } => ({ gain: 1, pan: 0 });

function rig() {
  const g = createWorldGame();
  const heard: { key: string; frame: number; at: unknown }[] = [];
  let frame = 0;
  const foley = createFoley(g, sampler, (key, _s, o) => (heard.push({ key, frame, at: o?.at }), true));
  const a = g.ecs.c.actor.get(g.player.id)!;
  let seconds = 0;
  /** One step: the move at `f` (or free), then the foley. */
  const step = (move: string | null, f = 0): void => {
    a.move = move;
    a.frame = f;
    frame = f;
    seconds += 1 / 60;
    foley.update(seconds, place, () => undefined);
  };
  return { g, a, heard, step, run: (move: string, frames: number) => { for (let f = 0; f <= frames; f++) step(move, f); step(null); } };
}

describe("the investigator's hands are heard on their moves' own frames (round 40)", () => {
  it('a draught: the swallow at its frame, once', () => {
    const r = rig();
    r.run('drink', 60);
    expect(r.heard.filter((h) => h.key === 'hands:swallow').map((h) => h.frame)).toEqual([HAND_FRAMES.drink.swallow]);
  });

  it('the Reagent: the needle, then the plunger; a flask: the glug, then the lob; a guard: the lift at once', () => {
    const inject = rig();
    inject.run('inject', 64);
    expect(inject.heard.map((h) => [h.key, h.frame])).toEqual([['hands:needle', HAND_FRAMES.inject.needle], ['hands:plunger', HAND_FRAMES.inject.plunger]]);
    const lob = rig();
    lob.run('throw', 40);
    expect(lob.heard.map((h) => [h.key, h.frame])).toEqual([['hands:glug', HAND_FRAMES.throw.glug], ['hands:lob', HAND_FRAMES.throw.lob]]);
    const guard = rig();
    guard.run('parry', 36);
    expect(guard.heard.map((h) => [h.key, h.frame])).toEqual([['hands:guard', 0]]);
  });

  it('no sound for a move that has none of these, and none twice for one move run on', () => {
    const r = rig();
    r.run('light1', 40);
    expect(r.heard.length).toBe(0);
    r.run('drink', 60);
    r.run('drink', 60);
    expect(r.heard.filter((h) => h.key === 'hands:swallow').length).toBe(2); // once a draught
  });

  it('an arm taken up is heard, an arm reinforced rings, a knee bent and risen from sounds both; the first look says nothing', () => {
    const r = rig();
    r.step(null);
    expect(r.heard.length).toBe(0);
    const other = Object.keys(r.g.player.reinforced).find((w) => w !== r.g.player.weapon)!;
    r.g.player.weapon = other as never;
    r.step(null);
    expect(r.heard.map((h) => h.key)).toEqual(['hands:equip']);
    r.g.player.reinforced[other as never]++;
    r.step(null);
    expect(r.heard.at(-1)?.key).toBe('hands:anvil');
    r.g.player.kneeling = { x: 0, z: 0 };
    r.step(null);
    expect(r.heard.at(-1)?.key).toBe('hands:kneel');
    r.g.player.kneeling = null;
    r.step(null);
    expect(r.heard.at(-1)?.key).toBe('hands:rise');
    r.step(null);
    expect(r.heard.filter((h) => h.key === 'hands:rise').length).toBe(1);
  });

  it('a flask of oil bursts where it lands, once; a horror\'s spill is a splat, not a burst', () => {
    const r = rig();
    r.step(null);
    const at = { x: 3, z: 4 };
    spawnPool(r.g, r.g.player.id, 'player', at, { radius: 1.9, life: 300, tick: 20, damage: 9, fire: true });
    r.step(null);
    r.step(null);
    const bursts = r.heard.filter((h) => h.key === 'hands:burst');
    expect(bursts.length).toBe(1);
    expect((bursts[0].at as { x: number; z: number }).x).toBe(3);
    spawnPool(r.g, r.g.player.id, 'enemy', at, { radius: 1.9, life: 300, tick: 20, damage: 9 });
    r.step(null);
    expect(r.heard.filter((h) => h.key === 'hands:burst').length).toBe(1);
  });
});
