/**
 * The track of a blow (round 83; render only, read-only on the simulation): while the investigator's weapon is
 * cutting, the line its edge draws is left in the air for a fraction of a second, a dithered ribbon from the weapon's
 * farthest point to a point back along it, brightest at the point and fading with age, so the arc a blow takes and
 * how wide it was are seen. Nothing is drawn for a weapon at rest, a shot or a guard. Its geometry is one fixed ribbon
 * of the last few samples; it breaks at the start of each new blow.
 */

import * as THREE from 'three';
import { SWING_TRAIL } from '../data/fxTuning';
import { worldUniforms } from './worldMaterial';

const VERT = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
attribute float aAlpha;
attribute float aAcross;
varying float vAlpha;
varying float vAcross;
varying float vFog;
void main() {
  vAlpha = aAlpha;
  vAcross = aAcross;
  vec4 vp = viewMatrix * modelMatrix * vec4(position, 1.0);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  gl_Position = projectionMatrix * vp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying float vAcross;
varying float vFog;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float a = vAlpha * (1.0 - vFog) * mix(0.1, 1.0, vAcross * vAcross); // brightest at the point, a ghost toward the hand
  if (a < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(uColor * mix(0.75, 1.15, vAcross), 1.0);
}
`;

/** The edge of a weapon in the hand's frame: its farthest point from the grip, and a point back along it. Cached by geometry. */
const edges = new WeakMap<THREE.BufferGeometry, { tip: THREE.Vector3; base: THREE.Vector3 }>();
export function edgeOf(mesh: THREE.Mesh): { tip: THREE.Vector3; base: THREE.Vector3 } {
  const geo = mesh.geometry;
  let e = edges.get(geo);
  if (!e) {
    const p = geo.getAttribute('position');
    const tip = new THREE.Vector3();
    let far = -1;
    for (let i = 0; i < p.count; i++) {
      const d = p.getX(i) ** 2 + p.getY(i) ** 2 + p.getZ(i) ** 2;
      if (d > far) [far, tip.x, tip.y, tip.z] = [d, p.getX(i), p.getY(i), p.getZ(i)];
    }
    e = { tip, base: tip.clone().multiplyScalar(1 - Math.min(SWING_TRAIL.width, Math.sqrt(far) * 0.75) / Math.max(0.05, Math.sqrt(far))) };
    edges.set(geo, e);
  }
  return e;
}

interface Sample {
  tip: THREE.Vector3;
  base: THREE.Vector3;
  at: number; // render seconds
  start: boolean; // the first of a blow: the ribbon does not run back through the gap before it
}

/** How much of a sample is left `age` seconds after it was laid. */
export const trailAlpha = (age: number): number => (age < 0 || age >= SWING_TRAIL.life ? 0 : (1 - age / SWING_TRAIL.life) ** 1.5 * SWING_TRAIL.alpha);

export interface SwingTrails {
  /** Each drawn frame: the weapon's edge in world space while it is cutting, or null; `time` is render seconds. */
  update(edge: { tip: THREE.Vector3; base: THREE.Vector3 } | null, time: number): void;
}

export function createSwingTrails(scene: THREE.Scene): SwingTrails {
  const n = SWING_TRAIL.samples;
  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(n * 6), 3).setUsage(THREE.DynamicDrawUsage);
  const alpha = new THREE.BufferAttribute(new Float32Array(n * 2), 1).setUsage(THREE.DynamicDrawUsage);
  const across = new THREE.BufferAttribute(new Float32Array(n * 2), 1);
  for (let i = 0; i < n; i++) [across.array[i * 2], across.array[i * 2 + 1]] = [0, 1]; // base, then tip
  const index: number[] = [];
  for (let i = 0; i < n - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  geo.setAttribute('position', pos);
  geo.setAttribute('aAlpha', alpha);
  geo.setAttribute('aAcross', across);
  geo.setIndex(index);
  const material = new THREE.ShaderMaterial({
    uniforms: { uFogNear: worldUniforms.uFogNear, uFogFar: worldUniforms.uFogFar, uColor: { value: new THREE.Color(...SWING_TRAIL.color) } },
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.renderOrder = 2;
  scene.add(mesh);
  const samples: Sample[] = []; // newest first
  let was = false;

  return {
    update(edge, time) {
      if (edge) {
        const last = samples[0];
        if (!last || last.tip.distanceToSquared(edge.tip) > 1e-6) {
          samples.unshift({ tip: edge.tip.clone(), base: edge.base.clone(), at: time, start: !was });
          if (samples.length > n) samples.pop();
        }
      }
      was = !!edge;
      while (samples.length && time - samples[samples.length - 1].at >= SWING_TRAIL.life) samples.pop();
      let used = 0;
      for (const s of samples) {
        const a = trailAlpha(time - s.at);
        const i = used * 6;
        [pos.array[i], pos.array[i + 1], pos.array[i + 2]] = [s.base.x, s.base.y, s.base.z];
        [pos.array[i + 3], pos.array[i + 4], pos.array[i + 5]] = [s.tip.x, s.tip.y, s.tip.z];
        alpha.array[used * 2] = alpha.array[used * 2 + 1] = a;
        used++;
        if (s.start) break; // (a blow begins here: what is older is another blow's)
      }
      mesh.visible = used >= 2;
      if (!mesh.visible) return;
      geo.setDrawRange(0, (used - 1) * 6);
      pos.needsUpdate = alpha.needsUpdate = true;
    },
  };
}
