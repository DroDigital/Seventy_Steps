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
  /** Throttle/acceleration load (0..1): opens intake induction growl and warms exhaust body. */
  engineLoad: number;
  /** Idle lope modulation depth (0..1): gives the vintage carbureted motor an uneven chug at rest. */
  engineLope: number;
  /** Subtle low-gear straight-cut planetary gearbox hum (0..1) and its pitch (Hz). */
  gearWhine: number;
  gearHz: number;
  spectral: number;
  /** Where the spectral chariot's breath of wind sits, in Hz: it rises as it quickens. */
  spectralHz: number;
}

export const SILENT_BED: BedTargets = {
  rumble: 0, roll: 0, rollHz: 500, rollRate: 0, wind: 0,
  engine: 0, engineHz: 22, engineOpen: 360, engineLoad: 0, engineLope: 0, gearWhine: 0, gearHz: 180,
  spectral: 0, spectralHz: 450,
};

/** Where each ground's roll sits (a low-pass: nothing above it), and how much of it there is. */
const ROLL: Record<Ground, { hz: number; level: number }> = { dirt: { hz: 380, level: 0.85 }, road: { hz: 600, level: 1 }, stone: { hz: 820, level: 1.05 }, water: { hz: 320, level: 0.7 } };
const WHEEL = 0.5; // metres: a wheel's radius, for its turn
/** The motor car's gears: the speeds each begins at (m/s). The engine's note climbs through one and falls as the next is taken. */
export const GEARS = [0, 4.5, 9, 13.5, 18.5].map((v) => (v * MOUNT_TRAVERSAL.gallop) / 18) as readonly number[]; // (set for a gallop of 18; round 55 scaled them to the mounts')

/** Gear index (0..3) at `speed`. */
export function gearAt(speed: number): number {
  let gear = 0;
  while (gear < GEARS.length - 2 && speed >= GEARS[gear + 1]!) gear++;
  return gear;
}

/** The engine's note at `speed`: 22 Hz idling, a rising firing rate through each gear, the shift dropping it back. */
export function engineNote(speed: number): number {
  if (speed < 0.3) return 22;
  const gear = gearAt(speed);
  const f = Math.min(1, Math.max(0, (speed - GEARS[gear]!) / (GEARS[gear + 1]! - GEARS[gear]!)));
  return 22 + 58 * (0.25 + 0.75 * f);
}

/** What each layer's gain, and the engine's pitch, should be for `id` riding at `speed` over `ground` (nothing for no mount). */
export function bedTargets(id: MountId | null, speed: number, ground: Ground, accel = 0): BedTargets {
  if (!id) return SILENT_BED;
  const load = Math.min(1, Math.max(0, speed / MOUNT_TRAVERSAL.gallop));
  const moving = Math.min(1, Math.max(0, (speed - 0.2) / 1.2));
  const g = ROLL[ground];
  const tyre = id === 'automobile';
  const hz = engineNote(speed);
  const gear = gearAt(speed);
  const throttle = tyre ? Math.min(1, Math.max(0.08, 0.28 + load * 0.45 + Math.max(-0.25, Math.min(0.45, accel * 0.08)))) : 0;
  const lope = tyre ? Math.max(0, 1 - speed / 1.4) : 0;
  // Straight-cut vintage gearbox hum is softest in high gear and noticeable in 1st & 2nd
  const gearFactor = gear === 0 ? 1 : gear === 1 ? 0.65 : gear === 2 ? 0.35 : 0.18;
  return {
    rumble: MOUNT_MIX.bedRumble * load ** 0.75 * moving,
    roll: MOUNT_MIX.bedRoll * g.level * (tyre ? 0.8 : 1) * load ** 0.9 * moving,
    rollHz: g.hz * (tyre ? 1.35 : 1),
    rollRate: Math.max(0, speed) / (2 * Math.PI * WHEEL),
    wind: MOUNT_MIX.bedWind * load * load,
    engine: tyre ? MOUNT_MIX.bedEngine * (0.48 + 0.34 * load + 0.18 * throttle) : 0,
    engineHz: hz,
    engineOpen: 290 + 820 * load + 340 * throttle,
    engineLoad: throttle,
    engineLope: lope,
    gearWhine: tyre ? 0.14 * moving * gearFactor * (0.35 + 0.65 * load) : 0,
    gearHz: 155 + (hz - 22) * 4.4,
    spectral: id === 'chariot' ? MOUNT_MIX.bedSpectral * (0.55 + 0.45 * load) : 0,
    spectralHz: 450 + 950 * load,
  };
}

export interface MountBed {
  set(targets: BedTargets): void;
}

const TAU = 0.1; // seconds a layer takes to follow its target

/** Soft asymmetric tanh saturation curve that warms oscillator harmonics into cast-iron cylinder compression. */
function warmSaturationCurve(): Float32Array<ArrayBuffer> {
  const n = 256;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = Math.tanh(x * 2.25 + 0.12 * x * x);
  }
  return curve;
}

export function createMountBed(e: AudioEngine): MountBed {
  let apply: ((t: BedTargets) => void) | null = null;
  e.onStart((ctx) => {
    const sfx = e.sfx;
    if (!sfx) return;
    const out = ctx.createGain();
    out.gain.value = MOUNT_MIX.level; // round 61: the ride as a whole, one notch down
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

    // ---- Upgraded 1914 Inline-4 Engine & Drivetrain Synthesis ----
    const engine = layer();
    const drive = ctx.createWaveShaper();
    drive.curve = warmSaturationCurve();
    drive.oversample = '2x';
    // Resonant cast-iron exhaust manifold formant (+5.5 dB around 185 Hz) feeding dynamic throttle lowpass
    const manifold = filter('peaking', 185, 1.7);
    manifold.gain.value = 5.5;
    const throat = filter('lowpass', 360, 0.85);
    const chug = ctx.createGain();
    chug.gain.value = 0.76;
    drive.connect(manifold).connect(throat).connect(chug).connect(engine);

    const saw = osc('sawtooth', 22, drive, 0.65);
    const sub = osc('square', 11, drive, 0.36); // 4-stroke half-order mechanical thump
    const top = osc('triangle', 44, drive, 0.24); // 2nd firing harmonic
    const cam = osc('sawtooth', 33.1, drive, 0.14); // 1.5x mechanical roughness/valve-cam texture
    const firing = lfo(11, 0.22, chug.gain);

    // Living vintage carbureted idle lope (gentle uneven breathing on pitch at low RPM)
    const lopeDetune = ctx.createGain();
    lopeDetune.gain.value = 0;
    lopeDetune.connect(saw.detune);
    lopeDetune.connect(sub.detune);
    const lopeOscA = ctx.createOscillator();
    lopeOscA.frequency.value = 1.75;
    lopeOscA.connect(lopeDetune);
    lopeOscA.start();
    const lopeOscB = ctx.createOscillator();
    lopeOscB.frequency.value = 2.93;
    const lopeHalf = ctx.createGain();
    lopeHalf.gain.value = 0.55;
    lopeOscB.connect(lopeHalf).connect(lopeDetune);
    lopeOscB.start();

    // Carburetor intake induction growl (opens under throttle acceleration)
    const intakeBand = filter('bandpass', 420, 1.5);
    const intake = ctx.createGain();
    intake.gain.value = 0.08;
    noiseThrough(intakeBand, intake, engine);

    // Subtle mechanical valvetrain/fan belt texture (warm, low-passed well below harshness)
    const valve = ctx.createGain();
    valve.gain.value = 0.065;
    noiseThrough(filter('bandpass', 1220, 2.5), valve, engine);

    // Straight-cut vintage planetary gearbox low-gear whirr
    const gearGain = ctx.createGain();
    gearGain.gain.value = 0;
    const gearFilter = filter('lowpass', 820, 1.1);
    gearFilter.connect(gearGain).connect(engine);
    const gearOsc = osc('triangle', 180, gearFilter, 0.55);

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
      to(engine.gain, t.engine, 0.14);
      to(saw.frequency, t.engineHz, 0.075);
      to(sub.frequency, t.engineHz * 0.5, 0.075);
      to(top.frequency, t.engineHz * 2, 0.075);
      to(cam.frequency, t.engineHz * 1.505, 0.075);
      to(manifold.frequency, 150 + (t.engineHz - 22) * 1.6, 0.12);
      to(throat.frequency, t.engineOpen, 0.1);
      to(firing.frequency, t.engineHz * 0.5, 0.075);
      to(lopeDetune.gain, t.engineLope * 42, 0.22);
      to(intake.gain, 0.05 + t.engineLoad * 0.24, 0.12);
      to(intakeBand.frequency, 280 + t.engineLoad * 440, 0.14);
      to(gearGain.gain, t.gearWhine, 0.14);
      to(gearOsc.frequency, t.gearHz, 0.1);
      to(spectral.gain, t.spectral, 0.4);
      to(whistleBand.frequency, t.spectralHz, 0.5);
    };
  });
  return { set: (t) => apply?.(t) };
}
