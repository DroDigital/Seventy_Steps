/**
 * The twin mound of Nug and Yeb (round 71; pack 08's temple stone cut black, a trough and obelisks made in code, docs/BOSS_PLACES.md): the Children of
 * Yog-Sothoth in two halves of one house. Either side of the fight a stepped shrine of black basalt rises in three tiers to a coal burning on its top,
 * a doorway at its foot facing the court, a banner of the eclipse over the one (Nug's) and one of the stars over the other (Yeb's); a gallery of arches
 * across the back joins them; and from each door a channel of green slime runs down the court's edge toward the gate, the two drawing together to flank
 * the way in (round 75: the channels are cut in the ground, a man's knee deep and glowing green, the slime running down them toward the gate, and a body may wade them). Black obelisks stand out on the road to it. The heart of the old set, the mound with its mouth, stays at the middle of the back gallery.
 * Embers rise from the coals and the doors; the slime breathes. The fog is held low so the shrines stand over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { rectOutline, wallRect } from './common';
import { shaped, strip, SURFACE, type PoolSpec } from './water';

const BASALT: Put = { tint: [0.22, 0.22, 0.28], keep: 0.25 };
const SLIME: Put = { tint: [0.4, 0.62, 0.34], keep: 0.5 };

// a channel of slime from a shrine's door along the court's edge, then in toward the way: its bed's edge a metre beyond the fight's fog, its bank 1.4 m
const channel = (side: number): PoolSpec => ({
  pts: strip([[-3.9, side * 28.4], [30, side * 28.4], [38.5, side * 6.9]], 1.3),
  depth: 0.9, bank: 1.4, tint: [0.28, 0.52, 0.2], foam: [0.72, 0.95, 0.5], flow: [0.5, side * -0.1], glow: 0.9,
});

export const nug: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [41, 36];
  const gate = h.gate.width / 2 + 0.9;
  const ground = shaped(c, [channel(-1), channel(1)]);
  const surfY = -0.9 * SURFACE;
  wallRect(c, 'tp_wall_mid', G, S, B, gate, { ...BASALT, stretch: [1, 1, 3.6], height: 6.4 });

  // a tower at each corner of the wall, a fire on its top
  for (const [a, cc] of [[G - 3.4, S - 3.4], [G - 3.4, -S + 3.4], [-B + 3.4, S - 3.4], [-B + 3.4, -S + 3.4]] as const) {
    c.add('tp_tower_bot', a, cc, { ...BASALT, face: 'front' });
    c.add('tp_tower_top', a, cc, { ...BASALT, face: 'front', y: 7.68, s: 1.1 });
    c.add('px_brazier', a, cc, { y: 13.3, s: 1.5, tint: [0.3, 0.26, 0.28], keep: 0.4, lit: 'fire', walk: true });
  }

  // the shrines: three tiers each, narrowing, a coal on the top; a door at the foot facing the court, flanked by two black stones; a banner over it
  for (const side of [-1, 1]) {
    for (const [i, [cc, w, d]] of ([[33.2, 12, 18], [34.6, 8, 12.4], [35.8, 5, 7]] as const).entries()) {
      c.add('tp_floor', -6, side * cc, { ...BASALT, face: 'front', stretch: [w / 2.4, 5, d / 2.4], y: i * 2.4 });
    }
    c.add('px_brazier', -6, side * 35.8, { y: 7.1, s: 1.9, tint: [0.3, 0.26, 0.28], keep: 0.4, lit: 'fire', flame: 1.6 });
    c.add('tp_doorway', -6, side * 27.1, { ...BASALT, face: 'in', s: 0.78, height: 4.6 });
    for (const a of [-10.4, -1.6]) c.add('px_obelisk_s', a, side * 26.9, { ...BASALT, s: 0.8 });
    c.add(side > 0 ? 'tp_flag_stars' : 'tp_flag_eclipse', -6, side * 27.4, { y: 4.7, face: 'in', s: 1.6, walk: true });
    c.add('bn_skull_pyramid', -3.6, side * 26.4, { s: 1.4, jitter: 0.2, tint: [0.6, 0.58, 0.5], keep: 0.7 });
    c.add('bn_pile_skull', -8.6, side * 26.4, { s: 1.5, jitter: 0.3, tint: [0.6, 0.58, 0.5], keep: 0.7 });
  }

  // the gallery across the back that joins them: nine arches and a beam over them, a flag on each third pier
  c.run('tp_arch', [-31, -27], [-31, 27], { ...BASALT, s: 2, face: 'front', lap: 0.2 });
  c.run('tp_beam', [-31, -27.5], [-31, 27.5], { ...BASALT, y: 6.3, s: 1.2, lap: 0.2 });
  for (const cc of [-18, 0, 18]) c.add('tp_flag_stars', -30.2, cc, { y: 2.6, face: 'front', turn: 180, s: 1.5, walk: true });

  // the channels of slime: from each door along the court's edge toward the gate, then drawing in to run either side of the way, ending at the wall
  for (const side of [-1, 1]) c.add('px_trough', -6, side * 28.4, { ...SLIME, walk: true, s: 1.1, face: 'front' }); // (the door's own trough, the channel running on from it)
  for (const [i, side] of ([-1, 1] as const).entries()) {
    c.add('px_obelisk', G + 6, side * 9.4, { ...BASALT, s: 1.05, jitter: 0.2 });
    c.add('px_obelisk', G + 16, side * (12 + i * 1.8), { ...BASALT, s: 0.85, jitter: 0.3 });
  }
  for (const [a, cc] of [[22, 21], [28, -23], [12, -22], [-22, 18]] as const) c.add('tp_rubble_2', a, cc, { ...BASALT, s: 1.6, jitter: 0.6, walk: true, turn: a * 13 });

  // what rises: embers from the coals and the doors, the slime's breath and its bubbles, a green haze along the channels
  for (const side of [-1, 1]) {
    c.emit({ at: [-6, side * 35.8], y: [7.6, 9.6], r: 1, rate: 4, life: [2, 3.6], size: [0.1, 0.18], colour: [1, 0.35, 0.15], end: [0.7, 0.1, 0.1], alpha: 0.9, rise: 1.1, drift: 0.3, shape: 'spark', glow: true, reach: 110 });
    c.emit({ at: [-6, side * 26.6], y: [0.6, 4], r: 1.7, rate: 3, life: [2, 3.4], size: [0.1, 0.16], colour: [1, 0.4, 0.2], alpha: 0.8, rise: 0.5, drift: 0.3, shape: 'spark', glow: true, reach: 90 });
    c.emit({ at: [-3, side * 28.4], to: [30, side * 28.4], y: [surfY, surfY + 0.5], rate: 3.4, life: [2, 3.6], size: [0.1, 0.2], colour: [0.5, 0.95, 0.4], alpha: 0.7, rise: 0.3, drift: 0.2, shape: 'bubble', glow: true, reach: 90 });
    c.emit({ at: [-3, side * 28.4], to: [30, side * 28.4], y: [surfY, surfY + 1.2], rate: 1.6, life: [3, 5], size: [1.4, 2.4], grow: 1.5, colour: [0.35, 0.6, 0.3], alpha: 0.14, rise: 0.15, shape: 'wisp', glow: true, reach: 90 });
  }
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 4, ...ground };
};
