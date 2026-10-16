import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { ENTITIES } from '../src/data/registry';
import { BOSS, LAUDANUM, SANITY, SIM, UPGRADES } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { strike } from '../src/systems/combat';
import type { Game } from '../src/systems/components';
import { createGame } from '../src/systems/game';
import { loseSanity, sanitySystem, setSanity } from '../src/systems/sanity';
import { specialSystem } from '../src/systems/specials';
import { place } from './helpers';

/** Script only the mind: full melee aura, no upgrades, no passive mending or unscripted boss attacks. */
function pressure(id: string) {
  const g = createGame({ creature: id });
  const boss = [...g.ecs.c.model].find(([, model]) => model === `creature:${id}`)![0];
  g.mind.fought = Infinity;
  Object.assign(g.ecs.c.brain.get(boss)!, { state: 'engage', target: g.player.id });
  place(g, boss, 0, 0, 0);
  place(g, g.player.id, 0, g.ecs.c.body.get(boss)!.radius + 1, Math.PI);
  loseSanity(g, SANITY.firstSight[g.ecs.c.dread.get(boss)!.tier]);
  return { g, boss };
}

function seconds(g: Game, n: number): void {
  for (let frame = 0; frame < Math.round(n * SIM.hz); frame++) {
    g.frame++;
    sanitySystem(g, 1 / SIM.hz);
  }
}

/** Deliver the dose at its actual swallow frame without advancing unrelated combat systems. */
function drink(g: Game): void {
  const actor = g.ecs.c.actor.get(g.player.id)!;
  startMove(actor, 'drink');
  actor.frame = actor.moves.drink.item!;
  sanitySystem(g, 0);
  actor.move = null;
}

const hit = (g: Game, boss: Entity): void => {
  g.events.emit('Hit', { attacker: boss, target: g.player.id, outcome: 'hit', damage: 1 });
};

describe('boss sanity pressure leaves time to fight', () => {
  it.each([
    ['colour_out_of_space', 70],
    ['father_dagon', 54],
    ['other_gods', 46],
    ['yog_sothoth', 28],
  ] as const)('%s: a minute in its full aura, including first sight, leaves %d sanity without Resolve or a dose', (id, remaining) => {
    const { g } = pressure(id);
    seconds(g, 60);
    expect(g.mind.sanity).toBeCloseTo(remaining, 5);
    expect(g.mind.band).not.toBe('unmoored');
  });

  it('every scripted boss leaves at least 28 sanity after first sight and a minute of its full passive aura', () => {
    for (const def of Object.values(ENTITIES).filter((d) => d.bossScript)) {
      const { g } = pressure(def.id);
      seconds(g, 60);
      expect(g.mind.sanity, def.id).toBeGreaterThanOrEqual(28 - 1e-8);
      expect(g.mind.sanity, def.id).toBeLessThan(100);
    }
  });

  it('one dose supports two minutes against the Other Gods with three hits and two roars, without Resolve', () => {
    const { g, boss } = pressure('other_gods');
    const actor = g.ecs.c.actor.get(boss)!;
    for (let second = 0; second < 120; second++) {
      if ([20, 45, 100].includes(second)) hit(g, boss);
      if ([30, 90].includes(second)) {
        const roar = actor.moves.roar.sanity!;
        startMove(actor, 'roar');
        // Each active frame takes its share of one roar; the rest of this second is passive aura.
        for (let frame = roar.window[0]; frame < roar.window[1]; frame++) {
          actor.frame = frame;
          g.frame++;
          sanitySystem(g, 1 / SIM.hz);
        }
        actor.move = null;
        seconds(g, 1 - (roar.window[1] - roar.window[0]) / SIM.hz);
      } else {
        if (second === 60) drink(g);
        seconds(g, 1);
      }
      expect(g.mind.band, `second ${second}`).not.toBe('unmoored');
    }
    expect(g.mind.sanity).toBeCloseTo(28, 4);
  });

  it('Resolve still reduces auras, landed blows and roars by its full advertised share', () => {
    const remaining = (resolve: number): number => {
      const { g, boss } = pressure('other_gods');
      setSanity(g, 100);
      g.mind.upgrades.resolve = resolve;
      hit(g, boss);
      startMove(g.ecs.c.actor.get(boss)!, 'roar');
      const actor = g.ecs.c.actor.get(boss)!;
      const roar = actor.moves.roar.sanity!;
      for (let frame = roar.window[0]; frame < roar.window[1]; frame++) {
        actor.frame = frame;
        sanitySystem(g, 1 / SIM.hz);
      }
      actor.move = null;
      seconds(g, 10);
      return g.mind.sanity;
    };
    expect(100 - remaining(UPGRADES.resolve.max)).toBeCloseTo((100 - remaining(0)) * (1 - UPGRADES.resolve.max * UPGRADES.resolve.resist!), 5);
  });
});

describe('Laudanum protects against every recurring sanity attack', () => {
  it('stops a landed blow taking sanity while health damage still applies, then expires', () => {
    const { g, boss } = pressure('other_gods');
    setSanity(g, 40);
    drink(g);
    const sanity = g.mind.sanity;
    const health = g.ecs.c.health.get(g.player.id)!;
    const before = health.hp;
    const blow = { damage: 1, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false };
    strike(g, boss, g.player.id, blow);
    expect(health.hp).toBeLessThan(before);
    expect(g.mind.sanity).toBe(sanity);
    seconds(g, LAUDANUM.steady);
    expect(g.player.steady).toBe(0);
    expect(g.mind.sanity).toBe(sanity);
    strike(g, boss, g.player.id, blow);
    expect(g.mind.sanity).toBe(sanity - g.ecs.c.dread.get(boss)!.blow * SANITY.attackScale);
  });

  it('prevents a near-full gaze from bursting and lets its buildup decay during protection', () => {
    const { g, boss } = pressure('hastur');
    const actor = g.ecs.c.actor.get(boss)!;
    startMove(actor, 'gaze');
    actor.frame = actor.moves.gaze.effect!.window[0];
    const bursts: number[] = [];
    g.events.on('GazeBurst', ({ sanity }) => bursts.push(sanity));
    g.reality.gaze = 1 - BOSS.gazeRate / 2;
    g.player.steady = 1;
    const sanity = g.mind.sanity;
    specialSystem(g);
    expect(bursts).toEqual([]);
    expect(g.reality.gaze).toBeLessThan(1 - BOSS.gazeRate / 2);
    expect(g.mind.sanity).toBe(sanity);
    g.player.steady = 0;
    specialSystem(g);
    expect(bursts).toEqual([BOSS.gazeSanity]);
    expect(g.mind.sanity).toBe(sanity - BOSS.gazeSanity);
    expect(g.ecs.c.actor.get(g.player.id)!.move).toBe('stagger');
  });
});
