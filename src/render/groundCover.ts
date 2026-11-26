/**
 * Ground cover (render only): what lies about on open ground, by its ground and (round 116) as thick as its realm's climate lets it grow, with the undergrowth above
 * it where anything grows (data/foliage.ts, render/understory.ts; round 32: it was a few dozen, and the fields looked bare) —
 * tufts of grass and October leaf litter on New England turf, reeds on the Innsmouth mud, dry grass
 * on sand, pebbles on stone and snow, nodules on Yuggoth's flesh — never on a road, a site or a
 * dungeon floor. Seeded by the chunk, so it is the same each visit. Blades are lit as the ground is
 * (their normals face up), so the cover sits in the ground's light. Nothing collides with it.
 */

import * as THREE from 'three';
import { createRng, type Rng } from '../core/rng';
import type { GroundTexture, RegionDef } from '../data/regions';
import { WORLD } from '../data/tuning';
import { worldLayout } from '../world/placements';
import { roadShare, type RoadSeg } from '../world/regionPlan';
import { inDungeon, surface } from '../world/terrain';
import { padDistance } from '../world/sitePads';
import { chunkKey } from '../world/worldMap';
import { REGION_COVER } from '../data/coverKinds';
import { CLIMATES } from '../data/foliage';
import { contactsOf, edgeDistance } from '../world/groundContact';
import type { Prop } from '../world/props';
import { regionPiece } from './coverPieces';
import type { PropMat } from './propShapes';
import { underAt } from './understory';

type Rgb = readonly [number, number, number];
export type Kind = 'tuft' | 'reed' | 'dry' | 'litter' | 'pebble' | 'nodule' | 'fern' | 'tallgrass' | 'flower' | 'mushroom' | 'bramble';

/** Pieces a chunk holds, by its ground, and what they are. */
export const COVER: Readonly<Record<GroundTexture, { count: number; mix: readonly [Kind, number][] }>> = {
  // Round 35 (more foliage, where it would grow): ferns, brambles and toadstools under the trees, tall seeding grass and a few wildflowers in the meadows, reeds along the mud.
  grass: { count: 190, mix: [['tuft', 0.34], ['tallgrass', 0.18], ['fern', 0.08], ['flower', 0.06], ['bramble', 0.06], ['litter', 0.12], ['mushroom', 0.04], ['pebble', 0.12]] },
  rot: { count: 110, mix: [['dry', 0.4], ['mushroom', 0.2], ['bramble', 0.15], ['pebble', 0.25]] },
  mud: { count: 130, mix: [['reed', 0.6], ['tallgrass', 0.12], ['mushroom', 0.06], ['pebble', 0.22]] },
  sand: { count: 60, mix: [['dry', 0.6], ['tallgrass', 0.15], ['pebble', 0.25]] },
  stone: { count: 26, mix: [['pebble', 0.6], ['dry', 0.25], ['bramble', 0.15]] },
  slab: { count: 24, mix: [['pebble', 0.75], ['dry', 0.15], ['bramble', 0.1]] },
  snow: { count: 12, mix: [['pebble', 1]] },
  flesh: { count: 36, mix: [['nodule', 0.8], ['mushroom', 0.2]] },
  dirt: { count: 90, mix: [['dry', 0.45], ['bramble', 0.15], ['tallgrass', 0.1], ['pebble', 0.3]] },
  gravel: { count: 56, mix: [['pebble', 0.7], ['dry', 0.2], ['bramble', 0.1]] },
  leaves: { count: 170, mix: [['fern', 0.22], ['tuft', 0.2], ['litter', 0.22], ['mushroom', 0.06], ['bramble', 0.1], ['tallgrass', 0.08], ['pebble', 0.12]] },
  water: { count: 0, mix: [] },
};

export const COLORS: Readonly<Record<Kind, readonly Rgb[]>> = {
  tuft: [[0.5, 0.52, 0.34], [0.58, 0.55, 0.36], [0.44, 0.47, 0.32]],
  reed: [[0.4, 0.44, 0.34], [0.5, 0.5, 0.36]],
  dry: [[0.7, 0.62, 0.44], [0.62, 0.56, 0.42]],
  litter: [[0.72, 0.4, 0.22], [0.78, 0.58, 0.28], [0.56, 0.3, 0.2]],
  pebble: [[0.72, 0.72, 0.7], [0.62, 0.62, 0.6]],
  nodule: [[0.6, 0.44, 0.44], [0.5, 0.36, 0.38]],
  fern: [[0.34, 0.5, 0.32], [0.4, 0.54, 0.34], [0.3, 0.44, 0.3]],
  tallgrass: [[0.62, 0.6, 0.38], [0.5, 0.56, 0.34], [0.68, 0.62, 0.42]],
  flower: [[0.8, 0.78, 0.7], [0.62, 0.52, 0.72], [0.82, 0.68, 0.36]],
  mushroom: [[0.78, 0.74, 0.66], [0.66, 0.52, 0.42]],
  bramble: [[0.34, 0.3, 0.24], [0.4, 0.34, 0.26]],
};

import { Builder, GAIN, shade } from './coverBuilder';
import type { FoliageCell } from './textureFoliage';

export { Builder, GAIN, shade };
type V = readonly [number, number, number];

/** Blades from (x, y, z), each a thin triangle leaning out (drawn from both sides by its material). */
function blades(b: Builder, rng: Rng, x: number, y: number, z: number, n: number, h: number, w: number, c: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const [s, co] = [Math.sin(a), Math.cos(a)];
    const len = h * (0.6 + 0.6 * rng());
    const lean = 0.15 + 0.35 * rng();
    const tip: V = [x + s * len * lean, y + len, z + co * len * lean];
    const dark = shade(c, 0.6);
    b.tri([x - co * w, y, z + s * w], [x + co * w, y, z - s * w], tip, dark, dark, c, [0, 0, 0.16 * len]); // the tip is blown, the foot is not
  }
}

/**
 * Round 125: a clump as cards of the leaf atlas, `n` crossed planes rooted at (x, y, z), `h` tall and `w` wide, leaning a little
 * each its own way, dark at the root and pale at the tips (a tuft of grass, a clump gone to seed, reeds, a bramble's canes).
 */
export function clump(b: Builder, rng: Rng, x: number, y: number, z: number, h: number, w: number, c: Rgb, cell: FoliageCell, n = 2): void {
  const a0 = rng() * Math.PI;
  const phase = rng();
  for (let k = 0; k < n; k++) {
    const a = a0 + (k * Math.PI) / n + (rng() - 0.5) * 0.5;
    const hh = h * (0.85 + 0.3 * rng());
    b.card([x, y - 0.03, z], [(rng() - 0.5) * 0.3 * hh, hh, (rng() - 0.5) * 0.3 * hh], [Math.cos(a) * w * 0.5, 0, Math.sin(a) * w * 0.5], cell, shade(c, 0.5), shade(c, 1.12), 0.16 * hh, 0.8, phase + k * 0.13);
  }
}

/** A fern: a rosette of fronds from its crown, each leaning out and turned up to the sky (round 125: the atlas's frond). */
export function fernAt(b: Builder, rng: Rng, x: number, y: number, z: number, c: Rgb): void {
  const n = 6 + Math.floor(rng() * 4);
  const phase = rng();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.5;
    const [s, co] = [Math.sin(a), Math.cos(a)];
    const len = 0.6 + 0.4 * rng();
    const tilt = 0.6 + 0.5 * rng(); // radians from upright
    const up: V = [s * Math.sin(tilt) * len, Math.cos(tilt) * len, co * Math.sin(tilt) * len];
    b.card([x + s * 0.04, y - 0.02, z + co * 0.04], up, [co * len * 0.28, 0, -s * len * 0.28], 'frond', shade(c, 0.6), shade(c, 1.1), 0.05 + 0.1 * len, 0.7, phase + i * 0.07, [s * 0.5, 0.86, co * 0.5]);
  }
}

/** Tall seeding grass: crossed clumps of the atlas's grass, its seed heads pale at the tips. */
function tallgrass(b: Builder, rng: Rng, x: number, y: number, z: number, c: Rgb): void {
  clump(b, rng, x, y, z, 0.8 + 0.35 * rng(), 0.55 + 0.15 * rng(), c, 'grass', 3);
}

/** A few stems and a blossom each, small and pale (a flower here is a speck of colour in the grass, not a bed). */
function flower(b: Builder, rng: Rng, x: number, y: number, z: number, c: Rgb): void {
  const stem = shade([0.4, 0.5, 0.32], GAIN);
  clump(b, rng, x, y, z, 0.3 + 0.1 * rng(), 0.4, shade(stem, 0.75), 'grass');
  for (let i = 0; i < 3; i++) {
    const [fx, fz] = [x + (rng() - 0.5) * 0.5, z + (rng() - 0.5) * 0.5];
    const h = 0.35 + 0.25 * rng();
    b.tri([fx - 0.012, y, fz], [fx + 0.012, y, fz], [fx, y + h, fz], shade(stem, 0.7), shade(stem, 0.7), stem, [0, 0, 0.08]);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      b.tri([fx, y + h, fz], [fx + Math.sin(a) * 0.07, y + h + 0.02, fz + Math.cos(a) * 0.07], [fx + Math.sin(a + 1.5) * 0.07, y + h + 0.02, fz + Math.cos(a + 1.5) * 0.07], c, c, shade(c, 0.85), [0.08, 0.08, 0.08]);
    }
  }
}

/** Toadstools: a pale stem and a cap, in a small ring or a cluster. */
function mushroom(b: Builder, rng: Rng, x: number, y: number, z: number, c: Rgb): void {
  const n = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const [mx, mz] = [x + (rng() - 0.5) * 0.5, z + (rng() - 0.5) * 0.5];
    const h = 0.08 + 0.12 * rng();
    const r = 0.05 + 0.07 * rng();
    const stem = shade([0.8, 0.78, 0.7], GAIN * 0.6);
    b.tri([mx - 0.012, y, mz], [mx + 0.012, y, mz], [mx, y + h, mz], stem, stem, stem);
    const top: V = [mx, y + h + r * 0.55, mz];
    const ring: V[] = [0, 1, 2, 3, 4].map((k) => [mx + Math.cos((k / 5) * Math.PI * 2) * r, y + h, mz + Math.sin((k / 5) * Math.PI * 2) * r]);
    for (let k = 0; k < 5; k++) b.tri(ring[k], ring[(k + 1) % 5], top, shade(c, 0.8), shade(c, 0.8), c);
  }
}

/** A tangle of dark thorny canes, low and dense (round 125: the atlas's thorn, with a few bare stems). */
function bramble(b: Builder, rng: Rng, x: number, y: number, z: number, c: Rgb): void {
  clump(b, rng, x, y, z, 0.5 + 0.25 * rng(), 0.6 + 0.2 * rng(), c, 'thorn');
  blades(b, rng, x, y, z, 4, 0.6, 0.025, shade(c, 0.85));
}

/** A small rounded stone: a squat octahedron. */
function pebble(b: Builder, rng: Rng, x: number, y: number, z: number, c: Rgb): void {
  const r = 0.07 + 0.14 * rng();
  const h = r * (0.5 + 0.4 * rng());
  const a = rng() * Math.PI;
  const ring: V[] = [0, 1, 2, 3].map((k) => [x + Math.cos(a + (k * Math.PI) / 2) * r, y + h * 0.3, z + Math.sin(a + (k * Math.PI) / 2) * r]);
  const top: V = [x, y + h, z];
  for (let k = 0; k < 4; k++) b.tri(ring[k], ring[(k + 1) % 4], top, shade(c, 0.8), shade(c, 0.8), c);
}

const FALLEN: readonly FoliageCell[] = ['broad', 'maple', 'small'];

/** Fallen leaves lying flat, a few together (round 125: each a leaf of the atlas, curled a little off the ground). */
function litter(b: Builder, rng: Rng, x: number, y: number, z: number): void {
  for (let i = 0; i < 5; i++) {
    const c = shade(COLORS.litter[Math.floor(rng() * COLORS.litter.length)], GAIN * (0.8 + 0.3 * rng()));
    const [lx, lz] = [x + (rng() - 0.5) * 0.9, z + (rng() - 0.5) * 0.9];
    const a = rng() * Math.PI * 2;
    const r = 0.1 + 0.07 * rng();
    const [ux, uz] = [Math.sin(a) * r * 2, Math.cos(a) * r * 2];
    b.card([lx - ux / 2, y + 0.03, lz - uz / 2], [ux, 0.03 + 0.04 * rng(), uz], [uz * 0.5, 0, -ux * 0.5], FALLEN[Math.floor(rng() * FALLEN.length)], shade(c, 0.85), c, 0, 0.15, rng());
  }
}

/** One piece of cover of `kind` standing at (x, y, z): what grows into `leaf`, stones and nodules into `stone`. */
export function plantAt(kind: Kind, leaf: Builder, stone: Builder, rng: Rng, x: number, y: number, z: number): void {
  const c = shade(COLORS[kind][Math.floor(rng() * COLORS[kind].length)], GAIN);
  if (kind === 'tuft') (clump(leaf, rng, x, y, z, 0.38 + 0.22 * rng(), 0.45 + 0.15 * rng(), c, 'grass'), blades(leaf, rng, x, y, z, 2, 0.45, 0.04, c));
  else if (kind === 'dry') clump(leaf, rng, x, y, z, 0.3 + 0.15 * rng(), 0.4, c, 'grass');
  else if (kind === 'reed') clump(leaf, rng, x, y, z, 1.0 + 0.4 * rng(), 0.5, c, 'reeds', 3);
  else if (kind === 'litter') litter(leaf, rng, x, y, z);
  else if (kind === 'fern') fernAt(leaf, rng, x, y, z, c);
  else if (kind === 'tallgrass') tallgrass(leaf, rng, x, y, z, c);
  else if (kind === 'flower') flower(leaf, rng, x, y, z, c);
  else if (kind === 'mushroom') mushroom(leaf, rng, x, y, z, c);
  else if (kind === 'bramble') bramble(leaf, rng, x, y, z, c);
  else pebble(stone, rng, x, y, z, c);
}

const SLICE = 48; // pieces laid between one yield and the next (the chunk's making is sliced to a couple of milliseconds a frame: core/slicer.ts)

/** The chunk's ground cover as a geometry per material (foliage: blades, leaves and the undergrowth; stone: pebbles and nodules), off the roads, the sites, the dungeons and the footprints of what stands in it, a slice at a time; `done` takes it. */
export function* groundCoverJob(cx: number, cz: number, region: RegionDef, roads: readonly RoadSeg[], props: readonly Prop[], done: (cover: Partial<Record<PropMat, THREE.BufferGeometry>>) => void): Generator<void, void> {
  const cover = COVER[region.biome.texture];
  const climate = CLIMATES[region.id];
  const rng = createRng(chunkKey(cx, cz) * 7919 + 17);
  const pads = worldLayout().chunk(cx, cz).pads;
  const solid = contactsOf(props);
  yield;
  const clear = (x: number, z: number, margin: number): boolean => !solid.some((c) => edgeDistance(c, x, z) < margin);
  const [leaf, stone] = [new Builder(true), new Builder()];
  const own = region.id in REGION_COVER;
  const count = Math.round(cover.count * (climate?.cover ?? 1));
  for (let k = 0; k < count; k++) {
    if (k % SLICE === SLICE - 1) yield;
    const [x, z] = [(cx + rng()) * WORLD.chunk, (cz + rng()) * WORLD.chunk];
    let roll = rng();
    const kind = cover.mix.find(([, w]) => (roll -= w) < 0)?.[0] ?? 'pebble';
    if (roadShare(roads, x, z) > 0.05 || inDungeon(x, z)) continue;
    if (pads.some((p) => padDistance(p, x, z) < 1) || !clear(x, z, 0.05)) continue; // (round 116: not inside a house, a wall or a stone)
    const y = surface(x, z);
    if (y < WORLD.seaLevel) continue;
    if (own && regionPiece(region.id, rng(), leaf, stone, rng, x, y, z)) continue; // round 80: the region's own litter in place of a share of the ground's (data/coverKinds.ts)
    plantAt(kind, leaf, stone, rng, x, y, z);
  }
  const under = createRng(chunkKey(cx, cz) * 6007 + 911); // round 116: the undergrowth on a stream of its own, so the cover's own draws are as they were
  for (let k = 0; k < (climate?.under ?? 0); k++) {
    const [x, z] = [(cx + under()) * WORLD.chunk, (cz + under()) * WORLD.chunk];
    let roll = under();
    const kind = climate.kinds.find(([, w]) => (roll -= w) < 0)?.[0] ?? climate.kinds[0][0];
    if (roadShare(roads, x, z) > 0.02 || inDungeon(x, z) || pads.some((p) => padDistance(p, x, z) < 2.5) || !clear(x, z, 0.6)) continue;
    const y = surface(x, z);
    if (y < WORLD.seaLevel + 0.1) continue;
    underAt(kind, region.id, leaf, under, x, y, z);
    if (k % 8 === 7) yield;
  }
  yield;
  const out: Partial<Record<PropMat, THREE.BufferGeometry>> = {};
  const lg = leaf.geometry();
  yield;
  const sg = stone.geometry();
  if (lg) out.foliage = lg; // round 125: what grows, cut out of the leaf atlas
  if (sg) out.stone = sg;
  done(out);
}

/** The chunk's ground cover made at once (the tests', and any caller outside the sliced streaming). */
export function groundCover(cx: number, cz: number, region: RegionDef, roads: readonly RoadSeg[], props: readonly Prop[] = []): Partial<Record<PropMat, THREE.BufferGeometry>> {
  let out: Partial<Record<PropMat, THREE.BufferGeometry>> = {};
  const job = groundCoverJob(cx, cz, region, roads, props, (c) => (out = c));
  while (!job.next().done);
  return out;
}
