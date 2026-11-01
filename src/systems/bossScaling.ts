/**
 * Boss damage scaling. Boss health remains at the authored value for each form.
 */

import { BOSS_STANDING } from '../data/bossStanding';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH } from '../data/tuning';
import { healthAt } from './levelWorth';

/**
 * How much harder a horror strikes when the investigator's health exceeds the standing it was made to be met at.
 * 1 at or below the standing, or for a form with none.
 */
export function overmatch(levels: { vigour: number }, id: string | undefined): { damage: number } {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return { damage: 1 };
  const body = healthAt(levels.vigour) / healthAt(standing[0]);
  return { damage: 1 + BOSS_OVERMATCH.share * Math.max(0, body - 1) };
}

export const bossDamageScale = (levels: number, over = 1): number => (1 + BOSS_LEVEL_SCALING.damage * levels) * over;
