/**
 * The temenos of the Colossus beneath the pyramids (round 71; the temple pack's sandstone and a drift of sand; docs/BOSS_PLACES.md; round 72: the pylon is Bruno Macchioni's Egyptian temple,
 * its two sloping towers cut from the whole, and the court is wider by a dozen metres each way to stand before them; the licence of the first Egyptian pack that was meant for it keeps its
 * models out of the game): a walled court of weathered sandstone, a pylon gate of two great towers each with its fire and its banners, an avenue of vases and braziers down to the court, a
 * colonnade of tall square columns with its architrave about the wall's inner face on three sides, carved plaques along the back wall about the doorway of the sanctuary, obelisks outside the
 * gate, and the desert's drifts piled in the corners and against the wall. The fight is on the sun-wheel of paving in the middle; nothing solid stands in it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { column, rectOutline } from './common';

const SAND: Put = { tint: [0.84, 0.72, 0.52], keep: 0.3 };
const WORN: Put = { tint: [0.76, 0.66, 0.5], keep: 0.25 };
const RELIEF = ['tp_door_sun', 'tp_door_moon'] as const;
const FLAGS = ['tp_flag_sun', 'tp_flag_moon', 'tp_flag_stars', 'tp_flag_eclipse'] as const;

export const colossus: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const [S, B] = [c.R + 26, c.R + 26]; // (the court was 14 m about the fight's ring; the new pylon is 85 m across, and the court stands before it)
  const gate = h.gate.width / 2 + 0.7;
  // The doorway's threshold is 6.3 m up the mesh and the lintel 18.74 m (the middle under the threshold is empty). A set piece is drawn 0.15 m into the ground, so this lands the threshold on the court the gate stands on. The fires and banners come down with the mesh.
  const DROP = 6.3 - 0.15;
  const [foot, crown] = [33, 31.4 - DROP]; // the towers reach 33 m either side of the gate's middle; the fires sit 31.4 m up the mesh
  const wall: Put = { ...SAND, stretch: [1, 1, 2.6], height: 9 };

  // the wall, and the pylon that stands in its front
  c.run('tp_wall_mid', [G, -foot + 2], [G, -S], wall);
  c.run('tp_wall_mid', [G, foot - 2], [G, S], wall);
  c.run('tp_wall_mid', [G, S], [-B, S], wall);
  c.run('tp_wall_mid', [G, -S], [-B, -S], wall);
  c.run('tp_wall_mid', [-B, S], [-B, -S], { ...wall, height: 10 });
  c.add('eg_pylon', G, 0, { ...SAND, face: 'front', jitter: 0, y: -DROP });
  for (const side of [-1, 1]) {
    c.add('px_brazier', G, side * 19, { y: crown, s: 2.6, lit: 'fire', round: true });
    for (let i = 0; i < 2; i++) c.add(FLAGS[(i + (side > 0 ? 2 : 0)) % 4]!, G + 5.6, side * (12 + i * 14), { y: 7 - DROP, s: 3.4, face: 'front', walk: true });
    c.add('px_obelisk', G + 9, side * (gate + 9), { ...WORN, s: 1.0 });
  }

  // the avenue: vases either side, a brazier between each pair
  for (let a = G - 6; a > c.R + 4; a -= 5.2) for (const side of [-1, 1]) {
    c.add(a % 2 > 1 ? 'tp_vase_2' : 'tp_vase_3', a, side * 6.8, { ...WORN, s: 1.9, jitter: 0.2 });
    c.add('px_brazier', a - 2.6, side * 4.2, { s: 1.3, lit: 'fire', round: true });
  }

  // the colonnade: tall square columns along the back and either side, an architrave on their tops
  const at = S - 7;
  const along = (a0: number, a1: number): number[] => { const n = Math.round(Math.abs(a1 - a0) / 6.6); return Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n); };
  let top = 0;
  for (const cc of along(-at, at)) if (Math.abs(cc) > 2.6) top = column(c, -B + 7, cc, 1, { ...SAND, s: 1.12, jitter: 0.06 });
  for (const side of [-1, 1]) for (const a of along(-B + 7, G - 18)) if (a > -B + 8) column(c, a, side * at, 1, { ...SAND, s: 1.12, jitter: 0.06 });
  c.run('tp_beam', [-B + 7, -at - 1], [-B + 7, -2.8], { ...WORN, y: top - 0.4 });
  c.run('tp_beam', [-B + 7, 2.8], [-B + 7, at + 1], { ...WORN, y: top - 0.4 });
  for (const side of [-1, 1]) c.run('tp_beam', [-B + 6, side * at], [G - 17, side * at], { ...WORN, y: top - 0.4 });

  // the sanctuary's doorway and the plaques either side of it, columns lit at the doorway
  c.add('tp_doorway', -B + 0.9, 0, { ...SAND, face: 'front', s: 1.5 });
  for (const [i, cc] of ([-26, -19, -11.5, 11.5, 19, 26] as const).entries()) c.add(RELIEF[i % 2]!, -B + 1.5, cc, { ...WORN, face: 'front', s: 1.3, y: 0.4, walk: true });
  for (const side of [-1, 1]) c.add('px_brazier', -B + 4, side * 5.5, { s: 1.6, lit: 'fire', round: true });

  // the sand: drifts in the corners, against the walls and across the way in from the desert
  const drifts: readonly (readonly [number, number, number, number, number])[] = [
    [-B + 7, S - 8, 15, 3.8, 9], [-B + 6, -S + 8, 14, 3.4, 8], [14, S - 4, 12, 3, 7], [-20, -S + 4, 13, 3.2, 7], [G - 10, S - 5, 11, 2.6, 6],
    [-4, S + 8, 18, 4.4, 10], [-B - 8, 12, 16, 4, 12], [26, -S - 9, 17, 3.6, 9],
  ];
  for (const [i, [a, cc, w, hh, d]] of drifts.entries()) c.add('px_dune', a, cc, { tint: [0.85, 0.74, 0.54], keep: 0.35, stretch: [w / 12, hh / 3, d / 8], face: 'in', turn: i * 41 });

  // pyramids beyond the back wall, on the ground levelled for it (web part wk_pyramid, docs/WEB_PARTS.md)
  for (const side of [-1, 1]) c.add('wk_pyramid', -B - 14, side * 30, { ...SAND, s: 0.55, face: 'in', y: -1.5, walk: true, turn: side * 8 });

  // what moves in it: sand blown along the walls, the braziers' smoke
  for (const side of [-1, 1]) c.emit({ at: [-B + 4, side * (S - 6)], to: [G - 8, side * (S - 6)], y: [0.2, 1.8], rate: 3.2, life: [4, 7], size: [1.4, 2.4], grow: 1.4, colour: [0.78, 0.66, 0.46], alpha: 0.16, drift: 0.2, flow: { x: 0, z: side * 0.9 }, shape: 'wisp', reach: 90 });
  for (const side of [-1, 1]) c.emit({ at: [G, side * 19], y: [crown + 1.5, crown + 2], r: 0.6, rate: 3, life: [4, 7], size: [1, 1.7], grow: 2.4, colour: [0.3, 0.26, 0.22], alpha: 0.26, rise: 1, drift: 0.2, flow: { x: -0.2, z: 0.3 }, shape: 'wisp', reach: 110 });
  c.emit({ at: [8, -S + 10], to: [8, S - 10], y: [0.4, 3], rate: 2.4, life: [3, 6], size: [0.07, 0.12], colour: [1, 0.82, 0.5], alpha: 0.6, drift: 0.5, rise: 0.15, shape: 'spark', glow: true, reach: 80 }); // grains of the court's gold catching what light there is
  return { outline: rectOutline(G, S, B), ahead: G, outer: 12, fogHeight: 4 };
};
