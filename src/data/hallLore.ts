/**
 * Each dungeon boss hall's own architecture (round 108, asked: "improve boss room in every and any way to make it more distinct to the
 * others and more fitting to lore"): where its pillars stand and what they are, what is built on its walls, what hangs under its
 * roof, the colour of its own light, and the piece that closes its far wall. Over these the hall's set (data/hallSets*.ts) still
 * stands its pieces. The halls of the waking world's dungeons are here, the lairs' in hallLoreLairs.ts. Data only (render/hallLore.ts).
 */

import type { PillarForm, WallItem } from './dungeonLooks';
import { LAIR_LORE } from './hallLoreLairs';
import type { Vec3 } from './tuning';

/** Where a boss hall's pillars stand (world/roomStyle.ts): in a ring of ten, eight, two rows, five, six or seven about the fight, or none. */
export type HallPillars = 'none' | 'four' | 'colonnade' | 'ring' | 'five' | 'six' | 'seven';

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
  walls: readonly WallPut[];
  roof: readonly RoofThing[];
  glow: Vec3;
  far?: FarPiece;
}

export const EARTH_LORE: Readonly<Record<string, HallLore>> = {
  // The Witch House's garret, where Keziah worked her angles: the beams lean, papers of her figures are pinned up, and Brown Jenkin's
  // holes are at the foot of every wall.
  keziah_mason: {
    pillars: 'four', pillar: 'post', glow: [0.62, 0.64, 0.34],
    walls: [{ what: 'slant', on: 'all' }, { what: 'ratholes', on: 'all' }, { what: 'papers', on: 'far', every: 2 }],
    roof: ['ropes'],
  },
  // Sentinel Hill's summit, open to the sky, where the fires burned.
  dunwich_horror: {
    pillars: 'four', pillar: 'menhir', glow: [0.7, 0.5, 0.3],
    walls: [],
    roof: [],
  },
  // The temple of Y'ha-nthlei, its vault fallen, lit by the light the deep things give, and coral grown up its columns.
  father_dagon: {
    pillars: 'colonnade', pillar: 'coral', glow: [0.3, 0.62, 0.74],
    walls: [],
    roof: [],
  },
  // Curwen's laboratory, where he called them: his shelves of jars, chains on the wall where the pens' things were held.
  joseph_curwen: {
    pillars: 'colonnade', pillar: 'square', glow: [0.82, 0.55, 0.24],
    walls: [{ what: 'specimens', on: 'sides' }, { what: 'niche', on: 'far', holds: 'jar' }, { what: 'chains', on: 'entry' }],
    roof: ['chains', 'lamps'],
  },
  // The steeple of the Starry Wisdom church: seven pillars for the stone's seven supports; the tall windows' stained glass, and the
  // louvres of the steeple boarded against the light.
  haunter_of_the_dark: {
    pillars: 'seven', pillar: 'cluster', glow: [0.7, 0.26, 0.1],
    walls: [{ what: 'lancet', on: 'sides', colour: [0.55, 0.14, 0.12] }, { what: 'louvres', on: 'far' }, { what: 'lancet', on: 'entry', colour: [0.18, 0.24, 0.55] }],
    roof: ['ropes'],
  },
  // Akeley's study: his shelves, the Outer Ones' cylinders on the far wall with their machines, his maps of the hills.
  whisperer: {
    pillars: 'ring', pillar: 'post', glow: [0.55, 0.74, 0.86],
    walls: [{ what: 'shelves', on: 'sides' }, { what: 'cylinders', on: 'far' }, { what: 'apparatus', on: 'far', every: 2 }, { what: 'charts', on: 'entry' }],
    roof: ['lamps'],
  },
  // The Elder Things' city below, where the shoggoth was left: five pillars of their five-lobed kind.
  shoggoth: {
    pillars: 'five', pillar: 'fivefold', glow: [0.52, 0.78, 0.44],
    walls: [{ what: 'slab', on: 'sides', every: 2 }],
    roof: [],
  },
  // The Great Race's sealed vault over the deep where the polyps were shut: the record cases on every wall.
  flying_polyp: {
    pillars: 'ring', pillar: 'basalt', glow: [0.55, 0.62, 0.72],
    walls: [{ what: 'cases', on: 'all' }],
    roof: ['dome'],
  },
  // N'kai, lightless, under Tsathoggua's onyx.
  tsathoggua: {
    pillars: 'four', pillar: 'stalagmite', glow: [0.32, 0.44, 0.78],
    walls: [{ what: 'idol', on: 'sides', every: 2 }],
    roof: [],
  },
  // Leng's windowless monastery: frescoes of Leng's history low on its walls, a throne of gold.
  high_priest: {
    pillars: 'colonnade', pillar: 'onyx', glow: [0.85, 0.68, 0.25],
    walls: [{ what: 'fresco', on: 'sides' }],
    roof: [],
    far: 'throne',
  },
  // The onyx castle on Kadath: the gods' images down its sides.
  great_ones: {
    pillars: 'four', pillar: 'onyx', glow: [0.9, 0.78, 0.45],
    walls: [{ what: 'statue', on: 'sides' }],
    roof: [],
  },
  // The temple of Mu, in R'lyeh risen, where Ghatanothoa's glance turns flesh to stone.
  ghatanothoa: {
    pillars: 'four', pillar: 'twisted', glow: [0.55, 0.7, 0.3],
    walls: [{ what: 'slab', on: 'all' }],
    roof: [],
  },
  // Rhan-Tegoth's place, and its throne.
  rhan_tegoth: {
    pillars: 'colonnade', pillar: 'fungal', glow: [0.8, 0.55, 0.4],
    walls: [],
    roof: [],
    far: 'throne',
  },
  // Beyond the Ultimate Gate: six shards for pillars, more of them adrift overhead, and an arch.
  umr_at_tawil: {
    pillars: 'six', pillar: 'shard', glow: [0.62, 0.72, 0.95],
    walls: [],
    roof: ['shards'],
    far: 'arch',
  },
};

/** Every boss hall's, by its first boss. */
export const HALL_LORE: Readonly<Record<string, HallLore>> = { ...EARTH_LORE, ...LAIR_LORE };
