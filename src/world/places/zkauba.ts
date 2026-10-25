/**
 * The terraces of Yaddith (round 71; the alien-base pack's pylons, braced walls, domed bastions and overhead passages, their paint taken off and thrown to a pale metal-stone,
 * and its domes and open frames beyond; docs/BOSS_PLACES.md; round 72: the alien pack replaces pack 11's; round 75: the engines of the city and an arc of power between its pylons): a court walled by braced panels of the planet's metal, with tall tapered pylons at the corners, along the sides and either
 * side of the gate, and a domed bastion at each back corner. Passages run overhead from the pylons across two corners of the court and a covered bridge crosses over
 * the gate between its pylons; two consoles and two braced stands flank the way in; a dish stands on the back wall at either hand. Beyond the walls the city goes on: a hangar, a depot and a keep
 * along the sides, generators humming, a great tower rising behind the open frame, and a craft standing on its legs where it was left. Every few seconds a bolt of green fire leaps from one
 * pylon's top to another's (and, slower, from the tower to a dish), and sparks hum at the tops, the bastions breathe, a green mist lies along the foot of the walls. The fog is held low so the pylons and the passages show over it. Pure: no Three.js.
 */

import type { V3 } from '../../core/geom';
import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { rectOutline, sky, wallRect } from './common';

const METAL: Put = { tint: [0.7, 0.72, 0.68], keep: 0.45 };
const DARK: Put = { tint: [0.46, 0.5, 0.48], keep: 0.45 };
const GREEN = [0.5, 1, 0.75] as const;
const ICE = [0.7, 0.85, 1] as const;

export const zkauba: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [40, 36];
  const gate = h.gate.width / 2 + 0.9;
  const flank = gate + 1.5; // the gate's pylons' middles (their inner faces reach the gate's posts, so no body slips between)
  wallRect(c, 'ay_wall', G, S, B, flank + 2.3, { ...METAL, height: 8 });

  // the tall pylons: either side of the gate, at the front corners and along the sides; the bastions at the back corners (the tops of those the bolts leap between are kept)
  const tops: V3[] = [];
  const pylon = (a: number, cc: number, k: number, arc = false): void => {
    c.add('ay_pylon', a, cc, { ...METAL, face: 'front', s: k });
    if (arc) tops.push(sky(c, a, cc, 20 * k));
  };
  for (const side of [-1, 1]) {
    pylon(G, side * flank, 1.1, true);
    pylon(G, side * S, 1.0, true);
    c.add('ay_bastion', -B, side * S, { ...DARK, face: 'in', s: 1.0 });
    for (const [a, k, arc] of [[G - 14, 0.75, false], [G - 30, 0.9, true], [G - 44, 0.8, false], [G - 58, 1.05, true]] as const) pylon(a, side * S, k, arc);
    pylon(-B, side * 24, 0.85, true);
    pylon(G, side * (S + flank) / 2, 0.8);
    c.add('px_obelisk', G + 8, side * (flank + 9), { ...METAL, s: 0.8 }); // (the road's pale markers, outside the front wall)
  }

  // overhead: a covered bridge over the gate between its pylons, and passages from the back wall's top to the sides', across the court's back corners
  c.run('ay_passage', [G, -flank + 1.6], [G, flank - 1.6], { ...METAL, y: 11, walk: true, height: 4.4 });
  for (const side of [-1, 1]) {
    c.run('ay_passage', [-B + 2, side * 22], [-12, side * (S - 2)], { ...METAL, y: 6.6, walk: true, height: 4.4 });
    c.run('ay_passage', [G - 4, side * (S - 2)], [G - 28, side * (S - 2)], { ...METAL, y: 6.6, walk: true, height: 4.4 });
  }

  // the way in is kept by consoles and braced stands, the dishes stand on the back wall, listening
  for (const side of [-1, 1]) {
    c.add('ay_console', G - 9, side * 7.5, { ...DARK, face: 'front', turn: side * -18 });
    c.add('ay_stand', G - 17, side * 12.5, { ...DARK, face: 'front' });
    c.add('ay_antenna', -B + 1, side * 13, { ...DARK, face: 'in', y: 8, turn: side * 25 });
  }

  // behind the back wall: a great open frame against the sky with the tower of the city rising in it, a craft where it landed, and beyond the side walls the hangars, the depot, the keep and the engines
  c.add('ay_portal', -B - 2.4, 0, { ...METAL, face: 'in', s: 1.7, walk: true });
  c.add('ay_tower', -B - 22, 0, { ...METAL, face: 'in', s: 1.0 });
  c.add('ay_tower', -B - 24, -34, { ...DARK, face: 'in', s: 0.8 });
  c.add('ay_craft', -B - 24, 33, { ...METAL, face: 'in', s: 0.8 });
  for (const [a, cc, id, s, tint] of [
    [-B - 13, -15, 'ay_dome', 1.2, METAL], [-B - 13, 15, 'ay_gantry', 1.1, DARK],
    [-6, S + 17, 'ay_hangar', 0.9, METAL], [14, -(S + 18), 'ay_depot', 0.8, DARK], [-26, S + 16, 'ay_generator', 1.0, DARK], [-27, -(S + 14), 'ay_keep', 1.0, METAL], [22, S + 15, 'ay_generator', 0.8, DARK],
  ] as const) c.add(id, a, cc, { ...tint, face: 'in', s });

  // what hums: sparks at the pylons' tops, the bastions' breath, a green mist along the foot of the walls, a glow in the engines
  for (const side of [-1, 1]) {
    for (const [a, cc] of [[G, side * flank], [G, side * S]] as const) c.emit({ at: [a, cc], y: [20, 22], r: 3, rate: 2.6, life: [1.6, 3], size: [0.1, 0.16], colour: GREEN, alpha: 0.9, rise: 0.5, drift: 0.5, shape: 'spark', glow: true, reach: 110 });
    c.emit({ at: [-B, side * S], y: [19, 21], r: 1.6, rate: 2.4, life: [4, 6], size: [1.2, 2.2], grow: 2.2, colour: [0.6, 0.66, 0.62], alpha: 0.24, rise: 1, drift: 0.3, flow: { x: 0.3, z: 0.2 }, shape: 'wisp', reach: 110 });
    c.emit({ at: [-B + 8, side * (S - 7)], to: [G - 8, side * (S - 7)], y: [0.2, 1.4], rate: 2, life: [5, 8], size: [2, 3.4], grow: 1.4, colour: [0.35, 0.7, 0.5], alpha: 0.14, drift: 0.2, shape: 'wisp', glow: true, reach: 100 });
  }
  for (const [a, cc, y] of [[-26, S + 16, 7], [22, S + 15, 5.6], [-B - 22, 0, 40]] as const) c.emit({ at: [a, cc], y: [y, y + 1], r: 3, rate: 2.2, life: [1.6, 3], size: [0.12, 0.2], colour: GREEN, alpha: 0.85, rise: 0.6, drift: 0.5, shape: 'spark', glow: true, reach: 120 });

  // the power of the city: a bolt of green fire from one pylon's top to another's across the court, and, slower, from the tower and its brothers to the dishes
  const puff = { shape: 'spark', count: 8, size: [0.12, 0.22], life: [0.5, 1.1], colour: GREEN, alpha: 0.95, spread: 2.4, rise: 0.4, glow: true } as const;
  const dishes: V3[] = [sky(c, -B + 1, -13, 14), sky(c, -B + 1, 13, 14), sky(c, -B - 22, 0, 40), sky(c, -B - 24, -34, 32)];
  const signals = [
    { kind: 'arc', at: tops, every: [2.6, 5.5], thread: GREEN, core: [1, 1, 1], width: 0.42, puff },
    { kind: 'arc', at: dishes, every: [7, 13], thread: ICE, core: [1, 1, 1], width: 0.5, puff: { ...puff, colour: ICE, count: 12 } },
  ] as const;
  return { outline: rectOutline(G, S, B), ahead: G, outer: 30, fogHeight: 4, signals };
};
