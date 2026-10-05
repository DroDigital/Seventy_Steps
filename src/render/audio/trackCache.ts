/**
 * The recorded music's cache (round 44; shared by the realms' tracks, realmMusic.ts, and the boss
 * themes, bossThemes.ts): a file is fetched and decoded when first wanted, made into whatever the
 * player needs of it, and a few are kept (the one sounding and the one coming), the rest let go. A
 * file that cannot be had is passed over and asked for again after `retry` seconds, not every frame.
 * The clock is the caller's (seconds). Without WebAudio nothing loads.
 */

import type { AudioEngine } from './engine';

export interface TrackCache<K extends string, V> {
  /** Fetches and decodes `key` unless it is held, coming, or waiting out a failure; resolves to it, or null. */
  load(key: K): Promise<V | null>;
  /** The decoded track, if it is ready now. */
  get(key: K): V | null;
  /** Whether `key` failed and is waiting to be asked for again. */
  waiting(key: K): boolean;
  /** Marks `key` failed now (the player could not start it): it is not asked for again until the wait runs out. */
  fail(key: K): void;
  /** Sets the clock. */
  tick(seconds: number): void;
  /** Lets go of what is held beyond `keep`, keeping these first (in this order). */
  trim(spare: readonly (K | null | undefined)[]): void;
  /** Keys held or coming (for the tests). */
  readonly held: readonly K[];
}

export interface TrackCacheOptions<K extends string, V> {
  url(key: K): string;
  make(buffer: AudioBuffer, key: K): V; // what the player needs of a decoded file (its analysis, its plan)
  keep: number;
  retry: number; // seconds
  label: string; // for the console
}

export function createTrackCache<K extends string, V>(e: AudioEngine, o: TrackCacheOptions<K, V>): TrackCache<K, V> {
  const pending = new Map<K, Promise<V | null>>();
  const ready = new Map<K, V>();
  const failed = new Map<K, number>(); // the clock reading at which it may be asked for again
  let clock = 0;

  const fetchTrack = async (ctx: AudioContext, key: K): Promise<V | null> => {
    try {
      const res = await fetch(o.url(key));
      if (!res.ok) throw new Error(String(res.status));
      const value = o.make(await ctx.decodeAudioData(await res.arrayBuffer()), key);
      ready.set(key, value);
      return value;
    } catch (err) {
      failed.set(key, clock + o.retry);
      pending.delete(key); // a later ask, after the wait, tries again
      console.warn(`${o.label}: ${key} could not be loaded`, err);
      return null;
    }
  };

  return {
    load(key) {
      const have = pending.get(key);
      const ctx = e.ctx;
      if (have || !ctx || (failed.get(key) ?? 0) > clock) return have ?? Promise.resolve(null);
      const p = fetchTrack(ctx, key);
      pending.set(key, p);
      return p;
    },
    get: (key) => ready.get(key) ?? null,
    waiting: (key) => (failed.get(key) ?? 0) > clock,
    fail(key) {
      failed.set(key, clock + o.retry);
    },
    tick(seconds) {
      clock = seconds;
    },
    trim(spare) {
      const keep = [...new Set(spare.filter((k): k is K => !!k))].slice(0, o.keep);
      for (const key of [...pending.keys()]) {
        if (pending.size <= o.keep) break;
        if (!keep.includes(key)) {
          pending.delete(key);
          ready.delete(key);
        }
      }
    },
    get held() {
      return [...pending.keys()];
    },
  };
}
