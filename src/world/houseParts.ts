/**
 * The pieces every enclosure of wall is made of (round 67; they were round 63's ring's own): a length of wall, a tower, the gate's
 * flanking towers and the hidden piece that shuts it. Each is a set piece of the kind `set` (their kits, render/setShapesHouse.ts and
 * setShapesTower.ts) whose collider is its box; a piece's `yaw` turns its inward face (+z) toward the court it stands about. Pure.
 */

import type { XZ } from '../core/geom';
import type { HiddenPieceDef } from '../data/arena';
import { HOUSE, type House } from '../data/arenaHouses';
import { GATE_STYLES } from '../data/gateStyles';
import type { Prop, SetLook } from './props';

/** The half breadth of a tower at its foot. */
export const towerHalf = (h: House): number => Math.max(2.2, h.thick * 0.6 + 0.8) + 0.2; // (and a little over, for the ring curves away from a tower's edge)

/** The yaw that turns a piece's inward face toward the way `n` (a unit vector). */
export const facing = (n: XZ): number => Math.atan2(n.x, n.z);

/** The wall's piece with its middle at (x, z), `len` long along its own x, turned to `yaw`. */
export function wall(h: House, y: number, x: number, z: number, yaw: number, len: number, seed: number): Prop {
  const look: SetLook = { id: `house_${h.wall}`, scale: 1, tint: h.tint, glow: h.glow, round: false, ...(h.wall === 'kerb' && h.river && { drop: h.river.depth }) }; // (a river's kerb goes down to its bed)
  return { kind: 'set', x, y, z, w: len / 2, d: h.thick / 2, h: h.height, yaw, seed, set: look };
}

/** A tower with its middle at (x, z), `height` high: the kind the house's towers are. */
export function tower(h: House, y: number, x: number, z: number, yaw: number, height: number, seed: number, lit: boolean | undefined): Prop {
  const half = towerHalf(h);
  const round = h.tower.kind !== 'square';
  const look: SetLook = { id: `house_tower_${h.tower.kind}`, scale: 1, tint: h.tint, glow: h.glow, round, ...(lit && { lit: 'fire' as const }) };
  return { kind: 'set', x, y, z, w: half, d: half, h: height, yaw, seed, set: look };
}

/**
 * The gate: a hidden piece (data/arena.ts) whose seal stands until the horror has been found, and then opens (round 76: its leaves are its
 * horror's, data/gateStyles.ts). `front`: the way out of the gate, which says which way the wall runs (along x at a gate that faces north or
 * south) and which side of it the investigator comes from.
 */
export function gatePiece(h: House, boss: string, gate: XZ, y: number, front: XZ): HiddenPieceDef {
  const alongX = Math.abs(front.z) > 0.5;
  const out = (alongX ? front.z : front.x) >= 0 ? 1 : -1; // (the door's own v runs along the world's z, or its x)
  const open = h.gate.width / 2 + HOUSE.lap; // the seal reaches to the towers, which lap over it
  const [hw, hd] = alongX ? [open, h.thick / 2] : [h.thick / 2, open];
  return {
    name: `${boss}:house`,
    x: gate.x,
    z: gate.z,
    glow: h.glow ?? 'purple',
    boxes: [],
    seal: { boxes: [[0, 0, hw, hd, y - 0.3, y + h.gate.height]], look: h.gate.sealed ? 'sealed' : 'wall' },
    door: { alongX, width: h.gate.width, height: h.gate.height, thick: h.thick, y, ...(GATE_STYLES[boss] && { style: boss, out }) },
  };
}
