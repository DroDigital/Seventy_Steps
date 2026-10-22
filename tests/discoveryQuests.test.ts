import { describe, expect, it } from 'vitest';
import { stepKey } from '../src/data/discoveries';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { QUESTS } from '../src/data/quests';
import { createWorldGame } from '../src/systems/game';
import { goalPlace, trackedLead } from '../src/systems/lead';
import { isDone, questSystem, stageOf, startQuest, track } from '../src/systems/quests';
import { parseSave, snapshot } from '../src/systems/save';
import { wayRuns } from '../src/systems/ways';
import { courtPoint } from '../src/world/arenaWay';
import { worldLayout } from '../src/world/placements';
import { goTo, run } from './worldHelpers';

describe('discovery quest requirements', () => {
  it('keeps the journal on the first unfinished act even when a later page or rite is already done', () => {
    const g = createWorldGame();
    const ow = g.overworld!;
    for (const [boss, discovery] of Object.entries(DISCOVERIES)) {
      const id = `discover_${boss}`;
      startQuest(g, id);
      track(g, id);
      // A player can visit the lights or a second page before finding the first page.
      for (let i = 1; i < discovery.steps.length; i++) {
        const s = discovery.steps[i]!;
        if (s.kind === 'read') ow.read.add(s.doc);
        else if (s.kind === 'rite') ow.told.add(stepKey(boss, i));
      }
      questSystem(g);
      expect(stageOf(g, id), boss).toBe(0);
      expect(trackedLead(g)?.text, boss).toBe(discovery.steps[0]!.note);
    }
  });

  it('repairs a saved journal that skipped a still-locked discovery requirement', () => {
    const g = createWorldGame();
    startQuest(g, 'discover_black_man');
    track(g, 'discover_black_man');
    g.overworld!.told.add('rite:black_man');
    g.overworld!.told.add(stepKey('black_man', 1));
    // The broken patch let a completed rite skip the unread deposition.
    g.overworld!.quests.set('discover_black_man', 2);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    questSystem(loaded);
    expect(stageOf(loaded, 'discover_black_man')).toBe(0);
    expect(trackedLead(loaded)?.at).toEqual(goalPlace(QUESTS.discover_black_man.stages[0]!.goal));
    loaded.overworld!.read.add("Goodwife Pickman's Deposition");
    questSystem(loaded);
    questSystem(loaded);
    expect(stageOf(loaded, 'discover_black_man')).toBe(2);
  });

  it('still closes every discovery when its boss was slain and pays the reward once', () => {
    const g = createWorldGame();
    for (const boss of Object.keys(DISCOVERIES)) {
      const id = `discover_${boss}`;
      startQuest(g, id);
      g.overworld!.slain.add(`boss:${boss}`);
      const before = g.player.echoes;
      questSystem(g);
      expect(isDone(g, id), boss).toBe(true);
      expect(g.player.echoes - before, boss).toBe(QUESTS[id]!.reward.echoes);
      questSystem(g);
      expect(g.player.echoes - before, `${boss}: paid once`).toBe(QUESTS[id]!.reward.echoes);
    }
  });

  it('marks the next candle itself and follows the sequence as each candle lights', () => {
    const g = createWorldGame();
    const a = worldLayout().arenas.find((x) => x.bosses[0] === 'black_man')!;
    const lane = courtPoint(a.house!, 28);
    goTo(g, lane.x, lane.z);
    run(g, 3);
    g.overworld!.read.add("Goodwife Pickman's Deposition");
    g.overworld!.quests.set('discover_black_man', 1);
    g.overworld!.tracked = 'discover_black_man';
    const rite = wayRuns(g).find((r) => r.plan.boss === 'black_man')!;
    for (const l of rite.lights) {
      expect(trackedLead(g)?.at, `candle ${l.rank}`).toEqual({ x: l.x, z: l.z });
      goTo(g, l.x, l.z);
      run(g, 1);
    }
    expect(g.overworld!.told.has('rite:black_man')).toBe(true);
  });
});
