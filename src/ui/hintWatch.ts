/**
 * What to tell a new investigator before it costs them (round 46, the first hour): hints that wait to be struck, or to fall, came
 * too late for the things a first fight, a first empty breath and a first horror's mist teach hardest. These are looked at a
 * couple of times a second: a foe closing in, the breath gone, a wall of fog near, a person to talk to, a doorway that only insight
 * shows, a relic found, a weapon found late beside a reinforced one. Pure: the game is read,
 * nothing is changed (ui/hints.ts raises the ones not yet shown).
 */

import { distXZ } from '../core/geom';
import { FOG_REACH, fogNear } from '../systems/fogGates';
import { TOOLTIPS } from '../data/tuning';
import { isAbsent, type Game } from '../systems/components';
import { owned } from '../systems/relics';

export type Watched = 'fight' | 'breath' | 'fog' | 'talk' | 'passage' | 'relic' | 'transfer';

const NEAR = { foe: 32, fog: 14, person: 7, passage: 10 }; // metres

/** An entry into a gate's interaction range. A small step back rearms it; standing still never repeats it. */
export function createGateHint(): (g: Game) => boolean {
  let gate: string | null = null;
  return (g) => {
    const p = g.ecs.c.transform.get(g.player.id)?.pos;
    if (!p || g.player.fogPass || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return false;
    const near = fogNear(g, p, FOG_REACH + TOOLTIPS.gateReset);
    if (!near) gate = null;
    if (!near || near.gap > FOG_REACH || near.wall.id === gate) return false;
    gate = near.wall.id;
    return true;
  };
}

/** Whether a doorway or bridge that insight alone shows stands open within reach of `me`: the first the investigator is shown. */
function nearPassage(g: Game, me: { x: number; z: number }): boolean {
  const c = g.ecs.c;
  for (const id of c.piece.keys()) {
    const l = c.layer.get(id);
    const at = c.transform.get(id)?.pos;
    if (l?.shown && l.minInsight !== undefined && at && distXZ(at, me) <= NEAR.passage) return true;
  }
  return false;
}

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
  if (nearPassage(g, me)) out.push('passage');
  if (g.overworld && owned(g).length) out.push('relic');
  if (g.player.arms.length > 1 && Object.values(g.player.reinforced).some((n) => n > 0)) out.push('transfer');
  return out;
}
