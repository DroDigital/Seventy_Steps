/**
 * What has come into the investigator's hands and what they have yet to look at (round 60: "many users obtain weapons and relics
 * without sufficient awareness of the process or inventory status"). A weapon walked over, a relic left by a horror slain, a
 * quest's gift: each is marked new, kept among what has been told so that the save holds it, until the Arms page has shown it,
 * and says so by the `Found` event, which a card answers (ui/findCard.ts) once the investigator is free. This module holds the
 * marks, when a find may be shown, and what a weapon is against the one in hand. Pure: no DOM.
 */

import { TEMPERS } from '../data/relics';
import { FINDS } from '../data/tuning';
import { WEAPONS, type WeaponId } from '../data/weapons';
import { edgeAt } from './arms';
import { travelBar } from './checkpoints';
import type { Game } from './components';
import { might } from './levels';

export type FindKind = 'weapon' | 'relic';

const NEW = 'new:';
const keyOf = (kind: FindKind, id: string): string => `${NEW}${kind}:${id}`;

/** Marks a find not yet looked at. */
export function markNew(g: Pick<Game, 'overworld'>, kind: FindKind, id: string): void {
  g.overworld?.told.add(keyOf(kind, id));
}

/** Whether a find has not been looked at yet. */
export const isNew = (g: Pick<Game, 'overworld'>, kind: FindKind, id: string): boolean => !!g.overworld?.told.has(keyOf(kind, id));

/** Marks one find (or, with no `id`, every one of its kind, or, with neither, all) as looked at. */
export function clearNew(g: Pick<Game, 'overworld'>, kind?: FindKind, id?: string): void {
  const told = g.overworld?.told;
  if (!told) return;
  const from = kind ? (id ? keyOf(kind, id) : `${NEW}${kind}:`) : NEW;
  for (const k of [...told]) if (id ? k === from : k.startsWith(from)) told.delete(k);
}

/** How many finds have not been looked at yet (the pause menu's mark on Arms). */
export const newFinds = (g: Pick<Game, 'overworld'>): number => [...(g.overworld?.told ?? [])].filter((k) => k.startsWith(NEW)).length;

/** Whether a card may open now: the investigator is free (no scene, no fight, no foe hunting close, not falling or fallen, not walking through a gate or a fog). */
export function free(g: Game): boolean {
  const p = g.player;
  return !!g.overworld && !g.cutscene && !p.gatePass && !p.fogPass && !p.falling && g.ecs.c.actor.get(p.id)?.move !== 'death' && travelBar(g) === null;
}

/** The figures of weapon `id` as the investigator would swing it: the Might and its reinforcement counted, as the Arms page shows them. */
export function weaponFigures(g: Game, id: WeaponId): { light: number; heavy: number; lands: number; reach: number; stamina: number } {
  const [w, k] = [WEAPONS[id], might(g, g.player.id) * edgeAt(g.player.reinforced[id])];
  const [light, heavy] = [w.moves.light1, w.moves.heavy1];
  return {
    light: Math.round((light?.hit?.damage ?? 0) * k),
    heavy: Math.round((heavy?.hit?.damage ?? 0) * k),
    lands: Math.round(((light?.hit?.window[0] ?? 0) / 60) * 100) / 100,
    reach: Math.round((light?.hit?.reach ?? 0) * 10) / 10,
    stamina: light?.stamina ?? 0,
  };
}

export interface Figure {
  text: string;
  tone: 'good' | 'bad' | 'dim';
}

const signed = (d: number, unit = ''): string => (d === 0 ? '' : ` (${d > 0 ? '+' : '−'}${Math.abs(Math.round(d * 100) / 100)}${unit})`);

/** Weapon `id` against the one in hand, as figures: green where it is the better, red where it is the worse; the temper's line, if it has one. Only the figures if it is the one in hand. */
export function weaponFigureList(g: Game, id: WeaponId): Figure[] {
  const [a, b] = [weaponFigures(g, id), weaponFigures(g, g.player.weapon)];
  const same = id === g.player.weapon;
  const tone = (d: number, higherIsBetter: boolean): Figure['tone'] => (same || d === 0 ? 'dim' : d > 0 === higherIsBetter ? 'good' : 'bad');
  const rows: Figure[] = [
    { text: `Light blow ${a.light}${same ? '' : signed(a.light - b.light)}`, tone: tone(a.light - b.light, true) },
    { text: `Heavy blow ${a.heavy}${same ? '' : signed(a.heavy - b.heavy)}`, tone: tone(a.heavy - b.heavy, true) },
    { text: `Lands in ${a.lands.toFixed(2)} s${same ? '' : signed(a.lands - b.lands, ' s')}`, tone: tone(a.lands - b.lands, false) },
    { text: `Reach ${a.reach.toFixed(1)} m${same ? '' : signed(a.reach - b.reach, ' m')}`, tone: tone(a.reach - b.reach, true) },
    { text: `${a.stamina} stamina${same ? '' : signed(a.stamina - b.stamina)}`, tone: tone(a.stamina - b.stamina, false) },
  ];
  return rows;
}

/** A weapon's temper in a line, if it has one. */
export const temperOf = (id: WeaponId): string | undefined => (TEMPERS as Partial<Record<WeaponId, { line: string }>>)[id]?.line;

/** The find whose card is due: the first in the queue, once it has waited its moment (`now` and `at` in milliseconds). */
export const due = <T extends { kind: FindKind; at: number }>(queue: readonly T[], now: number): T | undefined =>
  queue.length > 0 && now - queue[0].at >= FINDS.wait[queue[0].kind] ? queue[0] : undefined;

