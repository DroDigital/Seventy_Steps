import { describe, expect, it } from 'vitest';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { LANGS } from '../src/data/lang';
import { QUESTS } from '../src/data/quests';
import { createWorldGame } from '../src/systems/game';
import { mainLead, trackedLead } from '../src/systems/lead';
import { startQuest, track } from '../src/systems/quests';
import { briefLine, distanceWords } from '../src/ui/questBrief';
import { pointerAngle } from '../src/ui/questTracker';

describe('the quest tracker (ui/questTracker.ts)', () => {
  it('names the quest and the goal of the lead: a first errand, then the open stage', () => {
    const g = createWorldGame();
    const first = mainLead(g)!;
    expect(first.title).toBe(QUESTS.sleepers.title);
    expect(first.goal).toEqual({ kind: 'talk', npc: 'peaslee' });
    expect(briefLine(first.goal)).toBe('Speak with Wingate Peaslee');
    startQuest(g, 'sleepers');
    const now = mainLead(g)!;
    expect([now.title, briefLine(now.goal)]).toEqual([QUESTS.sleepers.title, 'Speak with Walter Gilman']);
  });

  it('follows the side quest picked in the journal in place of the main line', () => {
    const g = createWorldGame();
    expect(trackedLead(g)).toBeNull();
    startQuest(g, 'zadok');
    expect(track(g, 'zadok')).toBe(true);
    const lead = trackedLead(g)!;
    expect(lead.title).toBe(QUESTS.zadok.title);
    expect(briefLine(lead.goal)).toBe('Bring Zadok Allen a dose of Laudanum');
  });

  it('says every stage of every quest in a line, in every language, with no word left unfilled', () => {
    for (const [id, q] of Object.entries(QUESTS)) {
      q.stages.forEach((s, i) => {
        const line = briefLine(s.goal, 2);
        expect(line.length, `${id} ${i}`).toBeGreaterThan(4);
        expect(line, `${id} ${i}`).not.toMatch(/[{}]|undefined/);
        expect(line.length, `${id} ${i}: short enough for the side of the screen`).toBeLessThan(90);
      });
    }
    for (const lang of LANGS) for (const k of ['talk', 'give', 'slay', 'reach', 'read', 'seals', 'rite', 'vigil', 'step', 'here'] as const) expect(lang.table[`hud.track.${k}`], `${lang.id} ${k}`).toBeTruthy();
  });

  it("reads a discovery's acts: the altar's own words, a rite, a vigil", () => {
    const acts = Object.entries(DISCOVERIES).flatMap(([boss, d]) => d.steps.map((s, i) => ({ s, line: briefLine({ kind: 'step', boss, i }) })));
    const offer = acts.find((a) => a.s.kind === 'offer')!;
    expect(offer.line).toBe(offer.line.charAt(0).toUpperCase() + offer.line.slice(1));
    expect(acts.filter((a) => a.s.kind === 'rite').every((a) => a.line === 'Kindle the lights in their order')).toBe(true);
    expect(acts.filter((a) => a.s.kind === 'vigil').every((a) => a.line === 'Keep a vigil at the mark')).toBe(true);
  });

  it('counts the seals that have fallen, never above the count asked', () => {
    expect(briefLine({ kind: 'seals', count: 3 }, 1)).toBe('Break the seals · 1 of 3');
    expect(briefLine({ kind: 'seals', count: 3 }, 5)).toBe('Break the seals · 3 of 3');
  });

  it('reads a distance to the metre when near, to five when farther, in kilometres at a thousand', () => {
    expect(distanceWords(42.4)).toBe('42 m');
    expect(distanceWords(437)).toBe('435 m');
    expect(distanceWords(1260)).toBe('1.3 km');
  });

  it("points as the minimap does: ahead is up, the world's +x lies on the left, and it turns with the camera", () => {
    const o = { x: 0, z: 0 };
    expect(pointerAngle(o, { x: 0, z: 10 }, 0)).toBeCloseTo(-Math.PI / 2); // north, with the camera facing north
    expect(pointerAngle(o, { x: 10, z: 0 }, 0)).toBeCloseTo(Math.PI); // east lies on the left
    expect(pointerAngle(o, { x: 0, z: -10 }, 0)).toBeCloseTo(Math.PI / 2); // behind
    expect(pointerAngle(o, { x: 10, z: 0 }, Math.PI / 2)).toBeCloseTo(-Math.PI / 2); // the camera turned to face +x: it is ahead
  });
});
