import { describe, expect, it } from 'vitest';
import { ARENA } from '../src/data/arena';
import { DUNGEONS } from '../src/data/dungeons';
import { QUESTS } from '../src/data/quests';
import { createWorldGame } from '../src/systems/game';
import { changeInsight, offerInsight } from '../src/systems/insight';
import { openAround } from '../src/systems/passages';
import { snapshot } from '../src/systems/save';
import { closedBy, PASSAGE_NEED, PASSAGES } from '../src/systems/veil';
import { worldLayout } from '../src/world/placements';

describe('secret-path Insight progression', () => {
  it('can fund every threshold from earlier sources without a reward hidden behind itself', () => {
    let insight = QUESTS.witch_house.stages.find((s) => s.goal.kind === 'talk' && s.goal.npc === 'gilman')!.gift!.insight!;
    // These introductory secrets both open from Gilman's first point; neither needs a boss kill.
    for (const [dungeon, room] of [['witch_house', 'closet'], ['library', 'restricted']] as const) {
      const r = DUNGEONS.find((d) => d.id === dungeon)!.rooms.find((r) => r.id === room)!;
      expect(r.hidden!.minInsight).toBeLessThanOrEqual(insight);
      insight += r.tome!.insight;
    }
    const deep = DUNGEONS.filter((d) => ['vermont', 'mountains', 'pnakotus', 'kn_yan'].includes(d.region));
    for (const d of deep) for (const r of d.rooms) {
      if (r.hidden?.minInsight !== undefined) {
        expect(r.hidden.minInsight, `${d.id}/${r.id}`).toBeGreaterThan(2);
        expect(r.hidden.minInsight, `${d.id}/${r.id}`).toBeLessThanOrEqual(insight);
      }
    }
    // The Witch House's boss route remains open with no Insight; its quest pays one more point.
    insight += QUESTS.witch_house.reward.insight!;
    expect(PASSAGE_NEED).toBeLessThanOrEqual(insight);
    for (const d of DUNGEONS.filter((d) => ['rlyeh', 'yuggoth'].includes(d.region))) {
      for (const r of d.rooms) if (r.hidden?.minInsight !== undefined) expect(r.hidden.minInsight).toBeGreaterThan(4);
    }
  });

  it('uses every authored threshold in the live world, charges nothing to enter, and warns before spending would close it', () => {
    const g = createWorldGame();
    const passages = [...g.ecs.c.piece].filter(([, p]) => p.def.seal && p.def.minInsight !== undefined);
    expect(passages).toHaveLength(PASSAGES.length);
    for (const [id, piece] of passages) {
      const need = piece.def.minInsight!;
      changeInsight(g, need - 1 - g.mind.insight, 'debug', 'test');
      expect(g.ecs.c.layer.get(id)!.shown, piece.def.name).toBe(false);
      expect(piece.seal.every((c) => !g.world.off.has(c)), piece.def.name).toBe(true);
      changeInsight(g, 1, 'debug', 'test');
      expect(g.ecs.c.layer.get(id)!.shown, piece.def.name).toBe(true);
      openAround(g, piece.def);
      expect(piece.seal.every((c) => g.world.off.has(c)), piece.def.name).toBe(true);
      if (piece.def.bridge) expect(piece.colliders.every((c) => !g.world.off.has(c))).toBe(true);
      expect(g.mind.insight).toBe(need); // the threshold is held, never paid on entry
      expect(closedBy(need, 1).map((p) => `${p.dungeon}: ${p.room}`)).toContain(piece.def.name.replaceAll('_', ' '));
      changeInsight(g, -1, 'debug', 'test');
      expect(g.ecs.c.layer.get(id)!.shown, piece.def.name).toBe(false);
      expect(piece.seal.every((c) => !g.world.off.has(c)), piece.def.name).toBe(true);
    }
    changeInsight(g, 100, 'debug', 'test');
    offerInsight(g); // selling retains both the new maximum and all unbought Mind upgrades
    expect(passages.every(([id]) => g.ecs.c.layer.get(id)!.shown)).toBe(true);
  });

  it('keeps sanity-only paths and the arena demonstration independent of increased Insight requirements', () => {
    const sanity = DUNGEONS.flatMap((d) => d.rooms.filter((r) => r.hidden?.maxSanity !== undefined).map((r) => ({ id: `${d.id}/${r.id}`, ...r.hidden })));
    expect(sanity.map((r) => r.id).sort()).toEqual(['library/sealed_stacks', 'risen_rlyeh/wrong', 'ultimate_void/mirrors']);
    for (const path of sanity) {
      expect(path.maxSanity).toBe(40);
      expect(path.minInsight).toBeUndefined();
    }
    expect(ARENA.hidden.find((p) => p.minInsight !== undefined)!.minInsight).toBeLessThanOrEqual(ARENA.tome.insight);
  });

  it('returns an older save stranded beyond a raised threshold to its checkpoint with progress and resources intact', () => {
    const saved = { ...snapshot(createWorldGame()), echoes: 321, hp: 37, seen: ['deep_one'], read: ["Curwen's Journal"], slain: ['boss:keziah_mason'] };
    // Cover the immediate secret, descendants behind a doorway, and descendants across a bridge.
    for (const [dungeon, room, insight] of [['migo_cities', 'brain_rack', 1], ['curwen_catacombs', 'saltes', 2], ['akeley', 'hangar', 2]] as const) {
      const r = worldLayout().dungeons.find((d) => d.layout.def.id === dungeon)!.layout.rooms.find((r) => r.def.id === room)!;
      const g = createWorldGame({ save: { ...saved, insight, at: { x: r.x, z: r.z, yaw: 0 } } });
      expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: g.player.checkpoint.x, z: g.player.checkpoint.z });
      expect(g.player.echoes).toBe(saved.echoes);
      expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(saved.hp);
      expect(g.mind.insight).toBe(insight);
      expect(g.mind.seen).toEqual(new Set(saved.seen));
      expect(g.overworld!.read).toEqual(new Set(saved.read));
      expect(g.overworld!.slain).toEqual(new Set(saved.slain));
    }
    // Affordable branches and unrelated rooms continue exactly where they were saved.
    for (const [dungeon, room, insight] of [['akeley', 'hangar', 4], ['library', 'reading', 0]] as const) {
      const r = worldLayout().dungeons.find((d) => d.layout.def.id === dungeon)!.layout.rooms.find((r) => r.def.id === room)!;
      const g = createWorldGame({ save: { ...saved, insight, at: { x: r.x, z: r.z, yaw: 0 } } });
      expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: r.x, z: r.z });
    }
  });
});
