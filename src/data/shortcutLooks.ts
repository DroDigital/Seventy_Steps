/**
 * What shuts a shortcut in each kit's doorway (round 125: render/shortcutViews.ts): the kit's own door where it has one that can be
 * barred, and what bars it on the side it is opened from. A plank door is held by a beam across iron brackets, lifted away; a gate of
 * bars by a bolt drawn back into its jamb; a slab, a valve or a stone door by a lever thrown beside it, and the slab sinks. A kit with
 * no door (the open ruins, the hill, the drowned temple, the void) or one hung with a drape takes a gate of bars in its stone's tone.
 * Data only.
 */

import { doorLook, type DoorLook } from './doors';
import type { KitId } from './kits';

export type Bar = 'beam' | 'bolt' | 'lever';

export interface ShortcutLook {
  door: DoorLook;
  bar: Bar;
}

const GATE: DoorLook = { kind: 'grille', tone: [0.3, 0.29, 0.31], trim: [0.38, 0.36, 0.34], ajar: 0, creak: 'thud' };
const BRONZE: DoorLook = { kind: 'grille', tone: [0.6, 0.48, 0.26], trim: [0.74, 0.6, 0.34], ajar: 0, creak: 'thud' }; // the dream's: what a curtain cannot do

/** The barred door of a shortcut opened from a room of `kit`. */
export function shortcutLook(kit: KitId): ShortcutLook {
  const own = doorLook(kit);
  if (!own) return { door: GATE, bar: 'bolt' };
  const door = { ...own, ajar: 0 };
  switch (own.kind) {
    case 'plank':
      return { door, bar: 'beam' };
    case 'grille':
      return { door, bar: 'bolt' };
    case 'curtain':
      return { door: BRONZE, bar: 'bolt' };
    default:
      return { door, bar: 'lever' }; // a slab, a valve
  }
}
