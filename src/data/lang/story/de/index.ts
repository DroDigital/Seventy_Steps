/** The story in German (data/lang/story/index.ts): a table for every domain. */

import type { StoryBook } from '..';
import { DE_DOCUMENTS } from './documents';
import { DE_DOCUMENTSMORE } from './documentsMore';
import { DE_FATES } from './fates';
import { DE_INTRO } from './intro';
import { DE_OVERHEARD } from './overheard';
import { DE_PEOPLE } from './people';
import { DE_QUESTS } from './quests';
import { DE_RUMORS } from './rumors';

export const DE_STORY: StoryBook = {
  intro: DE_INTRO,
  people: DE_PEOPLE,
  rumors: DE_RUMORS,
  overheard: DE_OVERHEARD,
  fates: DE_FATES,
  quests: DE_QUESTS,
  documents: { ...DE_DOCUMENTS, ...DE_DOCUMENTSMORE },
};
