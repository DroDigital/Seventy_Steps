/**
 * The horrors' pace (2026-11-27; asked: "boss encounters exhibit excessive attack speed with insufficient windup animations ... particularly
 * evident in the Great Ones encounter. The floor-based attack indicators require extended duration for certain maneuvers ... the current
 * damage output relative to required dodge speed for some attacks is frustrating"; docs/DECISIONS.md). A horror's blows are its own data
 * (data/bossMoves.ts), and many were quick: a chain's second link landed 12 to 16 frames after the first (0.2 s, a fifth of the health), a
 * blow struck straight out of a step through the air or the dark gave 18 to 20 (the Great Ones' descent: 20 frames, 22%), and the marks a
 * row, a spoke or a rain lays burst 32 to 40 frames after they were seen. Every horror that fights by a script is now paced when its blows
 * are compiled (data/attacks.ts `pacedAttack`): no blow it opens with, or strikes out of nothing, winds up for less than its band gives, more
 * for a heavier blow, a greater body and a longer lunge; no link of a chain for less than `link`; no mark bursts sooner than `mark` after it
 * is laid. What is still quick weighs less (`quickWeight`), but the horror's heaviest blow, which tests/bossBlows.test.ts holds where it is
 * met. The library's own numbers, and every lesser foe's, are as they were. Pure data.
 */

import type { PunishBand } from './bossPunish';

export const PACE = {
  open: { first: 32, middle: 30, deep: 30, last: 28 } as Readonly<Record<PunishBand, number>>, // frames: the least wind-up of a blow a horror opens with (0.53 s to 0.47 s; the library's least is 18), the earlier horrors the more generous
  heavy: 8, // frames more for each point of the blow's power past 1: the heavier the blow, the longer it is shown
  size: 8, // frames more, at most, for a great body (by the root of its size past a person's): its blows reach further and the eye takes longer to read where
  lunge: 1, // frames more for each metre the body carries itself through the blow...
  lungeMost: 8, // ...at most
  link: 18, // frames: the least wind-up of a chain's later link (0.3 s)...
  linkHeavy: 16, // ...and this many more for each point of its power past 1: a chain's heavy last blow is shown as its own (Ephraim's fifth knock landed 14 frames after the fourth, for a fifth of the health)
  mark: 48, // frames: the least a mark on the ground is seen before it bursts (0.8 s)
  rows: { delay: 56, stagger: 22 }, // a row with one gap must be searched for the gap: the least time before the first bursts, and between rows
  quick: { full: 36, least: 0.8 }, // a blow still winding up for less than `full` frames weighs less, down to `least` at the library's 18
} as const;

/** What of a blow its pace reads (data/attacks.ts `AttackDef`). */
interface Paced {
  kind: 'melee' | 'ranged' | 'area' | 'special';
  windup: number;
  power: number;
  range: readonly [number, number];
  lunge?: number;
  effect?: string;
  pull?: unknown;
  marks?: { delay: number; stagger: number; pattern?: string };
  wave?: unknown;
  cloud?: unknown;
}

/** Whether a blow strikes by a hitbox of its own (a swing, a slam, a dive, a burst), not by marks, a wave or a cloud it lays. */
export const strikesDirect = (a: Paced): boolean => a.kind === 'melee' || (a.kind === 'area' && !a.marks && !a.wave && !a.cloud);

/**
 * The least wind-up of a horror's blow, given what leads into it (if it is a link) and the root of its body's size: a blow that opens,
 * or follows a step, the dark or a special that warns of nothing, takes its band's; a link of a chain the chain's; a burst at the end of
 * a pull is warned of by the pull and keeps its own.
 */
export function leastWindup(a: Paced, lead: Paced | undefined, band: PunishBand, root: number): number {
  if (!strikesDirect(a)) return 0;
  if (lead?.pull) return 0; // (the pull's swirl and the blast at its heart are drawn the whole while it draws)
  const past = Math.max(0, a.power - 1);
  if (lead && lead.kind !== 'special') return Math.round(PACE.link + PACE.linkHeavy * past); // a chain's link, its blow before it seen
  const heavy = PACE.heavy * past;
  const size = PACE.size * Math.min(1, Math.max(0, root - 1));
  const lunge = Math.min(PACE.lungeMost, PACE.lunge * (a.lunge ?? 0) * root);
  return Math.round(PACE.open[band] + heavy + size + lunge);
}

/** The patterns a blind horror lays about its own body: the ground they fall on is drawn through the whole wind-up (render/telegraphs.ts), and their beat is the fight's. */
const FORESHOWN: readonly string[] = ['beats', 'spiral', 'scatter'];

/** A mark's delay and the stagger between them, paced: a row's are searched for the gap. */
export function pacedMarks(m: { delay: number; stagger: number; pattern?: string }): { delay: number; stagger: number } {
  if (m.pattern && FORESHOWN.includes(m.pattern)) return { delay: m.delay, stagger: m.stagger };
  if (m.pattern === 'rows') return { delay: Math.max(m.delay, PACE.rows.delay), stagger: Math.max(m.stagger, PACE.rows.stagger) };
  return { delay: Math.max(m.delay, PACE.mark), stagger: m.stagger };
}

/** How much a blow that still winds up for fewer than `quick.full` frames weighs: from `quick.least` at 18 frames to all of it. */
export function quickWeight(windup: number): number {
  const { full, least } = PACE.quick;
  const t = Math.min(1, Math.max(0, (windup - 18) / (full - 18)));
  return least + (1 - least) * t;
}
