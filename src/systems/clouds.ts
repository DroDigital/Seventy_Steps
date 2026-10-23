/**
 * Clouds (round 70: asked for "toxic or hallucinogenic clouds"): banks of air that rise about a horror and drift after the investigator,
 * slower than a walk. A toxic one hurts the body a tick at a time, as a pool does (hazards.ts); a dreaming one takes the mind, a few points
 * a second while the investigator stands in it, weighed as the horror's roar is (`cloudDread`, sanity.ts). They thin out when their horror falls.
 * Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import { distXZ } from '../core/geom';
import type { CloudDef } from '../data/moves';
import { SIM } from '../data/tuning';
import { targetOf, groundNear } from './specials';
import type { Game } from './components';

/** The banks rise about the horror, on the side of its prey and spread across it. */
export function rise(g: Game, id: Entity, d: CloudDef): void {
  const c = g.ecs.c;
  const tr = c.transform.get(id)!;
  const quarry = c.transform.get(targetOf(g, id))?.pos;
  const faced = quarry ? Math.atan2(quarry.x - tr.pos.x, quarry.z - tr.pos.z) : tr.yaw;
  const out = (c.body.get(id)?.radius ?? 0.5) + d.radius * 0.6;
  const faction = c.combatant.get(id)?.faction ?? 'enemy';
  const arena = c.fight.get(id)?.arena;
  for (let i = 0; i < d.count; i++) {
    const a = faced + (d.count > 1 ? (i / (d.count - 1) - 0.5) * 1.3 : 0);
    const at = groundNear(g, { x: tr.pos.x + Math.sin(a) * out, z: tr.pos.z + Math.cos(a) * out }, [0, 0], 0.3, arena);
    const e = g.ecs.spawn();
    const pos = { x: at.x, y: g.world.ground(at.x, at.z), z: at.z };
    c.transform.set(e, { pos, prev: { ...pos }, yaw: 0, prevYaw: 0 });
    c.hazard.set(e, { owner: id, faction, radius: d.radius, damage: d.damage, tick: d.tick, life: d.life, next: d.tick, cloud: d.kind, drift: d.drift / SIM.hz, total: d.life, ...(d.mind > 0 && { mind: d.mind }) });
    if (i === 0) g.events.emit('Clouded', { at: { ...pos }, by: id, kind: d.kind });
  }
}

/** A bank creeps toward its owner's prey, and does not sit on it: it keeps a little off, so that the investigator who stands still is in it but one who walks is not. */
export function drift(g: Game, e: Entity): void {
  const c = g.ecs.c;
  const h = c.hazard.get(e);
  const tr = c.transform.get(e);
  if (!h?.drift || !tr) return;
  const owner = h.owner;
  if (!c.transform.has(owner) || c.dead.has(owner) || (c.health.get(owner)?.hp ?? 0) <= 0) {
    h.life = Math.min(h.life, 40); // its horror is gone: it thins
    return;
  }
  const to = c.transform.get(targetOf(g, owner))?.pos;
  if (!to) return;
  const d = distXZ(tr.pos, to);
  if (d < 0.5) return;
  const step = Math.min(h.drift, d);
  tr.prev = { ...tr.pos };
  tr.pos.x += ((to.x - tr.pos.x) / d) * step;
  tr.pos.z += ((to.z - tr.pos.z) / d) * step;
  tr.pos.y = g.world.ground(tr.pos.x, tr.pos.z);
}
