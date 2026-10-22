/**
 * The ways to the realms' open arenas (data/arenaWays.ts): R'lyeh's causeway, the road to Carcosa, the Threshold's road, the Court's, the
 * terraces of Yaddith, the pipers' and the Gate's. Distances are metres from the fog back toward the road. Data only.
 */

import { mark, piece, spot, type Way } from './arenaWays';

export const BEYOND_WAYS: Readonly<Record<string, Way>> = {
  // The causeway of the drowned city: slabs leaning at wrong angles, green light in the stone;
  // four lamps of the Alert to be lit, the low before the high.
  cthulhu: {
    marks: [
      mark(piece('slab', { size: [0.5, 0.9], glow: 'green' }), 24, 170, 22, [8, 14], { mirror: true, jitter: 4, face: 'free' }),
      mark(piece('prop:spire', { size: 0.5 }), 30, 170, 40, [14, 22], { mirror: true, jitter: 6, chance: 0.7 }),
      mark(piece('statue_head', { size: 1.3 }), 20, 150, 50, [6, 10], { face: 'in', chance: 0.8 }),
      mark(piece('statue_ring', { size: 1.2 }), 30, 150, 45, [9, 12], { face: 'free', chance: 0.7 }),
    ],
    omens: [
      { at: 130, words: 'THE ANGLES ARE WRONG. THE STONE IS WET, AND FEELS FOR YOUR FOOTSTEPS', sound: 'whale', pitch: 0.6 },
      { at: 90, words: 'GREEN LIGHT, IN THE STONE. THE STONE IS LOOKING', sound: 'wail', shake: 0.05, pitch: 0.5 },
      { at: 54, words: 'THE DOOR IS SHUT, AND IT IS NOT STONE THAT HOLDS IT SHUT', sound: 'bellow', shake: 0.07, pitch: 0.45 },
    ],
    rite: { look: 'fire', glow: 'green', at: [spot(104, 6), spot(100, -6.5), spot(96, 7), spot(92, -7.5)], order: 'rising', clue: 'FOUR LAMPS OF THE ALERT. THE LOW BEFORE THE HIGH, AS THE SEA GIVES THEM BACK', done: 'THE LAMPS BURN GREEN, AND THE SEA DRAWS BACK FROM THE CAUSEWAY', reward: { echoes: 900, insight: 1 }, stills: true },
  },
  // The road to Carcosa: tattered banners from towers no one built, lamps lit for no one, a pallid mask watching; the Yellow Sign is laid
  // in the paving.
  hastur: {
    marks: [
      mark(piece('banner', { size: [0.9, 1.2] }), 12, 140, 14, 4.2, { mirror: true, jitter: 2 }),
      mark(piece('prop:tower', { size: 0.35 }), 20, 150, 36, [14, 22], { mirror: true, jitter: 5, chance: 0.8 }),
      mark(piece('lightpost', { lit: 'lamp' }), 16, 120, 28, 3.8, { mirror: true }),
      mark(piece('statue_head', { size: 1.4 }), 24, 130, 55, [6, 9], { face: 'in' }),
      mark(piece('column', { size: 1 }), 20, 140, 24, [9, 13], { mirror: true, jitter: 3, chance: 0.5 }),
    ],
    omens: [
      { at: 120, words: 'THE SUN IS BLACK, AND THE LAKE DOES NOT REFLECT IT', sound: 'choral', pitch: 0.55 },
      { at: 84, words: 'THE BANNERS ARE TATTERED, AND ALL THEIR SIGNS ARE ONE SIGN', sound: 'whisper', pitch: 0.6 },
      { at: 58, words: 'THE SIGN IS CUT IN THE PAVING, AGAIN AND AGAIN, AND NOT ONE STONE OF IT IS WORN', sound: 'chant', pitch: 0.55 },
      { at: 34, words: 'HAVE YOU SEEN THE YELLOW SIGN?', sound: 'whisper', shake: 0.04, pitch: 0.5 },
    ],
  },
  // The road to the Threshold: hexagonal pedestals along it, spheres hanging in the sky and none falling, a road with no shadow;
  // the stars hang over it; four lights of the Threshold to be lit from the road inward.
  yog_sothoth: {
    marks: [
      mark(piece('hexped', { size: [0.7, 0.9], glow: 'purple' }), 14, 200, 18, 4.2, { mirror: true, jitter: 2 }),
      mark(piece('prop:globe', { size: 1 }), 16, 200, 22, [6, 12], { mirror: true, jitter: 5, chance: 0.8 }),
      mark(piece('trilith', { size: 0.8 }), 40, 200, 48, 9, { mirror: true, face: 'in' }),
    ],
    omens: [
      { at: 200, words: 'THE SPHERES IN THE SKY ARE NOT FALLING', sound: 'choral', pitch: 0.5 },
      { at: 150, words: 'THE ROAD HAS NO SHADOW', sound: 'whisper', pitch: 0.6 },
      { at: 100, words: 'THE KEY AND THE GATE ARE ONE THING', sound: 'choral', shake: 0.05, pitch: 0.45 },
      { at: 56, words: 'THE STARS ARE COMING DOWN TO LOOK', sound: 'thunder', shake: 0.06, pitch: 0.5 },
    ],
    rite: { look: 'glow', glow: 'purple', at: [spot(130, 4.5), spot(122, -4.5), spot(114, 4.5), spot(106, -4.5)], order: 'near', clue: 'FOUR LIGHTS ON THE THRESHOLD. LIGHT THEM FROM THE ROAD INWARD, AS ONE COMES', done: 'THE LIGHTS HOLD, AND THE STARS STOP COMING DOWN', reward: { echoes: 1000, insight: 1 }, stills: true },
  },
  // The road to the Court: pipes set along it, cones of the void, a piping with no tune.
  azathoth: {
    marks: [
      mark(piece('pipes', { size: [0.7, 1] }), 12, 160, 17, [5, 7], { mirror: true, jitter: 3 }),
      mark(piece('prop:cone', { size: 0.9 }), 18, 160, 30, [10, 16], { mirror: true, jitter: 5, chance: 0.8 }),
    ],
    omens: [
      { at: 130, words: 'A THIN PIPING. IT HAS NO TUNE', sound: 'choral', pitch: 0.5 },
      { at: 90, words: 'THE ROAD ENDS WHERE THE FLOOR DOES', sound: 'whisper', pitch: 0.55 },
      { at: 50, words: 'THE DANCERS DO NOT TURN TO LOOK. THEY HAVE NOTHING TO LOOK WITH', sound: 'wail', shake: 0.06, pitch: 0.45 },
    ],
  },
  // The terraces of Yaddith: pylons of metal-stone, cones that hum, pedestals glowing green; the paving is a mirror in pieces.
  zkauba: {
    marks: [
      mark(piece('pylon', { size: 0.3 }), 24, 150, 40, [8, 11], { mirror: true, jitter: 4 }),
      mark(piece('prop:cone', { size: 0.8 }), 10, 140, 15, [5, 9], { mirror: true, jitter: 3, chance: 0.7 }),
      mark(piece('hexped', { size: 0.8, glow: 'green' }), 12, 130, 21, [4, 6], { mirror: true, jitter: 3, chance: 0.8 }),
    ],
    omens: [
      { at: 110, words: 'THE METAL-STONE IS WARM. NO SUN HAS WARMED IT', sound: 'whisper', pitch: 0.65 },
      { at: 76, words: 'THE PAVING IS A MIRROR IN PIECES, AND EVERY PIECE SHOWS A DIFFERENT SKY', sound: 'chant', pitch: 0.55 },
      { at: 40, words: 'A MAN STANDS AT THE END OF THE ROAD. HIS FACE FLICKERS, AS A FLAME DOES', sound: 'wail', pitch: 0.6 },
    ],
  },
  // The pipers' road: pipes set along it, hanging globes; four lights to be lit, the great
  // before the small.
  daemon_pipers: {
    marks: [
      mark(piece('pipes', { size: [0.6, 0.9] }), 10, 150, 19, [3.8, 5.4], { mirror: true, jitter: 3 }),
      mark(piece('prop:globe', { size: 0.8 }), 14, 150, 28, [8, 14], { mirror: true, jitter: 5, chance: 0.8 }),
    ],
    omens: [
      { at: 110, words: 'THE PIPING IS THIN, AND MONOTONOUS, AND VERY CLOSE', sound: 'choral', pitch: 0.55 },
      { at: 76, words: 'THE NOTES HANG IN THE AIR, WHERE YOU CAN SEE THEM', sound: 'whisper', pitch: 0.6 },
      { at: 42, words: 'THEY PLAY FOR THE ONE AT THE CENTRE, WHO DOES NOT KNOW IT', sound: 'wail', shake: 0.04, pitch: 0.5 },
    ],
    rite: { look: 'glow', glow: 'purple', at: [spot(98, 5), spot(94, -5.5), spot(90, 6), spot(86, -6)], order: 'falling', clue: 'FOUR LIGHTS FOR FOUR PIPES. THE GREAT NOTE BEFORE THE SMALL', done: 'THE PIPES FALL SILENT, ONE BY ONE', reward: { echoes: 900, insight: 1 }, stills: true },
  },
  // The pale hexagons: pedestals of light along a way that is itself a hexagon of light; the Gate at its far side.
  ancient_ones: {
    marks: [
      mark(piece('hexped', { size: [0.8, 1], glow: 'purple' }), 12, 150, 24, [4, 6], { mirror: true, jitter: 3 }),
      mark(piece('trilith', { size: 0.7 }), 36, 150, 44, 9, { mirror: true, face: 'in' }),
    ],
    omens: [
      { at: 100, words: 'THE FLOOR IS PALE, AND IT IS LIT FROM BELOW', sound: 'choral', pitch: 0.55 },
      { at: 70, words: 'THE FLOOR REMEMBERS EVERY FOOT THAT HAS CROSSED IT, AND KEEPS NONE OF THEM', sound: 'chant', pitch: 0.55 },
      { at: 36, words: 'NOTHING COMES THROUGH THE GATE. NOTHING NEEDS TO', sound: 'whisper', shake: 0.05, pitch: 0.45 },
    ],
  },
};
