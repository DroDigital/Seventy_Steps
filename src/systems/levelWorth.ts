/**
 * What levels are worth (round 71, Souls-style soft caps): the first levels of an attribute count whole, and past each of `SOFT_CAP`'s marks a
 * level counts for less, so that the health, stamina, recovery and blows the last levels buy are a fraction of what the first did. Everything the
 * levels give is read through here: the investigator's own (levels.ts) and what the horrors grow to meet (bossScaling.ts). Pure: no Three.js.
 */

import { LEVELS, PLAYER, SOFT_CAP, STAMINA, type LevelId } from '../data/tuning';

/** The marks the worth of a level changes at: from `after` levels on, each further one counts for `worth`. */
const STEPS: readonly { after: number; worth: number }[] = [{ after: 0, worth: 1 }, ...SOFT_CAP];

/** `levels` of one attribute, counted in whole levels: as many as there are up to the first mark, a fraction of each beyond. Continuous and never falling. */
export function levelWorth(levels: number): number {
  return STEPS.reduce((sum, step, i) => sum + Math.max(0, Math.min(levels, STEPS[i + 1]?.after ?? Infinity) - step.after) * step.worth, 0);
}

/** What the next level is worth once `levels` of the attribute are bought: 1 before the first mark. */
export const nextWorth = (levels: number): number => levelWorth(levels + 1) - levelWorth(levels);

/** The levels bought in a record of them, as they count: each attribute's by its worth (what the horrors grow to meet; bossScaling.ts). */
export const levelsWorth = (levels: Partial<Record<LevelId, number>>): number => (Object.keys(LEVELS) as LevelId[]).reduce((n, id) => n + levelWorth(levels[id] ?? 0), 0);

/** The investigator's most health at `vigour` levels. */
export const healthAt = (vigour: number): number => Math.round(PLAYER.hp + levelWorth(vigour) * (LEVELS.vigour.hp ?? 0));

/** Their most stamina at `endurance` levels. */
export const staminaAt = (endurance: number): number => Math.round(PLAYER.stamina + levelWorth(endurance) * (LEVELS.endurance.stamina ?? 0));

/** Stamina regained per second at `endurance` levels (round 22): the start's, and more with each. */
export const staminaRegen = (endurance: number): number => STAMINA.regen + levelWorth(endurance) * (LEVELS.endurance.regen ?? 0);

/** The weight their blows and shots have at `might` levels: 1 with none. */
export const mightAt = (might: number): number => 1 + levelWorth(might) * (LEVELS.might.damage ?? 0);
