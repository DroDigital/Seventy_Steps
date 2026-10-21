/**
 * The sets of the waking world's open arenas (round 61; data/arenaSets.ts): each horror's ground as its story makes it. The fog stands
 * at the ring's radius and a metre and a half; what stands inside it (to 1.0 of the radius) is seen from within, silhouetted against
 * its light, and what stands beyond (from 1.2) is seen from the way in. Data only.
 */

import { at, lane, put, ring, scatter, type ArenaSet } from './arenaSets';

export const EARTH_SETS: Readonly<Record<string, ArenaSet>> = {
  // The Colour Out of Space: the Gardners' blasted heath, a grey dust where nothing grows, a well, and a light in it that is of no colour a man has a name for.
  colour_out_of_space: {
    ground: { texture: 'rot', tint: [0.46, 0.46, 0.5], gain: 1.2, reach: 14, bands: [{ r0: 0, r1: 0.3, k: 0.55, tint: [0.3, 0.3, 0.36] }, { r0: 0.3, r1: 0.62, k: 1.3, tint: [0.66, 0.66, 0.68] }] },
    puts: [
      put('inlay_ring', at(0, 0), { size: 7.5, glow: 'magenta', lit: 'sigil' }),
      put('meteor', ring(0.9, 3, { arc: [320, 395], jitter: 10 }), { size: [0.9, 1.3], glow: 'magenta' }), // what is left of the stone that fell
      put('prop:tree', ring(1.0, 9, { jitter: 14 }), { size: [1.1, 1.5] }), // the grey trees, their bark ash
      put('prop:tree', ring(1.3, 8, { jitter: 18 }), { size: [1.3, 1.7] }),
      put('wall_ruin', ring(0.92, 5, { arc: [110, 190] }), { join: true, size: 1.1 }), // the farmhouse, fallen in
      put('trunk', at(0.88, 150, { face: 'free' }), { size: 1.2 }),
      put('cart', at(0.9, 75, { face: 'free' })),
      put('grave_wide', ring(0.92, 3, { arc: [240, 300], face: 'out' }), { size: 1.1 }), // the Gardners' stones
      put('cross_wood', at(0.92, 270, { face: 'out' })),
      put('prop:fence', ring(0.97, 6, { arc: [20, 100], jitter: 6 })),
      put('rock_large', lane([1.25, 1.7], 3, 3.8), { size: [1, 1.5] }),
    ],
    air: { kind: 'spore', color: [0.86, 0.2, 0.6], rate: 22 },
  },
  // The witches' sabbat in the ravine: the Black Man at the book, a ring of stones, skulls on poles, a pentacle in the leaf-mould and a fire that burns red.
  black_man: {
    ground: { texture: 'leaves', tint: [0.46, 0.36, 0.32], gain: 1.3, reach: 12, bands: [{ r0: 0, r1: 0.55, k: 0.75, tint: [0.3, 0.2, 0.19] }] },
    puts: [
      put('inlay_star', at(0, 0), { size: 11, glow: 'magenta', lit: 'sigil' }),
      put('prop:firepit', at(0.24, 180), { size: 3 }), // the fire, at the Black Man's back (not at his feet, where its flame would stand across him)
      put('stump_old', ring(0.84, 9, { arc: [40, 320], face: 'in' }), { size: 1.0 }), // the witches' stools
      put('prop:monolith', ring(1.0, 11, { jitter: 8, face: 'in' }), { size: [0.95, 1.35] }),
      put('skull_pole', ring(0.9, 14), { size: [0.9, 1.2] }),
      put('altar_stone', at(0.58, 180, { face: 'in' }), { heart: true, size: 1.4 }), // the Devil's table
      put('prop:firepit', ring(0.8, 4, { arc: [60, 300] }), { size: 1.6 }),
      put('prop:monolith', ring(1.4, 7, { jitter: 10 }), { size: [1.5, 2] }),
      put('skull_pole', lane([1.1, 1.8], 4, 3.2), { size: 1.25 }),
      put('prop:firepit', lane([1.25, 1.7], 2, 4.4), { size: 1.4 }),
      put('prop:tree', scatter(8, [1.25, 1.7]), { size: [1.1, 1.5] }),
    ],
    air: { kind: 'ember', color: [1, 0.5, 0.22], rate: 16 },
  },
  // Simon Orne's burying ground at Salem: stones in their rows, a crypt, a salt circle in the dust, a ward drawn in it, lamps down the way in.
  simon_orne: {
    ground: { texture: 'dirt', tint: [0.4, 0.38, 0.34], gain: 1.25, reach: 12, bands: [{ r0: 0.33, r1: 0.42, k: 1.7, tint: [0.78, 0.78, 0.74] }] },
    puts: [
      put('inlay_ring', at(0, 0), { size: 9, glow: 'purple', lit: 'sigil' }),
      put('crypt', at(0.98, 180, { face: 'in' }), { size: 1.1, heart: true }),
      put('grave_cross', ring(0.95, 4, { arc: [60, 140], face: 'out' }), { size: 1.2 }),
      put('grave_round', ring(0.95, 4, { arc: [220, 300], face: 'out' })),
      put('grave_wide', ring(0.88, 5, { arc: [70, 290], face: 'out', jitter: 20 })),
      put('grave_broken', scatter(5, [0.8, 0.98], { arc: [60, 300], face: 'free' })),
      put('urn', scatter(6, [0.84, 0.97], { arc: [120, 240] }), { size: 1.1 }), // the vessels of his work
      put('candles', scatter(10, [0.3, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }), // lit for the dead
      put('cross', scatter(4, [0.82, 0.97], { arc: [60, 300], face: 'out' }), { size: 1.1 }),
      put('coffin', at(0.5, 90, { face: 'free' }), { heart: true }),
      put('iron_fence', ring(1.12, 5, { arc: [150, 210], face: 90 })), // the burying ground's railing, behind the crypt
      put('lightpost', lane([1.3, 1.9], 3, 4.6), { lit: 'lamp' }),
      put('crypt_small', at(1.4, 130, { face: 'out' })),
      put('pine_crooked', scatter(7, [1.25, 1.7]), { size: [1, 1.4] }),
    ],
    air: { kind: 'mote', color: [0.9, 0.85, 0.62], rate: 14 },
  },
  // Edward Hutchinson's Pawtuxet manor: a garden gone to hedge and ruin, a porch of columns, a dry fountain, an obelisk to the family and lamps that still burn.
  edward_hutchinson: {
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
      put('iron_gate', at(1.2, 0, { side: 5.2, mirror: true, face: 90 })),
      put('lightpost', lane([1.45, 1.95], 3, 4.6), { lit: 'lamp' }),
      put('pine_crooked', scatter(8, [1.25, 1.7]), { size: [1, 1.4] }),
    ],
    air: { kind: 'drift', color: [0.7, 0.72, 0.78], rate: 4 },
  },
  // Shub-Niggurath's black grove: trees that fork like horns, skulls on stakes, giant fungi, and an altar of stump and root; the air thick with spores.
  shub_niggurath: {
    ground: { texture: 'flesh', tint: [0.4, 0.28, 0.28], gain: 1.15, reach: 14, bands: [{ r0: 0, r1: 0.45, k: 0.7, tint: [0.26, 0.16, 0.17] }, { r0: 0.75, r1: 1.0, k: 0.78 }] },
    puts: [
      put('inlay_spiral', at(0, 0), { size: 20, glow: 'magenta', lit: 'sigil' }),
      put('horn_tree', ring(1.0, 18, { jitter: 8 }), { size: [1.0, 1.4] }),
      put('horn_tree', ring(1.32, 20, { jitter: 12 }), { size: [1.3, 1.9] }),
      put('skull_pole', ring(0.9, 16, { jitter: 6 }), { size: [1, 1.3] }),
      put('mushroom_tall', scatter(12, [0.78, 0.97]), { size: [0.9, 1.6] }),
      put('stump_old', at(0.68, 180, { face: 'in' }), { heart: true, size: 3.4 }), // the altar
      put('prop:firepit', ring(0.85, 6), { size: 1.4 }),
      put('skull_pole', lane([1.1, 1.9], 4, 3.4), { size: 1.4 }),
    ],
    air: { kind: 'spore', color: [0.8, 0.35, 0.4], rate: 26 },
  },
  // Medusa's Coil: the burned plantation at Riverside, a porch of columns still standing, a stone head fallen in the court, a snake coiled in the ash.
  medusa_gorgon: {
    ground: { texture: 'cobble', tint: [0.34, 0.3, 0.28], gain: 1.15, reach: 12, bands: [{ r0: 0, r1: 0.55, k: 0.8, tint: [0.22, 0.2, 0.2] }] },
    puts: [
      put('inlay_serpent', at(0, 0), { size: 9, glow: 'green', lit: 'sigil' }),
      put('column', ring(0.95, 7, { arc: [135, 225] }), { join: true, size: 1.05 }),
      put('wall_ruin', ring(1.2, 6, { arc: [140, 220] }), { join: true, size: 1.3 }),
      put('fountain', at(0.6, 180, { face: 'in' }), { heart: true }),
      put('statue_head', at(0.9, 70, { face: 'free' }), { size: 1.4 }),
      put('statue_column', ring(0.92, 4, { arc: [250, 320], face: 'free' }), { size: 1.1 }), // the stone-struck
      put('urn', scatter(5, [0.84, 0.97], { arc: [20, 130] }), { size: 1.2 }),
      put('prop:tree', ring(1.3, 9, { jitter: 14 }), { size: [1.2, 1.6] }),
      put('iron_gate', at(1.2, 0, { side: 5.2, mirror: true, face: 90 })),
      put('iron_fence_broken', lane([1.35, 2.0], 3, 3.6, 90)),
      put('prop:firepit', ring(0.85, 3, { arc: [40, 110] }), { size: 1.3 }),
    ],
    air: { kind: 'ash', color: [0.78, 0.76, 0.72], rate: 24 },
  },
  // The Horror at Martin's Beach: a shore of pale sand, a wreck the tide left, rock, barrels, lamps on poles, bonfires.
  martins_beach_horror: {
    ground: { texture: 'sand', tint: [0.56, 0.5, 0.4], gain: 1.25, reach: 12, bands: [{ r0: 0.72, r1: 1.05, k: 0.78, tint: [0.3, 0.3, 0.28] }] },
    puts: [
      put('wreck', at(1.3, 150, { face: 'free' }), { size: 0.9 }),
      put('rowboat', at(0.92, 60, { face: 'free' }), { size: 0.9 }),
      put('canoe', at(0.88, 235, { face: 'free' }), { size: 1.0 }),
      put('barrel', scatter(6, [0.82, 1.0])),
      put('chest', at(0.9, 105, { face: 'free' })),
      put('log', scatter(4, [0.88, 1.0], { face: 'free' })),
      put('prop:firepit', ring(0.86, 3, { arc: [100, 260] }), { size: 1.8 }),
      put('lightpost', lane([1.1, 1.7], 3, 3.3), { lit: 'lamp' }),
      put('rocks_sand_a', ring(1.28, 8, { jitter: 25, face: 'free' }), { size: [0.9, 1.3] }),
      put('rocks_sand_b', scatter(4, [1.1, 1.5]), { size: [0.8, 1.2] }),
    ],
    air: { kind: 'spray', color: [0.75, 0.82, 0.85], rate: 16 },
  },
  // Beneath the pyramids: a court of the dead's temple, a sun-wheel of paving, a colonnade, a gate of two pylons and an avenue of sphinxes.
  colossus_pyramids: {
    ground: { texture: 'slab', tint: [0.62, 0.55, 0.4], gain: 1.3, reach: 14, bands: [{ r0: 0.5, r1: 0.56, k: 0.6 }], spokes: { n: 12, width: 5, k: 1.3, r0: 0.1, r1: 1 } },
    puts: [
      put('inlay_ring', at(0, 0), { size: 12, glow: 'purple', lit: 'sigil' }),
      put('column', ring(0.97, 10, { arc: [25, 335] }), { size: 1.05 }), // the colonnade
      put('pylon', at(1.28, 0, { side: 5.5, mirror: true }), { size: 1.0, lit: 'fire' }),
      put('sphinx', lane([1.5, 2.3], 3, 4.4, 90), { size: 1.2 }),
      put('prop:obelisk', ring(1.35, 5, { arc: [60, 300] }), { size: 2.6 }),
      put('statue_head', at(0.62, 180, { face: 'in' }), { heart: true, size: 2.2 }), // a king, broken at the neck
      put('prop:firepit', ring(0.84, 6), { size: 1.5 }),
    ],
    air: { kind: 'dust', color: [0.8, 0.7, 0.5], rate: 20 },
  },
  // Yig's mound on the prairie: a serpent drawn in the dust, totems of his people, bones, a wagon left, the dry wind.
  yig: {
    ground: { texture: 'dirt', tint: [0.52, 0.42, 0.3], gain: 1.3, reach: 12, bands: [{ r0: 0, r1: 0.4, k: 0.8 }] },
    puts: [
      put('inlay_serpent', at(0, 0), { size: 14, glow: 'green', lit: 'sigil' }),
      put('totem', ring(1.0, 8, { face: 'in' }), { size: [1.0, 1.25] }),
      put('totem', ring(1.35, 5, { jitter: 12 }), { size: 1.6 }),
      put('skull_pole', ring(0.88, 10, { jitter: 8 })),
      put('cart', at(0.92, 140, { face: 'free' }), { size: 1.1 }), // the settlers' wagon
      put('barrel', at(0.95, 128)),
      put('cactus', scatter(10, [1.2, 1.7]), { size: [0.9, 1.4] }),
      put('rocks_tall', scatter(4, [1.1, 1.5]), { size: 1.3 }),
      put('prop:firepit', ring(0.85, 4, { arc: [50, 310] }), { size: 1.4 }),
      put('skull_pole', lane([1.1, 1.8], 4, 3.4), { size: 1.2 }),
    ],
    air: { kind: 'dust', color: [0.72, 0.6, 0.42], rate: 24 },
  },
  // Nug and Yeb at the Mound: black basalt, a stepped mound with a mouth, crags, a spiral of tar and a deep red coal in the dark.
  nug: {
    ground: { texture: 'rock', tint: [0.3, 0.28, 0.32], gain: 1.2, reach: 12, bands: [{ r0: 0, r1: 0.35, k: 0.6 }] },
    puts: [
      put('inlay_spiral', at(0, 0), { size: 10, glow: 'purple', lit: 'sigil' }),
      put('ziggurat', at(0.78, 180, { face: 'in' }), { heart: true, size: 1.0 }),
      put('rock_tall', ring(1.0, 9, { jitter: 10 }), { size: [1.1, 1.7] }),
      put('rock_tall', ring(1.35, 8, { jitter: 14 }), { size: [1.8, 2.6] }),
      put('rock_large', scatter(6, [0.9, 1.02]), { size: [0.8, 1.1] }),
      put('prop:firepit', ring(0.84, 4), { size: 1.5 }),
      put('prop:block', lane([1.3, 1.9], 3, 4.4), { size: 0.7 }),
    ],
    air: { kind: 'ember', color: [0.85, 0.25, 0.1], rate: 10 },
  },
  // Bokrug in the lake of Ib: sea-green mud, the idol on its pedestal, lilies on black water, the carved stones of a drowned people, green fire.
  bokrug: {
    ground: { texture: 'mud', tint: [0.3, 0.42, 0.38], gain: 1.2, reach: 12, bands: [{ r0: 0, r1: 0.5, k: 0.8, tint: [0.2, 0.32, 0.3] }, { r0: 0.8, r1: 1.0, k: 0.8 }] },
    puts: [
      put('idol', at(0.55, 180, { face: 'in' }), { heart: true, size: 1.5, lit: 'sigil', glow: 'green' }),
      put('inlay_ring', at(0, 0), { size: 8, glow: 'green', lit: 'sigil' }),
      put('prop:monolith', ring(1.0, 9, { jitter: 8, face: 'in' }), { size: [1.1, 1.5] }),
      put('lily', scatter(16, [0.3, 0.97]), { size: [0.8, 1.5], walk: true }),
      put('plant_bush', scatter(10, [0.85, 0.98]), { size: [1, 1.6] }),
      put('stump_old', scatter(5, [0.8, 0.98]), { size: [1.2, 2] }),
      put('prop:monolith', ring(1.4, 6, { jitter: 12 }), { size: [1.6, 2.1] }),
      put('lightpost', lane([1.1, 1.8], 4, 3.4), { lit: 'torch' }), // green fires on the way in
    ],
    air: { kind: 'spore', color: [0.35, 0.9, 0.7], rate: 22 },
  },
  // The Other Gods atop Hatheg-Kla: a summit of wind-scoured snow and stone, a ring of trilithons older than men, a pale light that has no source.
  other_gods: {
    ground: { texture: 'snow', tint: [0.6, 0.62, 0.72], gain: 0.95, reach: 12, bands: [{ r0: 0, r1: 0.25, k: 0.8, tint: [0.45, 0.47, 0.58] }] }, // (snow under a lantern is the brightest ground there is: a slab of it filled a cutscene's foreground)
    puts: [
      put('inlay_ring', at(0, 0), { size: 14, glow: 'purple', lit: 'sigil' }),
      put('trilith', ring(1.0, 7, { jitter: 4, face: 'in' }), { size: 1.2 }),
      put('rocks_tall', ring(0.92, 6, { jitter: 25 }), { size: [1, 1.5] }),
      put('rock_tall', ring(1.35, 8, { jitter: 14 }), { size: [1.5, 2.4] }),
      put('pine_crooked', scatter(7, [1.25, 1.7]), { size: [1, 1.4] }),
      put('rocks_tall', lane([1.15, 1.8], 3, 3.8), { size: 1.4 }),
    ],
    air: { kind: 'flake', color: [0.9, 0.92, 1], rate: 34 },
  },
};
