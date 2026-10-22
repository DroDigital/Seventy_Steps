/**
 * What stands about an open arena (round 66; it was a ring of wall, round 63's house, and is now one kind of enclosure among those a horror's
 * own story asks for): its wall's pieces, its one gate, which way it faces, where the fallen wake, and how far a body or a piece is from
 * its wall. Everything that once asked "how far from the centre, against the ring's radius" asks the enclosure instead (`gap`, `inside`,
 * `stake`, `pad`), so a wall of any outline is laid about the same fight circle, the same front, the same court and the same discovery
 * without any of them knowing its shape. The fight itself never changes: its circle, its fog at the ring and its set stay as they were.
 * Pure: no Three.js.
 */

import type { V3, XZ } from '../core/geom';
import type { HiddenPieceDef } from '../data/arena';
import { HOUSE } from '../data/arenaHouses';
import type { Prop } from './props';
import type { Pad } from './sitePads';
import type { Rect } from './worldMap';

/** A place a body is put and the way it faces. */
export interface Spot extends XZ {
  yaw: number;
}

/** Where the fallen wake (world/gatePlan.ts): the ring's fog stands `ring` metres past the fight's radius, the stake `past` metres beyond it, and never nearer the wall than `wall`. */
export const STAKE = { ring: 1.5, past: 9, wall: 7.5 } as const;

/** Where an enclosure is to stand: the fight's centre and ring, the level of its ground, and the way its gate faces. */
export interface EnclosureSite {
  x: number;
  z: number;
  y: number;
  radius: number; // the ring of the fight
  front: XZ;
}

/** What a court does that is seen from it (round 68), at world places: a spillway pouring dust down a dam, a river flowing about an island (render/spillFx.ts, riverViews.ts). */
export type Living =
  | { kind: 'spill'; x: number; y: number; z: number; top: number; width: number; face: XZ } // the lip, `top` metres over the ground and `width` across, and the way the dust runs out of it
  | { kind: 'river'; x: number; y: number; z: number; inner: number; outer: number; level: number; ford: number; front: XZ }; // the river's ring about (x, z), its surface `level` under the land at y, and the ford it is cut by

export interface Enclosure {
  readonly kind: string; // 'ring'
  readonly gate: XZ; // where the gate stands, at the wall's middle
  readonly front: XZ; // the way out of the gate (a unit vector along an axis): the same front the set, the ground, the stake, the candle and the court share
  readonly rect: Rect; // the box that holds the wall
  readonly props: Prop[]; // the wall, its towers
  readonly piece: HiddenPieceDef; // the gate
  readonly stake: Spot; // where the fallen wake, inside the wall and in front of the fog
  readonly rods?: readonly V3[]; // the tips of its lightning rods, where a bolt falls (render/rodFx.ts)
  readonly living?: readonly Living[]; // what moves in it (round 68)
  /** Metres from a point to the wall's middle line: negative within, 0 on the wall. */
  gap(p: XZ): number;
  /** The level ground the enclosure asks of the land: its wall and `HOUSE.level` metres beyond, at `level`, fading out over `blend`. */
  pad(level: number, blend: number): Pad;
  /** Metres from a point to ground a body or a piece may stand on within the wall: negative on it. Absent: all within the wall is (a river's bed, within its bank, is not: round 68). */
  dry?(p: XZ): number;
  /** Ground it shapes after `pad`, in order: a river's bed sunk below the land, its ford raised across it (round 68). */
  under?(level: number): Pad[];
}

/** A ring of wall about the fight's centre: `radius` to the wall's middle. */
export interface RingEnclosure extends Enclosure {
  readonly kind: 'ring';
  readonly radius: number;
  readonly centre: XZ;
}

/** Whether a piece of the court's own set, `reach` metres broad about `p`, stands within the wall (on dry ground, where the court has water) and clear of it by `HOUSE.margin`. */
export const within = (e: Pick<Enclosure, 'gap' | 'dry'>, p: XZ, reach = 0): boolean => (e.dry ?? e.gap)(p) + reach <= -HOUSE.margin;
