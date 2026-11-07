/**
 * The weather and the water on the creatures (round 113; render only): rain breaks on a body's head and shoulders in small bursts of
 * spray, as it breaks on the investigator's lantern and hat, and a body wading in the sea leaves rings on the water as it moves. Drawn
 * with the world's particles; read-only on the simulation.
 */

import type { Entity } from '../core/ecs';
import { BODY_MATTER } from '../data/bodyLight';
import { WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import { MODEL_PREFIX } from '../systems/creatures';
import type { BloodPools } from './bloodPools';
import type { Particles } from './particles';

const NEAR = 30; // metres from the camera within which any of it is drawn

export interface BodyWeather {
  update(time: number, camera: { x: number; z: number }, hidden: boolean): void;
}

export function createBodyWeather(g: Game, fx: Particles, marks: BloodPools, figure: (id: Entity) => { bottom: number; top: number } | undefined, painted: ReadonlyMap<Entity, number>): BodyWeather {
  const c = g.ecs.c;
  const rings = new Map<Entity, number>(); // when each last left a ring
  let last = -1;
  return {
    update(time, camera, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, time - last);
      last = time;
      const w = g.overworld?.weather;
      const rain = !hidden && w && (w.kind === 'rain' || w.kind === 'storm') ? w.amount : 0;
      for (const [id, model] of c.model) {
        if (!model.startsWith(MODEL_PREFIX) || id === g.player.id) continue;
        const tr = c.transform.get(id);
        const f = figure(id);
        if (!tr || !f || Math.hypot(tr.pos.x - camera.x, tr.pos.z - camera.z) > NEAR) continue;
        const broad = painted.get(id) ?? 0.8;
        if (rain > 0.05 && Math.random() < BODY_MATTER.splash * rain * dt * Math.max(1, broad)) { // a drop breaks on its head or shoulder
          const a = Math.random() * Math.PI * 2;
          const x = tr.pos.x + Math.cos(a) * broad * 0.3;
          const z = tr.pos.z + Math.sin(a) * broad * 0.3;
          const y = tr.pos.y + f.top - Math.random() * 0.15 * (f.top - f.bottom);
          for (let i = 0; i < 3; i++) {
            const b = Math.random() * Math.PI * 2;
            fx.spawn({ x, y, z, vx: Math.cos(b) * 0.9, vy: 0.8 + Math.random(), vz: Math.sin(b) * 0.9, life: 0.22, size: 0.035, color: [0.62, 0.68, 0.74], alpha: 0.7, gravity: 9, drag: 1 });
          }
        }
        const moving = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) > 0.004;
        const depth = WORLD.seaLevel - g.world.ground(tr.pos.x, tr.pos.z);
        if (depth > 0.05 && moving && time - (rings.get(id) ?? -Infinity) > BODY_MATTER.rings) { // it wades: a ring spreads from it on the water
          rings.set(id, time);
          marks.lay({ x: tr.pos.x, z: tr.pos.z, y: WORLD.seaLevel + 0.01, size: broad * 2.4 + 0.8, color: [0.5, 0.56, 0.6], wet: true, kind: 2, yaw: 0, grow: 1.1, life: 1.2 }, time);
        }
      }
      for (const id of rings.keys()) if (!c.model.has(id)) rings.delete(id);
    },
  };
}
