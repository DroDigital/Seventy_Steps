/**
 * What a person has when they reach each boss (playtest round 25; the balance bot of balance.test.ts). Round 60 (a
 * playthrough came to R'lyeh at level 26, where this model, which met the bosses in order of their health, had Cthulhu
 * met at 44): the world is open, so the bosses are met ring by ring as it opens about the start (`RINGS`). In each ring
 * its lesser foes give their Echoes in step with its named horrors and colossi, met the weak first, and each slain
 * gives most of its own. Its gods (the Great Old Ones and the Outer Gods) may be met in any order, so each is met
 * halfway through its ring, and no god's Echoes are ever in hand: a person may leave every one of them for later. The
 * Echoes go on levels as a person builds: Vigour and Might most, Endurance less. Star-stones left by the bosses slain
 * are set into the sword-cane.
 */

import { ENTITIES, getEntity } from '../src/data/registry';
import type { EntityDef } from '../src/data/schema';
import { REGIONS } from '../src/data/regions';
import { REINFORCE, LEVELS, PLAYER, type LevelId } from '../src/data/tuning';
import { stonesOf } from '../src/systems/arms';
import { levelCost } from '../src/systems/levels';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';

export const KILLED = 0.6; // the share of a ring's lesser foes a person has killed by the time they leave it
const KEPT = 0.85; // the share of a boss's Echoes that are kept (some are lost to a death on the way)
const BUILD: readonly LevelId[] = ['vigour', 'might', 'vigour', 'endurance', 'might'];

export interface Standing {
  id: string;
  rank: number; // among the bosses, from 0
  echoes: number;
  levels: Record<LevelId, number>;
  hp: number; // the investigator's most health at these levels
  stones: number; // star-stones in hand
  reinforced: number; // levels set into the sword-cane
}

const bountyOf = (id: string): number => ENTITIES.find((e) => e.id === id)?.drops.echoes ?? 0;

/**
 * How many lesser foes each region had before round 61 raised its density and set a guard about its points of interest. The model
 * credits a person with these and no more (a mean bounty from the foes there are): the extra foes are the world's added challenge
 * and the secrets' loot, a margin over the standing the bots fight at, not a fresh round of levels the bosses were never measured
 * at (docs/DECISIONS.md, round 61).
 */
const CREDITED: Record<string, number> = { hub: 100, arkham: 114, dunwich: 92, innsmouth: 105, providence: 129, vermont: 82, mountains: 69, pnakotus: 80, kn_yan: 88, dreamlands: 241, rlyeh: 80, yuggoth: 76, beyond: 74 };

/** The world's lesser foes (the bosses aside) in `regions` (all of them by default): how many, and every Echo they carry, as the model credits them. */
export function lesserFoes(regions?: readonly string[]): { count: number; echoes: number } {
  const w = worldLayout();
  let [count, echoes] = [0, 0];
  for (const r of REGIONS.filter((x) => !regions || regions.includes(x.id))) {
    const spawns = [...[...regionPlan(r).spawns.values()].flat(), ...w.spawns.filter((x) => x.region === r.id)].filter((s) => !s.id.startsWith('boss:') && !s.id.startsWith('poi:'));
    const credited = Math.min(spawns.length, CREDITED[r.id] ?? spawns.length);
    const mean = spawns.reduce((n, s) => n + bountyOf(s.entity), 0) / Math.max(1, spawns.length);
    [count, echoes] = [count + credited, echoes + credited * mean];
  }
  return { count, echoes };
}

/** Every Echo the world's lesser foes carry (the bosses' own are the bosses'), in `regions` (all of them by default). */
export const lesserEchoes = (regions?: readonly string[]): number => lesserFoes(regions).echoes;

/** The levels `echoes` buy, as the build goes. */
export function buy(echoes: number): Record<LevelId, number> {
  const levels: Record<LevelId, number> = { vigour: 0, endurance: 0, might: 0 };
  let bought = 0;
  for (let i = 0; ; i++) {
    const id = BUILD[i % BUILD.length];
    if (levels[id] >= LEVELS[id].max) {
      if ((Object.keys(levels) as LevelId[]).every((k) => levels[k] >= LEVELS[k].max)) break;
      continue;
    }
    const cost = levelCost(bought);
    if (echoes < cost) break;
    echoes -= cost;
    levels[id]++;
    bought++;
  }
  return levels;
}

/** Levels of reinforcement `stones` star-stones set in. */
export function reinforceWith(stones: number): number {
  let level = 0;
  while (level < REINFORCE.max && stones >= REINFORCE.cost[level]) stones -= REINFORCE.cost[level++];
  return level;
}

/** The realms in the rings a person meets them in (round 60). */
export const RINGS: readonly (readonly string[])[] = [
  ['hub'], // the university, about the first Elder Sign
  ['arkham'], // the main line's first realm
  ['vermont', 'providence', 'dunwich', 'innsmouth'], // the waking world beyond, open from the start
  ['dreamlands', 'rlyeh', 'yuggoth', 'kn_yan', 'mountains', 'pnakotus'], // down the stair and through the waking world's gates
  ['beyond'], // past Kadath's seals
];

/** A Great Old One or an Outer God: met in any order, its Echoes never counted toward another's standing. */
export const isGod = (id: string): boolean => ['great_old_one', 'outer_god'].includes(getEntity(id)?.tier ?? '');

const standingOf = (b: EntityDef, rank: number, echoes: number, stones: number): Standing => {
  const levels = buy(Math.round(echoes));
  return { id: b.id, rank, echoes: Math.round(echoes), levels, hp: PLAYER.hp + levels.vigour * (LEVELS.vigour.hp ?? 0), stones, reinforced: reinforceWith(stones) };
};

/**
 * The standing of the investigator at each scripted boss, ring by ring. With `regions`, only those realms' bosses and
 * lesser foes count (round 47: the opening, Arkham and the hub about the first Elder Sign, as a new player meets them,
 * with nothing yet from farther realms).
 */
export function standings(regions?: readonly string[]): Standing[] {
  const rings = RINGS.map((r) => r.filter((x) => !regions || regions.includes(x))).filter((r) => r.length);
  const ringOf = (e: EntityDef): number => rings.findIndex((r) => e.regions.some((x) => r.includes(x)));
  const out: Standing[] = [];
  let [echoes, stones] = [0, 0]; // what the rings behind gave
  rings.forEach((_, k) => {
    const bosses = ENTITIES.filter((e) => e.bossScript && ringOf(e) === k).sort((a, b) => a.stats.hp - b.stats.hp || a.id.localeCompare(b.id));
    const [minor, gods] = [bosses.filter((b) => !isGod(b.id)), bosses.filter((b) => isGod(b.id))];
    const lesser = KILLED * lesserEchoes(rings[k]);
    let [slain, left] = [0, 0];
    minor.forEach((b, i) => {
      out.push(standingOf(b, out.length, echoes + lesser * ((i + 0.5) / minor.length) + KEPT * slain, stones + left));
      [slain, left] = [slain + bountyOf(b.id), left + stonesOf(b.id)];
    });
    for (const b of gods) out.push(standingOf(b, out.length, echoes + lesser / 2 + (KEPT * slain) / 2, stones + Math.floor(left / 2)));
    [echoes, stones] = [echoes + lesser + KEPT * slain, stones + left];
  });
  return out;
}
