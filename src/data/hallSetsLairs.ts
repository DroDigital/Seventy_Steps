/**
 * The sets of the boss halls of the lairs (round 62; data/hallSetsEarth.ts says how they are read): the thirteen rooms where a single
 * horror of the tales is met, each furnished as its tale has it. Data only.
 */

import { at, put, ring, scatter, type ArenaSet } from './arenaSets';

export const LAIR_HALLS: Readonly<Record<string, ArenaSet>> = {
  // Dr Munoz's cold room: the pipes of his cooling machinery, crates and drums, a bench, a lamp, jars on shelves.
  dr_munoz: {
    puts: [
      put('pipes', ring(0.93, 6, { arc: [60, 300] }), { size: 0.45 }),
      put('crate', scatter(5, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.4] }),
      put('barrel', scatter(4, [0.84, 0.97], { arc: [80, 280] }), { size: 1.2 }),
      put('bench', at(0.93, 270, { face: 90 }), { size: 1.2 }),
      put('urn', scatter(5, [0.8, 0.96], { face: 'free' }), { size: 1.2, tint: [0.62, 0.7, 0.74] }),
      put('lantern', scatter(3, [0.8, 0.96], { face: 'free' }), { lit: 'lamp', walk: true, size: 1.5 }),
    ],
  },
  // Charles Le Sorcier's laboratory: alchemist's vessels everywhere, a chalice and a bowl, a coffin, a skeleton, his candles.
  charles_le_sorcier: {
    puts: [
      put('urn', scatter(5, [0.82, 0.97], { face: 'free' }), { size: [1, 1.6] }),
      put('altar_stone', at(0.92, 130, { face: 'in' }), { size: 1 }),
      put('altar_stone', at(0.92, 230, { face: 'in' }), { size: 1 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('coffin', at(0.93, 270, { face: 90 }), { size: 1.2 }),
      put('skeleton', at(0.9, 180, { face: 'free' }), { size: 0.9 }),
      put('chalice', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.6 }),
      put('bowl', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.5 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The Outsider's mirror room: a ruin of a castle's hall, broken columns, a statue's head, a coffin, a gate hanging, a skeleton.
  the_outsider: {
    puts: [
      put('column', ring(0.95, 6, { arc: [50, 310] }), { size: [0.6, 0.85] }),
      put('statue_head', at(0.95, 180, { face: 'in' }), { size: 0.9, tint: [0.58, 0.6, 0.66] }),
      put('coffin', ring(0.92, 3, { arc: [90, 270], face: 'free' }), { size: 1.2 }),
      put('iron_gate', at(0.96, 270, { face: 90 })),
      put('grave_broken', scatter(4, [0.84, 0.97], { face: 'free' })),
      put('skeleton', at(0.88, 110, { face: 'free' }), { size: 0.9 }),
    ],
  },
  // The Hound's ossuary: coffins in their rows, bones, vessels, crosses, a chest with a jade amulet in it, benches.
  the_hound: {
    puts: [
      put('coffin', ring(0.92, 6, { arc: [60, 300], face: 'out' }), { size: 1.2 }),
      put('skeleton', scatter(4, [0.82, 0.97], { face: 'free' }), { size: 0.9 }),
      put('urn', scatter(5, [0.82, 0.97], { face: 'free' }), { size: 1.2 }),
      put('cross', ring(0.97, 3, { arc: [100, 260], face: 'in' }), { size: 1.2 }),
      put('grave_cross', scatter(3, [0.86, 0.97], { arc: [70, 290], face: 'free' })),
      put('chest', at(0.94, 140, { face: 'in' }), { size: 1.2 }),
      put('bench', at(0.93, 40, { face: 'in' }), { size: 1.2 }),
    ],
  },
  // The attic in Boston where the Unnamable is met: hay and old chests, crates, a slate tomb's tablets, candles in the dust.
  the_unnamable: {
    puts: [
      put('chest', ring(0.93, 5, { arc: [60, 300], face: 'out', jitter: 12 }), { size: [1.1, 1.5] }),
      put('crate', scatter(5, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.4] }),
      put('hay_bale', scatter(3, [0.86, 0.97], { arc: [90, 270], face: 'free' }), { size: 1.2 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('grave_wide', at(0.95, 180, { face: 'in' }), { size: 1.3 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The vault in the tomb: niches cut in its walls with the dead in them, urns, candles and a telephone wire's end where it comes down.
  voice_in_the_tomb: {
    puts: [
      put('crypt_small', ring(0.93, 4, { arc: [80, 280], face: 'in' }), { size: 0.85 }),
      put('coffin', scatter(3, [0.84, 0.97], { arc: [70, 290], face: 'free' }), { size: 1.2 }),
      put('urn', scatter(5, [0.82, 0.97], { face: 'free' }), { size: 1.2 }),
      put('wall_ruin', ring(0.95, 3, { arc: [110, 250], face: 'in' }), { size: 0.9 }),
      put('grave_cross', scatter(3, [0.86, 0.97], { arc: [70, 290], face: 'free' })),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The cellar of the Shunned House: casks and crates, nitre fungus risen from the floor, the spade of the men who dug, the stain on the earth.
  shunned_house_entity: {
    puts: [
      put('barrel', ring(0.93, 6, { arc: [60, 300], jitter: 10 }), { size: 1.3 }),
      put('crate', scatter(4, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.3] }),
      put('mushroom_tall', scatter(6, [0.82, 0.98], { face: 'free' }), { size: [0.5, 0.8], tint: [0.72, 0.74, 0.62] }),
      put('shovel_dirt', at(0.9, 130, { face: 'free' }), { size: 1.3 }),
      put('wall_ruin', ring(0.96, 3, { arc: [110, 250], face: 'in' }), { size: 0.9 }),
      put('log', scatter(2, [0.86, 0.97], { arc: [90, 270], face: 'free' }), { size: 0.9 }),
    ],
  },
  // Suydam's shrine on the canal: a basin of the dark water, lilies, a statue's head, candles in rows, columns of a half-Eastern, half-Western kind.
  lilith: {
    puts: [
      put('fountain', at(0.88, 180), { size: 0.5, tint: [0.34, 0.4, 0.46] }),
      put('lily', scatter(7, [0.82, 0.97], { face: 'free' }), { walk: true, size: 1.6 }),
      put('statue_head', ring(0.95, 3, { arc: [100, 260], face: 'in' }), { size: 0.7 }),
      put('column', ring(0.97, 4, { arc: [60, 300] }), { size: 0.75 }),
      put('urn', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.2 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The old sea-captain's front hall: bottles in their dozens that hang on strings, a chest, a bench, a cannon, a flag gone grey.
  terrible_old_man: {
    puts: [
      put('urn', scatter(5, [0.8, 0.97], { face: 'free' }), { size: [0.9, 1.4], tint: [0.5, 0.62, 0.58] }),
      put('chest', ring(0.93, 3, { arc: [90, 270], face: 'in' }), { size: 1.3 }),
      put('bench', at(0.93, 260, { face: 90 }), { size: 1.2 }),
      put('cannon', at(0.9, 100, { face: 'in' }), { size: 0.9 }),
      put('barrel', scatter(4, [0.84, 0.97], { arc: [80, 280] }), { size: 1.2 }),
      put('flag_pirate', at(0.97, 180, { face: 'in' }), { size: 0.8 }),
      put('lantern', scatter(3, [0.8, 0.96], { face: 'free' }), { lit: 'lamp', walk: true, size: 1.5 }),
    ],
  },
  // The Whateleys' loft: hay and crates, boarded chests, a pallet, a cart's wheel and a lamp turned low.
  wilbur_whateley: {
    puts: [
      put('hay_bale', ring(0.93, 5, { arc: [60, 300], face: 'free', jitter: 12 }), { size: [1, 1.4] }),
      put('crate', scatter(5, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.4] }),
      put('chest', at(0.94, 125, { face: 'in' }), { size: 1.3 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('bedroll', at(0.92, 265, { face: 90 }), { size: 1.4 }),
      put('cart', at(0.92, 215, { face: 'free' }), { size: 0.9 }),
      put('lantern', scatter(3, [0.8, 0.96], { face: 'free' }), { lit: 'lamp', walk: true, size: 1.5 }),
    ],
  },
  // Ephraim Waite's study at Derby: benches, chests, a cross hung the wrong way up, a bust, candles, vessels.
  ephraim_waite: {
    puts: [
      put('bench', ring(0.93, 4, { arc: [70, 290], face: 'in' }), { size: 1.2 }),
      put('chest', scatter(3, [0.84, 0.97], { arc: [70, 290], face: 'free' }), { size: 1.2 }),
      put('cross_wood', at(0.96, 180, { face: 'in' }), { size: 1.4 }),
      put('statue_head', at(0.95, 125, { face: 'in' }), { size: 0.55 }),
      put('urn', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.2 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The turret studio of the dreamer: a couch and pallets, a laurelled head, columns of a Greek mind, poppies, a chalice, candles.
  hypnos: {
    puts: [
      put('statue_head', at(0.95, 180, { face: 'in' }), { size: 0.75, tint: [0.7, 0.7, 0.74] }),
      put('column', ring(0.96, 4, { arc: [60, 300] }), { size: 0.75 }),
      put('bedroll', ring(0.9, 3, { arc: [80, 280], face: 'free' }), { size: 1.4 }),
      put('bench', at(0.93, 270, { face: 90 }), { size: 1.2 }),
      put('lily', scatter(6, [0.8, 0.97], { face: 'free' }), { walk: true, size: 1.4, tint: [0.78, 0.42, 0.42] }),
      put('chalice', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.6 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // Zann's garret, its window onto a street that is not there: a pallet, a chest, a viol's case, a bowl, a grille from a window, candles.
  zann_window_thing: {
    puts: [
      put('bedroll', at(0.92, 100, { face: 270 }), { size: 1.4 }),
      put('chest', ring(0.93, 4, { arc: [100, 260], face: 'out' }), { size: [1.1, 1.4] }),
      put('crate', scatter(4, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.3] }),
      put('iron_fence_broken', ring(0.97, 3, { arc: [120, 240], face: 'in' })),
      put('skeleton', at(0.9, 235, { face: 'free' }), { size: 0.9 }),
      put('bowl', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.5 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
};
