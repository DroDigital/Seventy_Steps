import { describe, expect, it, vi } from 'vitest';
import type { V3 } from '../src/core/geom';
import { MOUNT_IDS, MOUNT_TRAVERSAL, type MountId } from '../src/data/mounts';
import {
  CREAK, HARNESS_SHAKE, HORSE_BLOW, HORSE_HALT, HORSE_URGE, HORSE_WHICKER, LIP_FLUTTER, MOUNT_MIX, TAIL_SWISH, TRACE_SHIFT, hoofBeat, hoofScrape, wheelThump, type Ground,
} from '../src/data/mountSounds';
import type { Sound } from '../src/data/sounds';
import { SAMPLE_LEVELS } from '../src/data/sampleLevels';
import { SAMPLE_SETS } from '../src/data/samples';
import { createFoley } from '../src/render/audio/foley';
import { GEARS, SILENT_BED, bedTargets, engineNote, type BedTargets } from '../src/render/audio/mountBed';
import { createMountAudio } from '../src/render/audio/mountAudio';
import type { Sampler } from '../src/render/audio/sampler';
import { createGame } from '../src/systems/game';
import { PAW, pawAt, pawLanded } from '../src/systems/horseIdle';
import { cyclesFor, touchdowns } from '../src/systems/mountGait';
import { render } from './soundRender';

interface Heard { key: string; sound: Sound; gain: number; level: number; pan?: number; pitch?: number; at?: V3 | null } // `gain` as asked for; `level` the ride's share of it, made by the audio after a recording's own clamp
interface Layered { set: unknown; gain?: number; pan?: number; pitch?: number }

function ride(id: MountId) {
  const g = createGame();
  Object.assign(g.player.mount, { selected: id, active: id, automobileOwned: true, chariotOwned: true, speed: 0, phase: 0 });
  const heard: Heard[] = [];
  const layered: Layered[] = [];
  const beds: BedTargets[] = [];
  const audio = createMountAudio(
    g,
    (key, sound, o) => (heard.push({ key, sound, gain: (o?.gain ?? 1) * (o?.level ?? 1), level: o?.level ?? 1, pan: o?.pan, pitch: o?.pitch, at: o?.at }), true),
    { play: (set: unknown, o: Layered = {} as Layered) => (layered.push({ ...o, set }), true) } as unknown as Pick<Sampler, 'play'>,
    { set: (t) => beds.push(t) },
  );
  const pos = g.ecs.c.transform.get(g.player.id)!.pos;
  const mount = g.player.mount;
  /** Frames at `speed` m/s, the simulation counting the gait's cycles as it rides. */
  const advance = (frames: number, speed = 0): void => {
    for (let frame = 0; frame < frames; frame++) {
      pos.x += speed / 60;
      mount.speed = speed;
      mount.phase += cyclesFor(speed / 60, speed);
      audio.update(1 / 60);
    }
  };
  audio.update(1 / 60);
  return { g, heard, layered, beds, audio, pos, mount, advance };
}
const hooves = (heard: Heard[]): Heard[] => heard.filter((h) => h.key.includes(':hoof:'));

describe('mounts, heard (round 50)', () => {
  it('begins with its summons, which are not placed in the world, and stands without a hoofbeat', () => {
    for (const id of MOUNT_IDS) {
      const r = ride(id);
      expect(r.heard.map((h) => h.key)).toEqual([`mount:${id}:summon`]);
      expect(r.heard.every((h) => h.at == null)).toBe(true);
      r.heard.length = 0;
      r.advance(300, 0);
      expect(hooves(r.heard)).toEqual([]);
      expect(r.heard.every((h) => !/:(wheels|jingle|knock|creak)$/.test(h.key))).toBe(true);
    }
  });

  it('every hoofbeat is a foot that comes down in the gait the picture shows: as many as the cycles bring', () => {
    for (const id of ['grey', 'chariot'] as const) {
      for (const speed of [1.5, 5.5, 11, 18]) {
        const r = ride(id);
        r.heard.length = 0;
        let expected = 0;
        let phase = 0;
        for (let i = 0; i < 180; i++) {
          const next = phase + cyclesFor(speed / 60, speed);
          expected += touchdowns(phase, next, speed).length * (id === 'chariot' ? 2 : 1);
          phase = next;
        }
        r.advance(180, speed);
        expect(hooves(r.heard).length, `${id} at ${speed} m/s`).toBeGreaterThan(0);
        expect(Math.abs(hooves(r.heard).length - expected), `${id} at ${speed} m/s`).toBeLessThanOrEqual(id === 'chariot' ? 4 : 2);
      }
    }
  });

  it('a horse that stops against a wall stops at once, and a long gap or a jump brings no backlog of beats', () => {
    const r = ride('grey');
    r.advance(120, MOUNT_TRAVERSAL.cruise);
    r.heard.length = 0;
    r.advance(60, 0);
    expect(hooves(r.heard)).toEqual([]);
    for (const id of MOUNT_IDS) {
      const { heard, audio, pos, mount, advance } = ride(id);
      advance(10, MOUNT_TRAVERSAL.cruise);
      heard.length = 0;
      pos.x += 1000;
      mount.phase += 40;
      audio.update(1 / 60);
      audio.update(30);
      audio.update(0);
      audio.update(1 / 60);
      expect(heard).toEqual([]);
    }
  });

  it('the left feet are heard on the left and the right on the right; a hind hoof lands deeper than a fore', () => {
    const r = ride('grey');
    r.heard.length = 0;
    r.advance(240, MOUNT_TRAVERSAL.cruise);
    const by = (leg: number): Heard[] => r.heard.filter((h) => h.key === `mount:grey:hoof:${leg}`);
    for (const leg of [0, 1, 2, 3]) expect(by(leg).length, `leg ${leg}`).toBeGreaterThan(2);
    expect(by(0).every((h) => (h.pan ?? 0) < 0) && by(2).every((h) => (h.pan ?? 0) < 0)).toBe(true);
    expect(by(1).every((h) => (h.pan ?? 0) > 0) && by(3).every((h) => (h.pan ?? 0) > 0)).toBe(true);
    expect(Math.max(...by(2).map((h) => h.pitch ?? 1))).toBeLessThan(Math.min(...by(0).map((h) => h.pitch ?? 1)));
  });

  it("the included horse's hooves have a recorded footfall beneath them, pitched down; the skeletons' and the car's do not", () => {
    const grey = ride('grey');
    grey.advance(180, MOUNT_TRAVERSAL.cruise);
    expect(grey.layered.length).toBeGreaterThan(5);
    for (const l of grey.layered) {
      expect(Object.values(SAMPLE_SETS)).toContain(l.set);
      expect(l.pitch!).toBeLessThan(0.95);
      expect(l.pitch!).toBeGreaterThan(0.55);
      expect(l.gain!).toBeGreaterThan(0.3);
    }
    for (const id of ['chariot', 'automobile'] as const) {
      const r = ride(id);
      r.advance(180, MOUNT_TRAVERSAL.cruise);
      expect(r.layered).toEqual([]);
    }
  });

  it('only wheeled mounts that have hooves have the harness, the creak and the snort, and the skeletons alone the whisper; the car has an engine and no hooves', () => {
    const car = ride('automobile');
    car.heard.length = 0;
    car.advance(600, MOUNT_TRAVERSAL.gallop);
    expect(hooves(car.heard)).toEqual([]);
    expect(car.heard.some((h) => h.key.endsWith(':thump'))).toBe(true);
    expect(car.heard.some((h) => /trace|creak|snort|whisper/.test(h.key))).toBe(false);
    const grey = ride('grey');
    grey.heard.length = 0;
    grey.advance(600, MOUNT_TRAVERSAL.gallop); // (the real top speed: the snort is for a gallop, which the first set reached only at an artificial 18)
    for (const part of ['trace', 'creak', 'snort', 'thump']) expect(grey.heard.some((h) => h.key.endsWith(`:${part}`)), part).toBe(true);
    const spectral = ride('chariot');
    spectral.heard.length = 0;
    spectral.advance(600, MOUNT_TRAVERSAL.gallop);
    expect(spectral.heard.some((h) => h.key.endsWith(':snort'))).toBe(false);
    expect(spectral.heard.some((h) => h.key.endsWith(':trace'))).toBe(true);
    expect(spectral.heard.some((h) => h.key.endsWith(':whisper'))).toBe(true);
    expect(grey.heard.some((h) => h.key.endsWith(':whisper'))).toBe(false);
  });

  it('a parked car stays quiet, but for its bed, and dismounts with one stall; a parked horse is quiet as well', () => {
    const { g, heard, advance, beds } = ride('automobile');
    heard.length = 0;
    advance(120, 0);
    expect(heard).toEqual([]);
    expect(beds.at(-1)!.engine).toBeGreaterThan(0);
    g.player.mount.active = null;
    heard.length = 0;
    advance(120, 0);
    expect(heard.map((h) => h.key)).toEqual(['mount:automobile:dismiss']);
    expect(beds.at(-1)).toEqual(SILENT_BED);
  });

  it("every sound of a ride is asked for at the ride's one level, and its own gain left whole: the audio makes the cut after a recording's clamp at 1 (round 61)", () => {
    const r = ride('grey');
    r.advance(240, 9);
    expect(r.heard.length).toBeGreaterThan(0);
    for (const h of r.heard) {
      expect(h.level, h.key).toBeCloseTo(MOUNT_MIX.level, 6);
      expect(h.gain, h.key).toBeGreaterThan(0);
    }
  });

  it('pausing silences the beds', () => {
    const r = ride('chariot');
    r.advance(30, MOUNT_TRAVERSAL.cruise);
    expect(r.beds.at(-1)!.spectral).toBeGreaterThan(0);
    r.audio.pause();
    expect(r.beds.at(-1)).toEqual(SILENT_BED);
  });
});

describe('a ride is present in the mix, not a hush (round 50: the first set was quieter than a footfall and could not be heard)', () => {
  const rms = (sound: Sound, gain: number): { rms: number; peak: number; sec: number } => render(sound.map((l) => ({ ...l, gain: l.gain * gain })));

  it('every sound a ride makes is heard in the mix, under a landed blow (round 61: a ride was 7 to 9 dB over a fight): between -28 and -17 dBFS rms, and never over full scale at its peak', () => {
    for (const id of MOUNT_IDS) {
      const r = ride(id);
      r.heard.length = 0;
      r.advance(900, MOUNT_TRAVERSAL.gallop);
      r.mount.active = null;
      r.audio.update(1 / 60);
      const loudest = new Map<string, Heard>();
      for (const h of r.heard) if (!loudest.has(h.key) || h.gain > loudest.get(h.key)!.gain) loudest.set(h.key, h);
      expect(loudest.size).toBeGreaterThan(id === 'automobile' ? 1 : 3);
      for (const [key, h] of loudest) {
        const out = rms(h.sound, h.gain);
        expect(out.rms, key).toBeGreaterThan(/:(trace|creak|whisper)$/.test(key) ? -36 : -28); // the harness and the breath are asides, not blows
        expect(out.rms, key).toBeLessThan(-17);
        expect(out.peak, key).toBeLessThan(0);
        expect(out.sec, key).toBeLessThan(1.3);
      }
    }
  });

  it('a hoofbeat at a walk is softer than at a gallop, and at either it is far above the footfall of a person on foot', () => {
    const ground: Ground[] = ['dirt', 'road', 'stone', 'water'];
    const footfall = SAMPLE_LEVELS['sfx/step_dirt1'].rms + 20 * Math.log10(SAMPLE_SETS.stepDirt.gain); // about -35 dBFS
    for (const g of ground) {
      const walk = rms(hoofBeat(g, { weight: 0.35 }), MOUNT_MIX.level * MOUNT_MIX.hoof * (0.55 + 0.45 * 0.35));
      const gallop = rms(hoofBeat(g, { weight: 1 }), MOUNT_MIX.level * MOUNT_MIX.hoof);
      expect(walk.rms, g).toBeLessThan(gallop.rms - 1.5);
      expect(walk.rms, g).toBeGreaterThan(footfall + 4); // (round 61: 8, before the ride's level)
    }
  });

  it('the beds follow the speed and the ground: nothing at rest but the engine and the spectral drone, more with every metre a second', () => {
    expect(bedTargets(null, 18, 'dirt')).toEqual(SILENT_BED);
    const rest = bedTargets('grey', 0, 'dirt');
    expect(rest.rumble + rest.roll + rest.wind + rest.engine + rest.spectral).toBe(0);
    expect(bedTargets('automobile', 0, 'dirt').engine).toBeGreaterThan(0);
    expect(bedTargets('chariot', 0, 'dirt').spectral).toBeGreaterThan(0);
    expect(bedTargets('grey', 0, 'dirt').spectral).toBe(0);
    expect(bedTargets('grey', 18, 'dirt').engine).toBe(0);
    let last = bedTargets('grey', 0, 'road');
    for (const v of [1, 2.5, 4, 5.5, 7.5, 9, 10.4]) { // (up to the full gallop, where the load is whole)
      const now = bedTargets('grey', v, 'road');
      expect(now.rumble, `${v}`).toBeGreaterThan(last.rumble);
      expect(now.roll, `${v}`).toBeGreaterThan(last.roll);
      expect(now.wind, `${v}`).toBeGreaterThan(last.wind);
      expect(now.rollRate, `${v}`).toBeGreaterThan(last.rollRate);
      last = now;
    }
    expect(bedTargets('automobile', 18, 'road').engineHz).toBeGreaterThan(bedTargets('automobile', 0, 'road').engineHz * 3);
    expect(bedTargets('grey', 11, 'stone').rollHz).toBeGreaterThan(bedTargets('grey', 11, 'dirt').rollHz);
    for (const id of MOUNT_IDS) for (const v of [0, 11, 18, 40]) for (const surface of ['dirt', 'road', 'stone', 'water'] as const) {
      const t = bedTargets(id, v, surface);
      for (const gain of [t.rumble, t.roll, t.wind, t.engine, t.spectral]) {
        expect(gain).toBeGreaterThanOrEqual(0);
        expect(gain).toBeLessThanOrEqual(0.75);
      }
    }
  });

  it('riding suppresses investigator footsteps and dismounting resumes them without accumulated strides', () => {
    const { g, pos } = ride('grey');
    const play = vi.fn(() => true);
    const sampler = { play } as unknown as Sampler;
    const foley = createFoley(g, sampler, () => true);
    const place = () => ({ gain: 1, pan: 0 });
    foley.update(0, place, () => undefined);
    for (let i = 1; i <= 120; i++) {
      pos.x += 0.2;
      foley.update(i / 60, place, () => undefined);
    }
    expect(play).not.toHaveBeenCalled();
    g.player.mount.active = null;
    foley.update(121 / 60, place, () => undefined);
    expect(play).not.toHaveBeenCalled();
    for (let i = 122; i <= 140; i++) {
      pos.x += 0.1;
      foley.update(i / 60, place, () => undefined);
    }
    expect(play).toHaveBeenCalled();
  });
});

/** The share of a sound's energy at or above `hz`, by Goertzel on a spread of frequencies (22.05 kHz sampling). */
function above(sound: Sound, hz: number): number {
  const { samples } = render(sound);
  let [low, high] = [0, 0];
  for (let f = 60; f < 9000; f *= 1.12) {
    const w = (2 * Math.PI * f) / 22050;
    const k = 2 * Math.cos(w);
    let [s1, s2] = [0, 0];
    for (const x of samples) [s1, s2] = [x + k * s1 - s2, s1];
    const power = (s1 * s1 + s2 * s2 - k * s1 * s2) * f; // (per octave: the spread is geometric)
    if (f >= hz) high += power;
    else low += power;
  }
  return high / Math.max(1e-12, low + high);
}

describe('the wheels no longer clatter (round 52)', () => {
  it('a wheel\'s thump, the harness, the creak and a skeleton\'s hoof are soft: little of their energy is high', () => {
    for (const ground of ['dirt', 'road', 'stone'] as const) {
      expect(above(wheelThump('wood', ground), 2500), `wood ${ground}`).toBeLessThan(0.1);
      expect(above(wheelThump('rubber', ground), 2500), `rubber ${ground}`).toBeLessThan(0.1);
      expect(above(hoofBeat(ground, { shoe: 'bone', weight: 1 }), 2500), `bone ${ground}`).toBeLessThan(0.14);
    }
    expect(above(TRACE_SHIFT, 2500)).toBeLessThan(0.08);
    expect(above(CREAK, 2000)).toBeLessThan(0.08);
  });

  it('the wheels roll under a ceiling: the bed is low-passed low, on every ground, at every speed, for the coaches and the car', () => {
    for (const id of MOUNT_IDS) for (const ground of ['dirt', 'road', 'stone', 'water'] as const) for (const v of [3, 11, 18]) {
      const t = bedTargets(id, v, ground);
      expect(t.rollHz, `${id} ${ground}`).toBeLessThanOrEqual(id === 'automobile' ? 1250 : 900);
      expect(t.roll, `${id} ${ground}`).toBeLessThanOrEqual(0.45);
    }
  });

  it('no brass: the horse and the car make no bell-like sound in a long ride', () => {
    for (const id of MOUNT_IDS) {
      const r = ride(id);
      r.heard.length = 0;
      r.advance(1500, MOUNT_TRAVERSAL.gallop);
      for (const h of r.heard) expect(h.key, id).not.toMatch(/jingle|knock/);
    }
  });
});

describe('the car shifts gear and the spectral chariot breathes (round 52)', () => {
  it('the engine idles low, climbs through each gear and drops back at the next', () => {
    expect(engineNote(0)).toBe(22);
    for (let gear = 0; gear < GEARS.length - 1; gear++) {
      const [lo, hi] = [GEARS[gear]!, GEARS[gear + 1]!];
      if (gear > 0) expect(engineNote(lo + 0.01)).toBeLessThan(engineNote(lo - 0.01) - 12); // the shift
      expect(engineNote(hi - 0.01)).toBeGreaterThan(engineNote(lo + 0.5) + 10); // the climb
    }
    for (const v of [0, 3, 7, 11, 15, 18, 30]) {
      expect(engineNote(v)).toBeGreaterThanOrEqual(22);
      expect(engineNote(v)).toBeLessThanOrEqual(82);
    }
  });

  it('the spectral chariot\'s wind rises as it quickens, and the car eases off with an exhaust pop', () => {
    expect(bedTargets('chariot', MOUNT_TRAVERSAL.gallop, 'road').spectralHz).toBeGreaterThan(bedTargets('chariot', 2, 'road').spectralHz + 400);
    const car = ride('automobile');
    car.advance(200, MOUNT_TRAVERSAL.gallop);
    car.heard.length = 0;
    for (let i = 0; i < 300 && !car.heard.some((h) => h.key.endsWith(':pop')); i++) car.advance(10, MOUNT_TRAVERSAL.gallop - (i % 2 ? 0 : 6)); // easing off, taking it up again
    expect(car.heard.some((h) => h.key.endsWith(':pop'))).toBe(true);
    const horse = ride('grey');
    horse.advance(200, MOUNT_TRAVERSAL.gallop);
    horse.heard.length = 0;
    for (let i = 0; i < 100; i++) horse.advance(10, MOUNT_TRAVERSAL.gallop - (i % 2 ? 0 : 6));
    expect(horse.heard.some((h) => h.key.endsWith(':pop'))).toBe(false);
  });
});

describe('the horse and the reins, heard (round 57)', () => {
  const keys = (heard: Heard[], part: string): Heard[] => heard.filter((h) => h.key.endsWith(`:${part}`));

  it('the slap of the reins is not heard (round 60), and the horse still answers a moment after the hands, but not every time', () => {
    const r = ride('grey');
    r.heard.length = 0;
    for (let i = 0; i < 40; i++) { r.mount.reins.struck++; r.mount.reins.begun++; r.advance(60, 0); }
    expect(keys(r.heard, 'slap')).toEqual([]);
    const answered = keys(r.heard, 'urge').length;
    expect(answered).toBeGreaterThan(18);
    expect(answered).toBeLessThan(39);
    const one = ride('grey');
    one.heard.length = 0;
    one.mount.reins.struck++;
    one.advance(1, 0);
    expect(keys(one.heard, 'slap')).toEqual([]);
    expect(keys(one.heard, 'urge')).toEqual([]); // the answer is a beat behind the hand
    expect(one.heard.every((h) => h.at == null)).toBe(true);
    const skeletons = ride('chariot');
    skeletons.heard.length = 0;
    skeletons.mount.reins.struck++;
    skeletons.advance(60, 0);
    expect(keys(skeletons.heard, 'slap')).toEqual([]); // the chariot's reins are silent
    expect(skeletons.heard.filter((h) => /:(slap|urge)$/.test(h.key))).toEqual([]);
    expect(keys(skeletons.heard, 'urge')).toEqual([]); // bones do not whicker
    const car = ride('automobile');
    car.heard.length = 0;
    car.mount.reins.struck++;
    car.mount.reins.halts++;
    car.advance(120, 0);
    expect(car.heard).toEqual([]);
  });

  it('a hard pull is a blow through the nose, hooves braking and the harness shaken as the head goes up, harder from a gallop', () => {
    const gallop = ride('grey'), cruise = ride('grey');
    for (const [r, speed] of [[gallop, MOUNT_TRAVERSAL.gallop], [cruise, 4]] as const) {
      r.heard.length = 0;
      r.mount.reins.halts++;
      r.mount.reins.haltSpeed = speed;
      r.advance(1, 0);
      expect(keys(r.heard, 'halt')).toHaveLength(1);
      expect(keys(r.heard, 'scrape')).toHaveLength(1);
      expect(keys(r.heard, 'shake')).toEqual([]);
      r.advance(40, 0);
      expect(keys(r.heard, 'shake')).toHaveLength(1);
    }
    expect(keys(gallop.heard, 'halt')[0].gain).toBeGreaterThan(keys(cruise.heard, 'halt')[0].gain);
    expect(keys(gallop.heard, 'scrape')[0].gain).toBeGreaterThan(keys(cruise.heard, 'scrape')[0].gain);
    const spectral = ride('chariot');
    spectral.heard.length = 0;
    spectral.mount.reins.halts++;
    spectral.mount.reins.haltSpeed = MOUNT_TRAVERSAL.gallop;
    spectral.advance(60, 0);
    expect(keys(spectral.heard, 'halt')).toEqual([]);
    for (const part of ['scrape', 'shake', 'whisper']) expect(keys(spectral.heard, part), part).toHaveLength(1);
  });

  it('no stale sounds follow a long gap or a new summon: what was begun and not heard is not played late', () => {
    const r = ride('grey');
    r.mount.reins.struck += 5;
    r.mount.reins.halts += 2;
    r.heard.length = 0;
    r.audio.update(1); // a long gap: the beds and the counters begin again
    r.advance(120, 0);
    expect(r.heard.filter((h) => /:(slap|halt|scrape|urge)$/.test(h.key))).toEqual([]);
  });

  it('a standing horse makes the small noises of a horse that is awake, now and then, and never the same one twice running', () => {
    const r = ride('grey');
    r.heard.length = 0;
    r.advance(60 * 180, 0); // three minutes at its harness
    const idle = r.heard.filter((h) => /:(blow|whicker|shake|swish|flutter|snort)$/.test(h.key));
    expect(idle.length).toBeGreaterThan(10);
    expect(idle.length).toBeLessThan(40);
    expect(new Set(idle.map((h) => h.key)).size).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < idle.length; i++) expect(idle[i].key).not.toBe(idle[i - 1].key);
    expect(r.heard.every((h) => h.at == null)).toBe(true);
    const spectral = ride('chariot');
    spectral.heard.length = 0;
    spectral.advance(60 * 180, 0);
    expect(spectral.heard.filter((h) => h.key.endsWith(':shake')).length).toBeGreaterThan(5);
    expect(spectral.heard.filter((h) => /:(blow|whicker|swish|flutter|snort)$/.test(h.key))).toEqual([]);
    const car = ride('automobile');
    car.heard.length = 0;
    car.advance(60 * 60, 0);
    expect(car.heard).toEqual([]);
  });

  it('puts the hoof down where the picture does: each pawing stroke lands on its own clock, twice, and only while it stands', () => {
    expect(pawLanded(0, 0)).toBe(0);
    let start = 0;
    while (pawAt(start * PAW.period + PAW.from + 0.5 * PAW.span) === 0) start++; // a period the horse paws in
    const from = start * PAW.period;
    expect(pawLanded(from, from + PAW.period)).toBe(2);
    expect(pawLanded(from, from + PAW.from + PAW.span * 0.3)).toBe(0); // the hoof is still in the air
    expect(pawLanded(from + PAW.from + PAW.span * 0.3, from + PAW.from + PAW.span * 0.4)).toBe(1);
    let quiet = 0;
    while (pawAt(quiet * PAW.period + PAW.from + 0.5 * PAW.span) !== 0) quiet++;
    expect(pawLanded(quiet * PAW.period, (quiet + 1) * PAW.period)).toBe(0);

    const r = ride('grey');
    let clock = from;
    r.g.seaTime = () => clock;
    r.audio.update(1 / 60);
    r.heard.length = 0;
    for (let i = 0; i < PAW.period * 60; i++) { clock += 1 / 60; r.audio.update(1 / 60); r.pos.x += 0; }
    expect(r.heard.filter((h) => h.key === 'mount:grey:hoof:paw')).toHaveLength(2);
    const moving = ride('grey');
    clock = from;
    moving.g.seaTime = () => clock;
    moving.heard.length = 0;
    for (let i = 0; i < PAW.period * 60; i++) { clock += 1 / 60; moving.advance(1, 4); }
    expect(moving.heard.filter((h) => h.key === 'mount:grey:hoof:paw')).toEqual([]);
  });

  it('the new sounds sit under a landed blow, the small ones softer: between -28 and -17 dBFS rms, or -36 and -17 for the asides', () => {
    const all: [name: string, sound: Sound, gain: number, aside?: true][] = [
      ['urge', HORSE_URGE, MOUNT_MIX.urge], ['halt', HORSE_HALT, MOUNT_MIX.halt],
      ['shake', HARNESS_SHAKE, MOUNT_MIX.shake], ['blow', HORSE_BLOW, MOUNT_MIX.blow], ['whicker', HORSE_WHICKER, MOUNT_MIX.whicker],
      ['swish', TAIL_SWISH, MOUNT_MIX.swish, true], ['flutter', LIP_FLUTTER, MOUNT_MIX.flutter, true],
      ...(['dirt', 'road', 'stone', 'water'] as Ground[]).map((g): [string, Sound, number, true?] => [`scrape ${g}`, hoofScrape(g), MOUNT_MIX.scrape, g === 'water' ? true : undefined]),
    ];
    for (const [name, sound, gain, aside] of all) {
      const out = render(sound.map((l) => ({ ...l, gain: l.gain * gain * MOUNT_MIX.level })));
      expect(out.rms, name).toBeGreaterThan(aside ? -36 : -28);
      expect(out.rms, name).toBeLessThan(-17);
      expect(out.peak, name).toBeLessThan(0);
      expect(out.sec, name).toBeLessThan(1.3);
    }
  });

  it('is leather, hide and breath: little of it is high, and none of it rings', () => {
    for (const [name, sound] of [['halt', HORSE_HALT], ['shake', HARNESS_SHAKE], ['blow', HORSE_BLOW], ['whicker', HORSE_WHICKER], ['flutter', LIP_FLUTTER]] as const) {
      for (const layer of sound) if (layer.src !== 'noise') expect(layer.hz!, name).toBeLessThan(700); // no bell: every tone is a voice or a thump
      expect(sound.some((l) => l.src === 'sine' || l.src === 'triangle' || l.src === 'sawtooth' || l.src === 'noise'), name).toBe(true);
    }
  });
});
