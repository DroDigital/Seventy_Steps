/**
 * What the Bestiary page says of a creature besides its field note (round 34): how it fights, from its
 * behaviour archetype, and what hurts it or turns the blow, from its entry, in the language chosen (1.5.0).
 */

import { story, t } from '../core/i18n';
import type { Key } from './lang/en';
import { getRegion } from './regions';
import { ARCHETYPE_IDS, TIERS, type ArchetypeId, type DamageType, type EntityDef, type Tier } from './schema';

/** How each archetype fights, as the key of its line (data/lang/pages: `beast.habit.*`). */
export const HABITS: Readonly<Record<ArchetypeId, Key>> = Object.fromEntries(ARCHETYPE_IDS.map((a) => [a, `beast.habit.${a}`])) as Record<ArchetypeId, Key>;

/** Each tier's heading, as its key (`beast.tier.*`). */
export const TIER_NAMES: Readonly<Record<Tier, Key>> = Object.fromEntries(TIERS.map((x) => [x, `beast.tier.${x}`])) as Record<Tier, Key>;

/** A tier in the small line under a creature's name (`beast.kind.*`). */
export const tierKind = (tier: Tier): string => t(`beast.kind.${tier}`);

const what = (d: readonly DamageType[]): string => d.map((x) => t(`beast.what.${x}`)).join(t('beast.and'));

/** "Hurt by fire. Turns the blade.", in the language chosen: empty when it has neither. */
export function weaknessLine(def: Pick<EntityDef, 'weak' | 'resist'>): string {
  const [weak, resist] = [def.weak ?? [], def.resist ?? []];
  return [weak.length && t('beast.hurt', { what: what(weak) }), resist.length && t('beast.turns', { what: what(resist) })].filter(Boolean).join(' ');
}

/** The names of the realms it is met in, as the map names them. */
export const wherever = (def: Pick<EntityDef, 'regions'>): string => def.regions.map((r) => story(getRegion(r)?.name ?? r)).join(' · ');
