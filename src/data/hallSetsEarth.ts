/**
 * The sets of the boss halls of the waking world's great dungeons (round 62; data/arenaSets.ts' pieces, placed by world/hallSet.ts): what
 * each horror's room holds, drawn from its own story, in the hall's frame (0° the way in, 180° the far wall, the share a part of the
 * hall's half breadth). The middle of a hall stays clear for the fight; a piece is kept off what the room has (its walls, pillars,
 * doorways, its Elder Sign and gate) and under its roof. Data only.
 */

import { at, put, ring, scatter, type ArenaSet } from './arenaSets';

export const EARTH_HALLS: Readonly<Record<string, ArenaSet>> = {
  // The Witch House's garret: the crooked room under the roof, a hag's litter, a pallet, trunks, a skeleton gnawed clean, a bowl and her candles.
  keziah_mason: {
    puts: [
      put('chest', ring(0.93, 6, { arc: [60, 300], face: 'out', jitter: 12 }), { size: [1.1, 1.5] }),
      put('crate', scatter(5, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.4] }),
      put('barrel', scatter(4, [0.84, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('bedroll', at(0.92, 265, { face: 90 }), { size: 1.4 }),
      put('bench', at(0.93, 125, { face: 'in' }), { size: 1.2 }),
      put('skeleton', at(0.9, 215, { face: 'free' }), { size: 0.9 }),
      put('bowl', scatter(3, [0.8, 0.95], { face: 'free' }), { walk: true, size: 1.5 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // Sentinel Hill's summit: the circle of the hill's own stones about the table-stone, rocks left where they fell, and skulls on poles where the people burned their fires.
  dunwich_horror: {
    puts: [
      put('trilith', ring(0.93, 7, { jitter: 5, face: 'in' }), { size: 0.9 }),
      put('rock_tall', scatter(6, [0.84, 0.98], { face: 'free' }), { size: [0.8, 1.2] }),
      put('skull_pole', ring(0.88, 9, { arc: [40, 320], jitter: 8 }), { size: 1.1 }),
      put('rocks_tall', scatter(3, [0.9, 1.2], { arc: [70, 290] }), { size: 0.7 }),
    ],
  },
  // The reef temple under the water: the hulls of what the Deep Ones took, rubble and kelp, heads of the idol fallen from its walls, the bones of fish.
  father_dagon: {
    puts: [
      put('rowboat', ring(0.92, 3, { arc: [70, 290], face: 'free' }), { size: 1.1 }),
      put('rocks_sand_a', scatter(4, [0.88, 1.2], { arc: [60, 300] }), { size: [0.5, 0.7] }),
      put('statue_head', ring(0.93, 4, { arc: [100, 260], face: 'in' }), { size: [0.8, 1.1], tint: [0.45, 0.55, 0.5] }),
      put('fish', scatter(7, [0.8, 0.97], { face: 'free' }), { walk: true, size: 1.6 }),
      put('lily', scatter(6, [0.8, 0.98], { face: 'free' }), { walk: true, size: 1.6 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('column', ring(0.97, 4, { arc: [60, 300] }), { size: 0.8 }),
    ],
  },
  // Curwen's laboratory: the tables of his work, vessels and a chalice, sealed coffins, a spade, a skeleton on a slab, his candles.
  joseph_curwen: {
    puts: [
      put('altar_stone', ring(0.9, 4, { arc: [70, 290], face: 'in' }), { size: 1.1 }),
      put('urn', scatter(8, [0.82, 0.97], { face: 'free' }), { size: [1, 1.5] }),
      put('coffin', at(0.93, 270, { face: 90 }), { size: 1.2 }),
      put('coffin', at(0.93, 90, { face: 270 }), { size: 1.2 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [110, 250] }), { size: 1.2 }),
      put('skeleton', at(0.86, 180, { face: 'free' }), { size: 0.9 }),
      put('shovel_dirt', at(0.9, 145, { face: 'free' }), { size: 1.2 }),
      put('chalice', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.6 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The abandoned church's steeple room: pews in their rows gone to rot, a cross taken down, a statue, no light at all (it lives in the dark).
  haunter_of_the_dark: {
    puts: [
      put('bench', ring(0.92, 6, { arc: [60, 120], face: 'in' }), { size: 1.3 }),
      put('bench', ring(0.92, 6, { arc: [240, 300], face: 'in' }), { size: 1.3 }),
      put('cross', at(0.96, 180, { face: 'in' }), { size: 1.5 }),
      put('statue_column', ring(0.94, 4, { arc: [70, 290] }), { size: 0.9 }),
      put('urn', scatter(4, [0.82, 0.96], { face: 'free' }), { size: 1.2 }),
      put('grave_broken', scatter(3, [0.84, 0.97], { arc: [90, 270], face: 'free' })),
    ],
  },
  // Akeley's study in the farmhouse: the cylinders the Mi-Go carry brains in, crates and a chest, a lamp burning low.
  whisperer: {
    puts: [
      put('pipes', ring(0.92, 7, { arc: [70, 290] }), { size: 0.33, glow: 'green' }),
      put('crate', scatter(5, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.4] }),
      put('chest', at(0.94, 130, { face: 'in' }), { size: 1.3 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('lantern', scatter(4, [0.8, 0.96], { face: 'free' }), { lit: 'lamp', walk: true, size: 1.5 }),
      put('bench', at(0.93, 235, { face: 'in' }), { size: 1.2 }),
    ],
  },
  // The Old Ones' city under the ice: columns of a cut that is no one's, obelisks, ring-statues, hexagonal pedestals with a pale glow.
  shoggoth: {
    puts: [
      put('column', ring(0.95, 6, { arc: [50, 310] }), { size: 0.8 }),
      put('statue_obelisk', at(1.0, 180, { face: 'front' }), { size: 0.8 }),
      put('statue_ring', ring(0.9, 4, { arc: [80, 280], face: 'in' }), { size: 1.3 }),
      put('hexped', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.3, glow: 'purple' }),
      put('rocks_tall', scatter(3, [0.9, 1.15], { arc: [70, 290] }), { size: 0.6 }),
    ],
  },
  // The Elder Things' vault: fallen fragments of a star's stone, pedestals, ring-statues and columns broken before their time.
  flying_polyp: {
    puts: [
      put('meteor', ring(0.9, 4, { arc: [70, 290], jitter: 10 }), { size: [0.8, 1.2], glow: 'purple' }),
      put('hexped', ring(0.95, 5, { arc: [50, 310] }), { size: 1.2, glow: 'purple' }),
      put('statue_ring', at(0.94, 180, { face: 'in' }), { size: 1.3 }),
      put('column', scatter(4, [0.88, 0.99], { arc: [60, 300] }), { size: [0.6, 0.85] }),
    ],
  },
};
