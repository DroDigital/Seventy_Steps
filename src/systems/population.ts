/**
 * Population (spec §3D): the creatures of the chunks around the investigator. Spawn points in the
 * loaded 5 × 5 chunks get their creature, nearest chunks first and never more than 60 alive (the AI
 * budget; a horror takes a place in a full house, the lesser foe farthest away making room), unless it was killed since the last rest or, for a boss, slain for good. A creature that
 * strays beyond the 7 × 7 is let go, remembering its wounds for when it stands again (only resting
 * or dying makes a foe whole), and the dead are cleared away after their death throes. Also announces each region the
 * investigator enters. In the demo, a spawn point beyond its realms' border is never filled (systems/demo.ts). Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import { getEntity } from '../data/registry';
import { WORLD } from '../data/tuning';
import { chunkContent, forgetChunks } from '../world/chunks';
import { chunksAround, chunkSpan } from '../world/streaming';
import { chunkKey, chunkOf, regionAt } from '../world/worldMap';
import { setArena } from './bossFight';
import type { Game } from './components';
import { spawnCreature } from './creatures';
import { demoAllows } from './demo';
import { voice } from './npcs';
import { bossAwake } from './sealCount';

const RESCAN = 30; // frames between looks at spawn points when nothing has changed

export function populationSystem(g: Game): void {
  const ow = g.overworld;
  if (!ow) return;
  const c = g.ecs.c;
  const pp = c.transform.get(g.player.id)!.pos;
  const [pcx, pcz] = [chunkOf(pp.x), chunkOf(pp.z)];
  const key = chunkKey(pcx, pcz);
  if (key !== ow.chunk) {
    ow.chunk = key;
    ow.dirty = true;
    forgetChunks((cx, cz) => chunkSpan(cx, cz, pcx, pcz) <= WORLD.keep + 1);
    const r = regionAt(pp.x, pp.z);
    if (r && r.id !== ow.region) {
      ow.region = r.id;
      g.events.emit('RegionEntered', { region: r.id, name: r.name });
    }
  }
  /** Lets a creature go, remembering its wounds for when it stands again. */
  const release = (id: string, e: Entity): void => {
    ow.alive.delete(id);
    ow.dirty = true;
    const h = c.health.get(e);
    if (h && h.hp > 0 && h.hp < h.max && !c.dead.has(e)) ow.wounds.set(id, h.hp / h.max); // it comes back as wounded
    if (c.transform.has(e)) g.ecs.despawn(e);
  };
  for (const [id, e] of [...ow.alive]) {
    const tr = c.transform.get(e);
    if (tr && !c.dead.has(e) && chunkSpan(chunkOf(tr.pos.x), chunkOf(tr.pos.z), pcx, pcz) <= WORLD.keep) continue;
    release(id, e);
  }
  /** In a full house, lets the lesser foe farthest from the investigator go; false if there is none. */
  const makeRoom = (): boolean => {
    let [far, gap] = [null as [string, Entity] | null, -1];
    for (const [id, e] of ow.alive) {
      const tr = c.transform.get(e);
      const d = id.startsWith('boss:') ? -1 : tr ? Math.hypot(tr.pos.x - pp.x, tr.pos.z - pp.z) : Infinity;
      if (d > gap) [far, gap] = [[id, e], d];
    }
    if (!far) return false;
    release(...far);
    return true;
  };
  if (!ow.dirty && g.frame % RESCAN !== 0) return;
  ow.dirty = false;
  for (const ch of chunksAround(pcx, pcz, WORLD.load)) {
    for (const s of chunkContent(ch.cx, ch.cz).spawns) {
      if (ow.alive.size >= WORLD.maxActive && !s.id.startsWith('boss:')) continue; // a full house keeps out the lesser foes (and the horrors further on are still looked at)
      if (ow.alive.has(s.id) || ow.killed.has(s.id) || ow.slain.has(s.id)) continue;
      if (!demoAllows(g, s.at)) continue; // at the demo's edge the loaded chunks reach beyond its border: what lives there is not brought in (it would see the investigator, and come over)
      const script = getEntity(s.entity)?.bossScript;
      if (script?.joins && ow.slain.has(`boss:${script.joins.with}`)) {
        ow.slain.add(s.id); // its leader fell before it was streamed in (or in a save from before paired deaths)
        continue;
      }
      if (script?.called && !ow.called.has(s.entity)) continue; // not called yet: its arena waits empty
      if (!bossAwake(g, s.entity)) continue; // the one before it still stands (the Beyond's order): its arena waits empty
      if (ow.alive.size >= WORLD.maxActive && !makeRoom()) continue; // a horror is not kept from its own arena by a full house (round 61: the world is denser): the lesser foe farthest away makes room
      const e = spawnCreature(g, s.entity, s.at, s.variant);
      if (e === undefined) continue;
      const wound = ow.wounds.get(s.id);
      if (wound !== undefined) {
        const h = c.health.get(e)!;
        h.hp = Math.max(1, h.max * wound);
        ow.wounds.delete(s.id);
      }
      if (s.arena) setArena(g, e, s.arena);
      voice(g, e, s.entity);
      c.origin.set(e, s.id);
      ow.alive.set(s.id, e);
    }
  }
}
