/**
 * The ways to the waking world's open arenas (data/arenaWays.ts): each a walk toward its horror told in its own things: what is set
 * along it, what is said on it, what bites on it and what is asked of the one who would pass. Distances are metres from the fog back
 * toward the road (a way is 120 m at the least); sides are to the left walking in. Data only.
 */

import { mark, piece, spot, type Way } from './arenaWays';

export const EARTH_WAYS: Readonly<Record<string, Way>> = {
  // The Gardners' lane through the blasted heath: grey grass that does not move, trees dead standing, the fallen star's shards giving
  // off their light, a ground that wears at the mind; four lanterns of the family to be lit, the least first, as they went.
  colour_out_of_space: {
    marks: [
      mark(piece('prop:tree', { size: [1.1, 1.5] }), 20, 190, 12, [6, 15], { mirror: true, jitter: 6, chance: 0.8 }),
      mark(piece('trunk', { size: [0.9, 1.3] }), 40, 170, 31, [4, 9], { jitter: 8, face: 'free' }),
      mark(piece('rocks_tall', { size: [0.8, 1.2] }), 30, 150, 27, [5, 11], { jitter: 6, face: 'free' }),
      mark(piece('meteor', { glow: 'magenta', size: [0.9, 1.4] }), 6, 70, 9, [3.4, 8], { mirror: true, jitter: 4, face: 'free' }),
      mark(piece('plant_bush', { size: 1.2 }), 12, 120, 9, [3, 7], { jitter: 3, face: 'free', chance: 0.7 }),
      mark(piece('hay_bale', { size: 1 }), 16, 90, 15, [5, 10], { mirror: true, jitter: 4, chance: 0.4, face: 'free' }), // the Gardners' hay, gone grey in the field
      mark(piece('signpost', { size: 1 }), 100, 100, 1, 2.9, { face: 'front' }),
    ],
    omens: [
      { at: 110, words: 'THE GRASS IS GREY, AND DOES NOT MOVE IN THE WIND', sound: 'whisper', pitch: 0.7 },
      { at: 84, words: 'NOTHING SINGS HERE. NOTHING HAS NESTED FOR YEARS', sound: 'whisper', pitch: 0.55 },
      { at: 40, words: 'THE LIGHT IN THE WELL IS OF NO COLOUR A MAN HAS A NAME FOR', sound: 'wail', shake: 0.05, pitch: 0.5 },
    ],
    hazards: [{ kind: 'blight', look: 'stain', at: [spot(74, 0), spot(64, 6), spot(54, -5), spot(44, 1), spot(32, 5), spot(20, -4)], r: 4.6, rate: 2.6 }],
    rite: { look: 'lamp', glow: 'magenta', at: [spot(62, 4.5), spot(58, -4), spot(54, 6.5), spot(50, -6)], order: 'rising', clue: 'FOUR LANTERNS OF THE FAMILY. THEY WENT OUT ONE BY ONE, THE LEAST BEFORE THE GREATEST', done: 'THE LANTERNS BURN STEADY, AND THE GREY LETS GO OF THE GROUND', reward: { echoes: 600, insight: 1 }, stills: true },
  },
  // The sabbat's path up the ravine: skulls on poles, standing stones, carved gourds with a light in them and the witches' fires burning
  // in the open ground; the fires are laid in a ring, and a plate wakes one; three black candles are to be lit, least first.
  black_man: {
    marks: [
      mark(piece('skull_pole', { size: [1, 1.3] }), 14, 120, 12, [3.8, 5], { mirror: true, jitter: 3 }),
      mark(piece('prop:monolith', { size: [0.9, 1.3] }), 30, 120, 17, [6, 12], { mirror: true, jitter: 6, chance: 0.8 }),
      mark(piece('pumpkin_carved', { lit: 'torch', walk: true, size: 1.3 }), 10, 110, 9, [2.6, 4.5], { mirror: true, jitter: 3, chance: 0.7, face: 'free' }),
      mark(piece('prop:firepit', { size: 1.2 }), 28, 100, 24, [6, 10], { mirror: true, jitter: 5, chance: 0.8 }),
      mark(piece('stump_old', { size: 1.1 }), 20, 100, 15, [5, 9], { mirror: true, jitter: 4, chance: 0.6 }),
      mark(piece('prop:tree', { size: [1.1, 1.5] }), 40, 140, 14, [9, 16], { mirror: true, jitter: 5, chance: 0.7 }),
      mark(piece('tent', { size: 1 }), 92, 92, 1, 9, { face: 'in' }), // a hunter's camp, left in a hurry
      mark(piece('bedroll', { size: 1 }), 94, 94, 1, 6.6, { face: 'free' }),
      mark(piece('chalice', { size: 1 }), 66, 80, 6, [2.9, 4], { mirror: true, chance: 0.6, face: 'free', jitter: 1 }),
      mark(piece('bowl', { size: 1 }), 64, 78, 7, [3, 4.2], { mirror: true, chance: 0.6, face: 'free', jitter: 1 }),
    ],
    omens: [
      { at: 112, words: 'SOMEONE HAS BEEN HERE BEFORE YOU. THEIR FIRES ARE STILL WARM', sound: 'whisper', pitch: 0.7 },
      { at: 80, words: 'THE WOODS LISTEN. A DRUM, VERY SLOW, UNDER THE LEAVES', sound: 'chant', pitch: 0.5 },
      { at: 44, words: 'THE FIRES ARE LAID IN A RING. THE RING IS NOT EMPTY', sound: 'whisper', pitch: 0.55, shake: 0.04 },
    ],
    hazards: [{ kind: 'ward', look: 'flame', plates: [spot(60, -1.4), spot(55, 1.5), spot(50, 0), spot(45, -1.5), spot(40, 1.3), spot(35, -0.6), spot(30, 1.4)], damage: 24 }],
    rite: { look: 'candle', glow: 'purple', at: [spot(80, 5.5), spot(76, -6), spot(72, 4)], order: 'rising', clue: 'THREE BLACK CANDLES FOR THE COVEN. LIGHT THE LEAST BEFORE THE GREATEST', done: 'THE COVEN IS SATISFIED. THE WITCH-FIRES SETTLE', reward: { echoes: 500 }, stills: true },
  },
  // The black grove's road: trees that fork like horns, skulls on stakes, fungus as tall as a man; the pods in the ground burst of themselves.
  shub_niggurath: {
    marks: [
      mark(piece('horn_tree', { size: [1, 1.3] }), 22, 150, 13, [6, 12], { mirror: true, jitter: 4 }),
      mark(piece('mushroom_tall', { size: [0.9, 1.5] }), 8, 110, 9, [3.6, 8], { mirror: true, jitter: 3, chance: 0.6 }),
      mark(piece('skull_pole', { size: [1, 1.3] }), 10, 120, 16, [4, 6], { mirror: true, jitter: 3 }),
      mark(piece('stump_old', { size: [1, 1.5] }), 16, 110, 17, [5, 10], { jitter: 5, chance: 0.5 }),
      mark(piece('signpost', { size: 1 }), 100, 100, 1, 2.9, { face: 'front' }),
    ],
    omens: [
      { at: 112, words: 'THE TREES HERE FORK LIKE HORNS', sound: 'bellow', pitch: 0.6 },
      { at: 80, words: 'THE AIR IS THICK AND WARM, AND SOMETHING IN IT IS BREATHING', sound: 'whale', shake: 0.05, pitch: 0.6 },
      { at: 44, words: 'A THOUSAND YOUNG, AND NONE OF THEM MAKES A SOUND', sound: 'whisper', pitch: 0.5 },
    ],
    hazards: [{ kind: 'vent', look: 'spore', at: [spot(72, 3.2), spot(60, -3.2), spot(48, 3), spot(36, -3.2), spot(24, 3.2)], every: [5, 9], burst: 3.2, damage: 22, warn: 70 }],
  },
  // The plantation's drive: the people of the house, stone, in the places they stood; their eyes open. Wards in the paving that bear eyes,
  // one in each row shut: the one that matches the tablet.
  medusa_gorgon: {
    marks: [
      mark(piece('statue_column', { size: [1, 1.2] }), 12, 120, 11, 4.2, { mirror: true, jitter: 1.5 }),
      mark(piece('statue_head', { size: [0.9, 1.3] }), 20, 120, 23, [5.5, 9], { mirror: true, jitter: 4, chance: 0.7 }),
      mark(piece('column', { size: [0.8, 1] }), 30, 130, 19, [7, 11], { mirror: true, jitter: 3, chance: 0.6 }),
      mark(piece('wall_ruin', { size: 1.2 }), 40, 130, 30, [9, 12], { mirror: true, face: 90, chance: 0.7 }),
      mark(piece('urn', { size: 1.2 }), 14, 100, 17, [3.4, 5], { mirror: true, chance: 0.5 }),
      mark(piece('prop:tree', { size: [1.1, 1.5] }), 40, 150, 17, [11, 17], { mirror: true, jitter: 6, chance: 0.7 }),
    ],
    omens: [
      { at: 108, words: 'THE DRIVE IS LINED WITH PEOPLE. NONE OF THEM HAS MOVED IN YEARS', sound: 'whisper', pitch: 0.7 },
      { at: 76, words: 'THEIR EYES ARE OPEN. THE LOOK ON ALL THEIR FACES IS ONE LOOK', sound: 'whisper', pitch: 0.55 },
      { at: 62, words: 'THE TABLET SHOWS THE SIGN THE PAVING FORGIVES. STEP ONLY ON ITS SIGN', sound: 'chant', pitch: 0.6 },
    ],
    hazards: [{ kind: 'field', look: 'eye', from: 22, to: 50, rows: 5, cols: 3, key: 3, at: spot(58, -3.8), damage: 26 }],
  },
  // The shore the tide left: pale sand, lamps for the fishers, nets, wrecked boats, fish on the sand; and the sea draws a breath and comes in.
  martins_beach_horror: {
    marks: [
      mark(piece('barrel', { size: 1 }), 8, 110, 12, [3.4, 6], { mirror: true, jitter: 3, chance: 0.6 }),
      mark(piece('crate', { size: 1.1 }), 14, 110, 19, [4, 8], { jitter: 4, chance: 0.6, face: 'free' }),
      mark(piece('rocks_sand_a', { size: [0.8, 1.2] }), 20, 140, 14, [8, 16], { mirror: true, jitter: 4, chance: 0.7, face: 'free' }),
      mark(piece('lightpost', { lit: 'lamp' }), 20, 110, 22, 3.8, { mirror: true }),
      mark(piece('canoe'), 25, 120, 45, [7, 12], { face: 'free', chance: 0.8 }),
      mark(piece('fish', { size: 1.2 }), 12, 100, 15, [2.8, 5], { mirror: true, chance: 0.5, face: 'free' }),
      mark(piece('skeleton', { size: 1 }), 30, 90, 31, [3.6, 6], { chance: 0.5, face: 'free' }),
      mark(piece('cannon', { size: 1.2 }), 52, 52, 1, 8, { face: 'free' }), // a gun off a wreck, half in the sand
      mark(piece('flag_pirate', { size: 1 }), 7, 7, 1, 4.4, { face: 'front' }), // a flag run up at the sea wall's gate, by whoever last held it
      mark(piece('signpost', { size: 1 }), 92, 92, 1, 2.9, { face: 'front' }),
    ],
    omens: [
      { at: 108, words: 'THE TIDE IS OUT TOO FAR. THE SAND IS WET TO THE HORIZON', sound: 'whale', pitch: 0.85 },
      { at: 74, words: 'FISH LIE ON THE SAND, ALL LOOKING THE SAME WAY', sound: 'whisper', pitch: 0.7 },
      { at: 42, words: 'THE SEA IS DRAWING A BREATH', sound: 'bellow', shake: 0.06, pitch: 0.6 },
    ],
    hazards: [{ kind: 'tide', look: 'brine', from: 20, to: 62, width: 11, every: [12, 20], damage: 26 }],
  },
  // The burying ground's lane: lamps set for the dead and left burning, graves in clusters, the salt laid white across the path to keep
  // what is buried where it lies; the tablet shows the sign the salt forgives.
  simon_orne: {
    marks: [
      mark(piece('lightpost', { lit: 'lamp' }), 14, 120, 14, 3.6, { mirror: true }),
      mark(piece('grave_wide', { size: [1, 1.2] }), 20, 150, 16, [6, 13], { mirror: true, jitter: 6, chance: 0.75 }),
      mark(piece('grave_cross', { size: [1, 1.2] }), 25, 150, 21, [5, 11], { jitter: 8, chance: 0.7 }),
      mark(piece('iron_fence_broken'), 50, 130, 23, [7, 10], { mirror: true, face: 90, chance: 0.6 }),
      mark(piece('candles', { lit: 'torch', walk: true, size: 1.2 }), 2, 60, 12, [2.6, 5], { mirror: true, jitter: 4, face: 'free' }),
      mark(piece('pine_crooked', { size: [1, 1.4] }), 30, 170, 19, [10, 18], { mirror: true, jitter: 8, chance: 0.7 }),
      mark(piece('shovel_dirt', { size: 1.1 }), 24, 110, 37, [3.4, 5], { mirror: true, chance: 0.4, face: 'free' }),
      mark(piece('lantern', { lit: 'torch', size: 1.3 }), 18, 100, 13, [2.7, 4], { mirror: true, chance: 0.5, jitter: 3, face: 'free' }),
      mark(piece('bowl', { size: 1.2 }), 12, 42, 6, [3.2, 4.4], { mirror: true, chance: 0.6, jitter: 1.5, face: 'free' }), // the salt, kept in bowls
    ],
    omens: [
      { at: 104, words: 'THE LAMPS ARE LIT. NO ONE LIT THEM', sound: 'whisper', pitch: 0.7 },
      { at: 66, words: 'SALT LIES WHITE ACROSS THE WAY, TO KEEP THE DEAD WHERE THEY LIE', sound: 'chant', pitch: 0.6 },
      { at: 50, words: 'THE TABLET SHOWS WHAT THE SALT FORGIVES. STEP ONLY ON ITS SIGN', sound: 'chant', pitch: 0.55 },
    ],
    hazards: [{ kind: 'field', look: 'salt', from: 14, to: 40, rows: 5, cols: 3, key: 2, at: spot(46, -4), damage: 26 }],
  },
  // The manor's avenue: hedges grown to the height of a house, lamps that still burn, statues and urns gone green; the lightning
  // finds the rod on the roof, and the strikes on the way are its leavings; four lamps to be lit from the road toward the house.
  edward_hutchinson: {
    marks: [
      mark(piece('hedge', { size: 1.1 }), 8, 118, 3.2, 6.2, { mirror: true, jitter: 0.3, face: 90 }),
      mark(piece('lightpost', { lit: 'lamp' }), 18, 110, 22, 3.9, { mirror: true }),
      mark(piece('statue_obelisk', { size: 0.7 }), 30, 110, 36, 8.2, { mirror: true, face: 'free' }),
      mark(piece('urn', { size: 1.3 }), 20, 100, 17, 4.6, { mirror: true, chance: 0.5 }),
      mark(piece('bench', {}), 40, 100, 33, 8, { mirror: true, chance: 0.5, face: 90 }),
      mark(piece('lantern', { lit: 'torch', size: 1.2 }), 24, 100, 19, [2.8, 3.4], { mirror: true, chance: 0.4, face: 'free' }),
    ],
    omens: [
      { at: 104, words: 'THE HEDGES ARE GROWN TO THE HEIGHT OF A HOUSE, AND THE LAMPS ARE STILL LIT', sound: 'whisper', pitch: 0.7 },
      { at: 66, words: 'THE AIR TASTES OF IRON, AS IT DOES BEFORE A STORM', sound: 'thunder', shake: 0.04, pitch: 0.6 },
      { at: 36, words: 'A ROD STANDS ON THE ROOF, AND IT IS NOT THERE FOR THE WEATHER', sound: 'thunder', pitch: 0.5 },
    ],
    hazards: [{ kind: 'vent', look: 'bolt', at: [spot(64, 3), spot(54, -3.4), spot(44, 3.4), spot(34, -3), spot(24, 3.2)], every: [4, 8], burst: 2.6, damage: 30, warn: 55 }],
    rite: { look: 'lamp', glow: 'purple', at: [spot(104, 3.5), spot(96, -3.5), spot(88, 3.5), spot(80, -3.5)], order: 'near', clue: 'FOUR LAMPS THAT DO NOT BURN. LIGHT THEM FROM THE ROAD TO THE HOUSE, AS THE FAMILY CAME HOME', done: 'THE LAMPS BURN, AND THE ROD ON THE ROOF HAS NOTHING TO ANSWER', reward: { echoes: 600, insight: 1 }, stills: true },
  },
  // The avenue of the sphinxes: pairs of them, facing the way you came, obelisks and broken columns, sand that holds the heat of a sun
  // that has set and is lifted across the way in sheets; four braziers to be lit, the greatest first, as the stars set.
  colossus_pyramids: {
    marks: [
      mark(piece('sphinx', { size: [0.8, 0.9] }), 26, 160, 30, 7.2, { mirror: true, face: 'in' }),
      mark(piece('prop:obelisk', { size: 1.5 }), 34, 150, 40, 9.5, { mirror: true }),
      mark(piece('column', { size: [0.8, 1] }), 24, 150, 25, [11, 16], { mirror: true, jitter: 4, chance: 0.6 }),
      mark(piece('cactus', { size: [0.8, 1.3] }), 10, 140, 11, [8, 18], { mirror: true, jitter: 4, chance: 0.5 }),
      mark(piece('rocks_tall', { size: [0.9, 1.4] }), 20, 150, 19, [12, 22], { jitter: 6, chance: 0.6, face: 'free' }),
      mark(piece('statue_head', { size: [0.9, 1.2] }), 30, 140, 53, [6, 10], { face: 'free', chance: 0.7 }),
      mark(piece('tent', { size: 1.1 }), 122, 122, 1, 13, { face: 'in' }), // an expedition's camp, struck and left
      mark(piece('bedroll', { size: 1 }), 124, 124, 1, 10, { face: 'free' }),
      mark(piece('signpost', { size: 1 }), 150, 150, 1, 3, { face: 'front' }),
    ],
    omens: [
      { at: 140, words: 'THE SAND HOLDS THE HEAT OF A SUN THAT HAS SET', sound: 'whisper', pitch: 0.6 },
      { at: 96, words: 'THE AVENUE WAS BUILT FOR SOMETHING THAT WALKED IT', sound: 'bellow', shake: 0.05, pitch: 0.5 },
      { at: 54, words: 'THE SPHINXES FACE THE WAY YOU CAME. NONE OF THEM FACES THE PYRAMID', sound: 'whisper', pitch: 0.55 },
    ],
    hazards: [{ kind: 'tide', look: 'sand', from: 28, to: 80, width: 12, every: [14, 24], damage: 24 }],
    rite: { look: 'brazier', glow: 'magenta', at: [spot(100, 8.5), spot(96, -8.5), spot(92, 9.5), spot(88, -9.5)], order: 'falling', clue: 'FOUR BRAZIERS BEFORE THE AVENUE. THE STARS SET FROM THE GREATEST TO THE LEAST: LIGHT THEM SO', done: 'THE BRAZIERS BURN, AND THE WIND LAYS DOWN THE SAND', reward: { echoes: 700, insight: 1 }, stills: true },
  },
  // The serpent road: totems, shed skins that are rocks, bones of those who went before, a dry rattling; the paving wakes under a foot.
  yig: {
    marks: [
      mark(piece('totem', { size: [0.7, 0.9] }), 10, 120, 20, 4.2, { mirror: true, jitter: 2 }),
      mark(piece('rocks_tall', { size: [1, 1.5] }), 18, 150, 15, [6, 14], { mirror: true, jitter: 4, chance: 0.7, face: 'free' }),
      mark(piece('cactus', { size: [0.9, 1.4] }), 8, 130, 11, [5, 12], { mirror: true, jitter: 3, chance: 0.6 }),
      mark(piece('skeleton', { size: 1 }), 14, 110, 33, [3.6, 5], { mirror: true, chance: 0.8, face: 'free' }),
      mark(piece('skull_pole', { size: 1.1 }), 24, 120, 28, [5.5, 8], { mirror: true, jitter: 3, chance: 0.6 }),
    ],
    omens: [
      { at: 100, words: 'A DRY RATTLING, VERY SOFT, ON EVERY SIDE', sound: 'whisper', pitch: 0.8 },
      { at: 64, words: 'THE ROCKS ARE SHED SKINS, AND EACH ONE IS LONGER THAN A MAN', sound: 'whisper', pitch: 0.6 },
      { at: 34, words: 'NOTHING MOVES ON THE ROAD. EVERYTHING ELSE DOES', sound: 'bellow', pitch: 0.55 },
    ],
    hazards: [{ kind: 'ward', look: 'coil', plates: [spot(72, 1.5), spot(66, -1.2), spot(60, 0), spot(54, 1.5), spot(48, -1.4), spot(42, 0), spot(36, 1.2), spot(30, -1.5)], damage: 22 }],
  },
  // The mound's stair: stone cut from the mound itself, red light from below, the ground warm; the vents on the stair erupt in turn;
  // three fires to be lit, the greatest first, to the three layers of the mound.
  nug: {
    marks: [
      mark(piece('rock_tall', { size: [1, 1.6] }), 10, 160, 12, [5, 12], { mirror: true, jitter: 3 }),
      mark(piece('cliff', { size: [0.9, 1.3] }), 20, 170, 28, [10, 16], { mirror: true, jitter: 6, chance: 0.8, face: 'free' }),
      mark(piece('prop:block', { size: 0.7 }), 14, 140, 20, [4.2, 6], { mirror: true, jitter: 3, chance: 0.7 }),
      mark(piece('prop:firepit', { size: 1.3 }), 24, 150, 24, [6, 10], { mirror: true, jitter: 4, chance: 0.8 }),
    ],
    omens: [
      { at: 130, words: 'THE GROUND IS WARM, AND IT BREATHES', sound: 'bellow', pitch: 0.5 },
      { at: 80, words: 'RED LIGHT, FROM BELOW. THE STAIR GOES DOWN INTO IT', sound: 'whale', shake: 0.05, pitch: 0.55 },
      { at: 46, words: 'SOMETHING THAT WAS WORSHIPPED BEFORE THE FIRST MAN STIRS', sound: 'bellow', shake: 0.08, pitch: 0.45 },
    ],
    hazards: [{ kind: 'vent', look: 'flame', at: [spot(80, -3.4), spot(70, 3.4), spot(60, 0), spot(50, -3.2), spot(40, 3.2), spot(30, 0)], every: [5, 9], burst: 3, damage: 28, warn: 66 }],
    rite: { look: 'fire', glow: 'magenta', at: [spot(100, 5.5), spot(94, -6), spot(88, 5)], order: 'falling', clue: 'THREE FIRES FOR THE THREE LAYERS OF THE MOUND. THE DEEPEST BURNS FIRST', done: 'THE VENTS SETTLE. THE MOUND DRAWS A LONG BREATH', reward: { echoes: 700 }, stills: true },
  },
  // The shore of Ib: lilies on black water, the carved stones of a drowned people with their faces to the lake, a canoe drawn up, reeds;
  // the water rises in swells; four green fires to be lit as the water rises, the small to the great.
  bokrug: {
    marks: [
      mark(piece('lily', { walk: true, size: [1, 1.4] }), 6, 130, 6, [2.6, 6], { mirror: true, jitter: 2, chance: 0.8, face: 'free' }),
      mark(piece('plant_bush', { size: [1, 1.4] }), 10, 130, 8, [4, 9], { mirror: true, jitter: 3, chance: 0.7, face: 'free' }),
      mark(piece('prop:monolith', { size: [0.9, 1.2] }), 14, 140, 22, [8, 14], { mirror: true, jitter: 5, chance: 0.8 }),
      mark(piece('fish', { size: 1.3 }), 12, 100, 25, [3.2, 5], { mirror: true, chance: 0.5, face: 'free' }),
      mark(piece('statue_head', { size: 0.9 }), 20, 130, 60, [7, 12], { chance: 0.9, face: 'in' }),
    ],
    omens: [
      { at: 108, words: 'THE LAKE IS STILL, AND BLACK, AND LOOKS BACK', sound: 'whisper', pitch: 0.6 },
      { at: 72, words: 'THE STONES IN THE SHALLOWS ARE CARVED. THEIR FACES ARE ALL TURNED TO THE WATER', sound: 'chant', pitch: 0.55 },
      { at: 40, words: 'SOMETHING GREEN WAKES, UNDER THE LILIES', sound: 'whale', shake: 0.05, pitch: 0.5 },
    ],
    hazards: [{ kind: 'tide', look: 'brine', from: 22, to: 62, width: 9, every: [16, 26], damage: 24 }],
    rite: { look: 'glow', glow: 'green', at: [spot(88, 5), spot(84, -5.5), spot(80, 6), spot(76, -6)], order: 'rising', clue: 'FOUR GREEN FIRES OF IB. LIGHT THEM AS THE WATER RISES: THE SMALL BEFORE THE GREAT', done: 'THE LAKE LAYS ITS SWELLS DOWN. IT HAS BEEN ANSWERED', reward: { echoes: 700, insight: 1 }, stills: true },
  },
  // Hatheg-Kla's slope: snow pines, rings of stone, a cloud on the peak that dances to a pipe; the cold takes the breath and the storm
  // finds those who climb.
  other_gods: {
    marks: [
      mark(piece('pine_crooked', { size: [1, 1.4] }), 8, 150, 10, [5, 14], { mirror: true, jitter: 3, chance: 0.8 }),
      mark(piece('rocks_tall', { size: [1, 1.5] }), 14, 150, 17, [8, 16], { mirror: true, jitter: 4, chance: 0.7, face: 'free' }),
      mark(piece('trilith', { size: 0.7 }), 30, 150, 34, 7.5, { mirror: true, face: 'in' }),
      mark(piece('rock_large', { size: [0.8, 1.2] }), 10, 140, 14, [4, 7], { mirror: true, jitter: 3, chance: 0.5, face: 'free' }),
      mark(piece('tent', { size: 1 }), 104, 104, 1, 10, { face: 'in' }),
      mark(piece('bedroll', { size: 1 }), 106, 106, 1, 7.5, { face: 'free' }),
    ],
    omens: [
      { at: 100, words: 'THE CLOUD ON THE PEAK IS DANCING', sound: 'choral', pitch: 0.6 },
      { at: 66, words: 'PIPES, VERY FAR OFF, AND OUT OF TIME', sound: 'choral', shake: 0.04, pitch: 0.55 },
      { at: 36, words: 'NO GOD OF EARTH DANCES TO THAT PIPE', sound: 'thunder', pitch: 0.5 },
    ],
    hazards: [
      { kind: 'blight', look: 'frost', at: [spot(76, 0), spot(62, 5), spot(48, -5), spot(34, 0)], r: 5.2, rate: 2.8, of: 'stamina' },
      { kind: 'vent', look: 'bolt', at: [spot(68, 5), spot(54, -5), spot(40, 5)], every: [6, 11], burst: 3, damage: 30, warn: 66 },
    ],
  },
};
