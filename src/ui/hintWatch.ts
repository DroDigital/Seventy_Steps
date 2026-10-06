/**
 * What to tell a new investigator before it costs them (round 46, the first hour): hints that wait to be struck, or to fall, came
 * too late for the things a first fight, a first empty breath and a first horror's mist teach hardest. These are looked at a
 * couple of times a second: a foe closing in, the breath gone, a wall of fog near, a person to talk to. Pure: the game is read,
 * nothing is changed (ui/hints.ts raises the ones not yet shown).
 */

import { distXZ } from '../core/geom';
import { fogNear } from '../systems/fogGates';
import { isAbsent, type Game } from '../systems/components';

export type Watched = 'fight' | 'breath' | 'fog' | 'talk';

const NEAR = { foe: 32, fog: 14, person: 7 }; // metres

export function watch(g: Game): Watched[] {
  const c = g.ecs.c;
  const me = c.transform.get(g.player.id)?.pos;
  if (!me || (c.health.get(g.player.id)?.hp ?? 0) <= 0) return [];
  const out: Watched[] = [];
  for (const [id, br] of c.brain) {
    if (br.target !== g.player.id || br.state !== 'engage' || isAbsent(g, id) || c.minion.has(id)) continue;
    const at = c.transform.get(id)?.pos;
    if (at && distXZ(at, me) <= NEAR.foe) {
      out.push('fight');
      break;
    }
  }
  if ((c.stamina.get(g.player.id)?.value ?? 1) < 1) out.push('breath');
  if (fogNear(g, me, NEAR.fog)) out.push('fog');
  for (const id of c.npc.keys()) {
    const at = c.transform.get(id)?.pos;
    if (at && distXZ(at, me) <= NEAR.person) {
      out.push('talk');
      break;
    }
  }
  return out;
}
