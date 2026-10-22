/**
 * Props (spec §3D): what stands on open ground. Scattered ones (dead trees, rocks, pillars,
 * monoliths, graves, ruined walls) and those region plans place in order (pines, crosses, obelisks,
 * houses, field walls, fences, street lamps, fallen logs, fire pits, bushes, stumps, altars, and the
 * realms' landmarks: spires, towers, cones, pyramids, blocks and hanging globes): their
 * sizes and colliders. `w` × `d` are half extents (round props use `w` as their radius), `h` the
 * height. Pure: no Three.js.
 */

import type { Rng } from '../core/rng';
import type { HouseStyle } from '../data/regionFeatures';
import type { Glow } from '../data/arenaSets';
import type { PropKind } from '../data/regions';
import type { LightKind } from '../data/tuning';
import type { Collider } from './colliders';
import { surface } from './terrain';

export interface Prop {
  kind: PropKind;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  yaw: number;
  seed: number;
  style?: HouseStyle; // houses: how they are built
  set?: SetLook; // a piece of an arena's set: which, and how it is dressed (round 61)
}

/** A piece of an arena's set (a baked model, data/models, or a built one) placed as a prop: its scale (1: as baked), a colour it leans toward, and how much of its own it keeps (0..1). */
export interface SetLook {
  id: string;
  scale?: number;
  tint?: readonly [number, number, number];
  keep?: number;
  round?: boolean; // its footprint a circle (a standing thing), else a box
  walk?: boolean; // low enough to be walked over: no collider
  glow?: Glow; // a built piece's glow
  lit?: LightKind; // a flame at its top, lighting about it
  rod?: number; // a lightning rod's mast on its top, this many metres (a keep, a gatehouse: round 67)
}

const ROUND = new Set<PropKind>(['tree', 'pine', 'rock', 'pillar', 'lamp', 'obelisk', 'cross', 'stump', 'spire', 'tower', 'cone']);
const OPEN = new Set<PropKind>(['bush', 'firepit', 'globe']); // no collider: walked through or over (or under: a globe hangs in the air)

type Size = readonly [w: number, d: number, h: number];

/** A prop of `kind` at (x, z) on the ground, sized from `rng` unless `size` is given. */
export const makeProp = (kind: PropKind, x: number, z: number, rng: Rng, yaw?: number, size?: Size, style?: HouseStyle): Prop => propAt(kind, x, surface(x, z), z, rng, yaw, size, style);

/** A prop of `kind` standing at height `y` (round 13: an arena's dressing is placed while the ground itself is still being laid out). */
export function propAt(kind: PropKind, x: number, y: number, z: number, rng: Rng, yaw?: number, size?: Size, style?: HouseStyle): Prop {
  const r = (lo: number, hi: number): number => lo + (hi - lo) * rng();
  const sizes: Record<PropKind, () => Size> = {
    tree: () => [r(0.25, 0.4), 0, r(5, 9)],
    pine: () => [r(0.22, 0.34), 0, r(7, 12)],
    rock: () => {
      const s = r(0.8, 2.2);
      return [s, 0, s * 0.8];
    },
    pillar: () => [r(0.5, 0.75), 0, r(3, 7)],
    monolith: () => [r(0.5, 0.9), r(0.35, 0.5), r(3, 6)],
    grave: () => [0.35, 0.12, r(0.8, 1.2)],
    cross: () => [0.1, 0, r(1.1, 1.6)],
    obelisk: () => [r(0.3, 0.45), 0, r(2.2, 3.4)],
    ruin: () => [r(1.5, 3.5), 0.35, r(1, 3)],
    house: () => [r(3.5, 5), r(3, 4.5), r(5, 7)],
    wall: () => [r(3, 6), 0.3, r(0.7, 1.1)],
    fence: () => [r(2, 4), 0.05, 1],
    lamp: () => [0.12, 0, 3.4],
    log: () => [r(1.2, 2.2), 0.25, 0.45],
    firepit: () => [0.7, 0.7, 0.3],
    bush: () => [r(0.6, 1.2), 0, r(0.6, 1.1)],
    stump: () => [r(0.3, 0.5), 0, r(0.4, 0.8)],
    altar: () => [1.2, 0.7, 1],
    spire: () => [r(2.2, 3.4), 0, r(16, 28)],
    tower: () => [r(3, 4.6), 0, r(22, 36)],
    cone: () => [r(3, 4.2), 0, r(12, 20)],
    pyramid: () => {
      const s = r(6, 9);
      return [s, s, r(8, 12)];
    },
    block: () => [r(3, 5), r(2.5, 4), r(4, 7)],
    globe: () => [r(1.4, 2.8), 0, r(6, 11)], // w its radius, h how high it hangs
    set: () => [1, 1, 1], // sized by what places it, from the piece's box (world/arenaSet.ts)
  };
  const [w, d, h] = size ?? sizes[kind]();
  const turn = yaw ?? (ROUND.has(kind) ? r(0, Math.PI * 2) : rng() < 0.5 ? 0 : Math.PI / 2);
  return { kind, x, y, z, w, d, h, yaw: turn, seed: Math.floor(rng() * 1e6), ...(style && { style }) };
}

/** The prop's collider, or null for what is walked through (bushes, fire pits). */
export function propCollider(p: Prop): Collider | null {
  if (OPEN.has(p.kind) || (p.kind === 'set' && (!p.set || p.set.walk))) return null;
  if (p.kind === 'set' && p.set?.round) return { kind: 'cylinder', x: p.x, z: p.z, radius: Math.max(p.w, p.d), y0: p.y - 0.5, y1: p.y + p.h };
  if (ROUND.has(p.kind)) {
    const radius = p.kind === 'rock' ? p.w * 0.8 : p.kind === 'lamp' || p.kind === 'cross' ? 0.18 : p.w + 0.05;
    return { kind: 'cylinder', x: p.x, z: p.z, radius, y0: p.y - 0.5, y1: p.y + p.h };
  }
  return { kind: 'obox', x: p.x, z: p.z, hx: p.w, hz: p.d, yaw: p.yaw, y0: p.y - 0.5, y1: p.y + p.h + (p.kind === 'house' ? p.w : 0) };
}
