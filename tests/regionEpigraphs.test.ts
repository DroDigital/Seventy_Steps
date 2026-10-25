import { describe, expect, it } from 'vitest';
import { LANGS } from '../src/data/lang';
import { EPIGRAPH_REGIONS, epigraphKey } from '../src/data/regionEpigraphs';
import { REGIONS } from '../src/data/regions';

describe('the realms\' epigraphs (round 80)', () => {
  it('belong to realms that exist, once each', () => {
    expect(new Set(EPIGRAPH_REGIONS).size).toBe(EPIGRAPH_REGIONS.length);
    for (const id of EPIGRAPH_REGIONS) expect(REGIONS.map((r) => r.id), id).toContain(id);
  });

  it('are in every language, short enough for a card, and not the same line in two realms', () => {
    const seen = new Set<string>();
    for (const id of EPIGRAPH_REGIONS) {
      const key = epigraphKey(id)!;
      expect(key).toBe(`epigraph.${id}`);
      for (const lang of LANGS) {
        const line = (lang.table as Record<string, string | undefined>)[key];
        expect(line, `${lang.id} ${key}`).toBeTruthy();
        expect(line!.length, `${lang.id} ${key}`).toBeLessThanOrEqual(200);
        expect(line, `${lang.id} ${key}`).not.toBe(line!.toUpperCase()); // (a sentence, not a shout)
      }
      const en = LANGS[0].table[key as keyof (typeof LANGS)[0]['table']];
      expect(seen.has(en)).toBe(false);
      seen.add(en);
    }
  });

  it('leave out the realms with no story of his published by 1928', () => {
    for (const id of ['dunwich', 'vermont', 'mountains', 'kn_yan', 'yuggoth']) expect(epigraphKey(id), id).toBeUndefined();
    expect(epigraphKey(null)).toBeUndefined();
    expect(epigraphKey('nowhere')).toBeUndefined();
  });
});
