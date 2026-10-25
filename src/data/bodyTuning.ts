/**
 * The body in the world (round 78): what the ground keeps of a step and what the body gives up of itself. Footprints (render/footprints.ts,
 * laid by render/atm/steps.ts), the puffs a heel kicks up, the second set of prints that follows a failing mind, and the breath
 * and the gear heard (render/audio/bodyFoley.ts). Numbers only; the grounds are world/groundKind.ts's.
 */

import type { GroundKind } from '../world/groundKind';

/** How a print is drawn: the shader's `look` (render/footprints.ts). */
export const LOOKS = ['snow', 'mud', 'sand', 'wet', 'ooze'] as const;
export type PrintLook = (typeof LOOKS)[number];

export interface PrintGround {
  life: number; // seconds it keeps, fading out over the last of them
  look: PrintLook;
  alpha: number; // how plainly it shows, 0..1
}

export const STEPS = {
  capacity: 128, // prints held: the oldest give way (about a hundred metres of trail)
  /** The grounds that hold a print dry. */
  dry: {
    snow: { life: 95, look: 'snow', alpha: 0.95 },
    mud: { life: 50, look: 'mud', alpha: 1 },
    sand: { life: 42, look: 'sand', alpha: 0.7 },
    flesh: { life: 32, look: 'ooze', alpha: 0.8 },
    rot: { life: 26, look: 'ooze', alpha: 0.65 },
  } as Partial<Record<GroundKind, PrintGround>>,
  /** The grounds that take a print only once the rain has soaked them: seconds a print keeps at full wetness (it scales with how wet the ground is). */
  soaked: { grass: 14, dirt: 16, leaves: 12, gravel: 9, road: 9, cobble: 8 } as Partial<Record<GroundKind, number>>,
  soakedAbove: 0.3, // `wetness.value` the ground must pass to take one
  soakedAlpha: 0.7,
  /** Out of water, boots drip: wet prints on any dry ground for this long after the last of it. */
  afterWater: { seconds: 10, alpha: 0.85 },
  lift: 0.05, // metres above the ground
  length: 0.42, // metres, heel to toe (a little larger than a boot: it has to read across the low-res picture)
  width: 0.19,
  across: 0.13, // metres either side of the way the investigator goes
  ahead: 0.16, // metres ahead of the body where the foot comes down
  fadeIn: 0.12, // seconds a print takes to show
  fadeOut: 0.4, // the share of its life it fades over
  /** Prints of the dread: a failing mind is followed (Fractured and Unmoored, and the FX intensity setting not capping the stress below `stressFrom`; the grounds are those that keep a print). */
  haunt: { stressFrom: 0.5, every: 2, aside: 0.9, behind: 1, scale: 1.25, fadeIn: 2.2, life: 40, alpha: 0.9, bands: ['fractured', 'unmoored'] },
  /** What is kicked up at a run: from this speed (m/s), at most this many specs a second. */
  puffs: { speed: 3, perSecond: 40 },
} as const;

/** One heel's kick: how many bits (a range), and each bit's size, life, lift and drift (ranges, drawn anew), as render/particles.ts takes them. */
export interface Puff {
  n: readonly [number, number];
  shape: 'disc' | 'shard' | 'wisp';
  size: readonly [number, number];
  grow: number;
  life: readonly [number, number];
  up: readonly [number, number]; // m/s
  out: readonly [number, number]; // m/s sideways
  drag: number;
  alpha: number;
  color: readonly [number, number, number];
  gravity?: number;
  spin?: number;
  settle?: boolean; // it lands on the ground and lies
}

export const PUFFS: Record<string, Puff> = {
  snow: { n: [2, 3], shape: 'wisp', size: [0.22, 0.34], grow: 2.4, life: [0.7, 1.2], up: [0.35, 0.9], out: [0.2, 0.7], drag: 2.6, alpha: 0.5, color: [0.9, 0.92, 0.96] }, // powder lifted off the heel
  dust: { n: [1, 2], shape: 'wisp', size: [0.2, 0.3], grow: 2.2, life: [0.5, 0.9], up: [0.3, 0.8], out: [0.3, 0.9], drag: 3, alpha: 0.34, color: [0.5, 0.45, 0.4] },
  sand: { n: [1, 2], shape: 'wisp', size: [0.2, 0.32], grow: 2.4, life: [0.5, 0.9], up: [0.3, 0.7], out: [0.4, 1], drag: 3, alpha: 0.38, color: [0.72, 0.66, 0.54] },
  leaves: { n: [2, 3], shape: 'shard', size: [0.09, 0.14], grow: 1, life: [0.8, 1.3], up: [1, 2.1], out: [0.4, 1.2], drag: 1.2, alpha: 0.9, color: [0.46, 0.34, 0.24], gravity: 4, spin: 6, settle: true },
  mud: { n: [2, 3], shape: 'disc', size: [0.06, 0.11], grow: 0.8, life: [0.35, 0.6], up: [1.4, 2.6], out: [0.4, 1.1], drag: 0.8, alpha: 0.95, color: [0.2, 0.16, 0.13], gravity: 10, settle: true },
  grass: { n: [1, 2], shape: 'shard', size: [0.06, 0.09], grow: 1, life: [0.5, 0.9], up: [0.8, 1.6], out: [0.3, 0.9], drag: 1.4, alpha: 0.8, color: [0.36, 0.4, 0.3], gravity: 5, spin: 5, settle: true },
  ooze: { n: [1, 2], shape: 'disc', size: [0.05, 0.1], grow: 0.9, life: [0.35, 0.55], up: [1, 2], out: [0.3, 0.8], drag: 0.8, alpha: 0.9, color: [0.26, 0.15, 0.15], gravity: 9, settle: true },
  spray: { n: [3, 4], shape: 'disc', size: [0.07, 0.13], grow: 0.7, life: [0.35, 0.6], up: [1.5, 3.2], out: [0.5, 1.4], drag: 1, alpha: 0.8, color: [0.78, 0.8, 0.8], gravity: 9 },
};

/** Which kick each ground gives (the others give none: stone does not rise in a cloud under a shoe). */
export const PUFF_OF: Partial<Record<GroundKind, keyof typeof PUFFS>> = { snow: 'snow', dirt: 'dust', road: 'dust', gravel: 'dust', sand: 'sand', leaves: 'leaves', mud: 'mud', grass: 'grass', flesh: 'ooze', rot: 'ooze', water: 'spray' };

/**
 * How cold each realm is on a clear night, 0..1 (the breath that is heard: render/audio/bodyFoley.ts). The cold of the hour is this times
 * how dark it is, and rain adds a little; a realm not named is not cold, and the dimensions beyond the stars have no breath to show.
 */
export const COLD: Readonly<Record<string, number>> = {
  mountains: 1, cloud_summit: 0.9, yuggoth: 0.8, pale_lattice: 0.7, vermont: 0.55, dunwich: 0.5, arkham: 0.5, hub: 0.45, providence: 0.45, innsmouth: 0.45,
  rlyeh: 0.3, pnakotus: 0.3, kn_yan: 0.2, black_wood: 0.2, dreamlands: 0.15,
};
export const COLD_RAIN = 0.15;
