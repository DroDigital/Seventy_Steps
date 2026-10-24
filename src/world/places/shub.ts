/**
 * The black grove of Shub-Niggurath (round 71; trunks, roots and pods grown in code, the packs' dead and living trees for the wood beyond; docs/BOSS_PLACES.md):
 * a wall of trunks that have grown into one another, ten metres of them in a ring that bulges and gathers in lobes, closed but for the way in, which is
 * broad: the grove opens to it between two great trees and under three arches of root, each wider than the last. Pods hang inside the wall, split along a
 * seam, and glow where the grove's mind is; more roots cross the ground between the wall and the fight, none in it. The trees of the wood stand beyond, over
 * the wall, so the grove is seen from within as a shut room of boughs. Spores lift from the ground in six places. The fog is held low so the wall
 * shows over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, polar, wallAbout } from './common';

const BARK: Put = { tint: [0.42, 0.3, 0.3], keep: 0.5 };
const WOOD: Put = { tint: [0.3, 0.24, 0.26], keep: 0.35 };

export const shub: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const near = (th: number): number => Math.cos(bearing(th) / 2) ** 6; // 1 at the front, falling away to the sides
  const r = (th: number): number => G - 9.5 + 9.5 * near(th) + 3.2 * Math.sin(7 * th) * (1 - near(th)); // the wall's middle line: lobes, and the front's flat
  const pts = polar(r, 36);
  const gate = h.gate.width / 2 + 0.9;
  const at = (th: number, d: number): [number, number] => [Math.cos(th) * (r(th) + d), Math.sin(th) * (r(th) + d)];

  wallAbout(c, 'px_hedge', pts, gate, { ...BARK, height: 10, lap: 0.4 });

  // the wood beyond, standing over the wall: dead trees and living, the biggest of them either side of the way in
  const wood = ['st_dead_6', 'st_maple_3', 'st_dead_10', 'st_dead_8'] as const;
  for (let i = 0; i < 26; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 26;
    if (bearing(th) < 0.3) continue;
    const [a, cc] = at(th, 4.6 + (i % 3) * 1.6);
    c.add(wood[i % 4]!, a, cc, { ...WOOD, face: 'front', turn: i * 37, s: 2.0 + (i % 3) * 0.25, jitter: 1.2 });
  }
  for (const side of [-1, 1]) {
    c.add('st_maple_3', G + 4, side * 14.5, { ...WOOD, face: 'front', turn: side * 20, s: 2.5, jitter: 0.4 });
    c.add('st_dead_8', G + 14, side * 21, { ...WOOD, face: 'front', turn: -side * 35, s: 2.2, jitter: 0.6 });
    c.add('st_dead_10', G + 17.4, side * 12, { ...WOOD, face: 'front', turn: side * 60, s: 1.8, jitter: 0.6 });
  }

  // the way in: three arches of root over the approach, each wider than the last, and a pod hung on every other post of them
  for (const [i, a] of [G - 1, G + 6.5, G + 14].entries()) c.add('px_root', a, 0, { ...BARK, face: 'front', s: 1.65 + i * 0.35, jitter: 0.2, walk: true });
  for (const [a, side] of [[G + 2, 1], [G + 10, -1], [G + 17, 1]] as const) c.add('px_pod', a, side * (7.4 + a * 0.05), { tint: [0.8, 0.42, 0.55], keep: 0.5, s: 1.9, jitter: 0.3 });

  // pods hung inside the wall, in the colour of what is in them; roots across the ground between it and the fight
  for (let i = 0; i < 17; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 17;
    if (bearing(th) < 0.4) continue;
    const [a, cc] = at(th, -2.7 - (i % 2) * 0.8);
    c.add('px_pod', a, cc, { tint: [0.82, 0.4, 0.6], keep: 0.55, s: 1.5 + (i % 3) * 0.35, face: 'in', jitter: 0.3 });
  }
  for (let i = 0; i < 15; i++) {
    const th = ((i + 0.2) * 2 * Math.PI) / 15 + 0.2;
    if (bearing(th) < 0.5) continue;
    const [a, cc] = at(th, -5.2 - (i % 3) * 0.9);
    c.add('px_root', a, cc, { ...BARK, face: 'in', turn: 90 + (i % 2 ? 22 : -22), s: 0.62 + (i % 3) * 0.12, stretch: [1, 0.8, 1], walk: true });
  }

  // what the grove breathes out: spores on the air in six places, a red haze under the pods
  for (let i = 0; i < 6; i++) {
    const [a, cc] = at(((i + 0.5) * 2 * Math.PI) / 6, -4);
    if (bearing(((i + 0.5) * 2 * Math.PI) / 6) < 0.5) continue;
    c.emit({ at: [a, cc], y: [0.4, 4.4], r: 4.4, rate: 3, life: [4, 7], size: [0.1, 0.18], colour: [0.95, 0.4, 0.6], alpha: 0.8, rise: 0.25, drift: 0.4, shape: 'spark', glow: true, reach: 110 });
    c.emit({ at: [a, cc], y: [0.2, 1.4], r: 5, rate: 1.4, life: [5, 8], size: [2, 3.4], grow: 1.5, colour: [0.5, 0.22, 0.3], alpha: 0.16, rise: 0.12, drift: 0.2, shape: 'wisp', reach: 110 });
  }
  return { outline: pts, ahead: G, outer: 13, fogHeight: 3.6 };
};
