/**
 * Each dungeon's own traps (2026-11-27, asked: "all dungeons currently feature an identical large pit hazard, which becomes repetitive.
 * Implement distinct, unique traps for each dungeon", then "some dungeons can have less, some more and some none"). A dungeon has none,
 * one or two mechanisms of its own, each laid in the rooms named here and nowhere a sign stands or a horror is fought: what it does (`kind`), what it is made of (`look`, a matter of data/arenaWays.ts: its colours, its burst and
 * its sound, render/wayFx.ts and audio/wayAudio.ts), what is said the first time it is met, and the shape its pit rooms' chasms are cut in
 * (`pit`, world/pitForms.ts). No two dungeons share a kind in the same matter, nor a pit's shape (tests/dungeonTraps.test.ts).
 * world/trapPlan.ts lays them, systems/dungeonTraps.ts plays them, render/trapViews.ts draws them. Data only.
 */

import type { Look } from './arenaWays';

/**
 * What a trap is: a mechanism with its hardware in plain sight, and a warning before it strikes (2026-11-27, asked: "floor spikes and
 * wall-mounted projectiles triggered by pressure plates ... and other innovative mechanisms", "don't overdo it in quantity, and never make
 * the traps feel unfair or frustrating").
 * 'spikes': a grate in the floor; stepped on, it rattles, and a breath later its spikes thrust up: step off it.
 * 'darts': a pressure plate, and a slot in the wall across from it; stepped on, it clicks, the slot glows, and a volley crosses the room
 *   along the line through the plate: step off the line.
 * 'blades': a blade swung from the ceiling across the way, in plain sight: pass behind it.
 * 'flames': a nozzle in the wall that hisses and glows, then throws a jet of fire part way across the room, in a rhythm: wait it out.
 * 'crusher': a slab hung under the ceiling that sheds dust and drops, in a rhythm, its shadow on the floor: stand clear of its shadow.
 * 'boulder': a pressure plate; stepped on, the far wall rumbles and a stone ball rolls down the room's length: step aside, there is room.
 * 'gas': a vent in the floor that puffs a cloud now and then, which takes the breath (or the mind), never the body.
 * 'watcher': an eye under the ceiling that marks where the investigator stands, now and then, and strikes there: keep moving.
 * 'tide': a wave that rolls down the room from its far end, row after row, with a roar before it.
 */
export type TrapKind = 'spikes' | 'darts' | 'blades' | 'flames' | 'crusher' | 'boulder' | 'gas' | 'watcher' | 'tide';

export interface TrapDef {
  kind: TrapKind;
  look: Look;
  rooms: readonly string[]; // where it is laid: never a sign's room nor a horror's nor the way in
  words: string; // said the first time one of its rooms is entered
  of?: 'sanity' | 'stamina'; // gas: what it takes
}

/** A dungeon's traps (none, one or two mechanisms: the great dungeons have more, the small lairs fewer) and the shape its pits are cut in. */
export interface DungeonTraps {
  traps: readonly TrapDef[];
  pit?: PitForm; // how its pit rooms' chasms are cut (a dungeon with no pit room has none)
}

/** The shapes a pit room's chasm may be cut in (world/pitForms.ts `PIT_FORMS`). */
export type PitForm = 'square' | 'grid' | 'trenches' | 'rifts' | 'twin' | 'slot' | 'offset' | 'shaft' | 'checker' | 'lane' | 'ladder' | 'gallery';

const t = (kind: TrapKind, look: Look, rooms: readonly string[], words: string, of?: TrapDef['of']): TrapDef => ({ kind, look, rooms, words, ...(of && { of }) });
const set = (traps: readonly TrapDef[], pit?: PitForm): DungeonTraps => ({ traps, ...(pit && { pit }) });

/**
 * Every dungeon's, by its id. Those not here keep none: the Stairs of Slumber (a dream's descent, kept by its priests), the Waite house
 * and Muñoz's rooms (a man's house is trap enough).
 */
export const DUNGEON_TRAPS: Readonly<Record<string, DungeonTraps>> = {
  // the waking world
  library: set([t('darts', 'sign', ['stacks_w', 'catalogue'], 'THE RESTRICTED STACKS WERE GUARDED: MIND THE PLATES'), t('crusher', 'sand', ['vaults'], 'THE OLD BOOK PRESSES STILL FALL')], 'grid'),
  witch_house: set([t('spikes', 'stain', ['lodgers', 'ratholes', 'sump'], 'NAILS STAND READY UNDER THE ROTTEN BOARDS')], 'twin'),
  sentinel_hill: set([t('boulder', 'sand', ['ledge', 'stones'], 'A STONE OF THE HILL IS POISED TO FALL'), t('gas', 'void', ['hollow'], 'THE HILL BREATHES SOMETHING NOT OF EARTH', 'sanity')]),
  yhanthlei: set([t('tide', 'brine', ['cells', 'causeway'], 'THE UNDERTOW COMES DOWN THE HALLS'), t('spikes', 'brine', ['sluice'], 'CORAL POINTS GROW UNDER THE SILT')], 'trenches'),
  curwen_catacombs: set([t('darts', 'salt', ['pens', 'catacomb'], 'CURWEN GUARDED HIS SALTES WITH PLATE AND BOLT'), t('gas', 'salt', ['saltes'], 'THE SALTES HANG IN THE AIR', 'stamina')], 'shaft'),
  starry_wisdom: set([t('blades', 'star', ['choir', 'belfry'], 'THE CLAPPERS SWING THOUGH NO BELL RINGS')]),
  akeley: set([t('flames', 'bolt', ['tunnel', 'gallery'], 'THE OUTER ONES’ NOZZLES ARC ACROSS THE TUNNELS')]),
  // the deep world
  elder_city: set([t('crusher', 'frost', ['arcade', 'tunnels'], 'THE FIVEFOLD SLABS STILL FALL AND RISE'), t('tide', 'frost', ['warren'], 'THE WIND OFF THE PEAKS ROLLS THROUGH THE WARREN')], 'checker'),
  archives: set([t('blades', 'sign', ['shelves', 'catalogue', 'gallery'], 'THE GREAT RACE’S MACHINES STILL SWING'), t('darts', 'glass', ['basalt'], 'THE BASALT GALLERY IS SET WITH PLATES')]),
  tsath: set([t('spikes', 'void', ['dark_way', 'cloister'], 'THE BLUE STONES ARE SET WITH POINTS'), t('flames', 'void', ['baths'], 'BLUE FIRE BREATHES FROM THE BATHS’ MOUTHS')], 'rifts'),
  ulthar_kadath: set([t('boulder', 'frost', ['road'], 'THE MEN OF LENG ROLL STONES ON THOSE WHO CLIMB'), t('blades', 'eye', ['monastery'], 'THE MONASTERY’S SCYTHES SWING IN THE DARK')]),
  // the far realms
  risen_rlyeh: set([t('crusher', 'brine', ['angled_gallery', 'angle_top'], 'THE CYCLOPEAN BLOCKS DROP AT WRONG ANGLES'), t('watcher', 'coil', ['star_tomb'], 'THE DREAMER’S EYE IS ON YOU')]),
  migo_cities: set([t('gas', 'spore', ['hive', 'conduit'], 'THE FUNGI EXHALE: HOLD YOUR BREATH', 'stamina'), t('flames', 'star', ['chute'], 'THE CHUTE’S ENGINES FLARE')], 'offset'),
  ultimate_void: set([t('watcher', 'void', ['drift', 'lattice'], 'SOMETHING IN THE VOID MARKS WHERE YOU STAND')]),
  // the lairs
  alchemist_cellars: set([t('flames', 'flame', ['dungeon', 'vault'], 'THE ALCHEMIST’S FURNACE BREATHES THROUGH THE WALLS'), t('crusher', 'flame', ['cellarway'], 'THE PORTCULLIS HANGS BY A ROTTEN ROPE')]),
  outsider_crypt: set([t('watcher', 'glass', ['gallery', 'cloister'], 'SOMETHING IN THE GLASS WATCHES WHERE YOU STAND')]),
  hound_churchyard: set([t('spikes', 'sand', ['tombs', 'catacomb'], 'THE GRAVE-ROBBERS SPIKED THEIR WAY')], 'ladder'),
  deserted_house: set([t('watcher', 'eye', ['stair_hall', 'landing'], 'EYES IN THE DARK FOLLOW EVERY STEP')]),
  swamp_tomb: set([t('gas', 'coil', ['reeds', 'passage'], 'THE MIASMA CLOGS THE CHEST', 'stamina')], 'lane'),
  shunned_cellar: set([t('gas', 'stain', ['nitre'], 'THE NITRE EXHALES A PALE VAPOUR', 'sanity')], 'slot'),
  red_hook_vaults: set([t('darts', 'brine', ['sewer', 'quay'], 'THE SMUGGLERS SET HARPOONS IN THE WALLS')]),
  old_man_house: set([t('blades', 'bolt', ['kitchen', 'upper'], 'THE LEAD PENDULUMS SWING')]),
  whateley_farm: set([t('boulder', 'coil', ['hayloft'], 'SOMETHING UNSEEN SHOVES THINGS DOWN THE LOFT')]),
  sculptor_studio: set([t('crusher', 'sign', ['loggia', 'landing'], 'THE PLINTHS OVERHEAD ARE NOT AT REST')]),
  rue_dauseil: set([t('tide', 'sign', ['alley', 'hallway'], 'THE MUSIC COMES DOWN THE STREET IN WAVES')]),
};
