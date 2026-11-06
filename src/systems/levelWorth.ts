/**
 * The full value of purchased levels, shared by the investigator's stats and boss scaling.
 * Pure: no Three.js.
 */

import { LEVELS, PLAYER, STAMINA, type LevelId } from '../data/tuning';

/** Every purchased level counts in full; negative input cannot subtract from a base stat. */
export const levelWorth = (levels: number): number => Math.max(0, levels);

/** The levels bought in a record of them (used for first-journey boss damage; bossScaling.ts). */
export const levelsWorth = (levels: Partial<Record<LevelId, number>>): number => (Object.keys(LEVELS) as LevelId[]).reduce((n, id) => n + levelWorth(levels[id] ?? 0), 0);

/** The investigator's most health at `vigour` levels. */
export const healthAt = (vigour: number): number => Math.round(PLAYER.hp + levelWorth(vigour) * (LEVELS.vigour.hp ?? 0));

/** Their most stamina at `endurance` levels. */
export const staminaAt = (endurance: number): number => Math.round(PLAYER.stamina + levelWorth(endurance) * (LEVELS.endurance.stamina ?? 0));

/** Stamina regained per second at `endurance` levels (round 22): the start's, and more with each. */
export const staminaRegen = (endurance: number): number => STAMINA.regen + levelWorth(endurance) * (LEVELS.endurance.regen ?? 0);

/** The weight their blows and shots have at `might` levels: 1 with none. */
export const mightAt = (might: number): number => {
  const m = levelWorth(might), { damage = 0, knee = Infinity, past = damage } = LEVELS.might;
  return 1 + Math.min(m, knee) * damage + Math.max(0, m - knee) * past; // (2026-11-01: half a level's worth past the knee)
};
