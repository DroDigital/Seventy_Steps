/**
 * What the boss music reads of the world (round 44): the fights engaged, each with its phase and whether
 * it is the last, and the theme of the nearest living horror not yet engaged within BOSS_MUSIC.warm
 * metres of its arena's ring, so that its file is decoded before the fight (dread.ts loops over
 * `fight` the same way). Read-only on the simulation.
 */

import { BOSS_MUSIC, bossTrackOf, type BossTrackId } from '../../data/bossMusic';
import { engagedFights } from '../../systems/bossFight';
import type { Game } from '../../systems/components';
import type { Scored } from './bossPlan';

export interface BossScene {
  fights: Scored[];
  warm: BossTrackId | null;
}

export function bossScene(g: Game): BossScene {
  const fights = engagedFights(g).map(([, f]) => ({ id: f.id, phase: f.phase, last: f.phase >= f.script.phases.length - 1 }));
  const me = g.overworld ? g.ecs.c.transform.get(g.player.id)?.pos : undefined;
  let [warm, nearest] = [null as BossTrackId | null, BOSS_MUSIC.warm];
  if (me) {
    for (const [id, f] of g.ecs.c.fight) {
      const track = bossTrackOf(f.id);
      if (!track || f.engaged || f.script.unseen || g.ecs.c.dead.has(id) || (g.ecs.c.health.get(id)?.hp ?? 0) <= 0) continue;
      const past = Math.hypot(f.arena.x - me.x, f.arena.z - me.z) - f.arena.radius;
      if (past < nearest) [warm, nearest] = [track, past];
    }
  }
  return { fights, warm };
}
