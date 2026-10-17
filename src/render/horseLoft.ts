/**
 * Soft forms for the carriage horse (round 50): a loft of ring sections along an axis, painted per vertex from its own
 * smooth normal, and the blobs that stand for a muscle. The picture is 400 x 225, so a form is a few rings of eight to ten
 * sides: enough for a barrel, a crest and a cannon bone to read as round, no more. Render only.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Rgb } from './palette';

/** A section at `z` along the axis: half-widths, and its centre's offset from the axis. */
export interface Station { z: number; rx: number; ry: number; cx?: number; cy?: number }
export interface Spot { x: number; y: number; z: number; nx: number; ny: number; nz: number }
export type Paint = (p: Spot) => Rgb;

/** A cross-section a little squarer than an ellipse: `pow` below 1 flattens the sides (a back, a cheek). */
const squared = (v: number, pow: number): number => Math.sign(v) * Math.abs(v) ** pow;

/** Ring sections joined by quads and capped at both ends, smooth-shaded, painted by `paint`. Axis +z; turn it with `.rotateX`. */
export function loft(stations: readonly Station[], sides: number, paint: Paint, pow = 0.85): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k < stations.length; k++) {
    const s = stations[k];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      pos.push((s.cx ?? 0) + s.rx * squared(Math.cos(a), pow), (s.cy ?? 0) + s.ry * squared(Math.sin(a), pow), s.z);
      uv.push(j / sides, k / (stations.length - 1));
    }
  }
  for (let k = 0; k + 1 < stations.length; k++) {
    for (let j = 0; j < sides; j++) {
      const [a, b, c, d] = [k * sides + j, k * sides + ((j + 1) % sides), (k + 1) * sides + j, (k + 1) * sides + ((j + 1) % sides)];
      idx.push(a, b, c, b, d, c);
    }
  }
  for (const [ring, flip] of [[0, true], [stations.length - 1, false]] as const) {
    const s = stations[ring];
    const centre = pos.length / 3;
    pos.push(s.cx ?? 0, s.cy ?? 0, s.z);
    uv.push(0.5, ring / (stations.length - 1));
    for (let j = 0; j < sides; j++) {
      const [a, b] = [ring * sides + j, ring * sides + ((j + 1) % sides)];
      idx.push(centre, flip ? b : a, flip ? a : b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return paintOf(geo, paint);
}

/** A squashed sphere: a muscle, a joint, an eye. */
export function blob(rx: number, ry: number, rz: number, x: number, y: number, z: number, paint: Paint, detail = 6): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, detail, Math.max(3, detail - 2)).scale(rx, ry, rz).translate(x, y, z);
  return paintOf(geo, paint);
}

/** Vertex colours from `paint`, read at each vertex with its smooth normal; the planar texture coordinates the hide's soft mottle wants. */
export function paintOf(geo: THREE.BufferGeometry, paint: Paint): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  const cols = new Float32Array(pos.count * 3);
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const c = paint({ x, y, z, nx: nrm.getX(i), ny: nrm.getY(i), nz: nrm.getZ(i) });
    cols[i * 3] = c[0];
    cols[i * 3 + 1] = c[1];
    cols[i * 3 + 2] = c[2];
    uv.setXY(i, z * 1.3 + x * 0.6, y * 1.1 + x * 0.4);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return geo;
}

/** One mesh's geometry from pieces, which are let go. */
export function join(pieces: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geo = mergeGeometries(pieces);
  if (!geo) throw new Error('horse parts do not share attributes');
  for (const p of pieces) p.dispose();
  return geo;
}

/** Light and shade a vertex takes from its normal and its height: the belly in shadow, the back catching the sky. */
export function lit(c: Rgb, ny: number, low = 0.78, high = 1.1): Rgb {
  const k = low + (high - low) * (ny * 0.5 + 0.5);
  return [c[0] * k, c[1] * k, c[2] * k];
}

export const mixC = (a: Rgb, b: Rgb, t: number): Rgb => {
  const u = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};
