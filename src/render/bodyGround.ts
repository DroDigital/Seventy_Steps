/**
 * The ground a drawn body stands in (round 113; render only): the sea's surface when it wades, and how deep the snow, mud, sand, grass
 * or leaves under it take its feet (data/bodyLight.ts BODY_MATTER.sink), read now and then for each creature (the ground under a foot,
 * world/groundKind.ts, is the one the investigator's prints and steps read) and told to the sprite shader (shaders/bodyMatter.ts).
 */

import type { Entity } from '../core/ecs';
import { BODY_MATTER, SINKS } from '../data/bodyLight';
import { WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import { groundAt } from '../world/groundKind';

const EVERY = 12; // frames between readings of the ground under a body

export interface BodyGround {
  /** [sea surface + 10000 (0: dry), metres sunk, the sink's index (SINKS, from 1), the feet's height] for a body at (x, y, z), `hover` metres off the ground. */
  of(id: Entity, x: number, y: number, z: number, hover: number): readonly [number, number, number, number];
  forget(live: ReadonlySet<Entity>): void;
}

export function createBodyGround(g: Game): BodyGround {
  const known = new Map<Entity, { at: number; sink: number; index: number }>();
  const out: [number, number, number, number] = [0, 0, 0, 0];
  let frame = 0;
  return {
    of(id, x, y, z, hover) {
      frame++;
      const ground = g.world.ground(x, z);
      const wet = ground < WORLD.seaLevel - 0.05 && hover <= 0;
      let k = known.get(id);
      if (!k || frame - k.at > EVERY) {
        const kind = hover > 0 || wet ? undefined : groundAt(g, x, y, z);
        const index = kind ? SINKS.indexOf(kind as (typeof SINKS)[number]) + 1 : 0;
        known.set(id, (k = { at: frame + (id % EVERY), sink: index > 0 ? BODY_MATTER.sink[kind!] ?? 0 : 0, index }));
      }
      out[0] = wet ? WORLD.seaLevel + 10000 : 0;
      out[1] = k.sink;
      out[2] = k.index;
      out[3] = y - hover;
      return out;
    },
    forget(live) {
      for (const id of known.keys()) if (!live.has(id)) known.delete(id);
    },
  };
}
