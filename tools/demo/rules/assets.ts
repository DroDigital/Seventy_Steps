/** The demo's pruning of the assets (docs/DEMO_BUILD.md): see rules/index.ts. */

import type { PruneRule } from '../prune.ts';
import { kept, weaponPartsOrOther, weaponsOrOther } from './keep.ts';

/** The models the arenas and the places stand, by id (data/models): each pack's record and its index's. */
const models = kept('models');
const modelFiles = ['bossIndex', 'bossPack', 'kenneyIndex', 'kenneyPack', 'webIndex', 'webPack', 'gateIndex', 'gatePack'];
const modelDecl: Record<string, string> = { bossIndex: 'BOSS_INFO', bossPack: 'BOSS_PACK', kenneyIndex: 'KENNEY_INFO', kenneyPack: 'KENNEY_PACK', webIndex: 'WEB_INFO', webPack: 'WEB_PACK', gateIndex: 'GATE_INFO', gatePack: 'GATE_PACK' };

export const rules: readonly PruneRule[] = [
  ...modelFiles.map((f): PruneRule => ({ file: `src/data/models/${f}.ts`, decl: modelDecl[f]!, shape: 'properties', keep: models })),
  // the investigator's clips and parts: the weapons the demo keeps (a move of another weapon is `axe.guard`)
  { file: 'src/data/player/playerClips.ts', decl: 'PLAYER_CLIPS', shape: 'properties', keep: weaponsOrOther() },
  { file: 'src/data/player/playerIndex.ts', decl: 'PLAYER_PARTS', shape: 'elements', by: 'id', keep: weaponPartsOrOther() },
];

export const rest: readonly string[] = [];
