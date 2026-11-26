/** The story in Spanish (data/lang/story/index.ts): a table for every domain. */

import type { StoryBook } from '..';
import { ES_FATES } from './fates';
import { ES_INTRO } from './intro';
import { ES_OVERHEARD } from './overheard';
import { ES_PEOPLE } from './people';
import { ES_QUESTS } from './quests';
import { ES_RUMORS } from './rumors';

export const ES_STORY: StoryBook = {
  intro: ES_INTRO,
  people: ES_PEOPLE,
  rumors: ES_RUMORS,
  overheard: ES_OVERHEARD,
  fates: ES_FATES,
  quests: ES_QUESTS,
};
