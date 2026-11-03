/**
 * The frames of the waking world's gates (round 104; data/gateFrames.ts says which gate wears which): each the look of the realm it
 * opens onto, built about the veil's opening (gateFrameKit.ts `OPENING`) from the kit's shapes. Its glyphs, eyes and lamps glow in
 * the anomaly hues, and only they: the stone, wood and ice are the near-colourless matter of the world.
 */

import { ANOMALY, BASE, mixRgb, type Rgb } from './palette';
import { ball, blob, block, column, fan, Frame, lean, post, ring, rough, shade, slab, spike, strut } from './gateFrameKit';

const GREY: Rgb = shade(BASE.seaGrey, 1.6);
const BONE: Rgb = BASE.bone;
const BRICK: Rgb = shade(mixRgb(BASE.rust, BASE.bone, 0.3), 1.25);
const DARK: Rgb = shade(mixRgb(BASE.charcoal, BASE.seaGrey, 0.4), 1.5);
const WOOD: Rgb = shade(mixRgb(BASE.rust, BASE.charcoal, 0.35), 1.7);
const ICE: Rgb = shade(mixRgb(BASE.bone, BASE.seaGrey, 0.35), 1.25);
const SAND: Rgb = shade(mixRgb(BASE.bone, BASE.rust, 0.25), 1.05);
const SLIME: Rgb = shade(mixRgb(BASE.seaGrey, ANOMALY.green, 0.12), 1.2);
const FLESH: Rgb = shade(mixRgb(BASE.rust, BASE.bone, 0.45), 1.1);

/** Miskatonic: brick piers with stone quoins on plinths, an entablature and a pediment bearing the university's seal. */
export function miskatonic(f: Frame): void {
  for (const s of [-1, 1]) {
    f.add('brick', post(0.75, 0.7, s * 2.03, 0.5, 3.9, 0, BRICK));
    f.add('stone', post(0.95, 0.85, s * 2.03, 0, 0.5, 0, BONE)); // the plinth
    for (let y = 0.7; y < 3.8; y += 0.62) f.add('stone', block(0.3, 0.26, 0.74, s * (2.03 + 0.24), y, 0, BONE)); // the quoins
    f.add('stone', post(0.92, 0.82, s * 2.03, 3.9, 4.08, 0, BONE)); // the capital
    f.add('stone', column(0.18, 0.12, s * 2.6, 4.9, 5.25, 0, BONE));
    f.add('stone', ball(0.17, s * 2.6, 5.38, 0, BONE));
  }
  f.add('stone', post(5.1, 0.8, 0, 4.08, 4.62, 0, BONE)); // the entablature
  f.add('stone', post(5.5, 0.95, 0, 4.62, 4.78, 0, BONE)); // its cornice
  f.add('stone', slab([[-2.7, 4.78], [2.7, 4.78], [0, 5.93]], 0.7, BONE)); // the pediment
  f.glow(ring(0.3, 0.04, 0, 5.2, 0.37, ANOMALY.purple));
  f.glow(ring(0.3, 0.04, 0, 5.2, -0.37, ANOMALY.purple));
  f.glow(block(4.9, 0.06, 0.84, 0, 4.35, 0, ANOMALY.purple));
}

/** The Mountains of Madness: dark slabs crusted with ice and hung with icicles under a cap of snow, the Elder Things' five-pointed star over them. */
export function antarctic(f: Frame): void {
  for (const s of [-1, 1]) {
    f.add('slab', lean(rough(post(0.8, 0.75, s * 2.05, 0, 4.1, 0, DARK), 0.08, 11 + s), s * -2.5, s * 2.05, 0));
    f.add('snow', rough(post(0.9, 0.85, s * 2.05, 4.1, 4.3, 0, ICE), 0.1, 3 + s));
    f.add('snow', rough(blob(0.75, 1, 0.45, 1, s * 2.35, 0.05, 0.2, ICE, 1), 0.12, 5 + s)); // the drift at its foot
    for (let k = 0; k < 4; k++) f.add('snow', spike([s * (1.75 + k * 0.15), 3.1 - k * 0.5, 0.42], [s * (1.75 + k * 0.15), 2.6 - k * 0.5, 0.44], 0.06, ICE, 4)); // ice down its face
  }
  f.add('slab', rough(post(5.4, 0.9, 0, 3.9, 4.55, 0, DARK), 0.08, 7));
  f.add('snow', rough(post(5.6, 1.0, 0, 4.55, 4.8, 0, ICE), 0.12, 9));
  for (let k = 0; k < 14; k++) {
    const x = -2.4 + (k * 4.8) / 13;
    const len = 0.12 + ((k * 37) % 9) * 0.035;
    for (const z of [0.42, -0.42]) f.add('snow', spike([x, 3.92, z], [x, 3.92 - len, z], 0.07, ICE, 4));
  }
  for (let k = 0; k < 5; k++) { // the star of the Old Ones
    const a = Math.PI / 2 + (k * Math.PI * 2) / 5;
    for (const z of [0.5, -0.5]) f.glow(strut(0, 5.55, Math.cos(a) * 0.55, 5.55 + Math.sin(a) * 0.55, 0.08, 0.04, z, ANOMALY.green));
  }
  f.add('slab', column(0.22, 0.22, 0, 4.8, 5.1, 0, DARK, 5));
}

/** Pnakotus: cyclopean basalt of the Great Race, a lintel of one stone banded with rectilinear glyphs, cones of their bodies standing by, sand drifted against it. */
export function pnakotic(f: Frame): void {
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) f.add('rock', rough(block(1.25 - k * 0.12, 1.35, 1.0 - k * 0.06, s * (2.27 - k * 0.04), 0.67 + k * 1.33, 0, DARK), 0.06, 20 + k * 3 + s));
    f.add('rock', column(0.75, 0.06, s * 3.55, 0, 2.6, 0.2, shade(DARK, 1.1), 6)); // a cone of the Great Race
    f.add('sand', rough(blob(0.9, 1.2, 0.35, 0.9, s * 2.6, 0, 0.45, SAND, 1), 0.1, 4 + s));
  }
  f.add('rock', rough(post(6.6, 1.25, 0, 4.0, 5.1, 0, DARK), 0.07, 33));
  for (let k = 0; k < 7; k++) { // the glyph band: a meander, stroke by stroke
    const x = -2.4 + k * 0.8;
    for (const z of [0.64, -0.64]) {
      f.glow(block(0.5, 0.06, 0.03, x, 4.3, z, ANOMALY.green));
      f.glow(block(0.06, 0.4, 0.03, x + 0.25 * (k % 2 ? 1 : -1), 4.5, z, ANOMALY.green));
      f.glow(block(0.5, 0.06, 0.03, x, 4.7, z, ANOMALY.green));
    }
  }
}

/** K'n-yan: round columns with a serpent of Yig wound up each, their heads reared over a stone arch. */
export function serpent(f: Frame): void {
  const SCALE: Rgb = shade(mixRgb(BASE.seaGrey, BASE.bone, 0.3), 1.15);
  for (const s of [-1, 1]) {
    f.add('stone', column(0.42, 0.36, s * 2.05, 0, 3.9, 0, GREY, 10));
    f.add('stone', post(1.1, 1.0, s * 2.05, 0, 0.35, 0, GREY));
    for (let k = 0; k < 34; k++) { // the coils, up and about
      const t = k / 33;
      const a = s * t * Math.PI * 6;
      f.add('hide', ball(0.13 + 0.05 * (1 - t), s * 2.05 + Math.cos(a) * 0.45, 0.3 + t * 3.8, Math.sin(a) * 0.45, SCALE));
    }
    f.add('hide', blob(0.26, 1.5, 0.75, 1, s * 1.75, 4.5, 0.28, SCALE)); // the head, reared
    f.glow(ball(0.06, s * 1.55, 4.53, 0.42, ANOMALY.purple));
    f.add('hide', spike([s * 1.32, 4.45, 0.3], [s * 0.95, 4.4, 0.35], 0.05, ANOMALY.magenta, 3));
  }
  f.add('stone', post(4.6, 0.75, 0, 3.8, 4.05, 0, GREY));
  f.add('stone', ring(1.95, 0.28, 0, 4.05, 0, GREY, Math.PI, 0, 14));
  f.add('stone', fan(1.95, 0, 4.05, 0, shade(GREY, 0.7)));
  f.glow(ring(0.9, 0.05, 0, 4.05, 0.05, ANOMALY.purple, Math.PI, 0, 10));
}

/** The Round Hills: a dolmen, two rough standing stones under a capstone, a spiral cut in it, lesser stones about its feet. */
export function dolmen(f: Frame): void {
  const ROCK: Rgb = shade(mixRgb(BASE.seaGrey, BASE.bone, 0.2), 1.25);
  for (const s of [-1, 1]) {
    f.add('rock', lean(rough(post(1.0, 0.8, s * 2.15, -0.2, 4.15, 0, ROCK), 0.18, 40 + s), s * 3, s * 2.15, 0));
    f.add('rock', rough(post(0.55, 0.5, s * 3.3, -0.1, 1.2, 0.6, ROCK), 0.15, 44 + s));
    f.add('rock', rough(post(0.45, 0.45, s * 3.0, -0.1, 0.7, -0.9, ROCK), 0.15, 46 + s));
  }
  f.add('rock', lean(rough(post(5.9, 1.2, 0.1, 4.0, 4.85, 0, ROCK), 0.2, 50), -2.5, 0, 4.4));
  for (let k = 0; k < 18; k++) { // the spiral
    const [a0, a1] = [k * 0.6, (k + 1) * 0.6];
    const [r0, r1] = [0.06 + k * 0.022, 0.06 + (k + 1) * 0.022];
    for (const z of [0.63, -0.63]) f.glow(strut(Math.cos(a0) * r0, 4.43 + Math.sin(a0) * r0, Math.cos(a1) * r1, 4.43 + Math.sin(a1) * r1, 0.05, 0.03, z, ANOMALY.purple));
  }
}

/** Yuggoth: stalks of fungus swelling into caps, a ribbed arch of chitin over them, the Mi-Go's brain cylinders at their feet. */
export function fungoid(f: Frame): void {
  const METAL: Rgb = shade(BASE.seaGrey, 1.25);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 9; k++) f.add('flesh', rough(ball(0.38 - k * 0.012, s * (2.0 + Math.sin(k * 1.3) * 0.08), 0.25 + k * 0.45, 0, FLESH, 1), 0.06, 60 + k + s * 9));
    f.add('flesh', column(0.08, 0.75, s * 2.0, 4.15, 4.5, 0, FLESH, 9)); // the cap
    f.add('flesh', column(0.75, 0.5, s * 2.0, 4.5, 4.62, 0, shade(FLESH, 0.85), 9));
    for (let k = 0; k < 5; k++) f.glow(ball(0.05, s * 2.0 + Math.cos(k * 1.26) * 0.55, 4.42, Math.sin(k * 1.26) * 0.55, ANOMALY.green));
    f.add('slab', column(0.24, 0.24, s * 3.05, 0, 0.95, 0.3, METAL, 8)); // a cylinder
    f.add('slab', column(0.27, 0.27, s * 3.05, 0.95, 1.05, 0.3, shade(METAL, 1.2), 8));
    f.glow(block(0.12, 0.12, 0.05, s * 3.05, 0.6, 0.55, ANOMALY.green));
  }
  for (let k = 0; k < 7; k++) f.add('flesh', ring(2.2, 0.17, 0, 3.85, 0, shade(FLESH, 0.8), Math.PI / 8.5, (k * Math.PI) / 7 + 0.03, 4)); // the ribs, a gap between each
  f.add('flesh', post(4.5, 0.6, 0, 3.8, 4.0, 0, shade(FLESH, 0.8)));
}

/** Akeley's hills: a farm's timber gate on fieldstone, braced, under a little shingled gable with a hex sign on it and a lantern. */
export function farmstead(f: Frame): void {
  const FIELD: Rgb = shade(mixRgb(BASE.seaGrey, BASE.bone, 0.25), 1.2);
  for (const s of [-1, 1]) {
    f.add('stone', rough(post(0.95, 0.9, s * 2.0, 0, 0.7, 0, FIELD), 0.12, 70 + s));
    f.add('wood', post(0.38, 0.38, s * 1.86, 0.7, 4.3, 0, WOOD));
    f.add('wood', strut(s * 1.86, 3.2, s * 1.2, 3.95, 0.16, 0.2, 0, WOOD)); // the knee brace
  }
  f.add('wood', post(4.6, 0.42, 0, 3.95, 4.32, 0, WOOD));
  for (const s of [-1, 1]) f.add('shingle', strut(s * 2.75, 4.25, 0, 5.4, 0.16, 1.1, 0, shade(WOOD, 0.8)).rotateZ(0)); // the roof's two slopes
  f.add('wood', fan(1.35, 0, 4.3, 0, shade(WOOD, 1.1), Math.PI / 2 - 1.12, 2.24));
  f.glow(ring(0.3, 0.035, 0, 4.72, 0.06, ANOMALY.purple));
  for (let k = 0; k < 4; k++) f.glow(strut(-Math.cos((k * Math.PI) / 4) * 0.28, 4.72 - Math.sin((k * Math.PI) / 4) * 0.28, Math.cos((k * Math.PI) / 4) * 0.28, 4.72 + Math.sin((k * Math.PI) / 4) * 0.28, 0.04, 0.03, 0.07, ANOMALY.purple));
  f.add('stone', block(0.18, 0.26, 0.18, 2.3, 3.55, 0.35, DARK)); // the lantern on its hook
  f.glow(block(0.1, 0.14, 0.1, 2.3, 3.55, 0.35, ANOMALY.green));
}

/** R'lyeh: cyclopean slabs of greenish stone at angles that are wrong, the lintel askew, a slab jutting where none should, slime down them, tentacles in relief. */
export function cyclopean(f: Frame): void {
  f.add('slab', lean(rough(post(1.15, 1.1, -2.3, -0.3, 4.4, 0, SLIME), 0.1, 80), 7, -2.3, 0)); // the left leans away, the right in: neither is upright
  f.add('slab', lean(rough(post(1.0, 1.2, 2.25, -0.3, 4.1, 0.1, SLIME), 0.1, 81), 3, 2.25, 0));
  f.add('slab', lean(rough(post(6.4, 1.3, 0.2, 3.95, 4.9, 0, SLIME), 0.12, 82), 6, 0, 4.4));
  f.add('slab', lean(rough(post(1.8, 0.9, -2.4, 4.7, 5.6, -0.1, SLIME), 0.1, 83), -24, -2.4, 5.1)); // the slab that juts at an angle no geometry allows
  f.add('rot', rough(post(0.5, 1.15, -2.0, 0, 2.8, 0.05, shade(SLIME, 0.7)), 0.12, 84));
  for (const s of [-1, 1]) for (const z of [0.62, -0.62]) {
    for (let k = 0; k < 4; k++) f.glow(ring(0.35 + k * 0.08, 0.035, s * 2.25, 1.2 + k * 0.75, z, ANOMALY.green, Math.PI * 0.9, s > 0 ? k : k + 1.6, 7));
  }
}

/** Devil Reef: rotted pilings crusted with barnacles, a beam lashed across them, coral grown up over it, a fish's head for a keystone with eyes that never shut. */
export function reef(f: Frame): void {
  const ROT: Rgb = shade(mixRgb(BASE.seaGrey, BASE.charcoal, 0.3), 1.6);
  const SHELL: Rgb = shade(BASE.bone, 0.85);
  for (const s of [-1, 1]) {
    f.add('rot', rough(column(0.33, 0.28, s * 1.95, 0, 4.3, 0, ROT, 7), 0.07, 90 + s));
    f.add('rot', rough(column(0.24, 0.2, s * 2.6, 0, 3.2, -0.25, ROT, 7), 0.07, 92 + s));
    f.add('rot', rough(column(0.2, 0.16, s * 3.05, 0, 2.2, 0.2, ROT, 6), 0.07, 94 + s));
    for (let k = 0; k < 16; k++) f.add('rock', ball(0.07 + (k % 3) * 0.025, s * (1.95 + Math.cos(k * 2.4) * 0.33), 0.15 + (k % 6) * 0.22, Math.sin(k * 2.4) * 0.33, SHELL));
    for (let k = 0; k < 3; k++) f.add('rock', spike([s * (2.2 + k * 0.35), 4.3, 0], [s * (2.3 + k * 0.55), 5.0 + k * 0.15, 0.1 * k], 0.08, SHELL, 4)); // coral
    f.add('cloth', strut(s * 1.95, 3.6, s * 2.6, 2.9, 0.05, 0.05, 0.3, shade(BONE, 0.7))); // a rope
  }
  f.add('wood', post(5.2, 0.45, 0, 3.85, 4.25, 0, ROT));
  f.add('rot', blob(0.42, 1.25, 0.8, 1, 0, 4.45, 0.15, ROT)); // the fish's head
  f.add('rot', spike([0, 4.55, 0], [0, 5.1, -0.1], 0.18, ROT, 3)); // its fin
  for (const s of [-1, 1]) f.glow(ball(0.08, s * 0.28, 4.48, 0.5, ANOMALY.green));
}
