/**
 * What a ride sounds like (round 50: the first set was a few short hushed ticks, quieter than the investigator's own footfall, and
 * footsteps are muted on a mount, so a ride was nearly silent). A ride is now heard as a body of sound: a hoofbeat on every
 * foot that comes down (the gait's own: systems/mountGait.ts), the wheels' rumble and rattle and the rush of air as continuous
 * beds that follow the speed and the ground, the harness's brass and leather on each stride, creaks and knocks from the
 * chariot, a snort at the gallop, and for the motor car an engine that climbs with its speed. Procedural recipes
 * (data/sounds.ts) until recordings stand in front of them; levels in `MOUNT_MIX` are set against the impacts (a clang at
 * about -21 dBFS rms): a ride is as present as a fight, and tests/mountAudio.test.ts holds it there.
 */
import { noise, tone, type Sound } from './sounds';

export type Ground = 'dirt' | 'road' | 'stone' | 'water';
export type Shoe = 'iron' | 'bone';

/**
 * Levels of what is heard of a ride, as the gain each recipe is played at, set so that a hoofbeat at the gallop is as present as
 * a landed blow (about -15 dBFS rms) and a walk's about 5 dB under it; a bed's number is the gain of its bus at a full gallop.
 */
export const MOUNT_MIX = {
  hoof: 0.8, // a hoofbeat at its full weight
  hoofSample: 3, // the recorded footfall laid beneath it, pitched down: its set's own gain (0.15 to 0.38) is made up here
  knock: 0.85, // a wheel over a joint or a stone
  jingle: 2.3, // the harness on a stride
  creak: 2.6,
  snort: 1.3,
  nicker: 1.3,
  unhitch: 1.3,
  spectralSummon: 0.85,
  spectralDismiss: 0.9,
  engineStart: 1.2,
  engineStop: 1.2,
  bedRumble: 0.7, // the chassis' low roar
  bedGrind: 0.4, // gravel, cobbles and rattle
  bedWind: 0.24, // the air rushing by, with the square of the speed
  bedEngine: 0.3,
  bedSpectral: 0.28,
} as const;

/** One hoof coming down: its thud, the hollow of the hoof, and the clack of the shoe on what is hard. `weight` 0..1 at a walk to a gallop. */
export function hoofBeat(ground: Ground, o: { hind?: boolean; shoe?: Shoe; weight?: number } = {}): Sound {
  const hind = o.hind ? 1 : 0;
  const weight = o.weight ?? 1;
  const body = o.hind ? 0.9 : 1;
  const layers: Sound[number][] = [];
  if (o.shoe === 'bone') {
    layers.push(
      tone('triangle', 430 * body, 0.1, 0.58, { to: 290 * body, filter: { type: 'bandpass', hz: 520, q: 1.4 } }),
      tone('sine', 150 * body, 0.14, 0.62, { to: 62 }),
      noise('bandpass', 2300, 0.035, 0.58, { q: 3 }),
      tone('triangle', 330 * body, 0.12, 0.24, { at: 0.11, to: 230 }),
      noise('bandpass', 1900, 0.03, 0.2, { at: 0.11, q: 3 }),
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

/** The wheels over a joint, a cobble or a rut: a thump through the axle and a knock of wood. */
export const WHEEL_KNOCK: Sound = [
  tone('triangle', 150, 0.1, 0.62, { to: 74 }),
  noise('lowpass', 900, 0.07, 0.55, { to: 300 }),
  tone('square', 250, 0.035, 0.12, { filter: { type: 'bandpass', hz: 680, q: 1.2 } }),
];

/** Brass rings, buckles and hames shaken on a stride: a small shower of bells above a leather slap. */
export const HARNESS_JINGLE: Sound = [
  tone('sine', 2093, 0.16, 0.12),
  tone('sine', 2794, 0.12, 0.1, { at: 0.012 }),
  tone('sine', 3520, 0.09, 0.08, { at: 0.026 }),
  tone('sine', 1568, 0.2, 0.09, { at: 0.006 }),
  noise('highpass', 5200, 0.05, 0.18, { at: 0.004 }),
  noise('bandpass', 1300, 0.045, 0.38, { q: 2.6 }),
];

/** Old timber and leather taking a load. */
export const CREAK: Sound = [
  noise('bandpass', 360, 0.3, 0.5, { to: 520, q: 2.8, attack: 0.03 }),
  tone('triangle', 128, 0.28, 0.2, { to: 172, vibrato: [11, 26], filter: { type: 'lowpass', hz: 640 } }),
  tone('sawtooth', 420, 0.2, 0.05, { at: 0.05, to: 330, filter: { type: 'bandpass', hz: 700, q: 3 } }),
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

/** The chariot's horse let go: a toss of the head, the harness shaking. */
export const UNHITCH: Sound = [
  noise('bandpass', 1500, 0.22, 0.45, { to: 600, q: 2, attack: 0.01 }),
  tone('sine', 2230, 0.2, 0.1, { at: 0.02 }),
  tone('sine', 3000, 0.14, 0.08, { at: 0.05 }),
  noise('lowpass', 300, 0.3, 0.4, { to: 120 }),
  tone('triangle', 120, 0.3, 0.3, { to: 70 }),
];

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

/** The motor car brought to life: the crank, a cough, the catch. */
export const ENGINE_START: Sound = [
  tone('sawtooth', 120, 0.55, 0.22, { to: 260, filter: { type: 'lowpass', hz: 900 } }),
  noise('bandpass', 1400, 0.5, 0.2, { q: 1.6 }),
  tone('sawtooth', 52, 0.18, 0.6, { at: 0.56, to: 40, filter: { type: 'lowpass', hz: 360 } }),
  tone('sawtooth', 44, 0.5, 0.55, { at: 0.8, to: 38, filter: { type: 'lowpass', hz: 300 } }),
  noise('lowpass', 260, 0.4, 0.45, { at: 0.78, to: 140 }),
];
/** ...and let die: a last shudder, the exhaust's pop. */
export const ENGINE_STOP: Sound = [
  tone('sawtooth', 46, 0.5, 0.55, { to: 24, filter: { type: 'lowpass', hz: 260, to: 120 } }),
  noise('lowpass', 240, 0.4, 0.45, { to: 70 }),
  noise('bandpass', 900, 0.04, 0.5, { at: 0.34, q: 1.4 }),
  tone('triangle', 3400, 0.05, 0.04, { at: 0.5, to: 2600 }),
];
