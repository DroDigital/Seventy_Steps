/**
 * What the foot is heard on (round 78): the recorded step is taken a little differently on each ground (data/footSounds.ts FEEL: snow and sand
 * softer and duller, mud lower, boards a hollow knock, a slab or a cobble the stone's recording rather than dirt's), which of the four
 * recordings a phantom step is made from, and how cold the air is for a breath. Pure; render/audio/foley.ts and render/audio/bodyFoley.ts use it.
 */

import { COLD, COLD_RAIN } from '../../data/bodyTuning';
import { FEEL } from '../../data/footSounds';
import type { SampleSetId } from '../../data/samples';
import type { GroundKind } from '../../world/groundKind';
import type { Surface } from './foley';

export interface Feel {
  set?: SampleSetId; // a recording other than the surface's own
  gain: number;
  pitch: number;
  lowpass?: number;
}

const NEUTRAL: Feel = { gain: 1, pitch: 1 };
const HARD: ReadonlySet<GroundKind> = new Set(['slab', 'stone', 'cobble', 'boards']);

/** How the recorded step of `surface` (render/audio/foley.ts surfaceAt) is taken on `ground` (world/groundKind.ts). The sea's and the road's recordings are right as they are. */
export function footFeel(surface: Surface, ground: GroundKind): Feel {
  if (surface === 'water' || surface === 'road') return NEUTRAL;
  const f = FEEL[ground];
  const set: SampleSetId | undefined = HARD.has(ground) ? 'stepStone' : surface === 'stone' && f ? 'stepDirt' : undefined; // (a slab floor under the open sky rings, a cellar's mud does not)
  return set || f ? { set, gain: f?.gain ?? 1, pitch: f?.pitch ?? 1, lowpass: f?.lowpass } : NEUTRAL;
}

/** The recording a phantom step is made of. */
export const stepSetOf = (ground: GroundKind): SampleSetId => (ground === 'water' ? 'stepWater' : ground === 'road' ? 'stepRoad' : HARD.has(ground) ? 'stepStone' : 'stepDirt');

/** How cold the air is, 0..1: the realm's cold times how dark the hour is, a little more in rain, none under a roof. */
export function coldAt(region: string | null, dark: number, raining: boolean, roofed: boolean): number {
  const base = region ? COLD[region] ?? 0 : 0;
  return roofed || base <= 0 ? 0 : Math.min(1, base * dark + (raining ? COLD_RAIN : 0));
}
