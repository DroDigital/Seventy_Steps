/**
 * The burned plantation house of the Gorgon (round 71; the temple pack for the manor's courses of stone, pack 01 for its rafters, the posed bodies of pack 13 for the
 * people it made into stone; docs/BOSS_PLACES.md): a house in the shape of a U about the court, its back wing with the long porch of columns still standing and
 * the wings running forward either side, roofless, their walls black and broken, the rafters of what was above them fallen in or standing against the sky, a chimney
 * at the middle of each wing, and a low garden wall across the front with the gate between two piers. On the porch, in the doorways and down the way from the gate stand the
 * stone people, caught running, shielding their faces, crouched and pleading. Embers still lift from the wings. The fight is in the court; nothing solid stands in it.
 * Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { column, rectOutline } from './common';

const CHAR: Put = { tint: [0.34, 0.31, 0.3], keep: 0.1 };
const MARBLE: Put = { tint: [0.74, 0.7, 0.66], keep: 0.35 };
const BURNT: Put = { tint: [0.2, 0.17, 0.16], keep: 0.1 };
const FIGURES = ['fg_stone_run', 'fg_stone_shield', 'fg_stone_crouch', 'fg_stone_plead'] as const;

export const gorgon: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [c.R + 12, c.R + 16];
  const gate = h.gate.width / 2 + 0.9;
  const [wingA, porch, inner] = [12, -B + 10.5, S - 9]; // the wings' front ends, the porch's line, and the wings' inner walls
  const tall: Put = { ...CHAR, stretch: [1, 1, 2.4], height: 7.4 };
  const garden: Put = { ...CHAR, stretch: [1, 1, 2.2], height: 3.2 };

  // the garden wall across the front and down the sides to the wings, the wings' outer walls, the back wall
  c.run('tp_wall_mid', [G, -gate], [G, -S], garden);
  c.run('tp_wall_mid', [G, gate], [G, S], garden);
  for (const side of [-1, 1]) {
    c.run('tp_wall_mid', [G, side * S], [wingA, side * S], garden);
    c.run('tp_wall_mid', [wingA, side * S], [-B, side * S], tall);
    c.run('tp_wall_mid', [wingA, side * S], [wingA, side * inner], { ...tall, height: 6.2 });
  }
  c.run('tp_wall_mid', [-B, S], [-B, -S], { ...tall, height: 8.4 });
  // the gate's piers, each a base, a shaft and a capital, a lamp on each
  for (const side of [-1, 1]) {
    const top = column(c, G, side * (gate - 0.2), 0, { ...MARBLE, s: 0.7 });
    c.add('lantern', G, side * (gate - 0.2), { y: top + 0.1, s: 2, lit: 'lamp', round: true });
  }

  // the wings' inner walls: windows and collapse, with a doorway to each
  for (const side of [-1, 1]) {
    let i = 0;
    for (let a = wingA - 1.3; a > porch + 1; a -= 2.4, i++) {
      const at = side * inner;
      if (Math.abs(a + 8) < 2) { c.add('tp_doorway', a, at, { ...CHAR, face: 'front', turn: 90, s: 0.7, height: 6.4 }); continue; }
      if (i % 4 === 2) c.add('tp_ruin_half_1', a, at, { ...CHAR, face: 'front', turn: 90, stretch: [1, 1.1, 1.2] });
      else c.add('tp_wall_win', a, at, { ...CHAR, face: 'front', turn: 90, stretch: [1, 1.45 - (i % 3) * 0.2, 1.2] });
    }
  }
  // the porch: nine columns of the long colonnade, the beam still across three of its bays, rafters broken above, a floor of flags
  const cols = Array.from({ length: 9 }, (_, i) => -S + 6 + (i * (2 * S - 12)) / 8);
  for (const [i, cc] of cols.entries()) {
    if (i === 4) continue; // (the middle one fell: the way in)
    column(c, porch, cc, i % 3 === 0 ? 0 : 1, { ...MARBLE, jitter: 0.12, s: 1.05 });
  }
  c.run('tp_beam', [porch, cols[0]! - 1], [porch, cols[3]! + 1], { ...CHAR, y: 6.7 });
  c.run('tp_beam', [porch, cols[5]! - 1], [porch, cols[8]! + 1], { ...CHAR, y: 6.7, from: 0.2 });
  c.add('tp_floor', porch - 3.2, 0, { ...CHAR, stretch: [2 * S / 2.4, 1, 5], y: 0.02, walk: true, face: 'front' });
  for (let cc = -S + 3; cc < S - 2; cc += 4.8) c.add('tp_wall_win', -B + 0.9, cc, { ...CHAR, face: 'front', stretch: [1, 1.5, 1.1] });
  for (const side of [-1, 1]) for (const cc of [side * 9, side * 21]) c.add('tp_stairs', porch + 2.4, cc, { ...CHAR, face: 'front', walk: true, s: 0.8, stretch: [1.8, 0.7, 1] });

  // rafters: standing across the wings and the back wing, the others down
  for (const side of [-1, 1]) {
    for (let a = wingA - 4; a > porch + 2; a -= 6.5) {
      if ((a * side) % 3 > 1.5) c.add('fh_beam_drop', a, side * (inner + 3), { ...BURNT, face: 'front', s: 2.2, turn: a * 5, y: 0.1, walk: true });
      else c.add('fh_roof_c', a, side * (inner + 4.5), { ...BURNT, face: 'front', length: 9.2, y: 6.6, height: 3.4 });
    }
    c.add('px_chimney', -6, side * (S - 1.4), { height: 13, tint: [0.2, 0.18, 0.18], keep: 0.1 });
  }
  for (const a of [-B + 2, -B + 5.5, -B + 8.8]) c.add('fh_roof_c', a, -9, { ...BURNT, face: 'left', length: 8, y: 7.2, height: 2.8 });
  for (const [a, cc, t] of [[-B + 4, 12, 0.5], [-B + 6, -18, 2.1], [-B + 3, 2, 1.2]] as const) c.add('fh_beam_lean', a, cc, { ...BURNT, face: 'front', s: 2.4, turn: t * 40, y: 0.1, walk: true });
  for (const [a, cc] of [[-B + 5, 26], [-B + 8, -25], [-10, S - 4], [4, -S + 5], [-24, 3]] as const) c.add('tp_rubble_2', a, cc, { ...CHAR, s: 1.6, jitter: 0.5, walk: true, turn: a * 17 });

  // the stone people: along the porch, in the doorways, a few on the way from the gate; none in the court
  const at: readonly (readonly [number, number, number])[] = [
    [porch + 1.4, -21, 0], [porch + 1.8, -14, 1], [porch + 1.1, -6, 2], [porch + 1.6, 7, 3], [porch + 1.2, 15, 0], [porch + 1.8, 23, 1],
    [-8, inner - 1.8, 2], [-8.8, -inner + 1.8, 3], [G - 6, 9.5, 0], [G - 9, -10.5, 1], [G - 13, 13, 3],
  ];
  for (const [i, [a, cc, k]] of at.entries()) c.add(FIGURES[k]!, a, cc, { face: i % 3 === 0 ? 'front' : 'in', turn: (i * 47) % 70 - 30, s: 1.08, tint: [0.62, 0.6, 0.58], keep: 0.4, jitter: 0.2 });
  for (const [a, cc, id] of [[porch + 2.6, -3.5, 'tp_vase_3'], [porch + 3, 3.6, 'tp_vase_2'], [G - 4, 6, 'tp_vase_1'], [G - 4.4, -6.5, 'tp_vase_3']] as const) c.add(id, a, cc, { ...CHAR, s: 1.3, jitter: 0.3 });

  // what still lifts from it: embers along the wings' inner walls, the chimneys' smoke, ash drifting across the court from the porch
  for (const side of [-1, 1]) {
    c.emit({ at: [wingA - 2, side * (inner + 2)], to: [porch + 2, side * (inner + 2)], y: [0.6, 5], rate: 3.4, life: [2, 4], size: [0.1, 0.18], colour: [1, 0.55, 0.22], end: [0.8, 0.2, 0.1], alpha: 0.9, rise: 0.8, drift: 0.35, shape: 'spark', glow: true, reach: 90 });
    c.emit({ at: [-6, side * (S - 1.4)], y: [13, 13.5], r: 0.6, rate: 3, life: [4, 6], size: [0.9, 1.5], grow: 2.4, colour: [0.22, 0.2, 0.2], alpha: 0.3, rise: 0.9, drift: 0.2, flow: { x: 0.3, z: 0.2 }, shape: 'wisp', reach: 100 });
  }
  c.emit({ at: [porch + 1, -S + 6], to: [porch + 1, S - 6], y: [0.3, 3.5], rate: 3, life: [4, 7], size: [0.1, 0.2], colour: [0.6, 0.58, 0.56], alpha: 0.6, drift: 0.3, flow: { x: 0.8, z: 0 }, shape: 'disc', reach: 90 });
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 3.6 };
};
