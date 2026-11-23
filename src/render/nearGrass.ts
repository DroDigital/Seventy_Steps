/**
 * Round 116, the grass at the investigator's feet, as thick as their realm grows it (data/foliage.ts `near`). The chunks' cover
 * (render/groundCover.ts) lies over the whole of the loaded land and could not be made carpet-thick there at a cost any machine bears;
 * this field lays it thick only where the eye is: a square of cells about the investigator, each holding at most one clump of blades,
 * placed by a hash of the cell's own place in the world (so it stands still as they walk) and made again a row at a time as they cross
 * into new cells. One clump drawn many times over (one draw), in the colours of its ground (grass, the mud's reeds, dry stalks on dirt
 * and sand) leaned toward the realm's own green, off the roads, sites, dungeons, the sea and what stands. Toward the field's edge the
 * clumps sink into the ground (shaders/world.ts NEAR_FIELD), where the chunks' cover goes on; it sways, parts for bodies, lies down in
 * their lanes and bends before a blast as the rest of the grass does (the same SWAY block). Render only.
 */

import * as THREE from 'three';
import { CLIMATES } from '../data/foliage';
import { lookOf } from '../data/propLooks';
import type { GroundTexture, RegionDef } from '../data/regions';
import { WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import { chunkContent } from '../world/chunks';
import { contactsOf, edgeDistance, type Contact } from '../world/groundContact';
import { patchAt } from '../world/groundKind';
import { worldLayout } from '../world/placements';
import { roadShare, type RoadSeg } from '../world/regionPlan';
import type { Pad } from '../world/sitePads';
import { padDistance } from '../world/sitePads';
import { inDungeon, surface } from '../world/terrain';
import { chunkKey, chunkOf } from '../world/worldMap';
import { Builder, COLORS, GAIN, shade } from './groundCover';
import { createWorldMaterial } from './worldMaterial';

export const NEAR_GRASS = {
  cell: 0.5, // metres a cell: at most one clump to it
  span: 72, // cells a side (36 m)
  perFrame: 360, // cells made again in a frame at the most (an arrival fills it over a few frames)
  blades: 7, // to a clump
  height: 0.5, // metres, a clump's tallest blade at a scale of one
};

/** How thick each ground lets it grow (a share of the realm's `near`), in what, and how tall. */
export const NEAR_GROUND: Partial<Record<GroundTexture, { share: number; kind: 'grass' | 'reed' | 'dry'; tall: number }>> = {
  grass: { share: 1, kind: 'grass', tall: 1 },
  leaves: { share: 0.75, kind: 'grass', tall: 0.85 },
  mud: { share: 0.85, kind: 'reed', tall: 2.1 },
  dirt: { share: 0.4, kind: 'dry', tall: 0.8 },
  rot: { share: 0.3, kind: 'dry', tall: 0.7 },
  sand: { share: 0.45, kind: 'dry', tall: 0.7 },
};

const fract = (v: number): number => v - Math.floor(v);
/** A fixed scatter in [0, 1) for a cell and a salt: the same every visit. */
export const cellHash = (i: number, j: number, salt: number): number => fract(Math.sin(i * 127.1 + j * 311.7 + salt * 74.7) * 43758.5453);

/** One clump: blades about its foot, white (the instance's colour is laid over), dark at the foot, the tips blown. */
function clump(): THREE.BufferGeometry {
  const b = new Builder(true);
  const { blades, height } = NEAR_GRASS;
  for (let k = 0; k < blades; k++) {
    const a = (k / blades) * Math.PI * 2 + cellHash(k, 3, 9) * 0.8;
    const [s, c] = [Math.sin(a), Math.cos(a)];
    const len = height * (0.55 + 0.45 * cellHash(k, 7, 2));
    const lean = 0.2 + 0.3 * cellHash(k, 1, 5);
    const [ox, oz] = [(cellHash(k, 2, 4) - 0.5) * 0.16, (cellHash(k, 4, 6) - 0.5) * 0.16];
    b.tri([ox - c * 0.035, 0, oz + s * 0.035], [ox + c * 0.035, 0, oz - s * 0.035], [ox + s * len * lean, len, oz + c * len * lean], [0.55, 0.55, 0.55], [0.55, 0.55, 0.55], [1, 1, 1], [0, 0, 0.16 * len]);
  }
  return b.geometry()!;
}

interface Ground {
  region: RegionDef | null;
  roads: readonly RoadSeg[];
  pads: readonly Pad[];
  solid: readonly Contact[];
}

export interface NearGrass {
  readonly mesh: THREE.InstancedMesh;
  /** Each drawn frame: `enclosed`, under a roof (none is laid there). */
  update(enclosed: boolean): void;
}

export function createNearGrass(scene: THREE.Scene, g: Game): NearGrass {
  const { cell, span: n, perFrame } = NEAR_GRASS;
  const reach = (n * cell) / 2;
  const mesh = new THREE.InstancedMesh(clump(), createWorldMaterial({ texture: 'grass', seed: 9, vertexColors: true, vary: 0.4, sway: true, field: reach - cell, nearFade: true }), n * n);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * n * 3), 3);
  mesh.frustumCulled = false; // (the clumps lie all about; the shader sinks those past the edge)
  mesh.visible = false;
  scene.add(mesh);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n * n; i++) mesh.setMatrixAt(i, zero);
  const held = new Int32Array(n * n * 2).fill(0x3fffffff); // the world cell each slot holds
  const queued = new Uint8Array(n * n);
  const queue: number[] = [];
  const grounds = new Map<number, Ground>();
  let [ci, cj] = [NaN, NaN];
  const [m4, q, at, size, col, up] = [new THREE.Matrix4(), new THREE.Quaternion(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Color(), new THREE.Vector3(0, 1, 0)];

  const groundOf = (x: number, z: number): Ground => {
    const key = chunkKey(chunkOf(x), chunkOf(z));
    let gr = grounds.get(key);
    if (!gr) {
      if (grounds.size > 24) grounds.clear();
      const c = chunkContent(chunkOf(x), chunkOf(z));
      grounds.set(key, (gr = { region: c.region ?? null, roads: c.roads, pads: worldLayout().chunk(chunkOf(x), chunkOf(z)).pads, solid: contactsOf(c.props) }));
    }
    return gr;
  };

  /** Makes slot `s` the clump of world cell (wi, wj), or empty. */
  function make(s: number, wi: number, wj: number): void {
    held[s * 2] = wi;
    held[s * 2 + 1] = wj;
    const [x, z] = [(wi + 0.15 + 0.7 * cellHash(wi, wj, 1)) * cell, (wj + 0.15 + 0.7 * cellHash(wi, wj, 2)) * cell];
    const gr = groundOf(x, z);
    const climate = gr.region ? CLIMATES[gr.region.id] : undefined;
    const texture = gr.region && (gr.region.biome.patch && patchAt(x, z) ? gr.region.biome.patch : gr.region.biome.texture);
    const ground = texture ? NEAR_GROUND[texture] : undefined;
    const y = ground && climate?.near && cellHash(wi, wj, 3) < climate.near * ground.share ? surface(x, z) : -Infinity;
    if (!ground || !gr.region || y < WORLD.seaLevel || roadShare(gr.roads, x, z) > 0.05 || inDungeon(x, z) || gr.pads.some((p) => padDistance(p, x, z) < 1) || gr.solid.some((c) => edgeDistance(c, x, z) < 0.1)) {
      mesh.setMatrixAt(s, zero);
      return;
    }
    const w = 0.8 + 0.5 * cellHash(wi, wj, 6);
    size.set(w, ground.tall * (0.7 + 0.6 * cellHash(wi, wj, 5)), w);
    mesh.setMatrixAt(s, m4.compose(at.set(x, y - 0.02, z), q.setFromAxisAngle(up, cellHash(wi, wj, 4) * Math.PI * 2), size));
    const own = ground.kind === 'reed' ? COLORS.reed : ground.kind === 'dry' ? COLORS.dry : cellHash(wi, wj, 7) < 0.6 ? COLORS.tuft : COLORS.tallgrass;
    const base = own[Math.floor(cellHash(wi, wj, 8) * own.length)];
    const green = lookOf(gr.region.id).needles; // (leaned a third toward the realm's own green, so its grass belongs to its trees)
    const k = GAIN * (0.88 + 0.24 * cellHash(wi, wj, 9));
    const c = shade([base[0] + (green[0] - base[0]) * 0.33, base[1] + (green[1] - base[1]) * 0.33, base[2] + (green[2] - base[2]) * 0.33], k);
    mesh.setColorAt(s, col.setRGB(c[0], c[1], c[2]));
  }

  return {
    mesh,
    update(enclosed) {
      const tr = g.ecs.c.transform.get(g.player.id);
      mesh.visible = !!tr && !!g.overworld && !enclosed;
      if (!mesh.visible || !tr) return;
      const [pi, pj] = [Math.floor(tr.pos.x / cell), Math.floor(tr.pos.z / cell)];
      if (pi !== ci || pj !== cj) { // into a new cell: the slots whose cell has left the square are made again for the cells come into it
        [ci, cj] = [pi, pj];
        const [bi, bj] = [ci - n / 2, cj - n / 2];
        for (let sj = 0; sj < n; sj++) {
          for (let si = 0; si < n; si++) {
            const s = sj * n + si;
            const [wi, wj] = [bi + (((si - bi) % n) + n) % n, bj + (((sj - bj) % n) + n) % n];
            if ((held[s * 2] !== wi || held[s * 2 + 1] !== wj) && !queued[s]) (queued[s] = 1), queue.push(s);
          }
        }
      }
      if (!queue.length) return;
      const [bi, bj] = [ci - n / 2, cj - n / 2];
      for (const s of queue.splice(0, perFrame)) {
        queued[s] = 0;
        const [si, sj] = [s % n, Math.floor(s / n)];
        make(s, bi + (((si - bi) % n) + n) % n, bj + (((sj - bj) % n) + n) % n);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    },
  };
}
