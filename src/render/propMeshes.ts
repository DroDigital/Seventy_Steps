/**
 * Chunk props as low-poly primitives (spec §2): every prop's pieces (propShapes.ts, houseMesh.ts)
 * turned and placed, then merged per chunk into one mesh per material (stone, wood, needles and
 * leaves, clapboard, brick, shingles, and the self-lit glow of lamps, fires and lit windows), tinted
 * toward the region's ground and darkened toward it (light baked into the vertices, playtest round
 * 7); the lamps, fires and windows are reported as lights (worldLights.ts). Built a few props at a
 * time (a sliced job).
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RegionDef } from '../data/regions';
import type { Prop } from '../world/props';
import { housePieces } from './houseMesh';
import { groundShade } from './meshKit';
import { planeOf, type MirrorSpot } from './mirrorMath';
import { mixRgb, type Rgb } from './palette';
import { shadowMesh } from './moonShadow';
import { propPieces, type PropMat } from './propShapes';
import type { Top } from './chimneys';
import type { LightSpot } from './worldLights';
import { createWorldMaterial, type WorldMaterialOptions } from './worldMaterial';

const STONE: Rgb = [0.86, 0.86, 0.84];
const BUDGET = 8; // prop weight per slice (a house weighs 4)

const OPTIONS: Record<PropMat, WorldMaterialOptions> = {
  stone: { texture: 'stone', seed: 6, vertexColors: true, vary: 0.6 },
  wood: { texture: 'wood', seed: 6, uvScale: [0.5, 0.5], vertexColors: true, vary: 0.4, sway: true },
  trim: { texture: 'wood', seed: 6, uvScale: [0.5, 0.5], vertexColors: true, vary: 0.4 },
  leaf: { texture: 'grass', seed: 9, vertexColors: true, vary: 0.4, sway: true },
  clapboard: { texture: 'clapboard', seed: 3, vertexColors: true, vary: 0.5 },
  brick: { texture: 'brick', seed: 3, vertexColors: true, vary: 0.5 },
  shingle: { texture: 'shingle', seed: 3, vertexColors: true, vary: 0.5 },
  glow: { texture: 'cloth', emissive: 1, vertexColors: true },
  glass: { texture: 'cloth', emissive: 0.12, vertexColors: true, opacity: 0.14 },
  pane: { texture: 'cloth', emissive: 1, vertexColors: true, panes: true }, // lit windows (round 18)
  rock: { texture: 'rock', seed: 4, vertexColors: true, vary: 0.6 }, // the boss places' models (round 71): what their class bytes are drawn as
  slab: { texture: 'slab', seed: 5, vertexColors: true, vary: 0.5 },
  cobble: { texture: 'cobble', seed: 5, vertexColors: true, vary: 0.5 },
  cloth: { texture: 'cloth', seed: 2, vertexColors: true, vary: 0.3, sway: true },
  metal: { texture: 'cloth', seed: 8, vertexColors: true, vary: 0.2 },
  bone: { texture: 'slab', seed: 11, vertexColors: true, vary: 0.35 },
  glassware: { texture: 'cloth', emissive: 0.1, vertexColors: true, opacity: 0.28, surface: 'glass' }, // what is clear, wet, waxen or silvered (round 74; shaders/surfaces.ts)
  liquid: { texture: 'cloth', emissive: 0.4, vertexColors: true, opacity: 0.55, surface: 'liquid' },
  wax: { texture: 'cloth', seed: 12, emissive: 0.1, vertexColors: true, vary: 0.2, surface: 'wax' },
  mirror: { texture: 'cloth', seed: 3, vertexColors: true, surface: 'mirror' },
};
const materials = new Map<PropMat, THREE.ShaderMaterial>();
/** What bends in the wind (round 34): the trees and bushes, from nothing at their feet to the most at the tops; the rest of a swaying material's vertices stand still. */
const BENDS: ReadonlySet<string> = new Set(['tree', 'pine', 'bush']);
const BEND = 0.03; // metres of lean at the top of a prop at a gust's height, per metre it stands

function addSway(geo: THREE.BufferGeometry, p: Prop): void {
  if (geo.getAttribute('aSway')) return; // a model's own (a cloth blown from where it hangs)
  const at = geo.getAttribute('position');
  const sway = new Float32Array(at.count);
  if (BENDS.has(p.kind)) {
    const [foot, h] = [p.y - 0.15, Math.max(p.h, 1)];
    for (let i = 0; i < at.count; i++) sway[i] = BEND * h * Math.pow(Math.min(1, Math.max(0, (at.getY(i) - foot) / h)), 2);
  }
  geo.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
}

/** What casts the moon's shadow (round 34): the bodies of things, not their lights, windows and trim. */
const CASTS: ReadonlySet<PropMat> = new Set(['stone', 'wood', 'leaf', 'clapboard', 'brick', 'shingle', 'rock', 'slab', 'cobble', 'metal', 'bone', 'wax']);
/** What stands 4 to 10 cm off a wall (frames, glass, doors) is drawn nearer than it is by a pixel's slope of depth: the PS1's snapping moves a face's depth by up to that on a wall seen aslant, and the wall showed through it (round 21). */
/** What is not darkened toward the ground (light is not baked into it): lamps, lit windows, and what is clear or silvered. */
const UNSHADED: ReadonlySet<PropMat> = new Set(['glow', 'pane', 'mirror', 'glassware', 'liquid']);
const RELIEF: ReadonlySet<PropMat> = new Set(['trim', 'pane']);
const material = (m: PropMat): THREE.ShaderMaterial => {
  let mat = materials.get(m);
  if (!mat) {
    materials.set(m, (mat = createWorldMaterial(OPTIONS[m])));
    if (RELIEF.has(m)) Object.assign(mat, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  }
  return mat;
};

/** Builds the chunk's props; `done` receives one mesh per material used, and the lights among them. */
export function* propJob(props: readonly Prop[], region: RegionDef, done: (meshes: THREE.Mesh[], lights: LightSpot[], chimneys: Top[]) => void, cover?: Partial<Record<PropMat, THREE.BufferGeometry>>): Generator<void, void> {
  const c = mixRgb(STONE, region.biome.tint, 0.5);
  const groups = new Map<PropMat, THREE.BufferGeometry[]>();
  for (const [m, geo] of Object.entries(cover ?? {}) as [PropMat, THREE.BufferGeometry][]) groups.set(m, [geo]);
  const lights: LightSpot[] = [];
  const mirrors: MirrorSpot[] = []; // where the glass of a mirror stands, for the one that is drawn (mirrorView.ts; round 74)
  const chimneys: Top[] = []; // where smoke goes up
  const casters: THREE.BufferGeometry[] = []; // the bodies of the props, for the moon's shadow
  let spent = 0;
  for (const p of props) {
    const [s, cs] = [Math.sin(p.yaw), Math.cos(p.yaw)];
    for (const piece of p.kind === 'house' ? housePieces(p, c) : propPieces(p, c)) {
      if (!UNSHADED.has(piece.mat)) groundShade(piece.geo, p.kind === 'house' ? 0.62 : 0.55, p.kind === 'house' ? 2.2 : 1.6); // darker toward the ground
      const geo = piece.geo.rotateY(p.yaw).translate(p.x, p.y - 0.15, p.z);
      if (piece.mat === 'leaf' || piece.mat === 'wood' || piece.mat === 'cloth') addSway(geo, p);
      if (piece.mat === 'mirror') {
        const spot = planeOf(geo);
        if (spot) mirrors.push(spot);
      }
      groups.get(piece.mat)?.push(geo) ?? groups.set(piece.mat, [geo]);
      if (CASTS.has(piece.mat)) casters.push(geo);
      for (const [x, y, z] of piece.smoke ?? []) chimneys.push({ x: p.x + x * cs + z * s, y: p.y - 0.15 + y, z: p.z - x * s + z * cs }); // turned as the piece was, then placed
      if (!piece.light) continue;
      if (piece.at) {
        const place = ([x, y, z]: readonly [number, number, number]): { x: number; y: number; z: number } => ({ x: p.x + x * cs + z * s, y: p.y - 0.15 + y, z: p.z - x * s + z * cs }); // turned as the piece was (rotateY), then placed
        lights.push({ ...place(piece.at), kind: piece.light, glass: piece.glass && place(piece.glass), pane: piece.pane, halo: piece.halo, haloGain: piece.haloGain });
      } else {
        geo.computeBoundingBox();
        const m = geo.boundingBox!.getCenter(new THREE.Vector3());
        lights.push({ x: m.x, y: m.y, z: m.z, kind: piece.light });
      }
    }
    spent += p.kind === 'house' ? 4 : 1;
    if (spent >= BUDGET) {
      spent = 0;
      yield;
    }
  }
  const meshes: THREE.Mesh[] = [];
  for (const [m, geos] of groups) {
    for (const g of geos) if (!g.index) g.setIndex([...Array(g.getAttribute('position').count).keys()]); // merging needs all indexed or none
    const mesh = new THREE.Mesh(mergeGeometries(geos), material(m));
    if (m === 'mirror' && mirrors.length) mesh.userData.mirrors = mirrors;
    if (m === 'liquid' || m === 'glassware') mesh.renderOrder = m === 'liquid' ? 1 : 2; // the glass over what it holds
    meshes.push(mesh);
    yield;
  }
  const shadow = shadowMesh(casters);
  if (shadow) meshes.push(shadow);
  done(meshes, lights, chimneys);
}
