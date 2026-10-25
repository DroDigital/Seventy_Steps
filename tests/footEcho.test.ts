import { describe, expect, it, vi } from 'vitest';
import { ECHO_MOST, ECHO_PACE, ECHO_VOICES, KIT_SPACE, ROOM_SHAPE, SPACES, type Echo, type SpaceRow } from '../src/data/acoustics';
import { ROOM_KINDS } from '../src/data/dungeons';
import { KITS } from '../src/data/kits';
import { AUDIO } from '../src/data/tuning';
import type { AudioEngine } from '../src/render/audio/engine';
import { echoesOf, stepGain, stepLowpass } from '../src/render/audio/footing';
import { createSampler } from '../src/render/audio/sampler';
import { createSpaceBus } from '../src/render/audio/space';
import { spaceOf, type SpaceInput } from '../src/render/audio/spacePlan';

const echoIn = (id: keyof typeof SPACES): Echo | undefined => (SPACES[id] as SpaceRow).echo;
const at = (o: Partial<SpaceInput>): SpaceInput => ({ kit: null, kind: null, wide: false, region: 'arkham', fighting: false, ...o });

describe('which places answer a footfall (round 83)', () => {
  it('the vaults, the caves, the drowned halls, the naves and the libraries do, faintly; the fields, the ruins, the timber houses, the fights and the endless dark do not', () => {
    for (const id of ['vault', 'cave', 'drowned', 'nave', 'library'] as const) expect(echoIn(id), id).toBeDefined();
    for (const id of ['open', 'ruin', 'timber', 'fight', 'cosmos'] as const) expect(echoIn(id), id).toBeUndefined();
    const kits = (id: string): string[] => Object.keys(KITS).filter((k) => KIT_SPACE[k as keyof typeof KITS] === id);
    expect(kits('cave')).toContain('mine');
    for (const [kit, kind] of [['crypt', 'hall'], ['mine', 'hall'], ['drowned', 'hall'], ['church', 'hall'], ['library', 'hall']] as const) expect(spaceOf(at({ kit, kind })).echo, kit).toBeDefined();
    for (const [kit, kind] of [['timber', 'hall'], ['townhouse', 'hall'], ['elder', 'hall'], ['void', 'hall']] as const) expect(spaceOf(at({ kit, kind })).echo, kit).toBeUndefined();
    expect(spaceOf(at({})).echo).toBeUndefined(); // the fields
    expect(spaceOf(at({ region: 'beyond' })).echo).toBeUndefined(); // the Outer Dark's open air, walked for hours: the wash only
  });

  it('every answer is subtle: a few returns, each well under a quarter of the step and fainter than the last, dull, and late enough to be heard as a return', () => {
    for (const id of Object.keys(SPACES) as (keyof typeof SPACES)[]) {
      const e = echoIn(id);
      if (!e) continue;
      expect(e.gain, id).toBeLessThanOrEqual(ECHO_MOST / 2); // (first returns are -18 dB and under)
      expect(e.gain, id).toBeGreaterThan(0.04);
      expect(e.fall, id).toBeLessThan(1);
      expect(e.fall, id).toBeGreaterThan(0.3);
      expect(e.taps, id).toBeGreaterThanOrEqual(1);
      expect(e.taps, id).toBeLessThanOrEqual(2);
      expect(e.delay, id).toBeGreaterThan(0.06); // (nearer than this it is only a thickening of the step)
      expect(e.dark, id).toBeLessThanOrEqual(2500);
      expect(e.dark, id).toBeGreaterThan(700);
    }
  });

  it('whatever the room, the last return of a step is done inside nine tenths of a second, so it does not hold the voices', () => {
    for (const kit of Object.keys(KITS) as (keyof typeof KITS)[]) for (const kind of ROOM_KINDS) for (const wide of [false, true]) {
      const e = spaceOf(at({ kit, kind, wide })).echo;
      if (e) expect(e.delay * (1 + 0.85 * (e.taps - 1)), `${kit} ${kind} ${wide}`).toBeLessThan(0.9);
    }
    expect(Object.keys(ROOM_SHAPE)).toEqual(expect.arrayContaining([...ROOM_KINDS]));
  });

  it('the darker the place the duller its answer, the larger the later: a drowned hall is slower and duller than a cave, a cave than a vault, a vault than a library', () => {
    const [library, vault, cave, drowned] = (['library', 'vault', 'cave', 'drowned'] as const).map((id) => echoIn(id)!);
    expect(library.delay).toBeLessThan(vault.delay);
    expect(vault.delay).toBeLessThan(cave.delay);
    expect(cave.delay).toBeLessThan(drowned.delay);
    expect(drowned.dark).toBeLessThan(cave.dark);
    expect(cave.dark).toBeLessThan(vault.dark);
    expect(library.gain).toBeLessThan(vault.gain / 2 + 1e-9); // (books drink it)
  });

  it('the room\'s shape shapes it: a corridor answers sooner, a wide hall and a pit later', () => {
    const base = { kit: 'crypt' as const };
    const [corridor, hall, wide, pit] = [at({ ...base, kind: 'corridor' }), at({ ...base, kind: 'hall' }), at({ ...base, kind: 'hall', wide: true }), at({ ...base, kind: 'pit' })].map((i) => spaceOf(i).echo!);
    expect(corridor.delay).toBeLessThan(hall.delay);
    expect(hall.delay).toBeLessThan(wide.delay);
    expect(hall.delay).toBeLessThan(pit.delay);
    expect(hall.delay).toBeCloseTo(echoIn('vault')!.delay);
    for (const e of [corridor, wide, pit]) expect(e.gain).toBe(hall.gain); // (only the time moves)
  });

  it('a fight engaged leaves the steps dry: the wash is drawn toward a sealed hall already, and there are many steps', () => {
    expect(spaceOf(at({ kit: 'crypt', kind: 'hall', fighting: true })).echo).toBeUndefined();
    expect(spaceOf(at({ kit: 'crypt', kind: 'hall', fighting: true })).hall).toBeGreaterThanOrEqual(spaceOf(at({ kit: 'crypt', kind: 'hall' })).hall);
  });
});

describe('the send carries the answer (round 83)', () => {
  const node = (extra: object = {}) => ({ connect: (to: unknown) => to, disconnect: () => undefined, ...extra });
  const param = () => ({ value: 0, setTargetAtTime: () => undefined });
  function bus() {
    const ctx = {
      sampleRate: 16000,
      currentTime: 0,
      createGain: () => node({ gain: param() }),
      createBiquadFilter: () => node({ frequency: param(), Q: param() }),
      createDelay: () => node({ delayTime: param() }),
      createConvolver: () => node({}),
      createBuffer: (n: number, len: number, r: number) => ({ numberOfChannels: n, length: len, sampleRate: r, duration: len / r, getChannelData: () => new Float32Array(len) }),
    } as unknown as AudioContext;
    return createSpaceBus(ctx, node() as unknown as AudioNode, node() as unknown as AudioNode, node() as unknown as AudioNode);
  }

  it('says the room\'s echo, and leaves none of the last room\'s when it is told of a dry one', () => {
    const space = bus();
    expect(space.state.echo).toBeUndefined();
    space.set(spaceOf(at({ kit: 'mine', kind: 'hall' })));
    expect(space.state.echo).toEqual(echoIn('cave'));
    space.set(spaceOf(at({ kit: 'mine', kind: 'hall' })), 0.4); // (a menu keeps the room's wash; there are no steps in a menu to answer)
    expect(space.state.echo).toBeDefined();
    space.set(spaceOf(at({}))); // out in the fields
    expect(space.state.echo).toBeUndefined();
    space.set(SPACES.vault);
    space.set(SPACES.open); // (a bare row with no `echo` key at all)
    expect(space.state.echo).toBeUndefined();
  });
});

describe('the returns of a step (round 83)', () => {
  const vault: Echo = { delay: 0.16, gain: 0.17, fall: 0.5, taps: 2, dark: 2300 };

  it('are one for each tap, later and later, fainter, duller, and to the sides in turn', () => {
    const [right, left] = [echoesOf(vault, 1), echoesOf(vault, -1)];
    expect(right).toHaveLength(2);
    expect(right[0]!.delay).toBeCloseTo(0.16);
    expect(right[1]!.delay).toBeCloseTo(0.16 * 1.85);
    expect(right[0]!.gain).toBeCloseTo(0.17);
    expect(right[1]!.gain).toBeCloseTo(0.085);
    expect(right[1]!.lowpass!).toBeLessThan(right[0]!.lowpass!);
    expect(right[0]!.pan).toBeGreaterThan(0);
    expect(right[1]!.pan).toBeLessThan(0);
    expect(left.map((e) => e.pan)).toEqual(right.map((e) => -e.pan!));
  });

  it('are never louder than a quarter of the step, nor brighter than the step they give back, nor wider than half the field', () => {
    const loud: Echo = { delay: 0.2, gain: 0.9, fall: 0.99, taps: 3, dark: 9000 };
    for (const e of echoesOf(loud, 1, 1800)) {
      expect(e.gain).toBeLessThanOrEqual(ECHO_MOST);
      expect(e.lowpass!).toBeLessThanOrEqual(1800);
      expect(Math.abs(e.pan!)).toBeLessThanOrEqual(0.5);
    }
  });

  it('answer a walk in full, a run less and a sprint not at all: the returns would pile on the next footfalls', () => {
    const gains = (speed: number): number[] => echoesOf(vault, 1, 18000, speed).map((e) => e.gain);
    expect(gains(0)).toEqual(gains(ECHO_PACE.full));
    expect(gains(4.2)[0]).toBeCloseTo(0.17); // a walk (PLAYER.walkSpeed)
    const run = gains((ECHO_PACE.full + ECHO_PACE.none) / 2);
    expect(run[0]).toBeCloseTo(0.085, 2);
    expect(run[0]).toBeLessThan(gains(4.2)[0]!);
    expect(gains(ECHO_PACE.none)).toEqual([]);
    expect(gains(6.4)).toEqual([]); // a sprint (PLAYER.sprintSpeed)
    expect(ECHO_PACE.full).toBeGreaterThan(4.2);
    expect(ECHO_PACE.none).toBeLessThan(6.4);
  });

  it('the recorded steps of the bright ground are dulled and brought down, and the dark left as they were', () => {
    expect(stepLowpass('road')).toBeLessThanOrEqual(2200);
    expect(stepLowpass('water')).toBeLessThanOrEqual(2400);
    expect(stepLowpass('dirt')).toBeUndefined();
    expect(stepLowpass('stone')).toBeUndefined();
    expect(stepGain('road')).toBeLessThan(1);
    expect(stepGain('water')).toBeLessThan(1);
    expect(stepGain('dirt')).toBe(1);
    expect(stepGain('stone')).toBe(1);
    expect(stepLowpass('dirt', 1800)).toBe(1800); // (the ground's own, where it has one)
    expect(stepLowpass('road', 1500)).toBe(1500); // (the duller of the two)
    expect(stepLowpass('road', 5000)).toBe(stepLowpass('road'));
  });
});

describe('the sampler plays the take again (round 83)', () => {
  function engine(playing = 0) {
    const sources: { buffer: unknown; rate: number; start: ReturnType<typeof vi.fn>; onended: (() => void) | null; detune: { value: number } }[] = [];
    const gains: { value: number }[] = [];
    const pans: { value: number }[] = [];
    const filters: { value: number }[] = [];
    const n = () => ({ connect: (x: unknown) => x, disconnect: vi.fn() });
    const ctx = {
      currentTime: 10,
      createBufferSource: () => {
        const s = { ...n(), buffer: null as unknown, rate: 0, start: vi.fn(), onended: null as (() => void) | null, detune: { value: 0 }, playbackRate: { set value(v: number) { s.rate = v; } } };
        sources.push(s);
        return s;
      },
      createGain: () => { const g = { value: 1 }; gains.push(g); return { ...n(), gain: g }; },
      createStereoPanner: () => { const p = { value: 0 }; pans.push(p); return { ...n(), pan: p }; },
      createBiquadFilter: () => { const f = { value: 0 }; filters.push(f); return { ...n(), type: '', frequency: f }; },
      decodeAudioData: async () => ({ duration: 0.3 }),
    };
    const e = { ctx, sfx: n(), playing, detune: 0, onStart: (fn: (c: unknown) => void) => fn(ctx) } as unknown as AudioEngine & { playing: number };
    return { e, sources, gains, pans, filters };
  }
  async function play(o: Parameters<ReturnType<typeof createSampler>['play']>[1], playing = 0) {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) }));
    const rig = engine(playing);
    const sampler = createSampler(rig.e, '');
    const set = { files: ['x1'], gain: 0.5, pitch: [0.9, 1.1] as const };
    await sampler.load(['sfx/x1']);
    expect(sampler.play(set, o)).toBe(true);
    vi.unstubAllGlobals();
    return rig;
  }

  it('is one voice without returns, as it was', async () => {
    const r = await play({ gain: 0.8, pan: 0.2, lowpass: 3000 });
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0]!.start).toHaveBeenCalledWith(0);
    expect(r.gains[0]!.value).toBeCloseTo(0.4);
    expect(r.pans[0]!.value).toBeCloseTo(0.2);
    expect(r.filters.map((f) => f.value)).toEqual([3000]);
  });

  it('is the same take at the same pitch again after each delay, fainter, duller and a little to the side', async () => {
    const r = await play({ gain: 0.8, pan: 0.1, lowpass: 3000, echoes: [{ delay: 0.2, gain: 0.2, lowpass: 2000, pan: 0.3 }, { delay: 0.4, gain: 0.1, lowpass: 4000, pan: -0.9 }] });
    expect(r.sources).toHaveLength(3);
    expect(r.sources.map((s) => s.buffer)).toEqual([r.sources[0]!.buffer, r.sources[0]!.buffer, r.sources[0]!.buffer]);
    expect(r.sources[1]!.rate).toBe(r.sources[0]!.rate); // (an echo is a copy, not another step)
    expect(r.sources[2]!.rate).toBe(r.sources[0]!.rate);
    expect(r.sources[0]!.start).toHaveBeenCalledWith(0);
    expect(r.sources[1]!.start).toHaveBeenCalledWith(10.2);
    expect(r.sources[2]!.start).toHaveBeenCalledWith(10.4);
    expect(r.gains.map((g) => g.value)).toEqual([expect.closeTo(0.4, 5), expect.closeTo(0.08, 5), expect.closeTo(0.04, 5)]);
    expect(r.filters.map((f) => f.value)).toEqual([3000, 2000, 3000]); // (the duller of the step's and the echo's)
    expect(r.pans.map((p) => p.value)).toEqual([expect.closeTo(0.1, 5), expect.closeTo(0.4, 5), -0.8]);
    expect(r.sources.every((s) => s.detune.value === 0)).toBe(true);
  });

  it('the voices are counted and given back, and the returns of a step wait on a step that waits', async () => {
    const r = await play({ delay: 0.5, echoes: [{ delay: 0.2, gain: 0.2 }] });
    expect(r.e.playing).toBe(2);
    expect(r.sources[0]!.start).toHaveBeenCalledWith(10.5);
    expect(r.sources[1]!.start).toHaveBeenCalledWith(10.7);
    r.sources[0]!.onended!();
    r.sources[1]!.onended!();
    expect(r.e.playing).toBe(0);
  });

  it('lets the returns go before the blows and cries when the voices are many', async () => {
    const voices = Math.floor(AUDIO.polyphony * ECHO_VOICES); // (the step itself counts as one of them when its returns are asked)
    const busy = await play({ echoes: [{ delay: 0.2, gain: 0.2 }] }, voices);
    expect(busy.sources).toHaveLength(1);
    const room = await play({ echoes: [{ delay: 0.2, gain: 0.2 }] }, voices - 1);
    expect(room.sources).toHaveLength(2);
    const full = await play({ echoes: [{ delay: 0.2, gain: 0.2 }] }, AUDIO.polyphony - 1);
    expect(full.sources).toHaveLength(1); // (the step still sounds while there is a voice for it)
  });
});
