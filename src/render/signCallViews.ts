/**
 * The marks over an Elder Sign that has a reason to be rested at now (2026-11-03, asked; systems/signCalls.ts says
 * which). Each call has a shape, a colour and a motion of its own, so one is never taken for another:
 *
 * - descend: three chevrons pointing down, pale dream-blue, their light running downward (the Seventy Steps).
 * - travel: a ring broken by an arrowhead, sea-green, turning (the lead lies in a realm reached by travel from here).
 * - ending: a key, silver, swaying (the Court's endings).
 * - level: a chevron over a bar, gold, its light running upward (Echoes enough for a level).
 * - stones: a five-pointed star, amber, wheeling slowly and twinkling (star-stones enough to reinforce).
 * - relic: a lozenge about a dot, rose, breathing (a relic found and not yet looked at).
 *
 * Several are hung in a shallow arc over the stone, facing the eye; they grow modestly with distance and fade in
 * and out as the calls change. Dithered additive light, one small mesh each; read-only on the simulation.
 */

import * as THREE from 'three';
import type { Game } from '../systems/components';
import { SIGN_CALLS, signCalls, type SignCall } from '../systems/signCalls';
import { PLINTH } from '../world/shrine';
import { SPACE_GLSL } from './shaders/world';
import { worldUniforms } from './worldMaterial';

export interface SignCallViews {
  update(time: number, eye: THREE.Vector3): void;
}

type Pt = readonly [number, number];
interface Look { color: readonly [number, number, number]; flow: number; shape: () => Pt[] }

const HIGH = PLINTH + 3.15; // metres above the sign's foot: over the carved stone
const GAP = 0.72; // between marks side by side
const SIZE = 0.55; // a mark's height near to
const ARC = 0.035; // drop per squared slot, making a shallow arch over the stone
const GROW = [26, 2.2] as const; // beyond this many metres a mark grows with distance, up to this many times
const EVERY = 0.4; // seconds between asking the simulation again
const FADE = 0.35; // seconds to come or go

/** A thick segment from a to b, as two triangles. */
function bar(out: Pt[], a: Pt, b: Pt, w: number): void {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const l = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [(-dy / l) * w * 0.5, (dx / l) * w * 0.5];
  const p = (q: Pt, s: number): Pt => [q[0] + nx * s, q[1] + ny * s];
  out.push(p(a, 1), p(a, -1), p(b, 1), p(b, 1), p(a, -1), p(b, -1));
}
function ring(out: Pt[], c: Pt, r: number, w: number, from = 0, to = Math.PI * 2, n = 20): void {
  for (let i = 0; i < n; i++) {
    const [a, b] = [from + ((to - from) * i) / n, from + ((to - from) * (i + 1)) / n];
    bar(out, [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r], [c[0] + Math.cos(b) * r, c[1] + Math.sin(b) * r], w);
  }
}
const chevron = (out: Pt[], y: number, dir: 1 | -1, w = 0.1): void => {
  bar(out, [-0.36, y - dir * 0.16], [0, y + dir * 0.16], w);
  bar(out, [0.36, y - dir * 0.16], [0, y + dir * 0.16], w);
};

/** Each call's look: its colour, its light's flow along y (−1 down, 1 up, 0 still) and its shape in a box about ±0.5. */
export const LOOKS: Readonly<Record<SignCall, Look>> = {
  descend: { color: [0.55, 0.78, 1], flow: -1, shape: () => { const o: Pt[] = []; for (const y of [0.32, 0, -0.32]) chevron(o, y, -1); return o; } },
  travel: { color: [0.4, 1, 0.75], flow: 0, shape: () => {
    const o: Pt[] = [];
    ring(o, [0, 0], 0.36, 0.09, 0.5, Math.PI * 2 - 0.1);
    bar(o, [0.36, 0.12], [0.2, -0.12], 0.09); // the arrowhead where the ring breaks
    bar(o, [0.36, 0.12], [0.52, -0.1], 0.09);
    return o;
  } },
  ending: { color: [0.92, 0.94, 1], flow: 0, shape: () => {
    const o: Pt[] = [];
    ring(o, [0, 0.26], 0.17, 0.08);
    bar(o, [0, 0.09], [0, -0.48], 0.08);
    bar(o, [0, -0.3], [0.17, -0.3], 0.07);
    bar(o, [0, -0.44], [0.13, -0.44], 0.07);
    return o;
  } },
  level: { color: [1, 0.8, 0.34], flow: 1, shape: () => { const o: Pt[] = []; chevron(o, 0.18, 1, 0.12); chevron(o, -0.12, 1, 0.12); bar(o, [-0.38, -0.42], [0.38, -0.42], 0.1); return o; } },
  stones: { color: [1, 0.62, 0.24], flow: 0, shape: () => {
    const o: Pt[] = [];
    const pt = (i: number, r: number): Pt => [Math.sin((i * Math.PI) / 5) * r, Math.cos((i * Math.PI) / 5) * r];
    for (let i = 0; i < 10; i++) o.push([0, 0], pt(i, i % 2 ? 0.2 : 0.48), pt(i + 1, (i + 1) % 2 ? 0.2 : 0.48));
    return o;
  } },
  relic: { color: [1, 0.5, 0.62], flow: 0, shape: () => {
    const o: Pt[] = [];
    const d: Pt[] = [[0, 0.46], [0.32, 0], [0, -0.46], [-0.32, 0]];
    for (let i = 0; i < 4; i++) bar(o, d[i], d[(i + 1) % 4], 0.09);
    ring(o, [0, 0], 0.06, 0.12, 0, Math.PI * 2, 10);
    return o;
  } },
};

const VERT = /* glsl */ `
${SPACE_GLSL}
varying float vY;
void main() {
  vY = position.y;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  gl_Position = snap(projectionMatrix * viewMatrix * vec4(displace(wp.xyz), 1.0));
}
`;
const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uFlow;
uniform float uTime;
varying float vY;
float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float run = uFlow == 0.0 ? 1.0 : 0.55 + 0.45 * sin((vY / ${SIZE.toFixed(2)} - uFlow * uTime * 1.6) * 6.2832 * 1.2);
  if (uAlpha * run * 0.6 < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(uColor * 0.55, 1.0);
}
`;

function geometryOf(look: Look): THREE.BufferGeometry {
  const pts = look.shape();
  const pos = new Float32Array(pts.length * 3);
  pts.forEach(([x, y], i) => pos.set([x * SIZE, y * SIZE, 0], i * 3));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

interface Mark { call: SignCall; mesh: THREE.Mesh; mat: THREE.ShaderMaterial; alpha: number; want: boolean; slot: number }

export function createSignCallViews(scene: THREE.Scene, g: Game): SignCallViews {
  const geos = new Map(SIGN_CALLS.map((c) => [c, geometryOf(LOOKS[c])] as const));
  const marks = new Map<string, Mark>(); // `${sign}|${call}`
  const at = new Map<string, THREE.Vector3>(); // each sign's foot
  let [last, asked] = [0, -Infinity];

  function place(sign: string): THREE.Vector3 | undefined {
    if (!at.has(sign)) for (const [e, s] of g.ecs.c.sign) {
      const tr = g.ecs.c.transform.get(e);
      if (tr) at.set(s.id, new THREE.Vector3(tr.pos.x, tr.pos.y, tr.pos.z));
    }
    return at.get(sign);
  }
  function mark(sign: string, call: SignCall): Mark {
    const key = `${sign}|${call}`;
    let m = marks.get(key);
    if (!m) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...worldUniforms, uColor: { value: new THREE.Vector3(...LOOKS[call].color) }, uAlpha: { value: 0 }, uFlow: { value: LOOKS[call].flow }, uTime: { value: 0 } },
        vertexShader: VERT, fragmentShader: FRAG, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geos.get(call)!, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = 5;
      scene.add(mesh);
      m = { call, mesh, mat, alpha: 0, want: false, slot: 0 };
      marks.set(key, m);
    }
    return m;
  }

  return {
    update(time, eye) {
      const dt = Math.min(0.1, Math.max(0, time - last));
      last = time;
      if (time - asked >= EVERY) {
        asked = time;
        for (const m of marks.values()) m.want = false;
        for (const [sign, calls] of signCalls(g)) calls.forEach((c, i) => Object.assign(mark(sign, c), { want: true, slot: i - (calls.length - 1) / 2 }));
      }
      for (const [key, m] of marks) {
        m.alpha = Math.max(0, Math.min(1, m.alpha + (m.want ? dt : -dt) / FADE));
        const foot = place(key.slice(0, key.lastIndexOf('|')));
        m.mesh.visible = m.alpha > 0.01 && !!foot;
        if (!m.mesh.visible || !foot) continue;
        const face = Math.atan2(eye.x - foot.x, eye.z - foot.z);
        const d = Math.hypot(eye.x - foot.x, eye.z - foot.z);
        const k = Math.min(GROW[1], Math.max(1, d / GROW[0]));
        const bob = Math.sin(time * 1.2 + m.slot * 0.35) * 0.035;
        const arc = ARC * m.slot * m.slot * k;
        m.mesh.position.set(foot.x + Math.cos(face) * m.slot * GAP * k, foot.y + HIGH + (k - 1) * SIZE * 0.6 - arc + bob, foot.z - Math.sin(face) * m.slot * GAP * k); // shallow arch, left to right as the eye sees it
        m.mesh.scale.setScalar(k);
        m.mesh.rotation.set(0, face, m.call === 'ending' ? Math.sin(time * 1.3) * 0.25 : 0);
        if (m.call === 'stones') m.mesh.rotation.set(0, face, time * 0.5);
        if (m.call === 'travel') m.mesh.rotation.set(0, face, -time * 0.9);
        const breath = m.call === 'relic' ? 0.7 + 0.3 * Math.sin(time * 2.4) : m.call === 'stones' ? 0.8 + 0.2 * Math.sin(time * 9) * Math.sin(time * 2.3) : 1;
        m.mat.uniforms.uAlpha.value = m.alpha * breath;
        m.mat.uniforms.uTime.value = time;
      }
    },
  };
}
