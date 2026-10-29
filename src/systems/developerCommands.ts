/** Developer showcase commands. Showcase creatures use the real combat systems but do not grant
 * rewards or mark encounters as completed. This module owns only the creatures it creates. */
import type { Entity } from '../core/ecs';
import { yawOf } from '../core/geom';
import type { Place } from '../data/arena';
import { ENTITIES, getEntity, variantOf, type Variant } from '../data/registry';
import { resolveCapsule } from '../world/colliders';
import { gatePlan } from '../world/gatePlan';
import { worldLayout } from '../world/placements';
import { resetFight } from './bossFight';
import { teleport } from './checkpoints';
import type { Game } from './components';
import { bodyOf, resolveCreature, spawnCreature } from './creatures';
import { demoAllows } from './demo';
import { setLock } from './lockOn';

export interface DeveloperCommand { command: string; description: string }
export interface DeveloperFlight { setFlight(on: boolean): void; flightEnabled(): boolean }
export interface DeveloperCommands {
  commands: DeveloperCommand[];
  execute(line: string): string;
  /** Call when leaving the game, not when closing the console. */
  dispose(): void;
}

const LIMIT = 20;
const foes = ENTITIES.filter((d) => d.tier !== 'ally');
const boss = (id: string): boolean => !!(getEntity(id)?.bossScript || getEntity(id)?.bossVariant?.bossScript);

/** The actual threshold positions are shared with the fog and candle systems. */
function destinations(): Map<string, { entrance: Place; room: Place; name: string }> {
  const w = worldLayout();
  const result = new Map<string, { entrance: Place; room: Place; name: string }>();
  for (const fog of gatePlan(w).fogs) for (const id of fog.bosses) {
    if (result.has(id)) continue;
    const spawn = w.spawns.find((s) => s.entity === id && s.arena);
    if (!spawn?.arena) continue;
    const arena = spawn.arena;
    const dungeon = w.dungeons.find(({ layout }) => layout.rooms.some((r) => r.def.boss?.includes(id)));
    const room = dungeon?.layout.rooms.find((r) => r.def.boss?.includes(id));
    let inside: Place;
    if (room) {
      // Enter the hall from its doorway, clear of a boss occupying its centre.
      const dx = room.x - fog.x, dz = room.z - fog.z, len = Math.hypot(dx, dz) || 1;
      inside = { x: fog.x + dx / len * 3, z: fog.z + dz / len * 3, yaw: yawOf(dx, dz) };
    } else {
      // An open arena's gate can be outside the court, so use the near edge of the fight itself.
      const dx = fog.stake.x - arena.x, dz = fog.stake.z - arena.z, len = Math.hypot(dx, dz) || 1;
      const distance = Math.max(1, arena.radius * 0.7);
      inside = { x: arena.x + dx / len * distance, z: arena.z + dz / len * distance, yaw: yawOf(-dx, -dz) };
    }
    result.set(id, { entrance: { ...fog.stake }, room: inside, name: getEntity(id)?.name ?? id });
  }
  // A hidden threshold has no fog wall (for example Kadath), but its room and
  // doorway still belong to the dungeon layout. Offer both sides of that doorway.
  for (const spawn of w.spawns) {
    if (!spawn.id.startsWith('boss:') || !spawn.arena || result.has(spawn.entity)) continue;
    const dungeon = w.dungeons.find(({ layout }) => layout.rooms.some((r) => r.def.boss?.includes(spawn.entity)));
    const room = dungeon?.layout.rooms.find((r) => r.def.boss?.includes(spawn.entity));
    const door = room && dungeon?.layout.doors.find((d) => d.b === room || d.a === room);
    if (room && door) {
      const dx = room.x - door.x, dz = room.z - door.z, len = Math.hypot(dx, dz) || 1;
      const ux = dx / len, uz = dz / len, yaw = yawOf(dx, dz);
      result.set(spawn.entity, {
        entrance: { x: door.x - ux * 3, z: door.z - uz * 3, yaw },
        room: { x: door.x + ux * 3, z: door.z + uz * 3, yaw },
        name: getEntity(spawn.entity)?.name ?? spawn.entity,
      });
    } else {
      // Keep unusual future sites discoverable even if they have no threshold.
      const a = spawn.arena;
      result.set(spawn.entity, {
        entrance: { x: a.x, z: a.z + a.radius + 3, yaw: Math.PI },
        room: { x: a.x, z: a.z + a.radius * 0.7, yaw: Math.PI },
        name: getEntity(spawn.entity)?.name ?? spawn.entity,
      });
    }
  }
  return result;
}

export function createDeveloperCommands(g: Game, flight: DeveloperFlight): DeveloperCommands {
  const spawned = new Set<Entity>();
  const places = g.overworld ? destinations() : new Map<string, { entrance: Place; room: Place; name: string }>();
  const commands: DeveloperCommand[] = [
    { command: 'help', description: 'Show command syntax' },
    { command: 'list bosses', description: 'List boss IDs' },
    { command: 'list enemies', description: 'List enemy IDs' },
    { command: 'list places', description: 'List boss destinations' },
    { command: 'where', description: 'Show current position' },
    { command: 'fly on', description: 'Enable free-flight camera' },
    { command: 'fly off', description: 'Return to the player camera' },
    { command: 'clear', description: 'Remove showcase creatures' },
    ...[...places].flatMap(([id, place]) => (['entrance', 'room'] as const).map((part) => ({ command: `teleport ${id} ${part}`, description: `${place.name} · ${part}` }))),
    ...foes.flatMap((def) => [
      { command: `spawn ${def.id}`, description: `Spawn ${def.name}` },
      ...(def.bossVariant ? [{ command: `spawn ${def.id} boss`, description: `Spawn ${variantOf(def, 'boss')!.name} · boss variant` }] : []),
      ...(def.eldritchVariant ? [{ command: `spawn ${def.id} eldritch`, description: `Spawn ${variantOf(def, 'eldritch')!.name} · eldritch variant` }] : []),
    ]),
  ];
  const clear = (): number => {
    let count = 0;
    for (const e of spawned) {
      if (!g.ecs.c.transform.has(e)) continue;
      if (g.lock.target === e) setLock(g, null);
      const f = g.ecs.c.fight.get(e);
      if (f) resetFight(g, e, f);
      g.ecs.despawn(e);
      count++;
    }
    spawned.clear();
    return count;
  };
  const execute = (line: string): string => {
    const [cmd, ...args] = line.trim().toLowerCase().split(/\s+/);
    if (!cmd) return 'Enter a command, or type help.';
    if (cmd === 'help' && !args.length) return 'Commands: help; list bosses|enemies|places; teleport <boss_id> [entrance|room]; spawn <enemy_id> [boss|eldritch]; fly [on|off]; where; clear. Showcase creatures grant no rewards or progression.';
    if (cmd === 'where' && !args.length) {
      const p = g.ecs.c.transform.get(g.player.id)!.pos;
      return `Player: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}.`;
    }
    if (cmd === 'list' && args.length === 1) {
      if (args[0] === 'places') return places.size ? [...places].map(([id, p]) => `${id} (${p.name})`).join(', ') : 'Boss destinations are available in the open world.';
      if (args[0] === 'bosses' || args[0] === 'enemies') return foes.filter((d) => args[0] === 'bosses' ? boss(d.id) : !boss(d.id)).map((d) => `${d.id} (${d.name})`).join(', ');
      return 'Usage: list bosses|enemies|places';
    }
    if (cmd === 'fly' && args.length <= 1) {
      if (args[0] && args[0] !== 'on' && args[0] !== 'off') return 'Usage: fly [on|off]';
      const on = args[0] ? args[0] === 'on' : !flight.flightEnabled();
      flight.setFlight(on);
      return `Free-flight camera ${on ? 'enabled' : 'disabled'}.`;
    }
    if (cmd === 'clear' && !args.length) return `Removed ${clear()} showcase creature(s).`;
    if (cmd === 'teleport') {
      if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== 'entrance' && args[1] !== 'room')) return 'Usage: teleport <boss_id> [entrance|room]';
      const dest = places.get(args[0]);
      if (!dest) return 'Unknown or unavailable boss destination. Use list places.';
      if (g.cutscene || g.player.falling || g.ecs.c.actor.get(g.player.id)?.move === 'death') return 'Cannot teleport during a cutscene, while falling, or while dead.';
      const part = args[1] === 'room' ? 'room' : 'entrance';
      const at = dest[part];
      if (!demoAllows(g, at)) return 'That destination is outside the demo.';
      const p = { x: at.x, y: g.world.ground(at.x, at.z), z: at.z };
      resolveCapsule(g.world, p, 0.55, 1.8);
      if (!demoAllows(g, p)) return 'That destination is outside the demo.';
      // A fight's veil otherwise pulls a traveller back into the arena on the next step.
      for (const [e, f] of g.ecs.c.fight) if (f.engaged) {
        resetFight(g, e, f);
        const brain = g.ecs.c.brain.get(e);
        if (brain) Object.assign(brain, { state: 'idle', target: null, aware: 0, lost: 0 });
      }
      g.player.fogPass = null;
      teleport(g, { x: p.x, z: p.z, yaw: at.yaw });
      return `Teleported to ${dest.name} ${part}.`;
    }
    if (cmd === 'spawn') {
      if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== 'boss' && args[1] !== 'eldritch')) return 'Usage: spawn <enemy_id> [boss|eldritch]';
      const def = getEntity(args[0]);
      const variant = args[1] as Variant | undefined;
      const resolved = resolveCreature(args[0], variant);
      if (!def || !resolved || def.tier === 'ally') return 'Unknown enemy or unavailable variant. Use list enemies or list bosses.';
      for (const e of spawned) if (!g.ecs.c.transform.has(e)) spawned.delete(e);
      if (spawned.size >= LIMIT) return `Showcase limit reached (${LIMIT}). Use clear first.`;
      const tr = g.ecs.c.transform.get(g.player.id)!;
      const radius = bodyOf(resolved).radius;
      const distance = Math.max(4, radius + 3);
      const p = { x: tr.pos.x + Math.sin(tr.yaw) * distance, y: 0, z: tr.pos.z + Math.cos(tr.yaw) * distance };
      p.y = g.world.ground(p.x, p.z);
      resolveCapsule(g.world, p, radius, Math.min(bodyOf(resolved).height, 3));
      if (!demoAllows(g, p)) return 'Cannot spawn outside the demo.';
      if (Math.hypot(p.x - tr.pos.x, p.z - tr.pos.z) < radius + 1) return 'Not enough room to spawn that creature here.';
      const e = spawnCreature(g, args[0], { x: p.x, z: p.z, yaw: yawOf(tr.pos.x - p.x, tr.pos.z - p.z) }, variant);
      if (e === undefined) return 'Could not spawn that creature.';
      const c = g.ecs.c.combatant.get(e)!;
      c.bounty = 0;
      c.showcase = true;
      spawned.add(e);
      return `Spawned ${resolved.name}. Showcase creatures grant no rewards.`;
    }
    return 'Unknown command or invalid arguments. Type help.';
  };
  return { commands, execute, dispose: () => { clear(); flight.setFlight(false); } };
}
