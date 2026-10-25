/**
 * A calm moment (round 78): the picture's dread keeps out of a fight, a talk and a cutscene, so that it never makes a foe harder to read. Asked
 * every frame by the eyes, the shade and the darters, so it allocates nothing and is worked out once a frame for all of them. Read-only.
 */

import type { Game } from '../systems/components';
import { fighting } from '../systems/sanity';

/** Whether a horror's fight is engaged (bossFight.ts `engagedFights`, without the list). */
export function fightEngaged(g: Game): boolean {
  const { fight, dead, health } = g.ecs.c;
  for (const [e, f] of fight) if (f.engaged && !dead.has(e) && (health.get(e)?.hp ?? 0) > 0) return true;
  return false;
}

const memo = new WeakMap<Game, { at: number; calm: boolean }>();

/** No fight (a blow lately struck or taken, a foe hunting near, a horror engaged), no talk and no cutscene; worked out once for each `at` (seconds of render time). */
export function calmOf(g: Game, at: number): boolean {
  const known = memo.get(g);
  if (known && known.at === at) return known.calm;
  const calm = !g.cutscene && g.player.listening === null && !fightEngaged(g) && !fighting(g);
  memo.set(g, { at, calm });
  return calm;
}
