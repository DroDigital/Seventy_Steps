/**
 * Arms (playtest round 4): the weapons the investigator owns and the one in hand. Taking one up
 * gives the investigator its chains in place of the last one's (data/weapons.ts). A weapon lies in
 * a house of the dream until found; picking it up makes it theirs (insight.ts reads it like a
 * tome). Round 12: a boss slain for good leaves star-stones (the five-pointed greenish soapstones
 * of At the Mountains of Madness), and resting at an Elder Sign sets them into a weapon, each level
 * adding to its blows (the only growth was Might's, so a Great Old One took hundreds). Pure.
 */

import type { Entity } from '../core/ecs';
import { REINFORCE, STAR_STONES } from '../data/tuning';
import { getEntity } from '../data/registry';
import { armedMoves, isWeapon, WEAPON_IDS, WEAPONS, type WeaponId } from '../data/weapons';
import type { Game } from './components';
import { markNew } from './finds';

/** Puts weapon `id` in the investigator's hand; false when it is not theirs. */
export function equip(g: Game, id: string): boolean {
  if (!isWeapon(id) || !g.player.arms.includes(id)) return false;
  g.player.weapon = id;
  g.ecs.c.actor.get(g.player.id)!.moves = armedMoves(id);
  return true;
}

/**
 * A weapon found: it is theirs now, to take up from the card that says so or from the pause menu (round 60: it was picked up by
 * walking over it, with a line that faded, and many did not know they had it or where to take it up). `from`: who gave it, if anyone.
 */
export function takeUp(g: Game, id: string, from?: string): void {
  if (!isWeapon(id) || g.player.arms.includes(id)) return;
  g.player.arms.push(id);
  markNew(g, 'weapon', id);
  g.events.emit('Notice', { text: `${WEAPONS[id].name.toUpperCase()} · A NEW WEAPON · TAKE IT UP FROM {pause} · ARMS` }); // the HUD names the button
  g.events.emit('Found', { kind: 'weapon', id, from });
}

/** The share a weapon reinforced `level` times adds to its blows: 1 at none. */
export const edgeAt = (level: number): number => 1 + REINFORCE.damage * level;

/** What reinforcement adds to a melee blow from `attacker` (1 for anyone but the investigator). */
export const edge = (g: Pick<Game, 'player'>, attacker: Entity): number =>
  attacker === g.player.id ? edgeAt(g.player.reinforced[g.player.weapon]) : 1;

/** Star-stones the next level of weapon `id` costs; undefined once it is fully reinforced. */
export const reinforceCost = (g: Pick<Game, 'player'>, id: WeaponId): number | undefined => REINFORCE.cost[g.player.reinforced[id]];

export function canReinforce(g: Pick<Game, 'player'>, id: WeaponId): boolean {
  const cost = reinforceCost(g, id);
  return g.player.arms.includes(id) && cost !== undefined && g.player.stones >= cost;
}

/** Sets star-stones into weapon `id` for one more level; false when it is not theirs, is at the most, or they are short. */
export function reinforce(g: Game, id: WeaponId): boolean {
  if (!canReinforce(g, id)) return false;
  g.player.stones -= reinforceCost(g, id)!;
  g.player.reinforced[id]++;
  return true;
}

/**
 * Levels of reinforcement that could be moved from weapon `from` into weapon `to` now: what `from` has set in, as much as
 * `to` has room for. Both must be theirs. Nothing is lost or made in the move (round 61: but it is paid for, `moveCost`), so a
 * new weapon can be tried with the cane's reinforcement and the cane have it back, at a price.
 */
export function movable(g: Pick<Game, 'player'>, from: WeaponId, to: WeaponId): number {
  const { arms, reinforced } = g.player;
  if (from === to || !arms.includes(from) || !arms.includes(to)) return 0;
  return Math.max(0, Math.min(reinforced[from], REINFORCE.max - reinforced[to]));
}

/**
 * Echoes moving `count` levels from `from` to `to` costs (round 61): each level moved is priced at the star-stones it would cost to set
 * in afresh as the level it becomes in `to`, at `REINFORCE.moveEchoes` Echoes a stone. A move costs the more the further the weapon
 * it goes to is already reinforced, as setting it in does, and shuffling levels about bleeds Echoes where stones set directly do not.
 */
export function moveCost(g: Pick<Game, 'player'>, to: WeaponId, count: number): number {
  let cost = 0;
  for (let i = 0; i < count; i++) cost += (REINFORCE.cost[g.player.reinforced[to] + i] ?? 0) * REINFORCE.moveEchoes;
  return cost;
}

/** How many levels, of `count` asked for, could be moved from `from` to `to` now: as many as there are, there is room for, and the Echoes carried will pay for. */
export function affordableMoves(g: Pick<Game, 'player'>, from: WeaponId, to: WeaponId, count = 1): number {
  let n = Math.min(Math.max(0, Math.floor(count)), movable(g, from, to));
  while (n > 0 && moveCost(g, to, n) > g.player.echoes) n--;
  return n;
}

/** Moves up to `count` levels of reinforcement from `from` to `to`, paying for them in Echoes; how many moved (fewer, or none, if the Echoes fall short). */
export function moveLevels(g: Game, from: WeaponId, to: WeaponId, count = 1): number {
  const n = affordableMoves(g, from, to, count);
  if (n <= 0) return 0;
  const cost = moveCost(g, to, n);
  g.player.echoes -= cost;
  g.player.reinforced[from] -= n;
  g.player.reinforced[to] += n;
  if (cost > 0) g.events.emit('Echoes', { change: 'spent', amount: cost, total: g.player.echoes, on: 'level' });
  return n;
}

/** Star-stones a boss of roster id `id` leaves (by its tier). */
export const stonesOf = (id: string): number => STAR_STONES[getEntity(id)?.tier ?? 'lesser'] ?? 0;

/** Star-stones the bosses of an older save (spawn ids `boss:<id>`) would have left, had there been any then. */
export const stonesOfSlain = (slain: Iterable<string>): number => [...slain].reduce((n, s) => n + (s.startsWith('boss:') ? stonesOf(s.slice(5)) : 0), 0);

/** Subscribes the stones: a boss slain for good leaves its star-stones to the investigator. */
export function registerArms(g: Game): void {
  g.events.on('Vanquished', ({ entity }) => {
    const d = g.ecs.c.dread.get(entity);
    if (d) giveStones(g, stonesOf(d.id));
  });
}

/** Star-stones for the investigator (a boss's, or a quest's thanks), said on the HUD. */
export function giveStones(g: Game, n: number): void {
  if (n <= 0) return;
  g.player.stones += n;
  g.events.emit('Notice', { text: `${n === 1 ? 'A STAR-STONE' : `${n} STAR-STONES`} · SET THEM INTO YOUR ARMS AT AN ELDER SIGN` });
}

/** How far each weapon owned is reinforced, fresh: none. */
export const unreinforced = (): Record<WeaponId, number> => Object.fromEntries(WEAPON_IDS.map((id) => [id, 0])) as Record<WeaponId, number>;
