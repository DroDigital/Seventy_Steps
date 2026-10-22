/**
 * The discovery of each open horror (round 63, asked: "a distinct, lore-accurate discovery experience for each encounter"; round 62's
 * trails were roads, and a body could leave them by any angle): a horror's house is shut at its one gate (data/arenaHouses.ts) until it has
 * been found, and finding it is a short story told in its own matter, two or three acts, in the court before the gate: a page read that
 * says what happened here, a vigil kept at the hour, in the weather or in the state of mind the place asks for, a gift laid on its altar
 * (a dose, some Echoes, a little of the mind or of the blood), the rite of lights the way had (data/arenaWays.ts). The acts are a quest
 * in the journal, and what the gate wants is read there; when they are all done the gate draws aside and stays so. Written for each horror
 * in `discoveriesEarth.ts` and `discoveriesBeyond.ts`; its court laid by `world/discoveryPlan.ts`, played by `systems/discovery.ts`. Data only.
 */

import type { Piece } from './arenaSets';
import type { Spot } from './arenaWays';

/** The three hours of the night (systems/clock.ts), the weathers a realm has, and the states of the mind (systems/sanity.ts). */
export type Hour = 'gloaming' | 'deep' | 'waning';
export type Sky = 'clear' | 'rain' | 'storm' | 'gale' | 'motes';
export type Mind = 'lucid' | 'uneasy' | 'fractured' | 'unmoored';

/** What a vigil asks of the hour it is kept in: any one of the hours, any one of the skies, a mind in the band `from` to `to`. A condition left out is not asked. */
export interface When {
  hour?: readonly Hour[];
  sky?: readonly Sky[];
  mind?: { from: Mind; to: Mind };
  dark?: boolean; // the lantern not lit by a lamp's or a fire's light: no light but its own within reach (`Game.lit`)
}

/** What is laid on an altar: one dose of the Laudanum, a sum of Echoes, a measure of the mind, a measure of the blood (never the last of it). */
export type Gift = { kind: 'dose' } | { kind: 'echoes'; n: number } | { kind: 'mind'; n: number } | { kind: 'blood'; n: number };

interface Act {
  note: string; // the journal's line while it is the one to do
}

/** A page read: the document named (data/documents.ts, one of the court's own or any other in the world). */
export interface Read extends Act {
  kind: 'read';
  doc: string;
}

/** The rite of lights of the horror's way (data/arenaWays.ts `rite`), lit in the order the place tells. */
export interface Rite extends Act {
  kind: 'rite';
}

/** A vigil: stood at `at` in the court, in the hour `when` asks for, for `seconds`; leaving it, or the hour passing, lets the vigil ebb. `piece` stands there to mark the place. */
export interface Vigil extends Act {
  kind: 'vigil';
  at: Spot;
  piece: Piece;
  seconds: number;
  when: When;
  words: string; // said as it begins
}

/** An offering: at the altar `piece` stands at `at`, E gives `give` (`label`: what the prompt says), and `words` are said. */
export interface Offer extends Act {
  kind: 'offer';
  at: Spot;
  piece: Piece;
  give: Gift;
  label: string;
  words: string;
}

export type Step = Read | Rite | Vigil | Offer;

/** A page set down in the court, for the investigator to come upon (the text is in data/documentsHouses.ts, under `doc`). */
export interface Leaf {
  doc: string;
  at: Spot;
}

export interface Discovery {
  title: string; // the quest's, in the journal
  start: string; // its first line, when the house is first seen
  steps: readonly Step[]; // in the order they are asked (a page read counts whenever it is read; a rite whenever it is done)
  leaves: readonly Leaf[]; // the pages in the court
  shut: string; // said at the gate while it is shut
  opens: string; // said as it gives
  done: string; // the journal's, once the horror is down
  reward: { echoes: number; insight?: number };
}

/** The numbers of the discoveries. */
export const FOUND = {
  see: 46, // metres from the house's wall that it is first seen (and its quest begins)
  gate: 14, // metres from the gate within which it says it is shut
  vigil: 4.2, // metres from the vigil's mark that is kept
  altar: 2.6, // metres from the altar's that E gives
  ebb: 2, // a vigil unkept ebbs this many times as fast as it is kept
  hush: 30, // seconds before a mark or an altar that is come to before its turn says so again
  court: 46, // metres out from the gate the court's things are set (its pages, its marks) at the furthest
} as const;

/** The key a told step is kept under (`ow.told`), and the one the gate opens by. */
export const stepKey = (boss: string, i: number): string => `disc:${boss}:${i}`;
export const foundKey = (boss: string): string => `found:${boss}`;

export const read = (doc: string, note: string): Read => ({ kind: 'read', doc, note });
export const rite = (note: string): Rite => ({ kind: 'rite', note });
export const vigil = (at: Spot, piece: Piece, seconds: number, when: When, words: string, note: string): Vigil => ({ kind: 'vigil', at, piece, seconds, when, words, note });
export const offer = (at: Spot, piece: Piece, give: Gift, label: string, words: string, note: string): Offer => ({ kind: 'offer', at, piece, give, label, words, note });
export const leaf = (doc: string, d: number, side: number): Leaf => ({ doc, at: { d, side } });
