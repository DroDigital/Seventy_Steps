/**
 * A horror's place built of the supplied packs' models (round 71; world/places/*.ts: one planner for each, docs/BOSS_PLACES.md): a wall
 * of any outline about the fight's ring, closed all round but for the gate in its front, and what stands in and about it. The planner lays
 * its pieces in the court's frame (world/placeKit.ts) and says the outline of the wall's middle line; this makes of them an enclosure as any
 * other: its gate on that line, the stake and candle in front of the fog and within, the ground levelled to the outline and a margin beyond.
 * The pieces' colliders are their models' own boxes, so a doorway, an arch or a colonnade stays open and a wall is a wall; the closure flood
 * (world/closure.ts, tests/enclosure.test.ts) proves nothing walks in but by the gate. Pure: no Three.js.
 */

import type { V3, XZ } from '../core/geom';
import { HOUSE, type House } from '../data/arenaHouses';
import { STAKE, type Enclosure, type EnclosureSite, type Living, type Signal } from './enclosure';
import { gatePiece } from './houseParts';
import { makeCourt, type Court } from './placeKit';
import { PLACES } from './places';
import { polygonFootprint, type Pad } from './sitePads';

/** What a place's planner says of it, beside the pieces it stood in the court. */
export interface Layout {
  outline: readonly (readonly [number, number])[]; // the wall's middle line as a closed polygon, in the court's frame (a ahead, c to the left); its front edge passes through (ahead, 0)
  ahead: number; // metres from the fight's centre to the gate along the front
  outer?: number; // metres beyond the wall's level ground that dressing stands on (the outline's pad is the wall's `HOUSE.level` and this more)
  rods?: readonly V3[]; // the tips of its lightning rods
  living?: readonly Living[];
  signals?: readonly Signal[]; // round 75: what the court does now and then (a chase of lights, an arc between pylons)
  fogHeight?: number; // metres: the fight's fog, lower than the ring's own, so the place stands over it
  under?: (level: number) => Pad[]; // ground it shapes after the level: a lagoon sunk, a platform raised
  dry?: (p: XZ) => number; // where a body or a piece may stand, apart from the wall's own: negative on it (round 75: a pool's water is not)
}

export type PlaceFn = (court: Court, house: House) => Layout;

/** What is added to an enclosure that is not a place's own (a basin, a river's island): the court's pieces are laid within the walls it has; it may lower the fight's fog. */
export type ExtraFn = (court: Court, house: House, base: Enclosure) => { fogHeight?: number; rods?: readonly V3[] } | void;

/** An outline with a vertex at the gate has a short straight edge across it (STAKE.front metres each way), so the wall is no nearer the stake, standing STAKE.wall in front of the gate, than that. */
function straightFront(outline: Layout['outline'], ahead: number): [number, number][] {
  const i = outline.findIndex(([a, c]) => Math.abs(a - ahead) < 1e-6 && Math.abs(c) < 1e-6);
  const pts = outline.map(([a, c]) => [a, c] as [number, number]);
  if (i < 0) return pts;
  const [prev, next] = [pts[(i + pts.length - 1) % pts.length]!, pts[(i + 1) % pts.length]!];
  const s = Math.sign(next[1] - prev[1]) || 1;
  pts.splice(i, 1, [ahead, -s * STAKE.front], [ahead, 0], [ahead, s * STAKE.front]);
  return pts;
}

/** The place of `boss` about the arena at `s`, its gate at the site's front. */
export function planPlace(h: House, boss: string, s: EnclosureSite): Enclosure {
  const court = makeCourt(s);
  const layout = PLACES[boss]!(court, h);
  const f = s.front;
  const outline = straightFront(layout.outline, layout.ahead).map(([a, c]) => court.put(a, c));
  const edge = polygonFootprint(outline);
  const gate = court.put(layout.ahead, 0);
  const toStake = Math.min(s.radius + STAKE.ring + STAKE.past, layout.ahead - STAKE.wall);
  const [xs, zs] = [[...outline.map((p) => p.x), ...court.props.map((p) => p.x)], [...outline.map((p) => p.z), ...court.props.map((p) => p.z)]];
  const grow = HOUSE.level + (layout.outer ?? 0);
  const footprint = polygonFootprint(outline, grow);
  return {
    kind: 'place',
    gate,
    front: f,
    rect: { x0: Math.min(...xs) - 1, z0: Math.min(...zs) - 1, x1: Math.max(...xs) + 1, z1: Math.max(...zs) + 1 },
    props: court.props,
    piece: gatePiece(h, boss, gate, s.y, f),
    stake: { x: s.x + f.x * toStake, z: s.z + f.z * toStake, yaw: Math.atan2(-f.x, -f.z) },
    rods: layout.rods,
    ...(layout.signals && { signals: layout.signals }),
    living: [...(layout.living ?? []), ...court.emits],
    fogHeight: layout.fogHeight,
    gap: (p) => edge.dist(p.x, p.z),
    pad: (level, blend) => ({ kind: 'shape', shape: footprint, blend, level }),
    ...(layout.dry && { dry: (p: XZ) => Math.max(edge.dist(p.x, p.z), layout.dry!(p)) }), // (within the wall, and on what is dry)
    ...(layout.under && { under: layout.under }),
  };
}

/** An enclosure of its own kind (round 68) with the pieces of a place laid in it: its props, its life and its box grown to hold them. */
export function enrich(base: Enclosure, extra: ExtraFn, h: House, s: EnclosureSite): Enclosure {
  const court = makeCourt(s);
  const more = extra(court, h, base) ?? {};
  const [xs, zs] = [court.props.map((p) => p.x), court.props.map((p) => p.z)];
  const rect = { x0: Math.min(base.rect.x0, ...xs), z0: Math.min(base.rect.z0, ...zs), x1: Math.max(base.rect.x1, ...xs), z1: Math.max(base.rect.z1, ...zs) };
  return { ...base, rect, props: [...base.props, ...court.props], living: [...(base.living ?? []), ...court.emits], rods: [...(base.rods ?? []), ...(more.rods ?? [])], ...(more.fogHeight && { fogHeight: more.fogHeight }) };
}
