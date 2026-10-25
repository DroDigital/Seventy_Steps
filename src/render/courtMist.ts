/**
 * Which court the camera is in, and how far (round 78; data/arenaMists.ts says what each court's mist is): the share of a court's own mist the open world's ground mist is
 * turned toward, rising from nothing at `FROM` metres outside its wall (the mist is seen gathering in the gate's opening) to whole `WITHIN` metres inside it. Render only.
 */

import { ARENA_MISTS } from '../data/arenaMists';
import { worldLayout } from '../world/placements';

const FROM = 6; // metres outside the wall's middle line at which the mist begins to gather
const WITHIN = 4; // and metres inside it at which it is whole

export interface Court {
  boss: string;
  share: number; // 0..1
}

/** The share of a court's mist at `gap` metres from its wall (negative within). */
export const courtShare = (gap: number): number => Math.min(1, Math.max(0, (FROM - gap) / (FROM + WITHIN)));

/** The court (of those that have a mist) the point is in, or nearest to the wall of, within reach of its gathering. */
export function courtAt(x: number, z: number): Court | null {
  let best: Court | null = null;
  for (const a of worldLayout().arenas) {
    const boss = a.bosses[0]!;
    if (!a.house || !ARENA_MISTS[boss] || Math.hypot(x - a.x, z - a.z) > a.radius + 60) continue; // (the wall is within `reach` of the ring: far off is not worth asking)
    const share = courtShare(a.house.gap({ x, z }));
    if (share > (best?.share ?? 0)) best = { boss, share };
  }
  return best;
}
