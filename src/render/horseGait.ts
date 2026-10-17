/** Two-bone legs for the carriage horse. Rest, straight down, is zero rotation. No Three.js. */

export interface LegPose { upper: number; lower: number; ky: number; kz: number; hy: number; hz: number }

/** Hoof in leg space. +z is forward, -y is down. A positive dip has dropped the hip. */
export function hoofTarget(cycle: number, gallop: number, moving: number, dip: number, ground: number, length: number): { tz: number; ty: number } {
  const duty = 0.58 - 0.26 * gallop;
  const reach = (0.36 + 0.48 * gallop) * moving;
  const liftH = (0.16 + 0.22 * gallop) * moving;
  const u = ((cycle % 1) + 1) % 1;
  let tz = 0;
  let lift = 0;
  if (moving > 0.001 && u >= duty) {
    const s = (u - duty) / (1 - duty);
    const e = s * s * (3 - 2 * s);
    tz = reach * (-0.5 + e);
    lift = Math.sin(s * Math.PI) * liftH;
  } else if (moving > 0.001) {
    tz = reach * (0.5 - u / duty);
  }
  return { tz, ty: -length + dip + lift + ground };
}

/**
 * Hip at the origin. `bend` -1 folds a front knee toward +z; +1 folds a hock toward -z.
 * The hoof is pulled in to the reach of the two bones, and that planted point is returned.
 */
export function solveLeg(tz: number, ty: number, L1: number, L2: number, bend: number): LegPose {
  const max = L1 + L2;
  const min = Math.abs(L1 - L2) + 1e-3;
  let y = ty;
  let z = tz;
  let d = Math.hypot(z, y) || min;
  if (d > max) { y *= max / d; z *= max / d; d = max; }
  else if (d < min) { y *= min / d; z *= min / d; d = min; }
  const along = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
  const ky = (y / d) * along - (z / d) * h * bend;
  const kz = (z / d) * along + (y / d) * h * bend;
  const upper = -Math.atan2(kz, -ky);
  const cu = Math.cos(upper);
  const su = Math.sin(upper);
  const ly = (y - ky) * cu + (z - kz) * su;
  const lz = -(y - ky) * su + (z - kz) * cu;
  const lower = -Math.atan2(lz, -ly);
  return { upper, lower, ky, kz, hy: y, hz: z };
}
