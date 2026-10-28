/**
 * The gates between the realms are walked through (round 60: asked, "all traversable portals (except boss fogs) should
 * be accessible via straightforward pedestrian movement and feature more ambitious, visually compelling animations"): a
 * free investigator who steps into a gate's veil, between its jambs, is drawn on into it a few steps, the walk no longer
 * theirs, and comes through at its twin (checkpoints.ts `passGate`). The veil falls over the walk (ui/journeys.ts), and
 * the gate's light swells and takes them (render/portalViews.ts). E does nothing at a gate, and no prompt offers it (round 60,
 * asked: "remove the option and indicator for pressing E to move through portals, except boss fogs"): nearing one says where it
 * leads (`gateNear`, the HUD's line). One riding is kept in the saddle through it (`mountPortal.ts`): the pace they
 * had is the pace they come out at, for a moment, and longer if the stick stays taken. A boss fight still holds every
 * gate shut, and the demo's edge still turns them back, each said as they step in. Pure: no Three.js.
 */

import { distXZ, type XZ } from '../core/geom';
import { worldLayout, type GatePlace } from '../world/placements';
import { regionAt, yawOfDir } from '../world/worldMap';
import { gateBarred, gateBeyondDemo, gatePlace, passGate } from './checkpoints';
import type { Game } from './components';
import { walkAlong } from './fogGates';
import { clearPortalRide, notePortalRide } from './mountPortal';

/** A gate's veil, and the walk into it. */
export const GATE_WALK = {
  opening: 1.45, // metres either side of its middle that the veil spans (the jambs stand at 1.9, half a metre thick)
  touch: 0.6, // metres from the veil's plane at which a step into it is taken
  depth: 1.3, // metres on into the light they are drawn
  pace: 1.4, // metres a second, once under way
  frames: 72, // the walk takes at least this long (1.2 s): the veil's fall is made to it
  told: 120, // frames between two sayings that the gate is shut (a body pressed to it would hear it every step)
  notice: 9, // metres from a gate within which the HUD says where it leads
};

/** Where `p` stands about gate `t`: how far in front of its veil (the side it faces, where those coming through stand), and how far across its opening. */
export function aboutGate(t: Pick<GatePlace, 'x' | 'z' | 'face'>, p: XZ): { ahead: number; across: number } {
  const yaw = yawOfDir(t.face);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  const [dx, dz] = [p.x - t.x, p.z - t.z];
  return { ahead: dx * fx + dz * fz, across: dx * fz - dz * fx };
}

/** The gate whose veil a step from `a` to `b` goes into: between its jambs, from beyond its touch to within it, from either side. */
export function gateStepped(a: XZ, b: XZ): GatePlace | null {
  for (const t of worldLayout().gates) {
    if (Math.abs(t.x - b.x) > 8 || Math.abs(t.z - b.z) > 8) continue;
    const [was, now] = [aboutGate(t, a), aboutGate(t, b)];
    if (Math.abs(now.across) <= GATE_WALK.opening && Math.abs(now.ahead) <= GATE_WALK.touch && Math.abs(was.ahead) > GATE_WALK.touch) return t;
  }
  return null;
}

const told = new WeakMap<Game, number>(); // when a shut gate was last said to be shut

/** Sets the investigator walking on into `gate`'s veil, toward its middle. */
export function enterGate(g: Game, gate: GatePlace): void {
  notePortalRide(g); // one riding is kept: the veil's walk has the body, and the pace comes through with them (mountPortal.ts)
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const at = aboutGate(gate, me);
  const [side, yaw] = [Math.sign(at.ahead) || 1, yawOfDir(gate.face)];
  const [fx, fz, rx, rz] = [Math.sin(yaw), Math.cos(yaw), Math.cos(yaw), -Math.sin(yaw)];
  const across = at.across * 0.5; // drawn toward its middle as they go
  const to = { x: gate.x + rx * across - fx * side * GATE_WALK.depth, z: gate.z + rz * across - fz * side * GATE_WALK.depth };
  const from = { x: me.x, z: me.z };
  const frames = Math.max(GATE_WALK.frames, Math.round((distXZ(from, to) / GATE_WALK.pace + 0.4) * 60));
  g.player.gatePass = { gate: gate.id, from, to, frame: 0, frames };
  g.player.kneeling = null;
  g.events.emit('GateEntering', { gate: gate.id, x: gate.x, z: gate.z, frames });
}

/** Where `gate` leads, for a notice: the region beyond it, or, where its twin stands in the same region, the twin's name. */
export function leadsTo(gate: GatePlace): string {
  const twin = gatePlace(gate.to);
  if (!twin) return '';
  const [there, here] = [regionAt(twin.x, twin.z), regionAt(gate.x, gate.z)];
  return there && here && there.id !== here.id ? there.name : twin.name;
}

/** The gate close enough for the HUD to say where it leads, and where, if a free investigator is near one (nothing while one is walking into a veil or fallen). */
export function gateNear(g: Game): { id: string; leads: string } | null {
  const p = g.player;
  if (!g.overworld || g.cutscene || p.gatePass || p.fogPass || p.falling || (g.ecs.c.health.get(p.id)?.hp ?? 0) <= 0) return null;
  const at = g.ecs.c.transform.get(p.id)!.pos;
  let best: GatePlace | null = null;
  let bestD = GATE_WALK.notice;
  for (const t of worldLayout().gates) {
    const d = distXZ(t, at);
    if (d < bestD) [best, bestD] = [t, d];
  }
  return best ? { id: best.id, leads: leadsTo(best) } : null;
}

/** One step, after movement: a free investigator on foot who has just stepped into a gate's veil is drawn on into it; one held from it is told why. */
export function gateStepSystem(g: Game): void {
  const p = g.player;
  if (!g.overworld || g.cutscene || p.gatePass || p.fogPass || p.falling) return;
  const c = g.ecs.c;
  if (c.actor.get(p.id)?.move === 'death' || (c.health.get(p.id)?.hp ?? 0) <= 0) return;
  const tr = c.transform.get(p.id)!;
  const gate = gateStepped(tr.prev, tr.pos);
  if (!gate) return;
  if (!gateBarred(g) && !gateBeyondDemo(g, gate.id)) return enterGate(g, gate);
  if (g.frame - (told.get(g) ?? -Infinity) < GATE_WALK.told) return;
  told.set(g, g.frame);
  passGate(g, gate.id); // refused, and it says why: a fight holds it, or the demo ends there
}

/** One step of the walk in, before movement (which it leaves nothing to move); at its end they are through. */
export function gatePassSystem(g: Game): void {
  if (g.cutscene) return;
  const p = g.player;
  const pass = p.gatePass;
  if (!pass) return;
  const c = g.ecs.c;
  const [tr, m, a] = [c.transform.get(p.id)!, c.mover.get(p.id), c.actor.get(p.id)];
  if (!a || a.move === 'death' || (c.health.get(p.id)?.hp ?? 0) <= 0) {
    p.gatePass = null;
    clearPortalRide(g); // a fall on the way through leaves no ride waiting
    return;
  }
  [tr.prev.x, tr.prev.y, tr.prev.z, tr.prevYaw] = [tr.pos.x, tr.pos.y, tr.pos.z, tr.yaw]; // the step is from here: the legs read the ground going by (movement.ts leaves it)
  pass.frame++;
  const u = Math.min(1, pass.frame / pass.frames);
  const ease = walkAlong(u, pass.frames / 60);
  const [x, z] = [pass.from.x + (pass.to.x - pass.from.x) * ease, pass.from.z + (pass.to.z - pass.from.z) * ease];
  [tr.pos.x, tr.pos.z, tr.pos.y] = [x, z, g.world.ground(x, z)];
  if (m) {
    m.vx = m.vz = 0;
    m.face = Math.atan2(pass.to.x - pass.from.x, pass.to.z - pass.from.z);
  }
  tr.yaw = m?.face ?? tr.yaw;
  if (u < 1) return;
  p.gatePass = null;
  if (!passGate(g, pass.gate)) clearPortalRide(g); // a gate that does not open leaves no ride waiting on its far side
}
