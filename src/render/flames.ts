/**
 * Flames (round 74, asked for "better fire everywhere" from free animations): every torch, fire and lamp the world lights (worldLights.ts) wears a
 * pixel flame that flickers through a four-frame flipbook, cut from the free 'Fire' animation of ZomBCool (OpenGameArt, CC0; data/flameAtlas.ts,
 * tools/flames/bake_flames.py). The picture is a heat mask, so a flame is coloured here: a ramp from its rim to its white core, warm by
 * default, cold, sickly or violet for the places that burn so. A flame stands upright and turns about to face the eye; its pixels are hard
 * edged and snap to the low picture's grid as everything does; it is hidden behind what stands before it, and fades in the mist as a
 * halo does. One instanced batch for all of them, filled each frame between `begin` and `end`, like halos.ts.
 */

import * as THREE from 'three';
import { FLAME_ATLAS, FLAME_CELLS } from '../data/flameAtlas';
import { worldUniforms } from './worldMaterial';

/** What a flame burns as: the colour of its rim, its body and its core. */
export const FLAME_HUES = {
  warm: [[0.75, 0.16, 0.04], [1, 0.52, 0.12], [1, 0.95, 0.72]],
  cold: [[0.08, 0.2, 0.75], [0.25, 0.55, 1], [0.85, 0.95, 1]],
  sickly: [[0.12, 0.45, 0.1], [0.45, 0.9, 0.3], [0.92, 1, 0.8]],
  violet: [[0.4, 0.1, 0.7], [0.72, 0.35, 1], [0.95, 0.88, 1]],
} as const;
export type FlameHue = keyof typeof FLAME_HUES;
const HUE_ORDER = Object.keys(FLAME_HUES) as FlameHue[];

const FPS = 7; // beats of the flipbook a second

const VERT = /* glsl */ `
attribute vec4 aFlame; // base centre, height
attribute vec4 aBeat; // phase, mirror (+1/-1), hue, gain
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;
uniform vec2 uRes;
uniform float uSnap;
varying vec2 vUv;
varying float vFrame;
varying float vHue;
varying float vGain;
void main() {
  vec3 base = aFlame.xyz;
  vec3 toEye = cameraPosition - base;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toEye) + vec3(1e-5, 0.0, 0.0));
  float h = aFlame.w * (1.0 + 0.07 * sin(uTime * 11.0 + aBeat.x * 6.2831)); // a little taller and shorter as it breathes
  float w = h * 0.667;
  vec3 wp = base + right * position.x * w * aBeat.y + vec3(0.0, 1.0, 0.0) * (position.y + 0.5) * h;
  wp += normalize(toEye) * 0.08; // a flame is before the cup it stands in
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  float d = length(mv.xyz);
  vec4 clip = projectionMatrix * mv;
  if (uSnap > 0.0 && clip.w > 0.0) {
    vec2 grid = uRes * 0.5 / uSnap;
    clip.xy = floor(clip.xy / clip.w * grid + 0.5) / grid * clip.w;
  }
  gl_Position = clip;
  vUv = vec2(position.x + 0.5, position.y + 0.5);
  vFrame = floor(mod(uTime * ${FPS}.0 + aBeat.x * 4.0, 4.0));
  vHue = aBeat.z;
  float fog = clamp((d - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  float near = smoothstep(h * 1.2, h * 3.5, d); // close to the lens a flame would fill the picture
  vGain = aBeat.w * (1.0 - 0.9 * fog) * near;
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uRamp[12]; // four hues of three
varying vec2 vUv;
varying float vFrame;
varying float vHue;
varying float vGain;
void main() {
  if (vGain <= 0.003) discard;
  vec2 cell = vec2(${FLAME_CELLS.w}.0, ${FLAME_CELLS.h}.0);
  vec2 atlas = vec2(${FLAME_ATLAS.width}.0, ${FLAME_ATLAS.height}.0);
  vec2 px = vec2(vFrame * cell.x + vUv.x * cell.x, (1.0 - vUv.y) * cell.y);
  vec2 hc = texture2D(uAtlas, px / atlas).rg;
  if (hc.g < 0.5) discard;
  int hue = int(vHue + 0.5) * 3;
  vec3 rim = uRamp[hue];
  vec3 body = uRamp[hue + 1];
  vec3 core = uRamp[hue + 2];
  float t = hc.r;
  vec3 c = mix(mix(rim, body, smoothstep(0.15, 0.5, t)), core, smoothstep(0.55, 0.92, t));
  gl_FragColor = vec4(c * vGain, 1.0);
}
`;

export interface Flames {
  readonly mesh: THREE.Mesh;
  /** Starts this frame's flames. */
  begin(): void;
  /** A flame `height` metres tall standing on (x, y, z), at its own beat (`phase`, 0..1), turned `mirror` (+1 or −1), `hue`, `gain` bright; false once the batch is full. */
  put(x: number, y: number, z: number, height: number, phase: number, mirror: number, hue: FlameHue, gain: number): boolean;
  /** Shows this frame's flames. */
  end(): void;
}

let atlas: THREE.DataTexture | null = null;

/** The flipbook as a texture: heat in red, coverage in green, hard edged (one for the flames and the smoke's puffs, particles.ts). */
export function flameAtlasTexture(): THREE.DataTexture {
  if (atlas) return atlas;
  const raw = atob(FLAME_ATLAS.data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const tex = new THREE.DataTexture(bytes, FLAME_ATLAS.width, FLAME_ATLAS.height, THREE.RGFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  atlas = tex;
  return tex;
}

export function createFlames(capacity: number): Flames {
  const geo = new THREE.InstancedBufferGeometry();
  geo.copy(new THREE.PlaneGeometry(1, 1) as unknown as THREE.InstancedBufferGeometry);
  const flame = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
  const beat = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
  flame.setUsage(THREE.DynamicDrawUsage);
  beat.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aFlame', flame);
  geo.setAttribute('aBeat', beat);
  geo.instanceCount = 0;
  const ramp = HUE_ORDER.flatMap((h) => FLAME_HUES[h].map((c) => new THREE.Vector3(c[0], c[1], c[2])));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uFogNear: worldUniforms.uFogNear, uFogFar: worldUniforms.uFogFar, uTime: worldUniforms.uTime, uRes: worldUniforms.uRes, uSnap: worldUniforms.uSnap,
      uAtlas: { value: flameAtlasTexture() }, uRamp: { value: ramp },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  let count = 0;
  return {
    mesh,
    begin() {
      count = 0;
    },
    put(x, y, z, height, phase, mirror, hue, gain) {
      if (count >= capacity) return false;
      flame.setXYZW(count, x, y, z, height);
      beat.setXYZW(count, phase, mirror, HUE_ORDER.indexOf(hue), gain);
      count++;
      return true;
    },
    end() {
      geo.instanceCount = count;
      flame.needsUpdate = true;
      beat.needsUpdate = true;
    },
  };
}
