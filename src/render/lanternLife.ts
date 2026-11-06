/**
 * The investigator's lantern and the mind: the flame dims smoothly as sanity falls. When the mind comes Unmoored it gutters for a moment,
 * stuttering lower each time, and goes out; it stays dark until the mind has climbed one band above, to Fractured (the band's own three
 * points of hysteresis, sanity.ts, keep it from kindling and guttering at the edge), then catches at the light its sanity permits. The light,
 * halo and belt flame share the same gain. The mind's mending never counted the lantern (`lightAt`), so a dark lantern is no trap.
 * A function of sanity and the game's own time, so a pause holds it and a save loaded Unmoored begins dark.
 * Presentation only; the render side keeps it, per game.
 */
import { SANITY } from '../data/tuning';
import type { Game } from '../systems/components';

const GUTTER_SECONDS = 1.8;

interface Life { out: boolean; since: number }
const lives = new WeakMap<Game, Life>();

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const smooth = (t: number): number => { const c = clamp(t); return c * c * (3 - 2 * c); };

/** A quick, uneven stutter in about -1.4 to 1.4: three beats that never line up (about 1.5, 3.3 and 5.5 Hz) and a tremor over them. */
const stutter = (t: number): number => Math.sin(t * 9.1 + 0.4) * 0.35 + Math.sin(t * 21 + 0.9) * 0.55 + Math.sin(t * 34.7 + 1.3) * 0.45 + Math.sin(t * 61 + 2.1) * 0.12;

/** How much of a flame is up at `age` seconds into guttering (1 to 0): it dips more and more, and stays down longer, till the last of it goes. */
export function gutterGain(age: number): number {
  const u = clamp(age / GUTTER_SECONDS);
  if (u >= 1) return 0;
  const up = smooth((stutter(age) - (-0.9 + 1.9 * u)) / 0.4 + 0.5); // the threshold rises: early on it is mostly up, near the end only a peak lifts it
  const flame = (0.3 + 0.7 * (1 - u)) * (0.04 + 0.96 * up);
  return flame * (1 - smooth((u - 0.78) / 0.22));
}

export const LANTERN_LIFE = Object.freeze({
  gutter: GUTTER_SECONDS, // seconds it flickers before it is out
  kindle: 1.6, // seconds it takes to catch and steady
  minGain: gutterGain(0.5), // meet the first low flicker dip before the final gutter (about 3% light)
  dimPower: 2.5, // retain useful light at high sanity; the decline steepens near blackout
});

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

/** The flicker and blackout envelope before sanity dimming; the sound follows these dips at any brightness. */
export function lanternLifeGain(g: Game, alpha = 0): number {
  const life = lifeOf(g);
  const age = Math.max(0, (g.frame + alpha) / 60 - life.since);
  return life.out ? gutterGain(age) : kindleGain(age);
}

/** The share of the lantern's light that burns now, 0 to 1, `alpha` of the way from this step to the next. */
export function lanternGain(g: Game, alpha = 0): number {
  const floor = SANITY.bands[2];
  const lost = clamp((SANITY.max - g.mind.sanity) / (SANITY.max - floor));
  const steady = 1 - (1 - LANTERN_LIFE.minGain) * Math.pow(lost, LANTERN_LIFE.dimPower);
  return steady * lanternLifeGain(g, alpha);
}
