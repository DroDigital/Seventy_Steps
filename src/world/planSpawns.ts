/**
 * Where a region's foes stand (spec §3D): around the fires of its camps, among ruins, groves, stone
 * circles and graveyards, guarding every dungeon door and the approach to every boss's ring, in
 * pairs along its roads, wandering its towns' streets, and a thin scatter over open ground. Never
 * near an Elder Sign or a gate, inside a site, in a prop, or walled in. Pure.
 */

import type { XZ } from '../core/geom';
import type { Rng } from '../core/rng';
import type { RegionDef } from '../data/regions';
import { bodyOf } from '../data/bodies';
import { getEntity } from '../data/registry';
import { START_SIGN } from '../data/sites';
import { WORLD } from '../data/tuning';
import { toBoxFrame, type Collider } from './colliders';
import { colliderGrid } from './colliderGrid';
import { escapes } from './escape';
import { houseSolids } from './houseAddons';
import type { Feature } from './features';
import { worldLayout, type SpawnPoint } from './placements';
import { propColliders, propWalls, type Prop } from './props';
import type { Road } from './roads';
import { padDistance } from './sitePads';
import { DIRS, regionRect } from './worldMap';
import { MOUND_BAND } from './dungeonParts';

const SAFE = WORLD.signClear; // metres of peace around every Elder Sign and gate
export const FIRST_HOUR = 140; // metres about the first Elder Sign where only the gentlest foes stand: a first fight is learned on a rat or a corpse, not on what cannot be seen
/** A foe for a first fight: of the lesser kind, hitting for little, and in plain sight, on its feet. */
export const gentle = (id: string): boolean => {
  const d = getEntity(id);
  return !!d && d.tier === 'lesser' && d.stats.damage <= 14 && !['invisible_stalker', 'ambusher', 'burrower', 'mind_thief', 'caster', 'hover_ranged'].includes(d.behavior.archetype);
};
const PATROL = 95; // metres of road between patrols
const MARGIN = 0.8; // metres a foe keeps from a prop's collider
const BODY_CLEAR = 0.3; // metres a foe's own body keeps clear of a wall beyond its radius (round 110: a dhole placed a metre from a wall stood half in it)
const INDEX = 3; // the widest margin asked of any foe: colliders are filed this far about their bounds, so the search finds each one a body could touch

/** The margin a body of radius `r` keeps from a prop's collider: the fixed one, or its own radius and a little more where that is wider. */
const marginOf = (r: number): number => Math.min(INDEX, Math.max(MARGIN, r + BODY_CLEAR));

/** The capsule radius of a foe's body, by its entity (0 for an id that is no entity). */
export function radiusOf(id: string): number {
  const d = getEntity(id);
  return d ? bodyOf(d).radius : 0;
}

/** A weighted pick from a spawn table. */
function pick(table: Readonly<Record<string, number>>, roll: number): string | undefined {
  const entries = Object.entries(table);
  let r = roll * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) if ((r -= w) < 0) return k;
  return entries.at(-1)?.[0];
}

/**
 * The solids of some colliders, filed in 8 m cells: a point is solid when it lies within a margin of one (`margin` of a body's radius `r`).
 * `filed` is how far past a collider's bounds it is filed under cells: the planner's own acceptance files under MARGIN, as it always did (round 12),
 * which misses the corner of a turned box that lies past the bounds' circle; keeping that keeps the plan's stream as it was. settleSpawns files
 * under INDEX and so finds that corner.
 */
type Solid = (x: number, z: number, r?: number) => boolean;
function solidsOf(colliders: readonly Collider[], margin: (r: number) => number, filed: number): Solid {
  const near = colliderGrid(colliders, 8, filed); // colliders by 8 m cell, each filed `filed` metres past its bounds
  return (x, z, r = 0) => {
    const m = margin(r);
    return near(x, z).some((c) => {
      if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) < c.radius + m;
      if (c.kind === 'obox') {
        const l = toBoxFrame(c, x, z);
        return Math.abs(l.x) < c.hx + m && Math.abs(l.z) < c.hz + m;
      }
      return false;
    });
  };
}

/**
 * Where a foe or a chest may stand in a region: clear of every Elder Sign and gate, site, mound and prop, and not shut in (round 61: shared with the points of interest, world/poiPlan.ts).
 * Two tests (round 110). `clear` and `solid` are the plan's own, as they were before round 110 (a house's walls alone, the fixed margin), so a post is taken or
 * refused as it was and the plan's random stream does not move. `settled(x, z, r)` is the true one for a body of radius `r`: a house's wing, bay and porch
 * posts too, and the margin the body needs. settleSpawns applies it once the plan is whole.
 */
export function groundOf(region: RegionDef, props: readonly Prop[]): { clear: (x: number, z: number) => boolean; solid: (x: number, z: number) => boolean; settled: (x: number, z: number, r: number) => boolean; beyond: (x: number, z: number) => boolean } {
  const w = worldLayout();
  const rect = regionRect(region);
  const safe = [...w.signs.filter((s) => s.region === region.id).map((s) => s.rest), ...w.gates.filter((g) => g.region === region.id).map((g) => g.arrive)];
  const dressing = w.arenas.filter((a) => a.region === region.id).flatMap((a) => a.decor); // and an arena's dressing (round 13)
  const walls = solidsOf([...props, ...dressing].flatMap((p) => propWalls(p)), () => MARGIN, MARGIN);
  const full = solidsOf([...props, ...dressing].flatMap((p) => propColliders(p)), marginOf, INDEX);
  const beyond = solidsOf([...props, ...dressing].flatMap((p) => (p.kind === 'house' ? houseSolids(p) : [])), () => MARGIN, MARGIN); // a house's wing, bay and porch posts (round 110): not where a chest or flask is set (round 112)
  const ground = (x: number, z: number, solid: Solid, r: number): boolean =>
    x > rect.x0 + 6 && x < rect.x1 - 6 && z > rect.z0 + 6 && z < rect.z1 - 6 &&
    safe.every((p) => Math.hypot(p.x - x, p.z - z) >= SAFE) &&
    w.pads.every((p) => padDistance(p, x, z) > (p.kind === 'rect' ? 3 + MOUND_BAND : 1)) && // clear of a mound heaped over a dungeon (round 13)
    !solid(x, z, r) &&
    escapes((a, b) => solid(a, b, r), x, z); // and not shut in by walls: a foe inside a ring of ruin walls could not come out, nor the investigator in (round 49)
  return {
    clear: (x, z) => ground(x, z, walls, 0),
    solid: (x, z) => walls(x, z, 0),
    settled: (x, z, r) => ground(x, z, full, r),
    beyond: (x, z) => beyond(x, z),
  };
}

const SPOT_REACH = 10; // metres a foe may be moved to clear of a wall (round 110)
/** The nearest point about `at` that `fits`: rings of half a metre out, sixteen ways about each (no draw from the stream). */
function nearestFit(at: XZ, fits: (x: number, z: number) => boolean): XZ | undefined {
  for (let d = 0.5; d <= SPOT_REACH; d += 0.5) for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const x = at.x + Math.sin(a) * d;
    const z = at.z + Math.cos(a) * d;
    if (fits(x, z)) return { x, z };
  }
  return undefined;
}

/**
 * Moves each foe that stands in a wall, or nearer one than its own body allows, to the nearest place it may stand; one with no such place within
 * SPOT_REACH is left out (round 110: a troglodyte stood half in a house's wing). Every other foe keeps its id, its kind and its place, and nothing is
 * drawn from the plan's stream, so the points of interest, the balance model's foes and the kills saved by id stay as they were. Mutates `spawns`.
 */
export function settleSpawns(region: RegionDef, props: readonly Prop[], spawns: SpawnPoint[]): void {
  const { settled } = groundOf(region, props);
  const start = worldLayout().signs.find((s) => s.id === START_SIGN);
  const early = (x: number, z: number): boolean => !!start && Math.hypot(start.x - x, start.z - z) < FIRST_HOUR;
  for (let i = spawns.length - 1; i >= 0; i--) {
    const s = spawns[i]!;
    const r = radiusOf(s.entity);
    const fits = (x: number, z: number): boolean => settled(x, z, r) && (!early(x, z) || gentle(s.entity));
    if (fits(s.at.x, s.at.z)) continue;
    const spot = nearestFit(s.at, fits);
    if (spot) {
      s.at.x = spot.x;
      s.at.z = spot.z;
    } else spawns.splice(i, 1);
  }
}

export function planSpawns(region: RegionDef, features: readonly Feature[], roads: readonly Road[], towns: readonly (XZ & { radius: number })[], props: readonly Prop[], rng: Rng): SpawnPoint[] {
  const table = region.spawns.table;
  if (Object.keys(table).length === 0) return [];
  const w = worldLayout();
  const rect = regionRect(region);
  const { clear } = groundOf(region, props);
  const out: SpawnPoint[] = [];
  const start = w.signs.find((s) => s.id === START_SIGN);
  const early = (x: number, z: number): boolean => !!start && Math.hypot(start.x - x, start.z - z) < FIRST_HOUR;
  const post = (x: number, z: number, yaw: number): boolean => {
    let entity = pick(table, rng());
    for (let k = 0; entity && early(x, z) && !gentle(entity) && k < 6; k++) entity = pick(table, rng()); // (round 46: the first hour's foes are the gentle ones)
    if (!entity || !clear(x, z) || (early(x, z) && !gentle(entity))) return false;
    out.push({ id: `p:${region.id}:${out.length}`, entity, region: region.id, at: { x, z, yaw }, unique: false });
    return true;
  };
  /** `n` foes around (cx, cz), between r0 and r1 metres out, facing outward. */
  const group = (cx: number, cz: number, n: number, r0: number, r1: number): void => {
    for (let k = 0, tries = 0; k < n && tries < n * 8; tries++) {
      const a = rng() * Math.PI * 2;
      const d = r0 + (r1 - r0) * rng();
      if (post(cx + Math.sin(a) * d, cz + Math.cos(a) * d, a)) k++;
    }
  };

  for (const f of features) {
    const chance = { camp: 1, ruin: 0.55, grove: 0.45, circle: 0.5, graveyard: 0.6, outcrop: 0.25, landmark: 0.4 }[f.kind];
    if (rng() >= chance) continue;
    const n = f.kind === 'camp' ? 3 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 2);
    group(f.x, f.z, n, f.kind === 'camp' ? 3 : f.kind === 'landmark' ? 9 : 1.5, Math.max(f.kind === 'landmark' ? 12 : 3.5, f.r * 0.7)); // clear of a landmark's bulk
  }
  for (const d of w.dungeons) {
    if (d.layout.region !== region.id || d.layout.def.sealed) continue;
    const door = d.layout.doors.find((x) => x.b === null);
    if (!door) continue;
    const [ox, oz] = [door.x + DIRS[door.side].x * 10, door.z + DIRS[door.side].z * 10];
    group(ox, oz, d.layout.rooms.some((r) => r.def.boss) && d.layout.rooms.length <= 4 ? 3 : 2, 1, 5);
  }
  for (const a of w.arenas) if (a.region === region.id) group(a.x, a.z, 3 + Math.floor(rng() * 2), a.radius + 7, a.radius + 14);
  for (const road of roads) {
    if (road.street) continue;
    let run = PATROL * rng();
    for (let i = 1; i < road.pts.length; i++) {
      const [a, b] = [road.pts[i - 1], road.pts[i]];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      run += len;
      if (run < PATROL) continue;
      run = 0;
      const [nx, nz] = [-(b.z - a.z) / len, (b.x - a.x) / len];
      const side = rng() < 0.5 ? 1 : -1;
      const off = road.width / 2 + 2;
      const yaw = Math.atan2(b.x - a.x, b.z - a.z);
      post(a.x + nx * side * off, a.z + nz * side * off, yaw);
      post(a.x + nx * side * (off + 1.5) + (b.x - a.x) * 0.15, a.z + nz * side * (off + 1.5) + (b.z - a.z) * 0.15, yaw);
    }
  }
  for (const t of towns) group(t.x, t.z, 3 + Math.floor(t.radius / 25), 10, t.radius * 0.9);
  const chunks = ((rect.x1 - rect.x0) * (rect.z1 - rect.z0)) / (WORLD.chunk * WORLD.chunk);
  const scatter = Math.round(chunks * region.spawns.density * 0.45);
  for (let k = 0; k < scatter; k++) post(rect.x0 + rng() * (rect.x1 - rect.x0), rect.z0 + rng() * (rect.z1 - rect.z0), rng() * Math.PI * 2);
  return out;
}
