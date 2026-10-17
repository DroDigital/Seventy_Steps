/**
 * Fatal edges (the open world only). The investigator may stand on the very edge of a pit, a well, a bridge
 * gap or a hidden bridge's seal, a foot over the void, and step back: while any of the feet's hold (a ring
 * FALL.foot about the body's centre) is on the floor, nothing happens, and no animation is begun that
 * would condemn a body that could still save itself. Only when none of it is, with no contact with the
 * floor left, the ground lets go of the body and it falls, tumbling, for a second and a bit, the picture
 * going dark; the death comes at the foot of the drop (round 54: it had been instant, the moment a hand's
 * breadth of the body touched the void). Walking off the land or into the sea is still the quick end it
 * was. The Lost Echoes stay at the last safe feet, on the ground there, so the drop is not left in the
 * void. Foes, mounts' walls and the arena ring are unchanged: those colliders still push. A cutscene and
 * a death already playing do not fall again.
 */

import { clamp, type V3 } from '../core/geom';
import { FALL, SIM, WORLD } from '../data/tuning';
import { toBoxFrame, type Collider, type CollisionWorld } from '../world/colliders';
import { inDungeon } from '../world/terrain';
import { regionAt } from '../world/worldMap';
import { startMove } from './actions';
import type { Falling, Game } from './components';
import { createBuffer } from './inputBuffer';
import { setLock } from './lockOn';
import { dismissMount } from './mounts';

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
  for (const list of [w.colliders, near]) {
    for (const c of list) {
      if (c.fall && !w.off.has(c) && hits(c, pos, r, h)) return true;
    }
  }
  return false;
}

const RING = Array.from({ length: 8 }, (_, k) => [Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4)] as const);

/** What the feet have under them: the floor (the centre is on it), the edge (the centre is over a drop but some of the feet's hold is on the floor still), or air (none is). */
function holdOf(w: CollisionWorld, pos: V3, h: number): 'floor' | 'edge' | 'air' {
  if (!inFall(w, pos, FALL.foot, h)) return 'floor'; // (nowhere near an edge: the common case, one look)
  if (!inFall(w, pos, 0, h)) return 'floor';
  return RING.some(([c, s]) => !inFall(w, { x: pos.x + c * FALL.foot, y: pos.y, z: pos.z + s * FALL.foot }, 0, h)) ? 'edge' : 'air';
}

/** Whether the centre is on a region's ground above the sea (outside a dungeon): else the land has ended. */
function onLand(pos: V3): boolean {
  return !!regionAt(pos.x, pos.z) && (inDungeon(pos.x, pos.z) || pos.y > SEA);
}

/** Feet that can stand: on a region's ground, clear of a drop, and above the sea outside a dungeon. */
export function footingSafe(g: Game, pos: V3, r: number, h: number): boolean {
  if (!regionAt(pos.x, pos.z) || inFall(g.world, pos, r, h)) return false;
  return inDungeon(pos.x, pos.z) || pos.y > SEA;
}

/** The death, where it falls to: the Lost Echoes lie on the ground at the lip. */
function beginDeath(g: Game, lip: V3): void {
  const id = g.player.id;
  const a = g.ecs.c.actor.get(id)!;
  const h = g.ecs.c.health.get(id)!;
  if (a.move === 'death' && h.hp <= 0) return;
  h.hp = 0;
  startMove(a, 'death');
  g.events.emit('Died', { entity: id, killer: null, at: { x: lip.x, y: g.world.ground(lip.x, lip.z), z: lip.z } });
}

/** The body goes over: what it was doing is let go of, the run-up it had is carried a little way, and gravity takes it. */
function beginFall(g: Game, lip: V3): void {
  const p = g.player;
  const { actor, mover, transform } = g.ecs.c;
  const [a, m, tr] = [actor.get(p.id)!, mover.get(p.id)!, transform.get(p.id)!];
  dismissMount(g);
  Object.assign(a, { move: null, frame: 0, hitstop: 0, frozen: false, guard: false, idle: 0 });
  a.hits.clear();
  Object.assign(m, { vx: 0, vz: 0, face: null });
  Object.assign(p, { buffer: createBuffer(), dodgeHeld: -1, sprinting: false, blockHeld: false, blockRaised: false, listening: null, kneeling: null });
  setLock(g, null);
  const [dx, dz] = [(tr.pos.x - tr.prev.x) * SIM.hz, (tr.pos.z - tr.prev.z) * SIM.hz];
  const run = Math.hypot(dx, dz);
  const k = run > FALL.carry ? FALL.carry / run : 1;
  p.falling = { frame: 0, vy: 0, vx: dx * k, vz: dz * k, spin: 1, lip: { ...lip } };
  g.events.emit('Fell', { entity: p.id, at: { ...tr.pos }, frames: FALL.frames });
}

/** One frame of the drop; at its foot the death, with the body left there in the dark (movement.ts leaves it be until the next waking). */
function dropStep(g: Game, f: Falling): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  if (f.frame >= FALL.frames) return;
  const dt = 1 / SIM.hz;
  f.frame++;
  f.vy -= FALL.gravity * dt;
  tr.pos.y += f.vy * dt;
  tr.pos.x += f.vx * dt;
  tr.pos.z += f.vz * dt;
  const keep = Math.exp(-FALL.drag * dt);
  f.vx *= keep;
  f.vz *= keep;
  if (f.frame === FALL.frames) beginDeath(g, f.lip);
}

/** How dark the picture is for a fall, 0 to 1: clear for the first of it, then closing in until the foot of it, and black until the waking. */
export function fallDark(f: Falling | null): number {
  if (!f) return 0;
  const [from, to] = FALL.dark;
  const t = (f.frame / FALL.frames - from) / (to - from);
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}

export function fallSystem(g: Game): void {
  if (!g.overworld || g.cutscene) return;
  const id = g.player.id;
  const a = g.ecs.c.actor.get(id);
  const tr = g.ecs.c.transform.get(id);
  const b = g.ecs.c.body.get(id);
  if (!a || !tr || !b) return;
  if (g.player.falling) return dropStep(g, g.player.falling);
  if (a.move === 'death') return;
  const land = onLand(tr.pos);
  const hold = land ? holdOf(g.world, tr.pos, b.height) : 'air';
  if (hold === 'floor') LIP.set(g, { ...tr.pos }); // the last feet on the floor: the Echoes will lie here
  if (hold !== 'air') return; // on the floor, or balanced on the very edge of it, and free to step back
  const lip = LIP.get(g) ?? tr.prev;
  if (land) beginFall(g, lip); // no contact with the floor left: past saving by stepping back
  else beginDeath(g, lip); // the sea, or the land's end: no ledge to go over
}
