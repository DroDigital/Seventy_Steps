/**
 * Fatal edges (the open world only). The investigator walks off the land, into the sea, or through
 * a pit, a well, a bridge gap or a hidden bridge's seal, and dies. The Lost Echoes stay at the last
 * safe feet, on the ground there, so the drop is not left in the void. Foes, mounts' walls and the
 * arena ring are unchanged: those colliders still push. A cutscene and a death already playing do not
 * fall again.
 */

import { clamp, type V3 } from '../core/geom';
import { WORLD } from '../data/tuning';
import { toBoxFrame, type Collider, type CollisionWorld } from '../world/colliders';
import { inDungeon } from '../world/terrain';
import { regionAt } from '../world/worldMap';
import { startMove } from './actions';
import type { Game } from './components';

const SEA = WORLD.seaLevel + 0.4;
const LIP = new WeakMap<Game, V3>();

function hits(c: Collider, pos: V3, r: number, h: number): boolean {
  if (c.kind === 'box') {
    if (pos.y + h <= c.min.y || pos.y >= c.max.y) return false;
    const x = clamp(pos.x, c.min.x, c.max.x);
    const z = clamp(pos.z, c.min.z, c.max.z);
    return (pos.x - x) ** 2 + (pos.z - z) ** 2 <= r * r;
  }
  if (c.kind === 'cylinder') {
    if (pos.y + h <= c.y0 || pos.y >= c.y1) return false;
    return Math.hypot(pos.x - c.x, pos.z - c.z) <= r + c.radius;
  }
  if (pos.y + h <= c.y0 || pos.y >= c.y1) return false;
  const l = toBoxFrame(c, pos.x, pos.z);
  const x = clamp(l.x, -c.hx, c.hx);
  const z = clamp(l.z, -c.hz, c.hz);
  return (l.x - x) ** 2 + (l.z - z) ** 2 <= r * r;
}

function inFall(w: CollisionWorld, pos: V3, r: number, h: number): boolean {
  const near = w.near?.(pos.x - r, pos.z - r, pos.x + r, pos.z + r) ?? [];
  for (const c of [...w.colliders, ...near]) {
    if (!c.fall || w.off.has(c)) continue;
    if (hits(c, pos, r, h)) return true;
  }
  return false;
}

/** Feet that can stand: on a region's ground, clear of a drop, and above the sea outside a dungeon. */
export function footingSafe(g: Game, pos: V3, r: number, h: number): boolean {
  if (!regionAt(pos.x, pos.z) || inFall(g.world, pos, r, h)) return false;
  return inDungeon(pos.x, pos.z) || pos.y > SEA;
}

function beginFall(g: Game, lip: V3): void {
  const id = g.player.id;
  const a = g.ecs.c.actor.get(id)!;
  const h = g.ecs.c.health.get(id)!;
  if (a.move === 'death' && h.hp <= 0) return;
  h.hp = 0;
  startMove(a, 'death');
  g.events.emit('Died', { entity: id, killer: null, at: { x: lip.x, y: g.world.ground(lip.x, lip.z), z: lip.z } });
}

export function fallSystem(g: Game): void {
  if (!g.overworld || g.cutscene) return;
  const id = g.player.id;
  const a = g.ecs.c.actor.get(id);
  const tr = g.ecs.c.transform.get(id);
  const b = g.ecs.c.body.get(id);
  if (!a || !tr || !b || a.move === 'death') return;
  if (footingSafe(g, tr.pos, b.radius, b.height)) {
    LIP.set(g, { ...tr.pos });
    return;
  }
  const lip = footingSafe(g, tr.prev, b.radius, b.height) ? tr.prev : LIP.get(g) ?? tr.prev;
  beginFall(g, lip);
}
