/** The story in French (data/lang/story/index.ts): a table for every domain. */

import type { StoryBook } from '..';
import { FR_CREATURES } from './creatures';
import { FR_CREATURESLAST } from './creaturesLast';
import { FR_CREATURESMORE } from './creaturesMore';
import { FR_DOCUMENTS } from './documents';
import { FR_DOCUMENTSMORE } from './documentsMore';
import { FR_FATES } from './fates';
import { FR_INTRO } from './intro';
import { FR_OVERHEARD } from './overheard';
import { FR_PEOPLE } from './people';
import { FR_PLACES } from './places';
import { FR_PLACESFAR } from './placesFar';
import { FR_QUESTS } from './quests';
import { FR_RUMORS } from './rumors';

export const FR_STORY: StoryBook = {
  intro: FR_INTRO,
  people: FR_PEOPLE,
  rumors: FR_RUMORS,
  overheard: FR_OVERHEARD,
  fates: FR_FATES,
  quests: FR_QUESTS,
  documents: { ...FR_DOCUMENTS, ...FR_DOCUMENTSMORE },
  places: { ...FR_PLACES, ...FR_PLACESFAR },
  creatures: { ...FR_CREATURES, ...FR_CREATURESMORE, ...FR_CREATURESLAST },
};
