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
import { FEEL } from './feel';
import { flicker } from './lightning';
import type { BoltPath } from './lightningPath';
import type { Rgb } from './palette';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 160; // ribbons: two to a beam, two to a segment of a bolt of lightning
const FLASH = 0.42; // seconds a fired beam lingers (round 59: at 0.26 s, thinning from the first frame, it was gone before it was seen)
const HOLD = 0.3; // of which it holds at its full width before it thins
const SCREEN = 0.012; // the least width of a beam, as a share of its distance: it keeps its width on the screen far off, as a bolt of lightning does

export interface Beams {
  update(alpha: number, time: number, camera: THREE.Camera): void;
  /** A bolt of lightning (round 52): its main line and forks drawn as one flash for `life` seconds, as thick as `width`; `time` is render seconds, as `update`'s. */
  bolt(path: BoltPath, life: number, width: number, color: Rgb, core: Rgb): void;
}

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
attribute vec4 aColor;
attribute vec3 aCore;
attribute vec2 aAcross; // x: -1..1 across the ribbon; y: metres along it from its source
attribute vec2 aStyle; // x: how much of the fog's colour it takes at a distance (a beam a half, a bolt of lightning none); y: how much of its width is white-hot (a beam an eighth, a bolt a third)
varying vec4 vColor;
varying vec3 vCore;
varying vec2 vAcross;
varying float vFog;
varying vec2 vStyle;
void main() {
  vStyle = aStyle;
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
varying vec2 vStyle;
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
  float core = (1.0 - smoothstep(vStyle.y, vStyle.y + 0.22, d)) * breath;
  float glow = pow(1.0 - d, 1.6) * (0.65 + 0.35 * run);
  float a = vColor.a * max(core, glow);
  if (a < bayer4(gl_FragCoord.xy)) discard;
  vec3 c = mix(vColor.rgb * (0.9 + 0.35 * run), vCore, core);
  gl_FragColor = vec4(mix(c, uFogColor, vFog * uFogAmount * vStyle.x), 1.0);
}
`;

export function createBeams(scene: THREE.Scene, g: Game): Beams {
  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const col = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const core = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const across = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const style = new THREE.BufferAttribute(new Float32Array(CAPACITY * 4 * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const index: number[] = [];
  for (let i = 0; i < CAPACITY; i++) index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
  geo.setAttribute('position', pos);
  geo.setAttribute('aColor', col);
  geo.setAttribute('aCore', core);
  geo.setAttribute('aAcross', across);
  geo.setAttribute('aStyle', style);
  geo.setIndex(index);
  const material = new THREE.ShaderMaterial({ uniforms: { ...worldUniforms, uTime: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const flashes: { from: V3; to: V3; at: number; color: Rgb; core: Rgb }[] = [];
  const bolts: { path: BoltPath; at: number; life: number; width: number; color: Rgb; core: Rgb }[] = [];
  let now = 0;
  g.events.on('Shot', ({ shooter, from, to }) => {
    if (shooter !== g.player.id) flashes.push({ from: { ...from }, to: { ...to }, at: now, color: attackLook(g, shooter).line, core: attackLook(g, shooter).core });
  });

  const eye = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const side = new THREE.Vector3();
  const view = new THREE.Vector3();
  let n = 0;
  const ribbon = (a: V3, b: V3, width: number, color: Rgb, white: Rgb, alpha: number, mix = 0.5, hot = 0.08): void => {
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
      style.setXY(k + i, mix, hot);
    }
    n++;
  };
  /** A beam's two ribbons: its aura, wide and faint, and the beam. */
  const beam = (a: V3, b: V3, width: number, look: { line: Rgb; core: Rgb }, alpha: number, mix = 0.5, hot = 0.08): void => {
    ribbon(a, b, width * 2.8, look.line, look.core, alpha * (hot > 0.2 ? 0.6 : 0.45), mix, hot);
    ribbon(a, b, width, look.line, look.core, alpha, mix, hot);
  };
  /** How wide a beam is drawn: its own width, or at a distance the width that keeps it on the screen (from the nearer of its ends, and its middle). */
  const seen = (a: V3, b: V3, width: number): number => {
    const near = Math.min(...[a, b, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }].map((p) => Math.hypot(p.x - eye.x, p.y - eye.y, p.z - eye.z)));
    return Math.max(width, SCREEN * near);
  };

  return {
    bolt(path, life, width, color, core) {
      if (bolts.length >= 6) bolts.shift();
      bolts.push({ path, at: now, life, width, color, core });
    },
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
        const into = Math.min(1, (a.frame + alpha - sw.window[0]) / 6); // it opens over a tenth of a second, from a thread to its width
        beam(from, to, seen(from, to, (1.05 * sw.width + 0.6) * (0.35 + 0.65 * into)), attackLook(g, id), flicker, 0.4, 0.12);
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        const t = (time - f.at) / FLASH;
        if (t >= 1 || t < 0) {
          flashes.splice(i, 1);
          continue;
        }
        const thin = t < HOLD ? 0 : (t - HOLD) / (1 - HOLD); // full, then thinning to a thread as it fades
        beam(f.from, f.to, seen(f.from, f.to, 1.5 * (1 - thin) + 0.18), { line: f.color, core: f.core }, 1 - thin * thin, 0.4, 0.14);
      }
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]!;
        const t = (time - b.at) / b.life;
        if (t >= 1) {
          bolts.splice(i, 1);
          continue;
        }
        if (t < 0) continue;
        const k = Math.max(0.2, flicker(time - b.at, FEEL.flashes)) * (1 - t * 0.5); // a few quick pulses (a swell under the Flashes setting), thinning as it goes
        const line = { line: b.color, core: b.core };
        const wide = (p: V3, w: number): number => Math.max(w, 0.018 * Math.hypot(p.x - eye.x, p.y - eye.y, p.z - eye.z)); // a bolt does not thin to a hair with the distance: it keeps its width on the screen
        for (let j = 0; j + 1 < b.path.main.length; j++) beam(b.path.main[j]!, b.path.main[j + 1]!, wide(b.path.main[j]!, b.width * (0.6 + 0.4 * (j / b.path.main.length))), line, k, 0, 0.36);
        for (const fork of b.path.forks) for (let j = 0; j + 1 < fork.length; j++) beam(fork[j]!, fork[j + 1]!, wide(fork[j]!, b.width * 0.45 * (1 - j / fork.length)), line, k * 0.85, 0, 0.3);
      }
      geo.setDrawRange(0, n * 6);
      pos.needsUpdate = true;
      col.needsUpdate = true;
      core.needsUpdate = true;
      across.needsUpdate = true;
      style.needsUpdate = true;
    },
  };
}
