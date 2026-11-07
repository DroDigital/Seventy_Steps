/**
 * Where an edit stands in the world, before and after (round 110, development builds only): the
 * chunks a change asks to be built again, and the place an edit in the list is framed at. Pure.
 */

import { REGIONS } from '../data/regions';
import { editKey } from '../world/edits/editFile';
import type { WorldEdit } from '../world/edits/editTypes';
import { chunkKey, chunkOf, regionRect } from '../world/worldMap';

/** The points an edit names: a prop's old spot and its new one; an added thing's; a site's; a moved post's. */
export function spotsOf(e: WorldEdit | undefined): [number, number][] {
  if (!e) return [];
  if ('add' in e) return 'foe' in e ? [[e.foe.x, e.foe.z]] : [[e.prop.x, e.prop.z]];
  if ('site' in e) {
    const def = REGIONS.find((r) => r.id === e.site.region);
    return def ? [[regionRect(def).x0 + e.set.at[0], regionRect(def).z0 + e.set.at[1]]] : [];
  }
  if ('spawn' in e) return 'set' in e && e.set.x !== undefined && e.set.z !== undefined ? [[e.set.x, e.set.z]] : [];
  const from: [number, number] = [e.prop.at[0], e.prop.at[1]];
  if (!('set' in e) || (e.set.x === undefined && e.set.z === undefined)) return [from];
  return [from, [e.set.x ?? from[0], e.set.z ?? from[1]]];
}

/** The chunks about every point of every edit that differs between `prev` and `next`. */
export function touchedChunks(prev: readonly WorldEdit[], next: readonly WorldEdit[]): number[] {
  const [a, b] = [new Map(prev.map((e) => [editKey(e), e])), new Map(next.map((e) => [editKey(e), e]))];
  const out = new Set<number>();
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    if (JSON.stringify(a.get(k)) === JSON.stringify(b.get(k))) continue;
    for (const [x, z] of [...spotsOf(a.get(k)), ...spotsOf(b.get(k))]) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) out.add(chunkKey(chunkOf(x) + dx, chunkOf(z) + dz));
  }
  return [...out];
}
