/**
 * The precinct of the Gate (round 71; pale prisms and arches of pack 09 cut to the Threshold, a ring and spheres of light made in code, docs/BOSS_PLACES.md): seven
 * walls, each a bank of crystal prisms of different heights standing edge to edge, and a gate between two obelisks. Within them a ring of tall
 * arches stands about the fight, each opening on the next and none on anything; at the back, in the court's far corner of the sky, a great ring of light
 * turned across a second, with spheres hung in them at heights that no frame holds, and under them a floor of no colour at all. Motes rise out of it, in the shape of
 * letters. The fog is held low so the walls and the arches stand over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing } from './common';

const CRYSTAL: Put = { tint: [0.66, 0.72, 0.96], keep: 0.35 };

export const yog: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const circ = G / Math.cos(Math.PI / 7);
  const verts: [number, number][] = Array.from({ length: 7 }, (_, k) => { const th = (Math.PI / 7) * (2 * k + 1); return [Math.cos(th) * circ, Math.sin(th) * circ]; });
  const outline = verts.map(([a, cc]) => [a, cc] as [number, number]);
  // the vertices run from the front's left corner round to its right, so the front is the edge between the last and the first

  // the walls: banks of prisms, each side in a row, of heights 9 to 16, a gap of the gate's width in the front
  let n = 0;
  const hw = h.gate.width / 2;
  for (const side of [-1, 1]) c.add('px_prism', G, side * (hw + 2.4), { ...CRYSTAL, s: 1.7, height: 11, face: 'front' }); // (square to the way, its edge stands on the seal's: the opening is no wider than the door)
  for (let k = 0; k < 7; k++) {
    const [p, q] = [verts[k]!, verts[(k + 1) % 7]!];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const count = Math.round(len / 4.4);
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const [a, cc] = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      if (Math.abs(a - G) < 0.5 && Math.abs(cc) < hw + 5.5) continue; // the gate, and the prism either side of it, which is set by hand
      c.add('px_prism', a, cc, { ...CRYSTAL, s: 1.7, height: 9 + ((n++ * 37) % 8), face: 'in', turn: n * 23 });
    }
  }
  for (const side of [-1, 1]) c.add('px_obelisk', G + 1.5, side * (gate + 4.4), { ...CRYSTAL, s: 2.1, face: 'front' });

  // a ring of arches about the fight, each turned a little from the last
  for (let i = 0; i < 7; i++) {
    const th = (i + 0.5) * ((2 * Math.PI) / 7) + Math.PI / 7;
    if (bearing(th) < 0.5) continue;
    c.add('rn_arch_goth', Math.cos(th) * (c.R + 9.5), Math.sin(th) * (c.R + 9.5), { ...CRYSTAL, face: 'in', turn: i % 2 ? 25 : -25, s: 3.4 + (i % 3) * 0.5 });
  }

  // at the back: one ring of light crossed by another, spheres hung among them at their own heights, a floor of no colour under them, motes rising from it
  const back = -c.R - 12;
  c.add('px_ring', back, 0, { face: 'front', s: 2.9, tint: [0.76, 0.78, 1], keep: 0.9, walk: true });
  c.add('px_ring', back, 0, { face: 'front', turn: 90, s: 2.9, tint: [0.8, 0.7, 1], keep: 0.9, walk: true });
  for (const [i, [a, cc, y, s]] of ([[0, 0, 8.4, 2.4], [-3.6, 4.2, 12.6, 1.5], [3.4, -4.6, 5.4, 1.1], [-1.4, -6.8, 14.8, 0.9], [2.6, 7, 10.6, 1.2]] as const).entries()) {
    c.add('px_sphere', back + a, cc, { y, s, tint: i % 2 ? [0.76, 0.7, 1] : [0.78, 0.84, 1], keep: 0.9, walk: true, round: true });
  }
  c.add('tp_floor', back, 0, { tint: [0, 0, 0.02], keep: 0, face: 'front', stretch: [16 / 2.4, 0.5, 16 / 2.4], y: 0.05, walk: true });
  c.emit({ at: [back, 0], y: [0.2, 22], r: 8, rate: 4.4, life: [4, 8], size: [0.22, 0.4], colour: [0.8, 0.78, 1], alpha: 0.85, rise: 1.4, drift: 0.5, shape: 'rune', glow: true, spin: 0.4, reach: 140 });
  c.emit({ at: [back, 0], y: [8, 14], r: 3, rate: 2, life: [3, 5], size: [1.6, 3], grow: 1.5, colour: [0.55, 0.5, 0.9], alpha: 0.2, shape: 'wisp', glow: true, reach: 140 });
  for (let i = 0; i < 6; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 6 + 0.1;
    if (bearing(th) < 0.5) continue;
    c.emit({ at: [Math.cos(th) * (G - 8), Math.sin(th) * (G - 8)], y: [0.2, 1.6], r: 6, rate: 1.6, life: [5, 8], size: [2.4, 4], grow: 1.4, colour: [0.5, 0.5, 0.78], alpha: 0.14, drift: 0.3, flow: { x: 0.4, z: -0.3 }, shape: 'wisp', reach: 120 });
  }
  return { outline, ahead: G, outer: 12, fogHeight: 5 };
};
