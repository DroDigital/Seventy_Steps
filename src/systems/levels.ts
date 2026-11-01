/**
 * Levels (playtest round 4): Echoes buy the investigator's strength at an Elder Sign — Vigour
 * (health), Endurance (stamina) and Might (the weight of blows and shots) — each level dearer than
 * the last, so every kill and every Echo recovered from where they fell counts. Insight buys the
 * mind's upgrades instead (insight.ts). Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import { LAUDANUM, LEVEL_COST, LEVELS, UPGRADES, type LevelId } from '../data/tuning';
import type { Game } from './components';
import { healthAt, mightAt, staminaAt, staminaRegen } from './levelWorth';
import { boon } from './relicLoadout';

export { staminaRegen };

export const LEVEL_IDS = Object.keys(LEVELS) as LevelId[];

/** Levels bought in a record of them (a save's). */
export const levelsOf = (levels: Partial<Record<LevelId, number>> | undefined): number => LEVEL_IDS.reduce((n, id) => n + (levels?.[id] ?? 0), 0);

/** Levels bought so far (the investigator's level is one more). */
export const levelsBought = (g: Pick<Game, 'player'>): number => LEVEL_IDS.reduce((n, id) => n + g.player.levels[id], 0);

/** Echoes a level costs once `bought` levels have been bought. */
export const levelCost = (bought: number): number => Math.round(LEVEL_COST.base + LEVEL_COST.step * bought + LEVEL_COST.curve * bought * bought);

export const nextLevelCost = (g: Pick<Game, 'player'>): number => levelCost(levelsBought(g));

/** Whether another level of `id` can be bought now. */
export const canLevel = (g: Pick<Game, 'player'>, id: LevelId): boolean => g.player.levels[id] < LEVELS[id].max && g.player.echoes >= nextLevelCost(g);

/**
 * Sets maximum health, stamina and recovery from the full value of the purchased levels.
 * A rise is felt at once; existing bosses keep their health and wounds.
 */
function applyVitals(g: Game, preserveFraction: boolean): void {
  const h = g.ecs.c.health.get(g.player.id)!;
  const s = g.ecs.c.stamina.get(g.player.id)!;
  const hp = Math.round(healthAt(g.player.levels.vigour) * boon(g, 'health'));
  const stamina = Math.round(staminaAt(g.player.levels.endurance) * boon(g, 'stamina'));
  const nextHp = preserveFraction ? (h.hp <= 0 ? h.hp : h.hp * hp / h.max) : Math.max(1, h.hp + hp - h.max);
  const nextStamina = s.value < 0 ? s.value : preserveFraction ? s.value * stamina / s.max : Math.max(0, s.value + stamina - s.max);
  [h.hp, h.max] = [nextHp, hp];
  [s.value, s.max] = [nextStamina, stamina];
  s.regen = staminaRegen(g.player.levels.endurance) * boon(g, 'recovery');
}

export function applyLevels(g: Game): void { applyVitals(g, false); }

/** Changing relics preserves wound and stamina fractions, and never clears a stamina debt or revives a corpse. */
export function refreshRelicVitals(g: Game): void { applyVitals(g, true); }

/** Spends Echoes on one level of `id`; false when short of Echoes or at the most levels. */
export function buyLevel(g: Game, id: LevelId): boolean {
  if (!canLevel(g, id)) return false;
  const cost = nextLevelCost(g);
  g.player.echoes -= cost;
  g.player.levels[id]++;
  applyLevels(g);
  g.events.emit('Echoes', { change: 'spent', amount: cost, total: g.player.echoes, on: 'level' });
  g.events.emit('LevelUp', { attribute: id, level: g.player.levels[id], total: levelsBought(g) });
  return true;
}

/** The weight Might adds to a blow or shot from `attacker` (1 for anyone but the investigator). */
export const might = (g: Pick<Game, 'player'>, attacker: Entity): number => (attacker === g.player.id ? mightAt(g.player.levels.might) : 1);

/** The most Laudanum the investigator carries: the start's doses and one more per Draught. */
export const laudanumMax = (g: Pick<Game, 'mind'>): number => LAUDANUM.doses + g.mind.upgrades.draught * (UPGRADES.draught.doses ?? 0);

export const levelName = (id: LevelId): string => id[0].toUpperCase() + id.slice(1);
