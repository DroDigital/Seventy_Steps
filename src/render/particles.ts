/**
 * Particles (render only): dust, sparks, ichor, glowing motes and the boss attacks' effects, as one
 * instanced batch of camera-facing sprites. Round 51: a sprite is no longer only a round disc. It may be
 * a disc, a diamond shard, a streak stretched along its flight, a ring, a four-point spark or a soft wisp;
 * it may spin, hold its brightness before fading, and change colour over its life (an ember cooling from
 * white to red to black, a spore going from green to grey). Transparency is ordered-dithered like the
 * sprites', so they need no sorting; glowing ones are self-lit, the rest take the moon and the lantern, and
 * all fog.
 */

import * as THREE from 'three';
import type { Rgb } from './palette';
import { LANTERN_GLSL } from './shaders/world';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 2400;

export const PARTICLE_SHAPES = ['disc', 'shard', 'streak', 'ring', 'spark', 'wisp'] as const;
export type ParticleShape = (typeof PARTICLE_SHAPES)[number];

export interface ParticleSpec {
  x: number;
  y: number;
  z: number;
  vx?: number; // m/s
  vy?: number;
  vz?: number;
  life: number; // seconds
  size: number; // metres across at birth...
  grow?: number; // ...times this at death
  color: Rgb;
  alpha?: number; // at birth, fading to 0
  glow?: boolean; // self-lit
  gravity?: number; // m/s² downward
  drag?: number; // per second
  shape?: ParticleShape; // default: a disc
  colorEnd?: Rgb; // the colour at death (default: its own)
  spin?: number; // rad/s about the view axis (not for a streak, which lies along its flight)
  rot?: number; // radians at birth
  stretch?: number; // a streak's length, in sizes per m/s of its speed (default 0.12), at least one size
  hold?: number; // the share of its life it keeps its full alpha before it fades (default 0)
  thick?: number; // a ring's thickness, a share of its radius (default 0.18)
}

export interface Particles {
  spawn(p: ParticleSpec): void;
  /** Steps and draws them; `time` is render seconds. */
  update(time: number, camera: THREE.Camera): void;
}

const VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uSnap;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uAmbient;
uniform vec3 uLightColor;
attribute vec4 aColor; // rgb, alpha
attribute float aGlow;
attribute vec4 aShape; // shape, rotation, length (sizes), thickness
attribute vec3 aVel; // the flight, for a streak
varying vec2 vUv;
varying vec4 vColor;
varying vec3 vLight;
varying float vFog;
varying vec2 vShape;
${LANTERN_GLSL}
void main() {
  vec3 origin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float s = length(instanceMatrix[0].xyz);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float angle = aShape.y;
  float len = 1.0;
  if (aShape.x > 1.5 && aShape.x < 2.5) { // a streak lies along its flight as the screen sees it
    vec3 vv = (viewMatrix * vec4(aVel, 0.0)).xyz;
    angle = atan(vv.y, vv.x + 1e-5);
    len = aShape.z;
  }
  float cs = cos(angle);
  float sn = sin(angle);
  vec2 corner = vec2(position.x * len, position.y);
  vec2 p = vec2(corner.x * cs - corner.y * sn, corner.x * sn + corner.y * cs);
  vec3 wp = origin + (right * p.x + up * p.y) * s;
  vec4 vp = viewMatrix * vec4(wp, 1.0);
  vec4 clip = projectionMatrix * vp;
  if (uSnap > 0.0 && clip.w > 0.0) {
    vec2 grid = uRes * 0.5 / uSnap;
    clip.xy = floor(clip.xy / clip.w * grid + 0.5) / grid * clip.w;
  }
  gl_Position = clip;
  vUv = uv;
  vColor = aColor;
  vShape = vec2(aShape.x, aShape.w);
  vLight = aGlow > 0.5 ? vec3(1.0) : uAmbient + (uLightColor + uLanternColor * lanternAt(uLanternPos - wp)) * 0.8;
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogAmount;
varying vec2 vUv;
varying vec4 vColor;
varying vec3 vLight;
varying float vFog;
varying vec2 vShape;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
float mask(vec2 q) {
  int shape = int(vShape.x + 0.5);
  float r = length(q);
  if (shape == 1) return 1.0 - smoothstep(0.5, 1.0, abs(q.x) + abs(q.y)); // a diamond shard
  if (shape == 2) { // a streak: thin and faint at its tail, bright and full at its head
    float t = q.x * 0.5 + 0.5;
    float half_ = mix(0.1, 0.5, t);
    return (1.0 - smoothstep(half_ * 0.55, half_, abs(q.y))) * smoothstep(0.0, 0.55, t) * (1.0 - smoothstep(0.93, 1.0, t));
  }
  if (shape == 3) { // a ring
    float th = max(vShape.y, 0.04);
    return 1.0 - smoothstep(th * 0.45, th, abs(r - (1.0 - th)));
  }
  if (shape == 4) return 1.0 - smoothstep(0.55, 1.0, sqrt(abs(q.x)) + sqrt(abs(q.y))); // a four-point spark
  if (shape == 5) return exp(-3.2 * dot(q, q)); // a soft wisp
  return 1.0 - smoothstep(0.35, 1.0, r); // a disc
}
void main() {
  vec2 q = (vUv - 0.5) * 2.0;
  float a = vColor.a * mask(q);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(mix(vColor.rgb * vLight, uFogColor, vFog * uFogAmount), 1.0);
}
`;

type Live = Required<Omit<ParticleSpec, 'colorEnd' | 'shape'>> & { colorEnd: Rgb | null; shape: number; age: number };

export function createParticles(scene: THREE.Scene): Particles {
  const geo = new THREE.PlaneGeometry(1, 1);
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const glows = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY), 1).setUsage(THREE.DynamicDrawUsage);
  const shapes = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const vels = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aColor', colors);
  geo.setAttribute('aGlow', glows);
  geo.setAttribute('aShape', shapes);
  geo.setAttribute('aVel', vels);
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms }, vertexShader: VERT, fragmentShader: FRAG });
  const batch = new THREE.InstancedMesh(geo, material, CAPACITY);
  batch.frustumCulled = false;
  batch.count = 0;
  scene.add(batch);

  const live: Live[] = [];
  const m4 = new THREE.Matrix4();
  let last = -1;

  return {
    spawn(p) {
      if (live.length >= CAPACITY) live.shift();
      const { shape, colorEnd, ...rest } = p;
      live.push({
        vx: 0, vy: 0, vz: 0, grow: 1, alpha: 1, glow: false, gravity: 0, drag: 0, spin: 0, rot: 0, stretch: 0.12, hold: 0, thick: 0.18,
        ...rest, shape: shape ? PARTICLE_SHAPES.indexOf(shape) : 0, colorEnd: colorEnd ?? null, age: 0,
      });
    },
    update(time) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      let n = 0;
      for (let i = 0; i < live.length; i++) {
        const p = live[i];
        p.age += dt;
        if (p.age >= p.life) continue;
        const k = Math.exp(-p.drag * dt);
        p.vx *= k;
        p.vz *= k;
        p.vy = p.vy * k - p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const t = p.age / p.life;
        const size = p.size * (1 + (p.grow - 1) * t);
        batch.setMatrixAt(n, m4.makeScale(size, size, size).setPosition(p.x, p.y, p.z));
        const e = p.colorEnd;
        const fade = t < p.hold ? 1 : 1 - (t - p.hold) / Math.max(1e-3, 1 - p.hold);
        colors.setXYZW(n, e ? p.color[0] + (e[0] - p.color[0]) * t : p.color[0], e ? p.color[1] + (e[1] - p.color[1]) * t : p.color[1], e ? p.color[2] + (e[2] - p.color[2]) * t : p.color[2], p.alpha * fade);
        glows.setX(n, p.glow ? 1 : 0);
        const speed = Math.hypot(p.vx, p.vy, p.vz);
        shapes.setXYZW(n, p.shape, p.rot + p.spin * p.age, p.shape === 2 ? Math.max(1, 1 + p.stretch * speed) : 1, p.thick);
        vels.setXYZ(n, p.vx, p.vy, p.vz);
        live[n++] = p;
      }
      live.length = n;
      batch.count = n;
      batch.instanceMatrix.needsUpdate = true;
      colors.needsUpdate = true;
      glows.needsUpdate = true;
      shapes.needsUpdate = true;
      vels.needsUpdate = true;
    },
  };
}
