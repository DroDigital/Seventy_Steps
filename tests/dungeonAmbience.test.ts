import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DUNGEON_ACCENTS, KIT_AMBIENCE } from '../src/data/dungeonAmbience';
import { DUNGEONS } from '../src/data/dungeons';
import { KITS, type KitId } from '../src/data/kits';
import { ROOM_SOUNDS } from '../src/data/roomSounds';
import { DUNGEON_AMBIENCE, SAMPLE_SETS, SPOT_TRIM, type Ambience, type Spot } from '../src/data/samples';
import { createAmbience } from '../src/render/audio/ambience';
import type { AudioEngine } from '../src/render/audio/engine';
import { PLACED } from '../src/render/audio/exposure';
import { roomAmbience } from '../src/render/audio/roomAmbience';
import type { Sampler } from '../src/render/audio/sampler';
import { kitIdOfRoom } from '../src/world/dungeonKit';
import { worldLayout } from '../src/world/placements';

const played = vi.hoisted(() => [] as { sound: unknown; o: { gain?: number; pan?: number; pitch?: number; lowpass?: number; bus?: unknown } }[]);
vi.mock('../src/render/audio/synth', () => ({ playSound: (_e: unknown, sound: unknown, o: object) => (played.push({ sound, o }), true) }));

const kits = Object.keys(KITS) as KitId[];
const roofed = kits.filter((k) => KITS[k].sound !== 'open');
const sig = (a: Ambience): string => JSON.stringify([a.beds, a.spots.map((s) => s.set ?? s.recipe)]);
/** Events a minute a place's spots give, at the middle of their intervals (a seep counted by its drops). */
const perMinute = (a: Ambience): number => a.spots.reduce((n, s) => n + (60 / ((s.every[0] + s.every[1]) / 2)) * (s.run ? (s.run.count[0] + s.run.count[1]) / 2 : 1), 0);

describe('every dungeon\'s own sound (round 121)', () => {
  it('every roofed kit has a soundscape of its own and every one under the sky has none (its rooms keep the realm\'s)', () => {
    for (const k of roofed) expect(KIT_AMBIENCE[k], k).toBeDefined();
    for (const k of kits.filter((x) => !roofed.includes(x))) expect(KIT_AMBIENCE[k], k).toBeUndefined();
    for (const a of [...Object.values(KIT_AMBIENCE), ...Object.values(DUNGEON_AMBIENCE)]) expect(a!.roofed).toBe(true);
  });

  it('no two kits sound alike: each has beds and spots of its own, and the vaults no longer share the one cave and grotto', () => {
    const all = roofed.map((k) => sig(KIT_AMBIENCE[k]!));
    expect(new Set(all).size).toBe(roofed.length);
    for (const k of roofed) {
      const a = KIT_AMBIENCE[k]!;
      expect(a.beds.length, k).toBeGreaterThanOrEqual(1);
      expect(a.spots.length, k).toBeGreaterThanOrEqual(3);
      expect(new Set(a.beds.map(([f]) => f)).size, `${k}: a bed twice`).toBe(a.beds.length);
      expect(perMinute(a), `${k}: something now and then, never a clatter`).toBeGreaterThan(1.5);
      expect(perMinute(a), k).toBeLessThan(9);
    }
    const caves = roofed.filter((k) => KITS[k].sound === 'cave').map((k) => KIT_AMBIENCE[k]!.beds.map(([f]) => f).sort().join('+'));
    expect(new Set(caves).size).toBeGreaterThanOrEqual(caves.length - 1); // (once every one of these was cave + drips; the default vault and a cellar share their beds, not their spots)
  });

  it('the grotto drips only where there is standing water: the drowned halls, breathing and at half its old level; a seep is a few drops from one place', () => {
    for (const k of roofed) {
      const drips = KIT_AMBIENCE[k]!.beds.find(([f]) => f === 'drips');
      if (k === 'drowned') expect(drips![1]).toBeLessThanOrEqual(0.5);
      else expect(drips, k).toBeUndefined();
    }
    for (const a of Object.values(DUNGEON_ACCENTS)) expect((a.beds ?? []).some(([f]) => f === 'drips')).toBe(false);
    for (const s of [...Object.values(KIT_AMBIENCE).flatMap((a) => a!.spots), ...Object.values(DUNGEON_ACCENTS).flatMap((a) => a.spots ?? [])]) {
      if (!s.run) continue;
      expect(s.recipe).toBe('drop');
      expect(s.run.count[0]).toBeGreaterThanOrEqual(2);
      expect(s.run.count[1]).toBeLessThanOrEqual(8);
      expect(s.run.gap[0]).toBeGreaterThan(1);
      expect(s.every[0]).toBeGreaterThan(s.run.count[1] * s.run.gap[1]); // (a seep is over well before the next)
    }
  });

  it('a dungeon\'s own voices are of real dungeons, and add to their kit\'s rather than repeat it', () => {
    for (const [key, accent] of Object.entries(DUNGEON_ACCENTS)) {
      const [id, kit] = key.split('/');
      expect(DUNGEONS.some((d) => d.id === id), key).toBe(true);
      if (kit) expect(kits.includes(kit as KitId), key).toBe(true);
      expect((accent.beds?.length ?? 0) + (accent.spots?.length ?? 0), key).toBeGreaterThan(0);
    }
    const witch = roomAmbience('witch_house', 'timber')!;
    expect(witch.spots.length).toBe(KIT_AMBIENCE.timber!.spots.length + DUNGEON_ACCENTS.witch_house!.spots!.length);
    expect(roomAmbience('witch_house', 'timber')).toBe(witch); // (the same room is the same object: no cross-fade into itself)
    expect(roomAmbience('deserted_house', 'timber')).toBe(KIT_AMBIENCE.timber); // (a dungeon with no tale of its own has its kit's)
    expect(roomAmbience('elder_city', 'elder')).toBeNull(); // (under the sky: the realm's)
    expect(roomAmbience('waite_house', 'timber')!.beds.map(([f]) => f)).toEqual([...KIT_AMBIENCE.timber!.beds.map(([f]) => f), 'surf']);
  });

  it('across the world, the dungeons\' rooms sound many ways where they sounded three', () => {
    const heard = new Set<Ambience>();
    for (const { layout } of worldLayout().dungeons) for (const room of layout.rooms) {
      const kit = kitIdOfRoom(layout, room);
      const a = roomAmbience(layout.def.id, kit);
      if (KITS[kit].sound === 'open') expect(a, `${layout.def.id}/${room.def.id}`).toBeNull();
      else heard.add(a!);
      if (a) expect(new Set(a.beds.map(([f]) => f)).size, `${layout.def.id}/${kit}: a bed twice`).toBe(a.beds.length);
    }
    expect(heard.size).toBeGreaterThanOrEqual(20);
  });
});

describe('the spots of a room, as played (render/audio/ambience.ts, round 121)', () => {
  let seed = 1;
  beforeEach(() => {
    seed = 1;
    played.length = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
    Object.assign(PLACED, { on: false, shore: 0, pan: 0, exposure: 0 });
  });
  afterEach(() => vi.restoreAllMocks());

  function rig() {
    const node = () => ({ connect: <T>(x: T) => x, disconnect: () => undefined });
    const param = () => ({ value: 0, setValueAtTime: () => undefined, setTargetAtTime: () => undefined, linearRampToValueAtTime: () => undefined, cancelScheduledValues: () => undefined });
    const ctx = {
      currentTime: 0,
      createGain: () => ({ ...node(), gain: param() }),
      createStereoPanner: () => ({ ...node(), pan: param() }),
      createBiquadFilter: () => ({ ...node(), type: '', frequency: param(), Q: param() }),
      createOscillator: () => ({ ...node(), frequency: param(), start: () => undefined, stop: () => undefined }),
      createBufferSource: () => ({ ...node(), buffer: null, loop: false, loopStart: 0, loopEnd: 0, start: () => undefined, stop: () => undefined }),
      createBuffer: (_c: number, length: number, rate: number) => ({ duration: length / rate, copyToChannel: () => undefined }),
    };
    const bed = node();
    const sets: { set: unknown; o: { gain?: number; pan?: number; lowpass?: number; bus?: unknown } }[] = [];
    const sampler = { buffer: () => ({ duration: 30 }), settled: () => true, load: async () => undefined, forget: () => undefined, play: (set: unknown, o: object) => (sets.push({ set, o }), true) } as unknown as Sampler;
    return { e: { ctx, bed } as unknown as AudioEngine, bed, sampler, sets };
  }

  it('a recipe spot plays on the ambience\'s bus at its own level and through its own wall', () => {
    const { e, bed, sampler } = rig();
    const pump: Spot = { recipe: 'pump', every: [6, 6], gain: 0.9, lowpass: 900 };
    const beds = createAmbience(e, sampler);
    beds.set({ beds: [['gen_still', 0.5]], spots: [pump], roofed: true });
    for (let t = 0; t < 20; t += 0.5) beds.update(t);
    expect(played.length).toBe(3);
    for (const p of played) {
      expect(p.o.bus).toBe(bed);
      expect(p.o.lowpass).toBe(900);
      expect(p.o.gain).toBeCloseTo(SPOT_TRIM * 0.9);
      expect((p.sound as unknown[]).length).toBe(ROOM_SOUNDS.pump.length);
    }
  });

  it('a seep is one drop from one place, again and again a couple of seconds apart at near one pitch, and then still; gone with the room', () => {
    const { e, sampler } = rig();
    const drop: Spot = { recipe: 'drop', every: [40, 40], gain: 0.6, pitch: [0.75, 1.3], run: { count: [5, 5], gap: [2, 2] } };
    const beds = createAmbience(e, sampler);
    beds.set({ beds: [], spots: [drop], roofed: true });
    for (let t = 0; t < 60; t += 0.1) beds.update(t);
    expect(played.length).toBe(5);
    const [first] = played;
    for (const p of played) {
      expect(p.o.pan).toBe(first!.o.pan);
      expect(p.o.pitch! / first!.o.pitch!).toBeGreaterThan(0.98);
      expect(p.o.pitch! / first!.o.pitch!).toBeLessThan(1.02);
      expect(p.o.gain!).toBeLessThanOrEqual(SPOT_TRIM * 0.6 + 1e-9);
    }
    played.length = 0;
    beds.set({ beds: [], spots: [{ ...drop, every: [5, 5] }], roofed: true }); // another room as a seep has begun
    for (let t = 60; t < 66; t += 0.1) beds.update(t);
    const begun = played.length;
    beds.set({ beds: [], spots: [], roofed: true });
    for (let t = 66; t < 80; t += 0.1) beds.update(t);
    expect(played.length).toBe(begun); // (its drops do not follow into the next room)
  });

  it('a recording spot keeps its set, now at its own level too', () => {
    const { e, sampler, sets } = rig();
    const beds = createAmbience(e, sampler);
    beds.set({ beds: [], spots: [{ set: 'chant', every: [5, 5], gain: 0.4, lowpass: 700 }], roofed: true });
    for (let t = 0; t < 12; t += 0.5) beds.update(t);
    expect(sets.length).toBe(2);
    for (const s of sets) {
      expect(s.set).toBe(SAMPLE_SETS.chant);
      expect(s.o.gain).toBeCloseTo(SPOT_TRIM * 0.4);
      expect(s.o.lowpass).toBe(700);
    }
  });
});
