/**
 * The island of the sabbat in the black river (round 71; Kenney's nature kit and rn_ ruins, docs/BOSS_PLACES.md): thirteen standing stones of
 * four heights set round the fight, each with the balefire the court's set lights at its foot, the old white stone at the back with its
 * runes rising, a pair of tall stones where the ford lands, a ring of stones beyond, dead trees on the island's edge, a canoe drawn up on its bank, lilies and reeds in
 * the black water, and a mist lying on it in six places. The river, its kerbs and the one ford are the river's own (enclosureRiver.ts); the stones
 * on the far bank stand over it from outside. The fog is held low so the outer stones stand over it. Pure: no Three.js.
 */

import { HOUSE } from '../../data/arenaHouses';
import { WATER } from '../enclosureRiver';
import type { ExtraFn } from '../enclosurePlace';
import type { Put } from '../placeKit';

const STONE: Put = { tint: [0.4, 0.38, 0.44], keep: 0.35 };
const MENHIRS = ['nt_menhir_a', 'nt_menhir_c', 'nt_menhir_b', 'nt_menhir_d'] as const;
const RAD = Math.PI / 180;

export const blackman: ExtraFn = (c, h) => {
  const r = h.river!;
  const [R, Ri, P] = [c.R, c.R + r.island, c.R + (h.reach ?? HOUSE.reach)];
  const water = -r.depth * (1 - WATER); // the river's surface, under the land: its bed is r.depth down and the water fills WATER of it
  const polar = (rad: number, deg: number): [number, number] => [Math.cos(deg * RAD) * rad, Math.sin(deg * RAD) * rad];

  // the thirteen, of four heights, and the seven beyond them; the court's set lights a fire at the foot of each of the thirteen
  for (let i = 0; i < 13; i++) {
    const [a, cc] = polar(R, ((i + 0.5) * 360) / 13);
    c.add(MENHIRS[i % 4]!, a, cc, { ...STONE, face: 'in', s: 0.95 + (i % 3) * 0.08, jitter: 0.15 });
  }
  for (let i = 0; i < 7; i++) {
    const [a, cc] = polar(R * 1.4 + (i % 2) * 1.5, ((i + 0.3) * 360) / 7);
    c.add(MENHIRS[(i + 1) % 4]!, a, cc, { ...STONE, face: 'in', s: 1.2 + (i % 2) * 0.15, jitter: 0.4 });
  }
  // the ford's landing is between two tall stones, and flat stones are laid in the dust of it
  for (const side of [-1, 1]) c.add('nt_menhir_c', Ri - 3.6, side * 7.4, { ...STONE, face: 'front', s: 1.25 });
  for (let a = Ri - 6; a > R + 4; a -= 3.3) c.add('nt_stone_flat', a, (a % 2 > 1 ? 1 : -1) * 0.7, { ...STONE, face: 'front', s: 0.8, walk: true, jitter: 0.2 });

  // the island's rim: dead trees where the ground is white, and a canoe drawn up on the shore, black with the river
  for (let i = 0; i < 7; i++) {
    const [a, cc] = polar(Ri - 3.2, 60 + (i * 240) / 6 + (i % 2) * 4);
    c.add(['gt_dead_6', 'gt_dead_8', 'gt_dead_9'][i % 3]!, a, cc, { tint: [0.4, 0.38, 0.4], keep: 0.3, face: 'front', s: 0.7, jitter: 0.5 });
  }
  const [ca, cc] = polar(Ri - 2.3, 128);
  c.add('nt_canoe', ca, cc, { tint: [0.3, 0.25, 0.25], keep: 0.4, turn: 90 + 14, s: 1.5 });
  c.add('nt_log', ...polar(Ri - 2.2, 236), { tint: [0.35, 0.3, 0.3], keep: 0.35, face: 'out', s: 1.2, turn: 90 });

  // the water: lilies on its surface, reeds standing from its bed, away from the ford
  for (const [rad, n, from, to] of [[Ri + 2.8, 8, 22, 338], [Ri + 6.3, 9, 18, 342], [Ri + 9.3, 7, 28, 332]] as const) {
    for (let i = 0; i < n; i++) {
      const [a, cc] = polar(rad, from + ((to - from) * i) / (n - 1));
      c.add('nt_lily', a, cc, { y: water + 0.02, keep: 0.5, tint: [0.2, 0.3, 0.3], jitter: 0.8, s: 1 + (i % 3) * 0.25, walk: true, face: 'front', turn: i * 53 });
    }
  }
  for (let i = 0; i < 12; i++) {
    const [a, cc] = polar(Ri + 1.8 + (i % 3) * 3.2, 25 + i * 28.4);
    c.add('nt_reed', a, cc, { y: -r.depth, keep: 0.4, tint: [0.28, 0.34, 0.3], face: 'front', s: 1.5, jitter: 0.8, walk: true });
  }

  // the far bank: stones standing over the water from outside it, and a fire or two
  for (let i = 0; i < 9; i++) {
    const [a, cc] = polar(P + 4.4, 48 + (i * 264) / 8);
    c.add(MENHIRS[(i + 2) % 4]!, a, cc, { ...STONE, face: 'in', s: 1.1 + (i % 3) * 0.12, jitter: 0.8 });
  }

  // what breathes: the white stone's runes, a mist on the water in six places, and a fire's embers on the island's rim
  const stone = [-R * 0.58, 0] as const;
  c.emit({ at: stone, y: [0.6, 2.6], r: 1.8, rate: 2.4, life: [3, 5], size: [0.18, 0.26], colour: [0.86, 0.8, 1], alpha: 0.8, rise: 0.35, drift: 0.25, shape: 'rune', glow: true, spin: 0.6, reach: 90 });
  for (let i = 0; i < 6; i++) {
    const [a, cc] = polar(Ri + 6, 40 + i * 56);
    c.emit({ at: [a, cc], y: [water + 0.1, water + 0.8], r: 5, rate: 1.8, life: [4, 7], size: [1.4, 2.4], grow: 1.8, colour: [0.2, 0.2, 0.28], alpha: 0.3, rise: 0.1, drift: 0.25, flow: { x: 0.3, z: -0.2 }, shape: 'wisp', reach: 100 });
  }
  return { fogHeight: 3.6 };
};
