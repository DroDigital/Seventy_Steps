/**
 * The summit of Hatheg-Kla (round 71; pack 16's hexagonal crags, a ring and spheres of light made in code, docs/BOSS_PLACES.md; round 75: carved monoliths, cairns, three
 * twisted spires that draw the storm, a dais, and the dance of the Other Gods): a ring of peaks of three heights set shoulder to shoulder about the fight, closed but for the way
 * between two carved spires, standing out of cloud; within them a ring of eleven tall monoliths cut with a glyph that is lit, cairns of the summit's stones between them and the
 * peaks, and four spires of twisted stone, taller than anything, on which the lightning falls; at the back, on a hexagonal dais, three rings of pale light stood one behind the
 * other, with a sphere hanging in them, a light that has no source. Now and then a light runs from one monolith to the next about the ring, the Other Gods dancing, and ends in
 * the sphere. Cloud lies on the floor and the boulders in it, and higher, in banks beyond the peaks. Pure: no Three.js.
 */

import type { V3 } from '../../core/geom';
import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, polar, sky } from './common';

const PEAK: Put = { tint: [0.56, 0.54, 0.66], keep: 0.55 };
const CARVED: Put = { tint: [0.66, 0.64, 0.74], keep: 0.4 };
const SOLID = ['hx_mountain', 'hx_hill', 'hx_rocks', 'hx_mountain'] as const;
const LIGHT = [0.8, 0.84, 1] as const;
const DAIS = 0.94 * 1.7 * 0.25; // metres: the dais's top
const SPIRE = 26; // metres: the spires' height, the highest thing in the court, where the lightning falls

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

  // the ring of monoliths about the fight, three heights, a glyph lit on each; the dance runs from one to the next
  const N = 11;
  const dance: V3[] = [];
  for (let i = 0; i < N; i++) {
    const th = (i + 0.5) * ((2 * Math.PI) / N);
    const [a, cc, tall] = [Math.cos(th) * (c.R + 6.2), Math.sin(th) * (c.R + 6.2), 8 + (i % 3) * 2.4];
    c.add('px_monolith', a, cc, { ...CARVED, height: tall, s: 0.9 });
    dance.push(sky(c, a, cc, tall + 0.4));
  }
  // cairns and boulders of the summit between the monoliths and the peaks
  for (let i = 0; i < 18; i++) {
    const th = (i + 0.4) * ((2 * Math.PI) / 18);
    if (bearing(th) < 0.45) continue;
    const [a, cc] = [Math.cos(th) * (c.R + 9 + (i % 3) * 1.4), Math.sin(th) * (c.R + 9 + (i % 3) * 1.4)];
    if (i % 3 === 0) c.add('px_cairn', a, cc, { ...PEAK, s: 1.6 + (i % 2) * 0.5, jitter: 0.8, turn: i * 47 });
    else c.add(`st_rock_${[1, 3, 4, 5][i % 4]}`, a, cc, { ...PEAK, s: 2.6 + (i % 3) * 0.7, jitter: 1.2, turn: i * 47 });
  }

  // four spires of twisted stone, taller than the peaks they stand before, at the sides and the back's corners: the storm falls on them
  const rods: V3[] = [];
  for (const th of [Math.PI * 0.52, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.48]) {
    const [a, cc] = [Math.cos(th) * (c.R + 17), Math.sin(th) * (c.R + 17)];
    c.add('px_spire', a, cc, { ...CARVED, height: SPIRE, s: 1.3 });
    rods.push(sky(c, a, cc, SPIRE));
  }

  // at the back, on a hexagonal dais: three rings of light, the greater behind, and a sphere hung in them
  c.add('px_dais', -c.R - 11, 0, { ...CARVED, face: 'front', s: 1.7, stretch: [1, 0.25, 1], walk: true }); // (low enough to walk over)
  const [rings, sphere] = [[[-c.R - 8, 2.3], [-c.R - 11.4, 1.8], [-c.R - 14.2, 1.3]] as const, sky(c, -c.R - 10, 0, 4.4 + DAIS + 1.5)];
  for (const [i, [a, s]] of rings.entries()) c.add('px_ring', a, 0, { y: DAIS, face: 'front', s, tint: [0.78, 0.8, 1], keep: 0.9, walk: i > 0 });
  c.add('px_sphere', -c.R - 10, 0, { y: 4.4 + DAIS, s: 1.5, tint: [0.84, 0.86, 1], keep: 0.9, walk: true, round: true });

  // cloud on the summit's floor, and in banks beyond the peaks; the sphere's light, and what clings to the spires' points
  c.emit({ at: [0, 0], y: [0.2, 2.4], r: c.R + 4, rate: 7, life: [6, 10], size: [3.4, 6], grow: 1.5, colour: [0.78, 0.8, 0.92], alpha: 0.14, drift: 0.5, flow: { x: 0.6, z: 0.4 }, shape: 'wisp', reach: 110 });
  for (let i = 0; i < 6; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 6;
    c.emit({ at: [Math.cos(th) * (ring + 12), Math.sin(th) * (ring + 12)], y: [4, 16], r: 9, rate: 2.4, life: [8, 13], size: [8, 14], grow: 1.3, colour: [0.74, 0.76, 0.9], alpha: 0.13, drift: 0.4, flow: { x: -0.4, z: 0.3 }, shape: 'wisp', reach: 140 });
  }
  c.emit({ at: [-c.R - 10, 0], y: [2.5, 8], r: 3.4, rate: 5, life: [3, 5], size: [0.1, 0.2], colour: [0.85, 0.88, 1], alpha: 0.9, rise: 0.25, drift: 0.5, shape: 'spark', glow: true, reach: 110 });
  for (const tip of rods) {
    const [a, cc] = [(tip.x - c.s.x) * c.f.x + (tip.z - c.s.z) * c.f.z, (tip.x - c.s.x) * c.l.x + (tip.z - c.s.z) * c.l.z];
    c.emit({ at: [a, cc], y: [SPIRE - 0.5, SPIRE + 0.4], r: 0.3, rate: 5, life: [0.6, 1.2], size: [0.15, 0.3], grow: 0.4, colour: [0.75, 0.82, 1], alpha: 0.9, drift: 0.9, shape: 'spark', glow: true, reach: 130 });
  }

  // the dance: a light runs from one monolith's top to the next about the ring, and ends in the sphere
  const puff = { shape: 'ring', count: 2, size: [0.8, 1.2], life: [0.9, 1.4], colour: LIGHT, alpha: 0.8, glow: true } as const;
  const signals = [{ kind: 'chase', at: dance, every: [9, 16], step: 0.28, thread: LIGHT, core: [1, 1, 1], width: 0.22, puff, last: { ...puff, shape: 'spark', count: 40, size: [0.15, 0.3], life: [1, 2], spread: 5, rise: 1.2, at: sphere } }] as const;
  return { outline: polar((th) => (bearing(th) < 0.01 ? G : ring + 0.5), 36).map(([a, cc], i) => (i === 0 ? [G, 0] : [a, cc]) as [number, number]), ahead: G, outer: 10, rods, signals, fogHeight: 5 };
};
