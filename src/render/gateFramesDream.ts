/**
 * The frames of the dream's and the Outer Dark's gates (round 104; data/gateFrames.ts says which gate wears which): the gnarled wood
 * out of the Stairs of Slumber, the gate of horn and ivory back up them, Kadath's onyx, the Ultimate Void's hovering stones, and one
 * for each realm of the chain beyond it. Built about the veil's opening (gateFrameKit.ts `OPENING`) from the kit's shapes.
 */

import * as THREE from 'three';
import { tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, type Rgb } from './palette';
import { ball, blob, block, column, fan, Frame, lean, post, ring, rough, shade, slab, spike, strut, twisted } from './gateFrameKit';

const BONE: Rgb = BASE.bone;
const BARK: Rgb = shade(mixRgb(BASE.rust, BASE.charcoal, 0.5), 1.6);
const ONYX: Rgb = shade(BASE.charcoal, 2.1);
const PALE: Rgb = shade(mixRgb(BASE.bone, BASE.seaGrey, 0.2), 1.2);
const STORM: Rgb = shade(mixRgb(BASE.seaGrey, BASE.charcoal, 0.5), 1.5);
const GLOWS: readonly Rgb[] = [ANOMALY.purple, ANOMALY.green, ANOMALY.magenta];

/** The Enchanted Wood: two gnarled trunks whose boughs arch over and grow into one another, roots spread, fungus glowing on the bark. */
export function wood(f: Frame): void {
  for (const s of [-1, 1]) {
    f.add('wood', rough(column(0.6, 0.38, s * 2.1, -0.1, 3.9, 0, BARK, 7), 0.12, 100 + s));
    for (let k = 0; k < 3; k++) f.add('wood', rough(strut(s * 2.1, 0.7, s * (2.7 + k * 0.35), -0.15, 0.22 - k * 0.04, 0.24, (k - 1) * 0.45, BARK), 0.05, 103 + k + s)); // the roots
    f.add('wood', rough(strut(s * 2.3, 3.4, s * 3.3, 5.0, 0.16, 0.18, 0.1, BARK), 0.05, 107 + s)); // a bough reaching out
    f.add('leaves', rough(ball(0.6, s * 3.35, 5.15, 0.1, shade(BARK, 1.2), 1), 0.25, 109 + s));
    for (let k = 0; k < 4; k++) f.glow(blob(0.11, 1.4, 0.4, 1, s * (2.1 + (k % 2 ? 0.38 : -0.42)), 0.9 + k * 0.75, 0.38 - (k % 2) * 0.7, ANOMALY.green));
  }
  f.add('wood', rough(ring(2.1, 0.3, 0, 3.85, 0, BARK, Math.PI, 0, 12), 0.1, 111));
  f.add('wood', rough(ring(1.75, 0.15, 0.1, 3.9, 0.2, shade(BARK, 0.9), Math.PI * 0.8, 0.3, 9), 0.06, 112));
  f.add('wood', fan(1.85, 0, 3.85, 0, shade(BARK, 0.55)));
  f.add('leaves', rough(ball(0.85, 0, 6.0, 0, shade(BARK, 1.2), 1), 0.3, 113));
}

/** The gate of horn and ivory, back up the Stairs of Slumber: a twisted jamb of horn and one of ivory, a round arch of pale stone, two steps before it. */
export function ivory(f: Frame): void {
  const HORN: Rgb = shade(mixRgb(BASE.rust, BASE.charcoal, 0.3), 1.5);
  f.add('stone', twisted(0.5, -2.0, 0.35, 3.85, 0, HORN, 16, 0.25));
  f.add('stone', twisted(0.5, 2.0, 0.35, 3.85, 0, shade(BONE, 1.05), -16, 0.25));
  for (let k = 0; k < 2; k++) f.add('stone', post(5.0 - k * 0.6, 1.6 - k * 0.4, 0, k * 0.17, (k + 1) * 0.17, 0.3 + k * 0.15, PALE)); // the steps
  for (const s of [-1, 1]) f.add('stone', post(0.85, 0.85, s * 2.0, 3.85, 4.05, 0, PALE));
  f.add('stone', post(4.8, 0.7, 0, 3.8, 4.05, 0, PALE));
  f.add('stone', ring(2.0, 0.3, 0, 4.05, 0, PALE, Math.PI, 0, 14));
  f.add('stone', fan(1.9, 0, 4.05, 0, shade(PALE, 0.7)));
  f.glow(ring(1.2, 0.05, 0, 4.05, 0.03, ANOMALY.purple, Math.PI, 0, 12));
  f.glow(ball(0.16, 0, 6.15, 0, ANOMALY.purple, 1)); // the keystone's moon
}

/** Kadath: a slender lancet of black onyx, pinnacles over its jambs, stars about its point. */
export function onyx(f: Frame): void {
  for (const s of [-1, 1]) {
    f.add('slab', post(0.62, 0.7, s * 2.0, 0, 4.4, 0, ONYX));
    f.add('slab', post(0.8, 0.85, s * 2.0, 0, 0.4, 0, shade(ONYX, 1.1)));
    f.add('slab', spike([s * 2.0, 4.4, 0], [s * 2.0, 6.4, 0], 0.32, ONYX, 4));
    f.add('slab', strut(s * 1.75, 3.8, s * 0.05, 6.0, 0.4, 0.62, 0, ONYX)); // the lancet's two sides
  }
  f.add('slab', slab([[-1.65, 3.8], [1.65, 3.8], [0, 5.95]], 0.3, shade(ONYX, 0.7)));
  f.add('slab', spike([0, 5.9, 0], [0, 7.0, 0], 0.18, ONYX, 4));
  for (let k = 0; k < 9; k++) f.glow(ball(0.05 + (k % 3) * 0.02, Math.sin(k * 2.1) * (1.2 + k * 0.12), 5.2 + ((k * 0.43) % 1.6), 0.45 * (k % 2 ? 1 : -1), ANOMALY.purple));
}

/** The Ultimate Void: hexagonal stones of 'Umr at-Tawil's pedestals hanging apart in the air where jambs should be, a ring turning behind them. */
export function voidFrame(f: Frame): void {
  const HEX: Rgb = shade(mixRgb(BASE.charcoal, BASE.seaGrey, 0.5), 1.5);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) f.add('slab', column(0.42 - k * 0.03, 0.42 - k * 0.03, s * (2.05 + Math.sin(k * 1.7) * 0.12), 0.1 + k * 1.05, 0.95 + k * 1.05, 0, HEX, 6));
    f.add('slab', column(0.3, 0.3, s * 3.1, 1.6, 2.1, 0.3, HEX, 6));
    f.add('slab', column(0.22, 0.22, s * 3.4, 3.4, 3.75, -0.2, HEX, 6));
  }
  f.add('slab', post(4.9, 0.7, 0, 4.4, 4.85, 0, HEX)); // the lintel, apart from what should bear it
  f.glow(ring(2.85, 0.05, 0, 2.2, -0.5, ANOMALY.purple, Math.PI * 2, 0, 24));
  f.glow(ring(3.05, 0.03, 0, 2.2, -0.55, ANOMALY.green, Math.PI * 1.3, 0.4, 18));
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) f.glow(block(0.06, 0.6, 0.06, s * (2.05 + Math.sin(k * 1.7) * 0.12), 0.52 + k * 1.05, 0.43, ANOMALY.purple));
}

/** The Cloud Summit: jagged rock riven by the storm, snow on its ledges, a crown of thunderhead over it, bolts down its face. */
export function storm(f: Frame): void {
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) f.add('rock', rough(block(0.95 - k * 0.08, 1.05, 0.9, s * (2.1 + (k % 2) * 0.12), 0.5 + k * 1.02, (k % 2) * 0.08, STORM), 0.15, 120 + k + s * 7));
    f.add('snow', rough(post(1.0, 0.9, s * 2.15, 4.1, 4.3, 0, PALE), 0.1, 130 + s));
    const bolt: readonly (readonly [number, number])[] = [[0, 3.6], [0.25, 2.9], [-0.05, 2.6], [0.2, 1.8], [-0.1, 1.3]];
    for (let k = 0; k < bolt.length - 1; k++) f.glow(strut(s * 2.1 + bolt[k][0], bolt[k][1], s * 2.1 + bolt[k + 1][0], bolt[k + 1][1], 0.07, 0.04, 0.47, shade(BONE, 1.15)));
  }
  f.add('rock', rough(post(5.4, 1.0, 0, 3.85, 4.5, 0, STORM), 0.12, 135));
  for (let k = 0; k < 9; k++) f.add('snow', rough(ball(0.5 + (k % 3) * 0.15, -2.6 + k * 0.65, 4.95 + Math.sin(k * 2.3) * 0.25, (k % 2 ? 0.15 : -0.15), shade(STORM, 1.25), 1), 0.12, 140 + k)); // the thunderhead
  f.glow(strut(-0.3, 5.0, 0.15, 4.55, 0.06, 0.04, 0.55, ANOMALY.green));
}

/** The Black Wood: black trunks twisted like rope, a goat's horns curling out from the head of the gate, eyes of the Thousand Young in the knot between them, hooves at their roots. */
export function goat(f: Frame): void {
  const BLACK: Rgb = shade(BASE.charcoal, 1.9);
  for (const s of [-1, 1]) {
    f.add('wood', twisted(0.55, s * 2.05, 0, 4.0, 0, BLACK, s * 22, 0.3));
    f.add('hide', ring(0.75, 0.16, s * 1.6, 4.95, 0, BLACK, Math.PI * 1.35, s > 0 ? -0.6 : Math.PI - 0.75, 10)); // a horn, curling
    f.add('hide', spike([s * 2.3, 4.6, 0], [s * 2.7, 4.2, 0.1], 0.12, BLACK, 4));
    f.add('hide', blob(0.2, 1.2, 0.6, 1, s * 2.15, 0.1, 0.35, shade(BLACK, 0.8)));
    for (let k = 0; k < 3; k++) f.add('flesh', strut(s * (2.4 + k * 0.2), 4.0, s * (2.5 + k * 0.25), 2.6 - k * 0.5, 0.05, 0.05, 0.2 - k * 0.15, BLACK)); // tendrils hanging
  }
  f.add('wood', rough(post(4.6, 0.7, 0, 3.8, 4.3, 0, BLACK), 0.08, 150));
  f.add('flesh', rough(ball(0.55, 0, 4.6, 0, BLACK, 1), 0.15, 151));
  for (let k = 0; k < 5; k++) f.glow(ball(0.055, -0.3 + k * 0.15, 4.55 + (k % 2) * 0.18, 0.52, ANOMALY.magenta));
}

/** The Pale Lattice: shards of crystal grown up in clusters for jambs, a lattice of thin rods across the head, a few shards lit from within. */
export function crystal(f: Frame): void {
  const shard = (x: number, y: number, z: number, h: number, w: number, tilt: number, c: Rgb): THREE.BufferGeometry =>
    lean(tint(new THREE.OctahedronGeometry(1, 0).scale(w, h, w).translate(x, y + h, z), c), tilt, x, y);
  for (const s of [-1, 1]) {
    f.add('snow', shard(s * 2.05, 0, 0, 2.1, 0.42, s * -4, PALE));
    f.add('snow', shard(s * 2.5, 0, 0.3, 1.4, 0.3, s * -16, PALE));
    f.add('snow', shard(s * 2.4, 0, -0.35, 1.1, 0.28, s * -22, PALE));
    f.glow(shard(s * 1.95, 2.6, 0.1, 0.9, 0.2, s * 12, ANOMALY.green));
    f.add('snow', shard(s * 2.0, 3.4, 0, 0.75, 0.3, s * -30, PALE));
  }
  f.add('snow', post(4.7, 0.5, 0, 3.85, 4.1, 0, PALE));
  for (let k = 0; k < 7; k++) {
    const x = -2.4 + k * 0.8;
    for (const z of [0.25, -0.25]) {
      f.add('snow', strut(x, 4.1, x + 0.8, 5.0, 0.05, 0.05, z, PALE));
      f.add('snow', strut(x + 0.8, 4.1, x, 5.0, 0.05, 0.05, z, PALE));
    }
  }
  f.add('snow', post(5.6, 0.5, 0, 5.0, 5.12, 0, PALE));
}

/** The Piping Dark: organ pipes in ranks of graded height for jambs and head, their mouths lit in Cosmic Purple. */
export function pipes(f: Frame): void {
  const METAL: Rgb = shade(mixRgb(BASE.seaGrey, BASE.charcoal, 0.3), 1.45);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const [x, r, top] = [s * (1.85 + k * 0.33), 0.17 - k * 0.015, 5.6 - k * 0.65];
      f.add('slab', column(r, r, x, 0.4, top, k % 2 ? 0.08 : -0.08, METAL, 8));
      f.add('slab', column(r, r * 1.5, x, top, top + 0.25, k % 2 ? 0.08 : -0.08, shade(METAL, 1.15), 8)); // its flared bell
      f.glow(block(r * 1.1, 0.22, 0.03, x, 1.0 + k * 0.1, r + (k % 2 ? 0.1 : -0.06), ANOMALY.purple)); // its mouth
    }
    f.add('slab', post(1.9, 0.75, s * 2.55, 0, 0.4, 0, shade(METAL, 0.9)));
  }
  for (let k = 0; k < 3; k++) f.add('slab', column(0.12, 0.12, 0, -2.5, 2.5, (k - 1) * 0.12, METAL, 8).rotateZ(Math.PI / 2).translate(0, 3.98 + k * 0.26, 0)); // the head: pipes laid across
}

/** The Gate of Spheres: iridescent globes, great and small, clustered round the opening, some dull, some lit with all three wrong colours. */
export function spheres(f: Frame): void {
  const DULL: Rgb = shade(mixRgb(BASE.seaGrey, BASE.bone, 0.4), 1.2);
  const path = (t: number): [number, number] => { // up the left side, over, down the right
    if (t < 0.35) return [-2.05, (t / 0.35) * 3.8];
    if (t > 0.65) return [2.05, ((1 - t) / 0.35) * 3.8];
    const a = Math.PI - ((t - 0.35) / 0.3) * Math.PI;
    return [Math.cos(a) * 2.05, 3.8 + Math.sin(a) * 1.4];
  };
  for (let k = 0; k < 28; k++) {
    const [x, y] = path(k / 27);
    const r = 0.22 + ((k * 7) % 5) * 0.07;
    const z = ((k * 3) % 5) * 0.08 - 0.16;
    if (k % 3 === 0) f.glow(ball(r * 0.8, x, y + 0.2, z, GLOWS[k % GLOWS.length], 1));
    else f.add('stone', ball(r, x + (k % 2 ? 0.12 : -0.12), y + 0.2, z, DULL, 1));
  }
}

/** The Court at the Centre: a broken ring of stone about the opening bristling with spikes thrust every way, magenta burning in its cracks. */
export function chaos(f: Frame): void {
  const ROCK: Rgb = shade(mixRgb(BASE.charcoal, BASE.rust, 0.3), 1.7);
  for (const s of [-1, 1]) f.add('rock', rough(post(0.8, 0.8, s * 2.05, 0, 3.9, 0, ROCK), 0.15, 160 + s));
  f.add('rock', rough(post(4.9, 0.8, 0, 3.8, 4.4, 0, ROCK), 0.15, 162));
  for (let k = 0; k < 22; k++) {
    const t = k / 21;
    const [x, y] = t < 0.3 ? [-2.4, 0.4 + (t / 0.3) * 3.6] : t > 0.7 ? [2.4, 0.4 + ((1 - t) / 0.3) * 3.6] : [-2.4 + ((t - 0.3) / 0.4) * 4.8, 4.4];
    const [ox, oy] = t < 0.3 ? [-1, 0.2] : t > 0.7 ? [1, 0.2] : [x * 0.25, 1];
    const len = 0.6 + ((k * 13) % 7) * 0.18;
    f.add('rock', spike([x, y, ((k % 3) - 1) * 0.2], [x + ox * len, y + oy * len, ((k % 3) - 1) * 0.5], 0.13, ROCK, 4));
  }
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) f.glow(strut(s * (1.95 + (k % 2) * 0.15), 0.5 + k * 0.9, s * (2.1 - (k % 2) * 0.15), 1.1 + k * 0.9, 0.05, 0.05, 0.42, ANOMALY.magenta));
  f.glow(blob(0.18, 1.6, 1, 1, 0, 4.1, 0.42, ANOMALY.magenta));
}
