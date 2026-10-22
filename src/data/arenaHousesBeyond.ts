/**
 * The houses of the horrors of R'lyeh, Yuggoth and the Beyond (round 63; data/arenaHouses.ts): the leaning masonry of a drowned city
 * and its door, the gates of a city on a lake, the walls of crystal at the Threshold, the Court's, Yaddith's terraces, an organ of
 * black pipes, a ring of hexagons. Data only.
 */

import { house, type House } from './arenaHouses';

export const BEYOND_HOUSES: Readonly<Record<string, House>> = {
  cthulhu: house({
    name: 'THE GREAT DOOR', line: 'The angles are wrong. The door is the only thing in the wall that is not.',
    wall: 'slabs', height: 22, thick: 8, tint: [0.35, 0.55, 0.45], glow: 'green',
    tower: { kind: 'spire', every: 8, height: 36 }, gate: { width: 14, height: 16, flank: 30, sealed: true },
  }),
  hastur: house({
    name: 'THE GATES OF CARCOSA', line: 'Towers behind the moon, and a wall the colour of an old bruise.',
    wall: 'ashlar', height: 12, thick: 3.5, tint: [0.7, 0.62, 0.78], glow: 'purple',
    tower: { kind: 'spire', every: 7, height: 24, lit: true }, gate: { width: 8, height: 10, flank: 22 },
  }),
  yog_sothoth: house({
    name: 'THE THRESHOLD', line: 'A wall of crystal that shows nothing, and a gate that shows everything.',
    wall: 'crystal', height: 14, thick: 4, tint: [0.55, 0.6, 0.8], glow: 'purple',
    tower: { kind: 'spire', every: 8, height: 20 }, gate: { width: 10, height: 11, flank: 22, sealed: true },
  }),
  azathoth: house({
    name: 'THE COURT', line: 'No wall could hold what is at the centre of all. This one is here to keep the rest of us from knowing it.',
    wall: 'crystal', height: 16, thick: 5, tint: [0.3, 0.3, 0.45], glow: 'magenta',
    tower: { kind: 'spire', every: 8, height: 28 }, gate: { width: 10, height: 12, flank: 26, sealed: true },
  }),
  zkauba: house({
    name: 'THE TERRACES OF YADDITH', line: 'Terrace on terrace of a city that was left in a hurry, and a stair that goes into the wall.',
    wall: 'terrace', height: 11, thick: 5, tint: [0.5, 0.42, 0.4], glow: 'magenta',
    tower: { kind: 'square', every: 8, height: 15 }, gate: { width: 8, height: 8, flank: 17 },
  }),
  daemon_pipers: house({
    name: 'THE ORGAN', line: 'Pipes of black stone, as tall as towers, all of them open at the top.',
    wall: 'colonnade', height: 10, thick: 3, tint: [0.22, 0.22, 0.26], glow: 'purple',
    tower: { kind: 'round', every: 7, height: 14 }, gate: { width: 8, height: 8, flank: 16 },
  }),
  ancient_ones: house({
    name: 'THE PALE HEXAGONS', line: 'Pale prisms, set edge to edge in a ring, and one of them has been left out.',
    wall: 'crystal', height: 10, thick: 4, tint: [0.75, 0.78, 0.82], glow: 'green',
    tower: { kind: 'spire', every: 6, height: 16 }, gate: { width: 9, height: 9, flank: 18 },
  }),
};
