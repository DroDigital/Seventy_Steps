/**
 * The set of each open arena (round 61, asked: "the current boss arenas lack compelling visual direction... each arena completely
 * reimagined to align more closely with thematic and narrative elements"): its ground, the pieces stood about it and its air, one
 * composition for each horror, drawn from its own story. A piece is a baked model (data/models: CC0 kits by Kenney, credited in
 * CREDITS.md), a built one (data/setKits.ts) or one of the world's props ('prop:tree'); where it stands is a layout, in the arena's
 * own frame: the angle is in degrees clockwise from its front (toward the realm's nearest Elder Sign, the way a person comes: where
 * the candle burns before the fog), and the radius a share of the arena's, so a composition holds at any size. Data only.
 */

import type { LightKind, Vec3 } from './tuning';

/** Which anomaly colour (render/palette.ts) a built piece glows in. */
export type Glow = 'magenta' | 'purple' | 'green';

/** The look of a piece: what it is and how it is dressed. */
export interface Piece {
  of: string; // a model's id, a built piece's, or 'prop:<kind>'
  size?: number | readonly [number, number]; // × its own size; a range draws each one's between
  tint?: Vec3; // the colour its stone leans toward
  keep?: number; // 0..1: how much of its own colours a model keeps
  glow?: Glow; // a built piece's glow
  lit?: LightKind; // a flame or lamp at its top, lighting about it
  walk?: boolean; // low enough to be walked over: no collider
  lift?: number; // metres off the ground (hung, floating, sunk if negative)
  heart?: boolean; // may stand in the fight's circle, as its centrepiece
  join?: boolean; // may touch the pieces beside it (a wall's, a colonnade's)
  hung?: boolean; // hangs on a wall (a shelf, a banner): a room's set stands it against the wall, not clear of it (round 77)
  wax?: boolean; // a figure of wax (round 77: the museum's effigies): drawn translucent and warm
  dims?: readonly [w: number, d: number, h: number]; // a built piece's own size, half extents and height
}

/** Where, as degrees clockwise from the front and shares of the arena's radius (`add`: and so many metres more). */
export type Face = 'in' | 'out' | 'front' | 'free' | 'wall' | number; // 'wall': square to the nearest wall of a room (turned to the axis nearest the way in), which a row of shelves along a wall wants
export type Layout =
  | { ring: { r: number; n: number; add?: number; arc?: readonly [number, number]; jitter?: number; face?: Face } } // n about a circle, or an arc of it
  | { at: { r: number; a: number; add?: number; side?: number; mirror?: boolean; face?: Face } } // one, or a pair either side of the line, `side` metres across it
  | { scatter: { n: number; r: readonly [number, number]; arc?: readonly [number, number]; face?: Face } } // at random in a band
  | { lane: { r: readonly [number, number]; n: number; side: number; face?: Face } } // down the way in, a pair every step
  | { wall: { r: number; step: number; walls?: readonly number[]; face?: Face } }; // a room's walls (round 77): a piece every `step` metres along each, at a share `r` of the radius, a candidate for each that the room's doors, pillars and things then refuse

export interface Put {
  piece: Piece;
  where: Layout;
}

/** The ground inside the ring (world/arenaGround.ts): its texture over the land's, its colour, and bands and spokes of dark and light on it. */
export interface GroundSpec {
  texture: string; // a texture of render/textures.ts
  tint?: Vec3; // replaces the land's colour inside
  gain?: number; // × its brightness
  reach?: number; // metres past the ring it runs before it gives way to the land (default 10)
  bands?: readonly { r0: number; r1: number; k: number; tint?: Vec3 }[]; // shares of the radius; k × brightness
  spokes?: { n: number; width: number; k: number; r0?: number; r1?: number; twist?: number }; // rays from the heart, as many as `n`, `width` in degrees; `twist`: degrees turned by the rim
}

/** What drifts in an arena's air (render/arenaAir.ts). */
export interface AirSpec {
  kind: 'ash' | 'ember' | 'spore' | 'mote' | 'drift' | 'spray' | 'dust' | 'flake';
  color: Vec3;
  rate: number; // a second, across the arena
  rise?: number; // m/s up (negative: falls)
  glow?: boolean;
  size?: number;
}

/** What a candle before the fog stands on, as the place has it (render/candleViews.ts; world/candlePlan.ts): a small cairn of stones, a skull, a gravestone's foot, a piece of driftwood, a votive in a dish. */
export type CandleLook = 'cairn' | 'skull' | 'grave' | 'driftwood' | 'votive';

export interface ArenaSet {
  candle?: CandleLook;
  ground?: GroundSpec;
  puts: readonly Put[];
  air?: AirSpec;
}

// Authors' shorthands.
export const ring = (r: number, n: number, o: { add?: number; arc?: readonly [number, number]; jitter?: number; face?: Face } = {}): Layout => ({ ring: { r, n, ...o } });
export const at = (r: number, a: number, o: { add?: number; side?: number; mirror?: boolean; face?: Face } = {}): Layout => ({ at: { r, a, ...o } });
export const scatter = (n: number, r: readonly [number, number], o: { arc?: readonly [number, number]; face?: Face } = {}): Layout => ({ scatter: { n, r, ...o } });
export const wall = (r: number, step: number, o: { walls?: readonly number[]; face?: Face } = {}): Layout => ({ wall: { r, step, ...o } });
export const lane = (r: readonly [number, number], n: number, side: number, face?: Face): Layout => ({ lane: { r, n, side, face } });
export const put = (of: string, where: Layout, o: Omit<Piece, 'of'> = {}): Put => ({ piece: { of, ...o }, where });
