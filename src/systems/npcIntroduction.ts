/** A speaking roster ally waits unharmed at their first meeting place until their introduction. */

import type { Entity } from '../core/ecs';
import { npcDef } from '../data/npcs';
import type { Game } from './components';

export function awaitsIntroduction(g: Game, e: Entity): boolean {
  const speaker = g.ecs.c.npc.get(e);
  return !!g.overworld && !!speaker && !!npcDef(speaker)?.creature && !g.overworld.met.has(speaker);
}
