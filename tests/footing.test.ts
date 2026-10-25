import { describe, expect, it } from 'vitest';
import { COLD } from '../src/data/bodyTuning';
import { BODY, BREATH, FOOT_GAIN, GEAR, STEP_LAYERS, BOARD_CREAK, FEEL } from '../src/data/footSounds';
import { SAMPLE_SETS } from '../src/data/samples';
import type { Layer, Sound } from '../src/data/sounds';
import { createBodyFoley } from '../src/render/audio/bodyFoley';
import { createFoley } from '../src/render/audio/foley';
import { coldAt, footFeel, stepSetOf } from '../src/render/audio/footing';
import type { Sampler, SampleOptions } from '../src/render/audio/sampler';
import { HEART } from '../src/render/feel';
import { createWorldGame } from '../src/systems/game';
import { kitOfRoom } from '../src/world/dungeonKit';
import { worldLayout } from '../src/world/placements';
import { findGround, stride } from './footHelpers';
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

describe('how the ground is heard (round 78)', () => {
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
      expect(r.rms, ground).toBeGreaterThan(-42);
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

function rig(region = 'mountains', ground: Parameters<typeof findGround>[2] = 'snow', rand: () => number = () => 0.99) {
  const g = createWorldGame();
  const at = findGround(g, region, ground, 80, 0)!;
  const tr = g.ecs.c.transform.get(g.player.id)!;
  tr.pos = { x: at.x, y: 1, z: at.z };
  tr.prev = { ...tr.pos };
  g.overworld!.region = region;
  const heard: Heard[] = [];
  const played: Played[] = [];
  const sampler: Sampler = { load: async () => undefined, buffer: () => null, settled: () => true, forget: () => undefined, play: (set, o = {}) => (played.push({ set, o }), true) };
  const body = createBodyFoley(g, (key, _s, o) => (heard.push({ key, gain: o?.gain ?? 1 }), true), sampler, rand);
  const foley = createFoley(g, sampler, () => true);
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
  return { g, heard, played, tick, setStress: (s: number) => void (stress = s), tr, at: () => t, setTime: (s: number) => void (t = s) };
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
    const road = rig('arkham', 'dirt');
    road.tick(10, 20);
    expect(keys(road, 'foot:')).toBe(0);
    const mounted = rig();
    mounted.g.player.mount.active = 'horse';
    mounted.tick(10, 20);
    expect(mounted.heard).toEqual([]);
    expect(mounted.played).toEqual([]);
  });

  it('coat, satchel and the lantern\'s bail: the coat as a walk begins, all three at a run, quietly', () => {
    const r = rig();
    r.tick(2, 0);
    r.tick(5, 10);
    expect(keys(r, 'gear:coat')).toBe(1); // setting off
    expect(keys(r, 'gear:satchel')).toBe(0);
    const bails = keys(r, 'gear:bail');
    expect(bails).toBeGreaterThan(0);
    r.g.player.sprinting = true;
    r.tick(5, 28);
    expect(keys(r, 'gear:coat')).toBeGreaterThan(3);
    expect(keys(r, 'gear:satchel')).toBeGreaterThan(0);
    expect(keys(r, 'gear:bail')).toBeGreaterThan(bails + 2);
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

describe('the breath', () => {
  it('a sprint ended is panted out; an emptied bar gasps once, and again only after it has been refilled', () => {
    const r = rig('arkham', 'dirt');
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
    const r = rig('arkham', 'dirt');
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
