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
import { BOSS_LEVEL_SCALING, REAGENT, SIM } from '../src/data/tuning';
import { botFight, type BotFight } from './botHelpers';
import { bossDamageScale, bossHealthScale } from '../src/systems/bossScaling';
import { levelsOf } from '../src/systems/levels';
import { dosesAt, KILLED, standings, type Standing } from './balanceModel';

const FRAMES = 60 * 60 * 10; // ten minutes
const SKILL = 0.55;
/** What the bot plays badly, and is let off: the gaze that turns flesh to stone (it is in sight of it for about half of a fight at best, so its seconds are scaled by the share in view), and the roots (which a person cuts down first, and so spends some seconds more). */
const WAIVED: Record<string, { waive: readonly ('petrify' | 'roots' | 'void')[]; scale: number; add: number }> = {
  ghatanothoa: { waive: ['petrify'], scale: 1 / 0.56, add: 0 },
  shub_niggurath: { waive: ['roots'], scale: 1, add: 40 },
  great_ones: { waive: ['void'], scale: 1, add: 0 }, // round 60: a person with insight keeps to the hidden platforms; the bot stood in the void, most of what those fights cost it
  umr_at_tawil: { waive: ['void'], scale: 1, add: 0 },
};
/** Where the bot starts, metres from the boss (round 60): a bot's path through a fight is chaos, a blow taken or slipped sending it another way, so each fight is the mean of three. */
const STARTS = [7, 10, 13];
const TOTAL = standings().length; // the horrors there are, for the Reagent carried

interface Row extends Standing, Pick<BotFight, 'health' | 'dealt' | 'taken' | 'fell' | 'deaths'> {
  seconds: number;
  doses: number; // the Reagent a person carries there (balanceModel.ts `dosesAt`)
  pressure: number; // damage taken, in lives: its health and the Reagent a person carries
}

/** What the table may not hold: bounds for a fight worth having (not over in seconds, not a slog, not costing more lives than a person carries Reagent for). */
const BOUNDS = { seconds: [6, 260], lives: 3, colossusLives: 6, godLives: 1.5 } as const; // (round 60: a god spends at most the Reagent carried: Father Dagon was "way too overpowered", and R'lyeh's too hard at level 26)
/**
 * Round 61, "no boss insurmountable, none excessively easy": each tier's own band as well, so a fight is held to its kind and not only to the
 * widest bounds. A named horror is over in 7 to 40 seconds and always costs something (a bot that slips most blows still bleeds a little);
 * a god of 2500 health or more takes 18 to 90 (a long tail is for the gaze and the roots, waived and added above) and costs between a third of the Reagent carried
 * and one and a half times it after level scaling. Seconds are the bot's, steady and close in: a person's are about three times as long.
 */
/**
 * Round 68, "restore appropriate difficulty across all levels, even on normal": the bands are raised with the numbers they hold, and a god
 * is told by name, not by its health (the health is no longer a line between the great fights and the rest). A named horror is over in 14 to 50
 * seconds (a person's: 40 to 150) and costs a bot between a twentieth of a life and one and a fifth; a great fight takes 35 to 100 and
 * costs between a third of a life and one and a third, climbing with the rank (`RISE`).
 */
const GREAT = new Set('mother_hydra father_dagon shub_niggurath bokrug nug rhan_tegoth yeb great_ones yig tsathoggua nyarlathotep hastur ghatanothoa cthulhu umr_at_tawil yog_sothoth'.split(' '));
const BANDS = { named: { seconds: [14, 50], lives: [0.05, 1.2] }, god: { seconds: [35, 100], lives: [0.3, 1.5] } } as const;
const BOUNDS_TEXT = '6 to 260 seconds';
/** Azathoth is blind and cannot be wounded (its fight is outlasting the piping; what it costs the bot is the noise the bot makes), and the Haunter is hurt only by lamplight (a person lures it to a lamp; the bot stands where it is). */
const EXEMPT = ['azathoth', 'haunter_of_the_dark'];

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

- Bosses gain ${BOSS_LEVEL_SCALING.health * 100}% maximum health and ${BOSS_LEVEL_SCALING.damage * 100}% damage per purchased player level. Level one retains the authored stats;
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

const rows: Row[] = [];
const opening: Row[] = [];
let mainTable = '';
/** The opening (round 47): the realms about the first Elder Sign, as a new player meets them, with only what those realms give. */
const OPENING = ['hub', 'arkham'];
const OPENING_LIVES = 1.5; // a horror of the first hours costs at most this (a person carries Reagent for one, and learns it over a few tries)

/** The fights at a standing, one from each start: what they took and cost, on the mean. */
function fightAt(s: Standing): Row {
  const w = WAIVED[s.id];
  const runs = STARTS.map((start) => botFight(s.id, FRAMES, undefined, { levels: s.levels, reinforced: s.reinforced, skill: SKILL, floor: true, smart: true, mind: true, waive: w?.waive, start }));
  for (const r of runs) expect(r.bad).toEqual([]);
  const mean = (k: 'dealt' | 'taken' | 'frames'): number => runs.reduce((n, r) => n + r[k], 0) / runs.length;
  const taken = mean('taken');
  return { ...s, health: runs[0].health, dealt: mean('dealt'), taken, fell: runs.every((r) => r.fell), deaths: runs.reduce((n, r) => n + r.deaths, 0), seconds: (mean('frames') / SIM.hz) * (w?.scale ?? 1) + (w?.add ?? 0), doses: dosesAt(s.rank, TOTAL), pressure: taken / (s.hp * (1 + dosesAt(s.rank, TOTAL) * REAGENT.heal)) };
}

const tableOf = (list: Row[]): string => {
  const lines = [...list].sort((a, b) => a.rank - b.rank).map((r) => `| ${r.rank + 1} | ${getEntity(r.id)!.name} | ${r.levels.vigour}/${r.levels.endurance}/${r.levels.might} | ${r.reinforced} | ${r.health} | ${r.fell ? r.seconds.toFixed(0) : '>' + r.seconds.toFixed(0)} | ${r.taken.toFixed(0)} | ${r.hp} | ${r.doses} | ${r.pressure.toFixed(2)} | ${r.deaths} |`);
  return ['| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...lines].join('\n');
};

describe('the balance table (round 25)', () => {
  const table = standings();

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void rows.push(fightAt(s)));

  it('holds every boss to a fight worth having', () => {
    const bad: string[] = [];
    for (const r of rows.filter((x) => !EXEMPT.includes(x.id))) {
      const bought = levelsOf(r.levels);
      const label = `${r.id} (player level ${bought + 1}, HP x${bossHealthScale(bought, 0).toFixed(2)}, damage x${bossDamageScale(bought).toFixed(2)})`;
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
