/** Journey multipliers, measured from authored stats. Index 0 is the first dream; index 7 is the ceiling. */
export const JOURNEY_CURVES = {
  early: [[1, 1], [1.6, 1.2], [2.15, 1.4], [2.65, 1.6], [2.95, 1.7], [3.2, 1.8], [3.45, 1.88], [3.65, 1.95]],
  middle: [[1, 1], [1.5, 1.18], [1.95, 1.35], [2.35, 1.53], [2.6, 1.63], [2.8, 1.72], [3, 1.8], [3.2, 1.88]],
  late: [[1, 1], [1.35, 1.15], [1.7, 1.3], [2, 1.45], [2.2, 1.55], [2.4, 1.62], [2.55, 1.69], [2.7, 1.75]],
} as const;

export type JourneyProfile = keyof typeof JOURNEY_CURVES;

/** Every region has an explicit default; subareas and encounters may refine it. */
export const REGION_JOURNEYS: Readonly<Record<string, JourneyProfile>> = {
  hub: 'early', arkham: 'early', dunwich: 'middle', innsmouth: 'middle', providence: 'middle', vermont: 'middle',
  mountains: 'late', pnakotus: 'late', kn_yan: 'late', dreamlands: 'late', rlyeh: 'late', yuggoth: 'late', beyond: 'late',
  cloud_summit: 'late', black_wood: 'late', pale_lattice: 'late', piping_dark: 'late', spheres: 'late', court_centre: 'late',
};

/** Fixed tuning reference, never the current player's build or a minimum required carry. */
export const JOURNEY_REFERENCE = { vigour: 18, endurance: 9, might: 17 } as const;

/** Fractions of the regional growth, not multipliers stacked over it. Summons use these same NG+ deltas. */
export const BOSS_JOURNEY_DEFAULT = [0.5, 0.8] as const;
export const BOSS_JOURNEY: Readonly<Record<string, readonly [health: number, damage: number]>> = {
  azathoth: [0, 0.8], // its health is a survival clock, whose duration stays fixed
  haunter_of_the_dark: [0.2, 0.8], // lamplight remains an effective way to finish it
  cthulhu: [0.25, 0.8], // preserve both the Alert finish and a weapon victory
  shub_niggurath: [0.15, 0.8], // roots and servants are part of this health budget
  tsathoggua: [0.2, 0.8],
  mother_hydra: [0.2, 0.8],
  ghatanothoa: [0.2, 0.8],
  nyarlathotep: [0.25, 0.8],
  umr_at_tawil: [0.25, 0.8],
};

export const JOURNEY_BALANCE_VERSION = 1;
export const ROOT_JOURNEY_HEALTH = 0.2;

/** Colossal roaming foes already demand an encounter's worth of stamina and time. */
export const CREATURE_JOURNEY: Readonly<Record<string, readonly [health: number, damage: number]>> = {
  dhole: [0.6, 0.8],
};
