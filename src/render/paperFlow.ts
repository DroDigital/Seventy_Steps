/**
 * How a note's burning paper moves and glows (round 89; render/paperViews.ts draws it): the leaf floats a hand's breadth of bob, leans
 * back and turns on its own and toward the investigator when they are near; its surface runs with waves and its burnt rim curls
 * up; scraps of it turn about it; the fire crawls round the rim, orange at its heart and violet at its tips. When the page is put away
 * the leaf lifts, curls and flutters harder, and a burn crosses it from its rim to its middle, leaving ash. Pure: numbers in, numbers out.
 */

import { PAPER, PAPER_LOOK } from '../data/paperTuning';
import type { Sheet } from './paperKit';

export interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** How high the surface's waves run, and how far its rim is curled up (metres). */
  wave: number;
  curl: number;
  scale: number;
  phase: number;
}

/** A burn crossing a leaf: `front` is how far in from the rim it has got (0 to a little past 1), `flare` the brightness the rim is lifted by. */
export interface Burn {
  front: number;
  flare: number;
}

const smooth = (a: number, b: number, x: number): number => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** How far a burn that has run `seconds` has crossed the leaf, and its flare: the rim flares in the first moments, then settles. */
export function burnAt(seconds: number): Burn {
  const u = seconds / PAPER.burn.front;
  return { front: u * 1.2, flare: 1.4 * Math.exp(-seconds * 2.2) };
}

/** The leaf (the first pose) and its scraps at time `t`; `look` is how far it has turned toward the investigator; `burn`, the seconds since the burn began. */
export function poses(t: number, phase: number, look: number, burn = -1): Pose[] {
  const burning = burn >= 0;
  const u = burning ? Math.min(1, burn / PAPER.burn.total) : 0;
  const lift = burning ? PAPER.burn.rise * (1 - (1 - u) * (1 - u)) : 0;
  const worse = burning ? 1 + (PAPER.burn.curl - 1) * smooth(0, 1.2, burn) : 1;
  const main: Pose = {
    x: 0, y: PAPER.hover + 0.07 * Math.sin(t * 0.9 + phase) + lift, z: 0,
    yaw: look + 0.22 * Math.sin(t * 0.31 + phase * 1.3) + (burning ? burn * 0.35 : 0),
    pitch: -0.28 + 0.07 * Math.sin(t * 0.7 + phase) - (burning ? 0.25 * u : 0),
    roll: 0.08 * Math.sin(t * 0.5 + phase * 2),
    wave: 0.05 * (1 + 0.5 * Math.sin(t * 0.23 + phase)) * worse,
    curl: 0.07 * worse,
    scale: 1,
    phase,
  };
  const scraps = Array.from({ length: PAPER.scraps }, (_, k): Pose => {
    const a = t * (0.35 + 0.1 * k) * (k % 2 ? -1 : 1) + phase + k * 2.1;
    const r = (PAPER.orbit + 0.1 * k) * (1 + (burning ? burn * 0.55 : 0));
    return {
      x: Math.cos(a) * r, y: PAPER.hover + 0.1 + 0.25 * Math.sin(t * 0.6 + k * 2) + lift * 1.3 + (burning ? burn * 0.6 : 0), z: Math.sin(a) * r,
      yaw: t * 0.8 + k, pitch: 0.9 * Math.sin(t * 0.7 + k), roll: 0.6 * Math.sin(t * 0.5 + 2 * k),
      wave: 0.03 * worse, curl: 0.08 * worse, scale: 1, phase: phase + k * 1.7,
    };
  });
  return [main, ...scraps];
}

/** Writes the positions of `sheet`'s vertices, bent and set at `p`, into `out` from vertex `at`, at time `t`. */
export function bend(sheet: Sheet, p: Pose, t: number, out: Float32Array, at: number): void {
  const [cy, sy, cp, sp, cr, sr] = [Math.cos(p.yaw), Math.sin(p.yaw), Math.cos(p.pitch), Math.sin(p.pitch), Math.cos(p.roll), Math.sin(p.roll)];
  for (let v = 0; v < sheet.count; v++) {
    const [x, y] = [sheet.rest[v * 2] * p.scale, sheet.rest[v * 2 + 1] * p.scale];
    const r = sheet.polar[v];
    const ripple = 0.6 * Math.sin(3.1 * x + 1.7 * t + p.phase) + 0.4 * Math.sin(4.3 * y - 1.3 * t + 2.1 * p.phase + x * 1.7); // (a wave that runs across it, and one that crosses that)
    const z = p.wave * (0.35 + 0.65 * r) * ripple + p.curl * r * r; // the rim moves most, and curls up
    const [x1, y1] = [x * cr - y * sr, x * sr + y * cr];
    const [y2, z2] = [y1 * cp - z * sp, y1 * sp + z * cp];
    const o = (at + v) * 3;
    out[o] = p.x + x1 * cy + z2 * sy;
    out[o + 1] = p.y + y2;
    out[o + 2] = p.z - x1 * sy + z2 * cy;
  }
}

/**
 * The leaf's turn toward the investigator: `target` (radians, from the leaf's front) shortened to what a leaf seen the same from both
 * faces would turn (a quarter turn at most from a half turn's rest), and approached at no more than `rate` radians a second. Of the
 * turns that look alike (a half turn apart) it takes the one nearest where it is, so an investigator who circles it is followed round
 * and it is never swung through edge-on as the quarter is crossed. The turn it returns is kept within half a turn either way.
 */
export function gaze(current: number, target: number, dt: number, rate = 0.55): number {
  const wrapped = ((((target + Math.PI / 2) % Math.PI) + Math.PI) % Math.PI) - Math.PI / 2;
  const goal = wrapped * 0.7;
  const alike = goal + Math.round((current - goal) / Math.PI) * Math.PI;
  const next = current + Math.max(-rate * dt, Math.min(rate * dt, alike - current));
  return next - Math.round(next / (2 * Math.PI)) * 2 * Math.PI;
}

const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Writes the colour of each of `sheet`'s vertices into `out` from vertex `at`: paper, scorched toward the rim, black, and the fire along it. */
export function tint(sheet: Sheet, t: number, phase: number, out: Float32Array, at: number, burn?: Burn): void {
  const { leaf, scorch, char, heart, flame, tip, ash } = PAPER_LOOK;
  for (let v = 0; v < sheet.count; v++) {
    const [e, a] = [sheet.edge[v], sheet.angle[v]];
    const pulse = 0.55 + 0.45 * Math.sin(a * 3 + t * 1.9 + phase); // the heat crawls round the rim
    const flick = 0.82 + 0.18 * Math.sin(t * 13 + v * 1.93);
    let ember = e * e * pulse * flick * (1 + (burn?.flare ?? 0));
    const tone = sheet.tone[v];
    const scorched = smooth(0.04, 0.55, e) * 0.85;
    const blackened = smooth(0.3, 0.9, e);
    const violet = (0.5 + 0.5 * Math.sin(a * 2 - t * 1.2 + phase)) * 0.65; // where along the rim the flame's tips run to violet
    let [band, gone] = [0, 0];
    if (burn) {
      const s = burn.front - sheet.inner[v];
      band = smooth(-0.06, 0.02, s) * (1 - smooth(0.06, 0.22, s)); // the front itself
      gone = smooth(0.1, 0.24, s); // behind it: ash
      ember *= 1 - gone;
    }
    const o = (at + v) * 3;
    for (let c = 0; c < 3; c++) {
      let col = mix(mix(leaf[c] * tone, scorch[c], scorched), char[c], blackened);
      col = mix(col, ash[c] * tone * 0.7, gone);
      out[o + c] = col + mix(flame[c], tip[c], violet) * (ember * 1.7 + band * 2.2) + heart[c] * (ember ** 3 * 0.9 + band * 0.6);
    }
  }
}
