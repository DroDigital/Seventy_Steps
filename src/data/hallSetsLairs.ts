/**
 * The sets of the boss halls of the lairs (round 62; data/hallSetsEarth.ts says how they are read): the thirteen rooms where a single
 * horror of the tales is met, each furnished as its tale has it. Data only.
 */

import { at, put, ring, scatter, wall, type ArenaSet } from './arenaSets';

export const LAIR_HALLS: Readonly<Record<string, ArenaSet>> = {
  // Dr Munoz's cold room: the pipes of his cooling machinery, crates and drums, a bench, a lamp, jars on shelves.
  dr_munoz: {
    puts: [
      put('rh_door', wall(0.972, 16, { walls: [90], face: 'wall' }), { hung: true, join: true, size: 1.1 }), // a lodging room's door (round 79)
      put('ph_pipes', ring(0.95, 6, { arc: [60, 300] }), { size: 1.3, tint: [0.55, 0.64, 0.7], keep: 0.2 }), // the cold plant's pipes, rimed (round 79: Poly Haven, CC0)
      put('ph_compressor', at(0.86, 130, { mirror: true, face: 'in' }), { size: 1.3, tint: [0.55, 0.64, 0.7], keep: 0.35 }), // the cold plant's compressors (round 79: Poly Haven's old military compressor, CC0)
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
      put('al_still', at(0.95, 150, { face: 'in' }), { heart: true, size: 2, keep: 0.8 }), // the great still (round 79: FlukierJupiter's, CC BY)
      put('lb_retort', scatter(3, [0.8, 0.95], { face: 'free' }), { size: 2, keep: 0.7 }),
      put('lb_round', scatter(3, [0.8, 0.95], { face: 'free' }), { size: 2, keep: 0.7 }),
      put('lb_florence', scatter(2, [0.8, 0.95], { face: 'free' }), { size: 2, keep: 0.7 }),
      put('lb_stand', at(0.9, 130, { face: 'free' }), { size: 2, keep: 0.5 }),
      put('urn', scatter(9, [0.82, 0.97], { face: 'free' }), { size: [1, 1.6] }),
      put('altar_stone', at(0.92, 130, { face: 'in' }), { size: 1 }),
      put('altar_stone', at(0.92, 230, { face: 'in' }), { size: 1 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('coffin', at(0.93, 270, { face: 90 }), { size: 1.2 }),
      put('skeleton', at(0.9, 180, { face: 'free' }), { size: 0.9 }),
      put('chalice', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.6 }),
      put('bowl', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.5 }),
      put('candles', scatter(8, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The Outsider's mirror room: a ruin of a castle's hall, broken columns, a statue's head, a coffin, a gate hanging, a skeleton.
  the_outsider: {
    puts: [
      put('ph_mirror', at(0.95, 150, { face: 'wall' }), { heart: true, size: 1.5, keep: 0.6 }), // the enormous mirror (round 79: Poly Haven, CC0)
      put('ca_column', ring(0.97, 6, { arc: [50, 310] }), { size: 0.9, tint: [0.62, 0.58, 0.46], keep: 0.1 }), // the ballroom's columns
      put('pd_chandelier', scatter(2, [0.86, 0.97], { face: 'free' }), { size: 1.4, lift: 3, tint: [0.7, 0.58, 0.32], keep: 0.3 }), // fallen from its chain, hung on none
      put('column', ring(0.95, 6, { arc: [50, 310] }), { size: [0.6, 0.85] }),
      put('statue_head', at(0.95, 180, { face: 'in' }), { size: 0.9, tint: [0.58, 0.6, 0.66] }),
      put('coffin', ring(0.92, 3, { arc: [90, 270], face: 'free' }), { size: 1.2 }),
      put('iron_gate', at(0.95, 230, { face: 90 })),
      put('grave_broken', scatter(5, [0.8, 0.97], { face: 'free' })),
      put('skeleton', at(0.88, 110, { face: 'free' }), { size: 0.9 }),
    ],
  },
  // The Hound's ossuary: coffins in their rows, bones, vessels, crosses, a chest with a jade amulet in it, benches.
  the_hound: {
    puts: [
      put('pd_pillar_broken', scatter(3, [0.84, 0.97], { face: 'free' }), { size: 1.2 }), // the violated tombs (round 79: Goblinatron's PSX Dungeon, CC BY)
      put('pd_pillar_fallen', scatter(2, [0.86, 0.97], { arc: [70, 290], face: 'free' }), { size: 1.1 }),
      put('pd_debris', scatter(4, [0.8, 0.96], { face: 'free' }), { walk: true, size: 1.5 }),
      put('pd_spikes', scatter(2, [0.86, 0.97], { arc: [90, 270], face: 'free' }), { walk: true, size: 1.2 }),
      put('coffin', ring(0.92, 6, { arc: [60, 300], face: 'out' }), { size: 1.2 }),
      put('skeleton', scatter(4, [0.82, 0.97], { face: 'free' }), { size: 0.9 }),
      put('urn', scatter(5, [0.82, 0.97], { face: 'free' }), { size: 1.2 }),
      put('cross', at(0.95, 260, { face: 'in' }), { size: 1.2 }),
      put('grave_cross', scatter(3, [0.86, 0.97], { arc: [70, 290], face: 'free' })),
      put('chest', at(0.94, 140, { face: 'in' }), { size: 1.2 }),
      put('bench', at(0.93, 40, { face: 'in' }), { size: 1.2 }),
    ],
  },
  // The attic in Boston where the Unnamable is met: hay and old chests, crates, a slate tomb's tablets, candles in the dust.
  the_unnamable: {
    puts: [
      put('rh_boarded_window', wall(0.972, 14, { walls: [90, 270], face: 'wall' }), { hung: true, join: true, size: 1.2 }), // the house's boards
      put('rh_plank', scatter(6, [0.8, 0.96], { face: 'free' }), { walk: true, size: 1.4 }),
      put('ph_roots', scatter(4, [0.8, 0.96], { face: 'free' }), { walk: true, size: 1.6 }), // the willow's roots through the sprung boards (round 79)
      put('chest', ring(0.93, 5, { arc: [60, 300], face: 'out', jitter: 12 }), { size: [1.1, 1.5] }),
      put('crate', scatter(5, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.4] }),
      put('hay_bale', scatter(3, [0.86, 0.97], { arc: [90, 270], face: 'free' }), { size: 1.2 }),
      put('barrel', scatter(3, [0.86, 0.97], { arc: [90, 270] }), { size: 1.2 }),
      put('grave_wide', at(0.95, 230, { face: 'in' }), { size: 1.3 }),
      put('candles', scatter(8, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The vault in the tomb: niches cut in its walls with the dead in them, urns, candles and a telephone wire's end where it comes down.
  voice_in_the_tomb: {
    puts: [
      put('ph_roots', scatter(5, [0.8, 0.97], { face: 'free' }), { walk: true, size: 1.8 }), // roots through the vault
      put('sw_rubble', scatter(4, [0.82, 0.97], { face: 'free' }), { walk: true, size: 1.4 }),
      put('sw_pipe_huge', at(0.95, 150, { face: 'in' }), { heart: true, size: 1.4, tint: [0.32, 0.3, 0.28] }), // the culvert the wire runs down (round 79: RotoPoly's, CC0)
      put('crypt_small', ring(0.93, 4, { arc: [80, 280], face: 'in' }), { size: 0.85 }),
      put('coffin', scatter(3, [0.84, 0.97], { arc: [70, 290], face: 'free' }), { size: 1.2 }),
      put('urn', scatter(5, [0.82, 0.97], { face: 'free' }), { size: 1.2 }),
      put('wall_ruin', at(0.83, 130, { mirror: true, face: 'in' }), { size: 0.8 }),
      put('grave_cross', scatter(3, [0.86, 0.97], { arc: [70, 290], face: 'free' })),
      put('candles', scatter(7, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The cellar of the Shunned House: casks and crates, nitre fungus risen from the floor, the spade of the men who dug, the stain on the earth.
  shunned_house_entity: {
    puts: [
      put('rh_stair', at(0.95, 150, { face: 'wall' }), { heart: true, size: 1.2 }), // the cellar stair
      put('ph_roots', scatter(6, [0.8, 0.97], { face: 'free' }), { walk: true, size: 1.8 }), // roots in the raw cellar
      put('lb_reagent', scatter(4, [0.8, 0.95], { face: 'free' }), { size: [2, 2.4], keep: 0.7 }), // the acid carboys
      put('lb_stand', at(0.9, 215, { face: 'free' }), { size: 2, keep: 0.5 }),
      put('lb_microscope', at(0.9, 140, { face: 'free' }), { size: 2.2, keep: 0.5 }), // the vigil's instruments
      put('barrel', ring(0.93, 6, { arc: [60, 300], jitter: 10 }), { size: 1.3 }),
      put('crate', scatter(4, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.3] }),
      put('mushroom_tall', scatter(6, [0.82, 0.98], { face: 'free' }), { size: [0.5, 0.8], tint: [0.72, 0.74, 0.62] }),
      put('shovel_dirt', at(0.9, 130, { face: 'free' }), { size: 1.3 }),
      put('wall_ruin', at(0.95, 240, { face: 'in' }), { size: 0.9 }),
      put('log', at(0.9, 90, { face: 'free' }), { size: 0.9 }),
    ],
  },
  // Suydam's shrine on the canal: a basin of the dark water, lilies, a statue's head, candles in rows, columns of a half-Eastern, half-Western kind.
  lilith: {
    puts: [
      put('cu_curtains', wall(0.972, 5.4, { walls: [180], face: 'wall' }), { hung: true, join: true, size: 1.2, tint: [0.88, 0.84, 0.9], keep: 0.4 }), // the bridal canopy's drapery, a wall of it (round 79: Heliona's, CC BY)
      put('ph_mirror', at(0.95, 150, { face: 'wall' }), { heart: true, size: 1.4, keep: 0.5 }),
      put('ph_mirror', at(0.95, 210, { face: 'wall' }), { heart: true, size: 1.4, keep: 0.5 }), // the dark mirrors by the water
      put('pd_candle_a', scatter(5, [0.8, 0.96], { face: 'free' }), { lit: 'torch', walk: true, size: 2 }),
      put('pd_candle_b', scatter(4, [0.8, 0.96], { face: 'free' }), { lit: 'torch', walk: true, size: 1.8 }),
      put('fountain', at(0.93, 235), { size: 0.5, tint: [0.34, 0.4, 0.46] }),
      put('lily', scatter(7, [0.82, 0.97], { face: 'free' }), { walk: true, size: 1.6 }),
      put('statue_head', ring(0.95, 3, { arc: [100, 260], face: 'in' }), { size: 0.7 }),
      put('column', ring(0.97, 4, { arc: [60, 300] }), { size: 0.75 }),
      put('urn', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.2 }),
      put('candles', scatter(9, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The old sea-captain's front hall: bottles in their dozens that hang on strings, a chest, a bench, a cannon, a flag gone grey.
  terrible_old_man: {
    puts: [
      put('rh_shutter', wall(0.972, 14, { walls: [90, 270], face: 'wall' }), { hung: true, join: true }), // the captain's shutters (round 79)
      put('kf_barrels', scatter(3, [0.84, 0.97], { arc: [80, 280], face: 'free' }), { size: 1.4 }),
      put('ph_bottle', scatter(16, [0.78, 0.97], { face: 'free' }), { size: [1.4, 2], keep: 0.8 }), // the bottle gallery
      put('urn', scatter(10, [0.8, 0.97], { face: 'free' }), { size: [0.9, 1.4], tint: [0.5, 0.62, 0.58] }),
      put('chest', ring(0.93, 3, { arc: [90, 270], face: 'in' }), { size: 1.3 }),
      put('bench', at(0.93, 260, { face: 90 }), { size: 1.2 }),
      put('cannon', at(0.88, 130, { face: 'in' }), { size: 0.9 }),
      put('barrel', scatter(4, [0.84, 0.97], { arc: [80, 280] }), { size: 1.2 }),
      put('flag_pirate', at(0.95, 205, { face: 'in' }), { size: 0.8 }),
      put('lantern', scatter(3, [0.8, 0.96], { face: 'free' }), { lit: 'lamp', walk: true, size: 1.5 }),
    ],
  },
  // The Whateleys' loft: hay and crates, boarded chests, a pallet, a cart's wheel and a lamp turned low.
  wilbur_whateley: {
    puts: [
      put('rh_boarded_door', wall(0.972, 14, { walls: [90, 270], face: 'wall' }), { hung: true, join: true, size: 1.5 }), // the boarded stalls (round 79)
      put('kf_pulley', scatter(2, [0.84, 0.96], { face: 'free' }), { walk: true, size: 1.6 }), // the hay pulley
      put('kf_barrels', scatter(3, [0.84, 0.97], { arc: [80, 280], face: 'free' }), { size: 1.4 }),
      put('wf_barn', at(0.82, 150, { face: 'in' }), { heart: true, size: 0.52, keep: 0.5 }), // the barn's own timbers, enlarged about the loft (round 79: andrewriddle's, CC BY)
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
      put('rh_window', wall(0.972, 16, { walls: [90, 270], face: 'wall' }), { hung: true, join: true, size: 1.2 }), // the study's windows (round 79)
      put('rh_door', wall(0.972, 16, { walls: [180], face: 'wall' }), { hung: true, join: true, size: 1.1 }),
      put('ph_mirror', at(0.94, 150, { mirror: true, side: 3, face: 'in' }), { heart: true, size: 1.3, keep: 0.5 }), // the study's twin
      put('bench', ring(0.93, 4, { arc: [70, 290], face: 'in' }), { size: 1.2 }),
      put('chest', scatter(3, [0.84, 0.97], { arc: [70, 290], face: 'free' }), { size: 1.2 }),
      put('cross_wood', at(0.95, 250, { face: 'in' }), { size: 1.4 }),
      put('statue_head', at(0.95, 125, { face: 'in' }), { size: 0.55 }),
      put('urn', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.2 }),
      put('candles', scatter(8, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The turret studio of the dreamer: a couch and pallets, a laurelled head, columns of a Greek mind, poppies, a chalice, candles.
  hypnos: {
    puts: [
      put('ba_bust', scatter(4, [0.84, 0.96], { arc: [70, 290], face: 'in' }), { size: [1.6, 2], tint: [0.82, 0.82, 0.86], keep: 0.2 }), // the dreamer's face in the unfinished marble (round 79: davdadams', CC BY)
      put('uv_hourglass', at(0.862, 160, { face: 'in' }), { size: 2.2 }), // the hourglass of the dreamer
      put('statue_head', at(0.95, 180, { face: 'in' }), { size: 0.75, tint: [0.7, 0.7, 0.74] }),
      put('column', ring(0.96, 4, { arc: [60, 300] }), { size: 0.75 }),
      put('bedroll', ring(0.9, 3, { arc: [80, 280], face: 'free' }), { size: 1.4 }),
      put('bench', at(0.93, 270, { face: 90 }), { size: 1.2 }),
      put('lily', scatter(6, [0.8, 0.97], { face: 'free' }), { walk: true, size: 1.4, tint: [0.78, 0.42, 0.42] }),
      put('chalice', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.6 }),
      put('candles', scatter(8, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // Zann's garret, its window onto a street that is not there: a pallet, a chest, a viol's case, a bowl, a grille from a window, candles.
  zann_window_thing: {
    puts: [
      put('rh_window', at(0.972, 180, { side: 5.4, mirror: true, face: 'wall' }), { hung: true, size: 1.3, tint: [0.04, 0.04, 0.08], keep: 0 }), // the window onto a street that is not there (round 79)
      put('bookpile', scatter(5, [0.8, 0.96], { face: 'free' }), { walk: true, size: 1.6 }), // the pages the wind takes (round 79)
      put('bedroll', at(0.92, 100, { face: 270 }), { size: 1.4 }),
      put('chest', ring(0.93, 4, { arc: [100, 260], face: 'out' }), { size: [1.1, 1.4] }),
      put('crate', scatter(4, [0.82, 0.97], { arc: [50, 310], face: 'free' }), { size: [1, 1.3] }),
      put('iron_fence_broken', ring(0.97, 3, { arc: [120, 240], face: 'in' })),
      put('skeleton', at(0.9, 235, { face: 'free' }), { size: 0.9 }),
      put('bowl', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.5 }),
      put('candles', scatter(8, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
};
