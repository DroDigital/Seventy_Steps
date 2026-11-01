/** Boss damage scaling. Health instead depends only on the journey (ngPlus.ts). */
import { BOSS_STANDING } from '../data/bossStanding';
import { JOURNEY_REFERENCE, type JourneyProfile } from '../data/ngPlusTuning';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH } from '../data/tuning';
import { healthAt, levelsWorth } from './levelWorth';
import { bossRung } from './ngPlus';

/** How much harder a horror strikes when the investigator's health exceeds its expected standing. */
export function overmatch(levels: { vigour: number }, id: string | undefined): { damage: number } {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return { damage: 1 };
  const body = healthAt(levels.vigour) / healthAt(standing[0]);
  return { damage: 1 + BOSS_OVERMATCH.share * Math.max(0, body - 1) };
}

export const bossDamageScale = (levels: number, over = 1): number => (1 + BOSS_LEVEL_SCALING.damage * levels) * over;

/** Later journeys use a fixed reference: buying another level does not strengthen their bosses. */
export const journeyBossDamage = (id: string, cycle: number, profile?: JourneyProfile): number =>
  bossDamageScale(levelsWorth(JOURNEY_REFERENCE), overmatch(JOURNEY_REFERENCE, id).damage) * bossRung(id, cycle, profile).damage;
