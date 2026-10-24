/**
 * The ways to the waking world's open arenas (data/arenaWays.ts): each a walk toward its horror told in its own things: what is set
 * along it, what is said on it and what is asked of the one who would pass. None bites (round 68, asked: "remove all traps from all paths
 * that lead to bosses": the hazards these ways had are gone; systems/ways.ts still plays one if a way is given it). Distances are metres from
 * the fog back toward the road (a way is 120 m at the least); sides are to the left walking in. Round 72: what stands along a way is a pair
 * of one or two pieces at a steady stride, and a few camps and signs that tell a story; no lamps, lanterns or candles and nothing scattered. Data only.
 */

import { mark, piece, type Way } from './arenaWays';

export const EARTH_WAYS: Readonly<Record<string, Way>> = {
  // The Gardners' lane through the blasted heath: grey grass that does not move, trees dead standing in pairs.
  colour_out_of_space: {
    marks: [
      mark(piece('gt_dead_5', { size: 0.8 }), 24, 130, 18, 8.5, { mirror: true }), // the grey orchard's trees, standing dead on either hand
      mark(piece('signpost', { size: 1 }), 100, 100, 1, 2.9, { face: 'front' }),
    ],
    omens: [
      { at: 110, words: 'THE GRASS IS GREY, AND DOES NOT MOVE IN THE WIND', sound: 'whisper', pitch: 0.7 },
      { at: 84, words: 'NOTHING SINGS HERE. NOTHING HAS NESTED FOR YEARS', sound: 'whisper', pitch: 0.55 },
      { at: 40, words: 'THE LIGHT IN THE WELL IS OF NO COLOUR A MAN HAS A NAME FOR', sound: 'wail', shake: 0.05, pitch: 0.5 },
    ],
  },
  // The sabbat's court before the ford of the black river: skulls on poles, standing stones in pairs, a camp left in a hurry.
  black_man: {
    marks: [
      mark(piece('skull_pole', { size: 1.15 }), 14, 120, 12, 4.4, { mirror: true }),
      mark(piece('nt_menhir_d'), 30, 120, 34, 9, { mirror: true, face: 'free' }), // the stones the sabbat stands among
      mark(piece('tent', { size: 1 }), 92, 92, 1, 9, { face: 'in' }), // a hunter's camp, left in a hurry
      mark(piece('bedroll', { size: 1 }), 94, 94, 1, 6.6, { face: 'free' }),
    ],
    omens: [
      { at: 112, words: 'SOMEONE HAS BEEN HERE BEFORE YOU. THEIR FIRES ARE STILL WARM', sound: 'whisper', pitch: 0.7 },
      { at: 80, words: 'THE WOODS LISTEN. A DRUM, VERY SLOW, UNDER THE LEAVES', sound: 'chant', pitch: 0.5 },
      { at: 44, words: 'THE FIRES ARE LAID IN A RING. THE RING IS NOT EMPTY', sound: 'whisper', pitch: 0.55, shake: 0.04 },
    ],
  },
  // The black grove's road: trees that fork like horns, skulls on stakes.
  shub_niggurath: {
    marks: [
      mark(piece('horn_tree', { size: 1.15 }), 22, 150, 13, 8, { mirror: true }),
      mark(piece('skull_pole', { size: 1.15 }), 16, 120, 26, 5, { mirror: true }),
      mark(piece('signpost', { size: 1 }), 100, 100, 1, 2.9, { face: 'front' }),
    ],
    omens: [
      { at: 112, words: 'THE TREES HERE FORK LIKE HORNS', sound: 'bellow', pitch: 0.6 },
      { at: 80, words: 'THE AIR IS THICK AND WARM, AND SOMETHING IN IT IS BREATHING', sound: 'whale', shake: 0.05, pitch: 0.6 },
      { at: 44, words: 'A THOUSAND YOUNG, AND NONE OF THEM MAKES A SOUND', sound: 'whisper', pitch: 0.5 },
    ],
  },
  // The plantation's drive: the people of the house, stone, in the places they stood; their eyes open, and eyes cut in the paving.
  medusa_gorgon: {
    marks: [
      mark(piece('statue_column', { size: 1.1 }), 12, 120, 11, 4.2, { mirror: true }), // the people of the house, stone, where they stood
      mark(piece('tr_pillar_tall_b'), 30, 130, 33, 9, { mirror: true, face: 'free' }),
    ],
    omens: [
      { at: 108, words: 'THE DRIVE IS LINED WITH PEOPLE. NONE OF THEM HAS MOVED IN YEARS', sound: 'whisper', pitch: 0.7 },
      { at: 76, words: 'THEIR EYES ARE OPEN. THE LOOK ON ALL THEIR FACES IS ONE LOOK', sound: 'whisper', pitch: 0.55 },
      { at: 62, words: 'THE PAVING IS CUT WITH ONE EYE, OVER AND OVER, BY ONE HAND', sound: 'chant', pitch: 0.6 },
    ],
  },
  // The shore the tide left: pale sand and rocks in pairs, a gun off a wreck, a flag at the sea wall; the sea has drawn a breath.
  martins_beach_horror: {
    marks: [
      mark(piece('rocks_sand_a', { size: 1 }), 20, 140, 28, 10, { mirror: true, face: 'free' }),
      mark(piece('cannon', { size: 1.2 }), 52, 52, 1, 8, { face: 'free' }), // a gun off a wreck, half in the sand
      mark(piece('flag_pirate', { size: 1 }), 7, 7, 1, 4.4, { face: 'front' }), // a flag run up at the sea wall's gate, by whoever last held it
      mark(piece('signpost', { size: 1 }), 92, 92, 1, 2.9, { face: 'front' }),
    ],
    omens: [
      { at: 108, words: 'THE TIDE IS OUT TOO FAR. THE SAND IS WET TO THE HORIZON', sound: 'whale', pitch: 0.85 },
      { at: 74, words: 'FISH LIE ON THE SAND, ALL LOOKING THE SAME WAY', sound: 'whisper', pitch: 0.7 },
      { at: 42, words: 'THE SEA IS DRAWING A BREATH', sound: 'bellow', shake: 0.06, pitch: 0.6 },
    ],
  },
  // The burying ground's lane: the stones in pairs along it, bare trees beyond.
  simon_orne: {
    marks: [
      mark(piece('gy_stone_4', { size: 1.4 }), 25, 150, 14, 7.5, { mirror: true, face: 'in' }), // the stones of the burying ground, in their rows along the lane
      mark(piece('gy_tree_1'), 30, 170, 40, 13, { mirror: true, face: 'free' }),
    ],
    omens: [
      { at: 104, words: 'THE LAMPS ARE LIT. NO ONE LIT THEM', sound: 'whisper', pitch: 0.7 },
      { at: 66, words: 'SALT LIES WHITE ACROSS THE WAY, TO KEEP THE DEAD WHERE THEY LIE', sound: 'chant', pitch: 0.6 },
      { at: 50, words: 'THE SALT HAS BEEN WALKED THROUGH, SWEPT BACK, AND WALKED THROUGH AGAIN', sound: 'chant', pitch: 0.55 },
    ],
  },
  // The manor's avenue: hedges grown to the height of a house, statues gone green; a rod on the roof for the lightning.
  edward_hutchinson: {
    marks: [
      mark(piece('hedge', { size: 1.1 }), 8, 118, 3.2, 6.2, { mirror: true, face: 90 }),
      mark(piece('statue_obelisk', { size: 0.7 }), 30, 110, 36, 8.2, { mirror: true, face: 'free' }),
    ],
    omens: [
      { at: 104, words: 'THE HEDGES ARE GROWN TO THE HEIGHT OF A HOUSE, AND THE LAMPS ARE STILL LIT', sound: 'whisper', pitch: 0.7 },
      { at: 66, words: 'THE AIR TASTES OF IRON, AS IT DOES BEFORE A STORM', sound: 'thunder', shake: 0.04, pitch: 0.6 },
      { at: 36, words: 'A ROD STANDS ON THE ROOF, AND IT IS NOT THERE FOR THE WEATHER', sound: 'thunder', pitch: 0.5 },
    ],
  },
  // The avenue of the sphinxes: pairs of them, facing the way you came, and obelisks between; sand that holds the heat of a sun that has set.
  colossus_pyramids: {
    marks: [
      mark(piece('sphinx', { size: 0.85 }), 26, 160, 30, 7.2, { mirror: true, face: 'in' }),
      mark(piece('prop:obelisk', { size: 1.5 }), 34, 150, 40, 9.5, { mirror: true }),
      mark(piece('tent', { size: 1.1 }), 122, 122, 1, 13, { face: 'in' }), // an expedition's camp, struck and left
      mark(piece('bedroll', { size: 1 }), 124, 124, 1, 10, { face: 'free' }),
      mark(piece('signpost', { size: 1 }), 150, 150, 1, 3, { face: 'front' }),
    ],
    omens: [
      { at: 140, words: 'THE SAND HOLDS THE HEAT OF A SUN THAT HAS SET', sound: 'whisper', pitch: 0.6 },
      { at: 96, words: 'THE AVENUE WAS BUILT FOR SOMETHING THAT WALKED IT', sound: 'bellow', shake: 0.05, pitch: 0.5 },
      { at: 54, words: 'THE SPHINXES FACE THE WAY YOU CAME. NONE OF THEM FACES THE PYRAMID', sound: 'whisper', pitch: 0.55 },
    ],
  },
  // The serpent road: totems and skulls on poles, a dry rattling.
  yig: {
    marks: [
      mark(piece('totem', { size: 0.8 }), 10, 120, 20, 4.2, { mirror: true }),
      mark(piece('skull_pole', { size: 1.1 }), 30, 120, 40, 6.8, { mirror: true }),
    ],
    omens: [
      { at: 100, words: 'A DRY RATTLING, VERY SOFT, ON EVERY SIDE', sound: 'whisper', pitch: 0.8 },
      { at: 64, words: 'THE ROCKS ARE SHED SKINS, AND EACH ONE IS LONGER THAN A MAN', sound: 'whisper', pitch: 0.6 },
      { at: 34, words: 'NOTHING MOVES ON THE ROAD. EVERYTHING ELSE DOES', sound: 'bellow', pitch: 0.55 },
    ],
  },
  // The mound's stair: stone cut from the mound itself, red light from below, the ground warm.
  nug: {
    marks: [
      mark(piece('rock_tall', { size: 1.3 }), 10, 160, 16, 6, { mirror: true }),
      mark(piece('prop:block', { size: 0.7 }), 18, 140, 32, 9.5, { mirror: true }),
    ],
    omens: [
      { at: 130, words: 'THE GROUND IS WARM, AND IT BREATHES', sound: 'bellow', pitch: 0.5 },
      { at: 80, words: 'RED LIGHT, FROM BELOW. THE STAIR GOES DOWN INTO IT', sound: 'whale', shake: 0.05, pitch: 0.55 },
      { at: 46, words: 'SOMETHING THAT WAS WORSHIPPED BEFORE THE FIRST MAN STIRS', sound: 'bellow', shake: 0.08, pitch: 0.45 },
    ],
  },
  // The shore of Ib: the carved stones of a drowned people with their faces to the lake.
  bokrug: {
    marks: [
      mark(piece('prop:monolith', { size: 1 }), 14, 140, 22, 9, { mirror: true }), // the carved stones of a drowned people, their faces to the water
    ],
    omens: [
      { at: 108, words: 'THE LAKE IS STILL, AND BLACK, AND LOOKS BACK', sound: 'whisper', pitch: 0.6 },
      { at: 72, words: 'THE STONES IN THE SHALLOWS ARE CARVED. THEIR FACES ARE ALL TURNED TO THE WATER', sound: 'chant', pitch: 0.55 },
      { at: 40, words: 'SOMETHING GREEN WAKES, UNDER THE LILIES', sound: 'whale', shake: 0.05, pitch: 0.5 },
    ],
  },
  // Hatheg-Kla's slope: snow pines and trilithons in pairs, a cloud on the peak that dances to a pipe.
  other_gods: {
    marks: [
      mark(piece('trilith', { size: 0.7 }), 30, 150, 34, 7.5, { mirror: true, face: 'in' }),
      mark(piece('pine_crooked', { size: 1.2 }), 8, 150, 24, 12, { mirror: true }),
      mark(piece('tent', { size: 1 }), 104, 104, 1, 10, { face: 'in' }),
      mark(piece('bedroll', { size: 1 }), 106, 106, 1, 7.5, { face: 'free' }),
    ],
    omens: [
      { at: 100, words: 'THE CLOUD ON THE PEAK IS DANCING', sound: 'choral', pitch: 0.6 },
      { at: 66, words: 'PIPES, VERY FAR OFF, AND OUT OF TIME', sound: 'choral', shake: 0.04, pitch: 0.55 },
      { at: 36, words: 'NO GOD OF EARTH DANCES TO THAT PIPE', sound: 'thunder', pitch: 0.5 },
    ],
  },
};
