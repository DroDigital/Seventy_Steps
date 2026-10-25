/**
 * The impulses of the two rooms a place is heard in (round 78): noise that dies away, brighter at first and duller as it goes
 * (the way a room's highs are soaked up sooner than its lows), a little different in each ear, with a handful of early
 * reflections laid over its start so that it reads as walls and not as a wash. Made once for each context, and made to
 * carry one unit of energy, so that the wet gains of data/acoustics.ts are a share of a sound's amplitude, whatever the
 * impulse's length. Nothing is a file.
 */

export interface Impulse {
  seconds: number; // its length
  rt60: number; // seconds for the tail to fall 60 dB
  early: readonly number[]; // ms at which the early reflections arrive
  damp: number; // how soon the highs die (1: as a stone room)
}

const kept = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

const EARLY = 2.6; // the early reflections against the tail's level at their time
const FALL = 0.82; // each is this much of the one before
const SIDE = 1.11; // the right ear's reflections arrive this much later

/** One ear of an impulse, of unit energy. */
export function impulseEar(rate: number, spec: Impulse, ear: number): Float32Array {
  const len = Math.ceil(rate * spec.seconds);
  const d = new Float32Array(len);
  let seed = (0x9e3779b9 ^ Math.imul(ear + 1, 0x85ebca6b)) >>> 0;
  let lp = 0;
  const onset = (spec.early[0] ?? 8) * 0.0008;
  for (let i = 0; i < len; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    const t = i / rate;
    lp += (noise - lp) * (spec.damp * 0.5 * Math.exp(-t * 1.6) + 0.06);
    const rise = t > onset ? 1 - Math.exp(-(t - onset) / 0.014) : 0; // the diffuse field gathers as the reflections multiply
    d[i] = lp * Math.exp((-t * Math.LN10 * 3) / spec.rt60) * rise;
  }
  let near = 0; // the tail's rms over its first 60 ms, which the early reflections are measured against
  const nearLen = Math.min(len, Math.round(rate * 0.06));
  for (let i = 0; i < nearLen; i++) near += d[i]! * d[i]!;
  near = Math.sqrt(near / Math.max(1, nearLen));
  spec.early.forEach((ms, j) => {
    const at = Math.round((ms / 1000) * (ear === 0 ? 1 : SIDE) * rate);
    const a = EARLY * near * FALL ** j * (j % 2 ? -1 : 1) * Math.exp((-ms / 1000) * Math.LN10 * 3 / spec.rt60);
    for (const [k, w] of [[-1, 0.25], [0, 0.5], [1, 0.25]] as const) if (at + k >= 0 && at + k < len) d[at + k] = d[at + k]! + a * w * 4; // (a pulse three samples wide: not a click)
  });
  const fadeFrom = Math.floor(len * 0.88); // the end is eased out: an impulse cut short rings
  for (let i = fadeFrom; i < len; i++) d[i] = d[i]! * (0.5 + 0.5 * Math.cos((Math.PI * (i - fadeFrom)) / (len - fadeFrom)));
  let energy = 0;
  for (let i = 0; i < len; i++) energy += d[i]! * d[i]!;
  const k = 1 / Math.sqrt(Math.max(1e-12, energy));
  for (let i = 0; i < len; i++) d[i] = d[i]! * k;
  return d;
}

/** The stereo impulse `spec` makes at the context's rate, kept for the context. */
export function spaceImpulse(ctx: BaseAudioContext, name: string, spec: Impulse): AudioBuffer {
  const key = `${name}@${ctx.sampleRate}`;
  const had = kept.get(ctx)?.get(key);
  if (had) return had;
  const buf = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * spec.seconds), ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) buf.getChannelData(ch).set(impulseEar(ctx.sampleRate, spec, ch));
  (kept.get(ctx) ?? kept.set(ctx, new Map()).get(ctx)!).set(key, buf);
  return buf;
}
