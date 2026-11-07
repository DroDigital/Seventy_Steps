/**
 * Round 111, the undergrowth, stumps and fallen wood by realm (data/propLooks.ts). Bushes: the round one every realm had, a spreading
 * juniper, a tangle of thorn, a mound of bracken, salt scrub, the pale fungi under K'n-yan and Yuggoth, crystal growths, a stand of
 * pipes in the Piping Dark, and the tendrils that rise in R'lyeh and the Black Wood. Stumps cut, broken, hollow or shelved with fungus;
 * logs plain, with their branch stubs, or rotten through. Each keeps to its prop's size.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { BushForm, LogForm, PropLook, StumpForm } from '../data/propLooks';
import type { Prop } from '../world/props';
import { tileUv, tint } from './meshKit';
import { mixRgb, scaleRgb, type Rgb } from './palette';
import { capTint, cyl, join, limb, stem, tipOf, topCoat } from './propKit';
import type { Piece } from './propShapes';

const blob = (r: number, c: Rgb, sy: number, x: number, y: number, z: number, detail: 'sphere' | 'ico' = 'sphere'): THREE.BufferGeometry =>
  tint(tileUv(detail === 'sphere' ? new THREE.SphereGeometry(r, 6, 4) : new THREE.IcosahedronGeometry(r, 0), r * 3, r * 2), c).scale(1, sy, 1).translate(x, y, z);

function round(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const parts = Array.from({ length: 3 + Math.floor(rng() * 2) }, () => {
    const r = p.w * (0.5 + 0.4 * rng());
    return blob(r, scaleRgb(c, 0.8 + 0.4 * rng()), p.h / p.w, (rng() - 0.5) * p.w, r * 0.6, (rng() - 0.5) * p.w);
  });
  return [{ mat: 'leaf', geo: join(parts) }];
}

/** A juniper: low flattened cones of scale-leaves spreading from the middle. */
function juniper(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const parts = Array.from({ length: 3 + Math.floor(rng() * 2) }, (_, k) => {
    const r = p.w * (k ? 0.45 + 0.2 * rng() : 0.6);
    const a = k * 2.2 + rng();
    const d = k ? p.w * 0.45 : 0;
    return tint(tileUv(new THREE.ConeGeometry(r, p.h * (k ? 0.8 : 1.3), 6), r * 2, p.h), scaleRgb(c, 0.75 + 0.3 * rng())).translate(Math.sin(a) * d, p.h * (k ? 0.4 : 0.65), Math.cos(a) * d);
  });
  return [{ mat: 'leaf', geo: join(parts) }];
}

/** A tangle of thorn: bare crossing stems from the ground, a few dark clumps caught in them. */
function thorn(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const wood: THREE.BufferGeometry[] = [];
  const leaves: THREE.BufferGeometry[] = [];
  const bark = scaleRgb(look.bark, 0.8);
  for (let k = 0; k < 7; k++) {
    const [yaw, pitch, len] = [rng() * Math.PI * 2, 0.5 + rng() * 0.6, p.h * (1 + 0.6 * rng())];
    const from = [(rng() - 0.5) * p.w * 0.6, 0, (rng() - 0.5) * p.w * 0.6];
    wood.push(limb(len, 0.035, yaw, pitch, bark, 0.3).translate(from[0], 0, from[2]));
    if (rng() < 0.4) leaves.push(blob(0.18 + 0.12 * rng(), scaleRgb(c, 0.7), 0.7, ...tipOf(from, yaw, pitch, len * 0.7), 'ico'));
  }
  return leaves.length ? [{ mat: 'wood', geo: join(wood) }, { mat: 'leaf', geo: join(leaves) }] : [{ mat: 'wood', geo: join(wood) }];
}

/** Bracken: a mound of fronds arching out and down from a crown. */
function bracken(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const n = 7 + Math.floor(rng() * 4);
  const parts: THREE.BufferGeometry[] = [];
  const brown = mixRgb(c, [0.6, 0.44, 0.26], 0.5); // October's bracken has turned
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rng() * 0.4;
    const len = p.w * (0.8 + 0.4 * rng());
    parts.push(tint(new THREE.ConeGeometry(0.16, len, 4).scale(1, 1, 0.3).translate(0, len / 2, 0).rotateX(0.9 + rng() * 0.5).rotateY(a), scaleRgb(rng() < 0.5 ? brown : c, 0.8 + 0.3 * rng())));
  }
  return [{ mat: 'leaf', geo: join(parts) }];
}

/** Salt scrub: a low open mound of grey-green twigs and small clumps. */
function scrub(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const grey = mixRgb(c, look.top, 0.35);
  const parts = Array.from({ length: 5 + Math.floor(rng() * 3) }, () => blob(p.w * (0.22 + 0.15 * rng()), scaleRgb(grey, 0.8 + 0.3 * rng()), 0.8, (rng() - 0.5) * p.w * 1.2, p.h * (0.2 + 0.35 * rng()), (rng() - 0.5) * p.w * 1.2, 'ico'));
  const twigs = Array.from({ length: 5 }, () => limb(p.h * 0.9, 0.03, rng() * Math.PI * 2, 0.6 + rng() * 0.5, scaleRgb(look.bark, 0.9), 0.3));
  return [{ mat: 'wood', geo: join(twigs) }, { mat: 'leaf', geo: join(parts) }];
}

/** Pale fungi: a crowd of caps on stalks of every height. */
function fungus(p: Prop, rng: Rng, look: PropLook): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4 + Math.floor(rng() * 4); k++) {
    const [x, z] = [(rng() - 0.5) * p.w * 1.3, (rng() - 0.5) * p.w * 1.3];
    const h = p.h * (0.3 + 0.9 * rng());
    const r = 0.12 + 0.22 * rng();
    const c = look.leaves[Math.floor(rng() * look.leaves.length)];
    parts.push(tint(new THREE.CylinderGeometry(r * 0.25, r * 0.3, h, 5).translate(x, h / 2, z), scaleRgb(c, 0.85)));
    parts.push(tint(new THREE.ConeGeometry(r, r * 0.7, 7).translate(x, h + r * 0.3, z), c));
  }
  return [{ mat: 'leaf', geo: join(parts) }];
}

/** Crystal growths (ice on the summit): pointed prisms from one foot. */
function crystals(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const pale = mixRgb(c, [0.86, 0.88, 0.9], 0.5);
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4 + Math.floor(rng() * 3); k++) {
    const [r, h] = [0.06 + 0.07 * rng(), p.h * (0.5 + 0.9 * rng())];
    const a = rng() * Math.PI * 2;
    parts.push(join([tint(new THREE.CylinderGeometry(r, r, h, 5).translate(0, h / 2, 0), scaleRgb(pale, 0.85 + 0.3 * rng())), tint(new THREE.ConeGeometry(r, r * 2.4, 5).translate(0, h + r * 1.2, 0), pale)]).rotateX(0.2 + 0.5 * rng()).rotateY(a));
  }
  return [{ mat: 'stone', geo: join(parts) }];
}

/** A stand of pipes: hollow-looking stone tubes, close-set, of many heights. */
function tubes(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 5 + Math.floor(rng() * 4); k++) {
    const [r, h] = [0.07 + 0.08 * rng(), p.h * (0.6 + 1.4 * rng())];
    const [x, z] = [(rng() - 0.5) * p.w, (rng() - 0.5) * p.w];
    parts.push(capTint(tint(new THREE.CylinderGeometry(r, r * 1.1, h, 6).translate(x, h / 2, z), scaleRgb(c, 0.7 + 0.3 * rng())), scaleRgb(c, 0.25))); // its dark mouth
  }
  return [{ mat: 'bone', geo: join(parts) }];
}

/** Tendrils: a few stalks rising and curling over, thin at their tips. */
function tendril(p: Prop, rng: Rng, look: PropLook): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  const c = look.leaves[Math.floor(rng() * look.leaves.length)];
  for (let k = 0; k < 3 + Math.floor(rng() * 3); k++) {
    let at = [(rng() - 0.5) * p.w, 0, (rng() - 0.5) * p.w];
    let [yaw, pitch, r] = [rng() * Math.PI * 2, 0.15, 0.09 + 0.04 * rng()];
    for (let s = 0; s < 4; s++) {
      const next = tipOf(at, yaw, pitch, p.h * 0.4);
      parts.push(stem(at, next, r, r * 0.7, 5, scaleRgb(c, 0.8 + 0.1 * s)));
      [at, pitch, r] = [next, pitch + 0.45 + 0.2 * rng(), r * 0.7];
      yaw += (rng() - 0.5) * 0.6;
    }
  }
  return [{ mat: 'leaf', geo: join(parts) }];
}

export function bushOf(form: BushForm, p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const green = look.needles;
  switch (form) {
    case 'round':
      return round(p, rng, green);
    case 'juniper':
      return juniper(p, rng, green);
    case 'thorn':
      return thorn(p, rng, green, look);
    case 'bracken':
      return bracken(p, rng, green);
    case 'scrub':
      return scrub(p, rng, green, look);
    case 'fungus':
      return fungus(p, rng, look);
    case 'crystal':
      return crystals(p, rng, c);
    case 'tube':
      return tubes(p, rng, c);
    case 'tendril':
      return tendril(p, rng, look);
  }
}

export function stumpOf(form: StumpForm, p: Prop, rng: Rng, look: PropLook): Piece[] {
  const bark = look.bark;
  const base = [cyl(p.w * 1.3, p.w, p.h, 7, bark), cyl(p.w * 0.2, p.w * 0.05, p.h * 0.6, 3, bark).rotateZ(1.2).translate(p.w, 0, 0)]; // the stump every realm had, its root
  if (form === 'cut') return [{ mat: 'wood', geo: join([capTint(base[0], mixRgb(bark, [0.72, 0.62, 0.46], 0.6)), base[1]]) }]; // its sawn face, pale
  if (form === 'broken') return [{ mat: 'wood', geo: join([...base, ...[0, 2.1, 4.2].map((a) => tint(new THREE.ConeGeometry(p.w * 0.4, p.h * (0.5 + 0.6 * rng()), 4).translate(Math.sin(a) * p.w * 0.45, p.h + p.h * 0.25, Math.cos(a) * p.w * 0.45), bark))]) }];
  if (form === 'hollow') {
    const staves = Array.from({ length: 7 }, (_, k) => {
      const a = (k / 7) * Math.PI * 2;
      const h = p.h * (0.7 + 0.7 * rng());
      return tint(new THREE.BoxGeometry(p.w * 0.55, h, p.w * 0.28).translate(0, h / 2, p.w * 0.9).rotateY(a), scaleRgb(bark, 0.8 + 0.3 * rng()));
    });
    return [{ mat: 'wood', geo: topCoat(join(staves), look.top, 0.3) }];
  }
  const shelves = Array.from({ length: 2 + Math.floor(rng() * 3) }, () => {
    const a = rng() * Math.PI * 2;
    const r = p.w * (0.35 + 0.25 * rng());
    return tint(new THREE.CylinderGeometry(r, r * 0.6, 0.08, 7).translate(Math.sin(a) * p.w * 1.05, p.h * (0.25 + 0.45 * rng()), Math.cos(a) * p.w * 1.05), look.leaves[Math.floor(rng() * look.leaves.length)]); // half sunk in the wood
  });
  return [{ mat: 'wood', geo: join(base) }, { mat: 'leaf', geo: join(shelves) }];
}

export function logOf(form: LogForm, p: Prop, rng: Rng, look: PropLook): Piece[] {
  const c = scaleRgb(look.bark, 0.9 + 0.2 * rng());
  const lying = (len: number, x: number): THREE.BufferGeometry => cyl(p.d, p.d * 0.9, len, 7, c).translate(0, -len / 2, 0).rotateZ(Math.PI / 2).translate(x, p.d, 0);
  if (form === 'plain') return [{ mat: 'wood', geo: lying(p.w * 2, 0) }];
  if (form === 'branched') {
    const stubs = [-0.5, 0.1, 0.6].map((t) => limb(0.4 + 0.4 * rng(), p.d * 0.4, (rng() < 0.5 ? 1 : -1) * Math.PI / 2 + Math.PI / 2, 0.4 + rng() * 0.8, c, 0.4).translate(t * p.w, p.d * 1.4, 0));
    return [{ mat: 'wood', geo: join([lying(p.w * 2, 0), ...stubs]) }];
  }
  const gap = 0.3; // broken through where it rotted, both halves furred with moss
  const halves = [-1, 1].map((s) => lying(p.w - gap / 2, s * (p.w + gap / 2) / 2).rotateY(s * 0.12 * rng()));
  return [{ mat: 'wood', geo: topCoat(join(halves), look.top, 0.4) }];
}
