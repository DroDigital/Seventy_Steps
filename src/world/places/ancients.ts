/**
 * The pale hexagons of the Ancient Ones (round 71; pack 16's hexagonal tiles, pack 17's basalt columns, pack 18's broad steps, pale prisms made in code, docs/BOSS_PLACES.md): a
 * precinct in the shape of a hexagon, its six walls of pale prisms set edge to edge at one height, a taller one at each corner, the gate in the middle of
 * the front wall; within, a floor of hexagonal tiles laid about the fight, edge to edge, and six tall prisms standing at the corners' bearings with a short one
 * between each pair, all of them regular: the builders' masonry has no ornament but the angle. Outside, an older boundary of black basalt, eroded columns
 * in clusters, and an avenue of prisms in pairs from the gate along the way in, tiles down its middle and a broad flight of steps laid across the threshold. Motes drift; the light is even and cold. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing } from './common';

const PALE: Put = { tint: [0.82, 0.84, 0.9], keep: 0.5 };
const BASALT: Put = { tint: [0.24, 0.24, 0.28], keep: 0.5 };
const BASALTS = ['bs_mid', 'bs_a', 'bs_low', 'bs_b', 'bs_c'] as const;
const RAD = Math.PI / 180;

export const ancients: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const circ = G / Math.cos(Math.PI / 6);
  const verts: [number, number][] = Array.from({ length: 6 }, (_, k) => [Math.cos((30 + 60 * k) * RAD) * circ, Math.sin((30 + 60 * k) * RAD) * circ]);

  // the six walls of prisms at one height, a taller one at each corner, the gate's gap in the front
  for (let k = 0; k < 6; k++) {
    const [p, q] = [verts[(k + 5) % 6]!, verts[k]!]; // (the first side is the front's: from the right-hand corner to the left)
    const n = Math.round(circ / 4.2);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const [a, cc] = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      if (k === 0 && Math.abs(cc) < gate + 2.2) continue;
      c.add('px_prism', a, cc, { ...PALE, s: 1.6, height: i === 0 ? 12.5 : 7.2, face: 'in', turn: 30 });
    }
  }

  // the floor: hexagonal tiles laid edge to edge in the ring between the fight and the walls
  for (let j = -7; j <= 7; j++) {
    for (let i = -7; i <= 7; i++) {
      const [x, z] = [8 * i + (j % 2 ? 4 : 0), 6.93 * j];
      const d = Math.hypot(x, z);
      if (d < c.R + 5 || d > G - 8) continue;
      c.add('hx_tile', x, z, { ...PALE, face: 'front', y: -0.18, walk: true, keep: 0.4 });
    }
  }
  // six tall prisms at the corners' bearings, a short one between each pair
  for (let k = 0; k < 12; k++) {
    const deg = 30 * k;
    if (k % 2 === 0 && (deg === 0)) continue;
    const r = c.R + 7;
    c.add('px_prism', Math.cos(deg * RAD) * r, Math.sin(deg * RAD) * r, { ...PALE, s: k % 2 ? 1.25 : 0.9, height: k % 2 ? 13 : 3.2, face: 'in', turn: 30 });
  }

  // the older boundary outside: basalt columns in clusters, eroded, set about the precinct
  for (let i = 0; i < 24; i++) {
    const th = (i + 0.5) * ((2 * Math.PI) / 24);
    if (bearing(th) < 0.42) continue;
    const r = circ + 7 + (i % 3) * 2.2;
    c.add(BASALTS[i % 5]!, Math.cos(th) * r, Math.sin(th) * r, { ...BASALT, face: 'in', turn: (i * 41) % 60, s: 1.1 + (i % 4) * 0.18, jitter: 1.2 });
  }
  // the avenue from the gate: pairs of prisms, tiles down its middle, basalt standing beyond them
  for (let i = 0; i < 4; i++) {
    const a = G + 6 + i * 5;
    for (const side of [-1, 1]) c.add('px_prism', a, side * 6.4, { ...PALE, s: 1.1, height: 5.6 - i * 0.5, face: 'front', turn: 30 });
    c.add('hx_tile', a, 0, { ...PALE, face: 'front', y: -0.18, walk: true, s: 0.7 });
  }
  for (const side of [-1, 1]) c.add('bs_b', G + 22, side * 11, { ...BASALT, face: 'front', turn: side * 30, s: 1.4 });
  // the threshold: broad steps (pack 18's) laid across the way in at the gate, walked over, so the entrance is aligned to the stair
  c.add('dg_stairs_wide', G + 2.2, 0, { ...PALE, face: 'front', walk: true, s: 1.0, y: -0.1, height: 0.7 });

  // what drifts: pale motes, an even cold haze at the foot of the walls
  c.emit({ at: [0, 0], y: [0.4, 9], r: G - 6, rate: 4, life: [5, 9], size: [0.1, 0.18], colour: [0.92, 0.94, 1], alpha: 0.7, drift: 0.3, rise: 0.1, shape: 'spark', glow: true, reach: 120 });
  for (let k = 1; k < 6; k++) {
    const [p, q] = [verts[k - 1]!, verts[k]!];
    c.emit({ at: [p[0] * 0.9, p[1] * 0.9], to: [q[0] * 0.9, q[1] * 0.9], y: [0.1, 1.2], rate: 1.4, life: [5, 8], size: [2, 3.2], grow: 1.3, colour: [0.76, 0.78, 0.86], alpha: 0.12, drift: 0.2, shape: 'wisp', reach: 110 });
  }
  return { outline: [verts[5]!, ...verts.slice(0, 5)].map(([a, cc]) => [a, cc] as [number, number]), ahead: G, outer: 16, fogHeight: 4 };
};
