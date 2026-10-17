/**
 * Ground marks (render only): flat, self-lit shapes laid on the ground, as one instanced batch. The
 * telegraphs: a disc, a sector (a swing's arc), a lane (a charge's path), a ring (a quake's band) and a
 * swirl (a vortex's reach). Each has a bright edge with a dark outline (so it reads on pale ground and
 * dark), a hatched promise of the whole of it from the first frame, a fill that grows with its `fill`
 * (0..1: how far the wind-up has come) and gathers its light at its front, and, once it is full, a flash
 * for the blow that is falling. A lane runs chevrons the way it points. And what the blow leaves: the
 * `scar` (burnt ground whose cracks cool), and the `sigil` (a circle of rings and spokes drawn in for a
 * summoning). Transparency is ordered-dithered like the particles', so nothing needs sorting. `style`
 * sets whose mark is drawn inside that fill. The plain mark is the old even wash.
 */

import * as THREE from 'three';
import { PLAIN_AOE, type AoeStyle } from './aoeLook';
import { FEEL } from './feel';
import type { Rgb } from './palette';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 256;
const LIFT = 0.05; // metres above the ground
const DEG = Math.PI / 180;
const KIND = { disc: 0, sector: 1, lane: 2, ring: 3, swirl: 4, scar: 5, sigil: 6 } as const;

export interface Decals {
  begin(): void;
  disc(x: number, y: number, z: number, radius: number, fill: number, color: Rgb, alpha?: number): void;
  /** A swing's arc about (x, z) facing `yaw`: degrees as a hit's (+ = the attacker's right). */
  sector(x: number, y: number, z: number, yaw: number, radius: number, arc: readonly [number, number], fill: number, color: Rgb, alpha?: number): void;
  /** A path `length` metres from (x, z) along `yaw`, `half` metres either side. */
  lane(x: number, y: number, z: number, yaw: number, length: number, half: number, fill: number, color: Rgb, alpha?: number): void;
  ring(x: number, y: number, z: number, radius: number, width: number, color: Rgb, alpha?: number): void;
  swirl(x: number, y: number, z: number, radius: number, color: Rgb, alpha?: number): void;
  /** Ground a blow burnt: `age` 0 (fresh, its cracks lit) to 1 (cold, gone); `color` is the heat of its cracks. */
  scar(x: number, y: number, z: number, radius: number, age: number, color: Rgb, alpha?: number): void;
  /** A circle drawn in from its centre outward as `fill` goes 0..1: rings, ticks and turning spokes. */
  sigil(x: number, y: number, z: number, radius: number, fill: number, color: Rgb, alpha?: number): void;
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
uniform float uFlash; // the Flashes setting: 1 strobes as the blow falls, 0 holds steady
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
const float EDGE = 0.16; // metres
void main() {
  int kind = int(vShape.x + 0.5);
  float fill = vShape.y;
  float r = length(vP);
  float ang = atan(vP.x, vP.y);
  float inside = 0.0; // metres in from the shape's boundary
  float body = 0.0, front = 0.0, chev = 0.0, lit = 0.34, glow = 0.0, dark = 0.0;
  bool solid = kind <= 2; // a telegraph that fills
  bool outlined = kind <= 4; // a shape with a boundary to draw
  if (kind == 2) { // lane: x across, y along from its start (-1) to its end (+1)
    float t = (vP.y + 1.0) * 0.5;
    inside = min((1.0 - abs(vP.x)) * vScale.x, (1.0 - abs(vP.y)) * vScale.y);
    body = step(t, fill);
    front = fill < 0.999 ? 1.0 - smoothstep(0.0, EDGE * 3.0 / vScale.y, abs(t - fill)) : 0.0;
    float along = t * vScale.y * 2.0;
    float ph = fract((along - abs(vP.x) * vScale.x * 0.8) / 1.7 - uTime * 1.1);
    chev = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.2, 0.34, ph)) * body;
  } else if (kind == 5) { // a scar: burnt ground, ragged at its edge, its cracks still glowing
    float wob = 0.86 + 0.14 * sin(ang * 5.0 + vMark.y) * sin(ang * 3.0 - vMark.y * 1.7);
    float rr = r / wob;
    if (rr > 1.0) discard;
    float cracks = vMark.x > 0.5 ? motifMask(r, ang) : smoothstep(0.55, 0.95, sin(ang * max(vMark.w, 3.0) * 1.5 + rr * 6.0 + vMark.y));
    float warm = (1.0 - fill) * (1.0 - fill);
    glow = warm * cracks * (1.0 - smoothstep(0.35, 1.0, rr));
    dark = (1.0 - fill) * (0.2 + 0.6 * (1.0 - smoothstep(0.5, 1.0, rr)));
    lit = 0.0;
  } else {
    if (r > 1.0) discard;
    if (kind == 1) { // sector between angles a and b
      if (ang < vShape.z || ang > vShape.w) discard;
      float side = min(abs(sin(ang - vShape.z)), abs(sin(vShape.w - ang))) * r;
      inside = min((1.0 - r) * vScale.x, vShape.w - vShape.z < 6.2 ? side * vScale.x : 9.0);
    } else if (kind == 3) { // ring band from a to 1: its leading edge brightest
      if (r < vShape.z) discard;
      float t = (r - vShape.z) / max(1.0 - vShape.z, 0.001);
      inside = (1.0 - r) * vScale.x;
      body = t * t * (0.5 + 0.5 * motifMask(r, ang));
      front = smoothstep(0.82, 1.0, t);
      lit = 0.9;
    } else if (kind == 4) { // swirl: arms turning inward; a mark may cut more of them
      float nArms = vMark.x > 0.5 ? max(3.0, vMark.w) : 3.0;
      float arms = fract(ang / 6.2832 * nArms + r * 1.2 + uTime * 0.7);
      body = smoothstep(0.42, 0.72, arms) * (1.0 - smoothstep(0.86, 1.0, arms)) * (0.45 + 0.55 * r);
      body = max(body, (1.0 - smoothstep(0.0, 0.16, r)) * (0.7 + 0.3 * sin(uTime * 14.0))); // the eye of it
      inside = (1.0 - r) * vScale.x;
      lit = 0.85;
    } else if (kind == 6) { // a sigil: rings and ticks, spokes turning, drawn in from the centre
      float w = 0.13 / vScale.x;
      float rot = uTime * 0.5 + vMark.y;
      float rings = max(1.0 - smoothstep(w * 0.5, w, abs(r - 0.95)), 1.0 - smoothstep(w * 0.5, w, abs(r - 0.6)));
      float ticks = step(0.5, fract((ang + rot) / 6.2832 * max(vMark.w, 3.0) * 4.0)) * step(0.63, r) * step(r, 0.92) * 0.55;
      float spokes = (1.0 - smoothstep(0.0, w * 1.4 / max(r, 0.25), abs(sin((ang - rot) * max(vMark.w, 3.0) * 0.5)))) * step(0.12, r) * step(r, 0.6);
      body = max(max(rings, ticks), spokes) * step(r, fill);
      lit = 1.0;
    } else {
      inside = (1.0 - r) * vScale.x;
    }
    if (kind < 3) {
      body = step(r, fill);
      front = fill < 0.999 ? 1.0 - smoothstep(0.0, EDGE * 3.0 / vScale.x, abs(r - fill)) : 0.0;
    }
  }
  float edge = outlined ? step(inside, EDGE) * (kind == 4 ? 0.6 : 1.0) : 0.0;
  float outline = outlined ? step(inside, EDGE * 2.1) * (1.0 - step(inside, EDGE)) : 0.0;
  if (vMark.x > 0.5 && solid) body *= 0.3 + 0.7 * motifMask(r, ang);
  if (solid && kind != 2) body *= 0.5 + 0.5 * smoothstep(0.0, max(fill, 0.05), r); // the light gathers toward the front
  float ready = solid && fill >= 0.999 ? 1.0 : 0.0; // the blow is falling
  float flash = ready * mix(0.5, 0.5 + 0.5 * sin(uTime * 38.0), uFlash);
  float pulse = mix(0.5, 0.5 + 0.5 * sin(uTime * (7.0 + 13.0 * fill)), uFlash);
  float hatch = solid && fill < 0.999 ? 0.2 * step(0.55, fract((vP.x * vScale.x + vP.y * vScale.y) / 0.75)) : 0.0; // the whole of it, promised from the first frame
  float cover = vColor.a * max(max(max(edge * 0.95, front * 0.95), body * (lit + 0.5 * ready + 0.3 * chev)), max(hatch, glow));
  float shade = vColor.a * max(outline * 0.85, dark);
  float b = bayer4(gl_FragCoord.xy);
  bool hot = cover >= b;
  if (!hot && shade < b) discard;
  vec3 c = vColor.rgb * (0.85 + 0.45 * max(edge, front) * (0.7 + 0.6 * pulse) + 0.5 * ready + 0.4 * chev);
  c = mix(c, vec3(1.0, 0.97, 0.9), clamp(0.45 * flash + 0.3 * front + 0.25 * glow, 0.0, 0.7));
  c = hot ? c : vColor.rgb * 0.12;
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
    uniforms: { ...worldUniforms, uTime: { value: 0 }, uFlash: { value: 1 } },
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
    scar(x, y, z, radius, age, color, alpha = 1) {
      put(x, y, z, 0, radius, radius, [KIND.scar, clamp01(age), 0, 0], color, alpha);
    },
    sigil(x, y, z, radius, fill, color, alpha = 1) {
      put(x, y, z, 0, radius, radius, [KIND.sigil, clamp01(fill), 0, 0], color, alpha);
    },
    end(time) {
      material.uniforms.uTime.value = time;
      material.uniforms.uFlash.value = FEEL.flashes;
      batch.count = n;
      batch.instanceMatrix.needsUpdate = true;
      shapes.needsUpdate = true;
      colors.needsUpdate = true;
      marks.needsUpdate = true;
    },
  };
}
