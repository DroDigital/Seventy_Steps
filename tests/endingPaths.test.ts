// The way to each ending (round 70): the main line is always told, never shut, and survives any order of play. Three audits and the walks.
//  - the data: no boss hall is behind a thing a person can spend or lose (insight, a state of mind), and the seals can be broken enough times;
//  - the walks: the story played in several orders (a horror put down early, the stair taken before the Sleepers were asked, the Beyond
//    walked before Carter was spoken to); after every step the lead names something that can be done now, and the line ends at an ending;
//  - the endings: each of the three is offered where the lead says it is.
import { describe, expect, it } from 'vitest';
import { DUNGEONS } from '../src/data/dungeons';
import { KEY_REACH, courtPlaces } from '../src/data/finale';
import { ENDING_IDS } from '../src/data/endings';
import { NPCS } from '../src/data/npcs';
import { QUESTS } from '../src/data/quests';
import { SEALS } from '../src/data/tuning';
import { gatePlace } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { COURT_SIGN, courtEndings, endGame, ended } from '../src/systems/endings';
import { fightAction } from '../src/systems/fightActions';
import { createWorldGame } from '../src/systems/game';
import { goalPlace, mainLead } from '../src/systems/lead';
import { wayTo } from '../src/systems/leadWay';
import { talk, topicOf } from '../src/systems/npcs';
import { isDone, stageOf, UNSTARTED } from '../src/systems/quests';
import { bossAwake, SEAL_REGIONS, sealsBroken } from '../src/systems/sealCount';
import { briefLine } from '../src/ui/questBrief';
import { worldLayout } from '../src/world/placements';
import { bossGame, engage } from './bossHelpers';
import { place, press, steps } from './helpers';
import { goTo, record, run } from './worldHelpers';

const RILEY = "Officer Riley's Report";
const FORMULAE = "Keziah's Formulae";
const ROOMS = DUNGEONS.flatMap((d) => d.rooms.map((r) => ({ d, r })));

/** A room and every room it opens off, back to the entrance. */
function chain(d: (typeof DUNGEONS)[number], id: string): (typeof DUNGEONS)[number]['rooms'][number][] {
  const out = [];
  for (let r = d.rooms.find((x) => x.id === id); r; r = r.from ? d.rooms.find((x) => x.id === r!.from) : undefined) out.push(r);
  return out;
}

describe('nothing the story needs is behind what a person can spend or lose', () => {
  it('every boss hall is walked to through open doors: only the seals of Kadath shut a way (round 70: the span to the Guide wanted 3 insight)', () => {
    for (const { d, r } of ROOMS.filter((x) => x.r.boss)) {
      for (const room of chain(d, r.id)) {
        expect(room.hidden?.minInsight, `${d.id}: ${room.id} on the way to ${r.id} wants insight`).toBeUndefined();
        expect(room.hidden?.maxSanity, `${d.id}: ${room.id} on the way to ${r.id} wants a failing mind`).toBeUndefined();
      }
    }
    const sealed = ROOMS.filter((x) => chain(x.d, x.r.id).some((q) => q.hidden?.minSeals !== undefined));
    expect(new Set(sealed.map((x) => x.d.id))).toEqual(new Set(['ulthar_kadath'])); // the one door of the seals, and what lies beyond it
  });

  it('a step of the main line is never in a room only insight or a failing mind shows, unless it can be passed over without it', () => {
    for (const [id, q] of Object.entries(QUESTS).filter(([, x]) => x.main)) {
      q.stages.forEach((s, i) => {
        const g = s.goal;
        const room = ROOMS.find((x) => (g.kind === 'read' && x.r.tome?.name === g.doc) || (g.kind === 'reach' && x.r.sign?.id === g.sign));
        if (!room || !chain(room.d, room.r.id).some((x) => x.hidden)) return;
        expect(q.lenient && i < q.stages.length - 1, `${id} ${i}: the investigator must see a hidden room to go on`).toBe(true);
        expect(s.note, `${id} ${i}: says it can be gone past`).toMatch(/go on/);
      });
    }
  });

  it('enough seals can be broken: the door asks for fewer than there are, and the Witch House is one of them', () => {
    expect(SEAL_REGIONS.length).toBeGreaterThan(SEALS.kadath + 2);
    expect(SEAL_REGIONS.some((r) => r.bosses.includes('keziah_mason'))).toBe(true);
  });
});

/** A horror put down: its seal broken, the doors that wait on it told, and the half second the quests take to see it. */
function fell(g: Game, ...bosses: string[]): void {
  for (const b of bosses) {
    g.overworld!.slain.add(`boss:${b}`);
    g.events.emit('Vanquished', { entity: g.player.id, name: b });
  }
  run(g, 31);
}
const meet = (g: Game, npc: string): void => (talk(g, npc), run(g, 31));
const find = (g: Game, sign: string): void => (g.overworld!.discovered.add(sign), run(g, 31));
const read = (g: Game, doc: string): void => (g.overworld!.read.add(doc), run(g, 31));
/** The waking world's seal bosses, one for each of `n` regions that is not Arkham (Keziah's). */
const others = (n: number): string[] => SEAL_REGIONS.filter((r) => r.id !== 'arkham').slice(0, n).map((r) => r.bosses[0]);

/** What the lead says now must be something that can be done now: told, placed, and (for a horror) awake. */
function lead(g: Game, at: string) {
  const l = mainLead(g);
  expect(l, `${at}: the main line fell silent`).not.toBeNull();
  expect(l!.text.length, at).toBeGreaterThan(20);
  expect(briefLine(l!.goal, sealsBroken(g)), at).not.toMatch(/[{}]|undefined/);
  if (l!.goal.kind !== 'seals') expect(goalPlace(l!.goal), `${at}: the lead has no place`).not.toBeNull();
  if (l!.goal.kind === 'slay') expect(bossAwake(g, l!.goal.boss), `${at}: leads to ${l!.goal.boss}, which still sleeps`).toBe(true);
  return l!;
}

type Step = [label: string, play: (g: Game) => void];
/** Plays the steps, the lead checked before the first and after each; the dream is not over until the last. */
function walk(steps: Step[]): Game {
  const g = createWorldGame();
  lead(g, 'at the start');
  for (const [label, play] of steps) {
    play(g);
    if (!ended(g)) lead(g, `after ${label}`);
  }
  return g;
}

const BEYOND: Step[] = [
  ['the Threshold', (g) => find(g, 'beyond_threshold')],
  ['Carter', (g) => meet(g, 'carter')],
  ["'Umr at-Tawil", (g) => fell(g, 'umr_at_tawil')],
  ['Yog-Sothoth', (g) => fell(g, 'yog_sothoth')],
  ['Azathoth', (g) => fell(g, 'azathoth')],
];
const SEALS_BROKEN: Step[] = others(SEALS.kadath - 1).map((b, i): Step => [`seal ${i + 2}`, (g) => fell(g, b)]);
const DREAM: Step[] = [['Kuranes', (g) => meet(g, 'kuranes')], ...SEALS_BROKEN];
const WAKING: Step[] = [
  ['Peaslee', (g) => meet(g, 'peaslee')],
  ['Gilman', (g) => meet(g, 'gilman')],
  ['the report', (g) => read(g, RILEY)],
  ['Gilman again', (g) => meet(g, 'gilman')],
  ['the landing', (g) => find(g, 'arkham_witch')],
  ['the formulae', (g) => read(g, FORMULAE)],
  ['Keziah', (g) => fell(g, 'keziah_mason')],
];

describe('the story walked in several orders: the next step is always told, and it can be done', () => {
  it('in order, from Peaslee to the last choice at the Court', () => {
    const g = walk([...WAKING, ...DREAM, ...BEYOND]);
    expect(isDone(g, 'kadath')).toBe(true);
    const court = worldLayout().signs.find((x) => x.id === COURT_SIGN)!;
    goTo(g, court.x + 3, court.z + 3);
    const l = lead(g, 'at the Court');
    expect(l.goal).toEqual({ kind: 'ending' });
    expect(l.at).toEqual(goalPlace({ kind: 'ending' })); // (in the Court at the Centre itself, so the lead is the sign itself)
    expect(courtEndings(g, COURT_SIGN)).toEqual(['seal', 'herald']);
    expect(stageOf(g, 'silver_key')).toBe(3);
    endGame(g, 'herald');
    run(g, 31);
    expect(isDone(g, 'silver_key')).toBe(true);
    expect(mainLead(g)).toBeNull(); // nothing more is asked of a dream that has ended
  });

  it('with Keziah put down before anyone asked: Gilman is glad of it, the quests close as they begin, and the stair is open', () => {
    const g = walk([
      ['Keziah', (g) => fell(g, 'keziah_mason')],
      ['Peaslee', (g) => meet(g, 'peaslee')],
      ['Gilman', (g) => (expect(topicOf(g, NPCS.find((n) => n.id === 'gilman')!).lines[0]).toBe("It's quieter in my head now. Thank you."), meet(g, 'gilman'))], // not "she is still in that house"
    ]);
    expect(isDone(g, 'sleepers') && isDone(g, 'witch_house')).toBe(true);
    expect(stageOf(g, 'descent')).toBe(0);
    expect(mainLead(g)!.goal).toEqual({ kind: 'talk', npc: 'kuranes' });
  });

  it('with Keziah put down and the stair taken before the Sleepers were asked: the lead goes on from where the investigator is', () => {
    const g = walk([
      ['Keziah', (g) => fell(g, 'keziah_mason')],
      ['Kuranes', (g) => (meet(g, 'kuranes'), expect(mainLead(g)!.goal.kind).toBe('seals'))], // not back to Peaslee
      ...SEALS_BROKEN,
    ]);
    expect(stageOf(g, 'sleepers')).toBe(UNSTARTED);
    expect(stageOf(g, 'kadath')).toBe(1);
    expect(mainLead(g)!.goal).toEqual({ kind: 'reach', sign: 'beyond_threshold' });
  });

  it('with every horror of the waking world put down first: the quests close as they begin', () => {
    const g = walk([['them all', (g) => fell(g, 'keziah_mason', ...SEAL_REGIONS.flatMap((r) => r.bosses))], ...WAKING.slice(0, 2), ['Kuranes', (g) => meet(g, 'kuranes')], ...BEYOND.slice(0, 1)]);
    expect(sealsBroken(g)).toBe(SEAL_REGIONS.length);
    expect(isDone(g, 'kadath')).toBe(true);
    expect(lead(g, 'at the Threshold').goal).toEqual({ kind: 'talk', npc: 'carter' });
  });

  it('with the Beyond walked before Carter was spoken to: Carter is still the lead, and the last choice follows him', () => {
    const g = walk([...WAKING, ...DREAM, ['the Threshold', (g) => find(g, 'beyond_threshold')], ["'Umr, Yog-Sothoth, Azathoth", (g) => fell(g, 'umr_at_tawil', 'yog_sothoth', 'azathoth')]]);
    expect(lead(g, 'unasked').goal).toEqual({ kind: 'talk', npc: 'carter' });
    expect(courtEndings(g, COURT_SIGN)).toEqual(['seal', 'herald']); // the Court's sign needs no one's leave
    meet(g, 'carter');
    expect(lead(g, 'asked').goal).toEqual({ kind: 'ending' });
  });

  it("'Umr at-Tawil gone through the Gate with: the line closes, though Yog-Sothoth and Azathoth never fell", () => {
    const g = walk([...WAKING, ...DREAM, ...BEYOND.slice(0, 2)]);
    expect(lead(g, 'on the way to the Guide').goal).toEqual({ kind: 'slay', boss: 'umr_at_tawil' });
    endGame(g, 'silver_key');
    run(g, 31);
    expect(isDone(g, 'silver_key')).toBe(true);
    expect(mainLead(g)).toBeNull();
    expect(courtEndings(g, COURT_SIGN)).toEqual([]);
  });

  it('each horror of the Beyond is led to only once the one before has fallen, and the last lead is the Court', () => {
    const g = walk([...WAKING, ...DREAM, ...BEYOND.slice(0, 2)]);
    const goals = [];
    for (const b of ['umr_at_tawil', 'yog_sothoth', 'azathoth']) {
      const l = lead(g, `before ${b}`);
      goals.push(l.goal);
      fell(g, b);
    }
    expect(goals).toEqual([{ kind: 'slay', boss: 'umr_at_tawil' }, { kind: 'slay', boss: 'yog_sothoth' }, { kind: 'slay', boss: 'azathoth' }]);
    expect(lead(g, 'after them all').goal).toEqual({ kind: 'ending' });
  });
});

describe('the endings are told where they are chosen', () => {
  it('the Court is reached from the waking world once the stair opens, and the tracker says where the choice is made', () => {
    const g = createWorldGame();
    const court = worldLayout().signs.find((s) => s.id === COURT_SIGN)!;
    const start = g.ecs.c.transform.get(g.player.id)!.pos;
    g.overworld!.slain.add('boss:keziah_mason');
    expect(wayTo(g, start, { x: court.x, z: court.z })).not.toBeNull();
    expect(wayTo(g, gatePlace('court_in')!.arrive, { x: court.x, z: court.z })).toEqual({ x: court.x, z: court.z }); // already in the Court at the Centre
    const gulf = gatePlace('beyond_gate')!.arrive; // and from the Gate, the Court is six dimensions on: the way is the Storm Gate's, the first of the chain (round 73)
    expect(wayTo(g, gulf, { x: court.x, z: court.z })).toEqual({ x: gatePlace('beyond_cloud')!.x, z: gatePlace('beyond_cloud')!.z });
    expect(briefLine({ kind: 'ending' })).toBe(`The silver key and the tall man wait at ${court.name}`);
  });

  it("'Umr at-Tawil says it yields, once, where the offer is not yet a prompt", () => {
    const b = bossGame('umr_at_tawil', undefined, 5);
    const { g, boss } = b;
    engage(b);
    const said = record(g, 'Notice');
    expect(said.filter((n) => /YIELDS/.test(n.text))).toEqual([]);
    g.ecs.c.health.get(boss)!.hp *= 0.2;
    steps(g, 3);
    steps(g, 60);
    expect(said.filter((n) => /YIELDS/.test(n.text))).toHaveLength(1);
    expect(said.find((n) => /YIELDS/.test(n.text))!.text).toContain('{interact}');
    const at = g.ecs.c.transform.get(boss)!.pos;
    place(g, g.player.id, at.x, at.z + 20, Math.PI);
    expect(fightAction(g)).toBeNull(); // too far to hear the offer: the notice said it
    place(g, g.player.id, at.x, at.z + 4, Math.PI);
    const endings = record(g, 'Ending');
    expect(fightAction(g)?.label).toBe('follow the Guide');
    steps(g, 1, press('interact'));
    expect(endings).toEqual([]);
    const f = g.ecs.c.fight.get(boss)!;
    expect(f.sig.gate).toBe(1);
    place(g, g.player.id, f.sig.gx!, f.sig.gz!, Math.PI);
    expect(fightAction(g)?.label).toBe('step through the Gate');
    steps(g, 1, press('interact'));
    expect(endings).toEqual([{ id: 'silver_key' }]);
  });

  it('the silver key and the tall man end the dream, and the rise before the stone does not take the key', () => {
    const g = createWorldGame();
    g.overworld!.slain.add('boss:azathoth');
    const sign = worldLayout().signs.find((s) => s.id === COURT_SIGN)!;
    const at = courtPlaces(sign);
    expect(Math.hypot(sign.rest.x - at.key.x, sign.rest.z - at.key.z)).toBeGreaterThan(KEY_REACH);
    place(g, g.player.id, sign.rest.x, sign.rest.z, 0);
    expect(fightAction(g)?.label ?? '').not.toBe('close your hand on the key');
    place(g, g.player.id, at.key.x, at.key.z, 0);
    const endings = record(g, 'Ending');
    expect(fightAction(g)?.label).toBe('close your hand on the key');
    fightAction(g)!.run();
    expect(endings).toEqual([{ id: 'seal' }]);
    const g2 = createWorldGame();
    g2.overworld!.slain.add('boss:azathoth');
    const man = courtPlaces(worldLayout().signs.find((s) => s.id === COURT_SIGN)!).man;
    place(g2, g2.player.id, man.x, man.z, 0);
    const heralded = record(g2, 'Ending');
    expect(fightAction(g2)?.label).toBe('attend the tall man');
    fightAction(g2)!.run();
    expect(heralded).toEqual([{ id: 'herald' }]);
  });

  it('all three endings have a way to them in the data: the Guide, and the Court for the other two, which the main line ends on', () => {
    expect([...ENDING_IDS].sort()).toEqual(['herald', 'seal', 'silver_key']);
    const g = createWorldGame();
    g.overworld!.slain.add('boss:azathoth');
    expect(courtEndings(g, COURT_SIGN)).toEqual(['seal', 'herald']);
    expect(Object.values(QUESTS).filter((q) => q.main).at(-1)!.stages.at(-1)!.goal).toEqual({ kind: 'ending' });
  });
});
