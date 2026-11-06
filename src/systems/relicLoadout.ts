/** Read the relics a character has and wears, without changing their resources. */
import { RELICS, RELIC_IDS, RELIC_SLOTS, type Relic, type RelicId } from '../data/relics';
import type { Game } from './components';

export const KEY = 'relic:';
export const SLOT = 'slot:';
export const isRelic = (id: string): id is RelicId => (RELIC_IDS as readonly string[]).includes(id);

export const owned = (g: Pick<Game, 'overworld'>): RelicId[] =>
  [...(g.overworld?.told ?? [])].filter((k) => k.startsWith(KEY)).map((k) => k.slice(KEY.length)).filter(isRelic);

export function slotsOf(g: Pick<Game, 'overworld'>): (RelicId | null)[] {
  const told = g.overworld?.told ?? new Set<string>();
  return Array.from({ length: RELIC_SLOTS }, (_, n) => {
    const k = [...told].find((x) => x.startsWith(`${SLOT}${n}:`));
    const id = k?.slice(`${SLOT}${n}:`.length);
    return id && isRelic(id) && told.has(KEY + id) ? id : null;
  });
}

export const worn = (g: Pick<Game, 'overworld'>): RelicId[] => slotsOf(g).filter((id): id is RelicId => id !== null);

/** Multiplicative effects stack only while worn. */
export function boon(g: Pick<Game, 'overworld'>, k: keyof Omit<Relic, 'name' | 'note'>): number {
  return worn(g).reduce((n, id) => n * ((RELICS[id] as Relic)[k] ?? 1), 1);
}
