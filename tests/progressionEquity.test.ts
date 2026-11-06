import { describe, expect, it } from 'vitest';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { getEntity } from '../src/data/registry';
import { LEVELS } from '../src/data/tuning';
import { bossDamageScale, overmatch } from '../src/systems/bossScaling';
import { toCombatant } from '../src/systems/creatures';
import { healthAt, levelsWorth, mightAt } from '../src/systems/levelWorth';
import { standings } from './balanceModel';

type Build = { vigour: number; endurance: number; might: number };

const damageAt = (id: string, levels: Build): number => bossDamageScale(levelsWorth(levels), overmatch(levels, id).damage);
const survivalAt = (id: string, levels: Build): number => healthAt(levels.vigour) / damageAt(id, levels);
const damageDealtAt = (id: string, levels: Build): number => mightAt(levels.might) / getEntity(id)!.stats.hp;
const heaviestAt = (id: string): number => Math.max(0, ...Object.values(toCombatant(getEntity(id)!).moves).flatMap((m) => [m.hit?.damage, m.shot?.damage, m.volley?.damage, m.volley?.pool?.damage, m.pool?.damage, m.marks?.damage, m.marks?.leaves?.damage, m.wave?.damage, m.cloud?.damage, m.sweep?.damage, m.barrage?.damage].filter((damage): damage is number => damage !== undefined)));

describe('progression equity against bosses', () => {
  it('every Vigour purchase improves survival, including focused builds and the final levels', () => {
    const bad: string[] = [];
    // Other attributes contribute only to the shared linear scaling. Checking every Might
    // level and both Endurance extrema covers the full range without spawning fight bots.
    for (const id of Object.keys(BOSS_STANDING)) {
      for (let vigour = 0; vigour < LEVELS.vigour.max; vigour++) {
        for (let might = 0; might <= LEVELS.might.max; might++) {
          for (const endurance of [0, LEVELS.endurance.max]) {
            const before = { vigour, endurance, might };
            const after = { ...before, vigour: vigour + 1 };
            if (survivalAt(id, after) <= survivalAt(id, before)) bad.push(`${id}: ${vigour}/${endurance}/${might} + Vigour`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every Might purchase improves damage against each boss’s fixed health', () => {
    const bad: string[] = [];
    for (const id of Object.keys(BOSS_STANDING)) {
      for (let might = 0; might < LEVELS.might.max; might++) {
        for (let vigour = 0; vigour <= LEVELS.vigour.max; vigour++) {
          for (const endurance of [0, LEVELS.endurance.max]) {
            const before = { vigour, endurance, might };
            const after = { ...before, might: might + 1 };
            if (damageDealtAt(id, after) <= damageDealtAt(id, before)) bad.push(`${id}: ${vigour}/${endurance}/${might} + Might`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('a full build retains at least the survival of the expected build against every late boss', () => {
    const full = { vigour: LEVELS.vigour.max, endurance: LEVELS.endurance.max, might: LEVELS.might.max };
    const late = standings().filter((s) => s.levels.vigour >= 16);
    expect(late.length).toBeGreaterThan(10);
    for (const s of late) expect(survivalAt(s.id, full), s.id).toBeGreaterThanOrEqual(survivalAt(s.id, s.levels));
  });

  it('compiled high-tier blows stay within 30% of expected health after level scaling', () => {
    const highTier = standings().filter((s) => ['great_old_one', 'outer_god'].includes(getEntity(s.id)!.tier));
    expect(highTier.length).toBeGreaterThan(10);
    for (const s of highTier) {
      const scaled = Math.round(heaviestAt(s.id) * damageAt(s.id, s.levels));
      expect(scaled / s.hp, `${s.id}: ${scaled} of ${s.hp}`).toBeLessThanOrEqual(0.3);
    }
  });
});
