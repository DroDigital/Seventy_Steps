/**
 * Round 116, a prop set down on sloping land meets it. The planners stand a prop at the height of the ground under its middle
 * (world/props.ts `makeProp`), so on a slope its downhill side stood over the air: a house's footing a metre and a half over a hillside
 * in Vermont, a field wall's far end in Dunwich, a boulder's rim, a pyramid's corner. Render only, after a piece is turned and placed
 * (propMeshes.ts): the plan, its colliders, the critters' perches and the world editor's targets are as they were.
 *  - `rigid` (a house, a ruin, a stone, a landmark): every vertex at the prop's foot (no higher than the ground under its middle) is
 *    lowered by as far as the lowest ground under the prop lies below its middle's, so its footing or base stands in the land all
 *    round; nothing above the foot moves, and what goes below the land is hidden by it.
 *  - `drape` (a field wall, a fence, a fallen log): every vertex rises and falls with the land under it, so a wall keeps its height
 *    along a slope as a dry-stone wall does, and its foot is a little deeper than it was, for the ground between two of its stones.
 * A prop that does not stand on the land (on a dungeon's floor, an arena's terrace, a deck) is left as it was, as is a set piece.
 */

import type * as THREE from 'three';
import type { PropKind } from '../data/regions';
import type { Prop } from '../world/props';

export type SettleMode = 'rigid' | 'drape';

/** How each kind of prop meets a slope; a kind not named stands as it was placed (a tree's trunk, a lamp's post and a grave are too narrow to show it). */
export const SETTLE: Partial<Record<PropKind, SettleMode>> = {
  house: 'rigid', ruin: 'rigid', rock: 'rigid', monolith: 'rigid', pillar: 'rigid', altar: 'rigid', firepit: 'rigid',
  spire: 'rigid', tower: 'rigid', cone: 'rigid', pyramid: 'rigid', block: 'rigid',
  wall: 'drape', fence: 'drape', log: 'drape',
};

export const SETTLE_TUNING = {
  foot: 0.02, // metres above the ground under its middle that a vertex is still the prop's foot (the mesh stands 0.15 below that ground)
  margin: 0.05, // and what a foot is set below the lowest ground, for the land's mesh, which runs straight between its samples
  sink: 0.08, // metres a draped prop's foot goes deeper, for the ground between two of its vertices
  stand: 0.05, // metres between the prop's height and the ground under its middle within which it stands on the land
  least: 0.02, // a slope that lowers a foot by less than this leaves it
};

type Ground = (x: number, z: number) => number;

/** The ground under a prop's footprint, at its middle, its rim and between (a box's 3 × 3 and its corners, a round prop's ring of eight), and under each of its feet. */
function lowestUnder(p: Prop, ground: Ground, feet: readonly number[]): number {
  let low = ground(p.x, p.z);
  const [s, c] = [Math.sin(p.yaw), Math.cos(p.yaw)];
  const at = (lx: number, lz: number): void => void (low = Math.min(low, ground(p.x + lx * c + lz * s, p.z - lx * s + lz * c)));
  if (p.d <= 0) for (let i = 0; i < 8; i++) at(Math.sin(i * Math.PI / 4) * p.w, Math.cos(i * Math.PI / 4) * p.w);
  else for (const u of [-1, 0, 1]) for (const v of [-1, 0, 1]) at(u * p.w, v * p.d);
  for (let i = 0; i < feet.length; i += 2) low = Math.min(low, ground(feet[i], feet[i + 1]));
  return low;
}

/** Carries the placed pieces (world coordinates) of prop `p` down onto the land `ground` it stands on, by its kind's mode, all by one measure. Returns how far its foot went down (0: not at all). */
export function settleOnLand(geos: readonly (THREE.BufferGeometry | undefined)[], p: Prop, ground: Ground): number {
  const mode = SETTLE[p.kind];
  if (!mode || p.set) return 0;
  const middle = ground(p.x, p.z);
  if (Math.abs(p.y - middle) > SETTLE_TUNING.stand) return 0;
  const top = p.y + SETTLE_TUNING.foot;
  const all = geos.filter((g): g is THREE.BufferGeometry => !!g).map((g) => g.getAttribute('position') as THREE.BufferAttribute);
  if (mode === 'drape') {
    let most = 0;
    for (const pos of all) {
      for (let i = 0; i < pos.count; i++) {
        const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        const dy = ground(x, z) - p.y - (y <= top ? SETTLE_TUNING.sink : 0);
        if (Number.isFinite(dy)) pos.setY(i, y + dy), (most = Math.max(most, -dy));
      }
      pos.needsUpdate = true;
    }
    return most;
  }
  const feet: number[] = [];
  for (const pos of all) for (let i = 0; i < pos.count; i++) if (pos.getY(i) <= top) feet.push(pos.getX(i), pos.getZ(i));
  if (!feet.length) return 0;
  const drop = p.y - lowestUnder(p, ground, feet) + SETTLE_TUNING.margin;
  if (!(drop > SETTLE_TUNING.least + SETTLE_TUNING.margin)) return 0;
  for (const pos of all) {
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) <= top) pos.setY(i, pos.getY(i) - drop);
    pos.needsUpdate = true;
  }
  return drop;
}
