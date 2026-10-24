/**
 * The serpent's coil of Yig (round 71; pack 08's sandstone for the shrine, a length of snake and fangs made in code, docs/BOSS_PLACES.md): the wall is the
 * body of an enormous serpent, ridged along its back, lying in a ring that swells and tightens, its head at the gate. The head is a jaw: two arms of the
 * body flare out from the gate, a row of fangs along the inside of each, two great teeth either side of the way in, and the gate's own door is the
 * teeth of the lower jaw meeting those hung from the upper. In the coil, at the back, stands a shrine of the old sandstone: a raised floor, four columns
 * carrying a beam, a totem, a stone cobra coiled on its post (Animex's snake statue), with masks in the serpent's colours, offerings of bone and a brazier. Dust walks the ground, drifts pile on the wall's far
 * side. The fog is held low so the coil shows over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, column, polar, wallAbout } from './common';

const SCALE: Put = { tint: [0.6, 0.55, 0.38], keep: 0.55 };
const SAND: Put = { tint: [0.78, 0.66, 0.46], keep: 0.4 };

export const yig: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const near = (th: number): number => Math.cos(bearing(th) / 2) ** 6;
  const r = (th: number): number => G - 5 + 5 * near(th) + 3.2 * Math.sin(5 * th) * (1 - near(th));
  const pts = polar(r, 40);
  const gate = h.gate.width / 2 + 0.7;

  // the body, sunk a little into the ground, and the dunes it has gathered on its far side
  wallAbout(c, 'px_serpent', pts, gate, { ...SCALE, y: -0.55, lap: 0.5 });
  for (const [i, th] of [0.7, 1.35, 2.0, 2.7, 3.4, 4.1, 4.9, 5.6].entries()) c.add('px_dune', Math.cos(th) * (r(th) + 7.5), Math.sin(th) * (r(th) + 7.5), { ...SAND, face: 'out', turn: 90, s: 1.0 + (i % 3) * 0.3, walk: true });

  // the head: two arms of the body flaring from the gate, fangs along the inside of each, a great tooth either side of the way in
  for (const side of [-1, 1]) {
    c.run('px_serpent', [G + 0.4, side * (gate + 0.5)], [G + 13, side * (gate + 10)], { ...SCALE, y: -0.5, s: 0.8, lap: 0.4 });
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.7) / 5.4;
      c.add('px_fang', G + 0.4 + 12.6 * t, side * (gate + 0.5 + 9.5 * t - 2.1), { tint: [0.85, 0.82, 0.7], keep: 0.9, face: 'front', turn: side * -25, s: 1.1 + (i % 2) * 0.4 });
    }
    c.add('px_fang_big', G + 0.2, side * (gate + 2.1), { tint: [0.85, 0.82, 0.7], keep: 0.9, face: 'front', turn: side * 90, s: 1.15 });
    c.add('px_sphere', G + 13.5, side * (gate + 10.2), { tint: [0.8, 0.9, 0.3], keep: 0.4, s: 0.9, y: 2.3, round: true, walk: true });
  }

  // the shrine in the coil: a raised floor, stairs from the court, four columns and a beam, a totem of masks, bones and a brazier
  const [b, w] = [-r(Math.PI) + 3.4, 7]; // the floor's back edge; its half-breadth
  c.add('tp_floor', b + 3.2, 0, { ...SAND, stretch: [(w * 2) / 2.4, 2, 2.67], face: 'front', y: 0 });
  c.add('tp_stairs', b + 7.7, 0, { ...SAND, face: 'front', turn: 180, stretch: [3.2, 0.34, 0.4], walk: true });
  for (const [a, cc] of [[b + 0.9, -w + 0.9], [b + 0.9, w - 0.9], [b + 5.5, -w + 0.9], [b + 5.5, w - 0.9]] as const) column(c, a, cc, 1, { ...SAND, y: 0.96, s: 0.9 });
  c.run('tp_beam', [b + 0.9, -w + 0.4], [b + 0.9, w - 0.4], { ...SAND, y: 6.0 });
  c.run('tp_beam', [b + 5.5, -w + 0.4], [b + 5.5, w - 0.4], { ...SAND, y: 6.0 });
  c.add('yg_snake', b + 3.2, 0, { ...SAND, y: 0.96, face: 'front', keep: 0.5, s: 0.85 }); // the totem: the stone cobra coiled on its post, its hood raised to the court
  for (const side of [-1, 1]) c.add('px_mask', b + 1.4, side * 4.8, { y: 4.4, face: 'front', s: 1.5, tint: [0.88, 0.8, 0.55], keep: 0.7, walk: true });
  for (const side of [-1, 1]) {
    c.add('px_brazier', b + 4.6, side * 4.2, { y: 0.96, tint: [0.4, 0.34, 0.28], keep: 0.5, s: 1.3, lit: 'fire' });
    c.add('tp_flag_stars', b + 1.4, side * 3.2, { y: 3.4, face: 'front', s: 1.3, walk: true });
    c.add('bn_pile_skull', b + 5.2, side * 1.9, { y: 0.96, s: 1.4, jitter: 0.3, walk: true });
  }
  for (const [a, cc] of [[b + 3.4, 5.2], [b + 2.2, -5.2], [b + 4.6, 0.6]] as const) c.add('bn_ribcage', a, cc, { y: 0.96, s: 1.6, jitter: 0.5, face: 'front', turn: a * 31, walk: true });
  const out = b + 9.6; // the court before the shrine: bones where they were left, the settlers' wagon
  for (const [i, [a, cc]] of ([[out, -9.4], [out + 3, 11], [out + 1.4, 3], [out + 6, -3]] as const).entries()) c.add(i % 2 ? 'bn_spine' : 'bn_leg', a, cc, { s: 1.6, jitter: 1, face: 'front', turn: i * 49, walk: true });
  c.add('rn_cart', out + 4, -14.5, { yaw: 2.2, s: 1.2, tint: [0.4, 0.34, 0.28], keep: 0.5 });
  c.add('rn_barrel', out + 4.8, -17.3, { s: 1.3, jitter: 0.4, tint: [0.4, 0.34, 0.28], keep: 0.5 });

  // what stirs: dust walking along the ground, embers at the braziers, a green breath at the head's eyes
  c.emit({ at: [-r(Math.PI) + 6, -14], to: [G - 12, -14], y: [0.2, 2.2], rate: 3.4, life: [4, 7], size: [1.6, 2.8], grow: 1.4, colour: [0.74, 0.6, 0.4], alpha: 0.2, drift: 0.3, flow: { x: 0.9, z: 0.2 }, shape: 'wisp', reach: 100 });
  c.emit({ at: [b + 4.6, -4.2], to: [b + 4.6, 4.2], y: [1.6, 3.4], rate: 2.6, life: [2, 3.6], size: [0.1, 0.16], colour: [1, 0.6, 0.25], alpha: 0.9, rise: 0.8, drift: 0.3, shape: 'spark', glow: true, reach: 90 });
  for (const side of [-1, 1]) c.emit({ at: [G + 13.5, side * (gate + 10.2)], y: [2.2, 3.4], r: 0.5, rate: 3, life: [2, 3.5], size: [0.5, 1], grow: 1.6, colour: [0.55, 0.85, 0.35], alpha: 0.4, rise: 0.5, shape: 'wisp', glow: true, reach: 100 });
  return { outline: pts, ahead: G, outer: 12, fogHeight: 3.6 };
};
