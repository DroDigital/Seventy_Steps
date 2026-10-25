/**
 * A flame's noise, drawn once as a loop that closes on itself (round 78; the way rainTexture.ts draws rain): a low rumble that
 * swells and falls, the airy hiss of burning, and pops at random, each a short bandpassed burst with a tick at its start, a few
 * of them sharp snaps. Everything slow runs whole cycles to the loop, the filters are run twice round the ring, and the pops'
 * tails wrap, so the end meets the start. Nothing here needs the audio context; the loop is drawn to a fixed rms, so the kinds'
 * gains in data/lightSounds.ts are levels.
 */

import type { FlameSpec } from '../../data/lightSounds';

type Samples = Float32Array<ArrayBuffer>;
const TAU = Math.PI * 2;

function stream(seed: number): () => number {
  let n = (seed * 2654435761) >>> 0 || 1;
  return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** A one-pole low-pass about its ring, run twice round so that the end meets the start. */
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

/** A slow wobble about 1 in whole cycles of the loop (so it closes): `depth` of it. */
function swell(rnd: () => number, seconds: number, depth: number): (t: number) => number {
  const parts = [[Math.max(1, Math.round(seconds * 0.9)) / seconds, rnd() * TAU, 0.55], [Math.max(1, Math.round(seconds * 2.3)) / seconds, rnd() * TAU, 0.3], [Math.max(1, Math.round(seconds * 5.1)) / seconds, rnd() * TAU, 0.15]] as const;
  return (t) => Math.max(0, 1 + depth * parts.reduce((s, [hz, ph, a]) => s + a * Math.sin(TAU * hz * t + ph), 0));
}

/** The loop of one flame: `seconds` long at `rate`, mono, drawn to `level` rms (its peak held under 0.85). */
export function flameTexture(spec: FlameSpec, rate: number, seconds: number, level: number): Samples {
  const n = Math.round(rate * seconds);
  const rnd = stream(spec.seed * 31 + 7);
  const white = (length = n): Samples => Float32Array.from({ length }, () => rnd() * 2 - 1); // (a pop draws only the few samples it uses)
  const out = new Float32Array(n);
  if (spec.body > 0) {
    const body = ringLow(ringLow(white(), rate, spec.rumble), rate, spec.rumble);
    const low = ringLow(body, rate, 30); // (no thump below it)
    const sway = swell(rnd, seconds, spec.flutter);
    for (let i = 0; i < n; i++) out[i]! += (body[i]! - low[i]!) * spec.body * 5 * sway(i / rate);
  }
  const hiss = white();
  const air = ringLow(hiss, rate, spec.band[1]);
  const under = ringLow(hiss, rate, spec.band[0] * 0.8);
  const flare = swell(rnd, seconds, 0.7);
  for (let i = 0; i < n; i++) out[i]! += (air[i]! - under[i]!) * spec.hiss * 1.6 * flare(i / rate) ** 2;
  const pops = Math.round(spec.pops * seconds);
  for (let p = 0; p < pops; p++) {
    const start = Math.floor(rnd() * n);
    const loud = spec.pop * Math.exp(Math.log(0.12) * (1 - rnd()) ** 1.5); // 0.12 .. 1 of its level, many faint and a few not
    const life = 0.003 + 0.011 * rnd(); // seconds the burst takes to die
    const snap = rnd() < 0.14;
    const burst = white(Math.round(rate * 0.06));
    const top = ringLow(burst, rate, spec.band[1] * (0.7 + 0.6 * rnd()));
    const bottom = ringLow(burst, rate, spec.band[0]);
    for (let i = 0; i < burst.length; i++) {
      const t = i / rate;
      const tick = snap && t < 0.0008 ? (1 - t / 0.0008) * 1.6 * (rnd() < 0.5 ? -1 : 1) : 0;
      out[(start + i) % n]! += loud * 0.5 * ((top[i]! - bottom[i]!) * 3 * Math.exp(-t / life) * (1 - Math.exp(-t / 0.0006)) + tick);
    }
  }
  let [sum, peak] = [0, 1e-9];
  for (let i = 0; i < n; i++) {
    sum += out[i]! * out[i]!;
    peak = Math.max(peak, Math.abs(out[i]!));
  }
  const k = Math.min(level / Math.sqrt(sum / n), 0.85 / peak);
  for (let i = 0; i < n; i++) out[i]! *= k;
  return out;
}
