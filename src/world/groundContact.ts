/**
 * Where things meet the ground (round 54): the footprint of every prop that stands on the land, and how much of its mark the terrain
 * takes at a point about it: a share of light lost (a contact shadow baked into the ground, which the shadow map's texel and its bias are
 * too coarse to give) and a share turned to bare earth (a patch with an irregular edge, not a ring). Soft at both ends: nothing a halo
 * could be seen about. The terrain's mesh reads it for its vertices (render/terrainMesh.ts), the plants about a base for where to stand
 * (render/baseCover.ts). Pure.
 */

import { fbm } from '../core/noise';
import { GROUND_CONTACT as G } from '../data/fxTuning';
import { WORLD } from '../data/tuning';
import { chunkContent } from './chunks';
import { toBoxFrame } from './colliders';
import { propCollider, type Prop } from './props';

export interface Contact {
  x: number;
  z: number;
  hx: number; // the half sides of a box, or the radius of a round footprint
  hz: number;
  yaw: number;
  round: boolean;
  reach: number; // how far from the edge it touches the ground
}

const reachOf = (size: number): number => Math.min(G.reachMax, G.reach0 + G.reachPer * size);

/** The footprint of what stands solid on the land: the prop's own collider, leaving out what is too slim to leave a mark. */
export function contactsOf(props: readonly Prop[]): Contact[] {
  const out: Contact[] = [];
  for (const p of props) {
    const c = propCollider(p);
    if (!c) continue;
    if (c.kind === 'cylinder') {
      if (c.radius >= G.minSize) out.push({ x: c.x, z: c.z, hx: c.radius, hz: c.radius, yaw: 0, round: true, reach: reachOf(c.radius) });
    } else if (c.kind === 'obox' && Math.min(c.hx, c.hz) >= G.minSize) {
      out.push({ x: c.x, z: c.z, hx: c.hx, hz: c.hz, yaw: c.yaw, round: false, reach: reachOf(Math.sqrt(c.hx * c.hz)) });
    }
  }
  return out;
}

/** Metres from (x, z) to the footprint's edge: negative inside it. */
export function edgeDistance(c: Contact, x: number, z: number): number {
  if (c.round) return Math.hypot(x - c.x, z - c.z) - c.hx;
  const l = toBoxFrame({ kind: 'obox', x: c.x, z: c.z, hx: c.hx, hz: c.hz, yaw: c.yaw, y0: 0, y1: 0 }, x, z);
  const [qx, qz] = [Math.abs(l.x) - c.hx, Math.abs(l.z) - c.hz];
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
}

const soft = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

export interface Mark {
  dark: number; // 0..1: how much of the ground's light is taken (multiply by GROUND_CONTACT.dark)
  soil: number; // 0..1: how far the ground is turned to bare earth (multiply by GROUND_CONTACT.soil)
}

/** What the ground takes at (x, z) of the footprints about it: the strongest of them, not their sum, so two things close together do not make a black pool. */
export function markAt(contacts: readonly Contact[], x: number, z: number): Mark {
  let [dark, soil] = [0, 0];
  let wobble: number | undefined;
  for (const c of contacts) {
    if (Math.abs(x - c.x) > c.reach + c.hx + c.hz || Math.abs(z - c.z) > c.reach + c.hx + c.hz) continue;
    const d = edgeDistance(c, x, z);
    if (d >= c.reach) continue;
    wobble ??= (fbm(x * 1.7, z * 1.7, 31, 2) - 0.5) * 2 * G.wobble; // (only where something is near enough to need it)
    dark = Math.max(dark, Math.pow(1 - soft(d / c.reach), 1.5));
    soil = Math.max(soil, 1 - soft((d + wobble) / (c.reach * 0.6)));
  }
  return { dark, soil };
}

/**
 * The footprints that reach a chunk: its own and its neighbours' (a house stands across a seam, and the ground on both sides takes its mark
 * alike). A sliced job, a neighbour at a time: a chunk's content is made the first time it is asked for, and eight at once is a hitch.
 */
export function* contactsNearChunkJob(cx: number, cz: number, done: (contacts: Contact[]) => void): Generator<void, void> {
  const [x0, z0] = [cx * WORLD.chunk, cz * WORLD.chunk];
  const out: Contact[] = [];
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (const c of contactsOf(chunkContent(cx + dx, cz + dz).props)) {
        const r = c.reach + Math.max(c.hx, c.hz) * 1.5;
        if (c.x > x0 - r && c.x < x0 + WORLD.chunk + r && c.z > z0 - r && c.z < z0 + WORLD.chunk + r) out.push(c);
      }
      yield;
    }
  }
  done(out);
}

/** The same, at once (for what is not sliced). */
export function contactsNearChunk(cx: number, cz: number): Contact[] {
  let out: Contact[] = [];
  const job = contactsNearChunkJob(cx, cz, (c) => (out = c));
  while (!job.next().done);
  return out;
}
