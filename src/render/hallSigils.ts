/**
 * A boss hall's sigil laid in its floor (round 108; data/hallLore.ts gives each its figure): rings, polygons, stars, rays, spirals,
 * lines, dots, arcs, flecks and tracks, in the hall's frame (degrees clockwise from the far wall, metres from the middle), each layer
 * in its own ink: the floor's stone darker or paler, chalk, soot, blood, tar, iron (drawn in the floor's texture), gilt or carpet
 * (cloth), or the hall's own light. Flat faces facing up, 5 cm over the floor, drawn nearer than it (relief); long strokes are cut
 * into pieces of two metres, so that the lamps' light crosses them as it does the floor. Render only.
 */

import * as THREE from 'three';
import { createRng } from '../core/rng';
import type { Ink, Layer, Shape } from '../data/hallLore';
import { roomPoint, type RoomLayout } from '../world/dungeonKit';
import { scaleRgb, type Rgb } from './palette';

type P = readonly [u: number, v: number];
export type SigilKind = 'carve' | 'cloth' | 'shine';
export type SigilPiece = { kind: SigilKind; geo: THREE.BufferGeometry };

const INK: Record<Exclude<Ink, 'dark' | 'pale' | 'glow'>, Rgb> = {
  chalk: [0.88, 0.86, 0.8], soot: [0.1, 0.09, 0.09], blood: [0.36, 0.07, 0.06], gilt: [0.72, 0.56, 0.24], iron: [0.22, 0.22, 0.25], rug: [0.5, 0.13, 0.15], tar: [0.04, 0.05, 0.05],
};
const SEG = 2; // metres a stroke is cut into
const CARPET = 2.4; // half the breadth of the way in (the carpet laid to the sigil's rim), where no fleck is put

/** A point `r` metres out at `a` degrees clockwise from the far wall. */
const polar = (r: number, a: number): P => [r * Math.sin((a * Math.PI) / 180), r * Math.cos((a * Math.PI) / 180)];

/** Triangles in a room's frame, laid flat at one height. */
class Tris {
  readonly pos: number[] = [];
  constructor(private r: RoomLayout, private y: number) {}
  tri(a: P, b: P, c: P): void {
    const [pa, pb, pc] = [a, b, c].map((p) => roomPoint(this.r, p[0], p[1]));
    const up = (pb.z - pa.z) * (pc.x - pa.x) - (pb.x - pa.x) * (pc.z - pa.z); // the y of (b - a) × (c - a)
    const order = up >= 0 ? [pa, pb, pc] : [pa, pc, pb];
    for (const p of order) this.pos.push(p.x, this.y, p.z);
  }
  quad(a: P, b: P, c: P, d: P): void {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }
  /** A stroke from `a` to `b`, `w0` wide at `a` and `w1` at `b`, in pieces. */
  strip(a: P, b: P, w0: number, w1 = w0): void {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) return;
    const [nu, nv] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const n = Math.max(1, Math.ceil(len / SEG));
    for (let k = 0; k < n; k++) {
      const [t0, t1] = [k / n, (k + 1) / n];
      const at = (t: number, s: number): P => {
        const w = (w0 + (w1 - w0) * t) / 2;
        return [a[0] + (b[0] - a[0]) * t + nu * w * s, a[1] + (b[1] - a[1]) * t + nv * w * s];
      };
      this.quad(at(t0, -1), at(t1, -1), at(t1, 1), at(t0, 1));
    }
  }
  /** A ring's part from `a0` to `a1` degrees, `w` wide about radius `r`, about `c`. */
  arc(c: P, r: number, w: number, a0: number, a1: number): void {
    const n = Math.max(6, Math.ceil(((Math.abs(a1 - a0) * Math.PI) / 180) * r / SEG) * 2);
    for (let k = 0; k < n; k++) {
      const [b0, b1] = [a0 + ((a1 - a0) * k) / n, a0 + ((a1 - a0) * (k + 1)) / n];
      const at = (rr: number, a: number): P => { const p = polar(rr, a); return [c[0] + p[0], c[1] + p[1]]; };
      this.quad(at(r - w / 2, b0), at(r + w / 2, b0), at(r + w / 2, b1), at(r - w / 2, b1));
    }
  }
  /** A filled disc (or regular polygon of `sides`), turned `turn` degrees. */
  disc(c: P, r: number, sides = Math.max(10, Math.round(r * 8)), turn = 0): void {
    for (let k = 0; k < sides; k++) {
      const [p, q] = [polar(r, turn + (k * 360) / sides), polar(r, turn + ((k + 1) * 360) / sides)];
      this.tri(c, [c[0] + p[0], c[1] + p[1]], [c[0] + q[0], c[1] + q[1]]);
    }
  }
  geometry(c: Rgb): THREE.BufferGeometry | null {
    if (!this.pos.length) return null;
    const n = this.pos.length / 3;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(n).fill([0, 1, 0]).flat(), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n).fill(c).flat(), 3));
    return g;
  }
}

/** Whether a fleck at (u, v) would lie on the carpet of the way in. */
const onCarpet = ([u, v]: P, reach: number): boolean => Math.abs(u) < CARPET && v < -reach + 0.5;

function draw(t: Tris, s: Shape, reach: number): void {
  if ('ring' in s) return t.arc([0, 0], s.ring, s.w, 0, 360);
  if ('disc' in s) return t.disc(s.at ?? [0, 0], s.disc);
  if ('poly' in s) {
    const turn = s.turn ?? 0;
    if (s.fill) return t.disc([0, 0], s.r, s.poly, turn);
    for (let k = 0; k < s.poly; k++) t.strip(polar(s.r, turn + (k * 360) / s.poly), polar(s.r, turn + ((k + 1) * 360) / s.poly), s.w);
    return;
  }
  if ('star' in s) {
    for (let k = 0; k < s.star; k++) t.strip(polar(s.r, (s.turn ?? 0) + (k * 360) / s.star), polar(s.r, (s.turn ?? 0) + (((k + s.step) % s.star) * 360) / s.star), s.w);
    return;
  }
  if ('rays' in s) {
    const [a0, a1] = s.arc ?? [0, 360];
    const full = !s.arc;
    for (let k = 0; k < s.rays; k++) {
      const a = (s.turn ?? 0) + a0 + ((a1 - a0) * (full ? k : k + 0.5)) / s.rays;
      t.strip(polar(s.from, a), polar(s.to, a), s.w, s.taper ? s.w * 0.2 : s.w);
    }
    return;
  }
  if ('spiral' in s) {
    const n = Math.ceil(s.turns * 24);
    for (let arm = 0; arm < s.spiral; arm++) {
      const at = (k: number): P => polar(s.from + ((s.to - s.from) * k) / n, (arm * 360) / s.spiral + (k / n) * s.turns * 360);
      for (let k = 0; k < n; k++) t.strip(at(k), at(k + 1), s.w * (1 - (0.6 * k) / n), s.w * (1 - (0.6 * (k + 1)) / n));
    }
    return;
  }
  if ('line' in s) return t.strip([s.line[0], s.line[1]], [s.line[2], s.line[3]], s.w);
  if ('dots' in s) {
    const [a0, a1] = s.arc ?? [0, 360];
    const full = !s.arc;
    for (let k = 0; k < s.dots; k++) {
      const p = polar(s.r, (s.turn ?? 0) + a0 + ((a1 - a0) * k) / (full ? s.dots : Math.max(1, s.dots - 1)));
      if (!onCarpet(p, reach)) t.disc(p, s.size, 8);
    }
    return;
  }
  if ('arc' in s) return t.arc([0, 0], s.arc, s.w, s.from, s.to);
  if ('scatter' in s) {
    const rng = createRng(s.seed * 7919 + 13);
    for (let k = 0; k < s.scatter; k++) {
      const p = polar(s.from + (s.to - s.from) * Math.sqrt(rng()), rng() * 360);
      const [a, l] = [rng() * 180, s.size * (0.5 + rng())];
      if (onCarpet(p, reach)) continue;
      const d = polar(l / 2, a);
      t.strip([p[0] - d[0], p[1] - d[1]], [p[0] + d[0], p[1] + d[1]], s.size * (0.4 + 0.4 * rng()));
    }
    return;
  }
  if ('track' in s) { // prints, alternating either side of the line they cross on
    const [u0, v0, u1, v1] = s.track;
    const len = Math.hypot(u1 - u0, v1 - v0);
    const [nu, nv] = [-(v1 - v0) / len, (u1 - u0) / len];
    for (let k = 0; k < s.n; k++) {
      const f = (k + 0.5) / s.n;
      const side = k % 2 ? 1 : -1;
      const p: P = [u0 + (u1 - u0) * f + nu * side * s.size * 1.1, v0 + (v1 - v0) * f + nv * side * s.size * 1.1];
      if (!onCarpet(p, reach)) t.disc(p, s.size, 9, k * 13);
    }
  }
}

/** The pieces of a hall's sigil: each layer a little over the one before (they are laid so that only one ink lies over a place). */
export function sigilPieces(r: RoomLayout, layers: readonly Layer[], reach: number, floor: Rgb, glow: Rgb): SigilPiece[] {
  const out: SigilPiece[] = [];
  layers.forEach((layer, i) => {
    const t = new Tris(r, r.level + 0.05 + 0.006 * i);
    for (const s of layer.shapes) draw(t, s, reach);
    const ink = layer.ink;
    const colour: Rgb = layer.colour ?? (ink === 'glow' ? glow : ink === 'dark' ? scaleRgb(floor, 0.45) : ink === 'pale' ? scaleRgb(floor, 1.3) : INK[ink]);
    const geo = t.geometry(colour);
    if (geo) out.push({ kind: ink === 'glow' ? 'shine' : ink === 'gilt' || ink === 'rug' ? 'cloth' : 'carve', geo });
  });
  return out;
}
