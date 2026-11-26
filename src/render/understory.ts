/**
 * Round 116, what stands above the ground's cover, knee to head high, where the realm's climate lets it grow (data/foliage.ts): a shrub's
 * leafy lumps, a sapling's thin stem and crown, a young fir's tiers, a bed of ferns, a bed of cattails, a dry thorn scrub, a dead brush,
 * a fungus stalk and its cap, a stalk hung with spore pods, standing kelp. Low-poly, in the realm's own colours (its trees' bark, leaves
 * and needles: data/propLooks.ts; its litter's: data/coverKinds.ts), blown by the wind as the grass is and parted by a body going through
 * it (shaders/world.ts SWAY). Into the cover's builders, so no draw call is added. Render only, seeded by the chunk's own stream.
 */

import type { Rng } from '../core/rng';
import { PIECE_COLORS } from '../data/coverKinds';
import type { Under } from '../data/foliage';
import { lookOf, type PropLook } from '../data/propLooks';
import { COLORS, GAIN, clump, fernAt, shade, type Builder } from './groundCover';
import { floraFor, floraGeometry, FLORA_LEAF_GAIN } from './floraKit';
import { paletteOf } from './floraColours';

type Rgb = readonly [number, number, number];
type V = readonly [number, number, number];
const pick = (cs: readonly Rgb[], rng: Rng, k = 1): Rgb => shade(cs[Math.floor(rng() * cs.length)], GAIN * k);

/** A leafy lump: twelve faces about (x, y, z), its ring of six a little ragged, wound outward, its top blown `sway` metres. */
function lump(b: Builder, rng: Rng, x: number, y: number, z: number, r: number, h: number, c: Rgb, sway: number): void {
  const a = rng() * Math.PI;
  const ring: V[] = [0, 1, 2, 3, 4, 5].map((k) => [x + Math.cos(a + (k * Math.PI) / 3) * r * (0.8 + 0.35 * rng()), y + (rng() - 0.5) * h * 0.25, z + Math.sin(a + (k * Math.PI) / 3) * r * (0.8 + 0.35 * rng())]);
  const [top, foot]: V[] = [[x + (rng() - 0.5) * r * 0.3, y + h * 0.6, z + (rng() - 0.5) * r * 0.3], [x, y - h * 0.4, z]];
  const [lit, dark] = [shade(c, 1.08), shade(c, 0.62)];
  for (let k = 0; k < 6; k++) {
    b.face(top, ring[(k + 1) % 6], ring[k], lit, c, c, [sway, sway * 0.7, sway * 0.7]);
    b.face(foot, ring[k], ring[(k + 1) % 6], dark, c, c, [sway * 0.4, sway * 0.7, sway * 0.7]);
  }
}

/** A thin three-sided stem from (x, y, z) up `h`, leaning to (lx, lz) at its top. */
function stem(b: Builder, x: number, y: number, z: number, h: number, r: number, lx: number, lz: number, c: Rgb, sway: number): void {
  const foot: V[] = [0, 1, 2].map((k) => [x + Math.cos(k * 2.094) * r, y - 0.05, z + Math.sin(k * 2.094) * r]);
  const tip: V[] = [0, 1, 2].map((k) => [x + lx + Math.cos(k * 2.094) * r * 0.45, y + h, z + lz + Math.sin(k * 2.094) * r * 0.45]);
  for (let k = 0; k < 3; k++) {
    const n = (k + 1) % 3;
    b.face(foot[k], tip[n], foot[n], shade(c, 0.7), c, shade(c, 0.7), [0, sway, 0]);
    b.face(foot[k], tip[k], tip[n], shade(c, 0.7), c, c, [0, sway, sway]);
  }
}

/**
 * Round 125: a plant of the library (render/floraKit.ts) laid into the cover at (x, y, z), `h` tall (and `w` across its crown's half,
 * for a bush), turned its own way, in its realm's colours; false if the library is not read (the old lumps are drawn instead).
 */
function plant(b: Builder, rng: Rng, kind: string, form: string, x: number, y: number, z: number, h: number, w: number | null, look: PropLook): boolean {
  const m = floraFor(kind, form, Math.floor(rng() * 1e6));
  if (!m) return false;
  const sy = h / m.info.h;
  const sx = w === null ? sy * (0.85 + 0.3 * rng()) : w / Math.max(m.info.crown[3], m.info.crown[5], 0.1);
  const g = floraGeometry(m, { sy, sx, trunk: 1, fork: 0, turn: rng() * Math.PI * 2, height: h }, paletteOf(look, form, Math.floor(rng() * 4)), rng(), 0.85 + 0.25 * rng(), !!look.snow, FLORA_LEAF_GAIN);
  if (g.wood) b.merge(g.wood, x, y - 0.05, z, false);
  if (g.foliage) b.merge(g.foliage, x, y - 0.05, z, true);
  g.wood?.dispose();
  g.foliage?.dispose();
  return true;
}

function shrub(b: Builder, rng: Rng, x: number, y: number, z: number, look: PropLook): void {
  if (plant(b, rng, 'bush', 'round', x, y, z, 0.7 + 0.5 * rng(), 0.45 + 0.35 * rng(), look)) return;
  const n = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const [ox, oz] = [(rng() - 0.5) * 0.7, (rng() - 0.5) * 0.7];
    const r = 0.22 + 0.22 * rng();
    const hy = 0.25 + 0.55 * rng();
    lump(b, rng, x + ox, y + hy, z + oz, r, r * 1.6, pick(look.leaves, rng, 0.85), 0.03 + 0.04 * hy);
  }
}

function sapling(b: Builder, rng: Rng, x: number, y: number, z: number, look: PropLook): void {
  const h = 1.6 + 1.3 * rng();
  if (plant(b, rng, 'under', 'sapling', x, y, z, h, null, look)) return;
  const [lx, lz] = [(rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3];
  stem(b, x, y, z, h, 0.035 + 0.02 * rng(), lx, lz, shade(look.bark, GAIN * 0.9), 0.08);
  for (let i = 0; i < 3 + Math.floor(rng() * 2); i++) { // a crown of several small clusters, not one ball
    const r = 0.2 + 0.18 * rng();
    lump(b, rng, x + lx + (rng() - 0.5) * 0.55, y + h * (0.68 + 0.3 * rng()), z + lz + (rng() - 0.5) * 0.55, r, r * 1.4, pick(look.leaves, rng), 0.1);
  }
}

function fir(b: Builder, rng: Rng, x: number, y: number, z: number, look: PropLook): void {
  const h = 1.1 + 1.4 * rng();
  if (plant(b, rng, 'under', 'fir', x, y, z, h, null, look)) return;
  stem(b, x, y, z, h * 0.35, 0.04, 0, 0, shade(look.bark, GAIN * 0.8), 0.01);
  const c = shade(look.needles, GAIN * (0.9 + 0.2 * rng()));
  for (let t = 0; t < 3; t++) { // tiers, each a five-sided skirt narrowing up
    const [base, top] = [y + h * (0.2 + t * 0.24), y + h * (0.55 + t * 0.2)];
    const r = (0.6 - t * 0.16) * (h / 2);
    const a = rng();
    const ring: V[] = [0, 1, 2, 3, 4].map((k) => [x + Math.cos(a + k * 1.257) * r, base, z + Math.sin(a + k * 1.257) * r]);
    const tip: V = [x, top, z];
    for (let k = 0; k < 5; k++) b.face(tip, ring[(k + 1) % 5], ring[k], shade(c, 1.1), shade(c, 0.75), shade(c, 0.75), [0.05 * (t + 1), 0.03 * (t + 1), 0.03 * (t + 1)]);
  }
}

function ferns(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) fernAt(b, rng, x + (rng() - 0.5) * 1.2, y, z + (rng() - 0.5) * 1.2, pick(COLORS.fern, rng, 1.05));
}

function cattails(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) clump(b, rng, x + (rng() - 0.5) * 0.9, y, z + (rng() - 0.5) * 0.9, 1.1 + 0.6 * rng(), 0.6, pick(COLORS.reed, rng), 'reeds', 2); // round 125: the atlas's reeds and their heads
  for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) {
    const [rx, rz] = [x + (rng() - 0.5) * 0.9, z + (rng() - 0.5) * 0.9];
    const h = 1.1 + 0.6 * rng();
    const [lx, lz] = [(rng() - 0.5) * 0.25, (rng() - 0.5) * 0.25];
    const c = pick(COLORS.reed, rng);
    b.tri([rx - 0.02, y, rz], [rx + 0.02, y, rz], [rx + lx, y + h, rz + lz], shade(c, 0.6), shade(c, 0.6), c, [0, 0, 0.16 * h]);
    if (rng() < 0.5) lump(b, rng, rx + lx * 0.8, y + h * 0.78, rz + lz * 0.8, 0.03, 0.2, shade([0.42, 0.3, 0.2], GAIN), 0.12 * h); // a brown head
  }
}

function scrub(b: Builder, rng: Rng, x: number, y: number, z: number, look: PropLook): void {
  if (plant(b, rng, 'bush', 'scrub', x, y, z, 0.5 + 0.35 * rng(), 0.35 + 0.25 * rng(), look)) return;
  const c = shade(look.bark, GAIN);
  for (let i = 0; i < 10; i++) {
    const a = rng() * Math.PI * 2;
    const len = 0.35 + 0.4 * rng();
    b.tri([x - 0.015, y, z], [x + 0.015, y, z], [x + Math.sin(a) * len * 0.6, y + len, z + Math.cos(a) * len * 0.6], shade(c, 0.6), shade(c, 0.6), c, [0, 0, 0.04]);
  }
  for (let i = 0; i < 2; i++) lump(b, rng, x + (rng() - 0.5) * 0.4, y + 0.3, z + (rng() - 0.5) * 0.4, 0.16, 0.22, shade(look.needles, GAIN * 0.9), 0.02);
}

function brush(b: Builder, rng: Rng, x: number, y: number, z: number, look: PropLook): void {
  const c = shade(look.bark, GAIN * 0.85);
  clump(b, rng, x, y, z, 0.7 + 0.6 * rng(), 0.8 + 0.4 * rng(), shade(c, 1.2), 'bare', 3); // round 125: the atlas's bare twigs, a dead brush's lace
  for (let i = 0; i < 7 + Math.floor(rng() * 5); i++) {
    const a = rng() * Math.PI * 2;
    const len = 0.6 + 0.6 * rng();
    const mid: V = [x + Math.sin(a) * len * 0.3, y + len * 0.55, z + Math.cos(a) * len * 0.3];
    b.tri([x - 0.015, y, z], [x + 0.015, y, z], mid, shade(c, 0.6), shade(c, 0.6), c, [0, 0, 0.03]);
    for (const t of [-0.6, 0.5]) b.tri([mid[0] - 0.01, mid[1], mid[2]], [mid[0] + 0.01, mid[1], mid[2]], [mid[0] + Math.sin(a + t) * len * 0.35, mid[1] + len * 0.4, mid[2] + Math.cos(a + t) * len * 0.35], c, c, shade(c, 1.1), [0.03, 0.03, 0.06]);
  }
}

function stalk(b: Builder, rng: Rng, x: number, y: number, z: number, pods: boolean): void {
  const h = 0.5 + 1.0 * rng();
  const c = pick(pods ? PIECE_COLORS.pod : PIECE_COLORS.cap, rng);
  stem(b, x, y, z, h, 0.04 + 0.02 * rng(), (rng() - 0.5) * 0.2, (rng() - 0.5) * 0.2, shade(c, 0.85), 0.04);
  if (pods) for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) lump(b, rng, x + (rng() - 0.5) * 0.12, y + h * (0.3 + 0.7 * rng()), z + (rng() - 0.5) * 0.12, 0.05 + 0.04 * rng(), 0.12, shade(c, 1.1), 0.04);
  else lump(b, rng, x, y + h, z, 0.2 + 0.22 * rng(), 0.18, shade(c, 1.1), 0.04); // the cap
}

function kelp(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) {
    const c = pick(PIECE_COLORS.wrack, rng, 1.1);
    let [px, py, pz] = [x + (rng() - 0.5) * 0.5, y, z + (rng() - 0.5) * 0.5];
    const w = 0.05 + 0.03 * rng();
    for (let s = 0; s < 3; s++) {
      const [qx, qy, qz] = [px + (rng() - 0.5) * 0.25, py + 0.3 + 0.15 * rng(), pz + (rng() - 0.5) * 0.25];
      b.tri([px - w, py, pz], [px + w, py, pz], [qx, qy, qz], shade(c, 0.7), shade(c, 0.7), c, [0.04 * s, 0.04 * s, 0.05 * (s + 1)]);
      [px, py, pz] = [qx, qy, qz];
    }
  }
}

/** One piece of undergrowth of `kind` at (x, y, z), in the region's colours, into `leaf` (all of it bends with the wind). */
export function underAt(kind: Under, region: string, leaf: Builder, rng: Rng, x: number, y: number, z: number): void {
  const look = lookOf(region);
  if (kind === 'shrub') shrub(leaf, rng, x, y, z, look);
  else if (kind === 'sapling') sapling(leaf, rng, x, y, z, look);
  else if (kind === 'fir') fir(leaf, rng, x, y, z, look);
  else if (kind === 'ferns') ferns(leaf, rng, x, y, z);
  else if (kind === 'cattails') cattails(leaf, rng, x, y, z);
  else if (kind === 'scrub') scrub(leaf, rng, x, y, z, look);
  else if (kind === 'brush') brush(leaf, rng, x, y, z, look);
  else if (kind === 'stalk' || kind === 'sporestalk') stalk(leaf, rng, x, y, z, kind === 'sporestalk');
  else kelp(leaf, rng, x, y, z);
}
