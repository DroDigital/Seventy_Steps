import { foeRung } from '../src/systems/ngPlus';
import { describe, expect, it } from 'vitest';
import { COMBAT, NEW_GAME_PLUS } from '../src/data/tuning';
import { getEntity } from '../src/data/registry';
import { startMove } from '../src/systems/actions';
import { backstab, strike } from '../src/systems/combat';
import { applyCarry, carryOf, foeBounty, parseCarry } from '../src/systems/cycles';
import { createWorldGame } from '../src/systems/game';
import { spawnCreature } from '../src/systems/creatures';
import { CARRY_KEY, storeCarry, takeCarry } from '../src/systems/records';
import { parseSave, snapshot } from '../src/systems/save';
import { place, press, scriptedGame, steps } from './helpers';

/** A store in memory. */
const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe('backstabs (round 12)', () => {
  it('only a heavy blow squarely into the back earns a small bonus; light attacks deal normal damage', () => {
    const hitFrom = (behind: boolean, attack: 'light' | 'heavy'): { dealt: number; outcomes: string[] } => {
      const s = scriptedGame();
      place(s.g, s.deepOne, 0, 0, 0); // facing +z
      place(s.g, s.player, 0, behind ? -1.2 : 1.2, behind ? 0 : Math.PI);
      const h = s.g.ecs.c.health.get(s.deepOne)!;
      const before = h.hp;
      const outcomes: string[] = [];
      s.g.events.on('Hit', (e) => { if (e.target === s.deepOne) outcomes.push(e.outcome); });
      steps(s.g, 1, press(attack));
      steps(s.g, 35);
      return { dealt: before - h.hp, outcomes };
    };
    const front = hitFrom(false, 'heavy');
    const back = hitFrom(true, 'heavy');
    expect(front.dealt).toBeGreaterThan(0);
    expect(back.dealt).toBeCloseTo(front.dealt * COMBAT.riposte, 5);
    expect(back.dealt / front.dealt).toBeLessThanOrEqual(1.15);
    expect(back.outcomes).toEqual(['riposte']);
    const light = hitFrom(false, 'light');
    const rearLight = hitFrom(true, 'light');
    expect(light.dealt).toBeGreaterThan(0);
    expect(rearLight.dealt).toBe(light.dealt);
    expect(rearLight.outcomes).not.toContain('riposte');
  });

  it('a heavy blow from the rear flank no longer counts as a backstab', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, deepOne, 0, 0, 0);
    startMove(g.ecs.c.actor.get(player)!, 'heavy1');
    for (const [degrees, expected] of [[0, true], [15, true], [30, false], [45, false], [90, false]] as const) {
      const angle = degrees * Math.PI / 180;
      place(g, player, Math.sin(angle) * 1.2, -Math.cos(angle) * 1.2, -angle);
      expect(backstab(g, player, deepOne), `${degrees} degrees off the back`).toBe(expected);
    }
  });

  it('no boss, and nothing colossal, is backstabbed', () => {
    const g = createWorldGame();
    const boss = spawnCreature(g, 'keziah_mason', { x: 0, z: 0, yaw: 0 })!;
    const gug = spawnCreature(g, 'gug', { x: 10, z: 0, yaw: 0 })!;
    startMove(g.ecs.c.actor.get(g.player.id)!, 'heavy1');
    place(g, g.player.id, 0, -1.5, 0);
    expect(backstab(g, g.player.id, boss)).toBe(false);
    place(g, g.player.id, 10, -3, 0);
    expect(backstab(g, g.player.id, gug)).toBe(false);
  });
});

describe('a new journey (NG+, round 12)', () => {
  it('carries the strength through the reload, once', () => {
    const g = createWorldGame();
    Object.assign(g.player, { stones: 4, echoes: 1234, reagentMax: 5 });
    g.player.levels.might = 7;
    g.player.arms.push('axe');
    g.player.weapon = 'axe';
    g.player.reinforced.axe = 2;
    const store = memory();
    storeCarry(store, carryOf(g));
    const carry = takeCarry(store)!;
    expect(store.getItem(CARRY_KEY)).toBeNull(); // taken once
    const next = createWorldGame({ carry });
    expect(next.player).toMatchObject({ cycle: 1, stones: 4, echoes: 1234, reagentMax: 5, weapon: 'axe' });
    expect(next.player.levels.might).toBe(7);
    expect(next.player.reinforced.axe).toBe(2);
    expect(next.overworld!.slain.size).toBe(0); // the world begins again
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(next)))! });
    expect(loaded.player.cycle).toBe(1);
  });

  it("a later journey's foes are hardier, strike harder and leave more", () => {
    const g = createWorldGame();
    applyCarry(g, parseCarry({ cycle: 2 })!);
    const e = spawnCreature(g, 'deep_one', { x: 0, z: 0, yaw: 0 })!;
    const def = getEntity('deep_one')!;
    expect(g.ecs.c.health.get(e)!.max).toBe(Math.round(def.stats.hp * foeRung(2, 'early').health));
    expect(g.ecs.c.combatant.get(e)!.bounty).toBe(Math.round(def.drops.echoes * foeBounty(g)));
    const h = g.ecs.c.health.get(g.player.id)!;
    const before = h.hp;
    strike(g, e, g.player.id, { damage: 20, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false });
    expect(before - h.hp).toBe(Math.round(20 * foeRung(2, 'early').damage));
  });

  it('a damaged carry is mended, not trusted', () => {
    const c = parseCarry({ cycle: 99, levels: { might: 1e6 }, arms: ['axe', 'no_such'], weapon: 'razor', stones: -4 })!;
    expect(c.cycle).toBe(NEW_GAME_PLUS.most);
    expect(c.arms).toEqual(['cane', 'axe']);
    expect(c.weapon).toBe('cane'); // not theirs
    expect(c.stones).toBe(0);
    expect(parseCarry('nonsense')).toBeNull();
  });
});
