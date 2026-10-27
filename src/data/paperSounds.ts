/**
 * The sound of a note's paper burning away when its page is put away (round 89; render/paperBurn.ts): the whoosh of it catching, the
 * body of the fire and a run of crackles that thins as it dies. A recipe of the same layers as data/sounds.ts, played with a little
 * variation drawn each time. Data only.
 */

import { noise, type Sound } from './sounds';

const POPS = [0.06, 0.15, 0.22, 0.34, 0.41, 0.58, 0.66, 0.86, 1.05, 1.31, 1.62] as const; // (they thin out as the fire dies)

export const PAPER_BURN: Sound = [
  noise('bandpass', 900, 1.5, 0.4, { to: 2400, q: 0.8, attack: 0.22 }), // the whoosh of it catching
  noise('lowpass', 520, 1.7, 0.45, { to: 120, attack: 0.04, q: 0.8 }), // the body of it
  ...POPS.map((at, k) => noise('highpass', 3200 + 380 * (k % 4), 0.035, 0.2 - 0.012 * k, { at, q: 3 })), // each crackle
  noise('highpass', 5200, 1.3, 0.05, { at: 0.12, attack: 0.3 }), // the hiss of the fibres
];
