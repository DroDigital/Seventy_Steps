import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STILL } from '../src/data/ambienceHours';
import { SEA_PLACE } from '../src/data/ambienceRoles';
import { AMBIENCE, DUNGEON_AMBIENCE, SAMPLE_SETS } from '../src/data/samples';
import { CLOCK } from '../src/data/tuning';
import { createAmbience } from '../src/render/audio/ambience';
import type { AudioEngine } from '../src/render/audio/engine';
import { PLACED } from '../src/render/audio/exposure';
import type { Sampler } from '../src/render/audio/sampler';

/** A WebAudio that only remembers how it was wired and what was asked of its parameters. */
class Node {
  from: Node[] = [];
  connect<T extends Node>(to: T): T {
    to.from.push(this);
    return to;
  }
  disconnect(): void {}
}
class Param extends Node {
  value = 0;
  targets: number[] = [];
  setTargetAtTime(v: number): void {
    this.targets.push(v);
  }
  setValueAtTime(v: number): void {
    this.value = v;
  }
  linearRampToValueAtTime(): void {}
  cancelScheduledValues(): void {}
  get last(): number {
    return this.targets.length ? this.targets[this.targets.length - 1] : this.value;
  }
}
class Gain extends Node { gain = new Param(); }
class Pan extends Node { pan = new Param(); }
class Filter extends Node { type = ''; frequency = new Param(); Q = new Param(); }
class Osc extends Node { frequency = new Param(); type = ''; start(): void {} stop(): void {} }
class Src extends Node { buffer: unknown; loop = false; loopStart = 0; loopEnd = 0; start(): void {} stop(): void {} }

function fakeAudio() {
  const made = { pans: [] as Pan[], filters: [] as Filter[], gains: [] as Gain[] };
  const ctx = {
    currentTime: 0,
    createGain: () => (made.gains.push(new Gain()), made.gains[made.gains.length - 1]),
    createStereoPanner: () => (made.pans.push(new Pan()), made.pans[made.pans.length - 1]),
    createBiquadFilter: () => (made.filters.push(new Filter()), made.filters[made.filters.length - 1]),
    createOscillator: () => new Osc(),
    createBufferSource: () => new Src(),
  };
  const bed = new Gain();
  const plays: { set: unknown; o: { gain?: number; pan?: number } }[] = [];
  const sampler = { buffer: () => ({ duration: 30 }), settled: () => true, load: async () => undefined, forget: () => undefined, play: (set: unknown, o: { gain?: number; pan?: number }) => (plays.push({ set, o }), true) } as unknown as Sampler;
  const e = { ctx, bed } as unknown as AudioEngine;
  return { made, e, sampler, plays };
}

/** Seconds of play at which the night is at `phase` (a game opens at CLOCK.start). */
const secondsAt = (phase: number): number => ((((phase - CLOCK.start) % 1) + 1) % 1) * CLOCK.night;
const hourOfReader = (pan: Pan): Gain => pan.from[0] as Gain; // the gain between the bed's own breath and its pan

describe('the beds as WebAudio plays them (render/audio/ambience.ts, round 80)', () => {
  let seed = 1;
  beforeEach(() => {
    seed = 1;
    vi.spyOn(Math, 'random').mockImplementation(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
    Object.assign(PLACED, { on: false, shore: 0, pan: 0, exposure: 0 });
  });
  afterEach(() => vi.restoreAllMocks());

  it('every bed has a reader with the hour\'s gain between its own and its pan: two for each recording, apart in the field', () => {
    const { made, e, sampler } = fakeAudio();
    const beds = createAmbience(e, sampler);
    beds.set(AMBIENCE.innsmouth);
    beds.update(secondsAt(0.3));
    expect(made.pans.length).toBe(4); // surf and frogs, twice
    expect(made.pans.map((p) => p.pan.value).sort()).toEqual([-0.6, -0.6, 0.6, 0.6]);
    for (const p of made.pans) expect(hourOfReader(p)).toBeInstanceOf(Gain);
  });

  it('the hour moves the insects: full at the gloaming, thinned in the deep, nearly gone in the Still; the sea beds do not hear it', () => {
    const { made, e, sampler } = fakeAudio();
    const beds = createAmbience(e, sampler);
    beds.set(AMBIENCE.dunwich); // crickets and wind
    const frogs = (): number[] => made.pans.map((p) => hourOfReader(p).gain.last);
    for (const [phase, test] of [[0.05, (v: number) => v > 0.95], [0.3, (v: number) => v < 0.7 && v > 0.4], [0.5, (v: number) => v < 0.15]] as const) {
      for (let s = 0; s < 4; s++) beds.update(secondsAt(phase) + s * 0.6);
      const [c1, c2] = frogs().slice(0, 2); // the crickets are the first bed of Dunwich
      expect(test(c1) && test(c2), `crickets at ${phase}: ${c1}`).toBe(true);
    }
  });

  it('on the shore the sea bed is whole and drawn toward the water; inland it is far and dull; under a roof it is as it was', () => {
    const { made, e, sampler } = fakeAudio();
    const beds = createAmbience(e, sampler);
    beds.set(AMBIENCE.innsmouth);
    const surf = made.pans.slice(0, 2); // surf is the first bed
    const t0 = secondsAt(0.3);
    Object.assign(PLACED, { on: true, shore: 1, pan: 0.8, exposure: 0 });
    beds.update(t0);
    beds.update(t0 + 1);
    expect(hourOfReader(surf[0]).gain.last).toBeCloseTo(1, 5);
    const lean = SEA_PLACE.pan;
    expect(surf.map((p) => p.pan.last).sort()[1]).toBeCloseTo(0.6 * (1 - lean) + lean * 0.8 * SEA_PLACE.reach, 3);
    expect(surf.map((p) => p.pan.last).sort()[0]).toBeCloseTo(-0.6 * (1 - lean) + lean * 0.8 * SEA_PLACE.reach, 3);
    const soft = (surf[0].from[0].from[0] as unknown) as Filter; // gain <- filter <- breath gain
    expect(soft.frequency.last).toBe(2800);
    Object.assign(PLACED, { shore: 0, pan: 0 });
    beds.update(t0 + 2);
    expect(hourOfReader(surf[0]).gain.last).toBeCloseTo(SEA_PLACE.inland, 5);
    expect(soft.frequency.last).toBe(SEA_PLACE.low);
    expect(surf.map((p) => p.pan.last).sort()).toEqual([-0.6, 0.6]);

    const cave = fakeAudio();
    const under = createAmbience(cave.e, cave.sampler);
    under.set(DUNGEON_AMBIENCE.cave);
    Object.assign(PLACED, { on: true, shore: 1, pan: 0.8, exposure: 1 });
    under.update(secondsAt(0.5));
    under.update(secondsAt(0.5) + 1);
    for (const p of cave.made.pans) expect(hourOfReader(p).gain.last).toBe(1);
  });

  it('the stereo follows a turning head every frame, and the hour is told only twice a second', () => {
    const { made, e, sampler } = fakeAudio();
    const beds = createAmbience(e, sampler);
    beds.set(AMBIENCE.innsmouth);
    Object.assign(PLACED, { on: true, shore: 1, pan: 0.5, exposure: 0 });
    const t0 = secondsAt(0.3);
    beds.update(t0);
    const [p, gainNode] = [made.pans[0], hourOfReader(made.pans[0])];
    const [pans, gains] = [p.pan.targets.length, gainNode.gain.targets.length];
    for (let k = 1; k <= 10; k++) {
      PLACED.pan = Math.sin(k);
      beds.update(t0 + k * 0.016);
    }
    expect(p.pan.targets.length - pans).toBe(10);
    expect(gainNode.gain.targets.length - gains).toBeLessThanOrEqual(1);
  });

  it('the spots hold through the Still and come again after it, not all at once; the hull and the gurgle come from the water', () => {
    const { e, sampler, plays } = fakeAudio();
    const beds = createAmbience(e, sampler);
    beds.set(AMBIENCE.innsmouth);
    Object.assign(PLACED, { on: true, shore: 1, pan: -0.7, exposure: 0 });
    const [from, to] = [secondsAt(STILL.from), secondsAt(STILL.to)];
    let t = secondsAt(0.3);
    const times: number[] = [];
    for (; t < secondsAt(0.3) + 1000; t += 0.5) {
      const before = plays.length;
      beds.update(t % CLOCK.night);
      if (plays.length > before) times.push(t % CLOCK.night);
    }
    expect(times.length).toBeGreaterThan(8);
    expect(times.filter((x) => x > from + 22 && x < to + 20), 'in the Still').toEqual([]);
    const after = times.filter((x) => x >= to);
    expect(after.length).toBeGreaterThan(0);
    expect(after[0] - to, 'not at its first moment').toBeGreaterThan(3);
    for (const p of plays) {
      expect(p.o.pan!).toBeLessThan(-0.35); // Innsmouth's spots are the water's: -0.7 and a little jitter
      expect(p.o.gain!).toBeGreaterThan(0.1);
      expect(Object.values(SAMPLE_SETS)).toContain(p.set);
    }
  });
});
