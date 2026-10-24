/**
 * The summit of Hatheg-Kla (round 71; pack 16's hexagonal crags, a ring and spheres of light made in code, docs/BOSS_PLACES.md): a ring of peaks of three heights
 * set shoulder to shoulder about the fight, closed but for the way between two carved spires, standing out of cloud; within them a ring of tall carved stones,
 * and at the back three rings of pale light stood one behind the other, with a sphere hanging in them, a light that has no source. Cloud lies on the
 * floor and the boulders in it, and higher, in banks beyond the peaks. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, polar } from './common';

const PEAK: Put = { tint: [0.56, 0.54, 0.66], keep: 0.55 };
const CARVED: Put = { tint: [0.66, 0.64, 0.74], keep: 0.4 };
const SOLID = ['hx_mountain', 'hx_hill', 'hx_rocks', 'hx_mountain'] as const;

export const othergods: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const ring = G - 3; // the peaks' middle line
  const step = 0.4; // radians between peaks: their breadth (15 m at 1.9) is a little more than the 15.6 m it covers at this radius
  const jamb = h.gate.width / 2 + 0.05; // the spires' inner edge: an opening exactly the gate's, whatever turns a crag's box (a box turned out is wider than the crag)
  const first = Math.asin((jamb + 16 + 2.4) / ring); // the first peak's middle: clear of the spire's own box

  // the peaks: from either side of the gate round to the back, three heights; the outline is the ring they stand on
  for (const side of [-1, 1]) {
    for (let k = 0; ; k++) {
      const th = first + k * step;
      if (th > Math.PI + 0.12) break;
      if (side > 0 && th > Math.PI - 0.12) break; // (the two sides meet at the back; one places the last)
      const [a, cc] = [Math.cos(th) * ring, side * Math.sin(th) * ring];
      const id = SOLID[(k + (side > 0 ? 1 : 0)) % 4]!;
      c.add(id, a, cc, { ...PEAK, face: 'out', s: id === 'hx_mountain' ? 1.9 + (k % 3) * 0.2 : id === 'hx_hill' ? 2.1 : 2.3, jitter: 0.5, turn: (k * 23) % 40 - 20 });
    }
  }
  // the carved spires either side of the way in
  for (const side of [-1, 1]) {
    c.add('hx_tower', G + 3, side * (jamb + 8), { ...CARVED, face: 'front', s: 2.0 }); // (square to the way in: its box's inner edge is the gate's, and it stands forward of the stake and the candle)
    c.add('px_obelisk', G + 14.5, side * (jamb + 2.6), { ...CARVED, s: 0.8, jitter: 0.2 });
  }
  // the ring of carved stones about the fight, three heights, and boulders of the summit between them and the peaks
  for (let i = 0; i < 11; i++) {
    const th = (i + 0.5) * ((2 * Math.PI) / 11);
    c.add('px_obelisk', Math.cos(th) * (c.R + 6.2), Math.sin(th) * (c.R + 6.2), { ...CARVED, height: 8 + (i % 3) * 2.4, s: 0.9 });
  }
  for (let i = 0; i < 18; i++) {
    const th = (i + 0.4) * ((2 * Math.PI) / 18);
    if (bearing(th) < 0.45) continue;
    c.add(`st_rock_${[1, 3, 4, 5][i % 4]}`, Math.cos(th) * (c.R + 9 + (i % 3) * 1.4), Math.sin(th) * (c.R + 9 + (i % 3) * 1.4), { ...PEAK, s: 2.6 + (i % 3) * 0.7, jitter: 1.2, turn: i * 47 });
  }

  // at the back: three rings of light, the greater behind, and a sphere hung in them
  for (const [i, [a, s]] of ([[-c.R - 8, 2.3], [-c.R - 11.4, 1.8], [-c.R - 14.2, 1.3]] as const).entries()) c.add('px_ring', a, 0, { face: 'front', s, tint: [0.78, 0.8, 1], keep: 0.9, walk: i > 0 });
  c.add('px_sphere', -c.R - 10, 0, { y: 4.4, s: 1.5, tint: [0.84, 0.86, 1], keep: 0.9, walk: true, round: true });

  // cloud on the summit's floor, and in banks beyond the peaks; the sphere's light
  c.emit({ at: [0, 0], y: [0.2, 2.4], r: c.R + 4, rate: 7, life: [6, 10], size: [3.4, 6], grow: 1.5, colour: [0.78, 0.8, 0.92], alpha: 0.14, drift: 0.5, flow: { x: 0.6, z: 0.4 }, shape: 'wisp', reach: 110 });
  for (let i = 0; i < 6; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 6;
    c.emit({ at: [Math.cos(th) * (ring + 12), Math.sin(th) * (ring + 12)], y: [4, 16], r: 9, rate: 2.4, life: [8, 13], size: [8, 14], grow: 1.3, colour: [0.74, 0.76, 0.9], alpha: 0.13, drift: 0.4, flow: { x: -0.4, z: 0.3 }, shape: 'wisp', reach: 140 });
  }
  c.emit({ at: [-c.R - 10, 0], y: [2, 7], r: 3.4, rate: 5, life: [3, 5], size: [0.1, 0.2], colour: [0.85, 0.88, 1], alpha: 0.9, rise: 0.25, drift: 0.5, shape: 'spark', glow: true, reach: 110 });
  return { outline: polar((th) => (bearing(th) < 0.01 ? G : ring + 0.5), 36).map(([a, cc], i) => (i === 0 ? [G, 0] : [a, cc]) as [number, number]), ahead: G, outer: 10, fogHeight: 5 };
};
