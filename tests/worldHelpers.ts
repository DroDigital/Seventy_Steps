/** Helpers for open-world tests: a fresh world game, moving the investigator, killing by hand. */

import type { Entity } from '../src/core/ecs';
import { emptyInput } from '../src/core/input';
import { strike } from '../src/systems/combat';
import { teleport } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { stepGame } from '../src/systems/game';
import type { RingEnclosure } from '../src/world/enclosure';
import type { ArenaPlace } from '../src/world/placements';

export const deathblow = { damage: 99999, poise: 0, guard: 0, hitstop: 2, parryable: false, interrupts: false };

/** An arena's wall as a ring (the walks of round 63 that go about its radius): fails for any other kind. */
export function ringOf(a: Pick<ArenaPlace, 'bosses' | 'house'>): RingEnclosure {
  if (a.house?.kind !== 'ring') throw new Error(`${a.bosses[0]}: not a ring`);
  return a.house as RingEnclosure;
}

/** Kills `target` (the investigator) with blows of `attacker`: no foe's blow takes more than BOSS.blowMost of their greatest health (round 68), so it takes two. */
export function slay(g: Game, attacker: Entity, target: Entity = g.player.id): void {
  for (let i = 0; i < 4 && (g.ecs.c.health.get(target)?.hp ?? 0) > 0; i++) strike(g, attacker, target, deathblow);
}

/** Moves the investigator to (x, z). */
export const goTo = (g: Game, x: number, z: number, yaw = 0): void => teleport(g, { x, z, yaw });

export function run(g: Game, n: number): void {
  for (let i = 0; i < n; i++) stepGame(g, emptyInput());
}

/** Kills `id` with a blow from the investigator and waits out its death throes. */
export function kill(g: Game, id: Entity): void {
  strike(g, g.player.id, id, deathblow);
  run(g, 90);
}

/** The creature standing for a spawn point, if it is alive. */
export const creatureOf = (g: Game, spawnId: string): Entity | undefined => g.overworld!.alive.get(spawnId);

/** Records every event of one type. */
export function record<K extends keyof import('../src/systems/components').GameEvents>(g: Game, type: K): import('../src/systems/components').GameEvents[K][] {
  const log: import('../src/systems/components').GameEvents[K][] = [];
  g.events.on(type, (e) => log.push(e));
  return log;
}

/** Sends every horror away and keeps it from streaming back: the walk is of the walls, and a body beside them can shove the investigator through. */
function sendAway(g: Game): void {
  const ow = g.overworld;
  if (ow) {
    for (const id of ow.alive.keys()) ow.killed.add(id);
    ow.alive.clear();
  }
  for (const id of [...g.ecs.c.dread.keys()]) g.ecs.despawn(id);
}

/** Walks from `from` straight at (`to.x`, `to.z`) for `frames` (the investigator's horrors sent away first), and returns where they end. */
export function walkEnd(g: Game, to: { x: number; z: number }, from: { x: number; z: number }, frames: number): { x: number; z: number } {
  goTo(g, from.x, from.z, Math.atan2(to.x - from.x, to.z - from.z));
  sendAway(g);
  for (let k = 0; k < frames; k++) {
    stepGame(g, { ...emptyInput(), moveY: 1 });
    sendAway(g); // population fills at the end of the step: gone again before the next one moves
  }
  return g.ecs.c.transform.get(g.player.id)!.pos;
}

/** The same, and how far from `to` they end. */
export const walkIn = (g: Game, to: { x: number; z: number }, from: { x: number; z: number }, frames: number): number => {
  const p = walkEnd(g, to, from, frames);
  return Math.hypot(p.x - to.x, p.z - to.z);
};
