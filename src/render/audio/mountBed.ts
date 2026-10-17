/**
 * The continuous part of a ride's sound (round 50): what a few short sounds a second cannot make. The chassis' low roar and the
 * wheels rolling (round 52: a soft, low roll that swells a little with the wheel's turn; it was a bandpassed rattle at the wheel's rate,
 * which was metallic and tiring), the air rushing by, the motor car's engine climbing through its gears with its speed, the spectral
 * chariot's cold drone with a breath of wind through it that rises as it quickens. They are made of the audio engine's own context in the effects bus (so the effects
 * setting governs them and the sanity FX bend them), start at nothing and follow `bedTargets` each frame. `bedTargets` is pure.
 */
import { MOUNT_MIX, type Ground } from '../../data/mountSounds';
import { MOUNT_TRAVERSAL, type MountId } from '../../data/mounts';
import type { AudioEngine } from './engine';
import { noiseSource } from './synth';

export interface BedTargets {
  rumble: number;
  roll: number;
  /** The roll's cut-off: low for dirt, higher on stone, and the car's tyres a little above a coach's wheels. */
  rollHz: number;
  /** The wheel's turn, in Hz: the roll's slow swell. */
  rollRate: number;
  wind: number;
  engine: number;
  /** The engine's firing note, in Hz, and how far its throat is open. */
  engineHz: number;
  engineOpen: number;
  spectral: number;
  /** Where the spectral chariot's breath of wind sits, in Hz: it rises as it quickens. */
  spectralHz: number;
}

export const SILENT_BED: BedTargets = { rumble: 0, roll: 0, rollHz: 500, rollRate: 0, wind: 0, engine: 0, engineHz: 22, engineOpen: 380, spectral: 0, spectralHz: 450 };

/** Where each ground's roll sits (a low-pass: nothing above it), and how much of it there is. */
const ROLL: Record<Ground, { hz: number; level: number }> = { dirt: { hz: 380, level: 0.85 }, road: { hz: 600, level: 1 }, stone: { hz: 820, level: 1.05 }, water: { hz: 320, level: 0.7 } };
const WHEEL = 0.5; // metres: a wheel's radius, for its turn
/** The motor car's gears: the speeds each begins at (m/s). The engine's note climbs through one and falls as the next is taken. */
export const GEARS = [0, 4.5, 9, 13.5, 18.5].map((v) => (v * MOUNT_TRAVERSAL.gallop) / 18) as readonly number[]; // (set for a gallop of 18; round 55 scaled them to the mounts')

/** The engine's note at `speed`: 22 Hz idling, a rising firing rate through each gear, the shift dropping it back. */
export function engineNote(speed: number): number {
  if (speed < 0.3) return 22;
  let gear = 0;
  while (gear < GEARS.length - 2 && speed >= GEARS[gear + 1]!) gear++;
  const f = Math.min(1, Math.max(0, (speed - GEARS[gear]!) / (GEARS[gear + 1]! - GEARS[gear]!)));
  return 22 + 58 * (0.25 + 0.75 * f);
}

/** What each layer's gain, and the engine's pitch, should be for `id` riding at `speed` over `ground` (nothing for no mount). */
export function bedTargets(id: MountId | null, speed: number, ground: Ground): BedTargets {
  if (!id) return SILENT_BED;
  const load = Math.min(1, Math.max(0, speed / MOUNT_TRAVERSAL.gallop));
  const moving = Math.min(1, Math.max(0, (speed - 0.2) / 1.2));
  const g = ROLL[ground];
  const tyre = id === 'automobile';
  return {
    rumble: MOUNT_MIX.bedRumble * load ** 0.75 * moving,
    roll: MOUNT_MIX.bedRoll * g.level * (tyre ? 0.8 : 1) * load ** 0.9 * moving,
    rollHz: g.hz * (tyre ? 1.35 : 1),
    rollRate: Math.max(0, speed) / (2 * Math.PI * WHEEL),
    wind: MOUNT_MIX.bedWind * load * load,
    engine: tyre ? MOUNT_MIX.bedEngine * (0.5 + 0.5 * load) : 0,
    engineHz: engineNote(speed),
    engineOpen: 380 + 1100 * load,
    spectral: id === 'chariot' ? MOUNT_MIX.bedSpectral * (0.55 + 0.45 * load) : 0,
    spectralHz: 450 + 950 * load,
  };
}

export interface MountBed {
  set(targets: BedTargets): void;
}

const TAU = 0.1; // seconds a layer takes to follow its target

export function createMountBed(e: AudioEngine): MountBed {
  let apply: ((t: BedTargets) => void) | null = null;
  e.onStart((ctx) => {
    const sfx = e.sfx;
    if (!sfx) return;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(sfx);
    const layer = (): GainNode => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(out);
      return g;
    };
    const noiseThrough = (...nodes: AudioNode[]): AudioNode => {
      const src = noiseSource(ctx);
      src.start(0, Math.random() * 1.9);
      return nodes.reduce((from, to) => from.connect(to), src as AudioNode);
    };
    const filter = (type: BiquadFilterType, hz: number, q: number): BiquadFilterNode => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = hz;
      f.Q.value = q;
      return f;
    };
    const lfo = (hz: number, depth: number, into: AudioParam): OscillatorNode => {
      const o = ctx.createOscillator();
      const d = ctx.createGain();
      o.frequency.value = hz;
      d.gain.value = depth;
      o.connect(d).connect(into);
      o.start();
      return o;
    };
    const osc = (type: OscillatorType, hz: number, into: AudioNode, gain: number): OscillatorNode => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = hz;
      g.gain.value = gain;
      o.connect(g).connect(into);
      o.start();
      return o;
    };

    const rumble = layer();
    noiseThrough(filter('lowpass', 190, 0.7), rumble);
    const roll = layer();
    const rollBand = filter('lowpass', 500, 0.5);
    const pulse = ctx.createGain();
    pulse.gain.value = 0.88;
    const wheelTurn = lfo(0, 0.1, pulse.gain);
    noiseThrough(rollBand, pulse, roll);
    const wind = layer();
    const gusts = ctx.createGain(); // (a low wave on a level of its own: on the layer's gain it would be heard with the layer at nothing)
    gusts.gain.value = 0.75;
    lfo(0.23, 0.25, gusts.gain);
    noiseThrough(filter('highpass', 450, 0.7), filter('lowpass', 3200, 0.7), gusts, wind);

    const engine = layer();
    const throat = filter('lowpass', 380, 0.9);
    const chug = ctx.createGain();
    chug.gain.value = 0.78;
    throat.connect(chug).connect(engine);
    const saw = osc('sawtooth', 22, throat, 1);
    const sub = osc('square', 11, throat, 0.5);
    const top = osc('triangle', 44, throat, 0.25);
    const firing = lfo(11, 0.22, chug.gain);
    const clatter = ctx.createGain();
    clatter.gain.value = 0.12;
    noiseThrough(filter('bandpass', 1800, 3), clatter, engine);

    const spectral = layer();
    const swell = ctx.createGain();
    swell.gain.value = 0.75;
    swell.connect(spectral);
    osc('sine', 55, swell, 0.5);
    osc('sine', 57.3, swell, 0.5);
    osc('triangle', 110, swell, 0.18);
    osc('sine', 82.5, swell, 0.22);
    const breath = ctx.createGain();
    breath.gain.value = 0.6;
    noiseThrough(filter('bandpass', 380, 0.6), breath, swell);
    const whistleBand = filter('bandpass', 450, 4);
    const whistle = ctx.createGain();
    whistle.gain.value = 0.3;
    lfo(0.31, 0.12, whistle.gain);
    noiseThrough(whistleBand, whistle, swell);
    lfo(0.13, 0.22, swell.gain);

    apply = (t) => {
      const at = ctx.currentTime;
      const to = (p: AudioParam, v: number, tau = TAU): void => void p.setTargetAtTime(v, at, tau);
      to(rumble.gain, t.rumble);
      to(roll.gain, t.roll);
      to(rollBand.frequency, t.rollHz, 0.25);
      to(wheelTurn.frequency, t.rollRate, 0.2);
      to(wind.gain, t.wind, 0.2);
      to(engine.gain, t.engine, 0.15);
      to(saw.frequency, t.engineHz, 0.08);
      to(sub.frequency, t.engineHz / 2, 0.08);
      to(top.frequency, t.engineHz * 2, 0.08);
      to(throat.frequency, t.engineOpen, 0.1);
      to(firing.frequency, t.engineHz / 2, 0.08);
      to(spectral.gain, t.spectral, 0.4);
      to(whistleBand.frequency, t.spectralHz, 0.5);
    };
  });
  return { set: (t) => apply?.(t) };
}
