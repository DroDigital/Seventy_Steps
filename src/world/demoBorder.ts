/**
 * The demo's border (round 56): where the land of its realms (systems/demo.ts) meets land beyond them, as straight runs
 * along the chunk grid, each with the side the demo lies on. The investigator is held at it (systems/demo.ts) and a bank
 * of mist stands along it (render/demoMist.ts). Where the demo's land meets the sea there is no border: that edge is the
 * world's own. Pure.
 */

import type { XZ } from '../core/geom';
import { REGIONS } from '../data/regions';
import { WORLD } from '../data/tuning';
import { chunkOf, regionOfChunk, regionRect } from './worldMap';

export interface BorderRun {
  a: XZ; // its ends, along one grid line
  b: XZ;
  inward: XZ; // the unit step toward the demo
}

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** Every run of the border between the realms `kept` and the land beyond them. */
export function borderRuns(kept: ReadonlySet<string>): BorderRun[] {
  const s = WORLD.chunk;
  const lines = new Map<string, { run: BorderRun; from: number; to: number }[]>(); // edges by grid line and facing
  for (const r of REGIONS.filter((x) => kept.has(x.id))) {
    const rc = regionRect(r);
    for (let cx = chunkOf(rc.x0); cx < chunkOf(rc.x1); cx++) for (let cz = chunkOf(rc.z0); cz < chunkOf(rc.z1); cz++) {
      for (const [dx, dz] of SIDES) {
        const n = regionOfChunk(cx + dx, cz + dz);
        if (!n || kept.has(n.id)) continue;
        const alongX = dz !== 0; // a north or south edge runs along x
        const at = alongX ? (dz > 0 ? cz + 1 : cz) * s : (dx > 0 ? cx + 1 : cx) * s;
        const from = (alongX ? cx : cz) * s;
        const key = `${alongX ? 'z' : 'x'}${at}:${dx},${dz}`;
        const run: BorderRun = { a: alongX ? { x: from, z: at } : { x: at, z: from }, b: alongX ? { x: from + s, z: at } : { x: at, z: from + s }, inward: { x: -dx, z: -dz } };
        lines.set(key, [...(lines.get(key) ?? []), { run, from, to: from + s }]);
      }
    }
  }
  const runs: BorderRun[] = [];
  for (const edges of lines.values()) { // edges on one line, end to end, become one run
    edges.sort((p, q) => p.from - q.from);
    let cur = { ...edges[0]!.run };
    let to = edges[0]!.to;
    for (const e of edges.slice(1)) {
      if (e.from !== to) { // a gap: the run so far is done
        runs.push(cur);
        cur = { ...e.run };
      } else cur.b = e.run.b;
      to = e.to;
    }
    runs.push(cur);
  }
  return runs;
}
