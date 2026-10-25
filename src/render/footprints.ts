/**
 * Footprints (round 78): flat prints on the ground, one instanced batch of 128 quads that the ground keeps and then lets go. A print
 * does not paint its own colour: it multiplies the ground that is already drawn (twice its own grey, so a half-grey changes nothing, a
 * darker one dims it and a paler one lifts it), so it is as lit, as fogged and as graded as the ground it lies on, and snow takes a
 * dark print with a pale lip, mud a near-black wet one with a fleck of light, sand a shallow one. Its fade is ordered-dithered like
 * the shadows', and it follows the three heights it is laid on. Render only; what lays them is render/atm/steps.ts.
 */

import * as THREE from 'three';
import { STEPS } from '../data/bodyTuning';
import type { Laid } from './footprintPlan';
import { worldUniforms } from './worldMaterial';

const VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uSnap;
uniform float uFogNear;
uniform float uFogFar;
attribute vec4 aPrint; // look, shape (0 a boot, 1 bare), alpha, side
varying vec2 vP;
varying vec4 vPrint;
varying float vFog;
void main() {
  vP = vec2(position.x * aPrint.w, position.z);
  vPrint = aPrint;
  vec4 vp = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  vec4 clip = projectionMatrix * vp;
  if (uSnap > 0.0 && clip.w > 0.0) {
    vec2 grid = uRes * 0.5 / uSnap;
    clip.xy = floor(clip.xy / clip.w * grid + 0.5) / grid * clip.w;
  }
  gl_Position = clip;
}
`;

const FRAG = /* glsl */ `
uniform float uFogAmount;
varying vec2 vP;
varying vec4 vPrint;
varying float vFog;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
// How far inside an ellipse (centre c, radii r) p is: 1 at its heart, 0 on its rim, negative outside.
float inside(vec2 p, vec2 c, vec2 r) { return 1.0 - length((p - c) / r); }
// The boot's sole: a heel and a ball joined by a waist, toe at +z.
float boot(vec2 p) {
  float heel = inside(p, vec2(0.0, -0.55), vec2(0.40, 0.34));
  float ball = inside(p, vec2(0.0, 0.2), vec2(0.5, 0.76));
  float waist = inside(p, vec2(-0.03, -0.2), vec2(0.34, 0.3));
  return max(max(heel, ball), waist);
}
// The bare foot of what follows: long, narrow, and four toes too long, fanned.
float bare(vec2 p) {
  float sole = inside(p, vec2(0.0, -0.18), vec2(0.34, 0.6));
  float toes = -1.0;
  for (int i = 0; i < 4; i++) {
    float k = float(i) - 1.5;
    toes = max(toes, inside(p, vec2(k * 0.2, 0.66 + 0.04 * abs(k)), vec2(0.075, 0.2)) * 0.8 - 0.05);
  }
  return max(sole, toes);
}
// The multiplier on the ground: its core, its lip, and whether the toe-side wall gleams. 1 changes nothing (the blend is twice the multiply).
vec3 lookOf(int l) {
  if (l == 0) return vec3(0.58, 1.34, 0.0); // snow: pressed dark, a pale lip of pushed snow
  if (l == 1) return vec3(0.30, 0.62, 1.0); // mud: near black, a wet dark ring, the far wall catching the light
  if (l == 2) return vec3(0.76, 1.12, 0.0); // sand: shallow, a soft lip
  if (l == 3) return vec3(0.52, 0.72, 0.6); // wet: a dark film on dry ground
  return vec3(0.44, 0.52, 1.0); // ooze
}
void main() {
  int shape = int(vPrint.y + 0.5);
  float e = shape == 1 ? bare(vP) : boot(vP); // depth into the print: 1 at its heart, 0 at its edge, negative outside
  vec3 lk = lookOf(int(vPrint.x + 0.5));
  float sole = smoothstep(0.0, 0.1, e);
  float core = smoothstep(0.1, 0.36, e);
  float lift = lk.y > 1.0 ? 1.0 : 0.0;
  float lip = smoothstep(-0.22, -0.02, e) * (1.0 - smoothstep(0.02, 0.14, e)); // the pushed-up edge, outside the print and just within it
  float m = mix(1.0, lk.y, mix(sole, lip, lift)); // snow and sand lift a lip; mud and a wet film darken a ring
  m = mix(m, lk.x, core);
  m = mix(m, 1.5, lk.z * sole * (1.0 - core) * smoothstep(0.1, 0.7, vP.y)); // the wall at the toe end faces the walker's lantern
  if (abs(m - 1.0) < 0.012) discard;
  float a = vPrint.z * (1.0 - vFog * uFogAmount);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(vec3(m * 0.5), 0.5);
}
`;

/** The ground's height at a point, as the world gives it. */
export type GroundAt = (x: number, z: number) => number;

export interface Footprints {
  /** Lays a print at `time` (render seconds). */
  lay(l: Laid, time: number): void;
  /** Ages them, and draws what is left. */
  update(time: number): void;
  /** Prints still showing. */
  readonly live: number;
}

export function createFootprints(scene: THREE.Scene, ground: GroundAt): Footprints {
  const cap = STEPS.capacity;
  const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const prints = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPrint', prints);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor,
    blendDst: THREE.SrcColorFactor, // dst·src + src·dst: twice the multiply, so a grey of a half is neutral
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const batch = new THREE.InstancedMesh(geo, material, cap);
  batch.frustumCulled = false;
  batch.renderOrder = 1;
  batch.count = 0;
  batch.visible = false;
  scene.add(batch);

  const held = { born: new Float32Array(cap), life: new Float32Array(cap), alpha: new Float32Array(cap), fadeIn: new Float32Array(cap), look: new Float32Array(cap), shape: new Float32Array(cap), side: new Float32Array(cap) };
  let [next, filled, live] = [0, 0, 0];
  const m4 = new THREE.Matrix4();
  const [ex, ey, ez, at] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const tf = new THREE.Vector3();
  const tr = new THREE.Vector3();

  return {
    get live() {
      return live;
    },
    lay(l, time) {
      const i = next;
      next = (next + 1) % cap;
      filled = Math.min(cap, filled + 1);
      const [fx, fz] = [Math.sin(l.yaw), Math.cos(l.yaw)];
      const [rx, rz] = [-fz, fx];
      const h = ground(l.x, l.z);
      tf.set(fx * 0.3, ground(l.x + fx * 0.3, l.z + fz * 0.3) - h, fz * 0.3);
      tr.set(rx * 0.3, ground(l.x + rx * 0.3, l.z + rz * 0.3) - h, rz * 0.3);
      ey.crossVectors(tr, tf).normalize();
      ez.copy(tf).addScaledVector(ey, -tf.dot(ey)).normalize();
      ex.crossVectors(ey, ez);
      const [sx, sz] = [STEPS.width * l.scale, (STEPS.length / 1.82) * l.scale];
      at.set(l.x, h + STEPS.lift, l.z);
      batch.setMatrixAt(i, m4.makeBasis(ex.multiplyScalar(sx), ey, ez.multiplyScalar(sz)).setPosition(at));
      held.born[i] = time;
      held.life[i] = l.print.life;
      held.alpha[i] = l.print.alpha;
      held.fadeIn[i] = l.fadeIn;
      held.look[i] = l.print.look;
      held.shape[i] = l.bare ? 1 : 0;
      held.side[i] = l.foot;
      batch.instanceMatrix.needsUpdate = true;
      batch.count = filled;
      batch.visible = true;
    },
    update(time) {
      live = 0;
      for (let i = 0; i < filled; i++) {
        const age = time - held.born[i];
        const life = held.life[i];
        let a = 0;
        if (life > 0 && age >= 0 && age < life) {
          const out = Math.min(1, (life - age) / Math.max(1e-3, life * STEPS.fadeOut));
          a = held.alpha[i] * Math.min(1, age / Math.max(1e-3, held.fadeIn[i])) * out;
          if (a > 0.01) live++;
        } else if (age >= life) held.life[i] = 0;
        prints.setXYZW(i, held.look[i], held.shape[i], a, held.side[i]);
      }
      prints.needsUpdate = true;
      batch.visible = live > 0;
    },
  };
}
