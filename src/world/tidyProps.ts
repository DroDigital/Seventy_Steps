/**
 * What the land's planners lay apart, kept apart (2026-11-27, asked of two screenshots of Benefit Street: "find other logic errors"). Each
 * planner keeps its own props off the occupancy, but the occupancy is a coarse disc: a house's wing runs past it, and a tree, stump or log
 * of one stream is laid where another stream's headstone, hedge, fence or trunk already stands. A scan of every realm found a house's wing
 * through its neighbour in Arkham, and trunks through trunks, headstones, crosses, fences and the courts' hedges in eleven realms. Run once
 * every house's wings are known, before the traders' lamps. Pure: no Three.js.
 */

import { propsMeet } from './footprints';
import { colliderReach, type Prop } from './props';

/** What stands on a trunk: a tree, a conifer, a stump, a fallen log. Two of them in one place, or one through anything built, is no growth. */
const TRUNKS: ReadonlySet<Prop['kind']> = new Set(['tree', 'pine', 'stump', 'log']);
const CELL = 8; // metres: props are filed by cells this wide, so each is tried only against those near it
const MARGIN = -0.05; // metres: a touch is allowed, a trunk inside another solid is not

/** The props near each, filed by cell over what their colliders reach. */
function nearby(props: readonly Prop[]): (p: Prop) => Prop[] {
  const cells = new Map<string, Prop[]>();
  const reach = new Map<Prop, number>();
  for (const p of props) {
    const r = colliderReach(p) * 1.5; // (a turned box's corner lies past half its bounds)
    reach.set(p, r);
    if (!r) continue;
    for (let i = Math.floor((p.x - r) / CELL); i <= Math.floor((p.x + r) / CELL); i++) {
      for (let j = Math.floor((p.z - r) / CELL); j <= Math.floor((p.z + r) / CELL); j++) {
        const k = `${i},${j}`;
        (cells.get(k) ?? cells.set(k, []).get(k)!).push(p);
      }
    }
  }
  return (p) => {
    const r = reach.get(p) ?? colliderReach(p) * 1.5;
    const out = new Set<Prop>();
    for (let i = Math.floor((p.x - r) / CELL); i <= Math.floor((p.x + r) / CELL); i++) {
      for (let j = Math.floor((p.z - r) / CELL); j <= Math.floor((p.z + r) / CELL); j++) for (const q of cells.get(`${i},${j}`) ?? []) if (q !== p) out.add(q);
    }
    return [...out];
  };
}

/** Two houses whose walls or wings meet: the later is laid without its wing, and if they still meet, the earlier too. Mutates (`noWing`). */
export function apartHouses(props: readonly Prop[]): void {
  const houses = props.filter((p) => p.kind === 'house');
  const near = nearby(houses);
  houses.forEach((h, i) => {
    for (const o of near(h)) {
      if (houses.indexOf(o) > i || !propsMeet(h, o, MARGIN)) continue;
      h.noWing = true;
      if (propsMeet(h, o, MARGIN)) o.noWing = true;
    }
  });
}

/** Takes up every trunk standing through another solid (the later of two trunks), in place. */
export function clearTrunks(props: Prop[]): void {
  const near = nearby(props);
  const gone = new Set<Prop>();
  for (let i = props.length - 1; i >= 0; i--) {
    const p = props[i]!;
    if (TRUNKS.has(p.kind) && near(p).some((q) => !gone.has(q) && propsMeet(p, q, MARGIN))) gone.add(p);
  }
  for (let i = props.length - 1; i >= 0; i--) if (gone.has(props[i]!)) props.splice(i, 1);
}
