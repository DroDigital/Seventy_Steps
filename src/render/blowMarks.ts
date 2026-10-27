/**
 * The twelve marks a quiet blow can leave (round 89, render only; data/foeBlows.ts `Mark`): one recipe each, in particles of the shapes the
 * shader draws for them (`render/particles.ts`: a crescent, a lash, a cross, a row of ticks and an open ring are drawn in the shader, a mark and
 * a trace from a small free atlas of masks) and, for the one that lies on the ground, a decal. A stroke, a lash, a row of ticks lies along the way
 * it travels (the shader turns it along its flight); the rest face the eye. How a mark moves (`tempo`) and what it passes through (the blow's three
 * hues) are the same for every mark: this file says what each one IS, `blowKit.ts` what it does.
 */

import type { V3 } from '../core/geom';
import type { FoeBlow, Mark } from '../data/foeBlows';
import { FOE_FX } from '../data/fxTuning';
import { toneOf, type Pen } from './blowPen';
import { mixRgb } from './palette';
import { markCell, type ParticleShape } from './particles';

/** Where and how large a mark is laid. */
export interface Blot {
  at: V3; // its heart
  dir: { x: number; z: number }; // the way the blow runs, a unit vector over the ground
  size: number; // metres: how long it is at full
  alpha?: number; // the share of its brightness it keeps (a tell's is half)
  parts?: number; // the most particles it may spend (it spends fewer if that is all it has)
  who?: string; // the roster id whose ground mark it is (a ripple)
  floor?: number; // the ground's height under `at` (a ripple lies there)
}

/** One beat of a mark: `n` of its particles. */
export type Recipe = (pen: Pen, blow: FoeBlow, b: Blot, n: number, beat: number) => void;

const tau = Math.PI * 2;
const ALIGNED: ReadonlySet<ParticleShape> = new Set<ParticleShape>(['crescent', 'lash', 'dash', 'trace']);

/** A particle of a mark, in the mark's own frame: `side` metres to the left of its line, `fwd` along it, `up` above its heart. */
interface Q {
  shape: ParticleShape;
  size: number;
  side?: number;
  fwd?: number;
  up?: number;
  speed?: number; // m/s along the way a stroke runs (negative: back along it)
  vy?: number; // m/s up
  rot?: number;
  spin?: number;
  delay?: number; // seconds after the beat begins
  alpha?: number; // a share of the mark's
  grow?: number;
  thick?: number;
  drag?: number;
}

function laying<K extends Mark>(pen: Pen, mark: K, blow: FoeBlow, b: Blot, beat: number) {
  const T = FOE_FX.tempo[blow.tempo];
  const M = FOE_FX.marks[mark];
  const [dx, dz] = [b.dir.x, b.dir.z];
  const alpha = Math.min(1, (b.alpha ?? 1) * M.alpha * T.alpha * (beat ? 0.65 : 1));
  const L = b.size * (beat ? 0.85 : 1);
  const lay = (q: Q): void => {
    const run = (): void => {
      const aligned = ALIGNED.has(q.shape);
      const sp = q.speed ?? M.speed;
      const jitter = (): number => (pen.rng() * 2 - 1);
      pen.put({
        at: { x: b.at.x + dx * (q.fwd ?? 0) - dz * (q.side ?? 0), y: b.at.y + (q.up ?? 0), z: b.at.z + dz * (q.fwd ?? 0) + dx * (q.side ?? 0) },
        v: aligned
          ? { x: dx * sp, y: q.vy ?? T.sink * 0.5, z: dz * sp } // (no drag, no gravity: the shader lies it along this flight)
          : { x: T.wander * jitter(), y: q.vy ?? T.sink, z: T.wander * jitter() },
        life: M.life * T.life * (0.9 + 0.2 * pen.rng()), size: q.size, shape: q.shape, tone: toneOf(blow.hues, pen.rng), alpha: Math.min(1, alpha * (q.alpha ?? 1)),
        grow: (q.grow ?? 1) * T.grow, glow: true, spin: (q.spin ?? 0) + (T.spin ? jitter() * T.spin : 0), rot: q.rot ?? 0, hold: T.hold,
        ...(q.thick !== undefined && { thick: q.thick }), ...(q.drag !== undefined && { drag: q.drag }),
      });
    };
    pen.later(q.delay ?? 0, run);
  };
  return { T, M, L, lay, rand: pen.rng };
}

/** Three scratches laid one after another across the blow, each a little shorter than the last. */
const rake: Recipe = (pen, blow, b, n, beat) => {
  const { T, L, lay, rand } = laying(pen, 'rake', blow, b, beat);
  for (let i = 0; i < n; i++) lay({ shape: 'crescent', side: (i - (n - 1) / 2) * L * 0.2, size: L * (1 - 0.08 * i), delay: i * T.stagger, rot: (i - (n - 1) / 2) * 0.07 + (rand() - 0.5) * 0.06 });
};

/** Two crescents closing on a point, one from above and one from below, each curved toward the other. */
const jaws: Recipe = (pen, blow, b, n, beat) => {
  const { M, T, L, lay } = laying(pen, 'jaws', blow, b, beat);
  const gap = L * 0.38;
  const speed = (gap / (M.life * T.life)) * 0.85;
  for (const s of n > 1 ? [1, -1] : [1]) lay({ shape: 'crescent', up: s * gap, vy: -s * speed, speed: 0, size: L * 0.9, rot: (s * Math.PI) / 2 });
};

/** A tapering arc that goes on along the way the blow runs. */
const crescent: Recipe = (pen, blow, b, _n, beat) => {
  const { L, lay } = laying(pen, 'crescent', blow, b, beat);
  lay({ shape: 'crescent', size: L });
};

/** A whip stroke that cracks out and, if there is room for a second, back. */
const lash: Recipe = (pen, blow, b, n, beat) => {
  const { M, L, lay } = laying(pen, 'lash', blow, b, beat);
  lay({ shape: 'lash', size: L * 1.1 });
  if (n > 1) lay({ shape: 'lash', size: L * 0.8, speed: -M.speed, delay: M.back, alpha: 0.55 });
};

/** An ink blot that opens where the blow fell and sinks. */
const splat: Recipe = (pen, blow, b, _n, beat) => {
  const { T, L, lay, rand } = laying(pen, 'splat', blow, b, beat);
  lay({ shape: 'mark', thick: markCell('splat'), size: L * 0.6, grow: 1.5, rot: rand() * tau, vy: Math.min(T.sink, -0.12) });
};

/** An open ring turning about the point, with, if there is room, a smaller one turning the other way inside it. */
const swirl: Recipe = (pen, blow, b, n, beat) => {
  const { M, T, L, lay, rand } = laying(pen, 'swirl', blow, b, beat);
  const way = rand() < 0.5 ? 1 : -1;
  lay({ shape: 'arc', thick: M.thick, size: L * 0.7, grow: 1.45, spin: way * M.spin, rot: rand() * tau });
  if (n > 1) lay({ shape: 'arc', thick: M.thick, size: L * 0.45, grow: 1.4, spin: -way * M.spin * 1.4, rot: rand() * tau, delay: T.stagger + 0.02, alpha: 0.7 });
};

/** A thin cross of light that opens and closes, and a smaller one turned half-way after it. */
const glint: Recipe = (pen, blow, b, n, beat) => {
  const { T, L, lay, rand } = laying(pen, 'glint', blow, b, beat);
  lay({ shape: 'cross', size: L * 0.5, grow: 2, rot: (rand() - 0.5) * 0.4, spin: 0.8 });
  if (n > 1) lay({ shape: 'cross', size: L * 0.32, grow: 2, rot: Math.PI / 4, delay: T.stagger + 0.05, alpha: 0.7 });
};

/** Short ticks stitched along the blow, and a second row beside the first. */
const dash: Recipe = (pen, blow, b, n, beat) => {
  const { M, T, L, lay } = laying(pen, 'dash', blow, b, beat);
  lay({ shape: 'dash', size: L });
  if (n > 1) lay({ shape: 'dash', size: L * 0.8, side: L * 0.14, speed: M.speed * 0.9, delay: T.stagger + 0.02, alpha: 0.75 });
};

/** A thin ring running out along the ground (a decal: no particle, so none of the particles' budgets). */
const ripple: Recipe = (pen, blow, b, _n, beat) => {
  const { M, T, L } = laying(pen, 'ripple', blow, b, beat);
  const s = FOE_FX.strike.slam;
  const tone = toneOf(blow.hues, pen.rng);
  pen.ground.shock({ x: b.at.x, y: b.floor ?? b.at.y, z: b.at.z }, Math.max(0.15, L * s.from), Math.max(s.floor, L * s.to), mixRgb(tone.color, tone.colorMid, 0.5), b.who, M.life * T.life, s.width * (beat ? 0.7 : 1));
};

/** A small rune that kindles where the blow fell and goes out. */
const sigil: Recipe = (pen, blow, b, _n, beat) => {
  const { L, lay } = laying(pen, 'sigil', blow, b, beat);
  lay({ shape: 'rune', size: L * 0.8, grow: 1.15, spin: 0.5, up: 0.1 });
};

/** An eye that opens where the blow fell, and closes. */
const eye: Recipe = (pen, blow, b, _n, beat) => {
  const { L, lay } = laying(pen, 'eye', blow, b, beat);
  lay({ shape: 'eye', size: L * 0.32, grow: 2.4 });
};

/** A wisp of smoke that rises from the point, a second following the first. */
const plume: Recipe = (pen, blow, b, n, beat) => {
  const { M, T, L, lay, rand } = laying(pen, 'plume', blow, b, beat);
  for (let i = 0; i < n; i++) lay({ shape: 'puff', thick: rand() * 0.999, size: L * 0.45, grow: 2.4, vy: M.speed * (0.8 + 0.4 * rand()), side: (i - 0.5) * L * 0.2, delay: i * (T.stagger + 0.05), alpha: 1 - 0.3 * i, drag: 0.9 });
};

export const RECIPES: Readonly<Record<Mark, Recipe>> = { rake, jaws, crescent, lash, splat, swirl, glint, dash, ripple, sigil, eye, plume };
