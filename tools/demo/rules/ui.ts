/** The demo's pruning of the ui (docs/DEMO_BUILD.md): see rules/index.ts. */

import type { PruneRule } from '../prune.ts';
import { kept } from './keep.ts';

const weapons = kept('weapons');
const bosses = kept('bosses');

export const rules: readonly PruneRule[] = [
  { file: 'src/ui/relicGlyphs.ts', decl: 'MARKS', shape: 'properties', keep: () => false }, // the relics are the rest of the game's
  { file: 'src/ui/weaponGlyphs.ts', decl: 'MARKS', shape: 'properties', keep: weapons },
  { file: 'src/ui/hints.ts', decl: 'BOSS_HINTS', shape: 'properties', keep: bosses },
];

export const rest: readonly string[] = [];
