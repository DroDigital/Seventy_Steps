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
import type { Vec3 } from '../data/tuning';
import type { Emit, EmitShape } from './placeEmit';
import type { Prop } from './props';
import type { Pad } from './sitePads';
import type { Rect } from './worldMap';

/** A place a body is put and the way it faces. */
export interface Spot extends XZ {
  yaw: number;
}

/** Where the fallen wake (world/gatePlan.ts): the ring's fog stands `ring` metres past the fight's radius, the stake `past` metres beyond it, and never nearer the wall than `wall` (round 71: `front`, the half-width of the straight edge a place's outline has across its gate). */
export const STAKE = { ring: 1.5, past: 9, wall: 7.5, front: 2.5 } as const;

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
  | { kind: 'river'; x: number; y: number; z: number; inner: number; outer: number; level: number; ford: number; front: XZ } // the river's ring about (x, z), its surface `level` under the land at y, and the ford it is cut by
  | Pool // round 75: a sheet of water in ground sunk for it
  | Emit; // round 71: what a place breathes (world/placeEmit.ts)

/** Water standing, or running, in a court (round 75; render/courtLife.ts, poolMesh.ts): a sheet at `y` within the outline `pts` (and a little past it, where the bank hides its edge), its colours, and the way it runs. The bed is the court's own `under`. */
export interface Pool {
  kind: 'pool';
  x: number; // its middle (where its distance from the eye is taken)
  z: number;
  pts: readonly XZ[]; // the water's outline in the world (the sunk ground's)
  y: number; // the surface
  tint: Vec3; // the colour of the water, and of its edge where it frets against the bank
  foam: Vec3;
  bank: number; // metres the ground takes to rise out of it (the `blend` of its bed): its surface meets the bank this far past the outline
  flow?: XZ; // m/s: the way the current runs, and the water's texture with it
  glow?: number; // how much it gives light of its own (0..1)
}

/** What a puff of light is, at a point of a signal. */
export interface Puff {
  shape: EmitShape;
  count: number;
  size: readonly [number, number];
  life: readonly [number, number];
  colour: Vec3;
  end?: Vec3;
  alpha: number;
  rise?: number; // m/s
  spread?: number; // m/s across
  glow?: boolean;
  spin?: number;
}

/**
 * What a court does now and then, and is known by from afar (round 75; render/signalFx.ts), as Hutchinson's lightning is: a pulse that
 * runs from one point to the next in turn, a thread of light drawn between them (the thirteen dancers, the arches of the Gate, the notes of
 * the organ), or an arc that leaps between two of its points at random (Yaddith's engines). Played while the investigator is near.
 */
export interface Signal {
  kind: 'chase' | 'arc';
  at: readonly V3[]; // the points in the world: a chase visits them in this order, an arc joins two of them
  every: readonly [number, number]; // seconds from the end of one to the start of the next
  step?: number; // a chase: seconds from a point to the next
  thread?: Vec3; // the colour of the thread drawn from each point to the next (a chase), or of the arc (always drawn)
  core?: Vec3; // the white of it
  width?: number; // metres
  puff?: Puff; // let go at each point reached (a chase), or at each end of an arc
  last?: Puff & { at: V3 }; // a chase's end: a flare at this point
}

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
  readonly signals?: readonly Signal[]; // what it does now and then (round 75)
  readonly fogHeight?: number; // round 71: how high the fight's ring of fog stands, where a place wants its architecture seen over it (else by the ring's size)
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
