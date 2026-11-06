/**
 * What the gates' frames are built of (round 104, asked: "make all the frames of the portals in the game look way better and more
 * themed into the environment/region they are leading"): a few low-poly shapes, each tinted and filed under the texture it is drawn
 * with, merged into one geometry a texture. The opening is the veil's (portalViews.ts: 3.3 m wide, 3.8 m high, at z 0, faces +z);
 * a frame keeps out of it, `OPENING`. Pure but for the geometry it makes.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash2 } from '../core/rng';
import { box, tileUv, tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';
import type { TextureKind } from './textures';

/** The veil's opening a frame keeps clear: half its breadth and its height. */
export const OPENING = { half: 1.65, height: 3.8 } as const;

/** A frame's geometry by texture, and how much each glows of itself (a glyph, a fungus, an eye: 1; the stone: a little, so it reads in the dark). */
export interface FramePiece {
  texture: TextureKind;
  emissive: number;
  geo: THREE.BufferGeometry;
}

/** Collects a frame's shapes by texture and glow. */
export class Frame {
  private groups = new Map<string, { texture: TextureKind; emissive: number; geos: THREE.BufferGeometry[] }>();

  add(texture: TextureKind, geo: THREE.BufferGeometry | readonly THREE.BufferGeometry[], emissive = 0.1): this {
    const key = `${texture}:${emissive}`;
    const g = this.groups.get(key) ?? { texture, emissive, geos: [] };
    for (const one of Array.isArray(geo) ? geo : [geo]) g.geos.push(one.index ? one.toNonIndexed() : one);
    this.groups.set(key, g);
    return this;
  }

  /** The glowing parts (glyphs, eyes, fungus): drawn with the frame's own light. */
  glow(geo: THREE.BufferGeometry | readonly THREE.BufferGeometry[]): this {
    return this.add('stone', geo, 1);
  }

  pieces(): FramePiece[] {
    return [...this.groups.values()].map((g) => ({ texture: g.texture, emissive: g.emissive, geo: mergeGeometries(g.geos.map(clean)) }));
  }
}

/** The attributes every merged shape shares (position, normal, uv, colour). */
function clean(g: THREE.BufferGeometry): THREE.BufferGeometry {
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) g.deleteAttribute(name);
  if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
  return g;
}

/** A box centred at (x, y, z), its texture tiled by metres. */
export const block = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb): THREE.BufferGeometry => tileUv(box(w, h, d, x, y, z, c), Math.max(w, d), h);

/** A box from the ground `y0` to `y1`. */
export const post = (w: number, d: number, x: number, y0: number, y1: number, z: number, c: Rgb): THREE.BufferGeometry => block(w, y1 - y0, d, x, (y0 + y1) / 2, z, c);

/** An upright cylinder (or a cone, `r1` 0) from `y0` to `y1`. */
export const column = (r0: number, r1: number, x: number, y0: number, y1: number, z: number, c: Rgb, sides = 8): THREE.BufferGeometry =>
  tileUv(tint(new THREE.CylinderGeometry(r1, r0, y1 - y0, sides).translate(x, (y0 + y1) / 2, z), c), Math.PI * (r0 + r1), y1 - y0);

/** A low-poly ball. */
export const ball = (r: number, x: number, y: number, z: number, c: Rgb, detail = 0): THREE.BufferGeometry => tint(new THREE.IcosahedronGeometry(r, detail).translate(x, y, z), c);

/** A ring (or an arc of one, `arc` radians from +x anticlockwise) in the plane of the opening, centred at (x, y, z). */
export const ring = (radius: number, tube: number, x: number, y: number, z: number, c: Rgb, arc = Math.PI * 2, start = 0, segments = 16): THREE.BufferGeometry =>
  tileUv(tint(new THREE.TorusGeometry(radius, tube, 5, segments, arc).rotateZ(start).translate(x, y, z), c), radius * arc, tube * 4);

/** A shape from (x0, y0) to (x1, y1) in the opening's plane, `w` thick and `d` deep: a strut, a branch, a bolt's stroke. */
export function strut(x0: number, y0: number, x1: number, y1: number, w: number, d: number, z: number, c: Rgb): THREE.BufferGeometry {
  const len = Math.hypot(x1 - x0, y1 - y0);
  return tileUv(box(w, len, d, 0, 0, 0, c), w, len).rotateZ(-Math.atan2(x1 - x0, y1 - y0)).translate((x0 + x1) / 2, (y0 + y1) / 2, z);
}

/** A spike from `base` toward `tip` (both [x, y, z]), `r` wide at its foot. */
export function spike(base: readonly [number, number, number], tip: readonly [number, number, number], r: number, c: Rgb, sides = 5): THREE.BufferGeometry {
  const dir = new THREE.Vector3(tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]);
  const len = dir.length();
  const g = new THREE.ConeGeometry(r, len, sides).translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  return tint(g.translate(...base), c);
}

/** Nudges every point of a geometry by a little noise of its position: weathered stone, gnarled bark. */
export function rough(g: THREE.BufferGeometry, amount: number, seed: number): THREE.BufferGeometry {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
    const n = (k: number): number => (hash2(Math.round(x * 5) + k * 31, Math.round(y * 5) + Math.round(z * 5) * 17, seed) - 0.5) * amount;
    p.setXYZ(i, x + n(1), y + n(2), z + n(3));
  }
  g.computeVertexNormals();
  return g;
}

/** Turns a geometry about the opening's middle line (z) by `deg`, at (x, y). */
export const lean = (g: THREE.BufferGeometry, deg: number, x: number, y: number): THREE.BufferGeometry => g.translate(-x, -y, 0).rotateZ((deg * Math.PI) / 180).translate(x, y, 0);

/** Both sides of the opening: `make(1)` and `make(-1)`, for a frame built as a mirror of itself. */
export const both = (make: (s: 1 | -1) => THREE.BufferGeometry[]): THREE.BufferGeometry[] => [...make(1), ...make(-1)];

/** A colour a little lighter or darker. */
export const shade = scaleRgb;

/** A flat fan (a disc, or a sector of one from `start`, `arc` radians) in the opening's plane, seen from both faces: an arch's tympanum. */
export function fan(r: number, x: number, y: number, z: number, c: Rgb, start = 0, arc = Math.PI): THREE.BufferGeometry {
  const front = new THREE.CircleGeometry(r, 12, start, arc).translate(x, y, z + 0.01);
  const back = new THREE.CircleGeometry(r, 12, start, arc).rotateY(Math.PI).translate(x, y, z - 0.01);
  return tileUv(tint(mergeGeometries([front, back]), c), r * 2, r);
}

/** A column twisted about its axis: square blocks stacked, each turned a little more than the last (a horn, a twisted pillar). */
export function twisted(w: number, x: number, y0: number, y1: number, z: number, c: Rgb, turn = 14, taper = 0): THREE.BufferGeometry[] {
  const n = Math.max(2, Math.round((y1 - y0) / 0.28));
  const h = (y1 - y0) / n;
  return Array.from({ length: n }, (_, k) => {
    const s = w * (1 - (taper * k) / n);
    return block(s, h * 1.04, s, 0, 0, 0, c).rotateY((k * turn * Math.PI) / 180).translate(x, y0 + h * (k + 0.5), z);
  });
}

/** A ball squashed or drawn out by (sx, sy, sz) about its own middle, at (x, y, z). */
export const blob = (r: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, c: Rgb, detail = 0): THREE.BufferGeometry =>
  tint(new THREE.IcosahedronGeometry(r, detail).scale(sx, sy, sz).translate(x, y, z), c);

/** A flat shape (points in the opening's plane) drawn out `depth` through it, centred on z. */
export function slab(points: readonly (readonly [number, number])[], depth: number, c: Rgb): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y))), { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
  return tileUv(tint(g, c), 2, 2);
}
