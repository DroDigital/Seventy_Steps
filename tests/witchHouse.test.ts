/**
 * The Witch House is not the first room the story walks into: Gilman sends the investigator for the police report, tells them what
 * it means and shows them how to look, and the stair landing and the closet only insight shows come before the garret.
 */
import { describe, expect, it } from 'vitest';
import { DOCUMENTS } from '../src/data/documents';
import { NPCS } from '../src/data/npcs';
import { QUESTS } from '../src/data/quests';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { goalPlace, mainLead } from '../src/systems/lead';
import { npcEntity, talk } from '../src/systems/npcs';
import { isDone, stageOf, startQuest } from '../src/systems/quests';
import { worldLayout } from '../src/world/placements';
import { record, run } from './worldHelpers';

const RILEY = "Officer Riley's Report";
const FORMULAE = "Keziah's Formulae";
const stages = QUESTS.witch_house.stages;

const said = (g: Game, npc: string): string => {
  const heard = record(g, 'Talked');
  talk(g, npc);
  return heard[0].lines.join(' ');
};
/** A game where Gilman has just given the Witch House. */
const begun = (): Game => {
  const g = createWorldGame();
  startQuest(g, 'sleepers');
  said(g, 'gilman');
  return g;
};
const closet = (g: Game) => [...g.ecs.c.piece].find(([, p]) => p.def.name === 'The Witch House: closet')!;

describe('the Witch House, in five stages', () => {
  it('goes from the report to the talk, the stair, the formulae and the witch, each stage with a goal the story can lead to', () => {
    expect(stages.map((s) => s.goal.kind)).toEqual(['read', 'talk', 'reach', 'read', 'slay']);
    expect(QUESTS.witch_house.lenient).toBe(true);
    for (const s of stages) {
      expect(goalPlace(s.goal), s.note).not.toBeNull();
      expect(s.note.length).toBeGreaterThan(60);
      if (s.goal.kind === 'read') expect(DOCUMENTS[s.goal.doc], s.goal.doc).toBeDefined();
    }
    expect(NPCS.find((n) => n.id === 'gilman')!.topics.filter((t) => t.when?.some((w) => w.quest === 'witch_house' && typeof w.at === 'number'))).toHaveLength(stages.length); // a word for every stage
  });

  it('leads to the report where it lies, and to the closet where it is hidden', () => {
    const w = worldLayout();
    const report = w.tomes.find((t) => t.name === RILEY)!;
    expect(goalPlace({ kind: 'read', doc: RILEY })).toEqual({ x: report.at.x, z: report.at.z });
    const room = w.dungeons.find((d) => d.layout.def.id === 'witch_house')!.layout.rooms.find((r) => r.def.id === 'closet')!;
    expect(room.def.tome?.name).toBe(FORMULAE);
    const tome = w.tomes.find((t) => t.name === FORMULAE)!; // lying in that room: the lead goes to the book itself
    expect(Math.hypot(tome.at.x - room.x, tome.at.z - room.z)).toBeLessThan(room.half);
    expect(goalPlace({ kind: 'read', doc: FORMULAE })).toEqual({ x: tome.at.x, z: tome.at.z });
  });

  it('is walked in order: the report, Gilman, the stair, the formulae, the witch', () => {
    const g = begun();
    const ow = g.overworld!;
    expect(stageOf(g, 'witch_house')).toBe(0);
    expect(mainLead(g)!.text).toBe(stages[0].note);
    run(g, 31);
    expect(stageOf(g, 'witch_house')).toBe(0); // the report is not read
    ow.read.add(RILEY);
    run(g, 31);
    expect(stageOf(g, 'witch_house')).toBe(1);
    expect(mainLead(g)!.text).toBe(stages[1].note);

    const before = g.mind.insight;
    expect(said(g, 'gilman')).toContain('closet'); // what the report means, and where the formulae are
    expect(stageOf(g, 'witch_house')).toBe(2);
    expect(g.mind.insight).toBe(before + 1); // he shows them how to look
    ow.discovered.add('arkham_witch');
    run(g, 31);
    expect(stageOf(g, 'witch_house')).toBe(3);
    ow.read.add(FORMULAE);
    run(g, 31);
    expect(stageOf(g, 'witch_house')).toBe(4);
    expect(mainLead(g)!.text).toBe(stages[4].note);
    expect(isDone(g, 'witch_house')).toBe(false);
    ow.slain.add('boss:keziah_mason');
    run(g, 31);
    expect(isDone(g, 'witch_house')).toBe(true);
    expect(stageOf(g, 'descent')).toBe(0); // the stair opens as she falls
  });

  it('has Gilman say what each stage asks, once and then again', () => {
    const g = begun();
    expect(said(g, 'gilman')).toContain('Riley'); // the first stage
    g.overworld!.read.add(RILEY);
    run(g, 31);
    const talk1 = said(g, 'gilman');
    expect(talk1).toContain('Brown Jenkin');
    expect(talk1).toContain('spend');
    expect(said(g, 'gilman')).toContain('landing'); // the third
    g.overworld!.discovered.add('arkham_witch');
    run(g, 31);
    expect(said(g, 'gilman')).toContain('closet');
    g.overworld!.read.add(FORMULAE);
    run(g, 31);
    expect(said(g, 'gilman')).toContain('garret');
  });

  it("gives insight at Gilman's word, and a closet that was a wall opens to it", () => {
    const g = begun();
    const [id, piece] = closet(g);
    expect(piece.def.minInsight).toBe(1);
    expect(g.ecs.c.layer.get(id)!.shown).toBe(false); // a wall to a mind that has learned nothing
    g.overworld!.read.add(RILEY);
    run(g, 31);
    said(g, 'gilman');
    expect(g.mind.insight).toBe(1);
    expect(g.ecs.c.layer.get(id)!.shown).toBe(true);
  });

  it('is done at once when she falls, without the clues, and without the gift for what was passed over', () => {
    const g = begun();
    g.overworld!.slain.add('boss:keziah_mason');
    run(g, 31);
    expect(isDone(g, 'witch_house')).toBe(true);
    expect(g.mind.insight).toBe(QUESTS.witch_house.reward.insight); // the reward only: no talk, no lesson
    expect(stageOf(g, 'descent')).toBe(0);
  });

  it("takes the world as it finds it, but does not pass over Gilman's lesson: it waits, and what is met after it closes with it", () => {
    const g = begun();
    g.overworld!.read.add(FORMULAE); // the formulae read before the report, before Gilman, before the stair
    g.overworld!.discovered.add('arkham_witch');
    run(g, 31);
    expect(stageOf(g, 'witch_house')).toBe(1); // the report is passed over; Gilman's word is not
    expect(g.mind.insight).toBe(0);
    run(g, 91);
    expect(stageOf(g, 'witch_house')).toBe(1); // it waits for him
    said(g, 'gilman');
    expect(g.mind.insight).toBe(1); // the lesson is given after all
    run(g, 91);
    expect(stageOf(g, 'witch_house')).toBe(4); // and the stair and the formulae, already met, close behind it
  });

  it('says one change for a run of stages the world has passed over, not one for each', () => {
    const g = begun();
    const heard = record(g, 'QuestChanged');
    g.overworld!.read.add(RILEY);
    g.overworld!.read.add(FORMULAE);
    g.overworld!.discovered.add('arkham_witch');
    g.overworld!.slain.add('boss:keziah_mason');
    run(g, 91);
    const changes = heard.filter((c) => c.id === 'witch_house');
    expect(changes.map((c) => c.stage)).toEqual([1, 5]); // the report closes its stage; the rest are passed over at once, to done
    expect(changes.at(-1)!.done).toBe(true);
    expect(npcEntity(g, 'gilman')).toBeDefined();
  });
});
