/**
 * A court walled in a rectangle (round 67; data/arenaHouses.ts `Bailey`): a curtain wall about the arena's ring, closed all round but
 * for the gate in its front, with a tower at each corner and at intervals along it, the gate's flanking towers with a gatehouse across
 * them, and, at the back, a keep standing on the wall's line, its front face the wall and its mass behind it. Everything is laid in the
 * frame of the court (`a` along the front, toward the gate; `c` to the left of it), so the wall, the stake, the candle and the court
 * before the gate stand as a ring's would at the same gate. Its pieces overlap end to end and the towers cover each corner, so a body
 * finds no way through but the gate (tests/enclosure.test.ts floods every place to prove it). Pure: no Three.js.
 */

import type { V3, XZ } from '../core/geom';
import { HOUSE, type House } from '../data/arenaHouses';
import { STAKE, type Enclosure, type EnclosureSite } from './enclosure';
import { facing, gatePiece, tower, towerHalf } from './houseParts';
import { runner } from './houseRuns';
import type { SetLook } from './props';
import { polygonFootprint } from './sitePads';

/** A bailey about the arena at `s`, its gate at the site's front. */
export function planBailey(h: House, boss: string, s: EnclosureSite): Enclosure {
  const b = h.bailey!;
  const f = s.front;
  const l = { x: -f.z, z: f.x }; // to the left of the front
  const [ahead, side, behind] = [s.radius + b.ahead, s.radius + b.side, s.radius + b.behind];
  const put = (a: number, c: number): XZ => ({ x: s.x + f.x * a + l.x * c, z: s.z + f.z * a + l.z * c });
  const inward = { front: { x: -f.x, z: -f.z }, left: { x: -l.x, z: -l.z }, right: l, back: f }; // the way a face looks, toward the court
  const lateral = h.gate.width / 2 + towerHalf(h) - HOUSE.lap; // the gate's flanking towers' middles, to either side of its middle: they lap a little over its opening
  const keepHalf = b.keep ? b.keep.width / 2 : 0;
  const runs = runner(h, s.y);
  const props = runs.props;
  const run = (a0: number, c0: number, a1: number, c1: number, n: XZ): void => runs.run(put(a0, c0), put(a1, c1), n); // (a run from one place of the court's frame to another)

  run(ahead, lateral, ahead, side, inward.front); // the front, either side of the gate
  run(ahead, -lateral, ahead, -side, inward.front);
  run(ahead, side, -behind, side, inward.left); // the sides
  run(ahead, -side, -behind, -side, inward.right);
  if (b.keep) {
    run(-behind, side, -behind, keepHalf - 0.5, inward.back); // the back, from each corner to the keep, which it overlaps a little
    run(-behind, -side, -behind, -keepHalf + 0.5, inward.back);
  } else {
    run(-behind, side, -behind, -side, inward.back);
  }
  for (const [a, c] of [[ahead, side], [ahead, -side], [-behind, side], [-behind, -side]] as const) {
    const at = put(a, c);
    props.push(tower(h, s.y, at.x, at.z, facing(inward.front), h.tower.height, 2500 + props.length, h.tower.lit)); // a tower at each corner
  }
  for (const sign of [-1, 1]) {
    const at = put(ahead, sign * lateral);
    props.push(tower(h, s.y, at.x, at.z, facing(inward.front), h.gate.flank, 3000 + sign, true)); // the gate's two towers, each with its fire
  }

  const gate = put(ahead, 0);
  const rods: V3[] = [];
  if (b.gatehouse) {
    const [from, top] = [h.gate.height + 0.5, b.gatehouse.height]; // the span stands clear above a body (a collider only reaches down to its own foot)
    const look: SetLook = { id: 'house_gatehouse', scale: 1, tint: h.tint, glow: h.glow, round: false, rod: b.gatehouse.rod };
    props.push({ kind: 'set', x: gate.x, y: s.y + from, z: gate.z, w: lateral, d: h.thick / 2 + 0.4, h: top - from, yaw: facing(inward.front), seed: 3500, set: look });
    rods.push({ x: gate.x, y: s.y + top + HOUSE.rodTip + b.gatehouse.rod, z: gate.z });
  }
  if (b.keep) {
    const at = put(-behind - b.keep.depth / 2, 0);
    const look: SetLook = { id: 'house_keep', scale: 1, tint: h.tint, glow: h.glow, round: false, rod: b.keep.rod };
    props.push({ kind: 'set', x: at.x, y: s.y, z: at.z, w: keepHalf, d: b.keep.depth / 2, h: b.keep.height, yaw: facing(inward.back), seed: 4000, set: look });
    rods.push({ x: at.x, y: s.y + b.keep.height + HOUSE.rodTip + b.keep.rod, z: at.z });
  }

  const corners = [put(ahead, -side), put(ahead, side), put(-behind, side), put(-behind, -side)];
  const outline = b.keep ? [put(ahead, -side), put(ahead, side), put(-behind, side), put(-behind, keepHalf), put(-behind - b.keep.depth, keepHalf), put(-behind - b.keep.depth, -keepHalf), put(-behind, -keepHalf), put(-behind, -side)] : corners;
  const footprint = polygonFootprint(outline, HOUSE.level); // the wall, the keep and `HOUSE.level` beyond: what the ground is levelled to
  const [xs, zs] = [outline.map((p) => p.x), outline.map((p) => p.z)];
  const toStake = Math.min(s.radius + STAKE.ring + STAKE.past, ahead - STAKE.wall); // the fallen wake before the fog, a pace in front of it, and never nearer the wall than a body needs
  const [mid, half] = [(ahead - behind) / 2, (ahead + behind) / 2]; // the court's rectangle in its own frame

  return {
    kind: 'bailey',
    gate,
    front: f,
    rect: { x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs) },
    props,
    piece: gatePiece(h, boss, gate, s.y, f),
    stake: { x: s.x + f.x * toStake, z: s.z + f.z * toStake, yaw: Math.atan2(-f.x, -f.z) },
    rods,
    gap(p) {
      const [dx, dz] = [p.x - s.x, p.z - s.z];
      const [qa, qc] = [Math.abs(dx * f.x + dz * f.z - mid) - half, Math.abs(dx * l.x + dz * l.z) - side]; // the signed distance to a rectangle
      return Math.hypot(Math.max(qa, 0), Math.max(qc, 0)) + Math.min(Math.max(qa, qc), 0);
    },
    pad: (level, blend) => ({ kind: 'shape', shape: footprint, blend, level }),
  };
}
