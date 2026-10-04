/**
 * The people met in the dream as figures (render only), built like the investigator from large blocks
 * but each their own (round 35: they were a coat, a head and a hat in five colours; now each has what
 * the story gives them, and a coat with a collar, lapels, buttons, a belt and tails that swing as
 * they walk; a face with brows, nose, eyes, ears, a moustache or a beard; a hat with its band; hair
 * cut one way or another; boots; gloves; and, by who they are, spectacles, a watch chain, a satchel,
 * a doctor's bag, a cane, a pipe, a flask, a shawl, a conquistador's morion and cuirass, a sailor's
 * knitted cap, a priest's tall hat and staff). Unarmed, and without the investigator's lantern.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ACTS, SEATED } from '../data/npcActs';
import { npcDef, type NpcLook } from '../data/npcs';
import { bevel, coatForms, faceForms, fist, foreArm, prism, shin, shoe, thigh, upperArm } from './bodyKit';
import { cylinder, part, shade, skeleton, type Figure } from './figures';
import { skirtPanel } from './investigator';
import { addProps } from './npcProps';
import { box, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, type Rgb } from './palette';

const COATS: Readonly<Record<NpcLook['coat'], Rgb>> = {
  tweed: mixRgb(BASE.rust, BASE.bone, 0.35),
  black: mixRgb(BASE.charcoal, BASE.seaGrey, 0.05),
  grey: mixRgb(BASE.seaGrey, BASE.charcoal, 0.35),
  rust: mixRgb(BASE.rust, BASE.charcoal, 0.2),
  robe: mixRgb(BASE.bone, BASE.seaGrey, 0.35),
};
const HAIR: Readonly<Record<NpcLook['hair'], Rgb>> = { grey: mixRgb(BASE.bone, BASE.seaGrey, 0.5), dark: BASE.charcoal, white: BASE.bone };

type Cut = 'combed' | 'short' | 'wild' | 'long' | 'bald';
type Item = 'spectacles' | 'chain' | 'satchel' | 'bag' | 'cane' | 'pipe' | 'flask' | 'shawl' | 'morion' | 'cuirass' | 'knit' | 'staff' | 'scarf' | 'braces' | 'gloves' | 'moustache';
/** What each is, beyond their coat, hat and beard: their hair, how pale, a waistcoat's colour, and what they carry or wear. */
const WHO: Readonly<Record<string, { cut: Cut; skin?: number; vest?: Rgb; tie?: Rgb; build?: readonly [height: number, width: number]; items: readonly Item[] }>> = {
  peaslee: { build: [1.02, 0.96], cut: 'combed', vest: [0.42, 0.34, 0.2], tie: [0.3, 0.16, 0.14], items: ['spectacles', 'chain', 'moustache'] },
  gilman: { build: [1.03, 0.9], cut: 'wild', skin: 0.92, tie: [0.28, 0.3, 0.34], items: ['satchel', 'scarf'] },
  morgan: { build: [0.99, 1.08], cut: 'short', vest: [0.3, 0.3, 0.32], tie: [0.2, 0.2, 0.22], items: ['bag', 'gloves', 'moustache'] },
  kuranes: { build: [1.07, 0.93], cut: 'long', skin: 1.04, items: ['staff'] },
  zadok: { build: [0.92, 0.98], cut: 'wild', skin: 0.84, items: ['flask', 'pipe', 'braces'] },
  wilmarth: { build: [1.0, 0.94], cut: 'combed', vest: [0.3, 0.34, 0.3], tie: [0.34, 0.2, 0.18], items: ['spectacles', 'satchel', 'scarf'] },
  willett: { build: [0.98, 1.0], cut: 'short', vest: [0.2, 0.2, 0.24], tie: [0.22, 0.22, 0.24], items: ['bag', 'chain'] },
  curtis: { build: [1.02, 1.14], cut: 'wild', skin: 0.86, items: ['braces', 'pipe'] },
  dyer: { build: [1.05, 1.1], cut: 'short', vest: [0.34, 0.3, 0.26], tie: [0.3, 0.3, 0.34], items: ['spectacles', 'gloves', 'scarf', 'moustache'] },
  nathaniel: { build: [0.97, 0.95], cut: 'combed', skin: 0.94, vest: [0.4, 0.32, 0.22], items: ['spectacles', 'cane', 'chain'] },
  zamacona: { build: [0.95, 1.1], cut: 'short', skin: 0.82, items: ['morion', 'cuirass'] },
  johansen: { build: [1.0, 1.08], cut: 'short', skin: 0.88, items: ['knit', 'braces'] },
  akeley: { build: [1.01, 0.88], cut: 'wild', skin: 0.9, items: ['shawl', 'cane'] },
  carter: { build: [1.04, 0.96], cut: 'combed', vest: [0.26, 0.22, 0.3], tie: [0.36, 0.14, 0.18], items: ['satchel', 'cane', 'gloves'] },
  nasht: { cut: 'long', skin: 0.96, items: ['staff'] },
};

const slab = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb, rz = 0): THREE.BufferGeometry => box(w, h, d, 0, 0, 0, c).rotateZ(rz).translate(x, y, z);

function hat(look: NpcLook, dark: Rgb, band: Rgb): THREE.BufferGeometry | null {
  switch (look.hat) {
    case 'fedora':
      return mergeGeometries([cylinder(0.215, 0.215, 0.025, 0.26, dark), cylinder(0.12, 0.135, 0.14, 0.33, dark), box(0.03, 0.03, 0.2, 0, 0.395, 0, shade(dark, 0.8)), cylinder(0.138, 0.138, 0.035, 0.295, band)]);
    case 'bowler':
      return mergeGeometries([cylinder(0.17, 0.17, 0.025, 0.26, dark), tint(new THREE.SphereGeometry(0.125, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.27, 0.01), dark), cylinder(0.128, 0.128, 0.03, 0.285, band)]);
    case 'cap':
      return mergeGeometries([box(0.24, 0.07, 0.25, 0, 0.285, 0, dark), box(0.2, 0.025, 0.12, 0, 0.255, 0.16, shade(dark, 0.85)), box(0.245, 0.03, 0.255, 0, 0.255, 0, shade(dark, 0.9))]);
    case 'band':
      return mergeGeometries([box(0.23, 0.04, 0.24, 0, 0.235, 0.01, shade(ANOMALY.green, 0.8)), box(0.05, 0.05, 0.03, 0, 0.24, 0.135, shade(ANOMALY.green, 1.1))]);
    default:
      return null;
  }
}

/** Hair, cut one way or another, over a skull of 0.2 × 0.24 (the hat sits on it). */
function hairOf(cut: Cut, c: Rgb): THREE.BufferGeometry[] {
  if (cut === 'bald') return [box(0.06, 0.12, 0.04, -0.105, 0.13, -0.03, c), box(0.06, 0.12, 0.04, 0.105, 0.13, -0.03, c)];
  const cap = [box(0.212, 0.075, 0.15, 0, 0.215, -0.03, c), box(0.205, 0.1, 0.06, 0, 0.15, -0.085, c)];
  if (cut === 'combed') return [...cap, box(0.216, 0.03, 0.05, 0, 0.245, 0.06, shade(c, 1.1)), box(0.03, 0.09, 0.14, -0.108, 0.17, -0.01, c), box(0.03, 0.09, 0.14, 0.108, 0.17, -0.01, c)];
  if (cut === 'wild') return [...cap, box(0.07, 0.05, 0.06, -0.09, 0.265, 0.02, c), box(0.08, 0.06, 0.06, 0.07, 0.275, -0.02, c), box(0.04, 0.12, 0.1, -0.12, 0.14, -0.06, c), box(0.04, 0.12, 0.1, 0.12, 0.14, -0.06, c)];
  if (cut === 'long') return [...cap, box(0.23, 0.3, 0.05, 0, 0.04, -0.12, c), box(0.04, 0.26, 0.12, -0.12, 0.06, -0.03, c), box(0.04, 0.26, 0.12, 0.12, 0.06, -0.03, c)];
  return [...cap, box(0.03, 0.06, 0.12, -0.108, 0.16, -0.02, c), box(0.03, 0.06, 0.12, 0.108, 0.16, -0.02, c)];
}

/** The person `id` as a figure (a plain grey stranger if the id is unknown). */
export function npcFigure(id: string): Figure {
  const look: NpcLook = npcDef(id)?.look ?? { coat: 'grey', hat: 'none', hair: 'dark' };
  const who = WHO[id] ?? { cut: 'short' as Cut, items: [] as readonly Item[] };
  const has = (i: Item): boolean => who.items.includes(i);
  const robe = look.coat === 'robe';
  const f = skeleton('humanoid', { hip: 0.9, hunch: look.stoop ?? 0, shoulder: [0.27, 0.57], hipX: 0.11, neck: [0.63, 0], leg: 0.88, thigh: 0.42, upper: 0.3, fore: 0.28 });
  const coatC = shade(COATS[look.coat], 2);
  const sleeve = shade(COATS[look.coat], 2.3);
  const facing = shade(coatC, 0.78);
  const dark = shade(BASE.charcoal, 2);
  const trouser = shade(mixRgb(BASE.charcoal, COATS[look.coat], 0.35), 1.9);
  const pale = shade(BASE.bone, 1.9 * (who.skin ?? 1));
  const hair = shade(HAIR[look.hair], 1.8);
  const shirt = shade(BASE.bone, 1.7);
  const leather = shade(mixRgb(BASE.rust, BASE.charcoal, 0.5), 1.7);
  const brass = shade(mixRgb(BASE.bone, BASE.rust, 0.4), 1.5);
  const steel = shade(BASE.seaGrey, 1.9);
  const vest = who.vest ? shade(who.vest, 1.7) : null;

  // The coat: chest, shoulders, waist, lapels, collar, shirt, tie, waistcoat, buttons, belt; a robe hangs whole.
  const torso = [
    ...coatForms(coatC, { robe }),
    bevel(0.24, 0.05, 0.17, 0, 0.635, 0.01, shirt, 0.012), // the collar
    ...(robe ? [bevel(0.46, 0.07, 0.3, 0, 0.1, 0, facing, 0.015), bevel(0.55, 0.06, 0.36, 0, -0.84, 0, facing, 0.015), bevel(0.3, 0.3, 0.02, 0, 0.1, 0.16, shade(facing, 0.85), 0.006), // hem trim, and the sash's hanging end
       bevel(0.06, 0.55, 0.02, 0, 0.3, 0.135, facing, 0.006)] : [
      slab(0.075, 0.27, 0.022, -0.075, 0.45, 0.13, facing, -0.32), slab(0.075, 0.27, 0.022, 0.075, 0.45, 0.13, facing, 0.32), // lapels
      box(0.08, 0.12, 0.02, 0, 0.53, 0.128, shirt), ...(vest ? [bevel(0.2, 0.3, 0.02, 0, 0.3, 0.128, vest, 0.006)] : []),
      ...(who.tie ? [box(0.035, 0.17, 0.02, 0, 0.47, 0.137, shade(who.tie, 1.5))] : []),
      bevel(0.03, 0.03, 0.02, 0.06, 0.3, 0.14, brass, 0.006), bevel(0.03, 0.03, 0.02, 0.06, 0.2, 0.14, brass, 0.006),
      bevel(0.075, 0.03, 0.03, -0.13, 0.17, 0.126, facing, 0.008), bevel(0.075, 0.03, 0.03, 0.14, 0.17, 0.126, facing, 0.008), // pocket flaps
      bevel(0.012, 0.42, 0.012, 0, 0.3, -0.132, shade(coatC, 0.72), 0.003), // the back seam
      bevel(0.43, 0.05, 0.27, 0, 0.0, 0, leather, 0.012), bevel(0.06, 0.05, 0.025, 0, 0.0, 0.145, brass, 0.008),
    ]),
  ];
  if (has('chain')) torso.push(slab(0.1, 0.012, 0.012, -0.05, 0.28, 0.138, brass, -0.35), box(0.03, 0.04, 0.012, -0.1, 0.25, 0.14, brass));
  if (has('braces')) torso.push(box(0.03, 0.55, 0.02, -0.09, 0.32, 0.13, leather), box(0.03, 0.55, 0.02, 0.09, 0.32, 0.13, leather));
  if (has('scarf')) torso.push(box(0.28, 0.07, 0.26, 0, 0.63, 0, shade(mixRgb(BASE.rust, BASE.charcoal, 0.4), 1.6)), slab(0.07, 0.3, 0.025, 0.07, 0.46, 0.14, shade(mixRgb(BASE.rust, BASE.charcoal, 0.4), 1.6), 0.1));
  if (has('shawl')) { // draped over the shoulders and down the back, its fringe at the hem
    const w = shade(mixRgb(BASE.rust, BASE.bone, 0.25), 1.6);
    torso.push(prism(0, 0.55, 0, 0.62, 0.36, 0.36, 0.27, 0.17, w, 0.035), prism(0, 0.33, -0.15, 0.36, 0.05, 0.4, 0.05, 0.4, shade(w, 0.92), 0.02), bevel(0.38, 0.03, 0.06, 0, 0.12, -0.15, shade(w, 0.7), 0.01));
  }
  if (has('cuirass')) { // a breastplate with its ridge and rims, and the pauldrons
    torso.push(prism(0, 0.4, 0.01, 0.4, 0.27, 0.47, 0.3, 0.4, steel, 0.03), bevel(0.04, 0.34, 0.05, 0, 0.4, 0.165, shade(steel, 1.2), 0.012), bevel(0.46, 0.03, 0.31, 0, 0.215, 0.01, shade(steel, 0.8), 0.01));
    torso.push(prism(-0.27, 0.6, 0, 0.16, 0.2, 0.12, 0.16, 0.08, shade(steel, 0.95), 0.02), prism(0.27, 0.6, 0, 0.16, 0.2, 0.12, 0.16, 0.08, shade(steel, 0.95), 0.02));
  }
  if (has('satchel')) torso.push(slab(0.045, 0.66, 0.02, 0, 0.33, 0.131, leather, 0.72), box(0.17, 0.15, 0.08, -0.2, -0.06, 0.04, leather), box(0.18, 0.03, 0.09, -0.2, 0.02, 0.04, shade(leather, 0.8)));
  if (has('bag')) torso.push(box(0.24, 0.17, 0.1, 0.27, -0.28, 0.0, dark), box(0.26, 0.03, 0.11, 0.27, -0.19, 0.0, shade(dark, 1.2)), box(0.03, 0.05, 0.04, 0.27, -0.16, 0.04, brass));
  if (has('flask')) torso.push(box(0.06, 0.14, 0.04, -0.2, -0.05, 0.1, steel), box(0.03, 0.03, 0.03, -0.2, 0.04, 0.1, brass));
  if (has('staff')) torso.push(box(0.04, 1.5, 0.04, 0.34, -0.2, 0.1, shade(BASE.bone, 0.9)), box(0.1, 0.08, 0.08, 0.34, 0.58, 0.1, brass));
  part(f, f.torso, mergeGeometries(torso), 'cloth');
  if (!robe) {
    for (const side of [-1, 1] as const) { // the coat's tails, swinging with the legs
      const panel = new THREE.Group();
      f.body.add(panel);
      f.skirt.push(panel);
      part(f, panel, skirtPanel(side, coatC), 'cloth');
    }
  }

  // The head: a face with brow, nose, eyes, ears, jaw; moustache and beard; hair; spectacles; the hat.
  const head = [
    ...faceForms(pale),
    bevel(0.17, 0.025, 0.03, 0, 0.172, 0.112, shade(hair, 0.9), 0.008), // brow
    box(0.045, 0.026, 0.02, -0.05, 0.15, 0.123, shade(BASE.bone, 1.15)), box(0.045, 0.026, 0.02, 0.05, 0.15, 0.123, shade(BASE.bone, 1.15)), // eyes: the white of them,
    box(0.02, 0.024, 0.022, -0.05, 0.15, 0.126, dark), box(0.02, 0.024, 0.022, 0.05, 0.15, 0.126, dark), // and the dark of them
    ...hairOf(look.hat === 'none' || who.cut !== 'short' ? who.cut : 'short', hair),
  ];
  if (look.beard) head.push(box(0.19, 0.12, 0.08, 0, 0.02, 0.1, hair), box(0.12, 0.1, 0.07, 0, -0.06, 0.1, shade(hair, 0.95)), box(0.1, 0.03, 0.03, 0, 0.075, 0.14, shade(hair, 1.05)));
  else if (has('moustache')) head.push(box(0.12, 0.03, 0.04, 0, 0.075, 0.135, hair));
  if (has('spectacles') || look.glasses) { // thin rims round the eyes, a bridge and the arms to the ears (round 38: they were two solid lenses and a bar across the face, and read as sunglasses)
    const rim = shade(BASE.charcoal, 1.6);
    for (const x of [-0.05, 0.05]) head.push(box(0.08, 0.008, 0.012, x, 0.18, 0.13, rim), box(0.08, 0.008, 0.012, x, 0.12, 0.13, rim), box(0.008, 0.06, 0.012, x - 0.04, 0.15, 0.13, rim), box(0.008, 0.06, 0.012, x + 0.04, 0.15, 0.13, rim));
    head.push(box(0.03, 0.008, 0.012, 0, 0.165, 0.13, rim), box(0.01, 0.008, 0.12, -0.1, 0.165, 0.07, rim), box(0.01, 0.008, 0.12, 0.1, 0.165, 0.07, rim));
  }
  if (has('pipe')) head.push(box(0.025, 0.025, 0.12, 0.04, 0.05, 0.17, leather), box(0.05, 0.06, 0.05, 0.04, 0.08, 0.235, dark));
  part(f, f.head, mergeGeometries(head), 'cloth');
  const h = hat(look, dark, shade(look.coat === 'black' ? BASE.rust : BASE.charcoal, 1.4));
  if (h) part(f, f.head, h, 'cloth', look.hat === 'band' ? 0.6 : 0);
  if (has('morion')) part(f, f.head, mergeGeometries([tint(new THREE.SphereGeometry(0.135, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.24, 0), steel), cylinder(0.22, 0.2, 0.025, 0.245, steel), box(0.03, 0.09, 0.26, 0, 0.375, 0, shade(steel, 0.9))]), 'cloth');
  if (has('knit')) part(f, f.head, mergeGeometries([cylinder(0.125, 0.135, 0.12, 0.27, shade(mixRgb(BASE.seaGrey, BASE.charcoal, 0.5), 1.8)), cylinder(0.14, 0.14, 0.04, 0.22, shade(mixRgb(BASE.seaGrey, BASE.charcoal, 0.3), 1.6)), box(0.05, 0.05, 0.05, 0, 0.36, 0, shade(BASE.bone, 1.2))]), 'cloth');

  // Arms: the sleeve and cuff, a hand (gloved for some), what they hold.
  const glove = has('gloves') ? leather : pale;
  for (const [arm, elbow, hand] of [[f.armR, f.elbowR, f.handR], [f.armL, f.elbowL, f.handL]]) {
    part(f, arm, upperArm(sleeve), 'cloth');
    part(f, elbow, mergeGeometries(foreArm(sleeve, shirt, shade(shirt, 0.85))), 'cloth');
    part(f, hand, mergeGeometries(fist(glove)), 'cloth');
  }
  if (has('cane')) part(f, f.handR, mergeGeometries([box(0.03, 0.78, 0.03, 0, -0.4, 0.02, shade(BASE.charcoal, 1.6)), box(0.1, 0.035, 0.04, 0, 0.0, 0.02, brass), box(0.04, 0.05, 0.04, 0, -0.8, 0.02, brass)]), 'wood');

  // Legs: trousers, boots with a heel and a toecap.
  for (const [leg, knee, foot] of [[f.legR, f.kneeR, f.footR], [f.legL, f.kneeL, f.footL]]) {
    const cloth = robe ? coatC : trouser;
    part(f, leg, thigh(cloth), 'cloth');
    part(f, knee, mergeGeometries(shin(cloth, robe ? facing : shade(trouser, 0.85))), 'cloth');
    part(f, foot, mergeGeometries(shoe(leather, shade(BASE.charcoal, 0.9))), 'cloth');
  }
  f.root.scale.set(who.build?.[1] ?? 1, who.build?.[0] ?? 1, who.build?.[1] ?? 1); // each their own height and girth
  const act = ACTS[id];
  if (act) addProps(f, act.kind, SEATED.has(act.kind), act.post); // what they hold, and sit on, while they are at what they do (round 39)
  return f;
}
