/**
 * What a fire gives off (round 74, asked for: "better fire everywhere" from free animations): every fire within sight of the eye breathes a thin dark
 * smoke, in puffs cut from a free smoke sprite (data/flameAtlas.ts: Kenney's Smoke Particles, CC0), that the wind leans over, and throws up a few
 * embers that rise, cool from white to red and go out. A torch on a wall within a few paces sends up a wisp now and then. Render only; the flames
 * themselves are flames.ts's.
 */

import type * as THREE from 'three';
import type { Rgb } from './palette';
import type { Particles } from './particles';
import type { LightSpot, WorldLights } from './worldLights';
import { worldUniforms } from './worldMaterial';

const FIRE = { reach: 32, smoke: 0.8, embers: 1.8 } as const; // metres of sight, and puffs and embers a second at a fire
const TORCH = { reach: 9, smoke: 0.12 } as const;
const SMOKE: Rgb = [0.2, 0.2, 0.23];
const EMBER: Rgb = [1, 0.85, 0.5];
const EMBER_END: Rgb = [0.55, 0.1, 0.04];

export interface FireLife {
  update(eye: THREE.Vector3, time: number): void;
}

export function createFireLife(particles: Particles, lights: Pick<WorldLights, 'fires'>): FireLife {
  let last = -1;
  const give = (s: LightSpot, dt: number, smoke: number, embers: number, wind: number): void => {
    if (Math.random() < smoke * dt) {
      particles.spawn({
        x: s.x + (Math.random() - 0.5) * 0.25, y: s.y + 0.1, z: s.z + (Math.random() - 0.5) * 0.25,
        vx: wind * (0.3 + 0.3 * Math.random()), vy: 0.7 + 0.4 * Math.random(), vz: wind * 0.15 * (Math.random() - 0.4),
        life: 3.2 + 1.6 * Math.random(), size: 0.3, grow: 4.2, color: SMOKE, alpha: 0.32, drag: 0.35, hold: 0.15,
        shape: 'puff', thick: Math.random(), rot: Math.random() * 6.28, spin: 0.2 * (Math.random() - 0.5),
      });
    }
    if (Math.random() < embers * dt) {
      particles.spawn({
        x: s.x + (Math.random() - 0.5) * 0.3, y: s.y, z: s.z + (Math.random() - 0.5) * 0.3,
        vx: wind * 0.4 + (Math.random() - 0.5) * 0.5, vy: 0.9 + 0.8 * Math.random(), vz: (Math.random() - 0.5) * 0.5,
        life: 1.1 + 1.1 * Math.random(), size: 0.055, grow: 0.5, color: EMBER, colorEnd: EMBER_END, alpha: 1, glow: true, drag: 0.6, hold: 0.35, shape: 'disc',
      });
    }
  };
  return {
    update(eye, time) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      if (dt <= 0) return;
      const wind = 0.45 + 0.3 * worldUniforms.uWind.value;
      lights.fires(eye, Math.max(FIRE.reach, TORCH.reach), (s, d) => {
        if (s.kind === 'fire') {
          if (d < FIRE.reach) give(s, dt, FIRE.smoke, FIRE.embers, wind);
        } else if (d < TORCH.reach) give(s, dt, TORCH.smoke, 0, wind);
      });
    },
  };
}
