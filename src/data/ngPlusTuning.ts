/** Journey multipliers from authored stats. Each is the geometric midpoint of the two proposed ladders, capped at NG+7. */
export const JOURNEY_CURVES = {
  early: [[1, 1], [1.352, 1.134], [1.663, 1.265], [1.946, 1.394], [2.153, 1.478], [2.342, 1.563], [2.531, 1.639], [2.702, 1.710]],
  middle: [[1, 1], [1.309, 1.124], [1.583, 1.242], [1.832, 1.363], [2.021, 1.448], [2.191, 1.528], [2.360, 1.604], [2.530, 1.679]],
  late: [[1, 1], [1.242, 1.110], [1.478, 1.219], [1.690, 1.327], [1.859, 1.412], [2.028, 1.483], [2.176, 1.554], [2.324, 1.620]],
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

/** Boss health rises by journey, independently of the investigator's level and region. */
export const BOSS_JOURNEY_HEALTH = [1, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45] as const;

/** Bosses and their servants receive this share of the region's damage growth. */
export const BOSS_JOURNEY_DAMAGE = 0.8;

export const JOURNEY_BALANCE_VERSION = 2;

/** Colossal roaming foes already demand an encounter's worth of stamina and time. */
export const CREATURE_JOURNEY: Readonly<Record<string, readonly [health: number, damage: number]>> = {
  dhole: [0.6, 0.8],
};
