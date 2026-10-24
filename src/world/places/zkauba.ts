/**
 * The terraces of Yaddith (round 71; pack 11's modules with their colony's markings taken off and thrown to a pale metal-stone, docs/BOSS_PLACES.md): a court walled
 * by towers of the planet's metal set side by side, low along the sides and the back, tall at the corners and either side of the gate, where a drill tower
 * stands at each back corner; passages run overhead from the wall's top across two corners of the court, and a covered bridge crosses over the gate between
 * its towers. Domes of the city stand beyond the wall. Sparks hum at the towers' tops, the drills breathe, a green mist lies along the foot of the walls. The fog is held low so the
 * towers and the passages show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { rectOutline, wallRect } from './common';

const METAL: Put = { tint: [0.7, 0.72, 0.68], keep: 0.45 };
const DARK: Put = { tint: [0.46, 0.5, 0.48], keep: 0.45 };

export const zkauba: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [40, 36];
  const gate = h.gate.width / 2 + 0.9;
  const flank = gate + 5.25; // the gate's towers' middles
  wallRect(c, 'yd_tower_low', G, S, B, flank + 5.25, METAL);
  wallRect(c, 'tp_wall_mid', G + 3, S + 3, B + 3, flank + 5.25, { ...DARK, stretch: [1, 1, 3], height: 5.4 }); // (a curtain behind the towers, seen between their legs)

  // the tall towers: either side of the gate and at the front corners; the drills at the back corners
  for (const side of [-1, 1]) {
    c.add('yd_tower_tall', G, side * flank, { ...METAL, face: 'front' });
    c.add('yd_tower_tall', G, side * S, { ...METAL, face: 'front', s: 1.06 });
    c.add('yd_drill', -B, side * S, { ...DARK, face: 'in', s: 1.06 });
  }

  // overhead: a covered bridge over the gate between its towers, and passages from the back wall's top to the sides', across the court's back corners
  c.run('yd_tunnel', [G, -flank + 4], [G, flank - 4], { ...METAL, y: 9.2, walk: true });
  for (const side of [-1, 1]) c.run('yd_tunnel', [-B + 3, side * 22], [-12, side * (S - 3)], { ...METAL, y: 6.1, walk: true });

  // the city beyond the wall: its domes
  for (const [i, [a, cc]] of ([[-B - 13, -14], [-B - 12, 12], [-4, S + 13], [8, -S - 13], [-B - 20, -31]] as const).entries()) {
    c.add(i % 2 ? 'yd_dome_e' : 'yd_dome_a', a, cc, { ...(i % 2 ? DARK : METAL), face: 'in', s: 1.1 + (i % 3) * 0.15 });
  }

  // what hums: sparks at the tall towers' tops, the drills' breath, a green mist along the foot of the walls
  for (const side of [-1, 1]) {
    for (const [a, cc] of [[G, side * flank], [G, side * S]] as const) c.emit({ at: [a, cc], y: [12, 14], r: 3, rate: 2.6, life: [1.6, 3], size: [0.1, 0.16], colour: [0.5, 1, 0.75], alpha: 0.9, rise: 0.5, drift: 0.5, shape: 'spark', glow: true, reach: 110 });
    c.emit({ at: [-B, side * S], y: [12, 13], r: 1.6, rate: 2.4, life: [4, 6], size: [1.2, 2.2], grow: 2.2, colour: [0.6, 0.66, 0.62], alpha: 0.24, rise: 1, drift: 0.3, flow: { x: 0.3, z: 0.2 }, shape: 'wisp', reach: 110 });
    c.emit({ at: [-B + 8, side * (S - 7)], to: [G - 8, side * (S - 7)], y: [0.2, 1.4], rate: 2, life: [5, 8], size: [2, 3.4], grow: 1.4, colour: [0.35, 0.7, 0.5], alpha: 0.14, drift: 0.2, shape: 'wisp', glow: true, reach: 100 });
  }
  return { outline: rectOutline(G, S, B), ahead: G, outer: 14, fogHeight: 4 };
};
