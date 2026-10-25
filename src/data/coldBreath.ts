/**
 * Round 78, atmosphere: the breath of the cold (render/breath.ts). How cold each realm is, and how the investigator breathes in it:
 * a slow pale puff at rest, quicker walking, a ragged heaving cloud after a sprint or at low stamina. Strongest on the Mountains of Madness,
 * noticeable in Vermont, Dunwich and Pnakotus's desert night. Data only; the picture's alone (the breath that is heard is the footsteps').
 */

/** How cold each realm's air is (0..1): a realm without a row is not cold enough to show the breath. */
export const COLD: Readonly<Record<string, number>> = {
  mountains: 1, vermont: 0.6, pnakotus: 0.55, dunwich: 0.45, providence: 0.4, hub: 0.35, arkham: 0.35, innsmouth: 0.3,
};

export const BREATH = {
  from: 0.15, // the least cold at which a breath is seen
  night: 0.5, // the share of the cold the day (the gloaming's first light, the waning's grey) holds: the deep of the night keeps all of it
  storm: 0.25, // added to the cold in rain, a storm or a gale
  period: { rest: 3.8, walk: 2.2, spent: 1.1 }, // seconds between breaths
  winded: 0.25, // stamina share below which they are spent
  walking: 0.6, // m/s: faster than this is a walk
  head: 1.58, // metres over the feet: the mouth...
  ahead: 0.2, // ...and how far in front of the face
  lens: 1.8, // metres: no breath within this of the lens (a close shot is not to be clouded)
  puffs: [3, 4] as readonly [number, number],
  size: 0.08, // metres at birth, grown to size × grow...
  grow: 4.5,
  alpha: 0.4, // × the cold, and × spent: the breath of one who is winded is heavier
  spent: 1.5,
  life: [1.1, 1.5] as readonly [number, number],
  color: [0.8, 0.86, 0.92] as readonly [number, number, number],
};
