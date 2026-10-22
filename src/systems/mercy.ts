/**
 * Mercy (round 61: "no boss insurmountable or nearly impossible, yet none excessively easy"). The balance table measures a bot, and
 * a person who meets a horror on a bad day, or a build that is not the model's, is not one. Each time the investigator is unmade by a
 * horror's fight its blows fall a little lighter in the next, to a floor (`MERCY`), and it is as it was when it falls or a journey begins
 * again (Nightmare is for those who ask for no mercy). Kept as `mercy:<horror>:<n>` among what was told, so a save holds it with no
 * format of its own. Pure: no Three.js.
 */

import { t as tr } from '../core/i18n';
import type { Entity } from '../core/ecs';
import { MERCY } from '../data/tuning';
import { engagedFights } from './bossFight';
import type { Game } from './components';

const PREFIX = 'mercy:';

/** The times the investigator has fallen to horror `id` on this journey. */
export function fallsTo(g: Game, id: string): number {
  let n = 0;
  for (const k of g.overworld?.told ?? []) if (k.startsWith(`${PREFIX}${id}:`)) n++;
  return n;
}

/** The weight of a blow from `attacker` once mercy is shown (1 for anything but a horror in its fight, or a summon of one). */
export function mercyScale(g: Game, attacker: Entity): number {
  if (g.player.difficulty === 'nightmare') return 1;
  const boss = g.ecs.c.fight.get(g.ecs.c.minion.get(attacker) ?? attacker);
  if (!boss) return 1;
  return 1 - MERCY.step * Math.min(MERCY.falls, fallsTo(g, boss.id));
}

/** Counts each fall to a horror's fight, and says so. Call once per game. */
export function registerMercy(g: Game): void {
  g.events.on('Died', ({ entity }) => {
    if (entity !== g.player.id || !g.overworld || g.player.difficulty === 'nightmare') return;
    for (const [, f] of engagedFights(g)) {
      const n = fallsTo(g, f.id);
      if (n >= MERCY.falls) continue;
      g.overworld.told.add(`${PREFIX}${f.id}:${n + 1}`);
      g.events.emit('Notice', { text: tr('n.mercy', { n: Math.round(MERCY.step * (n + 1) * 100) }) });
    }
  });
}
