/**
 * What a ride sounds like (round 50: the first set was a few short hushed ticks, quieter than the investigator's own footfall, and
 * footsteps are muted on a mount, so a ride was nearly silent). A ride is now heard as a body of sound: a hoofbeat on every
 * foot that comes down (the gait's own: systems/mountGait.ts), the wheels' rumble and rattle and the rush of air as continuous
 * beds that follow the speed and the ground, the harness's brass and leather on each stride, creaks and knocks from the
 * chariot, a snort at the gallop, and for the motor car an engine that climbs with its speed. Round 52: the wheels no longer clatter
 * (a brass jingle, a clacking knock and a pulsing rattle were metallic and tiring): they roll, softly, and thump over a joint; the harness is leather
 * and wood; the skeletons' hooves knock hollow; the spectral chariot breathes and the motor car shifts gear. Procedural recipes
 * (data/sounds.ts) until recordings stand in front of them; levels in `MOUNT_MIX` are set against the impacts (a clang at
 * about -21 dBFS rms): a ride is present in the mix, a notch under a fight (round 61), and tests/mountAudio.test.ts holds it there.
 */
import { noise, tone, type Sound } from './sounds';

export type Ground = 'dirt' | 'road' | 'stone' | 'water';
export type Shoe = 'iron' | 'bone';

/**
 * Levels of what is heard of a ride, as the gain each recipe is played at, set so that a hoofbeat at the gallop is as present as
 * a landed blow (about -15 dBFS rms) and a walk's about 5 dB under it; a bed's number is the gain of its bus at a full gallop.
 * These are the mix before `level`, which is made over all of it (round 61: -6 dB, so a gallop's hoofbeat is about -21).
 */
export const MOUNT_MIX = {
  level: 0.5, // round 61: the whole ride, one notch down (-6 dB) in the mix: it ran 7 to 9 dB over a boss fight's whole sound (docs/SOUND.md), and the horse's recorded voice with it
  hoof: 0.8, // a hoofbeat at its full weight
  hoofSample: 2.2, // the recorded footfall laid beneath it, pitched down: its set's own gain (0.15 to 0.38) is made up here (round 61: 3)
  thump: 0.85, // a wheel over a joint or a stone: a soft knock, not a clack (round 61: 1.15, and half as often on road and stone)
  trace: 1.2, // leather and wood shifting in the harness on a stride
  creak: 2.2,
  snort: 1.3,
  nicker: 1.3,
  unhitch: 1.3,
  urge: 1.2, // the horse's answer to the reins on its back (their slap is not heard: round 60)
  halt: 1.3, // hauled up at speed: the blow through the nose
  scrape: 1.3, // hooves braking on the ground
  shake: 2.0, // the harness shaken as the head is tossed
  blow: 1.9, // idle: a breath out
  whicker: 1.8, // idle: a low shaking call
  swish: 1.6, // idle: the tail
  flutter: 1.6, // idle: the lips
  whisper: 1.5, // the spectral chariot's breath and violet crackle
  pop: 1.15, // the car's exhaust overrun burble, easing off
  gearShift: 1.1, // vintage sliding-mesh gearbox clunk & throttle catch
  carBrake: 1.05, // hard braking tyre scrub, brake band & nose dive
  spectralSummon: 0.85,
  spectralDismiss: 0.9,
  engineStart: 1.15,
  engineStop: 1.15,
  bedRumble: 0.7, // the chassis' low roar
  bedRoll: 0.4, // the wheels rolling: soft, low, and slower than the speed
  bedWind: 0.24, // the air rushing by, with the square of the speed
  bedEngine: 0.34,
  bedSpectral: 0.16, // (round 61: 0.28, the loudest bed by 3 dB)
} as const;

/** One hoof coming down: its thud, the hollow of the hoof, and the clack of the shoe on what is hard. `weight` 0..1 at a walk to a gallop. */
export function hoofBeat(ground: Ground, o: { hind?: boolean; shoe?: Shoe; weight?: number } = {}): Sound {
  const hind = o.hind ? 1 : 0;
  const weight = o.weight ?? 1;
  const body = o.hind ? 0.9 : 1;
  const layers: Sound[number][] = [];
  if (o.shoe === 'bone') { // a hollow knock, bone on the ground: soft in its edge, a little ring inside it
    layers.push(
      tone('sine', 190 * body, 0.12, 0.72, { to: 92 }),
      tone('triangle', 340 * body, 0.09, 0.4, { to: 210, filter: { type: 'lowpass', hz: 900 } }),
      noise('bandpass', 1500, 0.03, 0.34, { q: 1.6 }),
      tone('sine', 280 * body, 0.16, 0.16, { at: 0.07, to: 220 }),
    );
    if (ground === 'water') layers.push(noise('bandpass', 950, 0.2, 0.36, { to: 320, q: 0.6, attack: 0.008 }));
  } else if (ground === 'dirt') {
    layers.push(
      tone('sine', 112 * body, 0.13, 0.85, { to: 46 }),
      tone('triangle', 200 * body, 0.07, 0.4, { to: 96, filter: { type: 'lowpass', hz: 720 } }),
      noise('bandpass', 720, 0.08, 0.55, { to: 330, q: 0.9 }),
      noise('bandpass', 1500, 0.025, 0.22, { q: 2 }),
    );
  } else if (ground === 'road') {
    layers.push(
      tone('sine', 120 * body, 0.11, 0.72, { to: 52 }),
      tone('triangle', 330 * body, 0.075, 0.5, { to: 165, filter: { type: 'bandpass', hz: 640, q: 1.5 } }),
      noise('bandpass', 2700, 0.032, 0.62, { q: 2.4 }),
      noise('bandpass', 800, 0.06, 0.3, { to: 400, q: 0.9 }),
    );
  } else if (ground === 'stone') {
    layers.push(
      tone('sine', 128 * body, 0.09, 0.6, { to: 56 }),
      tone('sine', 540 * body, 0.13, 0.26, { to: 480, attack: 0.002 }),
      noise('bandpass', 3400, 0.04, 0.8, { q: 3 }),
      noise('bandpass', 5200, 0.02, 0.35, { q: 4, at: 0.004 }),
    );
  } else {
    layers.push(
      noise('bandpass', 950, 0.2, 0.7, { to: 320, q: 0.6, attack: 0.008 }),
      tone('sine', 92 * body, 0.13, 0.5, { to: 48 }),
      noise('bandpass', 3000, 0.045, 0.28, { at: 0.05, q: 1.5 }),
    );
  }
  if (weight > 0.62 && o.shoe !== 'bone') layers.push(tone('sine', 66 - 6 * hind, 0.17, 0.5 * (weight - 0.5), { to: 38, attack: 0.004 })); // the ground itself, at a gallop
  return layers;
}

/**
 * A wheel over a joint, a cobble or a rut: a soft thump through the axle, not a clack. `wood` is a coach's iron-shod rim on its felloes, deadened;
 * `rubber` the car's pneumatic tyre and steel leaf springs: deeper, hollower and damped.
 */
export function wheelThump(kind: 'wood' | 'rubber', ground: Ground = 'road'): Sound {
  if (kind === 'rubber') {
    return [
      tone('sine', 74, 0.16, 0.62, { to: 38 }),
      noise('lowpass', ground === 'stone' ? 980 : ground === 'dirt' ? 480 : 680, 0.11, 0.4, { to: 180, q: 0.65 }),
      tone('triangle', 136, 0.12, 0.2, { at: 0.042, to: 84, filter: { type: 'lowpass', hz: 420 } }), // leaf-spring damped rebound
      noise('bandpass', 360, 0.09, 0.18, { at: 0.025, to: 210, q: 1.1 }),
    ];
  }
  const body = 104;
  return [
    tone('sine', body, 0.15, 0.62, { to: body * 0.5 }),
    noise('lowpass', ground === 'stone' ? 1100 : ground === 'dirt' ? 520 : 760, 0.1, 0.42, { to: 200, q: 0.6 }),
    tone('triangle', 180, 0.06, 0.16, { to: 118, filter: { type: 'lowpass', hz: 560 } }),
  ];
}

/** Leather and wood shifting in the harness on a stride: a slap of trace on a hame, the shaft taking the load. Nothing rings. */
export const TRACE_SHIFT: Sound = [
  noise('lowpass', 620, 0.13, 0.34, { to: 240, q: 0.5 }),
  tone('sine', 128, 0.11, 0.2, { to: 88 }),
  noise('bandpass', 880, 0.05, 0.12, { at: 0.018, q: 0.9 }),
];

/** Old timber and leather taking a load: low and woody, no squeal. */
export const CREAK: Sound = [
  noise('bandpass', 330, 0.34, 0.45, { to: 470, q: 1.4, attack: 0.04 }),
  tone('triangle', 118, 0.32, 0.2, { to: 156, vibrato: [9, 24], filter: { type: 'lowpass', hz: 560 } }),
];

/** Air blown out through the nose: the horse's snort at the gallop's start. */
export const SNORT: Sound = [
  noise('bandpass', 1050, 0.24, 0.62, { to: 380, q: 0.7, attack: 0.012 }),
  noise('lowpass', 420, 0.3, 0.45, { to: 140, attack: 0.02 }),
  tone('sine', 140, 0.28, 0.32, { to: 88, attack: 0.02 }),
  noise('highpass', 3200, 0.07, 0.12, { at: 0.02 }),
];

/** A nicker: a low, shaking, throaty call with a breath beneath. */
export const NICKER: Sound = [
  tone('sawtooth', 190, 0.58, 0.3, { to: 150, vibrato: [20, 90], attack: 0.04, filter: { type: 'lowpass', hz: 950 } }),
  tone('triangle', 410, 0.36, 0.2, { at: 0.04, to: 290, vibrato: [8, 40], attack: 0.03 }),
  noise('bandpass', 700, 0.5, 0.2, { to: 480, q: 1.2, attack: 0.05 }),
  tone('sine', 95, 0.4, 0.25, { to: 70 }),
];

/** The chariot's horse let go: a toss of the head, the harness shaken loose. */
export const UNHITCH: Sound = [
  noise('bandpass', 1100, 0.24, 0.42, { to: 480, q: 1.2, attack: 0.012 }),
  noise('lowpass', 300, 0.3, 0.4, { to: 120 }),
  tone('triangle', 120, 0.3, 0.3, { to: 70 }),
];

/** The spectral chariot's breath: a cold sigh through the bones with a faint violet crackle in it. */
export const SPECTRAL_WHISPER: Sound = [
  noise('bandpass', 620, 0.7, 0.4, { to: 1250, q: 1.6, attack: 0.25 }),
  tone('sine', 196, 0.8, 0.14, { to: 175, attack: 0.3, vibrato: [4, 30] }),
  noise('highpass', 3800, 0.03, 0.14, { at: 0.34 }),
  noise('highpass', 4300, 0.025, 0.12, { at: 0.46 }),
  noise('highpass', 3500, 0.03, 0.1, { at: 0.55 }),
];

/** The car's exhaust easing off at speed: a staggered hollow pop and iron-pipe burble. */
export const EXHAUST_POP: Sound = [
  noise('lowpass', 540, 0.08, 0.52, { to: 160 }),
  tone('sine', 82, 0.13, 0.46, { to: 44 }),
  noise('bandpass', 640, 0.06, 0.34, { at: 0.095, to: 260, q: 1.4 }),
  tone('sine', 68, 0.11, 0.36, { at: 0.1, to: 40 }),
  noise('lowpass', 420, 0.08, 0.26, { at: 0.2, to: 140 }),
  tone('triangle', 56, 0.12, 0.22, { at: 0.205, to: 36, filter: { type: 'lowpass', hz: 220 } }),
];

/** Vintage sliding-mesh gearbox shift: iron dog-clutch engage clunk, brass lever snick and brief throttle transition. */
export function gearShift(up: boolean): Sound {
  return [
    tone('sine', up ? 118 : 132, 0.12, 0.52, { to: up ? 58 : 66 }),
    noise('bandpass', up ? 880 : 1020, 0.075, 0.38, { to: 380, q: 1.6 }),
    noise('lowpass', 520, 0.09, 0.3, { at: 0.055, to: 190 }),
    tone('sawtooth', up ? 76 : 48, 0.2, 0.26, { at: 0.06, to: up ? 46 : 68, filter: { type: 'lowpass', hz: 340, to: 220 } }),
    tone('triangle', 260, 0.055, 0.16, { at: 0.012, to: 170, filter: { type: 'lowpass', hz: 700 } }),
  ];
}

/** Hard braking in the Brassbound Motor Car: ground-aware rubber tyre scrub, mechanical brake band groan and nose-dive thud. */
export function carBrake(ground: Ground): Sound {
  if (ground === 'water') {
    return [
      noise('lowpass', 780, 0.34, 0.56, { to: 260, attack: 0.02 }),
      noise('bandpass', 1350, 0.26, 0.34, { to: 620, q: 0.8, attack: 0.03 }),
      tone('sine', 78, 0.22, 0.36, { to: 42 }),
    ];
  }
  const hard = ground === 'stone' ? 1 : ground === 'road' ? 0.6 : 0;
  return [
    noise('bandpass', 560 + 520 * hard, 0.34, 0.44, { to: 260 + 240 * hard, q: 0.9, attack: 0.025 }),
    noise('lowpass', 420, 0.3, 0.4, { to: 140, attack: 0.02 }),
    tone('triangle', 138, 0.28, 0.24, { to: 82, vibrato: [11, 22], attack: 0.03, filter: { type: 'lowpass', hz: 460 } }), // damped brake band groan
    tone('sine', 74, 0.22, 0.42, { to: 40, at: 0.02 }), // front leaf-spring dive thud
  ];
}

/** A great cold wind drawn through a carriage: the spectral chariot's summons. */
export const SPECTRAL_SUMMON: Sound = [
  noise('bandpass', 420, 0.9, 0.55, { to: 1500, q: 0.8, attack: 0.18 }),
  tone('sine', 88, 1.0, 0.45, { to: 46, attack: 0.2 }),
  tone('triangle', 520, 0.8, 0.12, { to: 330, vibrato: [5, 40], attack: 0.15 }),
  noise('highpass', 4000, 0.4, 0.08, { attack: 0.2 }),
];
export const SPECTRAL_DISMISS: Sound = [
  noise('bandpass', 1400, 0.7, 0.45, { to: 320, q: 0.8 }),
  tone('sine', 66, 0.8, 0.4, { to: 34 }),
  tone('triangle', 400, 0.6, 0.1, { to: 240, vibrato: [5, 40] }),
];

/** The Brassbound Motor Car brought to life: magneto click, three rising compression crank turns, intake cough, and a proud inline-4 catch settling into idle (< 1.25 s). */
export const ENGINE_START: Sound = [
  // Magneto brass switch click
  noise('bandpass', 1650, 0.028, 0.26, { q: 2.2 }),
  // Three rhythmic crank/starter compression turns climbing in pace
  tone('sawtooth', 54, 0.14, 0.34, { at: 0.04, to: 68, filter: { type: 'lowpass', hz: 360 } }),
  noise('bandpass', 880, 0.12, 0.2, { at: 0.04, to: 1050, q: 1.8 }),
  tone('sawtooth', 62, 0.14, 0.38, { at: 0.2, to: 78, filter: { type: 'lowpass', hz: 400 } }),
  noise('bandpass', 960, 0.12, 0.22, { at: 0.2, to: 1150, q: 1.8 }),
  tone('sawtooth', 70, 0.14, 0.42, { at: 0.36, to: 92, filter: { type: 'lowpass', hz: 450 } }),
  // Carburetor cough & rich inline-4 ignition catch settling into warm idle
  noise('bandpass', 560, 0.1, 0.44, { at: 0.5, to: 240, q: 1.1 }),
  tone('sawtooth', 78, 0.58, 0.46, { at: 0.54, to: 42, attack: 0.03, filter: { type: 'lowpass', hz: 540, to: 260 } }),
  tone('sine', 52, 0.62, 0.48, { at: 0.54, to: 28, attack: 0.025 }),
  noise('lowpass', 360, 0.52, 0.4, { at: 0.55, to: 140, attack: 0.03 }),
];
/** ...and cut off: magneto click, two stumbling compression dies, hollow exhaust sigh and a tiny hot-iron manifold tick (< 1.0 s). */
export const ENGINE_STOP: Sound = [
  noise('bandpass', 1550, 0.025, 0.24, { q: 2.2 }),
  tone('sawtooth', 46, 0.48, 0.48, { at: 0.02, to: 22, filter: { type: 'lowpass', hz: 280, to: 110 } }),
  tone('sine', 44, 0.46, 0.44, { at: 0.02, to: 24 }),
  noise('lowpass', 250, 0.42, 0.42, { at: 0.02, to: 75 }),
  // Final compression stumble + hollow exhaust puff
  tone('sawtooth', 32, 0.18, 0.32, { at: 0.26, to: 19, filter: { type: 'lowpass', hz: 190 } }),
  noise('bandpass', 560, 0.08, 0.36, { at: 0.38, to: 210, q: 1.3 }),
  tone('triangle', 1650, 0.04, 0.035, { at: 0.62, to: 1320 }),
];

/**
 * The horse and the reins (round 57). What the driver's hands do is heard, and the horse answers: the reins slapped on its back and its
 * eager huff, a hard pull and the blow through its nose with the hooves braking and the harness shaken as the head goes up, and, standing,
 * the small noises of a horse that is not asleep: a breath, a low whicker, a shake of the harness, the tail, the lips, a hoof put down.
 * Leather, hide, breath and wood: nothing rings (as with every sound of a ride).
 */

/** A horse answering the reins on its back: a short eager huff and a grunt in the throat as it digs in. */
export const HORSE_URGE: Sound = [
  noise('bandpass', 1300, 0.16, 0.5, { to: 620, q: 0.8, attack: 0.01 }),
  tone('sawtooth', 168, 0.2, 0.22, { to: 132, vibrato: [18, 70], attack: 0.015, filter: { type: 'lowpass', hz: 820 } }),
  tone('sine', 98, 0.2, 0.26, { to: 72 }),
];

/** Hauled up at speed: a hard blow through the nose with the lips fluttering in it, and the head thrown up. */
export const HORSE_HALT: Sound = [
  noise('bandpass', 980, 0.42, 0.6, { to: 300, q: 0.7, attack: 0.015 }),
  noise('lowpass', 380, 0.46, 0.45, { to: 120, attack: 0.02 }),
  tone('sawtooth', 92, 0.4, 0.2, { to: 70, vibrato: [27, 520], attack: 0.03, filter: { type: 'lowpass', hz: 650 } }),
  tone('sine', 120, 0.3, 0.3, { to: 70 }),
];

/** Hooves braking on the ground: a slide and a dig, sharper where the ground is hard, wet in the shallows. */
export function hoofScrape(ground: Ground): Sound {
  if (ground === 'water') return [noise('lowpass', 700, 0.3, 0.7, { to: 260, attack: 0.02 }), noise('bandpass', 1500, 0.2, 0.4, { q: 0.6, attack: 0.03 })];
  const hard = ground === 'stone' ? 1 : ground === 'road' ? 0.6 : 0;
  return [
    noise('bandpass', 700 + 1500 * hard, 0.3, 0.52, { to: 340 + 700 * hard, q: 0.6, attack: 0.02 }),
    noise('lowpass', 480, 0.26, 0.4, { to: 160, attack: 0.015 }),
    tone('sine', 82, 0.22, 0.3, { to: 52, at: 0.03 }),
  ];
}

/** The harness shaken as the horse tosses its head: leather and wood, three soft slaps, no ring. */
export const HARNESS_SHAKE: Sound = [
  noise('lowpass', 700, 0.1, 0.38, { to: 260, q: 0.5 }),
  noise('lowpass', 640, 0.1, 0.3, { at: 0.1, to: 240, q: 0.5 }),
  noise('lowpass', 580, 0.12, 0.26, { at: 0.2, to: 220, q: 0.5 }),
  noise('bandpass', 900, 0.06, 0.14, { at: 0.02, q: 0.9 }),
  tone('sine', 112, 0.22, 0.2, { to: 82 }),
];

/** Standing: a soft breath out through the nose. */
export const HORSE_BLOW: Sound = [
  noise('bandpass', 760, 0.5, 0.42, { to: 420, q: 0.6, attack: 0.06 }),
  noise('lowpass', 360, 0.5, 0.3, { to: 150, attack: 0.08 }),
  tone('sine', 108, 0.4, 0.14, { to: 80, attack: 0.05 }),
];

/** Standing: a quiet, low, shaking whicker, shorter than the nicker that greets a rider. */
export const HORSE_WHICKER: Sound = [
  tone('sawtooth', 168, 0.42, 0.24, { to: 138, vibrato: [24, 110], attack: 0.05, filter: { type: 'lowpass', hz: 780 } }),
  tone('triangle', 330, 0.3, 0.12, { at: 0.04, to: 250, vibrato: [10, 40], attack: 0.04 }),
  noise('bandpass', 620, 0.4, 0.14, { to: 420, q: 1.1, attack: 0.06 }),
];

/** Standing: the tail brushing across the flanks: air and a little hair. */
export const TAIL_SWISH: Sound = [
  noise('bandpass', 1900, 0.22, 0.22, { to: 3000, q: 0.6, attack: 0.05 }),
  noise('lowpass', 900, 0.2, 0.14, { attack: 0.05 }),
];

/** Standing: the lips blown loose, a soft burr. */
export const LIP_FLUTTER: Sound = [
  tone('sawtooth', 84, 0.34, 0.2, { to: 62, vibrato: [24, 600], attack: 0.03, filter: { type: 'lowpass', hz: 520 } }),
  noise('lowpass', 420, 0.34, 0.22, { attack: 0.03 }),
];
