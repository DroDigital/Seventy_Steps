/**
 * The gate court at the lake of Ib (round 71; pack 08's marble and bronze, Kenney's reeds and lilies, docs/BOSS_PLACES.md): where the ruin of a city on a
 * lake meets its water. A marble wall about the court, two towers either side of the gate carrying the moon's banners and a pair of bronze leaves that draw
 * apart for whoever comes; along both sides a colonnade carrying its beam, three of its columns broken off at the first course; at the back the wall is the
 * quay, low, with a stagnant pool before it, lilies on it, flags of the old city cracked about its edge and steps going down into the water, which does
 * not move. Everything is green with what is older than moss. Reeds and lilies stand along the road in. Green fire in braziers, a mist on the water, motes
 * above it. The fog is held low so the towers and the colonnade show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { column, rectOutline, wallRect } from './common';

const MARBLE: Put = { tint: [0.62, 0.74, 0.68], keep: 0.4 };
const MOSS: Put = { tint: [0.4, 0.58, 0.46], keep: 0.35 };

export const bokrug: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [34, 34];
  const gate = h.gate.width / 2 + 0.9;
  const tower = gate + 3.9;
  wallRect(c, 'tp_wall_mid', G, S, B, gate, { ...MARBLE, stretch: [1, 1.9, 3.2], height: 4.6 });
  c.run('tp_wall_mid', [-B, S], [-B, -S], { ...MOSS, stretch: [1, 1.2, 3.6], height: 3.2 }); // (the quay's wall is lower than the rest)

  // the gate towers: a base, a top, a banner of the moon over the court, the lit fire on the top
  for (const side of [-1, 1]) {
    c.add('tp_tower_bot', G - 0.6, side * tower, { ...MARBLE, face: 'front' });
    c.add('tp_tower_top', G - 0.6, side * tower, { ...MARBLE, face: 'front', y: 7.68, s: 1.1 });
    c.add('px_brazier', G - 0.6, side * tower, { y: 13.5, s: 1.6, tint: [0.3, 0.34, 0.32], keep: 0.4, lit: 'torch', walk: true });
    c.add('tp_flag_moon', G - 4.3, side * tower, { y: 3.4, face: 'in', s: 1.7, walk: true });
  }

  // the colonnade down both sides: nine columns, three broken off, the beam across the rest
  const cols = Array.from({ length: 10 }, (_, i) => -B + 5.5 + (i * (G + B - 12)) / 9);
  for (const side of [-1, 1]) {
    for (const [i, a] of cols.entries()) {
      const cc = side * (S - 3.2);
      if ((i + (side > 0 ? 0 : 2)) % 4 === 3) { // broken at the first course
        c.add('tp_col_base', a, cc, { ...MOSS, s: 1.0 });
        c.add('tp_col_mid', a, cc, { ...MOSS, s: 1.0, y: 2.4, stretch: [1, 0.55, 1] });
        c.add('tp_rubble_1', a + 1.2, cc - side * 1.4, { ...MOSS, s: 1.5, walk: true, jitter: 0.4 });
        continue;
      }
      column(c, a, cc, 1, { ...MARBLE, s: 1.0 });
    }
    c.run('tp_beam', [cols[0]!, side * (S - 3.2)], [cols[2]!, side * (S - 3.2)], { ...MARBLE, y: 7.15 });
    c.run('tp_beam', [cols[4]!, side * (S - 3.2)], [cols[9]!, side * (S - 3.2)], { ...MARBLE, y: 7.15 });
    c.add('tp_floor', (G - B) / 2 - 0.5, side * (S - 2.4), { ...MOSS, face: 'front', stretch: [(G + B) / 2.4, 1, 6.4 / 2.4], y: 0.02, walk: true });
  }

  // the quay: flagstones broken about a still pool, steps into it, lilies on it, banners of the old city
  c.add('tp_floor', -B + 6.5, 0, { tint: [0.1, 0.22, 0.2], keep: 0.1, face: 'front', stretch: [30 / 2.4, 0.5, 7.4 / 2.4], y: 0.04, walk: true });
  for (const [a, cc, id] of [[-B + 2, -17.5, 'tp_floor_ruin_1'], [-B + 9, 17.5, 'tp_floor_ruin_2'], [-B + 2, 17, 'tp_floor_ruin_2'], [-B + 9.5, -17.8, 'tp_floor_ruin_1']] as const) c.add(id, a, cc, { ...MOSS, face: 'front', s: 1.6, stretch: [1.5, 1, 1.5], y: 0.03, walk: true, turn: a * 11 });
  c.add('tp_stairs', -B + 10.3, 0, { ...MOSS, face: 'front', turn: 180, stretch: [4, 0.2, 0.3], walk: true });
  for (let i = 0; i < 12; i++) c.add('nt_lily', -B + 3.2 + (i % 4) * 1.7, -12 + i * 2.2, { y: 0.06, keep: 0.5, tint: [0.2, 0.34, 0.3], jitter: 0.5, s: 1.2 + (i % 3) * 0.3, walk: true, face: 'front', turn: i * 53 });
  for (const [a, cc] of [[-B + 1.6, -9], [-B + 1.6, 9]] as const) c.add('tp_flag_stars', a, cc, { y: 0.4, face: 'front', s: 1.3, walk: true, jitter: 0.1 });
  for (const [a, cc, id] of [[-B + 4, 15.6, 'tp_vase_3'], [-B + 4, -15.6, 'tp_vase_2'], [G - 6, 6.6, 'tp_vase_1'], [G - 6, -6.6, 'tp_vase_3']] as const) c.add(id, a, cc, { ...MOSS, s: 1.4, jitter: 0.2 });

  // the way in: a floor of flags from the gate to the ring, two braziers of green fire either side, reeds and lilies gathered along the road beyond
  c.add('tp_floor', (G + c.R + 3) / 2, 0, { ...MOSS, face: 'front', stretch: [4.4 / 2.4, 1, (G - c.R) / 2.4], y: 0.02, walk: true });
  for (const a of [G - 5, G - 12]) for (const side of [-1, 1]) c.add('px_brazier', a, side * 4.6, { y: 0, s: 1.5, tint: [0.3, 0.34, 0.32], keep: 0.4, lit: 'torch' });
  for (let i = 0; i < 16; i++) {
    const a = G + 3 + (i % 8) * 2.1;
    const side = i < 8 ? -1 : 1;
    c.add(i % 3 === 2 ? 'nt_bush' : 'nt_reed', a, side * (6.5 + (i % 4) * 2.1), { keep: 0.5, tint: [0.28, 0.36, 0.3], jitter: 0.9, s: 1.4, walk: true, face: 'front' });
  }

  // what the water does: a mist on it, motes over it, a green fire's embers at the towers
  c.emit({ at: [-B + 6.5, -14], to: [-B + 6.5, 14], y: [0.1, 0.9], r: 2, rate: 3, life: [4, 7], size: [2, 3.4], grow: 1.6, colour: [0.45, 0.7, 0.6], alpha: 0.2, rise: 0.12, drift: 0.2, flow: { x: 0.3, z: 0.1 }, shape: 'wisp', reach: 100 });
  c.emit({ at: [-B + 6.5, -13], to: [-B + 6.5, 13], y: [0.4, 2.6], r: 3, rate: 2.4, life: [3, 5], size: [0.08, 0.14], colour: [0.5, 1, 0.75], alpha: 0.8, rise: 0.15, drift: 0.4, shape: 'spark', glow: true, reach: 90 });
  for (const side of [-1, 1]) c.emit({ at: [G - 0.6, side * tower], y: [14, 16], r: 0.6, rate: 3, life: [2.4, 4], size: [0.1, 0.16], colour: [0.4, 1, 0.55], alpha: 0.8, rise: 1, drift: 0.3, shape: 'spark', glow: true, reach: 110 });
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 4 };
};
