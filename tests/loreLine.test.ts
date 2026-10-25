import { afterEach, describe, expect, it, vi } from 'vitest';
import { EN } from '../src/data/lang/en';
import { pickLore, QUOTES, TIPS } from '../src/data/loreLines';
import { firstEpigraph, saidUnderVeil } from '../src/ui/loreLine';

describe('the line under the veil (round 24)', () => {
  it('is one of Lovecraft\'s before anything has come up', () => {
    for (let i = 0; i < 20; i++) expect(QUOTES).toContain(pickLore(new Set(), new Set(), Math.random));
  });

  it('is the first lesson that has come up and has not been said, in order, then Lovecraft\'s', () => {
    const seen = new Set(['echoes', 'fight']);
    const shown = new Set<string>();
    const said: string[] = [];
    for (let i = 0; i < 4; i++) {
      const line = pickLore(seen, shown);
      said.push(line);
      shown.add(line);
    }
    expect(said.slice(0, 3)).toEqual(TIPS.filter((t) => seen.has(t.topic)).map((t) => t.text));
    expect(QUOTES).toContain(said[3]);
  });

  it('never speaks of what has not come up (no fog before a horror)', () => {
    const line = pickLore(new Set(['echoes']), new Set());
    expect(line).toBe(TIPS.find((t) => t.topic === 'echoes')!.text);
    expect(pickLore(new Set(['sign']), new Set()).toLowerCase()).not.toContain('fog');
  });

  it('every lesson names a hint that exists', async () => {
    const { EN } = await import('../src/data/lang/en');
    for (const t of TIPS) expect(Object.keys(EN), t.topic).toContain(`hint.${t.topic}`);
  });
});

describe('a realm\'s epigraph under the veil (round 80)', () => {
  afterEach(() => void vi.unstubAllGlobals());
  const storage = () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) });
  };

  it('is said the first journey to a realm, once, then the usual lines come back', () => {
    storage();
    expect(firstEpigraph('arkham')).toBe(EN['epigraph.arkham']);
    expect(firstEpigraph('arkham')).toBeUndefined();
    expect(firstEpigraph('innsmouth')).toBe(EN['epigraph.innsmouth']); // each realm has its own
    expect(firstEpigraph('dunwich')).toBeUndefined(); // no story of his by 1928
    expect(firstEpigraph(undefined)).toBeUndefined();
  });

  it('is not said where there is nothing to remember it by', () => {
    expect(firstEpigraph('arkham')).toBeUndefined();
  });

  it('is not said again by the realm\'s title card, once', () => {
    storage();
    firstEpigraph('rlyeh');
    expect(saidUnderVeil('rlyeh')).toBe(true);
    expect(saidUnderVeil('rlyeh')).toBe(false);
  });
});
