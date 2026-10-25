/**
 * Round 80, the sea where the sea is, the wind where it blows: what the land about the investigator says to the beds. Four rings of
 * points (data/ambienceRoles.ts `SENSE`) are looked at every quarter second in twelve directions: where the ground lies below the
 * sea, how much of the horizon it is and which way, and whether the investigator stands above the land about (a ridge) or under it
 * (a lee). The readings are eased, up quickly and down slowly, into `PLACED`, which render/audio/ambience.ts reads for its beds and
 * its spots. Render only: it reads the pure land (world/land.ts) and the sim writes nothing. `read` is the pure part, tested with
 * made-up heights.
 */

import type { V3 } from '../../core/geom';
import { SENSE } from '../../data/ambienceRoles';
import { WORLD } from '../../data/tuning';
import { landHeight } from '../../world/land';

/** What the beds are told: whether they are placed at all, and by how much and which way. */
export const PLACED = {
  on: false, // outdoors in the open world (not under a roof, in the arena, or at a gallop)
  shore: 0, // 0..1: none of the sea about, to standing in it
  pan: 0, // -1..1: where the water lies against the listener's right, drawn toward the middle where it lies on every side
  exposure: 0, // -1..1: in a lee, to on a height
};

/** The heights seen: here, and about it on each ring (by `SENSE.rings`), in each of `SENSE.bearings` directions (the first north, +z, turning toward +x). */
export interface Look {
  here: number;
  rings: readonly (readonly number[])[];
}

export interface Reading {
  shore: number;
  lean: { x: number; z: number }; // toward the sea: its direction, as long as the sea lies to one side (0 where it lies all about)
  exposure: number;
}

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const angle = (k: number): number => (k / SENSE.bearings) * Math.PI * 2;

/** What a look says: the sea's share of the horizon, weighted by how near, its lean, and the height against the land about. */
export function read(look: Look, level: number = WORLD.seaLevel): Reading {
  const sea = level - SENSE.below;
  if (look.here < sea) return { shore: 1, lean: { x: 0, z: 0 }, exposure: 0 }; // wading, or deeper
  let [total, most, sx, sz] = [0, 0, 0, 0];
  for (let k = 0; k < SENSE.bearings; k++) {
    for (let r = 0; r < look.rings.length; r++) {
      if (look.rings[r][k] >= sea) continue;
      const w = SENSE.share[r];
      total += w;
      most = Math.max(most, w);
      sx += w * Math.sin(angle(k));
      sz += w * Math.cos(angle(k));
      break; // (the nearest sea in that direction)
    }
  }
  const [a, b] = SENSE.wind;
  const [ra, rb] = [SENSE.rings.indexOf(a), SENSE.rings.indexOf(b)];
  const about = [...look.rings[ra], ...look.rings[rb]].reduce((s, h) => s + Math.max(h, level), 0) / (2 * SENSE.bearings);
  return {
    shore: clamp(most * 0.55 + (total / SENSE.bearings) * 1.2),
    lean: total > 0 ? { x: sx / total, z: sz / total } : { x: 0, z: 0 },
    exposure: clamp((Math.max(look.here, level) - about) / SENSE.scale, -1, 1),
  };
}

/** The heights about (x, z), by `height`. */
export const lookAt = (height: (x: number, z: number) => number, x: number, z: number): Look => ({
  here: height(x, z),
  rings: SENSE.rings.map((r) => Array.from({ length: SENSE.bearings }, (_, k) => height(x + Math.sin(angle(k)) * r, z + Math.cos(angle(k)) * r))),
});

export interface Exposure {
  /** Looks again when it is time and eases `PLACED` toward what it sees; `sea`: whether this realm has any, `wind`: whether the wind is the land's to place (not a gallop's own). `right` is the listener's right. */
  update(seconds: number, at: V3, right: V3, o: { sea: boolean; wind: boolean }): void;
  /** The bearing (radians from +z toward +x) to the nearest sea a long way off, or null where none lies within the reach (600 m: a realm is 512 across) (the foghorn's, the buoy's). */
  seaward(at: V3): number | null;
  /** Takes the next look whole, at once (after a jump, or on the title). */
  reset(): void;
}

const FAR_RINGS = [120, 220, 340, 480, 600] as const;
const FAR_BEARINGS = 16;

export function createExposure(height: (x: number, z: number) => number = landHeight, level: number = WORLD.seaLevel): Exposure {
  let last = -Infinity;
  let from: V3 | null = null;
  const eased = { shore: 0, x: 0, z: 0, exposure: 0 };
  const ease = (now: number, target: number, dt: number, up: number, down: number): number => now + (target - now) * (1 - Math.exp(-dt / (target > now ? up : down)));
  return {
    update(seconds, at, right, o) {
      const gap = seconds - last;
      if (gap >= SENSE.every || gap < 0) {
        const jump = from === null || gap < 0 || Math.hypot(at.x - from.x, at.z - from.z) > 60;
        const dt = jump ? 1e6 : Math.min(gap, 1);
        const r = read(lookAt(height, at.x, at.z), level);
        eased.shore = ease(eased.shore, o.sea ? r.shore : 0, dt, SENSE.rise, SENSE.fall);
        eased.x = ease(eased.x, r.lean.x, dt, 1.5, 1.5);
        eased.z = ease(eased.z, r.lean.z, dt, 1.5, 1.5);
        eased.exposure = ease(eased.exposure, o.wind ? r.exposure : 0, dt, 2, 2);
        [last, from] = [seconds, { x: at.x, y: at.y, z: at.z }];
      }
      PLACED.shore = eased.shore;
      PLACED.exposure = eased.exposure;
      PLACED.pan = clamp(eased.x * right.x + eased.z * right.z, -1, 1) * clamp(eased.shore * 2); // (the stereo field of a turning head: every frame)
    },
    seaward(at) {
      const sea = level - SENSE.below;
      let [sx, sz, w] = [0, 0, 0];
      for (let k = 0; k < FAR_BEARINGS; k++) {
        const a = (k / FAR_BEARINGS) * Math.PI * 2;
        for (const r of FAR_RINGS) {
          if (height(at.x + Math.sin(a) * r, at.z + Math.cos(a) * r) >= sea) continue;
          [sx, sz, w] = [sx + Math.sin(a) / r, sz + Math.cos(a) / r, w + 1 / r];
          break;
        }
      }
      return w > 0 && Math.hypot(sx, sz) > 0.35 * w ? Math.atan2(sx, sz) : null;
    },
    reset() {
      last = -Infinity;
      from = null;
    },
  };
}
