/**
 * A horror's arrival (round 60: asked to keep the bosses from being seen from afar, and that their spawn be an entrance): a boss of the
 * open world is not drawn until it is roused, as the investigator steps into its ring (systems/components.ts `isUnroused`), and then
 * comes into view over a few seconds, the great bodies of earth and sea coming up out of the ground as they do. The picture reads
 * the clock of the view it is drawn by (a scene may stand the simulation still), and the scene of its arrival (data/cutscenesBoss.ts,
 * ui/cinemaDirector.ts) opens on it as it comes. Pure: no Three.js.
 */

import { ARRIVAL } from '../data/bossTuning';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Seconds a horror `height` metres tall takes to come into view: longer for the greater. */
export const arrivalSeconds = (height: number): number => clamp(ARRIVAL.least + ARRIVAL.perMetre * height, ARRIVAL.least, ARRIVAL.most);

/** How far it has come into view (0..1, eased) `since` seconds after it was roused. */
export function arrivedBy(since: number, height: number): number {
  const t = clamp(since / arrivalSeconds(height), 0, 1);
  return t * t * (3 - 2 * t);
}

/** How deep in the ground its body still is (a share of the sink, 0..1) when it has come `appear` of the way: nothing if it does not rise. */
export const risenFrom = (appear: number, rises: boolean): number => (rises ? ARRIVAL.rise * (1 - appear) ** 2 : 0);

/** Whether a body is of earth or sea, and comes up out of the ground: a lathe-turned colossus or a mound (render/assemblies.ts). */
export const risesOut = (body: string | undefined): boolean => body === 'lathe' || body === 'mound';

/** What a horror's view needs of its arrival: how far it has come, and how low its body still lies. */
export interface Arrival {
  appear: number;
  sink: number;
}

/** The arrivals the views keep: which bosses have been seen unroused, and the time each was roused (render seconds). */
export function createArrivals(): { of(id: number, unroused: boolean, time: number, height: number, rises: boolean): Arrival; forget(live: ReadonlySet<number>): void } {
  const veiled = new Set<number>();
  const roused = new Map<number, number>();
  return {
    of(id, unroused, time, height, rises) {
      if (unroused) {
        veiled.add(id);
        roused.delete(id);
        return { appear: 0, sink: 0 };
      }
      if (!veiled.has(id)) return { appear: 1, sink: 0 };
      if (!roused.has(id)) roused.set(id, time);
      const appear = arrivedBy(time - roused.get(id)!, height);
      if (appear >= 1) {
        veiled.delete(id);
        roused.delete(id);
        return { appear: 1, sink: 0 };
      }
      return { appear, sink: risenFrom(appear, rises) };
    },
    forget(live) {
      for (const id of veiled) if (!live.has(id)) [veiled.delete(id), roused.delete(id)];
    },
  };
}
