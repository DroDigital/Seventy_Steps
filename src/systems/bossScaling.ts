/**
 * Boss level scaling, composed with NG+ without healing wounds or reviving corpses. Round 71: it follows the levels as they are worth past the soft
 * caps (`levelsWorth`, levelWorth.ts), not as they are counted: a level that the body gains little from does not make the horrors much harder either.
 */

import { BOSS_STANDING } from '../data/bossStanding';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH, NEW_GAME_PLUS } from '../data/tuning';
import type { Game } from './components';
import { healthAt, mightAt } from './levelWorth';

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

export const bossHealthScale = (levels: number, cycle: number, over = 1): number =>
  (1 + BOSS_LEVEL_SCALING.health * levels) * (1 + NEW_GAME_PLUS.health * cycle) * over;

export const bossDamageScale = (levels: number, over = 1): number => (1 + BOSS_LEVEL_SCALING.damage * levels) * over;

/** Existing bosses keep their remaining-health fraction when the player levels up. */
export function refreshBossLevels(g: Game, levels: number): void {
  const c = g.ecs.c;
  for (const e of c.fight.keys()) {
    const h = c.health.get(e);
    if (!h || h.baseMax === undefined || c.combatant.get(e)?.faction !== 'enemy' || c.dead.has(e) || h.hp <= 0) continue;
    const max = Math.max(1, Math.round(h.baseMax * bossHealthScale(levels, g.player.cycle, overmatch(g.player.levels, c.fight.get(e)!.id).health)));
    if (max === h.max) continue;
    h.hp = Math.min(max, (h.hp / h.max) * max);
    h.max = max;
  }
}
