/**
 * The fog before a horror is a wall (round 35: it was a picture the investigator, and anything else,
 * walked through, and the horror saw them across it): while its horrors live nothing crosses it, not
 * the investigator, not a foe, and nothing sees across it; the one way through is E, near it. E turns
 * the investigator to it and they walk in on their own, slowly, the fog parting about them, to a
 * place a few steps beyond; on the way nothing sees them or reaches them (round 60: the horror woke
 * as they crossed and struck while the walk was not theirs). The fog is gone, for good, once every
 * horror it keeps is slain. Round 78: an open arena's fog stands in its gate, behind the leaves (it was an
 * opaque ring about the fight), and the ring is only the line a sleeping horror wakes at: `wakeBetween`.
 * Pure: no Three.js (render/bossFog.ts draws it, and the parting).
 */

import { distXZ, type XZ } from '../core/geom';
import { PASSAGE } from '../data/tuning';
import { gatePlan, type FogWall, type GatePlan, type Wake } from '../world/gatePlan';
import { worldLayout } from '../world/placements';
import type { Game } from './components';

export const FOG_REACH = 2.6; // metres from a wall within which E passes it
const FOG_BEYOND = 1.8; // metres past the wall they are walked to (round 60: 2.4, and the walk ran on long after the fog let them by)
const FOG_PACE = 2; // metres a second they walk through it, once under way...
const FOG_SET_OFF = 0.3; // ...seconds they take to get under way...
const FOG_STOP = 0.5; // ...and to come to a stop: they end standing, the legs still (round 60: the walk ended in mid-stride, and an arrival scene held them striding in place)
const JAMB = 0.35; // a doorway's wall reaches this far past its opening, into the jambs

let plan: GatePlan | null = null;
const planned = (): GatePlan => (plan ??= gatePlan(worldLayout()));
/** Every fog wall of the world. */
export const allFogs = (): readonly FogWall[] => planned().fogs;
/** The lines at which the horrors of the open wake. */
export const allWakes = (): readonly Wake[] => planned().wakes;

/** The walls still standing: those whose horrors are not all slain. */
export function fogsUp(g: Game): FogWall[] {
  const ow = g.overworld;
  return ow ? allFogs().filter((w) => !w.spawns.every((s) => ow.slain.has(s))) : [];
}

/** Which side of a wall `p` is on: positive on its far (in-room, or in the court) side, negative on the near, 0 on it. */
export const sideOf = (w: Pick<FogWall, 'x' | 'z' | 'yaw'>, p: XZ): number => (p.x - w.x) * Math.sin(w.yaw) + (p.z - w.z) * Math.cos(w.yaw);

/** How far along a doorway's wall `p` lies from its middle (across the opening). */
const across = (w: Pick<FogWall, 'x' | 'z' | 'yaw'>, p: XZ): number => (p.x - w.x) * Math.cos(w.yaw) - (p.z - w.z) * Math.sin(w.yaw);

/** Whether the step from `a` to `b` crosses the wall. */
export function crosses(w: Pick<FogWall, 'x' | 'z' | 'yaw' | 'width'>, a: XZ, b: XZ): boolean {
  const [sa, sb] = [sideOf(w, a), sideOf(w, b)];
  if (sa * sb > 0 || (sa === 0 && sb === 0)) return false;
  const t = sa / (sa - sb); // where along the step it meets the wall's plane
  const at = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  return Math.abs(across(w, at)) <= w.width / 2 + JAMB;
}

/** Whether a horror's wake line lies between `a` and `b` while it sleeps: nothing it keeps sees or hears across it until it is roused (the investigator steps into its ring and it wakes). */
export function wakeBetween(g: Game, a: XZ, b: XZ): boolean {
  const ow = g.overworld;
  if (!ow) return false;
  for (const w of allWakes()) {
    if ((distXZ(w, a) <= w.radius) === (distXZ(w, b) <= w.radius)) continue;
    if (w.spawns.every((s) => ow.slain.has(s))) continue;
    for (const f of g.ecs.c.fight.values()) if (f.engaged && w.bosses.includes(f.id)) return false; // awake: it tracks them where it will
    return true;
  }
  return false;
}

/** Whether any standing wall lies between `a` and `b`, or a sleeping horror's wake line does: nothing sees, hears or reaches across one. */
export const fogBetween = (g: Game, a: XZ, b: XZ): boolean => fogsUp(g).some((w) => crosses(w, a, b)) || wakeBetween(g, a, b);

/** Whether the gate a wall stands in has opened, so that the wall is there to be passed (a shut gate has its seal, and the mist behind it is not to be walked to through the stone). */
function gateOpen(g: Game, name: string): boolean {
  for (const [id, piece] of g.ecs.c.piece) {
    if (piece.def.name !== name) continue;
    const l = g.ecs.c.layer.get(id);
    return !!l && l.shown && l.open >= PASSAGE.solidAt;
  }
  return false;
}

/** The standing wall within reach of `p`, and how far (the nearest): not one behind a gate that is shut. */
export function fogNear(g: Game, p: XZ, reach = FOG_REACH): { wall: FogWall; gap: number } | null {
  let best: { wall: FogWall; gap: number } | null = null;
  for (const wall of fogsUp(g)) {
    const gap = Math.hypot(Math.abs(sideOf(wall, p)), Math.max(0, Math.abs(across(wall, p)) - wall.width / 2));
    if (gap > reach || (best && gap >= best.gap) || (wall.gate && !gateOpen(g, wall.gate))) continue;
    best = { wall, gap };
  }
  return best;
}

/** Whether the fog the investigator would pass is one a fight holds them behind (they may not leave it). */
function held(g: Game, w: FogWall): boolean {
  for (const f of g.ecs.c.fight.values()) if (f.veiled && w.bosses.includes(f.id)) return true;
  return false;
}

/** The wall E would pass now, if any: within reach, and the fight does not hold them. */
export function fogToPass(g: Game): FogWall | null {
  const p = g.player;
  if (p.fogPass || g.ecs.c.actor.get(p.id)?.move !== null || p.listening !== null) return null;
  const me = g.ecs.c.transform.get(p.id)!.pos;
  const n = fogNear(g, me);
  return n && !held(g, n.wall) ? n.wall : null;
}

/** How far along its length a walk `seconds` long has come at `u` (0..1) of its time: from rest, under way, a steady walk, and to rest again (its pace a trapezoid). */
export function walkAlong(u: number, seconds: number): number {
  const [a, b] = [Math.min(0.45, FOG_SET_OFF / seconds), Math.min(0.45, FOG_STOP / seconds)]; // the shares of it spent setting off and stopping
  const peak = 1 / (1 - (a + b) / 2); // the steady pace, as a share of the mean
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < a) return (peak * u * u) / (2 * a);
  if (u > 1 - b) return 1 - (peak * (1 - u) ** 2) / (2 * b);
  return peak * (u - a / 2);
}

const LENS_KEEP = 0.8; // metres a cutscene's lens keeps inside a wall (round 68)
const LENS_BAND = 4; // metres past a doorway's jambs that its wall is still the lens's to respect

/**
 * The walls the one at `at` stands inside (past, in the hall or the court): where a cutscene's lens must stay (round 68: a big horror's
 * arrival began with the lens behind the investigator, who stands a step inside the fog, or half a body's height from the horror, which
 * is outside the ring: the first seconds showed the wall of fog from within it and nothing else; round 78: the fog is a gate's, and the
 * lens is kept in the court, not out in front of its wall).
 */
export const fogsAround = (g: Game, at: XZ): FogWall[] => fogsUp(g).filter((w) => sideOf(w, at) > 0 && Math.abs(across(w, at)) <= w.width / 2 + JAMB + LENS_BAND);

/** Whether a lens at `p` is inside every one of `walls`, `margin` metres clear of each. */
export const lensInside = (walls: readonly Pick<FogWall, 'x' | 'z' | 'yaw' | 'width'>[], p: XZ, margin = LENS_KEEP): boolean =>
  walls.every((w) => sideOf(w, p) >= margin || Math.abs(across(w, p)) > w.width / 2 + JAMB + LENS_BAND);

/** How much of the line `from` → `to` (0..1) is inside `walls`: the lens is drawn in along its line to the head of whoever it circles, as far as that. */
export function insideLine(walls: readonly Pick<FogWall, 'x' | 'z' | 'yaw' | 'width'>[], from: XZ, to: XZ): number {
  const at = (t: number): XZ => ({ x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t });
  if (lensInside(walls, to)) return 1;
  let [lo, hi] = [0, 1];
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (lensInside(walls, at(mid))) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Sets the investigator walking through `w`. */
export function passFog(g: Game, w: FogWall): void {
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const side = Math.sign(sideOf(w, me)) || 1;
  const to = { x: w.x - Math.sin(w.yaw) * side * FOG_BEYOND, z: w.z - Math.cos(w.yaw) * side * FOG_BEYOND }; // from outside, in; from within, out
  const from = { x: me.x, z: me.z };
  const frames = Math.max(40, Math.round((distXZ(from, to) / FOG_PACE + (FOG_SET_OFF + FOG_STOP) / 2) * 60));
  g.player.fogPass = { wall: w.id, from, to, frame: 0, frames };
  g.player.kneeling = null;
  g.events.emit('FogPassing', { wall: w.id, x: me.x, z: me.z, frames });
}

/** One step of a pass: the walk, and its end. Runs before the movement system, which it leaves nothing to move. */
export function fogPassSystem(g: Game): void {
  if (g.cutscene) return;
  const p = g.player;
  const pass = p.fogPass;
  if (!pass) return;
  const c = g.ecs.c;
  const [tr, m, a] = [c.transform.get(p.id)!, c.mover.get(p.id), c.actor.get(p.id)];
  if (!a || a.move === 'death' || (c.health.get(p.id)?.hp ?? 0) <= 0) {
    p.fogPass = null;
    return;
  }
  [tr.prev.x, tr.prev.y, tr.prev.z, tr.prevYaw] = [tr.pos.x, tr.pos.y, tr.pos.z, tr.yaw]; // the step they take is from here: the legs read it as the ground going by (movement.ts leaves it)
  pass.frame++;
  const u = Math.min(1, pass.frame / pass.frames);
  const ease = walkAlong(u, pass.frames / 60);
  const [x, z] = [pass.from.x + (pass.to.x - pass.from.x) * ease, pass.from.z + (pass.to.z - pass.from.z) * ease];
  tr.pos.x = x;
  tr.pos.z = z;
  tr.pos.y = g.world.ground(x, z);
  if (m) {
    m.vx = m.vz = 0;
    m.face = Math.atan2(pass.to.x - pass.from.x, pass.to.z - pass.from.z);
  }
  tr.yaw = m?.face ?? tr.yaw;
  if (u >= 1) {
    p.fogPass = null;
    g.events.emit('FogPassed', { wall: pass.wall, x: x, z: z });
  }
}

/** After movement: nothing but the investigator on their way through crosses a standing wall; a step that would is undone. */
export function fogBlockSystem(g: Game): void {
  const walls = fogsUp(g);
  if (!walls.length) return;
  const { transform, body } = g.ecs.c;
  for (const [id, tr] of transform) {
    const b = body.get(id);
    if (!b || b.fixed || (id === g.player.id && g.player.fogPass)) continue;
    const step = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z);
    if (step < 1e-6 || step > 3) continue; // still, or taken in a leap (a journey): not walked
    for (const w of walls) {
      if (!crosses(w, tr.prev, tr.pos)) continue;
      [tr.pos.x, tr.pos.z] = [tr.prev.x, tr.prev.z];
      tr.pos.y = g.world.ground(tr.pos.x, tr.pos.z);
      const m = g.ecs.c.mover.get(id);
      if (m) m.vx = m.vz = 0;
      break;
    }
  }
}
