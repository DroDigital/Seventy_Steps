/**
 * What drifts in an arena's air (round 61; data/arenaSets.ts `air`): ash settling over a burned ground, embers rising from its
 * fires, spores and motes of light, drifts of mist, sea spray, dust blown over sand, flakes falling. Particles, born about the
 * investigator within the nearest arena that has it, so the density is seen however large the arena is. Render only.
 */

import type * as THREE from 'three';
import type { AirSpec } from '../data/arenaSets';
import { worldLayout, type ArenaPlace } from '../world/placements';
import type { Game } from '../systems/components';
import type { ParticleSpec, Particles } from './particles';

const NEAR = 40; // metres past an arena's ring that its air is drawn
const REACH = 16; // metres about the investigator the air is born
const CAP = 0.1; // seconds: the most a slow frame is counted for
const CLEAR = 7; // metres about the lens within which none is born: a wisp of mist a metre from it would cloud the picture, in a cutscene most of all

type Made = (rnd: () => number, s: AirSpec) => Omit<ParticleSpec, 'x' | 'y' | 'z'> & { lift: number };

/** One particle of each kind: its flight and shape; `lift` the height it is born at above the ground. */
const KINDS: Record<AirSpec['kind'], Made> = {
  ash: (r, s) => ({ lift: 3 + r() * 4, vx: (r() - 0.5) * 0.6, vy: -(0.1 + r() * 0.2), vz: (r() - 0.5) * 0.6, life: 7 + r() * 5, size: (s.size ?? 0.07) * (0.7 + r() * 0.8), color: s.color, alpha: 0.55, drag: 0.4, shape: 'shard', spin: (r() - 0.5) * 2 }),
  ember: (r, s) => ({ lift: r() * 1.5, vx: (r() - 0.5) * 0.5, vy: 0.5 + r() * 0.9, vz: (r() - 0.5) * 0.5, life: 3 + r() * 3, size: (s.size ?? 0.08) * (0.6 + r() * 0.8), color: s.color, colorEnd: [0.25, 0.04, 0.02], alpha: 0.95, glow: true, drag: 0.3, shape: 'spark' }),
  spore: (r, s) => ({ lift: 0.3 + r() * 3.5, vx: (r() - 0.5) * 0.3, vy: 0.05 + r() * 0.25, vz: (r() - 0.5) * 0.3, life: 6 + r() * 5, size: (s.size ?? 0.16) * (0.6 + r() * 0.8), color: s.color, alpha: 0.7, glow: s.glow ?? true, drag: 0.5, hold: 0.4, shape: 'wisp' }),
  mote: (r, s) => ({ lift: 0.2 + r() * 4, vx: (r() - 0.5) * 0.4, vy: 0.1 + r() * 0.3, vz: (r() - 0.5) * 0.4, life: 4 + r() * 4, size: (s.size ?? 0.07) * (0.6 + r() * 0.8), color: s.color, alpha: 0.9, glow: true, drag: 0.4, hold: 0.5, shape: 'spark' }),
  drift: (r, s) => ({ lift: 0.2 + r() * 1.6, vx: 0.5 + r() * 0.6, vy: 0.02, vz: (r() - 0.5) * 0.3, life: 8 + r() * 5, size: (s.size ?? 1.8) * (0.7 + r() * 0.8), grow: 1.5, color: s.color, alpha: 0.2, drag: 0.1, shape: 'wisp' }),
  spray: (r, s) => ({ lift: r() * 0.3, vx: (r() - 0.3) * 1.6, vy: 1.2 + r() * 1.6, vz: (r() - 0.5) * 1.2, life: 1.4 + r(), size: (s.size ?? 0.09) * (0.6 + r() * 0.8), color: s.color, alpha: 0.6, gravity: 5, drag: 0.5, shape: 'disc' }),
  dust: (r, s) => ({ lift: 0.1 + r() * 0.8, vx: 1.2 + r() * 1.6, vy: 0.05, vz: (r() - 0.5) * 0.8, life: 2.5 + r() * 2, size: (s.size ?? 0.1) * (0.7 + r() * 0.8), color: s.color, alpha: 0.4, drag: 0.2, shape: 'streak' }),
  flake: (r, s) => ({ lift: 2 + r() * 5, vx: (r() - 0.5) * 0.5, vy: -(0.2 + r() * 0.3), vz: (r() - 0.5) * 0.5, life: 7 + r() * 4, size: (s.size ?? 0.09) * (0.7 + r() * 0.8), color: s.color, alpha: 0.7, drag: 0.5, shape: 'petal', spin: (r() - 0.5) * 3 }),
};

export interface ArenaAir {
  update(camera: THREE.Camera, time: number, indoors: boolean): void;
}

export function createArenaAir(g: Game, particles: Particles): ArenaAir {
  let [last, owed] = [-1, 0];
  let near: ArenaPlace | null = null;
  const withAir = worldLayout().arenas.filter((a) => a.air);
  return {
    update(camera, time, indoors) {
      const dt = last < 0 ? 0 : Math.min(CAP, Math.max(0, time - last));
      last = time;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      if (indoors || !me || !g.overworld) return;
      if (!near || Math.hypot(near.x - me.x, near.z - me.z) > near.radius + NEAR) near = withAir.find((a) => Math.hypot(a.x - me.x, a.z - me.z) < a.radius + NEAR) ?? null;
      const air = near?.air;
      if (!near || !air) return;
      owed += air.rate * dt;
      for (; owed >= 1; owed--) {
        const [t, d] = [Math.random() * Math.PI * 2, Math.sqrt(Math.random()) * REACH];
        const [x, z] = [me.x + Math.cos(t) * d, me.z + Math.sin(t) * d];
        if (Math.hypot(x - near.x, z - near.z) > near.radius + 8) continue; // within its ring and the court before it
        const { lift, ...rest } = KINDS[air.kind](Math.random, air);
        const floor = particles.ground?.(x, z) ?? near.y;
        if (Math.hypot(x - camera.position.x, floor + lift - camera.position.y, z - camera.position.z) < CLEAR) continue;
        particles.spawn({ x, y: floor + lift, z, ...rest });
      }
    },
  };
}
