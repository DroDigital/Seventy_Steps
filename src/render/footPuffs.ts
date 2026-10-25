/**
 * What a heel kicks up at a run (round 80): snow powder, dust, sand, leaves, flecks of mud, the spray of the shallows, drawn from the
 * ground the foot came down on (data/bodyTuning.ts PUFFS). Pure: render/atm/steps.ts hands what it makes to the shared particles.
 */

import { PUFFS, PUFF_OF, STEPS } from '../data/bodyTuning';
import type { Footfall } from './footfalls';
import type { ParticleSpec } from './particles';

const between = (r: readonly [number, number], u: number): number => r[0] + (r[1] - r[0]) * u;

/** The specs of one footfall, none below a run (a walk kicks up nothing). `rand` draws 0..1; `wet`, how soaked the ground is (dust turns darker, and heavier, in it). */
export function puffsOf(f: Footfall, wet: number, rand: () => number): ParticleSpec[] {
  const kind = PUFF_OF[f.ground];
  if (!kind || f.speed < STEPS.puffs.speed) return [];
  const p = PUFFS[kind];
  const out: ParticleSpec[] = [];
  const n = Math.round(between(p.n, rand()) * Math.min(1.4, f.speed / 4.5)); // a sprint kicks more than a trot
  const damp = kind === 'dust' || kind === 'sand' ? 1 - 0.4 * wet : 1;
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const side = between(p.out, rand());
    out.push({
      x: f.x, y: f.y + 0.06, z: f.z,
      vx: Math.cos(a) * side - Math.sin(f.yaw) * f.speed * 0.15, vy: between(p.up, rand()), vz: Math.sin(a) * side - Math.cos(f.yaw) * f.speed * 0.15, // (it is left behind the heel)
      life: between(p.life, rand()), size: between(p.size, rand()), grow: p.grow,
      color: [p.color[0] * damp, p.color[1] * damp, p.color[2] * damp], alpha: p.alpha, shape: p.shape,
      gravity: p.gravity, drag: p.drag, spin: p.spin ? (rand() * 2 - 1) * p.spin : undefined, floor: p.settle ? f.y : undefined,
    });
  }
  return out;
}
