/**
 * The eye (round 78): the mind mends faster in lamplight (sanity.ts, `Game.lit`) and nothing in the picture said so. Now the picture's corners
 * open where a lamp, a fire or a lit window stands about the investigator and what shines blooms a little more, as a breath let go; and in
 * the dark they close in slowly, till the lantern and its circle are all there is. The vignette and the bloom only: a change of exposure before
 * the quantiser would shift the 64 colours and flicker its bands. Asymmetric (it opens in under a second and closes over a few) and small;
 * the dark side stays under LIGHTING.vignette x 1.43, so the lantern's circle is read as before. It keeps off a cutscene, the arena, and a
 * picture that a wound, a faint or a fall has taken (those add their own edge: this adds nothing to them), and under a dungeon's roof, where
 * `lightAt` counts the torches, it keeps a fraction. It composes with whatever else writes the two uniforms this frame (it scales the value it
 * finds, unless that is its own from the frame before). Presentation only: reads the lamps' light and the lantern, writes two uniforms.
 */

import { EYE } from '../data/horizonLife';
import { LIGHTING } from '../data/tuning';
import type { Game } from '../systems/components';
import { lanternGain } from './lanternLife';
import type { PostPass } from './postPass';

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** How much of a pool of light the ground is (0..1), from `Game.lit`'s 0..1: none from a faint stray glow, whole at a lamp's foot. */
export const poolOf = (lit: number): number => smooth(EYE.take[0], EYE.take[1], lit);

/** The corners' darkness as a multiple of LIGHTING.vignette, for a pool (0..1) and how much of the lantern burns (0..1: out, a lantern gone dark reads as the dark of the dark). */
export function vignetteScale(pool: number, lantern: number): number {
  const dark = EYE.vignette.dark + (EYE.vignette.lantern - EYE.vignette.dark) * clamp(lantern);
  return dark + (EYE.vignette.lit - dark) * clamp(pool);
}

/** What shines blooms this much stronger, as a multiple of LIGHTING.bloom.strength. */
export const bloomScale = (pool: number): number => 1 + EYE.bloom * clamp(pool);

/** `value` eased toward `target` over `dt` seconds: it opens (rises) faster than it closes. */
export function ease(value: number, target: number, dt: number): number {
  const tau = target > value ? EYE.rise : EYE.fall;
  return value + (target - value) * (1 - Math.exp(-Math.max(0, dt) / tau));
}

/** A scale `k` (about 1) kept to `amount` of its effect (0..1), and to the range the picture is allowed (as multiples of the base). */
export const keep = (k: number, amount: number): number => clamp(1 + (k - 1) * clamp(amount), EYE.clamp[0] / LIGHTING.vignette, EYE.clamp[1] / LIGHTING.vignette);

/** The value to scale: what another writer left in the uniform this frame, or `base` when it still holds what this wrote last (`mine`). */
export const baseOf = (found: number, mine: number, base: number): number => (found === mine ? base : found);

/** How much of the effect the picture can bear now: none in a cutscene, in a place without a sky of its own (the arena), or while a wound, a faint or a fall holds it; a fraction under a roof. */
export function allowed(g: Game, enclosed: boolean, taken: number): number {
  if (!g.overworld || g.cutscene) return 0;
  return (enclosed ? EYE.roofed : 1) * (1 - clamp(taken));
}

export interface EyeAdapt {
  update(time: number, enclosed: boolean, alpha: number): void;
  readonly pool: number;
  readonly amount: number;
}

export function createEyeAdapt(post: PostPass, g: Game): EyeAdapt {
  const u = post.uniforms;
  let [last, readAt, lit, pool, amount] = [-1, -Infinity, 0, 0, 0];
  let [mineVig, mineBloom] = [NaN, NaN];
  return {
    get pool() {
      return pool;
    },
    get amount() {
      return amount;
    },
    update(time, enclosed, alpha) {
      const dt = last < 0 ? 0 : clamp(time - last, 0, 0.25);
      last = time;
      if (time - readAt > EYE.every || time < readAt) {
        readAt = time;
        const at = g.ecs.c.transform.get(g.player.id)?.pos;
        lit = at && g.overworld ? clamp(g.lit?.(at) ?? 0) : 0;
      }
      const taken = Math.max(u.uFaint.value.x * 2, u.uFaint.value.y, u.uFade.value, u.uStone.value); // what a wound, a faint, a fall or a gaze has done to the picture's edge
      const goal = allowed(g, enclosed, taken);
      amount += (goal - amount) * (1 - Math.exp(-dt / (goal < amount ? 0.35 : EYE.calm))); // goes quickly, returns slowly
      pool = ease(pool, poolOf(lit), dt);
      const lantern = lanternGain(g, alpha);
      const vig = baseOf(u.uVig.value, mineVig, LIGHTING.vignette);
      const bloom = baseOf(u.uBloom.value.x, mineBloom, LIGHTING.bloom.strength);
      u.uVig.value = mineVig = vig * keep(vignetteScale(pool, lantern), amount);
      u.uBloom.value.x = mineBloom = bloom * (1 + (bloomScale(pool) - 1) * amount);
    },
  };
}
