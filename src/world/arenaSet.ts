/**
 * An arena's set placed (round 61; data/arenaSets.ts): each put's layout turned into positions about the arena's heart, turned from its
 * front (toward the nearest Elder Sign), and every piece into a prop of the kind `set` (or a world prop) with its collider. Three rules
 * keep a fight and a way in: no solid piece stands within the fight's circle (but the heart's, which the piece says), none across the
 * lane the way in runs down, and none within 2.5 m of another unless both are of a wall's, a colonnade's (`join`), so no way through is
 * shut. Deterministic from where the arena stands. Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { createRng, hash2, type Rng } from '../core/rng';
import type { ArenaSet, Face, Layout, Piece, Put } from '../data/arenaSets';
import { MODEL_INFO } from '../data/models/index';
import type { PropKind } from '../data/regions';
import { SET_KITS } from '../data/setKits';
import { WORLD } from '../data/tuning';
import { reach } from './arenaDecor';
import { propAt, propColliders, type Prop } from './props';

export interface SetSite {
  x: number;
  z: number;
  y: number;
  radius: number;
  front: XZ; // unit vector toward the nearest Elder Sign
  well: boolean;
}

export const SET_RULES = {
  gap: 2.5, // metres the least way between two solid pieces
  inner: 0.78, // share of the radius within which nothing solid stands (the fight's circle) but a heart
  lane: 2.6, // half width of the way in, from 0.3 of the radius out to the fog's edge and beyond (a lane's pieces are set out beyond it, by their own breadth)
  laneFrom: 0.3,
  laneTo: 1.9,
  margin: 0.5, // metres a lane's piece stands clear of the way beyond its own breadth
  well: 2.75, // a well at the heart
} as const;

const DEG = Math.PI / 180;

interface Spot {
  x: number;
  z: number;
  th: number; // the bearing from the heart, in the world's frame
  yaw?: number;
  side?: number; // a lane's piece: how far to one side of the way in it was asked to stand
}

/** The positions a layout makes, in the world's frame: (x, z) and the bearing from the heart (for turning a piece to face). */
function spots(layout: Layout, s: SetSite, rng: Rng): Spot[] {
  const base = Math.atan2(s.front.z, s.front.x);
  const polar = (share: number, add: number, deg: number, side = 0): Spot => {
    const th = base + deg * DEG;
    const r = share * s.radius + add;
    const [cx, cz] = [Math.cos(th), Math.sin(th)];
    return { x: s.x + cx * r - cz * side, z: s.z + cz * r + cx * side, th, side };
  };
  if ('ring' in layout) {
    const { r, n, add = 0, arc, jitter = 0 } = layout.ring;
    const [a0, a1] = arc ?? [0, 360];
    const full = !arc || a1 - a0 >= 360;
    return Array.from({ length: n }, (_, i) => polar(r, add, full ? a0 + ((i + 0.5) * 360) / n + (rng() - 0.5) * jitter : a0 + ((a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))) + (rng() - 0.5) * jitter));
  }
  if ('at' in layout) {
    const { r, a, add = 0, side = 0, mirror } = layout.at;
    return mirror ? [polar(r, add, a, side), polar(r, add, a, -side)] : [polar(r, add, a, side)];
  }
  if ('scatter' in layout) {
    const { n, r, arc } = layout.scatter;
    const out: Spot[] = [];
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 12; tries++) {
        const deg = arc ? arc[0] + (arc[1] - arc[0]) * rng() : rng() * 360;
        const p = polar(Math.sqrt(r[0] * r[0] + (r[1] * r[1] - r[0] * r[0]) * rng()), 0, deg); // even over the area
        if (out.every((o) => Math.hypot(o.x - p.x, o.z - p.z) > 2.2)) {
          out.push(p);
          break;
        }
      }
    }
    return out;
  }
  const { r, n, side } = layout.lane;
  return Array.from({ length: n }, (_, i) => {
    const share = n === 1 ? r[0] : r[0] + ((r[1] - r[0]) * i) / (n - 1);
    return [polar(share, 0, 0, side), polar(share, 0, 0, -side)];
  }).flat();
}

/** The way a piece faces at `spot`. */
function yawOf(face: Face | undefined, spot: Spot, s: SetSite, rng: Rng): number {
  const inward = Math.atan2(s.x - spot.x, s.z - spot.z);
  if (face === 'out') return inward + Math.PI;
  if (face === 'front') return Math.atan2(s.front.x, s.front.z);
  if (face === 'free') return rng() * Math.PI * 2;
  if (typeof face === 'number') return inward + face * DEG;
  return inward; // 'in', and unsaid
}

const size = (piece: Piece, rng: Rng): number => (Array.isArray(piece.size) ? piece.size[0] + (piece.size[1] - piece.size[0]) * rng() : (piece.size as number | undefined) ?? 1);

/** A piece as a prop at (x, z) on a floor at `y`, or null for one not known. */
function prop(piece: Piece, spot: Spot, y: number, yaw: number, rng: Rng): Prop | null {
  const k = size(piece, rng);
  const [ground, lift] = [y, piece.lift ?? 0];
  if (piece.of.startsWith('prop:')) {
    const p = propAt(piece.of.slice(5) as PropKind, spot.x, ground + lift, spot.z, rng, yaw);
    return { ...p, w: p.w * k, d: p.d * k, h: p.h * k };
  }
  const info = MODEL_INFO[piece.of];
  const kit = SET_KITS[piece.of];
  if (!info && !kit) return null;
  const [w, d, h] = piece.dims ?? (info ? [(info.x1 - info.x0) / 2, (info.z1 - info.z0) / 2, info.y1 - info.y0] : [kit.w, kit.d, kit.h]);
  const round = info?.round ?? kit?.round ?? false;
  const walk = piece.walk ?? kit?.walk ?? false;
  return {
    kind: 'set', x: spot.x, y: ground + lift, z: spot.z, w: w * k, d: d * k, h: h * k, yaw, seed: Math.floor(rng() * 1e6),
    set: { id: piece.of, scale: k, tint: piece.tint, keep: piece.keep, round, walk, glow: piece.glow, lit: piece.lit },
  };
}

/** A set piece by itself at (x, z) on a floor at `y`, turned `yaw`: a way's waymark (world/arenaWay.ts); null for one not known. */
export const setPiece = (piece: Piece, x: number, z: number, y: number, yaw: number, rng: Rng): Prop | null => prop(piece, { x, z, th: 0 }, y, yaw, rng);

/** Whether a solid piece stands within the fight's circle or across the way in. */
function blocks(p: Prop, s: SetSite, heart: boolean): boolean {
  const r = reach(p);
  const from = Math.hypot(p.x - s.x, p.z - s.z);
  if (!heart && from - r < SET_RULES.inner * s.radius) return true;
  const along = (p.x - s.x) * s.front.x + (p.z - s.z) * s.front.z; // down the way in
  const across = Math.abs(-(p.x - s.x) * s.front.z + (p.z - s.z) * s.front.x);
  return along > SET_RULES.laneFrom * s.radius && along < SET_RULES.laneTo * s.radius && across - r < SET_RULES.lane;
}

/** The puts with a heart's first and the lit ones next (what the fight is held about, and what lights it keep their places against the dressing), the rest as the set names them. */
const byPriority = (puts: readonly Put[]): Put[] => {
  const rank = (u: Put): number => (u.piece.heart ? 2 : 0) + (u.piece.lit ? 1 : 0);
  return puts.map((u, i) => [u, i] as const).sort((a, b) => rank(b[0]) - rank(a[0]) || a[1] - b[1]).map(([u]) => u);
};

/** A piece of a lane's avenue is stood clear of the way in: no nearer than its own breadth and the way's half width (and a way's margin) from the way's middle. */
function flank(p: Prop, spot: Spot): void {
  const [side, need] = [spot.side!, SET_RULES.lane + SET_RULES.margin + reach(p)];
  if (Math.abs(side) >= need) return;
  const d = Math.sign(side) * need - side;
  p.x -= Math.sin(spot.th) * d;
  p.z += Math.cos(spot.th) * d;
}

/** An arena's set: its props, in the order its puts name them. `taken` (a hall's: its walls, pillars and doorways) turns away a piece that would stand where something is. */
export function arenaSet(set: ArenaSet, s: SetSite, taken?: (p: Prop) => boolean): Prop[] {
  const rng = createRng((hash2(Math.round(s.x), Math.round(s.z), WORLD.seed + 61) * 4294967296) >>> 0);
  const kept: { p: Prop; join: boolean }[] = [];
  const out: Prop[] = [];
  for (const { piece, where } of byPriority(set.puts)) {
    for (const spot of spots(where, s, rng)) {
      const p = prop(piece, spot, s.y, yawOf(layoutFace(where), spot, s, rng), rng);
      if (!p) continue;
      if ('lane' in where && spot.side) flank(p, spot);
      if (taken?.(p)) continue;
      if (propColliders(p).length) {
        if (blocks(p, s, !!piece.heart)) continue;
        const join = !!piece.join;
        if (kept.some((o) => !(join && o.join) && Math.hypot(o.p.x - p.x, o.p.z - p.z) - reach(o.p) - reach(p) < SET_RULES.gap)) continue;
        kept.push({ p, join });
      }
      out.push(p);
    }
  }
  return out;
}

const layoutFace = (l: Layout): Face | undefined => ('ring' in l ? l.ring.face : 'at' in l ? l.at.face : 'scatter' in l ? l.scatter.face : l.lane.face);
