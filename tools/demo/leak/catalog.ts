/**
 * What the demo must not hold (docs/DEMO_BUILD.md): every id, display name and file name of the full game's content, read from the
 * full game's own data, less what the demo keeps (tools/demo/... `KEEP` in src/data/demoContent.ts). A new table of content is added
 * here when it is made, so the leak check sees it. Imports the data as the full game has it: the leak check runs in the full game's
 * mode, never the demo's.
 */

import { KEEP } from '../../../src/data/demoContent.ts';
import { GAME_NAME } from '../../../src/data/intro.ts';
import { ENTITIES } from '../../../src/data/registry.ts';
import { OUTER_DARK, REGIONS } from '../../../src/data/regions.ts';
import { ROSTER_IDS } from '../../../src/data/roster.ts';
import { SITES } from '../../../src/data/sites.ts';
import { DUNGEONS } from '../../../src/data/dungeons.ts';
import { NPCS } from '../../../src/data/npcs.ts';
import { POIS } from '../../../src/data/pois.ts';
import { QUESTS } from '../../../src/data/quests.ts';
import { DOCUMENTS } from '../../../src/data/documents.ts';
import { ACHIEVEMENTS } from '../../../src/data/achievements.ts';
import { WEAPONS } from '../../../src/data/weapons.ts';
import { RELICS } from '../../../src/data/relics.ts';
import { BOSS_TRACKS } from '../../../src/data/bossMusic.ts';
import { REALM_TRACKS } from '../../../src/data/realmMusic.ts';
import { MODEL_INFO } from '../../../src/data/models/index.ts';
import { DISCOVERIES } from '../../../src/data/discoveriesAll.ts';
import { ARENA_SETS } from '../../../src/data/arenaSetsAll.ts';
import { ARENA_WAYS } from '../../../src/data/arenaWaysAll.ts';
import { ARENA_HOUSES } from '../../../src/data/arenaHousesAll.ts';
import { ARENA_STYLES } from '../../../src/data/arenaStyles.ts';
import { ROOM_SETS } from '../../../src/data/roomSets.ts';
import { KITS } from '../../../src/data/kits.ts';
import { CAST } from '../../../src/data/speechCast.ts';
import { ENDING_IDS } from '../../../src/data/endings.ts';
import { VOCABULARY } from './vocabulary.ts';
import type { Forbidden } from '../leak.ts';

/** A display name and the id of the thing it names: a name is forbidden only when its thing is not kept. */
interface Named {
  id: string;
  name: string;
}

/** The named things of a list of records, by their `id` field and their `name` field, where they have both. */
const namedOf = (list: readonly object[]): Named[] =>
  list.flatMap((r) => {
    const { id, name } = r as Record<string, unknown>;
    return typeof id === 'string' && typeof name === 'string' ? [{ id, name }] : [];
  });

/** The records of a keyed table, keyed by their key, named by their `name` field. */
const namedIn = (table: Readonly<Record<string, object>>): Named[] => Object.entries(table).map(([id, v]) => ({ id, name: (v as { name: string }).name }));

/** The sites of every region: its signs, gates, arenas, allies and dungeons, by their ids (and their names, where they have them). */
const sites = (): Named[] => Object.values(SITES).flatMap((s) => namedOf([...s.signs, ...s.arenas, ...s.allies, ...s.gates, ...s.dungeons]));

const siteIds = (): string[] => sites().map((x) => x.id);

/** Every id the full game has, by the table it is in (the label says which, for the report), lower case where it is read. */
function universe(): { ids: [label: string, id: string][]; names: Named[] } {
  const by = (label: string, ids: readonly string[]): [string, string][] => ids.map((id) => [label, id]);
  const ids = [
    ...by('ROSTER', ROSTER_IDS),
    ...by('REGIONS', [...REGIONS.map((r) => r.id), ...OUTER_DARK]),
    ...by('SITES', siteIds()),
    ...by('DUNGEONS', DUNGEONS.map((d) => d.id)),
    ...by('NPCS', NPCS.map((n) => n.id)),
    ...by('POIS', POIS.map((p) => p.id)),
    ...by('QUESTS', Object.keys(QUESTS)),
    ...by('ACHIEVEMENTS', Object.keys(ACHIEVEMENTS)),
    ...by('WEAPONS', Object.keys(WEAPONS)),
    ...by('RELICS', Object.keys(RELICS)),
    ...by('BOSS_TRACKS', Object.keys(BOSS_TRACKS)),
    ...by('REALM_TRACKS', Object.keys(REALM_TRACKS)),
    ...by('MODEL_INFO', Object.keys(MODEL_INFO)),
    ...by('DISCOVERIES', Object.keys(DISCOVERIES)),
    ...by('ARENA_SETS', Object.keys(ARENA_SETS)),
    ...by('ARENA_WAYS', Object.keys(ARENA_WAYS)),
    ...by('ARENA_HOUSES', Object.keys(ARENA_HOUSES)),
    ...by('ARENA_STYLES', Object.keys(ARENA_STYLES)),
    ...by('ROOM_SETS', Object.keys(ROOM_SETS)),
    ...by('KITS', Object.keys(KITS)),
    ...by('CAST', Object.keys(CAST).filter((k) => !KEEP.voices.includes(k as never)).map((k) => k.slice(k.indexOf(':') + 1))),
    ...by('ENDINGS', ENDING_IDS),
  ];
  const named: Named[] = [
    ...namedOf(ENTITIES),
    ...namedOf(REGIONS),
    ...namedOf(DUNGEONS),
    ...namedOf(NPCS),
    ...namedOf(POIS),
    ...namedIn(ACHIEVEMENTS),
    ...namedIn(WEAPONS),
    ...namedIn(RELICS),
    ...sites(),
    ...Object.keys(DOCUMENTS).map((title) => ({ id: title, name: title })),
  ];
  const names = named.filter((x) => x.name.length >= 6).map((x) => ({ id: x.id.toLowerCase(), name: x.name }));
  return { ids, names };
}

/** What the demo must not hold: the full game's ids and names less those the demo keeps, and less the engine's own vocabulary. */
export function forbidden(): Forbidden & { from: Map<string, string> } {
  const kept = new Set(Object.values(KEEP).flat().map((s) => s.toLowerCase()));
  const u = universe();
  const from = new Map<string, string>();
  for (const [label, id] of u.ids) {
    const low = id.toLowerCase();
    if (!kept.has(low) && !VOCABULARY.has(low) && !from.has(low)) from.set(low, label);
  }
  // (the game's title is the demo's title too: an achievement or a dungeon may carry it, and that is no content of the full game's)
  const names = [...new Set(u.names.filter((n) => !kept.has(n.id) && n.name !== GAME_NAME).map((n) => n.name))];
  return { ids: new Set(from.keys()), names, from };
}
