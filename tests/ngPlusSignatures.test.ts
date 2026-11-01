import { describe, expect, it } from 'vitest';
import { JOURNEY_REFERENCE } from '../src/data/ngPlusTuning';
import { CTHULHU, REALITY } from '../src/data/tuning';
import { getEntity } from '../src/data/registry';
import { strike } from '../src/systems/combat';
import { spawnCreature } from '../src/systems/creatures';
import { fightAction } from '../src/systems/fightActions';
import { applyLevels } from '../src/systems/levels';
import { lampsOf } from '../src/systems/reality';
import { bossGame, calm, engage } from './bossHelpers';
import { place, steps } from './helpers';
import { deathblow, record } from './worldHelpers';

/** Spawn after choosing the journey, as in the actual world. */
function journeyBoss(id: string, cycle: number) {
  const b = bossGame(id);
  const { g } = b;
  const pos = g.ecs.c.transform.get(b.boss)!.pos;
  const at = { x: pos.x, z: pos.z, yaw: 0 };
  g.ecs.despawn(b.boss);
  g.player.cycle = cycle;
  const boss = spawnCreature(g, id, at)!;
  return { g, boss, fight: g.ecs.c.fight.get(boss)! };
}

describe('special encounter objectives on every important journey', () => {
  for (const cycle of [0, 1, 2, 3, 7]) {
    it(`Cthulhu’s Alert finishes the encounter on NG+${cycle}`, () => {
      const b = journeyBoss('cthulhu', cycle);
      const { g, boss, fight } = b;
      Object.assign(g.player.levels, JOURNEY_REFERENCE);
      applyLevels(g);
      engage(b);
      calm(b);
      const h = g.ecs.c.health.get(boss)!;
      expect(h.max).toBe(Math.round(getEntity('cthulhu')!.stats.hp * (cycle ? 1.1 + 0.05 * cycle : 1)));
      h.hp = h.max * 0.32;
      steps(g, 1);
      const ship = fight.props.find((e) => g.ecs.c.prop.get(e)?.kind === 'ship')!;
      expect(ship).toBeDefined();
      const p = g.ecs.c.transform.get(ship)!.pos;
      place(g, g.player.id, p.x, p.z, 0);
      expect(fightAction(g)?.label).toBe("take the Alert's helm");
      const deaths = record(g, 'Died');
      fightAction(g)!.run();
      steps(g, 600 + CTHULHU.burst);
      expect(deaths.some((d) => d.entity === boss)).toBe(true);
      expect(deaths.some((d) => d.entity === g.player.id)).toBe(false);
      expect(h.hp).toBe(0);
    });

    it(`Azathoth has journey-scaled health and can be defeated normally on NG+${cycle}`, () => {
      const b = journeyBoss('azathoth', cycle);
      const { g, boss } = b;
      applyLevels(g);
      engage(b);
      calm(b);
      const deaths = record(g, 'Died');
      const h = g.ecs.c.health.get(boss)!;
      expect(h.max).toBe(Math.round(getEntity('azathoth')!.stats.hp * (cycle ? 1.1 + 0.05 * cycle : 1)));
      steps(g, 600);
      expect(h.hp).toBe(h.max); // the old survival timer must not return
      expect(strike(g, g.player.id, boss, deathblow)).toBe('kill');
      expect(deaths.some((d) => d.entity === boss)).toBe(true);
    });
  }

  it('keeps the Haunter’s passive lamplight damage effective on later journeys', () => {
    const rates = [0, 7].map((cycle) => {
      const b = journeyBoss('haunter_of_the_dark', cycle);
      const { g, boss, fight } = b;
      Object.assign(g.player.levels, JOURNEY_REFERENCE);
      applyLevels(g);
      engage(b);
      calm(b);
      g.ecs.c.actor.get(boss)!.move = null; // do not let a previously chosen darkness move snuff this lamp
      const lamp = lampsOf(g, fight)[0];
      const p = g.ecs.c.transform.get(lamp)!.pos;
      place(g, boss, p.x, p.z, 0);
      const h = g.ecs.c.health.get(boss)!;
      h.hp = h.max * 0.8;
      const before = h.hp;
      steps(g, 60);
      expect(before - h.hp).toBeGreaterThanOrEqual(REALITY.lightBurn - 0.01);
      return before - h.hp;
    });
    expect(rates[1]).toBeCloseTo(rates[0], 4);
  });
});
