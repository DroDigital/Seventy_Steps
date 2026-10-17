/**
 * The tube a tentacle is drawn as (round 30; moved out of tentacles.ts in round 55 so the one that takes hold of the investigator in the
 * water, render/dragTentacle.ts, is drawn the same): `steps + 1` rings of `sides` points, a strip of triangles between each, UVs that run
 * round and along it, and a colour for each point. Its points are set each frame by whoever owns it.
 */

import * as THREE from 'three';

export function createTubeGeometry(steps: number, sides: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const n = (steps + 1) * sides;
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const uv = new Float32Array(n * 2);
  const index: number[] = [];
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j < sides; j++) {
      uv.set([(j / sides) * 2, (i / steps) * 7], (i * sides + j) * 2);
      if (i < steps) {
        const [a, b, c, d] = [i * sides + j, i * sides + ((j + 1) % sides), (i + 1) * sides + j, (i + 1) * sides + ((j + 1) % sides)];
        index.push(a, c, b, b, c, d);
      }
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  return geo;
}
