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
import { FLAME_ATLAS, PUFF_CELLS } from '../data/flameAtlas';
import { flameAtlasTexture } from './flames';
import type { Rgb } from './palette';
import { LANTERN_GLSL } from './shaders/world';
import { worldUniforms } from './worldMaterial';

export const CAPACITY = 4096; // (round 60: 2400, and a colossus's burst in a crowd took the oldest away mid-flight)

/** Round 74 added the smoke's puff (a free smoke sprite, data/flameAtlas.ts). Round 60 added the signatures' shapes (render/fxForms.ts): a rune, an eye, a fang's crescent, a bubble, a forked bolt, a feather, a petal, a note. */
export const PARTICLE_SHAPES = ['disc', 'shard', 'streak', 'ring', 'spark', 'wisp', 'rune', 'eye', 'fang', 'bubble', 'bolt', 'feather', 'petal', 'note', 'puff'] as const;
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
  thick?: number; // a ring's thickness, a share of its radius (default 0.18); a puff's, which of its four pictures (0 to just under 1)
  floor?: number; // the height of the ground under it: it lands there, bounces a little and comes to rest, not falling through (round 60)
  bounce?: number; // the share of its fall it keeps as it springs up again (default 0.3)
}

export interface Particles {
  spawn(p: ParticleSpec): void;
  /** Steps and draws them; `time` is render seconds. */
  update(time: number, camera: THREE.Camera): void;
  /** The ground's height at x, z (the world's, main.ts): where what falls from a blow comes to rest, though the blow land on a body or a wall. */
  ground?(x: number, z: number): number;
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
uniform sampler2D uPuffs;
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
  if (shape == 6) { // a rune: a ring, a stave and a chevron through it
    float ring = 1.0 - smoothstep(0.07, 0.13, abs(r - 0.8));
    float stave = (1.0 - smoothstep(0.06, 0.11, abs(q.x))) * step(abs(q.y), 0.62);
    float chev = (1.0 - smoothstep(0.05, 0.1, abs(q.y - 0.18 - abs(q.x) * 0.7))) * step(abs(q.x), 0.48);
    return max(ring, max(stave, chev));
  }
  if (shape == 7) { // an eye: an almond with a slit for its pupil
    float w = 0.52 * (1.0 - q.x * q.x);
    float almond = 1.0 - smoothstep(w * 0.7, w + 0.001, abs(q.y));
    float slit = (1.0 - smoothstep(0.05, 0.1, abs(q.x))) * step(abs(q.y), w * 0.85);
    return almond * (1.0 - slit) * step(abs(q.x), 0.98);
  }
  if (shape == 8) { // a fang, a claw's crescent
    float outer = 1.0 - smoothstep(0.82, 0.95, r);
    float inner = 1.0 - smoothstep(0.7, 0.82, length(q - vec2(0.32, 0.26)));
    return outer * (1.0 - inner);
  }
  if (shape == 9) { // a bubble: a thin skin, a faint body and a bright fleck of light
    float skin = 1.0 - smoothstep(0.05, 0.12, abs(r - 0.84));
    float fleck = exp(-34.0 * dot(q - vec2(-0.34, 0.36), q - vec2(-0.34, 0.36)));
    return max(max(skin, fleck), 0.18 * (1.0 - smoothstep(0.7, 0.86, r)));
  }
  if (shape == 10) { // a forked bolt along its length
    float zig = (abs(fract(q.x * 1.75 + 0.25) - 0.5) * 2.0 - 0.5) * 0.42;
    float fork = (1.0 - smoothstep(0.04, 0.09, abs(q.y + zig * 0.6 + (q.x - 0.15) * 0.55))) * step(0.15, q.x);
    return max(1.0 - smoothstep(0.05, 0.11, abs(q.y - zig)), fork * 0.8) * (1.0 - smoothstep(0.82, 1.0, abs(q.x)));
  }
  if (shape == 11) { // a feather: a vane parted by its shaft, its barbs in stripes
    float w = 0.34 * (1.0 - q.x * q.x);
    float vane = (1.0 - smoothstep(w * 0.6, w + 0.001, abs(q.y))) * smoothstep(0.015, 0.05, abs(q.y));
    return vane * (0.72 + 0.28 * sin(q.x * 26.0 + abs(q.y) * 18.0)) * step(abs(q.x), 0.98);
  }
  if (shape == 12) { // a petal, a teardrop
    vec2 pq = vec2(q.x, q.y * 1.55);
    return 1.0 - smoothstep(0.55 - 0.28 * q.x, 0.72 - 0.28 * q.x, length(pq));
  }
  if (shape == 13) { // a note: its head, its stem, its flag
    float head = 1.0 - smoothstep(0.24, 0.32, length(vec2(q.x + 0.28, (q.y + 0.48) * 1.45)));
    float stem = (1.0 - smoothstep(0.05, 0.09, abs(q.x + 0.02))) * step(-0.5, q.y) * step(q.y, 0.78);
    float flag = (1.0 - smoothstep(0.06, 0.11, abs(q.y - 0.66 + q.x * 0.75))) * step(0.0, q.x) * step(q.x, 0.46);
    return max(head, max(stem, flag));
  }
  if (shape == 14) { // a puff of smoke: a free sprite's ragged cloud, one of four, its coverage a dithered edge
    float k = floor(clamp(vShape.y, 0.0, 0.999) * ${PUFF_CELLS.at.length}.0);
    vec2 uv = clamp(q * 0.5 + 0.5, 0.0, 1.0);
    vec2 px = vec2(k * ${PUFF_CELLS.w}.0 + uv.x * ${PUFF_CELLS.w}.0, ${PUFF_CELLS.at[0][1]}.0 + (1.0 - uv.y) * ${PUFF_CELLS.h}.0);
    return texture2D(uPuffs, px / vec2(${FLAME_ATLAS.width}.0, ${FLAME_ATLAS.height}.0)).g * (1.0 - smoothstep(0.82, 1.0, r));
  }
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

/** A falling particle meets its ground: it springs up a little, skids, and once its spring is spent lies still. */
export function land(p: Pick<Live, 'x' | 'y' | 'z' | 'vx' | 'vy' | 'vz' | 'floor' | 'bounce' | 'gravity' | 'drag' | 'spin' | 'rot' | 'age'>): void {
  p.y = p.floor;
  if (p.vy >= 0) return;
  p.vy = -p.vy * p.bounce;
  p.vx *= 0.55;
  p.vz *= 0.55;
  if (p.vy > 0.6) return;
  [p.vx, p.vy, p.vz, p.gravity, p.drag] = [p.vx * 0.3, 0, p.vz * 0.3, 0, Math.max(p.drag, 6)]; // at rest
  [p.rot, p.spin] = [p.rot + p.spin * p.age, 0];
}

/** `ground`: the world's ground, where what falls comes to rest (`Particles.ground`). */
export function createParticles(scene: THREE.Scene, ground?: (x: number, z: number) => number): Particles {
  const geo = new THREE.PlaneGeometry(1, 1);
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const glows = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY), 1).setUsage(THREE.DynamicDrawUsage);
  const shapes = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const vels = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aColor', colors);
  geo.setAttribute('aGlow', glows);
  geo.setAttribute('aShape', shapes);
  geo.setAttribute('aVel', vels);
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms, uPuffs: { value: flameAtlasTexture() } }, vertexShader: VERT, fragmentShader: FRAG });
  const batch = new THREE.InstancedMesh(geo, material, CAPACITY);
  batch.frustumCulled = false;
  batch.count = 0;
  scene.add(batch);

  const live: Live[] = [];
  const m4 = new THREE.Matrix4();
  let last = -1;

  return {
    ground,
    spawn(p) {
      if (live.length >= CAPACITY) live.shift();
      const { shape, colorEnd, ...rest } = p;
      live.push({
        vx: 0, vy: 0, vz: 0, grow: 1, alpha: 1, glow: false, gravity: 0, drag: 0, spin: 0, rot: 0, stretch: 0.12, hold: 0, thick: 0.18, floor: -Infinity, bounce: 0.3,
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
        if (p.y < p.floor) land(p);
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
