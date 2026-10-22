/**
 * What a cutscene's beats let loose about someone (playtest round 20; cinema.ts): ash that drifts
 * down, gold motes and embers that rise, stars that stream out from a point and are gone. Each is a
 * handful of the particles the world already has.
 */

import type { BurstKind } from '../data/cutscenes';
import type { Rgb } from './palette';
import type { ParticleShape, Particles } from './particles';

type Kind = BurstKind;

interface Recipe {
  color: readonly Rgb[]; // one at random for each
  size: readonly [number, number]; // metres
  life: readonly [number, number]; // seconds
  rise: readonly [number, number]; // m/s upward
  out: number; // m/s outward (from the middle)
  spread: number; // metres about it it begins
  gravity: number;
  drag: number;
  glow: boolean;
  shape?: ParticleShape; // a disc unless said
  alpha?: number; // at birth (0.9)
  grow?: number; // × its size at death (1.4)
}

const RECIPES: Readonly<Record<Kind, Recipe>> = {
  ash: { color: [[0.78, 0.75, 0.68], [0.6, 0.58, 0.54]], size: [0.05, 0.1], life: [3, 5.5], rise: [0.3, 1.4], out: 0.5, spread: 0.5, gravity: 0.35, drag: 0.7, glow: false },
  motes: { color: [[0.96, 0.82, 0.48], [0.9, 0.7, 0.36]], size: [0.07, 0.12], life: [3, 5], rise: [0.4, 1], out: 0.35, spread: 0.9, gravity: -0.05, drag: 0.4, glow: true },
  embers: { color: [[1, 0.36, 0.12], [0.85, 0.16, 0.08], [1, 0.6, 0.2]], size: [0.06, 0.11], life: [2, 4], rise: [0.8, 2.2], out: 0.5, spread: 0.8, gravity: -0.2, drag: 0.3, glow: true },
  stars: { color: [[0.95, 0.94, 1], [0.7, 0.55, 1], [0.85, 0.8, 1]], size: [0.1, 0.18], life: [2, 3.6], rise: [-0.3, 0.5], out: 2.4, spread: 3.5, gravity: 0, drag: 0.1, glow: true },
  // Round 61: the entrances of the horrors that arrived by their size alone.
  frost: { color: [[0.85, 0.93, 1], [0.7, 0.82, 0.95]], size: [0.05, 0.1], life: [3, 5], rise: [-0.4, 0.2], out: 0.6, spread: 1.6, gravity: 0.25, drag: 0.6, glow: false, shape: 'shard' }, // a cold room's breath, settling
  brine: { color: [[0.72, 0.84, 0.9], [0.86, 0.93, 0.96]], size: [0.08, 0.17], life: [2.4, 4], rise: [0.3, 1.2], out: 0.9, spread: 1.8, gravity: 0, drag: 0.5, glow: false, shape: 'bubble', alpha: 0.8 }, // the sea giving something up
  spores: { color: [[0.66, 0.86, 0.4], [0.82, 0.92, 0.56]], size: [0.1, 0.22], life: [3.5, 5.5], rise: [0.2, 0.7], out: 0.4, spread: 1.4, gravity: -0.05, drag: 0.5, glow: true, shape: 'wisp', alpha: 0.7 }, // a pale growth breathing out
  smoke: { color: [[0.2, 0.2, 0.22], [0.34, 0.33, 0.36]], size: [0.3, 0.6], life: [3, 5], rise: [0.3, 0.9], out: 0.5, spread: 1.2, gravity: -0.05, drag: 0.5, glow: false, shape: 'wisp', alpha: 0.5, grow: 2.2 },
  runes: { color: [[0.86, 0.2, 0.66], [0.52, 0.2, 0.86], [0.3, 1, 0.66]], size: [0.18, 0.3], life: [3, 5], rise: [0.3, 0.9], out: 0.5, spread: 1.7, gravity: -0.05, drag: 0.4, glow: true, shape: 'rune' }, // sigils lifting off the ground, in the anomaly colours
  notes: { color: [[0.96, 0.92, 1], [0.8, 0.7, 1]], size: [0.2, 0.32], life: [3, 5], rise: [0.4, 1.2], out: 1.4, spread: 2.8, gravity: -0.1, drag: 0.3, glow: true, shape: 'note' }, // a thin piping made visible
  eyes: { color: [[1, 0.9, 0.7], [0.9, 0.5, 0.9]], size: [0.22, 0.36], life: [2.6, 4.2], rise: [0, 0.3], out: 1.6, spread: 3.2, gravity: 0, drag: 0.2, glow: true, shape: 'eye' }, // opening, all about
};

const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();

/** `count` of them about `at` (its feet, and how tall it stands): about its middle. */
export function burst(particles: Particles, kind: Kind, at: { x: number; y: number; z: number }, height: number, count: number): void {
  const r = RECIPES[kind];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const [dx, dz] = [Math.cos(a), Math.sin(a)];
    const reach = Math.random() * r.spread;
    particles.spawn({
      x: at.x + dx * reach,
      y: at.y + height * (0.25 + 0.6 * Math.random()),
      z: at.z + dz * reach,
      vx: dx * r.out * Math.random(),
      vy: between(r.rise),
      vz: dz * r.out * Math.random(),
      life: between(r.life),
      size: between(r.size),
      grow: r.grow ?? 0.4,
      color: r.color[Math.floor(Math.random() * r.color.length)],
      alpha: r.alpha ?? 0.9,
      ...(r.shape && { shape: r.shape }),
      glow: r.glow,
      gravity: r.gravity,
      drag: r.drag,
    });
  }
}
