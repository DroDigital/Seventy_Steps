/**
 * A person's eyes on the investigator (round 78; render only, read-only on the simulation): one who is not at an act
 * and has the investigator in front of them, or just off their shoulder, turns their head to follow them as they pass,
 * the head only, to a limit, eased in and out, looking a little up or down at the height they meet. Nothing behind them.
 * It is laid over the pose after it is made, so a reader at a book, a sleeper or a flinch is never turned from it.
 */

import { FIGURE_LIFE } from '../data/fxTuning';

export interface Gaze {
  yaw: number; // rad, toward the figure's left (+)
  pitch: number; // rad, + looks down
  weight: number; // 0..1, how far the head has come round
}

export const newGaze = (): Gaze => ({ yaw: 0, pitch: 0, weight: 0 });

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Where a head turned toward something would look, in its own frame: `yaw` of the figure, the world offset (dx, dz) to the
 * thing and how far above their eyes it is (dy); or null when it is too far, too close or behind them.
 */
export function gazeAt(yaw: number, dx: number, dz: number, dy: number): { yaw: number; pitch: number; weight: number } | null {
  const G = FIGURE_LIFE.gaze;
  const d = Math.hypot(dx, dz);
  if (d > G.range || d < G.near) return null;
  const a = Math.atan2(dx * Math.cos(yaw) - dz * Math.sin(yaw), dx * Math.sin(yaw) + dz * Math.cos(yaw)); // + = to their left
  const off = Math.abs(a);
  if (off > G.reach) return null;
  const weight = (1 - smooth(G.range * 0.7, G.range, d)) * (1 - smooth(G.turn, G.reach, off)); // out of the corner of the eye, not behind
  return { yaw: clamp(a, -G.turn, G.turn), pitch: clamp(-Math.atan2(dy, d), -G.pitch, G.pitch), weight };
}

/** Eases a head toward where it looks (or back to level when `to` is null), `dt` seconds. */
export function easeGaze(s: Gaze, to: { yaw: number; pitch: number; weight: number } | null, free: number, dt: number): Gaze {
  const G = FIGURE_LIFE.gaze;
  const k = 1 - Math.exp(-clamp(dt, 0, 0.2) * (to ? G.follow : G.release));
  const goal = to ? to.weight * free : 0;
  if (to && goal > 0) {
    s.yaw += (to.yaw - s.yaw) * k;
    s.pitch += (to.pitch - s.pitch) * k;
  }
  s.weight += (goal - s.weight) * k;
  if (s.weight < 0.002 && !to) [s.yaw, s.pitch, s.weight] = [0, 0, 0];
  return s;
}

/** The turn to lay on the head this frame: its yaw and pitch, taken by the weight. */
export const gazeTurn = (s: Gaze): { yaw: number; pitch: number } => ({ yaw: s.yaw * s.weight, pitch: s.pitch * s.weight });
