/**
 * A dungeon boss hall dressed as its own (round 108; data/hallLore.ts): the sigil in its floor (hallSigils.ts), what is built on its
 * walls and closes its far wall (hallWalls.ts) and what hangs under its roof (hallRoof.ts), each piece in its group: the kit's stone,
 * timber, relief on a wall or a beam, cloth, the floor's stone as relief, glow and glow as relief. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng, hash2 } from '../core/rng';
import { HALL_LORE } from '../data/hallLore';
import type { DungeonKit } from '../data/kits';
import type { DungeonLayout, RoomLayout } from '../world/dungeonKit';
import type { Dressed } from './dungeonDressing';
import { sigilPieces } from './hallSigils';
import { hallRoof } from './hallRoof';
import { hallWalls, type HallOut } from './hallWalls';
import { worldUv } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

type Origin = { x: number; z: number };
export type Spot = { x: number; z: number; r: number };

const finish = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  const flat = g.index ? g.toNonIndexed() : g;
  if (!flat.getAttribute('uv')) flat.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(flat.getAttribute('position').count * 2).fill(0), 2));
  return flat;
};

/** A boss hall's lore, if it has one (by its first boss). */
export const loreOf = (r: RoomLayout) => (r.def.boss ? HALL_LORE[r.def.boss[0]] : undefined);

/** The dressing of a boss hall that has a lore of its own; `floor` is its floor's colour, `avoid` the torches and the set's pieces. */
export function hallLore(d: DungeonLayout, r: RoomLayout, kit: DungeonKit, c: Rgb, at: Origin, avoid: readonly Spot[]): Dressed[] {
  const lore = loreOf(r);
  if (!lore) return [];
  const rng = createRng((hash2(Math.round(r.x), Math.round(r.z), 108) * 4294967296) >>> 0);
  const open = kit.roof === 'open';
  const out: HallOut = { wall: [], wood: [], beam: [], trim: [], glow: [], cloth: [], shine: [] };
  hallWalls(d, r, lore, c, open, avoid, out);
  hallRoof(r, lore, c, open, out, rng);
  const group = (kind: Dressed['kind'], geos: THREE.BufferGeometry[], uv = 2): Dressed[] => (geos.length ? [{ kind, kit, geo: mergeGeometries(geos.map((g) => worldUv(finish(g), at, uv))) }] : []);
  const sigil = sigilPieces(r, lore.sigil, lore.reach, scaleRgb(c, 0.9), lore.glow).map((p) => ({ kind: p.kind, kit, geo: worldUv(p.geo, at) }) as Dressed);
  return [
    ...group('wall', out.wall), ...group('wood', out.wood, 3), ...group('trim', out.trim), ...group('beam', out.beam, 4),
    ...group('glow', out.glow), ...group('cloth', out.cloth), ...group('shine', out.shine), ...sigil,
  ];
}
