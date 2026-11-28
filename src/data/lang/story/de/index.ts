/** The story in German (data/lang/story/index.ts): a table for every domain. */

import type { StoryBook } from '..';
import { DE_ARMS } from './arms';
import { DE_WARES } from './wares';
import { DE_ACHIEVEMENTS } from './achievements';
import { DE_ROOMS } from './rooms';
import { DE_CREDITS } from './credits';
import { DE_BLOWS } from './blows';
import { DE_BLOWSMORE } from './blowsMore';
import { DE_CREATURES } from './creatures';
import { DE_CREATURESLAST } from './creaturesLast';
import { DE_CREATURESMORE } from './creaturesMore';
import { DE_DEATHS } from './deaths';
import { DE_DOCUMENTS } from './documents';
import { DE_DOCUMENTSMORE } from './documentsMore';
import { DE_FATES } from './fates';
import { DE_INTRO } from './intro';
import { DE_LORE } from './lore';
import { DE_OVERHEARD } from './overheard';
import { DE_PEOPLE } from './people';
import { DE_PLACES } from './places';
import { DE_PLACESFAR } from './placesFar';
import { DE_POIS } from './pois';
import { DE_POISMORE } from './poisMore';
import { DE_QUESTS } from './quests';
import { DE_RUMORS } from './rumors';
import { DE_SCENES } from './scenes';

export const DE_STORY: StoryBook = {
  intro: DE_INTRO,
  people: DE_PEOPLE,
  rumors: DE_RUMORS,
  overheard: DE_OVERHEARD,
  fates: DE_FATES,
  quests: DE_QUESTS,
  documents: { ...DE_DOCUMENTS, ...DE_DOCUMENTSMORE },
  places: { ...DE_PLACES, ...DE_PLACESFAR },
  creatures: { ...DE_CREATURES, ...DE_CREATURESMORE, ...DE_CREATURESLAST },
  pois: { ...DE_POIS, ...DE_POISMORE },
  deaths: DE_DEATHS,
  blows: { ...DE_BLOWS, ...DE_BLOWSMORE },
  lore: DE_LORE,
  scenes: DE_SCENES,
  arms: DE_ARMS,
  wares: DE_WARES,
  achievements: DE_ACHIEVEMENTS,
  rooms: DE_ROOMS,
  credits: DE_CREDITS,
};
