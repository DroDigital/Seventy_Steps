/**
 * Blob shadows (render only): a soft dark disc on the ground under every body that stands in the
 * world — the investigator, the people met, creatures and colossi — so nothing floats. Ordered-
 * dithered like the particles; a hovering creature's shadow shrinks and fades with its height.
 * Round 81: it is as wide as the body is painted (a colossus's is not hidden under its picture) and,
 * where the moon casts shadows, drawn out away from the moon (render/blobShape.ts), the way the
 * body's real shadow lies. Read-only on the simulation.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { blobShape, type Blob } from './blobShape';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 96;
const LIFT = 0.04; // metres above the ground

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
attribute float aAlpha;
varying vec2 vP;
varying float vAlpha;
varying float vFog;
void main() {
  vP = position.xz;
  vAlpha = aAlpha;
  vec4 vp = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
varying vec2 vP;
varying float vAlpha;
varying float vFog;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float r = length(vP);
  float a = vAlpha * (1.0 - smoothstep(0.35, 1.0, r)) * (1.0 - vFog);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

export interface Shadows {
  update(alpha: number): void;
}

/** `painted`: how wide each creature is drawn this frame, in metres (render/creatureViews.ts); those not in it are as wide as their capsule. */
export function createShadows(scene: THREE.Scene, g: Game, painted: ReadonlyMap<Entity, number> = new Map()): Shadows {
  const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const alphas = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY), 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aAlpha', alphas);
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms }, vertexShader: VERT, fragmentShader: FRAG, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const batch = new THREE.InstancedMesh(geo, material, CAPACITY);
  batch.frustumCulled = false;
  batch.count = 0;
  scene.add(batch);
  const m4 = new THREE.Matrix4();
  const [q, at, scale, up] = [new THREE.Quaternion(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(0, 1, 0)];
  const [toMoon, blob] = [new THREE.Vector3(), { across: 0, along: 0, yaw: 0, shift: 0, alpha: 0 } as Blob];
  const c = g.ecs.c;

  /** Whether a body casts one: standing in the world, not hidden, not a prop. */
  const casts = (id: Entity): boolean => {
    const model = c.model.get(id);
    return !!model && !model.startsWith('fx:') && !isAbsent(g, id) && !isUnseen(g, id) && c.brain.get(id)?.state !== 'hidden' && !c.dead.has(id);
  };

  return {
    update(alpha) {
      const moon = worldUniforms.uShadow.value.x > 0 ? toMoon.copy(worldUniforms.uLightDir.value).normalize() : null; // where the moon casts shadows (moonShadow.ts), the blob lies the same way
      let n = 0;
      for (const [id, body] of c.body) {
        if (n >= CAPACITY || !casts(id)) continue;
        const tr = c.transform.get(id);
        if (!tr) continue;
        const x = tr.prev.x + (tr.pos.x - tr.prev.x) * alpha;
        const z = tr.prev.z + (tr.pos.z - tr.prev.z) * alpha;
        const hover = c.brain.get(id)?.def.params.hover ?? 0;
        blobShape(body.radius, painted.get(id), hover, moon, blob);
        q.setFromAxisAngle(up, blob.yaw);
        at.set(x + Math.sin(blob.yaw) * blob.shift, g.world.ground(x, z) + LIFT, z + Math.cos(blob.yaw) * blob.shift);
        batch.setMatrixAt(n, m4.compose(at, q, scale.set(blob.across, 1, blob.along)));
        alphas.setX(n++, blob.alpha);
      }
      batch.count = n;
      batch.instanceMatrix.needsUpdate = true;
      alphas.needsUpdate = true;
    },
  };
}
