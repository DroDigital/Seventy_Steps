/**
 * The investigator (spec §3B), in detail: a 1920s field coat with lapels, shoulders and a flared
 * skirt in two panels that swing with the legs, shirt and tie under a rust scarf, a belt with its
 * buckle and a satchel on a strap; a fedora with its band over short hair and a face with brow,
 * nose and ears; leather gloves; the sword-cane with its silver grip and ferrule; the revolver, in its
 * holster at the belt until it is drawn (round 22); trousers and shoes; and the lantern in its cage,
 * hung from the belt by a strap through its ring. Arms bend at the elbow and legs at
 * the knee. Large value blocks still carry the read: dark coat, lighter sleeves, pale face.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LANTERN } from '../data/tuning';
import { ARMS } from './armsMeshes';
import { cylinder, part, shade, skeleton, type Figure } from './figures';
import { bevel, coatForms, faceForms, fist, foreArm, prism, shin, shoe, thigh, upperArm } from './bodyKit';
import { box, tint } from './meshKit';
import { BASE, mixRgb, type Rgb } from './palette';

const slab = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb, rz = 0, rx = 0): THREE.BufferGeometry =>
  box(w, h, d, 0, 0, 0, c).rotateX(rx).rotateZ(rz).translate(x, y, z);

/**
 * One half of the coat's skirt, a closed flared shell from the belt to the knee that hangs at the hip
 * and swings with its thigh (poses.ts), so a striding leg stays inside the coat.
 */
export function skirtPanel(side: 1 | -1, c: Rgb): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = 0.5 - p.getY(i); // 0 at the belt, 1 at the hem
    const out = p.getX(i) + 0.5; // 0 at the middle, 1 at the side
    p.setXYZ(i, side * (0.006 + out * (0.205 + 0.035 * t)), 0.03 - 0.46 * t, p.getZ(i) * 2 * (0.125 + 0.045 * t));
  }
  g.computeVertexNormals();
  return tint(g, c);
}

/**
 * A short back and sides under the hat (playtest round 10: it was a slab stuck on the back of the
 * head): it wraps the skull close from the brim down, above and behind the ears, tapers in to the
 * nape, and leaves short sideburns before the ears.
 */
function hairGeometry(c: Rgb): THREE.BufferGeometry[] {
  return [
    box(0.206, 0.09, 0.144, 0, 0.195, -0.032, c), // from the brim down to the ears, round the back and sides
    box(0.2, 0.045, 0.072, 0, 0.1275, -0.064, c), // behind the ears...
    box(0.14, 0.03, 0.036, 0, 0.09, -0.078, c), // ...narrowing to the nape
    box(0.198, 0.035, 0.022, 0, 0.1325, 0.039, c), // sideburns
  ];
}

export function investigator(): Figure {
  const f = skeleton('humanoid', { hip: 0.92, shoulder: [0.28, 0.58], hipX: 0.11, neck: [0.64, 0], leg: 0.9, thigh: 0.42, upper: 0.3, fore: 0.28, ankle: 0.07 });
  f.character = 'player';
  const coat = shade(mixRgb(BASE.charcoal, BASE.seaGrey, 0.1), 2);
  const facing = shade(coat, 0.78);
  const sleeve = shade(mixRgb(BASE.charcoal, BASE.seaGrey, 0.3), 2); // a step lighter, so attack and block poses read
  const dark = shade(BASE.charcoal, 2);
  const pale = shade(BASE.bone, 1.3); // skin under the lantern's light, never brighter than its flame (playtest round 5)
  const shirt = shade(BASE.bone, 1.3);
  const leather = shade(mixRgb(BASE.rust, BASE.charcoal, 0.45), 1.7);
  const brass = shade(mixRgb(BASE.bone, BASE.rust, 0.4), 1.4);
  const scarf = shade(mixRgb(BASE.rust, BASE.charcoal, 0.2), 1.6);
  const silver = shade(BASE.bone, 1.25);
  const hair = shade(mixRgb(BASE.charcoal, BASE.rust, 0.3), 1.4); // dark brown, apart from the hat

  for (const side of [-1, 1] as const) {
    const panel = new THREE.Group();
    f.body.add(panel);
    f.skirt.push(panel);
    part(f, panel, skirtPanel(side, coat), 'cloth');
  }
  part(f, f.torso, mergeGeometries([
    ...coatForms(coat), // waist, chest and sloping shoulders
    slab(0.075, 0.27, 0.022, -0.075, 0.45, 0.13, facing, -0.32), // lapels
    slab(0.075, 0.27, 0.022, 0.075, 0.45, 0.13, facing, 0.32),
    slab(0.05, 0.05, 0.024, -0.115, 0.545, 0.128, shade(facing, 1.08), -0.5), // their notches
    slab(0.05, 0.05, 0.024, 0.115, 0.545, 0.128, shade(facing, 1.08), 0.5),
    box(0.07, 0.11, 0.02, 0, 0.53, 0.128, shirt), // shirt in the V...
    box(0.035, 0.17, 0.02, 0, 0.47, 0.135, shade(BASE.rust, 1.1)), // ...and the tie
    bevel(0.03, 0.03, 0.02, 0.05, 0.3, 0.127, brass, 0.006), // buttons
    bevel(0.03, 0.03, 0.02, 0.05, 0.19, 0.127, brass, 0.006),
    bevel(0.075, 0.03, 0.03, -0.13, 0.17, 0.126, facing, 0.008), // pocket flaps
    bevel(0.075, 0.03, 0.03, 0.14, 0.17, 0.126, facing, 0.008),
    bevel(0.11, 0.022, 0.12, -0.2, 0.625, 0, leather, 0.008), // epaulettes: a field coat's
    bevel(0.11, 0.022, 0.12, 0.2, 0.625, 0, leather, 0.008),
    bevel(0.012, 0.42, 0.012, 0, 0.3, -0.132, shade(coat, 0.7), 0.003), // the back seam
    bevel(0.44, 0.06, 0.275, 0, 0.0, 0, leather, 0.014), // belt
    bevel(0.065, 0.055, 0.025, 0, 0.0, 0.145, brass, 0.008), // buckle
    bevel(0.3, 0.11, 0.07, 0, 0.665, -0.115, facing, 0.015).rotateX(0), // the coat's collar, turned up behind the neck
    bevel(0.07, 0.1, 0.2, -0.14, 0.655, -0.01, facing, 0.012), // ...and at its sides
    bevel(0.07, 0.1, 0.2, 0.14, 0.655, -0.01, facing, 0.012),
    bevel(0.215, 0.075, 0.215, 0, 0.64, 0.005, scarf, 0.02), // scarf about the neck...
    bevel(0.07, 0.07, 0.05, 0.05, 0.595, 0.12, shade(scarf, 1.12), 0.012), // ...tied in a knot at the front...
    slab(0.085, 0.3, 0.032, 0.07, 0.46, -0.14, scarf, 0.12), // ...its tail down the back
    slab(0.045, 0.66, 0.022, 0, 0.33, 0.133, leather, 0.72), // satchel strap
    bevel(0.17, 0.15, 0.085, -0.2, -0.06, 0.04, leather, 0.014), // satchel, on the right hip
    bevel(0.18, 0.04, 0.095, -0.2, 0.02, 0.04, shade(leather, 0.8), 0.01), // its flap
  ]), 'cloth');
  const cage = shade(BASE.charcoal, 1.6);
  const [lx, ly, lz] = [0.29, -0.235, 0.02]; // the lantern hangs low at the left side of the belt, clear of the coat and the swinging arm
  part(f, f.torso, mergeGeometries([ // its cage
    box(0.13, 0.025, 0.13, lx, ly + 0.08, lz, cage),
    box(0.13, 0.025, 0.13, lx, ly - 0.08, lz, cage),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.015, 0.16, 0.015, lx + sx * 0.055, ly, lz + sz * 0.055, cage))),
    tint(new THREE.TorusGeometry(0.035, 0.008, 4, 8).translate(lx, ly + 0.12, lz), cage), // the bail ring...
    box(0.03, 0.075, 0.05, 0.225, -0.03, lz, leather), // ...and, round 22, what it hangs from: a loop on the belt's end...
    slab(0.022, 0.09, 0.024, (0.225 + lx) / 2, ly + 0.15, lz, leather, Math.atan2(lx - 0.225, 0.055)), // ...a strap down and out to the ring
    box(0.026, 0.026, 0.03, 0.225, -0.07, lz, brass), // a brass clip where they meet
  ]), 'cloth');
  part(f, f.torso, box(0.09, 0.12, 0.09, lx, ly, lz, LANTERN.color), 'cloth', 1); // its flame (its light: lantern.ts)
  f.flame = new THREE.Object3D();
  f.flame.position.set(lx, ly, lz);
  f.torso.add(f.flame);

  part(f, f.head, mergeGeometries([
    ...faceForms(pale),
    box(0.05, 0.018, 0.02, -0.05, 0.14, 0.114, shade(BASE.bone, 1.2)), box(0.05, 0.018, 0.02, 0.05, 0.14, 0.114, shade(BASE.bone, 1.2)), // eyes, in the hat's shadow
    box(0.02, 0.02, 0.022, -0.05, 0.14, 0.117, dark), box(0.02, 0.02, 0.022, 0.05, 0.14, 0.117, dark),
    bevel(0.18, 0.026, 0.03, 0, 0.17, 0.108, shade(BASE.charcoal, 1.3), 0.008), // brow in the hat's shadow
    ...hairGeometry(hair),
  ]), 'cloth');
  part(f, f.head, mergeGeometries([ // fedora: a brim, a crown pinched in the middle, a band
    cylinder(0.225, 0.225, 0.022, 0.25, dark),
    prism(0, 0.325, 0, 0.27, 0.28, 0.2, 0.25, 0.14, dark, 0.03),
    bevel(0.03, 0.05, 0.2, 0, 0.395, 0, shade(dark, 0.75), 0.01), // the pinch
    cylinder(0.138, 0.142, 0.035, 0.28, shade(BASE.rust, 0.9)),
  ]), 'cloth');

  // Arms: the upper sleeve at the shoulder, the forearm and cuff from the elbow, the gloved hand at the wrist.
  for (const [arm, elbow, hand] of [[f.armR, f.elbowR, f.handR], [f.armL, f.elbowL, f.handL]]) {
    part(f, arm, upperArm(sleeve), 'cloth');
    part(f, elbow, mergeGeometries(foreArm(shade(sleeve, 0.94), facing, shade(facing, 1.25))), 'cloth');
    part(f, hand, mergeGeometries(fist(leather)), 'cloth');
  }
  const cane = part(f, f.handR, mergeGeometries([ // the sword-cane: silver grip, shaft, ferrule
    box(0.035, 0.8, 0.035, 0, -0.42, 0.02, shade(BASE.bone, 0.9)),
    box(0.11, 0.035, 0.04, 0, -0.005, 0.02, silver),
    box(0.045, 0.06, 0.045, 0, -0.83, 0.02, silver),
  ]), 'wood');
  f.arms = { cane }; // and the found weapons (armsMeshes.ts), each shown when in hand
  for (const [id, [geo, texture]] of Object.entries(ARMS)) (f.arms[id] = part(f, f.handR, geo(), texture)).visible = false;
  f.gun = part(f, f.handL, mergeGeometries([ // the revolver in the hand, its barrel along the arm: drawn only for a shot or a reload
    box(0.045, 0.1, 0.06, 0, -0.08, 0.035, shade(BASE.rust, 0.9)),
    box(0.055, 0.07, 0.08, 0, -0.14, 0.03, dark),
    box(0.028, 0.14, 0.028, 0, -0.22, 0.03, dark),
  ]), 'cloth');
  f.gun.visible = false;
  // Its holster (round 22), on the belt at the front of the left hip, outside the coat's skirt, the grip standing out of it.
  const [hx, hz] = [0.15, 0.185];
  part(f, f.torso, mergeGeometries([
    box(0.066, 0.15, 0.076, hx, -0.12, hz, leather), // the pouch
    box(0.036, 0.095, 0.022, hx, -0.005, 0.146, leather), // its tab over the belt
    box(0.07, 0.02, 0.08, hx, -0.045, hz, shade(leather, 0.8)), // the welt at its mouth
  ]), 'cloth');
  f.holstered = part(f, f.torso, mergeGeometries([
    slab(0.044, 0.075, 0.052, hx, -0.01, hz - 0.006, shade(BASE.rust, 0.9), 0, 0.3), // the grip, leaning back from the mouth
    box(0.024, 0.026, 0.05, hx, 0.032, hz - 0.03, dark), // the hammer
  ]), 'cloth');
  f.flash = part(f, f.handL, box(0.16, 0.16, 0.16, 0, -0.32, 0.03, BASE.bone), 'flesh', 1);
  f.flash.visible = false;
  // Legs: the thigh at the hip, the shin and turn-up from the knee (0.42 m down), the shoe at the ankle (the soles 0.9 m below the hip).
  for (const [leg, knee, foot] of [[f.legR, f.kneeR, f.footR], [f.legL, f.kneeL, f.footL]]) {
    part(f, leg, thigh(dark), 'cloth');
    part(f, knee, mergeGeometries(shin(dark, shade(dark, 0.85), leather)), 'cloth');
    part(f, foot, mergeGeometries(shoe(leather, shade(BASE.charcoal, 0.9))), 'cloth');
  }
  return f;
}
