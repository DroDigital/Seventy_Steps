/**
 * The sea (round 30: a flat plane, a texture sliding over it): a surface of waves (seaWaves.ts) in
 * four nested rings of grid, fine at the investigator's feet and coarse at the horizon, each ring
 * kept on whole cells so the water never swims as they walk; lit by what is above it: the sky
 * (fogged at the horizon, deeper overhead) in the glancing angle, the moon in a path of glitter, the
 * lamps and the lantern on the swell near them; white where a crest breaks, and where the water
 * runs up the shore (world material `shore`). The wind raises it (`SEA.chop`: weather, realm). Round 55: it is drawn
 * after the ground, thinner where it is shallow (the seabed's window, below, gives it its depth: shaders/sea.ts).
 * Colours are display sRGB, as everything: the sea is dark, as ever. Render only.
 */

import * as THREE from 'three';
import { WORLD } from '../data/tuning';
import { createSeabedWindow } from '../world/seabedWindow';
import { surface } from '../world/terrain';
import type { Rect } from '../world/worldMap';
import { seaRoomMask } from './seaMask';
import { RIPPLES } from './seaRipples';
import { SEA_FRAG, SEA_VERT } from './shaders/sea';
import { worldUniforms } from './worldMaterial';

/** How hard the wind drives the sea: 1 as it lies, raised by weather and by the realm (worldLife.ts). */
export const SEA = { chop: { value: 1 } };

const LEVELS = 4;
const CELLS = 48;
const BASE = 1.6; // metres: the finest ring's cell

/** A square ring of grid, `CELLS` cells across of `cell` metres, without the middle `hole` metres either way (0: whole). */
function ring(cell: number, hole: number): THREE.BufferGeometry {
  const n = CELLS + 1;
  const half = (CELLS * cell) / 2;
  const pos: number[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) pos.push(i * cell - half, 0, j * cell - half);
  const index: number[] = [];
  for (let j = 0; j < CELLS; j++) {
    for (let i = 0; i < CELLS; i++) {
      const [cx, cz] = [(i + 0.5) * cell - half, (j + 0.5) * cell - half];
      if (hole > 0 && Math.abs(cx) < hole && Math.abs(cz) < hole) continue;
      const a = j * n + i;
      index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  return geo;
}

export interface Sea {
  readonly group: THREE.Group;
  /** Keeps the rings under (x, z), each on whole cells of its own. */
  update(x: number, z: number): void;
}

export function createSea(rooms: readonly Rect[] = []): Sea {
  const mask = seaRoomMask(rooms);
  const bed = createSeabedWindow(surface);
  const bedTexture = new THREE.DataTexture(bed.data, bed.size, bed.size, THREE.RedFormat, THREE.FloatType);
  bedTexture.minFilter = bedTexture.magFilter = THREE.NearestFilter;
  bedTexture.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...worldUniforms,
      uChop: SEA.chop,
      uSeaLevel: { value: WORLD.seaLevel },
      uSeaMask: { value: mask.texture },
      uSeaMaskBounds: { value: mask.bounds },
      uRipples: RIPPLES,
      uSeabed: { value: bedTexture },
      uSeabedWin: { value: new THREE.Vector4(0, 0, bed.size, bed.cell) },
      uSeabedOn: { value: 0 },
    },
    vertexShader: SEA_VERT,
    fragmentShader: SEA_FRAG,
    transparent: true, // thin in the shallows, where it is drawn over the bed (after the ground; its depth is kept)
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor, // (the picture's alpha is kept as the post pass reads it)
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2, // the coarser rings lie a little behind the finer where they overlap
  });
  const group = new THREE.Group();
  const rings = Array.from({ length: LEVELS }, (_, k) => {
    const cell = BASE * 2 ** k;
    const mesh = new THREE.Mesh(ring(cell, k === 0 ? 0 : CELLS * BASE * 2 ** (k - 1) * 0.5 * 0.9), material);
    mesh.frustumCulled = false;
    group.add(mesh);
    return { mesh, step: cell * 2 };
  });
  return {
    group,
    update(x, z) {
      if (bed.update(x, z)) {
        bedTexture.needsUpdate = true;
        material.uniforms.uSeabedWin!.value.set(bed.origin.x, bed.origin.z, bed.size, bed.cell);
        material.uniforms.uSeabedOn!.value = bed.ready ? 1 : 0;
      }
      for (const r of rings) r.mesh.position.set(Math.round(x / r.step) * r.step, 0, Math.round(z / r.step) * r.step);
    },
  };
}
