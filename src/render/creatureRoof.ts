/**
 * How far each drawn creature stands under the open sky (round 96): 1 in the air, 0 under a dungeon's roof (`roofedAt`,
 * which keeps open ruins under the sky). The tint a creature takes from its realm (render/spriteTone.ts) is the sky's,
 * so under a roof it is drawn in the colours it was drawn in. It eases toward that as the realm's coat does (render/coat.ts):
 * FX.spriteRoof[0] seconds is the ease's time constant as it comes off at a door, FX.spriteRoof[1] as it goes back under the sky.
 * Render only.
 */

import type { Entity } from '../core/ecs';
import { FX } from '../data/tuning';

export interface CreatureRoof {
  /** A creature's share of the open sky now, 0..1: `roofed` says whether it stands under a roof; `time` is the render clock, in seconds. */
  sky(id: Entity, roofed: boolean, time: number): number;
  /** Forgets the creatures not drawn this frame (`live`), so one that comes back is not eased from where it was. */
  forget(live: ReadonlySet<Entity>): void;
}

export function createCreatureRoof(): CreatureRoof {
  const held = new Map<Entity, { sky: number; time: number }>(); // each creature's share, and the clock it was last laid at
  return {
    sky(id, roofed, time) {
      const target = roofed ? 0 : 1;
      const was = held.get(id) ?? { sky: target, time }; // first seen: already where it stands
      const span = roofed ? FX.spriteRoof[0] : FX.spriteRoof[1]; // off at a door quickly, back under the sky slowly
      const dt = Math.min(0.1, Math.max(0, time - was.time)); // (a long frame does not leap it)
      const sky = was.sky + (target - was.sky) * Math.min(1, dt / span);
      held.set(id, { sky, time });
      return sky;
    },
    forget(live) {
      for (const id of held.keys()) if (!live.has(id)) held.delete(id);
    },
  };
}
