/**
 * What the last blow teaches (round 26; data/deathLines.ts): the attack that took the investigator's
 * life is remembered as it lands, and when they fall, the line read under UNMADE says how it is met, if
 * it was a known blow; else a fragment of the place, never the same one twice running. A petrifying gaze
 * has its own. Pure: no Three.js.
 */

import { story } from '../core/i18n';
import { ownTip } from '../data/bossMoves';
import { EDGES, FRAGMENTS, GENERIC, SEAS, TIPS } from '../data/deathLines';
import type { Game } from './components';

/** Said when stone was the end (Ghatanothoa's gaze). */
export const PETRIFIED = 'Stone takes eight seconds. Break its sight behind a monolith, and it wears off.';

const last = new WeakMap<Game, { move: string | null; by: string }>();
const said = new WeakMap<Game, string>();

/** Remembers the blows the investigator takes (the last of them, at a fall). */
export function registerDeathNotes(g: Game): void {
  g.events.on('Hit', (e) => {
    if (e.target !== g.player.id || e.damage <= 0) return;
    last.set(g, { move: g.ecs.c.actor.get(e.attacker)?.move ?? null, by: g.ecs.c.combatant.get(e.attacker)?.name ?? '' });
  });
  g.events.on('Fell', (e) => void last.set(g, { move: e.sea ? 'drowned' : 'fell', by: e.sea ? 'the sea' : 'the edge' }));
  g.events.on('Petrified', () => void last.set(g, { move: 'petrified', by: 'stone' }));
  g.events.on('Respawned', () => void last.delete(g));
}

/** How a blow is met: the library's line for its blows, a horror's own line for its own (2026-11-24, data/bossMoves.ts). */
export const tipOf = (move: string): string | undefined => (move in TIPS ? TIPS[move as keyof typeof TIPS] : ownTip(move));

/** The line to read under a fall, in the language chosen (1.5.0): how the last blow is met, or else a fragment of the place. */
export const deathLine = (g: Game): string => story(lineOf(g));

function lineOf(g: Game): string {
  const blow = last.get(g)?.move;
  if (blow === 'fell') return EDGES[Math.floor(g.rng() * EDGES.length)];
  if (blow === 'drowned') return SEAS[Math.floor(g.rng() * SEAS.length)];
  if (blow === 'petrified') return PETRIFIED;
  const tip = blow && tipOf(blow);
  if (tip) return tip;
  const before = said.get(g);
  const pool = [...(FRAGMENTS[g.overworld?.region ?? ''] ?? []), ...GENERIC].filter((x) => x !== before);
  const line = pool[Math.floor(g.rng() * pool.length)];
  said.set(g, line);
  return line;
}
