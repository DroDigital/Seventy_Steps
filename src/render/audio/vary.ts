/**
 * Variation (round 40: a recipe played the same notes every time, so a sound heard fifty times in a fight was fifty
 * of one): a copy of a recipe with a little drawn anew for each play: one pitch for the whole sound (so its layers
 * stay in tune with one another), each layer's own filter, level, start and length a little off. And never the same
 * pitch twice running for one sound: a draw too near the last is drawn again. Pure: no WebAudio.
 */

import type { Layer, Sound } from '../../data/sounds';

/** The widest each draw goes, at `amount` 1 (a share either side). */
const SPREAD = { pitch: 0.045, filter: 0.07, gain: 1.2 /* dB */, at: 0.006 /* s */, dur: 0.05 };
const APART = 0.012; // the least two pitches running must differ by

const sign = (rand: () => number): number => rand() * 2 - 1;

/** `sound` as one play of it: `amount` 0 changes nothing, 1 the usual, 2 twice as far. `pitch` is the play's shared pitch ratio. */
export function varied(sound: Sound, rand: () => number, amount = 1, pitch = 1 + sign(rand) * SPREAD.pitch * amount): Sound {
  return sound.map((l): Layer => {
    const f = 1 + sign(rand) * SPREAD.filter * amount;
    const g = 10 ** ((sign(rand) * SPREAD.gain * amount) / 20);
    return {
      ...l,
      ...(l.hz !== undefined && { hz: l.hz * pitch }),
      ...(l.to !== undefined && { to: l.to * pitch }),
      at: l.at === undefined && amount === 0 ? undefined : Math.max(0, (l.at ?? 0) + sign(rand) * SPREAD.at * amount * (l.at ? 1 : 0.4)),
      dur: l.dur * (1 + sign(rand) * SPREAD.dur * amount),
      gain: l.gain * g,
      ...(l.filter && { filter: { ...l.filter, hz: l.filter.hz * f * (l.src === 'noise' ? pitch : 1), ...(l.filter.to !== undefined && { to: l.filter.to * f * (l.src === 'noise' ? pitch : 1) }) } }),
    };
  });
}

export interface Varier {
  /** A play of the sound known by `key`: varied, and not at the pitch of the last play of that key. */
  (key: string, sound: Sound, amount?: number): Sound;
}

export function createVarier(rand: () => number = Math.random): Varier {
  const last = new Map<string, number>();
  return (key, sound, amount = 1) => {
    let pitch = 1;
    for (let tries = 0; tries < 4; tries++) {
      pitch = 1 + sign(rand) * SPREAD.pitch * amount;
      if (Math.abs(pitch - (last.get(key) ?? 0)) >= APART * Math.min(1, amount)) break;
    }
    last.set(key, pitch);
    return varied(sound, rand, amount, pitch);
  };
}
