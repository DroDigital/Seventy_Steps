/**
 * The beats of the people's acts (round 40): when each thing an act does is done, as `pulse` periods of
 * render/npcActs.ts (period, from, length, edge: seconds into every period) and strokes in radians a second. The poses
 * read these, and so do the sounds (`actCues`), so a page is turned, a pipe drawn on, a knife drawn down a stick at the
 * moment the arm does it. Time is the act's own: the render time plus 1.7 s an entity (render/actorViews.ts). Pure data.
 */

import type { ActKind } from './npcActs';
import type { ACTS } from './foleySounds';

export type Pulse = readonly [period: number, from: number, len: number, edge?: number];

export const TIMING = {
  read: { turn: [11, 8, 1.5] },
  pipe: { draw: [15, 6, 5, 0.9], out: [15, 11.4, 2.2, 0.5] }, // (the smoke's too: render/pipeSmoke.ts)
  write: { think: [14, 9, 3.4, 0.6], stroke: 13 },
  drink: { sup: [17, 7, 4.5, 0.9] },
  whittle: { look: [12, 8, 2.5, 0.5], stroke: 5.2 },
  map: { point: [13, 8, 3.6, 0.7] },
  polish: { rest: [16, 12, 2.5, 0.5], rub: 2.4 },
  mend: { pull: [10, 6, 1.6, 0.4] },
  key: { past: [14, 9, 3.2, 0.7], turn: 0.9 },
  vial: { shake: [12, 8, 1.4, 0.3] },
  watch: { listen: [13, 7, 3, 0.6] },
  lean: { tap: [8, 6, 0.7, 0.2] },
} as const satisfies Record<string, Record<string, Pulse | number>>;

export interface ActCue {
  sound: keyof typeof ACTS;
  gain?: number; // of its class level (default 1)
  period: number; // the cue comes round every this many seconds...
  at: number; // ...this far into it...
  every?: number; // ...and again every this many seconds...
  until?: number; // ...up to this far into the period (with `every`)
  not?: Pulse; // not while this pulse (of the act's own beats) is on
  chance?: number; // a share of its times pass unsounded, the rest sound (default: all sound)
  pan?: number; // how far to a side (-1 to 1), for a hand that works on one
}

const [pipeD, pipeO] = [TIMING.pipe.draw, TIMING.pipe.out];
const stroke = (rate: number, quarter = 0.25): { every: number; at: number } => ({ every: (2 * Math.PI) / rate, at: ((2 * Math.PI) / rate) * quarter });

/** What each act sounds, and when. An act not named here makes no sound (the gazing, the brooding, the waiting). */
export const ACT_CUES: Readonly<Partial<Record<ActKind, readonly ActCue[]>>> = {
  read: [{ sound: 'page', period: 11, at: TIMING.read.turn[1] + TIMING.read.turn[2] * 0.5 }],
  smoke: [
    { sound: 'inhale', period: pipeD[0], at: pipeD[1] + pipeD[3] + 0.1 },
    { sound: 'exhale', period: pipeO[0], at: pipeO[1] + 0.1 },
  ],
  lounge: [
    { sound: 'inhale', period: pipeD[0], at: pipeD[1] + pipeD[3] + 0.1 },
    { sound: 'exhale', period: pipeO[0], at: pipeO[1] + 0.1 },
  ],
  write: [{ sound: 'scratch', period: 14, ...stroke(TIMING.write.stroke, 0), until: 14, not: TIMING.write.think, chance: 0.4, pan: 0.2 }],
  drink: [
    { sound: 'gulp', period: 17, at: TIMING.drink.sup[1] + TIMING.drink.sup[3] + 1 },
    { sound: 'glass', gain: 0.8, period: 17, at: TIMING.drink.sup[1] + TIMING.drink.sup[2] - TIMING.drink.sup[3] * 0.4 },
  ],
  whittle: [{ sound: 'scrape', period: 12, ...stroke(TIMING.whittle.stroke), until: 12, not: TIMING.whittle.look, chance: 0.2 }],
  map: [
    { sound: 'unfold', period: 13, at: TIMING.map.point[1] },
    { sound: 'unfold', gain: 0.6, period: 13, at: TIMING.map.point[1] + TIMING.map.point[2] - TIMING.map.point[3] },
  ],
  polish: [{ sound: 'rub', period: 16, every: Math.PI / TIMING.polish.rub, at: 0, until: 16, not: TIMING.polish.rest, chance: 0.1 }],
  mend: [{ sound: 'rope', period: 10, at: TIMING.mend.pull[1] + TIMING.mend.pull[2] * 0.5 }],
  key: [{ sound: 'keys', period: 14, every: Math.PI / TIMING.key.turn, at: Math.PI / 2 / TIMING.key.turn, until: 14, not: TIMING.key.past, chance: 0.3 }],
  vial: [
    { sound: 'shake', period: 12, at: TIMING.vial.shake[1] + 0.2 },
    { sound: 'glass', gain: 0.7, period: 12, at: TIMING.vial.shake[1] + TIMING.vial.shake[2] + 1.4 },
  ],
  watch: [{ sound: 'tick', period: 13, at: TIMING.watch.listen[1] + TIMING.watch.listen[3], every: 0.5, until: TIMING.watch.listen[1] + TIMING.watch.listen[2] }],
  lean: [{ sound: 'tap', period: 8, at: TIMING.lean.tap[1] + 0.25 }],
};

/** Whether a pulse is on (its `from` to its `from + len`) `u` seconds into its period's cycle at time `t`. */
const during = (t: number, [period, from, len]: Pulse): boolean => {
  const u = (((t % period) + period) % period) - from;
  return u >= 0 && u <= len;
};

/** The times in [t0, t1) at which an act of `kind` makes a sound, and which. `rand` draws the chances. Pure. */
export function actCues(kind: ActKind, t0: number, t1: number, rand: () => number): { t: number; cue: ActCue }[] {
  const out: { t: number; cue: ActCue }[] = [];
  for (const cue of ACT_CUES[kind] ?? []) {
    const last = cue.every !== undefined && cue.until !== undefined ? Math.floor((cue.until - cue.at) / cue.every) : 0;
    for (let cycle = Math.floor((t0 - cue.at - last * (cue.every ?? 0)) / cue.period); cycle <= Math.floor((t1 - cue.at) / cue.period); cycle++) {
      for (let n = 0; n <= last; n++) {
        const t = cycle * cue.period + cue.at + n * (cue.every ?? 0);
        if (t < t0 || t >= t1 || (cue.not && during(t, cue.not)) || (cue.chance !== undefined && rand() < cue.chance)) continue;
        out.push({ t, cue });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}
