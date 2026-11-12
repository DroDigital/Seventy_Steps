/**
 * The demo's keep lists (src/data/demoContent.ts, docs/DEMO_BUILD.md) against the full game's own data: every id the demo keeps is one
 * the data has, and the realm and weapon lists the prune rules lean on are the data's. A kept id the data lacks would keep nothing and
 * cut nothing for it, silently. The demo's own tests (tests/demo) hold the pruned build to the same data.
 */

import { describe, expect, it } from 'vitest';
import { ALL_REALMS, ALL_WEAPONS } from '../tools/demo/rules/keep.ts';
import { KEEP } from '../src/data/demoContent.ts';
import { ACHIEVEMENTS } from '../src/data/achievements.ts';
import { BOSS_TRACKS } from '../src/data/bossMusic.ts';
import { ARENA_SETS } from '../src/data/arenaSetsAll.ts';
import { DUNGEONS } from '../src/data/dungeons.ts';
import { ENTITIES } from '../src/data/registry.ts';
import { KITS } from '../src/data/kits.ts';
import { MODEL_INFO } from '../src/data/models/index.ts';
import { NPCS } from '../src/data/npcs.ts';
import { POIS } from '../src/data/pois.ts';
import { QUESTS } from '../src/data/quests.ts';
import { REALM_TRACKS } from '../src/data/realmMusic.ts';
import { REGION_IDS } from '../src/data/regions.ts';
import { ROOM_SETS } from '../src/data/roomSets.ts';
import { SITES } from '../src/data/sites.ts';
import { CAST } from '../src/data/speechCast.ts';
import { WANDERINGS } from '../src/data/wanderers.ts';
import { WEAPONS } from '../src/data/weapons.ts';

const sitesOf = (kind: 'signs' | 'gates'): string[] => Object.values(SITES).flatMap((s) => s[kind].map((x) => x.id));
/** The signs a dungeon's rooms stand (the Library's archive, the Witch House's stair): they are sites too. */
const roomSigns = (): string[] => DUNGEONS.flatMap((d) => (d.rooms as readonly { sign?: { id: string } }[]).flatMap((r) => (r.sign ? [r.sign.id] : [])));
const entityIds = ENTITIES.map((e) => e.id);
/** The kept ids the data does not have. */
const missing = (kept: readonly string[], have: readonly string[]): string[] => kept.filter((id) => !have.includes(id));

describe('the keep lists name what the full game has', () => {
  it('regions', () => expect(missing(KEEP.regions, REGION_IDS)).toEqual([]));
  it('signs', () => expect(missing(KEEP.signs, [...sitesOf('signs'), ...roomSigns()])).toEqual([]));
  it('gates', () => expect(missing(KEEP.gates, sitesOf('gates'))).toEqual([]));
  it('dungeons', () => expect(missing(KEEP.dungeons, DUNGEONS.map((d) => d.id))).toEqual([]));
  it('room sets', () => expect(missing(KEEP.roomSets, Object.keys(ROOM_SETS))).toEqual([]));
  it('arenas', () => expect(missing(KEEP.arenas, Object.keys(ARENA_SETS))).toEqual([]));
  it('kits', () => expect(missing(KEEP.kits, Object.keys(KITS))).toEqual([]));
  it('entities', () => expect(missing(KEEP.entities, entityIds)).toEqual([]));
  it('bosses', () => expect(missing(KEEP.bosses, entityIds)).toEqual([]));
  it('halls', () => expect(missing(KEEP.halls, entityIds)).toEqual([]));
  it('npcs', () => expect(missing(KEEP.npcs, NPCS.map((n) => n.id))).toEqual([]));
  it('quests', () => expect(missing(KEEP.quests, Object.keys(QUESTS))).toEqual([]));
  it('points of interest', () => expect(missing(KEEP.pois, POIS.map((p) => p.id))).toEqual([]));
  it('wanderings', () => expect(missing(KEEP.wanderings, WANDERINGS.map((w) => w.id))).toEqual([]));
  it('achievements', () => expect(missing(KEEP.achievements, Object.keys(ACHIEVEMENTS))).toEqual([]));
  it('weapons', () => expect(missing(KEEP.weapons, Object.keys(WEAPONS))).toEqual([]));
  it('realm tracks', () => expect(missing(KEEP.realmTracks, Object.keys(REALM_TRACKS))).toEqual([]));
  it('boss tracks', () => expect(missing(KEEP.bossTracks, Object.keys(BOSS_TRACKS))).toEqual([]));
  it('models', () => expect(missing(KEEP.models, Object.keys(MODEL_INFO))).toEqual([]));
  it('voices', () => expect(missing(KEEP.voices, Object.keys(CAST))).toEqual([]));

  it('the realms and weapons the prune rules list are the data\'s', () => {
    expect([...ALL_REALMS].sort()).toEqual([...REGION_IDS].sort());
    expect([...ALL_WEAPONS].sort()).toEqual(Object.keys(WEAPONS).sort());
  });
});
