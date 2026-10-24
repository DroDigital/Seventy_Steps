/**
 * The forecourt of the Great Door in R'lyeh (round 71; pack 08's doorway cut huge, leaning slabs, bollards, anchors and a hull made in code, docs/BOSS_PLACES.md):
 * a court of no regular shape, its eight walls meeting at angles that are not right, each a course of slabs of green-black masonry leaning in over the
 * court, fourteen metres high; standing in the court, more slabs set at no angle in particular. At the back the Great Door: a doorway of the old stone
 * eighteen metres high with one leaf in it, shut, glowing along its seams. Out at the right-hand corner is the lagoon, a still pool of the city's
 * own water with a quay about it: bollards, an anchor, a hull that was left; the sea does not leave R'lyeh. Two black obelisks flank the way in. The
 * fog is held low so the walls show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, wallAbout } from './common';

const SLAB: Put = { tint: [0.4, 0.58, 0.48], keep: 0.55 };
const OOZE: Put = { tint: [0.3, 0.46, 0.38], keep: 0.5 };

export const cthulhu: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  // eight walls, none of them at a right angle to the next; the front's middle is the gate
  const pts: [number, number][] = [[G, 0], [G, 46], [40, 70], [-20, 66], [-62, 40], [-70, -12], [-48, -60], [10, -68], [G, -46]];
  wallAbout(c, 'px_slab', pts, gate, { ...SLAB, s: 2, lap: 0.8 });

  // the gate's two obelisks, and one at each corner the wall turns most
  for (const side of [-1, 1]) c.add('px_obelisk', G + 1, side * (gate + 4.6), { ...SLAB, s: 2.3, face: 'front' });
  for (const [a, cc] of [[40, 70], [-62, 40], [-70, -12], [-48, -60], [10, -68]] as const) c.add('px_obelisk', a, cc, { ...SLAB, s: 1.7, face: 'in', height: 24 });

  // slabs standing in the court at no angle in particular, between the fight and the walls
  for (let i = 0; i < 14; i++) {
    const th = ((i + 0.3) * 2 * Math.PI) / 14 + 0.17;
    if (bearing(th) < 0.5 || bearing(th) > Math.PI - 0.62) continue; // (the gate's way, and the door's, are kept clear)
    const rad = c.R + 8 + (i % 3) * 2.8;
    c.add('px_slab', Math.cos(th) * rad, Math.sin(th) * rad, { ...OOZE, s: 1.1 + (i % 4) * 0.2, face: 'in', turn: (i * 67) % 90 - 45, jitter: 0.8 });
  }

  // the Great Door at the back, one leaf shut in it, plaques of the sun and moon either side of it, a platform before it
  const door = -63.6;
  c.add('tp_floor', door + 6, 0, { ...SLAB, face: 'front', stretch: [16 / 2.4, 3.2, 6 / 2.4], walk: false });
  c.add('tp_doorway', door, 0, { ...SLAB, face: 'in', s: 2.6 });
  c.add('tp_door_leaf', door - 0.3, 0, { ...OOZE, face: 'in', s: 2.6, walk: true });
  for (const side of [-1, 1]) c.add(side > 0 ? 'tp_door_sun' : 'tp_door_moon', door + 1.2, side * 9.4, { ...SLAB, face: 'in', s: 2.4, y: 3 });

  // the lagoon at the right-hand corner: a pool, a quay of bollards about its inner edge, steps into it, an anchor, a hull sunk to its ribs
  const [pa, pc] = [53, 34];
  c.add('tp_floor', pa, pc, { tint: [0.06, 0.2, 0.17], keep: 0.1, face: 'front', stretch: [16 / 2.4, 0.5, 14 / 2.4], y: 0.04, walk: true });
  for (let i = 0; i < 7; i++) c.add('px_bollard', pa - 7.3, pc - 7.5 + i * 2.5, { s: 1.6, tint: [0.3, 0.38, 0.34], keep: 0.5 });
  for (let i = 0; i < 6; i++) c.add('px_bollard', pa - 5.5 + i * 2.2, pc - 8.1, { s: 1.6, tint: [0.3, 0.38, 0.34], keep: 0.5 });
  c.add('tp_stairs', pa - 7.4, pc, { ...OOZE, face: 'front', turn: 180, stretch: [3, 0.25, 0.35], walk: true });
  c.add('px_anchor', pa - 8.4, pc + 4.8, { s: 2.2, face: 'front', turn: 70, tint: [0.3, 0.36, 0.32], keep: 0.5 });
  c.add('px_hull', pa + 1.4, pc + 1.6, { yaw: 0.4, s: 1.5, y: -0.7, tint: [0.3, 0.34, 0.3], keep: 0.5, walk: true });
  for (let i = 0; i < 5; i++) c.add('nt_lily', pa - 4 + (i % 3) * 3.2, pc - 5 + i * 2.6, { y: 0.06, keep: 0.4, tint: [0.2, 0.34, 0.3], jitter: 0.5, s: 1.4, walk: true });

  // what stirs: a green light in the door's seams, bubbles and a mist on the lagoon, spores crossing the court
  c.emit({ at: [door + 1, 0], y: [1, 14], r: 4.4, rate: 4, life: [3, 5], size: [0.16, 0.3], colour: [0.2, 0.95, 0.6], alpha: 0.8, rise: 0.4, drift: 0.4, shape: 'spark', glow: true, reach: 140 });
  c.emit({ at: [door + 2, -8], to: [door + 2, 8], y: [0.2, 3], rate: 2, life: [4, 7], size: [3, 5], grow: 1.5, colour: [0.2, 0.55, 0.4], alpha: 0.14, rise: 0.12, shape: 'wisp', glow: true, reach: 140 });
  c.emit({ at: [pa, pc], y: [0.1, 0.8], r: 6, rate: 3.4, life: [2.4, 4], size: [0.12, 0.22], colour: [0.4, 1, 0.7], alpha: 0.7, rise: 0.3, drift: 0.2, shape: 'bubble', glow: true, reach: 120 });
  c.emit({ at: [pa, pc], y: [0.2, 1.4], r: 6.4, rate: 2, life: [4, 7], size: [2.4, 4], grow: 1.4, colour: [0.28, 0.6, 0.46], alpha: 0.16, rise: 0.15, flow: { x: -0.3, z: 0.2 }, shape: 'wisp', reach: 120 });
  c.emit({ at: [-40, -40], to: [30, -40], y: [0.3, 6], rate: 3, life: [5, 8], size: [0.1, 0.18], colour: [0.3, 1, 0.65], alpha: 0.6, drift: 0.5, flow: { x: 0.8, z: 0.3 }, shape: 'spark', glow: true, reach: 130 });
  return { outline: pts, ahead: G, outer: 12, fogHeight: 5 };
};
