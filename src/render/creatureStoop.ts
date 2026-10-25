/**
 * The stoop of a reviewed colossus (hurt.ts says when it bends to its prey): which forms have the frames for
 * it, how long since each began, and how long since it began to stand up again. Render only.
 */

import type { Entity } from '../core/ecs';
import { FEEDBACK } from '../data/tuning';
import type { Game } from '../systems/components';
import { stooped } from '../systems/hurt';
import type { SpriteAction } from './sprites/directional';
import type { ReviewedManifest } from './sprites/reviewed';

export interface Stoop {
  frames: number;
  mid: boolean;
  /** Seconds since the stoop began (0 as it stands up). */
  age: number;
  /** Seconds since it began to stand up. */
  rise?: number;
}

export interface Stoops {
  /** The stoop a reviewed colossus is in, or undefined when its form has none or it is on its feet. */
  of(id: Entity, key: string, time: number): Stoop | undefined;
  /** The frames each state has, as `lookOf` is told, with a stoop's. */
  known(bow: Stoop | undefined): Partial<Record<SpriteAction, number>>;
  forget(live: ReadonlySet<Entity>): void;
}

export function createStoops(g: Game, manifest: ReviewedManifest | undefined): Stoops {
  const entities = Object.entries(manifest?.entities ?? {});
  const frames = new Map(entities.flatMap(([key, entity]) => (entity.directions.front.actions.stoop?.length ? [[key, entity.directions.front.actions.stoop.length] as const] : []))); // the frames of the stoop of each reviewed form that has one
  const mids = new Set(entities.flatMap(([key, entity]) => (entity.directions.front.actions.stoop_mid?.length ? [key] : []))); // those that have its in-between pose too
  const since = new Map<Entity, number>(); // when each stooped colossus began its stoop (seconds)
  const rising = new Map<Entity, number>(); // when each that has stood up began to (seconds)
  return {
    of(id, key, time) {
      const count = frames.get(key);
      if (!count) return undefined;
      const mid = mids.has(key);
      if (!stooped(g, id)) {
        if (since.delete(id) && mid) rising.set(id, time);
        const rise = rising.get(id);
        if (rise === undefined || time - rise >= FEEDBACK.riseSeconds) return void rising.delete(id);
        return { frames: count, mid, age: 0, rise: time - rise };
      }
      rising.delete(id);
      if (!since.has(id)) since.set(id, time);
      return { frames: count, mid, age: time - since.get(id)! };
    },
    known: (bow) => (bow ? { stoop: bow.frames, ...(bow.mid && { stoop_mid: 1 }) } : {}),
    forget(live) {
      for (const m of [since, rising]) for (const id of m.keys()) if (!live.has(id)) m.delete(id);
    },
  };
}
