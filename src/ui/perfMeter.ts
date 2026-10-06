/**
 * The frame meter (round 46): F3 (or `?perf`) shows the frame rate, the slowest hundredth of the frames, the worst frame and
 * the draw calls over the last ten seconds or so, in any build, so a player can say how it runs on their computer and a
 * tester can see where it stutters. `frame()` is called once a picture; `stats` is what the auto-quality and the benchmark read.
 */

import { createFrameStats, type FrameStats } from '../core/frameStats';

export interface Perf {
  stats: FrameStats;
  /** Called as each picture begins: the time since the last is a frame. */
  frame(): void;
  /** Refreshed from the renderer's counts (draws, triangles) a couple of times a second. */
  update(draws: number, triangles: number): void;
  toggle(): void;
}

export function createPerf(on = false): Perf {
  const stats = createFrameStats(600);
  const box = document.createElement('pre');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;right:10px;top:10px;z-index:40;margin:0;padding:6px 9px;font:11px/1.5 monospace;color:#d9d0b8;background:#050506c0;border-right:2px solid #d9d0b855;pointer-events:none;display:none;white-space:pre';
  document.body.append(box);
  let shown = false;
  let last = 0;
  let at = 0;
  const show = (v: boolean): void => void (box.style.display = (shown = v) ? 'block' : 'none');
  addEventListener('keydown', (e) => {
    if (e.code !== 'F3') return;
    e.preventDefault();
    show(!shown);
  });
  show(on);
  return {
    stats,
    toggle: () => show(!shown),
    frame() {
      const now = performance.now();
      if (last) stats.push(now - last);
      last = now;
    },
    update(draws, triangles) {
      const now = performance.now();
      if (!shown || now - at < 500) return;
      at = now;
      const s = stats.summary();
      box.textContent = `${s.fps.toFixed(0)} fps · 1% low ${s.low.toFixed(0)}\nframe ${(1000 / Math.max(1, s.fps)).toFixed(1)} ms · worst ${s.worst.toFixed(0)} ms\n${draws} draws · ${(triangles / 1000).toFixed(0)}k tris`;
    },
  };
}

/** A block of words kept up over the picture (the benchmark's progress and result), set with the returned function. */
export function createReadout(): (text: string) => void {
  const box = document.createElement('pre');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:40;margin:0;padding:10px 14px;font:12px/1.6 monospace;color:#d9d0b8;background:#050506d0;border-left:2px solid #d9d0b855;pointer-events:none;display:none;white-space:pre';
  document.body.append(box);
  return (text) => {
    box.textContent = text;
    box.style.display = text ? 'block' : 'none';
  };
}
