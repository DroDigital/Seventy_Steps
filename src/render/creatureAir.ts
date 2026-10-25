/**
 * What a body gives the air (round 81; render only, read-only on the simulation): in the cold (snow underfoot) every body near the
 * investigator breathes out a small pale cloud, now and then, at its mouth, and the people and creatures keep to their own beat; and
 * a body running hard over dry ground (sand, dirt, gravel) kicks up a puff of dust at its heels at each stride, unless the ground
 * is soaked. A spectre has no breath; nothing hidden or unseen gives any.
 */

import type * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { BODY_AIR } from '../data/fxTuning';
import { getRegion } from '../data/regions';
import { SIM } from '../data/tuning';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { defOf } from '../systems/creatures';
import type { Particles } from './particles';
import { wetness } from './wetness';

const DUSTY = new Set(['sand', 'dirt', 'gravel']);
const DUST = [0.42, 0.4, 0.36] as const;

export interface CreatureAir {
  update(at: THREE.Vector3, time: number, alpha: number, enclosed: boolean): void;
}

/** Seconds between one breath and the next, of the body `id`: each has its own. */
export const breathGap = (id: Entity): number => BODY_AIR.breathSeconds[0] + (BODY_AIR.breathSeconds[1] - BODY_AIR.breathSeconds[0]) * ((id * 0.6180339887) % 1);

/** Whether the ground of a region is cold (snow) and whether dry and dusty. */
export const groundOf = (region: string | null): { cold: boolean; dusty: boolean } => {
  const texture = getRegion(region ?? '')?.biome.texture;
  return { cold: texture === 'snow', dusty: !!texture && DUSTY.has(texture) };
};

export function createCreatureAir(g: Game, particles: Particles): CreatureAir {
  const [breathAt, dustAt] = [new Map<Entity, number>(), new Map<Entity, number>()];
  return {
    update(at, time, alpha, enclosed) {
      if (enclosed || !g.overworld) return;
      const { cold, dusty } = groundOf(g.overworld.region);
      const dry = dusty && wetness.value < 0.35;
      if (!cold && !dry) return;
      const c = g.ecs.c;
      for (const [id, body] of c.body) {
        const tr = c.transform.get(id);
        if (!tr) continue;
        const me = id === g.player.id;
        const def = me ? undefined : defOf(g, id);
        if (!me && (!c.model.has(id) || c.model.get(id)!.startsWith('fx:') || isAbsent(g, id) || isUnseen(g, id) || c.dead.has(id) || c.brain.get(id)?.state === 'hidden' || def?.sprite?.silhouette === 'spectre' || def?.sprite?.outside)) continue;
        const [x, z] = [tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha];
        const d = Math.hypot(x - at.x, z - at.z);
        const big = Math.min(3, Math.max(0.5, body.height / 1.8));
        const yaw = tr.yaw;
        if (cold && d <= BODY_AIR.reach && time >= (breathAt.get(id) ?? time + breathGap(id) * ((id * 0.7548776662) % 1))) {
          breathAt.set(id, time + breathGap(id));
          const b = BODY_AIR.breath;
          particles.spawn({
            x: x + Math.sin(yaw) * body.radius * 0.9, y: tr.pos.y + body.height * 0.82, z: z + Math.cos(yaw) * body.radius * 0.9,
            vx: Math.sin(yaw) * 0.45, vy: 0.22, vz: Math.cos(yaw) * 0.45, life: b.seconds, size: b.size * big, grow: b.grow, color: b.color, alpha: b.alpha, drag: 0.9,
          });
        } else if (cold && !breathAt.has(id)) breathAt.set(id, time + breathGap(id) * ((id * 0.7548776662) % 1));
        const speed = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz;
        if (dry && d <= BODY_AIR.dustReach && speed >= BODY_AIR.dustSpeed && time >= (dustAt.get(id) ?? 0)) {
          dustAt.set(id, time + BODY_AIR.dustSeconds);
          particles.spawn({ x, y: tr.pos.y + 0.08, z, vx: -Math.sin(yaw) * 0.6, vy: 0.4, vz: -Math.cos(yaw) * 0.6, life: 0.8, size: 0.3 * big, grow: 2.4, color: DUST, alpha: 0.3, drag: 1.4 });
        }
      }
      for (const m of [breathAt, dustAt]) for (const id of m.keys()) if (!c.body.has(id)) m.delete(id);
    },
  };
}
