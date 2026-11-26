/** A horror grows to meet an investigator past its standing with no ceiling, by the weapon in hand, and every level still helps (2026-11-24, 2026-11-26, docs/RULES.md). */
import { describe, expect, it } from 'vitest';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { getEntity, variantOf } from '../src/data/registry';
import { LEVELS, REINFORCE } from '../src/data/tuning';
import { WEAPON_IDS } from '../src/data/weapons';
import { edgeAt, equip } from '../src/systems/arms';
import { overmatch, overmatchHealth } from '../src/systems/bossScaling';
import { morph, spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { healthAt, mightAt } from '../src/systems/levelWorth';
import { applyLevels } from '../src/systems/levels';
import { applySave, snapshot } from '../src/systems/save';
import { bossGame, engage } from './bossHelpers';
import { steps } from './helpers';

const TOP = { vigour: 30, endurance: 30, might: 30 };

describe('a horror grows to meet the investigator, with no ceiling', () => {
  it('keeps growing with every level and reinforcement up to the last, the earliest horror most (2026-11-26: every horror keeps a chance)', () => {
    const below = { vigour: TOP.vigour - 1, endurance: TOP.endurance, might: TOP.might - 1 };
    for (const id of Object.keys(BOSS_STANDING)) {
      expect(overmatch(TOP, id).damage, `${id}: blows`).toBeGreaterThan(overmatch(below, id).damage);
      expect(overmatchHealth(TOP, REINFORCE.max, id), `${id}: health by Might`).toBeGreaterThan(overmatchHealth(below, REINFORCE.max, id));
      expect(overmatchHealth(TOP, REINFORCE.max, id), `${id}: health by the edge`).toBeGreaterThan(overmatchHealth(TOP, REINFORCE.max - 1, id));
    }
    const most = (grow: (id: string) => number): string => Object.keys(BOSS_STANDING).reduce((a, b) => (grow(b) > grow(a) ? b : a));
    expect(most((id) => overmatch(TOP, id).damage)).toBe('dr_munoz');
    expect(most((id) => overmatchHealth(TOP, REINFORCE.max, id))).toBe('dr_munoz');
  });

  it('every Vigour level strictly increases the blows the investigator can take from every boss', () => {
    const blows = (id: string, vigour: number): number => healthAt(vigour) / overmatch({ vigour }, id).damage;
    for (const id of Object.keys(BOSS_STANDING)) {
      for (let vigour = 0; vigour < LEVELS.vigour.max; vigour++) {
        expect(blows(id, vigour + 1), `${id} vigour ${vigour}->${vigour + 1}`).toBeGreaterThan(blows(id, vigour));
      }
    }
  });

  it('every Might level and weapon reinforcement strictly increases effective damage share against every boss', () => {
    const share = (id: string, might: number, edge: number): number =>
      (mightAt(might) * edgeAt(edge)) / overmatchHealth({ might }, edge, id);
    for (const id of Object.keys(BOSS_STANDING)) {
      for (let edge = 0; edge <= REINFORCE.max; edge++) {
        for (let might = 0; might < LEVELS.might.max; might++) {
          expect(share(id, might + 1, edge), `${id} might ${might}->${might + 1} at +${edge}`).toBeGreaterThan(share(id, might, edge));
        }
      }
      for (let might = 0; might <= LEVELS.might.max; might++) {
        for (let edge = 0; edge < REINFORCE.max; edge++) {
          expect(share(id, might, edge + 1), `${id} +${edge}->+${edge + 1} at might ${might}`).toBeGreaterThan(share(id, might, edge));
        }
      }
    }
  });

  it('grows by the weapon in hand, not the best one owned, and meets a weapon taken up in the fight', () => {
    const b = bossGame('dr_munoz');
    const { g, boss } = b;
    const [vigour, might, edge = 0] = BOSS_STANDING.dr_munoz!;
    Object.assign(g.player.levels, { vigour, endurance: 0, might });
    applyLevels(g);
    const other = WEAPON_IDS.find((w) => w !== 'cane')!;
    const third = WEAPON_IDS.find((w) => w !== 'cane' && w !== other)!;
    g.player.arms.push(other, third);
    g.player.reinforced.cane = edge;
    g.player.reinforced[other] = REINFORCE.max;
    g.player.reinforced[third] = REINFORCE.max;
    const authored = g.ecs.c.health.get(boss)!.max;
    engage(b);
    expect(b.fight.engaged).toBe(true);
    const h = g.ecs.c.health.get(boss)!;
    expect(h.max).toBe(authored); // the keen weapon is owned, not in hand
    h.hp = h.max * 0.4;
    expect(equip(g, other)).toBe(true);
    const grown = Math.round(authored * overmatchHealth(g.player.levels, REINFORCE.max, 'dr_munoz'));
    expect(h.max).toBe(grown);
    expect(h.max).toBeGreaterThan(authored);
    expect(h.hp / h.max).toBeCloseTo(0.4);
    // Switching to another weapon of the same reinforcement level leaves hp bit-for-bit untouched (no float drift)
    h.hp = 137;
    expect(equip(g, third)).toBe(true);
    expect(h.max).toBe(grown);
    expect(h.hp).toBe(137);
    expect(equip(g, 'cane')).toBe(true);
    expect(h.max).toBe(authored);
    expect(h.hp / h.max).toBeCloseTo(137 / grown);
  });

  it('rescales from the new form after a mid-fight morph, and rescales every engaged partner in a pair fight', () => {
    const b = bossGame('nyarlathotep');
    const { g, boss } = b;
    Object.assign(g.player.levels, TOP);
    applyLevels(g);
    const other = WEAPON_IDS.find((w) => w !== 'cane')!;
    g.player.arms.push(other);
    g.player.reinforced.cane = 0;
    g.player.reinforced[other] = REINFORCE.max;
    engage(b);
    const h = g.ecs.c.health.get(boss)!;
    h.hp = h.max * 0.5;
    morph(g, boss, 'nyarlathotep', 'eldritch');
    const eldritchHp = variantOf(getEntity('nyarlathotep')!, 'eldritch')!.stats.hp;
    expect(equip(g, other)).toBe(true);
    expect(h.max).toBe(Math.round(eldritchHp * overmatchHealth(g.player.levels, REINFORCE.max, 'nyarlathotep')));
    expect(h.hp / h.max).toBeCloseTo(0.5);

    const pair = bossGame('father_dagon');
    Object.assign(pair.g.player.levels, TOP);
    applyLevels(pair.g);
    pair.g.player.arms.push(other);
    pair.g.player.reinforced.cane = 0;
    pair.g.player.reinforced[other] = REINFORCE.max;
    const hydra = spawnCreature(pair.g, 'mother_hydra', { x: 4, z: 0, yaw: 0 })!;
    pair.g.ecs.c.brain.get(hydra)!.state = 'engage';
    engage(pair);
    steps(pair.g, 1);
    expect(pair.g.ecs.c.fight.get(hydra)!.engaged).toBe(true);
    const [dh, hh] = [pair.g.ecs.c.health.get(pair.boss)!, pair.g.ecs.c.health.get(hydra)!];
    expect(equip(pair.g, other)).toBe(true);
    expect(dh.max).toBe(Math.round(getEntity('father_dagon')!.stats.hp * overmatchHealth(TOP, REINFORCE.max, 'father_dagon')));
    expect(hh.max).toBe(Math.round(getEntity('mother_hydra')!.stats.hp * overmatchHealth(TOP, REINFORCE.max, 'mother_hydra')));
  });

  it('never touches dead bosses or NG+ bosses on equip, and applySave restores reinforcement before equip', () => {
    const b = bossGame('dr_munoz');
    const { g, boss } = b;
    Object.assign(g.player.levels, TOP);
    applyLevels(g);
    const other = WEAPON_IDS.find((w) => w !== 'cane')!;
    g.player.arms.push(other);
    g.player.reinforced[other] = REINFORCE.max;
    engage(b);
    const h = g.ecs.c.health.get(boss)!;
    const maxBeforeDeath = h.max;
    h.hp = 0;
    g.ecs.c.dead.set(boss, true);
    expect(equip(g, other)).toBe(true);
    expect(h.hp).toBe(0);
    expect(h.max).toBe(maxBeforeDeath);

    const ng = bossGame('dr_munoz');
    ng.g.player.cycle = 1;
    Object.assign(ng.g.player.levels, TOP);
    applyLevels(ng.g);
    ng.g.player.arms.push(other);
    ng.g.player.reinforced[other] = REINFORCE.max;
    const ngMax = ng.g.ecs.c.health.get(ng.boss)!.max;
    engage(ng);
    expect(equip(ng.g, other)).toBe(true);
    expect(ng.g.ecs.c.health.get(ng.boss)!.max).toBe(ngMax);

    const world = createWorldGame();
    world.player.arms.push(other);
    world.player.reinforced[other] = REINFORCE.max;
    equip(world, other);
    const saved = snapshot(world);
    const loaded = createWorldGame();
    const liveBoss = spawnCreature(loaded, 'dr_munoz', { x: 0, z: 0, yaw: 0 })!;
    const lf = loaded.ecs.c.fight.get(liveBoss)!;
    lf.engaged = true;
    applySave(loaded, { ...saved, levels: TOP });
    expect(loaded.player.reinforced[other]).toBe(REINFORCE.max);
    expect(loaded.ecs.c.health.get(liveBoss)!.max).toBe(Math.round(getEntity('dr_munoz')!.stats.hp * overmatchHealth(TOP, REINFORCE.max, 'dr_munoz')));
  });
});
