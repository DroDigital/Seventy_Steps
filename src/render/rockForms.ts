/**
 * Round 111, the rocks by realm (data/propLooks.ts): the lichened boulder every realm had, a boulder split by frost, a cluster of
 * stones, a ledge of strata, upthrust shards, the basalt columns of R'lyeh and the Piping Dark, prisms of crystal or ice, a pitted
 * reef stone, the wind-carved hoodoo of Pnakotus, the stalagmites of K'n-yan, and the near-perfect globes of the Gate of Spheres.
 * Each keeps within its rock's radius `w` and height `h`, so its collider is as it was. What faces up carries the realm's top: lichen,
 * moss, snow, salt or ash.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { PropLook, RockForm } from '../data/propLooks';
import type { Prop } from '../world/props';
import { tileUv, tint } from './meshKit';
import { mixRgb, scaleRgb, type Rgb } from './palette';
import { join, lump, scatter, topCoat } from './propKit';
import type { Piece } from './propShapes';

/** A prism of `sides` sides from its foot, `r` wide and `h` tall, its top narrowed to `top` of `r`. */
const prism = (r: number, h: number, sides: number, c: Rgb, top = 1): THREE.BufferGeometry => tint(tileUv(new THREE.CylinderGeometry(r * top, r, h, sides).translate(0, h / 2, 0), r * sides * 0.6, h), c);

/** A tone of `c` drawn for one stone of several. */
const tone = (c: Rgb, rng: Rng, spread = 0.25): Rgb => scaleRgb(c, 1 - spread / 2 + spread * rng());

function split(p: Prop, rng: Rng, c: Rgb, look: PropLook): THREE.BufferGeometry {
  const gap = 0.06 + 0.06 * rng();
  const halves = [-1, 1].map((s) => {
    const g = lump(p.w * 0.92, p.h, rng, tone(c, rng, 0.15), look.top, look.topShare);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) pos.setX(i, s * Math.max(gap * p.w, s * pos.getX(i))); // each half cut flat where the frost opened it
    g.computeVertexNormals();
    return g;
  });
  return join(halves).rotateY(rng() * Math.PI);
}

function cluster(p: Prop, rng: Rng, c: Rgb, look: PropLook): THREE.BufferGeometry {
  const n = 3 + Math.floor(rng() * 3);
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const r = p.w * (k === 0 ? 0.6 : 0.25 + 0.2 * rng());
    const a = k * 2.4 + rng();
    const d = k === 0 ? 0 : p.w * (0.5 + 0.3 * rng());
    parts.push(lump(r, r * (0.6 + 0.4 * rng()), rng, tone(c, rng), look.top, look.topShare, { seg: 7, rows: 5 }).translate(Math.sin(a) * d, 0, Math.cos(a) * d));
  }
  return join(parts);
}

/** Ledges of sandstone or slate, each course narrower than the one below and turned a little. */
function strata(p: Prop, rng: Rng, c: Rgb, look: PropLook, courses = 3 + Math.floor(rng() * 2)): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  let y = 0;
  for (let k = 0; k < courses; k++) {
    const h = (p.h / courses) * (0.8 + 0.4 * rng());
    const r = p.w * (1 - (k / courses) * 0.55) * (0.9 + 0.1 * rng());
    const course = lump(r, h * 0.62, rng, tone(mixRgb(c, look.top, k % 2 ? 0.15 : 0), rng, 0.2), look.top, look.topShare * 0.6, { rough: 0.22, floor: -0.62, seg: 7, rows: 4 });
    parts.push(course.scale(1, 1, 0.65 + 0.2 * rng()).rotateY(rng() * 0.8).translate((rng() - 0.5) * 0.15 * r, y + h * 0.38, 0));
    y += h * 0.92;
  }
  return join(parts);
}

/** Shards thrust up at angles, the tallest near the middle. */
function shard(p: Prop, rng: Rng, c: Rgb, look: PropLook): THREE.BufferGeometry {
  const n = 1 + Math.floor(rng() * 3);
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const r = p.w * (k ? 0.3 + 0.15 * rng() : 0.5);
    const h = p.h * (k ? 0.8 + 0.5 * rng() : 1.5 + 0.4 * rng());
    const a = k * 2.2 + rng();
    const d = k ? p.w * 0.55 : 0;
    const g = prism(r, h, 4 + Math.floor(rng() * 2), tone(c, rng, 0.2), 0.15 + 0.15 * rng()).translate(0, -0.2, 0).rotateZ((rng() - 0.5) * 0.5).rotateX((rng() - 0.5) * 0.5);
    parts.push(topCoat(g.translate(Math.sin(a) * d, 0, Math.cos(a) * d), look.top, look.topShare * 0.7));
  }
  return join(parts);
}

/** Basalt columns, six-sided, close-packed, their tops cut at angles. */
function columns(p: Prop, rng: Rng, c: Rgb, look: PropLook): THREE.BufferGeometry {
  const r = p.w * 0.3;
  const spots: [number, number][] = [[0, 0], ...Array.from({ length: 6 }, (_, k): [number, number] => [Math.sin((k * Math.PI) / 3) * r * 1.8, Math.cos((k * Math.PI) / 3) * r * 1.8])];
  const parts: THREE.BufferGeometry[] = [];
  for (const [i, [x, z]] of spots.entries()) {
    if (i && rng() < 0.3) continue;
    const h = p.h * (i ? 0.5 + 0.8 * rng() : 1.4 + 0.4 * rng());
    const g = prism(r * 0.92, h, 6, tone(c, rng, 0.2)).rotateY(Math.PI / 6);
    const pos = g.getAttribute('position');
    const [sx, sz] = [(rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6];
    for (let v = 0; v < pos.count; v++) if (pos.getY(v) > h - 1e-3) pos.setY(v, h + pos.getX(v) * sx + pos.getZ(v) * sz); // the top cut aslant
    parts.push(topCoat(g.translate(x, 0, z), look.top, look.topShare * 0.6));
  }
  return join(parts);
}

/** Prisms of crystal or ice: six-sided, pointed, leaning out from a common foot. */
function crystal(p: Prop, rng: Rng, c: Rgb): THREE.BufferGeometry {
  const pale = mixRgb(c, [0.86, 0.88, 0.9], 0.45);
  const n = 3 + Math.floor(rng() * 3);
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const r = p.w * (k ? 0.16 + 0.1 * rng() : 0.3);
    const h = p.h * (k ? 0.6 + 0.6 * rng() : 1.4 + 0.3 * rng());
    const shaft = prism(r, h, 6, tone(pale, rng, 0.2));
    const tip = tint(new THREE.ConeGeometry(r, r * 2, 6).translate(0, h + r, 0), scaleRgb(pale, 1.1));
    const a = k * 2.5 + rng();
    const lean = k ? 0.3 + 0.35 * rng() : (rng() - 0.5) * 0.2;
    parts.push(join([shaft, tip]).translate(0, -0.15, 0).rotateX(lean).rotateY(a).translate(Math.sin(a) * p.w * 0.15, 0, Math.cos(a) * p.w * 0.15));
  }
  return join(parts);
}

/** A reef stone: a squat boulder pitted all over, darker toward its foot where the tide stands. */
function porous(p: Prop, rng: Rng, c: Rgb, look: PropLook): THREE.BufferGeometry {
  const g = lump(p.w, p.h * 0.8, rng, c, look.top, look.topShare, { rough: 0.5, seg: 12, rows: 8 });
  const [pos, col] = [g.getAttribute('position'), g.getAttribute('color')];
  const salt = rng() * 100;
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const pit = scatter(x, y, z, salt) < 0.28 ? 0.86 : 1; // the pits
    pos.setXYZ(i, x * pit, y * (pit < 1 ? 0.95 : 1), z * pit);
    const k = (pit < 1 ? 0.6 : 1) * (y < p.h * 0.2 ? 0.7 : 1); // the tide line
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

/** A hoodoo: a column of soft strata worn thin, a harder capstone on it. */
function hoodoo(p: Prop, rng: Rng, c: Rgb, look: PropLook): THREE.BufferGeometry {
  const stem = strata({ ...p, w: p.w * 0.45, h: p.h * 1.4 }, rng, c, look, 3);
  const cap = lump(p.w * 0.75, p.h * 0.4, rng, scaleRgb(c, 0.8), look.top, look.topShare, { rough: 0.3, floor: -0.5 }).translate(0, p.h * 1.4, 0);
  return join([stem, cap]);
}

/** Stalagmites: tapering cones banded by their drip, one great and a few small. */
function stalagmite(p: Prop, rng: Rng, c: Rgb): THREE.BufferGeometry {
  const n = 1 + Math.floor(rng() * 3);
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const r = p.w * (k ? 0.25 + 0.15 * rng() : 0.55);
    const h = p.h * (k ? 0.6 + 0.6 * rng() : 1.6 + 0.6 * rng());
    const g = tint(tileUv(new THREE.CylinderGeometry(r * 0.06, r, h, 7, 4).translate(0, h / 2, 0), r * 4, h), c);
    const [pos, col] = [g.getAttribute('position'), g.getAttribute('color')];
    for (let i = 0; i < pos.count; i++) {
      const band = 0.85 + 0.25 * Math.sin(pos.getY(i) * 5.3);
      col.setXYZ(i, col.getX(i) * band, col.getY(i) * band, col.getZ(i) * band);
    }
    const a = k * 2.3 + rng();
    const d = k ? p.w * 0.55 : 0;
    parts.push(g.translate(Math.sin(a) * d, -0.1, Math.cos(a) * d));
  }
  return join(parts);
}

/** A globe of the Gate of Spheres: near-perfect, half sunk, sometimes with a smaller beside it. */
function orb(p: Prop, rng: Rng, c: Rgb): THREE.BufferGeometry {
  const r = p.w * 0.75;
  const parts = [tint(tileUv(new THREE.SphereGeometry(r, 12, 8).translate(0, r * 0.55, 0), r * 3, r * 2), mixRgb(c, [0.7, 0.72, 0.78], 0.3))];
  if (rng() < 0.5) parts.push(tint(tileUv(new THREE.SphereGeometry(r * 0.35, 8, 6).translate(r * 1.1, r * 0.2, 0).rotateY(rng() * 6), r, r), scaleRgb(c, 0.85)));
  return join(parts);
}

/** A rock of `form` in the realm's look; `c` the region's stone. */
export function rockOf(form: RockForm, p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const mat = look.rockMat ?? 'stone';
  const geo = ((): THREE.BufferGeometry => {
    switch (form) {
      case 'boulder':
        return lump(p.w, p.h, rng, c, look.top, look.topShare);
      case 'split':
        return split(p, rng, c, look);
      case 'cluster':
        return cluster(p, rng, c, look);
      case 'strata':
        return strata(p, rng, c, look);
      case 'shard':
        return shard(p, rng, c, look);
      case 'columns':
        return columns(p, rng, c, look);
      case 'crystal':
        return crystal(p, rng, c);
      case 'porous':
        return porous(p, rng, c, look);
      case 'hoodoo':
        return hoodoo(p, rng, c, look);
      case 'stalagmite':
        return stalagmite(p, rng, c);
      case 'orb':
        return orb(p, rng, c);
    }
  })();
  return [{ mat, geo }];
}
