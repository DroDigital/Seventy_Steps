/**
 * The gates of what grew and what bites (round 71; data/arenaHouses.ts `GateLook`; render/gateLooks.ts dispatches here): the black grove's, two
 * trunks grown together over a curtain of roots that sinks into the earth as one nears, and the serpent's, a jaw: hinges of earth and stone either
 * side, an upper row of fangs hanging from a lintel and a lower row standing in the ground, the two meeting across the way; the jaw opens by the
 * lower row sinking. In the door's own frame (u along the wall, v through it, y up from the floor), as `doorKit`'s. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { HiddenPieceDef } from '../data/arena';
import { box, tint } from './meshKit';
import { ANOMALY, type Rgb } from './palette';
import type { DoorKit } from './passageShapes';

const BARK: Rgb = [0.3, 0.22, 0.2];
const ROOT: Rgb = [0.24, 0.17, 0.16];
const FLESH: Rgb = [0.5, 0.22, 0.26];
const BONE: Rgb = [0.78, 0.74, 0.62];
const EARTH: Rgb = [0.5, 0.42, 0.32];
const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
const rnd = (i: number): number => {
  const s = Math.sin(i * 12.9898 + 7.3) * 43758.5453;
  return s - Math.floor(s);
};

/** A tapered post of `sides` faces standing at (u, 0) from the floor. */
const post = (rb: number, rt: number, h: number, u: number, z: number, c: Rgb, sides = 7): THREE.BufferGeometry => tint(new THREE.CylinderGeometry(rt, rb, h, sides).translate(u, h / 2 - 0.3, z), c);

/** A fang standing on its foot (or hanging by it, `down`): a cone of five faces. */
const fang = (u: number, y: number, h: number, r: number, down: boolean, z = 0): THREE.BufferGeometry => {
  const g = new THREE.ConeGeometry(r, h, 5).translate(0, h / 2, 0);
  if (down) g.rotateZ(Math.PI);
  return tint(g.translate(u, y, z), BONE);
};

/** The gate by its look (`roots` or `fangs`); `base` is the common framed door. */
export function wildKit(p: HiddenPieceDef, base: DoorKit): DoorKit {
  const { width: D, height: H, thick: T } = p.door!;
  const look = p.door!.look;
  const glow: THREE.BufferGeometry[] = [];
  const stone: THREE.BufferGeometry[] = [];
  if (look === 'roots') {
    for (const s of [-1, 1]) { // two trunks, leaning in over the way, with a root out along the ground and a pod hung on each
      const trunk = post(1.05, 0.7, H * 1.55, 0, 0, BARK).rotateZ(-s * 0.11).translate(s * (D / 2 + 0.6), 0, 0);
      stone.push(trunk, post(0.55, 0.4, H * 1.1, s * (D / 2 + 1.5), T * 0.5, ROOT, 6).rotateZ(-s * 0.16));
      stone.push(tint(new THREE.CylinderGeometry(0.2, 0.45, 1.8, 5).rotateZ(s * 1.25).translate(s * (D / 2 + 1.6), 0.25, -T * 0.5), ROOT));
      glow.push(tint(new THREE.IcosahedronGeometry(0.36, 0).scale(1, 1.3, 1).translate(s * (D / 2 - 0.2), H * 0.78, T * 0.6), ANOMALY[p.glow]));
    }
    for (const x of [-1.6, 0, 1.7]) stone.push(post(0.3, 0.24, D * 0.6, 0, 0, BARK, 5).rotateZ(Math.PI / 2 + (rnd(x * 7) - 0.5) * 0.5).translate(x * 0.2, H * 0.98 + x * 0.08, 0)); // and a bough across the top
    const net: THREE.BufferGeometry[] = [];
    const n = Math.max(7, Math.round(D / 0.7));
    for (let i = 0; i < n; i++) { // the curtain: roots down across the opening, each leaning a little, and a few across
      const u = -D / 2 + (D * (i + 0.5)) / n;
      net.push(post(0.2, 0.12, H + 0.3, u, (rnd(i) - 0.5) * T * 0.4, ROOT, 5).rotateZ((rnd(i + 3) - 0.5) * 0.28));
    }
    for (let k = 0; k < 4; k++) net.push(post(0.16, 0.13, D, 0, (rnd(k + 9) - 0.5) * T * 0.4, i2c(k), 5).rotateZ(Math.PI / 2 + (rnd(k + 11) - 0.5) * 0.3).translate(0, H * (0.2 + k * 0.22), 0));
    return { ...base, stone: merged(stone), glow: merged(glow), slab: merged(net), slabGlow: new THREE.BufferGeometry(), lift: -(H + 0.6) };
  }
  // fangs: a hinge of earth either side with a boss of stone, a lintel across, a row of fangs hung from it, a row standing in the floor
  for (const s of [-1, 1]) {
    stone.push(box(1.7, H * 1.25, T + 0.8, s * (D / 2 + 0.95), H * 0.62 - 0.3, 0, EARTH), box(1.1, 0.6, T + 1.1, s * (D / 2 + 0.95), H * 1.25 - 0.1, 0, [0.4, 0.34, 0.26]));
    glow.push(tint(new THREE.IcosahedronGeometry(0.22, 0).translate(s * (D / 2 + 0.6), H * 0.9, T * 0.5 + 0.5), ANOMALY[p.glow]));
  }
  stone.push(box(D + 3.4, 0.9, T + 0.8, 0, H + 0.45, 0, EARTH));
  const n = Math.max(5, Math.round(D / 1.1));
  const teeth: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const u = -D / 2 + (D * (i + 0.5)) / n;
    stone.push(fang(u, H, H * 0.34 + rnd(i) * 0.3, 0.3, true)); // the upper row hangs from the lintel, fixed
    teeth.push(fang(u, -0.3, H * 0.5 + rnd(i + 5) * 0.4, 0.33, false)); // the lower rises from the floor, and sinks
  }
  teeth.push(box(D, 0.5, T * 0.7, 0, -0.1, 0, EARTH));
  return { ...base, stone: merged(stone), glow: merged(glow), slab: merged(teeth), slabGlow: new THREE.BufferGeometry(), lift: -(H * 0.62 + 0.5) };
}

const i2c = (k: number): Rgb => (k % 2 ? ROOT : FLESH);
