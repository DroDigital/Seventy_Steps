/**
 * Simon Orne's burying ground (round 71; packs 05 and 06, the PSX graveyard and castle; docs/BOSS_PLACES.md): a cemetery of the Salem kind,
 * low-walled in rough stone with an iron rail along its top, a gate between two piers each lit with a lantern, a paved way from the gate to the
 * green, burial lots set about it in rows behind iron rails, a rotunda chapel at the back with its two thin towers, an open grave with its coffin
 * beside it (Orne's work: what is dug up is not what was put down), a crypt, and bare trees standing over the wall. The fight is on the open green
 * in the middle; nothing solid stands in it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court } from '../placeKit';
import { rectOutline, wallRect } from './common';

const WALL = 2.4; // metres: low, as a burying ground's is, and more than a body climbs

/** A lot: a plot of ground fenced by a low rail, its stones facing the way in, at (a, c) in the court's frame. */
function lot(c: Court, a: number, cc: number, kind: number): void {
  const [w, d] = [6.4, 7.4]; // across (along a) and deep (along c)
  const face = cc > 0 ? 'right' : 'left';
  const rail = { s: 1.0, height: 0.95, face } as const;
  for (const side of [-1, 1]) {
    c.run('gy_rail', [a - w / 2, cc + side * (d / 2)], [a + w / 2, cc + side * (d / 2)], { ...rail, face: 'front' });
  }
  c.run('gy_rail', [a - w / 2, cc - d / 2], [a - w / 2, cc + d / 2], { ...rail, face: 'front' });
  const stones = ['gy_stone_1', 'grave_round', 'gy_stone_4', 'cross', 'gy_stone_7', 'grave_broken'] as const;
  for (let i = 0; i < 2; i++) {
    const id = stones[(kind * 2 + i + (kind % 2)) % 6]!;
    c.add(id, a - 1.5 + i * 3.2, cc + (cc > 0 ? -1 : 1) * 2.2, { face: cc > 0 ? 'left' : 'right', jitter: 0.25 });
  }
  if (kind % 3 === 0) c.add('gy_grave', a + 1, cc + (cc > 0 ? 1.1 : -1.1), { yaw: c.yawAt(c.put(a, cc), 'front'), walk: true });
}

export const orne: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach); // the gate
  const [S, B] = [c.R + 16, c.R + 16];
  const pier = h.gate.width / 2 - HOUSE.lap + 0.65; // a pier's middle: it laps the gate's seal
  wallRect(c, 'gy_wall', G, S, B, pier + 0.6, { stretch: [1, 1, 1.8], height: WALL });
  for (const side of [-1, 1]) {
    c.add('gy_pillar', G, side * pier, { stretch: [4.3, 1, 2.7], height: 5, face: 'front' });
    c.add('lantern', G, side * pier, { y: 5, s: 2.2, lit: 'lamp', round: true });
  }
  // the pillars along the wall, and at its corners
  for (const [a, cc] of [[G, S], [G, -S], [-B, S], [-B, -S]] as const) c.add('gy_pillar', a, cc, { stretch: [4.3, 1, 2.7], height: 4.2, face: 'front' });
  for (let t = -S + 12; t < S - 1; t += 12) {
    c.add('gy_pillar', t, S, { stretch: [3, 1, 2], height: 3.2, face: 'front' });
    c.add('gy_pillar', t, -S, { stretch: [3, 1, 2], height: 3.2, face: 'front' });
  }
  // the chapel behind, and its towers
  c.add('cs_temple', -B + 5, 0, { s: 1.5 });
  for (const side of [-1, 1]) c.add('cs_temple_tower', -B + 4, side * 12, { s: 1.1 });
  // the paved way
  for (let a = G - 2; a > c.R + 4; a -= 4) c.add('gy_flag', a, 0, { walk: true, face: 'front', y: 0.04, s: 0.9 });
  // lots, in ranks down either side and across the front corners
  let k = 0;
  for (const side of [-1, 1]) {
    for (let a = -S + 10; a <= S - 10; a += 8) {
      if (Math.hypot(a, side * (c.R + 9)) < c.R + 7) continue;
      lot(c, a, side * (c.R + 9), k++);
    }
  }
  // a little crypt of the old family in the far corner, and the open grave's own plot fenced in iron, its gate toward the way
  c.add('crypt_small', -B + 9, -S + 9, { s: 1.5, face: 'in' });
  const [f0, f1, g0, g1] = [-B + 9.6, -B + 19.6, 9, 23];
  c.run('iron_fence', [f0, g0], [f0, g1], { s: 1.2, face: 'front' });
  c.run('iron_fence', [f1, g0], [f1, g1], { s: 1.2, face: 'front' });
  c.run('iron_fence', [f0, g1], [f1, g1], { s: 1.2, face: 'front' });
  c.run('iron_fence', [f0, g0], [f1 - 4.4, g0], { s: 1.2, face: 'front' });
  c.add('iron_gate', f1 - 2.2, g0, { s: 1.4, face: 'front', turn: 90, walk: true }); // (the gate stands open in its gap: a body walks through, never shut in)
  // the open grave and what was in it, by the chapel
  c.add('gy_grave', -B + 14, 14, { yaw: 0.4, walk: true });
  c.add('gy_coffin', -B + 14.4, 14.2, { yaw: 0.4 + 0.15, walk: true, y: 0.05 });
  c.add('gy_coffin_lid', -B + 12.4, 17, { yaw: 1.2, walk: true });
  // trees over the wall
  for (const [a, cc, id, hgt] of [[G - 6, S - 5, 'gy_tree_2', 8], [G - 4, -S + 6, 'gy_tree_1', 6.5], [-B + 6, S - 5, 'gy_tree_1', 7.5], [-B + 5, -S + 6, 'gy_tree_2', 8.5], [0, S - 3, 'gy_tree_2', 7], [6, -S + 3, 'gy_tree_1', 6]] as const) {
    c.add(id, a, cc, { height: hgt, round: true, yaw: a * 3 });
  }
  // what rises from it: a low mist lying along the lots, and over the open grave a thin violet wisp, as of something let go
  for (const side of [-1, 1]) c.emit({ at: [-S + 14, side * (c.R + 9)], to: [S - 14, side * (c.R + 9)], y: [0.1, 0.7], rate: 2.2, life: [6, 9], size: [2.2, 3.6], grow: 1.5, colour: [0.46, 0.5, 0.52], alpha: 0.2, drift: 0.12, flow: { x: 0.08, z: 0 }, shape: 'wisp', reach: 60 });
  c.emit({ at: [-B + 14, 14], r: 0.7, y: [0.2, 0.6], rate: 1.4, life: [3, 4.5], size: [0.5, 0.9], grow: 1.8, colour: [0.52, 0.4, 0.7], end: [0.3, 0.28, 0.4], alpha: 0.32, rise: 0.5, drift: 0.2, shape: 'wisp', glow: true, reach: 50 });
  c.emit({ at: [-B + 8, -S + 8], to: [G - 8, -S + 8], y: [0.3, 1.8], rate: 1.6, life: [3, 5], size: [0.08, 0.14], colour: [0.6, 0.55, 0.9], alpha: 0.7, drift: 0.4, rise: 0.1, shape: 'spark', glow: true, reach: 70 }); // and cold lights low over the graves, as of what the earth has not quite kept
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 3.4 };
};
