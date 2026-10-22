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

/** What a house's wall is made of: the dam of the heath, the ravine's cliff, the grove's living palisade, a colonnade, a hedge, the stepped terraces of a ziggurat, R'lyeh's leaning slabs, a wall of crystal, ashlar. */
export type WallKind = 'ashlar' | 'dam' | 'cliff' | 'grove' | 'colonnade' | 'hedge' | 'slabs' | 'crystal' | 'terrace';

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
  gate: { width: number; height: number; flank: number; sealed?: boolean }; // `flank`: the height of the towers either side; `sealed`: its door is banded with glyphs
  reach?: number; // metres from the ring of the fight to the wall's middle (HOUSE.reach)
}

/** The numbers of a house. */
export const HOUSE = {
  reach: 18, // metres from the ring of the fight's radius to the middle of the wall: the stake, the candle and the dressing of the court are inside it
  segment: 4.6, // metres of wall in each piece
  margin: 3.2, // metres a piece of the court's set stands within the wall
  level: 7, // metres of level ground beyond the wall's middle
  least: 14, // fewest pieces in the ring
  lap: 0.55, // metres the gate's two towers lap over its opening, and its seal under them
  court: 54, // metres out from the gate that the land must be the realm's and walkable for the court to lie there (the gate faces the other way when it is not)
} as const;

export const house = (h: House): House => h;
