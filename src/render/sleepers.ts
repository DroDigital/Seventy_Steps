/**
 * The sleepers (round 80, atmosphere): which horror the world is drawing breath about, and the breath. A boss of the open world not yet
 * roused (`isUnroused`) and a colossus in height is one; the nearer one stands to its ring the more it has the world (the same reach
 * audio/dread.ts hushes the ground by), and its breath is slower the larger it is. Pure and read-only: no Three.js, nothing written.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { BREATH } from '../data/sleeperBreath';
import { isAbsent, isUnroused, type Game } from '../systems/components';
import { hushOf, hushReach } from './audio/dread';

export interface Sleeper {
  id: Entity;
  /** 0..1: how far it has the world: whole at its ring, nothing at the reach of its hush. */
  k: number;
  height: number;
  /** Seconds one breath of it takes. */
  period: number;
}

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const smooth = (t: number): number => { const c = clamp(t); return c * c * (3 - 2 * c); };

/** Seconds one breath takes in a sleeper `height` metres tall. */
export const breathPeriod = (height: number): number => clamp(BREATH.period.base + BREATH.period.perMetre * height, BREATH.period.min, BREATH.period.max);

/** The breath at `t` seconds, 0 (let go) to 1 (full): a slow draw over `BREATH.inhale` of the period, then the quicker letting go, each eased at both ends so that neither is a sine's even swing. */
export function breathAt(t: number, period: number): number {
  const p = (((t / period) % 1) + 1) % 1;
  return p < BREATH.inhale ? smooth(p / BREATH.inhale) : 1 - smooth((p - BREATH.inhale) / (1 - BREATH.inhale));
}

/** Whether the breath at `t` is drawing in (not letting go). */
export const drawing = (t: number, period: number): boolean => (((t / period) % 1) + 1) % 1 < BREATH.inhale;

/** The sleeper that has the most of the world about `me`: unroused, alive, in the world and at least `BREATH.minHeight` tall. Null when no colossus sleeps within reach, or in the arena. */
export function nearestSleeper(g: Pick<Game, 'ecs' | 'overworld'>, me: V3): Sleeper | null {
  if (!g.overworld) return null;
  let best: Sleeper | null = null;
  for (const [id, f] of g.ecs.c.fight) {
    const b = g.ecs.c.body.get(id);
    if (!b || b.height < BREATH.minHeight || !isUnroused(g, id) || isAbsent(g, id)) continue;
    const k = hushOf(Math.hypot(f.arena.x - me.x, f.arena.z - me.z) - f.arena.radius, hushReach(b.height));
    if (k > (best?.k ?? 0)) best = { id, k, height: b.height, period: breathPeriod(b.height) };
  }
  return best;
}
