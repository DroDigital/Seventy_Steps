import { describe, expect, it, vi } from 'vitest';
import type { V3 } from '../src/core/geom';
import { MOUNT_IDS, type MountId } from '../src/data/mounts';
import { MOUNT_MIX, hoofBeat, type Ground } from '../src/data/mountSounds';
import type { Sound } from '../src/data/sounds';
import { SAMPLE_LEVELS } from '../src/data/sampleLevels';
import { SAMPLE_SETS } from '../src/data/samples';
import { createFoley } from '../src/render/audio/foley';
import { SILENT_BED, bedTargets, type BedTargets } from '../src/render/audio/mountBed';
import { createMountAudio } from '../src/render/audio/mountAudio';
import type { Sampler } from '../src/render/audio/sampler';
import { createGame } from '../src/systems/game';
import { cyclesFor, touchdowns } from '../src/systems/mountGait';
import { render } from './soundRender';

interface Heard { key: string; sound: Sound; gain: number; pan?: number; pitch?: number; at?: V3 | null }
interface Layered { set: unknown; gain?: number; pan?: number; pitch?: number }

function ride(id: MountId) {
  const g = createGame();
  Object.assign(g.player.mount, { selected: id, active: id, automobileOwned: true, chariotOwned: true, speed: 0, phase: 0 });
  const heard: Heard[] = [];
  const layered: Layered[] = [];
  const beds: BedTargets[] = [];
  const audio = createMountAudio(
    g,
    (key, sound, o) => (heard.push({ key, sound, gain: o?.gain ?? 1, pan: o?.pan, pitch: o?.pitch, at: o?.at }), true),
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
    r.advance(120, 11);
    r.heard.length = 0;
    r.advance(60, 0);
    expect(hooves(r.heard)).toEqual([]);
    for (const id of MOUNT_IDS) {
      const { heard, audio, pos, mount, advance } = ride(id);
      advance(10, 10);
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
    r.advance(240, 11);
    const by = (leg: number): Heard[] => r.heard.filter((h) => h.key === `mount:grey:hoof:${leg}`);
    for (const leg of [0, 1, 2, 3]) expect(by(leg).length, `leg ${leg}`).toBeGreaterThan(2);
    expect(by(0).every((h) => (h.pan ?? 0) < 0) && by(2).every((h) => (h.pan ?? 0) < 0)).toBe(true);
    expect(by(1).every((h) => (h.pan ?? 0) > 0) && by(3).every((h) => (h.pan ?? 0) > 0)).toBe(true);
    expect(Math.max(...by(2).map((h) => h.pitch ?? 1))).toBeLessThan(Math.min(...by(0).map((h) => h.pitch ?? 1)));
  });

  it("the included horse's hooves have a recorded footfall beneath them, pitched down; the skeletons' and the car's do not", () => {
    const grey = ride('grey');
    grey.advance(180, 11);
    expect(grey.layered.length).toBeGreaterThan(5);
    for (const l of grey.layered) {
      expect(Object.values(SAMPLE_SETS)).toContain(l.set);
      expect(l.pitch!).toBeLessThan(0.95);
      expect(l.pitch!).toBeGreaterThan(0.55);
      expect(l.gain!).toBeGreaterThan(0.3);
    }
    for (const id of ['chariot', 'automobile'] as const) {
      const r = ride(id);
      r.advance(180, 11);
      expect(r.layered).toEqual([]);
    }
  });

  it('only wheeled mounts that have hooves have the harness, the creak and the snort; the car has an engine and no hooves', () => {
    const car = ride('automobile');
    car.heard.length = 0;
    car.advance(600, 16);
    expect(hooves(car.heard)).toEqual([]);
    expect(car.heard.some((h) => h.key.endsWith(':knock'))).toBe(true);
    expect(car.heard.some((h) => /jingle|creak|snort/.test(h.key))).toBe(false);
    const grey = ride('grey');
    grey.heard.length = 0;
    grey.advance(600, 18);
    for (const part of ['jingle', 'creak', 'snort', 'knock']) expect(grey.heard.some((h) => h.key.endsWith(`:${part}`)), part).toBe(true);
    const spectral = ride('chariot');
    spectral.heard.length = 0;
    spectral.advance(600, 18);
    expect(spectral.heard.some((h) => h.key.endsWith(':snort'))).toBe(false);
    expect(spectral.heard.some((h) => h.key.endsWith(':jingle'))).toBe(true);
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

  it('pausing silences the beds', () => {
    const r = ride('chariot');
    r.advance(30, 12);
    expect(r.beds.at(-1)!.spectral).toBeGreaterThan(0);
    r.audio.pause();
    expect(r.beds.at(-1)).toEqual(SILENT_BED);
  });
});

describe('a ride is present in the mix, not a hush (round 50: the first set was quieter than a footfall and could not be heard)', () => {
  const rms = (sound: Sound, gain: number): { rms: number; peak: number; sec: number } => render(sound.map((l) => ({ ...l, gain: l.gain * gain })));

  it('every sound a ride makes is as present as a landed blow: between -22 and -11 dBFS rms, and never over full scale at its peak', () => {
    for (const id of MOUNT_IDS) {
      const r = ride(id);
      r.heard.length = 0;
      r.advance(900, 18);
      r.mount.active = null;
      r.audio.update(1 / 60);
      const loudest = new Map<string, Heard>();
      for (const h of r.heard) if (!loudest.has(h.key) || h.gain > loudest.get(h.key)!.gain) loudest.set(h.key, h);
      expect(loudest.size).toBeGreaterThan(id === 'automobile' ? 1 : 3);
      for (const [key, h] of loudest) {
        const out = rms(h.sound, h.gain);
        expect(out.rms, key).toBeGreaterThan(-22);
        expect(out.rms, key).toBeLessThan(-11);
        expect(out.peak, key).toBeLessThan(0);
        expect(out.sec, key).toBeLessThan(1.3);
      }
    }
  });

  it('a hoofbeat at a walk is softer than at a gallop, and at either it is far above the footfall of a person on foot', () => {
    const ground: Ground[] = ['dirt', 'road', 'stone', 'water'];
    const footfall = SAMPLE_LEVELS['sfx/step_dirt1'].rms + 20 * Math.log10(SAMPLE_SETS.stepDirt.gain); // about -35 dBFS
    for (const g of ground) {
      const walk = rms(hoofBeat(g, { weight: 0.35 }), MOUNT_MIX.hoof * (0.55 + 0.45 * 0.35));
      const gallop = rms(hoofBeat(g, { weight: 1 }), MOUNT_MIX.hoof);
      expect(walk.rms, g).toBeLessThan(gallop.rms - 1.5);
      expect(walk.rms, g).toBeGreaterThan(footfall + 8);
    }
  });

  it('the beds follow the speed and the ground: nothing at rest but the engine and the spectral drone, more with every metre a second', () => {
    expect(bedTargets(null, 18, 'dirt')).toEqual(SILENT_BED);
    const rest = bedTargets('grey', 0, 'dirt');
    expect(rest.rumble + rest.grind + rest.wind + rest.engine + rest.spectral).toBe(0);
    expect(bedTargets('automobile', 0, 'dirt').engine).toBeGreaterThan(0);
    expect(bedTargets('chariot', 0, 'dirt').spectral).toBeGreaterThan(0);
    expect(bedTargets('grey', 0, 'dirt').spectral).toBe(0);
    expect(bedTargets('grey', 18, 'dirt').engine).toBe(0);
    let last = bedTargets('grey', 0, 'road');
    for (const v of [2, 5, 8, 11, 14, 18]) {
      const now = bedTargets('grey', v, 'road');
      expect(now.rumble, `${v}`).toBeGreaterThan(last.rumble);
      expect(now.grind, `${v}`).toBeGreaterThan(last.grind);
      expect(now.wind, `${v}`).toBeGreaterThan(last.wind);
      expect(now.grindRate, `${v}`).toBeGreaterThan(last.grindRate);
      last = now;
    }
    expect(bedTargets('automobile', 18, 'road').engineHz).toBeGreaterThan(bedTargets('automobile', 0, 'road').engineHz * 3);
    expect(bedTargets('grey', 11, 'stone').grindHz).toBeGreaterThan(bedTargets('grey', 11, 'dirt').grindHz);
    for (const id of MOUNT_IDS) for (const v of [0, 11, 18, 40]) for (const surface of ['dirt', 'road', 'stone', 'water'] as const) {
      const t = bedTargets(id, v, surface);
      for (const gain of [t.rumble, t.grind, t.wind, t.engine, t.spectral]) {
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
