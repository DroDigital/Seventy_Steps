/**
 * What a person does while they wait, and where (data/npcActs.ts has it for the people met): and for the trader at the lamps, who has no entry,
 * Morgan's — leaning on the street lamp raised at his back (world/traderPlan.ts), at the place his region gave him. Pure: no Three.js.
 */

import { ACTS, type Act } from '../data/npcActs';
import { traderSpot } from '../world/traderAt';

const traders = new Map<string, Act>();

export function actFor(id: string): Act | undefined {
  const own = ACTS[id];
  if (own) return own;
  let act = traders.get(id);
  if (!act) {
    const t = traderSpot(id);
    if (t) traders.set(id, (act = { kind: 'lounge', post: { x: t.x, z: t.z, yaw: t.yaw, fixture: 'post', rise: ACTS.morgan.post!.rise } }));
  }
  return act;
}
