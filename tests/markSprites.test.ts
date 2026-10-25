/**
 * The map's stamps (2026-10-25): a mark that never moves is drawn once into a small canvas and stamped on a whole pixel afterwards; one that
 * moves with the clock is drawn each time; and with no document (this file's Node) every mark is drawn directly.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stampMark } from '../src/ui/markSprites';

/** A context that records the names of the calls made on it. */
function recorder() {
  const calls: string[] = [];
  const gradient = { addColorStop: () => undefined };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (t, k: string) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => gradient : (...a: unknown[]) => void calls.push(k === 'drawImage' ? `drawImage:${a.slice(1).join(',')}` : k)),
    set: (t, k: string, v) => ((t[k] = v), true),
  });
  return { calls, ctx: ctx as unknown as CanvasRenderingContext2D };
}

/** A document that makes canvases which draw into recorders, and counts them. */
function documentOf(made: { n: number; width: number }[]) {
  return {
    createElement: () => {
      const c = { n: 0, width: 0, height: 0, getContext: () => recorder().ctx };
      made.push(c);
      return c;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('the map marks, stamped', () => {
  it('draws a mark directly where there is no document', () => {
    const { calls, ctx } = recorder();
    stampMark(ctx, 'sign', 40, 40, 10, { lit: true });
    expect(calls).not.toContain('drawImage');
    expect(calls.length).toBeGreaterThan(10);
  });

  it('draws a still mark once, then stamps it, on whole pixels', () => {
    const made: { n: number; width: number }[] = [];
    vi.stubGlobal('document', documentOf(made));
    const { calls, ctx } = recorder();
    stampMark(ctx, 'gate', 40.4, 50.6, 10);
    stampMark(ctx, 'gate', 90.2, 20.9, 10);
    const stamps = calls.filter((c) => c.startsWith('drawImage'));
    expect(made).toHaveLength(1);
    expect(stamps).toHaveLength(2);
    expect(calls).toHaveLength(2); // nothing else was drawn on the map's own context
    const half = made[0].width / 2;
    expect(stamps[0]).toBe(`drawImage:${40 - half},${51 - half}`);
    expect(stamps[1]).toBe(`drawImage:${90 - half},${21 - half}`);
  });

  it('keeps a stamp for each state and size', () => {
    const made: { n: number; width: number }[] = [];
    vi.stubGlobal('document', documentOf(made));
    const { ctx } = recorder();
    for (const state of [{}, { lit: true }, { lit: true }]) stampMark(ctx, 'sign', 10, 10, 10, state);
    stampMark(ctx, 'sign', 10, 10, 7.4, { lit: true });
    stampMark(ctx, 'secret', 10, 10, 10, { poi: 'tale' });
    stampMark(ctx, 'secret', 10, 10, 10, { poi: 'den' });
    expect(made).toHaveLength(5);
  });

  it('keeps room about the figure for its glow and its shadow', () => {
    const made: { n: number; width: number }[] = [];
    vi.stubGlobal('document', documentOf(made));
    stampMark(recorder().ctx, 'boss', 10, 10, 10);
    expect(made[0].width).toBeGreaterThanOrEqual(4 * 10);
  });

  it('draws a mark that moves each time', () => {
    const made: { n: number; width: number }[] = [];
    vi.stubGlobal('document', documentOf(made));
    for (const kind of ['echo', 'lead', 'you'] as const) {
      const { calls, ctx } = recorder();
      stampMark(ctx, kind, 30, 30, 8, { now: 5, turn: 1 });
      expect(calls, kind).not.toContain('drawImage');
    }
    expect(made).toHaveLength(0);
  });
});
