/**
 * Foes that lie in wait (round 125, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md): a dungeon room's
 * `lurk` foes are laid hidden, as an ambusher of the open ground hides, unseen, untouched and unlocked-on, and spring at an investigator
 * they see within `AMBUSH.reach` (or who brushes past them unseen, close enough to touch): they rise into view (render/creatureFx.ts) and
 * are on them at once, and from then on hunt as any foe of their kind (they do not lie down again). A rest brings them back as they were,
 * waiting. The ambushers and burrowers of the open ground keep their own reveal. Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import { distXZ, type V3 } from '../core/geom';
import { AMBUSH } from '../data/tuning';
import type { Brain, Game } from './components';

/** The distance at which a body brushing past one lying in wait is felt, seen or not. */
const BRUSH = 2.2;

/** Lays a foe in wait: hidden until it springs. */
export function lieInWait(g: Game, e: Entity): void {
  const br = g.ecs.c.brain.get(e);
  if (!br || br.def.archetype === 'ally') return;
  br.state = 'hidden';
  br.lurk = AMBUSH.reach;
}

/**
 * Whether a hidden foe at `at` springs now: one lying in wait at a quarry it sees within its reach, or at the investigator brushing past;
 * an ambusher or a burrower of the open ground at a quarry within its own `reveal`. One lying in wait is no longer, once it has sprung.
 */
export function springs(g: Game, id: Entity, br: Brain, reveal: number, quarry: Entity | null, tp: V3 | undefined, at: V3): boolean {
  if (br.lurk === undefined) return quarry !== null && !!tp && distXZ(at, tp) <= reveal;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  const seen = quarry !== null && !!tp && distXZ(at, tp) <= br.lurk;
  const brushed = !!me && distXZ(at, me) <= BRUSH && Math.abs(me.y - at.y) < 2;
  if (!seen && !brushed) return false;
  delete br.lurk;
  if (!seen) br.target = g.player.id;
  g.events.emit('AmbushSprung', { entity: id, x: at.x, y: at.y, z: at.z });
  return true;
}
