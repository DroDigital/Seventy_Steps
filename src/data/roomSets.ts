/**
 * The sets of the rooms that are no boss's (round 74, the asset brief for every dungeon: "tall scholarly reading hall; ordered catalogue,
 * abandoned stacks, bindery worktables" for the Library, "two eternal flame sources" for the Cavern of Flame): a few halls that a place
 * has a picture of, furnished with the models the brief names, by the same machinery as a boss hall's (data/hallSets.ts, world/hallSet.ts).
 * Keyed by the dungeon's id and the room's ('library/foyer'); what is read and kept clear is the hall's: its walls, doorways and the room's
 * own things, with the fight's circle drawn smaller (`ROOM_INNER`), so that a room's walls are lined and its middle left to those who cross it.
 * Hearts may stand anywhere. Data only.
 */

import { at, put, scatter, wall, type ArenaSet } from './arenaSets';

const WOOD_KEEP = 0.7; // the bookcases keep the colours of their books
const DARK: [number, number, number] = [0.34, 0.28, 0.24];
const DAMP: [number, number, number] = [0.4, 0.36, 0.34];
type Tone = { tint?: readonly [number, number, number]; keep?: number };

/** A row of bays or cases along some walls (angles from the way in: 0 is the wall it comes through), touching, each turned square to its wall; those that would stand across a doorway or into a pillar are not stood. */
const row = (of: string, r: number, walls: readonly number[], o: Tone & { size?: number } = {}) => put(of, wall(r, 1.35, { walls, face: 'wall' }), { hung: true, join: true, tint: o.tint, keep: o.keep ?? WOOD_KEEP, size: o.size });
/** Shelves hung on walls, at the height of a hand held up. */
const shelves = (walls: readonly number[], lift: number, o: Tone = {}) => put('ps_wallshelf', wall(0.92, 1.9, { walls, face: 'wall' }), { hung: true, join: true, lift, size: 1.2, tint: o.tint, keep: o.keep ?? WOOD_KEEP });
const piles = (n: number, o: Tone = {}) => put('ps_bookpile', scatter(n, [0.4, 0.8], { face: 'free' }), { walk: true, size: 1.5, tint: o.tint, keep: o.keep ?? WOOD_KEEP });

export const ROOM_SETS: Readonly<Record<string, ArenaSet>> = {
  // The foyer of the University Library: the first bays of the stacks along the side walls, a few piles of books on the floor.
  'library/foyer': {
    puts: [row('ps_bookbay', 0.915, [90, 270]), piles(3)],
  },
  // The reading hall under its high windows: bays along three walls, cases at the fourth, pages left on the floor, a shelf on the wall above them.
  'library/reading': {
    puts: [row('ps_bookbay', 0.915, [90, 270, 180]), row('ps_bookcase', 0.86, [0]), shelves([0], 2.6), piles(5)],
  },
  // The periodicals room: cases along the walls, low ones at the entry, the bays gone over to dust.
  'library/periodicals': {
    puts: [row('ps_bookcase', 0.86, [90, 270, 180]), row('ps_bookcase_low', 0.86, [0]), piles(5)],
  },
  // The restricted room, where the Necronomicon is kept: bays all about, darker than the rest, nothing left lying.
  'library/restricted': {
    puts: [row('ps_bookbay', 0.915, [0, 90, 270, 180], { tint: DARK, keep: 0.5 })],
  },
  // The bindery of the sub-basement: worktables' cases about the walls with a shelf over each, piles of what was being mended, damp.
  'library/bindery': {
    puts: [row('ps_bookcase_low', 0.86, [0, 90, 270, 180], { tint: DAMP, keep: 0.5 }), shelves([0, 90, 270, 180], 2.1, { tint: DAMP, keep: 0.5 }), piles(6, { tint: DAMP, keep: 0.5 })],
  },
  // Where the seventy steps begin: a brazier on each side wall of the stair head.
  'slumber/threshold': {
    puts: [put('ss_brazier', at(0.74, 90, { face: 'in' }), { lit: 'torch', size: 1.2, heart: true }), put('ss_brazier', at(0.74, 270, { face: 'in' }), { lit: 'torch', size: 1.2, heart: true })],
  },
  // The Cavern of Flame: the two eternal fires, tall, one at each side wall.
  'slumber/cavern': {
    puts: [put('ss_brazier', at(0.74, 90, { face: 'in' }), { lit: 'torch', size: 1.4, heart: true }), put('ss_brazier', at(0.74, 270, { face: 'in' }), { lit: 'torch', size: 1.4, heart: true })],
  },
  // The gate of deeper slumber: a brazier at each side wall, the last light of the stair.
  'slumber/deeper': {
    puts: [put('ss_brazier', at(0.74, 90, { face: 'in' }), { lit: 'torch', size: 1.3, heart: true }), put('ss_brazier', at(0.74, 270, { face: 'in' }), { lit: 'torch', size: 1.3, heart: true })],
  },
};
