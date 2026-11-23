/**
 * Round 116, a blow taken rocks the body the way it was struck. Before, a landed blow tipped the whole figure back by one fixed angle at
 * once, whichever side it came from, and let it return in a straight line over a quarter of a second. Now the blow is an impulse along
 * the line from the one who struck to the one struck, in the struck one's own frame: the torso is thrown back from a blow in front,
 * forward from one behind and aside from one at the flank, the hips give a little of it, and the head, on a slower spring of its own,
 * snaps after the torso and settles last. Each is a damped spring, so it overshoots a little and comes to rest. For the investigator and
 * the people (their figures, not the drawn creatures). Render only.
 */

import type { HitOutcome } from '../systems/components';
import type { Figure } from './figures';

export const HIT_REACT = {
  freq: 2.3, // Hz: the torso's spring
  damping: 0.42,
  headFreq: 1.7, // and the head's, slower: it lags
  headDamping: 0.35,
  push: 3.9, // rad/s the torso is set moving by a full blow (a peak of about 0.16 rad)
  head: 3.0, // rad/s the head is (about 0.18 rad, after the torso's)
  hips: 0.3, // the share of the torso's lean the hips take
  most: 0.34, // rad: the most any lean goes, blows piled on blows
  step: 1 / 120, // seconds: the longest step of the solve
  /** How hard each way a blow lands rocks the one it lands on (a blow turned aside by the guard is taken in the arms; a parry or a dodge, hardly or not at all). */
  outcome: { hit: 1, stagger: 1.25, kill: 1.3, riposte: 1.3, guardBreak: 1.1, interrupted: 0.8, blocked: 0.45, parried: 0.2, dodged: 0 } satisfies Record<HitOutcome, number>,
};

/** A spring's lean, forward (x) and toward the right (z), and how fast each is changing. */
interface Lean {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export interface HitReact {
  torso: Lean;
  head: Lean;
}

const lean = (): Lean => ({ x: 0, z: 0, vx: 0, vz: 0 });
export const newHitReact = (): HitReact => ({ torso: lean(), head: lean() });

/** A blow pushing the figure `ahead` (its own forward) and `right` (toward its right), each a share of a unit push, `outcome` and `weight` (0.75 to 1.25 by how much it took) saying how hard. */
export function kickHitReact(r: HitReact, ahead: number, right: number, outcome: HitOutcome, weight = 1): void {
  const k = (HIT_REACT.outcome[outcome] ?? 1) * Math.min(1.25, Math.max(0.75, weight));
  if (!(k > 0) || !Number.isFinite(ahead + right)) return;
  r.torso.vx += HIT_REACT.push * k * ahead;
  r.torso.vz += HIT_REACT.push * k * right;
  r.head.vx += HIT_REACT.head * k * ahead;
  r.head.vz += HIT_REACT.head * k * right;
}

function spring(s: Lean, freq: number, damping: number, h: number): void {
  const w = 2 * Math.PI * freq;
  s.vx += (-w * w * s.x - 2 * damping * w * s.vx) * h;
  s.vz += (-w * w * s.z - 2 * damping * w * s.vz) * h;
  s.x = Math.min(HIT_REACT.most, Math.max(-HIT_REACT.most, s.x + s.vx * h));
  s.z = Math.min(HIT_REACT.most, Math.max(-HIT_REACT.most, s.z + s.vz * h));
}

/** The springs `dt` seconds on. */
export function stepHitReact(r: HitReact, dt: number): void {
  if (!(dt > 0)) return;
  const n = Math.min(24, Math.ceil(Math.min(dt, 0.2) / HIT_REACT.step));
  const h = Math.min(dt, 0.2) / n;
  for (let i = 0; i < n; i++) {
    spring(r.torso, HIT_REACT.freq, HIT_REACT.damping, h);
    spring(r.head, HIT_REACT.headFreq, HIT_REACT.headDamping, h);
  }
}

/** Whether anything is still moving (so a figure at rest costs nothing). */
export const reacting = (r: HitReact): boolean => Math.abs(r.torso.x) + Math.abs(r.torso.z) + Math.abs(r.torso.vx) + Math.abs(r.torso.vz) + Math.abs(r.head.x) + Math.abs(r.head.z) + Math.abs(r.head.vx) + Math.abs(r.head.vz) > 1e-4;

/** Lays the leans on the pose made (by quaternion turns: a clipped joint's Euler angles are not added to, docs/PLAYER.md): the hips a share, the torso the rest, the head its own on top. Positive x leans forward, positive z toward the right (his right is −x: a turn about +z takes the head toward it). */
export function applyHitReact(f: Figure, r: HitReact): void {
  if (!reacting(r)) return;
  const [t, h, hips] = [r.torso, r.head, HIT_REACT.hips];
  f.body.rotateX(t.x * hips);
  f.body.rotateZ(t.z * hips);
  f.torso.rotateX(t.x * (1 - hips));
  f.torso.rotateZ(t.z * (1 - hips));
  f.head.rotateX(h.x);
  f.head.rotateZ(h.z);
}

/** A blow from one standing at `from` on one at `to` facing `to.yaw` (yaw 0 faces +z; its right is (−cos, sin)): pushed away from the striker, the harder for more `damage`. One standing on the other is taken as struck from in front. */
export function kickByBlow(r: HitReact, from: { x: number; z: number }, to: { x: number; z: number; yaw: number }, outcome: HitOutcome, damage: number): void {
  let [dx, dz] = [to.x - from.x, to.z - from.z];
  const d = Math.hypot(dx, dz);
  if (d < 1e-3) [dx, dz] = [-Math.sin(to.yaw), -Math.cos(to.yaw)];
  else [dx, dz] = [dx / d, dz / d];
  const ahead = dx * Math.sin(to.yaw) + dz * Math.cos(to.yaw);
  const right = -dx * Math.cos(to.yaw) + dz * Math.sin(to.yaw);
  kickHitReact(r, ahead, right, outcome, 0.75 + 0.5 * Math.min(1, Math.max(0, damage) / 60));
}
