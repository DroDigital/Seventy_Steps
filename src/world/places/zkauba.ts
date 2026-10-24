/**
 * The terraces of Yaddith (round 71; the alien-base pack's pylons, braced walls, domed bastions and overhead passages, their paint taken off and thrown to a pale metal-stone,
 * and its domes and open frames beyond; docs/BOSS_PLACES.md; round 72: the alien pack replaces pack 11's): a court walled by braced panels of the planet's metal, with tall tapered pylons at the corners, along the sides and either
 * side of the gate, and a domed bastion at each back corner. Passages run overhead from the pylons across two corners of the court and a covered bridge crosses over
 * the gate between its pylons; a great open frame stands behind the back wall. Domes of the city stand beyond the walls. Sparks hum at the pylons' tops, the bastions breathe,
 * a green mist lies along the foot of the walls. The fog is held low so the pylons and the passages show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { rectOutline, wallRect } from './common';

const METAL: Put = { tint: [0.7, 0.72, 0.68], keep: 0.45 };
const DARK: Put = { tint: [0.46, 0.5, 0.48], keep: 0.45 };

export const zkauba: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [40, 36];
  const gate = h.gate.width / 2 + 0.9;
  const flank = gate + 1.5; // the gate's pylons' middles (their inner faces reach the gate's posts, so no body slips between)
  wallRect(c, 'ay_wall', G, S, B, flank + 2.3, { ...METAL, height: 8 });

  // the tall pylons: either side of the gate, at the front corners and along the sides; the bastions at the back corners
  for (const side of [-1, 1]) {
    c.add('ay_pylon', G, side * flank, { ...METAL, face: 'front', s: 1.1 });
    c.add('ay_pylon', G, side * S, { ...METAL, face: 'front', s: 1.0 });
    c.add('ay_bastion', -B, side * S, { ...DARK, face: 'in', s: 1.0 });
    for (const [a, k] of [[G - 14, 0.75], [G - 30, 0.9], [G - 44, 0.8], [G - 58, 1.05]] as const) c.add('ay_pylon', a, side * S, { ...METAL, face: 'front', s: k });
    c.add('ay_pylon', -B, side * 24, { ...METAL, face: 'front', s: 0.85 });
    c.add('ay_pylon', G, side * (S + flank) / 2, { ...METAL, face: 'front', s: 0.8 });
    c.add('px_obelisk', G + 8, side * (flank + 9), { ...METAL, s: 0.8 }); // (the road's pale markers, outside the front wall)
  }

  // overhead: a covered bridge over the gate between its pylons, and passages from the back wall's top to the sides', across the court's back corners
  c.run('ay_passage', [G, -flank + 1.6], [G, flank - 1.6], { ...METAL, y: 11, walk: true, height: 4.4 });
  for (const side of [-1, 1]) {
    c.run('ay_passage', [-B + 2, side * 22], [-12, side * (S - 2)], { ...METAL, y: 6.6, walk: true, height: 4.4 });
    c.run('ay_passage', [G - 4, side * (S - 2)], [G - 28, side * (S - 2)], { ...METAL, y: 6.6, walk: true, height: 4.4 });
  }

  // behind the back wall: a great open frame against the sky, and the city's domes beyond the walls
  c.add('ay_portal', -B - 2.4, 0, { ...METAL, face: 'in', s: 1.7, walk: true });
  for (const [i, [a, cc]] of ([[-B - 13, -14], [-B - 12, 14], [-4, S + 13], [8, -S - 13], [-B - 20, -31], [-24, -S - 14], [-30, S + 15]] as const).entries()) {
    c.add(i % 2 ? 'ay_gantry' : 'ay_dome', a, cc, { ...(i % 2 ? DARK : METAL), face: 'in', s: 1.1 + (i % 3) * 0.15 });
  }

  // what hums: sparks at the pylons' tops, the bastions' breath, a green mist along the foot of the walls
  for (const side of [-1, 1]) {
    for (const [a, cc] of [[G, side * flank], [G, side * S]] as const) c.emit({ at: [a, cc], y: [20, 22], r: 3, rate: 2.6, life: [1.6, 3], size: [0.1, 0.16], colour: [0.5, 1, 0.75], alpha: 0.9, rise: 0.5, drift: 0.5, shape: 'spark', glow: true, reach: 110 });
    c.emit({ at: [-B, side * S], y: [19, 21], r: 1.6, rate: 2.4, life: [4, 6], size: [1.2, 2.2], grow: 2.2, colour: [0.6, 0.66, 0.62], alpha: 0.24, rise: 1, drift: 0.3, flow: { x: 0.3, z: 0.2 }, shape: 'wisp', reach: 110 });
    c.emit({ at: [-B + 8, side * (S - 7)], to: [G - 8, side * (S - 7)], y: [0.2, 1.4], rate: 2, life: [5, 8], size: [2, 3.4], grow: 1.4, colour: [0.35, 0.7, 0.5], alpha: 0.14, drift: 0.2, shape: 'wisp', glow: true, reach: 100 });
  }
  return { outline: rectOutline(G, S, B), ahead: G, outer: 14, fogHeight: 4 };
};
