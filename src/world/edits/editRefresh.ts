/**
 * The world editor's edits put in force at once (round 110): the region plans already built are
 * bucketed anew, the arenas' and dungeons' dressing laid anew, and the chunks forgotten, so what is
 * built again (render/worldScene.ts `rebuild`) and walked against follows them. Sites and the foes
 * already risen follow on the next load of the world. Pure.
 */

import { forgetChunks } from '../chunks';
import { worldLayout } from '../placements';
import { refreshPlans } from '../regionPlan';
import { editInPlace } from './editApply';
import { setActiveEdits } from './editStore';
import type { WorldEdit } from './editTypes';

export function putInForce(list: readonly WorldEdit[]): void {
  setActiveEdits(list);
  refreshPlans();
  const w = worldLayout();
  for (const a of w.arenas) editInPlace(`arena:${a.bosses[0]}`, a.decor);
  for (const d of w.dungeons) editInPlace(`dungeon:${d.layout.def.id}`, d.decor);
  forgetChunks(() => false);
}
