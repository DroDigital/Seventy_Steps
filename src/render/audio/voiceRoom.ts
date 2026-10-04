/**
 * A voice's room (round 39: the narrator of the opening was plain, close and dry): the recording is warmed and
 * given some presence, held level by a gentle compressor, and set in a stone room, a convolution reverb whose
 * impulse is made here (noise that dies away, darker as it goes, a little different in each ear) with a breath of
 * pre-delay so the words stay clear in front of it. All of it is meant to be felt rather than heard: a low
 * shelf, a touch of the voice's presence, a quiet wet. Nothing is a file.
 */

export interface Room {
  hp: number; // Hz below which the voice is cut (rumble and plosives)
  warmth: number; // dB of low shelf at 180 Hz
  presence: number; // dB of peak at 3.2 kHz
  squeeze: number; // compressor ratio (1 is none)
  predelay: number; // seconds before the room answers
  decay: number; // seconds for the room's tail to fall by 60 dB
  dark: number; // Hz at which the wet is lowpassed
  wet: number; // level of the room against the voice
}

/** The narrator's: a small chamber of stone, a lamp lit in it. */
export const CHAMBER: Room = { hp: 85, warmth: 2.5, presence: 1.8, squeeze: 2.5, predelay: 0.032, decay: 2.1, dark: 4200, wet: 0.3 };

const impulses = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/** The room's impulse response: stereo noise under a falling envelope, its highs dying sooner than its lows. */
export function impulseOf(ctx: BaseAudioContext, decay: number): AudioBuffer {
  const key = decay.toFixed(2);
  const kept = impulses.get(ctx)?.get(key);
  if (kept) return kept;
  const rate = ctx.sampleRate;
  const len = Math.ceil(rate * decay * 1.15);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let seed = 0x9e3779b9 ^ (ch * 0x85ebca6b);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      const t = i / rate;
      const k = 0.55 * Math.exp(-t * 2.2) + 0.08; // the one-pole's coefficient: bright at first, duller after
      lp += (noise - lp) * k;
      d[i] = lp * Math.exp((-t * Math.LN10 * 3) / decay) * Math.min(1, t / 0.006); // −60 dB over `decay`, the first ms eased in
    }
  }
  (impulses.get(ctx) ?? impulses.set(ctx, new Map()).get(ctx)!).set(key, buf);
  return buf;
}

/** Builds the room between `from` and `to`; returns every node made, to be let go after the tail (`decay` plus the pre-delay). */
export function roomBetween(ctx: AudioContext, from: AudioNode, to: AudioNode, r: Room = CHAMBER): AudioNode[] {
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = r.hp;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowshelf';
  warm.frequency.value = 180;
  warm.gain.value = r.warmth;
  const air = ctx.createBiquadFilter();
  air.type = 'peaking';
  air.frequency.value = 3200;
  air.Q.value = 0.9;
  air.gain.value = r.presence;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -22;
  comp.knee.value = 14;
  comp.ratio.value = r.squeeze;
  comp.attack.value = 0.012;
  comp.release.value = 0.22;
  from.connect(hp).connect(warm).connect(air).connect(comp).connect(to); // the voice, treated
  const pre = ctx.createDelay(0.5);
  pre.delayTime.value = r.predelay;
  const room = ctx.createConvolver();
  room.buffer = impulseOf(ctx, r.decay);
  const dull = ctx.createBiquadFilter();
  dull.type = 'lowpass';
  dull.frequency.value = r.dark;
  const wet = ctx.createGain();
  wet.gain.value = r.wet;
  comp.connect(pre).connect(room).connect(dull).connect(wet).connect(to); // and the room's answer to it
  return [hp, warm, air, comp, pre, room, dull, wet];
}
