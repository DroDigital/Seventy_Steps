/**
 * The demo's world, in the demo's own build of the sources (`vitest --mode demo`: __DEMO__ true, the rest of the game pruned out):
 * the realms it keeps are the university and Arkham, and the world builds at the university and steps without a fault.
 */

import { describe, expect, it } from 'vitest';
import { ALL_REALMS } from '../../tools/demo/rules/keep.ts';
import { KEEP } from '../../src/data/demoContent.ts';
import { DOCUMENTS } from '../../src/data/documents.ts';
import { DUNGEONS } from '../../src/data/dungeons.ts';
import { FAR_DUNGEONS } from '../../src/data/dungeonsFar.ts';
import { LAIRS } from '../../src/data/lairs.ts';
import { DUNGEON_KITS, type KitId } from '../../src/data/kits.ts';
import { KIT_PILLARS } from '../../src/data/dungeonLooks.ts';
import { REGION_IDS } from '../../src/data/regions.ts';
import { createWorldGame } from '../../src/systems/game.ts';
import { steps } from '../helpers.ts';

describe("the demo's world", () => {
  it('keeps the university and Arkham of the full game, and none of its other realms', () => {
    expect(REGION_IDS.filter((id) => ALL_REALMS.includes(id))).toEqual([...KEEP.regions]);
  });

  // (the pages are titled as the demo titles them: a page's key differs by edition, src/data/documentsHouses.ts)
  it('keeps every page it names, as its documents are titled in the demo', () => {
    expect(KEEP.documents.filter((title) => !Object.keys(DOCUMENTS).includes(title))).toEqual([]);
  });

  // (a room's pillars are its kit's, read without a fallback: a kit the demo cut would leave a dungeon's rooms with no pillar form)
  it('keeps the pillars of every kit its dungeons use', () => {
    const dungeons = [...DUNGEONS, ...FAR_DUNGEONS, ...LAIRS];
    const used = dungeons.flatMap((d) => [DUNGEON_KITS[d.id], ...d.rooms.map((r) => r.kit)]).filter((k): k is KitId => k !== undefined);
    expect(used.filter((k) => KIT_PILLARS[k] === undefined)).toEqual([]);
  });

  it('builds at the university and steps without a fault', () => {
    const g = createWorldGame({ demo: true });
    expect(g.overworld?.region).toBe('hub');
    steps(g, 900);
  });
});
