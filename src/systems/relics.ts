/**
 * Relics and tempers (round 26; data/relics.ts): a horror slain for good leaves a relic, kept
 * among what has been told (so the save holds it). Two are worn (RELIC_SLOTS), chosen at an Elder
 * Sign; the worn ones multiply blows, bounties and mending, and the weapon in hand steadies the mind
 * at a kill. Those owned but not worn do nothing, so what a build gives up is as much its choice as what
 * it takes. Pure: no Three.js.
 */

import { hash2 } from '../core/rng';
import { RELICS, RELIC_IDS, RELIC_SLOTS, TEMPERS, type Relic, type RelicId } from '../data/relics';
import type { Game } from './components';
import { markNew } from './finds';
import { refreshRelicVitals } from './levels';
import { boon, isRelic, KEY, SLOT, slotsOf } from './relicLoadout';
import { restoreSanity } from './sanity';

export { boon, owned, slotsOf, worn } from './relicLoadout';

type Told = Set<string>;
const LOADOUT = 'relic-loadout:1'; // distinguishes deliberately empty slots from a save made before slots existed
function put(told: Told, slot: number, id: RelicId | null): void {
  told.add(LOADOUT);
  for (const k of [...told]) if (k.startsWith(`${SLOT}${slot}:`)) told.delete(k);
  if (id) told.add(`${SLOT}${slot}:${id}`);
}

/** Wears `id` in `slot` (or with null, takes that slot's off). One already worn in the other slot changes places with it; false for a relic not found or a slot there is not. */
export function wear(g: Game, slot: number, id: RelicId | null): boolean {
  const told = g.overworld?.told;
  if (!told || !Number.isInteger(slot) || slot < 0 || slot >= RELIC_SLOTS || (id && !told.has(KEY + id))) return false;
  const now = slotsOf(g);
  const other = id ? now.indexOf(id) : -1;
  if (other >= 0 && other !== slot) put(told, other, now[slot]);
  put(told, slot, id);
  refreshRelicVitals(g);
  return true;
}

/** A relic found: it is theirs, and worn at once if a slot is free. True when it is worn. */
export function grant(g: Game, id: RelicId): boolean {
  const told = g.overworld?.told;
  if (!told) return false;
  told.add(KEY + id);
  const free = slotsOf(g).indexOf(null);
  if (free < 0) return false;
  put(told, free, id);
  refreshRelicVitals(g);
  return true;
}

/**
 * A save from before the slots had every relic found worn: the first RELIC_SLOTS of them stay worn, the rest wait to be
 * chosen. A save with slots (or with none found) is left as it is.
 */
export function settleRelics(told: Told): void {
  if (told.has(LOADOUT)) return;
  if ([...told].some((k) => k.startsWith(SLOT))) {
    told.add(LOADOUT);
    return;
  }
  const found = [...told].filter((k) => k.startsWith(KEY)).map((k) => k.slice(KEY.length)).filter(isRelic);
  found.slice(0, RELIC_SLOTS).forEach((id, n) => put(told, n, id));
}

/** Which relic a horror of this name leaves: the first not yet found, from a start of its own. */
export function relicFor(g: Pick<Game, 'overworld'>, name: string): RelicId | undefined {
  const at = Math.floor(hash2(name.length, [...name].reduce((h, c) => h + c.charCodeAt(0), 0), 3) * RELIC_IDS.length);
  return RELIC_IDS.map((_, i) => RELIC_IDS[(at + i) % RELIC_IDS.length]).find((id) => !g.overworld?.told.has(KEY + id));
}

/** The share a blow from `attacker` to `target` is scaled by the relics worn (1 for any but the investigator's blows and those that fall on them). */
export const relicScale = (g: Pick<Game, 'overworld' | 'player'>, attacker: number, target: number): number =>
  (attacker === g.player.id ? boon(g, 'dealt') : 1) * (target === g.player.id ? boon(g, 'taken') : 1);

/** Echoes a kill earns, once relics and the weapon's temper have had their say. */
export const bountyOf = (g: Pick<Game, 'overworld' | 'player'>, bounty: number): number =>
  Math.round(bounty * boon(g, 'echoes') * (TEMPERS[g.player.weapon as keyof typeof TEMPERS]?.echoes ?? 1));

export function registerRelics(g: Game): void {
  g.events.on('Vanquished', ({ name }) => {
    const id = relicFor(g, name);
    if (!id || !g.overworld) return;
    const on = grant(g, id);
    markNew(g, 'relic', id);
    const words = `RELIC · ${RELICS[id].name.toUpperCase()} · ${on ? 'WORN' : 'KEPT: CHOOSE WHAT TO WEAR AT AN ELDER SIGN'}`;
    g.events.emit('Notice', { text: words });
    g.events.emit('Found', { kind: 'relic', id, from: name, worn: on });
  });
  g.events.on('Died', ({ entity, killer }) => {
    if (killer !== g.player.id || entity === g.player.id || g.ecs.c.combatant.get(entity)?.showcase) return;
    const t = TEMPERS[g.player.weapon as keyof typeof TEMPERS];
    if (t?.sanity) restoreSanity(g, t.sanity);
  });
}

/** One thing a relic does, as the menus show it: `text` is the figure ("Damage +10%"), `good` whether it favours the investigator (a gift is green, a price red: a smaller blow taken is a gift). */
export interface Effect {
  text: string;
  good: boolean;
}

/** What a relic does, in numbers: its gifts and its prices, in the order of the table. */
export function relicEffects(id: RelicId): Effect[] {
  const r = RELICS[id] as Relic;
  const pct = (v: number): string => `${v >= 1 ? '+' : '−'}${Math.round(Math.abs(v - 1) * 100)}%`;
  const rows: [number | undefined, string, boolean][] = [[r.dealt, 'Damage', true], [r.taken, 'Damage taken', false], [r.health, 'Max health', true], [r.stamina, 'Max stamina', true], [r.recovery, 'Stamina recovery', true], [r.echoes, 'Echoes', true], [r.mend, 'Mending', true]];
  return rows.filter(([v]) => v !== undefined && v !== 1).map(([v, what, more]) => ({ text: `${what} ${pct(v!)}`, good: (v! > 1) === more }));
}
