/**
 * The investigator's lantern and the mind (round 58): when the mind comes Unmoored the flame gutters for a moment, stuttering lower each
 * time, and goes out; it stays dark until the mind has climbed one band above, to Fractured (the band's own three points of hysteresis,
 * sanity.ts, keep it from kindling and guttering at the edge), and then it catches again, stuttering up to its full light. Only the light is
 * the lantern's (lantern.ts, the halo, the flame on the belt): the mending of the mind never counted it (`lightAt`), so a dark lantern is no
 * trap. A pure function of the game's own time since the band last changed, so a pause holds it and a save loaded Unmoored begins dark.
 * Presentation only; the render side keeps it, per game.
 */
import type { Game } from '../systems/components';

export const LANTERN_LIFE = Object.freeze({
  gutter: 1.8, // seconds it flickers before it is out
  kindle: 1.6, // seconds it takes to catch and steady
});

interface Life { out: boolean; since: number }
const lives = new WeakMap<Game, Life>();

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const smooth = (t: number): number => { const c = clamp(t); return c * c * (3 - 2 * c); };

/** A quick, uneven stutter in about -1.4 to 1.4: three beats that never line up (about 1.5, 3.3 and 5.5 Hz) and a tremor over them. */
const stutter = (t: number): number => Math.sin(t * 9.1 + 0.4) * 0.35 + Math.sin(t * 21 + 0.9) * 0.55 + Math.sin(t * 34.7 + 1.3) * 0.45 + Math.sin(t * 61 + 2.1) * 0.12;

/** How much of a flame is up at `age` seconds into guttering (1 to 0): it dips more and more, and stays down longer, till the last of it goes. */
export function gutterGain(age: number): number {
  const u = clamp(age / LANTERN_LIFE.gutter);
  if (u >= 1) return 0;
  const up = smooth((stutter(age) - (-0.9 + 1.9 * u)) / 0.4 + 0.5); // the threshold rises: early on it is mostly up, near the end only a peak lifts it
  const flame = (0.3 + 0.7 * (1 - u)) * (0.04 + 0.96 * up);
  return flame * (1 - smooth((u - 0.78) / 0.22));
}

/** And at `age` seconds into kindling (0 to 1): the same stutter in reverse, the dips fewer and shallower, till it holds. */
export function kindleGain(age: number): number {
  const u = clamp(age / LANTERN_LIFE.kindle);
  if (u >= 1) return 1;
  const up = smooth((stutter(age + 3.7) - (0.9 - 1.9 * u)) / 0.4 + 0.5);
  const flame = smooth(u * 1.2) * (0.04 + 0.96 * up);
  return flame + (1 - flame) * smooth((u - 0.75) / 0.25);
}

/** Where the lantern stands for a game: out or lit, and since when (seconds of the game's own time). Begins as the mind finds it. */
function lifeOf(g: Game): Life {
  let life = lives.get(g);
  if (!life) {
    const l: Life = { out: g.mind.band === 'unmoored', since: -Infinity };
    lives.set(g, life = l);
    g.events.on('SanityBandChanged', (e) => {
      const out = e.to === 'unmoored';
      if (out !== l.out) [l.out, l.since] = [out, g.frame / 60];
    });
  }
  return life;
}

/** The share of the lantern's light that burns now, 0 to 1, `alpha` of the way from this step to the next. */
export function lanternGain(g: Game, alpha = 0): number {
  const life = lifeOf(g);
  const age = Math.max(0, (g.frame + alpha) / 60 - life.since);
  return life.out ? gutterGain(age) : kindleGain(age);
}
