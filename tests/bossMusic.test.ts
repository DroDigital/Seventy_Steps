// The boss themes (round 44): the table of tracks and who they score, the files and credits that agree with
// it, the offline map, a theme's plan, the bar line a move waits for, and the loop that begins at an entry.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { BOSS_MUSIC, BOSS_TRACKS, BOSS_TRACK_IDS, OVERRIDES, bossFile, bossTrackOf } from '../src/data/bossMusic';
import { BOSS_MAP } from '../src/data/bossMusicMap';
import { CREDITS } from '../src/data/credits';
import { ENTITIES, getEntity, variantOf } from '../src/data/registry';
import { barLineAfter, comeIn, duckLevel, liftOf, planOf, sceneLevel, type Samples } from '../src/render/audio/bossPlan';
import { bossScene } from '../src/render/audio/bossScene';
import { analyse, dB } from '../src/render/audio/loudness';
import { createRealmLoop, passTimes } from '../src/render/audio/realmLoop';
import type { Game } from '../src/systems/components';
import { bossGame, engage } from './bossHelpers';

/** Every roster entry, eldritch variant and boss variant that fights by a boss script (as tests/bossScripts.test.ts has them). */
const SCRIPTED = new Set(ENTITIES.flatMap((d) => (['eldritch', 'boss', undefined] as const).filter((v) => (v ? variantOf(d, v) : d)?.bossScript).map(() => d.id)));
/** Scripted horrors that fight to the procedural score for want of a theme. */
const PROCEDURAL: readonly string[] = [];

const RATE = 4000;
/** Samples: a tone of `amp`, with `fadeIn` seconds rising and `fadeOut` falling around `body` seconds. */
function samples(fadeIn: number, body: number, fadeOut: number, amp: number): Samples {
  const n = Math.round((fadeIn + body + fadeOut) * RATE);
  const ch = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    ch[i] = amp * (t < fadeIn ? t / fadeIn : t > fadeIn + body ? Math.max(0, 1 - (t - fadeIn - body) / fadeOut) : 1) * Math.sin(2 * Math.PI * 220 * t);
  }
  return { duration: n / RATE, sampleRate: RATE, numberOfChannels: 2, getChannelData: () => ch };
}

describe('the boss themes (round 44)', () => {
  it('has a theme for every scripted horror, shared by a pair, and every id in it is a creature', () => {
    expect(BOSS_TRACK_IDS.length).toBe(48);
    for (const id of SCRIPTED) if (!PROCEDURAL.includes(id)) expect(bossTrackOf(id), `${id} has no theme`).not.toBeNull();
    for (const id of PROCEDURAL) expect(bossTrackOf(id), `${id} is listed as procedural but has a theme`).toBeNull();
    expect(bossTrackOf('keziah_mason')).toBe(bossTrackOf('brown_jenkin'));
    expect(bossTrackOf('father_dagon')).toBe(bossTrackOf('mother_hydra'));
    expect(bossTrackOf('nug')).toBe(bossTrackOf('yeb'));
    expect(bossTrackOf('great_ones')).not.toBe(bossTrackOf('nyarlathotep'));
    expect(bossTrackOf('someone_else')).toBeNull();
    const seen = new Set<string>();
    for (const id of BOSS_TRACK_IDS) {
      expect(BOSS_TRACKS[id].title.length, id).toBeGreaterThan(3);
      expect(BOSS_TRACKS[id].bosses.length, id).toBeGreaterThan(0);
      for (const b of BOSS_TRACKS[id].bosses) {
        expect(getEntity(b), `${b} is not a creature`).toBeDefined();
        expect(seen.has(b), `${b} is scored twice`).toBe(false);
        seen.add(b);
      }
    }
    expect(new Set(BOSS_TRACK_IDS.map(bossFile)).size).toBe(48);
  });

  it('every file in public/music/bosses is a track, every track has its file (once they are in), and CREDITS names each', () => {
    const dir = 'public/music/bosses';
    const credits = readFileSync('public/music/CREDITS.md', 'utf8');
    for (const id of BOSS_TRACK_IDS) {
      const file = bossFile(id).split('/').pop()!;
      expect(credits, `${file} is not in public/music/CREDITS.md`).toContain(file);
      expect(credits, `${BOSS_TRACKS[id].title} is not in public/music/CREDITS.md`).toContain(BOSS_TRACKS[id].title);
    }
    expect(credits).toMatch(/Suno/);
    expect(CREDITS.find((b) => b.heading === 'TOOLS')!.lines.join(' ')).toMatch(/boss themes/);
    if (!existsSync(dir)) return; // the recordings are not in the repository yet
    const files = new Set(readdirSync(dir).filter((f) => f.endsWith('.mp3')));
    const wanted = new Set(BOSS_TRACK_IDS.map((id) => bossFile(id).split('/').pop()!));
    for (const f of files) expect(wanted.has(f), `${f} is not a track`).toBe(true);
    for (const f of wanted) expect(files.has(f), `${f} is missing`).toBe(true);
  });

  it('has a map as complete and sane as the tool makes it: entry, loop, hot stretch, gain', () => {
    const grid = BOSS_TRACK_IDS.filter((id) => BOSS_MAP[id]?.loop);
    expect(Object.keys(BOSS_MAP).sort()).toEqual([...BOSS_TRACK_IDS].sort());
    expect(grid.length, 'a loop cut on the beat for most').toBeGreaterThanOrEqual(40);
    for (const id of BOSS_TRACK_IDS) {
      const m = BOSS_MAP[id]!;
      expect(m.dur, id).toBeGreaterThan(100);
      expect(m.entry, id).toBeGreaterThanOrEqual(0);
      expect(m.entry, id).toBeLessThan(m.dur / 2);
      expect(m.lead, `${id}: full drive within about ten seconds of the entry`).toBeLessThanOrEqual(10);
      expect(m.gain, id).toBeGreaterThan(0.1);
      expect(dB(m.gain) + m.rms, `${id}: body at the target`).toBeLessThanOrEqual(BOSS_MUSIC.target + 0.1);
      expect(m.gain * 10 ** (m.peak / 20), `${id}: no peak over the ceiling`).toBeLessThanOrEqual(BOSS_MUSIC.ceiling + 1e-3);
      if (!m.loop) {
        expect(m.hot, `${id}: a hot stretch needs a loop`).toBeNull();
        continue;
      }
      const [a, b, xf] = m.loop;
      expect(b - a, `${id}: a loop of at least 25 s`).toBeGreaterThanOrEqual(25);
      expect(a, `${id}: clear of the intro`).toBeGreaterThanOrEqual(m.entry);
      expect(b, id).toBeLessThanOrEqual(m.dur);
      expect([3, 4], id).toContain(m.beats);
      expect(m.bpm, id).toBeGreaterThan(55);
      expect(m.bpm, id).toBeLessThan(190);
      expect(m.bar, id).toBeGreaterThan(1);
      expect(xf, `${id}: a crossfade of at most 3 s`).toBeLessThanOrEqual(3 + 1e-6);
      expect(xf, id).toBeLessThanOrEqual(2 * m.bar + 1e-3);
      const bars = (b - a) / m.bar;
      expect(Math.abs(bars - Math.round(bars)), `${id}: the loop is whole bars`).toBeLessThan(0.02);
      const beats = xf / (m.bar / m.beats);
      expect(Math.abs(beats - Math.round(beats)), `${id}: the crossfade is whole beats`).toBeLessThan(0.02);
      expect(m.seam[0], `${id}: the seam's level step`).toBeLessThanOrEqual(1.55);
      expect(m.seam[1], `${id}: the seam's flux jump`).toBeLessThanOrEqual(1.55);
      if (m.hot) {
        expect(m.hot[1] - m.hot[0], `${id}: a hot stretch of at least 12 s`).toBeGreaterThanOrEqual(12);
        expect(m.hot[0], `${id}: after the entry`).toBeGreaterThanOrEqual(m.entry);
        expect(m.hot[1], id).toBeLessThanOrEqual(m.dur);
      }
    }
    for (const id of Object.keys(OVERRIDES)) expect(BOSS_TRACK_IDS as readonly string[], id).toContain(id);
  });

  it('thins the tracks the author named (Azathoth, the Haunter, the Ancient Ones) instead of pumping them to the others\' body', () => {
    for (const id of ['the_blind_idiot_god', 'bells_in_the_dark', 'the_ancient_ones'] as const) expect(OVERRIDES[id]?.trim ?? 0, id).toBeLessThan(0);
  });

  it('plans a theme from the map, and reads one the map has not heard as it loads, to the same target', () => {
    const boom = { duration: 180, sampleRate: 48000, numberOfChannels: 2, getChannelData: () => { throw new Error('the map has it: no need to read the samples'); } } as Samples;
    const id = BOSS_TRACK_IDS.find((i) => BOSS_MAP[i]?.loop && BOSS_MAP[i]?.hot)!;
    const [plan, map] = [planOf(id, boom), BOSS_MAP[id]!];
    expect([plan.entry, plan.loop.start, plan.loop.end, plan.loop.overlap]).toEqual([map.entry, ...map.loop!]);
    expect(plan.hot).toEqual({ start: map.hot![0], end: map.hot![1], overlap: map.hot![2] });
    expect(plan.gain).toBeCloseTo(map.gain * 10 ** ((OVERRIDES[id]?.trim ?? 0) / 20), 6);
    expect([plan.bar, plan.grid, plan.mapped]).toEqual([map.bar, map.loop![0], true]);
    // a track with no entry in the map is analysed as it loads
    const s = samples(3, 40, 5, 0.05);
    const read = planOf('a_new_take' as keyof typeof BOSS_TRACKS, s);
    expect(read.mapped).toBe(false);
    expect(read.hot).toBeNull();
    expect(read.bar).toBe(BOSS_MUSIC.bar);
    expect(read.entry).toBe(read.loop.start);
    const loud = Array.from({ length: 2 }, () => s.getChannelData(0).map((x) => x * read.gain));
    expect(dB(analyse(loud, RATE, BOSS_MUSIC).rms)).toBeCloseTo(BOSS_MUSIC.target, 0);
  });

  describe('an override beats the map', () => {
    afterEach(() => {
      vi.doUnmock('../src/data/bossMusic');
      vi.resetModules();
    });
    it('mends the entry, the loop, the hot stretch and the level', async () => {
      vi.resetModules();
      const id = 'alien_boss_battle';
      vi.doMock('../src/data/bossMusic', async (orig) => ({ ...(await orig<typeof import('../src/data/bossMusic')>()), OVERRIDES: { [id]: { entry: 12, loop: [30, 90], hot: [100, 120, 2], trim: -6 } } }));
      const { planOf: planned } = await import('../src/render/audio/bossPlan');
      const base = BOSS_MAP[id]!;
      const p = planned(id, { duration: 180, sampleRate: 48000, numberOfChannels: 2, getChannelData: () => new Float32Array(1) });
      expect([p.entry, p.loop.start, p.loop.end]).toEqual([12, 30, 90]);
      expect(p.loop.overlap).toBeCloseTo(Math.min(2 * base.bar, 3), 6); // no crossfade given: the map's bar sets it
      expect(p.hot).toEqual({ start: 100, end: 120, overlap: 2 });
      expect(p.gain).toBeCloseTo(base.gain * 10 ** (-6 / 20), 6);
    });
  });

  it('waits for a bar line: the next one of the newest pass, followed into the pass that takes over', () => {
    const bar = 2;
    expect(barLineAfter((t) => 10 + t, 3.3, bar, 0)).toBeCloseTo(4, 6); // 13.3 is 0.7 s short of 14
    expect(barLineAfter((t) => 10 + t, 4, bar, 0)).toBeCloseTo(4, 6); // already on one
    expect(barLineAfter(() => null, 5, bar, 0)).toBe(5); // not begun
    // the pass gives way at t = 4 to one that began at 31 (a bar line is at 30 + 2k): the wait follows it
    const pos = (t: number): number => (t < 4 ? 20 + t : 31 + (t - 4));
    const at = barLineAfter(pos, 3.5, bar, 30); // 23.5 → 24 at t = 4, but there the next pass is at 31: its next bar line is 32, at t = 5
    expect(((pos(at) - 30) / bar) % 1).toBeCloseTo(0, 6);
    expect(at).toBeGreaterThanOrEqual(4);
  });

  it('lifts a theme by a phase, no more than the steps allow, and hears a line or a scene as a dip', () => {
    expect(liftOf(0)).toEqual({ level: 1, bright: 0 });
    expect(dB(liftOf(1).level)).toBeCloseTo(BOSS_MUSIC.lift.level, 5);
    expect(liftOf(1).bright).toBe(BOSS_MUSIC.lift.bright);
    expect(liftOf(9)).toEqual(liftOf(BOSS_MUSIC.lift.steps));
    expect(BOSS_MUSIC.lift.level * BOSS_MUSIC.lift.steps, 'a couple of dB at most').toBeLessThanOrEqual(3);
    expect(BOSS_MUSIC.lift.bright * BOSS_MUSIC.lift.steps).toBeLessThanOrEqual(3);
    expect(duckLevel).toBeLessThan(1);
    expect(sceneLevel).toBeLessThan(duckLevel);
    expect(BOSS_MUSIC.duck.attack, 'quick in, slow out').toBeLessThan(BOSS_MUSIC.duck.release);
  });

  it('comes in over the takeover where the score sounds, quickly where the entry drives, else over the fight\'s fade', () => {
    expect(comeIn({ lead: 9 }, true)).toBe(BOSS_MUSIC.takeover);
    expect(comeIn({ lead: 0.5 }, false)).toBe(BOSS_MUSIC.fadeQuick);
    expect(comeIn({ lead: 8 }, false)).toBe(BOSS_MUSIC.fadeIn);
  });

  it('begins the first pass at the entry, then loops by the body: each pass fades in as the last fades out', () => {
    const calls: { kind: string; args: number[] }[] = [];
    const node = (name: string) => ({
      connect: (to: unknown) => to,
      disconnect: () => undefined,
      start: (...args: number[]) => calls.push({ kind: `${name}.start`, args }),
      stop: () => undefined,
      gain: { setValueAtTime: (v: number, t: number) => calls.push({ kind: 'set', args: [v, t] }), setValueCurveAtTime: (_c: unknown, t: number, d: number) => calls.push({ kind: 'curve', args: [t, d] }) },
    });
    const ctx = { currentTime: 0, createBufferSource: () => node('src'), createGain: () => node('gain') } as unknown as BaseAudioContext;
    const region = { start: 50, end: 110, overlap: 2 };
    const loop = createRealmLoop(ctx, node('out') as unknown as AudioNode, { duration: 120 } as AudioBuffer, region, 8);
    loop.begin(1);
    const starts = calls.filter((c) => c.kind === 'src.start').map((c) => c.args);
    expect(starts.map((s) => s[0])).toEqual(passTimes(1, region, 3, 8));
    expect(starts.map((s) => s.slice(1))).toEqual([[8, 102], [50, 60], [50, 60]]); // from the entry, for the rest of the file's body; then from the body's start
    const curves = calls.filter((c) => c.kind === 'curve').map((c) => c.args);
    expect(curves[0]).toEqual([1 + 102 - 2, 2]); // pass 0 fades out over its last two seconds
    expect(curves[1]).toEqual([starts[1][0], 2]); // pass 1 fades in exactly as pass 0 gives way
    expect(starts[1][0]).toBeCloseTo(1 + 100, 6);
    expect(starts[2][0]).toBeCloseTo(starts[1][0] + 58, 6);
    // where in the file the newest pass has got to
    expect(loop.position(0.5)).toBeNull();
    expect(loop.position(1 + 10)).toBeCloseTo(8 + 10, 6);
    expect(loop.position(starts[1][0] + 5)).toBeCloseTo(55, 6); // the second pass is the newest once it has begun
    expect(loop.position(starts[2][0] + 5)).toBeCloseTo(55, 6);
  });

  it('reads the fights engaged, with their phase and whether it is the last, and the horror nearest unmet to warm', () => {
    const b = bossGame('cthulhu');
    expect(bossScene(b.g).fights).toEqual([]);
    engage(b);
    expect(bossScene(b.g).fights).toEqual([{ id: 'cthulhu', phase: 0, last: false }]);
    b.fight.phase = b.fight.script.phases.length - 1;
    expect(bossScene(b.g).fights[0]).toMatchObject({ phase: b.fight.script.phases.length - 1, last: true });
    // the nearest unengaged boss within BOSS_MUSIC.warm metres of its ring (a hand-made world: the arena has no open world to walk)
    const fight = (id: string, x: number, engaged = false) => ({ id, engaged, script: { unseen: false, phases: [{}, {}] }, arena: { x, z: 0, radius: 20 }, phase: 0 });
    const fights = new Map([[1, fight('hastur', 400)], [2, fight('cthulhu', 100)], [3, fight('yig', 150)], [4, fight('azathoth', 10, true)]]);
    const g = { overworld: {}, player: { id: 0 }, ecs: { c: { fight: fights, transform: new Map([[0, { pos: { x: 0, y: 0, z: 0 } }]]), dead: new Map(), health: new Map([[1, { hp: 1 }], [2, { hp: 1 }], [3, { hp: 1 }], [4, { hp: 1 }]]) } } } as unknown as Game;
    expect(bossScene(g).warm).toBe(bossTrackOf('cthulhu')); // 80 m from the ring: the nearest in reach (hastur is 380; yig 130)
    g.ecs.c.dead.set(2, true);
    expect(bossScene(g).warm).toBe(bossTrackOf('yig'));
    g.ecs.c.dead.set(3, true);
    expect(bossScene(g).warm).toBeNull(); // hastur is beyond BOSS_MUSIC.warm
  });
});
