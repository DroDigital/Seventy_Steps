/**
 * The recolour of each drawn creature to its realm (round 83), worked out for each form from its own measured
 * colour (`REVIEWED_MATTER`: the mean of the middle half of its front view's solid texels, by brightness) and
 * the realm's gradient map (render/realmPalette.ts). Every pixel of a form is turned the same way, about the
 * grey axis of colour, by the arc that takes the form's own hue a share of the way to the realm's, and has its
 * colour strength lifted toward the realm's, so what the form's palette holds inside itself (its red against
 * its green, its pale against its dark) is kept whole while the form as a whole takes the realm's colour; a form
 * with no hue of its own (a grey) is given the realm's. A form drawn in a strong colour of its own (round 93: the
 * Zoog's rust orange, the Wamp's, Wilbur's, Brown Jenkin's, Hastur's gold, the purples of Shub-Niggurath and
 * Azathoth) is not turned at all: its colour is what the author drew it in, and the realm reaches it through the
 * light and the mist instead; only the dull, sepia forms the older art is made of take the realm's hue. The picture
 * is changed on the way to the screen only (shaders/spriteGrade.ts); the CPU's part is this one small, pure
 * calculation for each form drawn. No Three.js.
 */

import { luma, type Rgb } from './palette';

const E1 = [Math.SQRT1_2, -Math.SQRT1_2, 0] as const; // the plane of colour about the greys, in two axes
const E2 = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)] as const;

/** A colour's strength and angle in the plane of colour: its chroma about the greys. */
export function chromaOf(c: Rgb): { x: number; y: number; length: number; angle: number } {
  const m = (c[0] + c[1] + c[2]) / 3;
  const v = [c[0] - m, c[1] - m, c[2] - m];
  const [x, y] = [v[0] * E1[0] + v[1] * E1[1] + v[2] * E1[2], v[0] * E2[0] + v[1] * E2[1] + v[2] * E2[2]];
  return { x, y, length: Math.hypot(x, y), angle: Math.atan2(y, x) };
}

const smooth = (lo: number, hi: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/** The angle `a` takes `b` to, by the short way round (-π..π). */
export const arc = (from: number, to: number): number => {
  const d = to - from;
  return d - 2 * Math.PI * Math.floor((d + Math.PI) / (2 * Math.PI));
};

export interface Tone {
  cos: number; // the turn every pixel of the form is given: its cosine and sine,
  sin: number;
  boost: number; // how much more colour (1: as drawn),
  fill: number; // and, for a form with no hue of its own, how much of the realm's colour a pixel is given, of its brightness
}

/** The identity: a form drawn as it is. */
export const PLAIN: Tone = { cos: 1, sin: 0, boost: 1, fill: 0 };

export const BOOST_MOST = 2.5; // the most a dull form's colour is raised
export const FILL = 0.5; // the share of the realm's colour a grey takes
export const OWN_FROM = 0.45; // a form's colour strength (its chroma against its brightness) from which its hue is held as drawn, over to OWN_TO
export const OWN_TO = 0.54; // (the dull forms of the older art are 0.02 to 0.44 and the strongly drawn ones 0.55 and over: the band is in the gap between them, 0.4423 to 0.5494 when it was cut; tests/spriteTone.test.ts says when a redrawn form falls into it)

/**
 * How the form of colour `form` is given to a realm whose mid-tone (its gradient map's middle stop, at brightness 1) is
 * `realm`, `share` (0..1) of the way: 0 leaves it as drawn, 1 puts its hue in the realm's. A form drawn in a strong colour
 * (its strength at OWN_TO or over) is the exception, at any share: it is returned as drawn (no turn, no lift, no cast), and
 * eases from the full recolour to that as its strength rises from OWN_FROM to OWN_TO.
 */
export function toneOf(form: Rgb, realm: Rgb, share: number): Tone {
  if (share <= 0) return PLAIN;
  const [f, r] = [chromaOf(form), chromaOf(realm)];
  const relForm = f.length / Math.max(0.05, luma(form)); // the form's colour strength, against its brightness
  const relRealm = r.length / Math.max(0.05, luma(realm));
  const own = smooth(0.02, 0.1, relForm); // 1: it has a hue of its own; 0: a grey
  const held = smooth(OWN_FROM, OWN_TO, relForm); // 1: drawn in a colour of its own that the realm does not take from it
  const turn = arc(f.angle, r.angle) * share * own * (1 - held);
  const boost = 1 + (Math.min(BOOST_MOST, Math.max(1, 1 + (relRealm / Math.max(0.02, relForm) - 1) * share)) - 1) * (1 - held);
  return { cos: Math.cos(turn), sin: Math.sin(turn), boost, fill: relRealm * share * (1 - own) * FILL };
}
