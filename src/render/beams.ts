/**
 * Beams (render only; redesigned in round 51): a sweeping beam while it sweeps, and the flash of a
 * horror's beam as it fires, as camera-facing ribbons along their segments. Each is two ribbons: a wide
 * aura that crawls and breathes, and the beam itself with a hot core that holds steady in the horror's
 * own light (`attackLook`); energy runs out along it from its source, and its edge is ragged. The
 * ends' flares and the scorch it draws on the ground are `attackFx`'s. Dithered, self-lit. Driven by
 * the sweeping moves and the Shot event. Read-only on the simulation.
 */

import * as THREE from 'three';
import type { V3 } from '../core/geom';
import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { beamLine } from '../systems/strikes';
import { attackLook } from './attackLook';
import type { Rgb } from './palette';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 48; // ribbons: two to a beam
const FLASH = 0.26; // seconds a fired beam lingers

export interface Beams {
  update(alpha: number, time: number, camera: THREE.Camera): void;
}

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
attribute vec4 aColor;
attribute vec3 aCore;
attribute vec2 aAcross; // x: -1..1 across the ribbon; y: metres along it from its source
varying vec4 vColor;
varying vec3 vCore;
varying vec2 vAcross;
varying float vFog;
void main() {
  vColor = aColor;
  vCore = aCore;
  vAcross = aAcross;
  vec4 vp = viewMatrix * vec4(position, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogAmount;
uniform float uTime;
varying vec4 vColor;
varying vec3 vCore;
varying vec2 vAcross;
varying float vFog;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float along = vAcross.y;
  float rag = 0.09 * sin(along * 7.3 - uTime * 41.0) + 0.06 * sin(along * 13.1 + uTime * 57.0);
  float d = clamp(abs(vAcross.x) + rag * abs(vAcross.x), 0.0, 1.0);
  float run = 0.5 + 0.5 * sin(along * 1.1 - uTime * 16.0); // energy running out from the source
  float breath = 0.82 + 0.18 * sin(uTime * 23.0 + along * 0.4);
  float core = (1.0 - smoothstep(0.08, 0.3, d)) * breath;
  float glow = pow(1.0 - d, 1.6) * (0.65 + 0.35 * run);
  float a = vColor.a * max(core, glow);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  vec3 c = mix(vColor.rgb * (0.9 + 0.35 * run), vCore, core);
  gl_FragColor = vec4(mix(c, uFogColor, vFog * uFogAmount * 0.5), 1.0);
}
`;

export function createBeams(scene: THREE.Scene, g: Game): Beams {
  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const col = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const core = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const across = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const index: number[] = [];
  for (let i = 0; i < CAPACITY; i++) index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
  geo.setAttribute('position', pos);
  geo.setAttribute('aColor', col);
  geo.setAttribute('aCore', core);
  geo.setAttribute('aAcross', across);
  geo.setIndex(index);
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms, uTime: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const flashes: { from: V3; to: V3; at: number; color: Rgb; core: Rgb }[] = [];
  let now = 0;
  g.events.on('Shot', ({ shooter, from, to }) => {
    if (shooter !== g.player.id) flashes.push({ from: { ...from }, to: { ...to }, at: now, color: attackLook(g, shooter).line, core: attackLook(g, shooter).core });
  });

  const eye = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const side = new THREE.Vector3();
  const view = new THREE.Vector3();
  let n = 0;
  const ribbon = (a: V3, b: V3, width: number, color: Rgb, white: Rgb, alpha: number): void => {
    if (n >= CAPACITY) return;
    dir.set(b.x - a.x, b.y - a.y, b.z - a.z);
    const length = dir.length();
    dir.normalize();
    view.set((a.x + b.x) / 2 - eye.x, (a.y + b.y) / 2 - eye.y, (a.z + b.z) / 2 - eye.z);
    side.crossVectors(dir, view).normalize().multiplyScalar(width / 2);
    const k = n * 4;
    pos.setXYZ(k, a.x - side.x, a.y - side.y, a.z - side.z);
    pos.setXYZ(k + 1, a.x + side.x, a.y + side.y, a.z + side.z);
    pos.setXYZ(k + 2, b.x - side.x, b.y - side.y, b.z - side.z);
    pos.setXYZ(k + 3, b.x + side.x, b.y + side.y, b.z + side.z);
    for (let i = 0; i < 4; i++) {
      col.setXYZW(k + i, color[0], color[1], color[2], alpha);
      core.setXYZ(k + i, white[0], white[1], white[2]);
      across.setXY(k + i, i % 2 === 0 ? -1 : 1, i < 2 ? 0 : length);
    }
    n++;
  };
  /** A beam's two ribbons: its aura, wide and faint, and the beam. */
  const beam = (a: V3, b: V3, width: number, look: { line: Rgb; core: Rgb }, alpha: number): void => {
    ribbon(a, b, width * 2.8, look.line, look.core, alpha * 0.45);
    ribbon(a, b, width, look.line, look.core, alpha);
  };

  return {
    update(alpha, time, camera) {
      now = time;
      material.uniforms.uTime.value = time;
      eye.setFromMatrixPosition(camera.matrixWorld);
      n = 0;
      for (const [id, a] of g.ecs.c.actor) {
        const sw = moveDef(a)?.sweep;
        if (!sw || a.frame < sw.window[0] || a.frame >= sw.window[1] || isAbsent(g, id)) continue;
        const { from, to } = beamLine(g, id, sw, a.frame + alpha);
        const flicker = 0.85 + 0.15 * Math.sin(time * 70 + id);
        beam(from, to, 0.9 * sw.width + 0.5, attackLook(g, id), flicker);
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        const t = (time - f.at) / FLASH;
        if (t >= 1 || t < 0) {
          flashes.splice(i, 1);
          continue;
        }
        beam(f.from, f.to, 1.1 * (1 - t) + 0.2, { line: f.color, core: f.core }, 1 - t * t);
      }
      geo.setDrawRange(0, n * 6);
      pos.needsUpdate = true;
      col.needsUpdate = true;
      core.needsUpdate = true;
      across.needsUpdate = true;
    },
  };
}
