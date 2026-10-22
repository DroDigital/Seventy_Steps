/**
 * Where the points of interest stand (round 61; data/pois.ts): each resolved to the feature of the region plan it belongs at, or to a
 * spot found on the land (a shore with the sea within twenty-two metres, a cliff's flat brow over a drop, a clearing broad enough for a maze),
 * with the guard that stands about it (posts like any other foe's, and so kept, rested and saved as theirs are), the place its chest
 * is set down, its maze of walls, and what else is raised about it. Planned after everything else in the region, on streams of its own,
 * so that no earlier prop, post or id moves. Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { createRng, type Rng } from '../core/rng';
import { poisOf, type PoiDef } from '../data/pois';
import type { RegionDef } from '../data/regions';
import { getEntity } from '../data/registry';
import { START_SIGN } from '../data/sites';
import { POI, WORLD } from '../data/tuning';
import type { Feature } from './features';
import { FIRST_HOUR, gentle, groundOf } from './planSpawns';
import { worldLayout, type SpawnPoint } from './placements';
import { makeProp, type Prop } from './props';
import { ground } from './terrain';
import { regionRect, toWorld } from './worldMap';

export interface PoiSite {
  def: PoiDef;
  x: number;
  z: number;
  r: number; // metres: how far its influence reaches (its feature's footprint, or a maze's half-width)
  chest: XZ | null; // where the hoard is set down, if it has one
}

export interface PoiPlan {
  sites: PoiSite[];
  props: Prop[];
  spawns: SpawnPoint[];
}

const SEED = 0x70c1;
const hashOf = (s: string): number => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
const EIGHT: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7]];
export const CELLS = 7; // a maze is this many passages each way
export const MAZE_HALF = (CELLS * POI.cell) / 2;

/** Dry land at the water's edge: a little above the sea, and the sea (ground below it) within twenty-two metres (the land runs to the region's edge and the coast falls away past it). */
export const shoreAt = (x: number, z: number): boolean => {
  const h = ground(x, z);
  return h > WORLD.seaLevel + 0.5 && h < WORLD.seaLevel + 8 && EIGHT.some(([dx, dz]) => ground(x + dx * 22, z + dz * 22) < WORLD.seaLevel - 0.4);
};
/** The flat top of a drop: high ground, level about the feet, and the land falling away by four metres or more within nine. */
export const cliffAt = (x: number, z: number): boolean => {
  const h = ground(x, z);
  return h > WORLD.seaLevel + 3 && EIGHT.every(([dx, dz]) => Math.abs(ground(x + dx * 2.5, z + dz * 2.5) - h) < 1.4) && EIGHT.some(([dx, dz]) => ground(x + dx * 9, z + dz * 9) < h - 4);
};

/** The nearest point to (cx, cz), searched outward, that `ok` accepts and stands within the region (`inset` metres from its edge); null if there is none within 220 m. */
function nearest(region: RegionDef, cx: number, cz: number, ok: (x: number, z: number) => boolean, inset = 30): XZ | null {
  const rect = regionRect(region);
  for (let d = 0; d <= 220; d += 6) {
    const n = d === 0 ? 1 : Math.ceil((2 * Math.PI * d) / 6);
    for (let k = 0; k < n; k++) {
      const [x, z] = [cx + Math.sin((k / n) * 6.2832) * d, cz + Math.cos((k / n) * 6.2832) * d];
      if (x > rect.x0 + inset && x < rect.x1 - inset && z > rect.z0 + inset && z < rect.z1 - inset && ok(x, z)) return { x, z };
    }
  }
  return null;
}

/** The passages of a maze: walls kept between cells, carved by a walk that never closes on itself, with its mouth in the south wall. */
export function mazeWalls(rng: Rng): { right: boolean[][]; up: boolean[][]; mouth: number } {
  const right = Array.from({ length: CELLS }, () => Array<boolean>(CELLS).fill(true)); // a wall on the east side of cell (i, j)
  const up = Array.from({ length: CELLS }, () => Array<boolean>(CELLS).fill(true)); // a wall on the north side of cell (i, j)
  const seen = new Set<number>([0]);
  const stack: [number, number][] = [[0, 0]];
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const opts = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).filter(([a, b]) => i + a >= 0 && j + b >= 0 && i + a < CELLS && j + b < CELLS && !seen.has((i + a) * CELLS + j + b));
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [a, b] = opts[Math.floor(rng() * opts.length)];
    if (a === 1) right[i][j] = false;
    else if (a === -1) right[i - 1][j] = false;
    else if (b === 1) up[i][j] = false;
    else up[i][j - 1] = false;
    seen.add((i + a) * CELLS + j + b);
    stack.push([i + a, j + b]);
  }
  return { right, up, mouth: Math.floor(rng() * CELLS) };
}

/** A maze's centre of cell (i, j), and its walls as props: runs of wall along each line, the outer wall open at the mouth. */
function mazeProps(cx: number, cz: number, rng: Rng): { props: Prop[]; cell: (i: number, j: number) => XZ } {
  const { right, up, mouth } = mazeWalls(rng);
  const c = POI.cell;
  const [x0, z0] = [cx - MAZE_HALF, cz - MAZE_HALF];
  const props: Prop[] = [];
  const wall = (x: number, z: number, half: number, along: 'x' | 'z'): void => void props.push(makeProp('wall', x, z, rng, along === 'x' ? 0 : -Math.PI / 2, [half + 0.3, 0.3, POI.walls]));
  for (let line = 0; line <= CELLS; line++) {
    for (const along of ['x', 'z'] as const) {
      for (let k = 0, run = 0; k <= CELLS; k++) {
        const solid = k < CELLS && (along === 'x'
          ? (line === 0 ? k !== mouth : line === CELLS ? true : up[k][line - 1]) // the lines running east: the south wall (its mouth open), the north wall, and the walls over each cell
          : (line === 0 || line === CELLS ? true : right[line - 1][k])); // the lines running north
        if (solid) run++;
        else if (run) {
          for (let a = 0; a < run; a += 2) { // in pieces of two passages at most, each standing on the ground at its own middle (a long run on a slope would float at one end and sink at the other)
            const half = (Math.min(2, run - a) * c) / 2;
            const mid = (k - run + a) * c + half;
            if (along === 'x') wall(x0 + mid, z0 + line * c, half, 'x');
            else wall(x0 + line * c, z0 + mid, half, 'z');
          }
          run = 0;
        }
      }
    }
  }
  return { props, cell: (i, j) => ({ x: x0 + (i + 0.5) * c, z: z0 + (j + 0.5) * c }) };
}

export function planPois(region: RegionDef, features: readonly Feature[], props: readonly Prop[], posts: readonly SpawnPoint[], defs: readonly PoiDef[] = poisOf(region.id)): PoiPlan {
  const plan: PoiPlan = { sites: [], props: [], spawns: [] };
  if (!defs.length) return plan;
  const base = groundOf(region, props);
  const w = worldLayout();
  const start = w.signs.find((s) => s.id === START_SIGN);
  const early = (x: number, z: number): boolean => !!start && Math.hypot(start.x - x, start.z - z) < FIRST_HOUR;
  const found: { def: PoiDef; x: number; z: number; r: number; rng: Rng; maze?: ReturnType<typeof mazeProps> }[] = [];
  for (const def of defs) {
    const rng = createRng(hashOf(def.id) ^ SEED ^ WORLD.seed);
    let spot: (XZ & { r: number }) | null = null;
    if ('feature' in def.at) {
      const f = features.filter((x) => x.kind === (def.at as { feature: string }).feature)[(def.at as { nth: number }).nth];
      if (f) spot = { x: f.x, z: f.z, r: f.r };
    } else {
      const { near, as } = def.at;
      const [cx, cz] = ((p) => [p.x, p.z])(toWorld(region, near));
      if (as === 'clearing') {
        const roomy = (x: number, z: number): boolean => {
          const h = ground(x, z);
          if (posts.some((p) => Math.hypot(p.at.x - x, p.at.z - z) < MAZE_HALF + 4) || !base.clear(x, z)) return false;
          for (let a = -MAZE_HALF - 2; a <= MAZE_HALF + 2; a += 4) for (let b = -MAZE_HALF - 2; b <= MAZE_HALF + 2; b += 4) if (base.solid(x + a, z + b) || Math.abs(ground(x + a, z + b) - h) > 2.2) return false;
          return true;
        };
        const at = nearest(region, cx, cz, roomy);
        if (at) spot = { ...at, r: MAZE_HALF };
      } else {
        const at = nearest(region, cx, cz, (x, z) => (as === 'shore' ? shoreAt(x, z) : cliffAt(x, z)) && base.clear(x, z), as === 'shore' ? 4 : 30);
        if (at) spot = { ...at, r: 14 };
      }
    }
    if (!spot) continue;
    const maze = def.maze ? mazeProps(spot.x, spot.z, rng) : undefined;
    if (maze) plan.props.push(...maze.props);
    for (const [kind, n] of def.dress ?? []) {
      for (let k = 0, tries = 0; k < n && tries < n * 12; tries++) {
        const [a, d] = [rng() * 6.2832, 2 + rng() * Math.max(2, spot.r * 0.8)];
        const [x, z] = [spot.x + Math.sin(a) * d, spot.z + Math.cos(a) * d];
        if (!base.clear(x, z) || posts.some((p) => Math.hypot(p.at.x - x, p.at.z - z) < 3)) continue;
        plan.props.push(makeProp(kind, x, z, rng));
        k++;
      }
    }
    found.push({ def, x: spot.x, z: spot.z, r: spot.r, rng, maze });
  }
  const set = groundOf(region, [...props, ...plan.props]); // with what was just raised in it
  for (const { def, x, z, r, rng, maze } of found) {
    let chest: XZ | null = null;
    if (def.hoard) {
      const tries = maze ? [maze.cell(CELLS >> 1, CELLS >> 1), maze.cell(CELLS >> 1, (CELLS >> 1) + 1), maze.cell((CELLS >> 1) + 1, CELLS >> 1)] : [{ x, z }, ...Array.from({ length: 30 }, (_, k) => ({ x: x + Math.sin(k * 1.9) * (1.5 + (k % 5) * r * 0.1), z: z + Math.cos(k * 1.9) * (1.5 + (k % 5) * r * 0.1) }))];
      chest = tries.find((p) => set.clear(p.x, p.z)) ?? null;
    }
    plan.sites.push({ def, x, z, r, chest });
    const foes = def.foes;
    if (!foes) continue;
    const cells = maze ? Array.from({ length: CELLS * CELLS }, (_, k) => maze.cell(k % CELLS, Math.floor(k / CELLS))).filter((p) => Math.hypot(p.x - x, p.z - (z - MAZE_HALF)) > 6) : null;
    for (let k = 0, tries = 0, placed = 0; placed < foes.n && tries < foes.n * 40; tries++, k++) {
      let id = foes.ids[Math.floor(rng() * foes.ids.length)];
      for (let t = 0; early(x, z) && !gentle(id) && t < 6; t++) id = foes.ids[Math.floor(rng() * foes.ids.length)];
      if (!getEntity(id) || (early(x, z) && !gentle(id))) continue;
      const a = rng() * 6.2832;
      const at = cells ? cells[Math.floor(rng() * cells.length)] : { x: x + Math.sin(a) * (2.5 + rng() * Math.max(2.5, r * 0.7)), z: z + Math.cos(a) * (2.5 + rng() * Math.max(2.5, r * 0.7)) };
      if (!set.clear(at.x, at.z) || plan.spawns.some((s) => Math.hypot(s.at.x - at.x, s.at.z - at.z) < 1.6) || posts.some((s) => Math.hypot(s.at.x - at.x, s.at.z - at.z) < 1.6) || (chest && Math.hypot(chest.x - at.x, chest.z - at.z) < 1.5)) continue;
      plan.spawns.push({ id: `poi:${def.id}:${placed}`, entity: id, region: region.id, at: { x: at.x, z: at.z, yaw: a }, unique: false });
      placed++;
    }
  }
  return plan;
}
