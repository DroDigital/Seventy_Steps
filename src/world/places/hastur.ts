/**
 * The theatre of Carcosa (round 71; round 72: Marin Pette's Roman theatre of Palmyra, the cavea cut into wedges, and its columns, with the stage curtains of mynameismary's theatre
 * weathered yellow, pack 08's arch, flags and towers, a mask made in code, docs/BOSS_PLACES.md): the fight is the stage. Fourteen wedges of the old bowl stand about it, their tiers
 * rising away from the floor, a wall of chords closing them all round; the front's three are left out, where the way in runs between the tiers, a passage that opens as it goes in;
 * one at the back, where a stage house closes the ring: a raised floor, a proscenium arch with masks along its crown, and behind it a row of the theatre's columns with the
 * curtains hung yellow and torn between them. On the tiers a restrained audience sits, pale and still, turned to the floor, and spectral eyes open among the rows. Towers stand beyond
 * the rim against the sky, and braziers burn in the passage. A pale light moves among the seats; dust drifts across the stage. The fog is held low so the tiers show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';

const STONE: Put = { tint: [0.74, 0.7, 0.8], keep: 0.5 };
const GHOST: Put = { tint: [0.72, 0.74, 0.9], keep: 0.3 };
const CLOTH: Put = { tint: [0.9, 0.76, 0.34], keep: 0.75 }; // the curtains, weathered yellow
const RAD = Math.PI / 180;
const [MID, WALL] = [40.3, 52]; // the wedge's middle, and the apothem of the wall of chords behind its outer face (the face stands 51.07 m out)
const CORNER = WALL / Math.cos(10 * RAD); // a chord's corner, 10 degrees either side of a wedge's axis
const TIER = (r: number): number => 3.9 - 0.36 * (MID - r); // the height of the tiers at a radius (a little under their treads)

export const hastur: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const polar = (rad: number, deg: number): [number, number] => [Math.cos(deg * RAD) * rad, Math.sin(deg * RAD) * rad];

  // the wedges: all but the front's (the way in) and the back's (the stage house); each has its wall of one chord behind its outer face
  const wedges: number[] = [];
  for (let i = 2; i < 17; i++) if (i !== 9) wedges.push(i * 20); // (the front's three are left out: the way in is a fan, opening as it goes in, and the stake and candle stand clear in it)
  for (const deg of wedges) {
    c.add('hs_cavea', ...polar(MID, deg), { ...STONE, face: 'in' });
    c.run('tp_wall_mid', polar(CORNER, deg - 10), polar(CORNER, deg + 10), { ...STONE, stretch: [1, 3.8, 4], height: 9 });
  }

  // the passage's mouth: a wall from each wedge's corner in to the gate, so the way narrows to the door
  for (const side of [-1, 1]) {
    const [a, cc] = polar(CORNER, 30);
    c.run('tp_wall_mid', [G, side * gate], [a, side * cc], { ...STONE, stretch: [1, 3.8, 4], height: 9 });
    c.add('px_brazier', G - 9, side * 4.1, { y: 0, s: 1.6, tint: [0.4, 0.38, 0.46], keep: 0.4, lit: 'torch' });
    c.add('px_brazier', G - 17, side * 4.9, { y: 0, s: 1.6, tint: [0.4, 0.38, 0.46], keep: 0.4, lit: 'torch' });
    c.add(side > 0 ? 'tp_flag_eclipse' : 'tp_flag_moon', G - 1.4, side * (gate + 0.7), { y: 3.2, face: 'front', turn: 180, stretch: [1, 1.6, 1], s: 1.8, walk: true });
  }

  // lamps along the fan's edge, on posts
  for (const side of [-1, 1]) for (const [a, cc] of [[G + 1.8, gate + 1.6], [G - 21, 9.5]] as const) c.add('lightpost', a, side * cc, { lit: 'lamp', tint: [0.7, 0.68, 0.8], keep: 0.4 });

  // the stage house: the back's chord closing the gap (taller than the rest), a raised floor in two widths, the proscenium arch with masks along its crown, the theatre's tall columns
  // either side, and behind the arch a row of its middle columns with the curtains hung yellow between them against the wall
  const sw = WALL * Math.tan(10 * RAD) + 0.2;
  c.run('tp_wall_mid', [-WALL, -sw], [-WALL, sw], { ...STONE, stretch: [1, 5.6, 4], height: 13.4 });
  c.add('tp_floor', -38, 0, { ...STONE, face: 'front', y: -0.25, stretch: [13.2 / 2.4, 1, 8 / 2.4] });
  c.add('tp_floor', -47, 0, { ...STONE, face: 'front', y: -0.25, stretch: [17.6 / 2.4, 1, 10 / 2.4] });
  c.add('tp_arch', -41, 0, { ...STONE, face: 'front', s: 4.2 });
  for (const side of [-1, 1]) {
    c.add('tp_flag_eclipse', -37.6, side * 5.3, { ...GHOST, face: 'front', stretch: [3, 3.4, 1], y: 2.4, walk: true });
    c.add('hs_col_tall', -44.8, side * 6.9, { ...STONE });
    c.add('px_brazier', -35.6, side * 5.7, { y: 0, s: 1.4, tint: [0.4, 0.38, 0.46], keep: 0.4, lit: 'torch' });
  }
  for (const cc of [-5.4, -1.8, 1.8, 5.4]) c.add('hs_col_mid', -49.4, cc, { ...STONE });
  for (const [i, cc] of [-3.6, 0, 3.6].entries()) c.add('hs_curtain', -50.6, cc, { ...CLOTH, face: 'front', stretch: [0.22, 0.9 + (i % 2) * 0.1, 1], y: 0.4, walk: true });
  for (const [i, cc] of [-5.4, -2.7, 0, 2.7, 5.4].entries()) c.add('px_mask', -41, cc, { y: 13.6, s: 2.2 + (i % 2) * 0.5, face: 'front', tint: [0.9, 0.86, 0.72], keep: 0.8, walk: true });

  // the audience: on the tiers, a few in each wedge, seated in the colour of the dust, turned to the floor
  let n = 0;
  for (const [i, deg] of wedges.entries()) {
    if (i % 3 === 2) continue;
    for (const r of i % 2 ? [34, 42] : [37.5, 46]) {
      const [a, cc] = polar(r, deg + ((n++ * 7) % 9) - 4);
      c.add('fg_seat', a, cc, { ...GHOST, y: TIER(r), face: 'in', s: 1.1, walk: true });
    }
  }
  // the towers of the city, beyond the rim
  for (const deg of [58, 128, 232, 302]) {
    const [a, cc] = polar(CORNER + 11, deg);
    c.add('tp_tower_bot', a, cc, { ...STONE, face: 'in', s: 2.2 });
    c.add('tp_tower_top', a, cc, { ...STONE, face: 'in', s: 2.4, y: 16.9 });
  }

  // what moves: a pale light among the seats, dust on the stage, the braziers' sparks, and eyes opening in the rows (the audience that is not there)
  c.emit({ at: [0, 0], y: [5, 10], r: MID, rate: 3.2, life: [4, 7], size: [0.14, 0.26], colour: [0.85, 0.8, 1], alpha: 0.7, rise: 0.2, drift: 0.4, shape: 'spark', glow: true, reach: 120 });
  c.emit({ at: [0, 0], y: [0.2, 2.2], r: c.R, rate: 3.4, life: [5, 8], size: [2, 3.6], grow: 1.4, colour: [0.74, 0.7, 0.62], alpha: 0.12, drift: 0.3, flow: { x: 0.5, z: 0.5 }, shape: 'wisp', reach: 110 });
  for (const deg of [50, 100, 140, 220, 260, 310]) {
    const at = polar(40, deg);
    c.emit({ at, y: [2.6, 6.4], r: 7, rate: 0.9, life: [3, 5.5], size: [0.26, 0.42], colour: [1, 0.86, 0.38], end: [0.9, 0.6, 0.2], alpha: 0.6, rise: 0.05, drift: 0.12, shape: 'eye', glow: true, reach: 110 });
    c.emit({ at, y: [2.2, 5.2], r: 8, rate: 1.4, life: [4, 7], size: [1.6, 2.6], grow: 1.2, colour: [0.82, 0.72, 0.38], alpha: 0.1, rise: 0.25, drift: 0.2, shape: 'wisp', reach: 100 });
  }
  for (const side of [-1, 1]) c.emit({ at: [G - 13, side * 4.5], y: [1.4, 4], r: 4, rate: 2.2, life: [2.4, 4], size: [0.1, 0.16], colour: [1, 0.7, 0.4], alpha: 0.8, rise: 0.7, drift: 0.3, shape: 'spark', glow: true, reach: 90 });
  const outline: [number, number][] = [[G, 0], ...Array.from({ length: 16 }, (_, k) => polar(CORNER, 30 + k * 20))]; // (the passage's walls run from the gate to the corners at 30 degrees either side)
  return { outline, ahead: G, outer: 14, fogHeight: 4 };
};
