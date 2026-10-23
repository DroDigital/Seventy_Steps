/**
 * Bolts in flight (render only). Each is the body its caster's shot look names (render/shotLook.ts, built in shotShapes*.ts: a fish,
 * a torn page, a crooked knife, a snake, a trilobed eye...), tinted per instance in the horror's light, flown as its form flies
 * (pointing where it goes, turning over, spinning), and it flies where the simulation put it. A body is flat-shaded in four tones:
 * the tint lit, a white-hot heart, a dark, a pale; some parts sway, swell or flap in the vertex shader. The first drawing of a form
 * builds its geometry. The old draw was one bone shard with a void-green trail, then five stock solids chosen by name.
 */

import * as THREE from 'three';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { FLIGHT, SHAPES } from './shotShapes';
import { shotLook, SHOT_FORMS, type ShotForm } from './shotLook';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 64;

export const BOLT_VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;
attribute float aTone;
attribute vec2 aMove;
attribute float aSeed;
varying vec3 vColor;
varying vec3 vNormal;
varying float vTone;
varying float vFog;
void main() {
  vec3 p = position;
  float w = aMove.x;
  if (aMove.y > 0.5 && aMove.y < 1.5) p.x += w * 0.32 * sin(p.z * 3.2 - uTime * 11.0 + aSeed);
  else if (aMove.y > 1.5 && aMove.y < 2.5) p *= 1.0 + w * 0.12 * sin(uTime * 8.0 + aSeed + dot(p, vec3(1.7, 2.3, 1.1)) * 1.3);
  else if (aMove.y > 2.5) p.y += w * 0.2 * sin(uTime * 12.0 + aSeed + p.x * 2.4);
  mat4 m = modelMatrix * instanceMatrix;
  vColor = instanceColor;
  vTone = aTone;
  vNormal = mat3(viewMatrix) * mat3(m) * normal;
  vec4 vp = viewMatrix * m * vec4(p, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

export const BOLT_FRAG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogAmount;
varying vec3 vColor;
varying vec3 vNormal;
varying float vTone;
varying float vFog;
void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  float lit = 0.5 + 0.5 * max(dot(n, normalize(vec3(0.35, 0.65, 0.7))), 0.0);
  vec3 c = vColor * lit;
  if (vTone > 0.5 && vTone < 1.5) c = mix(vColor, vec3(1.0), 0.72);
  else if (vTone > 1.5 && vTone < 2.5) c = vColor * 0.24 * (0.7 + 0.3 * lit);
  else if (vTone > 2.5) c = mix(vColor, vec3(1.0), 0.5) * (0.7 + 0.3 * lit);
  gl_FragColor = vec4(mix(c, uFogColor, vFog * uFogAmount * 0.45), 1.0);
}
`;

export interface BoltViews {
  update(alpha: number, time: number): void;
}

export function createBoltViews(scene: THREE.Scene, g: Game): BoltViews {
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms }, vertexShader: BOLT_VERT, fragmentShader: BOLT_FRAG, side: THREE.DoubleSide, depthWrite: true });
  const meshes = new Map<ShotForm, THREE.InstancedMesh>();
  const seeds = new Map<ShotForm, THREE.InstancedBufferAttribute>();
  const meshOf = (form: ShotForm): THREE.InstancedMesh => {
    let mesh = meshes.get(form);
    if (!mesh) {
      const geo = SHAPES[form]();
      const seed = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY), 1);
      geo.setAttribute('aSeed', seed);
      mesh = new THREE.InstancedMesh(geo, material, CAPACITY);
      mesh.frustumCulled = false;
      mesh.count = 0;
      mesh.setColorAt(0, new THREE.Color(1, 1, 1));
      scene.add(mesh);
      meshes.set(form, mesh);
      seeds.set(form, seed);
    }
    return mesh;
  };
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const turn = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const axis = new THREE.Vector3();
  const [AXIS_X, AXIS_Y, AXIS_Z] = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const tint = new THREE.Color();
  const nOf = new Map<ShotForm, number>();

  return {
    update(alpha, time) {
      for (const form of SHOT_FORMS) nOf.set(form, 0);
      for (const [id, b] of g.ecs.c.bolt) {
        if (b.pool?.fire && b.faction === 'player') continue;
        const tr = g.ecs.c.transform.get(id);
        const look = shotLook(creatureOf(g, b.owner)?.id, b.lob);
        const n = nOf.get(look.form)!;
        if (!tr || n >= CAPACITY) continue;
        const [mesh, flight] = [meshOf(look.form), FLIGHT[look.form]];
        at.set(tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.y + (tr.pos.y - tr.prev.y) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha);
        const seed = (id * 2.399) % (Math.PI * 2);
        const [vx, vy, vz] = [b.vel.x, b.vel.y, b.vel.z];
        const speed = Math.hypot(vx, vy, vz);
        const yaw = speed > 0.05 ? Math.atan2(vx, vz) : tr.prevYaw + (tr.yaw - tr.prevYaw) * alpha;
        const t = time * flight.rate + seed;
        if (flight.mode === 'tumble') q.setFromAxisAngle(axis.set(Math.sin(seed * 1.3), 1, Math.cos(seed * 0.7)).normalize(), t);
        else {
          q.setFromEuler(euler.set(flight.mode === 'point' && speed > 0.05 ? -Math.asin(Math.max(-1, Math.min(1, vy / speed))) : 0, yaw, 0));
          if (flight.mode === 'point') q.multiply(turn.setFromAxisAngle(AXIS_Z, t));
          else if (flight.mode === 'flip') q.multiply(turn.setFromAxisAngle(AXIS_X, t));
          else q.multiply(turn.setFromAxisAngle(AXIS_Y, flight.mode === 'turn' ? t : t * 0.2));
        }
        const s = b.radius * flight.size;
        mesh.setMatrixAt(n, m4.compose(at, q, size.set(s, s, s)));
        mesh.setColorAt(n, tint.setRGB(look.color[0], look.color[1], look.color[2]));
        seeds.get(look.form)!.setX(n, seed);
        nOf.set(look.form, n + 1);
      }
      for (const [form, mesh] of meshes) {
        const n = nOf.get(form)!;
        mesh.count = n;
        mesh.visible = n > 0;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        seeds.get(form)!.needsUpdate = true;
      }
    },
  };
}
