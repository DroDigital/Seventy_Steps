/**
 * The balance table (playtest round 25, note 8: "no realistic balance bot"): a bot at the level a person
 * has when they reach each boss (balanceModel.ts: Echoes spent on the curve, star-stones set into the
 * sword-cane) fights it, attempting to roll from selected wind-ups, and cannot be killed. What it
 * reports is what this simulated fight cost: how long the boss took (at the bot's close-in pace), what it cost in health
 * against the health and Reagent a person has, and so how many lives' worth. `BALANCE_WRITE=1 npm run audit`
 * rewrites docs/BALANCE.md; the bounds hold the table to a fight worth having.
 */
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ZONES } from '../src/data/bossTuning';
import { getEntity } from '../src/data/registry';
import { BOSS_LEVEL_SCALING, LEVELS, REAGENT, SIM, SOFT_CAP } from '../src/data/tuning';
import { botFight, type BotFight } from './botHelpers';
import { bossDamageScale, bossHealthScale } from '../src/systems/bossScaling';
import { levelsOf } from '../src/systems/levels';
import { healthAt, levelsWorth, levelWorth, mightAt, staminaAt } from '../src/systems/levelWorth';
import { dosesAt, KILLED, standings, type Standing } from './balanceModel';

const FRAMES = 60 * 60 * 20; // twenty minutes (round 100: ten, before the horrors' health rose by half; Nyarlathotep and Yog-Sothoth were not finished in ten)
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

/** Absolute bounds, with explicit exceptions for fights whose measured pressure exceeds their tier. */
const BOUNDS = { seconds: [6, 800], lives: 3, colossusLives: 6, godLives: 3.4 } as const; // (round 100: the seconds' limit was 450 and a great fight's lives 1.5 before the horrors' health rose by half)
/** Each tier has a band so a fight is held to its kind as well as the absolute limits. */
const GREAT = new Set('mother_hydra father_dagon shub_niggurath bokrug nug rhan_tegoth yeb great_ones yig tsathoggua nyarlathotep hastur ghatanothoa cthulhu umr_at_tawil yog_sothoth azathoth'.split(' '));
// The stamina-aware bot keeps a roll in reserve and attacks less often; retain the pressure floors and cap the longer fights.
const BANDS = { named: { seconds: [14, 200], lives: [0.2, 2.4] }, god: { seconds: [35, 340], lives: [0.45, 3.4] } } as const; // (round 100: the upper limits were 90, 1.2, 170 and 1.5 before the horrors' health rose by half)
/**
 * Fights outside those tiers have fixed named bounds, including 'Umr's lower pressure with the bot avoiding the void.
 * They are limits on measured bot outcomes, not a promise that a person can finish within one inventory of healing.
 */
const WIDER: Partial<Record<string, { seconds?: readonly [number, number]; lives?: readonly [number, number] }>> = {
  // (Round 100, the horrors' health up by half: Brown Jenkin's exception is gone, the named band holds him; the upper limits below moved to what the bot now measures, a fifth or so over.)
  colossus_pyramids: { seconds: [14, 240] },
  daemon_pipers: { seconds: [14, 280], lives: [0.2, 2.6] },
  zkauba: { seconds: [14, 280] },
  // These are members of one encounter. seaBosses.test.ts bounds the combined fight;
  // the solo rows retain god-duration and upper-pressure limits with a member's floor.
  mother_hydra: { lives: [0.2, 1.5] },
  father_dagon: { lives: [0.2, 1.5] },
  ghatanothoa: { seconds: [35, 580] },
  nyarlathotep: { seconds: [35, 740], lives: [0.45, 4.5] },
  azathoth: { seconds: [90, 580], lives: [1.7, 6.4] }, // (2026-10-29) the hardest fight there is: it costs the bot more than any other horror (tested below), and takes longer than the lesser gods (round 100: 430 s and 3 lives before its health rose by half with the others'; 477 s and 5.3 lives now)
  shub_niggurath: { seconds: [35, 440] },
  yog_sothoth: { seconds: [35, 700], lives: [0.45, 3.8] },
  umr_at_tawil: { lives: [0.25, 1.5] },
  colour_out_of_space: { seconds: [14, 170] },
};
const bandOf = (id: string, tier: 'named' | 'god') => ({ ...BANDS[tier], ...WIDER[id] });
/**
 * Round 68, "all bosses remain demanding regardless of player level": the same fights again at the cap (every level bought, the cane set to
 * +5), where the horror has grown past the standing it is met at (systems/bossScaling.ts `overmatch`). None may cost a bot less than this,
 * nor be over in fewer seconds, whatever a person has farmed.
 */
const CAP = { named: { seconds: 10, lives: 0.1 }, god: { seconds: 30, lives: 0.4 }, reinforced: 5, starts: [6, 7, 8, 9, 10, 11, 12, 13, 14] } as const; // (round 71: nine starts, not three: 'Umr at-Tawil cost the same bot 0.28, 0.93 and 0.43 lives from three, and a floor held on three paths was a coin)
const CAP_LIVES_FLOOR: Partial<Record<string, number>> = { umr_at_tawil: 0.18, father_dagon: 0.2, mother_hydra: 0.2 };
const YOG_STANDING_MAX = 3.8; // (round 100: 2.5 before the horrors' health rose by half; 3.20 measured)
const YOG_CAP_MAX = 2.2;
const COLOUR_OPENING_MAX = 1.3;
/** At the cap a fight may cost at most this much (round 68: 1.25 times the tier bands' upper limits then, which round 100 does not widen with them). */
const CAP_CEILING = { named: 1.5, god: 1.875 } as const;
const AZATHOTH_CAP_MAX = 4.7; // (round 100: 2.6 before its health rose by half; 3.88 measured)
const CAP_LIVES_CEILING: Partial<Record<string, number>> = { yog_sothoth: YOG_CAP_MAX, azathoth: AZATHOTH_CAP_MAX, daemon_pipers: 2, nyarlathotep: 3.1 }; // (round 100: the Pipers' and Nyarlathotep's, which the tier's ceiling no longer holds at +50% health: 1.65 and 2.57 lives)
const BOUNDS_TEXT = `${BOUNDS.seconds[0]} to ${BOUNDS.seconds[1]} seconds`;
const AT_CAP_TEXT = `
## At the cap

The same bot, from ${CAP.starts.length} starts (${CAP.starts[0]} to ${CAP.starts[CAP.starts.length - 1]} metres off), with every level bought (${LEVELS.vigour.max} Vigour, ${LEVELS.endurance.max} Endurance, ${LEVELS.might.max} Might, which the soft caps make ${healthAt(LEVELS.vigour.max)} health, ${staminaAt(LEVELS.endurance.max)} stamina and blows of ${mightAt(LEVELS.might.max).toFixed(2)}) and the cane at +${CAP.reinforced}. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (\`overmatch\` in \`systems/bossScaling.ts\`, \`BOSS_OVERMATCH\`). A named horror still takes at least ${CAP.named.seconds} seconds and costs a bot ${CAP.named.lives} to ${CAP_CEILING.named} lives; a great fight ${CAP.god.seconds} and ${CAP.god.lives} to ${CAP_CEILING.god} lives, except 'Umr at-Tawil's ${CAP_LIVES_FLOOR.umr_at_tawil} life floor, Dagon and Hydra's ${CAP_LIVES_FLOOR.father_dagon} life floor per member, and the ceilings of Yog-Sothoth (${YOG_CAP_MAX}), the Daemon Pipers (${CAP_LIVES_CEILING.daemon_pipers}) and Nyarlathotep (${CAP_LIVES_CEILING.nyarlathotep}). Dagon and Hydra's combined encounter is additionally bounded in \`tests/seaBosses.test.ts\`.
`;
/** The Haunter is hurt only by lamplight (a person lures it to a lamp; the bot stands where it is). Azathoth was once exempt too, blind and unwounded, its fight a timer (until 2026-10-29). */
const EXEMPT = ['haunter_of_the_dark'];

const INTRO = `# The balance table

Written by \`tests/balance.test.ts\` (\`BALANCE_WRITE=1 npm run audit\`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (\`tests/balanceModel.ts\`). Round 60: the world is open, so
the bosses are met ring by ring as it opens about the start (the university; Arkham; the waking world beyond it; the realms down
the stair and through its gates; Beyond the Gate). In each ring its lesser foes give ${Math.round(KILLED * 100)}% of their Echoes in step with its named
horrors and colossi, met the weak first, each slain giving most of its own; its gods may be met in any order, so each is met
halfway through its ring with no god's Echoes in hand. The Echoes are spent on levels as a person builds (Vigour and Might most,
Endurance less), and the star-stones the bosses leave are set into the sword-cane. The bot closes to the edge of the body and
strikes when it can retain enough stamina for a roll, selects ${Math.round(SKILL * 100)}% of telegraphed blows for a dodge attempt, strikes down a servant or a phantom at
its elbow, takes the Alert's helm, keeps behind a monolith from a gaze that turns flesh to stone, and (round 58) drinks Laudanum
when the HUD calls for it, as a person is told to. It cannot be killed, and what it took is the tally. Each fight is the mean of
three, from ${STARTS.join(', ')} metres off (a bot's path through a fight is chaos), and a colossus is fought with the arena's middle pillars,
low walls and training dummy set aside: a body that wide finds no place to stand among them, as its own arena in the world has
nothing in its way.

- Bosses gain ${BOSS_LEVEL_SCALING.health * 100}% maximum health and ${BOSS_LEVEL_SCALING.damage * 100}% damage per player level, a level counted by what it is worth (round 71, the soft caps: ${SOFT_CAP.reduce((s, t) => `${s}, ${Math.round(t.worth * 100)}% from ${t.after + 1}`, `each attribute's levels count whole to ${SOFT_CAP[0].after}`)}: thirty are worth ${levelWorth(LEVELS.vigour.max)}, so ninety bought are ${levelsWorth({ vigour: 30, endurance: 30, might: 30 }).toFixed(1)}). Level one retains the authored stats;
  ordinary enemies, summons and spawning roots keep their existing stats. **Scaled health** is the boss's actual maximum in that run.
- **Seconds** is how long the boss took with this bot's choices; actual players' fight times will differ.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (${REAGENT.doses} doses of ${Math.round(REAGENT.heal * 100)}% at the start, a vial more as the horrors fall, to ${REAGENT.maxDoses}):
  1 is the equivalent of all of it. A selected dodge can fail to start or avoid damage, and a value above 1 exceeds the carried healing
  in this simulation; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. The Haunter of the Dark is not held
  to the bounds: it is hurt only by lamplight (a person lures it to a lamp). Azathoth is held to bounds of its own and must cost the bot more than
  any other horror (2026-10-29): its blows are rhythms over the whole court, which the bot reads badly, and its fight is the hardest there is.
- Dagon and Hydra share one encounter. Their individual rows are supplemental; \`tests/seaBosses.test.ts\` also checks both together at the expected standing, including combined time and damage against one healing inventory. Solo pressure floors are lower for these two members, while their upper limits remain in force.

`;
const NOTES = `
Bounds held by the test: each boss finishes within ${BOUNDS_TEXT}, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, ${BOUNDS.godLives}), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes ${BANDS.named.seconds.join(' to ')} seconds and costs ${BANDS.named.lives.join(' to ')} lives (the Colour may cost up to 1.5); one of the ${GREAT.size} great fights takes ${BANDS.god.seconds.join(' to ')} seconds and costs ${BANDS.god.lives.join(' to ')} lives. Named exceptions are ${Object.entries(WIDER).map(([id, b]) => `${id.replaceAll('_', ' ')}${b?.seconds ? ` ${b.seconds.join('–')} seconds` : ''}${b?.lives ? ` ${b.lives.join('–')} lives` : ''}`).join('; ')}. Yog-Sothoth is additionally capped at ${YOG_STANDING_MAX} lives at its expected standing.
`;

const OPENING_TEXT = `
## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (${Math.round(KILLED * 100)}% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at ${COLOUR_OPENING_MAX} lives.
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

/** The fights at a standing, one from each start: what they took and cost, on the mean. */
function fightAt(s: Standing, starts: readonly number[] = STARTS): Row {
  const w = WAIVED[s.id];
  const runs = starts.map((start) => botFight(s.id, FRAMES, undefined, { levels: s.levels, reinforced: s.reinforced, skill: SKILL, floor: true, smart: true, mind: true, waive: w?.waive, start }));
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
      const [bought, worth] = [levelsOf(r.levels), levelsWorth(r.levels)];
      const label = `${r.id} (player level ${bought + 1}, HP x${bossHealthScale(worth, 0).toFixed(2)}, damage x${bossDamageScale(worth).toFixed(2)})`;
      const colossus = (getEntity(r.id)!.assembly?.scale ?? 0) >= ZONES.height;
      if (!r.fell || r.seconds < BOUNDS.seconds[0] || r.seconds > BOUNDS.seconds[1]) bad.push(`${label}: ${r.fell ? r.seconds.toFixed(0) : 'not finished in ' + r.seconds.toFixed(0)} seconds`);
      const god = ['great_old_one', 'outer_god'].includes(getEntity(r.id)!.tier);
      if (r.pressure > (WIDER[r.id]?.lives?.[1] ?? (god ? BOUNDS.godLives : colossus ? BOUNDS.colossusLives : BOUNDS.lives))) bad.push(`${label}: ${r.pressure.toFixed(1)} lives`);
      if (r.deaths > 0) bad.push(`${label}: died ${r.deaths} times`);
      const band = bandOf(r.id, GREAT.has(r.id) ? 'god' : 'named'); // (the lesser Outer Gods, the Pipers, the Other Gods and the Ancient Ones, are fought as the named are)
      if (r.seconds < band.seconds[0] || r.seconds > band.seconds[1]) bad.push(`${label}: ${r.seconds.toFixed(0)} seconds, its tier's band is ${band.seconds.join(' to ')}`);
      const maxLives = r.id === 'colour_out_of_space' ? 1.5 : band.lives[1]; // its restored 30 hp/s healing makes this fight harder
      if (r.pressure < band.lives[0] || r.pressure > maxLives) bad.push(`${label}: ${r.pressure.toFixed(2)} lives, its tier's band is ${band.lives[0]} to ${maxLives}`);
    }
    expect(bad).toEqual([]);
  });

  it('bounds Yog-Sothoth pressure at its expected standing', () => {
    expect(rows.find((r) => r.id === 'yog_sothoth')!.pressure).toBeLessThanOrEqual(YOG_STANDING_MAX);
  });

  it('makes Azathoth the hardest fight there is (2026-10-29): it costs the bot more lives than any other horror, and takes it longer than any lesser god', () => {
    const azathoth = rows.find((r) => r.id === 'azathoth')!;
    const next = rows.filter((r) => r.id !== 'azathoth' && !EXEMPT.includes(r.id)).reduce((a, b) => (b.pressure > a.pressure ? b : a)); // (the Haunter, which the bot plays badly, is not measured)
    expect(azathoth.pressure, `${next.id} costs ${next.pressure.toFixed(2)} lives`).toBeGreaterThan(next.pressure);
    expect(azathoth.seconds).toBeGreaterThan(BANDS.god.seconds[1]);
  });

  it('makes its table', () => {
    mainTable = tableOf(rows);
    if (process.env.BALANCE_WRITE) writeFileSync('src/data/bossStanding.ts', standingFile(table));
    expect(rows.length).toBe(table.length);
  });
});

const atCap: Row[] = [];
/** Every standing again with all the levels bought and the cane at its best: the horror has grown past the level it is met at. */
const atCapOf = (s: Standing): Standing => {
  const levels = { vigour: LEVELS.vigour.max, endurance: LEVELS.endurance.max, might: LEVELS.might.max } as Standing['levels'];
  return { ...s, levels, hp: healthAt(levels.vigour), reinforced: CAP.reinforced };
};

describe('at the cap (round 68): every level bought, and the horrors still demanding', () => {
  const table = standings().map(atCapOf);

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void atCap.push(fightAt(s, CAP.starts)));

  it('bounds Yog-Sothoth pressure at the level cap', () => {
    expect(atCap.find((r) => r.id === 'yog_sothoth')!.pressure).toBeLessThanOrEqual(YOG_CAP_MAX);
  });

  it('leaves no horror a fight that costs nothing', () => {
    const bad: string[] = [];
    for (const r of atCap.filter((x) => !EXEMPT.includes(x.id))) {
      const tier = GREAT.has(r.id) ? 'god' : 'named';
      const band = CAP[tier];
      if (!r.fell) bad.push(`${r.id}: not finished in ${r.seconds.toFixed(0)} seconds at the cap`);
      else if (r.seconds < band.seconds) bad.push(`${r.id}: ${r.seconds.toFixed(0)} seconds at the cap, at least ${band.seconds}`);
      const floor = CAP_LIVES_FLOOR[r.id] ?? band.lives;
      const ceiling = CAP_LIVES_CEILING[r.id] ?? CAP_CEILING[tier];
      if (r.pressure < floor) bad.push(`${r.id}: ${r.pressure.toFixed(2)} lives at the cap, at least ${floor}`);
      if (r.pressure > ceiling) bad.push(`${r.id}: ${r.pressure.toFixed(2)} lives at the cap, above ${ceiling}`);
      if (r.deaths > 0) bad.push(`${r.id}: died ${r.deaths} times at the cap`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the opening (round 47): the first hours, at what they give', () => {
  const table = standings(OPENING);

  it.each(table.map((s) => [s.id, s] as const))('%s', (_id, s) => void opening.push(fightAt(s)));

  it('bounds the Colour pressure in the opening', () => {
    expect(opening.find((r) => r.id === 'colour_out_of_space')!.pressure).toBeLessThanOrEqual(COLOUR_OPENING_MAX);
  });

  it(`costs at most ${OPENING_LIVES} lives a horror, and writes both tables`, () => {
    const bad = opening.filter((r) => !EXEMPT.includes(r.id) && (!r.fell || r.pressure > (WIDER[r.id]?.lives?.[1] ?? OPENING_LIVES) || r.deaths > 0)).map((r) => `${r.id}: ${r.pressure.toFixed(2)} lives${r.fell ? '' : ', not finished'}`);
    if (process.env.BALANCE_WRITE) writeFileSync('docs/BALANCE.md', `${INTRO}\n${mainTable}\n${NOTES}${AT_CAP_TEXT}\n${tableOf(atCap)}\n${OPENING_TEXT}\n${tableOf(opening)}\n`);
    expect(bad).toEqual([]);
  });
});
