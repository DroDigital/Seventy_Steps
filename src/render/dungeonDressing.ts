/**
 * A dungeon's dressing (round 30: "improve the dungeon designs drastically"): over the bare rooms,
 * vaulting ribs (or joists) under every roof, furniture of the kit along the halls' walls
 * (dungeonFurniture.ts), things strewn on their floors, and braziers in their far corners. Placed clear
 * of doorways, torches, and what stands in a room (its sign, gate, tomes, pillars, and the corners and
 * bays a plan fills in: world/roomStyle.ts). Round 31: the floors' carpets and inlays are no longer
 * laid here, the same border, runner and three rings in every hall (the playtest's "the same inlay ring
 * in every room"); each room's plan lays its own (world/roomStyle.ts, drawn by siteMeshes.ts).
 * Deterministic from where each room is. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng, hash2 } from '../core/rng';
import { KITS, type DungeonKit, type KitId } from '../data/kits';
import { DUNGEON } from '../data/tuning';
import { kitIdOfRoom, roomPoint, type DungeonLayout, type RoomLayout } from '../world/dungeonKit';
import { standing } from '../world/dungeonParts';
import { isAbyss } from '../world/abyssStair';
import { stairNewels } from './stairNewels';
import { baysOf, cornersOf, pillarsOf, roomStyle } from '../world/roomStyle';
import { DIRS } from '../world/worldMap';
import { brazier, DEPTH, ITEMS, place, type Out } from './dungeonFurniture';
import { worldUv } from './meshKit';
import type { Rgb } from './palette';
import type { Prop } from '../world/props';
import { roomLook } from './dungeonLook';
import { roofDress } from './dungeonRoofs';
import { frieze } from './dungeonFriezes';
import { hallLore, loreOf, type Spot } from './hallLore';
import { wallOf } from './roomWalls';
import type { LightSpot } from './worldLights';

export type Dressed = { kind: 'wall' | 'wood' | 'trim' | 'beam' | 'glow' | 'cloth' | 'shine' | 'carve'; kit: DungeonKit; geo?: THREE.BufferGeometry; light?: LightSpot }; // (a light alone has no geometry: round 87)
type Origin = { x: number; z: number };

const AWAY = { door: 2.8, torch: 1.5, spot: 2.2 }; // metres furniture keeps from a doorway, a torch, and what stands in a room

const finish = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  if (!g.index) g.setIndex([...Array(g.getAttribute('position').count).keys()]);
  return g;
};
const merged = (kind: Dressed['kind'], kit: DungeonKit, geos: THREE.BufferGeometry[]): Dressed[] => (geos.length ? [{ kind, kit, geo: mergeGeometries(geos.map(finish)) }] : []);

/** The geometry of one room's dressing by group, in its kit's textures. */
function grouped(kit: DungeonKit, out: Out, at: Origin): Dressed[] {
  const uv = (g: THREE.BufferGeometry, m = 2): THREE.BufferGeometry => worldUv(g, at, m);
  return [
    ...merged('wall', kit, out.wall.map((g) => uv(g))),
    ...merged('wood', kit, out.wood.map((g) => uv(g, 3))),
    ...merged('trim', kit, out.trim.map((g) => uv(g))),
    ...merged('beam', kit, out.beam.map((g) => uv(g, 4))),
    ...merged('glow', kit, out.glow),
    ...merged('shine', kit, out.shine),
  ];
}

/** A hall's furniture, debris and braziers (a boss's hall: none; its own style dresses it). */
function hall(d: DungeonLayout, r: RoomLayout, kitId: KitId, kit: DungeonKit, c: Rgb, torches: LightSpot[], out: Out): Dressed[] {
  const rng = createRng((hash2(Math.round(r.x), Math.round(r.z), 31) * 4294967296) >>> 0);
  if (r.def.boss) return []; // a boss's ground is dressed by its own style (arenaDecor.ts)
  const spots = standing(r);
  const plan = roomStyle(d, r);
  const pillars = pillarsOf(plan, r, spots); // what the room's plan stands in it: pillars, the corners filled solid, the bays along its walls
  const blocks = [...cornersOf(plan, r, spots), ...baysOf(plan, r)];
  const a = DIRS[r.axis];
  const stands = spots.map(([u, v]) => roomPoint(r, u, v));
  const doors = d.doors.filter((o) => o.a === r || o.b === r);
  const free = (x: number, z: number, margin: number): boolean => {
    const [dx, dz] = [x - r.x, z - r.z];
    const [u, v] = [dx * a.z - dz * a.x, dx * a.x + dz * a.z]; // in the room's own frame
    return (
      doors.every((o) => Math.hypot(o.x - x, o.z - z) > AWAY.door + margin) &&
      torches.every((t) => Math.hypot(t.x - x, t.z - z) > AWAY.torch + margin) &&
      stands.every((p) => Math.hypot(p.x - x, p.z - z) > AWAY.spot + margin) &&
      pillars.every(([pu, pv, rad]) => Math.hypot(pu - u, pv - v) > rad * 1.5 + 0.6 + margin) &&
      blocks.every(([u0, u1, v0, v1]) => !(u > u0 - 1.3 - margin && u < u1 + 1.3 + margin && v > v0 - 1.3 - margin && v < v1 + 1.3 + margin)) // (round 108: clear by the half of the widest thing, 1.2 m, or a face 5 cm into a bay fought it)
    );
  };
  const inner = r.half - DUNGEON.wall / 2;
  const list = roomLook(d, r).items ?? ITEMS[kitId]; // (round 108: its dungeon's own things)
  let turn = Math.floor(rng() * 4);
  for (const side of list.length ? (['u+', 'u-', 'v+', 'v-'] as const) : []) {
    const wall = wallOf(r, side, inner);
    for (let t = -inner + 2; t < inner - 1.5; t += (r.size === 3 ? 3.6 : 2.7) + rng() * 0.6) {
      const p = wall.at(t, DEPTH / 2);
      if (rng() < 0.12 || !free(p.x, p.z, 0)) continue;
      place(list[turn++ % list.length], { wall, s: t, y: r.level, c, rng, out });
    }
  }
  for (let k = 0; k < 5 && list.length; k++) { // small things strewn on the floor
    const [u, v] = [(rng() * 2 - 1) * (inner - 1.5), (rng() * 2 - 1) * (inner - 1.5)];
    const p = roomPoint(r, u, v);
    if (Math.hypot(u, v) < 2 || !free(p.x, p.z, 0)) continue;
    const frame = { at: (a: number, b: number) => ({ x: p.x + a, z: p.z + b }), alongX: true };
    place(list.includes('bones') && k % 2 ? 'bones' : 'rubble', { wall: frame, s: 0, y: r.level, c, rng, out });
  }
  const lit: Dressed[] = [];
  for (const su of kit.flames >= 0.3 ? [-1, 1] : []) { // braziers in the far corners
    const p = roomPoint(r, su * (inner - 1.1), inner - 1.1);
    if (!free(p.x, p.z, -1.2)) continue;
    const b = brazier(p.x, p.z, r.level);
    out.wall.push(...b.iron);
    lit.push({ kind: 'glow', kit, light: { ...b.at, kind: 'fire' } });
  }
  return lit;
}

/** What a boss hall's lore keeps clear of: its torches and the pieces of its set. */
function avoidIn(r: RoomLayout, torches: readonly LightSpot[], decor: readonly Prop[]): Spot[] {
  const near = (x: number, z: number): boolean => Math.abs(x - r.x) < r.half + 1 && Math.abs(z - r.z) < r.half + 1;
  return [
    ...torches.filter((t) => near(t.x, t.z)).map((t) => ({ x: t.x, z: t.z, r: 0.6 })),
    ...decor.filter((p) => near(p.x, p.z)).map((p) => ({ x: p.x, z: p.z, r: Math.max(p.w, p.d) / 2 })),
  ];
}

/** The dressing of every room of a dungeon (halls: furniture, debris, braziers, friezes; every roofed room: its ceiling's dressing; a boss hall: its lore). */
export function dressing(d: DungeonLayout, colour: (kit: DungeonKit) => Rgb, at: Origin, lights: LightSpot[], decor: readonly Prop[] = []): Dressed[] {
  const torches = lights.filter((l) => l.kind === 'torch');
  const result: Dressed[] = [];
  for (const r of d.rooms) {
    const out: Out = { wall: [], wood: [], beam: [], trim: [], glow: [], shine: [] };
    const kitId = kitIdOfRoom(d, r);
    const kit = KITS[kitId] as DungeonKit;
    const c = colour(kit);
    const look = roomLook(d, r);
    const lore = loreOf(r);
    const rng = createRng((hash2(Math.round(r.x), Math.round(r.z), 1080) * 4294967296) >>> 0);
    if (kit.roof !== 'open' && !lore?.roof.includes('dome')) roofDress(look.roof, r, kit, c, at, out, rng); // (round 108: as its dungeon dresses it; a domed hall's ribs are its dome's)
    if (r.def.kind === 'hall' && !r.def.boss && kit.roof !== 'open') frieze(look.frieze, d, r, c, out, rng);
    const lit = r.def.kind === 'hall' ? hall(d, r, kitId, kit, c, torches, out) : isAbyss(r) ? stairNewels(r, kit, c, at) : []; // (round 104: a flight over the void, its newels and their fires)
    result.push(...grouped(kit, out, at), ...lit, ...(lore ? hallLore(d, r, kit, c, at, avoidIn(r, torches, decor)) : []));
  }
  return result;
}
