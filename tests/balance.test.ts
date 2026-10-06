/**
 * The balance table (playtest round 25, note 8: "no realistic balance bot"): a bot at the level a person
 * has when they reach each boss (balanceModel.ts: Echoes spent on the curve, star-stones set into the
 * sword-cane) fights it, reading the wind-ups and rolling away from most, and cannot be killed. What it
 * reports is what a person would have had to bear: how long the boss took (at the bot's steady pace, close
 * in and striking, which is more than a person does and less than a good one), what it cost in health
 * against the health and Reagent a person has, and so how many lives' worth. `BALANCE_WRITE=1 npm run audit`
 * rewrites docs/BALANCE.md; the bounds hold the table to a fight worth having.
 */
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ZONES } from '../src/data/bossTuning';
import { getEntity } from '../src/data/registry';
import { REAGENT, SIM } from '../src/data/tuning';
import { botFight, type BotFight } from './botHelpers';
import { KILLED, standings, type Standing } from './balanceModel';

const FRAMES = 60 * 60 * 10; // ten minutes
const SKILL = 0.55;
/** What the bot plays badly, and is let off: the gaze that turns flesh to stone (it is in sight of it for about half of a fight at best, so its seconds are scaled by the share in view), and the roots (which a person cuts down first, and so spends some seconds more). */
const WAIVED: Record<string, { waive: readonly ('petrify' | 'roots')[]; scale: number; add: number }> = {
  ghatanothoa: { waive: ['petrify'], scale: 1 / 0.56, add: 0 },
  shub_niggurath: { waive: ['roots'], scale: 1, add: 40 },
};

interface Row extends Standing, Pick<BotFight, 'dealt' | 'taken' | 'fell' | 'deaths'> {
  seconds: number;
  pressure: number; // damage taken, in lives: its health and the Reagent a person carries
}

/** What the table may not hold: bounds for a fight worth having (not over in seconds, not a slog, not costing more lives than a person carries Reagent for). */
const BOUNDS = { seconds: [6, 260], lives: 3, colossusLives: 6 } as const;
const BOUNDS_TEXT = '6 to 260 seconds';
/** Azathoth is blind and cannot be wounded (its fight is outlasting the piping; what it costs the bot is the noise the bot makes), and the Haunter is hurt only by lamplight (a person lures it to a lamp; the bot stands where it is). */
const EXEMPT = ['azathoth', 'haunter_of_the_dark'];

const INTRO = `# The balance table

Written by \`tests/balance.test.ts\` (\`BALANCE_WRITE=1 npm run audit\`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (\`tests/balanceModel.ts\`): the bosses are met in order of
their health, the world's lesser foes give ${Math.round(KILLED * 100)}% of their Echoes in step with them and each boss slain most of its
own; the Echoes are spent on levels as a person builds (Vigour and Might most, Endurance less), and the star-stones the
bosses leave are set into the sword-cane. The bot closes to the edge of the body and strikes without pause, reads the
wind-up of every blow and rolls from ${Math.round(SKILL * 100)}% of them, takes the Alert's helm, and keeps behind a monolith from a gaze that
turns flesh to stone. It cannot be killed, and what it took is the tally.

- **Seconds** is how long the boss took at that steady pace. A person strikes for perhaps a third of a fight, so their fight
  is about three times as long.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry (${REAGENT.doses} doses of ${Math.round(REAGENT.heal * 100)}%):
  1 is a fight that spends all of it, for a bot that rolls from ${Math.round(SKILL * 100)}% of blows.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), and Shub-Niggurath with
  its roots down (forty seconds more, to cut them): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).

`;
const NOTES = `
Bounds held by the test: each boss finishes within ${BOUNDS_TEXT}, and costs at most 3 lives (a colossus, 6), and the bot does not die.
`;

const OPENING_TEXT = `
## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (${Math.round(KILLED * 100)}% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.
`;

const rows: Row[] = [];
const opening: Row[] = [];
let mainTable = '';
/** The opening (round 47): the realms about the first Elder Sign, as a new player meets them, with only what those realms give. */
const OPENING = ['hub', 'arkham'];
const OPENING_LIVES = 1.5; // a horror of the first hours costs at most this (a person carries Reagent for one, and learns it over a few tries)

/** One fight at a standing: what it took and cost. */
function fightAt(s: Standing): Row {
  const w = WAIVED[s.id];
  const r = botFight(s.id, FRAMES, undefined, { levels: s.levels, reinforced: s.reinforced, skill: SKILL, floor: true, smart: true, waive: w?.waive });
  expect(r.bad).toEqual([]);
  return { ...s, dealt: r.dealt, taken: r.taken, fell: r.fell, deaths: r.deaths, seconds: (r.frames / SIM.hz) * (w?.scale ?? 1) + (w?.add ?? 0), pressure: r.taken / (s.hp * (1 + REAGENT.doses * REAGENT.heal)) };
}

const tableOf = (list: Row[]): string => {
  const lines = [...list].sort((a, b) => a.rank - b.rank).map((r) => `| ${r.rank + 1} | ${getEntity(r.id)!.name} | ${r.levels.vigour}/${r.levels.endurance}/${r.levels.might} | ${r.reinforced} | ${getEntity(r.id)!.stats.hp} | ${r.fell ? r.seconds.toFixed(0) : '>' + r.seconds.toFixed(0)} | ${r.taken.toFixed(0)} | ${r.hp} | ${r.pressure.toFixed(2)} | ${r.deaths} |`);
  return ['| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Lives | Deaths |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...lines].join('\n');
};

describe('the balance table (round 25)', () => {
  const table = standings();

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void rows.push(fightAt(s)));

  it('holds every boss to a fight worth having', () => {
    const bad: string[] = [];
    for (const r of rows.filter((x) => !EXEMPT.includes(x.id))) {
      const colossus = (getEntity(r.id)!.assembly?.scale ?? 0) >= ZONES.height;
      if (!r.fell || r.seconds < BOUNDS.seconds[0] || r.seconds > BOUNDS.seconds[1]) bad.push(`${r.id}: ${r.fell ? r.seconds.toFixed(0) : 'not finished in ' + r.seconds.toFixed(0)} seconds`);
      if (r.pressure > (colossus ? BOUNDS.colossusLives : BOUNDS.lives)) bad.push(`${r.id}: ${r.pressure.toFixed(1)} lives`);
      if (r.deaths > 0) bad.push(`${r.id}: died ${r.deaths} times`);
    }
    expect(bad).toEqual([]);
  });

  it('makes its table', () => {
    mainTable = tableOf(rows);
    expect(rows.length).toBe(table.length);
  });
});

describe('the opening (round 47): the first hours, at what they give', () => {
  const table = standings(OPENING);

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void opening.push(fightAt(s)));

  it(`costs at most ${OPENING_LIVES} lives a horror, and writes both tables`, () => {
    const bad = opening.filter((r) => !EXEMPT.includes(r.id) && (!r.fell || r.pressure > OPENING_LIVES || r.deaths > 0)).map((r) => `${r.id}: ${r.pressure.toFixed(2)} lives${r.fell ? '' : ', not finished'}`);
    if (process.env.BALANCE_WRITE) writeFileSync('docs/BALANCE.md', `${INTRO}\n${mainTable}\n${NOTES}${OPENING_TEXT}\n${tableOf(opening)}\n`);
    expect(bad).toEqual([]);
  });
});
