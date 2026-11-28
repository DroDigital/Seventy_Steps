/** The demo's pruning of the story (docs/DEMO_BUILD.md): see rules/index.ts. */

import { KEEP } from '../../../src/data/demoContent.ts';
import type { PruneRule } from '../prune.ts';
import { ALL_REALMS, kept, realmsOrOther } from './keep.ts';

const hintsLeftOut = new Set<string>(KEEP.hintsLeftOut);
const keptRealms = new Set<string>(KEEP.regions);
const realms = new Set<string>(ALL_REALMS);

/**
 * The horrors' status lines and notices (`sig.*`: each belongs to a signature the demo does not keep; the Colour's has none of them) and
 * the Dunwich's powder, which only the full game's Dunwich Horror shows (`boss.powder`): the demo's bundle never holds their names.
 */
const horrorLinesLeftOut = (key: string): boolean => key.startsWith('sig.') || key === 'boss.powder' || ['sign.court', 'act.nodens', 'act.powder'].includes(key); // (the Court of Azathoth's heading, and the keys of Nyarlathotep's and the Dunwich Horror's fights, 1.5.0)

/** A line of the field guide or a hint the demo leaves out (`hint.ship`), and a realm's epigraph the demo does not keep (`epigraph.pnakotus`). */
const lineKept = (key: string): boolean => {
  if (horrorLinesLeftOut(key)) return false;
  if (key.startsWith('hint.') && hintsLeftOut.has(key.slice(5))) return false;
  if (key.startsWith('epigraph.') && realms.has(key.slice(9)) && !keptRealms.has(key.slice(9))) return false;
  return true;
};

const language = (file: string, decl: string): PruneRule => ({ file, decl, shape: 'properties', keep: lineKept });

/**
 * The story's translations (src/data/lang/story, 1.5.0): each language's table of a domain is keyed by the ids of the source it
 * translates, and cut by the same ids the demo keeps of that source, so the demo holds the lines of its own people, horrors and pages only.
 */
const storyTable = (domain: string, keep: (id: string) => boolean): PruneRule[] =>
  (['de', 'fr', 'es'] as const).map((l) => ({ file: `src/data/lang/story/${l}/${domain}.ts`, decl: `${l.toUpperCase()}_${domain.toUpperCase()}`, shape: 'properties', keep }));
const npcs = kept('npcs');
const entities = kept('entities');

export const rules: readonly PruneRule[] = [
  // the field guide's hints and the veil's lines: the ones the demo leaves out, and the one quote that names a horror it does not keep
  { file: 'src/data/fieldGuide.ts', decl: 'GUIDE', shape: 'properties', keep: (k) => !hintsLeftOut.has(k) },
  { file: 'src/data/loreLines.ts', decl: 'QUOTES', shape: 'elements', by: 'self', keep: (s) => !s.includes('Cthulhu') },
  { file: 'src/data/loreLines.ts', decl: 'TIPS', shape: 'elements', by: { prop: 'topic' }, keep: (t) => !hintsLeftOut.has(t) },
  // the four languages' lines (src/data/lang: each is typed to hold every key, and the demo holds the ones it keeps)
  language('src/data/lang/en.ts', 'EN'),
  language('src/data/lang/de.ts', 'DE'),
  language('src/data/lang/fr.ts', 'FR'),
  language('src/data/lang/es.ts', 'ES'),
  // the screens' words, spread into each (1.5.0): the Court's heading names a horror the demo does not keep
  language('src/data/lang/screens/en.ts', 'EN_SCREENS'),
  language('src/data/lang/screens/de.ts', 'DE_SCREENS'),
  language('src/data/lang/screens/fr.ts', 'FR_SCREENS'),
  language('src/data/lang/screens/es.ts', 'ES_SCREENS'),
  // the story's translations, by the source's ids: the people (and the trader at the lamps), the rumours of a horror's fall, the mutterings, the epilogues
  ...storyTable('people', (id) => npcs(id) || id === 'trader'),
  ...storyTable('rumors', entities),
  ...storyTable('overheard', npcs),
  ...storyTable('fates', npcs),
  ...storyTable('quests', kept('quests')),
  ...storyTable('documents', kept('documents')),
  ...storyTable('documentsMore', kept('documents')),
  ...storyTable('places', kept('regions')),
  ...storyTable('placesFar', kept('regions')),
  ...storyTable('creatures', entities),
  ...storyTable('creaturesMore', entities),
  ...storyTable('creaturesLast', entities),
  ...storyTable('pois', kept('pois')),
  ...storyTable('poisMore', kept('pois')),
  ...storyTable('deaths', realmsOrOther()),
  ...storyTable('blows', entities),
  ...storyTable('blowsMore', entities),
  ...storyTable('scenes', (id) => id === 'wake' || entities(id)),
  ...storyTable('arms', kept('weapons')),
  ...storyTable('achievements', kept('achievements')),
  ...storyTable('rooms', kept('dungeons')),
  ...storyTable('ways', kept('arenas')),
  ...storyTable('lore', (id) => id !== 'cthulhu' && !hintsLeftOut.has(id)),
];

export const rest: readonly string[] = [];
