/**
 * A court on an island in a river (round 68; data/arenaHouses.ts `River`; Lovecraft's "the unpeopled island in the river" in the dark
 * valley of the white stone): the ring of the fight stands on an island, and about the island a river runs in a bed sunk below the land,
 * kept between two kerbs, the bank's (a ring of wall, as any house's: its towers are the bank's balefires, its gate where the ford
 * begins, `arenaHouse.ts`) and the island's. One ford of flat stones, kerbed on both sides, crosses the river from the gate to the
 * island; the inner kerb is open where it lands. A body cannot enter the river: both banks are kerbs a body does not climb, and the ford's
 * are the only way across, so the closure flood (world/closure.ts) proves it shut as it does a ring. What is dry within the wall is the
 * island and the ford (`dry`), where the court's set, the stake and the candle are placed; the river's bed is shaped after the level
 * ground (`under`: the bed sunk, the ford raised across it). Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import type { House } from '../data/arenaHouses';
import { HOUSE } from '../data/arenaHouses';
import { planHouse } from './arenaHouse';
import type { Enclosure, EnclosureSite, Living } from './enclosure';
import { wall } from './houseParts';
import { polygonFootprint, type Footprint, type Pad } from './sitePads';
import type { Prop } from './props';

/** How far the surface of the river lies below the bed's depth: the share of the depth the water fills. */
export const WATER = 0.55;

/** A river about the arena at `s`, its ford running out of the gate at the site's front. */
export function planRiver(h: House, boss: string, s: EnclosureSite): Enclosure {
  const r = h.river!;
  const bank = planHouse(h, boss, s); // the outer kerb: a ring, its balefire towers, the gate where the ford begins
  const P = bank.radius;
  const Ri = s.radius + r.island; // the island's kerb
  const [f, thick] = [s.front, h.thick];
  const l = { x: -f.z, z: f.x };
  const put = (a: number, c: number): XZ => ({ x: s.x + f.x * a + l.x * c, z: s.z + f.z * a + l.z * c });
  const props: Prop[] = [...bank.props];

  const gateAt = Math.atan2(f.z, f.x);
  const n = Math.max(HOUSE.least, Math.ceil((Math.PI * 2 * Ri) / HOUSE.segment));
  const step = (Math.PI * 2) / n;
  const len = 2 * Ri * Math.sin(step / 2) + thick * 0.5 + 0.5;
  for (let k = 0; k < n; k++) { // the island's kerb, round, open where the ford lands
    const th = gateAt + (k + 0.5) * step;
    const off = Math.abs(Ri * Math.sin(th - gateAt));
    if (Math.cos(th - gateAt) > 0 && off - len / 2 < r.ford / 2) continue; // (a piece whose end would reach into the ford's mouth is left out)
    props.push(wall(h, s.y, s.x + Math.cos(th) * Ri, s.z + Math.sin(th) * Ri, Math.atan2(-Math.cos(th), -Math.sin(th)), len, 5000 + k));
  }
  const from = Ri - 0.5; // the ford's two kerbs, from the island to the gate's towers
  const pieces = Math.max(1, Math.ceil((P - from) / HOUSE.segment));
  for (const sign of [-1, 1]) {
    const c = sign * (r.ford / 2 + thick / 2);
    const [a0, a1] = [from, P - 0.5];
    const long = (a1 - a0) / pieces;
    for (let k = 0; k < pieces; k++) {
      const at = put(a0 + (k + 0.5) * long, c);
      props.push(wall(h, s.y, at.x, at.z, Math.atan2(-sign * l.x, -sign * l.z), long + thick * 0.5 + 0.5, 6000 + k + (sign > 0 ? 50 : 0))); // (its inward face toward the ford, and its stones laid end to end on it)
    }
  }

  const [bedIn, bedOut] = [Ri + thick / 2, P - thick / 2]; // the river between the kerbs' faces
  const bed: Footprint = { bounds: { x0: s.x - bedOut, z0: s.z - bedOut, x1: s.x + bedOut, z1: s.z + bedOut }, dist: (x, z) => { const d = Math.hypot(x - s.x, z - s.z); return Math.max(bedIn - d, d - bedOut); } };
  const ford = polygonFootprint([put(Ri - 1, r.ford / 2 + thick), put(P + 1, r.ford / 2 + thick), put(P + 1, -r.ford / 2 - thick), put(Ri - 1, -r.ford / 2 - thick)]);
  const dry = (p: XZ): number => {
    const [dx, dz] = [p.x - s.x, p.z - s.z];
    const [a, c] = [dx * f.x + dz * f.z, dx * l.x + dz * l.z];
    const island = Math.hypot(dx, dz) - (Ri - thick / 2);
    const way = Math.max(Math.abs(c) - r.ford / 2, Ri - thick / 2 - a, a - P); // (the ford, between its kerbs, from the island to the gate)
    return Math.min(island, way);
  };
  const living: Living[] = [{ kind: 'river', x: s.x, y: s.y, z: s.z, inner: bedIn, outer: bedOut, level: r.depth * WATER, ford: r.ford + thick, front: f }];
  return {
    ...bank,
    kind: 'river',
    props,
    living,
    dry,
    under: (level): Pad[] => [{ kind: 'shape', shape: bed, blend: 1.2, level: level - r.depth }, { kind: 'shape', shape: ford, blend: 0.5, level }],
  };
}
