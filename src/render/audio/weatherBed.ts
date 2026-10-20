/**
 * The weather heard (round 26; made fuller in round 52, softer in round 53, recorded in round 59): rain as recorded rain, a light rain's and a
 * downpour's (two CC0 recordings of rain on a field, public/audio/amb: the round-53 drops, made in code, rang like notes, and the wash before
 * them was bands of white noise, static to the ear), the downpour coming in over the light rain as it thickens, each read twice and panned
 * apart so that it is all round the listener; a gale as a low rush that swells and falls in gusts with a howl in it that wanders in pitch; a
 * thunderstorm as heavy rain with a wind behind it; the dream's motes as nothing (they are silent). Until the recordings have loaded (or if
 * they fail) the made rain of round 53 stands in (render/audio/rainTexture.ts). Made of the audio engine's own context, in the bed (so the
 * ambience setting governs it, and a horror's hush takes it too); under a roof the whole bed is closed behind a low-pass, a dull patter on
 * the tiles, not the rain itself.
 */

import type { WeatherKind } from '../../systems/weather';
import type { AudioEngine } from './engine';
import { dropTexture, washTexture, type Texture } from './rainTexture';
import type { Sampler } from './sampler';

export interface WeatherBed {
  /** `kind` and how much of it (0..1), each frame; `inside`: under a roof. */
  set(kind: WeatherKind, amount: number, inside: boolean): void;
}

export interface WeatherLevels {
  light: number; // the recorded light rain
  heavy: number; // the recorded downpour, over it
  rain: number; // the made rain's wash (until the recordings are there)
  patter: number; // its drops
  shower: number; // the crowd of drops in a downpour
  gale: number; // the low rush of the wind
  howl: number; // the wind's thin voice
  cutoff: number; // Hz: the bed's low-pass (wide open in the air, closed under a roof)
}

/** The levels (0..1) the beds are at, by spell and place: a third of the rain and a fifth of the gale under a roof, and what is left of them dull. */
export function levelsOf(kind: WeatherKind, amount: number, inside: boolean): WeatherLevels {
  const a = Math.min(1, Math.max(0, amount));
  const wet = kind === 'rain' ? a : kind === 'storm' ? Math.min(1, a * 1.15) : 0;
  const wind = kind === 'gale' ? a : kind === 'storm' ? a * 0.6 : kind === 'rain' ? a * 0.12 : 0;
  const howl = kind === 'gale' ? a : kind === 'storm' ? a * 0.55 : 0;
  const pour = wet > 0.35 ? (wet - 0.35) / 0.65 : 0; // how far it is a downpour
  return {
    light: wet * (1 - 0.55 * pour) * (inside ? 0.6 : 1), // the light rain thins as the downpour drowns it
    heavy: pour * (inside ? 0.6 : 1),
    rain: wet * (inside ? 0.33 : 1),
    patter: wet * (inside ? 0.7 : 0.85),
    shower: wet > 0.4 ? ((wet - 0.4) / 0.6) * (inside ? 0.6 : 0.9) : 0, // the heavier the rain, the more drops fall on each other
    gale: wind * (inside ? 0.2 : 1),
    howl: howl * (inside ? 0.12 : 1),
    cutoff: inside ? 720 : 18000,
  };
}

/** The recorded rain: its two beds, how loud each is at its fullest (its two readers together), and the top it is softened above (a recording's hiss is the static round 53 took out; tests/rainTexture.test.ts holds the levels). */
export const RAIN_BEDS = { light: 'amb/rain_light', heavy: 'amb/rain_heavy' } as const;
export const RAIN_GAIN = { light: 0.3, heavy: 0.62 } as const;
export const RAIN_SOFT = 6500;
/** How loud each made rain layer is at its fullest, against the bed's other sounds (tests/rainTexture.test.ts holds the whole of it to a few decibels). */
export const WASH = 0.17;
export const DROPS = 0.17;
export const SHOWER = 0.13;

export function createWeatherBed(e: AudioEngine, sampler?: Sampler): WeatherBed {
  let apply: ((l: WeatherLevels) => void) | null = null;
  let asked = false; // the recordings are fetched with the first rain
  e.onStart((ctx) => {
    const out = e.bed;
    if (!out) return;
    const roof = ctx.createBiquadFilter(); // the bed's own door: open to the sky, shut under a roof
    roof.type = 'lowpass';
    roof.frequency.value = 18000;
    roof.Q.value = 0.5;
    roof.connect(out);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = (): AudioBufferSourceNode => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, Math.random() * 2.5);
      return s;
    };
    const filter = (type: BiquadFilterType, hz: number, q: number): BiquadFilterNode => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = hz;
      f.Q.value = q;
      return f;
    };
    const gain = (v = 0): GainNode => {
      const g = ctx.createGain();
      g.gain.value = v;
      return g;
    };
    const wave = (hz: number, depth: number, into: AudioParam): OscillatorNode => {
      const o = ctx.createOscillator();
      const d = gain(depth);
      o.frequency.value = hz;
      o.connect(d).connect(into);
      o.start();
      return o;
    };

    // Rain: a soft wash, and the drops on it, from loops that close on themselves (round 53).
    const loop = (t: Texture): AudioBufferSourceNode => {
      const b = ctx.createBuffer(2, t.left.length, ctx.sampleRate);
      b.copyToChannel(t.left, 0);
      b.copyToChannel(t.right, 1);
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.loop = true;
      src.start(0, Math.random() * b.duration);
      return src;
    };
    const wash = gain();
    loop(washTexture(ctx.sampleRate, 7, 1)).connect(wash).connect(roof);
    const drops = gain();
    loop(dropTexture(ctx.sampleRate, 9, 11, 1)).connect(drops).connect(roof);
    const shower = gain();
    loop(dropTexture(ctx.sampleRate, 11, 34, 2)).connect(shower).connect(roof);

    // The recorded rain (round 59): each bed read twice, half its length apart, panned apart; softened above RAIN_SOFT.
    const soft = filter('lowpass', RAIN_SOFT, 0.5);
    soft.connect(roof);
    const recorded = { light: gain(), heavy: gain() };
    const started = { light: false, heavy: false };
    const startRecorded = (): boolean => {
      for (const k of ['light', 'heavy'] as const) {
        const buf = sampler?.buffer(RAIN_BEDS[k]);
        if (started[k] || !buf || buf.duration < 2) continue;
        started[k] = true;
        recorded[k].connect(soft);
        for (const side of [-1, 1]) {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          [src.loopStart, src.loopEnd] = [0.06, buf.duration - 0.06]; // (an MP3's padding at each end)
          const pan = ctx.createStereoPanner();
          pan.pan.value = side * 0.7;
          src.connect(gain(Math.SQRT1_2)).connect(pan).connect(recorded[k]);
          src.start(0, side < 0 ? 0.06 : buf.duration / 2);
        }
      }
      return started.light && started.heavy;
    };

    // Wind: the rush, in gusts, and the howl that wanders.
    const rushed = gain();
    const swell = gain(0.7);
    wave(0.17, 0.3, swell.gain);
    wave(0.063, 0.15, swell.gain);
    source().connect(filter('lowpass', 520, 0.6)).connect(swell).connect(rushed).connect(roof);
    const howl = gain();
    const voice = filter('bandpass', 430, 9);
    wave(0.11, 150, voice.frequency);
    wave(0.29, 40, voice.frequency);
    const second = filter('bandpass', 640, 8);
    wave(0.13, 210, second.frequency);
    const tremble = gain(0.7);
    wave(0.21, 0.3, tremble.gain);
    const [a, b] = [source(), source()];
    a.connect(voice).connect(tremble).connect(howl);
    b.connect(second).connect(gain(0.55)).connect(tremble);
    howl.connect(roof);

    apply = (l) => {
      const at = ctx.currentTime;
      const to = (p: AudioParam, v: number, tau = 1.2): void => void p.setTargetAtTime(v, at, tau);
      if (!asked && sampler && l.light + l.heavy > 0) {
        asked = true;
        void sampler.load([RAIN_BEDS.light, RAIN_BEDS.heavy]);
      }
      const real = startRecorded(); // the recordings, once both are there; the made rain until then
      to(recorded.light.gain, l.light * RAIN_GAIN.light);
      to(recorded.heavy.gain, l.heavy * RAIN_GAIN.heavy);
      to(wash.gain, real ? 0 : l.rain * WASH);
      to(drops.gain, real ? 0 : l.patter * DROPS);
      to(shower.gain, real ? 0 : l.shower * SHOWER);
      to(rushed.gain, l.gale * 0.3);
      to(howl.gain, l.howl * 0.1);
      to(roof.frequency, l.cutoff, 0.5);
    };
  });
  return { set: (kind, amount, inside) => apply?.(levelsOf(kind, amount, inside)) };
}
