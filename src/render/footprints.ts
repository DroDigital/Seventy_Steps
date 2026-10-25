/**
 * Prints in soft ground (round 78; render only, read-only on the simulation): where the region's ground is snow, mud, sand, dirt, leaves
 * or soft grass, whatever walks across it on foot, the investigator, the people and the creatures near, leaves a print at each
 * stride, a pressed hollow in an ellipse set along the way it went, with a lip pushed up about it, in the colour of that ground, dithered as the blob shadows are, and
 * fading out in its own time (snow keeps it longest). A flyer, a rider, a body in the sea and what is hidden or unseen leave none; nor
 * does a room under a roof, nor ground that is not soft. A ring of the last few hundred.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { PRINTS } from '../data/fxTuning';
import { getRegion } from '../data/regions';
import { SIM, WORLD } from '../data/tuning';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { worldUniforms } from './worldMaterial';

const LIFT = 0.035; // metres above the ground

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
attribute float aAlpha;
attribute vec3 aTint;
varying vec2 vP;
varying float vAlpha;
varying vec3 vTint;
varying float vFog;
void main() {
  vP = position.xz;
  vAlpha = aAlpha;
  vTint = aTint;
  vec4 vp = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uAmbient;
uniform vec3 uLightColor;
varying vec2 vP;
varying float vAlpha;
varying vec3 vTint;
varying float vFog;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float r = length(vP);
  float hollow = 1.0 - smoothstep(0.52, 0.62, r); // the pressed middle, and the lip pushed up about it
  float a = vAlpha * (1.0 - vFog) * mix(1.0, 1.7, hollow); // (dithered, as the blob shadows are: the middle the surer)
  if (r > 1.0 || a < bayer4(gl_FragCoord.xy)) discard;
  vec3 ground = vTint * (uAmbient + uLightColor * 0.35);
  gl_FragColor = vec4(mix(ground * 1.7 + 0.02, ground * 0.4, hollow), 1.0);
}
`;

/** The ground a region's land is, as a print takes it, or undefined for ground that keeps none. */
export const softGround = (region: string | null) => PRINTS.soft[getRegion(region ?? '')?.biome.texture ?? ''];

/** How much of a print is left `age` seconds after it was laid, of `life`: all of it, then fading out over the last of its life. */
export const printAlpha = (age: number, life: number): number => (age < 0 || age >= life ? 0 : Math.min(1, (life - age) / (life * PRINTS.fade)));

export interface Footprints {
  /** Each drawn frame: lays what the bodies near have stepped, and fades the rest. `time` is render seconds; `alpha` between two ticks; `enclosed`: under a roof. */
  update(at: { x: number; z: number }, time: number, alpha: number, enclosed: boolean): void;
}

export function createFootprints(scene: THREE.Scene, g: Game): Footprints {
  const n = PRINTS.capacity;
  const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const attr = (size: number): THREE.InstancedBufferAttribute => new THREE.InstancedBufferAttribute(new Float32Array(n * size), size).setUsage(THREE.DynamicDrawUsage);
  const [alphas, tints] = [attr(1), attr(3)];
  geo.setAttribute('aAlpha', alphas);
  geo.setAttribute('aTint', tints);
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms }, vertexShader: VERT, fragmentShader: FRAG, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mesh = new THREE.InstancedMesh(geo, material, n);
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const laid = Array.from({ length: n }, () => ({ born: 0, life: 0, strength: 0 }));
  const m4 = new THREE.Matrix4();
  const [q, pos, scale] = [new THREE.Quaternion(), new THREE.Vector3(), new THREE.Vector3()];
  const up = new THREE.Vector3(0, 1, 0);
  const tracks = new Map<Entity, { x: number; z: number; side: number }>();
  let [next, used] = [0, 0];

  const lay = (x: number, z: number, yaw: number, radius: number, side: number, time: number, soft: { strength: number; seconds: number; tint: readonly [number, number, number] }): void => {
    const [along, across] = [0.26 + 0.6 * radius, 0.15 + 0.3 * radius];
    const off = (0.06 + 0.3 * radius) * side;
    const [px, pz] = [x - Math.cos(yaw) * off, z + Math.sin(yaw) * off]; // to the body's right (yaw 0 faces +z) is (-cos, sin)
    q.setFromAxisAngle(up, yaw);
    m4.compose(pos.set(px, g.world.ground(px, pz) + LIFT, pz), q, scale.set(across, 1, along));
    mesh.setMatrixAt(next, m4);
    tints.setXYZ(next, ...soft.tint);
    laid[next] = { born: time, life: soft.seconds, strength: soft.strength };
    next = (next + 1) % n;
    used = Math.min(n, used + 1);
  };

  return {
    update(at, time, alpha, enclosed) {
      const soft = enclosed || !g.overworld ? undefined : softGround(g.overworld.region);
      if (soft) {
        const c = g.ecs.c;
        for (const [id, body] of c.body) {
          const tr = c.transform.get(id);
          if (!tr) continue;
          const me = id === g.player.id;
          if (me ? g.player.mount.active !== null : !c.model.has(id) || c.model.get(id)!.startsWith('fx:') || isAbsent(g, id) || isUnseen(g, id) || c.dead.has(id) || c.brain.get(id)?.state === 'hidden' || (c.brain.get(id)?.def.params.hover ?? 0) > 0) continue;
          const [x, z] = [tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha];
          if (Math.hypot(x - at.x, z - at.z) > PRINTS.reach || tr.pos.y < WORLD.seaLevel + 0.25) {
            tracks.delete(id);
            continue;
          }
          const track = tracks.get(id);
          if (!track) {
            tracks.set(id, { x, z, side: 1 });
            continue;
          }
          const [dx, dz] = [x - track.x, z - track.z];
          const stride = PRINTS.stride[0] + PRINTS.stride[1] * body.radius;
          if (Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz < PRINTS.minSpeed) { // standing, or creeping: no print, and the next stride is counted from here
            [track.x, track.z] = [x, z];
            continue;
          }
          if (Math.hypot(dx, dz) < stride) continue;
          lay(x, z, Math.atan2(dx, dz), body.radius, track.side, time, soft);
          [track.x, track.z, track.side] = [x, z, -track.side];
        }
      }
      for (const id of tracks.keys()) if (!g.ecs.c.body.has(id)) tracks.delete(id);
      for (let i = 0; i < used; i++) {
        const l = laid[i];
        const a = printAlpha(time - l.born, l.life) * l.strength;
        alphas.setX(i, a);
      }
      mesh.count = used;
      mesh.instanceMatrix.needsUpdate = true;
      alphas.needsUpdate = tints.needsUpdate = true;
    },
  };
}
