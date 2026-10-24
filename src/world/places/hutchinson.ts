/**
 * Edward Hutchinson's keep on the road (round 71; packs 06 and 01, and a mast of code: docs/BOSS_PLACES.md): a curtain wall of grey ashlar with
 * a tower at each corner and between, a gatehouse over two great towers with a portcullis between them and a rod on its span, a donjon at the
 * back, four towers at its corners and a door under a pointed arch, and against the wall at the donjon's side his laboratory, a long low hall of
 * glazed bays and a skylight, with the chimney of its furnace. Torches line the way from the gate; a cart and casks stand where stores are kept.
 * The fight is in the court; nothing solid stands in it. The two rods draw the lightning the weather throws at the keep. Pure: no Three.js.
 */

import type { V3 } from '../../core/geom';
import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';

const TOWER = 1.9; // the gate towers' scale: the opening between them is the gate's
const KEEP = { wall: 14, tower: 2.4 };

export const hutchinson: PlaceFn = (c: Court, h: House) => {
  const b = h.bailey!;
  const k = b.keep!;
  const [G, S, B] = [c.R + b.ahead, c.R + b.side, c.R + b.behind];
  const stone: Put = { tint: h.tint, keep: 0.1 };
  const wall: Put = { ...stone, stretch: [1, 1, 1.5], height: 7.5 };
  const gx = h.gate.width / 2 + 2.2 * TOWER - HOUSE.lap; // the gate towers' middles
  const half = k.width / 2;

  // the curtain: the front either side of the gate, the sides, and the back to the donjon on either hand
  c.run('cs_wall', [G, -(gx + 3)], [G, -S], wall);
  c.run('cs_wall', [G, gx + 3], [G, S], wall);
  c.run('cs_wall', [G, S], [-B, S], wall);
  c.run('cs_wall', [G, -S], [-B, -S], wall);
  c.run('cs_wall', [-B, S], [-B, half - 0.5], wall);
  c.run('cs_wall', [-B, -S], [-B, -half + 0.5], wall);
  for (const [a, cc] of [[G, S], [G, -S], [-B, S], [-B, -S]] as const) c.add('cs_tower_corner', a, cc, { ...stone, s: 1.7, face: 'front' });
  for (const side of [-1, 1]) {
    for (let a = G - 22; a > -B + 12; a -= 22) c.add('cs_tower', a, side * S, { ...stone, s: 1.4, face: 'front' });
    c.add('cs_tower', G, side * (S / 2 + 4), { ...stone, s: 1.4, face: 'front' });
  }

  // the gatehouse: two great towers lit at their tops, a span of wall above the gate, a rod on it, and the portcullis between (the gate's own)
  const span = 6.9;
  for (const side of [-1, 1]) c.add('cs_tower', G, side * gx, { ...stone, s: TOWER, face: 'front', lit: 'fire' });
  c.run('cs_wall', [G, -gx + 1.5], [G, gx - 1.5], { ...stone, stretch: [1, 1, 1.5], height: 4.6, y: span, lap: 0.8 });
  c.add('px_rod', G, 0, { y: span + 4.6 - 0.2, height: 9 });
  const rods: V3[] = [{ ...c.put(G, 0), y: c.s.y + span + 4.6 + 9 }];

  // the donjon: walls on three sides and the court's, a tower at each corner, the door under a pointed arch, and a rod on the north-east tower
  const [kf, kb] = [-B, -B - k.depth];
  const deep = { ...stone, stretch: [1, 1, 1.5] as const, height: KEEP.wall };
  c.run('cs_wall', [kf, -half + 5], [kf, -3.5], deep);
  c.run('cs_wall', [kf, 3.5], [kf, half - 5], deep);
  c.run('cs_wall', [kf, half], [kb, half], deep);
  c.run('cs_wall', [kf, -half], [kb, -half], deep);
  c.run('cs_wall', [kb, half], [kb, -half], deep);
  for (const [a, cc] of [[kf, half], [kf, -half], [kb, half], [kb, -half]] as const) c.add('cs_tower_corner', a, cc, { ...stone, s: KEEP.tower, face: 'front' });
  c.add('rn_arch_goth', kf, 0, { ...stone, s: 2.1, face: 'front', height: 8.2 });
  for (const side of [-1, 1]) c.add('cs_stairs_1', kf + 1.5, side * 5.2, { ...stone, s: 0.55, face: 'front', walk: true });
  c.add('px_rod', kb, half, { y: 6.8 * KEEP.tower - 0.2, height: 12 });
  rods.push({ ...c.put(kb, half), y: c.s.y + 6.8 * KEEP.tower + 12 });

  // the laboratory against the back wall at the donjon's left: a hall of glazed bays on the court, a plank deck for a roof with a skylight, a hearth, and a chimney
  const [lf, lb, l0, l1] = [-B + 9.5, -B + 1.5, 18, 36];
  const labwall: Put = { ...stone, keep: 0.25 };
  const [mid, door] = [(l0 + l1) / 2, 1.9]; // (the door piece is stretched 1.9 times: its opening is 1.9 m wide and the wall either side meets the windows, so a body goes through with room to spare, never shut in)
  c.run('fh_wall_winl', [lf, l0], [lf, mid - door], { ...labwall, stretch: [1, 1, 1.1] });
  c.run('fh_wall_winl', [lf, mid + door], [lf, l1], { ...labwall, stretch: [1, 1, 1.1] });
  for (const cc of [l0, l1]) c.run('fh_wall', [lf, cc], [lb, cc], { ...labwall });
  c.add('fh_wall_door', lf, mid, { ...labwall, face: 'front', stretch: [door, 1, 1] });
  c.run('fh_floor', [lf + 0.4, l0 - 0.4], [lf + 0.4, l1 + 0.4], { y: 3.5, stretch: [1, 1, 10], length: 2, jitter: 0, walk: true, face: 'front' });
  for (let cc = l0 + 2; cc < l1 - 1; cc += 4.5) c.add('fh_pane', lf - 3, cc, { y: 3.55, s: 1.6, face: 'front', walk: true });
  c.add('fh_hearth', lb + 0.4, 31, { face: 'front', tint: h.tint, height: 3 });
  c.add('px_chimney', lb + 1.6, 31, { height: 11 });
  c.add('fh_table', lf - 3.2, 24, { face: 'front', s: 1.4 });
  c.add('fh_table', lf - 3.2, 29.5, { face: 'front', s: 1.4, turn: 90 });
  c.add('fh_shelf', lb + 0.5, 22.5, { face: 'front', s: 1.3 });
  c.add('fh_stove', lb + 0.8, 25.5, { face: 'front', s: 1.1 });

  // the way from the gate is lit; stores stand before the laboratory; the court's own set has the rest
  for (const a of [G - 3, G - 9, G - 15]) for (const side of [-1, 1]) c.add('rn_torch', a, side * 8, { s: 2.2, lit: 'fire', jitter: 0.3 });
  c.add('rn_cart', lf + 2.4, 12, { yaw: 0.5, s: 1.1 });
  for (const [a, cc] of [[lf + 2.2, 20.5], [lf + 2.6, 22.5], [lf + 1.9, 34.8], [lf + 2.4, 33.2]] as const) c.add(a % 2 > 1 ? 'rn_crate' : 'rn_barrel', a, cc, { jitter: 0.3, s: 1.3 });
  for (const side of [-1, 1]) c.add('rn_flag', G + 0.6, side * (gx + 2.4), { y: 5.5, s: 2.4, face: 'front', dye: { cloth: [0.34, 0.1, 0.1] }, walk: true });

  // what comes off it: the furnace's smoke, a violet glow behind the glass, and the light that clings to the rods
  c.emit({ at: [lb + 1.6, 31], y: [11, 11.4], r: 0.5, rate: 4, life: [4, 6], size: [0.9, 1.5], grow: 2.6, colour: [0.36, 0.38, 0.34], alpha: 0.32, rise: 1.0, drift: 0.2, flow: { x: 0.3, z: 0.1 }, shape: 'wisp', reach: 90 });
  c.emit({ at: [lf - 1, l0 + 2], to: [lf - 1, l1 - 2], y: [0.8, 2.6], rate: 2.4, life: [2.5, 4], size: [0.12, 0.2], grow: 1.2, colour: [0.66, 0.5, 0.95], alpha: 0.7, rise: 0.15, drift: 0.12, shape: 'spark', glow: true, reach: 60 });
  for (const [a, cc, y] of [[G, 0, span + 13.4], [kb, half, 6.8 * KEEP.tower + 12.3]] as const) c.emit({ at: [a, cc], y: [y, y + 0.3], r: 0.2, rate: 5, life: [0.6, 1.2], size: [0.15, 0.3], grow: 0.4, colour: [0.7, 0.8, 1], alpha: 0.9, drift: 0.9, shape: 'spark', glow: true, reach: 120 });

  const outline: [number, number][] = [[G, -S], [G, S], [-B, S], [-B, half], [kb, half], [kb, -half], [-B, -half], [-B, -S]];
  return { outline, ahead: G, outer: 8, rods, fogHeight: 5 };
};
