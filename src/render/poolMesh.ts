/**
 * The water of a court's pool (round 75; world/enclosure.ts `Pool`): a sheet at the pool's surface laid over the outline of the ground that
 * was sunk for it and a little past it, where the rising bank hides its edge, in cells small enough that the lantern's pool of light shows on
 * it. Its colour is the water's, paler toward the bank where it frets, in streaks that run with the current; its texture runs the way the
 * water does. Render only.
 */

import * as THREE from 'three';
import type { Pool } from '../world/enclosure';
import { polygonFootprint } from '../world/sitePads';
import { createWorldMaterial } from './worldMaterial';

const CELL = 1.1; // metres
const SPEED = 0.9; // m/s, the water's texture if the pool says nothing of its current
const TILE = 6; // metres to the texture's repeat
const EDGE = 1.7; // metres of foam within the waterline

export function poolMesh(p: Pool): THREE.Mesh {
  const fp = polygonFootprint(p.pts);
  const past = p.bank + CELL; // the sheet runs past the outline by the bank's width, and a cell
  const { x0, z0, x1, z1 } = fp.bounds;
  const [nx, nz] = [Math.ceil((x1 - x0 + 2 * past) / CELL) + 1, Math.ceil((z1 - z0 + 2 * past) / CELL) + 1];
  const d = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) d[j * nx + i] = fp.dist(x0 - past + i * CELL, z0 - past + j * CELL);
  const keep = new Int32Array(nx * nz).fill(-1);
  const [pos, uv, col, index] = [[] as number[], [] as number[], [] as number[], [] as number[]];
  const flow = p.flow ?? { x: SPEED, z: 0 };
  const speed = Math.hypot(flow.x, flow.z) || SPEED;
  const dir = { x: flow.x / speed, z: flow.z / speed };
  const vertex = (i: number, j: number): number => {
    const k = j * nx + i;
    if (keep[k]! >= 0) return keep[k]!;
    const [x, z] = [x0 - past + i * CELL, z0 - past + j * CELL];
    const near = Math.max(0, Math.min(1, 1 - (p.bank * 0.7 - d[k]!) / EDGE)); // foam where the surface meets the bank
    const edge = near * (0.65 + 0.35 * Math.sin(x * 0.9 + z * 1.3));
    const streak = 0.85 + 0.15 * Math.sin((x * dir.x + z * dir.z) * 0.37 + ((x * dir.z - z * dir.x) % 3) * 2.1);
    pos.push(x, p.y, z);
    uv.push((x * dir.x + z * dir.z) / TILE, (x * dir.z - z * dir.x) / TILE);
    for (let c = 0; c < 3; c++) col.push(p.tint[c]! * streak * (1 - edge) + p.foam[c]! * edge);
    return (keep[k] = pos.length / 3 - 1);
  };
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const k = j * nx + i;
      if (Math.min(d[k]!, d[k + 1]!, d[k + nx]!, d[k + nx + 1]!) > p.bank) continue;
      const [a, b, c, e] = [vertex(i, j), vertex(i + 1, j), vertex(i, j + 1), vertex(i + 1, j + 1)];
      index.push(a, c, b, b, c, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); // (the sheet is level: a vertex with no normal lights as black)
  geo.setIndex(index);
  const material = createWorldMaterial({ texture: 'water', uvScroll: [(p.flow ? speed : SPEED * 0.3) / TILE, 0], emissive: 0.3 + (p.glow ?? 0) * 0.5, vertexColors: true });
  material.side = THREE.DoubleSide; // (seen from above whichever way the cells were wound)
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.name = 'pool';
  return mesh;
}
