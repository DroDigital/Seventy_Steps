/**
 * The night turning, seen (round 26; systems/clock.ts): the moon moves across the sky through the night,
 * climbing to its height and lowering again, and the light it casts on the world swings with it; and in
 * the last hour the sky greys, the haze and the mist lift, the nearest thing to a dawn the dream has, and
 * at the turn it is night again. The moon's light and the mist are reset each frame (lantern.ts,
 * volumetricFog.ts), so this only adds to them after. Render only.
 */

import * as THREE from 'three';
import { CLOCK, DUNGEON_LIGHT, LIGHT } from '../data/tuning';
import { dawnOf, moonHigh, phaseOf } from '../systems/clock';
import type { Game } from '../systems/components';
import type { PostPass } from './postPass';
import { worldUniforms } from './worldMaterial';

const base = new THREE.Vector3(...LIGHT.nightMoonDir).normalize();
const [az0, el0] = [Math.atan2(base.x, base.z), Math.asin(base.y)];

/** The direction of the moon's light at `phase` of the night: swung across about a radian, its height up by half again at the peak and down by half at each end. */
export function moonDir(phase: number, out = new THREE.Vector3()): THREE.Vector3 {
  const az = az0 + (phase - 0.5) * 1.8;
  const el = el0 * (0.5 + moonHigh(phase));
  return out.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
}

export interface NightFx {
  /** `enclosed`: under a dungeon's roof, where the moon's course and the last hour's grey do not reach (DUNGEON_LIGHT). */
  update(time: number, enclosed?: boolean): void;
}

export function createNightFx(g: Game, sky: THREE.Mesh, post: PostPass): NightFx {
  const mat = sky.material as THREE.ShaderMaterial;
  const dir = new THREE.Vector3();
  const still = moonDir(CLOCK.start); // the slant a roofed room keeps all night
  let inside = 0; // how far the room's light has taken over from the sky's (0..1)
  let last = -1;
  return {
    update(time, enclosed = false) {
      if (!g.overworld) return; // the arena's night stays as it is
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      inside += ((enclosed ? 1 : 0) - inside) * Math.min(1, dt * DUNGEON_LIGHT.ease);
      const phase = phaseOf(time);
      moonDir(phase, dir).lerp(still, inside).normalize();
      (mat.uniforms.uMoonDir.value as THREE.Vector3).copy(dir);
      worldUniforms.uLightDir.value.copy(dir);
      worldUniforms.uLightColor.value.multiplyScalar(1 - inside * (1 - DUNGEON_LIGHT.moon)); // (reset each frame: realityFx.ts)
      const dawn = dawnOf(phase) * (1 - inside); // the grey of the last hour is the sky's: it is not seen under a roof
      if (dawn <= 0.001) return;
      worldUniforms.uAmbient.value.addScalar(0.05 * dawn);
      worldUniforms.uLightColor.value.multiplyScalar(1 + 0.4 * dawn);
      (mat.uniforms.uHorizon.value as THREE.Vector3).addScalar(0.07 * dawn); // the sky's haze lifts (sky.ts sets these anew each frame; it was once uHazeColor, which the realms' skies no longer have, and the last hour crashed the game)
      (mat.uniforms.uZenith.value as THREE.Vector3).addScalar(0.035 * dawn);
      post.uniforms.uFogColor.value.addScalar(0.035 * dawn);
    },
  };
}
