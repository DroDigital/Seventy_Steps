/** Boss scaling past the standing a horror is made to be met at: its blows by the investigator's health, its health by their damage. */
import { BOSS_STANDING } from '../data/bossStanding';
import { JOURNEY_REFERENCE, type JourneyProfile } from '../data/ngPlusTuning';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH, REINFORCE } from '../data/tuning';
import { healthAt, levelsWorth, mightAt } from './levelWorth';
import { bossRung } from './ngPlus';
import type { Entity } from '../core/ecs';
import type { Fight, Game } from './components';

/** How much harder a horror strikes when the investigator's health exceeds its expected standing: no ceiling (2026-11-26). */
export function overmatch(levels: { vigour: number }, id: string | undefined): { damage: number } {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return { damage: 1 };
  const body = healthAt(levels.vigour) / healthAt(standing[0]);
  return { damage: 1 + BOSS_OVERMATCH.share * Math.max(0, body - 1) };
}

/**
 * How much more health a horror has when the investigator's damage exceeds its expected standing (Might and the edge of
 * the weapon in hand; 2026-11-01, 2026-11-24): no ceiling, so the earliest horrors, furthest below a grown investigator,
 * grow the most (2026-11-26, docs/RULES.md).
 */
export function overmatchHealth(levels: { might: number }, edge: number, id: string | undefined): number {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return 1;
  const keen = (level: number): number => 1 + REINFORCE.damage * level;
  const power = (mightAt(levels.might) * keen(edge)) / (mightAt(standing[1]) * keen(standing[2] ?? 0));
  return 1 + BOSS_OVERMATCH.health * Math.max(0, power - 1);
}

export const bossDamageScale = (levels: number, over = 1): number => (1 + BOSS_LEVEL_SCALING.damage * levels) * over;

/** Later journeys use a fixed reference: buying another level does not strengthen their bosses. */
export const journeyBossDamage = (id: string, cycle: number, profile?: JourneyProfile): number =>
  bossDamageScale(levelsWorth(JOURNEY_REFERENCE), overmatch(JOURNEY_REFERENCE, id).damage) * bossRung(id, cycle, profile).damage;

/**
 * On the first journey a horror grows to meet an investigator stronger than its standing (`overmatchHealth`), by the
 * weapon in their hand, its wounds kept as a share. Met again whenever that weapon changes in the fight (`arms.equip`).
 */
export function meet(g: Game, e: Entity, f: Fight): void {
  const h = g.ecs.c.health.get(e);
  if (!h || h.max <= 0 || h.hp <= 0 || g.ecs.c.dead.has(e) || g.player.cycle > 0) return;
  f.base ??= h.max;
  const max = Math.round(f.base * overmatchHealth(g.player.levels, g.player.reinforced[g.player.weapon] ?? 0, f.id));
  if (max === h.max) return;
  [h.hp, h.max] = [(h.hp / h.max) * max, max];
}

/** Every live engaged fight meets the investigator again (a weapon taken up in the middle of one). */
export function meetAgain(g: Game): void {
  for (const [e, f] of g.ecs.c.fight) if (f.engaged && !g.ecs.c.dead.has(e)) meet(g, e, f);
}
