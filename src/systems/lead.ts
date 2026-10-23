/**
 * Where the story leads (playtest round 4): the open stage of the main line — whom to speak with,
 * what to slay, where to go — or, before a main quest begins, who will ask it of the investigator;
 * and where that is. The journal says it, and the map and minimap mark it, so a new investigator
 * always has somewhere to go; a goal in another realm is marked where the way to it begins (round
 * 17, leadWay.ts). A side quest followed from the journal leads in its place. Pure: no Three.js.
 */

import { distXZ, type XZ } from '../core/geom';
import { ARENA_WAYS } from '../data/arenaWaysAll';
import { DISCOVERIES } from '../data/discoveriesAll';
import { NPCS } from '../data/npcs';
import { QUESTS, type Goal } from '../data/quests';
import { courtPoint } from '../world/arenaWay';
import { stepPlace } from '../world/discoveryPlan';
import { worldLayout } from '../world/placements';
import type { Game } from './components';
import { npcPlace } from './npcs';
import { placeKey, wayTo } from './leadWay';
import { isDone, stageOf, UNSTARTED } from './quests';
import { SEAL_REGIONS, sealBroken, sealsBroken } from './sealCount';
import { COURT_SIGN, ended } from './endings';
import { wayRuns } from './ways';

export interface Lead {
  text: string; // what to do, in a line
  at: XZ | null; // where, when it has a place
  title: string; // the quest's, in the journal
  goal: Goal; // what is asked, for the HUD's short line of it (ui/questBrief.ts)
}

const npcAt = (id: string): XZ | null => {
  const n = NPCS.find((x) => x.id === id);
  const at = n && npcPlace(n);
  return at ? { x: at.x, z: at.z } : null;
};

const signAt = (id: string): XZ | null => {
  const s = worldLayout().signs.find((x) => x.id === id);
  return s ? { x: s.x, z: s.z } : null;
};

/** Where a goal is met. */
export function goalPlace(goal: Goal): XZ | null {
  if (goal.kind === 'talk' || goal.kind === 'give') return npcAt(goal.npc);
  if (goal.kind === 'reach') return signAt(goal.sign);
  if (goal.kind === 'seals') return null; // it has no one place (sealLead)
  if (goal.kind === 'ending') return signAt(COURT_SIGN); // the choice is made at the Court's Elder Sign
  if (goal.kind === 'read') return docPlace(goal.doc);
  if (goal.kind === 'step') return stepGoalPlace(goal.boss, goal.i);
  return bossPlace(goal.boss);
}

/** Where an act of a horror's discovery is done: its vigil's mark, its altar, or the court where its rite's lights stand (the gate, when it has no place of its own). */
function stepGoalPlace(boss: string, i: number): XZ | null {
  const a = worldLayout().arenas.find((x) => x.bosses[0] === boss);
  const step = DISCOVERIES[boss]?.steps[i];
  if (!a?.house || !step) return null;
  const light = ARENA_WAYS[boss]?.rite?.at[0];
  const at = stepPlace(a, step) ?? courtPoint(a.house, light?.d ?? 20, light?.side ?? 0);
  return { x: at.x, z: at.z };
}

/** Where a tome or note lies: where it is set in the open, or the room of the dungeon that holds it. */
function docPlace(name: string): XZ | null {
  const w = worldLayout();
  const open = w.tomes.find((t) => t.name === name);
  if (open) return { x: open.at.x, z: open.at.z };
  for (const d of w.dungeons) {
    const room = d.layout.rooms.find((r) => r.def.tome?.name === name);
    if (room) return { x: room.x, z: room.z };
  }
  return null;
}

/** Where a boss is met: its arena, or where it stands. */
function bossPlace(boss: string): XZ | null {
  const s = worldLayout().spawns.find((x) => x.id === `boss:${boss}`);
  return s ? { x: s.arena?.x ?? s.at.x, z: s.arena?.z ?? s.at.z } : null;
}

const me = (g: Game): XZ => g.ecs.c.transform.get(g.player.id)!.pos;

/** The seals' goal: how many have fallen, and the nearest great horror whose seal still holds (in the investigator's own realm first). */
function sealLead(g: Game, count: number, note: string): Omit<Lead, 'title'> {
  const [from, here] = [me(g), placeKey(me(g))];
  let [at, best]: [XZ | null, number] = [null, Infinity];
  for (const r of SEAL_REGIONS) {
    if (sealBroken(g, r.id)) continue;
    for (const b of r.bosses) {
      const p = bossPlace(b);
      if (!p) continue;
      const far = distXZ(p, from) + (placeKey(p) === here ? 0 : 1e6); // another realm's only once this one has none
      if (far < best) [at, best] = [p, far];
    }
  }
  return { text: `${note} (${Math.min(count, sealsBroken(g))} of ${count} have fallen.)`, at: at && wayTo(g, from, at), goal: { kind: 'seals', count } };
}

/** The lead a quest's open stage gives: what to do, and where. */
function stageLead(g: Game, id: string, stage: number): Lead {
  const q = QUESTS[id];
  const goal = q.stages[stage].goal;
  if (goal.kind === 'seals') return { ...sealLead(g, goal.count, q.stages[stage].note), title: q.title };
  const rite = goal.kind === 'step' && DISCOVERIES[goal.boss]?.steps[goal.i]?.kind === 'rite';
  const run = rite && wayRuns(g).find((r) => r.plan.boss === goal.boss);
  const light = run && run.lights.find((l) => !l.lit && l.rank === run.progress);
  const at = light ? { x: light.x, z: light.z } : goalPlace(goal);
  const text = q.stages[stage].note + (rite ? ' Approach a light to kindle it, or interact when nearby. The marker follows the next light.' : '');
  return { text, at: at && wayTo(g, me(g), at), title: q.title, goal };
}

/**
 * The main line's next step, or null once the dream has ended (or out of the open world). Round 70: a quest the investigator has gone past
 * (a later one begun or done: Keziah put down before Gilman was asked, the stair taken before the Sleepers were) no longer leads; it waits
 * for whoever has it to give, marked over their head, and the lead goes on to where the investigator is.
 */
export function mainLead(g: Game): Lead | null {
  if (!g.overworld || ended(g)) return null;
  const main = Object.entries(QUESTS).filter(([, q]) => q.main);
  for (const [i, [id, q]] of main.entries()) {
    if (isDone(g, id) || (q.after && !isDone(g, q.after)) || main.slice(i + 1).some(([later]) => stageOf(g, later) !== UNSTARTED)) continue;
    const stage = stageOf(g, id);
    if (stage !== UNSTARTED) return stageLead(g, id, stage);
    const giver = NPCS.find((n) => n.topics.some((t) => t.starts === id));
    if (!giver) continue;
    const sign = worldLayout().signs.find((s) => s.id === giver.sign)?.name ?? 'an Elder Sign';
    const place = npcAt(giver.id);
    return { text: `Speak with ${giver.name}, by the Elder Sign at ${sign}.`, at: place && wayTo(g, me(g), place), title: q.title, goal: { kind: 'talk', npc: giver.id } };
  }
  return null;
}

/** The step of the side quest being followed (quests.ts `track`), or null when none is, or it is done. */
export function trackedLead(g: Game): Lead | null {
  const id = g.overworld?.tracked;
  if (!id || !QUESTS[id] || stageOf(g, id) === UNSTARTED || isDone(g, id)) return null;
  return stageLead(g, id, stageOf(g, id));
}

/** Where the minimap and the map lead: the side quest followed, else the main line. */
export const currentLead = (g: Game): Lead | null => trackedLead(g) ?? mainLead(g);
