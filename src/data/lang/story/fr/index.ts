/** The story in French (data/lang/story/index.ts): a table for every domain. */

import type { StoryBook } from '..';
import { FR_FATES } from './fates';
import { FR_INTRO } from './intro';
import { FR_OVERHEARD } from './overheard';
import { FR_PEOPLE } from './people';
import { FR_RUMORS } from './rumors';

export const FR_STORY: StoryBook = {
  intro: FR_INTRO,
  people: FR_PEOPLE,
  rumors: FR_RUMORS,
  overheard: FR_OVERHEARD,
  fates: FR_FATES,
};
