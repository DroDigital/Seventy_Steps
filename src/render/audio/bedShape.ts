/**
 * Round 80, what the hour and the place make of a bed: its share of the level it is listed at, the cutoff it is played through, and how
 * far its stereo is drawn toward the water. Pure: render/audio/ambience.ts applies it to the nodes of each recording it plays; the mood
 * it is given is the clock's phase (data/ambienceHours.ts) and `PLACED` (render/audio/exposure.ts).
 */

import { hourBed } from '../../data/ambienceHours';
import { roleOf, SEA_PLACE, SEA_SPOT, SEA_SPOTS, WIND_PLACE } from '../../data/ambienceRoles';

/** What the beds are told of the world. */
export interface BedWorld {
  hourly: boolean; // the hour applies (outdoors in the open world)
  placed: boolean; // the sea and the wind are placed
  phase: number;
  shore: number;
  pan: number; // where the water lies against the listener's right
  exposure: number;
}

export interface Shaped {
  gain: number; // against the bed's listed level (as played: data/samples.ts BED_TRIM)
  cutoff: number | null; // Hz, the bed's low-pass (null: the bed has none)
  lean: number; // 0..1: how far toward the water's bearing its readers are panned
}

/** A bed's file (without the extension) and its own cutoff (BED_MANNER), shaped for the world. */
export function shapeBed(file: string, base: number | undefined, w: BedWorld): Shaped {
  let gain = w.hourly ? hourBed(file, w.phase) : 1;
  let cutoff = base ?? null;
  let lean = 0;
  const role = w.placed ? roleOf(file) : 'other';
  if (role === 'sea') {
    gain *= SEA_PLACE.inland + SEA_PLACE.gain * w.shore;
    if (base) cutoff = Math.min(base, SEA_PLACE.low + SEA_PLACE.high * w.shore);
    lean = SEA_PLACE.pan * w.shore;
  } else if (role === 'wind') {
    gain *= 1 + (w.exposure >= 0 ? WIND_PLACE.lift : WIND_PLACE.lee) * w.exposure;
    if (base) cutoff = base * (1 + WIND_PLACE.bright * w.exposure);
  }
  return { gain: Math.min(WIND_PLACE.most, gain), cutoff, lean };
}

/** Where a spot sound sits and how loud: the hull's knock and the gurgle come from the water (and softer inland); the rest from anywhere. `rand` is -1..1. */
export function spotPlace(set: string, w: BedWorld, rand: number): { pan: number; gain: number } {
  if (!w.placed || !SEA_SPOTS.has(set) || w.shore < 0.1) return { pan: rand * 0.85, gain: 1 };
  return { pan: Math.max(-1, Math.min(1, w.pan * 0.9 + rand * SEA_SPOT.jitter)), gain: SEA_SPOT.inland + (1 - SEA_SPOT.inland) * w.shore };
}
