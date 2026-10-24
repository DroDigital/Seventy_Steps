/**
 * The court of Azathoth (round 71; the posed and blinded bodies of pack 13, pack 08's wall stone, docs/BOSS_PLACES.md): thirteen dancers ten metres
 * tall stand round the fight on a low black wall, hand to hand in a circle that turns without their moving, each of one of four bodies drawn out a different
 * way, none with a face, an eyeless egg where it was; they turn the same way about it and their number is the one a court keeps. Between two of them, at the front, the way in. A
 * small cold light hangs over each head. The floor has no colour; low clouds of nothing cross it, and white embers fall. The fog is held low so the dancers show
 * over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, polar, wallAbout } from './common';

const BLACK: Put = { tint: [0.2, 0.19, 0.28], keep: 0.3 };
const DANCERS = ['fg_dance_a', 'fg_dance_c', 'fg_dance_b', 'fg_dance_d'] as const;

export const azathoth: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const near = (th: number): number => Math.cos(bearing(th) / 2) ** 10;
  const r = (th: number): number => G - 3 + 3 * near(th);
  const pts = polar(r, 48);
  const gate = h.gate.width / 2 + 0.9;
  wallAbout(c, 'tp_wall_mid', pts, gate, { ...BLACK, stretch: [1, 2, 6], height: 4.4, lap: 0.4 });

  // thirteen, between the front's two: of four bodies, each drawn out its own way, all turned the same way about the ring
  for (let i = 0; i < 13; i++) {
    const th = ((i + 0.5) * 2 * Math.PI) / 13;
    const k = ((i * 5) % 7) / 6;
    const [a, cc] = [Math.cos(th) * (r(th) - 0.4), Math.sin(th) * (r(th) - 0.4)];
    const [s, tall] = [4.9 + (i % 4) * 0.4, 1 + (1 - k) * 0.25];
    c.add(DANCERS[i % 4]!, a, cc, { tint: [0.46 - k * 0.1, 0.44, 0.62 + k * 0.1], keep: 0.5, y: 4.2, face: 'in', turn: 90 + ((i * 29) % 40) - 20, s, stretch: [1.4 + k * 0.4, tall, 1.4 - k * 0.2], walk: true });
    c.add('px_sphere', a * 0.97, cc * 0.97, { y: 4.2 + 2.6 * s * tall + 1.4 + (i % 3) * 1.2, s: 0.6, tint: [0.78, 0.8, 1], keep: 0.9, walk: true, round: true });
  }

  // posts of black stone either side of the way in
  for (const side of [-1, 1]) c.add('px_obelisk', G + 1.5, side * (gate + 3.8), { ...BLACK, s: 1.3, face: 'front' });

  // what crosses the floor: low clouds of nothing, a white ember falling, a cold light at the gate
  c.emit({ at: [0, 0], y: [0.1, 2], r: c.R + 8, rate: 7, life: [6, 10], size: [4, 7], grow: 1.6, colour: [0.2, 0.18, 0.3], alpha: 0.2, drift: 0.5, flow: { x: 0.5, z: 0.4 }, shape: 'wisp', reach: 150 });
  c.emit({ at: [0, 0], y: [8, 24], r: c.R + 10, rate: 5, life: [5, 8], size: [0.1, 0.18], colour: [1, 0.95, 0.95], alpha: 0.8, rise: -1.2, drift: 0.4, shape: 'spark', glow: true, reach: 150 });
  c.emit({ at: [G - 3, 0], y: [0.6, 5], r: 3, rate: 2.4, life: [3, 5], size: [0.16, 0.3], colour: [0.8, 0.82, 1], alpha: 0.7, rise: 0.4, drift: 0.4, shape: 'rune', glow: true, spin: 0.5, reach: 120 });
  return { outline: pts, ahead: G, outer: 12, fogHeight: 4 };
};
