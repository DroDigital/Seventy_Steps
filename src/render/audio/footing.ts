/**
 * What the foot is heard on (round 80): the recorded step is taken a little differently on each ground (data/footSounds.ts FEEL: snow and sand
 * softer and duller, mud lower, boards a hollow knock, a slab or a cobble the stone's recording rather than dirt's), which of the four
 * recordings a phantom step is made from, and how cold the air is for a breath. Pure; render/audio/foley.ts and render/audio/bodyFoley.ts use it.
 * Round 83: and how loud a step is for the pace it is taken at (understated, and the road's bright recording dulled), and the faint returns
 * a room gives it.
 */

import { ECHO_MOST, ECHO_PACE, type Echo } from '../../data/acoustics';
import { COLD, COLD_RAIN } from '../../data/bodyTuning';
import { FEEL, STEP_VOICE } from '../../data/footSounds';
import type { SampleSetId } from '../../data/samples';
import { PLAYER } from '../../data/tuning';
import type { GroundKind } from '../../world/groundKind';
import type { Surface } from './foley';
import type { SampleEcho } from './sampler';

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

/** How loud a footfall at `speed` (m/s) is against its set's own level: quiet creeping, a little more at a walk, the most at a sprint; the recipe laid over it keeps to the same. */
export const stepLevel = (speed: number): number => STEP_VOICE.level[0] + (STEP_VOICE.level[1] - STEP_VOICE.level[0]) * Math.min(1, Math.max(0, speed / PLAYER.sprintSpeed));

/** How much louder a footfall is on a dungeon room's floor (render/audio/foley.ts `indoorsAt`) than the same one in the open (`STEP_VOICE.indoors`, round 86); 1 anywhere else. The recipe laid over the step and a failing mind's followers keep to it. */
export const indoorLift = (indoors: boolean): number => (indoors ? STEP_VOICE.indoors : 1);

/** What the surface's recording is given to sit with the others (`STEP_VOICE.surface`): its level against the set's own (lifted on a dungeon room's floor, `indoors`), and the low-pass (Hz) it is dulled to. */
export const stepGain = (surface: Surface, indoors = false): number => (STEP_VOICE.surface[surface]?.gain ?? 1) * indoorLift(indoors);

/** The low-pass (Hz) a footfall on `surface` is played with, the ground's own (`FEEL`) or the surface's, whichever is duller: undefined when neither closes anything. */
export function stepLowpass(surface: Surface, feelLowpass?: number): number | undefined {
  const soft = STEP_VOICE.surface[surface]?.lowpass;
  return soft && feelLowpass ? Math.min(soft, feelLowpass) : soft ?? feelLowpass;
}

/**
 * The returns of a footfall in a room that answers one: the same take again after `echo.delay`, then again a little later (each fainter by
 * `fall`, never louder than `ECHO_MOST` of the step, duller by a quarter, and off to the other side of the first), the first to the `side`
 * given (1 right, -1 left; the feet take turns). `lowpass` is the step's own, which a return is never brighter than. At `speed` (m/s) above
 * a walk the room answers less (`ECHO_PACE`) and at a sprint not at all: none are returned (the footfalls come too close for them).
 */
export function echoesOf(echo: Echo, side: 1 | -1, lowpass = 18000, speed = 0): SampleEcho[] {
  const pace = Math.min(1, Math.max(0, (ECHO_PACE.none - speed) / (ECHO_PACE.none - ECHO_PACE.full)));
  if (pace < 0.05) return [];
  return Array.from({ length: echo.taps }, (_, k) => ({
    delay: echo.delay * (1 + 0.85 * k),
    gain: Math.min(ECHO_MOST, echo.gain * echo.fall ** k) * pace,
    lowpass: Math.min(lowpass, echo.dark * 0.75 ** k),
    pan: (k % 2 === 0 ? side : -side) * Math.min(0.5, 0.2 + 0.1 * k),
  }));
}
