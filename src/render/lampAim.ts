/**
 * Where a light throws its glow in the mist (round 78). The mist's glow of a light (shaders/fog.ts glowAlong) was a ball, so a lit
 * window glowed as much behind its wall as before its glass and a street lamp as much above itself as below. Now each of the
 * shader's lamp slots is told a direction and how sharply the light holds to it: a lit window's is outward from its glass (the offset
 * houseMesh.ts gives its spot), a street lamp's is down; fires, torches and the rest stay all round. Render only: the world shader's
 * own lamps (lampLight, which the sprites, the sea and the signs share) are not touched.
 */

import * as THREE from 'three';
import { BEAM } from '../data/mistLight';
import type { PostPass } from './postPass';
import { LIGHT_VIEW, type LightSpot } from './worldLights';
import { LAMP_SLOTS } from './shaders/world';

/** The aim of a light: xyz a unit direction, w how sharply it holds to it (0: all round). */
export function aimOf(s: LightSpot, out: THREE.Vector4 = new THREE.Vector4()): THREE.Vector4 {
  if (s.kind === 'window' && s.glass) {
    const [nx, nz] = [s.x - s.glass.x, s.z - s.glass.z];
    const n = Math.hypot(nx, nz);
    if (n > 1e-4) return out.set(nx / n, 0, nz / n, BEAM.window.sharp);
  }
  if (s.kind === 'lamp') return out.set(0, -1, 0, BEAM.lamp.sharp);
  return out.set(0, 0, 0, 0);
}

export interface LampAim {
  /** Each drawn frame, after the lights are chosen (worldLights.ts): `on` is false in a room under a roof, where every light is all round, as it was. */
  update(on: boolean): void;
}

export function createLampAim(post: PostPass): LampAim {
  const aims = post.uniforms.uLampAim.value;
  let kept = 0; // the slots last written, so a frame that has none leaves them all round at once
  return {
    update(on) {
      const seen = LIGHT_VIEW.seen;
      let n = 0;
      if (on) for (; n < LAMP_SLOTS && n < seen.length; n++) aimOf(seen[n].s, aims[n]);
      for (let i = n; i < kept; i++) aims[i].set(0, 0, 0, 0);
      kept = n;
    },
  };
}
