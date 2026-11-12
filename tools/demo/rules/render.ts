/** The demo's pruning of the render (docs/DEMO_BUILD.md): see rules/index.ts. */

import type { PruneRule } from '../prune.ts';
import { kept } from './keep.ts';

const weapons = kept('weapons');

export const rules: readonly PruneRule[] = [
  { file: 'src/render/armsMeshes.ts', decl: 'ARMS', shape: 'properties', keep: weapons },
  { file: 'src/render/playerPose.ts', decl: 'CARRY', shape: 'properties', keep: weapons },
  { file: 'src/render/playerPose.ts', decl: 'WALK_TIP', shape: 'properties', keep: weapons },
  { file: 'src/render/poses.ts', decl: 'KNEEL_AIM', shape: 'properties', keep: weapons },
];

export const rest: readonly string[] = [];
