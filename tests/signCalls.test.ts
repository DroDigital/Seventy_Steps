import { describe, expect, it } from 'vitest';
import { QUESTS } from '../src/data/quests';
import { discover, teleport } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { COURT_SIGN } from '../src/systems/endings';
import { currentLead } from '../src/systems/lead';
import { markNew } from '../src/systems/finds';
import { nextLevelCost } from '../src/systems/levels';
import { startQuest } from '../src/systems/quests';
import { signCalls, SIGN_CALLS } from '../src/systems/signCalls';
import { LOOKS } from '../src/render/signCallViews';
import { worldLayout } from '../src/world/placements';

const sleeper = () => worldLayout().signs.find((s) => s.dream)!;

function atSleeper(): Game {
  const g = createWorldGame();
  const s = sleeper();
  teleport(g, { x: s.x + 3, z: s.z, yaw: 0 });
  discover(g, s.id);
  return g;
}

describe('why an Elder Sign is worth resting at', () => {
  it('asks nothing of a new journey standing by the Sleeper’s Sign', () => {
    expect(signCalls(atSleeper()).get(sleeper().id) ?? []).toEqual([]);
  });

  it('calls the investigator down the stair once Keziah falls and the lead lies in the dream', () => {
    const g = atSleeper();
    const ow = g.overworld!;
    for (const id of ['sleepers', 'witch_house']) ow.quests.set(id, QUESTS[id].stages.length);
    ow.slain.add('boss:keziah_mason');
    startQuest(g, 'descent');
    expect(signCalls(g).get(sleeper().id)).toContain('descend');
  });

  it('marks the Court’s sign with the ending alone when the ending is the lead, not a travel waypoint too', () => {
    const g = createWorldGame();
    const ow = g.overworld!;
    for (const [id, q] of Object.entries(QUESTS)) if (q.main && id !== 'silver_key') ow.quests.set(id, q.stages.length);
    ow.quests.set('silver_key', 3);
    ow.slain.add('boss:azathoth');
    const court = worldLayout().signs.find((s) => s.id === COURT_SIGN)!;
    teleport(g, { x: court.x + 3, z: court.z, yaw: 0 });
    discover(g, court.id);
    expect(currentLead(g)?.goal.kind).toBe('ending');
    expect(signCalls(g).get(court.id)).toEqual(['ending']);
  });

  it('hangs a level, star-stones and a new relic on the nearest lit sign only', () => {
    const g = atSleeper();
    g.player.echoes = nextLevelCost(g) + 1;
    g.player.stones = 99;
    markNew(g, 'relic', 'any');
    const calls = signCalls(g);
    expect(calls.get(sleeper().id)).toEqual(['level', 'stones', 'relic']);
    expect([...calls.keys()]).toEqual([sleeper().id]);
  });

  it('gives every call a look of its own', () => {
    const colours = SIGN_CALLS.map((c) => LOOKS[c].color.join());
    expect(new Set(colours).size).toBe(SIGN_CALLS.length);
    const shapes = SIGN_CALLS.map((c) => LOOKS[c].shape().length);
    expect(shapes.every((n) => n > 0 && n % 3 === 0)).toBe(true);
  });
});
