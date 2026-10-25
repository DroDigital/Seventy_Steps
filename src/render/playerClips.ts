/**
 * The investigator's clips (round 78: keyed in Blender, tools/player/, docs/PLAYER.md; baked into data/player/playerClips.ts): each a pose for every 60 Hz frame of a move, read here
 * as quaternions for the figure's joints and the pelvis's place. A clip is as long as the move it was made for and has its markers where the game's data puts them (the hit
 * window's ends, the frame an item takes effect, a shot or a volley leaves, a parry's window); if the data has since moved, `clipTime` carries the game's frame to the clip's
 * through those markers, so the blade is still where the blow lands. Pure but for the figure's joints it sets.
 */

import * as THREE from 'three';
import type { MoveDef } from '../data/moves';
import { PLAYER_CLIPS, type PlayerClipData } from '../data/player/playerClips';
import { PLAYER_JOINTS } from '../data/player/playerIndex';
import type { Figure } from './figures';

const J = PLAYER_JOINTS.length;

export interface Clip {
  id: string;
  frames: number;
  loop: boolean;
  marks: Readonly<Record<string, number>>;
  drawn: boolean;
  props: readonly string[];
  n: number; // samples
  rest: Float32Array; // every joint's rotation on the first sample (a still joint's whole track)
  tracks: (Float32Array | null)[]; // [joint]: n x 4, for those that move
  body: Float32Array | null; // n x 3 metres from the pelvis's rest place, or null when it stays there
}

/** A pose: each joint's rotation (x, y, z, w) and the pelvis's offset from its rest place. */
export interface ClipPose {
  q: Float32Array;
  body: Float32Array;
}

export const newPose = (): ClipPose => ({ q: new Float32Array(J * 4), body: new Float32Array(3) });

const cache = new Map<string, Clip | null>();

function decode(id: string, d: PlayerClipData): Clip {
  const bin = atob(d.data);
  const view = new DataView(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) view.setUint8(i, bin.charCodeAt(i));
  const n = view.getUint16(0, true);
  const flags = view.getUint8(2);
  const moving = view.getUint8(3);
  let at = 4;
  const which = Array.from({ length: moving }, (_, i) => view.getUint8(at + i));
  at += moving;
  const i16 = (): number => {
    const v = view.getInt16(at, true);
    at += 2;
    return v;
  };
  const rest = new Float32Array(J * 4);
  for (let j = 0; j < J; j++) {
    const [w, x, y, z] = [i16(), i16(), i16(), i16()]; // stored (w, x, y, z)
    rest.set([x / 32767, y / 32767, z / 32767, w / 32767], j * 4);
  }
  let body: Float32Array | null = null;
  if (!(flags & 2)) {
    body = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) body[i] = i16() / 1000;
  }
  const tracks: (Float32Array | null)[] = Array.from({ length: J }, () => null);
  for (const j of which) {
    const t = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const [w, x, y, z] = [i16(), i16(), i16(), i16()];
      t.set([x / 32767, y / 32767, z / 32767, w / 32767], i * 4);
    }
    tracks[j] = t;
  }
  return { id, frames: d.frames, loop: d.loop, marks: d.marks, drawn: !!d.drawn, props: d.props ?? [], n, rest, tracks, body };
}

/** The clip with this id, or undefined if it has not been made (then the figure is posed by hand: poses.ts). */
export function playerClip(id: string): Clip | undefined {
  let c = cache.get(id);
  if (c === undefined) {
    const d = PLAYER_CLIPS[id];
    c = d ? decode(id, d) : null;
    cache.set(id, c);
  }
  return c ?? undefined;
}

const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();

/** The clip's pose at frame `t` (fractional; a loop wraps, anything else holds its last), written into `out`. */
export function sampleClip(c: Clip, t: number, out: ClipPose): ClipPose {
  let i0: number;
  let i1: number;
  let k: number;
  if (c.loop) {
    const u = ((t % c.n) + c.n) % c.n;
    i0 = Math.floor(u);
    i1 = (i0 + 1) % c.n;
    k = u - i0;
  } else {
    const u = Math.min(Math.max(t, 0), c.n - 1);
    i0 = Math.min(Math.floor(u), c.n - 1);
    i1 = Math.min(i0 + 1, c.n - 1);
    k = u - i0;
  }
  for (let j = 0; j < J; j++) {
    const tr = c.tracks[j];
    if (!tr) out.q.set(c.rest.subarray(j * 4, j * 4 + 4), j * 4);
    else {
      qa.fromArray(tr, i0 * 4);
      qb.fromArray(tr, i1 * 4);
      qa.slerp(qb, k).toArray(out.q, j * 4);
    }
  }
  if (c.body) for (let a = 0; a < 3; a++) out.body[a] = c.body[i0 * 3 + a] + (c.body[i1 * 3 + a] - c.body[i0 * 3 + a]) * k;
  else out.body.fill(0);
  return out;
}

/** `out` eased from `a` toward `b` by k. */
export function mixPose(a: ClipPose, b: ClipPose, k: number, out: ClipPose = a): ClipPose {
  for (let j = 0; j < J; j++) {
    qa.fromArray(a.q, j * 4);
    qb.fromArray(b.q, j * 4);
    qa.slerp(qb, k).toArray(out.q, j * 4);
  }
  for (let i = 0; i < 3; i++) out.body[i] = a.body[i] + (b.body[i] - a.body[i]) * k;
  return out;
}

/** Sets the figure's joints (and the pelvis's place) to a pose. */
export function applyPose(f: Figure, pose: ClipPose): void {
  const joints = [f.body, f.torso, f.head, f.armR, f.elbowR, f.handR, f.armL, f.elbowL, f.handL, f.legR, f.kneeR, f.footR, f.legL, f.kneeL, f.footL, f.skirt[0], f.skirt[1], f.lantern];
  PLAYER_JOINTS.forEach((_, j) => joints[j]?.quaternion.fromArray(pose.q, j * 4).normalize()); // (the data is whole numbers of 1/32767, a hair off unit length, which a joint that is not blended would keep)
  f.body.position.set(pose.body[0], f.hip + pose.body[1], pose.body[2]);
}

/** The frames the game's markers are at, by name, for a move's data. */
function dataMarks(d: MoveDef): Record<string, number> {
  const m: Record<string, number> = {};
  if (d.hit) [m.hit0, m.hit1] = d.hit.window;
  if (d.item !== undefined) m.item = d.item;
  if (d.shot) m.shot = d.shot.frame;
  if (d.volley) m.volley = d.volley.frame;
  if (d.parry) [m.parry0, m.parry1] = d.parry;
  return m;
}

/**
 * The clip's frame for the game's frame of a move: straight through where the clip was made for these frames, and through the markers (the hit window, an item's frame, a
 * shot's) where the data has moved since, so what the clip draws at each of them is still what the game does then.
 */
export function clipTime(c: Clip, d: MoveDef, frame: number): number {
  const data = dataMarks(d);
  const pts: [number, number][] = [[0, 0]];
  for (const [name, at] of Object.entries(c.marks).sort((a, b) => a[1] - b[1])) if (name in data) pts.push([data[name], at]);
  pts.push([d.frames, c.frames]);
  if (pts.every(([g, k]) => Math.abs(g - k) < 0.01)) return frame;
  for (let i = 1; i < pts.length; i++) {
    const [[g0, k0], [g1, k1]] = [pts[i - 1], pts[i]];
    if (frame <= g1 || i === pts.length - 1) return k0 + ((frame - g0) / Math.max(1e-6, g1 - g0)) * (k1 - k0);
  }
  return frame;
}
