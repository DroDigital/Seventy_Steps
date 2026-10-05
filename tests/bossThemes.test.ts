// The boss themes' player (round 44): which theme sounds is decided by the track (a pair shares one, the
// Great Ones' hand over to Nyarlathotep's), a theme that is not ready leaves the procedural score to play, the
// move to the hot stretch lands on a bar line, a phase lifts it, a line ducks it, the fight's end fades it.
// A fake context stands in for WebAudio.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOSS_MUSIC, BOSS_TRACKS, BOSS_TRACK_IDS, bossFile, type BossTrackId } from '../src/data/bossMusic';
import { BOSS_MAP } from '../src/data/bossMusicMap';
import { liftOf, planOf, duckLevel, sceneLevel, type Scored } from '../src/render/audio/bossPlan';
import { scoreFor } from '../src/render/audio/bossMusic';
import { createBossThemes, type ThemeInput } from '../src/render/audio/bossThemes';
import type { AudioEngine } from '../src/render/audio/engine';

interface Param {
  value: number;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
  setValueAtTime: ReturnType<typeof vi.fn>;
  setValueCurveAtTime: ReturnType<typeof vi.fn>;
  setTargetAtTime: ReturnType<typeof vi.fn>;
}
interface Node {
  kind: string;
  connect: (n: Node) => Node;
  disconnect: ReturnType<typeof vi.fn>;
  gain?: Param;
  [k: string]: unknown;
}
interface Source extends Node {
  buffer: unknown;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 80; i++) await Promise.resolve(); // the fetches and decodes settle in microtasks
};

function fakeEngine(): { engine: AudioEngine; ctx: { currentTime: number; state: string }; sources: Source[]; gains: Node[] } {
  const [sources, gains]: [Source[], Node[]] = [[], []];
  const param = (v = 1): Param => ({ value: v, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), setValueCurveAtTime: vi.fn(), setTargetAtTime: vi.fn() });
  const node = (kind: string): Node => ({ kind, connect: (x) => x, disconnect: vi.fn() });
  const buffer = { duration: 180, sampleRate: 48000, numberOfChannels: 2, getChannelData: () => new Float32Array(32) };
  const ctx = {
    currentTime: 10,
    state: 'running',
    decodeAudioData: async () => buffer,
    createBufferSource: () => {
      const s = { ...node('source'), buffer: null, start: vi.fn(), stop: vi.fn(), onended: null } as Source;
      sources.push(s);
      return s;
    },
    createGain: () => {
      const gn = { ...node('gain'), gain: param() };
      gains.push(gn);
      return gn;
    },
    createBiquadFilter: () => ({ ...node('filter'), type: '', frequency: param(), gain: param(0) }),
  };
  return { engine: { ctx, score: node('score') } as unknown as AudioEngine, ctx, sources, gains };
}

let missing: Set<string>;
let asked: string[];
beforeEach(() => {
  missing = new Set();
  asked = [];
  vi.stubGlobal('fetch', async (url: string) => {
    asked.push(url);
    if ([...missing].some((m) => url.includes(m))) return { ok: false, status: 404 };
    return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) };
  });
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const fight = (id: string, phase = 0, last = false): Scored => ({ id, phase, last });
const input = (fights: Scored[], o: Partial<ThemeInput> = {}): ThemeInput => ({ fights, warm: null, scene: false, replacing: false, ...o });
/** The theme with a hot stretch, and a horror it scores. */
const hotTrack = (): [BossTrackId, string] => {
  const id = BOSS_TRACK_IDS.find((i) => BOSS_MAP[i]?.loop && BOSS_MAP[i]?.hot)!;
  return [id, BOSS_TRACKS[id].bosses[0]];
};

describe('the boss themes\' player (round 44)', () => {
  it('lets the procedural score play where a theme is not ready, or its file is missing, then takes over from it', async () => {
    const { engine, sources } = fakeEngine();
    missing.add('the-sunken-leviathan');
    const themes = createBossThemes(engine);
    expect(themes.update(input([fight('cthulhu')])).sounding, 'still loading: the score plays').toBeNull();
    await flush();
    expect(themes.update(input([fight('cthulhu')])).sounding, 'the file is missing: the score plays on').toBeNull();
    expect(sources.length).toBe(0);
    missing.clear();
    const { engine: e2, sources: s2 } = fakeEngine();
    const t2 = createBossThemes(e2);
    expect(t2.update(input([fight('cthulhu')], { replacing: true })).sounding).toBeNull(); // asked for, not yet decoded
    expect(asked).toContain(`/${bossFile('the_sunken_leviathan')}`.slice(1));
    await flush();
    expect(t2.update(input([fight('cthulhu')], { replacing: true })).sounding).toBe('the_sunken_leviathan');
    expect(s2.length).toBeGreaterThan(0);
    expect(scoreFor({ fights: [fight('cthulhu')] }, null)).toEqual([fight('cthulhu'), undefined]); // no theme: the score plays the first fight
    expect(scoreFor({ fights: [fight('cthulhu')] }, 'the_sunken_leviathan')).toEqual([null, BOSS_MUSIC.takeover]); // a theme: the score gives way over the takeover
  });

  it('begins at the entry and fades in over the takeover where the score sounds', async () => {
    const { engine, sources, gains } = fakeEngine();
    const themes = createBossThemes(engine);
    themes.update(input([fight('cthulhu')], { replacing: true }));
    await flush();
    themes.update(input([fight('cthulhu')], { replacing: true }));
    const plan = planOf('the_sunken_leviathan', { duration: 180, sampleRate: 48000, numberOfChannels: 2, getChannelData: () => new Float32Array(1) });
    expect(sources[0].start.mock.calls[0].slice(1)).toEqual([plan.entry, plan.loop.end - plan.entry]);
    const fade = gains.map((g) => g.gain!.setValueCurveAtTime.mock.calls.find((c) => c[2] === BOSS_MUSIC.takeover)).find(Boolean)!;
    expect(Math.max(...(fade[0] as Float32Array))).toBeCloseTo(plan.gain * BOSS_MUSIC.level, 5); // up to the track's own level
  });

  it('is chosen by track: a pair\'s partner joining or falling restarts nothing', async () => {
    const { engine, sources } = fakeEngine();
    const themes = createBossThemes(engine);
    themes.update(input([fight('keziah_mason')]));
    await flush();
    expect(themes.update(input([fight('keziah_mason')])).sounding).toBe('phrygian_waltz');
    const begun = sources.length;
    expect(themes.update(input([fight('keziah_mason'), fight('brown_jenkin')])).sounding).toBe('phrygian_waltz');
    expect(themes.update(input([fight('brown_jenkin')])).sounding).toBe('phrygian_waltz'); // Keziah has fallen: the theme stays
    expect(sources.length).toBe(begun);
    expect(themes.sounding).toBe('phrygian_waltz');
  });

  it('hands over to another theme while a fight goes on, in a crossfade of BOSS_MUSIC.handover seconds', async () => {
    const { engine, gains } = fakeEngine();
    const themes = createBossThemes(engine);
    themes.update(input([fight('great_ones')]));
    await flush();
    expect(themes.update(input([fight('great_ones')])).sounding).toBe('the_betrayal_of_kadath');
    expect(themes.update(input([fight('nyarlathotep')])).sounding, 'its file is not ready: the Great Ones\' goes on').toBe('the_betrayal_of_kadath');
    await flush();
    expect(themes.update(input([fight('nyarlathotep')])).sounding).toBe('the_crawling_chaos');
    const ramps = gains.flatMap((g) => g.gain!.setValueCurveAtTime.mock.calls.filter((c) => c[2] === BOSS_MUSIC.handover));
    expect(ramps.length, 'one going out, one coming in').toBe(2);
    expect(ramps.map((c) => c[1])).toEqual([10, 10]); // both begin as the handover does
  });

  it('moves, in the last phase, to the hot stretch at a bar line by a one-bar crossfade', async () => {
    const [id, boss] = hotTrack();
    const { engine, sources, ctx } = fakeEngine();
    const themes = createBossThemes(engine);
    themes.update(input([fight(boss)]));
    await flush();
    themes.update(input([fight(boss)]));
    const plan = planOf(id, { duration: 180, sampleRate: 48000, numberOfChannels: 2, getChannelData: () => new Float32Array(1) });
    const first = sources.length;
    const begun = sources[0].start.mock.calls[0][0] as number;
    ctx.currentTime = begun + 17.3;
    themes.update(input([fight(boss, 1, true)]));
    expect(sources.length, 'the hot stretch is scheduled, a pass or three').toBeGreaterThan(first);
    const hot = sources.slice(first).find((s) => s.start.mock.calls[0][1] === plan.hot!.start)!;
    const at = hot.start.mock.calls[0][0] as number;
    expect(at).toBeGreaterThan(ctx.currentTime);
    const into = plan.entry + (at - begun); // where the loop's newest pass has got to when the hot stretch begins
    const frac = ((((into - plan.grid) / plan.bar) % 1) + 1) % 1;
    expect(frac < 1e-3 || frac > 1 - 1e-3, `at ${at}: ${into} s into the file is not on a bar line (${frac} of a bar)`).toBe(true);
    expect(themes.update(input([fight(boss, 1, true)])).sounding).toBe(id);
    expect(sources.length, 'it moves once').toBe(sources.length);
  });

  it('lifts with the phase, ducks under a spoken line, holds low under a scene and comes up from a bar line, and fades out with the fight', async () => {
    const { engine, ctx, gains, sources } = fakeEngine();
    const themes = createBossThemes(engine);
    const f = fight('cthulhu');
    themes.update(input([f], { scene: true }));
    await flush();
    themes.update(input([f], { scene: true }));
    const lifts = (): number[] => gains.flatMap((g) => g.gain!.setTargetAtTime.mock.calls.map((c) => c[0] as number));
    expect(lifts()).not.toContain(duckLevel);
    expect(gains.some((g) => g.gain!.value === sceneLevel), 'begun under the scene').toBe(true);
    themes.update(input([fight('cthulhu', 2)], { scene: true }));
    expect(lifts()).toContain(liftOf(2).level);
    themes.duck(2);
    ctx.currentTime += 0.1;
    themes.update(input([fight('cthulhu', 2)], { scene: true }));
    expect(lifts()).toContain(duckLevel);
    ctx.currentTime += 3; // the line is over
    themes.update(input([fight('cthulhu', 2)], { scene: false })); // and so is the scene: the theme rises, from a bar line
    expect(lifts()).toContain(1);
    const sceneUp = gains.flatMap((g) => g.gain!.setTargetAtTime.mock.calls.filter((c) => c[0] === 1 && (c[1] as number) >= ctx.currentTime));
    expect(sceneUp.length, 'the rise is scheduled ahead, at a bar line').toBeGreaterThan(0);
    // the fight ends: it fades over BOSS_MUSIC.fadeOut, and is let go after
    const stopped = sources.filter((s) => s.stop.mock.calls.length).length;
    expect(themes.update(input([])).sounding).toBeNull();
    const out = gains.flatMap((g) => g.gain!.setValueCurveAtTime.mock.calls.filter((c) => c[2] === BOSS_MUSIC.fadeOut));
    expect(out.length).toBe(1);
    expect(sources.filter((s) => s.stop.mock.calls.length).length, 'still fading').toBe(stopped);
    ctx.currentTime += BOSS_MUSIC.fadeOut + 0.5;
    themes.update(input([]));
    expect(sources.filter((s) => s.stop.mock.calls.length).length, 'let go').toBeGreaterThan(stopped);
  });

  it('has a theme ready for the horror nearest unmet, two held at most', async () => {
    const { engine } = fakeEngine();
    const themes = createBossThemes(engine);
    themes.update(input([], { warm: 'the_crawling_chaos' }));
    await flush();
    expect(asked.some((u) => u.includes('the-crawling-chaos'))).toBe(true);
    themes.update(input([fight('cthulhu')], { warm: 'the_crawling_chaos' }));
    await flush();
    themes.update(input([fight('cthulhu')], { warm: 'the_blind_idiot_god' }));
    await flush();
    themes.update(input([fight('cthulhu')], { warm: 'the_blind_idiot_god' }));
    expect(themes.sounding).toBe('the_sunken_leviathan');
  });

  it('is silent without WebAudio or a running context', () => {
    const none = createBossThemes({ ctx: null, score: null } as unknown as AudioEngine);
    expect(none.update(input([fight('cthulhu')])).sounding).toBeNull();
    none.duck(2);
    const { engine, ctx } = fakeEngine();
    ctx.state = 'suspended';
    expect(createBossThemes(engine).update(input([fight('cthulhu')])).sounding).toBeNull();
  });
});
