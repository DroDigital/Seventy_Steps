/**
 * What the world editor can take hold of about a point (round 110, development builds only): the
 * props of the region plans, the arenas' and dungeons' dressing, the foes' posts and the sites of
 * data/sites.ts; each with the key its edit is known by, the box it is picked and drawn by, and a
 * ray's hit on that box. Pure: no Three.js.
 */

import type { Dir } from '../data/dungeons';
import { NOTE_SITES } from '../data/documents';
import { REGIONS, type RegionDef } from '../data/regions';
import { SITES, type At } from '../data/sites';
import { WORLD } from '../data/tuning';
import { chunkContent } from '../world/chunks';
import { addedFoeId, propKey } from '../world/edits/editFile';
import { originOf, siteAt, siteFace, type PropOrigin } from '../world/edits/editApply';
import type { SiteKind, SiteRef } from '../world/edits/editTypes';
import { worldLayout, type SpawnPoint } from '../world/placements';
import type { Prop } from '../world/props';
import { surface } from '../world/terrain';
import { chunkOf, regionRect, toWorld } from '../world/worldMap';

export type Item =
  | { type: 'prop'; key: string; group: string; region: string; prop: Prop; origin: PropOrigin }
  | { type: 'foe'; key: string; spawn: SpawnPoint }
  | { type: 'site'; key: string; ref: SiteRef; x: number; y: number; z: number; face?: Dir; at: At };

/** A box about an item: its foot's centre, turn, half extents and height. */
export interface Box {
  x: number;
  y: number;
  z: number;
  yaw: number;
  hx: number;
  hz: number;
  h: number;
}

export const originKey = (o: PropOrigin): string => ('add' in o ? `add|${o.add}` : propKey(o.ref));

const foeKey = (s: SpawnPoint): string => (s.id.startsWith(addedFoeId('')) ? `add|${s.id.slice(addedFoeId('').length)}` : `spawn|${s.id}`);

const regionById = new Map(REGIONS.map((r) => [r.id, r]));

/** Every site of data/sites.ts (and the notes of data/documents.ts) where it stands now. */
function sites(): Item[] {
  const out: Item[] = [];
  for (const [region, s] of Object.entries(SITES)) {
    const def = regionById.get(region);
    if (!def) continue;
    const one = (site: SiteKind, id: string, at0: At, face0?: Dir): void => {
      const at = siteAt(site, region, id, at0);
      const p = toWorld(def, at);
      out.push({ type: 'site', key: `site|${site}|${region}|${id}`, ref: { site, region, id }, x: p.x, y: surface(p.x, p.z), z: p.z, at, ...(face0 && { face: siteFace(site, region, id, face0) }) });
    };
    for (const x of s.signs) one('sign', x.id, x.at, x.face);
    for (const x of s.gates) one('gate', x.id, x.at, x.face);
    for (const x of s.tomes) one('tome', x.name, x.at);
    for (const [name, x, z] of NOTE_SITES[region] ?? []) one('tome', name, [x, z]);
    for (const x of s.allies) one('ally', x.id, x.at);
    for (const x of s.arenas) one('arena', x.bosses[0]!, x.at);
    for (const x of s.dungeons) one('dungeon', x.id, x.at);
  }
  return out;
}

const ALLY_SITES = new Set(Object.values(SITES).flatMap((s) => s.allies.map((a) => `ally:${a.id}`)));

/** What stands within `radius` of (x, z). */
export function itemsAbout(x: number, z: number, radius: number): Item[] {
  const out: Item[] = [];
  const near = (px: number, pz: number, r = 0): boolean => Math.hypot(px - x, pz - z) <= radius + r;
  const n = Math.ceil(radius / WORLD.chunk);
  for (let cx = chunkOf(x) - n; cx <= chunkOf(x) + n; cx++) {
    for (let cz = chunkOf(z) - n; cz <= chunkOf(z) + n; cz++) {
      const c = chunkContent(cx, cz);
      if (c.region) {
        const group = `region:${c.region.id}`;
        for (const p of c.props) if (near(p.x, p.z)) out.push(propItem(group, c.region.id, p));
      }
      for (const s of c.spawns) if (near(s.at.x, s.at.z) && !ALLY_SITES.has(s.id)) out.push({ type: 'foe', key: foeKey(s), spawn: s });
    }
  }
  const w = worldLayout();
  for (const a of w.arenas) if (near(a.x, a.z, a.radius + 40)) for (const p of a.decor) if (near(p.x, p.z)) out.push(propItem(`arena:${a.bosses[0]}`, a.region, p));
  for (const d of w.dungeons) for (const p of d.decor) if (near(p.x, p.z)) out.push(propItem(`dungeon:${d.layout.def.id}`, d.layout.region, p));
  for (const s of sites()) if (s.type === 'site' && near(s.x, s.z)) out.push(s);
  return out;
}

const propItem = (group: string, region: string, p: Prop): Item => {
  const origin = originOf(group, p);
  return { type: 'prop', key: originKey(origin), group, region, prop: p, origin };
};

/** The region a point lies in, if any. */
export function regionAt(x: number, z: number): RegionDef | undefined {
  return REGIONS.find((r) => {
    const rc = regionRect(r);
    return x >= rc.x0 && x < rc.x1 && z >= rc.z0 && z < rc.z1;
  });
}

/** The box an item is picked and drawn by. */
export function boxOf(it: Item): Box {
  if (it.type === 'foe') return { x: it.spawn.at.x, y: surface(it.spawn.at.x, it.spawn.at.z), z: it.spawn.at.z, yaw: it.spawn.at.yaw, hx: 0.5, hz: 0.5, h: 2 };
  if (it.type === 'site') return { x: it.x, y: it.y, z: it.z, yaw: 0, hx: 1.6, hz: 1.6, h: 3.2 };
  const p = it.prop;
  const round = p.set ? !!p.set.round : p.d === 0;
  const [hx, hz] = round ? [Math.max(p.w, p.d), Math.max(p.w, p.d)] : [p.w, p.d];
  if (p.kind === 'globe') return { x: p.x, y: p.y + p.h - p.w, z: p.z, yaw: p.yaw, hx: p.w, hz: p.w, h: 2 * p.w };
  const h = p.kind === 'house' ? p.h + p.w * 0.6 : p.h;
  return { x: p.x, y: p.y, z: p.z, yaw: p.yaw, hx: Math.max(0.15, hx), hz: Math.max(0.15, hz), h: Math.max(0.2, h) };
}

/** Where along a ray (from `o`, along the unit `d`) it meets `b`, or null. Turned as three.js turns about y. */
export function hitBox(o: readonly [number, number, number], d: readonly [number, number, number], b: Box): number | null {
  const [c, s] = [Math.cos(b.yaw), Math.sin(b.yaw)];
  const [ox, oz] = [o[0] - b.x, o[2] - b.z];
  const lo = [ox * c - oz * s, o[1] - b.y, ox * s + oz * c];
  const ld = [d[0] * c - d[2] * s, d[1], d[0] * s + d[2] * c];
  const [min, max] = [[-b.hx, 0, -b.hz], [b.hx, b.h, b.hz]];
  let [t0, t1] = [-Infinity, Infinity];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(ld[i]!) < 1e-9) {
      if (lo[i]! < min[i]! || lo[i]! > max[i]!) return null;
      continue;
    }
    let [a, e] = [(min[i]! - lo[i]!) / ld[i]!, (max[i]! - lo[i]!) / ld[i]!];
    if (a > e) [a, e] = [e, a];
    [t0, t1] = [Math.max(t0, a), Math.min(t1, e)];
    if (t0 > t1) return null;
  }
  if (t1 < 0) return null;
  return Math.max(0, t0);
}

/** The nearest item a ray meets (a small one before the large one it stands in, when the two are met at once). */
export function pick(items: readonly Item[], o: readonly [number, number, number], d: readonly [number, number, number]): Item | null {
  let best: { it: Item; t: number } | null = null;
  for (const it of items) {
    const b = boxOf(it);
    const t = hitBox(o, d, b);
    if (t === null) continue;
    const tt = t + Math.min(b.hx, b.hz) * 0.25; // (a lamp before the house wall it stands against)
    if (!best || tt < best.t) best = { it, t: tt };
  }
  return best?.it ?? null;
}

/** Where a ray first meets the ground (marched, then halved), within `far` metres; null if not. */
export function hitGround(o: readonly [number, number, number], d: readonly [number, number, number], far = 400): [number, number, number] | null {
  const above = (t: number): number => o[1] + d[1] * t - surface(o[0] + d[0] * t, o[2] + d[2] * t);
  let prev = 0;
  for (let t = 0.5; t <= far; t += Math.max(0.5, t * 0.04)) {
    if (above(t) > 0) {
      prev = t;
      continue;
    }
    let [a, b] = [prev, t];
    for (let i = 0; i < 20; i++) {
      const m = (a + b) / 2;
      if (above(m) > 0) a = m;
      else b = m;
    }
    return [o[0] + d[0] * b, surface(o[0] + d[0] * b, o[2] + d[2] * b), o[2] + d[2] * b];
  }
  return null;
}
