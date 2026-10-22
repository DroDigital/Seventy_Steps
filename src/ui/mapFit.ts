/**
 * Where the full map opens (round 60: it opened on the whole realm, and a new game's few steps of seen ground were a small pale
 * blot in a field of black, which read as a map that was broken or empty). It opens on what has been seen — the ground charted and
 * the investigator within it — with a margin, no nearer than a few hundred metres across, and no wider than the realm. A well-travelled
 * save opens on the whole realm, as it did. Pure: no DOM.
 */

import type { XZ } from '../core/geom';
import type { RegionDef } from '../data/regions';
import { EXPLORE } from '../data/tuning';
import { cellsOf, type Explored } from '../systems/exploration';
import { realmRect } from '../world/mapData';
import { regionRect, type Rect } from '../world/worldMap';

export const OPENING = { margin: 90, least: 300, most: 10 } as const; // metres of margin about what is seen; the least width shown; the closest zoom, of the realm's fit

/** The box about the ground seen in `realm`, or null where none has been. */
export function chartedRect(ex: Explored, realm: readonly RegionDef[]): Rect | null {
  let box: Rect | null = null;
  for (const r of realm) {
    const cells = ex.get(r.id);
    if (!cells) continue;
    const rc = regionRect(r);
    const { cols } = cellsOf(r);
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i]) continue;
      const [x0, z0] = [rc.x0 + (i % cols) * EXPLORE.cell, rc.z0 + Math.floor(i / cols) * EXPLORE.cell];
      box = box
        ? { x0: Math.min(box.x0, x0), z0: Math.min(box.z0, z0), x1: Math.max(box.x1, x0 + EXPLORE.cell), z1: Math.max(box.z1, z0 + EXPLORE.cell) }
        : { x0, z0, x1: x0 + EXPLORE.cell, z1: z0 + EXPLORE.cell };
    }
  }
  return box;
}

/** The scale (pixels a metre) at which the whole realm fits a `w` × `h` screen. */
export function fitScale(realm: readonly RegionDef[], w: number, h: number): number {
  const r = realmRect(realm);
  return Math.min(w / ((r.x1 - r.x0) * 1.1), h / ((r.z1 - r.z0) * 1.15));
}

/** The centre and scale the map opens at: `seen` (what is charted) and `at` (the investigator) with a margin, within the realm's fit and the closest zoom. */
export function openingView(realm: readonly RegionDef[], seen: Rect | null, at: XZ, w: number, h: number): { cx: number; cz: number; scale: number } {
  const fit = fitScale(realm, w, h);
  const box = {
    x0: Math.min(seen?.x0 ?? at.x, at.x) - OPENING.margin,
    z0: Math.min(seen?.z0 ?? at.z, at.z) - OPENING.margin,
    x1: Math.max(seen?.x1 ?? at.x, at.x) + OPENING.margin,
    z1: Math.max(seen?.z1 ?? at.z, at.z) + OPENING.margin,
  };
  const [spanX, spanZ] = [Math.max(box.x1 - box.x0, OPENING.least), Math.max(box.z1 - box.z0, (OPENING.least * h) / w)];
  const scale = Math.min(fit * OPENING.most, Math.max(fit, Math.min(w / spanX, h / spanZ)));
  const whole = scale === fit;
  const rr = realmRect(realm);
  return { cx: whole ? (rr.x0 + rr.x1) / 2 : (box.x0 + box.x1) / 2, cz: whole ? (rr.z0 + rr.z1) / 2 : (box.z0 + box.z1) / 2, scale };
}
