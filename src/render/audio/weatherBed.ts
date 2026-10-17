/**
 * The weather heard (round 26; made fuller in round 52): rain as three layers, the hiss of it far off, the body of it on the ground and the
 * patter of the near drops (two slow waves on its level make it fall in grains, not in a wash); a gale as a low rush that swells and falls in
 * gusts with a howl in it that wanders in pitch; a thunderstorm as heavy rain with a wind behind it; the dream's motes as nothing (they are
 * silent). Made of the audio engine's own context, in the bed (so the ambience setting governs it, and a horror's hush takes it too); under a
 * roof the whole bed is closed behind a low-pass, a dull patter on the tiles, not the rain itself.
 */

import type { WeatherKind } from '../../systems/weather';
import type { AudioEngine } from './engine';

export interface WeatherBed {
  /** `kind` and how much of it (0..1), each frame; `inside`: under a roof. */
  set(kind: WeatherKind, amount: number, inside: boolean): void;
}

export interface WeatherLevels {
  rain: number; // the hiss and the body of the rain
  patter: number; // its near drops
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
  return {
    rain: wet * (inside ? 0.33 : 1),
    patter: wet * (inside ? 0.7 : 0.85),
    gale: wind * (inside ? 0.2 : 1),
    howl: howl * (inside ? 0.12 : 1),
    cutoff: inside ? 720 : 18000,
  };
}

export function createWeatherBed(e: AudioEngine): WeatherBed {
  let apply: ((l: WeatherLevels) => void) | null = null;
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

    // Rain: the far hiss, the body on the ground, the near drops in grains.
    const hiss = gain();
    source().connect(filter('bandpass', 3200, 0.4)).connect(hiss).connect(roof);
    const body = gain();
    source().connect(filter('lowpass', 900, 0.5)).connect(body).connect(roof);
    const patter = gain();
    const grains = gain(0.6); // two waves that never agree, on the level of the drops: they come in handfuls
    wave(6.7, 0.28, grains.gain);
    wave(10.9, 0.22, grains.gain);
    source().connect(filter('highpass', 1700, 0.7)).connect(filter('bandpass', 4300, 1.1)).connect(grains).connect(patter).connect(roof);

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
      to(hiss.gain, l.rain * 0.12);
      to(body.gain, l.rain * 0.1);
      to(patter.gain, l.patter * 0.075);
      to(rushed.gain, l.gale * 0.3);
      to(howl.gain, l.howl * 0.1);
      to(roof.frequency, l.cutoff, 0.5);
    };
  });
  return { set: (kind, amount, inside) => apply?.(levelsOf(kind, amount, inside)) };
}
