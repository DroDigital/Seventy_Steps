/** Wisps that belong to a horse: parented to its body, neck or muzzle, and stirred every frame.
 * Spectral fire stays small and violet. A living horse only breathes. */
import * as THREE from 'three';
import { worldUniforms } from './worldMaterial';
import type { Point } from './mountKit';

export interface HorseWisp {
  material: THREE.ShaderMaterial;
  update(time: number, speed: number, hooves?: readonly Point[]): void;
}

interface Span { start: number; count: number; base: Float32Array }

const VERT = `attribute float aSeed;
uniform float uTime; uniform float uSpeed;
varying vec2 vUv; varying float vSeed; varying float vDistance;
void main() {
  vUv = uv; vSeed = aSeed; vec3 p = position;
  float t = uTime * (1.45 + uSpeed * 0.08) + aSeed * 1.7;
  p.x += sin(t + p.y * 8.0) * 0.03 * uv.y;
  p.y += sin(t * 1.25) * 0.028 * uv.y;
  p.z += sin(t * 0.85 + aSeed) * 0.025 * uv.y - uv.y * uv.y * uSpeed * 0.012;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vDistance = length(view.xyz);
  gl_Position = projectionMatrix * view;
}`;

const FRAG = `precision highp float;
uniform float uTime; uniform float uGhost; uniform float uStyle;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFogAmount;
varying vec2 vUv; varying float vSeed; varying float vDistance;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec2 p = vUv; float n = noise(vec2(p.x * 3.0 + vSeed, p.y * 5.0 - uTime * 1.3));
  float edge = abs(p.x - 0.5) * 2.0;
  float width = (1.0 - p.y) * (0.42 + 0.25 * n);
  float alpha = smoothstep(width + 0.2, width - 0.02, edge) * smoothstep(1.0, 0.2, p.y) * (0.32 + 0.38 * n);
  alpha *= smoothstep(0.0, 0.07, p.y);
  if (alpha < 0.02) discard;
  vec3 spectral = mix(vec3(0.14, 0.02, 0.28), vec3(0.42, 0.08, 0.55), n);
  vec3 breath = mix(vec3(0.42, 0.44, 0.46), vec3(0.7, 0.73, 0.75), n);
  vec3 col = mix(breath, spectral, uStyle);
  float pace = uStyle > 0.5 ? mix(0.8, 1.05, clamp(uSpeed / 12.0, 0.0, 1.0)) : mix(1.0, 0.35, clamp(uSpeed / 8.0, 0.0, 1.0));
  float fog = smoothstep(uFogNear, uFogFar, vDistance) * uFogAmount;
  float presence = mix(0.22, 0.36, uStyle);
  gl_FragColor = vec4(mix(col, uFogColor, fog), alpha * (1.0 - fog) * (1.0 - uGhost) * presence * pace);
}`;

function material(style: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uSpeed: { value: 0 }, uGhost: { value: 0 }, uStyle: { value: style },
      uFogColor: worldUniforms.uFogColor, uFogNear: worldUniforms.uFogNear, uFogFar: worldUniforms.uFogFar, uFogAmount: worldUniforms.uFogAmount,
    },
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

/** A short vertical tongue. Returns the vertex count written. */
function tongue(pos: number[], uv: number[], seeds: number[], x: number, y: number, z: number, height: number, width: number, seed: number, yaw: number): number {
  const start = pos.length;
  const point = (u: number, v: number): void => {
    const w = (u - 0.5) * width * (1 - v * 0.82);
    pos.push(x + Math.cos(yaw) * w, y + v * height, z + Math.sin(yaw) * w);
    uv.push(u, v); seeds.push(seed);
  };
  for (let j = 0; j < 5; j++) {
    const a = j / 5, b = (j + 1) / 5;
    point(0, a); point(1, a); point(1, b); point(0, a); point(1, b); point(0, b);
  }
  return (pos.length - start) / 3;
}

function mesh(parent: THREE.Object3D, pos: number[], uv: number[], seeds: number[], mat: THREE.ShaderMaterial, name: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.Float32BufferAttribute(pos, 3);
  position.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
  const m = new THREE.Mesh(geometry, mat);
  m.name = name; m.frustumCulled = false; m.renderOrder = 2; parent.add(m);
  return m;
}

/** Violet fire along the spine and neck, with four hoof tongues rewritten onto the feet. */
export function horseFlame(body: THREE.Object3D, neck: THREE.Object3D): HorseWisp {
  const mat = material(1);
  const pos: number[] = [], uv: number[] = [], seeds: number[] = [], spans: Span[] = [];
  let seed = 1;
  for (let i = 0; i < 4; i++) tongue(pos, uv, seeds, (i % 2 ? 0.04 : -0.04), 0.22, -0.42 + i * 0.28, 0.2, 0.11, seed++, 0.2);
  for (let i = 0; i < 4; i++) {
    const start = pos.length / 3;
    const count = tongue(pos, uv, seeds, 0, 0.02, 0.02, 0.13, 0.08, seed++, i);
    const base = new Float32Array(count * 3);
    for (let v = 0; v < count; v++) base.set(pos.slice((start + v) * 3, (start + v) * 3 + 3), v * 3);
    spans.push({ start, count, base });
  }
  const bodyMesh = mesh(body, pos, uv, seeds, mat, 'spectral-flame');
  const npos: number[] = [], nuv: number[] = [], nseeds: number[] = [];
  for (let i = 0; i < 3; i++) tongue(npos, nuv, nseeds, 0, 0.12 + i * 0.16, 0.08, 0.14, 0.08, seed++, 0.4);
  mesh(neck, npos, nuv, nseeds, mat, 'spectral-flame-neck');
  const attr = bodyMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  return { material: mat, update(time, speed, hooves) {
    mat.uniforms.uTime.value = time; mat.uniforms.uSpeed.value = speed;
    if (!hooves) return;
    for (let h = 0; h < spans.length; h++) {
      const span = spans[h], hoof = hooves[h] ?? [0, 0, 0];
      for (let v = 0; v < span.count; v++) attr.setXYZ(span.start + v, span.base[v * 3] + hoof[0], span.base[v * 3 + 1] + hoof[1], span.base[v * 3 + 2] + hoof[2]);
    }
    attr.needsUpdate = true;
  } };
}

/** A cool, small breath at a living horse's muzzle. Fades while it gallops. */
export function breathWisp(parent: THREE.Object3D): HorseWisp {
  const mat = material(0);
  const pos: number[] = [], uv: number[] = [], seeds: number[] = [];
  tongue(pos, uv, seeds, -0.03, -0.02, 0.16, 0.1, 0.05, 2, 0.5);
  tongue(pos, uv, seeds, 0.03, -0.03, 0.18, 0.12, 0.045, 5, -0.4);
  mesh(parent, pos, uv, seeds, mat, 'mount-breath');
  return { material: mat, update(time, speed) { mat.uniforms.uTime.value = time; mat.uniforms.uSpeed.value = speed; } };
}
