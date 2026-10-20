/**
 * A cutscene's camera, planned (playtest round 20; cinema.ts plays it): where the lens stands and
 * what it looks at, as a function of the seconds since the scene began, from the shots in
 * data/cutscenes.ts; how strongly the scene holds the camera as it comes in from and goes back to the
 * follow camera; and which beats fall in a span of time. Pure: no Three.js, no world.
 */

import { clamp, yawOf, type V3 } from '../core/geom';
import type { Beat, Ease, Scene, Shot } from '../data/cutscenes';

/** Someone, or something, the camera is about: where it stands (its feet), which way it faces, how tall it is. */
export interface Anchor extends V3 {
  yaw: number;
  height: number;
  /** Metres one pixel of its picture covers, for a figure drawn from the reviewed art (a close-up comes no nearer than `GRAIN` allows). */
  grain?: number;
}

/** The most of the picture's height one pixel of a figure may cover (round 59): a close-up of a coarse picture stands back, so the Haunter's twenty-eight painted rows are not a wall of blocks. */
export const GRAIN = 1 / 32;
/** Metres the lens's line to the horror passes beside the investigator, in a shot over their shoulder (round 59: straight behind them, a horror of their size was hidden by them). */
export const SHOULDER = 0.6;

/** The lens: where it is, the point it looks at, its field of view (degrees) and its roll (radians). */
export interface Frame {
  pos: V3;
  look: V3;
  fov: number;
  roll: number;
}

const RAD = Math.PI / 180;
const smooth = (x: number): number => x * x * (3 - 2 * x);

export function ease(kind: Ease, x: number): number {
  const k = clamp(x, 0, 1);
  return kind === 'linear' ? k : kind === 'in' ? k * k : kind === 'out' ? 1 - (1 - k) ** 2 : kind === 'glide' ? k * k * k * (k * (k * 6 - 15) + 10) : smooth(k);
}

/** The seconds a scene lasts: its shots, one after another. */
export const sceneLength = (s: Scene): number => s.shots.reduce((n, sh) => n + sh.dur, 0);

/** The shot playing `t` seconds in, and how far through it (0..1). Past the end: the last, complete. */
export function shotAt(s: Scene, t: number): { shot: Shot; index: number; u: number } {
  let from = 0;
  for (let i = 0; i < s.shots.length; i++) {
    const sh = s.shots[i];
    if (t < from + sh.dur || i === s.shots.length - 1) return { shot: sh, index: i, u: clamp((t - from) / sh.dur, 0, 1) };
    from += sh.dur;
  }
  throw new Error(`scene ${s.id} has no shots`);
}

/** The slow, uneven drift of a hand-held camera: three unit offsets at `t`. */
export function drift(t: number, seed = 0): V3 {
  const wave = (a: number, b: number): number => 0.6 * Math.sin(t * a + seed) + 0.4 * Math.sin(t * b + seed * 2.3);
  return { x: wave(0.83, 1.71), y: wave(1.13, 2.03), z: wave(0.61, 1.37) };
}

/**
 * The lens for `shot` at `u` (0..1) through it, in the scene's time `t` (for its drift). `on` is who
 * it circles; `other` the party opposite (the investigator to a horror and the horror to them): the
 * line between them is the shot's zero of yaw, and without one it is the way `on` faces.
 */
export function frameOf(shot: Shot, u: number, on: Anchor, other: Anchor | null, t: number, sign: Anchor | null = null): Frame {
  const k = ease(shot.ease ?? 'inout', u);
  const mix = (p: readonly [number, number]): number => p[0] + (p[1] - p[0]) * k;
  const scale = shot.body ? on.height : 1;
  const apart = other ? Math.hypot(other.x - on.x, other.z - on.z) : 0;
  const base = other && apart > 0.5 ? yawOf(other.x - on.x, other.z - on.z) : on.yaw;
  const [d, up] = [mix(shot.dist) * scale, mix(shot.up) * scale];
  const aimed = shot.aim === 'sign' && sign ? sign : shot.aim === 'other' && other ? other : on;
  const lean = Math.sign(shot.yaw[1] - 180) || Math.sign(shot.yaw[0] - 180) || 1;
  const yaw = aimed === other && other ? past(mix(shot.yaw), d, on.y + up, other.y + mix(shot.look) * other.height, apart, on, lean) : mix(shot.yaw);
  const facing = base + yaw * RAD;
  const [sway, s] = [shot.sway ?? 0, drift(t)];
  const amp = 0.07 * sway * clamp(d / 4, 0.6, 3);
  return {
    pos: { x: on.x + Math.sin(facing) * d + s.x * amp, y: on.y + up + s.y * amp, z: on.z + Math.cos(facing) * d + s.z * amp },
    look: { x: aimed.x, y: aimed.y + mix(shot.look) * aimed.height + s.y * amp * 0.5, z: aimed.z },
    fov: mix(shot.fov),
    roll: shot.roll ? mix(shot.roll) * RAD : 0,
  };
}

/**
 * A shot over the shoulder of `on` at the party opposite (`yaw` degrees, 180 straight behind `on`, the lens `d` metres off at a height of
 * `eye`, looking at a height of `sight` on the other `apart` metres away): turned off the line between them just far enough that the
 * line of sight passes `SHOULDER` metres beside `on`, unless it passes over their head. It turns to the side the shot leans to (`lean`).
 */
function past(yaw: number, d: number, eye: number, sight: number, apart: number, on: Anchor, lean: number): number {
  if (apart < 0.5 || d < 0.3) return yaw;
  const off = ((((yaw - 180) % 360) + 540) % 360) - 180; // degrees off straight behind, signed
  const over = eye + ((sight - eye) * d) / (d + apart); // the line's height as it passes them
  if (over > on.y + on.height + 0.15) return yaw;
  const least = Math.min(30, Math.asin(clamp((SHOULDER * (apart + d)) / (apart * d), 0, 1)) / RAD);
  return Math.abs(off) >= least ? yaw : 180 + (Math.sign(off) || lean) * least;
}

/** `f` stood back along its line of sight as far as a figure of `grain` metres to a pixel needs, so that no pixel of it covers more than `GRAIN` of the picture's height. */
export function keepGrain(f: Frame, grain: number | undefined): Frame {
  if (!grain) return f;
  const [dx, dy, dz] = [f.pos.x - f.look.x, f.pos.y - f.look.y, f.pos.z - f.look.z];
  const d = Math.hypot(dx, dy, dz);
  const least = grain / GRAIN / (2 * Math.tan((f.fov * RAD) / 2));
  if (d >= least || d < 1e-3) return f;
  const k = least / d;
  return { ...f, pos: { x: f.look.x + dx * k, y: f.look.y + dy * k, z: f.look.z + dz * k } };
}

/** How firmly the scene holds the camera `t` seconds in (of `length`): 0 is the follow camera's, 1 the scene's; it eases in and out. */
export function holdOf(s: Scene, t: number, length = sceneLength(s)): number {
  const [into, out] = s.blend ?? [0.7, 0.9];
  const a = into > 0 ? smooth(clamp(t / into, 0, 1)) : 1;
  const b = out > 0 ? smooth(clamp((length - t) / out, 0, 1)) : 1;
  return Math.min(a, b);
}

/** The beats that fall after `from` and up to `to` (seconds into the scene), in order. */
export const beatsBetween = (s: Scene, from: number, to: number): Beat[] => s.beats.filter((b) => b.at > from && b.at <= to);

/** The trembling of the camera `since` seconds after a beat set it off, for `hold` seconds: `amount` metres dying away. */
export const tremor = (amount: number, since: number, hold: number): number => (since < 0 || since > hold ? 0 : amount * (1 - since / hold) ** 2);
