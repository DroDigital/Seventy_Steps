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
import { BOSS_LEVEL_SCALING, LEVELS, REAGENT, SOFT_CAP } from '../src/data/tuning';
import { bossDamageScale, bossHealthScale } from '../src/systems/bossScaling';
import { levelsOf } from '../src/systems/levels';
import { healthAt, levelsWorth, levelWorth, mightAt, staminaAt } from '../src/systems/levelWorth';
import { BANDS, CAP, EXEMPT, GREAT } from './balanceBands';
import { atCapOf, fightAt, SKILL, STARTS, tableOf, type Row } from './balanceFight';
import { KILLED, standings, type Standing } from './balanceModel';

/** What the table may not hold: bounds for a fight worth having (not over in seconds, not a slog, not costing more lives than a person carries Reagent for). */
const BOUNDS = { seconds: [6, 260], lives: 3, colossusLives: 6, godLives: 1.5 } as const; // (round 60: a god spends at most the Reagent carried: Father Dagon was "way too overpowered", and R'lyeh's too hard at level 26)
const BOUNDS_TEXT = '6 to 260 seconds';
const AT_CAP_TEXT = `
## At the cap

The same bot, from ${CAP.starts.length} starts (${CAP.starts[0]} to ${CAP.starts[CAP.starts.length - 1]} metres off), with every level bought (${LEVELS.vigour.max} Vigour, ${LEVELS.endurance.max} Endurance, ${LEVELS.might.max} Might, which the soft caps make ${healthAt(LEVELS.vigour.max)} health, ${staminaAt(LEVELS.endurance.max)} stamina and blows of ${mightAt(LEVELS.might.max).toFixed(2)}) and the cane at +${CAP.reinforced}. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (\`overmatch\` in \`systems/bossScaling.ts\`, \`BOSS_OVERMATCH\`). A named horror still takes at least ${CAP.named.seconds} seconds and costs a bot ${CAP.named.lives} of a life; a great fight ${CAP.god.seconds} and ${CAP.god.lives}.
`;
const INTRO = `# The balance table

Written by \`tests/balance.test.ts\` (\`BALANCE_WRITE=1 npm run audit\`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (\`tests/balanceModel.ts\`). Round 60: the world is open, so
the bosses are met ring by ring as it opens about the start (the university; Arkham; the waking world beyond it; the realms down
the stair and through its gates; Beyond the Gate). In each ring its lesser foes give ${Math.round(KILLED * 100)}% of their Echoes in step with its named
horrors and colossi, met the weak first, each slain giving most of its own; its gods may be met in any order, so each is met
halfway through its ring with no god's Echoes in hand. The Echoes are spent on levels as a person builds (Vigour and Might most,
Endurance less), and the star-stones the bosses leave are set into the sword-cane. The bot closes to the edge of the body and
strikes without pause, reads the wind-up of every blow and rolls from ${Math.round(SKILL * 100)}% of them, strikes down a servant or a phantom at
its elbow, takes the Alert's helm, keeps behind a monolith from a gaze that turns flesh to stone, and (round 58) drinks Laudanum
when the HUD calls for it, as a person is told to. It cannot be killed, and what it took is the tally. Each fight is the mean of
three, from ${STARTS.join(', ')} metres off (a bot's path through a fight is chaos), and a colossus is fought with the arena's middle pillars,
low walls and training dummy set aside: a body that wide finds no place to stand among them, as its own arena in the world has
nothing in its way.

- Bosses gain ${BOSS_LEVEL_SCALING.health * 100}% maximum health and ${BOSS_LEVEL_SCALING.damage * 100}% damage per player level, a level counted by what it is worth (round 71, the soft caps: ${SOFT_CAP.reduce((s, t) => `${s}, ${Math.round(t.worth * 100)}% from ${t.after + 1}`, `each attribute's levels count whole to ${SOFT_CAP[0].after}`)}: thirty are worth ${levelWorth(LEVELS.vigour.max)}, so ninety bought are ${levelsWorth({ vigour: 30, endurance: 30, might: 30 }).toFixed(1)}). Level one retains the authored stats;
  ordinary enemies, summons and spawning roots keep their existing stats. **Scaled health** is the boss's actual maximum in that run.
- **Seconds** is how long the boss took at that steady pace. A person strikes for perhaps a third of a fight, so their fight
  is about three times as long.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (${REAGENT.doses} doses of ${Math.round(REAGENT.heal * 100)}% at the start, a vial more as the horrors fall, to ${REAGENT.maxDoses}):
  1 is a fight that spends all of it, for a bot that rolls from ${Math.round(SKILL * 100)}% of blows.
  A value above 1 exceeds the carried healing at this bot's dodge rate; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).

`;
const NOTES = `
Bounds held by the test: each boss finishes within ${BOUNDS_TEXT}, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, ${BOUNDS.godLives}), and the bot does not die.
Each tier has its band (round 61, raised in round 68): a named horror takes ${BANDS.named.seconds.join(' to ')} seconds and costs ${BANDS.named.lives.join(' to ')} lives; one of the ${GREAT.size} great fights (a Great Old One or an Outer God of the sort that is a fight of its own) takes ${BANDS.god.seconds.join(' to ')} seconds and costs ${BANDS.god.lives.join(' to ')} lives.
`;

const OPENING_TEXT = `
## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (${Math.round(KILLED * 100)}% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.
`;

/** data/bossStanding.ts: the Vigour and Might each horror is met at (round 68), for systems/bossScaling.ts. */
const standingFile = (list: readonly Standing[]): string => `/**
 * What a person has when they meet each horror (round 68; written by \`BALANCE_WRITE=1 npm run audit\`, tests/balance.test.ts, from the
 * balance model's standings, tests/balanceModel.ts, and held fresh by tests/bossStanding.test.ts): its Vigour and Might levels. The
 * horror is made to be met there. Past it, the more the investigator's health and blows have grown, the more the horror's
 * blows and health grow to meet them (systems/bossScaling.ts \`overmatch\`), so that one that has farmed levels still has a fight to fight.
 */
export const BOSS_STANDING: Readonly<Record<string, readonly [vigour: number, might: number]>> = {
${[...list].sort((a, b) => a.rank - b.rank).map((s) => `  ${s.id}: [${s.levels.vigour}, ${s.levels.might}],`).join('\n')}
};
`;

const rows: Row[] = [];
const opening: Row[] = [];
let mainTable = '';
/** The opening (round 47): the realms about the first Elder Sign, as a new player meets them, with only what those realms give. */
const OPENING = ['hub', 'arkham'];
const OPENING_LIVES = 1.5; // a horror of the first hours costs at most this (a person carries Reagent for one, and learns it over a few tries)

describe('the balance table (round 25)', () => {
  const table = standings();

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void rows.push(fightAt(s)));

  it('holds every boss to a fight worth having', () => {
    const bad: string[] = [];
    for (const r of rows.filter((x) => !EXEMPT.includes(x.id))) {
      const [bought, worth] = [levelsOf(r.levels), levelsWorth(r.levels)];
      const label = `${r.id} (player level ${bought + 1}, HP x${bossHealthScale(worth, 0).toFixed(2)}, damage x${bossDamageScale(worth).toFixed(2)})`;
      const colossus = (getEntity(r.id)!.assembly?.scale ?? 0) >= ZONES.height;
      if (!r.fell || r.seconds < BOUNDS.seconds[0] || r.seconds > BOUNDS.seconds[1]) bad.push(`${label}: ${r.fell ? r.seconds.toFixed(0) : 'not finished in ' + r.seconds.toFixed(0)} seconds`);
      const god = ['great_old_one', 'outer_god'].includes(getEntity(r.id)!.tier);
      if (r.pressure > (god ? BOUNDS.godLives : colossus ? BOUNDS.colossusLives : BOUNDS.lives)) bad.push(`${label}: ${r.pressure.toFixed(1)} lives`);
      if (r.deaths > 0) bad.push(`${label}: died ${r.deaths} times`);
      const band = BANDS[GREAT.has(r.id) ? 'god' : 'named']; // (the lesser Outer Gods, the Pipers, the Other Gods and the Ancient Ones, are fought as the named are)
      if (r.seconds < band.seconds[0] || r.seconds > band.seconds[1]) bad.push(`${label}: ${r.seconds.toFixed(0)} seconds, its tier's band is ${band.seconds.join(' to ')}`);
      if (r.pressure < band.lives[0] || r.pressure > band.lives[1]) bad.push(`${label}: ${r.pressure.toFixed(2)} lives, its tier's band is ${band.lives.join(' to ')}`);
    }
    expect(bad).toEqual([]);
  });

  it('makes its table', () => {
    mainTable = tableOf(rows);
    if (process.env.BALANCE_WRITE) writeFileSync('src/data/bossStanding.ts', standingFile(table));
    expect(rows.length).toBe(table.length);
  });
});

const atCap: Row[] = [];
describe('at the cap (round 68): every level bought, and the horrors still demanding', () => {
  const table = standings().map(atCapOf);

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void atCap.push(fightAt(s, CAP.starts)));

  it('leaves no horror a fight that costs nothing', () => {
    const bad: string[] = [];
    for (const r of atCap.filter((x) => !EXEMPT.includes(x.id))) {
      const band = GREAT.has(r.id) ? CAP.god : CAP.named;
      if (!r.fell) bad.push(`${r.id}: not finished in ${r.seconds.toFixed(0)} seconds at the cap`);
      else if (r.seconds < band.seconds) bad.push(`${r.id}: ${r.seconds.toFixed(0)} seconds at the cap, at least ${band.seconds}`);
      if (r.pressure < band.lives) bad.push(`${r.id}: ${r.pressure.toFixed(2)} lives at the cap, at least ${band.lives}`);
      if (r.pressure > (GREAT.has(r.id) ? BANDS.god.lives[1] : BANDS.named.lives[1]) * 1.25) bad.push(`${r.id}: ${r.pressure.toFixed(2)} lives at the cap, more than a person carries`);
      if (r.deaths > 0) bad.push(`${r.id}: died ${r.deaths} times at the cap`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the opening (round 47): the first hours, at what they give', () => {
  const table = standings(OPENING);

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void opening.push(fightAt(s)));

  it(`costs at most ${OPENING_LIVES} lives a horror, and writes both tables`, () => {
    const bad = opening.filter((r) => !EXEMPT.includes(r.id) && (!r.fell || r.pressure > OPENING_LIVES || r.deaths > 0)).map((r) => `${r.id}: ${r.pressure.toFixed(2)} lives${r.fell ? '' : ', not finished'}`);
    if (process.env.BALANCE_WRITE) writeFileSync('docs/BALANCE.md', `${INTRO}\n${mainTable}\n${NOTES}${AT_CAP_TEXT}\n${tableOf(atCap)}\n${OPENING_TEXT}\n${tableOf(opening)}\n`);
    expect(bad).toEqual([]);
  });
});
