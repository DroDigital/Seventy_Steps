/**
 * Round 80, atmosphere: motes in the lantern's light (data/lanternMotes.ts). A few specks of dust and spore hang in the pool of the
 * lantern and glint as the investigator walks through them: the lantern's light becomes a thing in the air, and the view behind has its
 * parallax. Outdoors they hang and lift a little; in a crypt they are more, and settle. Not born when the flame is out or guttering, in a
 * gale, or near the lens. They are not self-lit: the particle shader lights them by the lantern, so they show only inside its pool.
 * Render only.
 */

import type * as THREE from 'three';
import { LANTERN_MOTES as M } from '../data/lanternMotes';
import type { Game } from '../systems/components';
import type { Particles } from './particles';
import { worldUniforms } from './worldMaterial';

export interface LanternAir {
  update(camera: THREE.Camera, time: number, enclosed: boolean): void;
}

/** Specks a second at this flame (`light`: the red of the lantern's colour, 1.15 at its steadiest) and wind, roofed or not: none when it is out or the wind is up. */
export const rateAt = (light: number, wind: number, enclosed: boolean): number => (light < M.dim || wind > M.windOff ? 0 : (enclosed ? M.rate.roofed : M.rate.open) * Math.min(1, light / 1.15));

export function createLanternAir(g: Game, particles: Particles): LanternAir {
  let [last, owed] = [-1, 0];
  return {
    update(camera, time, enclosed) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      if (!me || dt <= 0) return;
      owed += rateAt(worldUniforms.uLanternColor.value.x, worldUniforms.uWind.value, enclosed) * dt;
      const [lamp, cam] = [worldUniforms.uLanternPos.value, camera.position];
      for (; owed >= 1; owed--) {
        const [r, a, up] = [M.reach[0] + (M.reach[1] - M.reach[0]) * Math.random(), Math.random() * Math.PI * 2, Math.random() * 2 - 1];
        const flat = Math.sqrt(1 - up * up);
        const [x, z] = [lamp.x + Math.cos(a) * flat * r, lamp.z + Math.sin(a) * flat * r];
        const y = Math.max(me.y + 0.1, lamp.y + up * r * 0.6); // not under the floor the investigator stands on
        if (Math.hypot(x - cam.x, y - cam.y, z - cam.z) < M.lens) continue;
        const sp = M.drift[0] + (M.drift[1] - M.drift[0]) * Math.random();
        const b = Math.random() * Math.PI * 2;
        particles.spawn({
          x, y, z, vx: Math.cos(b) * sp, vy: (Math.random() - 0.4) * sp, vz: Math.sin(b) * sp,
          life: M.life[0] + (M.life[1] - M.life[0]) * Math.random(), size: M.size[0] + (M.size[1] - M.size[0]) * Math.random(),
          color: M.color, alpha: M.alpha, gravity: enclosed ? M.fall : M.rise, drag: 0.3, shape: 'disc', hold: 0.5,
        });
      }
      owed = Math.min(owed, 1);
    },
  };
}
