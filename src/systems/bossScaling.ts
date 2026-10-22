/** Boss level scaling, composed with NG+ without healing wounds or reviving corpses. */

import { BOSS_STANDING } from '../data/bossStanding';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH, LEVELS, NEW_GAME_PLUS, PLAYER } from '../data/tuning';
import type { Game } from './components';

/**
 * How much a horror grows to meet an investigator who has outgrown the standing it is made to be met at (round 68): its health by a share of
 * the growth in their blows, its blows by a share of the growth in their health. 1 and 1 at the standing, or below it, or for a form with none.
 */
export function overmatch(levels: { vigour: number; might: number }, id: string | undefined): { health: number; damage: number } {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return { health: 1, damage: 1 };
  const blows = (1 + LEVELS.might.damage! * levels.might) / (1 + LEVELS.might.damage! * standing[1]);
  const body = (PLAYER.hp + LEVELS.vigour.hp! * levels.vigour) / (PLAYER.hp + LEVELS.vigour.hp! * standing[0]);
  return { health: 1 + BOSS_OVERMATCH.share * Math.max(0, blows - 1), damage: 1 + BOSS_OVERMATCH.share * Math.max(0, body - 1) };
}

export const bossHealthScale = (bought: number, cycle: number, over = 1): number =>
  (1 + BOSS_LEVEL_SCALING.health * bought) * (1 + NEW_GAME_PLUS.health * cycle) * over;

export const bossDamageScale = (bought: number, over = 1): number => (1 + BOSS_LEVEL_SCALING.damage * bought) * over;

/** Existing bosses keep their remaining-health fraction when the player levels up. */
export function refreshBossLevels(g: Game, bought: number): void {
  const c = g.ecs.c;
  for (const e of c.fight.keys()) {
    const h = c.health.get(e);
    if (!h || h.baseMax === undefined || c.combatant.get(e)?.faction !== 'enemy' || c.dead.has(e) || h.hp <= 0) continue;
    const max = Math.max(1, Math.round(h.baseMax * bossHealthScale(bought, g.player.cycle, overmatch(g.player.levels, c.fight.get(e)!.id).health)));
    if (max === h.max) continue;
    h.hp = Math.min(max, (h.hp / h.max) * max);
    h.max = max;
  }
}
