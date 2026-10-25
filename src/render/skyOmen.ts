/**
 * The wrong moon and the Alignment (round 78; "when the stars were right": the stars as a clock of the Old Ones, and knowledge as what makes the sky
 * readable and worse): as the mind slips the moon swells and sours toward violet, slowly, a little different each night; and every few minutes, tilting
 * the camera up shows that in one patch of the sky the stars have stopped crawling and settled into the game's own Elder Sign, nine stars in dotted
 * lines (shaders/skyOmen.ts). It holds for a dozen seconds and drifts apart. The more insight the investigator has gathered, the more often it comes,
 * even with a steady mind. A function of the render clock (a hash of its slot, like skyline.ts's false city), so a pause and a replay see the same sky.
 * Render only: the failing mind's strength is read off the sky's `uWrong` (set from the FX, so the intensity cap and the dread toggle govern it).
 */

import * as THREE from 'three';
import { OMEN } from '../data/skyAir';
import type { Game } from '../systems/components';
import { PASSAGE_NEED } from '../systems/veil';
import { hash2, smooth, type SkyAtm } from './skyForce';

export interface Omen {
  amount: number; // 0..1: how far the stars have settled
  id: number; // which slot's episode, to know a new one begins
  elevation: number; // radians above the horizon
  bearing: number; // radians, where the sky measures it (atan2 of x over z), when the eye gives none
}

/** How likely a slot is to hold an episode (0..OMEN.chance): a failing mind's, or the insight gathered (0..1) taken at half; none at all when both are nothing. */
export const chanceOf = (stress: number, know: number): number => OMEN.chance * Math.max(smooth(OMEN.stress[0], OMEN.stress[1], stress), OMEN.know * Math.min(1, Math.max(0, know)));

/** The Alignment at `time`: the episode of its slot, if there is one and `time` is within it. */
export function omenAt(time: number, stress: number, know: number): Omen {
  const id = Math.floor(time / OMEN.slot);
  const out: Omen = { amount: 0, id, elevation: OMEN.elevation[0] + (OMEN.elevation[1] - OMEN.elevation[0]) * hash2(id, 5), bearing: hash2(id, 4) * 2 * Math.PI };
  if (hash2(id, 1) >= chanceOf(stress, know)) return out;
  const t = time - id * OMEN.slot - (OMEN.slot - OMEN.last) * hash2(id, 2);
  if (t <= 0 || t >= OMEN.last) return out;
  out.amount = smooth(0, OMEN.fade, t) * smooth(OMEN.last, OMEN.last - OMEN.fade, t);
  return out;
}

/** The moon's growth (0..OMEN.swell) in a mind gone `wrong` (0..1) at `time`: a slow swelling and easing between knots hashed from the clock, so no night is the last's and there is no step. */
export function moonSwell(time: number, wrong: number): number {
  const k = time / (OMEN.period / 2);
  const wave = hash2(Math.floor(k), 8) + (hash2(Math.floor(k) + 1, 8) - hash2(Math.floor(k), 8)) * smooth(0, 1, k - Math.floor(k));
  return OMEN.swell * Math.min(1, Math.max(0, wrong)) * (0.2 + 0.8 * wave);
}

export interface SkyOmen {
  update(camera: THREE.Camera, time: number, enclosed: boolean): void;
}

export function createSkyOmen(g: Game, sky: THREE.Mesh, atm: SkyAtm): SkyOmen {
  const u = (sky.material as THREE.ShaderMaterial).uniforms;
  const dir = new THREE.Vector3();
  let [shown, bearing] = [-1, 0];
  return {
    update(camera, time, enclosed) {
      const wrong = atm.force.wrong ?? (u.uWrong.value as number); // the failing mind's strange (0..1): fx.ts has already weighed the cap and the toggle
      const know = Math.min(1, g.mind.insight / Math.max(1, PASSAGE_NEED));
      const hold = atm.force.omen;
      const o = g.overworld && !enclosed && !g.cutscene ? omenAt(time, wrong, know) : { amount: 0, id: -1, elevation: 0.55, bearing: 0 };
      if (hold || (o.amount > 0 && o.id !== shown)) {
        if (!hold) shown = o.id; // an episode begins: it settles where the eye then looks, a little to one side
        camera.getWorldDirection(dir);
        bearing = hold?.yaw ?? Math.atan2(dir.x, dir.z) + OMEN.lean * (2 * hash2(o.id, 6) - 1);
      }
      atm.omen = hold ? hold.amount : o.amount;
      atm.swell = g.overworld ? moonSwell(time, wrong) : 0;
      const el = hold ? 0.55 : o.elevation;
      u.uOmen.value = atm.omen;
      (u.uOmenAt.value as THREE.Vector3).set(Math.cos(el) * Math.sin(bearing), Math.sin(el), Math.cos(el) * Math.cos(bearing));
      u.uMoonSwell.value = atm.swell;
      u.uMoonSour.value = OMEN.sour * wrong;
    },
  };
}
