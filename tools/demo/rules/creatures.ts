/**
 * The demo's pruning of the creatures and the horrors (docs/DEMO_BUILD.md): the entity tables, every table keyed by a creature, a horror,
 * a hall, an arena or a non-player, and their pictures, sounds, blows and cutscenes. See rules/index.ts.
 */

import type { PruneRule } from '../prune.ts';
import { kept } from './keep.ts';

const entities = kept('entities');
const arenas = kept('arenas');
const halls = kept('halls');
const npcs = kept('npcs');
const weapons = kept('weapons');
const achievements = kept('achievements');
const voices = kept('voices');
const bosses = kept('bosses');
const bossTracks = kept('bossTracks');

/** The keyed tables of creatures: each keyed by an entity id (a variant key `id#eldritch` keeps with its id). */
const byEntity = (file: string, decl: string, mustRemove = true): PruneRule => ({ file, decl, shape: 'properties', keep: entities, mustRemove });

/** The entity tables: each `tier(…, [ { id, regions, … } ])`. A creature the demo keeps keeps only the regions the demo keeps. */
const tier = (file: string, decl: string): PruneRule[] => [
  { file, decl, shape: 'elements', by: 'id', keep: entities },
  { file, decl, shape: 'elements', by: 'id', nested: 'regions', keep: kept('regions'), mustRemove: false },
];

export const rules: readonly PruneRule[] = [
  ...tier('src/data/entities/lesser.ts', 'LESSER'),
  ...tier('src/data/entities/greater.ts', 'GREATER'),
  ...tier('src/data/entities/named.ts', 'NAMED'),
  ...tier('src/data/entities/greatOldOnes.ts', 'GREAT_OLD_ONES'),
  ...tier('src/data/entities/outerGods.ts', 'OUTER_GODS'),
  ...tier('src/data/entities/allies.ts', 'ALLIES'),
  byEntity('src/data/bestiaryNotes.ts', 'FIELD_NOTES'),
  byEntity('src/data/creatureSounds.ts', 'CREATURE_SOUNDS'),
  byEntity('src/data/reviewedLook.ts', 'REVIEWED_EYES'),
  byEntity('src/data/reviewedLook.ts', 'REVIEWED_BODY'),
  byEntity('src/data/reviewedLook.ts', 'REVIEWED_GROUND'),
  byEntity('src/data/reviewedLook.ts', 'REVIEWED_GLINTS'),
  byEntity('src/data/reviewedLook.ts', 'REVIEWED_MATTER'),
  byEntity('src/data/attackSignatures.ts', 'HORRORS'),
  byEntity('src/data/attackSignatures.ts', 'THEMED_GREATER'),
  byEntity('src/data/bossPunish.ts', 'BOSS_BAND'),
  byEntity('src/data/bossAttackTheme.ts', 'BOSS_ATTACK_THEME'),
  byEntity('src/data/bossStanding.ts', 'BOSS_STANDING'),
  byEntity('src/data/bossAuras.ts', 'BOSS_AURAS'),
  byEntity('src/data/foeBlows.ts', 'FOE_BLOWS'),
  byEntity('src/data/shotForms.ts', 'SHOTS'),
  byEntity('src/data/beamStyles.ts', 'BEAM_STYLES'),
  byEntity('src/data/epitaphs.ts', 'EPITAPHS'),
  byEntity('src/data/bossCards.ts', 'EPITHETS'),
  byEntity('src/data/speechBosses.ts', 'BOSS_SAY'),
  byEntity('src/data/rumors.ts', 'RUMORS'),
  byEntity('src/data/cutscenesBoss.ts', 'BESPOKE'),
  byEntity('src/data/cutscenesFall.ts', 'FALLS'),
  byEntity('src/data/cutscenesMore.ts', 'MORE'),
  byEntity('src/data/cutscenesRest.ts', 'REST'),
  byEntity('src/data/cutscenesDeep.ts', 'DEEP'),
  byEntity('src/data/fogThemes.ts', 'BY_BOSS'),
  byEntity('src/data/ngPlusTuning.ts', 'CREATURE_JOURNEY'),
  // the registries of the horrors: the places, signatures and aoe looks the demo's arenas use (Colour and the Black Man, in EXTRAS)
  { file: 'src/world/places/index.ts', decl: 'PLACES', shape: 'properties', keep: [] }, // (every other place's planner goes with it: its module is no longer read)
  { file: 'src/systems/signatures.ts', decl: 'SIGNATURES', shape: 'properties', keep: bosses },
  { file: 'src/render/aoeLook.ts', decl: 'ASSIGN', shape: 'properties', keep: entities },
  // the boss themes (data/bossMusic.ts, data/bossMusicMap.ts): by track, and the horrors each track scores
  { file: 'src/data/bossMusic.ts', decl: 'BOSS_TRACKS', shape: 'properties', keep: bossTracks },
  { file: 'src/data/bossMusic.ts', decl: 'BOSS_TRACKS', shape: 'properties', keep: bosses, nested: 'bosses', mustRemove: false },
  { file: 'src/data/bossMusic.ts', decl: 'OVERRIDES', shape: 'properties', keep: bossTracks },
  { file: 'src/data/bossMusicMap.ts', decl: 'BOSS_MAP', shape: 'properties', keep: bossTracks },
  // the halls of the dungeons' horrors, and the arenas of the open ones
  { file: 'src/data/hallSetsEarth.ts', decl: 'EARTH_HALLS', shape: 'properties', keep: halls },
  { file: 'src/data/hallSetsLairs.ts', decl: 'LAIR_HALLS', shape: 'properties', keep: halls },
  { file: 'src/data/hallSetsFar.ts', decl: 'FAR_HALLS', shape: 'properties', keep: halls },
  { file: 'src/data/arenaStyles.ts', decl: 'ARENA_STYLES', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaMists.ts', decl: 'ARENA_MISTS', shape: 'properties', keep: arenas },
  { file: 'src/data/discoveriesEarth.ts', decl: 'EARTH_DISCOVERIES', shape: 'properties', keep: arenas },
  { file: 'src/data/discoveriesBeyond.ts', decl: 'BEYOND_DISCOVERIES', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaHousesBeyond.ts', decl: 'BEYOND_HOUSES', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaSetsBeyond.ts', decl: 'BEYOND_SETS', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaWaysBeyond.ts', decl: 'BEYOND_WAYS', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaOuter.ts', decl: 'OUTER_HOUSES', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaOuter.ts', decl: 'OUTER_SETS', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaOuter.ts', decl: 'OUTER_WAYS', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaHousesEarth.ts', decl: 'EARTH_HOUSES', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaSetsEarth.ts', decl: 'EARTH_SETS', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaWaysEarth.ts', decl: 'EARTH_WAYS', shape: 'properties', keep: arenas },
  { file: 'src/data/arenaOuter.ts', decl: 'OUTER_DISCOVERIES', shape: 'properties', keep: arenas },
  // the people (the story's tables, by the person they are about)
  { file: 'src/data/npcs.ts', decl: 'NEAR_NPCS', shape: 'elements', by: 'id', keep: npcs },
  { file: 'src/data/npcsFar.ts', decl: 'FAR_NPCS', shape: 'elements', by: 'id', keep: npcs },
  { file: 'src/data/epilogues.ts', decl: 'FATES', shape: 'properties', keep: npcs },
  { file: 'src/data/npcActs.ts', decl: 'ACTS', shape: 'properties', keep: npcs },
  { file: 'src/data/overheard.ts', decl: 'OVERHEARD', shape: 'properties', keep: npcs },
  { file: 'src/data/wares.ts', decl: 'SHOPS', shape: 'properties', keep: npcs },
  // the things the player finds and keeps
  { file: 'src/data/weapons.ts', decl: 'WEAPONS', shape: 'properties', keep: weapons },
  { file: 'src/data/weapons.ts', decl: 'WEAPON_WHERE', shape: 'properties', keep: weapons },
  { file: 'src/data/relics.ts', decl: 'RELICS', shape: 'properties', keep: () => false },
  { file: 'src/data/relics.ts', decl: 'TEMPERS', shape: 'properties', keep: weapons },
  { file: 'src/data/achievements.ts', decl: 'ACHIEVEMENTS', shape: 'properties', keep: achievements },
  // the endings, which the demo does not reach
  { file: 'src/data/endings.ts', decl: 'ENDINGS', shape: 'properties', keep: () => false },
  { file: 'src/data/endingNarration.ts', decl: 'ENDING_NARRATION', shape: 'properties', keep: () => false },
  { file: 'src/data/cutscenesEndings.ts', decl: 'NARRATION_AT', shape: 'properties', keep: () => false },
  { file: 'src/data/cutscenesEndings.ts', decl: 'ENDING_SCENES', shape: 'properties', keep: () => false },
  // the voices: each speaker the demo has a recording of
  { file: 'src/data/speechCast.ts', decl: 'CAST', shape: 'properties', keep: voices },
  // the registries and tables of horrors and people the demo does not keep
  { file: 'src/render/npcFigures.ts', decl: 'WHO', shape: 'properties', keep: npcs },
  { file: 'src/systems/seaBosses.ts', decl: 'PARTNER', shape: 'properties', keep: bosses },
  { file: 'src/data/playTuning.ts', decl: 'SEALS', path: ['after'], shape: 'properties', keep: bosses },
  { file: 'src/data/endings.ts', decl: 'ENDING_IDS', shape: 'elements', by: 'self', keep: () => false }, // (the endings are the rest of the game's)
  { file: 'src/render/sprites/reviewedMerge.ts', decl: 'ALLIED_ART_KEYS', shape: 'elements', by: 'self', keep: entities }, // (the allies the demo keeps: its art)
  { file: 'src/data/gore.ts', decl: 'GORE', shape: 'properties', keep: entities }, // (each creature's break and blood, round 113)
  { file: 'src/data/hallLore.ts', decl: 'EARTH_LORE', shape: 'properties', keep: halls }, // (a boss hall's lore, by its first boss: round 108)
  { file: 'src/data/hallLoreLairs.ts', decl: 'LAIR_LORE', shape: 'properties', keep: halls },
];

export const rest: readonly string[] = [];
