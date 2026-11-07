/**
 * A room's four walls as frames to build on (round 108, from dungeonDressing.ts): each side's frame (`s` along it, `d` out from its
 * face into the room), where its doorways are along it, what is hung on it, and a stroke laid on its face (a rotated box in the
 * wall's plane: a carved line, a root, a strut). Pure but for the geometry it makes.
 */

import * as THREE from 'three';
import type { XZ } from '../core/geom';
import { roomPoint, type DungeonLayout, type RoomLayout } from '../world/dungeonKit';
import { DIRS } from '../world/worldMap';
import type { Wall } from './dungeonFurniture';
import { tint } from './meshKit';
import type { Rgb } from './palette';

export type Side = 'u+' | 'u-' | 'v+' | 'v-';
export const SIDES: readonly Side[] = ['u+', 'u-', 'v+', 'v-'];

/** A room's wall frame on the side `side` of its local axes ('v+' the far wall, 'v-' the entry's, 'u±' its sides), its face `inner` metres from the middle. */
export function wallOf(r: RoomLayout, side: Side, inner: number): Wall {
  const sgn = side.endsWith('+') ? 1 : -1;
  const ax = DIRS[r.axis].x !== 0;
  return {
    at: (s, d) => (side[0] === 'u' ? roomPoint(r, sgn * (inner - d), s) : roomPoint(r, s, sgn * (inner - d))),
    alongX: side[0] === 'u' ? ax : !ax,
  };
}

/** A world point in a room's own frame: across its axis and along it. */
export function local(r: RoomLayout, p: XZ): [u: number, v: number] {
  const a = DIRS[r.axis];
  const [dx, dz] = [p.x - r.x, p.z - r.z];
  return [dx * a.z - dz * a.x, dx * a.x + dz * a.z];
}

/** Where along the wall `side` (its `s`) a point near it falls, or null if it is not near that wall (within `reach` of its face). */
export function along(r: RoomLayout, side: Side, p: XZ, reach: number): number | null {
  const [u, v] = local(r, p);
  const sgn = side.endsWith('+') ? 1 : -1;
  const [across, s] = side[0] === 'u' ? [u, v] : [v, u];
  return Math.abs(across * sgn - r.half) < reach ? s : null;
}

/** The `s` of each doorway in a room's wall `side`. */
export const doorsOn = (d: DungeonLayout, r: RoomLayout, side: Side): number[] =>
  d.doors.filter((o) => o.a === r || o.b === r).map((o) => along(r, side, o, 1.2)).filter((s): s is number => s !== null);

/** A stroke on a wall's face from (s0, y0) to (s1, y1), `d` off it, `w` wide and `t` deep, the floor at `y`. */
export function stroke(w: Wall, y: number, s0: number, y0: number, s1: number, y1: number, d: number, wide: number, t: number, c: Rgb): THREE.BufferGeometry {
  const len = Math.hypot(s1 - s0, y1 - y0);
  const p = w.at((s0 + s1) / 2, d);
  const [a, b] = [w.at(0, d), w.at(1, d)]; // which way along the wall `s` runs
  const g = new THREE.BoxGeometry(wide, len, t).rotateZ(Math.atan2(s0 - s1, y1 - y0)).rotateY(Math.atan2(-(b.z - a.z), b.x - a.x));
  return tint(g.translate(p.x, y + (y0 + y1) / 2, p.z), c);
}

/** A box on a wall's face: `ws` along it, `wd` out from it, `h` high, centred at `s` and `d`, its foot `y0` over the floor at `y`. */
export function slab(w: Wall, y: number, s: number, d: number, ws: number, wd: number, h: number, y0: number, c: Rgb): THREE.BufferGeometry {
  const p = w.at(s, d);
  return tint(new THREE.BoxGeometry(w.alongX ? ws : wd, h, w.alongX ? wd : ws).translate(p.x, y + y0 + h / 2, p.z), c);
}
