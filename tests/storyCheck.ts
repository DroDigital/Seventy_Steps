/**
 * The story's translations held to the English (data/lang/story): what is missing, mistaken or left over in a language's tables,
 * against what tests/storyText.ts reads from the English. Shared by tests/storyI18n.test.ts and the demo's own (tests/demo).
 */

import { STORY_DOMAINS, type StoryBook } from '../src/data/lang/story';
import { DE_STORY } from '../src/data/lang/story/de';
import { ES_STORY } from '../src/data/lang/story/es';
import { FR_STORY } from '../src/data/lang/story/fr';
import { STORY_SOURCES } from './storyText';

export const BOOKS: Readonly<Record<string, StoryBook>> = { de: DE_STORY, fr: FR_STORY, es: ES_STORY };

const places = (s: string): string => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const short = (s: string): string => (s.length > 90 ? `${s.slice(0, 87)}...` : s);

/** Each fault of a language's tables: a line with no translation, an empty one, `{places}` not the English's, or a line or id that is gone. */
export function storyFaults(lang: string, book: StoryBook): string[] {
  const faults: string[] = [];
  for (const domain of STORY_DOMAINS) {
    const source = STORY_SOURCES[domain]();
    const table = book[domain];
    for (const [id, english] of source) {
      const group = table[id];
      if (!group) {
        faults.push(`${lang} ${domain} ${id}: no translations`);
        continue;
      }
      for (const en of english) {
        const line = group[en];
        if (!line || !line.trim()) faults.push(`${lang} ${domain} ${id}: untranslated "${short(en)}"`);
        else if (places(line) !== places(en)) faults.push(`${lang} ${domain} ${id}: {places} not the English's in "${short(en)}"`);
      }
      const shown = new Set(english);
      for (const en of Object.keys(group)) if (!shown.has(en)) faults.push(`${lang} ${domain} ${id}: left over (its English is gone) "${short(en)}"`);
    }
    for (const id of Object.keys(table)) if (!source.has(id)) faults.push(`${lang} ${domain} ${id}: left over (no such id)`);
  }
  return faults;
}

/** An English line given two translations in one language: the lookup is by the English, so only one of them would be shown. */
export function storyClashes(lang: string, book: StoryBook): string[] {
  const seen = new Map<string, string>();
  const clashes: string[] = [];
  for (const domain of STORY_DOMAINS)
    for (const group of Object.values(book[domain]))
      for (const [en, line] of Object.entries(group)) {
        const was = seen.get(en);
        if (was !== undefined && was !== line) clashes.push(`${lang} ${domain}: "${short(en)}" is "${short(was)}" and "${short(line)}"`);
        seen.set(en, line);
      }
  return clashes;
}
