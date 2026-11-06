/**
 * The Court's two endings, done in the world (round 98): E on the silver key seals the Gate, E on the
 * tall man attends him. The sign's rest is untouched (the key's reach stops short of the rise). Pure.
 */

import { yawOf } from '../core/geom';
import { courtPlaces, KEY_REACH, MAN_REACH } from '../data/finale';
import { worldLayout } from '../world/placements';
import type { Game } from './components';
import { COURT_SIGN, courtOpen, endGame, ended } from './endings';
import type { FightAction } from './signatures';

const court = () => worldLayout().signs.find((s) => s.id === COURT_SIGN);

/** What E does at the key or the tall man, once Azathoth slumbers and the dream has not ended. */
export function finaleAction(g: Game): FightAction | null {
  if (!courtOpen(g) || ended(g)) return null;
  const sign = court();
  const me = g.ecs.c.transform.get(g.player.id);
  if (!sign || !me) return null;
  const at = courtPlaces(sign);
  const near = (p: { x: number; z: number }, reach: number): boolean => Math.hypot(me.pos.x - p.x, me.pos.z - p.z) <= reach;
  if (near(at.key, KEY_REACH)) {
    return {
      label: 'close your hand on the key',
      run() {
        me.yaw = me.prevYaw = yawOf(sign.x - me.pos.x, sign.z - me.pos.z);
        endGame(g, 'seal');
      },
    };
  }
  if (near(at.man, MAN_REACH)) {
    return {
      label: 'attend the tall man',
      run() {
        me.yaw = me.prevYaw = yawOf(at.man.x - me.pos.x, at.man.z - me.pos.z);
        endGame(g, 'herald');
      },
    };
  }
  return null;
}
