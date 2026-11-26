/**
 * What the ground's cover is built into (render/groundCover.ts, understory.ts, coverPieces.ts, baseCover.ts, nearGrass.ts): corners
 * gathered into one geometry, lit as the ground is (their normals face up), each with its lean in the wind (aSway: metres at a gust's
 * height, nothing at a blade's foot) and, round 125, its own wind (aWind: render/windKit.ts) and a place in the leaf atlas
 * (render/textureFoliage.ts): a blade or a lump is in its all-covered cell, a card shows a spray, a clump of grass, a frond. A builder
 * for what grows draws each triangle once (its material, `foliage`, is drawn from both sides); one for stones draws both windings.
 */

import * as THREE from 'three';
import { cellUv, type FoliageCell } from './textureFoliage';
import { windAttribute, windBytes } from './windKit';

type Rgb = readonly [number, number, number];
type V = readonly number[]; // (a point: x, y, z)

export const shade = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];
export const GAIN = 1.8; // textures average about half brightness: vertex colours are raised to show their own

const fract = (v: number): number => v - Math.floor(v);
/** A scatter in [0, 1) from where a point is (a blade's own phase in the wind). */
const hashAt = (x: number, z: number): number => fract(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);

export class Builder {
  /** `swaying`: a geometry that is blown carries aSway and aWind; one that is not (stones) must not, or it will not merge with the props' (propMeshes.ts). `both`: draw each triangle's two windings (for a material that culls its back faces). */
  constructor(private readonly swaying = false, private readonly both = !swaying) {}
  pos: number[] = [];
  col: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  sway: number[] = [];
  wind: number[] = [];
  index: number[] = [];

  private corner(p: V, col: Rgb, s: number, uv?: readonly [number, number], flutter = 0, phase = 0, n: V = [0, 1, 0]): number {
    this.sway.push(s);
    this.pos.push(p[0], p[1], p[2]);
    this.col.push(col[0], col[1], col[2]);
    this.nor.push(n[0], n[1], n[2]); // lit as the ground is
    if (uv) this.uv.push(uv[0], uv[1]);
    else this.uv.push(...cellUv('solid', fract(p[0] * 0.5), fract(p[1] * 0.5)));
    this.wind.push(...windBytes(phase, 0, flutter, phase * 1.7));
    return this.pos.length / 3 - 1;
  }

  /** A triangle seen from both sides; `sway`: how far each corner is blown (metres: the tip of a blade, nothing at its foot). */
  tri(a: V, b: V, c: V, ca: Rgb, cb: Rgb, cc: Rgb, sway: readonly [number, number, number] = [0, 0, 0]): void {
    const phase = hashAt(a[0], a[2]);
    const flutter = (s: number): number => Math.min(1, s * 4);
    const [i, j, k] = [this.corner(a, ca, sway[0], undefined, flutter(sway[0]), phase), this.corner(b, cb, sway[1], undefined, flutter(sway[1]), phase), this.corner(c, cc, sway[2], undefined, flutter(sway[2]), phase)];
    this.index.push(i, j, k);
    if (this.both) this.index.push(j, i, k);
  }

  /** Round 116: a triangle seen from its front only (wound counter-clockwise as seen), for the closed lumps of the undergrowth. */
  face(a: V, b: V, c: V, ca: Rgb, cb: Rgb, cc: Rgb, sway: readonly [number, number, number] = [0, 0, 0]): void {
    const phase = hashAt(a[0], a[2]);
    this.index.push(this.corner(a, ca, sway[0], undefined, 0, phase), this.corner(b, cb, sway[1], undefined, 0, phase), this.corner(c, cc, sway[2], undefined, 0, phase));
  }

  /**
   * Round 125: a card of the leaf atlas's `cell` from its foot (where it is held) along `up` to its head, `side` its half-width; its foot
   * coloured `low` and its head `high`; its head blown `sway` metres and fluttering by `flutter`; `n` its normal (up: lit as the ground is).
   */
  card(foot: V, up: V, side: V, cell: FoliageCell, low: Rgb, high: Rgb, sway: number, flutter: number, phase: number, n: V = [0, 1, 0], v0 = 0, v1 = 1): void {
    const at = (s: number, t: number): V => [foot[0] + side[0] * s + up[0] * t, foot[1] + side[1] * s + up[1] * t, foot[2] + side[2] * s + up[2] * t];
    const a = this.corner(at(-1, 0), low, 0, cellUv(cell, 0, v0), flutter * 0.25, phase, n);
    const b = this.corner(at(1, 0), low, 0, cellUv(cell, 1, v0), flutter * 0.25, phase, n);
    const c = this.corner(at(1, 1), high, sway, cellUv(cell, 1, v1), flutter, phase, n);
    const d = this.corner(at(-1, 1), high, sway, cellUv(cell, 0, v1), flutter, phase, n);
    this.index.push(a, b, c, a, c, d);
    if (this.both) this.index.push(b, a, c, c, a, d);
  }

  /** Round 125: a library plant's geometry (render/floraKit.ts) laid in at (x, y, z), its own UVs (a bark's become the atlas's solid cell). */
  merge(g: THREE.BufferGeometry, x: number, y: number, z: number, atlas: boolean): void {
    const [p, n, c, uv, s, w] = ['position', 'normal', 'color', 'uv', 'aSway', 'aWind'].map((k) => g.getAttribute(k));
    const base = this.pos.length / 3;
    for (let i = 0; i < p.count; i++) {
      this.pos.push(p.getX(i) + x, p.getY(i) + y, p.getZ(i) + z);
      this.nor.push(n.getX(i), n.getY(i), n.getZ(i));
      this.col.push(c.getX(i), c.getY(i), c.getZ(i));
      if (atlas) this.uv.push(uv.getX(i), uv.getY(i));
      else this.uv.push(...cellUv('solid', fract(uv.getX(i) * 0.25), fract(uv.getY(i) * 0.25)));
      this.sway.push(s ? s.getX(i) : 0);
      const wa = w?.array as Uint8Array | undefined;
      if (wa) this.wind.push(wa[i * 4], wa[i * 4 + 1], wa[i * 4 + 2], wa[i * 4 + 3]);
      else this.wind.push(0, 0, 0, 0);
    }
    const idx = g.getIndex()!;
    for (let i = 0; i < idx.count; i++) this.index.push(idx.getX(i) + base);
  }

  geometry(): THREE.BufferGeometry | null {
    if (!this.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setIndex(this.index);
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.swaying) {
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sway, 1));
      g.setAttribute('aWind', windAttribute(Uint8Array.from(this.wind)));
    }
    return g;
  }
}
