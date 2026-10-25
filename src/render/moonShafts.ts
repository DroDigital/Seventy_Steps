/**
 * The moon's shafts in the mist (round 78): how strongly the post pass lets the mist follow the moon's shadows (shaders/fogShaft.ts).
 * Strongest while the moon is low enough for its shadows to lie long and not so low that the map is off, thinner as it climbs to
 * its height; as thick as the mist is (none at the Fog setting 0, none under a roof or in the arena, where no shadow map is drawn);
 * veiled as a spell of weather comes over the moon. Render only: it writes one uniform, `uShaft`, and nothing the simulation reads.
 */

import { SHAFT } from '../data/mistLight';
import type { Weather } from '../systems/weather';
import type { PostPass } from './postPass';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The share of the moon the weather leaves: 1 under a clear sky, down to nothing in a storm at its height. */
export function moonVeil(w: Pick<Weather, 'kind' | 'amount'> | undefined): number {
  const cloud = w ? (SHAFT.cloud[w.kind] ?? 0) * clamp01(w.amount) : 0;
  return 1 - cloud;
}

/** How strongly the mist follows the moon's shadows, 0..SHAFT.gain: `moonY` the height of the moon (the sine of its elevation), `veil` what the weather leaves of it (moonVeil), `mist` the density of the low mist at the ground as drawn (volumetricFog.ts MIST.thickness). */
export function shaftStrength(i: { moonY: number; veil: number; mist: number }): number {
  const [from, to, share] = SHAFT.moonHigh;
  const height = smooth(SHAFT.moonLow, SHAFT.moonFull, i.moonY) * (1 - (1 - share) * smooth(from, to, i.moonY));
  return SHAFT.gain * height * clamp01(i.veil) * smooth(SHAFT.mistLeast, SHAFT.mistFull, i.mist);
}

export interface MoonShafts {
  /** Each drawn frame: `moonY` the moon's height, `mist` the mist's density, `on` whether the open air is where the camera is (not under a roof, not the arena). */
  update(time: number, moonY: number, mist: number, weather: Weather | undefined, on: boolean): void;
}

export function createMoonShafts(post: PostPass): MoonShafts {
  let [last, eased] = [-1, 0];
  return {
    update(time, moonY, mist, weather, on) {
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const want = on ? shaftStrength({ moonY, veil: moonVeil(weather), mist }) : 0;
      eased += (want - eased) * Math.min(1, dt / SHAFT.ease);
      post.uniforms.uShaft.value.x = eased < 0.003 ? 0 : eased; // (none at all: the march is not run)
    },
  };
}
