/**
 * Rain, made of what it is (round 53). The bed's rain was three bands of white noise (a hiss at 3 kHz and a crackle above it), which
 * sits on the ear as static and fights the crickets, the wind and the music for the same high frequencies. Rain is two things instead: a soft
 * wash that has nothing above a kilohertz or so to speak of (what a hundred thousand drops make together, far off), and the drops
 * themselves, each a short soft note with a tick at its start, scattered at random: few and quiet in a light rain, many in a downpour, some
 * of them heavy and low (what is left of them under a roof). Both are drawn once, as loops that close on themselves, and played from a buffer;
 * nothing here needs the audio context, so what they are is tested (tests/rainTexture.test.ts). Pure.
 */

type Samples = Float32Array<ArrayBuffer>;

export interface Texture {
  left: Samples;
  right: Samples;
}

const TAU = Math.PI * 2;

/** A small seeded stream (the same rain on every start: a loop heard again is the same loop). */
function stream(seed: number): () => number {
  let n = (seed * 2654435761) >>> 0 || 1;
  return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** One-pole low-pass of `x` about its ring, run twice round so that the end meets the start (a loop that closes). */
function ringLow(x: Samples, rate: number, hz: number): Samples {
  const k = 1 - Math.exp((-TAU * hz) / rate);
  const y = new Float32Array(x.length);
  let s = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < x.length; i++) {
      s += k * (x[i]! - s);
      if (pass === 1) y[i] = s;
    }
  }
  return y;
}

/**
 * The wash: noise rolled off twice (a soft "shh" with its weight about 300 to 800 Hz and almost nothing above 2 kHz), its lowest rumble
 * taken out, and a slow swell in it, over a few seconds, so that it is not one level. Peak 0.5.
 */
export function washTexture(rate: number, seconds: number, seed = 1): Texture {
  const n = Math.round(rate * seconds);
  const one = (side: number): Samples => {
    const rnd = stream(seed * 7 + side);
    const white = new Float32Array(n);
    for (let i = 0; i < n; i++) white[i] = rnd() * 2 - 1;
    const soft = ringLow(ringLow(white, rate, 1100), rate, 650);
    const rumble = ringLow(soft, rate, 140);
    const swell = [[Math.max(1, Math.round(seconds * 0.31)) / seconds, rnd() * TAU, 0.14], [Math.max(1, Math.round(seconds * 0.83)) / seconds, rnd() * TAU, 0.08]] as const; // whole cycles in the loop
    let peak = 0;
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      y[i] = (soft[i]! - rumble[i]!) * (1 + swell.reduce((s, [hz, ph, d]) => s + d * Math.sin(TAU * hz * t + ph), 0));
      peak = Math.max(peak, Math.abs(y[i]!));
    }
    for (let i = 0; i < n; i++) y[i] = (y[i]! / peak) * 0.5;
    return y;
  };
  return { left: one(1), right: one(2) };
}

/**
 * The drops: `perSecond` of them, at random times and in random places between the ears. Each is a soft note (a sine that dies in a few
 * hundredths of a second, between 600 Hz and 2.6 kHz, rising a little as a drop's note does) with a one-millisecond tick at its start; most are
 * faint and a few are not (their loudness is spread evenly in decibels); a third have a low, heavier note under them (200 to 520 Hz).
 * Their tails wrap round the loop's end. Peak 0.8.
 */
export function dropTexture(rate: number, seconds: number, perSecond: number, seed = 1): Texture {
  const n = Math.round(rate * seconds);
  const rnd = stream(seed * 13 + Math.round(perSecond));
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  const drops = Math.round(perSecond * seconds);
  for (let d = 0; d < drops; d++) {
    const start = Math.floor(rnd() * n);
    const loud = Math.exp(Math.log(0.05) * (1 - rnd())); // 0.05 .. 1, even in decibels
    const hz = 600 + 2000 * rnd() ** 1.4;
    const life = 0.006 + 0.016 * rnd(); // the note's decay, seconds
    const heavy = rnd() < 0.34 ? 200 + 320 * rnd() : 0;
    const pan = 0.15 + 0.7 * rnd();
    const [gl, gr] = [Math.cos((pan * Math.PI) / 2), Math.sin((pan * Math.PI) / 2)];
    const length = Math.min(Math.round(rate * 0.14), n);
    let phase = rnd() * TAU;
    let low = rnd() * TAU;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      phase += (TAU * hz * (1 + 0.3 * (1 - Math.exp(-t / 0.012)))) / rate;
      low += (TAU * heavy) / rate;
      const note = Math.sin(phase) * Math.exp(-t / life) * (1 - Math.exp(-t / 0.0007)); // a soft start: no click
      const thup = heavy ? 0.55 * Math.sin(low) * Math.exp(-t / 0.03) * (1 - Math.exp(-t / 0.002)) : 0;
      const tick = t < 0.001 ? (rnd() * 2 - 1) * 0.25 * (1 - t / 0.001) : 0;
      const v = loud * (note + thup + tick);
      const at = (start + i) % n;
      left[at] += v * gl;
      right[at] += v * gr;
    }
  }
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]!), Math.abs(right[i]!));
  for (let i = 0; i < n; i++) {
    left[i] = (left[i]! / peak) * 0.8;
    right[i] = (right[i]! / peak) * 0.8;
  }
  return { left, right };
}
