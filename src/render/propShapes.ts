/**
 * Prop shapes (spec §2: low-poly, vertex-coloured): each prop as a few pieces, each tagged with the
 * material it merges into. Crosses, obelisks, broken walls, dry-stone field walls, rail fences, iron
 * street lamps, fire pits and altars here; the trees, conifers, rocks, bushes, stumps, logs, headstones,
 * pillars and monoliths in their realm's forms (round 111: treeForms, pineForms, rockForms, shrubForms,
 * stoneForms). Houses are houseMesh.ts's.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng, type Rng } from '../core/rng';
import type { LightKind } from '../data/tuning';
import type { Prop } from '../world/props';
import { formOf, lookOf, type Weights } from '../data/propLooks';
import { landmarkPieces } from './landmarkShapes';
import { pineOf } from './pineForms';
import { rockOf } from './rockForms';
import { bushOf, logOf, stumpOf } from './shrubForms';
import { graveOf, monolithOf, pillarOf } from './stoneForms';
import { treeOf } from './treeForms';
import { setPieces } from './setShapes';
import { box, tileUv, tint } from './meshKit';
import { cyl } from './propKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';

export type PropMat = 'stone' | 'wood' | 'leaf' | 'clapboard' | 'brick' | 'shingle' | 'glow' | 'pane' | 'trim' | 'glass' | 'rock' | 'slab' | 'cobble' | 'cloth' | 'metal' | 'bone' | 'glassware' | 'liquid' | 'mirror' | 'wax'; // 'trim': wood that stands off a wall (a house's frames, panes and door), drawn nearer than it is (round 21)
/** A piece that has its geometry: all but the light of a fire, which has none (round 87). */
export type SolidPiece = Piece & { geo: THREE.BufferGeometry };
/** The pieces of `pieces` that have geometry. */
export const solids = (pieces: readonly Piece[]): SolidPiece[] => pieces.filter((q): q is SolidPiece => q.geo !== undefined);
export interface Piece {
  mat: PropMat;
  geo?: THREE.BufferGeometry; // none (round 87): a light alone, at `at`; a fire or a flame is the pixel flame's (flames.ts), no cone of embers is built for it
  light?: LightKind; // a lamp's glass, a fire, a lit window: it lights the world about it (worldLights.ts)...
  halo?: number; // a housed oil flame has a smaller halo than an open flame
  haloGain?: number;
  at?: readonly [number, number, number]; // ...from here in the prop's frame (else from its middle: a piece with no geometry must say)
  flame?: number; // the pixel flame of a fire, torch or lamp here, this many times the size its kind has (render/worldLights.ts; default 1)
  seat?: number; // and its foot this far from the light (under it, negative), where its kind's `base` does not say
  glass?: readonly [number, number, number]; // a window's pane: its glow sits there, seen only from before it (worldLights.ts)
  pane?: number; // a lit window's seed: who lives behind it (paneLife.ts; round 18)
  smoke?: readonly (readonly [number, number, number])[]; // the tops of the chimneys this piece is, in the prop's frame: smoke goes up from them (chimneys.ts; round 34)
}

const BARK: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.35), 1.7);
const IRON: Rgb = scaleRgb(BASE.charcoal, 1.8);
const FLAME: Rgb = mixRgb(BASE.bone, [1, 0.8, 0.5], 0.6);

function cross(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const stone = rng() < 0.5;
  const tone = stone ? scaleRgb(c, 0.9) : scaleRgb(BARK, 1.1);
  const geo = mergeGeometries([box(0.14, p.h, 0.12, 0, p.h / 2, 0, tone), box(0.62, 0.12, 0.12, 0, p.h * 0.72, 0, tone)]).rotateZ((rng() - 0.5) * 0.2);
  return [{ mat: stone ? 'stone' : 'wood', geo: tileUv(geo, 1, 1) }];
}

function obelisk(p: Prop, c: Rgb): Piece[] {
  const shaft = new THREE.CylinderGeometry(p.w * 0.6, p.w, p.h, 4, 3).rotateY(Math.PI / 4).translate(0, p.h / 2 + 0.4, 0);
  const tip = new THREE.ConeGeometry(p.w * 0.6, p.w * 1.2, 4).rotateY(Math.PI / 4).translate(0, p.h + 0.4 + p.w * 0.6, 0);
  const base = new THREE.BoxGeometry(p.w * 3, 0.4, p.w * 3).translate(0, 0.2, 0);
  return [{ mat: 'stone', geo: tint(tileUv(mergeGeometries([shaft, tip, base]), 1, 2), scaleRgb(c, 0.95)) }];
}

function brokenWall(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const n = 3;
  const seg = (p.w * 2) / n;
  const parts = Array.from({ length: n }, (_, k) => {
    const h = p.h * (0.35 + 0.65 * rng());
    return tileUv(box(seg, h, p.d * 2, -p.w + seg * (k + 0.5), h / 2, 0, scaleRgb(c, 0.85 + 0.2 * rng()), 1), seg, h);
  });
  for (let k = 0; k < 3; k++) parts.push(tileUv(box(0.5, 0.35, 0.5, (rng() - 0.5) * p.w * 2, 0.17, p.d + 0.5 + rng(), c), 0.5, 0.5));
  return [{ mat: 'stone', geo: mergeGeometries(parts) }];
}

/** A dry-stone field wall: a waist-high run of rough stones, uneven along its top. */
function fieldWall(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  const n = Math.max(2, Math.round(p.w * 1.4));
  for (let k = 0; k < n; k++) {
    const len = (p.w * 2) / n;
    const h = p.h * (0.8 + 0.35 * rng());
    parts.push(tileUv(box(len * 1.02, h, p.d * 2 * (0.85 + 0.3 * rng()), -p.w + len * (k + 0.5), h / 2, (rng() - 0.5) * 0.1, scaleRgb(c, 0.75 + 0.3 * rng())), len, h));
  }
  return [{ mat: 'stone', geo: mergeGeometries(parts) }];
}

function fence(p: Prop, rng: Rng): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  const posts = Math.max(2, Math.round(p.w) + 1);
  for (let k = 0; k < posts; k++) parts.push(box(0.12, p.h * (0.95 + 0.1 * rng()), 0.12, -p.w + (2 * p.w * k) / (posts - 1), p.h / 2, 0, BARK));
  for (const y of [0.4, 0.8]) parts.push(box(p.w * 2, 0.08, 0.05, 0, p.h * y, 0.07, scaleRgb(BARK, 1.2)).rotateZ((rng() - 0.5) * 0.06));
  return [{ mat: 'wood', geo: tileUv(mergeGeometries(parts), 1, 1) }];
}

/** A Victorian street lamp: a fluted base, a tapering post with a collar, a ladder bar, and a four-sided lantern under a pyramid cap and finial. */
function lamp(p: Prop): Piece[] {
  const quad = (top: number, bottom: number, h: number, y: number, c: Rgb): THREE.BufferGeometry =>
    tint(new THREE.CylinderGeometry(top, bottom, h, 4).rotateY(Math.PI / 4).translate(0, y, 0), c);
  const post = mergeGeometries([
    cyl(0.16, 0.11, 0.5, 8, IRON), // the base
    cyl(0.07, 0.05, p.h, 6, IRON),
    cyl(0.09, 0.09, 0.08, 6, IRON).translate(0, p.h * 0.6, 0), // a collar
    box(0.6, 0.04, 0.04, 0, p.h - 0.35, 0, IRON), // the lamplighter's ladder bar
    quad(0.2, 0.13, 0.05, p.h + 0.02, IRON), // the lantern's seat...
    quad(0.33, 0.2, 0.16, p.h + 0.55, IRON), // ...its cap...
    tint(new THREE.ConeGeometry(0.24, 0.24, 4).rotateY(Math.PI / 4).translate(0, p.h + 0.75, 0), IRON),
    tint(new THREE.SphereGeometry(0.05, 6, 4).translate(0, p.h + 0.9, 0), IRON), // ...and finial
    ...[0, 1, 2, 3].map((i) => box(0.025, 0.46, 0.025, Math.sin(i * 1.57 + 0.78) * 0.2, p.h + 0.26, Math.cos(i * 1.57 + 0.78) * 0.2, IRON)), // its frame
  ]);
  const glass = quad(0.21, 0.15, 0.44, p.h + 0.25, FLAME);
  return [{ mat: 'wood', geo: tileUv(post, 1, 1) }, { mat: 'glow', geo: tileUv(glass, 1, 1), light: 'lamp' }];
}

function firepit(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const stones: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    stones.push(box(0.3, 0.22, 0.24, Math.sin(a) * p.w, 0.11, Math.cos(a) * p.w, scaleRgb(c, 0.7 + 0.3 * rng())).rotateY(-a));
  }
  const wood = [0, 1.2, 2.4].map((a) => cyl(0.07, 0.06, 1.1, 5, scaleRgb(BARK, 0.6)).translate(0, -0.55, 0).rotateZ(Math.PI / 2).rotateY(a).translate(0, 0.12, 0));
  return [{ mat: 'stone', geo: tileUv(mergeGeometries(stones), 1, 1) }, { mat: 'wood', geo: mergeGeometries(wood) }, { mat: 'glow', light: 'fire', at: [0, 0.6, 0] }];
}

function altar(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const slab = box(p.w * 2, 0.3, p.d * 2, 0, p.h - 0.15, 0, scaleRgb(c, 0.8));
  const legs = [-1, 1].map((s) => box(0.5, p.h - 0.3, p.d * 1.6, s * p.w * 0.6, (p.h - 0.3) / 2, 0, scaleRgb(c, 0.7)));
  const stain = box(p.w * 1.2, 0.07, p.d * 1.2, (rng() - 0.5) * 0.3, p.h + 0.035, 0, scaleRgb(BASE.rust, 0.5)); // a stained cloth laid on it: 7 cm, not the 2 that fought the slab's top
  return [{ mat: 'stone', geo: tileUv(mergeGeometries([slab, ...legs, stain]), 1, 1) }];
}

/**
 * A prop's pieces in its own frame (feet at the origin, facing +z); houses are handled apart. Round 111: the trees, conifers, rocks,
 * bushes, stumps, logs, headstones, pillars and monoliths are drawn in the forms of `region`'s look (data/propLooks.ts), one picked by
 * the prop's own seed; with no region, the hub's.
 */
export function propPieces(p: Prop, c: Rgb, region?: string): Piece[] {
  const rng = createRng(p.seed);
  const look = lookOf(region);
  const form = <F extends string>(w: Weights<F>, fallback: F): F => formOf(w, createRng(p.seed * 31 + 7)(), fallback); // its own draw, so the form's builder draws as it would
  switch (p.kind) {
    case 'tree':
      return treeOf(form(look.trees, 'dead'), p, rng, look);
    case 'pine':
      return pineOf(form(look.pines, 'fir'), p, rng, look);
    case 'rock':
      return rockOf(form(look.rocks, 'boulder'), p, rng, c, look);
    case 'pillar':
      return pillarOf(form(look.pillars, 'round'), p, rng, c);
    case 'monolith':
      return monolithOf(form(look.monoliths, 'slab'), p, rng, c, look);
    case 'grave':
      return graveOf(form(look.graves, 'round'), p, rng, c);
    case 'cross':
      return cross(p, rng, c);
    case 'obelisk':
      return obelisk(p, c);
    case 'ruin':
      return brokenWall(p, rng, c);
    case 'wall':
      return fieldWall(p, rng, c);
    case 'fence':
      return fence(p, rng);
    case 'lamp':
      return lamp(p);
    case 'log':
      return logOf(form(look.logs, 'plain'), p, rng, look);
    case 'firepit':
      return firepit(p, rng, c);
    case 'bush':
      return bushOf(form(look.bushes, 'round'), p, rng, c, look);
    case 'stump':
      return stumpOf(form(look.stumps, 'cut'), p, rng, look);
    case 'altar':
      return altar(p, rng, c);
    case 'house':
      return [];
    case 'set':
      return setPieces(p, c);
    case 'spire':
    case 'tower':
    case 'cone':
    case 'pyramid':
    case 'block':
    case 'globe':
      return landmarkPieces(p, rng, c);
  }
}
