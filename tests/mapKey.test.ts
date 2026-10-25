/**
 * The map's key (2026-10-25: "the large box clutters the view heavily"): it is a small tab with two short columns of figure and name behind it,
 * so a row's name stays short, the longer word of what to do with it is a card, the pad has a button for it, and what was last chosen is kept
 * where the browser allows and forgotten, not thrown over, where it does not.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEY_ROWS, hintsFor, keyOpenPref, rememberKeyOpen } from '../src/ui/mapChrome';
import { drawMark } from '../src/ui/mapIcons';

afterEach(() => vi.unstubAllGlobals());

describe('the map key (2026-10-25)', () => {
  it('has an even number of rows, so its two columns end together, each named in a few words', () => {
    expect(KEY_ROWS.length % 2).toBe(0);
    for (const row of KEY_ROWS) expect(row.words.length, row.words).toBeLessThanOrEqual(18);
    expect(new Set(KEY_ROWS.map((r) => r.words)).size).toBe(KEY_ROWS.length);
  });

  it('keeps what to do with a figure to its card, not to its row', () => {
    for (const row of KEY_ROWS) if (row.hint) expect(row.hint.length, row.words).toBeLessThanOrEqual(100);
  });

  it('draws every row with a figure, whatever state it is in', () => {
    for (const row of KEY_ROWS) {
      const calls: string[] = [];
      const gradient = { addColorStop: () => undefined };
      const ctx = new Proxy({} as Record<string, unknown>, {
        get: (t, k: string) => (k in t ? t[k] : k.startsWith('create') ? () => gradient : (...a: unknown[]) => void calls.push(`${k}:${a.length}`)),
        set: (t, k: string, v) => ((t[k] = v), true),
      }) as unknown as CanvasRenderingContext2D;
      drawMark(ctx, row.kind, 12, 12, 7.5, row.state);
      expect(calls.length, row.words).toBeGreaterThan(3);
    }
  });

  it('gives the pad a button for it, and the keyboard its letter', () => {
    expect(hintsFor(true, 'M').some(([keys, words]) => keys.includes('X') && words === 'Key')).toBe(true);
    expect(hintsFor(false, 'M').some(([keys, words]) => keys.includes('L') && words === 'Key')).toBe(true);
  });

  it('is shut where nothing was kept, and keeps what was chosen', () => {
    expect(keyOpenPref()).toBe(false); // (Node: there is no storage at all)
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
    expect(keyOpenPref()).toBe(false);
    rememberKeyOpen(true);
    expect(keyOpenPref()).toBe(true);
    rememberKeyOpen(false);
    expect(keyOpenPref()).toBe(false);
  });

  it('is not thrown by a profile that refuses storage', () => {
    const refuse = (): never => {
      throw new Error('denied');
    };
    vi.stubGlobal('localStorage', { getItem: refuse, setItem: refuse });
    expect(keyOpenPref()).toBe(false);
    expect(() => rememberKeyOpen(true)).not.toThrow();
  });
});
