/**
 * VariantSwap hook (spec §3A): at Fractured sanity or lower, creatures show their eldritch variant
 * (look, name, moves, stats) and change back once the mind climbs out. A boss phase may also reveal
 * that form, keeping it visible while that phase lasts. It listens for band changes; bossFight.ts
 * also syncs phase changes and resets. The rebuild itself is `morph` in creatures.ts.
 * Creatures spawned with a requested variant keep it.
 */

import type { Entity } from '../core/ecs';
import type { Game } from './components';
import { morph } from './creatures';
import { atOrBelow } from './sanity';

/** Brings one swapping creature in line with the mind. */
export function syncVariant(g: Game, id: Entity): void {
  const s = g.ecs.c.swap.get(id);
  if (!s) return;
  const fight = g.ecs.c.fight.get(id);
  const revealed = fight?.engaged && fight.script.phases[fight.phase]?.eldritch;
  const eldritch = !!revealed || atOrBelow(g.mind, 'fractured');
  if (eldritch === s.eldritch) return;
  s.eldritch = eldritch;
  morph(g, id, s.id, eldritch ? 'eldritch' : undefined);
}

export function registerVariantSwap(g: Game): void {
  g.events.on('SanityBandChanged', () => {
    for (const id of g.ecs.c.swap.keys()) syncVariant(g, id);
  });
}
