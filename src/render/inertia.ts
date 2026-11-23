/**
 * Round 116, inertialization (David Bollo, "Inertialization: High-Performance Animation Transitions in Gears of War", GDC 2016): how a
 * difference between the pose last drawn and a new one is taken away. It starts at the difference `x0` and the rate it was changing at,
 * `v0`, and comes to rest at nothing, with no speed and no push left, in at most `blend` seconds, by a quintic: so a joint that was moving
 * toward its new pose goes on moving at the speed it had, and one that was not starts as gently as it ends. A rate taking it away from the
 * new pose is not followed (it would overshoot and come back), and one fast enough to arrive early ends it early, before it could pass
 * through. Pure numbers, no Three.js (render/poseBlend.ts lays it on every joint).
 */

export interface Decay {
  x0: number;
  v0: number;
  a0: number;
  t1: number; // seconds until it is gone
  a: number; // the quintic's t⁵, t⁴ and t³ coefficients
  b: number;
  c: number;
}

export const NO_DECAY: Decay = { x0: 0, v0: 0, a0: 0, t1: 0, a: 0, b: 0, c: 0 };

/** The decay of a difference `x0` (> 0, along its own axis) changing at `v0` per second, over at most `blend` seconds. */
export function decayOf(x0: number, v0: number, blend: number): Decay {
  if (!(x0 > 1e-7) || !(blend > 0)) return NO_DECAY;
  const v = Number.isFinite(v0) ? Math.min(0, v0) : 0; // (away from the new pose: not followed)
  const t1 = v < 0 ? Math.min(blend, (-5 * x0) / v) : blend; // (toward it, fast: ends before it would pass through)
  const a0 = Math.max(0, (-8 * v * t1 - 20 * x0) / (t1 * t1));
  const [t2, t3] = [t1 * t1, t1 * t1 * t1];
  return {
    x0,
    v0: v,
    a0,
    t1,
    a: -(a0 * t2 + 6 * v * t1 + 12 * x0) / (2 * t3 * t2),
    b: (3 * a0 * t2 + 16 * v * t1 + 30 * x0) / (2 * t2 * t2),
    c: -(3 * a0 * t2 + 12 * v * t1 + 20 * x0) / (2 * t3),
  };
}

/** What is left of the difference `t` seconds after it was taken (0 from `t1` on). */
export function decayAt(d: Decay, t: number): number {
  if (t >= d.t1 || d.t1 <= 0) return 0;
  const s = Math.max(0, t);
  return (((d.a * s + d.b) * s + d.c) * s + d.a0 / 2) * s * s + d.v0 * s + d.x0;
}
