import { describe, expect, it } from 'vitest';
import { KIT_SPACE, REGION_SPACE, ROOM_SHAPE, SPACE, SPACES } from '../src/data/acoustics';
import { ROOM_KINDS } from '../src/data/dungeons';
import { KITS } from '../src/data/kits';
import { REGION_IDS } from '../src/data/regions';
import { createSpaceBus } from '../src/render/audio/space';
import { impulseEar, spaceImpulse } from '../src/render/audio/spaceImpulse';
import { spaceIdOf, spaceOf, type SpaceInput } from '../src/render/audio/spacePlan';
import { createSpaceSafety } from '../src/render/audio/spaceSafety';

const at = (o: Partial<SpaceInput>): SpaceInput => ({ kit: null, kind: null, wide: false, region: 'arkham', fighting: false, ...o });

describe('a room for every place (round 78)', () => {
  it('has a space for every kit, and every space a row', () => {
    for (const kit of Object.keys(KITS)) expect(SPACES[KIT_SPACE[kit as keyof typeof KITS]], kit).toBeDefined();
    for (const id of Object.values(KIT_SPACE)) expect(SPACES[id]).toBeDefined();
    for (const [region, id] of Object.entries(REGION_SPACE)) {
      expect(REGION_IDS, region).toContain(region);
      expect(SPACES[id]).toBeDefined();
    }
    for (const kind of ROOM_KINDS) expect(ROOM_SHAPE[kind]).toBeDefined();
  });

  it('answers a vault with a long dark tail, a timber house short and woody, the fields nearly dry', () => {
    const [field, house, library, vault, cave, drowned] = [at({}), at({ kit: 'timber', kind: 'hall' }), at({ kit: 'library', kind: 'hall' }), at({ kit: 'crypt', kind: 'hall' }), at({ kit: 'mine', kind: 'hall' }), at({ kit: 'drowned', kind: 'hall' })].map(spaceOf);
    expect(vault.hall).toBeGreaterThan(house.hall * 5);
    expect(house.room).toBeGreaterThan(vault.room);
    expect(house.room).toBeGreaterThan(library.room); // books drink the tail
    expect(vault.hall).toBeGreaterThan(field.hall * 4);
    expect(field.room + field.hall).toBeLessThan(0.1);
    expect(drowned.hall).toBeGreaterThan(vault.hall); // held long...
    expect(drowned.dark).toBeLessThan(vault.dark); // ...and dull
    expect(vault.dark).toBeLessThan(field.dark);
    expect(cave.dark).toBeLessThan(vault.dark);
  });

  it('shapes the room: a corridor is close, a wide hall opens, a pit rings', () => {
    const base = { kit: 'crypt' as const };
    const [corridor, hall, wide, pit] = [at({ ...base, kind: 'corridor' }), at({ ...base, kind: 'hall' }), at({ ...base, kind: 'hall', wide: true }), at({ ...base, kind: 'pit' })].map(spaceOf);
    expect(corridor.hall).toBeLessThan(hall.hall);
    expect(hall.hall).toBeLessThan(wide.hall);
    expect(pit.hall).toBeGreaterThan(hall.hall);
    expect(pit.dark).toBeLessThan(hall.dark);
    expect(corridor.room).toBeGreaterThan(hall.room);
  });

  it('is the Outer Dark in the Outer Dark and the Beyond, and a sealed hall in a fight', () => {
    for (const region of Object.keys(REGION_SPACE)) expect(spaceIdOf({ kit: null, region })).toBe('cosmos');
    expect(spaceIdOf({ kit: null, region: 'arkham' })).toBe('open');
    expect(spaceIdOf({ kit: null, region: null })).toBe('open');
    const [calm, fight] = [spaceOf(at({})), spaceOf(at({ fighting: true }))];
    expect(fight.hall).toBeGreaterThan(calm.hall * 2);
    expect(fight.dark).toBeLessThan(calm.dark);
    const [vault, vaultFight] = [spaceOf(at({ kit: 'crypt', kind: 'hall' })), spaceOf(at({ kit: 'crypt', kind: 'hall', fighting: true }))];
    expect(vaultFight.hall).toBeGreaterThanOrEqual(vault.hall); // a fight never makes a room smaller
  });

  it('keeps every wet in a sane range: the answer under the dry', () => {
    for (const [id, r] of Object.entries(SPACES)) {
      expect(r.room, id).toBeGreaterThanOrEqual(0);
      expect(r.hall, id).toBeLessThanOrEqual(0.6);
      expect(r.room, id).toBeLessThanOrEqual(0.3);
      expect(r.dark, id).toBeGreaterThan(1000);
      expect(r.bed, id).toBeLessThanOrEqual(0.35);
    }
    for (const kind of ROOM_KINDS) for (const kit of ['crypt', 'mine', 'drowned'] as const) expect(spaceOf(at({ kit, kind, wide: true })).hall, `${kit} ${kind}`).toBeLessThanOrEqual(SPACE.hallMost);
  });
});

/** A context that makes buffers, for the impulses (as tests/voiceRoom.test.ts has). */
const fake = (rate = 16000): BaseAudioContext =>
  ({ sampleRate: rate, createBuffer: (n: number, len: number, r: number) => { const d = Array.from({ length: n }, () => new Float32Array(len)); return { numberOfChannels: n, length: len, sampleRate: r, duration: len / r, getChannelData: (c: number) => d[c] }; } }) as unknown as BaseAudioContext;

/** Seconds for the backward-integrated energy (Schroeder) to fall from -5 dB to -35 dB, times two: the impulse's RT60. */
function rt60(d: Float32Array, rate: number): number {
  const e = new Float64Array(d.length);
  let sum = 0;
  for (let i = d.length - 1; i >= 0; i--) e[i] = sum += d[i]! * d[i]!;
  const at = (db: number): number => e.findIndex((v) => 10 * Math.log10(v / e[0]!) <= db);
  return (2 * (at(-35) - at(-5))) / rate;
}

describe('the impulses (round 78)', () => {
  const rate = 16000;
  it('carry one unit of energy each, so a wet gain is a share of amplitude', () => {
    for (const spec of [SPACE.room, SPACE.hall]) for (const ear of [0, 1]) {
      const d = impulseEar(rate, spec, ear);
      expect(d.reduce((s, x) => s + x * x, 0)).toBeCloseTo(1, 3);
      expect(d.every(Number.isFinite)).toBe(true);
    }
  });

  it('die away at the rate they are told: a short room and a long hall', () => {
    const [room, hall] = [rt60(impulseEar(rate, SPACE.room, 0), rate), rt60(impulseEar(rate, SPACE.hall, 0), rate)];
    expect(room).toBeGreaterThan(SPACE.room.rt60 * 0.6);
    expect(room).toBeLessThan(SPACE.room.rt60 * 1.4);
    expect(hall).toBeGreaterThan(SPACE.hall.rt60 * 0.7);
    expect(hall).toBeLessThan(SPACE.hall.rt60 * 1.3);
    expect(hall).toBeGreaterThan(room * 3);
  });

  it('are as long as they say, end in silence, differ in each ear, and begin with their early reflections', () => {
    const ctx = fake(rate);
    for (const [name, spec] of [['room', SPACE.room], ['hall', SPACE.hall]] as const) {
      const buf = spaceImpulse(ctx, name, spec);
      const [l, r] = [buf.getChannelData(0), buf.getChannelData(1)];
      expect(buf.length).toBe(Math.ceil(rate * spec.seconds));
      expect(Math.abs(l[l.length - 1]!)).toBeLessThan(1e-6);
      expect(l).not.toEqual(r);
      const first = Math.round((spec.early[0]! / 1000) * rate);
      const peakEarly = Math.max(...Array.from(l.slice(first - 2, first + 3), Math.abs));
      const typicalTail = Math.sqrt(l.slice(Math.round(rate * 0.25), Math.round(rate * 0.3)).reduce((s, x) => s + x * x, 0) / (0.05 * rate));
      expect(peakEarly, name).toBeGreaterThan(typicalTail * 2); // the first reflection stands out of the wash
      expect(spaceImpulse(ctx, name, spec)).toBe(buf); // made once
    }
  });

  it('lose their highs before their lows (a room soaks up the top first)', () => {
    const d = impulseEar(rate, SPACE.hall, 0);
    const roughness = (a: number, b: number): number => { let s = 0; for (let i = a + 1; i < b; i++) s += Math.abs(d[i]! - d[i - 1]!); return s / Math.sqrt(d.slice(a, b).reduce((e, x) => e + x * x, 1e-12)) / (b - a); };
    expect(roughness(Math.round(rate * 0.1), Math.round(rate * 0.3))).toBeGreaterThan(roughness(Math.round(rate * 1.6), Math.round(rate * 1.8)));
  });
});

/** A context of nodes that count what they are told. */
function bus() {
  const told: Record<string, number> = {};
  const param = (name: string) => ({ value: 0, setTargetAtTime: () => void (told[name] = (told[name] ?? 0) + 1) });
  const node = (name: string, extra: object = {}) => {
    const n: Record<string, unknown> = { connect: (to: unknown) => to, disconnect: () => void (told[`${name}.disconnect`] = (told[`${name}.disconnect`] ?? 0) + 1), ...extra };
    return n;
  };
  let gains = 0;
  const ctx = {
    sampleRate: 16000,
    currentTime: 0,
    createGain: () => { const i = gains++; return node(`gain${i}`, { gain: param(`gain${i}`) }); },
    createBiquadFilter: () => node('filter', { frequency: param('dark'), Q: param('q') }),
    createDelay: () => node('pre', { delayTime: param('pre') }),
    createConvolver: () => node('conv', {}),
    createBuffer: (n: number, len: number, r: number) => ({ numberOfChannels: n, length: len, sampleRate: r, duration: len / r, getChannelData: () => new Float32Array(len) }),
  } as unknown as AudioContext;
  const [sfx, bed, out] = [node('sfx'), node('bed'), node('out')] as unknown as AudioNode[];
  return { told, space: createSpaceBus(ctx, sfx!, bed!, out!) };
}

describe('the send (round 78)', () => {
  it('is told only of a change, glides to a new room, and keeps its state for the debug hooks', () => {
    const { told, space } = bus();
    space.set(SPACES.open);
    expect(Object.values(told).reduce((a, b) => a + b, 0)).toBe(0);
    space.set(SPACES.vault);
    const once = Object.values(told).reduce((a, b) => a + b, 0);
    expect(once).toBeGreaterThanOrEqual(4); // room, hall, bed, dark, pre
    space.set(SPACES.vault);
    space.set({ ...SPACES.vault, hall: SPACES.vault.hall + 0.0005 });
    expect(Object.values(told).reduce((a, b) => a + b, 0)).toBe(once);
    expect(space.state.hall).toBeCloseTo(SPACES.vault.hall, 2);
    space.set(SPACES.vault, SPACE.paused);
    expect(space.state.wet).toBe(SPACE.paused);
    expect(Object.values(told).reduce((a, b) => a + b, 0)).toBeGreaterThan(once); // the menu keeps a share of the room
  });

  it('lets the convolvers go and takes them up again', () => {
    const { told, space } = bus();
    space.enable(false);
    expect(space.state.on).toBe(false);
    expect(told['pre.disconnect']).toBe(1);
    space.enable(false);
    expect(told['pre.disconnect']).toBe(1);
    space.enable(true);
    expect(space.state.on).toBe(true);
  });
});

describe('the reverb gives way first (round 78)', () => {
  it('goes off on a machine that cannot hold its frames, and comes back when it can, and not for a hitch', () => {
    const s = createSpaceSafety();
    let now = 0;
    const run = (ms: number, seconds: number): void => { for (const end = now + seconds; now < end; now += ms / 1000) s.frame(ms, now); };
    run(16.7, 20);
    expect(s.on).toBe(true);
    run(16.7, 2);
    for (let i = 0; i < 3; i++) { s.frame(180, now); now += 0.18; } // a chunk loading
    run(16.7, 10);
    expect(s.on).toBe(true);
    run(50, 20); // 20 fps
    expect(s.on).toBe(false);
    run(16.7, 40);
    expect(s.on).toBe(true);
  });
});
