import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../src/core/rng';
import { COLD } from '../src/data/bodyTuning';
import type { Echo } from '../src/data/acoustics';
import { BODY, BREATH, FOOT_GAIN, GEAR, STEP_LAYERS, STEP_VOICE, BOARD_CREAK, FEEL } from '../src/data/footSounds';
import { MIND_EARS } from '../src/data/mindSounds';
import { SAMPLE_SETS } from '../src/data/samples';
import type { Layer, Sound } from '../src/data/sounds';
import { createBodyFoley } from '../src/render/audio/bodyFoley';
import { createFoley, indoorsAt, surfaceAt } from '../src/render/audio/foley';
import { coldAt, footFeel, indoorLift, stepGain, stepLevel, stepSetOf } from '../src/render/audio/footing';
import type { Sampler, SampleOptions } from '../src/render/audio/sampler';
import { HEART } from '../src/render/feel';
import { createWorldGame } from '../src/systems/game';
import { kitOfRoom } from '../src/world/dungeonKit';
import { worldLayout } from '../src/world/placements';
import { findGap, findGround, findRoom, stride } from './footHelpers';
import { RATE, render } from './soundRender';

const scaled = (sound: Sound, k: number): Sound => sound.map((l): Layer => ({ ...l, gain: l.gain * k }));

/** The spectral centroid (Hz) of a rendered sound: where its weight lies. */
function centroid(samples: Float32Array): number {
  const n = 2048;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < Math.min(n, samples.length); i++) re[i] = samples[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n));
  for (let i = 1, j = 0; i < n; i++) { // bit reversal
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [re[i], re[j]] = [re[j], re[i]];
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const [wr, wi] = [Math.cos(ang * k), Math.sin(ang * k)];
        const [a, b] = [i + k, i + k + len / 2];
        const [xr, xi] = [re[b] * wr - im[b] * wi, re[b] * wi + im[b] * wr];
        [re[b], im[b]] = [re[a] - xr, im[a] - xi];
        [re[a], im[a]] = [re[a] + xr, im[a] + xi];
      }
    }
  }
  let [sum, weight] = [0, 0];
  for (let k = 1; k < n / 2; k++) {
    const m = Math.hypot(re[k], im[k]);
    sum += m * ((k * RATE) / n);
    weight += m;
  }
  return sum / Math.max(weight, 1e-9);
}

describe('how the ground is heard (round 80)', () => {
  it('the recorded step is taken softer and duller in snow and sand, lower in mud, hollow on boards; a slab or cobble is the stone, not dirt', () => {
    expect(footFeel('dirt', 'snow').gain).toBeLessThan(0.7);
    expect(footFeel('dirt', 'snow').lowpass).toBeLessThan(3000);
    expect(footFeel('dirt', 'mud').pitch).toBeLessThan(0.9);
    expect(footFeel('stone', 'boards')).toMatchObject({ set: 'stepStone' });
    expect(footFeel('stone', 'boards').gain).toBeLessThan(0.7);
    expect(footFeel('dirt', 'slab')).toMatchObject({ set: 'stepStone', gain: 1, pitch: 1 });
    expect(footFeel('stone', 'mud')).toMatchObject({ set: 'stepDirt' }); // (a cellar's mud floor is dirt, not stone)
    expect(footFeel('stone', 'slab')).toMatchObject({ set: 'stepStone', gain: 1 });
  });

  it('the sea and the road keep the recordings that already sound right, and the plain grounds are left as they were', () => {
    for (const ground of ['snow', 'mud', 'grass', 'boards'] as const) {
      expect(footFeel('water', ground)).toEqual({ gain: 1, pitch: 1 });
      expect(footFeel('road', ground)).toEqual({ gain: 1, pitch: 1 });
    }
    expect(footFeel('dirt', 'dirt')).toEqual({ gain: 1, pitch: 1 });
    expect(footFeel('stone', 'stone')).toMatchObject({ set: 'stepStone', gain: 1, pitch: 1 });
  });

  it('a phantom step is made of the recording of the ground it follows', () => {
    expect(stepSetOf('snow')).toBe('stepDirt');
    expect(stepSetOf('boards')).toBe('stepStone');
    expect(stepSetOf('road')).toBe('stepRoad');
    expect(stepSetOf('water')).toBe('stepWater');
  });

  it('the cold: the Mountains are cold at night, nothing is under a roof, the realms past the stars have none, rain adds a little', () => {
    expect(coldAt('mountains', 1, false, false)).toBe(1);
    expect(coldAt('mountains', 1, false, true)).toBe(0);
    expect(coldAt('beyond', 1, true, false)).toBe(0);
    expect(coldAt('arkham', 0.5, false, false)).toBeCloseTo(COLD.arkham * 0.5);
    expect(coldAt('arkham', 0.5, true, false)).toBeGreaterThan(coldAt('arkham', 0.5, false, false));
    expect(coldAt(null, 1, true, false)).toBe(0);
  });
});

describe('the recipes are in the level of a footfall, and each sounds like what it is', () => {
  it('every ground\'s step lies under the recorded one, brief, and its character is the right end of the spectrum', () => {
    const heard = new Map<string, { centroid: number }>();
    for (const [ground, s] of Object.entries(STEP_LAYERS)) {
      const r = render(scaled(s!, FOOT_GAIN.steps));
      expect(r.rms, ground).toBeGreaterThan(-48); // (round 83: sand and leaves lie under their recordings by about 3 dB A-weighted, and are not silent)
      expect(r.rms, ground).toBeLessThan(-28);
      expect(r.peak, ground).toBeLessThan(-14);
      expect(r.sec, ground).toBeLessThan(0.35);
      heard.set(ground, { centroid: centroid(r.samples) });
    }
    const c = (g: string): number => heard.get(g)!.centroid;
    expect(c('snow')).toBeGreaterThan(2000);
    expect(c('leaves')).toBeGreaterThan(2000);
    expect(c('sand')).toBeGreaterThan(1500);
    expect(c('mud')).toBeLessThan(900);
    expect(c('boards')).toBeLessThan(900);
    expect(c('flesh')).toBeLessThan(800);
    expect(c('snow')).toBeGreaterThan(c('grass'));
    expect(c('grass')).toBeGreaterThan(c('mud'));
  });

  it('every ground with a recipe or a feel has the other too (a ground with one is not left half done)', () => {
    for (const g of Object.keys(STEP_LAYERS)) expect(FEEL[g as keyof typeof FEEL], g).toBeDefined();
    for (const g of Object.keys(FEEL)) expect(STEP_LAYERS[g as keyof typeof STEP_LAYERS], g).toBeDefined();
  });

  it('the gear is cloth and leather and nothing rings: noise only, nothing above 2 kHz, no lantern bail (round 83)', () => {
    expect(Object.keys(GEAR).sort()).toEqual(['coat', 'satchel']);
    for (const [id, s] of Object.entries(GEAR)) {
      for (const layer of s) {
        expect(layer.src, id).toBe('noise'); // (a ringing is a tone; the bail and the buckle were tones)
        expect(layer.filter?.hz ?? layer.hz ?? 0, id).toBeLessThan(2000);
      }
    }
  });

  it('the creak, the gear and the breath are quiet, and brief', () => {
    for (const [id, s] of Object.entries(GEAR)) {
      const r = render(scaled(s, FOOT_GAIN.gear));
      expect(r.rms, id).toBeGreaterThan(-52);
      expect(r.rms, id).toBeLessThan(-34);
      expect(r.peak, id).toBeLessThan(-18);
      expect(r.sec, id).toBeLessThan(0.3);
    }
    const creak = render(scaled(BOARD_CREAK, FOOT_GAIN.steps));
    expect(creak.rms).toBeLessThan(-34);
    expect(creak.peak).toBeLessThan(-16);
    for (const [id, s] of Object.entries(BREATH)) {
      const r = render(scaled(s, FOOT_GAIN.breath));
      expect(r.rms, id).toBeGreaterThan(-46);
      expect(r.rms, id).toBeLessThan(-28);
      expect(r.peak, id).toBeLessThan(-15);
      expect(r.sec, id).toBeLessThan(0.7);
    }
  });

  it('a phantom step is under a footfall', () => {
    expect(FOOT_GAIN.phantom).toBeLessThan(0.5);
    expect(SAMPLE_SETS.stepDirt.gain * FOOT_GAIN.phantom).toBeLessThan(SAMPLE_SETS.stepDirt.gain * 0.55);
  });
});

interface Heard { key: string; gain: number }
interface Played { set: unknown; o: SampleOptions }

function rig(region = 'mountains', ground: Parameters<typeof findGround>[2] = 'snow', rand: () => number = () => 0.99, run = 80, room?: () => Echo | undefined) {
  const g = createWorldGame();
  const at = findGround(g, region, ground, run, 0)!;
  const tr = g.ecs.c.transform.get(g.player.id)!;
  tr.pos = { x: at.x, y: 1, z: at.z };
  tr.prev = { ...tr.pos };
  g.overworld!.region = region;
  const heard: Heard[] = [];
  const played: Played[] = [];
  const sampler: Sampler = { load: async () => undefined, buffer: () => null, settled: () => true, forget: () => undefined, play: (set, o = {}) => (played.push({ set, o }), true) };
  const body = createBodyFoley(g, (key, _s, o) => (heard.push({ key, gain: o?.gain ?? 1 }), true), sampler, rand);
  const foley = createFoley(g, sampler, () => true, room);
  let t = 0;
  let stress = 0.9;
  const tick = (seconds: number, metres: number, yaw = 0): void => {
    const steps = Math.max(1, Math.round(seconds * 10));
    for (let i = 0; i < steps; i++) {
      if (metres) stride(g, metres / steps, yaw);
      t += seconds / steps;
      body.update(t, stress);
      foley.update(t, () => ({ gain: 1, pan: 0 }), () => undefined);
    }
  };
  /** One frame of `dt` seconds in which the body is carried `metres` (a frame drawn faster than the simulation moves it on only some). */
  const frame = (dt: number, metres: number, yaw = 0): void => {
    if (metres) stride(g, metres, yaw);
    t += dt;
    body.update(t, stress);
    foley.update(t, () => ({ gain: 1, pan: 0 }), () => undefined);
  };
  return { g, heard, played, tick, frame, setStress: (s: number) => void (stress = s), tr, at: () => t, setTime: (s: number) => void (t = s) };
}
const keys = (r: { heard: Heard[] }, prefix: string): number => r.heard.filter((h) => h.key.startsWith(prefix)).length;
const recorded = (r: { played: Played[] }): Played[] => r.played.filter((p) => !p.o.delay);

describe('the body, heard', () => {
  it("each recorded footfall has the ground's recipe laid over it on the same stride", () => {
    const r = rig();
    r.tick(10, 20); // 2 m/s over snow
    expect(keys(r, 'foot:snow')).toBeGreaterThanOrEqual(10);
    expect(keys(r, 'foot:snow')).toBe(recorded(r).length); // (the foley's strides and the body's are the same)
  });

  it('a ground with no recipe, the sea, and a mounted ride lay nothing over the recording', () => {
    const road = rig('dunwich', 'dirt', undefined, 22);
    road.tick(10, 20);
    expect(keys(road, 'foot:')).toBe(0);
    const mounted = rig();
    mounted.g.player.mount.active = 'grey';
    mounted.tick(10, 20);
    expect(mounted.heard).toEqual([]);
    expect(mounted.played).toEqual([]);
  });

  it('the coat as a walk begins, the coat and the pack now and then at a run, quietly, and nothing that rings: no lantern bail, no buckle (round 83)', () => {
    const r = rig();
    r.tick(2, 0);
    r.tick(5, 10);
    expect(keys(r, 'gear:coat')).toBe(1); // setting off
    expect(keys(r, 'gear:satchel')).toBe(0);
    r.g.player.sprinting = true;
    r.tick(5, 28);
    const strides = keys(r, 'foot:snow');
    expect(keys(r, 'gear:coat')).toBeGreaterThan(3);
    expect(keys(r, 'gear:coat')).toBeLessThan(1 + strides / 2); // (a swing every third stride, not every one)
    expect(keys(r, 'gear:satchel')).toBeGreaterThan(0);
    expect(keys(r, 'gear:satchel')).toBeLessThan(strides / 3);
    expect(r.heard.some((h) => h.key === 'gear:bail')).toBe(false);
    for (const h of r.heard.filter((x) => x.key.startsWith('gear:'))) expect(h.gain).toBeLessThanOrEqual(FOOT_GAIN.gear);
  });

  it('boards creak now and then: one step in seven', () => {
    const g0 = createWorldGame();
    const house = worldLayout().dungeons.flatMap(({ layout }) => layout.rooms.filter((room) => kitOfRoom(layout, room).floor === 'wood' && room.half >= 8).map((room) => ({ room })))[0];
    expect(house).toBeDefined();
    const r = rig();
    r.tr.pos = { x: house.room.x - 6, y: g0.ecs.c.transform.get(g0.player.id)!.pos.y, z: house.room.z };
    r.tr.prev = { ...r.tr.pos };
    r.tick(12, 12, Math.PI / 2);
    expect(keys(r, 'foot:boards')).toBeGreaterThan(10);
    expect(keys(r, 'foot:creak')).toBe(Math.floor(keys(r, 'foot:boards') / BODY.creakEvery));
  });

  it('a lucid mind hears no step but its own; a failing one does now and then, a moment late and to one side, duller', () => {
    const lucid = rig('mountains', 'snow', () => 0);
    lucid.g.mind.band = 'lucid';
    lucid.tick(10, 20);
    expect(lucid.played.filter((p) => p.o.delay)).toEqual([]);
    const dread = rig('mountains', 'snow', () => 0);
    dread.g.mind.band = 'unmoored';
    dread.tick(10, 20);
    const phantoms = dread.played.filter((p) => p.o.delay);
    expect(phantoms.length).toBeGreaterThanOrEqual(10); // (the dice always fall low)
    for (const p of phantoms) {
      expect(p.o.delay!).toBeGreaterThanOrEqual(0.45);
      expect(Math.abs(p.o.pan!)).toBeCloseTo(BODY.phantom.pan);
      expect(p.o.lowpass).toBe(BODY.phantom.lowpass);
      expect(p.o.pitch).toBeLessThan(1);
      expect(p.o.gain!).toBeLessThan(0.5);
    }
    const capped = rig('mountains', 'snow', () => 0);
    capped.g.mind.band = 'unmoored';
    capped.setStress(0.2); // (the FX setting held the stress down)
    capped.tick(10, 20);
    expect(capped.played.filter((p) => p.o.delay)).toEqual([]);
  });

  it('and when a long walk ends, now and then one more step comes from the dark', () => {
    const r = rig('mountains', 'snow', () => 0);
    r.g.mind.band = 'fractured';
    r.tick(6, 12);
    const before = r.played.filter((p) => p.o.delay === BODY.phantom.stopDelay).length;
    r.tick(2, 0);
    expect(r.played.filter((p) => p.o.delay === BODY.phantom.stopDelay).length).toBe(before + 1);
  });

  it('no phantom in a fight, and nothing is heard in a scene', () => {
    const r = rig('mountains', 'snow', () => 0);
    r.g.mind.band = 'unmoored';
    r.g.cutscene = true;
    r.tick(10, 20);
    expect(r.heard).toEqual([]);
    expect(r.played.filter((p) => p.o.delay)).toEqual([]);
  });
});

describe('the footsteps, understated (round 83)', () => {
  /** The gains of the recorded footfalls of a walk of `seconds` at `speed`, over snow (the ground's feel taken out). */
  function walk(speed: number, seconds = 10, room?: () => Echo | undefined) {
    const r = rig('mountains', 'snow', undefined, 110, room);
    r.tick(seconds, speed * seconds);
    const steps = recorded(r).filter((p) => p.o.pitch === FEEL.snow!.pitch); // (a patch of other ground in the run takes its own feel)
    return { steps, gains: steps.map((p) => p.o.gain! / FEEL.snow!.gain) };
  }

  it('each step is quieter than round 80\'s at every pace, a creep quietest and a sprint the loudest', () => {
    const oldLevel = (speed: number): number => 0.55 + 0.45 * Math.min(1, speed / 6.4);
    for (const speed of [1.5, 2.2, 3, 4.2, 5.5, 6.4, 8]) expect(stepLevel(speed), `${speed} m/s`).toBeLessThan(oldLevel(speed) * 0.7); // at least 3 dB under
    expect(stepLevel(2.2)).toBeLessThan(stepLevel(4.2));
    expect(stepLevel(4.2)).toBeLessThan(stepLevel(6.4));
    expect(stepLevel(6.4)).toBeCloseTo(STEP_VOICE.level[1]);
    expect(stepLevel(0)).toBeCloseTo(STEP_VOICE.level[0]);
    expect(stepLevel(40)).toBeCloseTo(STEP_VOICE.level[1]); // (a jump or a fall is not louder than a sprint)
  });

  it('the played steps keep to that level, the second foot of a pair lands softer, and no two are alike', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(createRng(83));
    try {
      const { gains } = walk(4.2);
      expect(gains.length).toBeGreaterThanOrEqual(30);
      const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
      for (const gain of gains) {
        expect(gain).toBeLessThanOrEqual(stepLevel(4.2) * (1 + STEP_VOICE.jitter) + 1e-9);
        expect(gain).toBeGreaterThanOrEqual(stepLevel(4.2) * STEP_VOICE.offFoot * (1 - STEP_VOICE.jitter) - 1e-9);
      }
      const [first, second] = [gains.filter((_, i) => i % 2 === 0), gains.filter((_, i) => i % 2 === 1)]; // (the feet take turns)
      const [soft, firm] = [Math.min(mean(first), mean(second)), Math.max(mean(first), mean(second))];
      expect(soft / firm).toBeGreaterThan(STEP_VOICE.offFoot - 0.07);
      expect(soft / firm).toBeLessThan(STEP_VOICE.offFoot + 0.07);
      expect(new Set(gains.map((x) => x.toFixed(4))).size).toBeGreaterThan(gains.length * 0.8);
    } finally {
      random.mockRestore();
    }
  });

  it('a walk on a display faster than the simulation is a walk: the pace is the metres over the time since the body last moved, not since the last frame', () => {
    for (const hz of [60, 144, 240]) {
      const r = rig('mountains', 'snow', undefined, 110);
      for (let i = 0; i < hz * 10; i++) r.frame(1 / hz, Math.floor(((i + 1) * 60) / hz) - Math.floor((i * 60) / hz) > 0 ? 4.2 / 60 : 0); // (the simulation steps 60 times a second)
      const steps = recorded(r).filter((p) => p.o.pitch === FEEL.snow!.pitch);
      expect(steps.length, `${hz} Hz`).toBeGreaterThanOrEqual(36); // a stride every 1.05 m: about four a second, not the sprint's stride of 1.3 m
      expect(steps.length, `${hz} Hz`).toBeLessThanOrEqual(44);
      for (const p of steps) expect(p.o.gain! / FEEL.snow!.gain, `${hz} Hz`).toBeLessThanOrEqual(stepLevel(4.2) * (1 + STEP_VOICE.jitter) + 1e-6);
    }
  });

  it('the steps of a failing mind keep under the investigator\'s own, which are quieter now', () => {
    expect(FOOT_GAIN.phantom).toBeLessThan(0.15);
    expect(MIND_EARS.tread.gain[1]).toBeLessThanOrEqual(STEP_VOICE.level[1] * 0.45);
    expect(MIND_EARS.tread.last.gain).toBeLessThan(MIND_EARS.tread.gain[1] * 1.3);
  });

  it('a backstep\'s scuffs are no louder than a sprint\'s step', () => {
    expect(STEP_VOICE.backstep).toBeLessThanOrEqual(STEP_VOICE.level[1]);
    expect(STEP_VOICE.splash).toBeLessThan(0.32);
  });

  it('the recipe laid over a step keeps under the recording at every pace, on both feet', () => {
    const r = rig();
    r.tick(10, 42);
    const recipes = r.heard.filter((h) => h.key.startsWith('foot:snow'));
    expect(recipes.length).toBeGreaterThanOrEqual(30);
    for (const h of recipes) expect(h.gain).toBeLessThanOrEqual(FOOT_GAIN.steps * stepLevel(4.2) * (1 + 1e-9));
  });
});

describe('a room answers the footfall (round 83)', () => {
  const vault: Echo = { delay: 0.16, gain: 0.17, fall: 0.5, taps: 2, dark: 2300 };

  it('with no room, or a dry one, a step is the one sound; in a vault each is heard again, fainter, duller and later, to either side by turns', () => {
    const dry = rig('mountains', 'snow', undefined, 110);
    dry.tick(6, 25);
    expect(recorded(dry).length).toBeGreaterThan(10);
    for (const p of recorded(dry)) expect(p.o.echoes).toBeUndefined();
    const wet = rig('mountains', 'snow', undefined, 110, () => vault);
    wet.tick(6, 25);
    const steps = recorded(wet);
    expect(steps.length).toBeGreaterThan(10);
    steps.forEach((p, i) => {
      const echoes = p.o.echoes!;
      expect(echoes).toHaveLength(vault.taps);
      expect(echoes[0]!.delay).toBeCloseTo(vault.delay);
      expect(echoes[1]!.delay).toBeGreaterThan(echoes[0]!.delay * 1.5); // (not a flutter: each a little later than the last)
      expect(echoes[0]!.gain).toBeCloseTo(vault.gain);
      expect(echoes[1]!.gain).toBeLessThan(echoes[0]!.gain);
      expect(echoes[1]!.lowpass!).toBeLessThan(echoes[0]!.lowpass!);
      for (const e of echoes) {
        expect(e.lowpass!).toBeLessThanOrEqual(vault.dark);
        expect(e.lowpass!).toBeLessThanOrEqual(p.o.lowpass ?? 18000); // (never brighter than the step it gives back)
        expect(Math.abs(e.pan!)).toBeLessThanOrEqual(0.5);
      }
      if (i > 0) expect(Math.sign(echoes[0]!.pan!)).toBe(-Math.sign(steps[i - 1]!.o.echoes![0]!.pan!)); // the feet take turns
      expect(Math.sign(echoes[1]!.pan!)).toBe(-Math.sign(echoes[0]!.pan!));
    });
    const sides = new Set(steps.map((p) => Math.sign(p.o.echoes![0]!.pan!)));
    expect(sides).toEqual(new Set([-1, 1]));
  });

  it('a room is asked of at every step, so a threshold crossed is heard at the next one', () => {
    let room: Echo | undefined;
    const r = rig('mountains', 'snow', undefined, 110, () => room);
    r.tick(3, 12);
    const n = recorded(r).length;
    expect(n).toBeGreaterThan(3);
    room = vault;
    r.tick(3, 12);
    const all = recorded(r);
    expect(all.slice(0, n).every((p) => !p.o.echoes)).toBe(true);
    expect(all.slice(n).every((p) => p.o.echoes?.length === 2)).toBe(true);
  });

  it('a phantom step has no room\'s answer of its own', () => {
    const r = rig('mountains', 'snow', () => 0, 110, () => vault);
    r.g.mind.band = 'unmoored';
    r.tick(10, 20);
    const phantoms = r.played.filter((p) => p.o.delay);
    expect(phantoms.length).toBeGreaterThan(5);
    for (const p of phantoms) expect(p.o.echoes).toBeUndefined();
  });
});

describe('inside a dungeon the steps are lifted, in the open they are as round 83 left them (round 86)', () => {
  /** A walk through a room at 4.2 m/s, 12 m along +x from `from` metres inside its west wall. */
  function inRoom(floors: readonly string[], rand?: () => number) {
    const room = findRoom(floors)!;
    expect(room, floors.join('/')).not.toBeNull();
    const r = rig('mountains', 'snow', rand, 80);
    r.tr.pos = { x: room.x - 6, y: r.tr.pos.y, z: room.z };
    r.tr.prev = { ...r.tr.pos };
    r.tick(12 / 4.2, 12, Math.PI / 2);
    return r;
  }

  it('only a dungeon room\'s floor is lifted: the open air, the road and the shallows keep what they had', () => {
    expect(STEP_VOICE.indoors).toBeGreaterThan(1);
    expect(indoorLift(true)).toBe(STEP_VOICE.indoors);
    expect(indoorLift(false)).toBe(1);
    for (const open of ['dirt', 'road', 'water', 'stone'] as const) expect(stepGain(open), open).toBe(STEP_VOICE.surface[open]?.gain ?? 1); // (the recording's own softening, as round 83 had it, lifted or not by where the body stands)
    expect(stepGain('stone', true)).toBe(STEP_VOICE.indoors);
    expect(stepGain('dirt', true)).toBe(STEP_VOICE.indoors); // (a lift is a lift: only indoorsAt decides where it is asked for)
    expect(stepGain('road')).toBe(STEP_VOICE.surface.road!.gain);
    expect(stepGain('water')).toBe(STEP_VOICE.surface.water!.gain);
    expect(STEP_VOICE.level).toEqual([0.26, 0.58]); // (the pace curve is round 83's, for the open air and the room alike)
  });

  it('the ground inside a dungeon\'s bounding rectangle but off its floors is the open air\'s: not lifted, though its recording is the stone\'s', () => {
    const gap = findGap(14);
    expect(gap).not.toBeNull();
    const g = createWorldGame();
    const [y, room] = [g.ecs.c.transform.get(g.player.id)!.pos.y, findRoom(['slab', 'stone', 'rock'])!];
    expect(surfaceAt(g, gap!.x + 7, y, gap!.z)).toBe('stone'); // (the recording is the stone's...)
    expect(indoorsAt(g, gap!.x + 7, y, gap!.z)).toBe(false); // (...but the body is out under the sky)
    expect(indoorsAt(g, room.x, y, room.z)).toBe(true);
    const r = rig('mountains', 'snow', undefined, 80);
    r.tr.pos = { x: gap!.x, y: r.tr.pos.y, z: gap!.z };
    r.tr.prev = { ...r.tr.pos };
    r.tick(12 / 4.2, 12, Math.PI / 2);
    const steps = recorded(r).filter((p) => p.set === SAMPLE_SETS.stepStone);
    expect(steps.length).toBeGreaterThanOrEqual(9);
    for (const p of steps) expect(p.o.gain!).toBeLessThanOrEqual(stepLevel(4.2) * (1 + STEP_VOICE.jitter) + 1e-6); // (the open air's bound, no lift)
  });

  it('a walk through a room of stone is back at round 80\'s level, each step within the lift of the open air\'s bounds, the second foot softer', () => {
    const r = inRoom(['slab', 'stone', 'rock']);
    const steps = recorded(r).filter((p) => p.set === SAMPLE_SETS.stepStone);
    expect(steps.length).toBeGreaterThanOrEqual(9);
    const gains = steps.map((p) => p.o.gain!);
    for (const gain of gains) {
      expect(gain).toBeLessThanOrEqual(stepLevel(4.2) * (1 + STEP_VOICE.jitter) * STEP_VOICE.indoors + 1e-6);
      expect(gain).toBeGreaterThanOrEqual(stepLevel(4.2) * STEP_VOICE.offFoot * (1 - STEP_VOICE.jitter) * STEP_VOICE.indoors - 1e-6);
    }
    const mean = gains.reduce((a, b) => a + b, 0) / gains.length;
    const oldWalk = 0.55 + 0.45 * (4.2 / 6.4); // (round 80: the walk at 0.85)
    expect(mean).toBeGreaterThan(oldWalk * 0.85); // (the lilt between the feet takes a little)
    expect(mean).toBeLessThan(oldWalk * 1.05);
    expect(mean).toBeGreaterThan(stepLevel(4.2) * 1.5); // ...and well over what the open air gets
    expect(STEP_VOICE.indoors * stepLevel(4.2)).toBeGreaterThan(oldWalk * 0.97);
    expect(STEP_VOICE.indoors * stepLevel(4.2)).toBeLessThan(oldWalk * 1.03); // (a walk back where round 80 had it)
    expect(STEP_VOICE.indoors * STEP_VOICE.level[1]).toBeLessThan(1.1); // (a sprint no louder than round 80\'s)
  });

  it('the room still answers it, the returns a share of the louder step', () => {
    const vault: Echo = { delay: 0.16, gain: 0.1, fall: 0.5, taps: 1, dark: 1500 };
    const room = findRoom(['slab', 'stone', 'rock'])!;
    const r = rig('mountains', 'snow', undefined, 80, () => vault);
    r.tr.pos = { x: room.x - 6, y: r.tr.pos.y, z: room.z };
    r.tr.prev = { ...r.tr.pos };
    r.tick(12 / 4.2, 12, Math.PI / 2);
    const steps = recorded(r).filter((p) => p.set === SAMPLE_SETS.stepStone);
    expect(steps.length).toBeGreaterThanOrEqual(9);
    for (const p of steps) expect(p.o.echoes![0]!.gain).toBeCloseTo(vault.gain, 6); // (a share: the sampler lays it over the step\'s own gain)
  });

  it('the recipe laid over a step on a timber floor rides the lift, and stays under the recording', () => {
    const r = inRoom(['wood']);
    const recipes = r.heard.filter((h) => h.key === 'foot:boards');
    expect(recipes.length).toBeGreaterThanOrEqual(9);
    const [most, bound] = [Math.max(...recipes.map((h) => h.gain)), FOOT_GAIN.steps * stepLevel(4.2) * STEP_VOICE.indoors];
    expect(most).toBeLessThanOrEqual(bound * (1 + 1e-9));
    expect(most).toBeGreaterThan(FOOT_GAIN.steps * stepLevel(4.2) * 1.5); // (more than the open air\'s ever gets)
    const board = recorded(r).filter((p) => p.set === SAMPLE_SETS.stepStone);
    expect(board.length).toBe(recipes.length); // (one recipe a footfall, as in the open)
    for (const h of recipes) expect(h.gain).toBeLessThan(0.45 * 1.3);
  });

  it('a failing mind\'s step is lifted with them in a room, and is as it was in the open', () => {
    const inside = inRoom(['slab', 'stone', 'rock'], () => 0);
    inside.g.mind.band = 'unmoored';
    inside.setTime(inside.at());
    inside.tr.pos = { x: inside.tr.pos.x - 12, y: inside.tr.pos.y, z: inside.tr.pos.z };
    inside.tr.prev = { ...inside.tr.pos };
    inside.tick(12 / 4.2, 12, Math.PI / 2);
    const phantoms = inside.played.filter((p) => p.o.delay);
    expect(phantoms.length).toBeGreaterThan(3);
    for (const p of phantoms) expect(p.o.gain!).toBeCloseTo(FOOT_GAIN.phantom * STEP_VOICE.indoors, 9);
    const open = rig('mountains', 'snow', () => 0, 110);
    open.g.mind.band = 'unmoored';
    open.tick(10, 20);
    const outside = open.played.filter((p) => p.o.delay);
    expect(outside.length).toBeGreaterThan(5);
    for (const p of outside) expect(p.o.gain!).toBeCloseTo(FOOT_GAIN.phantom, 9);
  });
});

describe('the breath', () => {
  it('a sprint ended is panted out; an emptied bar gasps once, and again only after it has been refilled', () => {
    const r = rig('arkham', 'grass', undefined, 0);
    r.g.player.sprinting = true;
    r.tick(4, 25);
    r.g.player.sprinting = false;
    r.tick(1, 0);
    expect(keys(r, 'body:pant')).toBe(1);
    const st = r.g.ecs.c.stamina.get(r.g.player.id)!;
    st.value = st.max * 0.1;
    r.tick(1, 0);
    r.tick(1, 0);
    expect(keys(r, 'body:gasp')).toBe(1);
    st.value = st.max * 0.9;
    r.tick(1, 0);
    st.value = st.max * 0.1;
    r.tick(1, 0);
    expect(keys(r, 'body:gasp')).toBe(2);
  });

  it('near death the breath is ragged and quickens, and not kneeling at a sign', () => {
    const r = rig('arkham', 'grass', undefined, 0);
    HEART.need = 0.6;
    r.tick(10, 0);
    const slow = keys(r, 'body:ragged');
    expect(slow).toBeGreaterThanOrEqual(3);
    HEART.need = 1;
    r.tick(10, 0);
    expect(keys(r, 'body:ragged') - slow).toBeGreaterThan(slow);
    r.g.player.kneeling = { x: 0, z: 0 };
    const kneeling = keys(r, 'body:ragged');
    r.tick(10, 0);
    expect(keys(r, 'body:ragged')).toBe(kneeling);
    HEART.need = 0;
  });

  it('in the cold of the Mountains at night there is a slow exhale; in the Beyond, or in daylight, none', () => {
    const night = rig('mountains', 'snow');
    night.setTime(216); // the middle of the night's first hours: dark
    night.tick(30, 0);
    expect(keys(night, 'body:exhale')).toBeGreaterThanOrEqual(4);
    expect(keys(night, 'body:exhale')).toBeLessThanOrEqual(9);
    const beyond = rig('mountains', 'snow');
    beyond.g.overworld!.region = 'beyond';
    beyond.setTime(216);
    beyond.tick(30, 0);
    expect(keys(beyond, 'body:exhale')).toBe(0);
  });
});
