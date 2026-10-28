/**
 * Boss level scaling, composed with NG+ without healing wounds or reviving corpses. Round 71: it follows the levels as they are worth past the soft
 * caps (`levelsWorth`, levelWorth.ts), not as they are counted. NG+ uses a fixed reference instead: levels improve the player without strengthening bosses.
 */

import { BOSS_STANDING } from '../data/bossStanding';
import { JOURNEY_REFERENCE } from '../data/ngPlusTuning';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH } from '../data/tuning';
import type { Game } from './components';
import { healthAt, levelsWorth, mightAt } from './levelWorth';
import { bossRung } from './ngPlus';
import type { JourneyProfile } from '../data/ngPlusTuning';

/**
 * How much a horror grows to meet an investigator who has outgrown the standing it is made to be met at (round 68): its health by a share of
 * the growth in their blows, its blows by a share of the growth in their health. 1 and 1 at the standing, or below it, or for a form with none.
 * Round 71: the growth is what the levels are worth past the soft caps (levelWorth.ts), the blows and health the investigator really has.
 */
export function overmatch(levels: { vigour: number; might: number }, id: string | undefined): { health: number; damage: number } {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return { health: 1, damage: 1 };
  const blows = mightAt(levels.might) / mightAt(standing[1]);
  const body = healthAt(levels.vigour) / healthAt(standing[0]);
  return { health: 1 + BOSS_OVERMATCH.share * Math.max(0, blows - 1), damage: 1 + BOSS_OVERMATCH.share * Math.max(0, body - 1) };
}

export function bossHealthScale(levels: number, cycle: number, over = 1, id?: string, profile?: JourneyProfile): number {
  if (cycle > 0) return (1 + BOSS_LEVEL_SCALING.health * levelsWorth(JOURNEY_REFERENCE)) * overmatch(JOURNEY_REFERENCE, id).health * bossRung(id, cycle, profile).health;
  return (1 + BOSS_LEVEL_SCALING.health * levels) * over;
}

export const bossDamageScale = (levels: number, over = 1): number => (1 + BOSS_LEVEL_SCALING.damage * levels) * over;

/** Later journeys are authored against one reference; buying levels never strengthens their bosses. */
export const journeyBossDamage = (id: string, cycle: number, profile?: JourneyProfile): number =>
  bossDamageScale(levelsWorth(JOURNEY_REFERENCE), overmatch(JOURNEY_REFERENCE, id).damage) * bossRung(id, cycle, profile).damage;

/** Existing bosses keep their remaining-health fraction when the player levels up. */
export function refreshBossLevels(g: Game, levels: number): void {
  const c = g.ecs.c;
  for (const e of c.fight.keys()) {
    const h = c.health.get(e);
    if (!h || h.baseMax === undefined || c.combatant.get(e)?.faction !== 'enemy' || c.dead.has(e) || h.hp <= 0) continue;
    const id = c.fight.get(e)!.id;
    const max = Math.max(1, Math.round(h.baseMax * bossHealthScale(levels, g.player.cycle, overmatch(g.player.levels, id).health, id, c.journey.get(e)?.profile)));
    if (max === h.max) continue;
    h.hp = Math.min(max, (h.hp / h.max) * max);
    h.max = max;
  }
}
