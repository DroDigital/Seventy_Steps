/**
 * An ally that goes with the investigator keeps to the way they went (round 123, asked: the Cavern of Flame's priests must not be stuck anywhere,
 * and once spoken with "they follow and help you"). An ally walked straight at the investigator, and the Stairs of Slumber turn at their landings
 * and run between parapets over a void, so it was left against a parapet while they went on down. Now the investigator's footing is kept as a
 * trail of points (`ALLY_TRAIL.step` apart), and an ally that cannot see them plainly walks it, taking every turn they took; and one that can step
 * through the dream (its blows include `teleport`: Nasht and Kaman-Thah, who send and are gone) and is left far behind, or has gained no ground
 * for a while, stands at their back again at once, on their trail, never across a realm's edge (left at a gate, it stays). Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import { yawOf, type XZ } from '../core/geom';
import { ALLY_TRAIL, SIM } from '../data/tuning';
import { hasLineOfSight, resolveCapsule } from '../world/colliders';
import { regionAt } from '../world/worldMap';
import type { Brain, Game } from './components';

interface Point { x: number; y: number; z: number }
interface Trail { points: Point[]; last: Point | null }

const trails = new WeakMap<Game, Trail>();
const lags = new WeakMap<Brain, { best: number; since: number }>();
const EYE = 1.2; // metres over the feet a sight line is drawn at

/** Keeps the investigator's trail: a point every `step` metres walked, the last `length` of them; a leap (a journey, a gate, a fall) begins it anew. */
export function recordTrail(g: Game): void {
  const p = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!p) return;
  let t = trails.get(g);
  if (!t) trails.set(g, (t = { points: [], last: null }));
  const at = { x: p.x, y: p.y, z: p.z };
  if (t.last && Math.hypot(at.x - t.last.x, at.z - t.last.z) > ALLY_TRAIL.leap) t.points = [];
  t.last = at;
  const end = t.points[t.points.length - 1];
  if (end && Math.hypot(at.x - end.x, at.y - end.y, at.z - end.z) < ALLY_TRAIL.step) return;
  t.points.push(at);
  if (t.points.length > ALLY_TRAIL.length) t.points.shift();
}

/** The investigator's trail as kept now, oldest first (for the tests). */
export const trailOf = (g: Game): readonly Point[] => trails.get(g)?.points ?? [];

/** Whether an ally at `from` sees the investigator at `to` plainly: no wall between them, and not a flight of the stair either. */
const plain = (g: Game, from: Point, to: Point): boolean =>
  Math.abs(from.y - to.y) <= ALLY_TRAIL.rise && hasLineOfSight(g.world, { x: from.x, y: from.y + EYE, z: from.z }, { x: to.x, y: to.y + EYE, z: to.z });

/** Where a following ally at `from` walks to now: the investigator at `to` if it sees them plainly, else a little way along their trail past its nearest point. */
export function followPoint(g: Game, from: Point, to: Point): XZ {
  const pts = trails.get(g)?.points ?? [];
  if (!pts.length || plain(g, from, to)) return to;
  let [k, best] = [0, Infinity];
  pts.forEach((p, i) => {
    const d = Math.hypot(p.x - from.x, p.z - from.z) + Math.abs(p.y - from.y);
    if (d < best) [k, best] = [i, d];
  });
  return pts[Math.min(pts.length - 1, k + ALLY_TRAIL.ahead)];
}

/** The pace a following ally at `from` walks at, `own` its own: hurried while it is more than `hurryFrom` behind the investigator at `to` (in the round, as on a stair). */
export const followPace = (from: Point, to: Point, own: number): number => (Math.hypot(from.x - to.x, from.y - to.y, from.z - to.z) > ALLY_TRAIL.hurryFrom ? own * ALLY_TRAIL.hurry : own);

/** Whether an ally can step through the dream to the investigator's side: one of its blows is `teleport`. */
const steps = (br: Brain): boolean => br.def.attacks.some((a) => a.move === 'teleport');

/** The point of the trail `ALLY_TRAIL.back` behind the investigator at `me` (the oldest, if they have come no farther), or undefined with no trail. */
function behind(g: Game, me: Point): Point | undefined {
  const pts = trails.get(g)?.points ?? [];
  for (let i = pts.length - 1; i >= 0; i--) if (Math.hypot(pts[i].x - me.x, pts[i].y - me.y, pts[i].z - me.z) >= ALLY_TRAIL.back) return pts[i];
  return pts[0];
}

/**
 * An ally that steps through the dream and is left behind stands at the investigator's back again: farther than `far` (`leave` while it fights),
 * or, following, gaining no ground for `stuck` seconds. True if it stepped. Not across a realm's edge, nor while it is beside them.
 */
export function catchUp(g: Game, id: Entity, br: Brain, fighting = false): boolean {
  if (!steps(br)) return false;
  const c = g.ecs.c;
  const tr = c.transform.get(id)!;
  const me = c.transform.get(g.player.id)!.pos;
  const d = Math.hypot(tr.pos.x - me.x, tr.pos.y - me.y, tr.pos.z - me.z);
  if (d < ALLY_TRAIL.near) return lags.set(br, { best: d, since: g.frame }), false;
  let lag = lags.get(br);
  if (!lag) lags.set(br, (lag = { best: d, since: g.frame }));
  if (d < lag.best - ALLY_TRAIL.gain) [lag.best, lag.since] = [d, g.frame];
  const stuck = !fighting && g.frame - lag.since > ALLY_TRAIL.stuck * SIM.hz;
  if (d < (fighting ? ALLY_TRAIL.leave : ALLY_TRAIL.far) && !stuck) return false;
  if (regionAt(tr.pos.x, tr.pos.z)?.id !== regionAt(me.x, me.z)?.id) return false; // left at a realm's gate, it stays
  const spot = behind(g, me);
  if (!spot) return false;
  const to = { x: spot.x, y: g.world.ground(spot.x, spot.z), z: spot.z };
  resolveCapsule(g.world, to, c.body.get(id)?.radius ?? 0.5, 2);
  const from = { ...tr.pos };
  tr.pos = { x: to.x, y: g.world.ground(to.x, to.z), z: to.z };
  tr.prev = { ...tr.pos };
  tr.yaw = tr.prevYaw = yawOf(me.x - to.x, me.z - to.z);
  lags.set(br, { best: Math.hypot(tr.pos.x - me.x, tr.pos.y - me.y, tr.pos.z - me.z), since: g.frame });
  g.events.emit('Teleported', { entity: id, from, to: { ...tr.pos } });
  return true;
}
