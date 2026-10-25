/**
 * The sky takes part in the weather (round 80: the stars were the same in a clear spell and a thunderstorm): rain and storm close a cloud
 * ceiling from the horizon, the stars go out, the moon is veiled and the moonlit ground dims, the mist loses its pale lobe on the moon's side,
 * and each flash of lightning lights the cloud's belly in its structure (shaders/sky.ts); after the spell the stars come back over some forty
 * seconds. On a clear night, now and then, a bank of cloud crosses the moon (`veilAt`), the night breathes with it, and thin cloud draws a ring
 * about it. The moon is never dimmed below four tenths of itself, and a roofed room has none of it. Render only; the lights it dims are set
 * anew each frame (realityFx.ts, lantern.ts, volumetricFog.ts), so nothing is kept.
 */

import type * as THREE from 'three';
import { OVERCAST, VEIL } from '../data/skyAir';
import { LIGHTNING } from '../data/tuning';
import type { Game } from '../systems/components';
import type { PostPass } from './postPass';
import { hash2, smooth, type SkyAtm } from './skyForce';
import { worldUniforms } from './worldMaterial';

/** How shut the sky is by a spell of `kind` at `amount` (0..1): the ceiling a kind closes, whole once the spell has gathered. */
export const overcastOf = (kind: string | undefined, amount: number): number => (kind ? (OVERCAST.kinds[kind] ?? 0) : 0) * smooth(0, OVERCAST.gather, amount);

/** The bank of cloud across the moon at `time` (0..1): in each slot of the night, by chance, one bank that comes on, holds and thins away over 24 to 48 seconds. */
export function veilAt(time: number): number {
  const slot = Math.floor(time / VEIL.slot);
  if (hash2(slot, 1) >= VEIL.chance) return 0;
  const last = VEIL.last[0] + (VEIL.last[1] - VEIL.last[0]) * hash2(slot, 2);
  const t = (time - slot * VEIL.slot - (VEIL.slot - VEIL.last[1]) * hash2(slot, 3)) / last;
  return t <= 0 || t >= 1 ? 0 : smooth(0, 0.35, t) * smooth(1, 0.65, t);
}

/** `now` moved toward `to` by `dt` seconds: closing in `up` seconds, opening in `down`. */
export const slew = (now: number, to: number, dt: number, up: number, down: number): number => (to > now ? Math.min(to, now + dt / up) : Math.max(to, now - dt / down));

/** The share of a realm's cloud cover that gives it a bank across the moon: none where the air is clear (the Mountains, Pnakotus, Yuggoth) or there is no moon. */
export const bankShare = (clouds: number, moon: number): number => smooth(VEIL.clouds[0], VEIL.clouds[1], clouds) * smooth(0, 0.02, moon);

/** Lightning's share of a frame's light, read back off the sky's flash (lightning.ts sets it to 0.085 × LIGHTNING.sky × the strike's light), so the dimming leaves the flash whole. */
export const flashOf = (flash: number): number => flash / (0.085 * LIGHTNING.sky);

const take = (v: THREE.Vector3, k: number, added: number): void => void v.addScalar(-added).multiplyScalar(k).addScalar(added);

export interface Overcast {
  /** Each drawn frame, after the lightning has added its flash: `enclosed`, under a roof. */
  update(time: number, enclosed: boolean): void;
}

export function createOvercast(g: Game, sky: THREE.Mesh, post: PostPass, atm: SkyAtm): Overcast {
  const u = (sky.material as THREE.ShaderMaterial).uniforms;
  let last = -1;
  return {
    update(time) {
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const w = g.overworld?.weather;
      const want = atm.force.over ?? (g.overworld ? overcastOf(w?.kind, w?.amount ?? 0) : 0);
      atm.over = !g.overworld && atm.force.over === undefined ? 0 : atm.force.snap ? want : slew(atm.over, want, dt, OVERCAST.rise, OVERCAST.fall); // (the arena has no weather)
      const open = u.uOpen.value as number; // under a roof the room's light is nightFx's: the sky's weather does not reach it, and is there again at the door
      const bank = atm.force.veil ?? veilAt(time) * bankShare(u.uClouds.value as number, u.uMoon.value as number);
      atm.veil = bank * (1 - atm.over);
      u.uOver.value = atm.over;
      u.uVeil.value = atm.veil;
      const k = atm.over * open;
      const v = atm.veil * open;
      const f = Math.max(0, flashOf(u.uFlash.value as number));
      const moon = 1 - OVERCAST.moon * Math.max(k, VEIL.light * v);
      const mist = 1 - OVERCAST.sky * k;
      if (moon < 1) take(worldUniforms.uLightColor.value, moon, LIGHTNING.light * f);
      if (k > 0) {
        take(worldUniforms.uAmbient.value, 1 - OVERCAST.ambient * k, LIGHTNING.light * 0.5 * f);
        for (const c of [u.uHorizon, u.uZenith, u.uFogColor]) (c.value as THREE.Vector3).multiplyScalar(mist); // the sky is darker, and so is what the land fades into
        worldUniforms.uFogColor.value.multiplyScalar(mist);
        take(post.uniforms.uFogColor.value, mist, LIGHTNING.mist * f);
      }
      post.uniforms.uFogAir.value.z *= 1 - Math.min(1, OVERCAST.lobe * k + VEIL.mist * v); // the mist's pale lobe on the moon's side: a roof of cloud puts it out
    },
  };
}
