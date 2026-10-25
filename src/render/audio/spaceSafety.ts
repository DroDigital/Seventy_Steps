/**
 * The reverb is a flourish and gives way first (round 78): when the frames of a machine average under SPACE.safety.low for
 * `hold` seconds the convolvers are let go, and when they average over `back` for `backHold` seconds they are taken up again.
 * Looked at once a second (a hitch when a chunk loads, the one slow frame in a hundred, is not a slow machine). Pure: the frame
 * times and the clock are fed in.
 */

import { SPACE } from '../../data/acoustics';
import { createFrameStats } from '../../core/frameStats';

export interface SpaceSafety {
  /** One frame took `ms`; `now` in seconds. Returns whether the reverb should be on. */
  frame(ms: number, now: number): boolean;
  readonly on: boolean;
}

export function createSpaceSafety(cfg = SPACE.safety): SpaceSafety {
  const stats = createFrameStats(300);
  let [on, looked, since] = [true, -Infinity, -1];
  return {
    get on() {
      return on;
    },
    frame(ms, now) {
      stats.push(ms);
      if (now - looked < 1) return on;
      looked = now;
      const s = stats.summary();
      if (s.frames < 60) return on; // (not enough seen to say)
      const bad = on ? s.fps < cfg.low : s.fps > cfg.back;
      if (!bad) since = -1;
      else if (since < 0) since = now;
      else if (now - since >= (on ? cfg.hold : cfg.backHold)) {
        on = !on;
        since = -1;
        stats.clear();
      }
      return on;
    },
  };
}
