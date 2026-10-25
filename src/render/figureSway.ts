/**
 * What hangs loose on the people met (round 81; render only, pure): a hat on the head, a shawl over the shoulders, a scarf's end and
 * a robe's sash, the tails of a coat. Each is a second-order spring on two lean angles (forward and to the side), driven by the breeze
 * on it, by the pace its wearer walks at and by a turn they make, stepped in small slices so it settles the same at any frame rate.
 * A hat is carried and leans the other way from cloth that hangs. Nothing moves the body: no lean, no breathing; the investigator's
 * lantern and scarf are the player rebuild's. Laid on the pose after it is made (render/personLife.ts).
 */

import { FIGURE_LIFE } from '../data/fxTuning';

export type LooseKind = keyof typeof FIGURE_LIFE.loose;

export interface Hang {
  /** Rad about the figure's x (+: the bottom swings back, the top forward) and z (+: the bottom swings to its left, the top to its right), and their rates. */
  pitch: number; roll: number; vp: number; vr: number;
}

export const newHang = (): Hang => ({ pitch: 0, roll: 0, vp: 0, vr: 0 });

export interface SwayIn {
  dt: number;
  /** Render seconds, and this part's own phase (rad), so no two flutter together. */
  time: number; phase: number;
  /** The breeze on it, in the figure's frame: toward its front (fwd) and its left (left), each -1..1 of a whole breeze. */
  fwd: number; left: number;
  /** 0..1: a walking pace; and the yaw rate, -1..1 (+: turning left). */
  walk: number; turn: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The angles a kind of loose thing would rest at under this breeze, pace and turn; `sign` is 1 for what hangs, -1 for what is carried. */
export function restAt(kind: LooseKind, i: SwayIn, sign: 1 | -1, out: { pitch: number; roll: number } = { pitch: 0, roll: 0 }): { pitch: number; roll: number } {
  const K = FIGURE_LIFE.loose[kind];
  const wind = Math.hypot(i.fwd, i.left);
  const flutter = K.flutter[0] * Math.sin(i.time * K.flutter[1] + i.phase) * (0.35 + wind);
  out.pitch = clamp(sign * (i.walk * K.walk - i.fwd * K.wind) + flutter, -K.most, K.most);
  out.roll = clamp(sign * (i.left * K.wind - i.turn * K.turn) + 0.6 * flutter * Math.cos(i.phase), -K.most, K.most);
  return out;
}

const rest = { pitch: 0, roll: 0 };

/** One drawn frame's step; the same object, changed. */
export function stepHang(h: Hang, kind: LooseKind, i: SwayIn, sign: 1 | -1 = 1): Hang {
  const K = FIGURE_LIFE.loose[kind];
  const dt = clamp(i.dt, 0, 0.1);
  const slices = Math.max(1, Math.ceil(dt / FIGURE_LIFE.slice));
  const s = dt / slices;
  restAt(kind, i, sign, rest);
  for (let n = 0; n < slices; n++) {
    h.vp += (K.spring * (rest.pitch - h.pitch) - K.damp * h.vp) * s;
    h.vr += (K.spring * (rest.roll - h.roll) - K.damp * h.vr) * s;
    h.pitch += h.vp * s;
    h.roll += h.vr * s;
  }
  h.pitch = clamp(h.pitch, -K.most * 1.2, K.most * 1.2);
  h.roll = clamp(h.roll, -K.most * 1.2, K.most * 1.2);
  return h;
}
