/**
 * The place answers the one who keeps its vigil (round 65; XDro: nothing new may be too hard or frustrating for any kind of player).
 * A vigil asks an hour, a sky or a state of mind, and waiting on the night's turn or on the weather's random spells could take the
 * better part of an hour of play. In the stories such places keep their own hours and call their own weather, so here they do: one who
 * stands at the mark a few seconds while it is not yet so is answered, with a word and a tremor. The night runs on to the hour asked
 * (the moon climbs or sinks, the windows go out, the sky greys: every reader of the clock follows, clock.ts `NIGHT`), the sky gathers
 * the weather asked over the place, and the mind is leaned on, or stilled, into the state asked and held there while the vigil lasts.
 * Only the dark is not called (a lamp is a lamp): the marks that ask it stand where no lamp reaches. Pure: no Three.js.
 */

import type { Mind, Sky, When } from '../data/discoveries';
import { SANITY, SIM, WEATHER } from '../data/tuning';
import { HOUR_FROM, hourOf, NIGHT, phaseOf, type Hour } from './clock';
import type { Game } from './components';
import { bandIndex, setSanity } from './sanity';
import { kindsOf } from './weather';

/** The numbers of the call. */
export const CALL = {
  after: 3, // seconds stood at the mark, what it asks not holding, before the place answers
  speed: 90, // seconds of the night that pass in each second while it runs on (the longest wait, nearly a whole night, is under twelve seconds)
  into: 0.02, // how far into the hour asked (a share of the night) it is brought, so the hour does not turn as the vigil begins
  mind: 4, // points of the mind a second it is drawn toward the state asked
  near: 3, // points from the middle of that state within which it is let be
  spell: 150, // seconds at least that a sky called stays
} as const;

const HOUR_WORDS: Readonly<Record<Hour, string>> = {
  gloaming: 'THE NIGHT RUNS ON AND TURNS. THE LAMPS ARE LIT AGAIN, AND IT IS THE GLOAMING',
  deep: 'THE STARS WHEEL OVERHEAD. THE NIGHT RUNS ON INTO ITS DEEP',
  waning: 'THE MOON SINKS AS YOU WATCH. THE NIGHT RUNS ON TO ITS LAST HOUR',
};
const SKY_WORDS: Readonly<Record<Sky, string>> = {
  clear: 'THE SKY CLEARS',
  rain: 'THE AIR THICKENS OVER THE PLACE, AND THE RAIN COMES ON AS IF ASKED',
  storm: 'THE SKY GATHERS ITSELF OVER THE PLACE. SOMETHING HAS CALLED THE STORM',
  gale: 'A WIND RISES OUT OF A STILL NIGHT AND WILL NOT DIE',
  motes: 'THE MOTES BEGIN TO COME DOWN INTO THE AIR, AS IF THEY HAD BEEN WAITING',
};

/** The middle of the states of mind `from` to `to`: what the mind is drawn to. */
export function mindTarget(m: { from: Mind; to: Mind }): number {
  const ceiling = (i: number): number => (i === 0 ? SANITY.max : SANITY.bands[i - 1]!);
  const floor = (i: number): number => SANITY.bands[i] ?? 0;
  return (ceiling(bandIndex(m.from)) + floor(bandIndex(m.to))) / 2;
}

/** The sky to call: the first asked that the realm knows (a vigil asks only what its realm has: tests/discovery.test.ts). */
const skyFor = (g: Game, sky: readonly Sky[]): Sky | undefined => sky.find((k) => kindsOf(g.overworld?.region ?? null).some(([r]) => r === k));

const hourHolds = (g: Game, hours: readonly Hour[]): boolean => {
  const phase = phaseOf(g.frame / SIM.hz);
  return hours.some((h) => hourOf(phase) === h && phase >= HOUR_FROM[h] + CALL.into * 0.5);
};

const stateOf = new WeakMap<Game, { key: string; stood: number; told: boolean }>();

/**
 * Each step the investigator stands at a vigil's mark in its turn: `holds` is whether the vigil holds now. Once they have stood
 * CALL.after seconds, what it asks is called, and the mind is kept in the state asked while they stay.
 */
export function answer(g: Game, key: string, when: When, holds: boolean): void {
  const ow = g.overworld;
  if (!ow) return;
  let st = stateOf.get(g);
  if (!st || st.key !== key) stateOf.set(g, (st = { key, stood: 0, told: false }));
  st.stood++;
  if (st.stood < CALL.after * SIM.hz) return;
  const dt = 1 / SIM.hz;
  const words: string[] = [];
  if (when.hour && !hourHolds(g, when.hour)) {
    NIGHT.hurried = ow.hurried = (ow.hurried ?? 0) + CALL.speed * dt; // the night runs on (clock.ts: every reader of the hour follows)
    if (!st.told) words.push(HOUR_WORDS[when.hour[0]!]);
  }
  const sky = when.sky && skyFor(g, when.sky);
  if (sky && !(ow.weather.kind === sky && ow.weather.amount >= 0.45)) {
    const w = ow.weather;
    if (w.want !== sky) {
      w.want = sky; // what is blowing eases out, and the sky asked comes on (weather.ts)
      if (!st.told) words.push(SKY_WORDS[sky]);
    }
    w.until = Math.max(w.until, g.frame + Math.round(Math.max(CALL.spell, WEATHER.spell[0]) * SIM.hz));
  }
  if (when.mind) {
    const want = mindTarget(when.mind);
    const gap = want - g.mind.sanity;
    if (Math.abs(gap) > CALL.near) {
      if (!st.told && !holds) words.push(gap < 0 ? 'THE PLACE LEANS ON YOUR MIND' : 'THE PLACE STILLS YOUR MIND, AS A HAND IS LAID ON A BROW');
      setSanity(g, g.mind.sanity + Math.sign(gap) * Math.min(Math.abs(gap), CALL.mind * dt));
    }
  }
  if (!st.told && words.length) {
    st.told = true;
    g.events.emit('WayOmen', { words: words.join('. '), sound: when.sky ? 'thunder' : 'choral', shake: 0.35, pitch: 0.8 });
  }
}

/** The investigator has left the mark (or it is not its turn): the next time they come, they are answered again. */
export function leave(g: Game, key: string): void {
  if (stateOf.get(g)?.key === key) stateOf.delete(g);
}
