/**
 * Round 78, the pieces of a region's own litter (data/coverKinds.ts): weed lying where the tide left it, a bleached rib standing from the
 * sand, a potsherd, a pale fungus. A few faces each, lit as the ground is (the cover builder's normals face up), drawn into the same merged
 * geometry as the rest of the ground cover, so no draw call is added. Render only, seeded by the chunk's own random stream.
 */

import type { Rng } from '../core/rng';
import { PIECE_COLORS, pieceOf, type Piece } from '../data/coverKinds';
import type { Builder } from './groundCover';

type Rgb = readonly [number, number, number];
type V = readonly [number, number, number];
const GAIN = 1.8; // textures average about half brightness: vertex colours are raised to show their own (groundCover.ts)
const dim = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];
const pick = (cs: readonly Rgb[], rng: Rng): Rgb => dim(cs[Math.floor(rng() * cs.length)], GAIN);

/** A flat ribbon from p to q, `w` wide to each side. */
function strip(b: Builder, p: V, q: V, w: number, vertical: boolean, c0: Rgb, c1: Rgb): void {
  const [dx, dz] = [q[0] - p[0], q[2] - p[2]];
  const len = Math.max(Math.hypot(dx, dz), 1e-4);
  const [nx, nz] = vertical ? [0, 0] : [(-dz / len) * w, (dx / len) * w];
  const ny = vertical ? w : 0;
  const [a, bb, c, d]: V[] = [[p[0] - nx, p[1] - ny, p[2] - nz], [p[0] + nx, p[1] + ny, p[2] + nz], [q[0] + nx, q[1] + ny, q[2] + nz], [q[0] - nx, q[1] - ny, q[2] - nz]];
  b.tri(a, bb, c, c0, c0, c1);
  b.tri(a, c, d, c0, c1, c1);
}

/** Weed: two or three strands, each a ribbon of two lengths bending along the ground. */
function wrack(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  const strands = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < strands; i++) {
    const c = pick(PIECE_COLORS.wrack, rng);
    let [px, pz] = [x + (rng() - 0.5) * 0.5, z + (rng() - 0.5) * 0.5];
    let a = rng() * Math.PI;
    const w = 0.04 + 0.03 * rng();
    for (let s = 0; s < 2; s++) {
      const len = 0.25 + 0.35 * rng();
      const [qx, qz] = [px + Math.sin(a) * len, pz + Math.cos(a) * len];
      strip(b, [px, y + 0.03, pz], [qx, y + 0.03 + 0.03 * rng(), qz], w * (s ? 0.6 : 1), false, dim(c, 0.7), s ? dim(c, 0.8) : c);
      [px, pz, a] = [qx, qz, a + (rng() - 0.5) * 1.1];
    }
  }
}

/** A rib: a half-buried arc standing from the sand, two ribbons crossed so it reads from any side. */
function rib(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  const c = pick(PIECE_COLORS.rib, rng);
  const [reach, rise] = [0.35 + 0.25 * rng(), 0.5 + 0.4 * rng()];
  const a = rng() * Math.PI;
  const [ux, uz] = [Math.sin(a), Math.cos(a)];
  const point = (t: number): V => {
    const th = Math.PI * (0.08 + 0.84 * t);
    return [x + ux * Math.cos(th) * reach, y - 0.08 + Math.sin(th) * rise, z + uz * Math.cos(th) * reach];
  };
  for (let s = 0; s < 6; s++) {
    const [p, q] = [point(s / 6), point((s + 1) / 6)];
    const w = 0.045 * (1 - 0.5 * (s / 6));
    strip(b, p, q, w, true, dim(c, 0.8), c);
    strip(b, p, q, w, false, dim(c, 0.8), c);
  }
}

/** A potsherd: a flat angular piece a hand across, lying a little tilted. */
function sherd(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  const c = pick(PIECE_COLORS.sherd, rng);
  const r = 0.07 + 0.09 * rng();
  const a = rng() * Math.PI * 2;
  const tilt = (rng() - 0.5) * 0.08;
  const corner = (k: number, rr: number): V => [x + Math.cos(a + k * 2.1) * rr, y + 0.03 + tilt * Math.cos(a + k * 2.1), z + Math.sin(a + k * 2.1) * rr];
  b.tri(corner(0, r), corner(1, r * 0.7), corner(2, r * 0.9), c, dim(c, 0.85), c);
}

/** Pale fungus: a couple of stalks, each with a wide cap. */
function cap(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  const n = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const [mx, mz] = [x + (rng() - 0.5) * 0.45, z + (rng() - 0.5) * 0.45];
    const h = 0.12 + 0.18 * rng();
    const r = 0.09 + 0.1 * rng();
    const c = pick(PIECE_COLORS.cap, rng);
    const stem = dim(c, 0.8);
    b.tri([mx - 0.016, y, mz], [mx + 0.016, y, mz], [mx, y + h, mz], dim(stem, 0.7), dim(stem, 0.7), stem);
    const top: V = [mx, y + h + r * 0.5, mz];
    const ring = [0, 1, 2, 3].map((k): V => [mx + Math.cos((k / 4) * Math.PI * 2 + 0.4) * r, y + h, mz + Math.sin((k / 4) * Math.PI * 2 + 0.4) * r]);
    for (let k = 0; k < 4; k++) b.tri(ring[k], ring[(k + 1) % 4], top, dim(c, 0.75), dim(c, 0.75), c);
  }
}

const BUILD: Record<Piece, (b: Builder, rng: Rng, x: number, y: number, z: number) => void> = { wrack, rib, sherd, cap };

/** The region's own piece for `roll` (0..1) laid at (x, y, z): into `leaf` (the fungus) or `stone`; false when the roll is for the ground's own cover. */
export function regionPiece(region: string, roll: number, leaf: Builder, stone: Builder, rng: Rng, x: number, y: number, z: number): boolean {
  const piece = pieceOf(region, roll);
  if (!piece) return false;
  BUILD[piece](piece === 'cap' ? leaf : stone, rng, x, y, z);
  return true;
}
