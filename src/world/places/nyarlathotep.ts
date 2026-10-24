/**
 * The hall of the Black Pharaoh (round 73; pack 08's temple stone and pack 13's stone figures, the rods, obelisks and mask made in code, docs/BOSS_PLACES.md): the place where the
 * Crawling Chaos shows what it has seen, in the court at the centre of all. A low black wall rings the fight, columns of basalt standing from it with a fire on each, and a
 * audience of stone figures sits in two ranks inside it, all turned in on the middle, none looking back, as the crowd went in the story. At the back a dais carries
 * the instruments of the show, rods of metal tall as towers with a cold spark running up each; over it a black arch holds a mask with no face to it. Two seated
 * colossi and two obelisks keep the gate. Sparks climb the rods; ash goes by. The fog is held low so the columns show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, column, polar, wallAbout } from './common';

const BASALT: Put = { tint: [0.17, 0.16, 0.2], keep: 0.3 };
const GILT: Put = { tint: [0.78, 0.62, 0.3], keep: 0.4 };
const SHADOW: Put = { tint: [0.3, 0.28, 0.36], keep: 0.3 };

export const nyarlathotep: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const near = (th: number): number => Math.cos(bearing(th) / 2) ** 10;
  const r = (th: number): number => G - 3 + 3 * near(th); // the wall comes out to the gate at the front
  const pts = polar(r, 44);
  wallAbout(c, 'tp_wall_mid', pts, gate, { ...BASALT, stretch: [1, 2.2, 6], height: 5, lap: 0.4 });

  // twelve columns of basalt stood from the wall, a fire on each; the two either side of the gate stand taller
  for (let i = 0; i < 12; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 12;
    const near = Math.abs(Math.atan2(Math.sin(th), Math.cos(th))) < 0.35;
    const [a, cc] = [Math.cos(th) * (r(th) - 1.6), Math.sin(th) * (r(th) - 1.6)];
    const top = column(c, a, cc, near ? 4 : 3, { ...BASALT, s: 1.5 });
    c.add('px_brazier', a, cc, { ...GILT, s: 1.6, y: top, lit: 'torch', walk: true });
  }

  // the audience: seated stone figures in two ranks inside the wall, all facing the middle, none of them at the gate's way
  const run = (rad: number, n: number, from: number, to: number, s: number): void => {
    for (let i = 0; i < n; i++) {
      const th = from + ((to - from) * (i + 0.5)) / n;
      const [a, cc] = [Math.cos(th) * rad, Math.sin(th) * rad];
      const k = (i * 5) % 7;
      c.add('fg_seat', a, cc, { ...SHADOW, s: s + (k % 3) * 0.1, face: 'in', walk: true });
    }
  };
  run(G - 8.2, 20, 0.5, 2 * Math.PI - 0.5 - 1.3, 1.1);
  run(G - 11.6, 14, 0.7, 2 * Math.PI - 0.7 - 1.6, 1.0);

  // the dais: the instruments of the show, a black arch over a mask with no face
  const back = -(c.R + 5);
  c.add('tp_floor', back, 0, { ...BASALT, face: 'front', stretch: [11, 1.6, 4.2], walk: true });
  c.add('tp_arch', back - 4.2, 0, { ...BASALT, face: 'front', s: 4.4, y: 0.6 });
  c.add('px_mask', back - 4.2, 0, { tint: [0.14, 0.12, 0.2], keep: 0.5, s: 2.8, y: 15.8, face: 'front', walk: true });
  for (const [i, cc] of [-12, -8, 8, 12].entries()) c.add('px_rod', back + 1.5, cc, { tint: [0.62, 0.64, 0.74], keep: 0.5, s: 1, y: 0.6, height: 13 + (i % 2) * 3 });
  for (const cc of [-5.2, 5.2]) c.add('px_brazier', back - 1.6, cc, { ...GILT, s: 2, y: 0.6, lit: 'torch', walk: true });

  // the gate: seated colossi that watch the way, obelisks beyond them
  for (const side of [-1, 1]) {
    c.add('fg_seat', G + 0.4, side * (gate + 3.4), { ...BASALT, s: 3.4, face: 'front' });
    c.add('px_obelisk', G + 6, side * (gate + 7.5), { ...BASALT, s: 1.3, face: 'front' });
  }

  // sparks up the rods; ash across the floor; a small cold light at the gate
  for (const cc of [-12, -8, 8, 12]) c.emit({ at: [back + 1.5, cc], y: [1, 14], r: 0.6, rate: 5, life: [1.2, 2.4], size: [0.1, 0.2], colour: [0.78, 0.78, 1], alpha: 0.9, rise: 7, drift: 0.2, shape: 'spark', glow: true, reach: 140 });
  c.emit({ at: [0, 0], y: [0.3, 5], r: c.R + 6, rate: 5, life: [5, 9], size: [0.12, 0.22], colour: [0.5, 0.46, 0.58], alpha: 0.5, rise: -0.3, drift: 0.6, flow: { x: 0.5, z: 0.2 }, shape: 'spark', reach: 140 });
  c.emit({ at: [G - 3, 0], y: [0.6, 4], r: 3, rate: 1.6, life: [3, 5], size: [0.16, 0.3], colour: [0.8, 0.7, 1], alpha: 0.7, rise: 0.4, drift: 0.4, shape: 'rune', glow: true, spin: 0.5, reach: 110 });
  return { outline: pts, ahead: G, outer: 12, fogHeight: 4 };
};
