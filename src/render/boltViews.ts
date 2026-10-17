/**
 * Bolts in flight (render only). Each is the mesh its caster's shot look names, tinted per instance,
 * and it flies where the simulation put it. The old draw was one bone shard with a void-green
 * trail, so every shot read as the same fireball.
 */

import * as THREE from 'three';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { shotLook, SHOT_FORMS, type ShotForm } from './shotLook';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 64;

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vColor;
varying float vFog;
void main() {
  vColor = instanceColor;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec4 vp = viewMatrix * wp;
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogAmount;
varying vec3 vColor;
varying float vFog;
void main() {
  gl_FragColor = vec4(mix(vColor, uFogColor, vFog * uFogAmount * 0.45), 1.0);
}
`;

function geometry(form: ShotForm): THREE.BufferGeometry {
  if (form === 'orb') return new THREE.IcosahedronGeometry(1, 1);
  if (form === 'shard') return new THREE.OctahedronGeometry(1, 0).scale(0.42, 1.25, 0.42);
  if (form === 'drop') return new THREE.SphereGeometry(1, 7, 5).scale(0.72, 0.9, 0.72);
  if (form === 'spark') return new THREE.TetrahedronGeometry(0.85, 0);
  return new THREE.ConeGeometry(0.32, 1.7, 5).rotateX(Math.PI / 2);
}

export interface BoltViews {
  update(alpha: number, time: number): void;
}

export function createBoltViews(scene: THREE.Scene, g: Game): BoltViews {
  const material = new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms },
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: true,
  });
  const meshes = {} as Record<ShotForm, THREE.InstancedMesh>;
  for (const form of SHOT_FORMS) {
    const mesh = new THREE.InstancedMesh(geometry(form), material, CAPACITY);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    scene.add(mesh);
    meshes[form] = mesh;
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const axis = new THREE.Vector3(0.35, 1, 0.15).normalize();
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const tint = new THREE.Color();
  const nOf = { orb: 0, shard: 0, drop: 0, spark: 0, dart: 0 };

  return {
    update(alpha, time) {
      for (const form of SHOT_FORMS) nOf[form] = 0;
      for (const [id, b] of g.ecs.c.bolt) {
        if (b.pool?.fire && b.faction === 'player') continue;
        const tr = g.ecs.c.transform.get(id);
        const look = shotLook(creatureOf(g, b.owner)?.id, b.lob);
        const n = nOf[look.form];
        const mesh = meshes[look.form];
        if (!tr || n >= CAPACITY) continue;
        at.set(tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.y + (tr.pos.y - tr.prev.y) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha);
        if (look.form === 'dart' || look.form === 'drop') {
          euler.set(0, tr.prevYaw + (tr.yaw - tr.prevYaw) * alpha, 0);
          q.setFromEuler(euler);
        } else q.setFromAxisAngle(axis, time * (look.form === 'orb' ? 2.2 : 7) + id);
        const s = b.radius * (look.form === 'dart' ? 1.7 : look.form === 'spark' ? 0.9 : 1.15);
        mesh.setMatrixAt(n, m4.compose(at, q, size.set(s, look.form === 'drop' ? s * 0.75 : s, s)));
        mesh.setColorAt(n, tint.setRGB(look.color[0], look.color[1], look.color[2]));
        nOf[look.form] = n + 1;
      }
      for (const form of SHOT_FORMS) {
        const mesh = meshes[form];
        mesh.count = nOf[form];
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    },
  };
}
