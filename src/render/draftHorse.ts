/** One carriage horse, sourced from Kenney's CC0 animal-horse and retinted.
 * Its walk and run are the file's node curves, not a skin. The chariot around it is not this asset.
 */
import * as THREE from 'three';
import { MOUNT_TRAVERSAL } from '../data/mounts';
import { DRAFT_HORSE_JSON } from './draftHorseData';
import { tint } from './meshKit';
import { MountBuilder, group, type Point } from './mountKit';

/** Fits the spectral shafts: hooves on the ground, withers about a horse's height, head toward +z. */
export const DRAFT_PLACE = { x: 0, z: 2.7, scale: 2.7 } as const;

interface HorseNode { name: string; parent: number; t: number[]; pos?: number[]; nrm?: number[]; idx?: number[] }
interface Channel { node: string; path: string; times: number[]; values: number[] }
interface Clip { duration: number; channels: Channel[] }
interface Pack { nodes: HorseNode[]; clips: { walk: Clip; run: Clip } }

const PACK = JSON.parse(DRAFT_HORSE_JSON) as Pack;
const BAY: Point = [0.42, 0.26, 0.15];
const LEG: Point = [0.22, 0.14, 0.09];
const DARK: Point = [0.1, 0.07, 0.05];
const coat = (name: string): Point => (name.startsWith('leg') ? LEG : name === 'tail' ? DARK : BAY);

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
      const mesh = new THREE.Mesh(tint(geo, coat(node.name)), b.material('flesh', 0.04));
      part.add(mesh);
    }
    parts.set(node.name, part);
  }
  const bit = group(parts.get('head')!, -0.2, 0.02, 0);
  bit.name = 'draft-bit';
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
