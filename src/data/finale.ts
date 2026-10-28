/**
 * Where the dream is ended, and when (round 98). The Court still offers seal and herald (`courtEndings`),
 * but they are done in the world: the silver key before the sign, the tall man aside. The Guide's passage
 * is two steps. A scene waits at the start of the word the gesture answers. Data only.
 */

import { wordMoments } from '../core/pace';
import { DIRS } from '../world/worldMap';
import { shown } from './speech';

export const KEY_OUT = 3.15; // metres out from the sign, on the way it faces
export const KEY_REACH = 1.5; // the rise point (4.6 on, 1.2 aside) stays a rest
export const MAN_ASIDE = 7.6; // opposite the rise's side, past the sign's reach
export const MAN_REACH = 2.2;
export const GATE_AHEAD = 9; // where the Guide's turned back opens the Gate
export const GATE_REACH = 2.1;

export interface FinaleSpot {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/** The key, the man and the clock, in the sign's frame (it faces `face`; its right is the rise's side). */
export function courtPlaces(sign: { x: number; z: number; y: number; face: keyof typeof DIRS }): { key: FinaleSpot; man: FinaleSpot; clock: FinaleSpot } {
  const f = DIRS[sign.face];
  const s = { x: f.z, z: -f.x };
  return {
    key: { x: sign.x + f.x * KEY_OUT, y: sign.y + 1.42, z: sign.z + f.z * KEY_OUT, yaw: Math.atan2(f.x, f.z) },
    man: { x: sign.x - s.x * MAN_ASIDE, y: sign.y, z: sign.z - s.z * MAN_ASIDE, yaw: Math.atan2(s.x, s.z) },
    clock: { x: sign.x + s.x * 4.8 - f.x * 1.2, y: sign.y, z: sign.z + s.z * 4.8 - f.z * 1.2, yaw: Math.atan2(-s.x, -s.z) },
  };
}

/** Where the Gate stands, `GATE_AHEAD` metres along `yaw` from the Guide. */
export function gatePoint(from: { x: number; z: number }, yaw: number): { x: number; z: number } {
  return { x: from.x + Math.sin(yaw) * GATE_AHEAD, z: from.z + Math.cos(yaw) * GATE_AHEAD };
}

/** Seconds into a recording (no curve: by the weight of the words) that `word` begins. */
export function wordAt(line: { say: string; seconds: number }, word: string): number {
  const words = shown(line.say).split(/\s+/).filter(Boolean);
  const at = wordMoments(words, null, 1, line.seconds);
  const i = words.findIndex((w) => w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase() === word.toLowerCase());
  return i < 0 ? 0 : at[i]!;
}
