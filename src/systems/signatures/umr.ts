/**
 * 'Umr at-Tawil, the Guide (spec §3E and the endings): in its last phase it yields. It strikes no
 * more. E within reach turns it away and opens the Gate ahead of it; E at the Gate passes through
 * with it (one of the three endings). Strike it down instead, and the way goes on to Yog-Sothoth
 * and Azathoth's Court.
 */

import { distXZ, yawOf } from '../../core/geom';
import { GATE_AHEAD, GATE_REACH, gatePoint } from '../../data/finale';
import { resolveCapsule } from '../../world/colliders';
import type { Fight, Game } from '../components';
import { endGame } from '../endings';
import type { Signature } from '../signatures';

const REACH = 8; // metres from the Guide where its offer is heard

const yields = (f: Fight): boolean => f.phase === f.script.phases.length - 1;

/** Find a gate the investigator can walk to without crossing the veil or a solid. */
function reachableGate(g: Game, f: Fight, guide: { x: number; z: number }, yaw: number): { x: number; z: number } {
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const body = g.ecs.c.body.get(g.player.id);
  const radius = body?.radius ?? 0.4;
  const height = body?.height ?? 1.8;
  const clear = (at: { x: number; z: number }): boolean => {
    const distance = distXZ(me, at);
    const steps = Math.max(1, Math.ceil(distance / 0.2));
    for (let i = 1; i <= steps; i++) {
      const x = me.x + (at.x - me.x) * i / steps;
      const z = me.z + (at.z - me.z) * i / steps;
      if (Math.hypot(x - f.arena.x, z - f.arena.z) > f.arena.radius - radius) return false;
      const pos = { x, y: g.world.ground(x, z), z };
      resolveCapsule(g.world, pos, radius, height);
      if (Math.hypot(pos.x - x, pos.z - z) > 0.01) return false;
    }
    return true;
  };
  // Prefer the Guide's original direction and distance, then turn toward open ground.
  const turns = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, 3 * Math.PI / 4, -3 * Math.PI / 4, Math.PI];
  for (const distance of [GATE_AHEAD, 6, 3]) {
    for (const turn of turns) {
      const direction = yaw + turn;
      const at = distance === GATE_AHEAD ? gatePoint(guide, direction) : { x: guide.x + Math.sin(direction) * distance, z: guide.z + Math.cos(direction) * distance };
      if (clear(at)) return at;
    }
  }
  // Even a crowded corner must not lock the ending: the current position is already reachable.
  return { x: me.x, z: me.z };
}

export const UMR_SIGNATURE: Signature = {
  step(g, e, f) {
    if (!yields(f)) return;
    g.ecs.c.brain.get(e)!.cooldown = Infinity; // it strikes no more
    if (f.sig.told) return;
    f.sig.told = 1; // round 70: the offer was only a prompt within eight metres, and a blow in the middle of a fight finished it unseen
    g.events.emit('Notice', { text: "'UMR AT-TAWIL YIELDS · {interact} NEAR HIM TO PASS THE GATE WITH HIM, OR STRIKE HIM DOWN" });
  },
  action(g, e, f) {
    if (!yields(f) || g.overworld?.ending) return null;
    const him = g.ecs.c.transform.get(e)!;
    const me = g.ecs.c.transform.get(g.player.id)!;
    if (f.sig.gate === 1) {
      if (Math.hypot(me.pos.x - f.sig.gx!, me.pos.z - f.sig.gz!) > GATE_REACH) return null;
      return { label: 'step through the Gate', run: () => endGame(g, 'silver_key') };
    }
    const gap = distXZ(him.pos, me.pos) - (g.ecs.c.body.get(e)?.radius ?? 0);
    if (gap > REACH) return null;
    return {
      label: 'follow the Guide',
      run() {
        const away = yawOf(him.pos.x - me.pos.x, him.pos.z - me.pos.z);
        const at = reachableGate(g, f, him.pos, away);
        him.yaw = him.prevYaw = yawOf(at.x - him.pos.x, at.z - him.pos.z);
        f.sig.gate = 1;
        f.sig.gx = at.x;
        f.sig.gz = at.z;
      },
    };
  },
  status: (_g, _e, f) => (yields(f) ? 'IT YIELDS' : null),
};
