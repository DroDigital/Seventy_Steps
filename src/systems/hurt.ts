/**
 * Where a colossus may be struck (data/assemblyShape.ts): its hitboxes follow the legs, torso and
 * head, including its stooped recovery pose. Every part takes the same damage. A body of spheres
 * is struck where its spheres are. Bodies that are not colossi have one capsule (combat.ts).
 * Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { zoneShapes, type ZoneShape } from '../data/assemblyShape';
import { ZONES } from '../data/bossTuning';
import { moveDef } from './actions';
import type { Game } from './components';

/** What is struck: its gap to a blade or bullet's line. Every part takes a normal blow. */
export interface ZoneHit {
  gap2: number;
  damage: number;
}

/** Whether a colossus is stooped: recovering from its own blow, or reeling. */
export function stooped(g: Game, e: Entity): boolean {
  const c = g.ecs.c;
  const move = c.actor.get(e)?.move;
  return move === 'stagger' || move === 'parried' || (c.fight.get(e)?.stoopUntil ?? 0) > g.frame;
}

/** Each step: a colossus that has got past its blow's active frames stays stooped until its recovery ends and a little after. */
export function refreshStoops(g: Game): void {
  for (const [e, f] of g.ecs.c.fight) {
    const a = g.ecs.c.actor.get(e);
    const open = a ? moveDef(a)?.open : undefined;
    if (a && open !== undefined && a.frame >= open) f.stoopUntil = g.frame + ZONES.linger;
  }
}

/** Its zones, in the body's own frame (see assemblyShape.ts); null for a body that has none. */
export function zonesOf(g: Game, e: Entity): ZoneShape[] | null {
  const b = g.ecs.c.body.get(e);
  return b?.assembly ? zoneShapes(b.assembly, b.radius, b.height, e, stooped(g, e)) : null;
}

/** A zone's place in the world: the body at `pos` turned by `yaw` (a figure's local +x is its left). */
function place(z: ZoneShape, pos: V3, yaw: number): { x: number; z: number } {
  const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
  return { x: pos.x + z.x * c + z.z * s, z: pos.z - z.x * s + z.z * c };
}

/** The gap from a point to a zone (0 inside it). */
function gapTo(z: ZoneShape, at: { x: number; z: number }, y0: number, p: V3): number {
  const radial = Math.hypot(p.x - at.x, p.z - at.z);
  if (z.ball) return Math.max(0, Math.hypot(radial, p.y - (y0 + z.y0)) - z.r);
  const up = Math.max(0, y0 + z.y0 - p.y, p.y - (y0 + z.y1));
  return Math.hypot(Math.max(0, radial - z.r), up);
}

const STEP = 0.4; // metres between the points a line is tried at

/**
 * The nearest part to a line from `a` to `b`. Null for a body with no zones.
 */
export function zoneGap(g: Game, e: Entity, a: V3, b: V3, _reach: number): ZoneHit | null {
  const zones = zonesOf(g, e);
  const tr = g.ecs.c.transform.get(e);
  if (!zones || !tr) return null;
  const n = Math.min(160, Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / STEP)));
  let nearest = Infinity;
  for (const z of zones) {
    const at = place(z, tr.pos, tr.yaw);
    let gap = Infinity;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      gap = Math.min(gap, gapTo(z, at, tr.pos.y, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }));
    }
    nearest = Math.min(nearest, gap);
    if (nearest === 0) break;
  }
  return { gap2: nearest * nearest, damage: 1 };
}
