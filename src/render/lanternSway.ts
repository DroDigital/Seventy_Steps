/**
 * A lantern hung from a hook, swinging on its ring (round 57): a damped pendulum about two axes, pushed by what a ride does to
 * it (the box speeding up or braking, coming round, tilting over the ground) and by the road under the wheels, never by chance.
 * Pure numbers; the chariot's side lamps pose themselves from it (render/chariotFittings.ts).
 */

/** Angles in radians: `x` swings the lantern back (positive) or forward, `z` out to the left (positive) or the right; `vx`, `vz` per second. */
export interface Sway { x: number; z: number; vx: number; vz: number }

export const SWAY = Object.freeze({
  hz: 1.75, // the swing's own pace: a short lantern on a ring
  damping: 0.14, // of critical: it rings down in a few swings
  perAccel: 0.016, // rad it hangs off the plumb line for each m/s² of speeding up or braking (in the lantern's own frame)
  perLateral: 0.016, // and for each m/s² of turning
  road: 0.045, // rad of tremble at a full gallop, from the road: the stride's own beat and a rougher one over it
  tilt: 0.7, // how much of the box's pitch and roll it hangs plumb against
  limit: 0.32, // the most it ever swings: a lantern knocking its bracket is a different picture
});

export interface SwayDrive {
  /** m/s², forward positive: the box speeding up (the lantern lags behind) or braking (it swings on). */
  accel: number;
  /** m/s², toward the left positive: a left turn throws the lantern to the right. */
  lateral: number;
  /** The box's own pitch and roll (radians, as the group is posed): the lantern still hangs plumb. */
  pitch: number;
  roll: number;
  /** 0 standing, 1 at a full gallop: how rough the road is. */
  speed: number;
  /** Seconds, and the gait cycles ridden (the road's beat comes with the stride). */
  time: number;
  cycle: number;
  /** Which lantern (so two do not shiver as one). */
  seed: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const createSway = (): Sway => ({ x: 0, z: 0, vx: 0, vz: 0 });

/** Steps the pendulum by `dt` seconds (any size: it is sub-stepped), and returns it. */
export function stepSway(s: Sway, dt: number, d: SwayDrive): Sway {
  const w = 2 * Math.PI * SWAY.hz, c = 2 * SWAY.damping * w;
  const steps = Math.max(1, Math.ceil(Math.min(dt, 0.1) / (1 / 120)));
  const h = Math.min(dt, 0.1) / steps;
  const [targetX, targetZ] = [
    clamp(d.accel * SWAY.perAccel, -0.25, 0.25) - d.pitch * SWAY.tilt,
    clamp(-d.lateral * SWAY.perLateral, -0.25, 0.25) - d.roll * SWAY.tilt,
  ];
  for (let i = 0; i < steps; i++) {
    const t = d.time + i * h;
    const shake = d.speed * SWAY.road * w * w;
    const beat = Math.sin(2 * Math.PI * d.cycle * 2 + d.seed * 2.1), rough = Math.sin(t * 17.3 + d.seed * 3.7) * Math.sin(t * 5.9 + d.seed);
    const fx = (beat * 0.6 + rough * 0.5) * shake;
    const fz = (Math.sin(2 * Math.PI * d.cycle + d.seed) * 0.5 + Math.sin(t * 13.1 + d.seed * 1.3) * 0.5) * shake * 0.8;
    s.vx += (-w * w * (s.x - targetX) - c * s.vx + fx) * h;
    s.vz += (-w * w * (s.z - targetZ) - c * s.vz + fz) * h;
    s.x += s.vx * h;
    s.z += s.vz * h;
  }
  s.x = clamp(s.x, -SWAY.limit, SWAY.limit);
  s.z = clamp(s.z, -SWAY.limit, SWAY.limit);
  if (!Number.isFinite(s.x + s.z + s.vx + s.vz)) Object.assign(s, createSway());
  return s;
}
