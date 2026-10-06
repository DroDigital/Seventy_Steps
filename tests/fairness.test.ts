import { describe, expect, it } from 'vitest';
import { ATTACKS } from '../src/data/attacks';
import { ENTITIES, paramsOf } from '../src/data/registry';
import { AI, BOSS } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { minionsOf, summon } from '../src/systems/specials';
import { spawnCreature } from '../src/systems/creatures';
import { run } from './worldHelpers';

/**
 * Round 45: what a person can be asked to react to. A new cue takes about a quarter of a second to read and a roll
 * a little over a third more to land, so no first blow comes sooner than 0.3 s, and what is shot at them is
 * read, aimed and let fly slowly enough to be rolled from, and not fired again at once, by one foe or a pack.
 */
describe('fair play', () => {
  const frames = (id: keyof typeof ATTACKS): number => ATTACKS[id].windup;
  const entries = Object.entries(ATTACKS) as [keyof typeof ATTACKS, (typeof ATTACKS)[keyof typeof ATTACKS]][];

  it('every melee blow that can open an attack shows itself for at least 0.3 s before it lands (a chained follow-up, for 0.2)', () => {
    for (const [id, a] of entries) {
      if (a.kind !== 'melee' || a.range[1] === 0) continue; // (range 0: only ever chained)
      expect(a.windup, id).toBeGreaterThanOrEqual(18);
    }
    expect(frames('combo_2')).toBeGreaterThanOrEqual(12);
  });

  it('every ranged blow is shown for at least 0.5 s, and its bolts can be outrun by a roll', () => {
    for (const [id, a] of entries) {
      if (a.kind !== 'ranged' || a.range[0] === 0 && a.range[1] <= 5) continue; // (a gust that shoves is not shot)
      expect(a.windup, id).toBeGreaterThanOrEqual(30);
      if (a.bolts) expect(a.bolts.speed, id).toBeLessThanOrEqual(13);
    }
    expect(frames('projectile')).toBeGreaterThanOrEqual(40);
    expect(frames('beam')).toBeGreaterThanOrEqual(50);
  });

  it('no common foe shoots, or lands a ranged blow of any kind, more than once every two seconds', () => {
    for (const d of ENTITIES) {
      if (d.tier === 'ally' || d.behavior.archetype === 'boss') continue;
      const p = paramsOf(d.behavior);
      for (const id of d.behavior.attacks ?? []) {
        const a = ATTACKS[typeof id === 'string' ? id : (id as { id: keyof typeof ATTACKS }).id];
        if (a.kind !== 'ranged' || !(a.bolts || a.shot)) continue;
        const cycle = a.windup + a.active + a.recovery + Math.max(p.cooldown[0], AI.rangedGap);
        expect(cycle / 60, `${d.id} ${String(id)}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('a pack takes its turns: a foe rests after a ranged blow, and another waits for a breath after it', () => {
    expect(AI.rangedGap).toBeGreaterThanOrEqual(90);
    expect(AI.volleyGap).toBeGreaterThanOrEqual(20);
  });

  it('the Elder Thing no longer swings and shoots as fast as a deep one', () => {
    const e = ENTITIES.find((d) => d.id === 'elder_thing')!;
    expect(paramsOf(e.behavior).cooldown[0]).toBeGreaterThanOrEqual(60);
  });

  it('a boss strikes no oftener than every 1.2 s, keeps two servants at most, and calls them no oftener than every 9 s', () => {
    expect(BOSS.gap[0]).toBeGreaterThanOrEqual(70);
    expect(BOSS.minions).toBeLessThanOrEqual(2);
    expect(BOSS.summonEvery).toBeGreaterThanOrEqual(540);
    expect(BOSS.servantDamage).toBeLessThan(1);
    const g = createWorldGame();
    const boss = spawnCreature(g, 'keziah_mason', { x: 3000, z: 3000, yaw: 0 })!;
    for (let i = 0; i < 5; i++) summon(g, boss, 'rat_swarm');
    run(g, 2);
    expect(minionsOf(g, boss).length).toBeLessThanOrEqual(2);
  });
});
