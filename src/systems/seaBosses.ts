/**
 * Dagon and Hydra share Y'ha-nthlei's temple. Their solo scripts must leave a readable opening
 * when played together: the other may begin its wind-up only after the current attack's full
 * recovery and 24 more frames of rest. Each boss still keeps its own cooldown, so they take turns
 * without doubling the solo attack rate or taking away the opportunity to counterattack.
 * Lingering pools and marked tentacles keep their own visible warnings during the next turn;
 * removing Dagon's darkness lets those ground patterns remain readable alongside the other boss.
 */
import type { Entity } from '../core/ecs';
import { distXZ } from '../core/geom';
import { ATTACKS } from '../data/attacks';
import { SEA_BOSSES } from '../data/bossTuning';
import type { AttackId } from '../data/schema';
import { isAbsent, type Game } from './components';

const PARTNER: Readonly<Record<string, string>> = { father_dagon: 'mother_hydra', mother_hydra: 'father_dagon' };

/** Only the living, engaged partner sharing this arena can hold a sea boss's next attack. */
export function seaPartnerBusy(g: Game, id: Entity, target: Entity): boolean {
  const c = g.ecs.c;
  const f = c.fight.get(id);
  const partner = f && PARTNER[f.id];
  if (!f || !partner || target !== g.player.id) return false;
  for (const [other, fight] of c.fight) {
    if (fight.id !== partner || !fight.engaged || isAbsent(g, other) || (c.health.get(other)?.hp ?? 0) <= 0 || c.brain.get(other)?.target !== target) continue;
    const at = c.transform.get(other)?.pos;
    if (!at || distXZ(f.arena, at) > f.arena.radius || distXZ(f.arena, fight.arena) > Math.min(f.arena.radius, fight.arena.radius)) continue;
    const actor = c.actor.get(other);
    if (!actor) continue;
    if (actor.move && ATTACKS[actor.move as AttackId]) return true; // including a vortex and its chained burst
    if (actor.move === null && actor.last && ATTACKS[actor.last as AttackId] && actor.idle < SEA_BOSSES.rest) return true;
    // A stagger, parry or death is an opening, not an attack. No stored turn survives a reset.
  }
  return false;
}
