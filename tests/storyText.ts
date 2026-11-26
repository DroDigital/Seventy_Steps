/**
 * Every line of the story a player is shown, read from the English tables, by domain and by the id each table keys an entry by
 * (data/lang/story/index.ts). tests/storyI18n.test.ts holds every language's tables to it: a line here with no translation, or a
 * translation of a line no longer here, fails it. A domain's reader lists only what is shown (a performed line's words as shown,
 * never its [tags]).
 */

import { INTRO, introText } from '../src/data/intro';
import type { StoryDomain } from '../src/data/lang/story';

/** A domain's lines: the source's id -> the English of each line it shows. */
export type StorySource = ReadonlyMap<string, readonly string[]>;

const lines = (...all: (string | undefined | null | false)[]): string[] => all.filter((s): s is string => typeof s === 'string' && s.trim() !== '');

export const STORY_SOURCES: Readonly<Record<StoryDomain, () => StorySource>> = {
  intro: () => new Map([['intro', INTRO.flatMap((c) => lines(c.heading, introText(c)))]]),
};
