import { describe, expect, it } from 'vitest';
import { MERCY } from '../src/data/tuning';
import { spawnCreature } from '../src/systems/creatures';
import { foeDamage } from '../src/systems/cycles';
import { createWorldGame } from '../src/systems/game';
import { fallsTo, mercyScale } from '../src/systems/mercy';
import { parseSave, snapshot } from '../src/systems/save';
import { record } from './worldHelpers';

/** A game with Keziah Mason's fight engaged, and the investigator unmade in it `n` times. */
function fallen(n: number) {
  const g = createWorldGame();
  const boss = spawnCreature(g, 'keziah_mason', { x: 20, z: 20, yaw: 0 })!;
  g.ecs.c.fight.get(boss)!.engaged = true;
  const notices = record(g, 'Notice');
  for (let i = 0; i < n; i++) g.events.emit('Died', { entity: g.player.id, killer: boss, at: { x: 0, y: 0, z: 0 } });
  return { g, boss, notices };
}

describe('mercy (round 61): a horror that has unmade the investigator strikes lighter the next time', () => {
  it('begins at nothing, lightens each fall by a step, and stops at its floor', () => {
    const { g, boss } = fallen(0);
    expect(mercyScale(g, boss)).toBe(1);
    for (let n = 1; n <= MERCY.falls + 3; n++) {
      g.events.emit('Died', { entity: g.player.id, killer: boss, at: { x: 0, y: 0, z: 0 } });
      expect(mercyScale(g, boss), `${n} falls`).toBeCloseTo(1 - MERCY.step * Math.min(n, MERCY.falls), 10);
    }
    expect(fallsTo(g, 'keziah_mason')).toBe(MERCY.falls);
    expect(mercyScale(g, boss)).toBeGreaterThan(0.7);
  });

  it("says so, once for each fall that counts, and weighs the horror's blows and its summons, not another horror's or the investigator's", () => {
    const { g, boss, notices } = fallen(2);
    expect(notices.map((n) => n.text)).toEqual(['ITS GRIP LOOSENS · BLOWS −6%', 'ITS GRIP LOOSENS · BLOWS −12%']);
    const other = spawnCreature(g, 'dr_munoz', { x: -20, z: 20, yaw: 0 })!;
    const servant = spawnCreature(g, 'deep_one', { x: 22, z: 20, yaw: 0 })!;
    g.ecs.c.minion.set(servant, boss);
    expect(foeDamage(g, boss)).toBeCloseTo(0.88, 10);
    expect(foeDamage(g, servant)).toBeLessThan(foeDamage(g, boss));
    expect(foeDamage(g, other)).toBe(1);
    expect(foeDamage(g, g.player.id)).toBe(1);
  });

  it('is not shown on a fall that no horror had a hand in, nor on Nightmare, and is held in a save', () => {
    const quiet = createWorldGame();
    quiet.events.emit('Died', { entity: quiet.player.id, killer: null, at: { x: 0, y: 0, z: 0 } });
    expect([...quiet.overworld!.told].filter((k) => k.startsWith('mercy:'))).toEqual([]);
    const { g, boss } = fallen(1);
    g.player.difficulty = 'nightmare';
    expect(mercyScale(g, boss)).toBe(1);
    g.player.difficulty = 'deep';
    expect(mercyScale(g, boss)).toBeCloseTo(0.94, 10);
    const again = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(fallsTo(again, 'keziah_mason')).toBe(1);
  });
});
