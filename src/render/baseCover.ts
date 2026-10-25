/**
 * The plants and roots where a thing meets the ground (round 54, render only): about the foot of a house, a stone, a trunk, the ground's own
 * tufts, ferns, brambles and pebbles stand a little thicker than elsewhere, and a tree's roots flare out of its base into the earth, so the
 * edge between an asset and the land is a ragged one and not a clean line (the terrain's vertices are turned to earth there as well:
 * world/groundContact.ts). Seeded by the prop, so it is the same each visit. Nothing collides with it. A sliced job.
 */

import * as THREE from 'three';
import { createRng } from '../core/rng';
import { GROUND_CONTACT as G } from '../data/fxTuning';
import type { RegionDef } from '../data/regions';
import { WORLD } from '../data/tuning';
import { contactsOf, type Contact } from '../world/groundContact';
import type { Prop } from '../world/props';
import { roadShare, type RoadSeg } from '../world/regionPlan';
import { inDungeon, surface } from '../world/terrain';
import { REGION_COVER } from '../data/coverKinds';
import { regionPiece } from './coverPieces';
import { Builder, COVER, GAIN, plantAt, shade, type Kind } from './groundCover';
import type { PropMat } from './propShapes';

const ROOTED: ReadonlySet<string> = new Set(['tree', 'pine', 'stump']);
const BARK = shade([0.3, 0.23, 0.17], GAIN * 0.5); // as dark as the trunk's foot is (the props' own light is baked darker toward the ground), so a root reads as the trunk's
const BATCH = 24; // props to a slice

/** A point `out` metres beyond the edge of the footprint, at bearing `a` from its centre (turned with the footprint when it is a box). */
function around(c: Contact, a: number, out: number): [number, number] {
  const [dx, dz] = [Math.cos(a), Math.sin(a)];
  if (c.round) return [c.x + dx * (c.hx + out), c.z + dz * (c.hx + out)];
  const edge = 1 / Math.max(Math.abs(dx) / c.hx, Math.abs(dz) / c.hz); // where the bearing leaves the box
  const [lx, lz] = [dx * (edge + out), dz * (edge + out)];
  const [s, k] = [Math.sin(c.yaw), Math.cos(c.yaw)];
  return [c.x + lx * k + lz * s, c.z - lx * s + lz * k];
}

/** A root: a flat wedge flaring from the trunk's side, high against it and gone into the earth at its tip. */
function root(b: Builder, x: number, y: number, z: number, a: number, r0: number, len: number, w: number): void {
  const [dx, dz] = [Math.cos(a), Math.sin(a)];
  const [nx, nz] = [-dz, dx];
  const foot = [x + dx * r0 * 0.8, z + dz * r0 * 0.8];
  const tip = [x + dx * (r0 + len), y - 0.04, z + dz * (r0 + len)];
  const [dark, light] = [shade(BARK, 0.7), BARK];
  b.tri([foot[0] - nx * w, y + 0.34, foot[1] - nz * w], [foot[0] + nx * w, y + 0.34, foot[1] + nz * w], tip, light, light, dark);
  b.tri([foot[0] - nx * w, y + 0.34, foot[1] - nz * w], [foot[0] - nx * w * 0.2, y + 0.02, foot[1] - nz * w * 0.2], tip, light, dark, dark);
  b.tri([foot[0] + nx * w, y + 0.34, foot[1] + nz * w], [foot[0] + nx * w * 0.2, y + 0.02, foot[1] + nz * w * 0.2], tip, light, dark, dark);
}

/** The chunk's base cover as a geometry per material (leaf: plants; stone: pebbles; wood: roots), built a few props at a time. */
export function* baseCoverJob(props: readonly Prop[], region: RegionDef, roads: readonly RoadSeg[], done: (cover: Partial<Record<PropMat, THREE.BufferGeometry>>) => void): Generator<void, void> {
  const cover = COVER[region.biome.texture];
  const [leaf, stone, wood] = [new Builder(true), new Builder(), new Builder(true)];
  const own = region.id in REGION_COVER;
  if (cover.mix.length) {
    let spent = 0;
    for (const p of props) {
      const c = contactsOf([p])[0];
      if (!c) continue;
      const rng = createRng(p.seed * 31 + 7);
      const usable = (x: number, z: number): number | null => {
        if (roadShare(roads, x, z) > 0.05 || inDungeon(x, z)) return null;
        const y = surface(x, z);
        return y < WORLD.seaLevel ? null : y;
      };
      const n = Math.max(3, Math.min(14, Math.round(G.cover.tufts * c.reach * (1 + Math.min(c.hx, c.hz)))));
      for (let k = 0; k < n; k++) {
        const [x, z] = around(c, rng() * Math.PI * 2, 0.08 + rng() * c.reach * 0.8);
        const y = usable(x, z);
        if (y === null) continue;
        let roll = rng();
        const kind: Kind = cover.mix.find(([, w]) => (roll -= w) < 0)?.[0] ?? 'pebble';
        if (own && regionPiece(region.id, rng(), leaf, stone, rng, x, y, z)) continue; // round 78: weed and bone lie against a wall as they do on open ground
        plantAt(kind, leaf, stone, rng, x, y, z);
      }
      if (ROOTED.has(p.kind) && c.round) {
        const roots = G.cover.roots + Math.floor(rng() * 3);
        for (let k = 0; k < roots; k++) {
          const a = ((k + 0.5 * rng()) / roots) * Math.PI * 2;
          const y = usable(p.x + Math.cos(a) * c.hx, p.z + Math.sin(a) * c.hx);
          if (y !== null) root(wood, p.x, y, p.z, a, c.hx, 0.5 + 0.6 * rng(), 0.07 + 0.08 * rng());
        }
      }
      if (++spent % BATCH === 0) yield;
    }
  }
  const out: Partial<Record<PropMat, THREE.BufferGeometry>> = {};
  const [lg, sg, wg] = [leaf.geometry(), stone.geometry(), wood.geometry()];
  if (lg) out.leaf = lg;
  if (sg) out.stone = sg;
  if (wg) out.wood = wg;
  done(out);
}

/** Two covers' geometries laid together, material by material. */
export function mergeCover(a: Partial<Record<PropMat, THREE.BufferGeometry>>, b: Partial<Record<PropMat, THREE.BufferGeometry>>, merge: (g: THREE.BufferGeometry[]) => THREE.BufferGeometry): Partial<Record<PropMat, THREE.BufferGeometry>> {
  const out: Partial<Record<PropMat, THREE.BufferGeometry>> = { ...a };
  for (const [m, g] of Object.entries(b) as [PropMat, THREE.BufferGeometry][]) out[m] = out[m] ? merge([out[m]!, g]) : g;
  return out;
}
