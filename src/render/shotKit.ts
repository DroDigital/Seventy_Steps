/**
 * The pieces a bolt's body is built from (round 69; render/shotShapes*.ts). A body is a few low-poly parts in a frame where it
 * flies toward +z and is about two units long; each part carries a tone (`aTone`: the caster's light, its white-hot heart, its dark,
 * its pale) and may move in the vertex shader (`aMove`: a snake's sway, a breathing blob, a flapping leaf). Flat-shaded, so every
 * face is one colour as in the rest of the game. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** How a part is painted. */
export const BODY = 0; // the caster's light
export const HOT = 1; // its heart: nearly white, never shaded
export const DARK = 2; // the ink of it
export const PALE = 3; // bone, glass, silk: the light lifted toward white

/** How a part moves (shader). */
export const STILL = 0;
export const SNAKE = 1; // sways sideways along its length, the tail more than the head
export const BREATHE = 2; // swells and shrinks, each part out of step
export const FLAP = 3; // rises and falls along its width

type V3 = readonly [number, number, number];

export interface PartOpts {
  at?: V3;
  rot?: V3; // Euler, radians
  aim?: V3; // turns the part's z axis along this direction instead
  sc?: V3;
  move?: number;
}

/** How much of a part's move each vertex takes, by where it lies in the body (after the part is placed). */
const weight = (move: number, p: THREE.Vector3): number => {
  if (move === SNAKE) return Math.min(1, Math.max(0, 0.5 - p.z * 0.45));
  if (move === FLAP) return Math.min(1, Math.abs(p.x) * 1.2);
  return move === BREATHE ? 1 : 0;
};

/** `geo` placed, flat-shaded and painted `tone`. */
export function part(geo: THREE.BufferGeometry, tone: number, o: PartOpts = {}): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.deleteAttribute('uv');
  const [at, rot, sc] = [o.at ?? [0, 0, 0], o.rot ?? [0, 0, 0], o.sc ?? [1, 1, 1]];
  const turn = o.aim ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...o.aim).normalize()) : new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at), turn, new THREE.Vector3(...sc)));
  g.computeVertexNormals();
  const pos = g.getAttribute('position');
  const [tones, moves, p] = [new Float32Array(pos.count).fill(tone), new Float32Array(pos.count * 2), new THREE.Vector3()];
  const move = o.move ?? STILL;
  for (let i = 0; i < pos.count; i++) moves.set([weight(move, p.fromBufferAttribute(pos, i)), move], i * 2);
  g.setAttribute('aTone', new THREE.BufferAttribute(tones, 1));
  g.setAttribute('aMove', new THREE.BufferAttribute(moves, 2));
  return g;
}

/** The parts as one body. */
export const solid = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts)!;

export const ball = (r: number, tone: number, at: V3 = [0, 0, 0], sc: V3 = [1, 1, 1], move = STILL): THREE.BufferGeometry => part(new THREE.SphereGeometry(r, r < 0.3 ? 5 : 7, r < 0.3 ? 3 : 5), tone, { at, sc, move });
/** A rod along z centred on `at`: `r0` at its back, `r1` at its front. */
export const rod = (r0: number, r1: number, len: number, tone: number, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], move = STILL, sides = 6): THREE.BufferGeometry =>
  part(new THREE.CylinderGeometry(r1, r0, len, sides).rotateX(Math.PI / 2), tone, { at, rot, move });
/** A rod from `a` to `b`, `r0` thick at `a` and `r1` at `b`. */
export function limb(a: V3, b: V3, r0: number, r1: number, tone: number, move = STILL): THREE.BufferGeometry {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d);
  return part(new THREE.CylinderGeometry(r1, r0, len, 5).rotateX(Math.PI / 2), tone, { at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], aim: d, move });
}
export const slab = (w: number, h: number, d: number, tone: number, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], move = STILL): THREE.BufferGeometry => part(new THREE.BoxGeometry(w, h, d), tone, { at, rot, move });
/** A ring in the xy plane (its axis along z). */
export const ring = (big: number, small: number, tone: number, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], sc: V3 = [1, 1, 1], sides = 8): THREE.BufferGeometry =>
  part(new THREE.TorusGeometry(big, small, 4, sides), tone, { at, rot, sc });
export const gem = (r: number, tone: number, at: V3 = [0, 0, 0], sc: V3 = [1, 1, 1], rot: V3 = [0, 0, 0]): THREE.BufferGeometry => part(new THREE.OctahedronGeometry(r, 0), tone, { at, sc, rot });

/** A rough stone: an icosahedron whose points are moved by a hash of `seed`. */
export function rock(r: number, tone: number, at: V3 = [0, 0, 0], sc: V3 = [1, 1, 1], seed = 1, rough = 0.28): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const pos = g.getAttribute('position');
  const jig = new Map<string, number>(); // (a point shared by faces is moved once, or the stone splits)
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = jig.get(key);
    if (k === undefined) {
      const h = Math.sin(pos.getX(i) * 78.233 + pos.getY(i) * 37.719 + pos.getZ(i) * 4.581 + seed * 13.1) * 43758.5453;
      jig.set(key, (k = 1 + rough * (h - Math.floor(h) - 0.5)));
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  return part(g, tone, { at, sc });
}

/** A flat shape pushed out `depth` in z, centred on it. */
export function plate(shape: THREE.Shape, depth: number, tone: number, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], sc: V3 = [1, 1, 1]): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  g.translate(0, 0, -depth / 2);
  return part(g, tone, { at, rot, sc });
}

/** A circle of `n` parts about the z axis at `radius`, each made by `make(angle, i)`. */
export const around = (n: number, make: (a: number, i: number) => THREE.BufferGeometry): THREE.BufferGeometry[] => Array.from({ length: n }, (_, i) => make((i / n) * Math.PI * 2, i));
