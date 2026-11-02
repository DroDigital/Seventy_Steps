/** Boss scaling past the standing a horror is made to be met at: its blows by the investigator's health, its health by their damage. */
import { BOSS_STANDING } from '../data/bossStanding';
import { JOURNEY_REFERENCE, type JourneyProfile } from '../data/ngPlusTuning';
import { BOSS_LEVEL_SCALING, BOSS_OVERMATCH, REINFORCE } from '../data/tuning';
import { healthAt, levelsWorth, mightAt } from './levelWorth';
import { bossRung } from './ngPlus';
import type { Entity } from '../core/ecs';
import type { Fight, Game } from './components';

/** How much harder a horror strikes when the investigator's health exceeds its expected standing. */
export function overmatch(levels: { vigour: number }, id: string | undefined): { damage: number } {
  const standing = id ? BOSS_STANDING[id] : undefined;
  if (!standing) return { damage: 1 };
  const body = healthAt(levels.vigour) / healthAt(standing[0]);
  return { damage: 1 + BOSS_OVERMATCH.share * Math.max(0, body - 1) };
}

/** How much more health a horror has when the investigator's damage exceeds its expected standing (Might and the weapon's edge; 2026-11-01). */
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

/** On the first journey a horror grows to meet an investigator stronger than its standing (`overmatchHealth`), its wounds kept as a share. */
export function meet(g: Game, e: Entity, f: Fight): void {
  const h = g.ecs.c.health.get(e);
  if (!h || g.player.cycle > 0) return;
  f.base ??= h.max;
  const max = Math.round(f.base * overmatchHealth(g.player.levels, Math.max(0, ...Object.values(g.player.reinforced)), f.id));
  [h.hp, h.max] = [(h.hp / h.max) * max, max];
}
