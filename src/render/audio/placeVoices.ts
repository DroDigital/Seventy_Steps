/**
 * Round 78, the places' voices: the far sounds of each realm (data/placeSounds.ts) at their own hours, and the dog that ends the Still
 * (data/ambienceHours.ts). `schedule` is the pure part (when, which, never the same twice running, never two within `GAP`, nothing in
 * a fight, a cutscene, a storm, the Still, under a roof or while the ground is going quiet before a horror) and is tested with a fake
 * clock; `createPlaceVoices` plays what it chooses on the ambience bus (so the ambience setting rules them, and the hush that comes
 * before a horror takes them), placed by a bearing and a distance and dulled by it. Render only: nothing here is heard by the simulation.
 */

import type { V3 } from '../../core/geom';
import { FAR } from '../../data/ambienceSounds';
import { STILL, STILL_HOWL, stillOf } from '../../data/ambienceHours';
import { GAP, HUSH_MOST, MASKED, PACE, PLACE_VOICES, REACH, type PlaceVoice } from '../../data/placeSounds';
import { SAMPLE_SETS } from '../../data/samples';
import { hourOf, type Hour } from '../../systems/clock';
import type { AtmAudioContext } from './atmosphereAudio';
import { dullness, placeSound } from './cues';
import { playSound } from './synth';
import { createVarier } from './vary';

/** What the scheduler is told each time it looks. */
export interface Scene {
  region: string | null;
  phase: number;
  outdoors: boolean; // in the open world and under the sky
  held: boolean; // a fight, a cutscene, a pause
  weather: string;
  hushed: number;
}

export interface Chosen {
  voice: PlaceVoice | 'howl';
  bearing: number | null; // null: from anywhere
}

export interface Schedule {
  update(seconds: number, scene: Scene): void;
}

/** The weight of a voice in an hour. */
export const hourWeight = (v: PlaceVoice, hour: Hour): number => v.hours[hour] ?? 0;

/** When a voice next takes its turn: its wait drawn from its interval, shorter in the hours it likes (in one it does not, it looks again soon). */
export const turnAt = (v: PlaceVoice, now: number, hour: Hour, rand: () => number): number => {
  const w = hourWeight(v, hour);
  return w > 0 ? now + ((v.every[0] + (v.every[1] - v.every[0]) * rand()) * PACE) / w : now + 40;
};

export function schedule(play: (c: Chosen) => boolean, seaward: () => number | null, rand: () => number = Math.random): Schedule {
  let region: string | null = null;
  let slots: { voice: PlaceVoice; next: number }[] = [];
  let quiet = 0; // seconds before another may sound
  let last: string | null = null;
  let seen = false; // the Still has been held, and its end is to be marked
  let howl = Infinity;
  return {
    update(seconds, s) {
      const phase = s.phase;
      const hour = hourOf(phase);
      const still = stillOf(phase);
      if (s.region !== region) {
        region = s.region;
        slots = (PLACE_VOICES[region ?? ''] ?? []).map((voice) => ({ voice, next: seconds + voice.every[0] * PACE * (0.6 + 0.6 * rand()) })); // not at the door
      }
      const free = s.outdoors && !s.held && s.hushed < HUSH_MOST;
      if (still >= 0.99) seen = (free && STILL_HOWL.realms.includes(region ?? '')) || seen;
      else if (seen && still < 0.5 && phase > STILL.to) {
        [seen, howl] = [false, seconds + STILL_HOWL.after]; // the world has let its breath go: one dog
      } else if (seen && phase < STILL.from - STILL.ease) seen = false; // (the Still was jumped over, backwards)
      if (seconds >= howl) {
        howl = Infinity;
        if (free && !MASKED.has(s.weather) && play({ voice: 'howl', bearing: null })) quiet = Math.max(quiet, seconds + GAP * 0.5);
      }
      const clear = free && !MASKED.has(s.weather) && still < 0.01 && seconds >= quiet;
      for (const slot of slots) {
        if (seconds < slot.next) continue;
        const { voice } = slot;
        let bearing: number | null = null;
        const again = voice.id === last && slots.some((o) => o.voice.id !== voice.id && hourWeight(o.voice, hour) > 0); // (never twice running, where there is another to be heard)
        const go = clear && hourWeight(voice, hour) > 0 && !again && (!voice.seaward || (bearing = seaward()) !== null);
        if (go && play({ voice, bearing })) {
          last = voice.id;
          quiet = seconds + GAP;
        }
        slot.next = turnAt(voice, seconds, hour, rand); // (a turn not taken is drawn again from now: there is no burst when a fight ends)
      }
    },
  };
}

export interface PlaceVoices {
  update(seconds: number, scene: Scene): void;
}

export function createPlaceVoices(ctx: AtmAudioContext, seaward: (at: V3) => number | null): PlaceVoices {
  const { e, sampler, listener, right } = ctx;
  const vary = createVarier();
  const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();
  const play = ({ voice, bearing }: Chosen): boolean => {
    if (voice === 'howl') {
      const o = { gain: STILL_HOWL.gain, pan: (Math.random() * 2 - 1) * 0.7, lowpass: STILL_HOWL.lowpass, pitch: between(STILL_HOWL.pitch), bus: e.bed ?? undefined };
      return sampler.play(SAMPLE_SETS[STILL_HOWL.set], o);
    }
    const a = bearing === null ? Math.random() * Math.PI * 2 : bearing + (Math.random() - 0.5) * 0.7; // (the water, near enough)
    const d = between(voice.far);
    const at = { x: listener.x + Math.sin(a) * d, y: listener.y, z: listener.z + Math.cos(a) * d };
    const { gain, pan } = placeSound(listener, right, at, voice.far[1] * REACH);
    const o = { gain: gain * voice.gain, pan, lowpass: Math.min(voice.lowpass ?? 20000, dullness(gain) * 0.4), bus: e.bed ?? undefined };
    if (voice.recipe) return playSound(e, vary(`far:${voice.id}`, FAR[voice.recipe], 0.7), o);
    return sampler.play(SAMPLE_SETS[voice.set!], { ...o, pitch: between(voice.pitch ?? [0.95, 1.05]) });
  };
  const here = { x: 0, y: 0, z: 0 };
  const sched = schedule(play, () => seaward(Object.assign(here, listener)));
  return { update: (seconds, scene) => sched.update(seconds, scene) };
}
