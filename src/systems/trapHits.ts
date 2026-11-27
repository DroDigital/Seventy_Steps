/**
 * A dungeon trap's blow (2026-11-27; systems/dungeonTraps.ts): everything with a body inside the shape a mechanism strikes is struck, the
 * investigator and foes alike (a foe led over a plate takes the darts), unblockable but not undodgeable (a roll's i-frames are, as for the
 * ways' blasts, systems/blasts.ts). Fair by rule: a body struck by any trap is not struck by one again for `TRAP.grace` frames, so two
 * mechanisms never take one body twice in a breath, and nothing reaches an investigator who is sheltered (at peace on arriving, in a talk).
 * Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { TRAP } from '../data/tuning';
import { strike } from './combat';
import { isAbsent, isSheltered, type Game } from './components';

const struck = new WeakMap<Game, Map<Entity, number>>();

/** The bodies whose feet stand where `inside` says (given the body's own radius), within 2.5 m of `at`'s height. */
export function bodiesIn(g: Game, at: V3, inside: (p: V3, radius: number) => boolean): Entity[] {
  const c = g.ecs.c;
  const out: Entity[] = [];
  for (const [id] of c.combatant) {
    const pos = c.transform.get(id)?.pos;
    if (!pos || !c.health.has(id) || !c.actor.has(id) || c.dead.has(id) || isAbsent(g, id)) continue;
    if (Math.abs(pos.y - at.y) > 2.5) continue;
    if (inside(pos, c.body.get(id)?.radius ?? 0.4)) out.push(id);
  }
  return out;
}

/** Strikes every body `inside` the trap's reach at `at` for `damage`; returns those struck. */
export function trapStrike(g: Game, at: V3, inside: (p: V3, radius: number) => boolean, damage: number): Entity[] {
  let last = struck.get(g);
  if (!last) struck.set(g, (last = new Map()));
  const hit = bodiesIn(g, at, inside).filter((id) => g.frame - (last!.get(id) ?? -1e9) >= TRAP.grace && !(id === g.player.id && isSheltered(g)));
  if (!hit.length) return hit;
  const c = g.ecs.c;
  const source = g.ecs.spawn(); // a body of no kind the blow comes from: gone with it
  c.transform.set(source, { pos: { ...at }, prev: { ...at }, yaw: 0, prevYaw: 0 });
  for (const id of hit) {
    last.set(id, g.frame);
    const foe = id !== g.player.id;
    const dmg = foe ? Math.min(160, damage * 1.5 + 0.05 * (c.health.get(id)?.max ?? 0)) : damage; // (a foe takes the trap as a body would, a little more: luring them in is worth it)
    strike(g, source, id, { damage: dmg, poise: 40, guard: 0, hitstop: 5, parryable: false, interrupts: false, unblockable: true, enemyScale: 1 }, at);
  }
  g.ecs.despawn(source);
  return hit;
}

/** Whether `p` lies within `r` of the segment a..b in the ground plane. */
export function nearSegment(p: V3, a: V3, b: V3, r: number): boolean {
  const [dx, dz] = [b.x - a.x, b.z - a.z];
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t)) <= r;
}
