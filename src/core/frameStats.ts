/**
 * How the frames went (round 46): the last N frame times, and what a player feels of them. The average frame rate hides a
 * game that stutters, so the summary also gives the slowest hundredth of the frames (the "1% low") and the worst frame.
 * Pure: the times are fed in.
 */

export interface FrameSummary {
  frames: number;
  fps: number; // frames over the time they took
  low: number; // the frame rate of the slowest hundredth of the frames
  p95: number; // ms: 19 frames in 20 were quicker than this
  worst: number; // ms
}

export interface FrameStats {
  push(ms: number): void;
  clear(): void;
  summary(): FrameSummary;
}

/** The ring of the last `capacity` frame times (a frame over `ceiling` ms is a pause for a hidden tab or a loading hitch, not a frame, and is left out). */
export function createFrameStats(capacity = 600, ceiling = 2000): FrameStats {
  const ring: number[] = [];
  let at = 0;
  return {
    push(ms) {
      if (!Number.isFinite(ms) || ms <= 0 || ms > ceiling) return;
      if (ring.length < capacity) ring.push(ms);
      else ring[at] = ms;
      at = (at + 1) % capacity;
    },
    clear() {
      ring.length = 0;
      at = 0;
    },
    summary() {
      if (!ring.length) return { frames: 0, fps: 0, low: 0, p95: 0, worst: 0 };
      const sorted = [...ring].sort((a, b) => a - b);
      const total = ring.reduce((a, b) => a + b, 0);
      const slow = sorted.slice(Math.floor(sorted.length * 0.99));
      const lowMs = slow.reduce((a, b) => a + b, 0) / slow.length;
      return {
        frames: ring.length,
        fps: (ring.length * 1000) / total,
        low: 1000 / lowMs,
        p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
        worst: sorted[sorted.length - 1],
      };
    },
  };
}
