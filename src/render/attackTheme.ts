/** The colours of whoever is striking. A fighter with no theme keeps the shared palette. */

import type { Entity } from '../core/ecs';
import { BOSS_ATTACK_THEME, type AttackTheme } from '../data/bossAttackTheme';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { ANOMALY, BASE, mixRgb, scaleRgb } from './palette';

/** What every unthemed blow still uses: the old magenta, green, bone and purple. */
export const DEFAULT_ATTACK_THEME: AttackTheme = {
  danger: ANOMALY.magenta,
  line: mixRgb(ANOMALY.green, BASE.bone, 0.2),
  ring: mixRgb(BASE.bone, BASE.seaGrey, 0.55),
  mind: ANOMALY.purple,
};

export const SMOKE = scaleRgb(BASE.charcoal, 0.6);

export function attackTheme(g: Game, id: Entity): AttackTheme {
  const key = creatureOf(g, id)?.id;
  return (key && BOSS_ATTACK_THEME[key]) || DEFAULT_ATTACK_THEME;
}
