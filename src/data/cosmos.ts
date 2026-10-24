/**
 * What hangs in the sky of each dimension of the Outer Dark (round 73; render/shaders/skyCosmos.ts, eased in as the investigator crosses a gate: render/sky.ts). The Outer
 * Gods are gone out of the earth and the dream, each into a dimension of its own, and each dimension's sky is its god's: a gold moon over a sea of cloud and an aurora the
 * colour of the Other Gods' light, a wood whose limbs close over the stars with eyes in them, a lattice of pale facets where time has stopped, a staff of five lines across
 * the dark and the notes on it, a cluster of iridescent globes, and over the court at the centre a black hole with a ring of white fire. The numbers are strengths
 * (0 is none); the sky's older numbers (the moon, the stars, the cloud) are in `SKY.regions`. Data only.
 */

import type { Vec3 } from './tuning';

export interface Cosmos {
  nebula: number; // gas, in two colours behind the stars
  nebA: Vec3;
  nebB: Vec3;
  storm: number; // a wall of cloud on the horizon with a light inside it, and sheet lightning
  canopy: number; // black limbs closing over the sky, and eyes in them
  lattice: number; // facets of pale light across the vault
  staff: number; // five lines across the dark, notes on them, rings of sound
  orbs: number; // iridescent globes
  hole: number; // the great black centre and its ring of fire
  still: number; // how stopped time is: 1 freezes the sky's clock (the stars do not twinkle, the cloud does not drift)
  aurora: Vec3; // the colour of the aurora (multiplies its own cold light)
}

const NONE: Cosmos = { nebula: 0, nebA: [0, 0, 0], nebB: [0, 0, 0], storm: 0, canopy: 0, lattice: 0, staff: 0, orbs: 0, hole: 0, still: 0, aurora: [1, 1, 1] };

const COSMOS: Readonly<Record<string, Partial<Cosmos>>> = {
  beyond: { nebula: 0.4, nebA: [0.16, 0.18, 0.46], nebB: [0.36, 0.3, 0.56] },
  cloud_summit: { nebula: 0.4, nebA: [0.5, 0.38, 0.2], nebB: [0.2, 0.3, 0.4], storm: 1, aurora: [1.15, 0.95, 0.5] },
  black_wood: { nebula: 0.5, nebA: [0.4, 0.07, 0.07], nebB: [0.22, 0.04, 0.1], canopy: 1 },
  pale_lattice: { nebula: 0.35, nebA: [0.55, 0.5, 0.68], nebB: [0.7, 0.7, 0.8], lattice: 1, still: 0.97 },
  piping_dark: { nebula: 0.75, nebA: [0.3, 0.38, 0.12], nebB: [0.16, 0.2, 0.1], staff: 1 },
  spheres: { nebula: 0.6, nebA: [0.1, 0.36, 0.42], nebB: [0.5, 0.42, 0.56], orbs: 1 },
  court_centre: { nebula: 0.7, nebA: [0.6, 0.12, 0.15], nebB: [0.34, 0.1, 0.4], hole: 1 },
};

/** The cosmic strengths of a region's sky (none where the sky is the earth's or the dream's). */
export const cosmosOf = (region: string | null): Cosmos => ({ ...NONE, ...(region ? COSMOS[region] : undefined) });
