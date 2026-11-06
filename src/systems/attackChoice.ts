/**
 * Which blow a creature strikes (spec §3E): a weighted roll among the attacks whose range bracket holds the distance. Round 107 (asked: the
 * spinning barrage "should never be 2 times in a row", then "add a rule to all boss attacks that could be too OP with a short cooldown ... make it
 * fair but challenging with selected attacks instead of fully random ones, but still leave a few random ones"): a horror in its fight weighs the
 * roll by what it sees. An attack marked `once` never comes twice running, and one with a `rest` waits that long after it was last struck (unless
 * nothing else would fit, so a horror never stands idle for it). A blow struck from the middle of its bracket weighs more than one at its edge;
 * a body behind cover draws what goes round it (marked ground, lobbed shells, waves and clouds) and not what needs a clear line (bolts, beams,
 * gazes); one swallowing a dose draws the quickest blows. The roll stays: a horror's next blow
 * is likely, never certain. And it learns, a little, in each fight: the blows that have landed on the investigator weigh more, the ones they keep
 * dodging, guarding or parrying less, within a cap, and all of it is forgotten when the fight resets (a fall, or the horror giving up the chase), so
 * a retry is met fresh. Creatures outside a fight roll evenly, as before. Pure: no Three.js.
 */

import type { Rng } from '../core/rng';
import type { AttackChoice, BrainDef } from '../data/archetypes';
import { ATTACKS, type AttackDef } from '../data/attacks';
import { CHOICE } from '../data/tuning';
import type { HitOutcome } from './gameEvents';

/** What a horror sees as it chooses. */
export interface Situation {
  recent: readonly string[]; // its last blows, the newest first
  usedAt: Readonly<Record<string, number>>; // the frame each was last struck
  now: number;
  hidden: boolean; // its quarry stands behind something: no clear line from its chest to theirs
  healing: boolean; // its quarry is swallowing a dose or taking a shot of Reagent
  learnt?: Readonly<Record<string, number>>; // -1..1 for each blow: how it has fared against this quarry in this fight (learnFrom)
}

const attackOf = (move: string): AttackDef | undefined => ATTACKS[move as keyof typeof ATTACKS];

/** Whether a blow needs a clear line to its quarry (a bolt that flies straight, a beam, a sweep, a barrage, a gaze). */
export function needsSight(a: AttackDef): boolean {
  return (!!a.bolts && !a.bolts.lob) || !!a.shot || !!a.sweep || !!a.barrage || a.effect === 'gaze';
}

/** Whether a blow comes round cover (marked ground, a lobbed shell, a ring along the ground, a cloud, a pull). */
export function goesRound(a: AttackDef): boolean {
  return !!a.marks || !!a.wave || !!a.cloud || !!a.pull || !!a.bolts?.lob;
}

const fits = (a: AttackChoice, d: number, mobile: boolean): boolean => (!mobile || d >= a.range[0]) && d <= a.range[1];

/** How much a horror leans toward `a` here: never 0, so every blow that fits may still come. */
export function leaning(a: AttackChoice, d: number, s: Situation): number {
  const def = attackOf(a.move);
  let w = a.weight;
  const [lo, hi] = a.range;
  const t = hi > lo ? (d - lo) / (hi - lo) : 0.5;
  if (t >= CHOICE.sweet[0] && t <= CHOICE.sweet[1]) w *= CHOICE.sweet[2];
  if (def && s.hidden) w *= needsSight(def) ? CHOICE.hidden.sight : goesRound(def) ? CHOICE.hidden.round : 1;
  if (def && s.healing && def.windup <= CHOICE.quick) w *= CHOICE.healing;
  w *= 1 + CHOICE.learn.most * Math.max(-1, Math.min(1, s.learnt?.[a.move] ?? 0));
  return w;
}

/** Whether `move` may be struck now: not a `once` blow struck last, and (`rested`) not one whose rest has not run out. */
export function allowed(move: string, s: Situation | undefined, rested: boolean): boolean {
  const def = attackOf(move);
  if (!def || !s) return true;
  if (def.once && s.recent[0] === move) return false;
  return !rested || !def.rest || s.now - (s.usedAt[move] ?? -Infinity) >= def.rest;
}

/**
 * Weighted pick among the attacks whose range bracket contains `d`; null when none fits. One that cannot move (`mobile` false) cannot get to the
 * range of its blows, so what stands nearer than they like is in reach of them as much as what stands at it (round 24: the Whisperer, who sits,
 * had nothing that wounds within three metres of its chair, and could be cut down to half untouched). With a `situation` (a horror in its
 * fight) the roll is weighed as above.
 */
export function chooseAttack(def: BrainDef, d: number, rng: Rng, mobile = true, situation?: Situation): string | null {
  const pick = (fit: (a: AttackChoice) => boolean): AttackChoice[] => {
    const near = def.attacks.filter(fit);
    const pool = near.filter((a) => allowed(a.move, situation, true));
    return pool.length ? pool : near.filter((a) => allowed(a.move, situation, false)); // every one resting: the rest gives way, never the `once`
  };
  let pool = pick((a) => fits(a, d, mobile));
  // Its quarry pressed too close for all but a `once` it has just struck: a blow it likes from farther is struck from here, so standing in a
  // caster's face does not leave it mute (the balance bot stood against Curwen and he struck nothing for half a minute).
  if (!pool.length && situation) pool = pick((a) => d <= a.range[1]);
  const weight = (a: AttackChoice): number => (situation ? leaning(a, d, situation) : a.weight);
  let roll = rng() * pool.reduce((sum, a) => sum + weight(a), 0);
  for (const a of pool) if ((roll -= weight(a)) < 0) return a.move;
  return null;
}

const LANDED: readonly HitOutcome[] = ['hit', 'stagger', 'guardBreak', 'kill'];
const MET: readonly HitOutcome[] = ['dodged', 'blocked', 'parried'];

/** What a horror learns from one of its blows meeting its quarry: a landing leans it toward that blow, a dodge, guard or parry away. */
export function learnFrom(learnt: Readonly<Record<string, number>> | undefined, move: string, outcome: HitOutcome): Record<string, number> | undefined {
  const sign = LANDED.includes(outcome) ? 1 : MET.includes(outcome) ? -1 : 0;
  if (!sign) return learnt && { ...learnt };
  const was = learnt?.[move] ?? 0;
  return { ...learnt, [move]: Math.max(-1, Math.min(1, was + sign * CHOICE.learn.step)) };
}

/** Remembers a blow struck: the newest first, the last few kept. */
export function remember(recent: string[] | undefined, usedAt: Record<string, number> | undefined, move: string, now: number): { recent: string[]; usedAt: Record<string, number> } {
  return { recent: [move, ...(recent ?? [])].slice(0, CHOICE.keep), usedAt: { ...usedAt, [move]: now } };
}
