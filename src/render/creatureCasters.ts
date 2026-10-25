/**
 * What the moon, the lantern and the lamps see of a creature (round 78; render only). The drawn creatures
 * were only billboards, which cast nothing: the investigator's own shadow and the people's fell across
 * the ground and the walls, and a Deep One that stood in the lantern's way left the ground behind it lit.
 * Each creature near the investigator now stands in the shadow passes as one closed, rounded body of its
 * own painted breadth and height, on the CASTER and LANTERN_CASTER layers alone (the investigator's
 * camera does not draw it). The body is capped in height, so a colossus does not black out its arena,
 * and shrinks as the picture goes in a death. A creature's own light is taken at a point a little out
 * toward the moon (shaders/sprite.ts), so it is not in the shadow of its own body.
 */

import * as THREE from 'three';
import { LANTERN_CASTER } from './colliderShadow';
import { CASTER } from './moonShadow';

const CAPACITY = 64;
const CAP = { height: 6, breadth: 2.6, reach: 48 }; // metres: the tallest and broadest a shadow is cast from, and how far from the investigator one is cast at all
const HIDDEN = new THREE.MeshBasicMaterial(); // never drawn by the investigator's camera (layers 1 and 2 alone); the shadow passes draw it with their own

/** A closed body, one metre tall, of radius one at its broadest: a lathe about its axis, wide at the hips and narrowing to the head, wound to look out of itself (the lantern's map draws the far faces of it). */
export function casterBody(): THREE.BufferGeometry {
  const profile = [[0, 0], [0.8, 0], [1, 0.16], [0.98, 0.45], [0.7, 0.78], [0.38, 0.95], [0, 1]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(profile, 10);
}

export interface CreatureCasters {
  readonly mesh: THREE.InstancedMesh;
  begin(): void;
  /** A body standing at (x, y, z) (its feet), `across` metres painted across and `height` up; `keep` (0..1) of it is left (a dying creature's goes with its picture). */
  put(x: number, y: number, z: number, across: number, height: number, keep: number, from: { x: number; z: number }): void;
  end(): void;
}

export function createCreatureCasters(scene: THREE.Scene): CreatureCasters {
  const mesh = new THREE.InstancedMesh(casterBody(), HIDDEN, CAPACITY);
  mesh.layers.set(CASTER);
  mesh.layers.enable(LANTERN_CASTER);
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const m4 = new THREE.Matrix4();
  const [pos, scale] = [new THREE.Vector3(), new THREE.Vector3()];
  const q = new THREE.Quaternion();
  let n = 0;
  return {
    mesh,
    begin() {
      n = 0;
    },
    put(x, y, z, across, height, keep, from) {
      if (n >= CAPACITY || keep <= 0.05 || Math.hypot(x - from.x, z - from.z) > CAP.reach) return;
      const r = Math.min(CAP.breadth, Math.max(0.2, across * 0.32)) * keep;
      const h = Math.min(CAP.height, Math.max(0.4, height * 0.9)) * keep;
      mesh.setMatrixAt(n++, m4.compose(pos.set(x, y, z), q, scale.set(r, h, r)));
    },
    end() {
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
