/**
 * What burns (2026-11-27, the playtest: "a burning thing right next to, even touching, a wooden shelf"): the dungeons' wall things and
 * set pieces of wood, paper, cloth or straw, which no torch, brazier or lit piece stands beside. The braziers of a hall's far corners
 * were stood after its furniture and never looked at it; the torches were hung before a room's set and never knew of it.
 * Read by render/dungeonDressing.ts (a hall's furniture and braziers) and render/siteMeshes.ts (the torches). Data only.
 */

import type { WallItem } from './dungeonLooks';

/** The things on a hall's wall (render/kitItems.ts, render/loreItems.ts) built of what burns. */
export const BURNING_ITEMS: ReadonlySet<WallItem> = new Set<WallItem>(['shelves', 'crate', 'barrel', 'pew', 'lectern', 'nets', 'specimens', 'roots']);

/** The set pieces (data/models, render/setShapes.ts) of what burns, that stand free of a wall's own fabric (a list the demo's build prunes: tools/demo/rules/assets.ts). */
const BURNING_MODEL_IDS: readonly string[] = [
  'bookcase', 'bookcase_low', 'bookshelf', 'bookpile', 'crate', 'barrel', 'kf_barrels', 'cu_curtains', 'banner', 'hay_bale', 'bench', 'cart',
  'chest', 'bedroll', 'flag_pirate', 'cross_wood', 'rowboat',
];
export const BURNING_MODELS: ReadonlySet<string> = new Set(BURNING_MODEL_IDS);

/** Metres kept between a fire and what stands near it. */
export const FIRE = {
  burns: 1.0, // from a flame to the nearest edge of what burns
  clear: 0.3, // from a brazier to anything else (a statue, a stele: the iron is not in the stone)
  brazier: 0.5, // a brazier's reach, its splayed feet
  half: 1.2, // half the breadth of a thing on a hall's wall (a pew is the widest, 1.3; a case of books 0.95)
  strewn: 0.9, // a stone or a bone on the floor, from a brazier's feet
} as const;
