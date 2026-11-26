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
import { floraProp } from './floraKit';
import { fenceOf, wallOf } from './fieldForms';
import { ruinOf } from './ruinForms';
import { setPieces } from './setShapes';
import { box, tileUv, tint } from './meshKit';
import { cyl, join, lump, stem } from './propKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';

export type PropMat = 'stone' | 'wood' | 'leaf' | 'foliage' | 'clapboard' | 'brick' | 'shingle' | 'glow' | 'pane' | 'trim' | 'glass' | 'rock' | 'slab' | 'cobble' | 'cloth' | 'metal' | 'bone' | 'glassware' | 'liquid' | 'mirror' | 'wax'; // 'trim': wood that stands off a wall (a house's frames, panes and door), drawn nearer than it is (round 21)
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

/**
 * A fire pit: a ring of fieldstones about a bed of ash, sticks leaned together over it as a fire is laid. Round 117: each stone is turned
 * where it lies (all nine were turned about the pit's middle after they were placed, and lay heaped on one spot beside the fire).
 */
function firepit(p: Prop, rng: Rng, c: Rgb): Piece[] {
  const stones: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + rng() * 0.2;
    const g = lump(0.17 + 0.05 * rng(), 0.18 + 0.08 * rng(), rng, scaleRgb(c, 0.65 + 0.3 * rng()), scaleRgb(c, 0.4), 0.25, { seg: 5, rows: 3, floor: -0.4 });
    stones.push(g.scale(1.3, 1, 1).rotateY(-a).translate(Math.sin(a) * p.w, 0.04, Math.cos(a) * p.w));
  }
  stones.push(tint(tileUv(new THREE.CylinderGeometry(p.w * 0.8, p.w * 0.9, 0.08, 10).translate(0, 0.04, 0), 1, 1), scaleRgb(BASE.charcoal, 0.9))); // the ash
  const wood = Array.from({ length: 5 }, (_, k) => {
    const a = (k / 5) * Math.PI * 2 + rng() * 0.4;
    return stem([Math.sin(a) * p.w * 0.6, 0.05, Math.cos(a) * p.w * 0.6], [Math.sin(a + 0.3) * 0.06, 0.55 + 0.1 * rng(), Math.cos(a + 0.3) * 0.06], 0.05, 0.035, 5, scaleRgb(BARK, 0.45 + 0.2 * rng()));
  });
  return [{ mat: 'stone', geo: join(stones) }, { mat: 'wood', geo: join(wood) }, { mat: 'glow', light: 'fire', at: [0, 0.6, 0] }];
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
    case 'tree': { // round 125: the library's, modelled in Blender (render/floraKit.ts); the old forms while it is not read
      const f = form(look.trees, 'dead');
      return floraProp('tree', f, p, look, region) ?? treeOf(f, p, rng, look);
    }
    case 'pine': {
      const f = form(look.pines, 'fir');
      return floraProp('pine', f, p, look, region) ?? pineOf(f, p, rng, look);
    }
    case 'rock':
      return rockOf(form(look.rocks, 'boulder'), p, rng, c, look);
    case 'pillar':
      return pillarOf(form(look.pillars, 'round'), p, rng, c);
    case 'monolith':
      return monolithOf(form(look.monoliths, 'slab'), p, rng, c, look);
    case 'grave':
      return graveOf(form(look.graves, 'round'), p, rng, c, look);
    case 'cross':
      return cross(p, rng, c);
    case 'obelisk':
      return obelisk(p, c);
    case 'ruin':
      return ruinOf(form(look.ruins, 'wall'), p, rng, c, look);
    case 'wall':
      return wallOf(form(look.walls, 'drystone'), p, rng, c, look);
    case 'fence':
      return fenceOf(form(look.fences, 'rail'), p, rng, look);
    case 'lamp':
      return lamp(p);
    case 'log':
      return logOf(form(look.logs, 'plain'), p, rng, look);
    case 'firepit':
      return firepit(p, rng, c);
    case 'bush': {
      const f = form(look.bushes, 'round');
      return floraProp('bush', f, p, look, region) ?? bushOf(f, p, rng, c, look); // (crystal, tube and fungus are built here still)
    }
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
