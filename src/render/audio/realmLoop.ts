/**
 * A realm track's loop with no seam (round 28): the track's body (loudness.ts) is played again and
 * again, each pass fading out, equal power, over the last `overlap` seconds of the body as the next
 * pass fades in over its first `overlap`, begun from the body's start. Both sides of the seam are
 * steady stretches (the body is chosen so), and equal-power gains hold a steady total level across
 * two stretches that are not the same sound, so the seam is not heard. Passes are scheduled on the
 * audio clock a few ahead, sample-accurate, which a timer held back in a hidden tab cannot miss.
 * Nothing here touches the page but the audio graph it is handed.
 *
 * Round 44 (the boss themes): the first pass may begin elsewhere than the loop's start (`entry`: a
 * theme's own intro, played once), and `position` tells where in the buffer the newest pass has
 * reached at an audio time, so that a move to another stretch can wait for a bar line (bossPlan.ts).
 */

import { FADE_IN, FADE_OUT } from './themeLoop';
import { passLength, type Region } from './loudness';

const AHEAD = 3; // passes kept scheduled, the one sounding included

/** When each pass begins, from `at`: the first, then every passLength after the first's own (which runs from `entry`, not the loop's start). */
export const passTimes = (at: number, r: Region, count: number, entry: number = r.start): number[] =>
  Array.from({ length: count }, (_, k) => (k === 0 ? at : at + (r.end - entry - r.overlap) + (k - 1) * passLength(r)));

export interface RealmLoop {
  /** The first pass begins at audio time `at`. */
  begin(at: number): void;
  /** Keeps passes scheduled ahead. */
  tick(): void;
  /** Every pass stops. */
  stop(): void;
  /** Where in the buffer (seconds) the newest pass that has begun by audio time `t` has reached; null before the first. */
  position(t: number): number | null;
}

export function createRealmLoop(ctx: BaseAudioContext, out: AudioNode, buffer: AudioBuffer, region: Region, entry: number = region.start): RealmLoop {
  const { start, end, overlap } = region;
  const step = passLength(region);
  const sounding = new Set<AudioBufferSourceNode>();
  const passes: { at: number; from: number }[] = []; // each pass's beginning, on the audio clock, and where in the buffer it begins
  let next = Infinity; // audio time the next pass to schedule begins
  let first = true;

  /** A pass from `next`: in over the last one's ending (the first is not faded: its voice's level is), out under the next one's beginning. */
  const schedule = (): void => {
    const at = next;
    const [from, length] = first ? [entry, end - entry] : [start, end - start];
    next += length - overlap;
    passes.push({ at, from });
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(first ? 1 : 0, at);
    if (!first) gain.gain.setValueCurveAtTime(FADE_IN, at, overlap);
    gain.gain.setValueCurveAtTime(FADE_OUT, at + length - overlap, overlap);
    first = false;
    source.connect(gain).connect(out);
    source.start(at, from, length);
    sounding.add(source);
    source.onended = () => {
      sounding.delete(source);
      gain.disconnect();
    };
  };

  return {
    begin(at) {
      [next, first] = [at, true];
      passes.length = 0;
      for (let k = 0; k < AHEAD; k++) schedule();
    },
    tick() {
      while (next - ctx.currentTime < step * (AHEAD - 1)) schedule();
    },
    position(t) {
      for (let k = passes.length - 1; k >= 0; k--) if (passes[k].at <= t) return passes[k].from + (t - passes[k].at);
      return null;
    },
    stop() {
      next = Infinity;
      for (const s of sounding) {
        try {
          s.stop();
        } catch {
          // not started, or already stopped
        }
      }
      sounding.clear();
    },
  };
}
