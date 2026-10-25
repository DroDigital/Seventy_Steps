/**
 * What is under a foot (round 78): the ground the investigator walks on, named as the picture draws it, so the prints it keeps
 * (render/footprints.ts) and the sound of the step (render/audio/footing.ts) say the same thing. The sea's shallows; a dungeon
 * room's floor by its kit; the floor an open arena lays; a road; else the region's ground, with the biome's patches laid over it
 * where the ground shader lays them (shaders/world.ts: the same noise, ported). `render/audio/foley.ts surfaceAt` is left as it
 * was (four surfaces, pinned by tests/samples.test.ts); this is the finer reading. Pure.
 */

import type { GroundTexture } from '../data/regions';
import { WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import { chunkContent } from './chunks';
import { groundMark } from './arenaGround';
import { kitOfRoom } from './dungeonKit';
import { worldLayout } from './placements';
import { segmentDistance } from './roads';
import { dungeonRoomAt } from './terrain';
import { chunkOf, regionAt } from './worldMap';

/** Every ground a step may land on: the region textures (a region's 'water' texture is a solid ground drawn as water, and reads as slab; 'water' here is the sea's shallows), a road, and the boards and cobbles of the dungeons. */
export type GroundKind = GroundTexture | 'road' | 'boards' | 'cobble';

const OF_KIT: Record<string, GroundKind> = { wood: 'boards', mud: 'mud', cobble: 'cobble', flesh: 'flesh', rot: 'rot', brick: 'cobble', shingle: 'gravel', rock: 'stone', slab: 'slab', stone: 'stone' };
const OF_TEXTURE: Record<string, GroundKind> = { grass: 'grass', mud: 'mud', sand: 'sand', snow: 'snow', dirt: 'dirt', gravel: 'gravel', leaves: 'leaves', flesh: 'flesh', rot: 'rot', slab: 'slab', stone: 'stone', water: 'slab' };

/** The hash and value noise of the ground shader (shaders/common.ts NOISE_GLSL), in the same arithmetic. */
const fract = (v: number): number => v - Math.floor(v);
function hash12(px: number, py: number): number {
  let [qx, qy, qz] = [fract(px * 0.1031), fract(py * 0.1031), fract(px * 0.1031)];
  const d = qx * (qy + 33.33) + qy * (qz + 33.33) + qz * (qx + 33.33);
  [qx, qy, qz] = [qx + d, qy + d, qz + d];
  return fract((qx + qy) * qz);
}
function vnoise(x: number, y: number): number {
  const [ix, iy] = [Math.floor(x), Math.floor(y)];
  const [fx, fy] = [x - ix, y - iy];
  const [ux, uy] = [fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)];
  const top = hash12(ix, iy) + (hash12(ix + 1, iy) - hash12(ix, iy)) * ux;
  const bottom = hash12(ix, iy + 1) + (hash12(ix + 1, iy + 1) - hash12(ix, iy + 1)) * ux;
  return top + (bottom - top) * uy;
}

/** Where the patch ground (the biome's `patch`) lies over the land: the shader's `pn` is past the middle of its smoothstep (uPatch 0.54 + 0.08). */
export function patchAt(x: number, z: number): boolean {
  const pn = 0.5 * vnoise(x * 0.045 + 17, z * 0.045 + 17) + 0.3 * vnoise(x * 0.13 + 3, z * 0.13 + 3) + 0.2 * vnoise(x * 0.5, z * 0.5);
  return pn > 0.58;
}

/** The ground at (x, y, z); a game with no open world (the arena's) is stone. */
export function groundAt(g: Game, x: number, y: number, z: number): GroundKind {
  if (!g.overworld) return 'stone';
  if (y < WORLD.seaLevel - 0.05) return 'water';
  const room = dungeonRoomAt(x, z);
  if (room) return OF_KIT[kitOfRoom(room.layout, room.room).floor] ?? 'slab';
  const [cx, cz] = [chunkOf(x), chunkOf(z)];
  if (worldLayout().chunk(cx, cz).dungeons.some(({ rect: r }) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1)) return 'slab'; // (the dungeon's footprint beyond its rooms: stone, as surfaceAt)
  if (chunkContent(cx, cz).roads.some((s) => segmentDistance(x, z, s.a, s.b) < s.width / 2)) return 'road';
  for (const a of worldLayout().arenas) { // an open arena's floor lies over the land's in the road's slot (arenaGround.ts)
    if (!a.ground || Math.abs(x - a.x) > a.radius + 12 || Math.abs(z - a.z) > a.radius + 12) continue;
    const m = groundMark({ x: a.x, z: a.z, radius: a.radius, front: a.front, spec: a.ground }, x, z);
    if (m && m.share >= 0.5) return OF_TEXTURE[a.ground.texture] ?? 'slab';
  }
  const region = regionAt(x, z);
  if (!region) return 'water';
  const { texture, patch } = region.biome;
  return OF_TEXTURE[patch && patchAt(x, z) ? patch : texture] ?? 'dirt';
}
