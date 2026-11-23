/**
 * Round 117, the field walls and fences by realm (data/propLooks.ts): a dry-stone wall laid in courses under a cope of stones on edge,
 * a wall tumbled into a bank of stones, a mortared town wall of squared blocks under its coping, a row of upright slabs; a rail fence,
 * a white picket fence, wattle hurdles between stakes, and a broken fence of leaning posts and fallen rails. Each runs along x from -w
 * to w within its prop's thickness, so its collider is as it was, and each meets the land as before (propSettle.ts drapes it).
 * Neighbouring stones abut and never lie within one another in a face's plane (the view audit's fights).
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { FenceForm, PropLook, WallForm } from '../data/propLooks';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { mixRgb, scaleRgb, type Rgb } from './palette';
import { cyl, join, roughen, shadeBelow, topCoat } from './propKit';
import type { Piece } from './propShapes';
import { stoneLength } from './ruinForms';

/** Stones laid end to end from x0 to x1 at height y, `h` tall, each `len` long within its range, as deep as `depth` and a little less. */
export function course(x0: number, x1: number, y: number, h: number, depth: number, len: [number, number], rng: Rng, c: Rgb, spread = 0.3): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let x = x0; x < x1 - 0.05; ) {
    const l = stoneLength(x1 - x, len, rng);
    const d = depth * (0.86 + 0.14 * rng());
    out.push(tileUv(box(l, h, d, x + l / 2, y + h / 2, (rng() - 0.5) * (depth - d), scaleRgb(c, 1 - spread / 2 + spread * rng())), l, h));
    x += l;
  }
  return out;
}

/** A dry-stone wall: courses battered in as they rise, under a cope of narrow stones stood on edge. */
function drystone(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const n = p.h > 0.9 ? 3 : 2;
  const cope = 0.24;
  const ch = (p.h - cope) / n;
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) parts.push(...course(-p.w, p.w, k * ch, ch, p.d * 2 * (1 - k * 0.08), k % 2 ? [0.35, 0.7] : [0.5, 0.9], rng, c));
  parts.push(...course(-p.w, p.w, n * ch, cope, p.d * 2 * (1 - n * 0.08) * 0.85, [0.28, 0.45], rng, scaleRgb(c, 0.9)));
  return [{ mat: 'stone', geo: topCoat(join(parts), look.top, look.topShare * 0.5) }];
}

/** A wall fallen into a long low bank of stones, its line broken where it is lowest. */
function tumbled(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  for (let x = -p.w; x < p.w - 0.2; ) {
    const r = 0.22 + 0.2 * rng();
    const tall = p.h * (0.35 + 0.45 * rng());
    if (rng() > 0.12) {
      const g = tint(new THREE.IcosahedronGeometry(1, 0).scale(r, tall * 0.6, p.d * (0.8 + 0.4 * rng())), scaleRgb(c, 0.8 + 0.3 * rng()));
      parts.push(roughen(g, 0.18, rng() * 100).rotateY((rng() - 0.5) * 0.4).translate(x + r, tall * 0.35, (rng() - 0.5) * p.d * 0.5));
    }
    x += r * 2; // side by side, not within one another
  }
  for (let k = 0; k < 3; k++) parts.push(roughen(tint(new THREE.IcosahedronGeometry(0.16 + 0.1 * rng(), 0), scaleRgb(c, 0.85)), 0.2, rng() * 100).translate((rng() - 0.5) * p.w * 1.8, 0.05, (rng() < 0.5 ? -1 : 1) * (p.d + 0.25))); // stones rolled off it
  return [{ mat: 'stone', geo: shadeBelow(topCoat(join(parts), look.top, look.topShare), 0.3) }];
}

/** A town wall of squared blocks in courses that break joint, under a coping that stands out from both faces. */
function mortared(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const n = Math.max(3, Math.round((p.h - 0.15) / 0.3));
  const ch = (p.h - 0.15) / n;
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const shift = k % 2 ? 0.35 : 0;
    parts.push(...course(-p.w, -p.w + shift, k * ch, ch, p.d * 2, [0.35, 0.35], rng, c, 0.12), ...course(-p.w + shift, p.w, k * ch, ch, p.d * 2, [0.7, 0.7], rng, c, 0.12));
  }
  for (let x = -p.w; x < p.w - 0.05; x += 1.4) { // the coping, in lengths
    const l = Math.min(1.4, p.w - x);
    parts.push(tileUv(box(l, 0.15, p.d * 2 + 0.16, x + l / 2, p.h - 0.075, 0, scaleRgb(c, 0.82)), l, 0.15));
  }
  return [{ mat: 'stone', geo: join(parts) }];
}

/** Upright slabs set in a row, each its own height, a hand's gap between, some leaning out of true. */
function slabs(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  for (let x = -p.w; x < p.w - 0.2; ) {
    const l = Math.min(0.5 + 0.5 * rng(), p.w - x);
    const h = p.h * (0.8 + 0.7 * rng());
    parts.push(tileUv(box(l - 0.06, h + 0.3, p.d * 1.2, 0, (h + 0.3) / 2 - 0.3, 0, scaleRgb(c, 0.8 + 0.3 * rng())), l, h).rotateX((rng() - 0.5) * 0.2).translate(x + l / 2, 0, 0));
    x += l;
  }
  return [{ mat: 'stone', geo: topCoat(join(parts), look.top, look.topShare * 0.6) }];
}

export function wallOf(form: WallForm, p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  switch (form) {
    case 'drystone':
      return drystone(p, rng, c, look);
    case 'tumbled':
      return tumbled(p, rng, c, look);
    case 'mortared':
      return mortared(p, rng, c);
    case 'slab':
      return slabs(p, rng, c, look);
  }
}

const PAINT: Rgb = [0.8, 0.78, 0.72];

/** Posts along the fence, `every` metres apart, each leaning by up to `lean`; their xs. */
function posts(p: Prop, rng: Rng, every: number, h: number, r: number, c: Rgb, lean: number, parts: THREE.BufferGeometry[]): number[] {
  const n = Math.max(2, Math.round((p.w * 2) / every) + 1);
  const xs = Array.from({ length: n }, (_, k) => -p.w + (2 * p.w * k) / (n - 1));
  for (const x of xs) parts.push(tileUv(cyl(r, r * 0.85, h * (0.95 + 0.1 * rng()) + 0.25, 4, c).translate(0, -0.25, 0).rotateY(Math.PI / 4).rotateZ((rng() - 0.5) * lean).rotateX((rng() - 0.5) * lean).translate(x, 0, 0), 0.3, h));
  return xs;
}

/** A rail fence: weathered posts, two or three rails nailed to their faces, a bay's rail sometimes split and sagging. */
function rails(p: Prop, rng: Rng, bark: Rgb, broken: boolean): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  const xs = posts(p, rng, broken ? 1.8 : 2, p.h, 0.07, bark, broken ? 0.3 : 0.06, parts);
  const heights = broken || rng() < 0.6 ? [0.4, 0.8] : [0.3, 0.6, 0.9];
  for (let k = 1; k < xs.length; k++) {
    const [a, b] = [xs[k - 1], xs[k]];
    for (const t of heights) {
      const fate = broken ? rng() : 1;
      if (fate < 0.3) continue; // gone
      const [ya, yb] = fate < 0.55 ? [p.h * t, 0.06] : [p.h * t + (rng() - 0.5) * 0.05, p.h * t + (rng() - 0.5) * 0.05]; // one end fallen to the ground
      const len = Math.hypot(b - a, yb - ya);
      parts.push(box(len + 0.12, 0.09, 0.05, 0, 0, 0, scaleRgb(bark, 1.05 + 0.2 * rng())).rotateZ(Math.atan2(yb - ya, b - a)).translate((a + b) / 2, (ya + yb) / 2, 0.072));
    }
  }
  return [{ mat: 'wood', geo: tileUv(join(parts), 1, 1) }];
}

/** A picket fence: square posts, two rails behind, and close-set pickets with pointed heads, its paint going grey. */
function picket(p: Prop, rng: Rng, look: PropLook): Piece[] {
  const paint = mixRgb(PAINT, look.top, 0.25 + 0.25 * rng());
  const parts: THREE.BufferGeometry[] = [];
  posts(p, rng, 2.4, p.h + 0.1, 0.07, paint, 0.03, parts);
  for (const t of [0.25, 0.72]) parts.push(box(p.w * 2, 0.08, 0.04, 0, p.h * t, -0.05, scaleRgb(paint, 0.85)));
  const n = Math.floor((p.w * 2) / 0.22);
  for (let k = 0; k < n; k++) {
    if (rng() < 0.04) continue; // one gone here and there
    const x = -p.w + 0.11 + k * 0.22;
    const h = p.h * (0.88 + 0.06 * rng());
    const c = scaleRgb(paint, 0.88 + 0.2 * rng());
    parts.push(cyl(0.045, 0.045, h, 4, c).rotateY(Math.PI / 4).translate(x, 0, 0), tint(new THREE.ConeGeometry(0.064, 0.12, 4).rotateY(Math.PI / 4).translate(x, h + 0.06, 0), c));
  }
  return [{ mat: 'wood', geo: tileUv(join(parts), 1, 1) }];
}

/** Wattle hurdles: panels of woven withies between stakes, the weave showing as bands, each panel bowed a little. */
function wattle(p: Prop, rng: Rng, bark: Rgb): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  const xs = posts(p, rng, 1.8, p.h + 0.15, 0.05, scaleRgb(bark, 0.9), 0.08, parts);
  const light = mixRgb(bark, [0.62, 0.52, 0.38], 0.45);
  for (let k = 1; k < xs.length; k++) {
    const len = xs[k] - xs[k - 1];
    const rows = 9;
    const g = new THREE.BoxGeometry(len - 0.04, p.h * 0.9, 0.07, 3, rows, 1).translate((xs[k] + xs[k - 1]) / 2, p.h * 0.48, 0);
    const pos = g.getAttribute('position');
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const row = Math.round(((pos.getY(i) - p.h * 0.03) / (p.h * 0.9)) * rows);
      col.set(row % 2 ? light : scaleRgb(light, 0.7), i * 3);
      const u = (pos.getX(i) - xs[k - 1]) / len;
      pos.setZ(i, pos.getZ(i) + Math.sin(u * Math.PI) * 0.05); // bowed between its stakes
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    parts.push(tileUv(g, len, p.h));
  }
  return [{ mat: 'wood', geo: join(parts) }];
}

export function fenceOf(form: FenceForm, p: Prop, rng: Rng, look: PropLook): Piece[] {
  const bark = scaleRgb(mixRgb(look.bark, [0.5, 0.48, 0.44], 0.35), 1.1); // fence wood goes grey in the weather
  switch (form) {
    case 'rail':
      return rails(p, rng, bark, false);
    case 'broken':
      return rails(p, rng, bark, true);
    case 'picket':
      return picket(p, rng, look);
    case 'wattle':
      return wattle(p, rng, bark);
  }
}
