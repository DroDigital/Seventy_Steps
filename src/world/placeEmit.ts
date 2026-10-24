/**
 * What a place breathes (round 71; world/places/*.ts name the sources, render/courtLife.ts lets them go): a source is a spot, a disc or a
 * line, with the colour, the size, the rise and the life of what comes off it, so every fume, mist, wisp and ember in a place is anchored to
 * something that stands there (a chimney's mouth, a grave, a channel of slime, a brazier) and none drifts in from nowhere. Made only while
 * the investigator is near, and counted against the particle batch's one capacity. Data only.
 */

import type { XZ } from '../core/geom';
import type { Vec3 } from '../data/tuning';

export type EmitShape = 'disc' | 'shard' | 'streak' | 'ring' | 'spark' | 'wisp' | 'rune' | 'eye' | 'fang' | 'bubble' | 'bolt' | 'feather' | 'petal' | 'note';

export interface Emit {
  kind: 'emit';
  x: number; // the source's middle, or its start
  z: number;
  y: readonly [number, number]; // metres over the ground there at which what comes off it is born (a chimney's mouth is its height)
  r?: number; // a disc of this radius about (x, z)...
  to?: XZ; // ...or a line from (x, z) to here
  rate: number; // a second
  life: readonly [number, number];
  size: readonly [number, number];
  grow?: number;
  colour: Vec3;
  end?: Vec3;
  alpha: number;
  rise?: number; // m/s up
  drift?: number; // m/s across, in a direction of its own
  flow?: XZ; // m/s along: a current or a wind (added to the drift)
  gravity?: number;
  drag?: number;
  shape?: EmitShape;
  glow?: boolean;
  spin?: number;
  hold?: number;
  reach?: number; // metres from (x, z) within which it is let go (70)
}
