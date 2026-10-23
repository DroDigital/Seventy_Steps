/**
 * The wall of water of a tidal surge (round 70; the attack `tidal_surge`): a breaking wave as wide as the lane the simulation sends it down,
 * steep at its front, with a ragged crest, running over the ground and thrown up as spray along its edge. The lane is drawn before it comes
 * (render/telegraphs.ts). Render only.
 */

import * as THREE from 'three';
import type { Game } from '../systems/components';
import type { Particles } from './particles';
import { createWorldMaterial } from './worldMaterial';

/** A wave's profile along its run (metres behind the crest, a share of its height), a long swell up to a steep front. */
const PROFILE: readonly (readonly [number, number])[] = [[-1, 0], [-0.8, 0.18], [-0.5, 0.45], [-0.25, 0.72], [-0.08, 0.95], [0, 1], [0.06, 0.62], [0.1, 0.2], [0.11, 0]];
const ACROSS = 28;

/** The wave, unit wide (x from -1 to 1), unit long (z from -1 to 0.1), unit tall (y from 0 to the crest), its crest ragged. */
export function wallGeometry(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const rows = PROFILE.length;
  for (let i = 0; i <= ACROSS; i++) {
    const x = (i / ACROSS) * 2 - 1;
    const rag = 0.84 + 0.1 * Math.sin(i * 2.7) + 0.06 * Math.sin(i * 6.1 + 1.3);
    PROFILE.forEach(([z, y], j) => {
      pos.push(x, y * rag, z);
      const foam = Math.min(1, Math.max(0, (y - 0.55) / 0.4)); // the crest is white, the body green-blue
      col.push(0.55 + 0.45 * foam, 0.78 + 0.22 * foam, 0.9 + 0.1 * foam);
      uv.push(i * 0.9, j * 0.7);
    });
    if (i < ACROSS) for (let j = 0; j < rows - 1; j++) index.push(i * rows + j, (i + 1) * rows + j, i * rows + j + 1, i * rows + j + 1, (i + 1) * rows + j, (i + 1) * rows + j + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

export interface SurgeView {
  update(alpha: number): void;
}

const rand = (a: number, b: number): number => a + (b - a) * Math.random();

export function createSurgeView(scene: THREE.Scene, g: Game, particles: Particles): SurgeView {
  const c = g.ecs.c;
  let made: { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial } | undefined; // made with the first wave, not as the world loads
  const walls = new Map<number, THREE.Mesh>();
  const kit = (): NonNullable<typeof made> => {
    if (!made) {
      const material = createWorldMaterial({ texture: 'water', uvScale: [14, 14], uvScroll: [0.1, 0.35], emissive: 0.55, vertexColors: true });
      material.side = THREE.DoubleSide;
      made = { geometry: wallGeometry(), material };
    }
    return made;
  };

  return {
    update(alpha) {
      for (const [e, w] of c.wave) {
        const l = w.lane;
        const tr = c.transform.get(e);
        if (!l || !tr) continue;
        let mesh = walls.get(e);
        if (!mesh) {
          mesh = new THREE.Mesh(kit().geometry, kit().material);
          mesh.frustumCulled = false;
          scene.add(mesh);
          walls.set(e, mesh);
        }
        const r = w.r + w.speed * alpha;
        const x = tr.pos.x + l.dx * r;
        const z = tr.pos.z + l.dz * r;
        const y = g.world.ground(x, z);
        const rise = Math.min(1, r / 6) * Math.min(1, (w.reach - r) / 8); // it gathers as it leaves the horror and sinks away at the end of its run
        mesh.position.set(x, y - 0.1, z);
        mesh.rotation.y = Math.atan2(l.dx, l.dz);
        mesh.scale.set(l.half, 2.4 * Math.max(0.05, rise) + l.half * 0.1, Math.max(2.5, w.width * 2.6));
        for (let i = 0; i < Math.ceil(l.half * 1.4); i++) { // spray off the crest
          const side = rand(-1, 1) * l.half;
          const px = x - l.dz * side;
          const pz = z + l.dx * side;
          particles.spawn({ x: px, y: g.world.ground(px, pz) + 1.8 * rise + 0.5, z: pz, vx: l.dx * rand(1, 4) + rand(-1, 1), vy: rand(1.5, 4.5), vz: l.dz * rand(1, 4) + rand(-1, 1), life: rand(0.4, 0.8), size: rand(0.35, 0.8), grow: 1.6, color: [0.9, 0.96, 1], colorEnd: [0.5, 0.68, 0.82], shape: 'wisp', alpha: 0.7, gravity: 5, drag: 1.2 });
        }
      }
      for (const [e, mesh] of walls) {
        if (c.wave.has(e)) continue;
        scene.remove(mesh);
        walls.delete(e);
      }
    },
  };
}
