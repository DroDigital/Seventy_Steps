/**
 * 'Umr at-Tawil, the Guide (spec §3E and the endings): in its last phase it yields. It strikes no
 * more. E within reach turns it away and opens the Gate ahead of it; E at the Gate passes through
 * with it (one of the three endings). Strike it down instead, and the way goes on to Yog-Sothoth
 * and Azathoth's Court.
 */

import { distXZ, yawOf } from '../../core/geom';
import { GATE_REACH, gatePoint } from '../../data/finale';
import type { Fight } from '../components';
import { endGame } from '../endings';
import type { Signature } from '../signatures';

const REACH = 8; // metres from the Guide where its offer is heard

const yields = (f: Fight): boolean => f.phase === f.script.phases.length - 1;

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
        him.yaw = him.prevYaw = yawOf(him.pos.x - me.pos.x, him.pos.z - me.pos.z);
        const at = gatePoint(him.pos, him.yaw);
        f.sig.gate = 1;
        f.sig.gx = at.x;
        f.sig.gz = at.z;
      },
    };
  },
  status: (_g, _e, f) => (yields(f) ? 'IT YIELDS' : null),
};
