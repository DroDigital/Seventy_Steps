/**
 * The quest tracker's words (ui/questTracker.ts): what the open stage of the quest being followed asks, in one short line, by the kind of
 * goal: whom to speak with, what to slay, which sign to find, what to read, how many seals have fallen, where the dream's end is chosen, which act of a horror's discovery to
 * do. The journal keeps the long note (data/quests.ts); this is what fits at the side of the screen. The interface's words are the
 * language chosen (data/lang `hud.track.*`); the names are the story's own, as the rest of the story's words are.
 */

import { t as tr } from '../core/i18n';
import { DISCOVERIES } from '../data/discoveriesAll';
import { NPCS } from '../data/npcs';
import type { Goal } from '../data/quests';
import { getEntity } from '../data/registry';
import { COURT_SIGN } from '../systems/endings';
import { worldLayout } from '../world/placements';

const npcName = (id: string): string => NPCS.find((n) => n.id === id)?.name ?? id;
const upper = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** The line a goal reads as. `seals`: how many of the seals' count have fallen (a goal of `seals` counts them). */
export function briefLine(goal: Goal, seals = 0): string {
  switch (goal.kind) {
    case 'talk':
      return tr('hud.track.talk', { name: npcName(goal.npc) });
    case 'give':
      return tr('hud.track.give', { name: npcName(goal.npc) });
    case 'slay':
      return tr('hud.track.slay', { name: getEntity(goal.boss)?.name ?? goal.boss });
    case 'reach':
      return tr('hud.track.reach', { name: worldLayout().signs.find((s) => s.id === goal.sign)?.name ?? goal.sign });
    case 'read':
      return tr('hud.track.read', { name: goal.doc });
    case 'seals':
      return tr('hud.track.seals', { n: Math.min(seals, goal.count), of: goal.count });
    case 'ending':
      return tr('hud.track.ending', { name: worldLayout().signs.find((s) => s.id === COURT_SIGN)?.name ?? COURT_SIGN });
    case 'step': {
      const step = DISCOVERIES[goal.boss]?.steps[goal.i];
      if (step?.kind === 'offer') return upper(step.label); // (the altar's own words: "lay your blood on the stone")
      return tr(step?.kind === 'rite' ? 'hud.track.rite' : step?.kind === 'vigil' ? 'hud.track.vigil' : 'hud.track.step');
    }
  }
}

/** How far, to read: metres to the nearest one under a hundred, to five under a kilometre, then in tenths of a kilometre. */
export function distanceWords(metres: number): string {
  if (metres < 100) return `${Math.round(metres)} m`;
  if (metres < 1000) return `${Math.round(metres / 5) * 5} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
