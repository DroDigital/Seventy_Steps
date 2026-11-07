/**
 * Blood on the ground (round 113; render only): the pool that spreads under a body as it dies, a severed piece's, and the spatter a
 * blow throws, as one instanced draw of flat, ragged marks laid along the ground's slope. Each is lit as the ground is (the realm's
 * ambient, the moon where it reaches, the lantern and the lamps), a wet one shining where the lantern's light glances off it; it dries
 * darker and thinner and is gone after its life. Like the creatures, its alpha marks it for the post pass to keep its own colour, so a
 * red stays red in a realm graded lilac. The oldest give way when the batch is full.
 */

import * as THREE from 'three';
import { GORE_FX } from '../data/gore';
import { LAMPS_GLSL, LANTERN_GLSL, NOISE_GLSL } from './shaders/common';
import { SHADOW_GLSL } from './shaders/shadow';
import type { Rgb } from './palette';
import { worldUniforms } from './worldMaterial';

export interface BloodMark {
  x: number; z: number;
  /** Metres across when whole. */
  size: number;
  color: Rgb;
  wet: boolean;
  /** 0 a pool, 1 a spatter thrown the way of `yaw`, 2 a ring spreading on water (round 113: render/bodyWeather.ts). */
  kind: 0 | 1 | 2;
  /** The height it lies at, if not the ground's (the sea's surface for a ring). */
  y?: number;
  yaw: number;
  /** Seconds it takes to spread to its size. */
  grow: number;
  life: number;
}

export interface BloodPools {
  lay(m: BloodMark, time: number): void;
  update(time: number): void;
  /** Takes away the blood already laid (spatter and pools), not the rings on the water: the Gore setting was turned off (round 113). */
  clearBlood(): void;
  readonly count: number;
  readonly mesh: THREE.InstancedMesh;
}

const VERT = /* glsl */ `
uniform float uTime;
attribute vec4 aMark; // born, grow seconds, life seconds, a seed
attribute vec4 aLook; // rgb, wet (1) + spatter (2) or ring (4)
varying vec2 vQ;
varying vec4 vLook;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vAge; // 0..1 of its life
varying float vSpread; // 0..1 of its size
varying float vSeed;
varying float vFog;
uniform float uFogNear;
uniform float uFogFar;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 1.0, 0.0));
  vQ = uv * 2.0 - 1.0;
  vLook = aLook;
  float age = uTime - aMark.x;
  vAge = clamp(age / max(aMark.z, 0.01), 0.0, 1.0);
  float g = clamp(age / max(aMark.y, 0.01), 0.0, 1.0);
  vSpread = 1.0 - (1.0 - g) * (1.0 - g);
  vSeed = aMark.w;
  vec4 vp = viewMatrix * wp;
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uAmbient;
uniform vec3 uLightColor;
uniform vec3 uLightDir;
uniform vec3 uFogColor;
uniform float uFogAmount;
uniform float uMarkCharacters;
uniform float uCharacterLight;
varying vec2 vQ;
varying vec4 vLook;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vAge;
varying float vSpread;
varying float vSeed;
varying float vFog;
${LANTERN_GLSL}
${LAMPS_GLSL}
${SHADOW_GLSL}
${NOISE_GLSL}
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
/** How much of the mark is at q (-1..1 across): a ragged pool, or a spatter (a streak and its flung drops, thrown toward +x). */
float markAt(vec2 q, bool spatter) {
  q = floor(q * 14.0) / 14.0; // by coarse texels, as the world's own ground is drawn
  float a = atan(q.y, q.x);
  if (!spatter) {
    float r = vSpread * (0.6 + 0.28 * vnoise(vec2(cos(a), sin(a)) * 1.7 + vSeed * 9.0) + 0.1 * vnoise(vec2(a * 3.0, vSeed)));
    return step(length(q), r);
  }
  float m = step(length(q * vec2(1.6, 2.6) + vec2(0.35, 0.0)), 0.45 * vSpread + 0.1);
  for (int i = 0; i < 6; i++) {
    float k = float(i) + vSeed * 13.0;
    vec2 c = vec2(-0.1 + 0.18 * float(i) * (0.8 + 0.4 * hash12(vec2(k, 1.0))), (hash12(vec2(k, 2.0)) - 0.5) * (0.25 + 0.12 * float(i)));
    m = max(m, step(length(q - c * vSpread), 0.09 * (1.0 - 0.1 * float(i)) * (0.6 + 0.5 * hash12(vec2(k, 3.0)))));
  }
  return m;
}
void main() {
  bool ring = vLook.w > 3.5;
  bool spatter = !ring && vLook.w > 1.5;
  float wet = mod(vLook.w, 2.0);
  if (ring) {
    float d = length(floor(vQ * 20.0) / 20.0);
    if (abs(d - 0.9 * vSpread) > 0.06 + 0.04 * (1.0 - vAge)) discard;
  } else if (markAt(vQ, spatter) < 0.5) discard;
  float fade = ring ? 1.0 - vAge : 1.0 - smoothstep(0.55, 1.0, vAge);
  if (fade < bayer4(gl_FragCoord.xy)) discard;
  vec3 n = normalize(vNormal);
  float moon = moonLit(vWorld, n, max(dot(n, uLightDir), 0.0));
  vec3 toLamp = uLanternPos - vWorld;
  float lantern = lanternAt(toLamp);
  vec3 light = uAmbient + uLightColor * moon * max(dot(n, uLightDir), 0.0) + (uLanternColor * lantern + lampLight(vWorld, n, 1.0)) * uCharacterLight;
  vec3 dried = mix(vLook.rgb, vLook.rgb * 0.55, smoothstep(0.2, 0.8, vAge)); // it darkens as it dries
  vec3 col = dried * light;
  vec3 eye = normalize(cameraPosition - vWorld);
  vec3 h = normalize(normalize(toLamp) + eye);
  col += uLanternColor * lantern * pow(max(dot(n, h), 0.0), 36.0) * 0.55 * wet * (1.0 - vAge); // the wet catches the lantern
  col += uLightColor * moon * pow(max(dot(n, normalize(uLightDir + eye)), 0.0), 60.0) * 0.25 * wet * (1.0 - vAge);
  gl_FragColor = vec4(mix(col, uFogColor, vFog * uFogAmount), uMarkCharacters > 0.5 ? 0.75 : 1.0); // (0.75: keeps its colour through the realm's grade, as a creature does)
}
`;

const LIFT = 0.025; // metres above the ground

export function createBloodPools(scene: THREE.Scene, ground: (x: number, z: number) => number): BloodPools {
  const capacity = GORE_FX.pools;
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const mark = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const look = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aMark', mark);
  geo.setAttribute('aLook', look);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms, uTime: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
  const mesh = new THREE.InstancedMesh(geo, material, capacity);
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.name = 'blood';
  scene.add(mesh);
  const deaths = new Float32Array(capacity); // when each slot is gone
  let next = 0;
  let used = 0;
  const m4 = new THREE.Matrix4();
  const up = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const turn = new THREE.Quaternion();
  const Y = new THREE.Vector3(0, 1, 0);

  return {
    mesh,
    get count() { return used; },
    lay(m, time) {
      let slot = next; // the oldest slot, or the first one free
      for (let i = 0; i < used; i++) if (deaths[i] <= time) { slot = i; break; }
      if (slot === next) next = (next + 1) % capacity;
      used = Math.min(capacity, Math.max(used, slot + 1));
      deaths[slot] = time + m.life;
      const e = 0.35 * Math.max(0.3, m.size); // the slope, read over the mark's own breadth
      const y = m.y ?? ground(m.x, m.z);
      if (m.y !== undefined) up.set(0, 1, 0); // (on water: level)
      else up.set(ground(m.x - e, m.z) - ground(m.x + e, m.z), 2 * e, ground(m.x, m.z - e) - ground(m.x, m.z + e)).normalize();
      q.setFromUnitVectors(Y, up).multiply(turn.setFromAxisAngle(Y, m.yaw - Math.PI / 2));
      m4.compose(new THREE.Vector3(m.x, y + LIFT, m.z), q, new THREE.Vector3(m.size, 1, m.size));
      mesh.setMatrixAt(slot, m4);
      mark.setXYZW(slot, time, m.grow, m.life, Math.random());
      look.setXYZW(slot, m.color[0], m.color[1], m.color[2], (m.wet ? 1 : 0) + (m.kind === 1 ? 2 : m.kind === 2 ? 4 : 0));
      mesh.instanceMatrix.needsUpdate = mark.needsUpdate = look.needsUpdate = true;
      mesh.count = used;
    },
    clearBlood() {
      for (let i = 0; i < used; i++) {
        if (look.getW(i) >= 4) continue; // kind 2 (a ring on the water) keeps its place
        deaths[i] = 0; // the slot is free again
        mark.setX(i, -1e9); // born long ago: past its life, the shader's fade drops it
      }
      mark.needsUpdate = true;
    },
    update(time) {
      material.uniforms.uTime.value = time;
    },
  };
}
