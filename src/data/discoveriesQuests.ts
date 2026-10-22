/**
 * The journal's line for each horror's discovery (round 63): its acts are the stages of a quest (data/discoveries.ts), and the last, once
 * the gate has given, is the horror itself. Begun when the house is first seen (systems/discovery.ts), followed on the map until it is done,
 * a horror put down before it was sought closes it, but later pages and lights never skip a gate requirement. Data only.
 */

import { DISCOVERIES } from './discoveriesAll';
import type { QuestDef, QuestStage } from './quests';

/** A quest for every discovery, keyed `discover_<horror>`. */
export function discoveryQuests(): Record<string, QuestDef> {
  const out: Record<string, QuestDef> = {};
  for (const [boss, d] of Object.entries(DISCOVERIES)) {
    const acts: QuestStage[] = d.steps.map((s, i) => ({ goal: s.kind === 'read' ? { kind: 'read', doc: s.doc } : { kind: 'step', boss, i }, note: s.note }));
    out[`discover_${boss}`] = { title: d.title, lenient: 'last', stages: [...acts, { goal: { kind: 'slay', boss }, note: d.opens }], done: d.done, reward: d.reward };
  }
  return out;
}
