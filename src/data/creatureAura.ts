/**
 * What the great ones give off (round 83; render/creatureAura.ts): twelve recipes, one for each thing a body
 * of its tier lets go of. Only the horrors of the Mythos have them (a lesser creature and an ally have none);
 * a greater one's is faint, an outer god's is a weather of its own. Colours stay inside the anomaly hues
 * (render/palette.ts ANOMALY), dimmed or brightened and never mixed with another, and everything is slow:
 * no flicker, no flash. A sound mind sees the least of it, and a failing one sees it swell (`MIND`), and a
 * horror deep in its fight gives off more (`DEEP`).
 */

import type { Tier } from './schema';

export type AuraHue = 'magenta' | 'purple' | 'green';
/** Where about the painted body a recipe lets go: its shoulders and head, its whole height, a ring at its waist, its feet. */
export type AuraPlace = 'head' | 'body' | 'ring' | 'feet';

export interface AuraRecipe {
  place: AuraPlace;
  hue: AuraHue;
  gain: number; // the hue's brightness (1 is the anomaly hue as it is)
  rate: number; // per second, for each metre of the body's height
  size: number; // metres across at birth, for each metre of the body's height
  grow: number; // times this across at death
  life: number; // seconds
  rise: number; // metres a second it climbs (negative: it sinks) for each metre of the body's height
  turn: number; // metres a second it circles the body at, for each metre of its height (a ring, or a wisp that drifts round)
  alpha: number;
  spread: number; // how far from the body's middle it begins, in body radii (a ring: where its ring is)
  glow: boolean;
}

/** The recipes of each tier that has any, from the faintest to the strongest. */
export const AURA: Readonly<Partial<Record<Tier, readonly AuraRecipe[]>>> = {
  greater: [
    { place: 'body', hue: 'purple', gain: 0.7, rate: 0.28, size: 0.02, grow: 1.6, life: 3.4, rise: 0.05, turn: 0, alpha: 0.4, spread: 0.7, glow: true },
    { place: 'feet', hue: 'purple', gain: 0.5, rate: 0.12, size: 0.14, grow: 2.4, life: 3.8, rise: 0.02, turn: 0.02, alpha: 0.12, spread: 0.8, glow: false },
  ],
  named: [
    { place: 'body', hue: 'purple', gain: 0.85, rate: 0.55, size: 0.022, grow: 1.5, life: 3.6, rise: 0.07, turn: 0.03, alpha: 0.5, spread: 0.8, glow: true },
    { place: 'head', hue: 'green', gain: 0.8, rate: 0.16, size: 0.016, grow: 0.6, life: 2.6, rise: 0.1, turn: 0, alpha: 0.6, spread: 0.45, glow: true },
    { place: 'feet', hue: 'magenta', gain: 0.55, rate: 0.14, size: 0.11, grow: 2.2, life: 3.2, rise: 0.04, turn: 0, alpha: 0.14, spread: 0.9, glow: false },
  ],
  great_old_one: [
    { place: 'body', hue: 'purple', gain: 0.9, rate: 0.7, size: 0.026, grow: 1.8, life: 4.2, rise: 0.08, turn: 0.04, alpha: 0.55, spread: 0.9, glow: true },
    { place: 'ring', hue: 'green', gain: 0.75, rate: 0.35, size: 0.016, grow: 0.8, life: 3.6, rise: 0.015, turn: 0.1, alpha: 0.6, spread: 1.15, glow: true },
    { place: 'head', hue: 'magenta', gain: 0.8, rate: 0.2, size: 0.02, grow: 0.7, life: 3, rise: -0.08, turn: 0, alpha: 0.5, spread: 0.5, glow: true },
  ],
  outer_god: [
    { place: 'ring', hue: 'magenta', gain: 0.95, rate: 0.9, size: 0.02, grow: 0.7, life: 4.4, rise: 0.01, turn: 0.16, alpha: 0.7, spread: 1.5, glow: true },
    { place: 'body', hue: 'purple', gain: 1, rate: 1.1, size: 0.03, grow: 1.9, life: 5, rise: 0.1, turn: 0.05, alpha: 0.5, spread: 1.1, glow: true },
    { place: 'head', hue: 'green', gain: 0.9, rate: 0.3, size: 0.018, grow: 0.5, life: 3, rise: 0.06, turn: 0, alpha: 0.7, spread: 0.55, glow: true },
    { place: 'feet', hue: 'purple', gain: 0.45, rate: 0.2, size: 0.16, grow: 2.8, life: 5, rise: 0.015, turn: 0.03, alpha: 0.13, spread: 1.2, glow: false },
  ],
};

export const AURA_TUNING = {
  reach: 34, // metres from the lens that a body gives off any
  frameMost: 14, // the most let go in a frame, all bodies together (a stall's backlog is not paid at once)
  mind: [0.45, 1.15] as readonly [number, number], // the share of its rate it gives to a sound mind, and to a failing one (render/creatureAura.ts, by how far the mind has gone)
  deep: 0.8, // the share a horror in its last phase gives off beyond what it did at the first
  bodyBottom: 0.05, // a body's lower and upper part, of its painted height, that a recipe's place draws from
  head: [0.72, 0.98] as readonly [number, number],
  waist: 0.45,
} as const;
