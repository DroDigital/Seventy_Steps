/**
 * The gate court at the lake of Ib (round 71; pack 08's marble and bronze, Kenney's reeds and lilies, docs/BOSS_PLACES.md; round 72: zacharykozak's ancient ruins for the arcade): where the ruin of a city on a
 * lake meets its water. A marble wall about the court, two towers either side of the gate carrying the moon's banners and a pair of bronze leaves that draw
 * apart for whoever comes; along both sides an arcade of two storeys of round arches, ruined, its first columns broken off at the foot; at the back the wall is the
 * quay, low, and before it, round 75, the lake itself: the court is a third deeper and the ground sunk a man's height in a wide basin of still water, green-black, which does not move, with steps going
 * down into it from the court, the stumps of the old colonnade standing out of it (two with a piece of shaft left) and lilies on it, flags of the old city cracked about its edge. Everything is green with
 * what is older than moss. Reeds and lilies stand along the road in. Green fire in braziers, a mist on the water, motes above it. The fog is held low so the towers and the arcade show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { rectOutline, wallRect } from './common';
import { bed, shaped, SURFACE, type PoolSpec } from './water';

const MARBLE: Put = { tint: [0.62, 0.74, 0.68], keep: 0.4 };
const MOSS: Put = { tint: [0.4, 0.58, 0.46], keep: 0.35 };

// the lake of Ib, along the back: a basin 1.2 m deep, its edge 2.6 m of bank from the wall and the fight's fog
const LAKE: PoolSpec = {
  pts: [[-29.6, -12], [-29.2, -6], [-29.2, 6], [-29.6, 12], [-33, 17.5], [-37.5, 19], [-40, 16], [-40.6, 8], [-40.6, -8], [-40, -16], [-37.5, -19], [-33, -17.5]],
  depth: 1.2, bank: 2.6, tint: [0.08, 0.18, 0.16], foam: [0.5, 0.66, 0.58], glow: 0.15,
};

export const bokrug: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [34, 44];
  const gate = h.gate.width / 2 + 0.9;
  const tower = gate + 3.9;
  const ground = shaped(c, [LAKE]);
  const [bedY, surfY] = [bed(LAKE), -LAKE.depth * SURFACE];
  wallRect(c, 'tp_wall_mid', G, S, B, gate, { ...MARBLE, stretch: [1, 1.9, 3.2], height: 4.6 });
  c.run('tp_wall_mid', [-B, S], [-B, -S], { ...MOSS, stretch: [1, 1.2, 3.6], height: 3.2 }); // (the quay's wall is lower than the rest)

  // the gate towers: a base, a top, a banner of the moon over the court, the lit fire on the top
  for (const side of [-1, 1]) {
    c.add('tp_tower_bot', G - 0.6, side * tower, { ...MARBLE, face: 'front' });
    c.add('tp_tower_top', G - 0.6, side * tower, { ...MARBLE, face: 'front', y: 7.68, s: 1.1 });
    c.add('px_brazier', G - 0.6, side * tower, { y: 13.5, s: 1.6, tint: [0.3, 0.34, 0.32], keep: 0.4, lit: 'torch', walk: true });
    c.add('tp_flag_moon', G - 4.3, side * tower, { y: 3.4, face: 'in', s: 1.7, walk: true });
  }

  // the arcade down both sides: three bays of the old city's two-storey arches, whole in places, broken in others, standing against the wall and facing the court (zacharykozak's ruin); the flags between
  const bays = [-B + 12, -B + 12 + 20.4, -B + 12 + 40.8, -B + 12 + 61.2].filter((a) => a < G - 8);
  for (const side of [-1, 1]) {
    for (const [i, a] of bays.entries()) c.add('ar_arcade', a, side * (S - 2.7), { ...MARBLE, face: 'in', keep: 0.45, stretch: [1, 0.78 + (((i + (side > 0 ? 1 : 0)) * 5) % 4) * 0.07, 1], jitter: 0 });
    const end = bays[bays.length - 1]! + 12.5; // a column of the old colonnade, broken at its foot, where the last bay ends (the wall is there, if the bays reach it)
    if (end < G - 6) {
      c.add('tp_col_base', end, side * (S - 3.2), { ...MOSS, s: 1.0 });
      c.add('tp_rubble_1', end + 1.2, side * (S - 5.2), { ...MOSS, s: 1.5, walk: true, jitter: 0.4 });
    }
    c.add('tp_floor', (G - B) / 2 - 0.5, side * (S - 2.4), { ...MOSS, face: 'front', stretch: [(G + B) / 2.4, 1, 6.4 / 2.4], y: 0.02, walk: true });
  }

  // the lake: flagstones broken about it, steps going down into it from the court, the old colonnade's stumps standing out of the water, lilies on it, banners of the old city
  for (const [a, cc, id] of [[-30, -23.5, 'tp_floor_ruin_1'], [-36, 23.8, 'tp_floor_ruin_2'], [-30, 23.2, 'tp_floor_ruin_2'], [-37, -23.5, 'tp_floor_ruin_1'], [-42, 22.6, 'tp_floor_ruin_1']] as const) c.add(id, a, cc, { ...MOSS, face: 'front', s: 1.6, stretch: [1.5, 1, 1.5], y: 0.03, walk: true, turn: a * 11 });
  for (const [a, cc] of [[-37.4, 21.6], [-31.6, -21.8], [-40.6, -21.2]] as const) c.add('tp_rubble_1', a, cc, { ...MOSS, s: 1.5, walk: true, jitter: 0.4 }); // (a shaft of the colonnade fallen at the lake's edge)
  c.add('tp_stairs', -28.4, 0, { ...MOSS, face: 'front', stretch: [4, -bedY / 2.76, 0.55], y: bedY, walk: true });
  for (const [i, [a, cc]] of ([[-33.5, -10], [-35.6, -4], [-33, 3.4], [-36.4, 9.4], [-34.2, 14.6]] as const).entries()) {
    c.add('tp_col_base', a, cc, { ...MOSS, y: bedY, s: 1.0 + (i % 2) * 0.1, jitter: 0.3 });
    if (i % 3 === 1) c.add('tp_col_mid', a, cc, { ...MOSS, y: bedY + 2.4, s: 1.0, jitter: 0 });
  }
  for (let i = 0; i < 12; i++) c.add('nt_lily', -38 + (i % 4) * 2.6, -16 + i * 2.9, { y: surfY + 0.05, keep: 0.5, tint: [0.2, 0.34, 0.3], jitter: 0.5, s: 1.2 + (i % 3) * 0.3, walk: true, face: 'front', turn: i * 53 });
  for (const [a, cc] of [[-B + 1.6, -9], [-B + 1.6, 9]] as const) c.add('tp_flag_stars', a, cc, { y: 0.4, face: 'front', s: 1.3, walk: true, jitter: 0.1 });
  for (const [a, cc, id] of [[-B + 4, 24.5, 'tp_vase_3'], [-B + 4, -24.5, 'tp_vase_2'], [G - 6, 6.6, 'tp_vase_1'], [G - 6, -6.6, 'tp_vase_3']] as const) c.add(id, a, cc, { ...MOSS, s: 1.4, jitter: 0.2 });

  // the way in: a floor of flags from the gate to the ring, two braziers of green fire either side, reeds and lilies gathered along the road beyond
  c.add('tp_floor', (G + c.R + 3) / 2, 0, { ...MOSS, face: 'front', stretch: [4.4 / 2.4, 1, (G - c.R) / 2.4], y: 0.02, walk: true });
  for (const a of [G - 5, G - 12]) for (const side of [-1, 1]) c.add('px_brazier', a, side * 4.6, { y: 0, s: 1.5, tint: [0.3, 0.34, 0.32], keep: 0.4, lit: 'torch' });
  for (let i = 0; i < 16; i++) {
    const a = G + 3 + (i % 8) * 2.1;
    const side = i < 8 ? -1 : 1;
    c.add(i % 3 === 2 ? 'nt_bush' : 'nt_reed', a, side * (6.5 + (i % 4) * 2.1), { keep: 0.5, tint: [0.28, 0.36, 0.3], jitter: 0.9, s: 1.4, walk: true, face: 'front' });
  }

  // what the water does: a mist on it, motes over it, a green fire's embers at the towers
  c.emit({ at: [-35, -17], to: [-35, 17], y: [surfY + 0.1, surfY + 1], r: 5, rate: 4.4, life: [4, 7], size: [2, 3.4], grow: 1.6, colour: [0.45, 0.7, 0.6], alpha: 0.2, rise: 0.12, drift: 0.2, flow: { x: 0.3, z: 0.1 }, shape: 'wisp', reach: 100 });
  c.emit({ at: [-35, -16], to: [-35, 16], y: [surfY + 0.4, 2.6], r: 5, rate: 3.2, life: [3, 5], size: [0.08, 0.14], colour: [0.5, 1, 0.75], alpha: 0.8, rise: 0.15, drift: 0.4, shape: 'spark', glow: true, reach: 90 });
  for (const side of [-1, 1]) c.emit({ at: [G - 0.6, side * tower], y: [14, 16], r: 0.6, rate: 3, life: [2.4, 4], size: [0.1, 0.16], colour: [0.4, 1, 0.55], alpha: 0.8, rise: 1, drift: 0.3, shape: 'spark', glow: true, reach: 110 });
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 4, ...ground };
};
