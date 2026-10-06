import * as THREE from 'three';
import { DUNGEON } from '../src/data/tuning';
import { floorRange, kitOfRoom } from '../src/world/dungeonKit';
import type { Dungeon } from '../src/world/placements';
import { FaceGrid, dungeonFaces, judge, pos } from './rayAudit';

/**
 * What the eye meets from outside and above (round 45: a recording showed a rectangle of sky through the top of a
 * mound over a dungeon's gate and a dashed seam along its ridge; the audits of rayAudit.ts only ever stood inside
 * the rooms). Straight down over every roofed room's footprint, the first face met must be the shell (the heap or
 * the roof) and face up: the underside of a ceiling is not drawn from above, so a ray that first meets one, or
 * nothing, or a floor or a wall's top, is a hole in the top. Slanted rays from above then look, as inside, for
 * faces of another look lying within a few centimetres of one another and facing the same way.
 */

export interface Roof {
  kind: 'hole' | 'bare' | 'back' | 'fight';
  dungeon: string;
  room: string;
  key: string;
  at: string;
}

const STEP = 0.75;

/** Whether this room is meant to be seen from above as a closed top: a heap or a roof over it, and not buried or open. */
function roofed(d: Dungeon, room: Dungeon['layout']['rooms'][number]): boolean {
  const kit = kitOfRoom(d.layout, room);
  if (kit.roof === 'open') return false;
  if (floorRange(room)[1] + DUNGEON.height + 0.9 < d.layout.base - 0.5) return false; // buried: the ground is over its heap
  if (kit.shell === 'mound') return true;
  return kit.shell === 'building' && floorRange(room)[0] >= d.layout.base - 1.5;
}

export function auditRoof(d: Dungeon): Roof[] {
  const grid = new FaceGrid(dungeonFaces(d));
  const out = new Map<string, Roof & { n: number }>();
  const note = (kind: Roof['kind'], room: string, key: string, at: string): void => {
    const k = `${kind} ${key} ${room}`;
    const e = out.get(k);
    if (e) e.n++;
    else out.set(k, { kind, dungeon: d.layout.def.id, room, key, at, n: 1 });
  };
  const high = grid.bounds.max.y + 5;
  const down = new THREE.Vector3(0, -1, 0);
  for (const room of d.layout.rooms) {
    if (!roofed(d, room)) continue;
    const half = room.half - 0.2; // within the walls' inner faces: the heap's own edge is the ground's business
    for (let x = -half; x <= half; x += STEP) {
      for (let z = -half; z <= half; z += STEP) {
        const from = new THREE.Vector3(room.x + x, high, room.z + z);
        const hits = grid.cast(from, down, 400);
        const a = hits[0];
        if (!a) note('hole', room.def.id, 'nothing under the top', `at ${pos(from)}`);
        else if (!a.front && !hits.some((h) => h.front && Math.abs(h.t - a.t) < 1e-3 && h.face.n.dot(a.face.n) < -0.99)) note('back', room.def.id, `underside first: ${a.face.tag.replace(/#.*/, '')}`, `at ${pos(from)}, ${a.face.tag}`);
        else if (a.front && !a.face.tag.includes('@shell')) note('bare', room.def.id, `${a.face.tag.replace(/#.*/, '')} shows from above`, `at ${pos(from)}, ${a.face.tag}`);
      }
    }
  }
  const dirs: THREE.Vector3[] = [];
  for (let a = 0; a < 12; a++) for (const el of [-75, -55, -35]) {
    const [az, e] = [((a + 0.37) / 12) * Math.PI * 2, (el * Math.PI) / 180];
    dirs.push(new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e)));
  }
  for (const room of d.layout.rooms) {
    if (!roofed(d, room)) continue;
    const span = room.half + DUNGEON.wall;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const from = new THREE.Vector3(room.x + ((i + 0.5) / 4 - 0.5) * 2 * span, high - 2, room.z + ((j + 0.5) / 4 - 0.5) * 2 * span);
      for (const dir of dirs) {
        const hits = grid.cast(from, dir, 400, 3);
        const wrong = judge(hits, from, dir);
        if (wrong && wrong.kind === 'fight') note('fight', room.def.id, wrong.key, wrong.at);
      }
    }
  }
  return [...out.values()].filter((f) => f.kind !== 'fight' || f.n >= 3).map(({ n, ...f }) => ({ ...f, key: `${f.key} (${n} rays)` })); // (a line where two surfaces cross is a ray or two; a seam is many)
}
