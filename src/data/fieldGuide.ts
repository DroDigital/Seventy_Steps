/**
 * The Field Guide: the hints a new investigator is given (ui/hints.ts), kept in the save beside what has been told, and read again
 * from the Journal. A hint's words are in the interface's language (`hint.<id>` in data/lang); what it is called here, and where it is
 * filed, are the journal's own, like its tabs. Data only.
 */

import type { Key } from './lang';

export type HintId = Key extends infer K ? (K extends `hint.${infer I}` ? I : never) : never;

/** What the save holds once a hint has been given: `hint:<id>`. */
export const HINT_KEPT = 'hint:';
/** What a world that keeps its hints in the save holds from the start (a save from before has not: it takes up what the browser was told). */
export const HINTS_KEPT = 'hints:kept';

export const GUIDE_GROUPS = ['Moving and fighting', 'The mind', 'The dream', 'The horrors'] as const;
export type GuideGroup = (typeof GUIDE_GROUPS)[number];

const g = (group: GuideGroup, title: string): { group: GuideGroup; title: string } => ({ group, title });
const [FIGHT, MIND, DREAM, HORRORS] = GUIDE_GROUPS;

export const GUIDE: Readonly<Record<HintId, { group: GuideGroup; title: string }>> = {
  move: g(FIGHT, 'Moving'),
  fight: g(FIGHT, 'Fighting'),
  breath: g(FIGHT, 'Breath'),
  riposte: g(FIGHT, 'Parry and riposte'),
  grab: g(FIGHT, 'Grabs'),
  gun: g(FIGHT, 'The revolver'),
  oil: g(FIGHT, 'Lamp oil'),
  hurt: g(FIGHT, 'Wounds and Reagent'),
  mind: g(MIND, 'A failing mind'),
  unmoored: g(MIND, 'Unmoored'),
  phantom: g(MIND, 'Phantoms'),
  insight: g(MIND, 'Insight'),
  passage: g(MIND, 'Hidden passages'),
  passageCost: g(MIND, 'What insight costs'),
  lead: g(DREAM, 'Where the story leads'),
  sign: g(DREAM, 'Elder Signs'),
  echoes: g(DREAM, 'Echoes'),
  level: g(DREAM, 'Levels'),
  map: g(DREAM, 'The map'),
  quest: g(DREAM, 'Quests'),
  talk: g(DREAM, 'People'),
  relic: g(DREAM, 'Relics'),
  transfer: g(DREAM, 'Moving reinforcement'),
  boss: g(HORRORS, 'Bosses'),
  fog: g(HORRORS, 'The mist'),
  candle: g(HORRORS, 'Candles'),
  stoop: g(HORRORS, 'Colossi'),
  ship: g(HORRORS, 'Cthulhu'),
  powder: g(HORRORS, 'The Dunwich Horror'),
  cover: g(HORRORS, 'Ghatanothoa'),
  roots: g(HORRORS, 'Shub-Niggurath'),
  spheres: g(HORRORS, 'Yog-Sothoth'),
  blind: g(HORRORS, 'Azathoth'),
};

export const HINT_IDS = Object.keys(GUIDE) as HintId[];

/** Whether the hint has been given, by what a save has been told. */
export const hintGiven = (told: ReadonlySet<string>, id: string): boolean => told.has(HINT_KEPT + id);

/** A save from before hints were kept in it is not told them again where this browser has been: it takes up what the browser was told, once. True when it did. */
export function takeUpBrowser(told: Set<string>, browser: Iterable<string>): boolean {
  if (told.has(HINTS_KEPT)) return false;
  told.add(HINTS_KEPT);
  for (const id of browser) if (id in GUIDE) told.add(HINT_KEPT + id);
  return true;
}
