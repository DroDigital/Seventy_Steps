/**
 * The sets of the waking world's open arenas (round 61; data/arenaSets.ts): each horror's ground as its story makes it. The fog stands
 * at the ring's radius and a metre and a half; what stands inside it (to 1.0 of the radius) is seen from within, silhouetted against
 * its light, and what stands beyond (from 1.2) is seen from the way in. Data only.
 */

import { at, lane, put, ring, scatter, type ArenaSet } from './arenaSets';

export const EARTH_SETS: Readonly<Record<string, ArenaSet>> = {
  // The Colour Out of Space: the Gardners' blasted heath, a grey dust where nothing grows, a well, and a light in it that is of no colour a man has a name for.
  colour_out_of_space: {
    candle: 'cairn',
    ground: { texture: 'rot', tint: [0.46, 0.46, 0.5], gain: 1.2, reach: 14, bands: [{ r0: 0, r1: 0.3, k: 0.55, tint: [0.3, 0.3, 0.36] }, { r0: 0.3, r1: 0.62, k: 1.3, tint: [0.66, 0.66, 0.68] }] },
    puts: [
      put('meteor', ring(0.9, 3, { arc: [320, 395], jitter: 10 }), { size: [0.9, 1.3], glow: 'magenta' }), // what is left of the stone that fell
      put('prop:tree', ring(1.0, 9, { jitter: 14 }), { size: [1.1, 1.5] }), // the grey trees, their bark ash
      put('prop:tree', ring(1.3, 8, { jitter: 18 }), { size: [1.3, 1.7] }),
      put('trunk', at(0.88, 150, { face: 'free' }), { size: 1.2 }),
      put('cart', at(0.9, 75, { face: 'free' })),
      put('grave_wide', ring(0.92, 3, { arc: [240, 300], face: 'out' }), { size: 1.1 }), // the Gardners' stones
      put('cross_wood', at(0.92, 270, { face: 'out' })),
      put('prop:fence', ring(0.97, 6, { arc: [20, 100], jitter: 6 })),
      put('rock_large', lane([1.25, 1.7], 3, 3.8), { size: [1, 1.5] }),
    ],
    air: { kind: 'spore', color: [0.86, 0.2, 0.6], rate: 22 },
  },
  // The witches' sabbat on the island in the black river (round 68; Lovecraft: "the dark valley of the white stone beyond Meadow Hill and ... the unpeopled island in the river"): white earth, thirteen standing stones each with its balefire at its foot, the old white stone, a pentacle in the earth, and the Black Man at the book.
  black_man: {
    candle: 'skull',
    ground: { texture: 'dirt', tint: [0.8, 0.78, 0.72], gain: 1.5, reach: 18, bands: [{ r0: 0, r1: 0.5, k: 1.15, tint: [0.88, 0.86, 0.8] }, { r0: 0.5, r1: 0.72, k: 0.8, tint: [0.55, 0.52, 0.5] }] },
    puts: [
      put('prop:firepit', ring(0.9, 13), { size: 1.5 }), // and the balefire at the foot of each, that leans toward whoever comes
      put('altar_stone', at(0.58, 180, { face: 'in' }), { heart: true, size: 1.7, tint: [0.96, 0.95, 0.9], keep: 0.25 }), // the old white stone, where the book is laid
      put('stump_old', ring(0.66, 9, { arc: [50, 310], face: 'in' }), { size: 1.0 }), // the witches' stools
      put('skull_pole', ring(0.78, 7, { arc: [40, 320] }), { size: [0.9, 1.2] }),
      put('prop:firepit', lane([1.15, 1.45], 3, 4.4), { size: 1.4 }),
      put('skull_pole', lane([1.1, 1.5], 3, 3.2), { size: 1.25 }),
      put('prop:tree', scatter(6, [1.2, 1.45]), { size: [1.1, 1.5] }),
    ],
    air: { kind: 'ember', color: [1, 0.5, 0.22], rate: 16 },
  }, // (round 71: the thirteen and the outer stones are baked menhirs, laid by its place, world/places/blackman.ts)
  // Simon Orne's burying ground at Salem: stones in their rows, a crypt, a salt circle in the dust, a ward drawn in it, lamps down the way in.
  simon_orne: {
    candle: 'grave',
    ground: { texture: 'dirt', tint: [0.4, 0.38, 0.34], gain: 1.25, reach: 12, bands: [{ r0: 0.33, r1: 0.42, k: 1.7, tint: [0.78, 0.78, 0.74] }] },
    puts: [
      put('crypt', at(0.98, 180, { face: 'in' }), { size: 1.1, heart: true }),
      put('candles', scatter(10, [0.3, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }), // lit for the dead
      put('coffin', at(0.5, 90, { face: 'free' }), { heart: true }),
      put('lightpost', lane([1.3, 1.9], 3, 4.6), { lit: 'lamp' }),
    ], // (round 71: the lots, rails, trees and chapel of the burying ground are laid by its place, world/places/orne.ts)
    air: { kind: 'mote', color: [0.9, 0.85, 0.62], rate: 14 },
  },
  // Edward Hutchinson's Pawtuxet manor: a garden gone to hedge and ruin, a porch of columns, a dry fountain, an obelisk to the family and lamps that still burn.
  edward_hutchinson: {
    candle: 'grave',
    ground: { texture: 'cobble', tint: [0.4, 0.36, 0.32], gain: 1.2, reach: 12, bands: [{ r0: 0.46, r1: 0.58, k: 0.7 }] },
    puts: [
      put('fountain', at(0.58, 180, { face: 'in' }), { heart: true }),
      put('prop:obelisk', at(0.6, 48, { face: 'in' }), { heart: true, size: 2.4 }),
      put('hedge', ring(0.98, 22, { arc: [25, 335] }), { join: true, size: 1.2 }),
      put('column', ring(1.15, 5, { arc: [150, 210] }), { join: true, size: 1.1 }), // the porch
      put('wall_ruin', ring(1.35, 6, { arc: [140, 220] }), { join: true, size: 1.3 }),
      put('statue_obelisk', at(0.95, 130, { face: 'in' })),
      put('statue_obelisk', at(0.95, 230, { face: 'in' })),
      put('bench', ring(0.9, 3, { arc: [70, 110], face: 'in' }), { join: true }),
      put('bench', ring(0.9, 3, { arc: [250, 290], face: 'in' }), { join: true }),
      put('lightpost', lane([1.45, 1.95], 3, 4.6), { lit: 'lamp' }),
      put('pine_crooked', scatter(8, [1.25, 1.7]), { size: [1, 1.4] }),
    ],
    air: { kind: 'drift', color: [0.7, 0.72, 0.78], rate: 4 },
  },
  // Shub-Niggurath's black grove: trees that fork like horns, skulls on stakes, giant fungi, and an altar of stump and root; the air thick with spores.
  shub_niggurath: {
    candle: 'skull',
    ground: { texture: 'flesh', tint: [0.4, 0.28, 0.28], gain: 1.15, reach: 14, bands: [{ r0: 0, r1: 0.45, k: 0.7, tint: [0.26, 0.16, 0.17] }, { r0: 0.75, r1: 1.0, k: 0.78 }] },
    puts: [
      put('horn_tree', ring(1.0, 18, { jitter: 8 }), { size: [1.0, 1.4] }),
      // (round 71: the wood beyond the grove's wall is laid by its place, world/places/shub.ts)
      put('skull_pole', ring(0.9, 16, { jitter: 6 }), { size: [1, 1.3] }),
      put('mushroom_tall', scatter(12, [0.78, 0.97]), { size: [0.9, 1.6] }),
      put('stump_old', at(0.68, 180, { face: 'in' }), { heart: true, size: 3.4 }), // the altar
      put('prop:firepit', ring(0.85, 6), { size: 1.4 }),
      put('skull_pole', lane([1.1, 1.9], 4, 3.4), { size: 1.4 }),
    ],
    air: { kind: 'spore', color: [0.8, 0.35, 0.4], rate: 26 },
  },
  // Medusa's Coil: the burned plantation at Riverside, a porch of columns still standing, a stone head fallen in the court.
  medusa_gorgon: {
    candle: 'votive',
    ground: { texture: 'cobble', tint: [0.34, 0.3, 0.28], gain: 1.15, reach: 12, bands: [{ r0: 0, r1: 0.55, k: 0.8, tint: [0.22, 0.2, 0.2] }] },
    puts: [ // (round 71: the manor, its porch, wings, wall and stone people are laid by its place, world/places/gorgon.ts)
      put('fountain', at(0.6, 180, { face: 'in' }), { heart: true }),
      put('statue_head', at(0.9, 70, { face: 'free' }), { size: 1.4 }),
      put('statue_column', ring(0.92, 4, { arc: [250, 320], face: 'free' }), { size: 1.1 }), // the stone-struck
      put('urn', scatter(5, [0.84, 0.97], { arc: [20, 130] }), { size: 1.2 }),
      put('prop:firepit', ring(0.85, 3, { arc: [40, 110] }), { size: 1.3 }),
    ],
    air: { kind: 'ash', color: [0.78, 0.76, 0.72], rate: 24 },
  },
  // The Horror at Martin's Beach: a shore of pale sand, a wreck the tide left, rock, barrels, lamps on poles, bonfires.
  martins_beach_horror: {
    candle: 'driftwood',
    ground: { texture: 'sand', tint: [0.56, 0.5, 0.4], gain: 1.25, reach: 12, bands: [{ r0: 0.72, r1: 1.05, k: 0.78, tint: [0.3, 0.3, 0.28] }] },
    puts: [
      put('barrel', scatter(6, [0.82, 1.0])),
      put('chest', at(0.9, 105, { face: 'free' })),
      put('log', scatter(4, [0.88, 1.0], { face: 'free' })),
      put('prop:firepit', ring(0.86, 3, { arc: [100, 260] }), { size: 1.8 }),
    ],
    air: { kind: 'spray', color: [0.75, 0.82, 0.85], rate: 16 },
  },
  // Beneath the pyramids: a court of the dead's temple, a sun-wheel of paving, a colonnade, a gate of two pylons and an avenue of sphinxes.
  colossus_pyramids: {
    candle: 'votive',
    ground: { texture: 'slab', tint: [0.62, 0.55, 0.4], gain: 1.3, reach: 14, bands: [{ r0: 0.5, r1: 0.56, k: 0.6 }], spokes: { n: 12, width: 5, k: 1.3, r0: 0.1, r1: 1 } },
    puts: [
      put('column', ring(0.97, 10, { arc: [25, 335] }), { size: 1.05 }), // the colonnade
      put('sphinx', lane([1.8, 2.5], 3, 6, 90), { size: 1.2 }), // (the avenue beyond the pylons, laid by round 71's place, world/places/colossus.ts)
      put('statue_head', at(0.62, 180, { face: 'in' }), { heart: true, size: 2.2 }), // a king, broken at the neck
      put('prop:firepit', ring(0.84, 6), { size: 1.5 }),
    ],
    air: { kind: 'dust', color: [0.8, 0.7, 0.5], rate: 20 },
  },
  // Yig's mound on the prairie: totems of his people, bones, a wagon left, the dry wind.
  yig: {
    candle: 'skull',
    ground: { texture: 'dirt', tint: [0.52, 0.42, 0.3], gain: 1.3, reach: 12, bands: [{ r0: 0, r1: 0.4, k: 0.8 }] },
    puts: [
      put('totem', ring(1.0, 8, { face: 'in' }), { size: [1.0, 1.25] }),
      put('skull_pole', ring(0.88, 10, { jitter: 8 })),
      // (round 71: the coil, its dunes, its shrine and the wagon are laid by its place, world/places/yig.ts)
      put('prop:firepit', ring(0.85, 4, { arc: [50, 310] }), { size: 1.4 }),
      put('skull_pole', lane([1.1, 1.45], 3, 3.4), { size: 1.2 }),
    ],
    air: { kind: 'dust', color: [0.72, 0.6, 0.42], rate: 24 },
  },
  // Nug and Yeb at the Mound: black basalt, a stepped mound with a mouth, crags and a deep red coal in the dark.
  nug: {
    candle: 'cairn',
    ground: { texture: 'rock', tint: [0.3, 0.28, 0.32], gain: 1.2, reach: 12, bands: [{ r0: 0, r1: 0.35, k: 0.6 }] },
    puts: [
      put('ziggurat', at(0.78, 180, { face: 'in' }), { heart: true, size: 1.0 }),
      put('rock_tall', ring(1.0, 9, { jitter: 10 }), { size: [1.1, 1.7] }),
      // (round 71: the twin shrines, the gallery, the channels and the road's obelisks are laid by its place, world/places/nug.ts)
      put('rock_large', scatter(6, [0.9, 1.02]), { size: [0.8, 1.1] }),
      put('prop:firepit', ring(0.84, 4), { size: 1.5 }),
      put('prop:block', lane([1.2, 1.5], 3, 4.4), { size: 0.7 }),
    ],
    air: { kind: 'ember', color: [0.85, 0.25, 0.1], rate: 10 },
  },
  // Bokrug in the lake of Ib: sea-green mud, the idol on its pedestal, lilies on black water, the carved stones of a drowned people, green fire.
  bokrug: {
    candle: 'driftwood',
    ground: { texture: 'mud', tint: [0.3, 0.42, 0.38], gain: 1.2, reach: 12, bands: [{ r0: 0, r1: 0.5, k: 0.8, tint: [0.2, 0.32, 0.3] }, { r0: 0.8, r1: 1.0, k: 0.8 }] },
    puts: [
      put('idol', at(0.55, 180, { face: 'in' }), { heart: true, size: 1.5, lit: 'sigil', glow: 'green' }),
      put('prop:monolith', ring(1.0, 9, { jitter: 8, face: 'in' }), { size: [1.1, 1.5] }),
      put('lily', scatter(16, [0.3, 0.97]), { size: [0.8, 1.5], walk: true }),
      put('plant_bush', scatter(10, [0.85, 0.98]), { size: [1, 1.6] }),
      put('stump_old', scatter(5, [0.8, 0.98]), { size: [1.2, 2] }),
      // (round 71: the court's towers, colonnade, quay and the road's braziers are laid by its place, world/places/bokrug.ts)
    ],
    air: { kind: 'spore', color: [0.35, 0.9, 0.7], rate: 22 },
  },
  // The Other Gods atop Hatheg-Kla: a summit of wind-scoured snow and stone, a ring of trilithons older than men, a pale light that has no source.
  other_gods: {
    candle: 'cairn',
    ground: { texture: 'snow', tint: [0.6, 0.62, 0.72], gain: 0.95, reach: 12, bands: [{ r0: 0, r1: 0.25, k: 0.8, tint: [0.45, 0.47, 0.58] }] }, // (snow under a lantern is the brightest ground there is: a slab of it filled a cutscene's foreground)
    puts: [
      put('trilith', ring(1.0, 7, { jitter: 4, face: 'in' }), { size: 1.2 }),
      put('rocks_tall', ring(0.92, 6, { jitter: 25 }), { size: [1, 1.5] }),
      // (round 71: the ring of peaks, the carved spires and stones and the rings of light are laid by its place, world/places/othergods.ts)
      put('rocks_tall', lane([1.1, 1.4], 2, 3.8), { size: 1.4 }),
    ],
    air: { kind: 'flake', color: [0.9, 0.92, 1], rate: 34 },
  },
};
