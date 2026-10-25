/**
 * Which forms the Relight setting reaches (round 81; render only): the great ones and the outer gods, the bodies large enough to have folds
 * that a moving light can cross. Everything else, the small lives, the people and the greater creatures, is lit as it was. The
 * relight itself is in shaders/sprite.ts, and it is off unless the player turns it on (Settings › Display).
 */

import { GREAT_OLD_ONES } from '../data/entities/greatOldOnes';
import { OUTER_GODS } from '../data/entities/outerGods';

const FORMS = new Set<string>([...GREAT_OLD_ONES, ...OUTER_GODS].map((d) => d.id));

/** 1 for a form of a great one or an outer god, by its sprite key (`id` or `id#variant`), else 0. */
export const relitOf = (key: string): number => (FORMS.has(key.split('#')[0]) ? 1 : 0);
