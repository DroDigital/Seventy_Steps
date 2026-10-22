/**
 * The phenomena of the points of interest (round 61; data/pois.ts `fx`): what is wrong about a place, drawn where it stands in one of
 * the anomaly hues (nothing else is saturated; bone is the one pale form) and seen from POI.see metres, fading as it is left. A column
 * is a shimmering rod of light; a ring a wheel of dashes turning flat on the ground; motes a drift of sparks rising and falling about
 * it; a sheet a curtain of streaks hung round it like an aurora. They sit over the ground and the mist, as the beacons do. Render only.
 */

import * as THREE from 'three';
import { POI } from '../data/tuning';
import type { PoiFx as Fx } from '../data/pois';
import type { Game } from '../systems/components';
import { poiSitesOf, type PoiSite } from '../world/poiSites';
import { ground } from '../world/terrain';
import { ANOMALY, BASE, type Rgb } from './palette';

const HUES: Record<Fx['hue'], Rgb> = { magenta: ANOMALY.magenta, purple: ANOMALY.purple, green: ANOMALY.green, bone: BASE.bone };
const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const HEAD = 'uniform vec3 uColor; uniform float uAlpha; uniform float uTime; varying vec2 vUv;\n';
const FRAG: Record<'column' | 'ring' | 'sheet', string> = {
  column: HEAD + `void main() {
  float side = smoothstep(0.5, 0.08, abs(vUv.x - 0.5));
  float rise = pow(1.0 - vUv.y, 0.7) * smoothstep(0.0, 0.03, vUv.y);
  float bands = 0.65 + 0.35 * sin(vUv.y * 48.0 - uTime * 3.2);
  gl_FragColor = vec4(uColor, uAlpha * 0.7 * side * rise * bands);
}`,
  ring: HEAD + `void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float outer = smoothstep(0.035, 0.0, abs(r - 0.9)) * step(0.45, fract(a * 2.4 + uTime * 0.22));
  float inner = smoothstep(0.03, 0.0, abs(r - 0.62)) * step(0.5, fract(a * 3.6 - uTime * 0.3));
  float spokes = smoothstep(0.02, 0.0, abs(fract(a * 0.9549 + uTime * 0.05) - 0.5) - 0.48) * step(0.62, r) * step(r, 0.9);
  float pulse = 0.7 + 0.3 * sin(uTime * 1.6);
  gl_FragColor = vec4(uColor, uAlpha * 0.85 * pulse * clamp(outer + inner + spokes * 0.6, 0.0, 1.0));
}`,
  sheet: HEAD + `void main() {
  float x = vUv.x * 64.0;
  float streak = 0.5 + 0.5 * sin(x + sin(uTime * 0.6 + vUv.y * 5.0 + x * 0.21) * 2.0);
  float fine = 0.5 + 0.5 * sin(x * 2.7 - uTime * 1.1);
  float hem = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
  gl_FragColor = vec4(uColor, uAlpha * 0.6 * hem * pow(streak, 2.0) * (0.55 + 0.45 * fine));
}`,
};
const MOTE_VERT = `attribute float aSeed; uniform float uTime; uniform float uHeight; uniform float uSize; varying float vTw;
void main() {
  vec3 p = position;
  float t = fract(aSeed + uTime * (0.025 + 0.03 * fract(aSeed * 7.0)));
  p.y = t * uHeight;
  p.x += sin(uTime * 0.5 + aSeed * 40.0) * 0.8;
  p.z += cos(uTime * 0.43 + aSeed * 31.0) * 0.8;
  vTw = sin(t * 3.14159) * (0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 90.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = clamp(uSize * 260.0 / max(1.0, -mv.z), 1.5, 9.0);
  gl_Position = projectionMatrix * mv;
}`;
const MOTE_FRAG = 'uniform vec3 uColor; uniform float uAlpha; varying float vTw;\nvoid main() { float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(uColor, uAlpha * vTw * smoothstep(1.0, 0.2, d)); }';

/** How much of a phenomenon shows at `distance` metres: full within a third of POI.see, none beyond it. */
export const poiFxAlpha = (distance: number): number => Math.min(1, Math.max(0, (POI.see - distance) / (POI.see * 0.65)));

interface Shown {
  group: THREE.Group;
  alpha: { value: number };
  site: PoiSite;
  billboard: boolean;
}

export interface PoiFx {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
}

function build(site: PoiSite, fx: Fx, uTime: { value: number }): Shown {
  const alpha = { value: 0 };
  const group = new THREE.Group();
  const uColor = { value: new THREE.Vector3(...HUES[fx.hue]) };
  const uniforms = { uColor, uAlpha: alpha, uTime };
  const sheet = (geo: THREE.BufferGeometry, form: 'column' | 'ring' | 'sheet'): THREE.Mesh =>
    new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG[form], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const R = Math.max(5, Math.min(site.r * 0.7, 16));
  let billboard = false;
  if (fx.form === 'column') {
    group.add(sheet(new THREE.PlaneGeometry(3.2, 52).translate(0, 26, 0), 'column'));
    billboard = true;
  } else if (fx.form === 'ring') {
    group.add(sheet(new THREE.PlaneGeometry(R * 2, R * 2).rotateX(-Math.PI / 2).translate(0, 0.2, 0), 'ring'));
  } else if (fx.form === 'sheet') {
    group.add(sheet(new THREE.CylinderGeometry(R, R, 24, 40, 1, true).translate(0, 12, 0), 'sheet'));
  } else {
    const n = 90;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const [a, d] = [(k * 2.399963) % 6.2832, Math.sqrt((k + 0.5) / n) * R];
      [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], seed[k]] = [Math.sin(a) * d, 0, Math.cos(a) * d, ((k * 0.618034) % 1)];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: { ...uniforms, uHeight: { value: 14 }, uSize: { value: 3.4 } }, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false;
    group.add(m);
  }
  group.position.set(site.x, ground(site.x, site.z), site.z);
  group.visible = false;
  for (const c of group.children) c.frustumCulled = false;
  return { group, alpha, site, billboard };
}

export function createPoiFx(scene: THREE.Scene, g: Game): PoiFx {
  const uTime = { value: 0 };
  const made = new Map<string, Shown>(); // by place, made the first time its region is stood in
  const seen = new Set<string>();
  let last = -1;
  return {
    update(camera, time, hidden) {
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      uTime.value = time;
      const region = g.overworld?.region;
      if (region && !seen.has(region)) {
        seen.add(region);
        for (const s of poiSitesOf(region)) {
          if (!s.def.fx) continue;
          const shown = build(s, s.def.fx, uTime);
          scene.add(shown.group);
          made.set(s.def.id, shown);
        }
      }
      for (const m of made.values()) {
        const d = Math.hypot(m.site.x - camera.position.x, m.site.z - camera.position.z);
        const want = hidden || !g.overworld || g.overworld.region !== m.site.def.region ? 0 : poiFxAlpha(d);
        m.alpha.value += (want - m.alpha.value) * Math.min(1, dt / 1.5);
        m.group.visible = m.alpha.value > 0.01;
        if (m.group.visible && m.billboard) m.group.rotation.y = Math.atan2(camera.position.x - m.site.x, camera.position.z - m.site.z);
      }
    },
  };
}
