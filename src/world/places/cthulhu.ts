/**
 * The forecourt of the Great Door in R'lyeh (round 71; pack 08's doorway cut huge, leaning slabs, bollards, anchors and a hull made in code, docs/BOSS_PLACES.md):
 * a court of no regular shape, its eight walls meeting at angles that are not right, each a course of slabs of green-black masonry leaning in over the
 * court, fourteen metres high; standing in the court, more slabs set at no angle in particular. At the back the Great Door: a doorway of the old stone
 * eighteen metres high with one leaf in it, shut, glowing along its seams; round 75: it stands on a platform raised a man's height above the court, which a flight of broad steps climbs. Out at the right-hand corner is the lagoon,
 * a still pool of the city's own water sunk in the stone, black-green and glowing a little, with a quay of bollards about it: steps going down into it, an anchor, a hull sunk to its ribs in the shallows with lilies on the water;
 * the sea does not leave R'lyeh. Two black obelisks flank the way in. The fog is held low so the walls show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, wallAbout } from './common';
import { bed, shaped, SURFACE, type PoolSpec, type TerraceSpec } from './water';

const SLAB: Put = { tint: [0.4, 0.58, 0.48], keep: 0.55 };
const OOZE: Put = { tint: [0.3, 0.46, 0.38], keep: 0.5 };

// the lagoon at the right-hand corner: an irregular pool about (51, 33), sunk 1.2 m (its bank is clear of the wall, the fight's fog and the stake), and the platform of the Great Door
const [PA, PC, UP] = [51, 33, 1.4];
const radius = (t: number): number => 8 + 1.1 * Math.sin(3 * t) + 0.7 * Math.cos(5 * t + 1);
const LAGOON: PoolSpec = {
  pts: Array.from({ length: 12 }, (_, k) => [PA + Math.cos((k / 12) * 2 * Math.PI) * radius((k / 12) * 2 * Math.PI), PC + Math.sin((k / 12) * 2 * Math.PI) * radius((k / 12) * 2 * Math.PI)] as [number, number]),
  depth: 1.2, bank: 2.6, tint: [0.06, 0.2, 0.17], foam: [0.5, 0.72, 0.62], flow: [-0.15, 0.1], glow: 0.4,
};
const DOOR_FLOOR: TerraceSpec = { pts: [[-66.2, -14], [-66.2, 14], [-53.5, 14], [-53.5, -14]], rise: UP, blend: 2.4 };

export const cthulhu: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const ground = shaped(c, [LAGOON], [DOOR_FLOOR]);
  const [bedY, surfY] = [bed(LAGOON), -LAGOON.depth * SURFACE];
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

  // the Great Door at the back on its raised platform, one leaf shut in it, plaques of the sun and moon either side of it, broad steps up to it from the court
  const door = -63.6;
  c.add('tp_doorway', door, 0, { ...SLAB, face: 'in', s: 2.6, y: UP });
  c.add('tp_door_leaf', door - 0.3, 0, { ...OOZE, face: 'in', s: 2.6, walk: true, y: UP });
  for (const side of [-1, 1]) c.add(side > 0 ? 'tp_door_sun' : 'tp_door_moon', door + 1.2, side * 9.4, { ...SLAB, face: 'in', s: 2.4, y: 3 + UP });
  c.add('tp_stairs', -53.4 + 1.7, 0, { ...SLAB, face: 'front', turn: 180, stretch: [4, UP / 2.76, 0.7], walk: true });
  for (const side of [-1, 1]) c.add('px_obelisk', -54.6, side * 12.2, { ...SLAB, s: 1.2, face: 'in', height: 14, y: UP });

  // the lagoon: a quay of bollards about its bank, steps going down into it on the court's side, an anchor, a hull sunk to its ribs, lilies on the water
  for (let k = 0; k < 12; k++) {
    if (k === 0 || (k >= 5 && k <= 7)) continue; // (the wall's side, and the steps')
    const t = (k / 12) * 2 * Math.PI;
    c.add('px_bollard', PA + Math.cos(t) * (radius(t) + 3.6), PC + Math.sin(t) * (radius(t) + 3.6), { s: 1.6, tint: [0.3, 0.38, 0.34], keep: 0.5 });
  }
  c.add('tp_stairs', PA - radius(Math.PI) - 1.2, PC, { ...OOZE, face: 'front', turn: 180, stretch: [3, 0.3, 0.55], walk: true, y: -0.5 });
  c.add('px_anchor', PA - 12, PC + 5, { s: 2.2, face: 'front', turn: 70, tint: [0.3, 0.36, 0.32], keep: 0.5 });
  c.add('px_hull', PA + 1.4, PC + 1.6, { yaw: 0.4, s: 1.5, y: bedY + 0.1, tint: [0.3, 0.34, 0.3], keep: 0.5, walk: true });
  for (let i = 0; i < 5; i++) c.add('nt_lily', PA - 4 + (i % 3) * 3.2, PC - 5 + i * 2.6, { y: surfY + 0.05, keep: 0.4, tint: [0.2, 0.34, 0.3], jitter: 0.5, s: 1.4, walk: true });

  // what stirs: a green light in the door's seams, bubbles and a mist on the lagoon, spores crossing the court
  c.emit({ at: [door + 1, 0], y: [1, 14], r: 4.4, rate: 4, life: [3, 5], size: [0.16, 0.3], colour: [0.2, 0.95, 0.6], alpha: 0.8, rise: 0.4, drift: 0.4, shape: 'spark', glow: true, reach: 140 });
  c.emit({ at: [door + 2, -8], to: [door + 2, 8], y: [0.2, 3], rate: 2, life: [4, 7], size: [3, 5], grow: 1.5, colour: [0.2, 0.55, 0.4], alpha: 0.14, rise: 0.12, shape: 'wisp', glow: true, reach: 140 });
  c.emit({ at: [PA, PC], y: [surfY, surfY + 0.7], r: 7, rate: 3.4, life: [2.4, 4], size: [0.12, 0.22], colour: [0.4, 1, 0.7], alpha: 0.7, rise: 0.3, drift: 0.2, shape: 'bubble', glow: true, reach: 120 });
  c.emit({ at: [PA, PC], y: [surfY + 0.1, surfY + 1.2], r: 7.4, rate: 2, life: [4, 7], size: [2.4, 4], grow: 1.4, colour: [0.28, 0.6, 0.46], alpha: 0.16, rise: 0.15, flow: { x: -0.3, z: 0.2 }, shape: 'wisp', reach: 120 });
  c.emit({ at: [-40, -40], to: [30, -40], y: [0.3, 6], rate: 3, life: [5, 8], size: [0.1, 0.18], colour: [0.3, 1, 0.65], alpha: 0.6, drift: 0.5, flow: { x: 0.8, z: 0.3 }, shape: 'spark', glow: true, reach: 130 });
  return { outline: pts, ahead: G, outer: 12, fogHeight: 5, ...ground };
};
