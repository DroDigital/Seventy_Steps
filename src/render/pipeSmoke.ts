/**
 * A smoker's pipe (round 39): a thin grey thread from the bowl while he holds it, and the breath let out after a
 * long draw (render/npcActs.ts `pipeBeat`), leaning over with the wind and spreading as it climbs. Few and faint:
 * a few puffs a second at most, and none beyond sixty paces. Render only.
 */

import type * as THREE from 'three';
import type { Particles } from './particles';
import type { Rgb } from './palette';
import { worldUniforms } from './worldMaterial';

export interface Smoker {
  bowl: THREE.Vector3; // the top of the pipe's bowl
  mouth: THREE.Vector3;
  out: number; // 0..1, the breath let out
  draw: number; // 0..1, the pipe at the lips
}

const REACH = 60;
const SMOKE: Rgb = [0.66, 0.67, 0.72];
const THREAD = 4; // puffs a second from the bowl
const BREATH = 11; // puffs a second from the mouth, while the breath goes out

export interface PipeSmoke {
  update(camera: THREE.Camera, time: number, smokers: readonly Smoker[]): void;
}

export function createPipeSmoke(particles: Particles): PipeSmoke {
  let last = -1;
  return {
    update(camera, time, smokers) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      if (dt <= 0) return;
      const wind = 0.12 + 0.2 * worldUniforms.uWind.value;
      for (const s of smokers) {
        if (s.bowl.distanceTo(camera.position) > REACH) continue;
        if (Math.random() < THREAD * (1 - 0.7 * s.draw) * dt) { // a thread from the bowl (less while it is drawn on: the smoke is going the other way)
          particles.spawn({
            x: s.bowl.x + (Math.random() - 0.5) * 0.01, y: s.bowl.y + 0.01, z: s.bowl.z + (Math.random() - 0.5) * 0.01,
            vx: wind * (0.6 + 0.5 * Math.random()), vy: 0.2 + 0.12 * Math.random(), vz: wind * 0.25 * (Math.random() - 0.4),
            life: 2.4 + 1.2 * Math.random(), size: 0.05, grow: 8, color: SMOKE, alpha: 0.32, drag: 0.5,
          });
        }
        if (s.out > 0.25 && Math.random() < BREATH * s.out * dt) { // the breath let out, rolling off before the face and rising
          particles.spawn({
            x: s.mouth.x + (Math.random() - 0.5) * 0.03, y: s.mouth.y, z: s.mouth.z + (Math.random() - 0.5) * 0.03,
            vx: wind * (0.8 + 0.4 * Math.random()) + (Math.random() - 0.5) * 0.12, vy: 0.14 + 0.1 * Math.random(), vz: (Math.random() - 0.5) * 0.12,
            life: 2.8 + 1.4 * Math.random(), size: 0.09, grow: 6, color: SMOKE, alpha: 0.36, drag: 0.7,
          });
        }
      }
    },
  };
}
