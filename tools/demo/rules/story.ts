/** The demo's pruning of the story (docs/DEMO_BUILD.md): see rules/index.ts. */

import { KEEP } from '../../../src/data/demoContent.ts';
import type { PruneRule } from '../prune.ts';
import { ALL_REALMS } from './keep.ts';

const hintsLeftOut = new Set<string>(KEEP.hintsLeftOut);
const keptRealms = new Set<string>(KEEP.regions);
const realms = new Set<string>(ALL_REALMS);

/** A line of the field guide or a hint the demo leaves out (`hint.ship`), and a realm's epigraph the demo does not keep (`epigraph.pnakotus`). */
const lineKept = (key: string): boolean => {
  if (key.startsWith('hint.') && hintsLeftOut.has(key.slice(5))) return false;
  if (key.startsWith('epigraph.') && realms.has(key.slice(9)) && !keptRealms.has(key.slice(9))) return false;
  return true;
};

const language = (file: string, decl: string): PruneRule => ({ file, decl, shape: 'properties', keep: lineKept });

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
];

export const rest: readonly string[] = [];
