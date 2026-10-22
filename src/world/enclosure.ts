/**
 * What stands about an open arena (round 66; it was a ring of wall, round 63's house, and is now one kind of enclosure among those a horror's
 * own story asks for): its wall's pieces, its one gate, which way it faces, where the fallen wake, and how far a body or a piece is from
 * its wall. Everything that once asked "how far from the centre, against the ring's radius" asks the enclosure instead (`gap`, `inside`,
 * `stake`, `pad`), so a wall of any outline is laid about the same fight circle, the same front, the same court and the same discovery
 * without any of them knowing its shape. The fight itself never changes: its circle, its fog at the ring and its set stay as they were.
 * Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
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

export interface Enclosure {
  readonly kind: string; // 'ring'
  readonly gate: XZ; // where the gate stands, at the wall's middle
  readonly front: XZ; // the way out of the gate (a unit vector along an axis): the same front the set, the ground, the stake, the candle and the court share
  readonly rect: Rect; // the box that holds the wall
  readonly props: Prop[]; // the wall, its towers
  readonly piece: HiddenPieceDef; // the gate
  readonly stake: Spot; // where the fallen wake, inside the wall and in front of the fog
  /** Metres from a point to the wall's middle line: negative within, 0 on the wall. */
  gap(p: XZ): number;
  /** The level ground the enclosure asks of the land: its wall and `HOUSE.level` metres beyond, at `level`, fading out over `blend`. */
  pad(level: number, blend: number): Pad;
}

/** A ring of wall about the fight's centre: `radius` to the wall's middle. */
export interface RingEnclosure extends Enclosure {
  readonly kind: 'ring';
  readonly radius: number;
  readonly centre: XZ;
}

/** Whether a piece of the court's own set, `reach` metres broad about `p`, stands within the wall and clear of it by `HOUSE.margin`. */
export const within = (e: Pick<Enclosure, 'gap'>, p: XZ, reach = 0): boolean => e.gap(p) + reach <= -HOUSE.margin;
