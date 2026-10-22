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

export interface Lead {
  text: string; // what to do, in a line
  at: XZ | null; // where, when it has a place
}

const npcAt = (id: string): XZ | null => {
  const n = NPCS.find((x) => x.id === id);
  const at = n && npcPlace(n);
  return at ? { x: at.x, z: at.z } : null;
};

/** Where a goal is met. */
export function goalPlace(goal: Goal): XZ | null {
  if (goal.kind === 'talk' || goal.kind === 'give') return npcAt(goal.npc);
  if (goal.kind === 'reach') {
    const s = worldLayout().signs.find((x) => x.id === goal.sign);
    return s ? { x: s.x, z: s.z } : null;
  }
  if (goal.kind === 'seals') return null; // it has no one place (sealLead)
  if (goal.kind === 'read') return docPlace(goal.doc);
  if (goal.kind === 'step') return stepGoalPlace(goal.boss, goal.i);
  return bossPlace(goal.boss);
}

/** Where an act of a horror's discovery is done: its vigil's mark, its altar, or the court where its rite's lights stand (the gate, when it has no place of its own). */
function stepGoalPlace(boss: string, i: number): XZ | null {
  const a = worldLayout().arenas.find((x) => x.bosses[0] === boss);
  const step = DISCOVERIES[boss]?.steps[i];
  if (!a?.house || !step) return null;
  const at = stepPlace(a, step) ?? courtPoint(a.house, ARENA_WAYS[boss]?.rite?.at[0]?.d ?? 20, 0);
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
function sealLead(g: Game, count: number, note: string): Lead {
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
  return { text: `${note} (${Math.min(count, sealsBroken(g))} of ${count} have fallen.)`, at: at && wayTo(g, from, at) };
}

/** The lead a quest's open stage gives: what to do, and where. */
function stageLead(g: Game, id: string, stage: number): Lead {
  const q = QUESTS[id];
  const goal = q.stages[stage].goal;
  if (goal.kind === 'seals') return sealLead(g, goal.count, q.stages[stage].note);
  const at = goalPlace(goal);
  return { text: q.stages[stage].note, at: at && wayTo(g, me(g), at) };
}

/** The main line's next step, or null once it is done (or out of the open world). */
export function mainLead(g: Game): Lead | null {
  if (!g.overworld) return null;
  for (const [id, q] of Object.entries(QUESTS)) {
    if (!q.main || isDone(g, id) || (q.after && !isDone(g, q.after))) continue;
    const stage = stageOf(g, id);
    if (stage !== UNSTARTED) return stageLead(g, id, stage);
    const giver = NPCS.find((n) => n.topics.some((t) => t.starts === id));
    if (!giver) continue;
    const sign = worldLayout().signs.find((s) => s.id === giver.sign)?.name ?? 'an Elder Sign';
    const place = npcAt(giver.id);
    return { text: `Speak with ${giver.name}, by the Elder Sign at ${sign}.`, at: place && wayTo(g, me(g), place) };
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
