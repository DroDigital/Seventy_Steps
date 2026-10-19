import { describe, expect, it } from 'vitest';
import { LAUDANUM, SANITY, SIM } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import type { Game } from '../src/systems/components';
import { auraWeight, blowWeight, sanitySystem, setSanity, tonicShare } from '../src/systems/sanity';
import { scriptedGame } from './helpers';

/** The swallow, at its own frame, without the rest of the game's step. */
function swallow(g: Game): void {
  const actor = g.ecs.c.actor.get(g.player.id)!;
  startMove(actor, 'drink');
  actor.frame = actor.moves.drink.item!;
  sanitySystem(g, 0);
  actor.move = null;
}

describe('round 58: the tonic dulls the mind that takes it again soon', () => {
  it('a dose is whole, then weaker for each taken within the minute: three in a row are worth about two', () => {
    const { g } = scriptedGame();
    g.mind.fought = Infinity;
    const got: number[] = [];
    for (let i = 0; i < 3; i++) {
      setSanity(g, 0);
      swallow(g);
      got.push(g.mind.sanity);
      g.frame += 2 * SIM.hz;
    }
    expect(got[0]).toBeCloseTo(LAUDANUM.sanity, 5);
    expect(got[1]).toBeCloseTo(LAUDANUM.sanity * (1 - LAUDANUM.dull), 5);
    expect(got[2]).toBeCloseTo(LAUDANUM.sanity * Math.max(LAUDANUM.floor, 1 - 2 * LAUDANUM.dull), 5);
    expect(got[0] + got[1] + got[2]).toBeLessThan(2.1 * LAUDANUM.sanity);
    expect(got[0]).toBeGreaterThan(got[1]);
    expect(got[1]).toBeGreaterThan(got[2]);
    expect(got[2]).toBeGreaterThan(0); // never nothing: the floor
  });

  it('forgets after the window: a dose a minute on is whole again', () => {
    const { g } = scriptedGame();
    g.mind.fought = Infinity;
    swallow(g);
    swallow(g);
    expect(tonicShare(g)).toBeLessThan(1);
    g.frame += Math.ceil(LAUDANUM.window * SIM.hz) + 1;
    expect(tonicShare(g)).toBe(1);
    setSanity(g, 0);
    swallow(g);
    expect(g.mind.sanity).toBeCloseTo(LAUDANUM.sanity, 5);
  });

  it('says so when a dose is dulled, and not when it is whole', () => {
    const { g } = scriptedGame();
    const said: string[] = [];
    g.events.on('Notice', (e) => said.push(e.text));
    swallow(g);
    expect(said).toEqual([]);
    swallow(g);
    expect(said).toHaveLength(1);
  });

  it('three whole doses, taken as a fight asks, are a hundred and five: no longer a whole mind and more', () => {
    expect(LAUDANUM.doses * LAUDANUM.sanity).toBeLessThan(SANITY.max * 1.1);
    expect(LAUDANUM.sanity).toBeLessThanOrEqual(SANITY.max / 2.5);
  });
});

describe('round 58: the small and the middling weigh on the mind', () => {
  it('every tier from the lesser to the named takes more of its own numbers than before, the great horrors the same', () => {
    expect(blowWeight('lesser')).toBeGreaterThan(0.5);
    expect(blowWeight('greater')).toBeGreaterThan(0.5);
    expect(blowWeight('named')).toBeGreaterThan(0.5);
    expect(auraWeight('lesser')).toBeGreaterThan(0.6);
    expect(auraWeight('greater')).toBeGreaterThanOrEqual(1);
    expect(auraWeight('named')).toBeGreaterThanOrEqual(1);
    expect(blowWeight('great_old_one')).toBe(0.5);
    expect(blowWeight('outer_god')).toBe(0.5);
    expect(auraWeight('great_old_one')).toBe(1);
    expect(auraWeight('outer_god')).toBe(1);
  });

  it("a deep one's landed blow costs more than a point, and a fight with a few cost a real share of a dose", () => {
    const { g, deepOne } = scriptedGame();
    const d = g.ecs.c.dread.get(deepOne)!;
    const one = d.blow * blowWeight(d.tier);
    expect(one).toBeGreaterThan(1.5);
    expect(6 * one + 40 * d.aura * SANITY.auraScale * auraWeight(d.tier)).toBeGreaterThan(LAUDANUM.sanity * 0.3); // six blows and forty seconds near it
  });
});
