/** The colours of a blow from a fighter with no theme of its own: the shared palette (magenta, green, bone and purple). A horror's are in `data/bossAttackTheme`, lifted for use in `attackLook`. */

import type { AttackTheme } from '../data/bossAttackTheme';
import { ANOMALY, BASE, mixRgb } from './palette';

export const DEFAULT_ATTACK_THEME: AttackTheme = {
  danger: ANOMALY.magenta,
  line: mixRgb(ANOMALY.green, BASE.bone, 0.2),
  ring: mixRgb(BASE.bone, BASE.seaGrey, 0.55),
  mind: ANOMALY.purple,
};
