import { describe, expect, it } from 'vitest';
import { JOURNEY_REFERENCE } from '../src/data/ngPlusTuning';
import { AZATHOTH, CTHULHU, REALITY } from '../src/data/tuning';
import { fightAction } from '../src/systems/fightActions';
import { applyLevels } from '../src/systems/levels';
import { lampsOf } from '../src/systems/reality';
import { bossGame, calm, engage } from './bossHelpers';
import { place, steps } from './helpers';
import { record } from './worldHelpers';

describe('special encounter objectives on every important journey', () => {
  for (const cycle of [0, 1, 2, 3, 7]) {
    it(`Cthulhu’s Alert finishes the encounter on NG+${cycle}`, () => {
      const b = bossGame('cthulhu');
      const { g, boss, fight } = b;
      g.player.cycle = cycle;
      Object.assign(g.player.levels, JOURNEY_REFERENCE);
      applyLevels(g);
      engage(b);
      calm(b);
      const h = g.ecs.c.health.get(boss)!;
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

    it(`Azathoth keeps the same survival duration and silence remains effective on NG+${cycle}`, () => {
      const b = bossGame('azathoth');
      const { g, boss } = b;
      g.player.cycle = cycle;
      applyLevels(g);
      engage(b);
      const deaths = record(g, 'Died');
      const hits = record(g, 'Hit');
      steps(g, AZATHOTH.survive - 2);
      expect(g.ecs.c.health.get(boss)!.hp).toBeGreaterThan(0);
      steps(g, 2);
      expect(deaths.some((d) => d.entity === boss)).toBe(true);
      expect(hits.filter((h) => h.attacker === boss)).toEqual([]);
      expect(g.ecs.c.health.get(g.player.id)!.hp).toBeGreaterThan(0); // ordinary sanity bleed can still occur
    });
  }

  it('keeps the Haunter’s passive lamplight damage proportional to its journey health growth', () => {
    const rates = [0, 7].map((cycle) => {
      const b = bossGame('haunter_of_the_dark');
      const { g, boss, fight } = b;
      g.player.cycle = cycle;
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
      return (before - h.hp) / h.max;
    });
    expect(rates[1]).toBeCloseTo(rates[0], 4);
  });
});
