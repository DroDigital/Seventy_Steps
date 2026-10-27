/**
 * How much of its blow a creature in a crowd draws (round 89; data/foeTuning.ts `FOE_FX.crowd`). A pack of twelve is not twelve times the
 * eeriness of a pack of four: the creatures nearest the investigator draw all of theirs (`full`), the next few only their marks, the rest only
 * what is within a short range, and nothing farther than each tier's range; and the whole crowd shares one rolling budget of particles, of
 * which what is optional (specks, trails, tells, motes) may spend only a share, and the marks-only tier a share too, so the nearest foes'
 * marks are never crowded out by the farthest foes'. Pure: no Three.js, no game; `foeFx.ts` asks it before it draws.
 */

import { FOE_FX } from '../data/fxTuning';

export type Tier = 'full' | 'marks' | 'none';
/** What is asked for: a mark of the blow itself, or one of the optional things. */
export type Want = 'mark' | 'tell' | 'speck' | 'trail' | 'mote';

export interface Foe {
  id: number;
  d: number; // metres from the investigator
}

type Rules = typeof FOE_FX.crowd;

/** The tier of each foe: ranked by distance (ties by id), the nearest `full` of them full if within that range, the next `marks` marks-only if within theirs, the rest marks-only only within `range.rest`. */
export function tiersOf(foes: readonly Foe[], rules: Rules = FOE_FX.crowd): Map<number, Tier> {
  const sorted = [...foes].sort((a, b) => a.d - b.d || a.id - b.id);
  const tiers = new Map<number, Tier>();
  sorted.forEach((f, i) => {
    tiers.set(f.id, i < rules.full && f.d <= rules.range.full ? 'full' : i < rules.full + rules.marks && f.d <= rules.range.marks ? 'marks' : f.d <= rules.range.rest ? 'marks' : 'none');
  });
  return tiers;
}

export interface Crowd {
  /** Ranks the foes afresh. */
  rank(foes: readonly Foe[]): void;
  /** A foe's tier (`marks` for one not ranked: it has only just come). */
  tierOf(id: number): Tier;
  /** How many of `n` particles of `want` foe `id` may draw at time `now` (seconds): 0..n, and what is granted is spent from the rolling budget. */
  ask(id: number, want: Want, n: number, now: number): number;
  /** Particles spent in the last `window` seconds. */
  spent(now: number): number;
}

export function createCrowd(rules: Rules = FOE_FX.crowd): Crowd {
  let tiers = new Map<number, Tier>();
  const log: { t: number; n: number }[] = [];
  const prune = (now: number): void => {
    if (log.length && now < log[log.length - 1]!.t - 1) log.length = 0; // (the clock has gone back: a new game)
    while (log.length && log[0]!.t <= now - rules.window) log.shift();
  };
  const sum = (): number => log.reduce((s, e) => s + e.n, 0);
  return {
    rank: (foes) => void (tiers = tiersOf(foes, rules)),
    tierOf: (id) => tiers.get(id) ?? 'marks',
    spent(now) {
      prune(now);
      return sum();
    },
    ask(id, want, n, now) {
      const tier = tiers.get(id) ?? 'marks';
      if (n <= 0 || tier === 'none' || (want !== 'mark' && tier !== 'full')) return 0;
      prune(now);
      const share = want !== 'mark' ? rules.optional : tier === 'full' ? 1 : rules.markShare;
      const got = Math.max(0, Math.min(n, Math.floor(rules.budget * share - sum())));
      if (got) log.push({ t: now, n: got });
      return got;
    },
  };
}
