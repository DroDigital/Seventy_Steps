/**
 * Each dungeon boss hall's own architecture (round 108, asked: "improve boss room in every and any way to make it more distinct to the
 * others and more fitting to lore"): where its pillars stand and what they are, the sigil laid in its floor under the horror (in the
 * hall's frame: 0 degrees toward the far wall, clockwise, metres from the middle), what is built on its walls, what hangs under its
 * roof, the colour of its own light, and the piece that closes its far wall. Over these the hall's set (data/hallSets*.ts) still
 * stands its pieces. The halls of the waking world's dungeons are here, the lairs' in hallLoreLairs.ts. Data only (render/hallLore.ts).
 */

import type { PillarForm, WallItem } from './dungeonLooks';
import { LAIR_LORE } from './hallLoreLairs';
import type { Vec3 } from './tuning';

/** Where a boss hall's pillars stand (world/roomStyle.ts): in a ring of ten, eight, two rows, five, six or seven about the fight, or none. */
export type HallPillars = 'none' | 'four' | 'colonnade' | 'ring' | 'five' | 'six' | 'seven';

/** What a sigil's lines are laid in: the floor's own stone darker or paler, chalk, soot, dried blood, gilt, iron, carpet, a black tar, or the hall's own light. */
export type Ink = 'dark' | 'pale' | 'chalk' | 'soot' | 'blood' | 'gilt' | 'iron' | 'rug' | 'tar' | 'glow';

export type Shape =
  | { ring: number; w: number } // a ring of radius `ring`, `w` wide
  | { disc: number; at?: readonly [number, number] } // a disc, about the middle or about (u, v)
  | { poly: number; r: number; w: number; turn?: number; fill?: boolean } // a regular polygon's outline (or the whole of it), its corners at `r`
  | { star: number; step: number; r: number; w: number; turn?: number } // a star of `star` points, each joined to the one `step` on
  | { rays: number; from: number; to: number; w: number; turn?: number; taper?: boolean; arc?: readonly [number, number] }
  | { spiral: number; turns: number; from: number; to: number; w: number } // `spiral` arms, each turning so many times
  | { line: readonly [number, number, number, number]; w: number }
  | { dots: number; r: number; size: number; turn?: number; arc?: readonly [number, number] } // discs about a circle, or along an arc of it
  | { arc: number; w: number; from: number; to: number } // a part of a ring, from one angle to another
  | { scatter: number; from: number; to: number; size: number; seed: number } // flecks at random in a band
  | { track: readonly [number, number, number, number]; n: number; size: number }; // prints in a line, alternating either side of it

export interface Layer {
  ink: Ink;
  colour?: Vec3; // a 'glow' layer's own colour, else the hall's
  shapes: readonly Shape[];
}

/** What is built on a hall's walls, beside the kits' things (render/hallWalls.ts). */
export type WallThing = WallItem | 'lancet' | 'niche' | 'louvres' | 'mirror' | 'drapes' | 'fresco' | 'charts' | 'papers' | 'slant' | 'ratholes';
export type Walls = 'sides' | 'far' | 'entry' | 'all';
export interface WallPut {
  what: WallThing;
  on: Walls;
  every?: number; // a slot in so many (1: every one)
  colour?: Vec3; // a window's glass, a banner's cloth
  holds?: 'skull' | 'urn' | 'idol' | 'bust' | 'jar' | 'candle'; // what stands in a niche
}

/** What hangs under a hall's roof (render/hallRoof.ts): the open halls take only what floats. */
export type RoofThing = 'dome' | 'oculus' | 'stars' | 'chandelier' | 'chains' | 'lamps' | 'pendulums' | 'icicles' | 'shards' | 'ropes';

/** The piece that closes a hall's far wall, if any. */
export type FarPiece = 'throne' | 'hearth' | 'arch';

export interface HallLore {
  pillars: HallPillars;
  pillar?: PillarForm; // what they are drawn as (else its dungeon's)
  reach: number; // the sigil's radius: the carpet in stops there
  sigil: readonly Layer[];
  walls: readonly WallPut[];
  roof: readonly RoofThing[];
  glow: Vec3;
  far?: FarPiece;
}

export const EARTH_LORE: Readonly<Record<string, HallLore>> = {
  // The Witch House's garret: Keziah's angles chalked across the boards, figures inside figures none of which close as they should,
  // scorched round where she burned her lights; the beams lean, and Brown Jenkin's holes are at the foot of every wall.
  keziah_mason: {
    pillars: 'four', pillar: 'post', reach: 14.5, glow: [0.62, 0.64, 0.34],
    sigil: [
      { ink: 'chalk', shapes: [{ poly: 3, r: 12, w: 0.18, turn: 7 }, { poly: 4, r: 9, w: 0.18, turn: 31 }, { poly: 5, r: 6.5, w: 0.15, turn: 12 }, { star: 7, step: 3, r: 4, w: 0.12 }, { rays: 3, from: 4.1, to: 11.9, w: 0.1, turn: 67 }, { dots: 13, r: 13.2, size: 0.22 }] },
      { ink: 'soot', shapes: [{ ring: 14.2, w: 0.7 }] },
    ],
    walls: [{ what: 'slant', on: 'all' }, { what: 'ratholes', on: 'all' }, { what: 'papers', on: 'far', every: 2 }],
    roof: ['ropes'],
  },
  // Sentinel Hill's summit, open to the sky: the ring the fires burned, furrows scorched out from it, and across it the prints of
  // something as broad as a barrel's head, which nobody saw.
  dunwich_horror: {
    pillars: 'four', pillar: 'menhir', reach: 14.5, glow: [0.7, 0.5, 0.3],
    sigil: [
      { ink: 'soot', shapes: [{ ring: 13.6, w: 1.4 }, { rays: 9, from: 3.4, to: 11.4, w: 0.55, taper: true, turn: 20 }] },
      { ink: 'tar', shapes: [{ track: [-12, -10, 11, 11], n: 9, size: 0.85 }] },
      { ink: 'pale', shapes: [{ ring: 2.4, w: 0.35 }] },
    ],
    walls: [],
    roof: [],
  },
  // The temple of Y'ha-nthlei, its vault fallen: the Order of Dagon's spiral of arms in the light the deep things give, a ring of pearls,
  // tide-pools of black water at its edge, and coral grown up its columns.
  father_dagon: {
    pillars: 'colonnade', pillar: 'coral', reach: 14.5, glow: [0.3, 0.62, 0.74],
    sigil: [
      { ink: 'glow', shapes: [{ spiral: 3, turns: 0.9, from: 1.8, to: 11, w: 0.32 }, { disc: 1.1 }] },
      { ink: 'dark', shapes: [{ ring: 12.4, w: 0.8 }] },
      { ink: 'pale', shapes: [{ dots: 18, r: 14.1, size: 0.42 }] },
      { ink: 'tar', shapes: [{ disc: 2.4, at: [17, 6] }, { disc: 1.8, at: [-16.5, -7] }, { disc: 2.1, at: [-17, 9] }, { disc: 1.6, at: [16, -10] }] },
    ],
    walls: [],
    roof: [],
  },
  // Curwen's laboratory: the circle he called them in, chalked twice round with the signs of the hours between, Solomon's seal inside
  // it, and at its heart the dark of what was poured; his shelves of jars, chains on the wall where the pens' things were held.
  joseph_curwen: {
    pillars: 'colonnade', pillar: 'square', reach: 14.5, glow: [0.82, 0.55, 0.24],
    sigil: [
      { ink: 'chalk', shapes: [{ ring: 13, w: 0.24 }, { ring: 11.6, w: 0.14 }, { dots: 12, r: 12.3, size: 0.28, turn: 15 }, { star: 6, step: 2, r: 10, w: 0.2 }, { ring: 3, w: 0.14 }] },
      { ink: 'blood', shapes: [{ disc: 2.2 }] },
    ],
    walls: [{ what: 'specimens', on: 'sides' }, { what: 'niche', on: 'far', holds: 'jar' }, { what: 'chains', on: 'entry' }],
    roof: ['chains', 'lamps'],
  },
  // The steeple of the Starry Wisdom church: seven pillars for the stone's seven supports, a heptagram in gilt and old blood about the
  // place the Trapezohedron lay, red and black; the tall windows' stained glass, and the louvres of the steeple boarded against the light.
  haunter_of_the_dark: {
    pillars: 'seven', pillar: 'cluster', reach: 13.2, glow: [0.7, 0.26, 0.1],
    sigil: [
      { ink: 'blood', shapes: [{ star: 7, step: 3, r: 11, w: 0.28 }, { ring: 3, w: 0.3 }] },
      { ink: 'gilt', shapes: [{ poly: 7, r: 12.6, w: 0.24 }] },
      { ink: 'glow', shapes: [{ poly: 4, r: 1.2, w: 0, fill: true, turn: 20 }] },
    ],
    walls: [{ what: 'lancet', on: 'sides', colour: [0.55, 0.14, 0.12] }, { what: 'louvres', on: 'far' }, { what: 'lancet', on: 'entry', colour: [0.18, 0.24, 0.55] }],
    roof: ['ropes'],
  },
  // Akeley's study: a carpet, his shelves, the Outer Ones' cylinders on the far wall with their machines, his maps of the hills.
  whisperer: {
    pillars: 'ring', pillar: 'post', reach: 10, glow: [0.55, 0.74, 0.86],
    sigil: [
      { ink: 'rug', colour: [0.42, 0.18, 0.16], shapes: [{ poly: 4, r: 12, w: 1.8, turn: 45 }] },
      { ink: 'gilt', shapes: [{ poly: 4, r: 9.5, w: 0.25, turn: 45 }] },
      { ink: 'rug', colour: [0.22, 0.26, 0.38], shapes: [{ poly: 4, r: 8, w: 0, fill: true, turn: 45 }] },
    ],
    walls: [{ what: 'shelves', on: 'sides' }, { what: 'cylinders', on: 'far' }, { what: 'apparatus', on: 'far', every: 2 }, { what: 'charts', on: 'entry' }],
    roof: ['lamps'],
  },
  // The Elder Things' city below, where the shoggoth was left: their five-pointed star cut in the pale stone, five pillars of their
  // five-lobed kind, and at its heart a smear of the iridescent black where its eyes come and go.
  shoggoth: {
    pillars: 'five', pillar: 'fivefold', reach: 16.4, glow: [0.52, 0.78, 0.44],
    sigil: [
      { ink: 'pale', shapes: [{ star: 5, step: 2, r: 12, w: 0.45 }] },
      { ink: 'dark', shapes: [{ poly: 5, r: 16, w: 0.4, turn: 36 }] },
      { ink: 'tar', shapes: [{ ring: 2.6, w: 1.2 }] },
      { ink: 'glow', shapes: [{ dots: 5, r: 1.4, size: 0.18 }, { dots: 3, r: 0.5, size: 0.12, turn: 30 }] },
    ],
    walls: [{ what: 'slab', on: 'sides', every: 2 }],
    roof: [],
  },
  // The Great Race's sealed vault: an iron trapdoor bolted in a grid over the deep where the polyps were shut, grooves of the wind
  // worn round it, the record cases on every wall.
  flying_polyp: {
    pillars: 'ring', pillar: 'basalt', reach: 14.5, glow: [0.55, 0.62, 0.72],
    sigil: [
      { ink: 'iron', shapes: [{ poly: 4, r: 11, w: 0.5, turn: 45 }, { line: [-7.4, -2.6, 7.4, -2.6], w: 0.28 }, { line: [-7.4, 2.6, 7.4, 2.6], w: 0.28 }, { line: [-2.6, -7.4, -2.6, 7.4], w: 0.28 }, { line: [2.6, -7.4, 2.6, 7.4], w: 0.28 }, { ring: 1.1, w: 0.18 }] },
      { ink: 'dark', shapes: [{ ring: 13.6, w: 0.8 }] },
      { ink: 'pale', shapes: [{ rays: 4, from: 9, to: 12.6, w: 0.2 }] },
    ],
    walls: [{ what: 'cases', on: 'all' }],
    roof: ['dome'],
  },
  // N'kai, lightless: the black pool of what Tsathoggua leaves where it lies, an octagon of the old temple's gold round it.
  tsathoggua: {
    pillars: 'four', pillar: 'stalagmite', reach: 14.5, glow: [0.32, 0.44, 0.78],
    sigil: [
      { ink: 'tar', shapes: [{ disc: 5 }] },
      { ink: 'dark', shapes: [{ ring: 7, w: 0.8 }] },
      { ink: 'gilt', shapes: [{ poly: 8, r: 11.5, w: 0.3, turn: 22.5 }, { dots: 8, r: 13.4, size: 0.3 }] },
    ],
    walls: [{ what: 'idol', on: 'sides', every: 2 }],
    roof: [],
  },
  // Leng's windowless monastery: the high priest's yellow silk underfoot, frescoes of Leng's history low on its walls, a throne of gold.
  high_priest: {
    pillars: 'colonnade', pillar: 'onyx', reach: 14.5, glow: [0.85, 0.68, 0.25],
    sigil: [
      { ink: 'gilt', colour: [0.78, 0.64, 0.2], shapes: [{ ring: 12, w: 0.4 }] },
      { ink: 'dark', shapes: [{ star: 8, step: 3, r: 10.6, w: 0.25 }] },
      { ink: 'rug', colour: [0.74, 0.62, 0.2], shapes: [{ poly: 8, r: 3, w: 0, fill: true, turn: 22.5 }] },
    ],
    walls: [{ what: 'fresco', on: 'sides' }],
    roof: [],
    far: 'throne',
  },
  // The onyx castle on Kadath: a sunburst of gold from a disc of the gods' own light, the gods' images down its sides.
  great_ones: {
    pillars: 'four', pillar: 'onyx', reach: 14.8, glow: [0.9, 0.78, 0.45],
    sigil: [
      { ink: 'gilt', shapes: [{ rays: 16, from: 6, to: 13.4, w: 0.36, taper: true }, { ring: 14.2, w: 0.4 }] },
      { ink: 'dark', shapes: [{ ring: 5, w: 0.6 }] },
      { ink: 'glow', shapes: [{ disc: 2.2 }] },
    ],
    walls: [{ what: 'statue', on: 'sides' }],
    roof: [],
  },
  // The temple of Mu, in R'lyeh risen: cracks of a sickly light running out from where Ghatanothoa's glance turns flesh to stone.
  ghatanothoa: {
    pillars: 'four', pillar: 'twisted', reach: 15, glow: [0.55, 0.7, 0.3],
    sigil: [
      { ink: 'glow', shapes: [{ rays: 11, from: 2.4, to: 13, w: 0.2, taper: true, turn: 9 }, { disc: 1.2 }] },
      { ink: 'dark', shapes: [{ ring: 14.4, w: 1 }] },
      { ink: 'pale', shapes: [{ scatter: 24, from: 14.9, to: 18, size: 0.5, seed: 7 }] },
    ],
    walls: [{ what: 'slab', on: 'all' }],
    roof: [],
  },
  // Rhan-Tegoth's place: the basin under its throne, and the grooves cut in the floor that ran to it.
  rhan_tegoth: {
    pillars: 'colonnade', pillar: 'fungal', reach: 14.5, glow: [0.8, 0.55, 0.4],
    sigil: [
      { ink: 'blood', shapes: [{ disc: 2.6 }, { rays: 6, from: 4.1, to: 13, w: 0.26, turn: 30 }] },
      { ink: 'iron', shapes: [{ ring: 3.4, w: 0.5 }] },
      { ink: 'dark', shapes: [{ ring: 13.8, w: 0.6 }] },
    ],
    walls: [],
    roof: [],
    far: 'throne',
  },
  // Beyond the Ultimate Gate: hexagons nested in a pale light, six shards for pillars, more of them adrift overhead, and an arch.
  umr_at_tawil: {
    pillars: 'six', pillar: 'shard', reach: 14.5, glow: [0.62, 0.72, 0.95],
    sigil: [{ ink: 'glow', shapes: [{ poly: 6, r: 13, w: 0.25 }, { poly: 6, r: 9.5, w: 0.2, turn: 30 }, { poly: 6, r: 6, w: 0.15 }, { star: 6, step: 2, r: 3.6, w: 0.12 }] }],
    walls: [],
    roof: ['shards'],
    far: 'arch',
  },
};

/** Every boss hall's, by its first boss. */
export const HALL_LORE: Readonly<Record<string, HallLore>> = { ...EARTH_LORE, ...LAIR_LORE };
