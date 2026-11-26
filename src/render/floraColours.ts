/**
 * Round 125, the colour each slot of a library plant takes in its realm (tools/flora/slots.py names the same numbers): a leaf one of the
 * realm's October colours, turned by the prop's own seed so two trees of a variant turn differently; the needles the realm's; moss, dry
 * leaves, a gill's shade, the Black Wood's growth; the bark the realm's, darker at its foot, a birch's white and its marks, a fungus's
 * pale stalk, the grey of what is dead and standing. Display sRGB, as every colour of the world.
 */

import type { PropLook } from '../data/propLooks';
import { mixRgb, scaleRgb, type Rgb } from './palette';

export const SNOW: Rgb = [0.9, 0.9, 0.93];
const BIRCH_WHITE: Rgb = [0.94, 0.92, 0.86];
const BIRCH_MARK: Rgb = [0.24, 0.22, 0.21];
const BIRCH_LEAVES: readonly Rgb[] = [[0.76, 0.64, 0.3], [0.7, 0.6, 0.32], [0.8, 0.68, 0.36], [0.64, 0.56, 0.3]]; // a birch's October gold, whatever its realm
const SAWN: Rgb = [0.72, 0.62, 0.46];
const MOSS: Rgb = [0.5, 0.52, 0.44];
const DRY: Rgb = [0.52, 0.4, 0.27];
const DEAD: Rgb = [0.6, 0.6, 0.58];

/** The leaves, the needles, and what lies over all: what a plant is drawn in. */
export interface Palette {
  leaves: readonly Rgb[];
  needles: Rgb;
  bark: Rgb;
  top: Rgb;
  shift: number; // the prop's own turn of its leaf colours
}

/** A form's palette in its realm's look. */
export function paletteOf(look: PropLook, form: string, shift: number): Palette {
  const bark = form === 'oak' ? scaleRgb(look.bark, 0.9) : form === 'fungal' ? scaleRgb(look.bark, 1.5) : look.bark;
  return {
    leaves: form === 'birch' ? BIRCH_LEAVES : look.leaves,
    needles: form === 'scrub' ? mixRgb(look.needles, look.top, 0.35) : look.needles,
    bark,
    top: look.top,
    shift,
  };
}

const clamp1 = (c: Rgb): Rgb => [Math.min(1, c[0]), Math.min(1, c[1]), Math.min(1, c[2])];

/** The colour of a point of slot `slot` (before its baked light). */
export function slotColour(slot: number, p: Palette): Rgb {
  const leaf = (k: number): Rgb => p.leaves[(k + p.shift) % p.leaves.length];
  switch (slot) {
    case 0:
    case 1:
    case 2:
    case 3:
      return leaf(slot);
    case 4:
      return p.needles;
    case 5:
      return scaleRgb(p.needles, 0.78);
    case 6:
      return scaleRgb(mixRgb(p.top, MOSS, 0.5), 0.95);
    case 7:
      return scaleRgb(mixRgb(leaf(0), DRY, 0.55), 0.9);
    case 8:
      return scaleRgb(leaf(1), 0.42);
    case 9:
      return leaf(1);
    case 10:
      return scaleRgb(p.bark, 0.85);
    case 17:
      return scaleRgb(p.bark, 0.75);
    case 18:
      return BIRCH_WHITE;
    case 19:
      return BIRCH_MARK;
    case 20:
      return mixRgb(p.bark, SAWN, 0.6);
    case 21:
      return clamp1(scaleRgb(p.bark, 1.1));
    case 22:
      return mixRgb(p.bark, DEAD, 0.5);
    default:
      return p.bark;
  }
}
