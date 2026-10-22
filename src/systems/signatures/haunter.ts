/**
 * The Haunter of the Dark (spec §3E): it is wounded only by lamplight, which the 'light_dependency' hook
 * holds (reality.ts), and has no mechanic of its own beyond that. This says so under its health bar (round 66),
 * where a blow that does next to nothing in the dark read as a fight that could not be won. Pure: no Three.js.
 */

import { litNear } from '../reality';
import type { Signature } from '../signatures';

export const HAUNTER_SIGNATURE: Signature = {
  status: (g, e, f) => (litNear(g, f, e) ? 'THE LAMPLIGHT WOUNDS IT' : 'ONLY LAMPLIGHT WOUNDS IT · LURE IT TO A LAMP'),
};
