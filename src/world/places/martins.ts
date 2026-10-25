/**
 * The landing at Martin's Beach (round 71; pack 04, the retro shacks and gantries, Kenney's canoe, round 72 Poly Haven's pier for the boardwalk, and a hull, a mast, a derrick and an anchor of code:
 * docs/BOSS_PLACES.md): a fishermen's landing walled in concrete against the sea, a raised platform at each corner (a lookout shack on two, a
 * derrick over the water on one, a mast on another), board cabins gone grey along either side, two net sheds at the back corners, a boardwalk and its rail running from the gate
 * to the sand with a lamp on every other post, a canoe, barrels and pallets where the catch was landed. Round 75: the sea comes in at the back, a tidal basin sunk in the sand along the sea wall with
 * the tide setting into it, its water green and breathing a light of its own; a causeway of planks on piles runs out across it to a derrick at its head, and a hull lies stranded on its ribs in the shallows
 * with a rowboat and a canoe afloat beside it (a body may wade it, to the knee). Sea mist lies along the back wall. The fight is on the sand in the middle. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { rectOutline } from './common';
import { bed, shaped, SURFACE, type PoolSpec, type TerraceSpec } from './water';

const CONCRETE: Put = { tint: [0.5, 0.54, 0.52], keep: 0.3 };
const BOARD: Put = { tint: [0.46, 0.42, 0.38], keep: 0.55 };
const SALTED: Put = { tint: [0.42, 0.4, 0.36], keep: 0.4 };

// the sea's tide basin along the back wall (a ahead of the court, c to its left): the bed sunk 1.1 m, its edge 3.4 m from the wall, its far side 4 m beyond the fight's fog; a plank causeway left standing across it
const BASIN: PoolSpec = {
  pts: [[-29.4, -17], [-29, -10], [-29, 10], [-29.4, 17], [-32, 18.8], [-34.2, 17], [-34.6, 8], [-34.6, -8], [-34.2, -17], [-32, -18.8]],
  depth: 1.1, bank: 2.6, tint: [0.16, 0.3, 0.3], foam: [0.72, 0.8, 0.76], flow: [0.45, 0], glow: 0.3,
};
const CAUSEWAY: TerraceSpec = { pts: [[-28.4, -2.8], [-28.4, 2.8], [-34, 2.8], [-34, -2.8]], rise: 0, blend: 0.7 };

export const martins: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [c.R + 16, c.R + 14];
  const gate = h.gate.width / 2 + 0.6;
  const ground = shaped(c, [BASIN], [CAUSEWAY]);
  const [bedY, surfY] = [bed(BASIN), -BASIN.depth * SURFACE];
  const wall: Put = { ...CONCRETE, stretch: [1, 1, 2.4], height: 4.4 };
  const sea: Put = { ...CONCRETE, stretch: [1, 1, 2.4], height: 6.4 };
  c.run('ms_barricade', [G, -gate], [G, -S], wall);
  c.run('ms_barricade', [G, gate], [G, S], wall);
  c.run('ms_barricade', [G, S], [-B, S], wall);
  c.run('ms_barricade', [G, -S], [-B, -S], wall);
  c.run('ms_barricade', [-B, S], [-B, -S], sea);

  // a raised platform at each corner: a lookout on two, the derrick on one, the mast on another
  const corner = (a: number, cc: number): void => { c.add('ms_platform', a, cc, { ...CONCRETE, s: 1.8, face: 'front' }); };
  for (const [a, cc] of [[G - 4.6, S - 4.6], [G - 4.6, -S + 4.6], [-B + 4.6, S - 4.6], [-B + 4.6, -S + 4.6]] as const) corner(a, cc);
  c.add('ms_shack', G - 4.6, S - 4.6, { ...BOARD, y: 3.6, s: 0.62, face: 'in', lit: 'lamp' });
  c.add('ms_shack', -B + 4.6, -S + 4.6, { ...BOARD, y: 3.6, s: 0.62, face: 'in' });
  c.add('px_derrick', -32.6, 0, { s: 1.1, face: 'out', tint: [0.4, 0.34, 0.3], keep: 0.3 }); // at the causeway's head, its jib over the basin
  c.add('px_mast', -B + 4.6, S - 4.6, { y: 3.6, s: 1.3, tint: [0.44, 0.4, 0.36], keep: 0.4 });

  // the cabins along either side, the net shed at the back, the lean-tos where the catch was sorted
  const cabins: readonly (readonly [string, number, number, number])[] = [
    ['ms_shack', -16, 33, 0.95], ['ms_shack', -6, 34.5, 0.9], ['ms_leanto', 10, 33.5, 0.95], ['ms_shack', 24, 34, 1.0],
    ['ms_leanto', -16, -33.5, 0.95], ['ms_shack', -4, -34, 0.9], ['ms_shack', 14, -33.5, 0.95], ['ms_leanto', 27, -34, 0.9],
  ];
  for (const [id, a, cc, s] of cabins) c.add(id, a, cc, { ...BOARD, s, face: 'in', jitter: 0.5 });
  c.add('ms_shed_a', -B + 7.4, -26.2, { ...SALTED, face: 'front' });
  c.add('ms_shed_b', -B + 7.4, 26.2, { ...SALTED, face: 'front' });

  // the boardwalk and its rail, a lamp on every other post
  for (let a = G - 2; a > c.R + 2; a -= 1.9) for (const side of [-1, 1]) c.add('mp_deck', a, side * 1.2, { walk: true, y: 0.1, face: 'front', stretch: [1.1, 1, 1], tint: [0.4, 0.38, 0.36], keep: 0.5 }); // (the pier's planks, from Poly Haven)
  for (let a = G - 6, n = 0; a > c.R + 2; a -= 8, n++) for (const side of [-1, 1]) c.add('mp_frame', a, side * 4.8, { y: -0.6, s: 0.8, face: 'front', turn: n * 70 + (side > 0 ? 35 : 0), walk: true, tint: [0.36, 0.34, 0.32], keep: 0.5 }); // the piles of it, where it was meant to go out over the water
  for (const side of [-1, 1]) {
    c.run('ms_rail', [G - 2, side * 3.1], [c.R + 3, side * 3.1], { y: 1.2, walk: true, face: 'front', tint: [0.44, 0.4, 0.36], keep: 0.4 });
    let n = 0;
    for (let a = G - 2; a >= c.R + 3; a -= 4) {
      c.add('ms_rail_post', a, side * 3.1, { walk: true, face: 'front', tint: [0.44, 0.4, 0.36], keep: 0.4 });
      if (n++ % 2 === 0) { c.add('ms_pole', a, side * 3.4, { s: 1.3, face: 'front', tint: [0.36, 0.33, 0.3], keep: 0.4 }); c.add('lantern', a, side * 3.4, { y: 4.4, s: 1.6, lit: 'lamp', round: true }); }
    }
  }

  // the causeway across the basin: planks on piles to the derrick at its head, a rail either side, piles standing out of the water beside it
  for (let a = -29.2; a > -33.6; a -= 1.9) for (const side of [-1, 1]) c.add('mp_deck', a, side * 1.05, { walk: true, y: 0.1, face: 'front', stretch: [0.95, 1, 1], tint: [0.4, 0.38, 0.36], keep: 0.5 });
  for (const side of [-1, 1]) c.run('ms_rail', [-28.8, side * 2.3], [-33.4, side * 2.3], { y: 1.0, walk: true, face: 'front', tint: [0.44, 0.4, 0.36], keep: 0.4 });
  for (const [a, cc, t] of [[-30.4, -5, 0.2], [-32.6, 6.4, 1.1], [-30, 9.6, 2.3], [-33.2, -11.8, 0.6], [-30.8, 15, 1.7], [-33, 3.6, 2.9]] as const) c.add('mp_frame', a, cc, { y: bedY, s: 0.8, walk: true, turn: t * 57, tint: [0.36, 0.34, 0.32], keep: 0.5 });

  // what the sea left and the men: a hull on its ribs in the shallows with a rowboat and a canoe afloat, an anchor against the sea wall, barrels, pallets, a stack of barricades for a breakwater
  c.add('px_hull', -32.4, -10.8, { yaw: 1.5708 + 0.1, s: 1.2, y: bedY + 0.1, tint: [0.4, 0.34, 0.28], keep: 0.5 });
  c.add('rowboat', -31.6, 13.4, { yaw: 0.35, s: 1.2, y: surfY, ...SALTED });
  c.add('nt_canoe', -32.6, 9.2, { yaw: 1.2, s: 1.2, y: surfY, ...SALTED });
  c.add('nt_canoe', 17, 30.5, { yaw: 0.7, s: 1.2, ...SALTED }); // (one is drawn up on the sand)
  c.add('wreck', -B - 9, -16, { yaw: 1.2, s: 0.6, tint: [0.4, 0.36, 0.3], keep: 0.5 }); // out on the sand beyond the sea wall, what the tide left, seen over it
  for (const side of [-1, 1]) c.add('rocks_sand_b', -B - 3.4, side * (S - 8), { s: 1.5, jitter: 1.2, tint: [0.56, 0.54, 0.48], keep: 0.4 });
  c.add('px_anchor', -B + 1.6, 22.6, { face: 'front', s: 1.5, y: 0 });
  c.add('px_anchor', G - 2.6, S - 12, { face: 'front', s: 1.1, turn: 40 });
  for (const [a, cc] of [[-27, 24.5], [-26, 25.6], [-24.5, 25], [18, -29.6], [19.4, -29]] as const) c.add('ms_barrel', a, cc, { jitter: 0.25, s: 1.1, ...SALTED });
  for (const [a, cc, t] of [[-8, 27.6, 0.4], [-6.6, 27.9, 1.1], [20, 28.4, 2.2]] as const) c.add('ms_pallet', a, cc, { yaw: t, walk: true, ...BOARD });
  for (const [a, cc] of [[G - 12, S - 1.6], [G - 15, S - 1.6]] as const) c.add('ms_barricade', a, cc, { ...CONCRETE, stretch: [1, 1.2, 1.2], face: 'out' });

  // the sea beyond the wall: spray and mist along its foot, and a tide pool breathing a green light
  c.emit({ at: [-B + 2.5, -S + 6], to: [-B + 2.5, S - 6], y: [0.2, 1.4], rate: 3, life: [5, 8], size: [2.2, 3.6], grow: 1.5, colour: [0.58, 0.68, 0.66], alpha: 0.22, drift: 0.2, flow: { x: 0.5, z: 0.1 }, shape: 'wisp', reach: 80 });
  c.emit({ at: [-29.6, 0], to: [-33.6, 0], y: [surfY, surfY + 0.5], r: 14, rate: 4.4, life: [2.4, 4], size: [0.1, 0.18], colour: [0.4, 0.95, 0.65], alpha: 0.7, rise: 0.25, drift: 0.2, shape: 'bubble', glow: true, reach: 90 });
  c.emit({ at: [-31.6, 0], y: [surfY + 0.1, surfY + 1], r: 14, rate: 2.2, life: [3, 5], size: [1.4, 2.4], grow: 1.2, colour: [0.3, 0.7, 0.55], alpha: 0.16, rise: 0.2, flow: { x: 0.4, z: 0 }, shape: 'wisp', glow: true, reach: 90 });
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 3.6, ...ground };
};
