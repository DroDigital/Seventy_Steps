/**
 * Round 124, the beds no recording fits, made in code (rainTexture.ts's way). Every vault had the one cave and the one grotto of drips
 * (five and a half drops a second, the loudest thing in the room), so a crypt, a cellar, a mine and the stairs of the dream all sounded
 * alike and all dripped. These are what the places have instead (data/dungeonAmbience.ts):
 *   still: the air of a shut room, a low pressure that swells a little, with a breath in it
 *   trickle: water running in a channel, bubbles over a wash (not drops)
 *   embers: a great fire's roar and its pops (hearthTexture.ts's flame, made large)
 *   hum: something the Mi-Go keep running, a hum of a few partials on 86 Hz beating, a thin whine above it
 *   abyss: the dark under the span, a slow deep wind with a moan in it and a whistle that comes and goes
 * Each is a mono loop drawn once that closes on itself (whatever is slow runs whole cycles of the loop, the filters run twice round the
 * ring, an event's tail wraps), at the level of the recordings (rms -22.4 dBFS, peak under 0.9), so a bed's gain reads as theirs do.
 * Nothing here needs the audio context (tests/bedTextures.test.ts). Pure.
 */

import { HEARTH_GREAT } from '../../data/lightSounds';
import { flameTexture } from './hearthTexture';
import { ringLow, stream, type Samples } from './rainTexture';

export const GENERATED_BEDS = ['still', 'trickle', 'embers', 'hum', 'abyss'] as const;
export type GeneratedBed = (typeof GENERATED_BEDS)[number];

/** A bed named `gen_<id>` in the ambience tables is made here, not fetched from public/audio. */
export const GEN = 'gen_';
export const generatedOf = (file: string): GeneratedBed | null => {
  const id = file.startsWith(GEN) ? file.slice(GEN.length) : '';
  return (GENERATED_BEDS as readonly string[]).includes(id) ? (id as GeneratedBed) : null;
};

/** How they are drawn: the rate (none of them has anything above 6 kHz), the loop's length (the fire's shorter), and the recordings' level. Small, so that each is drawn in a few hundredths of a second. */
export const TEXTURE = { rate: 16000, seconds: 12, flame: 8, rms: 10 ** (-22.4 / 20), peak: 0.9 } as const;

const TAU = Math.PI * 2;

/** `hz` rounded to whole cycles of a loop of `seconds` (so it closes). */
const whole = (hz: number, seconds: number): number => Math.max(1, Math.round(hz * seconds)) / seconds;

/** A slow wobble about 1, `depth` of it at most, of partials whose periods are near `periods` (whole cycles of the loop): drawn at 200 points a second and read between them (a sine a sample was most of a texture's time). */
function drift(rnd: () => number, seconds: number, depth: number, periods: readonly number[]): (t: number) => number {
  const parts = periods.map((p, i) => [whole(1 / p, seconds), rnd() * TAU, 1 / (i + 1)] as const);
  const norm = parts.reduce((s, [, , a]) => s + a, 0);
  const per = 200;
  const table = new Float32Array(Math.ceil(seconds * per) + 2);
  for (let j = 0; j < table.length; j++) table[j] = 1 + (depth / norm) * parts.reduce((s, [hz, ph, a]) => s + a * Math.sin(TAU * hz * (j / per) + ph), 0);
  return (t) => {
    const u = t * per;
    const j = Math.floor(u);
    return table[j]! + (table[j + 1]! - table[j]!) * (u - j);
  };
}

function noise(n: number, rnd: () => number): Samples {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1;
  return x;
}

/** The noise between `lo` and `hi` Hz: a one-pole low-pass less another, both round the ring. */
function band(white: Samples, rate: number, lo: number, hi: number): Samples {
  const [top, under] = [ringLow(white, rate, hi), ringLow(white, rate, lo)];
  return top.map((v, i) => v - under[i]!);
}

/** `x` brought to the recordings' level: TEXTURE.rms, its peak held under TEXTURE.peak. */
function level(x: Samples): Samples {
  let [sum, peak] = [0, 1e-9];
  for (const v of x) [sum, peak] = [sum + v * v, Math.max(peak, Math.abs(v))];
  const k = Math.min(TEXTURE.rms / Math.sqrt(sum / x.length || 1e-12), TEXTURE.peak / peak);
  for (let i = 0; i < x.length; i++) x[i]! *= k;
  return x;
}

/** A shut room's air: a hollow pressure (its weight 80 to 300 Hz, where a vault's stone rings and a small speaker still carries it; nothing under 50) that swells a little, and a breath of air (350 Hz to 1.4 kHz) that comes and goes over it. */
function still(rate: number, seconds: number, rnd: () => number): Samples {
  const n = Math.round(rate * seconds);
  const white = noise(n, rnd);
  const low = ringLow(ringLow(white, rate, 400), rate, 300);
  const floor = ringLow(low, rate, 50);
  const air = band(noise(n, rnd), rate, 350, 1400);
  const [swell, breath] = [drift(rnd, seconds, 0.3, [10, 4.4]), drift(rnd, seconds, 0.7, [6.7, 2.9])];
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    out[i] = (low[i]! - floor[i]!) * 4 * swell(t) + air[i]! * 0.5 * Math.max(0, breath(t)) ** 2;
  }
  return level(out);
}

/** Water running in a channel: bubbles (a note that climbs as the bubble rises, 380 Hz to 1.75 kHz, gone in a few hundredths) thick enough to babble, over a wash that flutters; the very top softened. */
function trickle(rate: number, seconds: number, rnd: () => number): Samples {
  const n = Math.round(rate * seconds);
  const out = new Float32Array(n);
  const bubbles = Math.round(34 * seconds);
  for (let b = 0; b < bubbles; b++) {
    const start = Math.floor(rnd() * n);
    const hz = 380 * 2 ** (rnd() * 2.2);
    const life = 0.004 + 0.014 * rnd();
    const rise = 0.25 + 0.6 * rnd();
    const loud = Math.exp(Math.log(0.08) * rnd()); // 0.08 .. 1, even in decibels: most faint
    const length = Math.min(Math.round(rate * life * 5), n);
    const [fall, climb, open] = [Math.exp(-1 / (rate * life)), Math.exp(-1 / (rate * life * 2)), Math.exp(-1 / (rate * 0.0006))]; // (each envelope by one multiplication a sample)
    let [phase, env, left, shut] = [rnd() * TAU, loud, 1, 1];
    for (let i = 0; i < length; i++) {
      phase += (TAU * hz * (1 + rise * (1 - left))) / rate;
      out[(start + i) % n]! += env * (1 - shut) * Math.sin(phase);
      [env, left, shut] = [env * fall, left * climb, shut * open];
    }
  }
  const wash = band(noise(n, rnd), rate, 420, 2400);
  const flutter = ringLow(ringLow(noise(n, rnd), rate, 6), rate, 6);
  let most = 1e-9;
  for (const v of flutter) most = Math.max(most, Math.abs(v));
  for (let i = 0; i < n; i++) out[i]! = out[i]! * 0.5 + wash[i]! * 0.9 * (0.55 + 0.45 * (flutter[i]! / most));
  return level(ringLow(out, rate, 5200));
}

/** Something worked in the dark: two hums a third of a hertz apart (so they beat), each of eight partials on 86 Hz falling slowly away (a buzz the ear finds on any speaker, and not the lit Elder Sign's 98 Hz hum; a cycle of each drawn once and read round), swaying a little, and a thin whine above them that comes and goes four or five times a second. */
function hum(rate: number, seconds: number, rnd: () => number): Samples {
  const n = Math.round(rate * seconds);
  const [f0, f1, whine, trem] = [whole(86, seconds), whole(86.33, seconds), whole(2380, seconds), whole(4.6, seconds)];
  const size = 2048;
  const cycle = (k0: number): Float32Array => {
    const phases = Array.from({ length: 8 }, () => rnd() * TAU);
    const t = new Float32Array(size + 1);
    for (let j = 0; j <= size; j++) for (let k = 1; k <= 8; k++) t[j]! += ((k === 1 ? 0.6 : 1) * k0 * Math.sin((TAU * k * j) / size + phases[k - 1]!)) / k ** 0.8;
    return t;
  };
  const [a, b] = [cycle(1), cycle(0.8)];
  const sine = Float32Array.from({ length: size + 1 }, (_, j) => Math.sin((TAU * j) / size));
  const read = (table: Float32Array, cycles: number): number => {
    const u = (cycles - Math.floor(cycles)) * size;
    const j = Math.floor(u);
    return table[j]! + (table[j + 1]! - table[j]!) * (u - j);
  };
  const sway = drift(rnd, seconds, 0.25, [5, 13]);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    out[i] = (read(a, f0 * t) + read(b, f1 * t)) * sway(t) + 0.03 * (0.5 + 0.5 * read(sine, trem * t)) * read(sine, whine * t);
  }
  return level(out);
}

/** The void under the span: a slow deep wind (under 110 Hz) swelling over the whole loop, a moan (300 to 560 Hz) that surges, and at the height of a surge a thin whistle wandering about 720 Hz. */
function abyss(rate: number, seconds: number, rnd: () => number): Samples {
  const n = Math.round(rate * seconds);
  const white = noise(n, rnd);
  const deep = ringLow(ringLow(white, rate, 110), rate, 80);
  const sub = ringLow(deep, rate, 22);
  const moan = band(noise(n, rnd), rate, 300, 560);
  const [swell, surge, wander] = [drift(rnd, seconds, 0.5, [seconds, 6.7]), drift(rnd, seconds, 0.9, [10, 5]), drift(rnd, seconds, 0.06, [10, 4])];
  const tone = whole(720, seconds); // (the wander's mean is one over whole cycles, so the whistle's phase closes too)
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    phase += (TAU * tone * wander(t)) / rate;
    const up = Math.max(0, surge(t));
    out[i] = (deep[i]! - sub[i]!) * 7 * swell(t) + moan[i]! * 0.55 * up ** 1.5 + 0.03 * Math.max(0, up - 1) ** 2 * Math.sin(phase);
  }
  return level(out);
}

/** The loop of a made bed, `seconds` long at `rate`, mono. The same each time it is drawn (a loop heard again is the same loop). */
export function bedTexture(id: GeneratedBed, rate: number = TEXTURE.rate, seconds: number = TEXTURE.seconds, seed = 1): Samples {
  const rnd = stream(seed * 97 + GENERATED_BEDS.indexOf(id) * 13 + 5);
  if (id === 'embers') return flameTexture({ ...HEARTH_GREAT, seed: HEARTH_GREAT.seed + seed }, rate, Math.min(seconds, TEXTURE.flame), TEXTURE.rms); // (a fire's roar needs no long loop: the hearth's are three seconds)
  return { still, trickle, hum, abyss }[id](rate, seconds, rnd);
}
