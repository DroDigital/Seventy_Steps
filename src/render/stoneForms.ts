/**
 * Round 111, the worked stone by realm (data/propLooks.ts): headstones round-topped, shouldered as the old New England slates are,
 * peaked or plain tablets, and in the realms beyond, rough-cut slabs; pillars fluted and round, squared and stepped as the Great Race
 * built, of tumbled drums set back out of true, or twisted in turned courses; monoliths cut flat, rough menhirs as on Dunwich's hills,
 * or skewed to the angles of R'lyeh. Each keeps to its prop's size.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { GraveForm, MonolithForm, PillarForm, PropLook } from '../data/propLooks';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';
import { cyl, join, lump, scatter, topCoat } from './propKit';
import type { Piece } from './propShapes';

/** A half disc standing on the tablet's top, `r` across, centred at x. */
const arch = (r: number, depth: number, x: number, y: number, c: Rgb): THREE.BufferGeometry =>
  tint(new THREE.CylinderGeometry(r, r, depth, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(x, y, 0), c);

/**
 * A headstone of `form`. Round 117: the stone leans and the plot before it stays level on the ground (both were tipped together, the
 * plot's far end out of the ground or under it), the stone's foot goes on into the ground as it leans, and lichen lies on its top.
 */
export function graveOf(form: GraveForm, p: Prop, rng: Rng, c: Rgb, look?: PropLook): Piece[] {
  const tone = scaleRgb(c, 0.8 + 0.3 * rng());
  const plot = box(p.w * 2.4, 0.1, p.d * 5, 0, 0.05, p.d * 1.5, scaleRgb(tone, 0.8)); // the sunk plot before it
  const lean = (rng() - 0.5) * 0.18;
  const sunk = box(p.w * 2, 0.25, p.d * 2, 0, -0.1, 0, tone); // its foot, under the ground as it leans
  const done = (parts: THREE.BufferGeometry[]): Piece[] => {
    const stone = tileUv(join([...parts, sunk]), 1, 1).rotateX(lean);
    return [{ mat: 'stone', geo: join([look ? topCoat(stone, look.top, look.topShare * 0.4) : stone, tileUv(plot, 1, 1)]) }];
  };
  switch (form) {
    case 'round':
      return done([box(p.w * 2, p.h - p.w, p.d * 2, 0, (p.h - p.w) / 2, 0, tone), arch(p.w, p.d * 2, 0, p.h - p.w, tone)]);
    case 'shoulder': { // the slate of the old burying grounds: a round tympanum between two smaller shoulders
      const body = p.h - p.w * 0.6;
      return done([box(p.w * 2, body, p.d * 2, 0, body / 2, 0, tone), arch(p.w * 0.6, p.d * 2, 0, body, tone), ...[-1, 1].map((s) => arch(p.w * 0.32, p.d * 2, s * p.w * 0.68, body, tone))]);
    }
    case 'peak': {
      const body = p.h - p.w * 0.5;
      const gable = box(p.w * Math.SQRT2, p.w * Math.SQRT2, p.d * 2, 0, 0, 0, tone).rotateZ(Math.PI / 4).scale(1, 0.5, 1).translate(0, body, 0); // a diamond, its lower half in the tablet
      return done([box(p.w * 2, body, p.d * 2, 0, body / 2, 0, tone), gable]);
    }
    case 'tablet':
      return done([box(p.w * 2, p.h - 0.1, p.d * 2.4, 0, (p.h - 0.1) / 2, 0, tone), box(p.w * 2.3, 0.12, p.d * 3, 0, p.h - 0.04, 0, scaleRgb(tone, 0.92))]);
    case 'slab': // a rough-cut slab, half sunk and tilted
      return [{ mat: 'stone', geo: tileUv(box(p.w * 2.2, p.h * 0.6, p.d * 3, 0, p.h * 0.25, 0, tone).rotateZ((rng() - 0.5) * 0.3).rotateX(lean * 2), 1, 1) }];
  }
}

/** A fluted shaft: `flutes` grooves cut down a column from 0 to `h`, its top torn ragged when it is `broken`. */
export function fluted(r0: number, r1: number, h: number, flutes: number, c: Rgb, broken: boolean, salt: number): THREE.BufferGeometry {
  const g = tint(tileUv(new THREE.CylinderGeometry(r1, r0, h, flutes * 2, Math.max(1, Math.ceil(h))).translate(0, h / 2, 0), Math.PI * (r0 + r1), h), c);
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const k = Math.round(Math.atan2(x, z) / (Math.PI / flutes));
    if (Math.hypot(x, z) > 1e-4 && ((k % 2) + 2) % 2) pos.setXYZ(i, x * 0.9, y, z * 0.9); // every other edge sunk: the flutes between the arrises
    if (broken && y > h - 1e-3) pos.setY(i, h - scatter(Math.round(x * 20), 0, Math.round(z * 20), salt) * 0.45); // its break
  }
  g.computeVertexNormals();
  return g;
}

export function pillarOf(form: PillarForm, p: Prop, rng: Rng, c: Rgb): Piece[] {
  const broken = rng() < 0.4 ? p.h * (0.5 + 0.3 * rng()) : p.h;
  const whole = broken === p.h;
  const parts: THREE.BufferGeometry[] = [];
  if (form === 'round') { // round 117: fluted, on a moulded base, under an echinus and its abacus (it was a plain cylinder between two slabs)
    parts.push(box(p.w * 2.6, 0.4, p.w * 2.6, 0, 0.2, 0, scaleRgb(c, 0.85)), cyl(p.w * 1.12, p.w * 1.02, 0.22, 12, scaleRgb(c, 0.92)).translate(0, 0.36, 0));
    parts.push(fluted(p.w * 0.95, p.w * 0.85, broken - 0.3, 10, c, !whole, rng() * 100).translate(0, 0.3, 0));
    if (whole) parts.push(cyl(p.w * 0.85, p.w * 1.08, 0.26, 12, scaleRgb(c, 0.92)).translate(0, p.h - 0.26, 0), box(p.w * 2.3, 0.35, p.w * 2.3, 0, p.h + 0.17, 0, scaleRgb(c, 0.9)));
  } else if (form === 'square') { // squared and stepped, the Great Race's
    parts.push(box(p.w * 2.8, 0.3, p.w * 2.8, 0, 0.15, 0, scaleRgb(c, 0.8)), box(p.w * 2.3, 0.3, p.w * 2.3, 0, 0.45, 0, scaleRgb(c, 0.88)));
    parts.push(tint(tileUv(new THREE.CylinderGeometry(p.w * 0.85, p.w, broken - 0.6, 4, Math.ceil(broken / 2)).rotateY(Math.PI / 4).translate(0, 0.6 + (broken - 0.6) / 2, 0), 2, broken), c));
    if (whole) parts.push(box(p.w * 2, 0.5, p.w * 2, 0, p.h + 0.25, 0, scaleRgb(c, 0.9)));
  } else if (form === 'drums') { // drums set back out of true, as if the column had fallen and been raised by no human hand
    const n = Math.max(2, Math.round(broken / 1.1));
    const h = (broken - 0.35) / n; // each on the one below (round 117: they stood 4 cm apart, a slit of sky between each two, and over the column's height)
    parts.push(box(p.w * 2.5, 0.35, p.w * 2.5, 0, 0.17, 0, scaleRgb(c, 0.85)));
    for (let k = 0; k < n; k++) parts.push(cyl(p.w * 0.9, p.w * (0.86 + 0.04 * rng()), h, 9, scaleRgb(c, 0.85 + 0.2 * rng())).rotateY(rng()).translate((rng() - 0.5) * 0.12, 0.35 + k * h, (rng() - 0.5) * 0.12));
  } else { // twisted: six-sided courses each turned on the last, narrowing
    const n = Math.max(3, Math.round(broken / 0.9));
    const h = broken / n;
    for (let k = 0; k < n; k++) parts.push(tint(new THREE.CylinderGeometry(p.w * (0.95 - 0.25 * ((k + 1) / n)), p.w * (0.95 - 0.25 * (k / n)), h, 6).rotateY(k * 0.35).translate(0, k * h + h / 2, 0), scaleRgb(c, 0.8 + 0.15 * (k % 2))));
  }
  return [{ mat: 'stone', geo: tileUv(join(parts), 2, 2) }];
}

export function monolithOf(form: MonolithForm, p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  if (form === 'menhir') {
    const g = lump(p.w, p.h, rng, scaleRgb(c, 0.8), look.top, look.topShare * 0.5, { rough: 0.3, floor: -0.1 }).scale(1, 1, p.d / p.w);
    return [{ mat: 'stone', geo: g.rotateZ((rng() - 0.5) * 0.15) }];
  }
  const geo = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.75, Math.SQRT1_2, 1, 4, Math.ceil(p.h / 2)).rotateY(Math.PI / 4);
  geo.scale(p.w * 2, p.h, p.d * 2).translate(0, p.h / 2, 0);
  if (form === 'skew') { // its faces meet at no right angle
    const pos = geo.getAttribute('position');
    const [sx, sz] = [0.06 + 0.06 * rng(), (rng() - 0.5) * 0.08];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setXYZ(i, pos.getX(i) + y * sx * (pos.getZ(i) > 0 ? 1.3 : 1), y + pos.getX(i) * 0.15 * (y / p.h), pos.getZ(i) + y * sz); // its foot still flat on the ground
    }
    geo.computeVertexNormals();
  } else geo.rotateZ((rng() - 0.5) * 0.12);
  return [{ mat: 'stone', geo: tint(tileUv(geo, p.w * 4, p.h), scaleRgb(c, 0.75)) }];
}
