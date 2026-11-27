/**
 * The story in the player's language (1.5.0; docs/LOCALIZATION.md). The story is written in English in its own tables (the people,
 * the quests, the pages, the places, the creatures, the scenes), and English stays its source. Each language holds, by domain and
 * by the id the source table keys an entry by (a person, a page's name, a realm), the English of each line and its translation.
 * `story()` (core/i18n.ts) finds a line by its English, so a line changed in English shows in English until its translation is
 * mended, and tests/storyI18n.test.ts fails until it is. The ids are the source's, so the demo cuts a language's entries as it cuts
 * the source's (tools/demo/rules/story.ts). The voices stay English: a spoken line is found by its English words (data/speech.ts).
 */

import { DE_STORY } from './de';
import { ES_STORY } from './es';
import { FR_STORY } from './fr';

/** A domain's lines: the source's id -> the English of a line -> its translation. */
export type StoryTable = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** The domains of the story, each a table of its own in every language. */
export const STORY_DOMAINS = ['intro', 'people', 'rumors', 'overheard', 'fates', 'quests', 'documents', 'places', 'creatures', 'pois'] as const;
export type StoryDomain = (typeof STORY_DOMAINS)[number];
export type StoryBook = Readonly<Record<StoryDomain, StoryTable>>;

function index(book: StoryBook): ReadonlyMap<string, string> {
  const lines = new Map<string, string>();
  for (const table of Object.values(book)) for (const group of Object.values(table)) for (const [english, line] of Object.entries(group)) lines.set(english, line);
  return lines;
}

/** Every translated line of each language, by its English. */
export const STORY: Readonly<Record<string, ReadonlyMap<string, string>>> = { de: index(DE_STORY), fr: index(FR_STORY), es: index(ES_STORY) };
