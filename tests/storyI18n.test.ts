import { afterEach, describe, expect, it } from 'vitest';
import { setLocale, story } from '../src/core/i18n';
import { INTRO } from '../src/data/intro';
import { LANGS } from '../src/data/lang';
import { STORY_DOMAINS } from '../src/data/lang/story';
import { BOOKS, storyClashes, storyFaults } from './storyCheck';
import { STORY_SOURCES } from './storyText';

describe('the story in every language (1.5.0)', () => {
  afterEach(() => setLocale(0));

  it('every line of the story is translated, keeps its {places}, and nothing is left over from a line that is gone', () => {
    for (const [lang, book] of Object.entries(BOOKS)) expect(storyFaults(lang, book)).toEqual([]);
  });

  it('a line shown in two places is translated one way (the lookup is by the English)', () => {
    for (const [lang, book] of Object.entries(BOOKS)) expect(storyClashes(lang, book)).toEqual([]);
  });

  it('every language with a story holds one, and a language is told apart from English: most lines differ', () => {
    expect(Object.keys(BOOKS).sort()).toEqual(LANGS.slice(1).map((l) => l.id).sort());
    for (const [lang, book] of Object.entries(BOOKS)) {
      let all = 0;
      let same = 0;
      for (const d of STORY_DOMAINS)
        for (const group of Object.values(book[d]))
          for (const [en, line] of Object.entries(group)) {
            all++;
            if (en === line) same++;
          }
      expect(same, lang).toBeLessThan(Math.max(2, all * 0.12)); // (names and the odd word are alike)
    }
  });

  it("story() shows the language chosen, and in English the English; a line it has not is shown as it is", () => {
    const heading = INTRO[0].heading;
    expect(story(heading)).toBe(heading);
    for (let i = 1; i < LANGS.length; i++) {
      setLocale(i);
      expect(story(heading), LANGS[i].id).toBe(BOOKS[LANGS[i].id].intro.intro[heading]);
      expect(story('A line no table holds.')).toBe('A line no table holds.');
    }
  });

  it('every domain reads something from the English', () => {
    for (const d of STORY_DOMAINS) expect(STORY_SOURCES[d]().size, d).toBeGreaterThan(0);
  });
});
