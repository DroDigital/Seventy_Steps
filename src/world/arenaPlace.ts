/**
 * An arena in the open (spec §3D): its ring (standing stones, or its style's pieces: round 13), the
 * well at its heart, its dressing, and its bosses' spawns about the centre. Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { hash2 } from '../core/rng';
import { ARENA_HOUSES } from '../data/arenaHousesAll';
import { ARENA_SETS } from '../data/arenaSetsAll';
import { arenaStyle } from '../data/arenaStyles';
import type { RegionDef } from '../data/regions';
import type { ArenaSite } from '../data/sites';
import { WORLD } from '../data/tuning';
import { arenaProps, reach } from './arenaDecor';
import { within } from './enclosure';
import { courtLand, enclosureLand, gateReach, hasOutline, planEnclosure } from './enclosurePlan';
import { frontOf } from './arenaFront';
import { arenaSet } from './arenaSet';
import type { Collider } from './colliders';
import { landHeight } from './land';
import type { SpawnPoint, WorldLayout } from './placements';
import { propColliders, type Prop } from './props';
import type { Pad } from './sitePads';

/** A dressing prop's collider into the world (fires have none). */
export function propCollide(p: Prop, collide: (c: Collider) => void): void {
  for (const c of propColliders(p)) collide(c);
}

/** The level ground an arena without a house asks of the land: beyond its ring, fading out over `blend`. */
const PLAIN = { beyond: 8, blend: 14 } as const;

/** An arena: its ring of standing stones, the well at its heart, its house, and its bosses. `pad` lays the level ground it asks of the land (before anything else is stood on it). */
export function placeArena(w: WorldLayout, region: RegionDef, p: XZ, a: ArenaSite, collide: (c: Collider) => void, spawn: (s: SpawnPoint) => void, pad: (p: Pad) => void): void {
  const y = landHeight(p.x, p.z); // the level of its ground: the land at the fight's centre
  const style = arenaStyle(a.bosses[0]);
  const set = ARENA_SETS[a.bosses[0]]; // round 61: a horror with a set of its own has it, in the place of its style's ring and heart
  const spec = ARENA_HOUSES[a.bosses[0]!]; // round 63: a horror with a house has the wall about it, and the dressing of its court is kept within
  const site = { x: p.x, z: p.z, y, radius: a.radius };
  const front = frontOf(w.signs, region.id, p.x, p.z, (f) => !spec || (courtLand(region.id, p.x, p.z, a.radius, f, gateReach(spec)) && (!hasOutline(spec) || enclosureLand(region.id, planEnclosure(spec, a.bosses[0]!, { ...site, front: f }))))); // (the gate faces the Elder Sign, unless there is no land there to lay its court on, or its walls)
  const ring = a.radius + 1.5;
  const n = !set && style.ring === 'stones' ? Math.max(6, Math.round((2 * Math.PI * ring) / 5.5)) : 0; // other rings are props (arenaDecor.ts)
  const house = spec ? planEnclosure(spec, a.bosses[0]!, { ...site, front }) : undefined;
  pad(house ? house.pad(y, PLAIN.blend) : { kind: 'circle', x: p.x, z: p.z, radius: PLAIN.beyond + a.radius, blend: PLAIN.blend, level: y });
  for (const under of house?.under?.(y) ?? []) pad(under); // (a river's bed, sunk below the level it is laid in)
  const decor = set ? arenaSet(set, { x: p.x, z: p.z, y, radius: a.radius, front, well: !!a.well }, house && ((d) => !within(house, d, reach(d)))) : arenaProps(style, p.x, p.z, y, a.radius, !!a.well);
  if (house) {
    decor.push(...house.props);
    w.pieces.push(house.piece);
  }
  for (const d of decor) propCollide(d, collide);
  const stones = Array.from({ length: n }, (_, k) => {
    const t = (k / n) * Math.PI * 2;
    return { x: p.x + Math.cos(t) * ring, z: p.z + Math.sin(t) * ring, radius: 0.7, height: 2.5 + 3 * hash2(k, n, WORLD.seed) };
  });
  for (const s of stones) collide({ kind: 'cylinder', x: s.x, z: s.z, radius: s.radius, y0: y - 0.3, y1: y + s.height });
  if (a.well) collide({ kind: 'cylinder', x: p.x, z: p.z, radius: 2.75, y0: y - 12, y1: y + 0.9 });
  w.arenas.push({ region: region.id, x: p.x, z: p.z, y, radius: a.radius, well: !!a.well, bosses: a.bosses, stones, decor, front, ground: set?.ground, air: set?.air, candle: set?.candle, house });
  const spread = Math.min(8, a.radius / 3);
  a.bosses.forEach((id, k) => {
    const dx = (k - (a.bosses.length - 1) / 2) * spread;
    const at = { x: p.x + dx, z: p.z + (a.well ? a.radius / 2 : 0), yaw: Math.PI };
    spawn({ id: `boss:${id}`, entity: id, variant: a.variant, region: region.id, at, unique: true, arena: { x: p.x, z: p.z, radius: a.radius } });
  });
}
