/**
 * The trader at the lamps (2026-11-06, asked: a trader at every second Elder Sign, leaning on a street lamp, to draw the player to the shop;
 * the marker over his head that was asked for the same day was dropped). Dr. Morgan, who sells lamp oil and cartridges at the Quad, is met
 * again at every second Elder Sign standing on the land (counted in the order the regions are laid, the first included, so that the Quad,
 * Dunwich Village and Lake's Camp, where Morgan, Curtis and Dyer already trade, fall on the count): a stand-in with Morgan's figure, who leans
 * against a street lamp of his own beside the sign and sells what the road-sellers sell. A sign where a merchant already stands has none. His
 * words are the line Morgan already says and has recorded ("Here, see what I have"), spoken in Morgan's voice (`NpcDef.voice`). The places he may
 * stand are listed here, the best first; world/traderPlan.ts takes the first that no road, house or foe's post is in the way of. Pure data.
 */

import { yawOf, type XZ } from '../core/geom';
import { restPoint } from '../world/shrine';
import { DIRS, toWorld } from '../world/worldMap';
import type { Dir } from './dungeons';
import type { NpcDef } from './npcs';
import { REGIONS } from './regions';
import { SITES } from './sites';

/** Every how-manyth sign on the land has one, counting from the first. */
export const TRADER_EVERY = 2;

/** How far behind his shoulders the lamp stands, and how far from a sign's own person (3.8 m from the rising point) and from the stone he must be. */
export const TRADER_LAMP_BACK = 0.42;
const FROM_PERSON = 2.6;
const FROM_STONE = 4.6;

/** Places in the sign's frame, best first: this far ahead of the carved stone, and this far to a side (the sign's person has the other). */
const TRIES: readonly (readonly [ahead: number, abreast: number])[] = [[4.2, 4.6], [6.4, 4.6], [2.6, 5.4], [6.6, 7], [4.2, 7.5], [8, 3]];

export interface TraderSpot {
  id: string;
  sign: string;
  region: string;
  side: 1 | -1; // which side of the sign's rising point (the way NpcDef.side counts)
  x: number; // where he leans
  z: number;
  yaw: number; // facing the place the investigator rises
  lamp: XZ; // the street lamp at his back
}

export interface TraderSite {
  id: string;
  sign: string;
  region: string;
  tries: readonly TraderSpot[]; // where he may stand
}

export const traderId = (sign: string): string => `trader_${sign}`;

/** The signs standing on the land, in the order the world lays them (a dungeon's own are not counted). */
const openSigns = (): { id: string; region: string; x: number; z: number; face: Dir }[] =>
  REGIONS.flatMap((r) => (SITES[r.id]?.signs ?? []).map((s) => ({ id: s.id, region: r.id, ...toWorld(r, s.at), face: s.face })));

/** Each trader's place, given the people who stand at the signs already (a merchant among them: no trader; someone else: he takes the other side first). */
export function planTraders(people: readonly NpcDef[]): TraderSite[] {
  const out: TraderSite[] = [];
  openSigns().forEach((s, index) => {
    if (index % TRADER_EVERY) return;
    const here = people.filter((n) => n.sign === s.id);
    if (here.some((n) => n.shop)) return;
    const [f, rest] = [DIRS[s.face], restPoint(s.x, s.z, s.face)];
    const sv = { x: f.z, z: -f.x }; // the sign's side vector
    const at = (ahead: number, abreast: number): XZ => ({ x: s.x + f.x * ahead + sv.x * abreast, z: s.z + f.z * ahead + sv.z * abreast });
    const kept = here.map((n) => ({ x: rest.x + sv.x * 3.8 * n.side - f.x, z: rest.z + sv.z * 3.8 * n.side - f.z })); // where they stand (systems/npcs.ts)
    const first: 1 | -1 = here.length && here[0].side === 1 ? -1 : 1;
    const tries: TraderSpot[] = [];
    for (const side of first === 1 ? ([1, -1] as const) : ([-1, 1] as const)) {
      for (const [ahead, abreast] of TRIES) {
        const p = at(ahead, abreast * side);
        if (Math.hypot(p.x - s.x, p.z - s.z) < FROM_STONE || kept.some((k) => Math.hypot(p.x - k.x, p.z - k.z) < FROM_PERSON)) continue;
        const yaw = yawOf(rest.x - p.x, rest.z - p.z);
        tries.push({ id: traderId(s.id), sign: s.id, region: s.region, side, ...p, yaw, lamp: { x: p.x - Math.sin(yaw) * TRADER_LAMP_BACK, z: p.z - Math.cos(yaw) * TRADER_LAMP_BACK } });
      }
    }
    out.push({ id: traderId(s.id), sign: s.id, region: s.region, tries });
  });
  return out;
}
