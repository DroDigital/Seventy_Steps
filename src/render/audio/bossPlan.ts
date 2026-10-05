/**
 * What a boss theme needs before it can sound (round 44; data/bossMusic.ts): where it begins, the two
 * ends of its loop and of its hot stretch (each with the crossfade between passes), its gain and the
 * bar the music keeps. They come from the offline map (data/bossMusicMap.ts, tools/boss_music.py),
 * mended by data/bossMusic.ts OVERRIDES; a track the map has not heard is read as it loads, the realms'
 * way (loudness.ts). Also the pure arithmetic of a theme: the next bar line of a loop in audio time
 * (a move to the hot stretch, and the first full bar after a cutscene, wait for it), the lift a phase
 * gives, and the level under a spoken line. No WebAudio.
 */

import { BOSS_MUSIC, OVERRIDES, type BossTrackId } from '../../data/bossMusic';
import { BOSS_MAP } from '../../data/bossMusicMap';
import { analyse, fromDB, loopRegion, type Region } from './loudness';

/** A fight to score: the boss's roster id, the phase it has reached, and whether that is its last. */
export interface Scored {
  id: string;
  phase: number;
  last: boolean;
}

export interface BossPlan {
  entry: number; // seconds into the file where playing begins
  loop: Region;
  hot: Region | null; // the last phase's stretch, looped on its own ends
  gain: number; // × the track, to bring its body to BOSS_MUSIC.target
  hotGain: number; // × the gain, for the hot stretch, louder by design: its own trim to the ceiling
  bar: number; // seconds a bar lasts (BOSS_MUSIC.bar where there is no pulse)
  grid: number; // a bar line's place in the file: bar lines fall at grid + k × bar
  lead: number; // seconds from the entry to full drive
  mapped: boolean; // from the map, not read as it loaded
}

/** The decoded samples a plan is made from (an AudioBuffer, or a test's stand-in). */
export interface Samples {
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

const crossfade = (r: readonly [number, number, number?], bar: number): number => r[2] ?? Math.min(2 * bar, 3);

/** A theme's plan: the map's (or, with no map, the analysis of the samples), mended by its override. */
export function planOf(id: BossTrackId, samples: Samples): BossPlan {
  const [map, over] = [BOSS_MAP[id], OVERRIDES[id]];
  const channels = (): Float32Array[] => Array.from({ length: samples.numberOfChannels }, (_, c) => samples.getChannelData(c));
  const analysed = !map || !map.loop ? analyse(channels(), samples.sampleRate, BOSS_MUSIC) : null; // the realms' way, where the map has no loop (or no map)
  const bar = map?.bar || BOSS_MUSIC.bar;
  const region = analysed ? loopRegion(analysed, samples.duration) : null;
  const loop: Region = over?.loop ? { start: over.loop[0], end: over.loop[1], overlap: crossfade(over.loop, bar) } : map?.loop ? { start: map.loop[0], end: map.loop[1], overlap: map.loop[2] } : region!;
  const hot = over?.hot === null ? null : over?.hot ? { start: over.hot[0], end: over.hot[1], overlap: crossfade(over.hot, bar) } : map?.hot ? { start: map.hot[0], end: map.hot[1], overlap: map.hot[2] } : null;
  const gain = (map?.gain ?? analysed?.gain ?? 1) * fromDB(over?.trim ?? 0);
  return { entry: over?.entry ?? map?.entry ?? loop.start, loop, hot, gain, hotGain: map?.hotGain ?? 1, bar, grid: loop.start, lead: map?.lead ?? 0, mapped: !!map };
}

/**
 * The audio time of the first bar line at or after `t`, in the newest pass of a loop (`position`: where in
 * the buffer it has reached, null before it began). A pass that gives way to the next within the wait is
 * followed into it, for the bar lines of the next fall where its own do.
 */
export function barLineAfter(position: (t: number) => number | null, t: number, bar: number, grid: number): number {
  let at = t;
  for (let i = 0; i < 4; i++) {
    const p = position(at);
    if (p === null) return at;
    const frac = (((p - grid) / bar) % 1 + 1) % 1;
    const wait = frac < 1e-4 || frac > 1 - 1e-4 ? 0 : (1 - frac) * bar;
    if (wait === 0) return at;
    at += wait;
  }
  return at;
}

/** The share of the level a phase adds: `BOSS_MUSIC.lift.level` dB each, up to `steps` phases. */
export const liftOf = (phase: number): { level: number; bright: number } => {
  const { lift } = BOSS_MUSIC;
  const n = Math.min(Math.max(0, phase), lift.steps);
  return { level: fromDB(lift.level * n), bright: lift.bright * n };
};

/** What a horror's spoken line, and the first arrival scene, take off a theme (linear). */
export const duckLevel = fromDB(BOSS_MUSIC.duck.db);
export const sceneLevel = fromDB(BOSS_MUSIC.scene.db);

/** How long a theme takes to come in: with the procedural score still sounding, the takeover; where the entry already drives, a quick one. */
export const comeIn = (plan: Pick<BossPlan, 'lead'>, replacing: boolean): number => (replacing ? BOSS_MUSIC.takeover : plan.lead <= BOSS_MUSIC.quickLead ? BOSS_MUSIC.fadeQuick : BOSS_MUSIC.fadeIn);

