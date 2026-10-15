import * as THREE from 'three';
import { kitOfRoom } from '../src/world/dungeonKit';
import type { Dungeon } from '../src/world/placements';
import { bankEnds, grounded } from '../src/world/moundBanks';
import { DIRS } from '../src/world/worldMap';
import { FaceGrid, dungeonFaces, pos } from './rayAudit';

/**
 * What stands out of a mound from outside (round 46: a recording showed the top course of a dungeon's outer wall
 * through the earth heaped over it, in a notch of sky). rayAudit.ts stands inside the rooms and roofAudit.ts looks
 * down on the tops; this one stands on the ground about each mound-shelled dungeon and looks at it from every side.
 * The earth is drawn over a mound's walls, so a ray from outside must meet the heap first. A ray whose first face is
 * the outside of an outer wall of such a room, standing above the ground, is a wall showing through.
 */

export interface Outside {
  dungeon: string;
  room: string;
  key: string;
  at: string;
  rise: number; // metres above the entrance's ground where the wall is seen
  deg: number; // the view's elevation
  ends: string; // how the bank meets each end of the wall
  span: string; // the wall's extent (min to max)
}

const MARGIN = 2; // metres the eyes stand beyond the dungeon's bounds
const EVERY = 4; // metres between eyes along the ring
const AZIMUTHS = 24;
const ELEVATIONS = [0, 8, 16, 26, 38]; // degrees: level with the ground up to the crest
const EYE = 1.7; // a standing eye

/** Eyes on the ground in a ring about the dungeon's bounds, each a metre and a half up. */
function* ring(d: Dungeon, box: THREE.Box3): Generator<THREE.Vector3> {
  const [x0, x1] = [box.min.x - MARGIN, box.max.x + MARGIN];
  const [z0, z1] = [box.min.z - MARGIN, box.max.z + MARGIN];
  const y = d.layout.base + EYE;
  for (let x = x0; x <= x1; x += EVERY) {
    yield new THREE.Vector3(x, y, z0);
    yield new THREE.Vector3(x, y, z1);
  }
  for (let z = z0 + EVERY; z < z1; z += EVERY) {
    yield new THREE.Vector3(x0, y, z);
    yield new THREE.Vector3(x1, y, z);
  }
}

/** The part a face belongs to is its `#k` in the audit's tag (the heap and the ground are `#-`). */
function partOf(d: Dungeon, tag: string) {
  const k = /#(\d+)$/.exec(tag);
  return k ? d.parts[Number(k[1])] : undefined;
}

/** The first face met is the outside of a mound room's outer wall, standing above the ground: a wall through the earth. */
function wallShowing(d: Dungeon, face: { tag: string; n: THREE.Vector3 }, o: THREE.Vector3, dir: THREE.Vector3, t: number, deg: number): Outside | null {
  const part = partOf(d, face.tag);
  if (!part || part.shape !== 'box' || part.outer === undefined) return null;
  const room = d.layout.rooms[part.room];
  if (kitOfRoom(d.layout, room).shell !== 'mound') return null;
  if (!grounded(d.layout, part)) return null; // a lintel over a way in stands bare by design, its top closed by a brow
  const out = DIRS[part.outer];
  const n = face.n;
  if (Math.abs(n.y) > 0.3 || n.x * out.x + n.z * out.z < 0.7) return null; // an inner face or a jamb, not the wall's outside
  const at = o.clone().addScaledVector(dir, t);
  if (at.y < d.layout.base + 0.3) return null; // below the ground: the ground itself is not in the geometry
  return { dungeon: d.layout.rooms[0]?.def.id ?? '?', room: room.def.id, key: `${room.def.id} ${part.outer}`, at: pos(at), rise: at.y - d.layout.base, deg, ends: bankEnds(d.layout, d.parts, part).join('/'), span: `${part.min.x},${part.min.z}..${part.max.x},${part.max.z} y${part.min.y}..${part.max.y}` };
}

export function auditOutside(d: Dungeon): Outside[] {
  const grid = new FaceGrid(dungeonFaces(d));
  const found = new Map<string, Outside>();
  for (const from of ring(d, grid.bounds)) {
    for (let a = 0; a < AZIMUTHS; a++) {
      for (const deg of ELEVATIONS) {
        const az = (a / AZIMUTHS) * Math.PI * 2;
        const el = (deg * Math.PI) / 180;
        // a sliver off the grid, so no ray runs exactly along an edge where two faces meet (a seam is watertight but a ray on it slips)
        const dir = new THREE.Vector3(Math.sin(az + 0.0047) * Math.cos(el + 0.0029), Math.sin(el + 0.0029), Math.cos(az + 0.0047) * Math.cos(el + 0.0029)).normalize();
        const first = grid.cast(from.clone().add(new THREE.Vector3(0.0209, 0, 0.0053)), dir, 80)[0];
        if (!first) continue;
        const bad = wallShowing(d, first.face, from, dir, first.t, deg);
        if (bad && !found.has(bad.key)) found.set(bad.key, bad);
      }
    }
  }
  return [...found.values()];
}
