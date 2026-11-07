/**
 * Each dungeon's own build (round 108, asked: "improve every dungeon 3D model drastically in every way that it visually fits best for
 * the lore"): over its kit's walls and floors (data/kits.ts), what its pillars are (a timber post in a farmhouse, a fivefold column in
 * the Elder Things' city, a hexagonal basalt prism in the Great Race's archives), the frieze carved round its halls under the roof,
 * what dresses its ceilings (ribs, a groined vault, coffers, rafters, stalactites, roots, pipes), what stands along its halls' walls
 * and a tint of its own stone. A room of another kit (a house's cellar, the mine under Akeley's farm) takes its kit's defaults. Data
 * only: render/pillarForms.ts, render/dungeonFriezes.ts, render/dungeonRoofs.ts and render/loreItems.ts build them.
 */

import type { KitId } from './kits';
import type { Vec3 } from './tuning';

/** What a pillar is drawn as (its collider is the same cylinder whatever it is). */
export type PillarForm =
  | 'round' | 'square' | 'cluster' | 'fluted' | 'fivefold' | 'twisted' | 'post' | 'mast' | 'pipe' | 'brick'
  | 'menhir' | 'stalagmite' | 'coral' | 'bones' | 'basalt' | 'onyx' | 'fungal' | 'shard' | 'toad';

/** The relief carved in a band round a roofed hall under its cornice. */
export type Frieze = 'none' | 'dentils' | 'meander' | 'waves' | 'stars' | 'eyes' | 'skulls' | 'tentacles' | 'runes' | 'fivefold' | 'zigzag' | 'boards';

/** What hangs under a roofed room's ceiling: 'ribs' are the vault's ribs or the beams' joists, as before round 108. */
export type RoofDress = 'ribs' | 'groin' | 'coffers' | 'rafters' | 'stalactites' | 'roots' | 'pipes';

/** What stands along a hall's walls (render/dungeonFurniture.ts and, round 108, render/loreItems.ts). */
export type WallItem =
  | 'shelves' | 'crate' | 'barrel' | 'coffin' | 'statue' | 'stele' | 'pew' | 'growth' | 'rubble' | 'bones'
  | 'lectern' | 'ossuary' | 'apparatus' | 'cases' | 'idol' | 'nets' | 'pipes' | 'specimens' | 'slab' | 'cylinders' | 'chains' | 'roots' | 'bust';

export interface DungeonLook {
  pillar: PillarForm;
  frieze: Frieze;
  roof: RoofDress;
  items?: readonly WallItem[]; // its own kit's halls: else the kit's (render/dungeonFurniture.ts ITEMS)
  tint?: Vec3; // its stone, multiplied
}

/** The pillars of a room of each kit, wherever its dungeon says nothing (the Stairs of Slumber's kits keep the round column). */
export const KIT_PILLARS: Readonly<Record<KitId, PillarForm>> = {
  masonry: 'round', library: 'fluted', timber: 'post', townhouse: 'post', cellar: 'brick', mine: 'post', brick: 'brick', crypt: 'square',
  church: 'cluster', marble: 'fluted', hill: 'menhir', drowned: 'coral', sunken: 'coral', elder: 'fivefold', basalt: 'basalt', tsath: 'onyx',
  dream: 'round', dreamflame: 'round', dreamdeep: 'round', dreamabyss: 'round', onyx: 'onyx', cyclopean: 'twisted', fungoid: 'fungal', void: 'shard',
};

/** Each dungeon's own build, for the rooms of its own kit. A dungeon not named keeps the look it had (the Stairs of Slumber). */
export const DUNGEON_LOOKS: Readonly<Record<string, DungeonLook>> = {
  // The waking world's great dungeons.
  library: { pillar: 'fluted', frieze: 'dentils', roof: 'coffers', items: ['shelves', 'shelves', 'lectern', 'shelves', 'bust'], tint: [1.04, 1, 0.94] },
  witch_house: { pillar: 'post', frieze: 'runes', roof: 'rafters', items: ['shelves', 'crate', 'bones', 'barrel', 'chains'], tint: [0.86, 0.82, 0.8] }, // the old house leans, its timbers black, scratched with Keziah's marks
  sentinel_hill: { pillar: 'menhir', frieze: 'none', roof: 'ribs', items: ['stele', 'rubble', 'bones'], tint: [0.9, 0.92, 0.86] },
  yhanthlei: { pillar: 'coral', frieze: 'waves', roof: 'stalactites', items: ['growth', 'nets', 'stele', 'growth', 'bones'], tint: [0.88, 0.98, 0.96] },
  curwen_catacombs: { pillar: 'square', frieze: 'skulls', roof: 'groin', items: ['coffin', 'ossuary', 'specimens', 'coffin', 'chains'], tint: [0.94, 0.96, 0.9] }, // nitre-white, and his saltes on the shelves
  starry_wisdom: { pillar: 'cluster', frieze: 'stars', roof: 'rafters', items: ['pew', 'pew', 'statue', 'lectern', 'coffin'], tint: [0.9, 0.88, 0.92] },
  akeley: { pillar: 'post', frieze: 'boards', roof: 'ribs', items: ['shelves', 'crate', 'apparatus', 'barrel', 'cylinders'], tint: [0.96, 0.92, 0.86] },
  elder_city: { pillar: 'fivefold', frieze: 'fivefold', roof: 'ribs', items: ['stele', 'slab', 'rubble', 'stele'], tint: [0.96, 0.98, 1.04] },
  archives: { pillar: 'basalt', frieze: 'runes', roof: 'coffers', items: ['cases', 'cases', 'stele', 'cases'], tint: [0.9, 0.9, 0.96] },
  tsath: { pillar: 'onyx', frieze: 'none', roof: 'ribs', items: ['idol', 'statue', 'stele'], tint: [0.9, 0.94, 1.06] },
  ulthar_kadath: { pillar: 'onyx', frieze: 'none', roof: 'ribs', items: ['stele', 'statue', 'idol'] },
  // The far realms.
  risen_rlyeh: { pillar: 'twisted', frieze: 'none', roof: 'ribs', items: ['slab', 'growth', 'slab', 'stele'], tint: [0.9, 0.98, 0.92] },
  migo_cities: { pillar: 'fungal', frieze: 'none', roof: 'ribs', items: ['growth', 'cylinders', 'growth', 'apparatus'] },
  ultimate_void: { pillar: 'shard', frieze: 'none', roof: 'ribs', items: [] },
  // The lairs.
  munoz_rooms: { pillar: 'pipe', frieze: 'dentils', roof: 'pipes', items: ['shelves', 'pipes', 'crate', 'pipes'], tint: [0.94, 0.96, 1.02] }, // the refrigerating plant's pipes run through the house
  alchemist_cellars: { pillar: 'cluster', frieze: 'runes', roof: 'groin', items: ['specimens', 'barrel', 'shelves', 'coffin'], tint: [0.94, 0.92, 0.88] },
  outsider_crypt: { pillar: 'square', frieze: 'skulls', roof: 'groin', items: ['coffin', 'ossuary', 'stele', 'coffin'], tint: [0.86, 0.88, 0.86] },
  hound_churchyard: { pillar: 'bones', frieze: 'skulls', roof: 'roots', items: ['ossuary', 'coffin', 'bones', 'stele'], tint: [0.88, 0.92, 0.86] },
  deserted_house: { pillar: 'post', frieze: 'none', roof: 'rafters', items: ['crate', 'barrel', 'shelves', 'chains'], tint: [0.8, 0.78, 0.76] },
  swamp_tomb: { pillar: 'square', frieze: 'runes', roof: 'roots', items: ['coffin', 'roots', 'stele', 'coffin'], tint: [0.86, 0.94, 0.84] },
  shunned_cellar: { pillar: 'post', frieze: 'none', roof: 'ribs', items: ['shelves', 'crate', 'roots'], tint: [0.94, 0.9, 0.86] },
  red_hook_vaults: { pillar: 'brick', frieze: 'zigzag', roof: 'groin', items: ['barrel', 'crate', 'chains', 'stele'], tint: [0.92, 0.84, 0.8] },
  old_man_house: { pillar: 'mast', frieze: 'waves', roof: 'ribs', items: ['shelves', 'nets', 'barrel', 'crate'], tint: [0.9, 0.92, 0.94] },
  whateley_farm: { pillar: 'post', frieze: 'none', roof: 'rafters', items: ['crate', 'barrel', 'bones', 'shelves'], tint: [0.84, 0.8, 0.76] },
  waite_house: { pillar: 'post', frieze: 'waves', roof: 'ribs', items: ['shelves', 'shelves', 'nets', 'crate'], tint: [0.86, 0.92, 0.92] },
  sculptor_studio: { pillar: 'fluted', frieze: 'meander', roof: 'coffers', items: ['bust', 'statue', 'bust', 'stele'], tint: [1.02, 1, 0.98] },
  rue_dauseil: { pillar: 'post', frieze: 'none', roof: 'rafters', items: ['shelves', 'crate', 'chains'], tint: [0.84, 0.82, 0.86] },
};

const PLAIN: DungeonLook = { pillar: 'round', frieze: 'none', roof: 'ribs' };

/** A dungeon's look for a room of kit `kit`: its own if the room is of its own kit, else the kit's defaults. */
export function lookOf(dungeon: string, kit: KitId, own: KitId): DungeonLook {
  const look = DUNGEON_LOOKS[dungeon];
  return look && kit === own ? look : { ...PLAIN, pillar: KIT_PILLARS[kit] };
}
