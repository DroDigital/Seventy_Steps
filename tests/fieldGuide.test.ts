import { describe, expect, it } from 'vitest';
import { GUIDE, GUIDE_GROUPS, HINT_IDS, HINT_KEPT, HINTS_KEPT, hintGiven, takeUpBrowser } from '../src/data/fieldGuide';
import { LANGS } from '../src/data/lang';
import { QUESTS } from '../src/data/quests';
import { createWorldGame } from '../src/systems/game';
import { currentLead, mainLead, trackedLead } from '../src/systems/lead';
import { canTrack, startQuest, talked, track } from '../src/systems/quests';
import { carryOf, parseCarry } from '../src/systems/cycles';
import { parseSave, snapshot } from '../src/systems/save';

describe('the Field Guide: the hints, kept in the save', () => {
  it('files every hint there is, once, under a group, with a name', () => {
    for (const lang of LANGS) {
      const ids = Object.keys(lang.table).filter((k) => k.startsWith('hint.')).map((k) => k.slice(5)).sort();
      expect(ids, lang.id).toEqual([...HINT_IDS].sort());
    }
    for (const id of HINT_IDS) {
      expect(GUIDE_GROUPS, id).toContain(GUIDE[id].group);
      expect(GUIDE[id].title.length, id).toBeGreaterThan(2);
    }
    expect(new Set(HINT_IDS.map((id) => GUIDE[id].title)).size).toBe(HINT_IDS.length); // no two share a name
  });

  it('a new world holds none of them, and says that it keeps them', () => {
    const told = createWorldGame().overworld!.told;
    expect(told.has(HINTS_KEPT)).toBe(true);
    expect([...told].some((k) => k.startsWith(HINT_KEPT))).toBe(false);
    expect(takeUpBrowser(told, ['move', 'fight'])).toBe(false); // it keeps its own: nothing from the browser comes in
    expect(hintGiven(told, 'move')).toBe(false);
  });

  it('a save from before takes up what the browser had been told, once, and only hints there are', () => {
    const old = new Set<string>(['rumor:x']);
    expect(takeUpBrowser(old, ['move', 'fight', 'no_such_hint'])).toBe(true);
    expect(hintGiven(old, 'move') && hintGiven(old, 'fight')).toBe(true);
    expect(hintGiven(old, 'no_such_hint')).toBe(false);
    expect(hintGiven(old, 'boss')).toBe(false);
    expect(takeUpBrowser(old, ['boss'])).toBe(false);
    expect(hintGiven(old, 'boss')).toBe(false); // the second time changes nothing
  });

  it("is each save's own: what one was told, another is not", () => {
    const a = createWorldGame();
    a.overworld!.told.add(HINT_KEPT + 'sign');
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(a)))! });
    expect(hintGiven(loaded.overworld!.told, 'sign')).toBe(true);
    expect(hintGiven(createWorldGame().overworld!.told, 'sign')).toBe(false); // a new game in another slot
  });
});

describe('the hints in a new journey', () => {
  it('go with the investigator: one who was told how to fight is not told again, and the Field Guide goes with them', () => {
    const a = createWorldGame();
    a.overworld!.told.add(HINT_KEPT + 'fight');
    const carry = parseCarry(JSON.parse(JSON.stringify(carryOf(a))))!;
    expect(carry.hints).toEqual(['fight']);
    const next = createWorldGame({ carry });
    expect(hintGiven(next.overworld!.told, 'fight')).toBe(true);
    expect(hintGiven(next.overworld!.told, 'move')).toBe(false);
    expect(parseCarry({ ...carryOf(a), hints: ['fight', 'nonsense', 3] })!.hints).toEqual(['fight']);
    expect(parseCarry({ ...carryOf(a), hints: undefined })!.hints).toEqual([]); // a carry stored before they went with it
  });
});

describe('following a side quest', () => {
  const begun = () => {
    const g = createWorldGame();
    startQuest(g, 'zadok');
    return g;
  };

  it('only a side quest that is under way can be followed', () => {
    const g = createWorldGame();
    expect(canTrack(g, 'zadok')).toBe(false); // not begun
    startQuest(g, 'sleepers');
    expect(canTrack(g, 'sleepers')).toBe(false); // the main line leads by itself
    expect(track(g, 'sleepers')).toBe(false);
    startQuest(g, 'zadok');
    expect(canTrack(g, 'zadok')).toBe(true);
    g.overworld!.quests.set('zadok', QUESTS.zadok.stages.length);
    expect(canTrack(g, 'zadok')).toBe(false); // done
    expect(track(g, 'no_such_quest')).toBe(false);
  });

  it('leads there in place of the story, and the story again when it is let go', () => {
    const g = begun();
    startQuest(g, 'sleepers');
    expect(trackedLead(g)).toBeNull();
    expect(currentLead(g)).toEqual(mainLead(g));
    expect(track(g, 'zadok')).toBe(true);
    expect(g.overworld!.tracked).toBe('zadok');
    expect(trackedLead(g)!.text).toBe(QUESTS.zadok.stages[0].note);
    expect(currentLead(g)!.text).toBe(QUESTS.zadok.stages[0].note);
    expect(mainLead(g)!.text).not.toBe(currentLead(g)!.text);
    expect(track(g, 'zadok')).toBe(true); // the same again: let go
    expect(g.overworld!.tracked).toBeNull();
    expect(currentLead(g)).toEqual(mainLead(g));
  });

  it('is let go when the quest is done', () => {
    const g = begun();
    track(g, 'zadok');
    g.player.laudanum = 1;
    talked(g, 'zadok'); // the swallow he asked for: the quest is done
    expect(g.overworld!.tracked).toBeNull();
    expect(trackedLead(g)).toBeNull();
    expect(currentLead(g)).toEqual(mainLead(g));
  });

  it('is kept in the save, and dropped for a quest that is gone or done', () => {
    const g = begun();
    track(g, 'zadok');
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(loaded.overworld!.tracked).toBe('zadok');
    const done = JSON.parse(JSON.stringify(snapshot(g)));
    done.quests.zadok = QUESTS.zadok.stages.length;
    expect(createWorldGame({ save: parseSave(JSON.stringify(done))! }).overworld!.tracked).toBeNull();
    const main = JSON.parse(JSON.stringify(snapshot(g)));
    main.tracked = 'sleepers';
    main.quests.sleepers = 0;
    expect(createWorldGame({ save: parseSave(JSON.stringify(main))! }).overworld!.tracked).toBeNull(); // the main line is not followed
    const gone = JSON.parse(JSON.stringify(snapshot(g)));
    gone.tracked = 'no_such_quest';
    expect(createWorldGame({ save: parseSave(JSON.stringify(gone))! }).overworld!.tracked).toBeNull();
  });
});
