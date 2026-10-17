/**
 * Ground telegraphs (render only): flat, self-lit shapes laid on the ground where a blow will land,
 * as one instanced batch. A disc, a sector (a swing's arc), a lane (a charge's path), a ring (a
 * quake's band) and a swirl (a vortex's reach). Each has a bright edge and a dim fill that grows
 * with its `fill` (0..1: how far the wind-up has come) with a brighter front; transparency is
 * ordered-dithered like the particles', so nothing needs sorting. `style` sets whose mark is drawn
 * inside that fill. The plain mark is the old even wash.
 */

import * as THREE from 'three';
import { PLAIN_AOE, type AoeStyle } from './aoeLook';
import type { Rgb } from './palette';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 160;
const LIFT = 0.05; // metres above the ground
const DEG = Math.PI / 180;
const KIND = { disc: 0, sector: 1, lane: 2, ring: 3, swirl: 4 } as const;

export interface Decals {
  begin(): void;
  disc(x: number, y: number, z: number, radius: number, fill: number, color: Rgb, alpha?: number): void;
  /** A swing's arc about (x, z) facing `yaw`: degrees as a hit's (+ = the attacker's right). */
  sector(x: number, y: number, z: number, yaw: number, radius: number, arc: readonly [number, number], fill: number, color: Rgb, alpha?: number): void;
  /** A path `length` metres from (x, z) along `yaw`, `half` metres either side. */
  lane(x: number, y: number, z: number, yaw: number, length: number, half: number, fill: number, color: Rgb, alpha?: number): void;
  ring(x: number, y: number, z: number, radius: number, width: number, color: Rgb, alpha?: number): void;
  swirl(x: number, y: number, z: number, radius: number, color: Rgb, alpha?: number): void;
  /** The mark drawn inside every shape until the next `style` or `begin`. */
  style(mark: AoeStyle): void;
  end(time: number): void;
}

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
attribute vec4 aShape; // kind, fill, a, b
attribute vec4 aColor;
attribute vec4 aMark; // motif, seed, freq, arms
varying vec2 vP;
varying vec2 vScale;
varying vec4 vShape;
varying vec4 vColor;
varying vec4 vMark;
varying float vFog;
void main() {
  vP = position.xz;
  vScale = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[2].xyz));
  vShape = aShape;
  vColor = aColor;
  vMark = aMark;
  vec4 vp = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogAmount;
uniform float uTime;
varying vec2 vP;
varying vec2 vScale;
varying vec4 vShape;
varying vec4 vColor;
varying vec4 vMark;
varying float vFog;
float motifMask(float r, float ang) {
  int m = int(vMark.x + 0.5);
  float seed = vMark.y;
  float freq = vMark.z;
  float arms = vMark.w;
  if (m == 1) return 0.35 + 0.65 * smoothstep(0.15, 0.9, sin(r * freq * 14.0 - uTime * 1.3 + seed));
  if (m == 2) return step(0.72, max(abs(sin(ang * arms + seed)), abs(sin(r * freq * 10.0))));
  if (m == 3) return 1.0 - smoothstep(0.02, 0.09, abs(fract(ang / 6.2832 * arms + seed) - 0.5));
  if (m == 4) return smoothstep(0.0, 0.8, sin(ang * arms + uTime * 5.0 + seed)) * (0.35 + 0.65 * r);
  if (m == 5) return smoothstep(0.2, 0.85, sin((vP.x * freq + seed) * 6.0 + uTime * 0.6) * sin((vP.y * freq) * 6.0));
  if (m == 6) {
    float s = fract(ang / 6.2832 * arms + r * freq - uTime * 0.35 + seed);
    return smoothstep(0.12, 0.4, s) * (1.0 - smoothstep(0.55, 0.85, s));
  }
  if (m == 7) return max(1.0 - smoothstep(0.1, 0.2, r), smoothstep(0.18, 0.28, r) * (1.0 - smoothstep(0.7, 0.82, r)) * (0.55 + 0.45 * step(0.9, abs(sin(ang * arms)))));
  if (m == 8) return smoothstep(0.55, 0.95, sin(ang * arms + r * freq * 4.0 + seed));
  if (m == 9) return pow(abs(sin(ang * arms * 0.5 + seed)), 6.0);
  if (m == 10) return step(0.16, abs(fract(ang / 6.2832 * arms + seed) - 0.5)) * step(0.1, abs(fract(r * freq) - 0.5));
  if (m == 12) return smoothstep(-0.2, 1.2, sin(vP.x * freq * 3.0 + seed) + sin(vP.y * freq * 2.4 + seed * 1.7));
  float ash = sin(vP.x * freq * 9.0 + uTime + seed) * sin(vP.y * freq * 8.0 - uTime * 0.6);
  return smoothstep(0.3, 0.9, ash);
}
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
const float EDGE = 0.14; // metres
void main() {
  int kind = int(vShape.x + 0.5);
  float fill = vShape.y;
  float r = length(vP);
  float e = EDGE / vScale.x;
  float edge = 0.0, body = 0.0, front = 0.0;
  if (kind == 2) { // lane: x across, y along from its start (-1) to its end (+1)
    vec2 ea = EDGE / vScale;
    float t = (vP.y + 1.0) * 0.5;
    edge = max(step(1.0 - ea.x, abs(vP.x)), step(1.0 - ea.y, abs(vP.y)));
    body = step(t, fill);
    front = fill < 0.999 ? 1.0 - smoothstep(0.0, ea.y * 2.0, abs(t - fill)) : 0.0;
  } else {
    if (r > 1.0) discard;
    float ang = atan(vP.x, vP.y);
    if (kind == 1) { // sector between angles a and b
      if (ang < vShape.z || ang > vShape.w) discard;
      float side = min(abs(sin(ang - vShape.z)), abs(sin(vShape.w - ang))) * r;
      edge = step(1.0 - e, r) + (vShape.w - vShape.z < 6.2 ? step(side, e) : 0.0);
    } else if (kind == 3) { // ring band from a to 1: its leading edge brightest
      if (r < vShape.z) discard;
      float t = (r - vShape.z) / max(1.0 - vShape.z, 0.001);
      edge = step(1.0 - e, r);
      body = 0.4 + 0.6 * t;
    } else if (kind == 4) { // swirl: arms turning inward; a mark may cut more of them
      float nArms = vMark.x > 0.5 ? max(3.0, vMark.w) : 3.0;
      float arms = fract(ang / 6.2832 * nArms + r * 1.2 + uTime * 0.7);
      body = smoothstep(0.55, 0.8, arms) * (1.0 - smoothstep(0.85, 1.0, arms)) * r;
      edge = step(1.0 - e, r) * 0.6;
    } else {
      edge = step(1.0 - e, r);
    }
    if (kind < 3) {
      body = step(r, fill);
      front = fill < 0.999 ? 1.0 - smoothstep(0.0, e * 2.0, abs(r - fill)) : 0.0;
    }
  }
  if (vMark.x > 0.5) body *= 0.28 + 0.72 * motifMask(r, atan(vP.x, vP.y));
  float ready = fill >= 0.999 ? 0.35 + 0.35 * sin(uTime * 30.0) : 0.0; // the blow is falling
  float lit = kind == 3 ? 0.75 : kind == 4 ? 0.5 : 0.32 + ready; // a quake's band and a vortex's arms are the danger itself
  float a = vColor.a * max(max(edge * 0.9, front), body * lit);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  vec3 c = vColor.rgb * (0.8 + 0.5 * max(edge, front) + ready);
  gl_FragColor = vec4(mix(c, uFogColor, vFog * uFogAmount), 1.0);
}
`;

export function createDecals(scene: THREE.Scene): Decals {
  const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const shapes = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const marks = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aShape', shapes);
  geo.setAttribute('aColor', colors);
  geo.setAttribute('aMark', marks);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms, uTime: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const batch = new THREE.InstancedMesh(geo, material, CAPACITY);
  batch.frustumCulled = false;
  batch.count = 0;
  batch.renderOrder = 1;
  scene.add(batch);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const at = new THREE.Vector3();
  const scale = new THREE.Vector3();
  let n = 0;
  let mark = PLAIN_AOE;
  const put = (x: number, y: number, z: number, yaw: number, sx: number, sz: number, shape: readonly [number, number, number, number], color: Rgb, alpha: number): void => {
    if (n >= CAPACITY || sx <= 0 || sz <= 0) return;
    batch.setMatrixAt(n, m4.compose(at.set(x, y + LIFT, z), q.setFromAxisAngle(up, yaw), scale.set(sx, 1, sz)));
    shapes.setXYZW(n, ...shape);
    colors.setXYZW(n, color[0], color[1], color[2], alpha);
    marks.setXYZW(n, mark.motif, mark.seed, mark.freq, mark.arms);
    n++;
  };
  const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

  return {
    begin() {
      n = 0;
      mark = PLAIN_AOE;
    },
    style(next) {
      mark = next;
    },
    disc(x, y, z, radius, fill, color, alpha = 1) {
      put(x, y, z, 0, radius, radius, [KIND.disc, clamp01(fill), 0, 0], color, alpha);
    },
    sector(x, y, z, yaw, radius, arc, fill, color, alpha = 1) {
      const [a, b] = [-arc[0] * DEG, -arc[1] * DEG];
      const wide = Math.abs(arc[0] - arc[1]) >= 359;
      put(x, y, z, yaw, radius, radius, [KIND.sector, clamp01(fill), wide ? -Math.PI : Math.min(a, b), wide ? Math.PI : Math.max(a, b)], color, alpha);
    },
    lane(x, y, z, yaw, length, half, fill, color, alpha = 1) {
      const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
      put(x + s * length * 0.5, y, z + c * length * 0.5, yaw, half, length * 0.5, [KIND.lane, clamp01(fill), 0, 0], color, alpha);
    },
    ring(x, y, z, radius, width, color, alpha = 1) {
      put(x, y, z, 0, radius, radius, [KIND.ring, 0, clamp01(1 - width / Math.max(radius, 0.01)), 0], color, alpha);
    },
    swirl(x, y, z, radius, color, alpha = 1) {
      put(x, y, z, 0, radius, radius, [KIND.swirl, 0, 0, 0], color, alpha);
    },
    end(time) {
      material.uniforms.uTime.value = time;
      batch.count = n;
      batch.instanceMatrix.needsUpdate = true;
      shapes.needsUpdate = true;
      colors.needsUpdate = true;
      marks.needsUpdate = true;
    },
  };
}
