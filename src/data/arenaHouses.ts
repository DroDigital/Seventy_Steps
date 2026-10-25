/**
 * The house of each open horror (round 63, asked: "a distinct, lore-accurate discovery experience for each encounter", and "expansive,
 * visually striking, immersive structures that house the boss arenas"; round 62's trails were roads a body could leave by any angle): a
 * horror's ground is walled about, in the stuff of its own story, from the foot of its fog to a wall that is closed all the way round
 * but for one gate, and the gate is shut until the horror has been found (data/discoveries*.ts: what is read, waited out, offered).
 * A house has no other way in, so there is no angle to take it from. Its shape here; where it stands, `world/arenaHouse.ts`; how it is
 * drawn, `render/setShapesHouse.ts` and `setShapesTower.ts`. Data only.
 */

import type { Glow } from './arenaSets';
import type { Vec3 } from './tuning';

/** What a house's wall is made of: the dam of the heath, the ravine's cliff, the grove's living palisade, a colonnade, a hedge, the stepped terraces of a ziggurat, R'lyeh's leaning slabs, a wall of crystal, ashlar, and (round 68) the kerb of a river's bank. */
export type WallKind = 'ashlar' | 'dam' | 'cliff' | 'grove' | 'colonnade' | 'hedge' | 'slabs' | 'crystal' | 'terrace' | 'kerb';

/** What stands at intervals along it, and flanks its gate. */
export type TowerKind = 'square' | 'round' | 'spire' | 'horn';

export interface House {
  name: string; // the great words when it is first seen
  line: string; // and the line under them
  wall: WallKind;
  height: number; // metres
  thick: number;
  tint?: Vec3; // the colour its stone leans toward
  glow?: Glow; // what burns along it
  tower: { kind: TowerKind; every: number; height: number; lit?: boolean }; // one in every `every` of the wall's pieces; `lit`: a fire on its top
  gate: { width: number; height: number; flank: number; sealed?: boolean }; // `flank`: the height of the towers either side; `sealed`: its door is banded with glyphs; what hangs in it is the horror's `GATE_STYLES` (round 76, data/gateStyles.ts)
  reach?: number; // metres from the ring of the fight to the wall's middle (HOUSE.reach)
  bailey?: Bailey; // a court walled as a rectangle, not a ring (round 67)
  basin?: Basin; // a court walled as a reservoir: a dam across the front and a bank curving about the arena (round 68)
  river?: River; // a court on an island in a river, crossed by one ford (round 68)
  place?: boolean; // built of the supplied packs' models by its own planner (round 71; world/places/): the wall's kind above is then only its name for the gate's and the tests' sake
}

/**
 * A court walled as a reservoir (round 68; world/enclosureBasin.ts): a dam across the front, straight, the gate in its middle, and a bank
 * that curves back from its ends about the arena like the shore of a lake held behind a dam, half an ellipse. Metres from the fight's
 * ring, as a bailey's. A spillway can be cut in the dam (`spill`: metres to the left of the gate, and its breadth), with dust pouring down it.
 */
export interface Basin {
  ahead: number; // to the dam
  side: number; // to the dam's ends, the widest of the basin
  behind: number; // to the bank's farthest point
  wobble: number; // metres the bank wanders from a true curve, so it reads as a shore
  spill?: { at: number; width: number };
}

/**
 * A court on an island in a river (round 68; world/enclosureRiver.ts): the ring of the fight stands on an island, a river runs about it
 * between two kerbs and one ford of flat stones, kerbed, crosses it from the gate. The river lies `depth` metres below the land. Where the
 * outer kerb stands is the house's `reach` (the bank's), and the river lies between it and the island, `island` metres from the fight's ring.
 */
export interface River {
  island: number; // from the fight's ring to the island's bank
  depth: number; // metres the river's bed lies below the land
  ford: number; // the ford's breadth between its kerbs
}

/**
 * A court walled in a rectangle about the fight's ring (round 67; world/enclosureBailey.ts): the wall's middle stands `ahead` metres past
 * the ring at the gate (so the gate, the court, the stake and the candle are where a ring's would be: `ahead` is the ring's reach), `side`
 * at the sides and `behind` at the back; corners are towers of the house's kind. At the back, in place of a length of wall, a keep stands
 * joined to it: its front face on the wall's line, its mass behind. Over the gate a gatehouse carries a lightning rod.
 */
export interface Bailey {
  ahead: number;
  side: number;
  behind: number;
  keep?: { width: number; depth: number; height: number; rod: number }; // metres; `rod`: the mast on its roof
  gatehouse?: { height: number; rod: number }; // the span over the gate: its top, and the rod above
}

/** The numbers of a house. */
export const HOUSE = {
  reach: 18, // metres from the ring of the fight's radius to the middle of the wall: the stake, the candle and the dressing of the court are inside it
  segment: 4.6, // metres of wall in each piece
  margin: 3.2, // metres a piece of the court's set stands within the wall
  level: 7, // metres of level ground beyond the wall's middle
  least: 14, // fewest pieces in the ring
  lap: 0.55, // metres the gate's two towers lap over its opening, and its seal under them
  rodTip: 0.5, // metres from the top of a keep or a gatehouse to the point of light on its lightning rod (the mast's base stands 0.3 above the top, and the light 0.2 over the mast's end)
  court: 54, // metres out from the gate that the land must be the realm's and walkable for the court to lie there (the gate faces the other way when it is not)
} as const;

export const house = (h: House): House => h;
