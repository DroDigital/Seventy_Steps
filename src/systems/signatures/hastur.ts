/**
 * Hastur (spec §3E): its name flickers onto the HUD as sanity falls in its realm, Yuggoth; each band
 * lost there is one appearance. The third calls it: it rises before the investigator, and from then
 * on its arena holds it too (population.ts spawns a called boss). Round 68: where it rose is no arena of its own, and the one it
 * killed (or who got away) finds it back in its arena, the call spent: `reset`. Pure: no Three.js.
 */

import { distXZ, yawOf } from '../../core/geom';
import { HASTUR } from '../../data/tuning';
import { worldLayout } from '../../world/placements';
import { setArena } from '../bossFight';
import type { Game } from '../components';
import { spawnCreature } from '../creatures';
import { bandIndex } from '../sanity';
import type { Signature } from '../signatures';

const ID = 'hastur';
const SPAWN = `boss:${ID}`;

/** The third appearance: it rises before the investigator, and its fight is held where it rose. */
function call(g: Game): void {
  const ow = g.overworld!;
  ow.called.add(ID);
  if (ow.alive.has(SPAWN) || ow.slain.has(SPAWN)) return;
  const tr = g.ecs.c.transform.get(g.player.id)!;
  const [x, z] = [tr.pos.x + Math.sin(tr.yaw) * HASTUR.rise, tr.pos.z + Math.cos(tr.yaw) * HASTUR.rise];
  const e = spawnCreature(g, ID, { x, z, yaw: yawOf(tr.pos.x - x, tr.pos.z - z) });
  if (e === undefined) return;
  g.ecs.c.origin.set(e, SPAWN);
  ow.alive.set(SPAWN, e);
  const site = worldLayout().spawns.find((s) => s.id === SPAWN)?.arena;
  setArena(g, e, { x, z, radius: site?.radius ?? 26 });
}

export function registerHastur(g: Game): void {
  g.events.on('SanityBandChanged', ({ from, to }) => {
    const ow = g.overworld;
    if (!ow || ow.region !== HASTUR.region || bandIndex(to) <= bandIndex(from) || ow.called.has(ID)) return;
    ow.named++;
    g.events.emit('Named', { name: 'HASTUR', count: ow.named });
    if (ow.named >= HASTUR.names) call(g);
  });
}

/**
 * It rose where it was called, and its fight was held there. When that fight is over without it (the investigator fell, or fled past its
 * hold) it goes home: to its own arena, as every other horror is found, and its brain's home with it, so it does not walk back to the ruins.
 */
export const HASTUR_SIGNATURE: Signature = {
  reset(g, e, f) {
    const site = worldLayout().spawns.find((s) => s.id === SPAWN);
    const [tr, br] = [g.ecs.c.transform.get(e), g.ecs.c.brain.get(e)];
    if (!site || !tr || !f.arena || distXZ(tr.pos, site.at) < 1) return;
    const y = g.world.ground(site.at.x, site.at.z);
    tr.pos = { x: site.at.x, y, z: site.at.z };
    tr.prev = { ...tr.pos };
    tr.yaw = tr.prevYaw = site.at.yaw;
    g.ecs.c.home.set(e, { ...site.at });
    if (site.arena) setArena(g, e, site.arena);
    if (br) Object.assign(br, { state: 'idle', target: null, aware: 0, lost: 0 });
  },
};
