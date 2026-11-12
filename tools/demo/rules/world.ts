/**
 * The demo's pruning of the world (docs/DEMO_BUILD.md): the realms' tables (sites, dungeons, points of interest, the land's layouts and
 * looks, the realms' sounds and weather), keyed by what each realm or place is. See rules/index.ts.
 */

import { KEEP } from '../../../src/data/demoContent.ts';
import type { PruneRule } from '../prune.ts';
import { kept, realmsOrOther } from './keep.ts';

const regions = kept('regions');
const dungeons = kept('dungeons');

export const rules: readonly PruneRule[] = [
  // the realms: the land's own tables, keyed by region (a realm the demo does not keep has no entry in the demo)
  { file: 'src/data/regions.ts', decl: 'ALL', shape: 'elements', by: 'id', keep: regions }, // (the edge stubs stand after it, in the demo's list: data/regions.ts)
  { file: 'src/data/samples.ts', decl: 'AMBIENCE', shape: 'properties', keep: realmsOrOther() }, // (a scene's own keys, title and arena, stay)
  { file: 'src/data/voices.ts', decl: 'DRONES', shape: 'properties', keep: realmsOrOther() },
  { file: 'src/data/realmMusic.ts', decl: 'BY_REGION', shape: 'properties', keep: regions },
  { file: 'src/data/realmMusic.ts', decl: 'REALM_TRACKS', shape: 'properties', keep: kept('realmTracks') }, // (the titles and realms of the tracks: the demo's two only)
  { file: 'src/data/playTuning.ts', decl: 'SKY', path: ['regions'], shape: 'properties', keep: regions },
  { file: 'src/data/lifeTuning.ts', decl: 'WEATHER', path: ['regions'], shape: 'properties', keep: regions },
  { file: 'src/data/dreadPicture.ts', decl: 'EYES', path: ['regions'], shape: 'properties', keep: regions },
  { file: 'src/data/sites.ts', decl: 'SITES', shape: 'properties', keep: regions },
  { file: 'src/data/documents.ts', decl: 'NOTE_SITES', shape: 'properties', keep: regions },
  { file: 'src/data/regionFeatures.ts', decl: 'REGION_LAYOUTS', shape: 'properties', keep: regions },
  { file: 'src/data/looks.ts', decl: 'LOOKS', shape: 'properties', keep: regions },
  { file: 'src/data/fogs.ts', decl: 'FOGS', shape: 'properties', keep: regions },
  { file: 'src/data/airFields.ts', decl: 'AIR_FIELDS', shape: 'properties', keep: regions },
  { file: 'src/data/skylines.ts', decl: 'SKYLINES', shape: 'properties', keep: regions },
  { file: 'src/data/hours.ts', decl: 'HOUR_COLOURS', shape: 'properties', keep: regions },
  { file: 'src/data/regionPress.ts', decl: 'REGION_PRESS', shape: 'properties', keep: regions },
  { file: 'src/data/ngPlusTuning.ts', decl: 'REGION_JOURNEYS', shape: 'properties', keep: regions },
  { file: 'src/data/placeNames.ts', decl: 'LEXICONS', shape: 'properties', keep: regions },
  { file: 'src/data/placeNames.ts', decl: 'TOLD', shape: 'properties', keep: regions },
  { file: 'src/data/fauna.ts', decl: 'FAUNA', shape: 'properties', keep: regions },
  { file: 'src/data/fauna.ts', decl: 'SKY_VISITORS', shape: 'properties', keep: regions },
  { file: 'src/data/placeSounds.ts', decl: 'PLACE_VOICES', shape: 'properties', keep: regions },
  { file: 'src/data/weatherSkins.ts', decl: 'SKINS', shape: 'properties', keep: regions },
  { file: 'src/data/weatherSkins.ts', decl: 'STREAKS', shape: 'properties', keep: regions },
  { file: 'src/data/coats.ts', decl: 'COATS', shape: 'properties', keep: regions },
  { file: 'src/data/coldBreath.ts', decl: 'COLD', shape: 'properties', keep: regions },
  { file: 'src/data/bodyTuning.ts', decl: 'COLD', shape: 'properties', keep: regions },
  { file: 'src/data/cosmos.ts', decl: 'COSMOS', shape: 'properties', keep: regions },
  { file: 'src/data/coverKinds.ts', decl: 'REGION_COVER', shape: 'properties', keep: regions },
  { file: 'src/data/acoustics.ts', decl: 'REGION_SPACE', shape: 'properties', keep: regions },
  { file: 'src/data/ambienceRoles.ts', decl: 'BED_ROLE', shape: 'properties', keep: regions },
  { file: 'src/data/horizonLife.ts', decl: 'LAMPS', shape: 'elements', by: { prop: 'region' }, keep: regions },
  { file: 'src/data/wanderers.ts', decl: 'WANDERINGS', shape: 'elements', by: 'id', keep: kept('wanderings') },
  { file: 'src/data/deathLines.ts', decl: 'FRAGMENTS', shape: 'properties', keep: regions },
  { file: 'src/data/kits.ts', decl: 'DUNGEON_KITS', shape: 'properties', keep: dungeons },
  { file: 'src/data/dungeons.ts', decl: 'DUNGEONS', shape: 'elements', by: 'id', keep: dungeons },
  { file: 'src/data/dungeonsFar.ts', decl: 'FAR_DUNGEONS', shape: 'elements', by: 'id', keep: dungeons },
  { file: 'src/data/lairs.ts', decl: 'LAIRS', shape: 'elements', by: 'id', keep: dungeons },
  { file: 'src/data/roomSets.ts', decl: 'ROOM_SETS', shape: 'properties', keep: (k) => KEEP.roomSets.includes(k as never) },
  { file: 'src/data/poisWaking.ts', decl: 'POIS_WAKING', shape: 'elements', by: 'id', keep: kept('pois') },
  { file: 'src/data/pois.ts', decl: 'POIS', shape: 'elements', by: 'id', keep: kept('pois'), mustRemove: false }, // (its four tables are spread in: their own rules cut them)
  { file: 'src/data/poisBeyond.ts', decl: 'POIS_BEYOND', shape: 'elements', by: 'id', keep: kept('pois') },
  { file: 'src/data/poisDream.ts', decl: 'POIS_DREAM', shape: 'elements', by: 'id', keep: kept('pois') },
  { file: 'src/data/poisOuter.ts', decl: 'POIS_OUTER', shape: 'elements', by: 'id', keep: kept('pois') },
  { file: 'src/data/gateStyles.ts', decl: 'GATE_STYLES', shape: 'properties', keep: kept('arenas') },
  { file: 'src/data/gateFrames.ts', decl: 'GATE_FRAME', shape: 'properties', keep: kept('gates') },
  { file: 'src/data/documentsHouses.ts', decl: 'HOUSE_DOCUMENTS', shape: 'properties', keep: kept('documents') },
  { file: 'src/data/documentsOuter.ts', decl: 'OUTER_DOCUMENTS', shape: 'properties', keep: kept('documents') },
  { file: 'src/data/documentsBeyond.ts', decl: 'BEYOND_DOCUMENTS', shape: 'properties', keep: kept('documents') },
  { file: 'src/data/documents.ts', decl: 'DOCUMENTS', shape: 'properties', keep: kept('documents') },
  { file: 'src/data/quests.ts', decl: 'HAND', shape: 'properties', keep: kept('quests') }, // (the discoveries' quests come from their own tables, cut above)
  { file: 'src/data/fogThemes.ts', decl: 'BY_REGION', shape: 'properties', keep: regions },
  { file: 'src/data/kits.ts', decl: 'KITS', shape: 'properties', keep: kept('kits') },
  { file: 'src/data/acoustics.ts', decl: 'KIT_SPACE', shape: 'properties', keep: kept('kits') },
  { file: 'src/data/doors.ts', decl: 'DOOR_LOOKS', shape: 'properties', keep: kept('kits') },
  // the realms' lists and tables the demo does not keep: a realm's own entry, or a realm named in a list
  { file: 'src/data/ambienceHours.ts', decl: 'STILL_HOWL', path: ['realms'], shape: 'elements', by: 'self', keep: regions },
  { file: 'src/data/lifeTuning.ts', decl: 'LIGHTNING', path: ['every'], shape: 'properties', keep: regions },
  { file: 'src/data/playTuning.ts', decl: 'SEALS', path: ['exempt'], shape: 'elements', by: 'self', keep: regions },
  { file: 'src/data/playTuning.ts', decl: 'SEALS', shape: 'properties', keep: (k) => k !== 'kadath' }, // (the seals of Kadath's door: the demo has no such door)
  { file: 'src/world/planFill.ts', decl: 'WAKING', shape: 'elements', by: 'self', keep: regions },
  { file: 'src/data/regionEpigraphs.ts', decl: 'EPIGRAPH_REGIONS', shape: 'elements', by: 'self', keep: regions },
  { file: 'src/data/regions.ts', decl: 'OUTER_DARK', shape: 'elements', by: 'self', keep: regions },
  { file: 'src/data/wanderers.ts', decl: 'WANDERINGS', shape: 'elements', by: 'id', nested: 'regions', keep: regions, mustRemove: false },
  { file: 'src/data/regionPress.ts', decl: 'VERMIN_PRESS', shape: 'elements', by: 'self', keep: kept('entities') },
  { file: 'src/render/dungeonFurniture.ts', decl: 'ITEMS', shape: 'properties', keep: kept('kits') },
  // the looks of each realm's houses and props, and of each dungeon's pillars and walls (rounds 108 and 111): keyed by the realm or the dungeon
  { file: 'src/data/houseLooks.ts', decl: 'HOUSE_LOOKS', shape: 'properties', keep: regions },
  { file: 'src/data/propLooks.ts', decl: 'PROP_LOOKS', shape: 'properties', keep: regions },
  { file: 'src/data/dungeonLooks.ts', decl: 'DUNGEON_LOOKS', shape: 'properties', keep: dungeons },
  { file: 'src/data/dungeonLooks.ts', decl: 'KIT_PILLARS', shape: 'properties', keep: kept('kits') },
];

export const rest: readonly string[] = [];
