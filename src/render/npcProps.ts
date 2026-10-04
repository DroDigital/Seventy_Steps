/**
 * What the people hold and sit on while they do what they do (round 39; data/npcActs.ts): a book, a notebook and
 * pen, a pipe with its ember, a bottle, a knife and a stick, a chart, a sword across the knees and a cloth, a coil
 * of rope, a silver key, a vial, a watch; and, for those who sit, the crate or stump under them. Built into a
 * figure for the act of its own person only, and shown only while they are at it. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ActKind, Post } from '../data/npcActs';
import { cylinder, part, type Figure } from './figures';
import { box } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb as shade, type Rgb } from './palette'; // (shade, here: figures.ts reaches this file as it is made, and its own is not yet there)

const WOOD = shade(mixRgb(BASE.rust, BASE.charcoal, 0.55), 1.7);
const LEATHER = shade(mixRgb(BASE.rust, BASE.charcoal, 0.5), 1.7);
const PAPER = shade(BASE.bone, 1.6);
const STEEL = shade(BASE.seaGrey, 2.1);
const BRASS = shade(mixRgb(BASE.bone, BASE.rust, 0.4), 1.5);
const GLASS = shade(mixRgb(BASE.seaGrey, BASE.bone, 0.3), 1.6);
const EMBER: Rgb = [1, 0.5, 0.16];
const KEY = shade(BASE.bone, 2.1);
const BOTTLE = shade(mixRgb(ANOMALY.green, BASE.charcoal, 0.6), 1.5);

/** A box in a hand's own frame, as it is held: `side` across the palm, `fwd` the way the forearm points, `up` out of the back of the hand. */
const held = (sw: number, sl: number, st: number, cx: number, cf: number, cu: number, c: Rgb): THREE.BufferGeometry => box(sw, sl, st, cx, -cf, cu, c);

/** What each act holds, and in which hand. */
const HELD: Readonly<Record<ActKind, readonly { hand: 'R' | 'L'; geo: () => THREE.BufferGeometry; glow?: number }[]>> = {
  read: [{ hand: 'R', geo: () => mergeGeometries([held(0.24, 0.17, 0.025, 0.1, 0.06, 0.07, LEATHER), held(0.22, 0.155, 0.02, 0.1, 0.06, 0.085, PAPER), held(0.012, 0.17, 0.03, 0.1, 0.06, 0.07, shade(LEATHER, 0.8))]) }],
  write: [
    { hand: 'L', geo: () => mergeGeometries([held(0.13, 0.17, 0.02, 0.0, 0.08, 0.05, LEATHER), held(0.115, 0.155, 0.016, 0.0, 0.08, 0.062, PAPER)]) },
    { hand: 'R', geo: () => held(0.012, 0.14, 0.012, 0, 0.06, 0.03, shade(BASE.charcoal, 1.4)) },
  ],
  smoke: [
    { hand: 'R', geo: () => mergeGeometries([held(0.014, 0.014, 0.11, 0, 0, 0.07, WOOD), held(0.048, 0.048, 0.055, 0, 0, 0.14, shade(WOOD, 0.7))]) },
    { hand: 'R', glow: 1, geo: () => held(0.03, 0.03, 0.012, 0, 0, 0.172, EMBER) },
  ],
  gaze: [],
  drink: [{ hand: 'R', geo: () => mergeGeometries([held(0.075, 0.075, 0.17, 0, 0.0, 0.11, BOTTLE), held(0.032, 0.032, 0.08, 0, 0.0, 0.24, BOTTLE), held(0.026, 0.026, 0.02, 0, 0.0, 0.29, shade(BASE.bone, 1.2))]) }],
  whittle: [
    { hand: 'R', geo: () => mergeGeometries([held(0.022, 0.07, 0.022, 0, 0.0, 0.03, WOOD), held(0.006, 0.1, 0.02, 0, 0.08, 0.03, STEEL)]) },
    { hand: 'L', geo: () => mergeGeometries([held(0.03, 0.3, 0.03, 0, 0.12, 0.04, shade(BASE.bone, 1.1)), held(0.034, 0.06, 0.034, 0, 0.24, 0.04, shade(BASE.bone, 0.7))]) },
  ],
  map: [{ hand: 'L', geo: () => mergeGeometries([held(0.42, 0.008, 0.3, -0.17, 0.05, 0.15, PAPER), held(0.28, 0.004, 0.012, -0.17, 0.044, 0.21, shade(BASE.charcoal, 1.5)), held(0.012, 0.004, 0.17, -0.09, 0.044, 0.15, shade(BASE.charcoal, 1.5)), held(0.18, 0.004, 0.012, -0.24, 0.044, 0.1, shade(BASE.rust, 1.5))]) }],
  polish: [{ hand: 'R', geo: () => held(0.07, 0.06, 0.03, 0, 0.03, 0.03, shade(BASE.rust, 1.6)) }],
  mend: [],
  brood: [],
  key: [{ hand: 'L', glow: 0.4, geo: () => mergeGeometries([held(0.012, 0.09, 0.012, 0, 0.06, 0.03, KEY), held(0.045, 0.012, 0.045, 0, 0.115, 0.03, KEY), held(0.026, 0.012, 0.012, 0.016, 0.03, 0.03, KEY), held(0.026, 0.012, 0.012, 0.016, 0.052, 0.03, KEY)]) }],
  vial: [{ hand: 'R', glow: 0.5, geo: () => mergeGeometries([held(0.032, 0.032, 0.12, 0, 0.03, 0.07, GLASS), held(0.022, 0.022, 0.07, 0, 0.03, 0.06, shade(ANOMALY.green, 0.8)), held(0.026, 0.026, 0.02, 0, 0.03, 0.14, WOOD)]) }],
  watch: [{ hand: 'R', geo: () => mergeGeometries([held(0.07, 0.07, 0.014, 0, 0.04, 0.04, BRASS), held(0.056, 0.056, 0.004, 0, 0.04, 0.049, PAPER), held(0.008, 0.008, 0.12, 0, 0.0, -0.04, BRASS)]) }],
  lean: [],
  lounge: [ // the pipe, in the right hand: its bowl and stem, and the ember (the smoke is drawn apart: pipeSmoke.ts)
    { hand: 'R', geo: () => mergeGeometries([held(0.016, 0.016, 0.12, 0, 0, 0.07, WOOD), held(0.05, 0.05, 0.06, 0, 0, 0.145, shade(WOOD, 0.65)), held(0.05, 0.05, 0.012, 0, 0, 0.178, shade(WOOD, 0.45))]) },
    { hand: 'R', glow: 1, geo: () => held(0.032, 0.032, 0.01, 0, 0, 0.182, EMBER) },
  ],
};

/** What stands under those who sit, and across their knees. */
function seatOf(kind: ActKind): THREE.BufferGeometry {
  const stump = kind === 'whittle' || kind === 'brood';
  return stump ? cylinder(0.24, 0.27, 0.42, 0.21, WOOD) : mergeGeometries([box(0.46, 0.42, 0.4, 0, 0.21, 0, WOOD), box(0.48, 0.03, 0.42, 0, 0.42, 0, shade(WOOD, 1.2)), box(0.02, 0.38, 0.42, 0.15, 0.21, 0.001, shade(WOOD, 0.8))]);
}
const LAP: Partial<Record<ActKind, () => THREE.BufferGeometry>> = {
  polish: () => mergeGeometries([box(0.86, 0.012, 0.045, 0, 0, 0, STEEL), box(0.03, 0.012, 0.16, -0.44, 0, 0, BRASS), box(0.1, 0.03, 0.03, -0.5, 0, 0, LEATHER)]),
  mend: () => mergeGeometries([cylinder(0.12, 0.12, 0.06, 0, shade(mixRgb(BASE.bone, BASE.rust, 0.3), 1.2)), cylinder(0.05, 0.05, 0.065, 0, shade(BASE.charcoal, 1.4)), box(0.03, 0.025, 0.3, 0.1, -0.1, 0.18, shade(mixRgb(BASE.bone, BASE.rust, 0.3), 1.2))]),
};

interface Props {
  seat: THREE.Object3D | null;
  lap: THREE.Object3D | null;
  held: THREE.Object3D[];
}
const made = new WeakMap<Figure, Props>();

/** A reader's corner: an armchair of dark wood with a worn cushion, and a small round table at its side with a few books and a cup. Standing about the seat's own centre, facing +z, as the figure does. */
function chairSet(f: Figure): THREE.Group {
  const g = new THREE.Group();
  const wood = shade(WOOD, 0.9);
  const cushion = shade(LEATHER, 1.1);
  const legs = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z]) => box(0.045, 0.4, 0.045, x, 0.2, z - 0.08, wood));
  const frame = mergeGeometries([
    ...legs,
    box(0.5, 0.05, 0.48, 0, 0.405, -0.08, wood), // the seat
    box(0.44, 0.07, 0.42, 0, 0.465, -0.08, cushion),
    box(0.045, 0.52, 0.045, -0.21, 0.67, -0.29, wood), box(0.045, 0.52, 0.045, 0.21, 0.67, -0.29, wood), // the back's posts
    box(0.46, 0.09, 0.04, 0, 0.93, -0.29, shade(wood, 1.1)), box(0.38, 0.3, 0.035, 0, 0.7, -0.29, cushion),
    box(0.04, 0.04, 0.34, -0.25, 0.64, -0.12, wood), box(0.04, 0.04, 0.34, 0.25, 0.64, -0.12, wood), // the arms
    box(0.04, 0.2, 0.04, -0.25, 0.53, -0.01, wood), box(0.04, 0.2, 0.04, 0.25, 0.53, -0.01, wood),
  ]);
  part(f, g, frame, 'wood');
  const table = mergeGeometries([
    cylinder(0.27, 0.27, 0.035, 0.575, shade(WOOD, 1.15)), cylinder(0.04, 0.05, 0.54, 0.29, wood), cylinder(0.19, 0.2, 0.03, 0.015, wood),
    box(0.2, 0.05, 0.14, -0.04, 0.62, 0.0, shade(LEATHER, 0.9)), box(0.19, 0.04, 0.13, -0.03, 0.665, 0.01, shade(PAPER, 0.8)), box(0.17, 0.035, 0.12, -0.05, 0.7, -0.01, shade(mixRgb(BASE.rust, BASE.charcoal, 0.4), 1.5)), // three books
    cylinder(0.04, 0.03, 0.06, 0.64, shade(BASE.bone, 1.5)), box(0.05, 0.03, 0.012, 0.075, 0.64, 0, shade(BASE.bone, 1.5)), // a cup and its handle
  ]);
  const t = part(f, g, table, 'wood');
  t.position.set(-0.92, 0, -0.05);
  f.root.add(g);
  return g;
}

/** Builds what `kind` holds and sits on into `f`, out of sight till they are at it; for one with a place of their own, the chair set or the pipe's markers. */
export function addProps(f: Figure, kind: ActKind, seated: boolean, post?: Post): void {
  const p: Props = { seat: null, lap: null, held: [] };
  if (post?.fixture === 'chair') {
    f.fixture = chairSet(f);
    seated = false; // the chair is the world's, not the figure's
  }
  if (kind === 'lounge') {
    f.pipe = new THREE.Object3D(); // the bowl's top, in the right hand's own frame
    f.pipe.position.set(0, 0, 0.19);
    f.handR.add(f.pipe);
    f.mouth = new THREE.Object3D();
    f.mouth.position.set(0, 0.065, 0.15);
    f.head.add(f.mouth);
  }
  for (const h of HELD[kind]) {
    const mesh = part(f, h.hand === 'R' ? f.handR : f.handL, h.geo(), 'cloth', h.glow ?? 0);
    mesh.visible = false;
    p.held.push(mesh);
  }
  if (seated) {
    p.seat = part(f, f.root, seatOf(kind), 'wood');
    p.seat.position.set(0, 0, -0.1);
    p.seat.visible = false;
  }
  const lap = LAP[kind];
  if (lap) {
    p.lap = part(f, f.body, lap(), 'cloth');
    p.lap.position.set(0, 0.1, 0.28);
    p.lap.visible = false;
  }
  made.set(f, p);
}

/** Shows or hides what they hold and sit on. */
export function showProps(f: Figure, on: boolean): void {
  const p = made.get(f);
  if (!p) return;
  for (const m of [p.seat, p.lap, ...p.held]) if (m) m.visible = on;
}
