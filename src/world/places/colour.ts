/**
 * The Gardner place in the dry reservoir (round 71; packs 01 and 09, Kenney's nature kit, and a well of code: docs/BOSS_PLACES.md): the farmhouse
 * stands at the back of the basin in front of the fight, a gable of grey boards with its chimney still up, the roof gone to rafters and one wall
 * fallen, a well beside it that the light came out of; a barn lies half-down along the one bank, and a dead orchard stands in rows along the
 * other and lines the way up from the gate. Everything is the colour of ash, as Ammi Pierce told it. What breathes: the well's glow, the
 * chimney's dust, motes drifting low between the trees. The basin's dam, bank, sluice and spillway are the basin's own (enclosureBasin.ts).
 * The fog is held low so the roofs and the chimney stand over it. Pure: no Three.js.
 */

import type { ExtraFn } from '../enclosurePlace';
import type { Put } from '../placeKit';

const ASH: Put = { tint: [0.6, 0.6, 0.63], keep: 0.22 };
const WOOD: Put = { tint: [0.52, 0.5, 0.5], keep: 0.3 };

export const colour: ExtraFn = (c, h) => {
  const R = c.R;
  const rear = -(R + h.basin!.behind) + h.thick / 2 + 3.4; // the farmhouse's back wall: clear of the bank's inner face wherever the bank leans in
  const [front, half] = [rear + 6.6, 6.4];
  const wallH = 3.5;
  const wall: Put = { ...WOOD, stretch: [1, 1.5, 1.2] }; // two storeys' height, the upper floor gone

  // the farmhouse: back wall with its hearth, a side wall with windows, the other side half fallen, the front with its door and a corner in bricks
  c.run('fh_wall', [rear, -half], [rear, half], { ...wall, face: 'front' });
  c.add('fh_hearth', rear + 0.5, -2.2, { face: 'front', tint: [0.62, 0.58, 0.55], keep: 0.2, height: 3.2, s: 1.4 });
  c.add('px_chimney', rear - 0.5, -2.2, { height: 14, tint: [0.62, 0.6, 0.58], keep: 0.15 });
  c.run('fh_wall_win', [rear + 0.2, -half], [front, -half], { ...wall, to: 0.7, face: 'in' });
  c.run('rn_wall_broken', [rear + 0.2, -half], [front, -half], { ...ASH, from: 0.7, stretch: [1, 1.2, 1.1] });
  c.run('fh_wall', [rear, half], [front, half], { ...wall, to: 0.4 });
  c.run('rn_wall_broken', [rear, half], [front, half], { ...ASH, from: 0.4, to: 0.58, stretch: [1, 0.7, 1.2] });
  c.run('fh_wall_win', [front, -half], [front, -3.3], wall);
  c.add('fh_wall_door', front, -1.6, { ...wall, face: 'front', stretch: [1.5, 1.5, 1.2] });
  c.run('fh_wall', [front, 0.2], [front, 3.4], { ...wall, stretch: [1, 0.9, 1.2] });
  c.run('rn_wall_broken', [front, 3.4], [front, half], { ...ASH, stretch: [1, 1.3, 1.2] });
  for (const [a, cc] of [[front - 0.5, 4.3], [front - 1.2, 5.2], [front + 0.6, 5.4], [front - 2.4, 6.3]] as const) c.add('rn_bricks', a, cc, { ...ASH, jitter: 0.3, s: 0.9, walk: true });

  // the roof is rafters: trusses across, one down; the beams that fell, and the floor that is left
  for (const [i, a] of [rear + 0.6, rear + 2.4, rear + 4.2, front - 0.6].entries()) {
    if (i === 2) continue;
    c.add('fh_roof_c', a, 0, { ...WOOD, face: 'front', length: half * 2 + 0.6, y: wallH * 1.5 - 0.3, height: 4.2 });
  }
  c.add('fh_beam_lean', rear + 3, -3.6, { ...WOOD, face: 'front', s: 1.7, y: 0.1, walk: true });
  c.add('fh_beam_drop', rear + 3.6, 2.8, { ...WOOD, face: 'front', s: 1.5, turn: 20, y: 0.1, walk: true });
  c.add('fh_beam', rear + 3.2, 0.4, { ...WOOD, face: 'front', s: 2.2, turn: 70, y: 0.12, walk: true });
  c.add('fh_floor', rear + 3.2, -1.2, { ...WOOD, stretch: [11, 1, 4.6], y: 0.04, face: 'front', walk: true });
  c.add('fh_bed', rear + 1.2, 4.6, { ...WOOD, face: 'front', turn: 90, s: 1.3 });
  c.add('fh_table', rear + 2.6, -4.4, { ...WOOD, face: 'front', turn: 20, s: 1.2 });
  c.add('fh_shelf', rear + 0.5, 1.6, { ...WOOD, face: 'front', s: 1.3 });
  c.add('fh_stove', rear + 0.7, 3.2, { face: 'front', s: 1.2 });

  // the well, the cart and what was kept in the yard
  const well: readonly [number, number] = [rear + 3.4, -half - 4.4];
  c.add('px_well', well[0], well[1], { tint: [0.55, 0.55, 0.58], keep: 0.3, s: 1.2 });
  c.add('rn_cart', front + 1.4, 9.2, { yaw: 2.4, s: 1.1, ...WOOD });
  c.add('fh_trunk', rear + 3.6, half + 1.3, { ...WOOD, face: 'out', jitter: 0.2, s: 1.3 });
  c.add('rn_barrel', rear + 5.2, -half - 1.4, { ...WOOD, jitter: 0.3, s: 1.2 });

  // the barn along the bank: eight posts, its trusses (one fallen across), a back wall of thin boards and half a side
  const [b0, b1, bl, br] = [-17.5, -6.5, 27.8, 32.4];
  for (const a of [b0, (b0 + b1) / 2, b1]) for (const cc of [bl, br]) c.add('fh_post', a, cc, { ...WOOD, height: 5, jitter: 0.1 });
  c.run('fh_wall_thin', [b0, br], [b1, br], { ...WOOD, height: 4.4 });
  c.run('fh_wall_thin', [b0, bl], [b1, bl], { ...WOOD, height: 4.4, to: 0.45 });
  c.add('fh_wall_thin', b0, (bl + br) / 2, { ...WOOD, height: 4.4, length: br - bl, face: 'front' });
  for (const a of [b0 + 0.2, (b0 + b1) / 2 - 1]) c.add('fh_roof_c', a, (bl + br) / 2, { ...WOOD, face: 'front', length: br - bl + 0.5, y: 4.2, height: 2.4 });
  c.add('fh_beam_lean', (b0 + b1) / 2 + 1.8, (bl + br) / 2, { ...WOOD, face: 'front', s: 2.2, turn: 90, y: 0.1, walk: true });
  c.add('fh_crate', b1 - 1.2, br - 1, { ...WOOD, jitter: 0.2, s: 1.5 });
  c.add('rn_bricks', (b0 + b1) / 2 + 2, bl + 1.2, { ...ASH, s: 1.2, walk: true });

  // the orchard: rows of dead trees about the bank's other side, and a pair of rows lining the way up from the gate; one gap where a tree is down
  const trees = ['gt_dead_3', 'gt_dead_4', 'gt_dead_5'];
  let n = 0;
  for (const cc of [-30.5, -35.2]) for (let a = -14; a <= 18; a += 6.2) {
    if (cc < -35 && a === -1.6) continue;
    c.add(trees[n++ % 3]!, a + (cc < -33 ? 3 : 0), cc, { ...WOOD, jitter: 0.8, face: 'front', s: 0.62 + (n % 3) * 0.07 });
  }
  for (const side of [-1, 1]) for (let a = c.R + 3; a <= c.R + 13; a += 5.3) c.add(trees[n++ % 3]!, a, side * (9.5 + (n % 2) * 6.5), { ...WOOD, jitter: 0.9, face: 'front', s: 0.66 });
  c.add('nt_log', 16.4, -30.4, { ...WOOD, yaw: 0.4, s: 1.1 });
  c.add('nt_stump', 3.6, -33, { ...WOOD, s: 1.2 });

  // what breathes
  c.emit({ at: well, y: [0.9, 1.4], r: 0.5, rate: 6, life: [2.4, 3.8], size: [0.25, 0.5], grow: 1.4, colour: [0.82, 0.2, 0.7], end: [0.5, 0.1, 0.6], alpha: 0.7, rise: 0.9, drift: 0.2, shape: 'wisp', glow: true, reach: 100 });
  c.emit({ at: well, y: [1.1, 2.4], r: 0.9, rate: 3, life: [1.6, 3], size: [0.08, 0.14], colour: [1, 0.55, 0.9], alpha: 0.9, rise: 0.5, drift: 0.5, shape: 'spark', glow: true, reach: 100 });
  c.emit({ at: [rear - 0.5, -2.2], y: [14, 14.5], r: 0.5, rate: 3, life: [4, 6.5], size: [0.8, 1.4], grow: 2.4, colour: [0.55, 0.55, 0.58], alpha: 0.28, rise: 0.9, drift: 0.2, flow: { x: 0.35, z: 0.1 }, shape: 'wisp', reach: 100 });
  c.emit({ at: [-14, -32.8], to: [18, -32.8], y: [0.2, 1.6], rate: 2.6, life: [3, 5], size: [0.1, 0.18], colour: [0.9, 0.35, 0.8], alpha: 0.6, drift: 0.35, rise: 0.12, shape: 'spark', glow: true, reach: 80 });
  c.emit({ at: [(b0 + b1) / 2, (bl + br) / 2], y: [0.3, 2], r: 3, rate: 2, life: [3, 5], size: [0.7, 1.2], grow: 1.4, colour: [0.5, 0.5, 0.52], alpha: 0.18, rise: 0.3, drift: 0.3, shape: 'wisp', reach: 80 });
  return { fogHeight: 3.4 };
};
