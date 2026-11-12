/**
 * Every pruning rule of the demo build, by the part of the game it cuts (one file each, so no two hands meet in one table), and the
 * modules that are wholly the rest of the game (`REST_MODULES`: the demo's tests see them as empty, its build never reaches them).
 * A rule that finds nothing to cut fails the build: a refactor that moves a table must move its rule.
 */

import type { PruneRule } from '../prune.ts';
import * as assets from './assets.ts';
import * as creatures from './creatures.ts';
import * as render from './render.ts';
import * as story from './story.ts';
import * as ui from './ui.ts';
import * as world from './world.ts';

/** What one area contributes. */
export interface Area {
  rules: readonly PruneRule[];
  /** Modules (from the repository root) that are only the rest of the game's, read by nothing in the demo. */
  rest: readonly string[];
}

const AREAS: readonly Area[] = [world, creatures, story, render, ui, assets];

export const PRUNE_RULES: readonly PruneRule[] = AREAS.flatMap((a) => a.rules);
export const REST_MODULES: readonly string[] = AREAS.flatMap((a) => a.rest);
