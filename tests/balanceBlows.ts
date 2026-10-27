/**
 * The weight of a horror's heaviest blow (round 95), shared by tests/oneHit.test.ts, which holds it under `BOSS.blowMost` at every standing, and
 * tests/ngPlus.test.ts, which keeps the ladder's growth of the blows short of that.
 */
import { ENTITIES } from '../src/data/registry';
import { BOSS_LEVEL_SCALING } from '../src/data/tuning';
import { overmatch } from '../src/systems/bossScaling';
import { toCombatant } from '../src/systems/creatures';
import { healthAt, levelsWorth } from '../src/systems/levelWorth';

/** The heaviest single blow a horror's moves can deal, as authored. */
export function heaviestOf(id: string): number {
  const e = ENTITIES.find((x) => x.id === id)!;
  return Math.max(...Object.values(toCombatant(e).moves).map((m) => m.hit?.damage ?? m.volley?.damage ?? m.marks?.damage ?? m.wave?.damage ?? m.sweep?.damage ?? m.barrage?.damage ?? m.shot?.damage ?? m.pool?.damage ?? 0));
}

/** The share of the investigator's greatest health that horror `id`'s heaviest blow is, where `levels` have been bought: grown with the levels as they are worth (`levelsWorth`, as `foeDamage` does) and the overmatch, a rung of the ladder not yet laid on. */
export function blowShare(id: string, levels: { vigour: number; endurance: number; might: number }): number {
  return (heaviestOf(id) * (1 + BOSS_LEVEL_SCALING.damage * levelsWorth(levels)) * overmatch(levels, id).damage) / healthAt(levels.vigour);
}
