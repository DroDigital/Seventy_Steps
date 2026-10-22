/**
 * What moves in a walled court (round 68; world/enclosure.ts `Living`, laid by the enclosure that has it): the black river about an island,
 * a sheet of dark water in the bed the ground was sunk to, flowing round it, with pale mists that slide over it; and the spillway of a dam,
 * a curtain of grey dust that pours down it and breaks at its foot. Each is made when the investigator is within its reach and put away
 * beyond it, and costs what its mesh and its few sprites a second cost (a river is some 3,000 triangles in one draw). Render only.
 */

import * as THREE from 'three';
import type { V3 } from '../core/geom';
import type { Game } from '../systems/components';
import type { Living } from '../world/enclosure';
import { worldLayout } from '../world/placements';
import { tint } from './meshKit';
import type { Rgb } from './palette';
import type { Particles } from './particles';
import { createWorldMaterial } from './worldMaterial';

const NEAR = 120; // metres past a court's far side that its life is drawn
const WATER: Rgb = [0.09, 0.12, 0.15]; // black water, a little cold
const MIST: Rgb = [0.52, 0.58, 0.68];
const DUST: Rgb = [0.68, 0.68, 0.72];
const SPEED = 0.9; // m/s: how fast the mists slide along the river, and the water's flow in the same sense
const CELL = 1.5; // metres: the mesh's cells, small enough that the lantern's pool shows on it

export interface CourtLife {
  update(camera: V3, time: number, hidden: boolean): void;
}

type River = Extract<Living, { kind: 'river' }>;
type Spill = Extract<Living, { kind: 'spill' }>;

/** The river's water: an annulus between `inner` and `outer`, a sheet at `level` under the land, left open at the ford (its kerbs), the texture running round it. */
function riverMesh(r: River): THREE.Mesh {
  const rings = Math.max(2, Math.ceil((r.outer - r.inner) / CELL));
  const mid = (r.inner + r.outer) / 2;
  const open = Math.asin(Math.min(0.95, r.ford / 2 / mid)); // the angle the ford takes out of it, at its middle
  const [from, span] = [Math.atan2(r.front.z, r.front.x) + open, Math.PI * 2 - 2 * open];
  const around = Math.max(8, Math.ceil((span * mid) / CELL));
  const [pos, uv, index] = [new Float32Array((rings + 1) * (around + 1) * 3), new Float32Array((rings + 1) * (around + 1) * 2), [] as number[]];
  for (let j = 0; j <= rings; j++) {
    for (let i = 0; i <= around; i++) {
      const [rad, th] = [r.inner + ((r.outer - r.inner) * j) / rings, from + (span * i) / around];
      const k = j * (around + 1) + i;
      pos.set([r.x + Math.cos(th) * rad, r.y - r.level, r.z + Math.sin(th) * rad], k * 3);
      uv.set([(i / around) * (span * mid) / 6, (j / rings) * ((r.outer - r.inner) / 6)], k * 2); // 6 m to the texture's repeat, u along the current
      if (i < around && j < rings) index.push(k, k + around + 1, k + 1, k + 1, k + around + 1, k + around + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  const mesh = new THREE.Mesh(tint(geo, WATER), createWorldMaterial({ texture: 'water', uvScroll: [SPEED / 6, 0], emissive: 0.14, vertexColors: true }));
  mesh.frustumCulled = false;
  mesh.name = 'river';
  return mesh;
}

export function createCourtLife(scene: THREE.Scene, g: Game, particles: Particles): CourtLife {
  const lives = worldLayout().arenas.flatMap((a) => (a.house?.living ?? []).map((l) => ({ l, reach: Math.hypot(a.house!.rect.x1 - a.house!.rect.x0, a.house!.rect.z1 - a.house!.rect.z0) / 2 + NEAR, mesh: null as THREE.Mesh | null, owed: 0, last: -1 })));
  const ground = (x: number, z: number, fallback: number): number => particles.ground?.(x, z) ?? fallback;
  const rand = (lo: number, hi: number): number => lo + (hi - lo) * Math.random();

  function river(c: (typeof lives)[number], r: River, dt: number): void {
    c.owed += 5 * dt; // mists a second
    for (; c.owed >= 1; c.owed--) {
      const rad = rand(r.inner + 1, r.outer - 1);
      const th = Math.atan2(r.front.z, r.front.x) + rand(0.2, Math.PI * 2 - 0.2);
      const [x, z] = [r.x + Math.cos(th) * rad, r.z + Math.sin(th) * rad];
      particles.spawn({ x, y: r.y - r.level + rand(0.2, 1.3), z, vx: -Math.sin(th) * SPEED, vz: Math.cos(th) * SPEED, vy: 0.02, life: rand(6, 9), size: rand(1.8, 3), grow: 1.5, color: MIST, alpha: 0.22, drag: 0.05, shape: 'wisp' }); // a wraith, carried round with the current
    }
  }

  function spill(c: (typeof lives)[number], s: Spill, dt: number): void {
    c.owed += 24 * dt; // a second's dust
    const across = { x: -s.face.z, z: s.face.x };
    for (; c.owed >= 1; c.owed--) {
      const u = rand(-0.5, 0.5) * s.width;
      const [x, z] = [s.x + across.x * u, s.z + across.z * u];
      const floor = ground(x + s.face.x * 2, z + s.face.z * 2, s.y);
      particles.spawn({ x, y: s.y + s.top, z, vx: s.face.x * rand(0.5, 1.2), vz: s.face.z * rand(0.5, 1.2), vy: rand(-0.6, 0), life: rand(1.3, 1.9), size: rand(0.5, 0.9), grow: 1.8, color: DUST, alpha: 0.5, gravity: 6, drag: 0.5, floor, shape: 'wisp' });
      if (Math.random() < 0.15) particles.spawn({ x: x + s.face.x * 1.5, y: floor + 0.4, z: z + s.face.z * 1.5, vx: s.face.x * 0.5, vz: s.face.z * 0.5, vy: 0.15, life: rand(1.8, 2.6), size: rand(1.4, 2.2), grow: 2.2, color: DUST, alpha: 0.28, drag: 0.3, shape: 'wisp' }); // and it breaks at the foot
    }
  }

  return {
    update(camera, time, hidden) {
      for (const c of lives) {
        const near = !hidden && Math.hypot(camera.x - c.l.x, camera.z - c.l.z) < c.reach;
        if (c.l.kind === 'river') {
          if (near && !c.mesh) scene.add((c.mesh = riverMesh(c.l)));
          if (!near && c.mesh) {
            scene.remove(c.mesh);
            c.mesh.geometry.dispose();
            (c.mesh.material as THREE.Material).dispose();
            c.mesh = null;
          }
        }
        const dt = c.last < 0 ? 0 : Math.min(0.1, Math.max(0, time - c.last));
        c.last = time;
        if (!near || !g.overworld) continue;
        if (c.l.kind === 'river') river(c, c.l, dt);
        else spill(c, c.l, dt);
      }
    },
  };
}
