/**
 * A chunk's terrain mesh (spec §2, §3D): a vertex-coloured grid over the world surface, one vertex
 * a metre so the lantern's vertex-lit pool stays round, textured and tinted by its region, with
 * holes where dungeon rooms lay their own floors, and its roads' texture blended in along them (a
 * per-vertex share, aSplat). Built a few rows at a time (a sliced job).
 */

import * as THREE from 'three';
import { fbm } from '../core/noise';
import { REGION_LAYOUTS, type RoadTexture } from '../data/regionFeatures';
import type { GroundTexture } from '../data/regions';
import { chunkContent } from '../world/chunks';
import { roadShare } from '../world/regionPlan';
import { GROUND_CONTACT } from '../data/fxTuning';
import { WORLD } from '../data/tuning';
import { groundMark, type ArenaGround } from '../world/arenaGround';
import { contactsNearChunkJob, markAt, type Contact } from '../world/groundContact';
import { worldLayout } from '../world/placements';
import { inDungeon, surface } from '../world/terrain';
import { edgeShare, neighbourOf } from '../world/regionBlend';
import { regionOfChunk, regionsNearChunk } from '../world/worldMap';
import type { TextureKind } from './textures';
import { createWorldMaterial } from './worldMaterial';

const TILE = 2; // metres per ground texture repeat: 32 px/m, the arena floor's and the pillars' density
const GAIN = 2; // textures average about half brightness; tints are doubled (as figures do) so the lantern pool reads
const ROWS_PER_STEP = 8;

const materials = new Map<string, THREE.ShaderMaterial>();
const ORGANIC = new Set<GroundTexture>(['rot', 'grass', 'mud', 'sand', 'snow', 'flesh', 'water', 'dirt', 'gravel', 'leaves']);

/**
 * One shared material per ground, road and patch texture: varied in world space, (organic ground)
 * bombed with a turned second sample so it never repeats, the road texture blended in along the roads,
 * and the biome's patch ground laid over it here and there, and the ground of the region beside it blended in toward their border (aEdge, round 55): its ground and its road
 * style cross-fade with this one's, and a patch of a different ground fades out.
 */
export interface Beside { texture: GroundTexture; road: RoadTexture; patch?: GroundTexture }

export function groundMaterial(texture: GroundTexture, road: RoadTexture | TextureKind = 'cobble', patch?: GroundTexture, beside?: Beside): THREE.ShaderMaterial {
  const roadBeside = beside && beside.road !== road ? beside.road : undefined; // a road meets another road's style at a border: the two cross-fade, as the ground does
  const fade = !!beside && beside.patch !== patch; // and a patch of another ground than the one beside fades out toward the border, so its edge is not cut there
  const key = `${texture}|${road}|${patch ?? ''}|${beside?.texture ?? ''}|${roadBeside ?? ''}|${fade ? 'fade' : ''}`;
  let m = materials.get(key);
  if (!m) materials.set(key, (m = createWorldMaterial({ texture, texture2: road, texture3: patch, texture4: beside?.texture, texture5: roadBeside, patchFade: fade, vertexColors: true, vary: 0.9, bomb: ORGANIC.has(texture), shore: true })));
  return m;
}

/** Builds the chunk's terrain; `done` receives the mesh, or null when it all lies under the sea. */
export function* terrainJob(cx: number, cz: number, done: (mesh: THREE.Mesh | null) => void): Generator<void, void> {
  const region = regionOfChunk(cx, cz) ?? regionsNearChunk(cx, cz, WORLD.coast)[0];
  if (!region) return done(null);
  const s = WORLD.meshCell;
  const n = WORLD.chunk / s;
  const w = n + 3; // a one-vertex border for the normals
  const [x0, z0] = [cx * WORLD.chunk, cz * WORLD.chunk];
  const h = new Float32Array(w * w);
  let top = -Infinity;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) top = Math.max(top, (h[j * w + i] = surface(x0 + (i - 1) * s, z0 + (j - 1) * s)));
    if (j % ROWS_PER_STEP === ROWS_PER_STEP - 1) yield;
  }
  if (top < WORLD.seaLevel - 0.5) return done(null);
  const count = (n + 1) * (n + 1);
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);
  const splat = new Float32Array(count);
  const edge = new Float32Array(count);
  const roads = chunkContent(cx, cz).roads;
  const beside = neighbourOf(cx, cz);
  const ownTint = region.biome.tint;
  let blended = false;
  const reachOf = (a: ArenaGround): number => a.radius + (a.spec.reach ?? 10);
  const arenas: ArenaGround[] = worldLayout().arenas.flatMap((a) => (a.ground && Math.hypot(a.x - (x0 + WORLD.chunk / 2), a.z - (z0 + WORLD.chunk / 2)) < reachOf({ ...a, front: a.front, spec: a.ground }) + WORLD.chunk * 0.71 ? [{ x: a.x, z: a.z, radius: a.radius, front: a.front, spec: a.ground }] : []));
  const floor = roads.length === 0 ? arenas[0]?.spec.texture : undefined; // a road crossing it keeps its own ground: the arena's colour only
  let contacts: Contact[] = []; // what stands on this ground: its foot is darkened and turned to earth (world/groundContact.ts)
  yield* contactsNearChunkJob(cx, cz, (c) => (contacts = c));
  const earth = GROUND_CONTACT.earth;
  const at = (i: number, j: number): number => h[(j + 1) * w + (i + 1)];
  for (let j = 0, v = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++, v++) {
      const [x, z] = [x0 + i * s, z0 + j * s];
      pos.set([x, at(i, j), z], v * 3);
      const dx = (at(i + 1, j) - at(i - 1, j)) / (2 * s);
      const dz = (at(i, j + 1) - at(i, j - 1)) / (2 * s);
      const len = Math.hypot(dx, 1, dz);
      nor.set([-dx / len, 1 / len, -dz / len], v * 3);
      uv.set([x / TILE, z / TILE], v * 2);
      let k = GAIN * (0.62 + 0.38 * fbm(x * 0.15, z * 0.15, 99, 2));
      let tint = ownTint;
      let share = 0;
      for (const a of arenas) { // an arena's ground: its colour and rings of dark and light over the land's, its texture in the road's place
        const m = groundMark(a, x, z);
        if (!m || m.share <= share) continue;
        share = m.share;
        k *= 1 + (m.k - 1) * m.share;
        const t = m.tint ?? tint;
        tint = [ownTint[0] + (t[0] - ownTint[0]) * m.share, ownTint[1] + (t[1] - ownTint[1]) * m.share, ownTint[2] + (t[2] - ownTint[2]) * m.share];
      }
      if (beside) { // beside another region: its ground and its tint come in over the last of this one's, in a band the noise makes uneven
        const share = edgeShare(region, beside, x, z, 2 * fbm(x * 0.06, z * 0.06, 71, 2) - 1);
        if (share > 0) {
          edge[v] = share;
          blended = true;
          const o = beside.region.biome.tint;
          tint = [ownTint[0] + (o[0] - ownTint[0]) * share, ownTint[1] + (o[1] - ownTint[1]) * share, ownTint[2] + (o[2] - ownTint[2]) * share];
        }
      }
      const mark = contacts.length ? markAt(contacts, x, z) : null;
      if (!mark || (mark.dark <= 0 && mark.soil <= 0)) col.set([tint[0] * k, tint[1] * k, tint[2] * k], v * 3);
      else {
        k *= 1 - GROUND_CONTACT.dark * mark.dark;
        const e = GROUND_CONTACT.soil * mark.soil;
        col.set([(tint[0] + (earth[0] - tint[0]) * e) * k, (tint[1] + (earth[1] - tint[1]) * e) * k, (tint[2] + (earth[2] - tint[2]) * e) * k], v * 3);
      }
      splat[v] = floor ? Math.max(roadShare(roads, x, z), share) : roadShare(roads, x, z);
    }
    if (j % ROWS_PER_STEP === ROWS_PER_STEP - 1) yield;
  }
  const index: number[] = [];
  const sunk = WORLD.seaLevel - 1;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (Math.max(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)) < sunk) continue; // drowned: the sea covers it
      if (inDungeon(x0 + (i + 0.5) * s, z0 + (j + 0.5) * s)) continue; // the room lays its own floor
      const a = j * (n + 1) + i;
      const [b, c, d] = [a + 1, a + n + 1, a + n + 2];
      index.push(a, c, b, b, c, d);
    }
    if (j % (ROWS_PER_STEP * 2) === ROWS_PER_STEP * 2 - 1) yield;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSplat', new THREE.BufferAttribute(splat, 1));
  geo.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  done(new THREE.Mesh(geo, groundMaterial(region.biome.texture, (floor as TextureKind | undefined) ?? (REGION_LAYOUTS[region.id] ?? REGION_LAYOUTS.hub).road, region.biome.patch, blended ? { texture: beside!.region.biome.texture, road: (REGION_LAYOUTS[beside!.region.id] ?? REGION_LAYOUTS.hub).road, patch: beside!.region.biome.patch } : undefined)));
}
