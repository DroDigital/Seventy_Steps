/**
 * A court walled as a reservoir (round 68; data/arenaHouses.ts `Basin`): a dam across the front, straight, with the gate in its middle and
 * a tower at its ends, and from its ends a bank that curves back about the arena, half an ellipse with the dam for its diameter, leaning
 * a little here and there off a true curve as a shore does. The wall about it is the house's own (a dam's embankment), laid in runs by the
 * same runner as a bailey's, so it is as shut as a ring is; the gate, the stake, the candle and the court before the gate stand as a ring's
 * would at the same gate. A spillway may be cut in the dam, a piece of it where dust pours down. Everything is laid in the court's frame
 * (`a` along the front toward the gate, `c` to the left of it). Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { hash2 } from '../core/rng';
import { HOUSE, type House } from '../data/arenaHouses';
import { WORLD } from '../data/tuning';
import { STAKE, type Enclosure, type EnclosureSite, type Living } from './enclosure';
import { facing, gatePiece, tower, towerHalf } from './houseParts';
import { inwardOf, runner } from './houseRuns';
import type { SetLook } from './props';
import { polygonFootprint } from './sitePads';

const ARC = 18; // the bank's edges: the half ellipse is cut into so many straight runs

/** A basin about the arena at `s`, its dam at the site's front. */
export function planBasin(h: House, boss: string, s: EnclosureSite): Enclosure {
  const b = h.basin!;
  const f = s.front;
  const l = { x: -f.z, z: f.x }; // to the left of the front
  const [ahead, side, behind] = [s.radius + b.ahead, s.radius + b.side, s.radius + b.behind];
  const put = (a: number, c: number): XZ => ({ x: s.x + f.x * a + l.x * c, z: s.z + f.z * a + l.z * c });
  const centre = { x: s.x, z: s.z };
  const lateral = h.gate.width / 2 + towerHalf(h) - HOUSE.lap; // the gate's flanking towers' middles: they lap a little over its opening
  const runs = runner(h, s.y);
  const props = runs.props;
  const dam = (a0: number, c0: number, a1: number, c1: number): void => runs.run(put(a0, c0), put(a1, c1), inwardOf(put(a0, c0), put(a1, c1), centre));

  const long = ahead + behind; // the half ellipse: `long` back from the dam, `side` either way along it
  const bank: XZ[] = Array.from({ length: ARC + 1 }, (_, i) => {
    const t = (i / ARC) * Math.PI;
    const [a, c] = [ahead - long * Math.sin(t), side * Math.cos(t)];
    if (i === 0 || i === ARC) return put(a, c); // the dam's ends are the dam's
    const out = Math.hypot((a - ahead) / long ** 2, c / side ** 2) || 1;
    const lean = (hash2(i, 5, WORLD.seed) - 0.5) * 2 * b.wobble; // off the curve, along its normal
    return put(a + (((a - ahead) / long ** 2) / out) * lean, c + ((c / side ** 2) / out) * lean);
  });
  const spill = b.spill;
  const living: Living[] = [];
  if (spill) {
    const [c0, c1] = [spill.at - spill.width / 2, spill.at + spill.width / 2];
    dam(ahead, lateral, ahead, c0); // the dam, to the left of the gate, with the spillway cut in it
    dam(ahead, c1, ahead, side);
    const mid = put(ahead, spill.at);
    const look: SetLook = { id: 'house_spill', scale: 1, tint: h.tint, glow: h.glow, round: false };
    props.push({ kind: 'set', x: mid.x, y: s.y, z: mid.z, w: spill.width / 2 + 0.6, d: h.thick / 2, h: h.height, yaw: facing({ x: -f.x, z: -f.z }), seed: 3600, set: look });
    const lip = put(ahead + h.thick / 2 + 0.3, spill.at);
    living.push({ kind: 'spill', x: lip.x, y: s.y, z: lip.z, top: h.height - 0.6, width: spill.width - 1.2, face: f });
  } else {
    dam(ahead, lateral, ahead, side);
  }
  dam(ahead, -lateral, ahead, -side);
  for (let i = 0; i < ARC; i++) runs.run(bank[i]!, bank[i + 1]!, inwardOf(bank[i]!, bank[i + 1]!, centre)); // the bank, from the dam's left end round the back to its right
  const yaw = facing({ x: -f.x, z: -f.z });
  for (const c of [side, -side]) {
    const at = put(ahead, c);
    props.push(tower(h, s.y, at.x, at.z, yaw, h.tower.height, 2500 + props.length, h.tower.lit)); // a tower where the dam meets the bank
  }
  for (const sign of [-1, 1]) {
    const at = put(ahead, sign * lateral);
    props.push(tower(h, s.y, at.x, at.z, yaw, h.gate.flank, 3000 + sign, true)); // the gate's two towers, each with its fire
  }

  const gate = put(ahead, 0);
  const wallLine = polygonFootprint(bank); // the bank, from the dam's one end to its other, closed by the dam: the wall's middle all round
  const footprint = polygonFootprint(bank, HOUSE.level); // the wall and `HOUSE.level` beyond: what the ground is levelled to
  const [xs, zs] = [bank.map((p) => p.x), bank.map((p) => p.z)];
  const toStake = Math.min(s.radius + STAKE.ring + STAKE.past, ahead - STAKE.wall); // the fallen wake before the fog, a pace in front of it, and never nearer the dam than a body needs

  return {
    kind: 'basin',
    gate,
    front: f,
    rect: { x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs) },
    props,
    piece: gatePiece(h, boss, gate, s.y, f),
    stake: { x: s.x + f.x * toStake, z: s.z + f.z * toStake, yaw: Math.atan2(-f.x, -f.z) },
    living,
    gap: (p) => wallLine.dist(p.x, p.z),
    pad: (level, blend) => ({ kind: 'shape', shape: footprint, blend, level }),
  };
}
