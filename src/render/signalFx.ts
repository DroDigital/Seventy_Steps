/**
 * What a walled court does now and then (round 75; world/enclosure.ts `Signal`, laid by the places in world/places/): a pulse that runs from
 * one point of the court to the next in turn, a thread of light drawn between them and a puff let go at each, ending in a flare (the notes
 * of the organ, the dancers' round, the arches of the Gate, the corners of the lattice); or an arc that leaps between two of its points
 * (Yaddith's engines). It plays while the investigator is near, the fight or no; a court out of sight does not count its seconds, and one the
 * investigator comes to begins part way through its wait. Render only.
 */

import type { V3 } from '../core/geom';
import { SIGNAL } from '../data/lifeTuning';
import type { Vec3 } from '../data/tuning';
import type { Game } from '../systems/components';
import type { Puff, Signal } from '../world/enclosure';
import { worldLayout } from '../world/placements';
import type { Beams } from './beams';
import { boltPath } from './lightningPath';
import type { Rgb } from './palette';
import type { Particles } from './particles';

export interface SignalFx {
  update(camera: V3, time: number, hidden: boolean): void;
}

interface Run {
  s: Signal;
  x: number;
  z: number;
  radius: number;
  next: number; // seconds: when it begins again (NaN: not counting)
  k: number; // a chase: the next point to reach (-1: not running)
  t0: number; // when it set out
}

const rgb = (c: Vec3): Rgb => [c[0], c[1], c[2]];
const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();
const WHITE: Vec3 = [1, 1, 1];

export function createSignalFx(g: Game, particles: Particles, beams: Beams): SignalFx {
  const runs: Run[] = worldLayout().arenas.flatMap((a) => (a.house?.signals ?? []).map((s) => ({ s, x: a.x, z: a.z, radius: a.radius, next: NaN, k: -1, t0: 0 })));

  const puff = (p: Puff, at: V3): void => {
    for (let i = 0; i < p.count; i++) {
      const th = Math.random() * Math.PI * 2;
      const [dx, dz] = [Math.cos(th) * (p.spread ?? 0) * Math.random(), Math.sin(th) * (p.spread ?? 0) * Math.random()];
      particles.spawn({
        x: at.x + dx * 0.3, y: at.y + Math.random() * 0.6, z: at.z + dz * 0.3, vx: dx, vy: p.rise ?? 0, vz: dz, life: between(p.life), size: between(p.size), grow: 1.4,
        color: rgb(p.colour), ...(p.end && { colorEnd: rgb(p.end) }), alpha: p.alpha, glow: p.glow, shape: p.shape, spin: p.spin,
      });
    }
  };
  const thread = (s: Signal, from: V3, to: V3, life: number): void => {
    if (!s.thread) return;
    beams.bolt(boltPath(from, to, Math.random, { segments: Math.max(4, Math.round(Math.hypot(to.x - from.x, to.z - from.z) / 3)), sway: 0.9, forks: s.kind === 'arc' ? 2 : 0 }), life, s.width ?? 0.3, rgb(s.thread), rgb(s.core ?? WHITE));
  };

  return {
    update(camera, time, hidden) {
      for (const r of runs) {
        if (hidden || !g.overworld || Math.hypot(camera.x - r.x, camera.z - r.z) > SIGNAL.near + r.radius + 40) {
          r.next = NaN; // a court out of sight is not counting its seconds
          r.k = -1;
          continue;
        }
        const s = r.s;
        if (Number.isNaN(r.next)) r.next = time + between(s.every) * Math.random(); // it begins part way through its wait, so arriving is not a signal
        if (s.kind === 'arc') {
          if (time < r.next) continue;
          r.next = time + between(s.every);
          const [i, j] = [Math.floor(Math.random() * s.at.length), Math.floor(Math.random() * (s.at.length - 1))];
          const [a, b] = [s.at[i]!, s.at[j >= i ? j + 1 : j]!];
          thread(s, a, b, SIGNAL.arc);
          if (s.puff) { puff(s.puff, a); puff(s.puff, b); }
          continue;
        }
        if (r.k < 0 && time >= r.next) [r.k, r.t0] = [0, time];
        while (r.k >= 0 && time >= r.t0 + r.k * (s.step ?? 0.4)) {
          const at = s.at[r.k]!;
          if (r.k > 0) thread(s, s.at[r.k - 1]!, at, SIGNAL.thread);
          if (s.puff) puff(s.puff, at);
          if (++r.k >= s.at.length) {
            if (s.last) puff(s.last, s.last.at);
            [r.k, r.next] = [-1, time + between(s.every)];
          }
        }
      }
    },
  };
}
