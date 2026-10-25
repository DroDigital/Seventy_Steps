import { afterEach, describe, expect, it, vi } from 'vitest';
import { MIND_EARS } from '../src/data/mindSounds';
import { SAMPLE_SETS } from '../src/data/samples';
import type { AtmAudioContext } from '../src/render/audio/atmosphereAudio';
import { approachDistance, approachSteps, createFollower, followDelay, nextEpisodeAt, stopAfter, treadSteps, turnedToward } from '../src/render/audio/follower';
import type { Sampler, SampleOptions } from '../src/render/audio/sampler';
import { createWorldGame } from '../src/systems/game';

const T = MIND_EARS.tread;
const A = T.approach;

describe('the tread: the scheduler (round 78)', () => {
  it('never begins below the Fractured line, then every so often, sooner as the mind goes, never nearer than its gap', () => {
    expect(nextEpisodeAt(100, 0, Math.random)).toBe(Infinity);
    expect(nextEpisodeAt(100, T.from - 0.01, Math.random)).toBe(Infinity);
    for (const stress of [T.from, 0.75, 0.9, 1]) for (const r of [0, 0.5, 0.999]) expect(nextEpisodeAt(100, stress, () => r) - 100).toBeGreaterThanOrEqual(T.gap);
    expect(nextEpisodeAt(0, 1, () => 0.5)).toBeLessThan(nextEpisodeAt(0, T.from, () => 0.5));
    expect(nextEpisodeAt(0, T.from, () => 0.5)).toBeCloseTo((T.every[0]) * 1, 5); // the slow end, undrawn
    expect(nextEpisodeAt(0, 1, () => 0.999)).toBeLessThan(T.every[0] * 1.4); // and never more than its slow end drawn longest
  });

  it('a tread keeps six to fourteen footfalls, an approach four to seven; a follower\'s step is a half-stride behind the investigator\'s', () => {
    for (const r of [0, 0.3, 0.999]) {
      expect(treadSteps(() => r)).toBeGreaterThanOrEqual(6);
      expect(treadSteps(() => r)).toBeLessThanOrEqual(14);
      expect(approachSteps(() => r)).toBeGreaterThanOrEqual(4);
      expect(approachSteps(() => r)).toBeLessThanOrEqual(7);
      expect(followDelay(0.5, () => r)).toBeGreaterThanOrEqual(0.5 * 0.45 - 1e-9);
      expect(followDelay(0.5, () => r)).toBeLessThanOrEqual(0.5 * 0.55 + 1e-9);
    }
    expect(followDelay(9, () => 0.5)).toBeLessThan(1.2); // a stray long gap is not a long wait
    expect(stopAfter(0.5)).toBeGreaterThan(0.5); // a walk's strides are half a second apart: they have not stopped between two
    expect(stopAfter(0.1)).toBe(T.stop);
  });

  it('steps from behind close from six metres to three and a half, and are stopped by a look toward them', () => {
    expect(approachDistance(0, 5)).toBe(A.from);
    expect(approachDistance(4, 5)).toBe(A.to);
    expect(approachDistance(1, 5)).toBeGreaterThan(approachDistance(2, 5));
    expect(turnedToward(0, -1, 0, 1)).toBe(false); // looking away from it
    expect(turnedToward(0, 1, 0, 1)).toBe(true);
    expect(turnedToward(Math.sin(0.5), Math.cos(0.5), 0, 1)).toBe(true); // within fifty degrees
    expect(turnedToward(Math.sin(1.2), Math.cos(1.2), 0, 1)).toBe(false);
  });
});

interface Call { at: number; set: unknown; o: SampleOptions }

/** The follower in a real world game, with a sampler that only records what it is asked to play. */
function rig(stress: number) {
  const g = createWorldGame();
  const calls: Call[] = [];
  let now = 0;
  const sampler = { play: (set: unknown, o: SampleOptions = {}) => (calls.push({ at: now, set, o }), true) } as unknown as Sampler;
  const breaths: string[] = [];
  const right = { x: 1, y: 0, z: 0 }; // the camera looks along -z; the investigator walks that way (yaw pi)
  const ctx = { e: {}, g, sampler, recipe: (key: string) => (breaths.push(key), true), recorded: () => true, listener: { x: 0, y: 0, z: 0 }, right } as unknown as AtmAudioContext;
  const follower = createFollower(ctx);
  const tr = g.ecs.c.transform.get(g.player.id)!;
  tr.yaw = tr.prevYaw = Math.PI;
  /** `seconds` of play, the investigator walking at `speed` metres a second (0: standing), a frame at a time. */
  const play = (seconds: number, speed = 0, paused = false): void => {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      now += 1 / 60;
      tr.pos.z -= speed / 60;
      follower.update(stress, now, paused);
    }
  };
  return { g, calls, play, right, breaths, clock: () => now };
}

afterEach(() => vi.restoreAllMocks());

describe('the tread: followed in a real game (round 78)', () => {
  it('is never heard in a steady mind, however long they walk', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const r = rig(T.from - 0.05);
    r.play(180, 1.5);
    expect(r.calls).toEqual([]);
  });

  it('shadows the investigator\'s stride from a half-stride behind, softer, duller and heavier, alternating ears, and then leaves off', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const r = rig(0.9);
    r.play(39, 1.5);
    expect(r.calls).toHaveLength(0); // nothing till its time
    r.play(8, 1.5);
    expect(r.calls).toHaveLength(treadSteps(() => 0)); // six, and then it stops, while they go on walking
    const pans = r.calls.map((c) => Math.sign(c.o.pan ?? 0));
    expect(pans.every((p, i) => i === 0 || p === -pans[i - 1])).toBe(true);
    for (const c of r.calls) {
      expect([SAMPLE_SETS.stepDirt, SAMPLE_SETS.stepRoad, SAMPLE_SETS.stepStone]).toContain(c.set); // one of the ground's own
      expect(c.o.pitch!).toBeGreaterThanOrEqual(T.pitch[0]);
      expect(c.o.pitch!).toBeLessThanOrEqual(T.pitch[1]);
      expect(c.o.lowpass).toBe(T.lowpass);
      expect(c.o.gain!).toBeGreaterThanOrEqual(T.gain[0]);
      expect(c.o.gain!).toBeLessThanOrEqual(T.gain[1] + 1e-9);
      expect(c.o.delay!).toBeGreaterThan(0.2); // a half of the half-second stride
      expect(c.o.delay!).toBeLessThan(0.3);
    }
    r.play(20, 1.5);
    expect(r.calls).toHaveLength(6); // the next not for forty seconds
  });

  it('when they stop, theirs stop, and one step more lands, nearer, a moment on; and then nothing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const r = rig(0.9);
    r.play(41.2, 1.5); // two or three steps into its six
    const walked = r.calls.length;
    expect(walked).toBeGreaterThan(0);
    expect(walked).toBeLessThan(6);
    r.play(3, 0); // they stop
    expect(r.calls).toHaveLength(walked + 1);
    const last = r.calls[walked];
    expect(last.o).toMatchObject({ gain: T.last.gain, lowpass: T.last.lowpass, pitch: T.last.pitch });
    expect(last.o.delay!).toBeGreaterThanOrEqual(0);
    expect(last.o.delay!).toBeLessThanOrEqual(T.last.wait[1]);
    r.play(20, 0);
    expect(r.calls).toHaveLength(walked + 1); // and the night goes still
  });

  it('never in a fight, a scene, a talk, on a horse, or under a menu', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fight = rig(0.9);
    for (let i = 0; i < 90; i++) (fight.g.mind.fought = fight.g.frame, fight.play(1, 1.5)); // a blow struck and taken, all the while
    expect(fight.calls).toEqual([]);
    const scene = rig(0.9);
    scene.g.cutscene = true;
    scene.play(120, 1.5);
    expect(scene.calls).toEqual([]);
    const talk = rig(0.9);
    talk.g.player.listening = 1 as never;
    talk.play(120, 1.5);
    expect(talk.calls).toEqual([]);
    const paused = rig(0.9);
    paused.play(120, 1.5, true);
    expect(paused.calls).toEqual([]);
  });

  it('standing still when it comes, steps close from behind, louder and brighter as they near, and are over in a few seconds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const r = rig(0.9);
    r.play(39, 0);
    expect(r.calls).toHaveLength(0);
    r.play(1 + A.lead + 5, 0);
    expect(r.calls).toHaveLength(approachSteps(() => 0));
    const gains = r.calls.map((c) => c.o.gain!);
    expect(gains.every((x, i) => i === 0 || x > gains[i - 1])).toBe(true);
    const lows = r.calls.map((c) => c.o.lowpass!);
    expect(lows.every((x, i) => i === 0 || x > lows[i - 1])).toBe(true);
    expect(Math.max(...gains)).toBeLessThan(0.4);
    expect(r.calls.every((c) => !c.o.delay)).toBe(true); // each on its own moment
  });

  it('stops on the instant the investigator turns to face them', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // seven steps
    const r = rig(0.9);
    while (r.calls.length === 0 && r.clock() < 200) r.play(1 / 60, 0);
    expect(r.calls).toHaveLength(1); // the first step is heard...
    Object.assign(r.right, { x: -1, z: 0 }); // ...and they turn about to look at it
    r.play(8, 0);
    expect(r.calls).toHaveLength(1); // nothing more
  });

  it('walks on with them if they walk on', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const r = rig(0.9);
    let first = 0;
    for (let i = 0; i < 60 * 120 && first === 0; i++) {
      r.play(1 / 60, 0);
      if (r.calls.length === 1) first = i;
    }
    expect(first).toBeGreaterThan(0);
    r.play(3, 1.5); // they set off: it comes with them
    expect(r.calls.some((c) => (c.o.delay ?? 0) > 0.2)).toBe(true);
  });
});
