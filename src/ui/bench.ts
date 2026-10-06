/**
 * The benchmark (round 46; `?bench`, docs/PERFORMANCE.md): the camera is carried to the busiest places of the dream, one after
 * another, turning slowly, and the frames of each are measured: the town's lamps, the moor, the reef's water, the ice city, a
 * dungeon, the sunken city's colossus, the cities of Yuggoth and the court beyond. The result is shown, printed and kept
 * (`window.__bench`) with a verdict in plain words. Called once a picture, from where the picture is drawn.
 */

import type { FrameStats } from '../core/frameStats';
import { travel } from '../systems/checkpoints';
import type { Game } from '../systems/components';

export const SPOTS: readonly { sign: string; what: string }[] = [
  { sign: 'hub_quad', what: 'town and lamps' },
  { sign: 'arkham_heath', what: 'moor and weather' },
  { sign: 'innsmouth_reef', what: 'sea and reflection' },
  { sign: 'mountains_city', what: 'ice city, dungeon' },
  { sign: 'dream_zin', what: 'vaults, torches' },
  { sign: 'rlyeh_door', what: 'the sunken city, a colossus' },
  { sign: 'yuggoth_cities', what: 'fungus cities' },
  { sign: 'beyond_court', what: 'the court beyond' },
];
const WARM = 5; // seconds after arriving before measuring
const DWELL = 8; // seconds measured at each

export interface BenchRow {
  what: string;
  fps: number;
  low: number;
  worst: number;
}

/** In plain words: what the numbers mean for a player. */
export function verdict(rows: readonly BenchRow[]): string {
  const fps = Math.min(...rows.map((r) => r.fps));
  const low = Math.min(...rows.map((r) => r.low));
  if (fps >= 55 && low >= 40) return 'Smooth everywhere: 60 fps held, no stutter.';
  if (fps >= 40 && low >= 25) return 'Playable: dips in the busiest places. Lower Shadows or Volumetric fog in Settings › Display.';
  return 'Too slow here. Lower Resolution, and turn Shadows and Volumetric fog off, in Settings › Display.';
}

export interface Bench {
  tick(now: number): void;
  readonly running: boolean;
}

export function startBench(g: Game, stats: FrameStats, show: (text: string) => void): Bench {
  const rows: BenchRow[] = [];
  let at = -1;
  let from = 0;
  const go = (now: number): void => {
    at++;
    from = now;
    stats.clear();
    if (at < SPOTS.length) {
      g.overworld?.discovered.add(SPOTS[at].sign); // (travel goes only to a sign found)
      travel(g, SPOTS[at].sign);
    }
  };
  go(performance.now());
  return {
    get running() {
      return at < SPOTS.length;
    },
    tick(now) {
      if (at >= SPOTS.length) return;
      const t = (now - from) / 1000;
      g.camera.yaw += 0.006; // a slow turn about the place
      if (t < WARM) return stats.clear();
      show(`BENCHMARK ${at + 1}/${SPOTS.length} · ${SPOTS[at].what} · ${Math.max(0, DWELL - (t - WARM)).toFixed(0)} s`);
      if (t < WARM + DWELL) return;
      const s = stats.summary();
      rows.push({ what: SPOTS[at].what, fps: Math.round(s.fps), low: Math.round(s.low), worst: Math.round(s.worst) });
      go(now);
      if (at < SPOTS.length) return;
      const text = `${rows.map((r) => `${r.what.padEnd(30)} ${String(r.fps).padStart(3)} fps · low ${String(r.low).padStart(3)} · worst ${r.worst} ms`).join('\n')}\n\n${verdict(rows)}`;
      show(text);
      console.log(`benchmark\n${text}`);
      (window as unknown as { __bench: unknown }).__bench = { rows, verdict: verdict(rows) };
    },
  };
}
