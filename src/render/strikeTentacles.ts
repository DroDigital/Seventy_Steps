/**
 * The tentacles that rise from marked ground (round 70; the attack `tentacle_rise`): where a mark with the look `tentacle` bursts, one
 * comes up out of the ground in a fifth of a second, writhes there a moment with its tip curling, and sinks away. Drawn as the deep's
 * far tentacles are (render/tentacleShape.ts: the same centreline and tube), in the horror's own dark and light. Render only.
 */

import * as THREE from 'three';
import type { Game } from '../systems/components';
import { attackLook } from './attackLook';
import type { Rgb } from './palette';
import { createTubeGeometry } from './tentacleMesh';
import { centreline, radius } from './tentacleShape';
import { createWorldMaterial } from './worldMaterial';

const STEPS = 12;
const SIDES = 7;
const POOL = 10;
const [EMERGE, HOLD, SINK] = [0.2, 0.75, 0.5]; // seconds

interface Rising {
  x: number;
  y: number;
  z: number;
  yaw: number;
  born: number; // render seconds; NaN until the next frame sets it
  length: number;
  thick: number;
  seed: number;
  ink: Rgb;
  line: Rgb;
  core: Rgb;
  mesh: THREE.Mesh;
}

export interface StrikeTentacles {
  update(time: number): void;
}

const smooth = (x: number): number => x * x * (3 - 2 * x);
/** How far up it is (0 under the ground, 1 whole) `age` seconds after it began. */
export const upAt = (age: number): number => (age < 0 ? 0 : age < EMERGE ? smooth(age / EMERGE) : age < EMERGE + HOLD ? 1 : 1 - smooth(Math.min(1, (age - EMERGE - HOLD) / SINK)));
export const lifespan = EMERGE + HOLD + SINK;

export function createStrikeTentacles(scene: THREE.Scene, g: Game): StrikeTentacles {
  let material: THREE.ShaderMaterial | undefined; // made when the first rises, not as the world loads
  const meshes: THREE.Mesh[] = [];
  const live: Rising[] = [];
  const meshFor = (): THREE.Mesh | undefined => {
    const idle = meshes.find((m) => !m.visible);
    if (idle) return idle;
    if (meshes.length >= POOL) return undefined;
    material ??= createWorldMaterial({ texture: 'flesh', uvScale: [1.5, 3], vertexColors: true, vary: 0.4, seed: 7 });
    const m = new THREE.Mesh(createTubeGeometry(STEPS, SIDES), material);
    m.frustumCulled = false;
    m.visible = false;
    scene.add(m);
    meshes.push(m);
    return m;
  };

  g.events.on('Erupted', ({ at, radius: r, by, look }) => {
    if (look !== 'tentacle') return;
    const mesh = meshFor();
    if (!mesh) return;
    const l = attackLook(g, by);
    const me = g.ecs.c.transform.get(g.player.id)?.pos;
    const seed = Math.random() * 10;
    mesh.visible = true;
    live.push({
      x: at.x, y: at.y, z: at.z,
      yaw: (me ? Math.atan2(me.x - at.x, me.z - at.z) : 0) + (Math.random() - 0.5) * 1.6, // it leans toward where the investigator stood, not exactly
      born: NaN,
      length: 3.2 + r * 2.6,
      thick: 0.34 + r * 0.26,
      seed,
      ink: l.ink,
      line: l.line,
      core: l.core,
      mesh,
    });
  });

  function pose(t: Rising, age: number): void {
    const r = upAt(age);
    const line = centreline(Math.max(0.4, t.length * r), age * 2.4, t.seed, STEPS);
    const [sy, cy] = [Math.sin(t.yaw), Math.cos(t.yaw)];
    const pos = t.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const col = t.mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
    line.forEach(([lx, ly, lz], i) => {
      const s = Math.max(0, (i - 1) / STEPS);
      const rad = radius(s, t.thick) * (0.6 + 0.4 * Math.min(1, r * 2));
      const [px, pz] = [t.x + lx * sy + lz * cy, t.z + lx * cy - lz * sy];
      const band = 0.5 + 0.5 * Math.sin(s * 34 + t.seed); // ridges along it, as of suckers
      for (let j = 0; j < SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2;
        pos.setXYZ(i * SIDES + j, px + Math.cos(a) * rad, t.y + ly, pz + Math.sin(a) * rad);
        const k = 0.22 + 0.2 * band;
        col.setXYZ(i * SIDES + j, t.ink[0] * 0.9 + t.line[0] * k + t.core[0] * s ** 4 * 0.5, t.ink[1] * 0.9 + t.line[1] * k + t.core[1] * s ** 4 * 0.5, t.ink[2] * 0.9 + t.line[2] * k + t.core[2] * s ** 4 * 0.5);
      }
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
    t.mesh.geometry.computeVertexNormals();
  }

  return {
    update(time) {
      for (let i = live.length - 1; i >= 0; i--) {
        const t = live[i]!;
        if (Number.isNaN(t.born)) t.born = time;
        const age = time - t.born;
        if (age > lifespan) {
          t.mesh.visible = false;
          live.splice(i, 1);
          continue;
        }
        pose(t, age);
      }
    },
  };
}
