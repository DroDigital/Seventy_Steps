/**
 * The shots of made things and of the night (round 69; data/shotForms.ts): iron, wax, brass and gold a sorcerer's hands once held,
 * and a moon, a note, reeds, an ankh and a poppy. Each is in its own frame, flying toward +z, about two units long. Render only:
 * geometry.
 */

import * as THREE from 'three';
import { around, ball, BODY, BREATHE, DARK, FLAP, gem, HOT, limb, PALE, plate, ring, rock, rod, slab, solid } from './shotKit';

/** Hutchinson's chain: two iron links, one turned on the other, rimed with frost. */
export const chainlink = (): THREE.BufferGeometry =>
  solid([
    ring(0.55, 0.15, BODY, [0, 0, -0.45], [0, 0, 0], [0.75, 1.3, 1]),
    ring(0.55, 0.15, PALE, [0, 0, 0.45], [0, Math.PI / 2, 0], [0.75, 1.3, 1]),
    ...[[0, 0.78, -0.45], [0, -0.78, -0.45], [0, 0.78, 0.45], [0.25, -0.78, 0.45]].map((p) => ball(0.12, HOT, p as [number, number, number])),
  ]);

/** Akeley's wax cylinder: grooved, banded with a paper label, a dark bore through it. */
export const cylinder = (): THREE.BufferGeometry =>
  solid([
    rod(0.55, 0.55, 1.5, BODY, [0, 0, 0], [0, 0, 0], 0, 8),
    rod(0.28, 0.28, 1.56, DARK, [0, 0, 0], [0, 0, 0], 0, 8),
    ...[-0.6, -0.3, 0.3, 0.6].map((z) => ring(0.56, 0.05, DARK, [0, 0, z], [0, 0, 0], [1, 1, 1], 8)),
    ring(0.58, 0.08, PALE, [0, 0, 0], [0, 0, 0], [1, 1, 1], 8),
  ]);

/** Muñoz's pump: a cog with frosted teeth and a dark hub. */
export const cog = (): THREE.BufferGeometry =>
  solid([
    rod(0.8, 0.8, 0.34, BODY, [0, 0, 0], [0, 0, 0], 0, 8),
    ...around(8, (a) => slab(0.3, 0.32, 0.34, PALE, [Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0], [0, 0, a])),
    rod(0.26, 0.26, 0.5, DARK),
    ...around(4, (a) => ball(0.1, HOT, [Math.cos(a + 0.4) * 0.55, Math.sin(a + 0.4) * 0.55, 0.18])),
  ]);

/** The Terrible Old Man's Spanish gold: a thick coin, a milled rim, a cross struck on its face. */
export const coin = (): THREE.BufferGeometry =>
  solid([
    rod(0.9, 0.9, 0.18, BODY, [0, 0, 0], [0, 0, 0], 0, 10),
    ring(0.9, 0.07, PALE, [0, 0, 0], [0, 0, 0], [1, 1, 1], 10),
    slab(0.12, 0.6, 0.06, PALE, [0, 0, 0.1]),
    slab(0.6, 0.12, 0.06, PALE, [0, 0, 0.1]),
    ball(0.14, HOT, [0, 0, 0.13]),
  ]);

/** Zkauba's Silver Key: a bow set with a bright stone, a shaft, a collar, a bit of two teeth. */
export const key = (): THREE.BufferGeometry =>
  solid([
    ring(0.46, 0.11, PALE, [0, 0, -1.15], [0, 0, 0], [1, 1, 1], 10),
    ball(0.14, HOT, [0, 0, -1.15]),
    ...[-1, 1].map((s) => ball(0.17, PALE, [s * 0.48, 0, -1.15])),
    rod(0.1, 0.1, 1.9, BODY, [0, 0, 0.05]),
    ring(0.16, 0.06, DARK, [0, 0, -0.6]),
    slab(0.46, 0.14, 0.18, PALE, [0.27, 0, 0.78]),
    slab(0.34, 0.14, 0.18, PALE, [0.22, 0, 0.42]),
  ]);

/** A torch of the Cavern of Flame: a charred head, flames streaming back off it, a stick for a grip. */
export const brand = (): THREE.BufferGeometry =>
  solid([
    rod(0.14, 0.12, 2.2, BODY, [0, 0, -0.55]),
    rock(0.45, DARK, [0, 0, 0.85], [1, 1, 1.1], 5, 0.2),
    ball(0.4, HOT, [0, 0.2, 0.55], [0.8, 1.1, 1.8], BREATHE),
    ball(0.3, BODY, [0.15, 0.45, 0.1], [0.7, 1, 1.9], BREATHE),
    ball(0.26, BODY, [-0.15, 0.4, -0.3], [0.7, 1, 2], BREATHE),
  ]);

/** Lilith's Black Moon: a crescent blade, its horns tipped with light. */
export const crescent = (): THREE.BufferGeometry => {
  const [e, c] = [0.6, 0.35];
  const [tx, ty] = [Math.cos(e), Math.sin(e)];
  const inner = Math.hypot(tx - c, ty);
  const lower = Math.atan2(-ty, tx - c);
  const shape = new THREE.Shape();
  for (let i = 0; i <= 12; i++) {
    const a = e + ((Math.PI * 2 - 2 * e) * i) / 12;
    if (i) shape.lineTo(Math.cos(a), Math.sin(a));
    else shape.moveTo(Math.cos(a), Math.sin(a));
  }
  const upper = Math.atan2(ty, tx - c) - Math.PI * 2;
  for (let i = 1; i <= 12; i++) {
    const a = lower + ((upper - lower) * i) / 12;
    shape.lineTo(c + Math.cos(a) * inner, Math.sin(a) * inner);
  }
  return solid([plate(shape, 0.3, BODY), ball(0.17, HOT, [tx, ty, 0]), ball(0.17, HOT, [tx, -ty, 0])]);
};

/** Zann's viol: two eighth notes, beamed. */
export const note = (): THREE.BufferGeometry =>
  solid([
    ball(0.46, BODY, [-0.65, -0.8, 0], [1, 0.75, 0.6]),
    ball(0.46, BODY, [0.55, -0.6, 0], [1, 0.75, 0.6]),
    slab(0.12, 1.75, 0.12, BODY, [-0.27, 0.05, 0]),
    slab(0.12, 1.75, 0.12, BODY, [0.83, 0.25, 0]),
    slab(1.25, 0.24, 0.12, HOT, [0.28, 0.95, 0], [0, 0, -0.12]),
  ]);

/** The Daemon Pipers' reeds: five pipes tied in a raft, each mouth lit. */
export const panpipe = (): THREE.BufferGeometry =>
  solid([
    ...[0, 1, 2, 3, 4].flatMap((i) => {
      const len = 1.0 + 0.3 * i;
      const x = (i - 2) * 0.38;
      return [rod(0.16, 0.16, len, i % 2 ? BODY : PALE, [x, 0, -1 + len / 2]), rod(0.12, 0.12, 0.08, HOT, [x, 0, -1 + len])];
    }),
    slab(2.0, 0.12, 0.14, DARK, [0, 0, -0.55]),
    slab(2.0, 0.12, 0.14, DARK, [0, 0, 0.1]),
  ]);

/** Nyarlathotep's ankh: a loop above a crossbar and a stem, a jewel in the loop. */
export const ankh = (): THREE.BufferGeometry =>
  solid([
    ring(0.42, 0.12, BODY, [0, 0.75, 0], [0, 0, 0], [1, 1.15, 1], 10),
    slab(1.2, 0.22, 0.18, BODY, [0, 0.15, 0]),
    slab(0.22, 1.4, 0.18, BODY, [0, -0.55, 0]),
    ball(0.17, HOT, [0, 0.75, 0]),
    gem(0.15, PALE, [0, -1.3, 0], [1, 1.4, 1]),
  ]);

/** Hypnos' poppy: two rings of petals about a dark seed-head ringed with stamens. */
export const poppy = (): THREE.BufferGeometry =>
  solid([
    ...around(5, (a) => ball(0.62, BODY, [Math.cos(a) * 0.62, Math.sin(a) * 0.62, -0.3], [1, 0.8, 0.26], FLAP)),
    ...around(5, (a) => ball(0.4, PALE, [Math.cos(a + 0.63) * 0.34, Math.sin(a + 0.63) * 0.34, -0.05], [1, 0.8, 0.3], FLAP)),
    ball(0.24, DARK, [0, 0, 0.08]),
    ...around(6, (a) => ball(0.07, HOT, [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.15])),
  ]);

/** Hastur's Yellow Sign: three arms curling out of a bright heart, each tipped with light. */
export const sign = (): THREE.BufferGeometry =>
  solid([
    ball(0.3, HOT, [0, 0, 0.05]),
    ...around(3, (a) => {
      const pts: [number, number, number][] = [0, 1, 2, 3, 4].map((i) => [Math.cos(a + i * 0.34) * (0.2 + i * 0.22), Math.sin(a + i * 0.34) * (0.2 + i * 0.22), 0]);
      return solid([...[0, 1, 2, 3].map((i) => limb(pts[i]!, pts[i + 1]!, 0.17 - i * 0.025, 0.14 - i * 0.025, i === 3 ? PALE : BODY)), ball(0.13, HOT, pts[4]!)]);
    }),
  ]);

/** The Ancient Ones' seal: a slab of cyclopean masonry, edged in dark, a rune burning on its face. */
export const tablet = (): THREE.BufferGeometry =>
  solid([
    slab(1.3, 1.8, 0.28, BODY),
    ...[-1, 1].map((s) => slab(0.12, 1.8, 0.32, DARK, [s * 0.7, 0, 0])),
    slab(0.12, 0.95, 0.05, HOT, [0, -0.05, 0.16]),
    slab(0.62, 0.12, 0.05, HOT, [0, 0.22, 0.16]),
    ring(0.2, 0.05, HOT, [0, 0.62, 0.16], [0, 0, 0], [1, 1, 1], 8),
    gem(0.2, PALE, [0.45, 0.95, 0], [1, 0.7, 0.6]),
  ]);
