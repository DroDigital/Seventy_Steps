/**
 * Fatal edges (the open world only). The investigator may stand on the very edge of a pit, a well, a bridge
 * gap or a hidden bridge's seal, a foot over the void, and step back: while any of the feet's hold (a ring
 * FALL.foot about the body's centre) is on the floor, nothing happens, and no animation is begun that
 * would condemn a body that could still save itself. Only when none of it is, with no contact with the
 * floor left, the ground lets go of the body and it falls, tumbling, for a second and a bit, the picture
 * going dark; the death comes at the foot of the drop (round 54: it had been instant, the moment a hand's
 * breadth of the body touched the void). The shore and the world's rim are edges too (round 55: walking into
 * the sea, or off the land's end, had stayed the instant death): the same balance on the last of the ground, and
 * the same fall once none is left. Past the end of a region the ground goes on, down a slope to the sea, and is
 * walked down: it is the water that ends it, not the border. The Lost Echoes stay at the last safe feet, on the ground there, so the drop is not left in the
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
import { enterSea, seaTimeOf, waterDark, waterStep } from './waterFall';
import { createBuffer } from './inputBuffer';
import { setLock } from './lockOn';
import { dismissMount } from './mounts';
import { seaChopNow } from './seaChop';

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

/**
 * Whether a point is on ground above the sea (or a dungeon's floor): else the land has ended. The ground does not end at a region's border: it goes on
 * past it and sinks to the sea floor over `WORLD.coast` metres, a slope that is drawn and that feet follow (round 55: the land was taken to end at the border,
 * and the body fell through that slope a few steps before the water, instead of going down it into the sea).
 */
function onLand(pos: V3): boolean {
  return inDungeon(pos.x, pos.z) || pos.y > SEA;
}

/** One foot's hold: on the land and clear of a drop. (A point beside the body stands on the ground there, not at the body's height.) */
function holds(w: CollisionWorld, x: number, z: number, y: number, h: number): boolean {
  const at = { x, y, z };
  return onLand(at) && !inFall(w, at, 0, h);
}

/**
 * What the feet have under them: the floor (the centre holds), the edge (it does not, over a drop, the sea or the land's end, but some of the feet's
 * ring does: free to step back), or air (none does). The shore and the world's rim are edges like a pit's (round 55: they had stayed the instant
 * death of round 50, the moment the centre was in the water). A foot's own ground is used for the sea, as the shore slopes under the body.
 */
function holdOf(w: CollisionWorld, pos: V3, h: number): 'floor' | 'edge' | 'air' {
  if (holds(w, pos.x, pos.z, pos.y, h)) return 'floor';
  const foot = (c: number, s: number): boolean => {
    const [x, z] = [pos.x + c * FALL.foot, pos.z + s * FALL.foot];
    return holds(w, x, z, Math.max(pos.y, w.ground(x, z)), h);
  };
  return RING.some(([c, s]) => foot(c, s)) ? 'edge' : 'air';
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
  Object.assign(p, { buffer: createBuffer(), dodgeHeld: -1, sprinting: false, blockHeld: false, blockRaised: false, listening: null, glance: false, kneeling: null });
  setLock(g, null);
  const [dx, dz] = [(tr.pos.x - tr.prev.x) * SIM.hz, (tr.pos.z - tr.prev.z) * SIM.hz];
  const run = Math.hypot(dx, dz);
  const k = run > FALL.carry ? FALL.carry / run : 1;
  const sea = overSea(g, tr.pos, g.ecs.c.body.get(p.id)!.height);
  p.falling = { frame: 0, vy: 0, vx: dx * k, vz: dz * k, spin: 1, lip: { ...lip }, water: sea ? enterSea(tr.pos, { x: dx, z: dz }, seaTimeOf(g), seaChopNow(g)) : null };
  g.events.emit('Fell', { entity: p.id, at: { ...tr.pos }, frames: FALL.frames, sea });
}

/** Whether what ends the land here is the sea, and not a drop: outside a dungeon, with the feet at the water and clear of every pit and gap (round 55). */
function overSea(g: Game, pos: V3, h: number): boolean {
  return !inDungeon(pos.x, pos.z) && pos.y <= SEA + 0.05 && !inFall(g.world, pos, FALL.foot, h);
}

/** One frame of the drop; at its foot the death, with the body left there in the dark (movement.ts leaves it be until the next waking). */
function dropStep(g: Game, f: Falling): void {
  if (f.water) return waterStep(g, f, beginDeath); // the sea has it (systems/waterFall.ts)
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
  if (f.water) return waterDark(f.water);
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
  const hold = holdOf(g.world, tr.pos, b.height);
  if (hold === 'floor') LIP.set(g, { ...tr.pos }); // the last feet on the floor: the Echoes will lie here
  if (hold !== 'air') return; // on the floor, or balanced on the very edge of it, and free to step back
  beginFall(g, LIP.get(g) ?? tr.prev); // no contact with the floor left: past saving by stepping back, and the drop is the death
}
