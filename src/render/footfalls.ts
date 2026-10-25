/**
 * The footfalls of the great (round 81; render only, read-only on the simulation): a colossus, or any horror
 * that is fought, that walks leaves a ring of dust at each stride of its own length and the ground answers
 * with a small jolt in the camera, by how near the investigator is (render/presence.ts `felt`). They stand
 * still, and nothing is let go; one that is far, hidden or dead gives none, nor does a room under a roof.
 */

import type * as THREE from 'three';
import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { BOSS_PRESENCE } from '../data/fxTuning';
import { SIM } from '../data/tuning';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import type { Particles } from './particles';
import { presenceOf } from './presence';

const DUST = [0.42, 0.4, 0.36] as const;

export interface Footfalls {
  update(at: THREE.Vector3, alpha: number, enclosed: boolean): void;
}

export function createFootfalls(g: Game, particles: Particles, felt: (p: V3, strength: number, reach: number) => void): Footfalls {
  const walked = new Map<Entity, { run: number; side: number }>();
  return {
    update(at, alpha, enclosed) {
      if (enclosed) return;
      const c = g.ecs.c;
      for (const [id, body] of c.body) {
        const tr = c.transform.get(id);
        if (!tr || id === g.player.id || !c.actor.has(id) || (body.height < BOSS_PRESENCE.height && !c.fight.has(id)) || isAbsent(g, id) || isUnseen(g, id) || (c.health.get(id)?.hp ?? 0) <= 0 || !creatureOf(g, id)) continue;
        const speed = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz;
        const walk = walked.get(id) ?? { run: 0, side: 1 };
        walked.set(id, walk);
        if (speed < BOSS_PRESENCE.minSpeed) {
          walk.run = 0;
          continue;
        }
        walk.run += speed / SIM.hz;
        if (walk.run < BOSS_PRESENCE.stride * body.height) continue;
        walk.run = 0;
        walk.side = -walk.side;
        const [x, z] = [tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha];
        const k = presenceOf(Math.hypot(x - at.x, z - at.z) - body.radius, body.height);
        if (k < BOSS_PRESENCE.least) continue;
        const [dx, dz] = [Math.cos(tr.yaw) * body.radius * 0.45 * walk.side, -Math.sin(tr.yaw) * body.radius * 0.45 * walk.side]; // the foot to its right (yaw 0 faces +z) is (-cos, sin)
        const n = Math.round(3 + 7 * k);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
          const out = 0.9 + body.radius * 0.25;
          particles.spawn({ x: x + dx + Math.sin(a) * 0.4 * body.radius, y: tr.pos.y + 0.12, z: z + dz + Math.cos(a) * 0.4 * body.radius, vx: Math.sin(a) * out, vy: 0.35 + Math.random() * 0.5, vz: Math.cos(a) * out, life: 1.1 + Math.random() * 0.7, size: 0.35 + 0.08 * body.height, grow: 2.6, color: DUST, alpha: 0.3, gravity: -0.05, drag: 1.3 });
        }
        felt({ x: x + dx, y: tr.pos.y, z: z + dz }, BOSS_PRESENCE.shake * Math.min(1.6, body.height / 8) * k, 24 + body.height);
      }
      for (const id of walked.keys()) if (!c.body.has(id)) walked.delete(id);
    },
  };
}
