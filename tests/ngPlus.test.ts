/**
 * The later journeys held to the bands (round 95: "progressively more difficult without being impossible at any NG+"). A second journey begins with
 * everything the first ended with, and the least that is is what the last horror's standing has (balanceModel.ts: 18 Vigour, 9 Endurance and 17
 * Might, the cane at +5); a person who has bought more finds the horrors a little easier (the cap's, tests/balanceBands.ts, are about a tenth), but
 * a horror grows with the levels bought (systems/bossScaling.ts), so the cap is held as well: one fight, Cthulhu's, took 109 seconds at the cap, against
 * 57, when a fit at the least alone gave it 31% more health, which the least bore (80). The balance bot is set at both and fights every horror it can measure, from the
 * cap table's nine starts, on the fourth journey and the last: none may be longer than its tier's band, nor cost the bot more lives than the cap
 * table allows (tests/balance.test.ts: the lives a person has in health and Reagent), and the last must cost more than the fourth. Each horror climbs
 * its own ladder (data/bossNgPlus.ts, systems/ngPlus.ts) because each has its own room to climb in: the first journey costs a bot from a fifth of
 * a life to the top of a great fight's band.
 *
 * `NGPLUS_WRITE=1 npm run audit` fits that table again (about four minutes: `FIT`) and writes it and docs/NGPLUS.md. Run it
 * when a horror, the bot or the bands change; the ordinary run only holds the committed table to the bands.
 */
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSS_NG_PLUS } from '../src/data/bossNgPlus';
import { getEntity } from '../src/data/registry';
import { BOSS, NEW_GAME_PLUS } from '../src/data/tuning';
import { BANDS, CAP, EXEMPT, GREAT } from './balanceBands';
import { blowShare } from './balanceBlows';
import { atCapOf, fightAt, type Row } from './balanceFight';
import { standings, type Standing } from './balanceModel';

const [MID, LAST] = [3, NEW_GAME_PLUS.most]; // the fourth journey, and the last counted (the eighth): cycles, from 0
/** What is let past a band's top: in lives, a quarter (the cap table's rule, tests/balance.test.ts: a fight that costs the bot all it carries and a quarter more is one a person who rolls better wins), in seconds a tenth (the least a journey ends with strikes a little slower than the cap, and the bot's path through a fight is chaos). */
const MORE = { lives: 1.25, seconds: 1.1 };
const SLOW = 20 * 60_000; // a table is a few hundred fights
/**
 * The fit. Each horror's last journey is aimed at `safe` of its band's top (lives and seconds), or, where it has less room than that, at `reach` times
 * what the first journey costs; a horror that already costs more than that stays as it is. Its blows may grow by `damage` at the most, and by no more
 * than keeps its heaviest, so grown, within `short` of BOSS.blowMost where it is met (which would otherwise hold it level, tests/oneHit.test.ts), and its
 * health by `health`, and by no more than the seconds allow: more health is a longer fight, and a bot's seconds have a band as well.
 */
const FIT = { safe: 0.9, reach: 3, health: 0.6, damage: 0.7, short: 0.99, rounds: 10, exponent: 1.15 };

const END = standings().at(-1)!; // the last horror's standing: the least a second journey begins with
const measured = standings().filter((s) => !EXEMPT.includes(s.id));
const table = measured.map((s): Standing => ({ ...s, levels: END.levels, hp: END.hp, reinforced: END.reinforced }));
const bandOf = (id: string): (typeof BANDS)[keyof typeof BANDS] => BANDS[GREAT.has(id) ? 'god' : 'named'];
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r3 = (x: number): number => Math.round(x * 1000) / 1000;
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const growth = BOSS_NG_PLUS as Record<string, readonly [number, number]>; // (the fit sets it as it goes, and writes it)

const memo = new Map<string, Row[]>();
let epoch = 0; // the changes the fit has made to the table: a journey after the first is fought again when it has
/** Every horror the bot measures, with what the last journey ended with, on journey `cycle`. */
const measure = (cycle: number): Row[] => {
  const key = `${cycle}/${cycle ? epoch : 0}`;
  if (!memo.has(key)) memo.set(key, table.map((s) => fightAt(s, CAP.starts, cycle)));
  return memo.get(key)!;
};

/** The same at the cap (the doc's last column): a stronger person, but met by a horror grown with the levels, so mostly easier, and sometimes not. */
const capped = new Map<string, Row[]>();
const measureCap = (cycle: number): Row[] => {
  const key = `${cycle}/${cycle ? epoch : 0}`;
  if (!capped.has(key)) capped.set(key, measured.map((s) => fightAt(atCapOf(s), CAP.starts, cycle)));
  return capped.get(key)!;
};
/** The worse of a horror's two fights on the last journey: the costlier and the longer of what the least cost and what the cap did. */
const worse = (a: Row, b: Row): Row => ({ ...a, pressure: Math.max(a.pressure, b.pressure), seconds: Math.max(a.seconds, b.seconds), deaths: a.deaths + b.deaths, fell: a.fell && b.fell });
const fightLast = (s: Standing): Row => worse(fightAt(s, CAP.starts, LAST), fightAt(atCapOf(s), CAP.starts, LAST));

interface Aim {
  lives: number; // what the last journey should cost
  seconds: number; // and the longest it should take
  room: number; // the most health that the seconds leave room for
  damage: number; // the most the blows may grow by (the heaviest of them, at either standing, stays short of the most a blow may take)
}
const aimOf = (r: Row): Aim => {
  const band = bandOf(r.id);
  const lives = Math.max(r.pressure, Math.min(FIT.reach * r.pressure, FIT.safe * band.lives[1]));
  const seconds = Math.max(r.seconds, FIT.safe * band.seconds[1]);
  const share = Math.max(blowShare(r.id, END.levels), blowShare(r.id, atCapOf(r).levels));
  const damage = clamp(Math.floor((FIT.short * BOSS.blowMost / share - 1) * 1000) / 1000, 0, FIT.damage);
  return { lives, seconds, room: clamp(seconds / (r.seconds * 1.06) - 1, 0, FIT.health), damage };
};

type Growth = [health: number, damage: number];
/** Where to begin: health by what the seconds and half the growth asked allow, blows for the rest (the cost in lives grows a little faster than the product of the two: a longer fight is a harder one). */
function begin(r: Row, aim: Aim): Growth {
  const asked = aim.lives / Math.max(r.pressure, 0.02);
  const health = Math.min(aim.room, 0.5 * (asked - 1));
  return [r3(health), r3(clamp(asked / (1 + health) ** FIT.exponent - 1, 0, aim.damage))];
}

/** The next try, from what the last cost: the seconds ease the health, the lives move the blows (and the health, where the blows are at their most or at nothing). */
function next([health, damage]: Growth, r: Row, aim: Aim): Growth {
  const ratio = aim.lives / Math.max(r.pressure, 0.02);
  let h = r.seconds > aim.seconds * 1.03 && health > 0 ? (1 + health) * (aim.seconds / r.seconds) - 1 : health;
  let d = (1 + damage) * ratio ** 0.9 - 1;
  if (d > aim.damage) [d, h] = [aim.damage, (1 + h) * ratio ** 0.5 - 1];
  else if (d < 0) [d, h] = [0, (1 + h) * ratio - 1];
  return [r3(clamp(h, 0, aim.room)), r3(clamp(d, 0, aim.damage))];
}

/** Whether a try is as near its aim as it can be: inside it, and near it or as far as the limits allow, or too hard with nothing added (there is no way down). */
const settled = ([health, damage]: Growth, r: Row, aim: Aim): boolean =>
  (health <= 0 && damage <= 0 && r.pressure > aim.lives) ||
  (r.pressure <= aim.lives * 1.03 &&
    (r.pressure >= aim.lives * 0.93 || (damage >= aim.damage && health >= aim.room - 0.002)) &&
    (r.seconds <= aim.seconds * 1.03 || health <= 0));

interface Visit {
  growth: Growth;
  row: Row;
}

/** Fits every horror's last journey, each from the cost of its first, a few tries over: the best of what was tried is kept (the bot's path through a fight is chaos, so the cost moves a little with anything). */
function fit(): void {
  const aims = new Map(measure(0).map((r) => [r.id, aimOf(r)]));
  const tried = new Map<string, Visit[]>();
  const open = new Set(table.map((s) => s.id));
  for (const r of measure(0)) growth[r.id] = begin(r, aims.get(r.id)!);
  for (let round = 0; round < FIT.rounds && open.size; round++) {
    for (const s of table) {
      if (!open.has(s.id)) continue;
      const aim = aims.get(s.id)!;
      const g = growth[s.id] as Growth;
      const row = fightLast(s);
      tried.set(s.id, [...(tried.get(s.id) ?? []), { growth: g, row }]);
      if (process.env.NGPLUS_TRACE) console.log(`fit ${s.id} round ${round}: +${g[0]} health, +${g[1]} blows: ${row.pressure.toFixed(2)} lives (aim ${aim.lives.toFixed(2)}), ${row.seconds.toFixed(0)} s (aim ${aim.seconds.toFixed(0)})`);
      if (settled(g, row, aim)) open.delete(s.id);
      else growth[s.id] = next(g, row, aim);
    }
  }
  for (const [id, visits] of tried) {
    const aim = aims.get(id)!;
    const fair = visits.filter((v) => v.row.pressure <= aim.lives * 1.03 && (v.row.seconds <= aim.seconds * 1.03 || v.growth[0] <= 0));
    const best = fair.length ? fair.reduce((a, b) => (b.row.pressure > a.row.pressure ? b : a)) : visits.reduce((a, b) => (b.row.pressure < a.row.pressure ? b : a));
    growth[id] = best.growth;
  }
  epoch++;
  const list = [...table].sort((a, b) => a.rank - b.rank);
  writeFileSync('src/data/bossNgPlus.ts', `/**
 * How much harder each horror is on the last journey than on the first (round 95; written by \`NGPLUS_WRITE=1 npm run audit\`, tests/ngPlus.test.ts, fitted by
 * the balance bot, at the least a second journey begins with and at the cap, whichever costs more): its health and its blows, each as a share added to the first journey's. The rungs between take equal steps
 * (systems/ngPlus.ts). A horror not named here (Azathoth and the Haunter of the Dark, which the bot cannot measure, and the Elder Shoggoth and the Polyp Swarm, hall bosses it does not table) takes \`NEW_GAME_PLUS.boss\`.
 */
export const BOSS_NG_PLUS: Readonly<Record<string, readonly [health: number, damage: number]>> = {
${list.map((s) => `  ${s.id}: [${growth[s.id][0]}, ${growth[s.id][1]}],`).join('\n')}
};
`);
}

describe.runIf(process.env.NGPLUS_WRITE)('the fit (NGPLUS_WRITE=1)', () => {
  it('fits every horror\'s last journey to its band, and writes the table', () => {
    fit();
    expect(Object.keys(growth).length).toBeGreaterThanOrEqual(table.length);
  }, SLOW);
});

/** What a journey may not cost a horror's fight: more than its tier's band, in seconds or in lives. */
function overBand(rows: Row[], journey: number): string[] {
  const bad: string[] = [];
  for (const r of rows) {
    const band = bandOf(r.id);
    if (!r.fell) bad.push(`${r.id}: not finished in ${r.seconds.toFixed(0)} seconds on journey ${journey}`);
    else if (r.seconds > band.seconds[1] * MORE.seconds) bad.push(`${r.id}: ${r.seconds.toFixed(0)} seconds on journey ${journey}, its band's top is ${band.seconds[1]}`);
    if (r.pressure > band.lives[1] * MORE.lives) bad.push(`${r.id}: ${r.pressure.toFixed(2)} lives on journey ${journey}, more than a person carries (its band's top is ${band.lives[1]})`);
    if (r.deaths > 0) bad.push(`${r.id}: died ${r.deaths} times on journey ${journey}`);
  }
  return bad;
}

for (const cycle of [MID, LAST]) {
  describe(`journey ${cycle + 1}, with what the first ended with`, () => {
    it('leaves no horror longer or costlier than its tier\'s band', () => {
      expect(overBand(measure(cycle), cycle + 1)).toEqual([]);
    }, SLOW);
  });
}

describe(`journey ${LAST + 1}, at the cap`, () => {
  it('leaves no horror longer or costlier than its tier\'s band', () => {
    expect(overBand(measureCap(LAST), LAST + 1)).toEqual([]);
  }, SLOW);
});

describe('the climb', () => {
  it('is steady: each horror costs no less on the last journey than on the fourth, and the middle of them costs more', () => {
    const [mid, last] = [measure(MID), measure(LAST)];
    const worse = last.filter((r) => r.pressure < mid.find((m) => m.id === r.id)!.pressure * 0.85).map((r) => r.id);
    expect(worse).toEqual([]); // (a little under for the bot's chaos, which moves a horror's cost by a tenth with anything)
    expect(median(last.map((r) => r.pressure))).toBeGreaterThan(median(mid.map((r) => r.pressure)));
    expect(last.reduce((n, r) => n + r.seconds, 0)).toBeGreaterThan(mid.reduce((n, r) => n + r.seconds, 0));
  }, SLOW);
});

const nameOf = (r: Row): string => getEntity(r.id)!.name;
const tableOf = (first: Row[], mid: Row[], last: Row[], cap: Row[]): string => {
  const at = (rows: Row[], id: string): Row => rows.find((r) => r.id === id)!;
  const cell = (r: Row): string => `${r.seconds.toFixed(0)} / ${r.pressure.toFixed(2)}`;
  const lines = [...last].sort((a, b) => a.rank - b.rank).map((r) => `| ${r.rank + 1} | ${nameOf(r)} | ${bandOf(r.id) === BANDS.god ? 'great' : 'named'} | ${cell(at(first, r.id))} | ${cell(at(mid, r.id))} | ${cell(r)} | ${cell(at(cap, r.id))} | +${Math.round(growth[r.id][0] * 100)}% | +${Math.round(growth[r.id][1] * 100)}% |`);
  return ['| # | Horror | Band | Journey 1: seconds / lives | Journey 4 | Journey 8 | Journey 8 at the cap | Health added at the top | Blows added at the top |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...lines].join('\n');
};

describe.runIf(process.env.NGPLUS_WRITE)('the table (NGPLUS_WRITE=1)', () => {
  it('writes docs/NGPLUS.md', () => {
    const [first, mid, last, cap] = [measure(0), measure(MID), measure(LAST), measureCap(LAST)];
    const stats = (rows: Row[]): string => `median ${median(rows.map((r) => r.pressure)).toFixed(2)}, most ${Math.max(...rows.map((r) => r.pressure)).toFixed(2)}`;
    const L = END.levels;
    /** The horrors past a band's top (in lives or seconds), as the table has them. */
    const pastTop = (rows: Row[]): string => {
      const over = [...rows].sort((a, b) => a.rank - b.rank).flatMap((r) => {
        const band = bandOf(r.id);
        const parts = [r.pressure > band.lives[1] ? `${r.pressure.toFixed(2)} lives (${band.lives[1]})` : '', r.seconds > band.seconds[1] ? `${r.seconds.toFixed(0)} seconds (${band.seconds[1]})` : ''].filter(Boolean);
        return parts.length ? [`${nameOf(r)}, ${parts.join(' and ')}`] : [];
      });
      return over.length ? over.join('; ') : 'none';
    };
    writeFileSync('docs/NGPLUS.md', `# The later journeys

Written by \`tests/ngPlus.test.ts\` (\`NGPLUS_WRITE=1 npm run audit\`; round 95). There is one difficulty (the three of round 38 are gone), and the dream grows harder each
time it is dreamed again, up to the ${NEW_GAME_PLUS.most + 1}th journey, along a ladder of ${NEW_GAME_PLUS.most} equal rungs, one a journey (\`systems/ngPlus.ts\`). What a rung adds is not the same for every foe:

- **An ordinary foe** (\`NEW_GAME_PLUS.foes\`) is ${Math.round(NEW_GAME_PLUS.foes.health * 100)}% hardier and strikes ${Math.round(NEW_GAME_PLUS.foes.damage * 100)}% harder at the top. No foe but a horror grows with the investigator's levels. Set from the bot at the cap against
  every creature of the roster that is not a horror (\`tests/botHelpers.ts\`, \`cycle\`): the old ladder (+420% health, +245% blows on the eighth journey) left 13 of the 46 unbeaten in half a minute,
  and four of them cost over five health bars each; this costs the middle one about twice what it did on the first journey (3.5% of the health, from 1.6%) and the worst, the Dhole, a bar and two thirds (from half a bar).
- **A horror** takes its own growth (\`data/bossNgPlus.ts\`, the last two columns), fitted so that on the last journey it costs the balance bot, at the worse of two standings (the least a second journey
  begins with and the cap: a horror grows with the levels bought, so a person with them all can meet a longer fight than one with the least: Cthulhu, given 31% more health by a fit at the least alone, took 109 seconds at the cap against 57), ${FIT.safe * 100}% of its
  band's top in lives (a named horror ${BANDS.named.lives[1]}, a great fight ${BANDS.god.lives[1]}), or ${FIT.reach} times what it cost on the first journey where it has less room, and takes no longer than
  ${FIT.safe * 100}% of its band's seconds (${BANDS.named.seconds[1]} and ${BANDS.god.seconds[1]}). A horror that already costs more than that stays as it is. A horror's blows
  grow by ${FIT.damage * 100}% at the most, and by no more than keeps its heaviest blow (a third of the investigator's health where it is met, more with the levels bought) short of \`BOSS.blowMost\`, which would hold it level: no blow takes more than 60% of their health, tests/oneHit.test.ts; its health
  by ${FIT.health * 100}% at the most, and by no more than its seconds leave room for. Where a horror is held by the one it gains the other (a great fight that is already long grows in its blows,
  one that is already costly in its health). Azathoth and the Haunter of the Dark, which the bot cannot measure, and the Elder Shoggoth and the Polyp Swarm, the hall bosses of two lesser creatures, which it does not table, take \`NEW_GAME_PLUS.boss\` (${Math.round(NEW_GAME_PLUS.boss.health * 100)}% and ${Math.round(NEW_GAME_PLUS.boss.damage * 100)}%).
- Echoes (\`NEW_GAME_PLUS.echoes\`) rise ${Math.round(NEW_GAME_PLUS.echoes * 100)}% a journey, as before. A horror still grows with the investigator's levels (\`systems/bossScaling.ts\`) on every journey; the rung is laid over that.

## What it costs

The balance bot of \`tests/balance.test.ts\`, from ${CAP.starts.length} starts, with the least a second journey begins with (the last horror's standing: ${L.vigour} Vigour, ${L.endurance} Endurance and ${L.might} Might, the cane at +${END.reinforced}), on the first, fourth and eighth
journeys; and, in the last column, at the cap (every level bought), which a person reaches in a journey or two of hunting: stronger, but met by a horror grown with the levels, so mostly a tenth easier, and now and then not. Each cell is the seconds the horror took and the lives it cost (the damage
taken against the health and Reagent a person has there, as the first journey carries them; a second carries every vial it found, so these lives are more than it spends; 1 is a fight that spends all of it).
Lives, first journey: ${stats(first)}; fourth: ${stats(mid)}; eighth: ${stats(last)}; eighth at the cap: ${stats(cap)}. The bot's path through a fight is chaos, so any one cell moves by a tenth with anything.
Past a band's top on the eighth journey: ${pastTop(last)}; at the cap: ${pastTop(cap)} (the checks let a quarter pass in lives, as the cap table does, and a tenth in seconds). A horror's servants are ordinary foes and take the ordinary
rung whatever the horror's own, so a horror that costs most for its servants can be past its top with nothing added to it.

${tableOf(first, mid, last, cap)}

## Held by

\`tests/ngPlus.test.ts\` holds every horror under its tier's band on the fourth and eighth journeys, and on the eighth at the cap (named: at most ${BANDS.named.seconds[1]} seconds and ${BANDS.named.lives[1]} lives; great: ${BANDS.god.seconds[1]} and ${BANDS.god.lives[1]}; no deaths;
lives to a quarter past the top, as the cap table's are, and seconds to a tenth), and holds the eighth to cost more than the fourth (the bands' bottoms are the first journey's, tests/balance.test.ts: a later journey only costs more; the rungs between are straight lines). \`tests/ladder.test.ts\` holds the rungs: the first journey as authored, equal steps, a rung for every horror the bot measures, none that falls.
\`tests/oneHit.test.ts\` holds that no horror's heaviest blow reaches \`BOSS.blowMost\` at the top of the ladder.
`);
    expect(mid.length).toBe(last.length);
  }, SLOW);
});
