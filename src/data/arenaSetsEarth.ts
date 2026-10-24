/**
 * The sets of the waking world's open arenas (round 61; data/arenaSets.ts): each horror's ground as its story makes it. The fog stands
 * at the ring's radius and a metre and a half; what stands inside it (to 1.0 of the radius) is seen from within, silhouetted against
 * its light, and what stands beyond (from 1.2) is seen from the way in. Round 72, asked to clear the arenas of their first props ("the
 * lanterns, which are inconsistently positioned within the otherwise structured arena"): the court of each is laid by its place
 * (world/places), so a set keeps its ground, its air and its candle, and a centrepiece only where it is the fight's one fitting heart. Data only.
 */

import { at, put, type ArenaSet } from './arenaSets';

export const EARTH_SETS: Readonly<Record<string, ArenaSet>> = {
  // The Colour Out of Space: the Gardners' blasted heath, a grey dust where nothing grows, a well, and a light in it that is of no colour a man has a name for.
  colour_out_of_space: {
    candle: 'cairn',
    ground: { texture: 'rot', tint: [0.46, 0.46, 0.5], gain: 1.2, reach: 14, bands: [{ r0: 0, r1: 0.3, k: 0.55, tint: [0.3, 0.3, 0.36] }, { r0: 0.3, r1: 0.62, k: 1.3, tint: [0.66, 0.66, 0.68] }] },
    puts: [], // (round 72: the heath, the farmhouse, the well and the dead orchard are laid by its place, world/places/colour.ts; the first set's scattered pieces are gone)
    air: { kind: 'spore', color: [0.86, 0.2, 0.6], rate: 22 },
  },
  // The witches' sabbat on the island in the black river (round 68; Lovecraft: "the dark valley of the white stone beyond Meadow Hill and ... the unpeopled island in the river"): white earth, thirteen standing stones each with its balefire at its foot, the old white stone, a pentacle in the earth, and the Black Man at the book.
  black_man: {
    candle: 'skull',
    ground: { texture: 'dirt', tint: [0.8, 0.78, 0.72], gain: 1.5, reach: 18, bands: [{ r0: 0, r1: 0.5, k: 1.15, tint: [0.88, 0.86, 0.8] }, { r0: 0.5, r1: 0.72, k: 0.8, tint: [0.55, 0.52, 0.5] }] },
    puts: [
      put('altar_stone', at(0.58, 180, { face: 'in' }), { heart: true, size: 1.7, tint: [0.96, 0.95, 0.9], keep: 0.25 }), // the old white stone, where the book is laid: all that is left of the first set (round 72)
    ],
    air: { kind: 'ember', color: [1, 0.5, 0.22], rate: 16 },
  }, // (round 71: the thirteen and the outer stones are baked menhirs, laid by its place, world/places/blackman.ts)
  // Simon Orne's burying ground at Salem: stones in their rows, a crypt, a salt circle in the dust, a ward drawn in it, lamps down the way in.
  simon_orne: {
    candle: 'grave',
    ground: { texture: 'dirt', tint: [0.4, 0.38, 0.34], gain: 1.25, reach: 12, bands: [{ r0: 0.33, r1: 0.42, k: 1.7, tint: [0.78, 0.78, 0.74] }] },
    puts: [], // (round 72: the lots, rails, trees, chapel, crypt and the open grave are laid by its place, world/places/orne.ts; the first set's scattered pieces are gone)
    air: { kind: 'mote', color: [0.9, 0.85, 0.62], rate: 14 },
  },
  // Edward Hutchinson's Pawtuxet manor: a garden gone to hedge and ruin, a porch of columns, a dry fountain, an obelisk to the family and lamps that still burn.
  edward_hutchinson: {
    candle: 'grave',
    ground: { texture: 'cobble', tint: [0.4, 0.36, 0.32], gain: 1.2, reach: 12, bands: [{ r0: 0.46, r1: 0.58, k: 0.7 }] },
    puts: [], // (round 72: the keep, its walls, yard and rod are laid by its place, world/places/hutchinson.ts; the first set's scattered pieces are gone)
    air: { kind: 'drift', color: [0.7, 0.72, 0.78], rate: 4 },
  },
  // Shub-Niggurath's black grove: trees that fork like horns, skulls on stakes, giant fungi, and an altar of stump and root; the air thick with spores.
  shub_niggurath: {
    candle: 'skull',
    ground: { texture: 'flesh', tint: [0.4, 0.28, 0.28], gain: 1.15, reach: 14, bands: [{ r0: 0, r1: 0.45, k: 0.7, tint: [0.26, 0.16, 0.17] }, { r0: 0.75, r1: 1.0, k: 0.78 }] },
    puts: [
      put('stump_old', at(0.68, 180, { face: 'in' }), { heart: true, size: 3.4 }), // the altar: all that is left of the first set (round 72); the grove is laid by its place, world/places/shub.ts
    ],
    air: { kind: 'spore', color: [0.8, 0.35, 0.4], rate: 26 },
  },
  // Medusa's Coil: the burned plantation at Riverside, a porch of columns still standing, a stone head fallen in the court.
  medusa_gorgon: {
    candle: 'votive',
    ground: { texture: 'cobble', tint: [0.34, 0.3, 0.28], gain: 1.15, reach: 12, bands: [{ r0: 0, r1: 0.55, k: 0.8, tint: [0.22, 0.2, 0.2] }] },
    puts: [], // (round 72: the manor, its porch, wings, wall and stone people are laid by its place, world/places/gorgon.ts; the first set's scattered pieces are gone)
    air: { kind: 'ash', color: [0.78, 0.76, 0.72], rate: 24 },
  },
  // The Horror at Martin's Beach: a shore of pale sand, a wreck the tide left, rock, barrels, lamps on poles, bonfires.
  martins_beach_horror: {
    candle: 'driftwood',
    ground: { texture: 'sand', tint: [0.56, 0.5, 0.4], gain: 1.25, reach: 12, bands: [{ r0: 0.72, r1: 1.05, k: 0.78, tint: [0.3, 0.3, 0.28] }] },
    puts: [], // (round 72: the shacks, barricades, pier and wreck are laid by its place, world/places/martins.ts; the first set's scattered pieces are gone)
    air: { kind: 'spray', color: [0.75, 0.82, 0.85], rate: 16 },
  },
  // Beneath the pyramids: a court of the dead's temple, a sun-wheel of paving, a colonnade, a gate of two pylons and an avenue of sphinxes.
  colossus_pyramids: {
    candle: 'votive',
    ground: { texture: 'slab', tint: [0.62, 0.55, 0.4], gain: 1.3, reach: 14, bands: [{ r0: 0.5, r1: 0.56, k: 0.6 }], spokes: { n: 12, width: 5, k: 1.3, r0: 0.1, r1: 1 } },
    puts: [
      put('statue_head', at(0.62, 180, { face: 'in' }), { heart: true, size: 2.2 }), // a king, broken at the neck: all that is left of the first set (round 72); the temenos is laid by its place, world/places/colossus.ts
    ],
    air: { kind: 'dust', color: [0.8, 0.7, 0.5], rate: 20 },
  },
  // Yig's mound on the prairie: totems of his people, bones, a wagon left, the dry wind.
  yig: {
    candle: 'skull',
    ground: { texture: 'dirt', tint: [0.52, 0.42, 0.3], gain: 1.3, reach: 12, bands: [{ r0: 0, r1: 0.4, k: 0.8 }] },
    puts: [], // (round 72: the coil, its dunes, its shrine and the wagon are laid by its place, world/places/yig.ts; the first set's scattered pieces are gone)
    air: { kind: 'dust', color: [0.72, 0.6, 0.42], rate: 24 },
  },
  // Nug and Yeb at the Mound: black basalt, a stepped mound with a mouth, crags and a deep red coal in the dark.
  nug: {
    candle: 'cairn',
    ground: { texture: 'rock', tint: [0.3, 0.28, 0.32], gain: 1.2, reach: 12, bands: [{ r0: 0, r1: 0.35, k: 0.6 }] },
    puts: [], // (round 72: the twin shrines, the gallery, the channels and the road's obelisks are laid by its place, world/places/nug.ts; the first set's scattered pieces are gone)
    air: { kind: 'ember', color: [0.85, 0.25, 0.1], rate: 10 },
  },
  // Bokrug in the lake of Ib: sea-green mud, the idol on its pedestal, lilies on black water, the carved stones of a drowned people, green fire.
  bokrug: {
    candle: 'driftwood',
    ground: { texture: 'mud', tint: [0.3, 0.42, 0.38], gain: 1.2, reach: 12, bands: [{ r0: 0, r1: 0.5, k: 0.8, tint: [0.2, 0.32, 0.3] }, { r0: 0.8, r1: 1.0, k: 0.8 }] },
    puts: [
      put('idol', at(0.55, 180, { face: 'in' }), { heart: true, size: 1.5, lit: 'sigil', glow: 'green' }), // all that is left of the first set (round 72); the court's towers, colonnade and quay are laid by its place, world/places/bokrug.ts
    ],
    air: { kind: 'spore', color: [0.35, 0.9, 0.7], rate: 22 },
  },
  // The Other Gods atop Hatheg-Kla: a summit of wind-scoured snow and stone, a ring of trilithons older than men, a pale light that has no source.
  other_gods: {
    candle: 'cairn',
    ground: { texture: 'snow', tint: [0.6, 0.62, 0.72], gain: 0.95, reach: 12, bands: [{ r0: 0, r1: 0.25, k: 0.8, tint: [0.45, 0.47, 0.58] }] }, // (snow under a lantern is the brightest ground there is: a slab of it filled a cutscene's foreground)
    puts: [], // (round 72: the ring of peaks, the carved spires and stones and the rings of light are laid by its place, world/places/othergods.ts; the first set's scattered pieces are gone)
    air: { kind: 'flake', color: [0.9, 0.92, 1], rate: 34 },
  },
};
