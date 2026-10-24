/**
 * The theatre of Carcosa (round 71; pack 10's colosseum cut into wedges, pack 08's arch, flags and towers, a mask made in code, docs/BOSS_PLACES.md): the fight is
 * the stage. Sixteen wedges of the old amphitheatre stand about it, their tiers rising away from the floor, an arcade behind each; one is left out at the front,
 * where the way in runs between the tiers, a passage that opens as it goes in; one at the back, where a stage house closes the ring: a raised floor, a proscenium
 * arch with masks along its crown and curtains hung torn either side. On the tiers a restrained audience sits, pale and still, turned to the floor. Towers
 * stand beyond the rim against the sky, and braziers burn in the passage. A pale light moves among the seats; dust drifts across the stage. The fog is held low so
 * the tiers show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';

const STONE: Put = { tint: [0.74, 0.7, 0.8], keep: 0.5 };
const GHOST: Put = { tint: [0.72, 0.74, 0.9], keep: 0.3 };
const RAD = Math.PI / 180;
const [RI, RO, SCALE] = [30, 47.3, 2.8]; // the tiers' inner and outer radii, and the wedge's scale

export const hastur: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const mid = (RI + RO) / 2;
  const polar = (rad: number, deg: number): [number, number] => [Math.cos(deg * RAD) * rad, Math.sin(deg * RAD) * rad];

  // the wedges: all but the front's (the way in) and the back's (the stage house)
  const wedges: number[] = [];
  for (let i = 2; i < 17; i++) if (i !== 9) wedges.push(i * 20); // (the front's three are left out: the way in is a fan, opening as it goes in, and the stake and candle stand clear in it)
  for (const deg of wedges) c.add('co_seg', ...polar(mid, deg), { ...STONE, s: SCALE, face: 'in' });

  // the passage's mouth: a wall from each wedge's corner in to the gate, so the way narrows to the door
  for (const side of [-1, 1]) {
    const [a, cc] = polar(46.5, 30);
    c.run('tp_wall_mid', [G, side * gate], [a, side * cc], { ...STONE, stretch: [1, 3.8, 4], height: 9 });
    c.add('px_brazier', G - 9, side * 4.1, { y: 0, s: 1.6, tint: [0.4, 0.38, 0.46], keep: 0.4, lit: 'torch' });
    c.add('px_brazier', G - 17, side * 4.9, { y: 0, s: 1.6, tint: [0.4, 0.38, 0.46], keep: 0.4, lit: 'torch' });
    c.add(side > 0 ? 'tp_flag_eclipse' : 'tp_flag_moon', G - 1.4, side * (gate + 0.7), { y: 3.2, face: 'front', turn: 180, stretch: [1, 1.6, 1], s: 1.8, walk: true });
  }

  // lamps along the fan's edge, on posts
  for (const side of [-1, 1]) for (const [a, cc] of [[G + 1.8, gate + 1.6], [G - 21, 9.5]] as const) c.add('lightpost', a, side * cc, { lit: 'lamp', tint: [0.7, 0.68, 0.8], keep: 0.4 });

  // the stage house: a wall across the back's gap, a raised floor, the proscenium arch with curtains either side and masks along its crown
  const back = 46.2;
  const [sa, sw] = [38, 8.2];
  c.run('tp_wall_mid', [-back, -sw - 0.3], [-back, sw + 0.3], { ...STONE, stretch: [1, 4, 4], height: 9.6 });
  c.add('tp_floor', -(RI + 6.5), 0, { ...STONE, face: 'front', stretch: [(sw * 2) / 2.4, 2.1, 12 / 2.4] });
  c.add('tp_arch', -sa, 0, { ...STONE, face: 'front', s: 4.2, y: 1 });
  for (const side of [-1, 1]) {
    c.add('tp_flag_eclipse', -sa + 3.4, side * 5.3, { ...GHOST, face: 'front', stretch: [3, 3.4, 1], y: 2.4, walk: true });
    c.add('tp_flag_stars', -sa + 3.4, side * 7.6, { ...GHOST, face: 'front', stretch: [2.2, 1.5, 1], y: 8.8, walk: true });
    c.add('px_obelisk_s', -sa - 3, side * 9.2, { ...STONE, s: 1.4 });
  }
  for (const [i, cc] of [-5.4, -2.7, 0, 2.7, 5.4].entries()) c.add('px_mask', -sa, cc, { y: 13.6, s: 2.2 + (i % 2) * 0.5, face: 'front', tint: [0.9, 0.86, 0.72], keep: 0.8, walk: true });

  // the audience: on the tiers, a few in each wedge, seated in the colour of the dust, turned to the floor; the tier rises as 0.37 of its depth from 6.3 m
  let n = 0;
  for (const [i, deg] of wedges.entries()) {
    if (i % 3 === 2) continue;
    for (const u of i % 2 ? [3.8, 8.4] : [6, 11]) {
      const [a, cc] = polar(RI + u, deg + ((n++ * 7) % 9) - 4);
      c.add('fg_seat', a, cc, { ...GHOST, y: 6.3 + 0.366 * u - 0.05, face: 'in', s: 1.1, walk: true });
    }
  }
  // the towers of the city, beyond the rim
  for (const deg of [58, 128, 232, 302]) {
    const [a, cc] = polar(60, deg);
    c.add('tp_tower_bot', a, cc, { ...STONE, face: 'in', s: 2.2 });
    c.add('tp_tower_top', a, cc, { ...STONE, face: 'in', s: 2.4, y: 16.9 });
  }

  // what moves: a pale light among the seats, dust on the stage, the braziers' sparks
  c.emit({ at: [0, 0], y: [6, 11], r: RI + 8, rate: 3.2, life: [4, 7], size: [0.14, 0.26], colour: [0.85, 0.8, 1], alpha: 0.7, rise: 0.2, drift: 0.4, shape: 'spark', glow: true, reach: 120 });
  c.emit({ at: [0, 0], y: [0.2, 2.2], r: c.R, rate: 3.4, life: [5, 8], size: [2, 3.6], grow: 1.4, colour: [0.74, 0.7, 0.62], alpha: 0.12, drift: 0.3, flow: { x: 0.5, z: 0.5 }, shape: 'wisp', reach: 110 });
  for (const side of [-1, 1]) c.emit({ at: [G - 13, side * 4.5], y: [1.4, 4], r: 4, rate: 2.2, life: [2.4, 4], size: [0.1, 0.16], colour: [1, 0.7, 0.4], alpha: 0.8, rise: 0.7, drift: 0.3, shape: 'spark', glow: true, reach: 90 });
  const outline: [number, number][] = [[G, 0], ...Array.from({ length: 18 }, (_, k) => polar(RO - 0.8, 10 + k * 20))];
  return { outline, ahead: G, outer: 14, fogHeight: 4 };
};
