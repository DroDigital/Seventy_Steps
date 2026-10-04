/**
 * Who has something for the investigator (round 39): the people a quest begins with, and those a quest under way
 * waits on (a word with them, a gift they asked for). The HUD hangs a small sign over their heads (ui/questMarks.ts)
 * so a new investigator knows whom to seek out. Pure: no Three.js.
 */

import { NPCS } from '../data/npcs';
import { QUESTS } from '../data/quests';
import type { Game } from './components';
import { topicOf } from './npcs';
import { isDone, stageOf, UNSTARTED } from './quests';

/** `ask`: they will begin a quest; `answer`: a quest under way is waiting on a word with them. */
export type Mark = 'ask' | 'answer';

/** Each person with a mark, by id. */
export function questMarks(g: Game): Map<string, Mark> {
  const out = new Map<string, Mark>();
  if (!g.overworld) return out;
  for (const [id, stage] of g.overworld.quests) {
    const goal = QUESTS[id]?.stages[stage]?.goal;
    if ((goal?.kind === 'talk' || goal?.kind === 'give') && !isDone(g, id)) out.set(goal.npc, 'answer');
  }
  for (const n of NPCS) {
    if (out.has(n.id)) continue;
    const q = topicOf(g, n).starts;
    const def = q ? QUESTS[q] : undefined;
    if (q && def && stageOf(g, q) === UNSTARTED && (!def.after || isDone(g, def.after))) out.set(n.id, 'ask');
  }
  return out;
}
