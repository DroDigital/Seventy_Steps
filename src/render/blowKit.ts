/**
 * The vocabulary of a quiet blow (round 89, render only; data/foeBlows.ts, data/foeTuning.ts `FOE_FX`): what a creature that is not one of the
 * horrors draws where its blow falls. A graphic `mark` (twelve of them, `blowMarks.ts`), moved by its `tempo` (snap, drag, bloom, settle, flutter,
 * pulse: how long it lives, how it grows, whether its strokes come one after another, whether it comes twice a beat apart) in the blow's three
 * hues, and at most a few specks of `matter` (`blowMatter.ts`). Nothing here knows the game: a kit takes the particles, the ground's decals and
 * a clock, and is told what to draw and how many particles it may spend; `foeFx.ts` asks the crowd (`foeCrowd.ts`) how many that is.
 * Strokes that come a beat apart wait in a small queue the clock drains (`drain`).
 */

import type { V3 } from '../core/geom';
import type { FoeBlow, Mark } from '../data/foeBlows';
import { FOE_FX } from '../data/fxTuning';
import { mote, riser, specks } from './blowMatter';
import { RECIPES, type Blot } from './blowMarks';
import { createPen, toneOf, type Pen } from './blowPen';
import type { GroundFx } from './groundFx';
import { markCell, type Particles } from './particles';

export type { Blot } from './blowMarks';

export interface BlowKit {
  /** Draws `which` (the creature's mark, its accent, or any other) as its tempo says, in at most `b.parts` particles; how many it spends (a ripple, which is a decal, counts as one). */
  mark(blow: FoeBlow, which: Mark, b: Blot): number;
  /** `n` specks of the blow's matter thrown from `at`, scattered about `dir` (all round for none). */
  specks(blow: FoeBlow, at: V3, n: number, dir?: { x: number; z: number }): number;
  /** A mote drawn in from `from` to `to`; a mote that rises from `at`. */
  mote(blow: FoeBlow, from: V3, to: V3, life: number, size: number): void;
  riser(blow: FoeBlow, at: V3, rise: number, life: number, size: number): void;
  /** A faint smear that lies along its own flight `v` (m/s): a charge's wake, a bolt's trail. */
  trace(blow: FoeBlow, at: V3, v: V3, size: number, life: number, alpha: number): void;
  /** Runs `fn` after `seconds` of the clock. */
  later(seconds: number, fn: () => void): void;
  /** Runs what has come due. */
  drain(): void;
  /** How many strokes are waiting. */
  pending(): number;
  pen: Pen;
}

/** How many particles a full drawing of `mark` spends. */
export const partsOf = (mark: Mark): number => FOE_FX.marks[mark].parts;

export function createBlowKit(fx: Particles, ground: GroundFx, o: { rng?: () => number; now?: () => number } = {}): BlowKit {
  const rng = o.rng ?? Math.random;
  const now = o.now ?? ((): number => performance.now() / 1000);
  const queue: { due: number; fn: () => void }[] = [];
  const later = (seconds: number, fn: () => void): void => {
    if (!(seconds > 0)) return fn();
    if (queue.length >= FOE_FX.queue) queue.shift();
    queue.push({ due: now() + seconds, fn });
  };
  const pen = createPen(fx, ground, rng, later);
  return {
    pen,
    later,
    pending: () => queue.length,
    drain() {
      const t = now();
      for (let i = 0; i < queue.length; ) {
        if (queue[i]!.due > t) i++;
        else queue.splice(i, 1)[0]!.fn();
      }
    },
    mark(blow, which, b) {
      const T = FOE_FX.tempo[blow.tempo];
      const natural = partsOf(which);
      const allowed = b.parts ?? natural;
      if (allowed < 1) return 0;
      const beats = T.beats > 1 && allowed > 1 ? 2 : 1; // (a mark that comes twice divides what it may spend between the beats)
      const per = Math.min(natural, beats > 1 ? Math.max(1, allowed >> 1) : allowed);
      RECIPES[which](pen, blow, b, per, 0);
      if (beats > 1) later(T.gap, () => RECIPES[which](pen, blow, b, per, 1));
      return per * beats;
    },
    trace: (blow, at, v, size, life, alpha) => pen.put({ at, v, life, size, shape: 'trace', thick: markCell('smear'), tone: toneOf(blow.hues, rng), alpha, glow: true, hold: 0.25, grow: 0.8 }),
    specks: (blow, at, n, dir) => specks(pen, blow, at, n, dir),
    mote: (blow, from, to, life, size) => mote(pen, blow, from, to, life, size),
    riser: (blow, at, rise, life, size) => riser(pen, blow, at, rise, life, size),
  };
}
