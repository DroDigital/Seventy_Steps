/** Pure journey profiles. The caller captures a creature's home profile at spawn, so chasing across borders never changes it. */
import type { XZ } from '../core/geom';
import { BOSS_JOURNEY, BOSS_JOURNEY_DEFAULT, CREATURE_JOURNEY, JOURNEY_CURVES, REGION_JOURNEYS, type JourneyProfile } from '../data/ngPlusTuning';
import { getEntity } from '../data/registry';
import { REGIONS } from '../data/regions';
import { NEW_GAME_PLUS } from '../data/tuning';
import { regionAt, regionRect } from '../world/worldMap';

export interface JourneyScale { health: number; damage: number }
export interface JourneyHome { profile: JourneyProfile; encounter?: string; servant?: boolean; creature?: string }

/** Defend the ceiling at the point of use too, including debug and imported values. */
export const journeyIndex = (cycle: number): number => Number.isFinite(cycle) ? Math.min(NEW_GAME_PLUS.most, Math.max(0, Math.floor(cycle))) : 0;

export function regionProfile(region: string | undefined, at?: XZ): JourneyProfile {
  if (region === 'dreamlands' && at) {
    const r = REGIONS.find((r) => r.id === region)!;
    const rect = regionRect(r);
    // The Wood and the approach to Ulthar are gentler than Leng and Kadath, further north.
    if (at.z - rect.z0 < 400) return 'middle';
  }
  return REGION_JOURNEYS[region ?? ''] ?? 'late';
}

export function homeProfile(at: XZ, id: string, world: boolean, placedRegion?: string): JourneyProfile {
  const region = placedRegion ?? (world ? regionAt(at.x, at.z)?.id : getEntity(id)?.regions[0]);
  return regionProfile(region, world ? at : undefined);
}

export function foeRung(cycle: number, profile: JourneyProfile = 'late'): JourneyScale {
  const [health, damage] = JOURNEY_CURVES[profile][journeyIndex(cycle)];
  return { health, damage };
}

export function bossRung(id: string | undefined, cycle: number, profile?: JourneyProfile): JourneyScale {
  const r = foeRung(cycle, profile ?? regionProfile(id ? getEntity(id)?.regions[0] : undefined));
  const [health, damage] = BOSS_JOURNEY[id ?? ''] ?? BOSS_JOURNEY_DEFAULT;
  return { health: 1 + health * (r.health - 1), damage: 1 + damage * (r.damage - 1) };
}

export function homeRung(home: JourneyHome | undefined, cycle: number): JourneyScale {
  if (home?.encounter) return bossRung(home.encounter, cycle, home.profile);
  const r = foeRung(cycle, home?.profile);
  const weight = CREATURE_JOURNEY[home?.creature ?? ''];
  return weight ? { health: 1 + weight[0] * (r.health - 1), damage: 1 + weight[1] * (r.damage - 1) } : r;
}
