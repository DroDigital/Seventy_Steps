/**
 * A horror's house laid on the land (round 63; data/arenaHouses.ts says what it is made of): a ring of wall about its arena, closed all
 * the way round but for the gate at the arena's front, towers at intervals and either side of the gate, and the gate itself, a hidden
 * piece (data/arena.ts) whose seal stands until the horror has been found (systems/discovery.ts) and then draws aside. The pieces are
 * set pieces of the kind `set` (their kits, render/setShapesHouse.ts and setShapesTower.ts) whose colliders are continuous: each
 * wall's piece overlaps the next, and the towers cover where the ring ends at the gate, so a body finds no way through but the gate.
 * Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { HOUSE, type House } from '../data/arenaHouses';
import { STAKE, type EnclosureSite, type RingEnclosure } from './enclosure';
import { gatePiece, tower, towerHalf, wall } from './houseParts';
import type { Prop } from './props';
import { chunkOf, regionAt, walkableChunk } from './worldMap';

/** A house about the arena at `site`, its gate at the site's front: the ring kind of enclosure. */
export function planHouse(h: House, boss: string, s: EnclosureSite): RingEnclosure {
  const P = s.radius + (h.reach ?? HOUSE.reach);
  const gateAt = Math.atan2(s.front.z, s.front.x);
  const half = towerHalf(h);
  const lateral = h.gate.width / 2 + half - HOUSE.lap; // the flanking towers' middles, to either side of the gate's middle: they lap a little over its opening, so no crack is left where a tower's round foot meets the line of the wall
  const edge = Math.asin(Math.min(0.95, lateral / P)); // the angle of them from the gate's axis: the ring begins at the middle of each
  const arc = Math.PI * 2 - 2 * edge;
  const n = Math.max(HOUSE.least, Math.ceil((arc * P) / HOUSE.segment));
  const step = arc / n;
  const len = 2 * P * Math.sin(step / 2) + h.thick * 0.5 + 0.5; // the chord, and enough over to the next that no corner leaves a crack
  const props: Prop[] = [];
  const at = (th: number): [number, number, number] => [s.x + Math.cos(th) * P, s.z + Math.sin(th) * P, Math.atan2(-Math.cos(th), -Math.sin(th))]; // the ring's place at angle `th`, and the yaw that turns a piece's inward face to the centre
  for (let k = 0; k < n; k++) {
    const th = gateAt + edge + (k + 0.5) * step;
    props.push(wall(h, s.y, ...at(th), len, 1000 + k));
    if (k % h.tower.every === h.tower.every - 1) props.push(tower(h, s.y, ...at(th), h.tower.height, 2000 + k, h.tower.lit));
  }
  for (const side of [-1, 1]) props.push(tower(h, s.y, ...at(gateAt + side * edge), h.gate.flank, 3000 + side, true)); // the gate's two towers, each with its fire
  const gate = { x: s.x + s.front.x * P, z: s.z + s.front.z * P };
  const piece = gatePiece(h, boss, gate, s.y, s.front);
  const toStake = s.radius + STAKE.ring + STAKE.past; // the fallen wake before the fog, a pace in front of it: inside the wall, since the wall stands `HOUSE.reach` beyond the ring
  const stake = { x: s.x + s.front.x * toStake, z: s.z + s.front.z * toStake, yaw: Math.atan2(-s.front.x, -s.front.z) };
  const centre = { x: s.x, z: s.z };
  return {
    kind: 'ring',
    radius: P,
    centre,
    gate,
    front: s.front,
    rect: { x0: s.x - P, z0: s.z - P, x1: s.x + P, z1: s.z + P },
    props,
    piece,
    stake,
    gap: (p) => Math.hypot(p.x - s.x, p.z - s.z) - P,
    pad: (level, blend) => ({ kind: 'circle', x: s.x, z: s.z, radius: (h.reach ?? HOUSE.reach) + HOUSE.level + s.radius, blend, level }), // the wall's middle and `HOUSE.level` beyond it: what the ground is levelled to
  };
}

/** Whether a court laid out from the gate of a house about (`x`, `z`) with a ring of `radius`, facing `front`, has land of the realm to lie on: every place of its first stretch, and a little to either side, is in the region and walkable. */
export function courtLand(region: string, x: number, z: number, radius: number, front: XZ, reach = 0): boolean {
  const gate = radius + (reach || HOUSE.reach);
  for (let d = 0; d <= HOUSE.court; d += 6) {
    for (const side of [-9, 0, 9]) {
      const [px, pz] = [x + front.x * (gate + d) - front.z * side, z + front.z * (gate + d) + front.x * side];
      if (regionAt(px, pz)?.id !== region || !walkableChunk(chunkOf(px), chunkOf(pz))) return false;
    }
  }
  return true;
}
