/**
 * An offline render of a sound recipe (data/sounds.ts) for the tests, as render/audio/synth.ts plays it on WebAudio:
 * each layer an oscillator (its glide an exponential ramp, its vibrato in cents) or white noise, through its biquad
 * (swept exponentially) and its envelope (a linear attack, then an exponential fall to 0.0005 at its end). Mono, summed.
 * What the tests measure (peak, loudness, length) is of the recipe's own gain and shape, before the pan, the bus and the limiter.
 */

import type { Layer, Sound } from '../src/data/sounds';

export const RATE = 22050;
const BLOCK = 32; // samples between a filter's coefficients being set again

interface Biquad { b0: number; b1: number; b2: number; a1: number; a2: number }

/** WebAudio's biquads: a low-pass or high-pass has its Q in dB, a band-pass its Q as a ratio (peak gain 1). */
function coefficients(type: 'lowpass' | 'highpass' | 'bandpass', hz: number, q: number): Biquad {
  const w = (2 * Math.PI * Math.min(hz, RATE * 0.45)) / RATE;
  const [cos, sin] = [Math.cos(w), Math.sin(w)];
  let [b0, b1, b2, a0, a1, a2] = [0, 0, 0, 1, 0, 0];
  if (type === 'bandpass') {
    const alpha = sin / (2 * Math.max(q, 1e-3));
    [b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha];
  } else {
    const alpha = sin / (2 * 10 ** (q / 20));
    const k = type === 'lowpass' ? 1 - cos : 1 + cos;
    [b0, b1, b2, a0, a1, a2] = [k / 2, type === 'lowpass' ? k : -k, k / 2, 1 + alpha, -2 * cos, 1 - alpha];
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** One layer, `pitch` times its frequencies, into `out` (summed) from `from` seconds. */
function layer(out: Float32Array, l: Layer, from: number, pitch: number): void {
  const [start, n] = [Math.round((from + (l.at ?? 0)) * RATE), Math.round(l.dur * RATE)];
  const attack = Math.min(l.attack ?? 0.005, l.dur * 0.9);
  let [phase, seed, x1, x2, y1, y2] = [0, 1926 + start, 0, 0, 0, 0];
  let c: Biquad | null = null;
  for (let i = 0; i < n && start + i < out.length; i++) {
    const t = i / RATE;
    const u = t / l.dur;
    let s: number;
    if (l.src === 'noise') {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      s = seed / 2 ** 31 - 1;
    } else {
      let hz = (l.hz ?? 440) * pitch * (l.to ? (l.to / (l.hz ?? 440)) ** u : 1);
      if (l.vibrato) hz *= 2 ** ((l.vibrato[1] * Math.sin(2 * Math.PI * l.vibrato[0] * t)) / 1200);
      phase += hz / RATE;
      const p = phase % 1;
      s = l.src === 'sine' ? Math.sin(2 * Math.PI * p) : l.src === 'square' ? (p < 0.5 ? 1 : -1) : l.src === 'sawtooth' ? 2 * p - 1 : 4 * Math.abs(p - 0.5) - 1;
    }
    if (l.filter) {
      if (i % BLOCK === 0 || !c) c = coefficients(l.filter.type, l.filter.hz * pitch * (l.filter.to ? (l.filter.to / l.filter.hz) ** u : 1), l.filter.q ?? 1);
      const y = c.b0 * s + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
      [x2, x1, y2, y1] = [x1, s, y1, y];
      s = y;
    }
    const env = t < attack ? (t / attack) * l.gain : l.gain * (0.0005 / l.gain) ** ((t - attack) / Math.max(1e-6, l.dur - attack));
    out[start + i] += s * env;
  }
}

export interface Rendered {
  samples: Float32Array;
  peak: number; // dBFS
  rms: number; // dBFS over the stretches within 40 dB of the peak (as tools/audio_levels.py reads a recording)
  sec: number; // the sound's length: to where it last stands within 40 dB of its peak
}

const db = (v: number): number => 20 * Math.log10(Math.max(v, 1e-9));

/** `sound` rendered, and measured. */
export function render(sound: Sound, pitch = 1): Rendered {
  const end = Math.max(...sound.map((l) => (l.at ?? 0) + l.dur)) + 0.05;
  const samples = new Float32Array(Math.ceil(end * RATE));
  for (const l of sound) layer(samples, l, 0, pitch);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const win = Math.round(RATE * 0.02);
  let [sum, live, last] = [0, 0, 0];
  for (let w = 0; w + win <= samples.length; w += win) {
    let e = 0;
    for (let i = w; i < w + win; i++) e += samples[i] * samples[i];
    const rms = Math.sqrt(e / win);
    if (rms > peak * 0.01) [sum, live, last] = [sum + e, live + win, w + win];
  }
  return { samples, peak: db(peak), rms: db(Math.sqrt(sum / Math.max(1, live))), sec: last / RATE };
}
