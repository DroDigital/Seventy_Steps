/**
 * The way to each open arena (round 62, asked: "for boss arenas within the open world, a distinct, thematic discovery process featuring
 * cohesive pathways, unique visual identities, and original puzzles or hazards tailored to each encounter, rather than placing them
 * arbitrarily"): a horror's ground was a ring set down on open land with nothing leading to it. Now a trail runs from the nearest road to
 * its fog, and it is walked as a story: a trailhead where it leaves the road, waymarks that grow thicker and stranger toward the fog,
 * omens said as the places are passed, a hazard that is of the horror's own kind, and for some a rite (lights to be lit in the order the
 * place tells, a field of wards to cross by the sign that is safe). One `Way` for each horror, authored in `arenaWaysEarth.ts` and
 * `arenaWaysBeyond.ts`; `world/arenaWay.ts` lays it on the land, `systems/ways.ts` plays it. Data only.
 */

import type { Face, Piece } from './arenaSets';

/** A place along a way: `d` metres from the fog's outer edge back toward the road it leaves, and `side` metres to the left of the way as it is walked toward the fog (negative: to the right). */
export interface Spot {
  d: number;
  side: number;
}

/** What a hazard is made of, and so how it looks, sounds and is coloured (render/wayFx.ts). */
export type Look = 'flame' | 'spore' | 'coil' | 'salt' | 'bolt' | 'brine' | 'sand' | 'frost' | 'eye' | 'sign' | 'void' | 'star' | 'stain' | 'glass';

/** A line of pieces down the way, from `from` to `to` metres back from the fog, one every `every` metres, `side` metres out (a range draws each one's between; `mirror`: and its twin on the other side). */
export interface Mark {
  piece: Piece;
  from: number;
  to: number;
  every: number;
  side: number | readonly [number, number];
  mirror?: boolean;
  jitter?: number; // metres of wander along the way
  chance?: number; // 0..1: how many of them are made (default all)
  face?: Face; // 'in': toward the way; 'out': away; 'front': toward the fog; 'free'
}

/** A line said, and a sound and a tremor under it, the first time the way is walked past `at` metres from the fog toward it. */
export interface Omen {
  at: number;
  words: string;
  sound?: 'whale' | 'bellow' | 'thunder' | 'whisper' | 'chant' | 'choral' | 'wail';
  shake?: number;
  pitch?: number;
}

/** A hazard of the way: a thing of the horror's own kind that hurts those who come the careless way. All are outside the ring, none in the fight. */
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
  order: 'rising' | 'falling' | 'near'; // smallest first, greatest first, or the nearest the road first (by how they stand)
  clue: string; // said the first time the lights are come to
  done: string; // said when they are all lit
  reward: { echoes: number; insight?: number };
  stills?: boolean; // the way's hazards are stilled for good when it is done
}

export interface Way {
  name: string; // what the trail's head is called when found
  line: string; // said under it
  head: Piece; // what stands at the trailhead, where it leaves the road
  headSide?: number; // metres to the road's side it stands (default: left)
  width?: number; // metres of the trail (default 2.6)
  marks: readonly Mark[];
  omens: readonly Omen[];
  hazards?: readonly Hazard[];
  rite?: Rite;
}

/** The pieces that are lights and plates are built in code (render/wayViews.ts); the marks are set pieces (data/arenaSets.ts), placed along the path. */
export const mark = (piece: Piece, from: number, to: number, every: number, side: number | readonly [number, number], o: Partial<Omit<Mark, 'piece' | 'from' | 'to' | 'every' | 'side'>> = {}): Mark => ({ piece, from, to, every, side, ...o });
export const piece = (of: string, o: Omit<Piece, 'of'> = {}): Piece => ({ of, ...o });
export const spot = (d: number, side = 0): Spot => ({ d, side });
