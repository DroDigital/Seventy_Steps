/**
 * The tentacle that takes hold of the investigator in the sea (round 55; systems/waterFall.ts has the body, this has the picture of it, read from
 * the same frames so the two agree). It comes up out of the water ahead of the body, rises into an arch, leans over, reaches for them,
 * and coils about the waist; then it draws them out, taut, the arch gone from it and the root staying ahead, its coils tightening as they go, and
 * where it lies in the water a wake of foam. It is drawn only while the investigator is in the sea. Render only.
 */

import * as THREE from 'three';
import { clamp } from '../core/geom';
import { WATER, WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import type { Particles } from './particles';
import { SEA } from './sea';
import { seaHeight } from './seaWaves';
import { createTubeGeometry } from './tentacleMesh';
import { radius } from './tentacleShape';
import { createWorldMaterial } from './worldMaterial';

const STEPS = 22;
const SIDES = 7;
const THICK = 0.62; // metres at the root
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const smooth = (x: number): number => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

export interface DragTentacle {
  /** `alpha`: how far the picture is from the last step to the next, 0 to 1: the investigator's own interpolation, so the tentacle holds the body as it is drawn. */
  update(time: number, alpha: number): void;
}

export function createDragTentacle(scene: THREE.Scene, g: Game, particles: Particles): DragTentacle {
  const material = createWorldMaterial({ texture: 'flesh', uvScale: [1.5, 3], vertexColors: true, vary: 0.4, seed: 4 });
  const mesh = new THREE.Mesh(createTubeGeometry(STEPS, SIDES), material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const col = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
  let wake = 0; // the time of the last puff of foam
  let seed = 7;
  const rand = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /** A point of the arch (a cubic Bézier from under the water at the root to the tip), `s` of the way. */
  const arch = (s: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 => {
    const u = 1 - s;
    return out.set(
      u * u * u * p0.x + 3 * u * u * s * p1.x + 3 * u * s * s * p2.x + s * s * s * p3.x,
      u * u * u * p0.y + 3 * u * u * s * p1.y + 3 * u * s * s * p2.y + s * s * s * p3.y,
      u * u * u * p0.z + 3 * u * u * s * p1.z + 3 * u * s * s * p2.z + s * s * s * p3.z,
    );
  };
  const [p0, p1, p2, p3, pt, helix, side] = [0, 0, 0, 0, 0, 0, 0].map(() => new THREE.Vector3());

  return {
    update(time, alpha) {
      const f = g.player.falling;
      const w = f?.water;
      if (!f || !w || w.entered < 0) {
        mesh.visible = false;
        return;
      }
      const tr = g.ecs.c.transform.get(g.player.id)!;
      const blend = clamp(Number.isFinite(alpha) ? alpha : 0, 0, 1);
      const frame = f.frame + blend;
      const body = new THREE.Vector3(lerp(tr.prev.x, tr.pos.x, blend), lerp(tr.prev.y, tr.pos.y, blend) + 0.95, lerp(tr.prev.z, tr.pos.z, blend)); // the waist
      const since = frame - w.entered;
      const rise = smooth((since - 3) / (WATER.seize - 10)); // up out of the water, and over, by the time it has hold
      const held = Math.max(0, frame - w.grab);
      const tight = w.grab < 0 ? 0 : smooth(held / 18);
      mesh.visible = rise > 0.01;
      if (!mesh.visible) return;
      const level = (x: number, z: number): number => WORLD.seaLevel + seaHeight(x, z, time, SEA.chop.value);
      const [rx, rz] = [w.root.x, w.root.z];
      const root = pt.set(rx, level(rx, rz), rz);
      const horiz = Math.hypot(body.x - rx, body.z - rz);
      const lift = (1.6 + 0.5 * horiz) * (1 - 0.65 * tight); // an arch that sags as it draws them
      // The tip: reaching up over the water, then to the body, then the body itself.
      const reach = smooth((rise - 0.3) / 0.7);
      const tip = p3.set(lerp(rx + (body.x - rx) * 0.25, body.x, reach), lerp(root.y + 2.4 * rise, body.y, reach), lerp(rz + (body.z - rz) * 0.25, body.z, reach));
      p0.set(rx, root.y - 1.8, rz);
      p1.set(rx, root.y + lift * 0.85 * rise, rz);
      p2.set(lerp(rx, tip.x, 0.62), root.y + lift * 1.05 * rise * (1 - 0.35 * reach), lerp(rz, tip.z, 0.62));
      const grown = smooth(rise * 1.15); // how much of its length is out of the water
      const coil = smooth((reach - 0.8) / 0.2); // wound about the waist, tighter once it draws
      const around = Math.atan2(body.z - rz, body.x - rx);
      for (let i = 0; i <= STEPS; i++) {
        const s = i / STEPS;
        arch(Math.min(s, 1) * Math.max(grown, 0.04), p0, p1, p2, tip, helix); // (where along the arch: all of it, grown out of the water)
        const sway = (1 - coil) * (1 - 0.6 * tight) * 0.22 * Math.sin(s * 9 - time * 4 + 1.3) * s * (1 - s) * 4;
        side.set(-Math.sin(around), 0, Math.cos(around)).multiplyScalar(sway);
        const wrap = smooth((s - 0.72) / 0.28) * coil; // the last of it winds round the body
        const a = around + Math.PI + (s - 0.72) * Math.PI * 2 * 1.9 + time * 0.5 * (1 - tight);
        const wr = (0.38 - 0.1 * tight) * wrap;
        const x = lerp(helix.x + side.x, body.x + Math.cos(a) * wr, wrap);
        const y = lerp(helix.y, body.y + (s - 0.86) * 2.4 * 0.5 + 0.1 * Math.sin(a * 2), wrap);
        const z = lerp(helix.z + side.z, body.z + Math.sin(a) * wr, wrap);
        const rad = Math.max(0.05, radius(s, THICK) * (0.5 + 0.5 * smooth(rise * 2)) * (1 - 0.25 * tight * s));
        for (let j = 0; j < SIDES; j++) {
          const b = (j / SIDES) * Math.PI * 2;
          pos.setXYZ(i * SIDES + j, x + Math.cos(b) * rad, y, z + Math.sin(b) * rad);
          const band = 0.5 + 0.5 * Math.sin(s * 40 + 1.7);
          const wet = 0.7 + 0.3 * s;
          col.setXYZ(i * SIDES + j, (0.2 + 0.12 * band) * wet, (0.34 + 0.16 * band) * wet, (0.3 + 0.12 * band) * wet);
        }
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
      // The spray where it breaks the water as it rises, and the wake where it draws the body.
      if (time - wake > (tight > 0 ? 0.05 : 0.14)) {
        wake = time;
        const [px, pz, up, n] = tight > 0 ? [body.x, body.z, level(body.x, body.z), 3] : [rx, rz, root.y, rise < 0.9 ? 4 : 0];
        for (let k = 0; k < n; k++) {
          const t = rand() * Math.PI * 2;
          const v = 0.4 + rand() * 1.4;
          particles.spawn({ x: px + Math.cos(t) * 0.45, y: up + 0.12, z: pz + Math.sin(t) * 0.45, vx: Math.cos(t) * v - w.heading.x * tight * 1.2, vy: 0.9 + rand() * 1.6, vz: Math.sin(t) * v - w.heading.z * tight * 1.2, life: 0.7 + rand() * 0.5, size: 0.35 + rand() * 0.5, grow: 2, color: [0.72, 0.78, 0.76], alpha: 0.5, gravity: 4.5, drag: 0.6 });
        }
      }
    },
  };
}
