/**
 * The auras of the great ones (round 83; render only, read-only on the simulation): what each horror of the
 * Mythos lets go of, a recipe for each thing a body of its tier gives off (data/creatureAura.ts), slow motes,
 * a ring that turns, a haze at the feet, in the anomaly hues only. Each is laid from the painted body's own
 * bounds (the reviewed art's span above its feet, or an assembly's height), so it keeps to the picture and
 * not to the capsule it is struck by. A sound mind sees the least of it and a failing one sees it swell, and a
 * horror deep in its fight gives off more. Nothing hidden, unroused or far from the lens gives any.
 */

import type * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { AURA, AURA_TUNING, type AuraRecipe } from '../data/creatureAura';
import { isAbsent, isUnroused, isUnseen, type Game } from '../systems/components';
import { defOf } from '../systems/creatures';
import type { BossPresence } from './bossPresence';
import { ANOMALY, scaleRgb } from './palette';
import type { Particles } from './particles';
import { worldUniforms } from './worldMaterial';

export interface CreatureAura {
  update(at: THREE.Vector3, time: number, alpha: number): void;
}

/** How many of a recipe's motes a body lets go of in `dt` seconds: its rate by its height, the mind's and the fight's share of it. */
export const auraRate = (recipe: AuraRecipe, height: number, mind: number, deep: number): number => {
  const [sound, failing] = AURA_TUNING.mind;
  return recipe.rate * height * (sound + (failing - sound) * mind) * (1 + AURA_TUNING.deep * deep);
};

export function createCreatureAura(g: Game, particles: Particles, figure: (id: Entity) => { bottom: number; top: number } | undefined, presence: BossPresence): CreatureAura {
  const owed = new Map<Entity, number[]>(); // a part of a mote owed on each recipe, by body
  let last = 0;
  return {
    update(at, time, alpha) {
      const dt = Math.min(0.1, Math.max(0, time - last));
      last = time;
      if (dt <= 0 || !g.overworld) return;
      const c = g.ecs.c;
      const mind = worldUniforms.uMind.value as number;
      let left = AURA_TUNING.frameMost;
      for (const [id, body] of c.body) {
        const tr = c.transform.get(id);
        const def = tr && id !== g.player.id ? defOf(g, id) : undefined;
        const recipes = def && AURA[def.tier];
        if (!tr || !recipes || isAbsent(g, id) || isUnseen(g, id) || isUnroused(g, id) || c.dead.has(id) || c.brain.get(id)?.state === 'hidden') continue;
        const [x, z] = [tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha];
        if (Math.hypot(x - at.x, z - at.z) - body.radius > AURA_TUNING.reach) continue;
        const span = figure(id);
        const [bottom, top] = span ? [span.bottom, span.top] : [0, body.height];
        const height = Math.max(0.5, top - bottom);
        const deep = presence.deep(id);
        const debt = owed.get(id) ?? recipes.map(() => Math.random()); // (a pack does not let go together)
        owed.set(id, debt);
        recipes.forEach((r, i) => {
          debt[i] += auraRate(r, height, mind, deep) * dt;
          while (debt[i] >= 1 && left > 0) {
            debt[i] -= 1;
            left--;
            const a = Math.random() * Math.PI * 2;
            const spread = body.radius * r.spread * (r.place === 'ring' ? 1 : 0.3 + 0.7 * Math.random());
            const rise = (r.place === 'ring' ? AURA_TUNING.waist : r.place === 'head' ? AURA_TUNING.head[0] + (AURA_TUNING.head[1] - AURA_TUNING.head[0]) * Math.random() : r.place === 'feet' ? AURA_TUNING.bodyBottom : AURA_TUNING.bodyBottom + (AURA_TUNING.head[1] - AURA_TUNING.bodyBottom) * Math.random()) * height;
            const turn = r.turn * height;
            const color = scaleRgb(ANOMALY[r.hue], r.gain);
            particles.spawn({
              x: x + Math.sin(a) * spread, y: tr.pos.y + bottom + rise, z: z + Math.cos(a) * spread,
              vx: Math.cos(a) * turn, vy: r.rise * height, vz: -Math.sin(a) * turn,
              life: r.life, size: Math.max(0.05, r.size * height), grow: r.grow, color, alpha: r.alpha * (0.7 + 0.3 * deep), glow: r.glow, drag: 0.4, hold: 0.25,
            });
          }
        });
      }
      for (const id of owed.keys()) if (!c.body.has(id)) owed.delete(id);
    },
  };
}
