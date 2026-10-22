/** Boss level scaling, composed with NG+ without healing wounds or reviving corpses. */

import { BOSS_LEVEL_SCALING, NEW_GAME_PLUS } from '../data/tuning';
import type { Game } from './components';

export const bossHealthScale = (bought: number, cycle: number): number =>
  (1 + BOSS_LEVEL_SCALING.health * bought) * (1 + NEW_GAME_PLUS.health * cycle);

export const bossDamageScale = (bought: number): number => 1 + BOSS_LEVEL_SCALING.damage * bought;

/** Existing bosses keep their remaining-health fraction when the player levels up. */
export function refreshBossLevels(g: Game, bought: number): void {
  const c = g.ecs.c;
  const scale = bossHealthScale(bought, g.player.cycle);
  for (const e of c.fight.keys()) {
    const h = c.health.get(e);
    if (!h || h.baseMax === undefined || c.combatant.get(e)?.faction !== 'enemy' || c.dead.has(e) || h.hp <= 0) continue;
    const max = Math.max(1, Math.round(h.baseMax * scale));
    if (max === h.max) continue;
    h.hp = Math.min(max, (h.hp / h.max) * max);
    h.max = max;
  }
}
