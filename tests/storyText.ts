/**
 * Every line of the story a player is shown, read from the English tables, by domain and by the id each table keys an entry by
 * (data/lang/story/index.ts). tests/storyI18n.test.ts holds every language's tables to it: a line here with no translation, or a
 * translation of a line no longer here, fails it. A domain's reader lists only what is shown (a performed line's words as shown,
 * never its [tags]).
 */

import { INTRO, introText } from '../src/data/intro';
import { NPCS, TRADERS } from '../src/data/npcs';
import { FATES } from '../src/data/epilogues';
import { OVERHEARD } from '../src/data/overheard';
import { QUESTS } from '../src/data/quests';
import { RUMORS } from '../src/data/rumors';
import type { StoryDomain } from '../src/data/lang/story';

/** A domain's lines: the source's id -> the English of each line it shows. */
export type StorySource = ReadonlyMap<string, readonly string[]>;

const lines = (...all: (string | undefined | null | false)[]): string[] => all.filter((s): s is string => typeof s === 'string' && s.trim() !== '');

export const STORY_SOURCES: Readonly<Record<StoryDomain, () => StorySource>> = {
  intro: () => new Map([['intro', INTRO.flatMap((c) => lines(c.heading, introText(c)))]]),
  // the people met: a name, a title, every line of every topic (the trader at the lamps is one man at every second sign: 'trader')
  people: () =>
    new Map([
      ...NPCS.map((n) => [n.id, lines(n.name, n.title, ...n.topics.flatMap((tp) => tp.lines))] as const),
      ['trader', [...new Set(TRADERS.flatMap((n) => lines(n.name, n.title, ...n.topics.flatMap((tp) => tp.lines))))]],
    ]),
  // what the people say of a horror's fall, by horror; what they mutter as one passes, by person; what became of them, by person
  rumors: () => new Map(Object.entries(RUMORS).map(([id, text]) => [id, lines(text)])),
  overheard: () => new Map(Object.entries(OVERHEARD).map(([id, said]) => [id, lines(...said)])),
  fates: () =>
    new Map(Object.entries(FATES).map(([id, f]) => [id, lines(f.done, f.undone, ...Object.values(f.endings ?? {}), ...Object.values(f.undoneEndings ?? {}))])),
  // the quests: a title, each stage's line in the journal, the line once done. A horror's discovery (`discover_<horror>`) is left out:
  // round 69 switched the discoveries off (systems/discovery.ts), so none begins and none is shown (docs/LOCALIZATION.md)
  quests: () =>
    new Map(Object.entries(QUESTS).filter(([id]) => !id.startsWith('discover_')).map(([id, q]) => [id, lines(q.title, ...q.stages.map((s) => s.note), q.done)])),
};
