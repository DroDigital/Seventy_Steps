/**
 * The gates' veils (round 60: asked, "all traversable portals ... feature more ambitious, visually compelling animations
 * that enhance aesthetic appeal"). The dim purple pane between a gate's jambs is now a door of light onto the realm
 * beyond: the colours of that realm's sky and of its lamps (data/looks.ts) wound into a slow vortex about a bright heart,
 * the stars of its sky drifting in it, a rim of Cosmic Purple at the stone. It wakes as the investigator comes near (it
 * turns faster, its heart opens, motes are drawn in to it from about the frame); stepping in (`GateEntering`), it blazes
 * and the motes are torn in after them; coming through (a gate's `Travelled`), once the veil over the journey lifts, the
 * twin's veil bursts outward and motes blow out of it. Read-only on the simulation; signViews.ts is its model.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { LOOKS } from '../data/looks';
import { gatePlace } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import { ANOMALY, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Particles } from './particles';
import { SPACE_GLSL } from './shaders/world';
import { worldUniforms } from './worldMaterial';

export interface PortalViews {
  /** `time`: render seconds; `eye`: the camera; `veiled`: a journey's veil covers the screen (an arrival's burst waits for it to lift). */
  update(time: number, eye: THREE.Vector3, veiled: boolean): void;
}

export const PORTAL = {
  width: 3.3, // the veil between the jambs, metres...
  height: 3.8, // ...and up to the lintel
  wake: [2, 16] as readonly [number, number], // metres off at which it is wide awake, and at which it begins to stir
  ease: 1.6, // its waking and sleeping, per second
  reach: 90, // drawn this close to the eye
  motes: 16, // a second, drawn in, wide awake
  burst: 70, // motes torn in as they step in, and blown out as they come through
  out: 2.6, // seconds the coming-through blazes
};

const VERT = /* glsl */ `
${SPACE_GLSL}
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vUv;
varying float vFog;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec4 vp = viewMatrix * vec4(displace(wp.xyz), 1.0);
  gl_Position = snap(projectionMatrix * vp);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uWake;
uniform float uFlare;
uniform vec3 uSky;
uniform vec3 uLamp;
uniform vec3 uEdge;
varying vec2 vUv;
varying float vFog;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 p = (vUv - vec2(0.5, 0.46)) * vec2(${PORTAL.width.toFixed(2)}, ${PORTAL.height.toFixed(2)}) / 1.9;
  float r = length(p);
  float a = atan(p.y, p.x);
  float turn = uTime * (0.22 + 0.8 * uWake + 3.0 * uFlare);
  float swirl = a + 0.9 / (r + 0.3) + turn;
  float bands = 0.5 + 0.5 * sin(swirl * 3.0 + r * 8.0 - uTime * 1.2);
  float fine = 0.5 + 0.5 * sin(swirl * 7.0 - r * 17.0 + uTime * 0.6);
  float heart = exp(-r * r * (5.5 - 2.5 * uWake - 3.0 * min(uFlare, 1.0)));
  vec2 q = vec2(swirl * 1.3, log(r + 0.06) * 2.6 - uTime * (0.15 + 0.5 * uWake));
  vec2 cell = floor(q * 5.0);
  float star = step(0.9, hash(cell)) * smoothstep(0.24, 0.0, length(fract(q * 5.0) - 0.5)) * (0.6 + 0.4 * sin(uTime * 3.0 + hash(cell + 7.0) * 40.0));
  float side = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float edge = smoothstep(0.0, 0.07, side);
  float rim = 1.0 - smoothstep(0.0, 0.14, side);
  vec3 col = mix(uSky * 0.45, uSky * 1.25, bands);
  col = mix(col, uLamp, fine * bands * (0.25 + 0.4 * uWake));
  col += uLamp * heart * (0.55 + 1.2 * uWake + 2.4 * uFlare);
  col += vec3(0.95, 0.92, 1.0) * star * (0.45 + 0.8 * uWake);
  col = mix(col, uEdge * (1.2 + uWake), rim * 0.65);
  col += vec3(1.0) * pow(heart, 3.0) * uFlare;
  float alpha = edge * clamp(0.72 + 0.2 * uWake + 0.3 * uFlare, 0.0, 1.0);
  gl_FragColor = vec4(col * (1.0 - vFog * 0.45), alpha);
}
`;

interface View {
  gate: string;
  root: THREE.Group;
  mat: THREE.ShaderMaterial;
  wake: number; // 0 asleep .. 1 wide awake
  pull: { at: number; seconds: number } | null; // stepped into: it blazes until they are through
  push: { at: number } | null; // come through: it bursts outward (`at` NaN: once the journey's veil lifts)
  motes: number; // owed, fractional
  lamp: Rgb;
}

const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const v3 = (c: Rgb): THREE.Vector3 => new THREE.Vector3(...c);

/** The colours of the realm beyond gate `id`: its sky, brightened to read as light, and its lamps. */
function beyond(id: string): { sky: Rgb; lamp: Rgb } {
  const look = LOOKS[gatePlace(gatePlace(id)?.to ?? '')?.region ?? ''] ?? LOOKS.hub;
  return { sky: scaleRgb(mixRgb(look.zenith, look.horizon, 0.55), 2.2), lamp: mixRgb(look.grade[3], look.accents[0], 0.25) };
}

export function createPortalViews(scene: THREE.Scene, g: Game, particles: Particles): PortalViews {
  const views = new Map<Entity, View>();
  const byGate = new Map<string, View>();
  const plane = new THREE.PlaneGeometry(PORTAL.width, PORTAL.height);
  let last = 0;

  function build(e: Entity, gate: string): View {
    const tr = g.ecs.c.transform.get(e)!;
    const root = new THREE.Group();
    root.position.set(tr.pos.x, tr.pos.y, tr.pos.z);
    root.rotation.y = tr.yaw;
    const { sky, lamp } = beyond(gate);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...worldUniforms, uTime: { value: 0 }, uWake: { value: 0 }, uFlare: { value: 0 }, uSky: { value: v3(sky) }, uLamp: { value: v3(lamp) }, uEdge: { value: v3(ANOMALY.purple) } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const veil = new THREE.Mesh(plane, mat);
    veil.position.y = PORTAL.height / 2;
    root.add(veil);
    scene.add(root);
    return { gate, root, mat, wake: 0, pull: null, push: null, motes: 0, lamp };
  }

  function sync(): void {
    for (const [e, t] of g.ecs.c.gate) {
      if (views.has(e) || !g.ecs.c.transform.has(e)) continue;
      const v = build(e, t.id);
      views.set(e, v);
      byGate.set(t.id, v);
    }
  }

  /** A point on the veil, `across` and `up` from its foot's middle, `out` metres in front of it. */
  const on = (v: View, across: number, up: number, out = 0): { x: number; y: number; z: number } => {
    const [p, yaw] = [v.root.position, v.root.rotation.y];
    return { x: p.x + Math.cos(yaw) * across + Math.sin(yaw) * out, y: p.y + up, z: p.z - Math.sin(yaw) * across + Math.cos(yaw) * out };
  };
  const heartOf = (v: View): { x: number; y: number; z: number } => on(v, 0, PORTAL.height * 0.46);

  /** A mote drawn in to the heart from about the frame (`k`: how hard), or blown out of it (negative). */
  function mote(v: View, k: number): void {
    const h = heartOf(v);
    const a = Math.random() * Math.PI * 2;
    const r = rand(1.6, 2.6) * (k < 0 ? 0.15 : 1);
    const from = on(v, Math.cos(a) * r, PORTAL.height * 0.46 + Math.sin(a) * r, rand(-0.6, 0.6));
    const life = rand(0.9, 1.4) / (1 + Math.abs(k) * 0.4);
    const out = k < 0;
    const [tx, ty, tz] = out ? [from.x + (from.x - h.x) * 6, from.y + (from.y - h.y) * 6 + rand(0, 1.5), from.z + (from.z - h.z) * 6] : [h.x, h.y, h.z];
    particles.spawn({
      ...from, vx: (tx - from.x) / life, vy: (ty - from.y) / life, vz: (tz - from.z) / life,
      life, size: rand(0.05, 0.12) * (1 + Math.abs(k) * 0.3), grow: out ? 0.8 : 0.2, color: mixRgb(v.lamp, [1, 1, 1], rand(0.2, 0.7)), colorEnd: ANOMALY.purple,
      glow: true, alpha: 0.95, drag: out ? 1.2 : 0, shape: Math.random() < 0.3 ? 'streak' : 'disc', stretch: 0.06, hold: 0.5,
    });
  }
  /** A flare's ring of light at the heart, opening. */
  const ring = (v: View, big: number): void => void particles.spawn({ ...heartOf(v), life: 0.7, size: 0.6 * big, grow: 5, color: v.lamp, colorEnd: ANOMALY.purple, glow: true, shape: 'ring', thick: 0.1, alpha: 0.9 });

  g.events.on('GateEntering', ({ gate, frames }) => {
    const v = byGate.get(gate);
    if (!v) return;
    v.pull = { at: NaN, seconds: frames / 60 };
    for (let i = 0; i < PORTAL.burst; i++) mote(v, 2);
    ring(v, 1);
  });
  g.events.on('Travelled', ({ via, to }) => {
    const v = via === 'gate' ? byGate.get(to) : undefined;
    for (const x of views.values()) x.pull = null; // through
    if (v) [v.push, v.wake] = [{ at: NaN }, 1];
  });

  return {
    update(time, eye, veiled) {
      sync();
      const dt = Math.min(0.1, Math.max(0, time - last));
      last = time;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      for (const v of views.values()) {
        const p = v.root.position;
        v.root.visible = p.distanceTo(eye) < PORTAL.reach;
        if (!v.root.visible) continue;
        const d = me ? Math.hypot(me.x - p.x, me.z - p.z) : Infinity;
        const want = Math.min(1, Math.max(0, (PORTAL.wake[1] - d) / (PORTAL.wake[1] - PORTAL.wake[0])));
        v.wake += Math.sign(want - v.wake) * Math.min(Math.abs(want - v.wake), dt * PORTAL.ease);
        let flare = 0;
        if (v.pull) {
          if (Number.isNaN(v.pull.at)) v.pull.at = time;
          flare = Math.min(1.4, ((time - v.pull.at) / v.pull.seconds) * 1.4);
          v.motes += dt * PORTAL.motes * 2.5;
          for (; v.motes >= 1; v.motes--) mote(v, 2);
        }
        if (v.push && !veiled) {
          if (Number.isNaN(v.push.at)) {
            v.push.at = time;
            for (let i = 0; i < PORTAL.burst; i++) mote(v, -2);
            ring(v, 1.6);
          }
          const t = (time - v.push.at) / PORTAL.out;
          flare = Math.max(flare, 1.3 * Math.max(0, 1 - t) ** 2);
          if (t >= 1) v.push = null;
        }
        const u = v.mat.uniforms;
        [u.uTime.value, u.uWake.value, u.uFlare.value] = [time, v.wake, flare];
        if (v.pull || v.wake < 0.15) continue;
        v.motes += dt * PORTAL.motes * v.wake * v.wake;
        for (; v.motes >= 1; v.motes--) mote(v, 1);
      }
    },
  };
}
