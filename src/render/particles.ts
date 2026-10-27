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
import { flameAtlasTexture } from './flames';
import { markAtlasTexture } from './markAtlas';
import type { Rgb } from './palette';
import { particleMasksGlsl, shapeDefines } from './shaders/particleMasks';
import { LANTERN_GLSL } from './shaders/world';
import { worldUniforms } from './worldMaterial';

export const CAPACITY = 4096; // (round 60: 2400, and a colossus's burst in a crowd took the oldest away mid-flight)

/** Round 79 added the smoke's puff (a free smoke sprite, data/flameAtlas.ts). Round 60 added the signatures' shapes (render/fxForms.ts): a rune, an eye, a fang's crescent, a bubble, a forked bolt, a feather, a petal, a note. */
export const PARTICLE_SHAPES = ['disc', 'shard', 'streak', 'ring', 'spark', 'wisp', 'rune', 'eye', 'fang', 'bubble', 'bolt', 'feather', 'petal', 'note', 'puff', 'crescent', 'lash', 'cross', 'dash', 'arc', 'mark', 'trace'] as const;
export type ParticleShape = (typeof PARTICLE_SHAPES)[number];

/** Round 90 (the quiet blows, data/foeBlows.ts): a tapering crescent, an S-curve lash, a thin cross of light, a row of ticks and an open ring ('crescent', 'lash', 'cross', 'dash', 'arc': drawn in the shader), and two masks (data/markAtlas.ts, made in code: the blot, and the smear, frayed by the mottle of a Kenney CC0 smoke) that a 'mark' (turns about its centre) or a 'trace' (lies along its flight, as a streak does) draws, by its `thick`: `markCell(name)`. */
export const MARK_NAMES = ['splat', 'smear'] as const;
export type MarkName = (typeof MARK_NAMES)[number];
/** The `thick` of a 'mark' or a 'trace' particle that draws the mask `name`. */
export const markCell = (name: MarkName): number => (MARK_NAMES.indexOf(name) + 0.5) / MARK_NAMES.length;

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
  colorMid?: Rgb; // the colour half way through its life (round 90): with `colorEnd`, a hue that drifts through a third and does not pass through grey (default: the straight blend of the two)
  spin?: number; // rad/s about the view axis (not for a streak, which lies along its flight; for the other aligned shapes it turns them off their flight)
  rot?: number; // radians at birth (for a crescent, lash, dash or trace: the angle off its flight, which is all there is while it moves under 0.02 m/s)
  stretch?: number; // a streak's length, in sizes per m/s of its speed (default 0.12), at least one size
  hold?: number; // the share of its life it keeps its full alpha before it fades (default 0)
  thick?: number; // a ring's or an arc's thickness, a share of its radius (default 0.18); a puff's, which of its four pictures, a mark's or a trace's, which of the two masks (`markCell`) (0 to just under 1)
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
${shapeDefines(PARTICLE_SHAPES)}
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
  int shape = int(aShape.x + 0.5);
  float angle = aShape.y;
  float len = 1.0;
  if (shape == SH_STREAK) { // a streak lies along its flight as the screen sees it
    vec3 vv = (viewMatrix * vec4(aVel, 0.0)).xyz;
    angle = atan(vv.y, vv.x + 1e-5);
    len = aShape.z;
  } else if (shape == SH_CRESCENT || shape == SH_LASH || shape == SH_DASH || shape == SH_TRACE) { // these lie along it too, turned by rot, and by only rot when hardly moving (round 90)
    vec3 vv = (viewMatrix * vec4(aVel, 0.0)).xyz;
    if (dot(aVel, aVel) > 0.0004) angle += atan(vv.y, vv.x + 1e-5);
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
${particleMasksGlsl(PARTICLE_SHAPES)}
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  vec2 q = (vUv - 0.5) * 2.0;
  float a = vColor.a * mask(q, int(vShape.x + 0.5), vShape.y);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(mix(vColor.rgb * vLight, uFogColor, vFog * uFogAmount), 1.0);
}
`;

type Live = Required<Omit<ParticleSpec, 'colorEnd' | 'colorMid' | 'shape'>> & { colorEnd: Rgb | null; colorMid: Rgb | null; shape: number; age: number };

/** One channel `i` of a particle's colour at `t` (0 at birth, 1 at death): `color`, with an `end` the straight blend to it, with a `mid` as well the blend through it at half life (a hue that drifts through a third, not through grey). */
export function lifeColor(color: Rgb, mid: Rgb | null, end: Rgb | null, t: number, i: 0 | 1 | 2): number {
  if (!end) return color[i];
  if (!mid) return color[i] + (end[i] - color[i]) * t;
  return t < 0.5 ? color[i] + (mid[i] - color[i]) * t * 2 : mid[i] + (end[i] - mid[i]) * (t - 0.5) * 2;
}

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
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms, uPuffs: { value: flameAtlasTexture() }, uMarks: { value: markAtlasTexture() } }, vertexShader: VERT, fragmentShader: FRAG });
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
      const { shape, colorEnd, colorMid, ...rest } = p;
      live.push({
        vx: 0, vy: 0, vz: 0, grow: 1, alpha: 1, glow: false, gravity: 0, drag: 0, spin: 0, rot: 0, stretch: 0.12, hold: 0, thick: 0.18, floor: -Infinity, bounce: 0.3,
        ...rest, shape: shape ? PARTICLE_SHAPES.indexOf(shape) : 0, colorEnd: colorEnd ?? null, colorMid: colorMid ?? null, age: 0,
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
        const fade = t < p.hold ? 1 : 1 - (t - p.hold) / Math.max(1e-3, 1 - p.hold);
        colors.setXYZW(n, lifeColor(p.color, p.colorMid, p.colorEnd, t, 0), lifeColor(p.color, p.colorMid, p.colorEnd, t, 1), lifeColor(p.color, p.colorMid, p.colorEnd, t, 2), p.alpha * fade);
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
