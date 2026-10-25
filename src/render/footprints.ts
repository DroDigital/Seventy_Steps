/**
 * Footprints (round 78): flat prints on the ground, one instanced batch of 128 quads that the ground keeps and then lets go. A print is a
 * dark (or, at its lip, pale) film laid over the ground drawn beneath, lit as the particles are (the ambient, the moon and the lantern), so it
 * is as dark by night as the land it lies on and keeps its shape in the lantern's glare: snow takes a dark print with a pale lip, mud a
 * near-black wet one with a gleam on its far wall, sand a shallow one. Its fade is ordered-dithered like the shadows' and the fog's, and it
 * follows the three heights it is laid on. Render only; what lays them is render/atm/steps.ts.
 */

import * as THREE from 'three';
import { STEPS } from '../data/bodyTuning';
import type { Laid } from './footprintPlan';
import { LANTERN_GLSL } from './shaders/world';
import { worldUniforms } from './worldMaterial';

const VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uSnap;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uAmbient;
uniform vec3 uLightColor;
attribute vec4 aPrint; // look, shape (0 a boot, 1 bare), strength, side
varying vec2 vP;
varying vec4 vPrint;
varying vec3 vLight;
varying float vFog;
${LANTERN_GLSL}
void main() {
  vP = vec2(position.x * aPrint.w, position.z);
  vPrint = aPrint;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec4 vp = viewMatrix * wp;
  vLight = uAmbient + (uLightColor + uLanternColor * lanternAt(uLanternPos - wp.xyz)) * 0.8;
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
varying vec3 vLight;
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
// Each look: the colour and strength of the dark film in the print's heart, the colour and strength of its lip (pale on snow and sand, a dark ring in mud and wet ground), and how much the toe-side wall gleams.
void lookOf(int l, out vec3 core, out vec4 lip, out float gleam, out float coreA) {
  if (l == 0) { core = vec3(0.17, 0.2, 0.27); coreA = 0.68; lip = vec4(1.2, 1.22, 1.3, 0.6); gleam = 0.0; return; } // snow: pressed dark, a pale lip of pushed snow
  if (l == 1) { core = vec3(0.06, 0.05, 0.04); coreA = 0.88; lip = vec4(0.1, 0.08, 0.07, 0.62); gleam = 0.5; return; } // mud: near black, a wet dark ring, the far wall catching the light
  if (l == 2) { core = vec3(0.26, 0.21, 0.15); coreA = 0.52; lip = vec4(1.1, 1.0, 0.82, 0.4); gleam = 0.0; return; } // sand: shallow, a soft lip
  if (l == 3) { core = vec3(0.09, 0.1, 0.13); coreA = 0.55; lip = vec4(0.12, 0.13, 0.16, 0.4); gleam = 0.35; return; } // wet: a dark film on dry ground
  core = vec3(0.13, 0.06, 0.07); coreA = 0.7; lip = vec4(0.16, 0.08, 0.09, 0.5); gleam = 0.4; // ooze
}
void main() {
  int shape = int(vPrint.y + 0.5);
  float e = shape == 1 ? bare(vP) : boot(vP); // depth into the print: 1 at its heart, 0 at its edge, negative outside
  vec3 coreCol; vec4 lip; float gleam; float coreA;
  lookOf(int(vPrint.x + 0.5), coreCol, lip, gleam, coreA);
  float sole = smoothstep(0.0, 0.1, e);
  float core = smoothstep(0.1, 0.36, e);
  bool pale = lip.r > 0.5;
  float ring = pale ? smoothstep(-0.22, -0.02, e) * (1.0 - smoothstep(0.02, 0.14, e)) : sole; // a lip of pushed-up snow outside the print and just within it, or a dark ring within
  float a1 = lip.a * ring;
  vec3 c1 = lip.rgb;
  float a2 = coreA * core;
  float g = gleam * sole * (1.0 - core) * smoothstep(0.1, 0.7, vP.y); // the wall at the toe end faces the walker's lantern
  c1 = mix(c1, vec3(0.8, 0.84, 0.9), g / max(a1 / max(lip.a, 0.001) + g, 0.001));
  a1 = max(a1, g * 0.55);
  float a = a2 + a1 * (1.0 - a2);
  if (a < 0.03) discard;
  float strength = vPrint.z * (1.0 - vFog * uFogAmount);
  if (strength < bayer4(gl_FragCoord.xy)) discard;
  vec3 rgb = (coreCol * a2 + c1 * a1 * (1.0 - a2)) / a;
  gl_FragColor = vec4(min(rgb * vLight, vec3(1.0)), a);
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
