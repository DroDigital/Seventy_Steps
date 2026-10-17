/**
 * The continuous part of a ride's sound (round 50): what a few short sounds a second cannot make. The chassis' low roar and the
 * gravel's or the cobbles' rattle (pulsing with the wheel's turn), the air rushing by, the motor car's engine climbing with its
 * speed, the spectral chariot's cold drone. They are made of the audio engine's own context in the effects bus (so the effects
 * setting governs them and the sanity FX bend them), start at nothing and follow `bedTargets` each frame. `bedTargets` is pure.
 */
import { MOUNT_MIX, type Ground } from '../../data/mountSounds';
import { MOUNT_TRAVERSAL, type MountId } from '../../data/mounts';
import type { AudioEngine } from './engine';
import { noiseSource } from './synth';

export interface BedTargets {
  rumble: number;
  grind: number;
  grindHz: number;
  /** The wheel's turn, in Hz: the rattle's pulse. */
  grindRate: number;
  wind: number;
  engine: number;
  /** The engine's firing note, in Hz, and how far its throat is open. */
  engineHz: number;
  engineOpen: number;
  spectral: number;
}

export const SILENT_BED: BedTargets = { rumble: 0, grind: 0, grindHz: 700, grindRate: 0, wind: 0, engine: 0, engineHz: 22, engineOpen: 380, spectral: 0 };

/** Where each ground's rattle sits, and how much of it there is. */
const GRIND: Record<Ground, { hz: number; level: number }> = { dirt: { hz: 520, level: 0.8 }, road: { hz: 900, level: 1 }, stone: { hz: 1350, level: 1.1 }, water: { hz: 700, level: 0.55 } };
const WHEEL = 0.5; // metres: a wheel's radius, for its turn

/** What each layer's gain, and the engine's pitch, should be for `id` riding at `speed` over `ground` (nothing for no mount). */
export function bedTargets(id: MountId | null, speed: number, ground: Ground): BedTargets {
  if (!id) return SILENT_BED;
  const load = Math.min(1, Math.max(0, speed / MOUNT_TRAVERSAL.gallop));
  const moving = Math.min(1, Math.max(0, (speed - 0.2) / 1.2));
  const g = GRIND[ground];
  return {
    rumble: MOUNT_MIX.bedRumble * load ** 0.75 * moving,
    grind: MOUNT_MIX.bedGrind * g.level * load ** 0.9 * moving,
    grindHz: g.hz,
    grindRate: Math.max(0, speed) / (2 * Math.PI * WHEEL),
    wind: MOUNT_MIX.bedWind * load * load,
    engine: id === 'automobile' ? MOUNT_MIX.bedEngine * (0.5 + 0.5 * load) : 0,
    engineHz: 22 + 70 * load,
    engineOpen: 380 + 1100 * load,
    spectral: id === 'chariot' ? MOUNT_MIX.bedSpectral * (0.55 + 0.45 * load) : 0,
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
    const grind = layer();
    const grindBand = filter('bandpass', 700, 0.8);
    const pulse = ctx.createGain();
    pulse.gain.value = 0.72;
    const wheelTurn = lfo(0, 0.28, pulse.gain);
    noiseThrough(grindBand, pulse, grind);
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
    const breath = ctx.createGain();
    breath.gain.value = 0.6;
    noiseThrough(filter('bandpass', 380, 0.6), breath, swell);
    lfo(0.13, 0.22, swell.gain);

    apply = (t) => {
      const at = ctx.currentTime;
      const to = (p: AudioParam, v: number, tau = TAU): void => void p.setTargetAtTime(v, at, tau);
      to(rumble.gain, t.rumble);
      to(grind.gain, t.grind);
      to(grindBand.frequency, t.grindHz, 0.25);
      to(wheelTurn.frequency, t.grindRate, 0.2);
      to(wind.gain, t.wind, 0.2);
      to(engine.gain, t.engine, 0.15);
      to(saw.frequency, t.engineHz, 0.08);
      to(sub.frequency, t.engineHz / 2, 0.08);
      to(top.frequency, t.engineHz * 2, 0.08);
      to(throat.frequency, t.engineOpen, 0.1);
      to(firing.frequency, t.engineHz / 2, 0.08);
      to(spectral.gain, t.spectral, 0.4);
    };
  });
  return { set: (t) => apply?.(t) };
}
