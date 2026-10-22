/**
 * Whether a horror's house has been given (round 63; systems/discovery.ts): its acts are done (`found:<horror>` told), or the horror is
 * down. Kept apart from the discovery's play so that the layers and the journeys can ask it without the rest. Pure: no Three.js.
 */

import { foundKey } from '../data/discoveries';
import type { Game } from './components';

export const isFound = (g: Pick<Game, 'overworld'>, boss: string): boolean => !!g.overworld && (g.overworld.told.has(foundKey(boss)) || g.overworld.slain.has(`boss:${boss}`));
