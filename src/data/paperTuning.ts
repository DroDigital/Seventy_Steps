/**
 * The paper a note is (round 89; asked for by XDro: a note in the world is animated, floating, flowing, burning paper): a leaf of old
 * paper held up in the air by its own fire, burnt away at the rim and still burning there, with scraps of it turning about it. The
 * colours of the flame (orange at its heart, the haunt's violet at its tips, as the burnt paper of the page is read from), the size of
 * the leaf, how it moves and how it is burnt away when its page is put away. Pure data: no Three.js.
 */

/** A colour as red, green, blue in 0 to 1 (display sRGB, as render/palette.ts has them). */
export type Hue = readonly [number, number, number];

/** The model the game gives a note (systems/insight.ts): drawn as paper, not as a figure. */
export const PAPER_MODELS: ReadonlySet<string> = new Set(['note']);

/** What a `Tome` entity holds, to tell a note from a tome, a vial, a cache, a box of cartridges or a weapon. */
export interface Lying {
  vial?: boolean;
  echoes?: number;
  rounds?: number;
  weapon?: string;
  note?: boolean;
}

/** Whether a thing lying in the world is a note: a letter, a clipping or a report (a tome keeps its lectern). */
export const isPaper = (t: Lying): boolean => !!t.note && !t.vial && !t.echoes && !t.rounds && !t.weapon;

export const PAPER_LOOK = {
  leaf: [0.9, 0.84, 0.7] as Hue, // old paper, lit
  scorch: [0.4, 0.24, 0.12] as Hue, // where the heat has been, before it is black
  char: [0.045, 0.04, 0.04] as Hue,
  heart: [1, 0.82, 0.42] as Hue, // the flame at its heart
  flame: [1, 0.46, 0.14] as Hue,
  tip: [0.62, 0.3, 0.96] as Hue, // and at its tips: the violet of the haunt's embers
  ash: [0.3, 0.28, 0.3] as Hue,
} as const;

export const PAPER = {
  reach: 64, // metres a leaf is drawn from; one first seen nearer is built
  burnReach: 22, // metres within which its fire throws sparks, flames and smoke
  gazeReach: 14, // metres within which it turns to face the investigator
  hover: 1.3, // metres its middle floats above the ground
  size: [1.5, 1.05] as readonly [number, number], // its width and height
  grid: [18, 13] as readonly [number, number], // cells across and up: the fineness of its bending
  scraps: 3, // the scraps of burnt paper that turn about it
  scrap: [0.46, 0.34] as readonly [number, number], // the size of one
  orbit: 1.15, // metres from the leaf's middle that the nearest turns
  glint: 2.3, // how high the glimmer that tells a thing worth finding from afar stands over it (render/glints.ts)
  halo: 0.28, // the strength of the glow about it
  flame: [0.34, 0.2] as readonly [number, number], // how tall the flames are at the leaf's rim, and at a scrap's
  burn: {
    hold: 0.4, // seconds after the page is put away that it hangs as it was, while the burnt paper of the page goes
    total: 2.8, // seconds from then until nothing of it is left
    front: 1.5, // seconds the burn takes to cross the leaf, from its rim to its middle
    lag: 0.9, // seconds before the dither begins to take it
    dither: 1.4, // seconds it takes to be dithered away
    rise: 0.7, // metres it lifts as it burns
    curl: 4, // how much more it curls, and flutters, at its worst
  },
} as const;
