import { describe, expect, it } from 'vitest';
import { MERCY } from '../src/data/tuning';
import { spawnCreature } from '../src/systems/creatures';
import { foeDamage } from '../src/systems/cycles';
import { deathLine } from '../src/systems/deathNotes';
import { createWorldGame } from '../src/systems/game';
import { fallsTo, mercyLine, mercyScale } from '../src/systems/mercy';
import { parseSave, snapshot } from '../src/systems/save';
import { record } from './worldHelpers';

/** A game with Keziah Mason's fight engaged, and the investigator unmade in it `n` times. */
function fallen(n: number) {
  const g = createWorldGame();
  const boss = spawnCreature(g, 'keziah_mason', { x: 20, z: 20, yaw: 0 })!;
  g.ecs.c.fight.get(boss)!.engaged = true;
  for (let i = 0; i < n; i++) g.events.emit('Died', { entity: g.player.id, killer: boss, at: { x: 0, y: 0, z: 0 } });
  return { g, boss };
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

  it("says so under UNMADE, in the line read with what the last blow teaches (the HUD clears every notice at a fall), for the fall that has just been, until the waking", () => {
    const { g, boss } = fallen(0);
    const notices = record(g, 'Notice');
    for (let i = 0; i < 2; i++) g.events.emit('Died', { entity: g.player.id, killer: boss, at: { x: 0, y: 0, z: 0 } });
    expect(notices, 'a notice put up at the fall is cleared by the HUD in the same breath').toEqual([]);
    expect(mercyLine(g)).toContain('12%');
    expect(mercyLine(g)).not.toContain('6%');
    expect(deathLine(g).endsWith(mercyLine(g))).toBe(true);
    g.events.emit('Respawned', { entity: g.player.id });
    expect(mercyLine(g)).toBe('');
    expect(deathLine(g)).not.toContain('loosens');
  });

  it("weighs the horror's blows and its summons, not another horror's or the investigator's", () => {
    const { g, boss } = fallen(2);
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
