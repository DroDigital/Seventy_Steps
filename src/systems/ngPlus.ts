/**
 * Round 95: how much harder each later journey through the dream is (NG+). A ladder of rungs, one a journey, from the first journey's own stats
 * (rung 0) to the last counted (NEW_GAME_PLUS.most, rung 1), the steps between equal: the ordinary foes' (`NEW_GAME_PLUS.foes`: a little hardier, a
 * little harder) and each horror's own (data/bossNgPlus.ts), which the balance bot fits so that the horror stays within its tier's band however
 * far up it stands (tests/ngPlus.test.ts, docs/NGPLUS.md). Pure: no Three.js.
 */

import { BOSS_NG_PLUS } from '../data/bossNgPlus';
import { NEW_GAME_PLUS } from '../data/tuning';

export interface Rung {
  health: number; // what a foe's health is multiplied by
  damage: number; // what its blows are
}

/** How far up the ladder a journey stands: 0 on the first, 1 on the last counted. */
export const ngStep = (cycle: number): number => Math.min(Math.max(cycle, 0), NEW_GAME_PLUS.most) / NEW_GAME_PLUS.most;

const rung = (grow: { health: number; damage: number }, cycle: number): Rung => {
  const step = ngStep(cycle);
  return { health: 1 + grow.health * step, damage: 1 + grow.damage * step };
};

/** An ordinary foe's rung on journey `cycle` (0 the first). */
export const foeRung = (cycle: number): Rung => rung(NEW_GAME_PLUS.foes, cycle);

/** The horror `id`'s rung on journey `cycle`: its own, or the fallback's where the fit names none. */
export function bossRung(id: string | undefined, cycle: number): Rung {
  const own = id ? BOSS_NG_PLUS[id] : undefined;
  return rung(own ? { health: own[0], damage: own[1] } : NEW_GAME_PLUS.boss, cycle);
}
