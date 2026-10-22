/**
 * What stands in the court before each open arena's gate (round 62 made them trails to the fog; round 63, asked "not literal pathways or
 * roads", walls each horror's ground about, so the trail became the court that leads to its one gate): waymarks that grow thicker and
 * stranger toward the gate, omens said as the places are passed, hazards of the horror's own kind, and for some a rite (lights to be lit in
 * the order the place tells, a field of wards to cross by the sign that is safe), which the discovery (data/discoveries.ts) may ask. One
 * `Way` for each horror, authored in `arenaWaysEarth.ts` and `arenaWaysBeyond.ts`; `world/arenaWay.ts` lays it on the land,
 * `systems/ways.ts` plays it. Data only.
 */

import type { Face, Piece } from './arenaSets';

/** A place in the court: `d` metres out from the gate, and `side` metres to the left of the court as it is walked in toward the gate (negative: to the right). */
export interface Spot {
  d: number;
  side: number;
}

/** What a hazard is made of, and so how it looks, sounds and is coloured (render/wayFx.ts). */
export type Look = 'flame' | 'spore' | 'coil' | 'salt' | 'bolt' | 'brine' | 'sand' | 'frost' | 'eye' | 'sign' | 'void' | 'star' | 'stain' | 'glass';

/** A line of pieces down the court, from `from` to `to` metres out from the gate, one every `every` metres, `side` metres out (a range draws each one's between; `mirror`: and its twin on the other side). */
export interface Mark {
  piece: Piece;
  from: number;
  to: number;
  every: number;
  side: number | readonly [number, number];
  mirror?: boolean;
  jitter?: number; // metres of wander along the way
  chance?: number; // 0..1: how many of them are made (default all)
  face?: Face; // 'in': toward the way; 'out': away; 'front': toward the gate; 'free'
}

/** A line said, and a sound and a tremor under it, the first time the court is walked in past `at` metres from the gate. */
export interface Omen {
  at: number;
  words: string;
  sound?: 'whale' | 'bellow' | 'thunder' | 'whisper' | 'chant' | 'choral' | 'wail';
  shake?: number;
  pitch?: number;
}

/** A hazard of the way: a thing of the horror's own kind that hurts those who come the careless way. None of the authored ways has one (round 66: "remove all traps from all paths that lead to bosses"); systems/ways.ts still plays them. */
export type Hazard =
  | { kind: 'ward'; look: Look; plates: readonly Spot[]; trigger?: number; burst?: number; damage?: number; warn?: number; cool?: number; pool?: number } // a plate underfoot that wakes, and bursts a moment after: a step aside or a roll clears it (`pool`: seconds of what it leaves)
  | { kind: 'field'; look: Look; from: number; to: number; rows: number; cols: number; key: number; at: Spot; damage?: number } // a field of plates of which one in each row is safe: the one that bears the rune on the tablet (`key`, 0..3) set at `at`
  | { kind: 'vent'; look: Look; at: readonly Spot[]; every: readonly [number, number]; burst?: number; damage?: number; warn?: number } // erupts of itself, in a round, and shows it first
  | { kind: 'tide'; look: Look; from: number; to: number; width: number; every: readonly [number, number]; damage?: number } // a wave that sweeps a stretch of the way from its far end to its near, now and then
  | { kind: 'blight'; look: Look; at: readonly Spot[]; r: number; rate: number; of?: 'sanity' | 'stamina' }; // ground that wears at the mind (or the breath) of whoever stands on it

/** What a rite's lights are, as they stand. */
export type LightLook = 'candle' | 'brazier' | 'lamp' | 'fire' | 'glow';

/** A rite: lights stood along the way that are to be lit one after another, in the order the place tells; the wrong light puts them all out again, and a flare of the way's own kind goes up at it. */
export interface Rite {
  look: LightLook;
  glow: 'magenta' | 'purple' | 'green';
  at: readonly Spot[];
  order: 'rising' | 'falling' | 'near'; // smallest first, greatest first, or the one furthest out from the gate first (by how they stand)
  clue: string; // said the first time the lights are come to
  done: string; // said when they are all lit
  reward: { echoes: number; insight?: number };
  stills?: boolean; // the way's hazards are stilled for good when it is done
}

export interface Way {
  width?: number; // metres of the court's way in, kept clear of what is stood (default 2.6)
  marks: readonly Mark[];
  omens: readonly Omen[];
  hazards?: readonly Hazard[];
  rite?: Rite;
}

/** The pieces that are lights and plates are built in code (render/wayViews.ts); the marks are set pieces (data/arenaSets.ts), placed along the path. */
export const mark = (piece: Piece, from: number, to: number, every: number, side: number | readonly [number, number], o: Partial<Omit<Mark, 'piece' | 'from' | 'to' | 'every' | 'side'>> = {}): Mark => ({ piece, from, to, every, side, ...o });
export const piece = (of: string, o: Omit<Piece, 'of'> = {}): Piece => ({ of, ...o });
export const spot = (d: number, side = 0): Spot => ({ d, side });
