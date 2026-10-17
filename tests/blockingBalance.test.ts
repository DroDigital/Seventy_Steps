import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { PLAYER_MOVES, REACTIONS } from '../src/data/moves';
import { LEVELS, SANITY, SIM, STAMINA } from '../src/data/tuning';
import { createActor } from '../src/systems/actions';
import { resolveHit, strike, type Blow, type Defender } from '../src/systems/combat';
import { stepGame } from '../src/systems/game';
import { conjure } from '../src/systems/hallucinations';
import { applyLevels, staminaRegen } from '../src/systems/levels';
import { setSanity } from '../src/systems/sanity';
import { absorb, spend, tickStamina } from '../src/systems/stamina';
import { place, scriptedGame, steps } from './helpers';

const dt = 1 / SIM.hz;
const guard = { ...emptyInput(), held: { ...emptyInput().held, block: true } };
const blow: Blow = { damage: 80, poise: 999, guard: 40, hitstop: 0, parryable: false, interrupts: false };

function defender(stamina: number): Defender & { stamina: NonNullable<Defender['stamina']> } {
  const actor = createActor(PLAYER_MOVES);
  actor.guard = true;
  return {
    actor,
    health: { hp: 200, max: 200, immortal: false, calm: 0 },
    poise: { value: 1, max: 1, calm: 0 },
    stamina: { value: stamina, max: 100, delay: 0 },
  };
}

describe('blocking recovery balance', () => {
  it.each([
    { endurance: 0, unmoored: false },
    { endurance: LEVELS.endurance.max, unmoored: false },
    { endurance: 0, unmoored: true },
    { endurance: LEVELS.endurance.max, unmoored: true },
  ])('recovers 35% while guarding with Endurance $endurance, Unmoored $unmoored', ({ endurance, unmoored }) => {
    const { g, player } = scriptedGame();
    g.player.levels.endurance = endurance;
    applyLevels(g);
    setSanity(g, unmoored ? 5 : SANITY.max);
    const s = g.ecs.c.stamina.get(player)!;
    s.value = 10;
    s.delay = 0;
    const recovered = staminaRegen(endurance) * dt * 20 * (unmoored ? SANITY.unmoored.stamina : 1);

    expect(STAMINA.guardRegen).toBe(0.35);
    steps(g, 20, guard);
    expect(g.ecs.c.actor.get(player)!.guard).toBe(true);
    expect(s.value).toBeCloseTo(10 + recovered * 0.35, 6);

    const before = s.value;
    steps(g, 20);
    expect(g.ecs.c.actor.get(player)!.guard).toBe(false);
    expect(s.value - before).toBeCloseTo(recovered, 6);
  });

  it('a block cannot shorten the recovery delay of a preceding action', () => {
    const s = { value: 100, max: 100, delay: 0 };
    spend(s, 14);
    tickStamina(s, 'idle', dt);
    const remaining = s.delay;
    expect(remaining).toBeGreaterThan(STAMINA.guardDelay);
    expect(absorb(s, 10)).toBe(false);
    expect(s.delay).toBe(remaining);
    const before = s.value;
    for (let i = 0; i < remaining; i++) tickStamina(s, 'guard', dt);
    expect(s.value).toBe(before);
    tickStamina(s, 'guard', dt);
    expect(s.value).toBeCloseTo(before + STAMINA.regen * dt * 0.35, 6);
  });

  it('recovers nothing throughout the guard-break reaction, then resumes at the held guard rate', () => {
    const { g, player, dummy } = scriptedGame();
    place(g, player, 0, 1.3, Math.PI);
    place(g, dummy, 0, 0, 0);
    stepGame(g, guard);
    const a = g.ecs.c.actor.get(player)!;
    const s = g.ecs.c.stamina.get(player)!;
    s.value = blow.guard * STAMINA.guardCost / 2;
    s.delay = 0;
    expect(strike(g, dummy, player, blow)).toBe('guardBreak');
    expect(a.move).toBe('guardBreak');
    expect(s.value).toBe(0);

    steps(g, STAMINA.guardDelay, guard);
    expect(s.delay).toBe(0);
    expect(s.value).toBe(0);
    steps(g, REACTIONS.guardBreak.frames - STAMINA.guardDelay - 1, guard);
    expect(a.move).toBe('guardBreak');
    expect(a.frame).toBe(REACTIONS.guardBreak.frames - 1);
    expect(a.guard).toBe(false);
    expect(s.value).toBe(0);

    stepGame(g, guard);
    expect(a.move).toBeNull();
    expect(a.guard).toBe(true);
    expect(s.value).toBeCloseTo(staminaRegen(0) * dt * 0.35, 6);
    const before = s.value;
    stepGame(g, emptyInput());
    expect(s.value - before).toBeCloseTo(staminaRegen(0) * dt, 6);
  });
});

describe('a block absorbs only the stamina-funded share of its blow', () => {
  it('a phantom cannot break an empty guard or reset its recovery delay', () => {
    const { g, player } = scriptedGame();
    place(g, player, 0, 1.3, Math.PI);
    setSanity(g, 10);
    const s = g.ecs.c.stamina.get(player)!;
    s.value = 0;
    s.delay = 8;
    stepGame(g, guard);
    const phantom = conjure(g)!;
    place(g, phantom, 0, 0, 0);
    const before = { ...s };
    const hp = g.ecs.c.health.get(player)!.hp;

    expect(strike(g, phantom, player, blow)).toBe('blocked');
    expect(s).toEqual(before);
    expect(s.value).toBe(0);
    expect(g.ecs.c.health.get(player)!.hp).toBe(hp);
    expect(g.ecs.c.actor.get(player)!.move).toBeNull();
    expect(g.ecs.c.actor.get(player)!.guard).toBe(true);
  });

  const cases = [16, 80].flatMap((guardDamage) => [
    { fraction: 1.25, leak: 0 },
    { fraction: 1, leak: 0 },
    { fraction: 0.25, leak: 0.75 },
    { fraction: 0.01, leak: 0.99 },
    { fraction: 0, leak: 1 },
  ].map((c) => ({ ...c, guardDamage })));

  it.each(cases)('guard damage $guardDamage, funded fraction $fraction leaks $leak of HP damage', ({ guardDamage, fraction, leak }) => {
    const cost = guardDamage * STAMINA.guardCost;
    const d = defender(cost * fraction);
    const result = resolveHit(d, { ...blow, guard: guardDamage }, true);
    expect(result.outcome).toBe(fraction > 1 ? 'blocked' : 'guardBreak');
    expect(result.damage).toBeCloseTo(blow.damage * leak, 6);
    expect(d.health.hp).toBeCloseTo(200 - blow.damage * leak, 6);
    expect(d.stamina.value).toBeCloseTo(Math.max(0, cost * (fraction - 1)), 6);
    expect(d.stamina.delay).toBe(STAMINA.guardDelay);
    if (fraction <= 1) {
      expect(d.actor.move).toBe('guardBreak'); // even this blow's overwhelming poise damage cannot replace it with stagger
      expect(d.actor.frame).toBe(0);
      expect(d.actor.guard).toBe(false);
      expect(d.actor.moves.guardBreak.frames).toBeGreaterThan(d.actor.moves.stagger.frames);
    }
  });

  it('lethal overflow kills instead of leaving the defender in guard break', () => {
    const d = defender(blow.guard * STAMINA.guardCost / 4);
    d.health.hp = 10;
    expect(resolveHit(d, blow, true)).toEqual({ outcome: 'kill', damage: 60 });
    expect(d.health.hp).toBe(0);
    expect(d.actor.move).toBe('death');
  });

  it.each([
    { frontal: false, unblockable: false },
    { frontal: true, unblockable: true },
  ])('rear or unblockable blows bypass the guard without spending stamina: $frontal, $unblockable', ({ frontal, unblockable }) => {
    const d = defender(100);
    expect(resolveHit(d, { ...blow, unblockable }, frontal).damage).toBe(blow.damage);
    expect(d.health.hp).toBe(200 - blow.damage);
    expect(d.stamina.value).toBe(100);
    expect(d.stamina.delay).toBe(0);
    expect(d.actor.move).not.toBe('guardBreak');
  });
});
