/**
 * What a person does about a bank of poison (round 70; the balance bot of botHelpers.ts): the toxic clouds drift after the investigator,
 * slower than a walk, so a person who sees one walks out of it, and the bot with them: with the bot's `skill` it notices a bank it stands
 * in and goes straight out of it, and it stands in a bank it did not notice (the same coin as for a blow it reads) until it has left or
 * the bank is gone.
 */

import type { Entity } from '../src/core/ecs';
import type { Game } from '../src/systems/components';

export interface Leaving {
  decided: Set<Entity>; // banks it has made up its mind about, while it stands in them
  leaving: Set<Entity>; // those it walks out of
}

export const newLeaving = (): Leaving => ({ decided: new Set(), leaving: new Set() });

/** The way (a world vector) out of the bank the bot is walking out of, or undefined when it is in none it means to leave. */
export function wayOut(g: Game, state: Leaving, skill: number, coin: () => number): { x: number; z: number } | undefined {
  const c = g.ecs.c;
  const me = c.transform.get(g.player.id)!.pos;
  const inside = new Set<Entity>();
  for (const [e, h] of c.hazard) {
    const at = h.cloud === 'toxic' && h.damage > 0 ? c.transform.get(e)?.pos : undefined;
    if (at && Math.hypot(me.x - at.x, me.z - at.z) < h.radius + 0.3) inside.add(e);
  }
  for (const e of [...state.decided]) if (!inside.has(e)) [state.decided.delete(e), state.leaving.delete(e)];
  for (const e of inside) {
    if (state.decided.has(e)) continue;
    state.decided.add(e);
    if (coin() < skill) state.leaving.add(e);
  }
  const bank = [...inside].find((e) => state.leaving.has(e));
  const at = bank === undefined ? undefined : c.transform.get(bank)!.pos;
  return at && { x: me.x - at.x || 1, z: me.z - at.z };
}
