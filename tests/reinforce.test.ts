import { describe, expect, it } from 'vitest';
import { ENTITIES, variantOf } from '../src/data/registry';
import { LEVELS, REINFORCE, STAR_STONES } from '../src/data/tuning';
import { WEAPONS } from '../src/data/weapons';
import { canReinforce, edge, edgeAt, movable, moveLevels, reinforce, reinforceCost, stonesOf, stonesOfSlain } from '../src/systems/arms';
import { createWorldGame } from '../src/systems/game';
import { snapshot } from '../src/systems/save';
import { spawnCreature } from '../src/systems/creatures';
import { place, press, scriptedGame, steps } from './helpers';

describe('reinforcing arms with star-stones (round 12)', () => {
  it('each level costs its stones, adds its share, and stops at the most', () => {
    expect(REINFORCE.cost).toHaveLength(REINFORCE.max);
    const { g } = scriptedGame();
    g.player.stones = REINFORCE.cost.reduce((a, b) => a + b, 0);
    for (let n = 0; n < REINFORCE.max; n++) {
      expect(reinforceCost(g, 'cane')).toBe(REINFORCE.cost[n]);
      expect(reinforce(g, 'cane')).toBe(true);
    }
    expect(g.player.stones).toBe(0);
    expect(g.player.reinforced.cane).toBe(REINFORCE.max);
    expect(reinforceCost(g, 'cane')).toBeUndefined();
    g.player.stones = 99;
    expect(reinforce(g, 'cane')).toBe(false); // at the most
    expect(canReinforce(g, 'axe')).toBe(false); // not theirs
    expect(edge(g, g.player.id)).toBeCloseTo(edgeAt(REINFORCE.max));
  });

  it('refuses when short of stones', () => {
    const { g } = scriptedGame();
    expect(reinforce(g, 'cane')).toBe(false);
    expect(g.player.reinforced.cane).toBe(0);
  });

  it("a reinforced weapon's blows land harder; no one else's do", () => {
    const hitFor = (level: number): number => {
      const s = scriptedGame();
      s.g.player.reinforced.cane = level;
      place(s.g, s.player, 0, 1.2, Math.PI);
      place(s.g, s.dummy, 0, 0, 0);
      const h = s.g.ecs.c.health.get(s.dummy)!;
      const before = h.hp;
      steps(s.g, 1, press('light'));
      steps(s.g, 30);
      expect(edge(s.g, s.dummy)).toBe(1);
      return before - h.hp;
    };
    const base = WEAPONS.cane.moves.light1!.hit!.damage;
    expect(hitFor(0)).toBe(base);
    expect(hitFor(3)).toBe(Math.round(base * edgeAt(3)));
  });

  it('a boss slain for good leaves star-stones by its tier, once', () => {
    const g = createWorldGame();
    const boss = spawnCreature(g, 'keziah_mason', { x: 0, z: 0, yaw: 0 })!;
    g.events.emit('Vanquished', { entity: boss, name: 'Keziah Mason' });
    expect(g.player.stones).toBe(STAR_STONES.named);
    expect(stonesOf('cthulhu')).toBe(STAR_STONES.great_old_one);
    expect(stonesOf('azathoth')).toBe(STAR_STONES.outer_god);
    expect(stonesOf('deep_one')).toBe(0);
  });

  it("an older save is paid the stones its slain bosses would have left", () => {
    const g = createWorldGame();
    const old = { ...snapshot(g), slain: ['boss:keziah_mason', 'boss:cthulhu', 'cave:1'] } as Record<string, unknown>;
    delete old.stones;
    delete old.reinforced;
    const loaded = createWorldGame({ save: old as never });
    expect(loaded.player.stones).toBe(stonesOfSlain(['boss:keziah_mason', 'boss:cthulhu']));
    expect(loaded.player.stones).toBe(STAR_STONES.named! + STAR_STONES.great_old_one!);
    expect(loaded.player.reinforced.cane).toBe(0);
  });

  it('boss health sits within a soulslike reach of the investigator\'s blows (round 12: 73 to 910 light cane blows)', () => {
    const cane = WEAPONS.cane.moves.light1!.hit!.damage;
    const most = cane * (1 + LEVELS.might.max * LEVELS.might.damage!) * edgeAt(REINFORCE.max);
    const bosses = ENTITIES.flatMap((d) => [d, variantOf(d, 'boss')]).filter((d) => d?.bossScript);
    expect(bosses.length).toBeGreaterThan(40);
    for (const d of bosses) expect(d!.stats.hp / most, d!.id).toBeLessThanOrEqual(90);
    const keziah = ENTITIES.find((d) => d.id === 'keziah_mason')!;
    expect(keziah.stats.hp / cane).toBeLessThanOrEqual(35); // the first boss on the main line, with nothing bought
  });
});

describe('moving reinforcement from one weapon to another (an Elder Sign)', () => {
  const armed = () => {
    const { g } = scriptedGame();
    g.player.arms.push('rapier', 'axe');
    g.player.reinforced.cane = 4;
    return g;
  };

  it('moves levels whole, none lost and none made', () => {
    const g = armed();
    const total = () => Object.values(g.player.reinforced).reduce((a, b) => a + b, 0);
    const before = total();
    expect(moveLevels(g, 'cane', 'rapier')).toBe(1);
    expect([g.player.reinforced.cane, g.player.reinforced.rapier]).toEqual([3, 1]);
    expect(moveLevels(g, 'cane', 'rapier', 99)).toBe(3); // all that is left, and it fits
    expect([g.player.reinforced.cane, g.player.reinforced.rapier]).toEqual([0, 4]);
    expect(total()).toBe(before);
    expect(moveLevels(g, 'rapier', 'cane', 4)).toBe(4); // and back again, for nothing
    expect(g.player.reinforced.cane).toBe(4);
  });

  it('stops where the other weapon is full', () => {
    const g = armed();
    g.player.reinforced.rapier = REINFORCE.max - 1;
    expect(movable(g, 'cane', 'rapier')).toBe(1);
    expect(moveLevels(g, 'cane', 'rapier', 3)).toBe(1);
    expect(g.player.reinforced.rapier).toBe(REINFORCE.max);
    expect(g.player.reinforced.cane).toBe(3);
    expect(moveLevels(g, 'cane', 'rapier')).toBe(0);
  });

  it('refuses a weapon that is not theirs, the same weapon, and a source with nothing set in', () => {
    const g = armed();
    expect(moveLevels(g, 'cane', 'cutlass')).toBe(0); // not found yet
    expect(moveLevels(g, 'cutlass', 'cane')).toBe(0);
    expect(moveLevels(g, 'cane', 'cane')).toBe(0);
    expect(moveLevels(g, 'axe', 'cane')).toBe(0); // nothing in it
    expect(moveLevels(g, 'cane', 'axe', -3)).toBe(0);
    expect(moveLevels(g, 'cane', 'axe', 0.9)).toBe(0);
    expect(g.player.reinforced.cane).toBe(4);
  });

  it('the weapon in hand strikes with the level it was moved to', () => {
    const g = armed();
    g.player.weapon = 'rapier';
    moveLevels(g, 'cane', 'rapier', 4);
    expect(edge(g, g.player.id)).toBeCloseTo(edgeAt(4));
  });
});
