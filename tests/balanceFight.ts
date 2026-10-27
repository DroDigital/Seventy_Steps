/**
 * The balance bot's fights (playtest round 25, shared since round 95): one horror at a standing, the mean of the bot's runs from several starts, as
 * tests/balance.test.ts tables it and tests/ngPlus.test.ts fits and holds the later journeys to it.
 */
import { expect } from 'vitest';
import { getEntity } from '../src/data/registry';
import { LEVELS, REAGENT, SIM } from '../src/data/tuning';
import { healthAt } from '../src/systems/levelWorth';
import { botFight, type BotFight } from './botHelpers';
import { CAP } from './balanceBands';
import { dosesAt, standings, type Standing } from './balanceModel';

export const FRAMES = 60 * 60 * 10; // ten minutes
export const SKILL = 0.55;
/** What the bot plays badly, and is let off: the gaze that turns flesh to stone (it is in sight of it for about half of a fight at best, so its seconds are scaled by the share in view), and the roots (which a person cuts down first, and so spends some seconds more). */
export const WAIVED: Record<string, { waive: readonly ('petrify' | 'roots' | 'void')[]; scale: number; add: number }> = {
  ghatanothoa: { waive: ['petrify'], scale: 1 / 0.56, add: 0 },
  shub_niggurath: { waive: ['roots'], scale: 1, add: 40 },
  great_ones: { waive: ['void'], scale: 1, add: 0 }, // round 60: a person with insight keeps to the hidden platforms; the bot stood in the void, most of what those fights cost it
  umr_at_tawil: { waive: ['void'], scale: 1, add: 0 },
};
/** Where the bot starts, metres from the boss (round 60): a bot's path through a fight is chaos, a blow taken or slipped sending it another way, so each fight is the mean of three. */
export const STARTS = [7, 10, 13];
const TOTAL = standings().length; // the horrors there are, for the Reagent carried

export interface Row extends Standing, Pick<BotFight, 'health' | 'dealt' | 'taken' | 'fell' | 'deaths'> {
  seconds: number;
  doses: number; // the Reagent a person carries there (balanceModel.ts `dosesAt`)
  pressure: number; // damage taken, in lives: its health and the Reagent a person carries
}

/** The fights at a standing, one from each start: what they took and cost, on the mean. `cycle` is the journey they are fought on (round 95; 0, the first). */
export function fightAt(s: Standing, starts: readonly number[] = STARTS, cycle = 0): Row {
  const w = WAIVED[s.id];
  const runs = starts.map((start) => botFight(s.id, FRAMES, undefined, { levels: s.levels, reinforced: s.reinforced, skill: SKILL, floor: true, smart: true, mind: true, waive: w?.waive, start, cycle }));
  for (const r of runs) expect(r.bad).toEqual([]);
  const mean = (k: 'dealt' | 'taken' | 'frames'): number => runs.reduce((n, r) => n + r[k], 0) / runs.length;
  const taken = mean('taken');
  return { ...s, health: runs[0].health, dealt: mean('dealt'), taken, fell: runs.every((r) => r.fell), deaths: runs.reduce((n, r) => n + r.deaths, 0), seconds: (mean('frames') / SIM.hz) * (w?.scale ?? 1) + (w?.add ?? 0), doses: dosesAt(s.rank, TOTAL), pressure: taken / (s.hp * (1 + dosesAt(s.rank, TOTAL) * REAGENT.heal)) };
}

export const tableOf = (list: Row[]): string => {
  const lines = [...list].sort((a, b) => a.rank - b.rank).map((r) => `| ${r.rank + 1} | ${getEntity(r.id)!.name} | ${r.levels.vigour}/${r.levels.endurance}/${r.levels.might} | ${r.reinforced} | ${r.health} | ${r.fell ? r.seconds.toFixed(0) : '>' + r.seconds.toFixed(0)} | ${r.taken.toFixed(0)} | ${r.hp} | ${r.doses} | ${r.pressure.toFixed(2)} | ${r.deaths} |`);
  return ['| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...lines].join('\n');
};

/** Every standing again with all the levels bought and the cane at its best: the horror has grown past the level it is met at. */
export const atCapOf = (s: Standing): Standing => {
  const levels = { vigour: LEVELS.vigour.max, endurance: LEVELS.endurance.max, might: LEVELS.might.max } as Standing['levels'];
  return { ...s, levels, hp: healthAt(levels.vigour), reinforced: CAP.reinforced };
};
