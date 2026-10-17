/**
 * How a mount's horse goes (round 50): one pure model of the gait that the simulation, the picture and the sound all read.
 * The simulation counts the cycle by the metres it rides (`MountState.phase`: whole cycles, one metre of a long stride is a
 * smaller part of it than one of a short stride), the rig puts each foot where the cycle says, and the hoofbeats are heard on
 * the frames those feet come down. A foot on the ground stands still on it (the body rides over it at the speed it is going),
 * so the picture does not skate and the sound is the foot's own. No Three.js, no randomness.
 */

import { MOUNT_TRAVERSAL } from '../data/mounts';

/** Legs in the order the rig and the hoofbeats share. */
export const LEG = { LF: 0, RF: 1, LH: 2, RH: 3 } as const;
export const LEG_COUNT = 4;
export type Legs = readonly [number, number, number, number];
export type GaitKind = 'stand' | 'walk' | 'trot' | 'canter' | 'gallop';

/** The footfall of each leg as a share of the cycle, [LF, RF, LH, RH]. */
const WALK: Legs = [0.25, 0.75, 0, 0.5]; // four beats, a lateral sequence: hind, fore, hind, fore
const TROT: Legs = [0.5, 0, 0, 0.5]; // two beats, the diagonals together
const CANTER: Legs = [0.67, 0.33, 0.33, 0]; // three beats: the right hind, the diagonal pair (left hind and right fore), the leading left fore
const GALLOP: Legs = [0.62, 0.48, 0.14, 0]; // four beats and a flight: the hinds, a pause, the fores

interface Key { speed: number; length: number; duty: number; offsets: Legs; kind: GaitKind }
/** The speeds below were set for a full gallop of 18 m/s (round 50); they follow the mounts' gallop as it is changed (round 55: 10.5). */
export const gaitScale = MOUNT_TRAVERSAL.gallop / 18;
/** Metres a cycle covers and the share of it a foot is down, at the speed each gait settles into. */
const KEYS: readonly Key[] = [
  { speed: 1.5 * gaitScale, length: 1.8, duty: 0.64, offsets: WALK, kind: 'walk' },
  { speed: 5.5 * gaitScale, length: 3.2, duty: 0.46, offsets: TROT, kind: 'trot' },
  { speed: 10 * gaitScale, length: 4.4, duty: 0.32, offsets: CANTER, kind: 'canter' },
  { speed: 17 * gaitScale, length: 5.4, duty: 0.26, offsets: GALLOP, kind: 'gallop' },
];

/** Below this a mount stands. */
export const STAND_SPEED = 0.3;

const smooth = (t: number): number => t * t * (3 - 2 * t);
const wrapHalf = (d: number): number => d - Math.round(d);
const frac = (x: number): number => x - Math.floor(x);

export interface Gait {
  kind: GaitKind;
  /** Metres one cycle covers. */
  length: number;
  /** The share of the cycle each foot is down. */
  duty: number;
  /** Where in the cycle each foot comes down. */
  offsets: Legs;
  /** 0 at a walk to 1 at the full gallop: how far the whole body is stretched out. */
  stretch: number;
}

/** The gait at `speed`: its numbers blended between two neighbours (a foot's footfall moves the short way round the cycle). */
export function gaitAt(speed: number): Gait {
  const s = Math.max(0, speed);
  const last = KEYS.length - 1;
  let i = 0;
  while (i < last && s > KEYS[i + 1].speed) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(last, i + 1)];
  const t = a === b || s <= a.speed ? 0 : s >= b.speed ? 1 : smooth((s - a.speed) / (b.speed - a.speed));
  const offsets = a.offsets.map((o, k) => frac(o + wrapHalf(b.offsets[k] - o) * t)) as unknown as Legs;
  const kind: GaitKind = s < STAND_SPEED ? 'stand' : (t < 0.5 ? a : b).kind;
  return { kind, length: a.length + (b.length - a.length) * t, duty: a.duty + (b.duty - a.duty) * t, offsets, stretch: Math.min(1, Math.max(0, (s - KEYS[0].speed) / (KEYS[last].speed - KEYS[0].speed))) };
}

/** Metres one gait cycle covers at `speed`. */
export const strideLength = (speed: number): number => gaitAt(speed).length;

/** The cycles a ride of `metres` at `speed` adds. */
export const cyclesFor = (metres: number, speed: number): number => (metres > 0 ? metres / strideLength(speed) : 0);

/** Where in its own cycle a leg is, 0..1: 0 is the instant its foot comes down, `duty` the instant it leaves the ground. */
export const legPhase = (cycle: number, offset: number): number => frac(cycle - offset);

/**
 * A foot's place along the body and its lift, for a leg at `phase` of a gait of `duty` and `sweep` metres from where it comes
 * down to where it leaves. `z` is relative to the leg's own mean place (positive forward); `lift` is 0..1 of the swing's height.
 * While the foot is down it moves back at exactly the speed the body goes forward: `sweep / duty` of its cycle.
 */
export function footAt(phase: number, duty: number, sweep: number): { z: number; lift: number; down: boolean } {
  if (phase < duty) return { z: sweep * (0.5 - phase / duty), lift: 0, down: true };
  const u = (phase - duty) / (1 - duty);
  const ease = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u); // the foot leaves slowly, hurries through the air and settles
  return { z: sweep * (-0.5 + ease), lift: Math.sin(Math.PI * Math.min(1, u * 1.04)) ** 0.85, down: false };
}

/** The legs whose feet came down as the cycle went from `from` to `to` (in the order of `LEG`). */
export function touchdowns(from: number, to: number, speed: number): number[] {
  if (!(to > from) || !(speed > STAND_SPEED)) return [];
  const { offsets } = gaitAt(speed);
  const out: number[] = [];
  for (let leg = 0; leg < LEG_COUNT; leg++) if (Math.floor(to - offsets[leg]) > Math.floor(from - offsets[leg])) out.push(leg);
  return out;
}

/** How hard a foot comes down at `speed`, 0.35 at a walk to 1 at a gallop. */
export const hoofWeight = (speed: number): number => 0.35 + 0.65 * gaitAt(speed).stretch;
