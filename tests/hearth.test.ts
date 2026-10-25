import { describe, expect, it } from 'vitest';
import { HEARTH, type HearthKind } from '../src/data/lightSounds';
import { LIGHTS } from '../src/data/tuning';
import { AUDIO } from '../src/data/tuning';
import { createHearth, HEARTH_NOW } from '../src/render/audio/hearth';
import { hearthPlan, keyOf, lawOf } from '../src/render/audio/hearthPlan';
import { flameTexture } from '../src/render/audio/hearthTexture';
import { beginHeard, HEARD_LIGHTS, pushHeard, type HeardLight } from '../src/render/audio/heardLights';

const { rate, seconds } = HEARTH.texture;
const rms = (d: Float32Array): number => Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length);
const db = (v: number): number => 20 * Math.log10(v);
const light = (kind: HeardLight['kind'], d: number, o: Partial<HeardLight> = {}): HeardLight => ({ x: d, y: 2, z: 0, kind, d, v: 1, flicker: 1, ...o });
const ear = { x: 0, y: 1.5, z: 0 };
const right = { x: 1, y: 0, z: 0 };

describe('the flames\' noise (round 78)', () => {
  const textures = Object.fromEntries((['fire', 'torch', 'lamp'] as const).map((k) => [k, flameTexture(HEARTH.flames[k], rate, seconds, HEARTH.level)]));

  it('is drawn to a loop that closes: no step where the end meets the start, and no sample out of range', () => {
    for (const [kind, d] of Object.entries(textures)) {
      expect(d.length, kind).toBe(rate * seconds);
      expect(d.every(Number.isFinite), kind).toBe(true);
      expect(Math.max(...d.map(Math.abs)), kind).toBeLessThanOrEqual(0.85 + 1e-6);
      const typical = Math.sqrt(d.reduce((s, x, i) => s + (i ? (x - d[i - 1]!) ** 2 : 0), 0) / d.length); // a sample-to-sample step
      expect(Math.abs(d[0]! - d[d.length - 1]!), kind).toBeLessThan(typical * 6);
    }
  });

  it('is at the level it is drawn to, and is made the same each time', () => {
    for (const [kind, d] of Object.entries(textures)) expect(rms(d), kind).toBeGreaterThan(HEARTH.level * 0.55);
    expect(flameTexture(HEARTH.flames.torch, rate, seconds, HEARTH.level)).toEqual(textures.torch);
    expect(textures.fire).not.toEqual(textures.torch);
  });

  it('crackles: it has pops standing out of its body, more in a fire than in a lamp', () => {
    const crest = (d: Float32Array): number => Math.max(...d.map(Math.abs)) / rms(d);
    expect(crest(textures.fire!)).toBeGreaterThan(3.5);
    expect(crest(textures.torch!)).toBeGreaterThan(3.5);
    expect(crest(textures.fire!)).toBeGreaterThan(crest(textures.lamp!) * 0.8);
  });

  it('is quiet at two metres: about -40 dBFS, nowhere near a footfall', () => {
    for (const kind of ['fire', 'torch', 'lamp'] as const) {
      const level = db(rms(textures[kind]!) * HEARTH.kinds[kind].gain);
      expect(level, kind).toBeLessThan(-36);
      expect(level, kind).toBeGreaterThan(-52);
    }
    const { tones, air, mix } = HEARTH.sigil;
    const hum = db(Math.sqrt(tones.reduce((s, [, a]) => s + (a * mix) ** 2 / 2, 0) + air ** 2 * 0.1) * HEARTH.kinds.sigil.gain); // (the sines' power, and a little of the breath through its band)
    expect(hum).toBeLessThan(-36);
    expect(hum).toBeGreaterThan(-52);
  });

  it('hums a Sign in beating pairs a few tenths of a hertz apart', () => {
    const { tones } = HEARTH.sigil;
    for (let i = 0; i + 1 < tones.length; i += 2) {
      const beat = Math.abs(tones[i + 1]![0] - tones[i]![0]);
      expect(beat).toBeGreaterThan(0.1);
      expect(beat).toBeLessThan(0.6);
    }
  });
});

describe('which lights are heard (round 78)', () => {
  it('hears no light beyond its range, and no more than the lights\' own range x 1.6', () => {
    for (const kind of Object.keys(HEARTH.kinds) as HearthKind[]) {
      expect(HEARTH.kinds[kind].range, kind).toBeLessThanOrEqual(LIGHTS.kinds[kind].range * 1.6 + 1e-9);
      expect(lawOf(HEARTH.kinds[kind].range, HEARTH.kinds[kind].range)).toBe(0);
      expect(hearthPlan([light(kind, HEARTH.kinds[kind].range + 0.5)], ear, right, () => 1)).toHaveLength(0);
      expect(hearthPlan([light(kind, HEARTH.kinds[kind].range - 0.5)], ear, right, () => 1)).toHaveLength(1);
    }
    expect(hearthPlan([light('window', 2)], ear, right, () => 1)).toHaveLength(0);
  });

  it('follows the game\'s law of distance: whole within AUDIO.near, then falling, never rising', () => {
    expect(lawOf(AUDIO.near - 0.5, 10)).toBe(1);
    let last = 1;
    for (let d = AUDIO.near; d < 10; d += 0.5) {
      const v = lawOf(d, 10);
      expect(v).toBeLessThanOrEqual(last);
      last = v;
    }
    let level = Infinity;
    for (let d = 1; d < 10; d += 1) {
      const p = hearthPlan([light('torch', d)], ear, right, () => 1)[0];
      if (!p) break;
      expect(p.level).toBeLessThanOrEqual(level);
      level = p.level;
    }
  });

  it('gives the voices to the loudest few, loudest first', () => {
    const lights = [light('torch', 8), light('torch', 2), light('fire', 5), light('torch', 4), light('torch', 6), light('lamp', 3), light('torch', 3)].map((l, i) => ({ ...l, x: l.x, z: i }));
    const plan = hearthPlan(lights, ear, right, () => 1);
    expect(plan.length).toBe(HEARTH.voices);
    for (let i = 1; i < plan.length; i++) expect(plan[i - 1]!.level).toBeGreaterThanOrEqual(plan[i]!.level);
  });

  it('hears a flame the eye cannot see dulled and quieter, not cut', () => {
    const seen = hearthPlan([light('torch', 2.5)], ear, right, () => 1)[0]!;
    const hidden = { ...hearthPlan([light('torch', 2.5)], ear, right, () => 0)[0]! };
    expect(hidden.level).toBeCloseTo(seen.level * HEARTH.floor, 6);
    expect(hidden.level).toBeGreaterThan(0);
    expect(hidden.cutoff).toBeCloseTo(HEARTH.dull, 0);
    expect(seen.cutoff).toBeGreaterThan(hidden.cutoff * 3);
  });

  it('sets a flame to the side it is on, and follows its flicker and the mind\'s gutter', () => {
    const [left, rightward] = [hearthPlan([light('torch', 3, { x: -3 })], ear, right, () => 1)[0]!.pan, hearthPlan([light('torch', 3, { x: 3 })], ear, right, () => 1)[0]!.pan];
    expect(left).toBeLessThan(-0.7);
    expect(rightward).toBeGreaterThan(0.7);
    expect(hearthPlan([light('torch', 3, { flicker: 0.25 })], ear, right, () => 1)[0]!.flick).toBe(0.25);
    expect(hearthPlan([light('torch', 3, { flicker: 9 })], ear, right, () => 1)[0]!.flick).toBe(1.6);
  });

  it('hisses a street lamp only as the dusk lights it, and a torch at any hour', () => {
    expect(hearthPlan([light('lamp', 2)], ear, right, () => 1, 0)).toHaveLength(0);
    const [dusk, night] = [hearthPlan([light('lamp', 2)], ear, right, () => 1, 0.4)[0]!.level, hearthPlan([light('lamp', 2)], ear, right, () => 1, 1)[0]!.level];
    expect(dusk).toBeCloseTo(night * 0.4, 6);
    expect(hearthPlan([light('torch', 2)], ear, right, () => 1, 0)).toHaveLength(1);
  });

  it('knows a light by its place: the same light is the same voice from frame to frame', () => {
    expect(keyOf({ x: 3, y: 2, z: 1 })).toBe(keyOf({ x: 3.001, y: 2, z: 1 }));
    expect(keyOf({ x: 3, y: 2, z: 1 })).not.toBe(keyOf({ x: 3, y: 2, z: 1.5 }));
  });

  it('lists the lights in earshot without making new objects, and no more than it holds', () => {
    beginHeard();
    for (let i = 0; i < HEARTH.listed + 3; i++) pushHeard({ x: i, y: 0, z: 0, kind: 'torch' }, i, 1, 1);
    expect(HEARD_LIGHTS).toHaveLength(HEARTH.listed);
    const first = HEARD_LIGHTS[0];
    beginHeard();
    expect(HEARD_LIGHTS).toHaveLength(0);
    pushHeard({ x: 9, y: 0, z: 0, kind: 'fire' }, 9, 1, 1);
    expect(HEARD_LIGHTS[0]).toBe(first);
  });
});

/** A context of nodes that remember what they were told, for the voices' bookkeeping. */
function stage() {
  const log = { started: 0, stopped: 0, targets: [] as number[] };
  let now = 0;
  const param = (track = false) => ({ value: 0, setTargetAtTime: (v: number) => void (track && log.targets.push(v)), setValueAtTime: () => undefined, cancelScheduledValues: () => undefined });
  const node = (extra: object = {}) => ({ connect: (to: unknown) => to, ...extra });
  const ctx = {
    get currentTime() { return now; },
    sampleRate: 48000,
    createGain: () => node({ gain: param(true) }),
    createBiquadFilter: () => node({ frequency: param(), Q: param(), type: '' }),
    createStereoPanner: () => node({ pan: param() }),
    createOscillator: () => node({ frequency: param(), start: () => void log.started++, stop: () => void log.stopped++ }),
    createBufferSource: () => node({ start: () => void log.started++, stop: () => void log.stopped++, loop: false, buffer: null }),
    createBuffer: (n: number, len: number, r: number) => ({ numberOfChannels: n, length: len, sampleRate: r, duration: len / r, getChannelData: () => new Float32Array(len) }),
  } as unknown as AudioContext;
  const engine = { ctx, bed: node() } as unknown as import('../src/render/audio/engine').AudioEngine;
  return { engine, log, advance: (s: number) => void (now += s) };
}

describe('the hearth\'s voices (round 78)', () => {
  const lights = (...xs: number[]): HeardLight[] => xs.map((x, i) => ({ x, y: 2, z: i, kind: 'torch', d: x, v: 1, flicker: 1 }));
  const frame = (h: ReturnType<typeof createHearth>, heard: HeardLight[], paused = false): void => h.update(heard, ear, right, () => 1, paused);

  it('takes a voice for each light in earshot (no more than it has), and follows it', async () => {
    const { engine, log, advance } = stage();
    const hearth = createHearth(engine);
    frame(hearth, lights(2, 4, 5, 6, 7, 8));
    expect(HEARTH_NOW.sounding).toBe(HEARTH.voices);
    expect(log.started).toBe(HEARTH.voices);
    advance(0.1);
    frame(hearth, lights(2, 4, 5, 6, 7, 8));
    expect(log.started).toBe(HEARTH.voices); // the same lights are the same voices
    expect(HEARTH_NOW.kind).toBe('torch');
    expect(HEARTH_NOW.d).toBe(2);
  });

  it('lets a voice fade out when its light goes, and lets it go after the release, never on the frame it is told', () => {
    const { engine, log, advance } = stage();
    const hearth = createHearth(engine);
    frame(hearth, lights(2));
    expect(HEARTH_NOW.sounding).toBe(1);
    advance(0.1);
    frame(hearth, []);
    expect(HEARTH_NOW.sounding).toBe(1);
    expect(log.stopped).toBe(0);
    expect(log.targets.at(-1)).toBe(0); // told to glide to nothing
    advance(HEARTH.release + 0.1);
    frame(hearth, []);
    expect(HEARTH_NOW.sounding).toBe(0);
    expect(log.stopped).toBe(1);
  });

  it('fades every voice when paused, and has none to take for a light beyond its range', () => {
    const { engine, advance } = stage();
    const hearth = createHearth(engine);
    frame(hearth, lights(2, 3));
    advance(0.1);
    frame(hearth, lights(2, 3), true);
    advance(HEARTH.release + 0.1);
    frame(hearth, lights(2, 3), true);
    expect(HEARTH_NOW.sounding).toBe(0);
    frame(hearth, lights(HEARTH.kinds.torch.range + 1));
    expect(HEARTH_NOW.sounding).toBe(0);
  });

  it('hums a Sign with its pairs of tones and a breath of air', () => {
    const { engine, log } = stage();
    const hearth = createHearth(engine);
    frame(hearth, [{ x: 3, y: 2, z: 0, kind: 'sigil', d: 3, v: 1, flicker: 1 }]);
    expect(log.started).toBe(HEARTH.sigil.tones.length + 1);
  });
});

describe('what worldLights lists in earshot (round 78)', () => {
  it('lists the nearest lights, nearest first, leaves a window out, and sets what the eye sees of each', async () => {
    const THREE = await import('three');
    const { createWorldLights } = await import('../src/render/worldLights');
    const lights = createWorldLights();
    lights.add(1, [{ x: 9, y: 1, z: 0, kind: 'fire' }, { x: 3, y: 1, z: 0, kind: 'torch' }, { x: 2, y: 1, z: 0, kind: 'window' }, { x: 200, y: 1, z: 0, kind: 'lamp' }, { x: 5, y: 1, z: 0, kind: 'lamp' }]);
    lights.update(new THREE.Vector3(0, 1, 0), 1, null);
    expect(HEARD_LIGHTS.map((h) => h.kind)).toEqual(['torch', 'lamp', 'fire']);
    expect(HEARD_LIGHTS.map((h) => Math.round(h.d))).toEqual([3, 5, 9]);
    expect(HEARD_LIGHTS.every((h) => h.v === 1 && h.flicker > 0.5 && h.flicker < 1.5)).toBe(true);
    lights.remove(1);
    lights.update(new THREE.Vector3(0, 1, 0), 2, null);
    expect(HEARD_LIGHTS).toHaveLength(0);
  });
});
