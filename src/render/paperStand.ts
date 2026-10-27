/**
 * A note's burning paper standing in the world (round 89): the leaf and the scraps that turn about it, one mesh of one dynamic
 * geometry whose vertices render/paperFlow.ts moves and colours every frame (a couple of hundred vertices: nothing), and the one
 * material that lights it from within (a burning leaf is its own light) and draws both its faces. One draw.
 */

import * as THREE from 'three';
import { PAPER } from '../data/paperTuning';
import type { GameAudio } from './audio/gameAudio';
import type { Flames } from './flames';
import type { Halos } from './halos';
import type { Particles } from './particles';
import { bend, gaze, poses, tint, type Burn } from './paperFlow';
import { makeSheet, type Sheet } from './paperKit';
import { createWorldMaterial } from './worldMaterial';

/** What a note's picture draws with: the sound and the particles, the glow and the pixel flames, the ground. */
export interface PaperFx {
  audio: GameAudio;
  particles: Particles;
}

export interface PaperCtx {
  scene: THREE.Scene;
  fx: PaperFx;
  halos: Halos;
  flames: Flames;
  ground(x: number, z: number): number;
}

export interface Leaf {
  readonly root: THREE.Group;
  readonly mesh: THREE.Mesh;
  readonly geo: THREE.BufferGeometry;
  readonly mat: THREE.ShaderMaterial;
  readonly sheets: readonly Sheet[];
  readonly offsets: readonly number[];
  readonly pos: Float32Array;
  readonly col: Float32Array;
  /** Where its flames stand: a vertex of the rim of a sheet, the beat it burns at, which way it is turned and what it burns as. */
  readonly sites: readonly Site[];
  readonly name: string;
  readonly phase: number;
  readonly yaw: number;
  look: number; // how far it has turned toward the investigator
  time: number; // the render time it last moved at
  fire: number; // how brightly it burns now, 0 to 1
  flames: number; // seconds until the next lick of flame, and the next spark
  sparks: number;
  taken: boolean; // it has been picked up: its page is read, and it hangs until the page is put away
}

export interface Site {
  sheet: number;
  v: number;
  phase: number;
  mirror: 1 | -1;
  hue: 'warm' | 'violet';
}

const hash = (name: string): number => {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return h >>> 0;
};

const made = new Map<number, Sheet[]>();

/** The sheets of a note's leaf and scraps, made once for the pattern its name draws. */
function sheetsOf(seed: number): Sheet[] {
  let s = made.get(seed);
  if (!s) {
    const [cols, rows] = PAPER.grid;
    made.set(seed, (s = [makeSheet(cols, rows, PAPER.size[0], PAPER.size[1], seed), ...Array.from({ length: PAPER.scraps }, (_, k) => makeSheet(6, 5, PAPER.scrap[0], PAPER.scrap[1], seed + 17 * (k + 1)))]));
  }
  return s;
}

/** The flames' places: about the leaf's rim, but not its lower edge (a flame there would stand before the paper); the nearly one in three that burns violet. */
function sitesOf(sheets: readonly Sheet[]): Site[] {
  const sites: Site[] = [];
  sheets.forEach((s, sheet) => {
    const high = s.rim.filter((v) => s.rest[v * 2 + 1] > -0.2 * s.h);
    const n = sheet === 0 ? 11 : 2;
    for (let k = 0; k < n; k++) {
      const v = high[Math.floor(((k + 0.37 * sheet) / n) * high.length) % high.length];
      sites.push({ sheet, v, phase: (k * 0.37 + sheet * 0.21) % 1, mirror: k % 2 ? 1 : -1, hue: k % 3 === 1 ? 'violet' : 'warm' });
    }
  });
  return sites;
}

/** Builds the leaf of the note `name` at the world position `at`; it turns to `yaw`. */
export function buildLeaf(name: string, at: { x: number; y: number; z: number }, yaw: number, phase: number): Leaf {
  const sheets = sheetsOf(hash(name) % 9973);
  const offsets: number[] = [];
  let total = 0;
  for (const s of sheets) {
    offsets.push(total);
    total += s.count;
  }
  const index: number[] = [];
  sheets.forEach((s, i) => s.index.forEach((v) => index.push(v + offsets[i])));
  const uv = new Float32Array(total * 2);
  sheets.forEach((s, i) => uv.set(s.uv, offsets[i] * 2));
  const geo = new THREE.BufferGeometry();
  const [pos, col] = [new Float32Array(total * 3), new Float32Array(total * 3)];
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(total * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, PAPER.hover, 0), 3.4); // (it never moves farther than this from its place; scraps blown off it in the burn go on rising)
  const mat = createWorldMaterial({ texture: 'cloth', emissive: 0.85, vertexColors: true, coat: false });
  mat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, mat);
  const root = new THREE.Group();
  root.position.set(at.x, at.y, at.z);
  root.add(mesh);
  root.userData.note = name;
  const leaf: Leaf = { root, mesh, geo, mat, sheets, offsets, pos, col, sites: sitesOf(sheets), name, phase, yaw, look: 0, time: 0, fire: 0.7, flames: 0.5, sparks: 0.3, taken: false };
  place(leaf, 0, leaf.look);
  return leaf;
}

/** Moves the leaf to `time` with its bend and its colours; `look` is its turn toward the investigator, `burn` the seconds into the burn (-1: it is not burning away) and `heat` the burn's front. */
export function place(leaf: Leaf, time: number, look: number, burn = -1, heat?: Burn): void {
  const ps = poses(time, leaf.phase, leaf.yaw + look, burn);
  leaf.sheets.forEach((s, i) => {
    bend(s, ps[i], time, leaf.pos, leaf.offsets[i]);
    tint(s, time, leaf.phase + i * 1.9, leaf.col, leaf.offsets[i], heat);
  });
  leaf.geo.attributes.position.needsUpdate = true;
  leaf.geo.attributes.color.needsUpdate = true;
  leaf.geo.computeVertexNormals();
  leaf.time = time;
}

const angleDiff = (a: number, b: number): number => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Moves a standing leaf to `t`; `eye` is where the investigator is (x, z). */
export function animate(leaf: Leaf, t: number, dt: number, eye: { x: number; z: number }): number {
  const near = Math.hypot(eye.x - leaf.root.position.x, eye.z - leaf.root.position.z);
  const want = near < PAPER.gazeReach ? angleDiff(Math.atan2(eye.x - leaf.root.position.x, eye.z - leaf.root.position.z), leaf.yaw) : 0;
  leaf.look = gaze(leaf.look, want, dt);
  place(leaf, t, leaf.look);
  leaf.fire = 0.72 + 0.22 * Math.sin(t * 1.9 + leaf.phase) + 0.06 * Math.sin(t * 13 + leaf.phase * 3);
  return near;
}

/** A vertex of the leaf, its rim's or any, in the world. */
export function worldAt(leaf: Leaf, sheet: number, v: number, into: { x: number; y: number; z: number }): void {
  const o = (leaf.offsets[sheet] + v) * 3;
  into.x = leaf.root.position.x + leaf.pos[o];
  into.y = leaf.root.position.y + leaf.pos[o + 1];
  into.z = leaf.root.position.z + leaf.pos[o + 2];
}

/** Stands the leaf's flames on its rim in the batch, `gain` bright: each breathes at its own beat, and burns taller on the leaf than on a scrap. */
export function flames(batch: Flames, leaf: Leaf, t: number, gain: number): void {
  const p = leaf.root.position;
  for (const s of leaf.sites) {
    const o = (leaf.offsets[s.sheet] + s.v) * 3;
    const flick = 0.8 + 0.2 * Math.sin(t * 7.3 + s.phase * 6.283 + leaf.phase);
    batch.put(p.x + leaf.pos[o], p.y + leaf.pos[o + 1] - 0.03, p.z + leaf.pos[o + 2], PAPER.flame[s.sheet === 0 ? 0 : 1] * flick, s.phase, s.mirror, s.hue, gain * (0.8 + 0.2 * leaf.fire));
  }
}

export function disposeLeaf(scene: THREE.Scene, leaf: Leaf): void {
  scene.remove(leaf.root);
  leaf.geo.dispose();
  leaf.mat.dispose();
}
