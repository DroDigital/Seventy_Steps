/**
 * Round 111, the conifers by realm (data/propLooks.ts): the stacked fir every realm had, a narrow spruce of many drooping tiers, a
 * pine bent by the sea wind or the mountain gale, a dead grey snag with its broken top, a hemlock of soft tiers and a nodding
 * leader, and the dark column of a cypress (the Dreamlands'). Snow lies on the boughs where the realm is cold. Each stands on its
 * trunk of radius `w`, `h` tall.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { PineForm, PropLook } from '../data/propLooks';
import type { Prop } from '../world/props';
import { tileUv, tint } from './meshKit';
import { mixRgb, scaleRgb, type Rgb } from './palette';
import { cyl, join, limb, topCoat } from './propKit';
import type { Piece } from './propShapes';

const SNOW: Rgb = [0.9, 0.9, 0.93];

/** A cone of boughs `r` wide and `h` tall whose foot is at `y`, set off by (dx, dz), its colour with snow on its upper faces when the realm has it. */
function tier(r: number, h: number, y: number, c: Rgb, rng: Rng, look: PropLook, seg = 7, dx = 0, dz = 0): THREE.BufferGeometry {
  const g = tint(tileUv(new THREE.ConeGeometry(r, h, seg), Math.PI * r, h), c).rotateY(rng() * 3).translate(dx, y + h / 2, dz);
  return look.snow ? topCoat(g, SNOW, 0.35) : g;
}

/** Tiers from `from` (a share of the height) to the top, each narrower: the fir's, the spruce's and the hemlock's, by their count and spread. */
function stacked(p: Prop, rng: Rng, look: PropLook, bark: Rgb, o: { tiers: number; from: number; step: number; spread: number; tall: number; taper: number; seg: number; lean?: number; tone?: number }): Piece[] {
  const trunk = cyl(p.w, p.w * 0.5, p.h * (o.from + 0.1), 5, bark);
  const boughs: THREE.BufferGeometry[] = [];
  const c = scaleRgb(look.needles, (o.tone ?? 0.95) + 0.2 * rng()); // one green for the whole tree: tiers that overlap in two greens fight for the depth (the view audit)
  for (let k = 0; k < o.tiers; k++) {
    const t = k / o.tiers;
    const r = p.h * o.spread * (1 - t * o.taper) * (0.88 + rng() * 0.24);
    const off = (o.lean ?? 0) * t * p.h;
    boughs.push(tier(r, p.h * o.tall, p.h * (o.from + o.step * t), c, rng, look, o.seg, off, 0));
  }
  return [{ mat: 'wood', geo: trunk }, { mat: 'leaf', geo: join(boughs) }];
}

/** A pine bent by the wind: its trunk leaning, its boughs all swept to the lee side. */
function windswept(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const lean = 0.18 + 0.12 * rng();
  const trunk = cyl(p.w, p.w * 0.45, p.h * 0.85, 5, bark).rotateZ(-lean);
  const boughs: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const t = k / 4;
    const y = p.h * (0.4 + 0.45 * t);
    const x = Math.sin(lean) * y;
    const r = p.h * 0.18 * (1 - t * 0.5);
    boughs.push(tier(r, p.h * 0.12, y, scaleRgb(look.needles, 0.95), rng, look, 6, x + r * 0.6, 0).scale(1, 1, 0.7));
  }
  return [{ mat: 'wood', geo: trunk }, { mat: 'leaf', geo: join(boughs) }];
}

/** A dead conifer: a grey trunk with the stubs of its boughs, its top snapped, a last tuft or two of needles. */
function snag(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const grey = mixRgb(bark, [0.6, 0.6, 0.6], 0.45);
  const h = p.h * (0.6 + 0.3 * rng());
  const wood = [cyl(p.w * 1.8, p.w, 0.5, 5, scaleRgb(grey, 0.8)), cyl(p.w, p.w * 0.35, h, 5, grey, Math.ceil(h / 2))];
  for (let k = 0; k < 9; k++) {
    const y = h * (0.3 + 0.65 * (k / 9));
    wood.push(limb(0.4 + rng() * 0.9 * (1 - k / 12), p.w * 0.22, k * 2.4 + rng(), 1.6 + rng() * 0.4, grey, 0.4).translate(0, y, 0));
  }
  const tufts = rng() < 0.5 ? [tier(p.h * 0.08, p.h * 0.1, h * 0.55, scaleRgb(look.needles, 0.75), rng, look, 5, 0, 0)] : [];
  return tufts.length ? [{ mat: 'wood', geo: join(wood) }, { mat: 'leaf', geo: join(tufts) }] : [{ mat: 'wood', geo: join(wood) }];
}

/** A cypress: a short trunk and a tall dark column of foliage, narrowing to a point. */
function cypress(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const r = p.h * (0.09 + 0.03 * rng());
  const trunk = cyl(p.w, p.w * 0.6, p.h * 0.2, 5, bark);
  const body = [
    tint(tileUv(new THREE.CylinderGeometry(r, r * 0.7, p.h * 0.45, 7).translate(0, p.h * 0.15 + p.h * 0.225, 0), Math.PI * r, p.h * 0.45), scaleRgb(look.needles, 0.85)),
    tier(r, p.h * 0.45, p.h * 0.6, scaleRgb(look.needles, 0.85), rng, look, 7),
  ];
  return [{ mat: 'wood', geo: trunk }, { mat: 'leaf', geo: join(body) }];
}

/** A conifer of `form`, of the realm's look. */
export function pineOf(form: PineForm, p: Prop, rng: Rng, look: PropLook): Piece[] {
  const bark = look.bark;
  switch (form) {
    case 'fir':
      return stacked(p, rng, look, bark, { tiers: 4, from: 0.195, step: 0.62, spread: 0.22, tall: 0.34, taper: 0.7, seg: 7 });
    case 'spruce':
      return stacked(p, rng, look, bark, { tiers: 7, from: 0.12, step: 0.78, spread: 0.15, tall: 0.22, taper: 0.8, seg: 8, tone: 0.8 });
    case 'hemlock':
      return stacked(p, rng, look, bark, { tiers: 5, from: 0.2, step: 0.68, spread: 0.2, tall: 0.26, taper: 0.65, seg: 6, lean: 0.025 });
    case 'windswept':
      return windswept(p, rng, look, bark);
    case 'snag':
      return snag(p, rng, look, bark);
    case 'cypress':
      return cypress(p, rng, look, bark);
  }
}
