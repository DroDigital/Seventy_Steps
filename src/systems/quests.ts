/**
 * Quests (playtest round 1): each quest's stage, kept in the overworld and saved. A quest begins
 * when someone asks it of the investigator (npcs.ts), or by itself once the one before it is done
 * (`auto`, round 12); its stage's goal is checked as it can be met — a talk or a gift when the
 * investigator speaks with someone, a boss slain, an Elder Sign found, a page read or the waking world's seals
 * broken every half second — and the last stage's pays its reward. Pure: no Three.js.
 */

import { QUESTS, type Goal } from '../data/quests';
import type { Game } from './components';
import { changeInsight } from './insight';
import { addVial } from './reagent';
import { giveStones, takeUp } from './arms';
import { sealsBroken } from './sealCount';

export const UNSTARTED = -1;

/** A quest's stage: UNSTARTED, the index of the open stage, or its stage count once done. */
export const stageOf = (g: Game, id: string): number => g.overworld?.quests.get(id) ?? UNSTARTED;
export const isDone = (g: Game, id: string): boolean => stageOf(g, id) >= (QUESTS[id]?.stages.length ?? Infinity);

/** Whether a side quest is under way and can be followed (the main line leads by itself). */
export const canTrack = (g: Game, id: string): boolean => !!QUESTS[id] && !QUESTS[id].main && stageOf(g, id) !== UNSTARTED && !isDone(g, id);

/** Follows a side quest: the minimap and the map lead to it in place of the main line. Again, it is let go. False when it cannot be followed. */
export function track(g: Game, id: string): boolean {
  const ow = g.overworld;
  if (!ow) return false;
  if (ow.tracked === id) {
    ow.tracked = null;
    return true;
  }
  if (!canTrack(g, id)) return false;
  ow.tracked = id;
  return true;
}

/** Begins a quest (if it may begin): its first stage opens. */
export function startQuest(g: Game, id: string): boolean {
  const q = QUESTS[id];
  if (!q || !g.overworld || stageOf(g, id) !== UNSTARTED || (q.after && !isDone(g, q.after))) return false;
  g.overworld.quests.set(id, 0);
  g.events.emit('QuestChanged', { id, title: q.title, stage: 0, done: false });
  return true;
}

/**
 * Closes the open stage: the next opens, or the quest is done and pays. `to`: the stage that opens, when the world has passed over
 * some (settle); a stage gives its gift only when it is closed by its own goal, not passed over.
 */
function advance(g: Game, id: string, to = stageOf(g, id) + 1): void {
  const q = QUESTS[id];
  const stage = stageOf(g, id);
  g.overworld!.quests.set(id, to);
  const gift = to === stage + 1 ? q.stages[stage].gift : undefined;
  if (gift?.echoes) {
    g.player.echoes += gift.echoes;
    g.events.emit('Echoes', { change: 'earned', amount: gift.echoes, total: g.player.echoes });
  }
  if (gift?.insight) changeInsight(g, gift.insight, 'quest', q.title);
  const done = to >= q.stages.length;
  if (done) {
    if (g.overworld!.tracked === id) g.overworld!.tracked = null; // done: there is nothing more to follow
    const r = q.reward;
    if (r.echoes) {
      g.player.echoes += r.echoes;
      g.events.emit('Echoes', { change: 'earned', amount: r.echoes, total: g.player.echoes });
    }
    if (r.insight) changeInsight(g, r.insight, 'quest', q.title);
    if (r.vial) addVial(g);
    if (r.stones) giveStones(g, r.stones);
    if (r.weapon) takeUp(g, r.weapon);
  }
  g.events.emit('QuestChanged', { id, title: q.title, stage: to, done });
}

/**
 * A lenient quest takes the world as it finds it: a later stage whose goal is already met by the world (a boss slain, a sign found, a
 * page read) closes with every stage before it, all at once, and what a stage gives is not given for one the world passed over.
 */
function settle(g: Game, id: string): void {
  const q = QUESTS[id];
  const open = stageOf(g, id);
  let last = -1;
  q.stages.forEach((s, k) => {
    if (k > open && s.goal.kind !== 'talk' && s.goal.kind !== 'give' && met(g, s.goal)) last = k;
  });
  if (last >= 0) advance(g, id, last + 1);
}

/** The open goals of every quest under way. */
function* openGoals(g: Game): Generator<[string, Goal]> {
  for (const [id, stage] of g.overworld?.quests ?? []) {
    const goal = QUESTS[id]?.stages[stage]?.goal;
    if (goal) yield [id, goal];
  }
}

/** Speaking with `npc`: talks with them close their stages, and gifts they ask for are handed over. */
export function talked(g: Game, npc: string): void {
  for (const [id, goal] of [...openGoals(g)]) {
    if (goal.kind === 'talk' && goal.npc === npc) advance(g, id);
    if (goal.kind === 'give' && goal.npc === npc && g.player.laudanum > 0) {
      g.player.laudanum--;
      advance(g, id);
    }
  }
}

/** Whether a goal met by the world's state (not by a word with someone) is met now. */
function met(g: Game, goal: Goal): boolean {
  const ow = g.overworld!;
  if (goal.kind === 'slay') return ow.slain.has(`boss:${goal.boss}`);
  if (goal.kind === 'reach') return ow.discovered.has(goal.sign);
  if (goal.kind === 'read') return ow.read.has(goal.doc);
  return goal.kind === 'seals' && sealsBroken(g) >= goal.count;
}

/** Every half second: quests that begin by themselves begin, and bosses slain, Elder Signs found and seals broken close the stages waiting on them. */
export function questSystem(g: Game): void {
  if (!g.overworld || g.frame % 30 !== 0) return;
  for (const [id, goal] of [...openGoals(g)]) {
    if (met(g, goal)) advance(g, id);
    if (QUESTS[id].lenient) settle(g, id);
  }
  for (const [id, q] of Object.entries(QUESTS)) if (q.auto && stageOf(g, id) === UNSTARTED) startQuest(g, id); // (startQuest waits on `after`)
}
