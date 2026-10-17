/** One carriage horse, Kenney's CC0 animal-horse, dressed so the block reads as a bay.
 * Walk and run are the file's node curves, not a skin. The chariot around it is not this asset.
 */
import * as THREE from 'three';
import { hash2 } from '../core/rng';
import { MOUNT_TRAVERSAL } from '../data/mounts';
import { DRAFT_HORSE_JSON } from './draftHorseData';
import { tint } from './meshKit';
import { MountBuilder, group, type Point } from './mountKit';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Fits the spectral shafts: hooves on the ground, withers about a horse's height, head toward +z. */
export const DRAFT_PLACE = { x: 0, z: 2.7, scale: 2.7 } as const;

interface HorseNode { name: string; parent: number; t: number[]; pos?: number[]; nrm?: number[]; idx?: number[] }
interface Channel { node: string; path: string; times: number[]; values: number[] }
interface Clip { duration: number; channels: Channel[] }
interface Pack { nodes: HorseNode[]; clips: { walk: Clip; run: Clip } }

const PACK = JSON.parse(DRAFT_HORSE_JSON) as Pack;
const BAY: Point = [0.3, 0.15, 0.07];
const POINT: Point = [0.07, 0.045, 0.03];
const MUZZLE: Point = [0.5, 0.36, 0.26];
const MANE: Point = [0.05, 0.035, 0.025];
const BELLY: Point = [0.05, 0.028, 0.016];
const BLAZE: Point = [0.58, 0.46, 0.34];

const clamp = (t: number): number => Math.min(1, Math.max(0, t));
const mix = (a: Point, b: Point, t: number): Point => {
  const u = clamp(t);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};

/** A dark bay: black points, a dull muzzle and blaze, a black mane. Broad steps, so the palette keeps them. */
function coatOf(name: string, x: number, y: number, z: number): Point {
  if (name.startsWith('leg')) return mix(BAY, POINT, (0.02 - y) / 0.28);
  if (name === 'tail') return MANE;
  if (name === 'neck') return mix(BAY, MANE, (y - 0.08) / 0.26);
  if (name === 'head') {
    let c = mix(BAY, MUZZLE, (-x - 0.06) / 0.2);
    c = mix(c, MANE, (y - 0.2) / 0.07);
    if (Math.abs(z) < 0.05 && y > 0.14 && x > -0.12) c = mix(c, BLAZE, 0.7);
    return c;
  }
  if (name === 'torso') return mix(BAY, BELLY, (0.11 - y) / 0.11);
  return BAY;
}

/** The file splits each corner, so a face's normal paints a panel. Average them and the coat is one hide. */
function soften(geo: THREE.BufferGeometry): void {
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  const acc = new Map<string, Point>();
  const key = (i: number): string => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const a = acc.get(k) ?? [0, 0, 0];
    acc.set(k, [a[0] + nrm.getX(i), a[1] + nrm.getY(i), a[2] + nrm.getZ(i)]);
  }
  for (let i = 0; i < pos.count; i++) {
    const a = acc.get(key(i))!;
    const len = Math.hypot(a[0], a[1], a[2]) || 1;
    nrm.setXYZ(i, a[0] / len, a[1] / len, a[2] / len);
  }
}

/** Two dark eyes and a catch of light, one mesh, on the head so the walk carries them. */
function horseEyes(): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    pieces.push(tint(new THREE.SphereGeometry(0.028, 6, 4).translate(-0.08, 0.175, side * 0.112), [0.015, 0.012, 0.01]));
    pieces.push(tint(new THREE.SphereGeometry(0.009, 4, 3).translate(-0.098, 0.188, side * 0.13), [0.72, 0.64, 0.46]));
  }
  const geo = mergeGeometries(pieces)!;
  for (const piece of pieces) piece.dispose();
  return geo;
}

/** Vertex colour and hair UVs. The hide grain is one value; the bay lives here. */
function dress(geo: THREE.BufferGeometry, name: string): void {
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  const uvs = geo.getAttribute('uv');
  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ny = Math.max(-1, Math.min(1, nrm.getY(i)));
    const c = coatOf(name, x, y, z);
    const k = (0.84 + 0.14 * (ny * 0.5 + 0.5)) * (0.97 + 0.03 * hash2(Math.floor((x + z) * 18), Math.floor(y * 22), 7));
    cols[i * 3] = c[0] * k;
    cols[i * 3 + 1] = c[1] * k;
    cols[i * 3 + 2] = c[2] * k;
    const along = name.startsWith('leg') || name === 'neck' || name === 'tail' ? y : x;
    uvs.setXY(i, along * 3 + z, (name.startsWith('leg') ? z : y) * 8 + x);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}

export interface DraftHorse {
  root: THREE.Group;
  bit: THREE.Object3D;
  update(time: number, phase: number, speed: number, turn: number, ground?: (x: number, z: number) => number): void;
}

const scratchA = new THREE.Quaternion();
const scratchB = new THREE.Quaternion();
const clipA = new THREE.Quaternion();
const clipB = new THREE.Quaternion();
const blended = new THREE.Quaternion();
const restQ = new THREE.Quaternion();
const posA = new THREE.Vector3();
const posB = new THREE.Vector3();

function sampleQuat(ch: Channel, t: number, out: THREE.Quaternion): void {
  const { times, values } = ch;
  const last = times.length - 1;
  const at = (i: number, q: THREE.Quaternion) => q.set(values[i * 4], values[i * 4 + 1], values[i * 4 + 2], values[i * 4 + 3]);
  if (t <= times[0]) return void at(0, out);
  if (t >= times[last]) return void at(last, out);
  let i = 0;
  while (times[i + 1] < t) i++;
  const f = (t - times[i]) / (times[i + 1] - times[i] || 1);
  at(i, scratchA); at(i + 1, scratchB); out.copy(scratchA).slerp(scratchB, f);
}

function samplePos(ch: Channel, t: number, out: THREE.Vector3): void {
  const { times, values } = ch;
  const last = times.length - 1;
  if (t <= times[0]) return void out.set(values[0], values[1], values[2]);
  if (t >= times[last]) return void out.set(values[last * 3], values[last * 3 + 1], values[last * 3 + 2]);
  let i = 0;
  while (times[i + 1] < t) i++;
  const f = (t - times[i]) / (times[i + 1] - times[i] || 1);
  out.set(
    values[i * 3] * (1 - f) + values[(i + 1) * 3] * f,
    values[i * 3 + 1] * (1 - f) + values[(i + 1) * 3 + 1] * f,
    values[i * 3 + 2] * (1 - f) + values[(i + 1) * 3 + 2] * f,
  );
}

export function draftHorse(b: MountBuilder, parent: THREE.Object3D, x: number, z: number): DraftHorse {
  const root = group(parent, x, 0, z);
  root.name = 'draft-horse';
  const lean = group(root);
  const facing = group(lean);
  facing.rotation.y = Math.PI / 2;
  facing.scale.setScalar(DRAFT_PLACE.scale);
  const hide = b.material('hide');
  // A wide repeat of the mottle quantizes into stripes. One soft patch across the body does not.
  (hide.uniforms.uUvScale.value as THREE.Vector2).set(0.05, 0.05);
  const parts = new Map<string, THREE.Object3D>();
  for (const node of PACK.nodes) {
    const where = node.parent < 0 ? facing : parts.get(PACK.nodes[node.parent].name)!;
    const part = group(where, node.t[0], node.t[1], node.t[2]);
    part.name = node.name;
    if (node.pos && node.nrm && node.idx) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(node.pos), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(node.nrm), 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(node.pos.length / 3 * 2), 2));
      geo.setIndex(node.idx);
      soften(geo);
      dress(geo, node.name);
      const mesh = new THREE.Mesh(geo, hide);
      if (node.name === 'torso') mesh.name = 'draft-body';
      part.add(mesh);
    }
    parts.set(node.name, part);
  }
  const head = parts.get('head')!;
  const bit = group(head, -0.2, 0.02, 0);
  bit.name = 'draft-bit';
  const eyes = new THREE.Mesh(horseEyes(), b.material('hide', 0.5));
  eyes.name = 'draft-eyes';
  head.add(eyes);
  const byClip = (clip: Clip) => new Map(clip.channels.map((ch) => [`${ch.node}:${ch.path}`, ch]));
  const walk = byClip(PACK.clips.walk);
  const run = byClip(PACK.clips.run);
  const span = MOUNT_TRAVERSAL.gallop - MOUNT_TRAVERSAL.cruise;
  return { root, bit, update(time, phase, speed, turn, ground) {
    const moving = Math.min(1, Math.max(0, speed) / 1.5);
    const gallop = Math.min(1, Math.max(0, (speed - MOUNT_TRAVERSAL.cruise) / span));
    const u = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
    const walkT = u * PACK.clips.walk.duration;
    const runT = u * PACK.clips.run.duration;
    root.position.y = ground?.(x, z) ?? 0;
    lean.rotation.y = -turn * 0.12;
    lean.rotation.z = -turn * 0.04;
    for (const node of PACK.nodes) {
      const obj = parts.get(node.name)!;
      const spinW = walk.get(`${node.name}:rotation`);
      const spinR = run.get(`${node.name}:rotation`);
      if (spinW && spinR) {
        sampleQuat(spinW, walkT, clipA);
        sampleQuat(spinR, runT, clipB);
        blended.copy(clipA).slerp(clipB, gallop);
        obj.quaternion.copy(restQ).slerp(blended, moving);
        if (node.name === 'neck') obj.rotateY(Math.sin(time * 0.6) * 0.05 * (1 - moving));
      }
      const moveW = walk.get(`${node.name}:translation`);
      const moveR = run.get(`${node.name}:translation`);
      if (moveW && moveR) {
        samplePos(moveW, walkT, posA);
        samplePos(moveR, runT, posB);
        posA.lerp(posB, gallop);
        obj.position.set(
          node.t[0] + (posA.x - node.t[0]) * moving,
          node.t[1] + (posA.y - node.t[1]) * moving,
          node.t[2] + (posA.z - node.t[2]) * moving,
        );
      }
    }
  } };
}
