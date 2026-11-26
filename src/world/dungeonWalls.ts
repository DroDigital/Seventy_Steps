/**
 * A dungeon's walls (split from dungeonParts.ts in round 125): every wall segment on a room boundary, each shared edge once, with
 * its doorways and lintels, a hidden doorway's piece, and (round 125) the second ways of world/dungeonLinks.ts: a drop's doorway
 * stands on a ledge, its face a wall from the lower floor up to the doorway's sill; a window is an opening at a person's chest
 * above the higher floor, barred by a grate that stops feet and eyes but is drawn as bars the picture sees between. Pure.
 */

import type { HiddenPieceDef, LayerBox } from '../data/arena';
import type { Veil } from '../data/dungeons';
import { DUNGEON, LINK } from '../data/tuning';
import type { Collider } from './colliders';
import { floorRange, roomAt, type DoorLayout, type DungeonLayout } from './dungeonKit';
import type { Part } from './dungeonParts';
import { ABYSS, abyssOpening, wallFoot } from './abyssStair';
import { DIRS } from './worldMap';

export const glowOf = (v: Veil): 'purple' | 'magenta' => (v.minInsight !== undefined || v.minSeals !== undefined || v.met !== undefined ? 'purple' : 'magenta');

/** A hidden doorway: glowing jambs and lintel while shown, plain wall while hidden. */
function doorPiece(o: DoorLayout, name: string, veil: Veil): HiddenPieceDef {
  const { door: D, wall: T, lintel } = DUNGEON;
  const alongX = DIRS[o.side].z !== 0; // the wall runs along x
  const box = (along: number, a: number, t: number, y0: number, y1: number): LayerBox => (alongX ? [along, 0, a, t, y0, y1] : [0, along, t, a, y0, y1]);
  const L = o.level;
  return {
    name, x: o.x, z: o.z, ...veil, glow: glowOf(veil),
    boxes: [box(-(D / 2 + 0.12), 0.12, T / 2 + 0.05, L, L + lintel), box(D / 2 + 0.12, 0.12, T / 2 + 0.05, L, L + lintel), box(0, D / 2 + 0.24, T / 2 + 0.05, L + lintel, L + lintel + 0.2)],
    seal: { boxes: [box(0, D / 2, T / 2, L - 0.3, L + lintel)], look: veil.minSeals !== undefined || veil.met !== undefined ? 'sealed' : 'wall' }, // (a door kept by someone, round 123, is sealed as Kadath's is: it is seen to be shut)
    door: { alongX, width: D, height: lintel, thick: T, y: L },
  };
}

/** The name of a doorway's hidden piece: the room it leads into (a link's: its two rooms, round 125). */
export const doorName = (d: DungeonLayout, o: DoorLayout): string => `${d.def.name}: ${o.link ? `${o.link.from.def.id}>${o.link.to.def.id}` : o.b?.def.id ?? 'door'}`;

/** What a doorway keeps open: its opening, and half a metre either way through the wall's thickness and beyond it, up to the lintel. Nothing is set in it (round 20: a shrine's stone stood in one). */
export function doorwayClear(o: DoorLayout): Collider {
  const { door: D, wall: T, lintel } = DUNGEON;
  const [hx, hz] = DIRS[o.side].z !== 0 ? [D / 2, T / 2 + 0.5] : [T / 2 + 0.5, D / 2];
  return { kind: 'box', min: { x: o.x - hx, y: o.level, z: o.z - hz }, max: { x: o.x + hx, y: o.level + lintel, z: o.z + hz } };
}

/** What stands before a window (round 125): a pace either side of it is kept clear, so that it is come up to and looked through. */
export function windowClear(o: DoorLayout): Collider {
  const { wall: T } = DUNGEON;
  const [hx, hz] = DIRS[o.side].z !== 0 ? [LINK.windowWidth / 2 + 0.4, T / 2 + 1.4] : [T / 2 + 1.4, LINK.windowWidth / 2 + 0.4];
  return { kind: 'box', min: { x: o.x - hx, y: o.level - 4, z: o.z - hz }, max: { x: o.x + hx, y: o.level + LINK.windowTop, z: o.z + hz } };
}

/** Every wall segment on a room boundary (each shared edge once), with doorways, lintels, ledges and windows. */
export function wallParts(d: DungeonLayout, out: Part[], pieces: HiddenPieceDef[]): void {
  const { cell: C, wall: T, height: H, door: D, lintel } = DUNGEON;
  for (const r of d.rooms) {
    const h = (r.size - 1) / 2;
    for (const side of ['n', 'e', 's', 'w'] as const) {
      const n = DIRS[side];
      const p = { x: -n.z, z: n.x }; // along the wall
      for (let k = -h; k <= h; k++) {
        const mx = r.x + n.x * r.half + p.x * k * C;
        const mz = r.z + n.z * r.half + p.z * k * C;
        const nb = roomAt(d, mx + (n.x * C) / 2, mz + (n.z * C) / 2);
        if (nb === r || (nb && nb.index < r.index)) continue;
        const [lo, hi] = floorRange(r);
        const [nlo, nhi] = nb ? floorRange(nb) : [d.base, d.base];
        const y0 = Math.min(lo - wallFoot(r), nlo - wallFoot(nb)); // (round 104: down the void beside a flight over it)
        const y1 = Math.max(hi + H, nb ? nhi + H : d.base + 1.2);
        const seg = (a0: number, a1: number, b0: number, b1: number, look: 'wall' | 'grate' | 'none' = 'wall', thick = T, out0 = 0, solid = true): void => { // (`out0`: how far out of `r` its middle stands)
          const ax = [mx + p.x * a0 + n.x * (out0 - thick / 2), mx + p.x * a1 + n.x * (out0 + thick / 2)];
          const az = [mz + p.z * a0 + n.z * (out0 - thick / 2), mz + p.z * a1 + n.z * (out0 + thick / 2)];
          out.push({ shape: 'box', look, solid, room: r.index, ...(!nb && { outer: side }), min: { x: Math.min(...ax), y: b0, z: Math.min(...az) }, max: { x: Math.max(...ax), y: b1, z: Math.max(...az) } });
        };
        const L = C / 2 + T / 2;
        const here = (o: DoorLayout): boolean => Math.abs(o.x - mx) < 0.01 && Math.abs(o.z - mz) < 0.01;
        const win = d.windows.find(here);
        if (win) { // round 125: an opening at chest height above the higher floor, barred
          const [w, sill, top] = [LINK.windowWidth / 2, win.level + LINK.windowSill, win.level + LINK.windowTop];
          seg(-L, -w, y0, y1);
          seg(w, L, y0, y1);
          seg(-w, w, y0, sill);
          seg(-w, w, top, y1);
          seg(-w, w, sill, top, 'grate', 0.14);
          continue;
        }
        const door = d.doors.find(here);
        if (!door) {
          seg(-L, L, y0, y1);
          continue;
        }
        const arch = abyssOpening(r, nb); // between two flights over the void, an arch over the whole stair
        const [wide, high] = arch ? [arch.width, arch.lintel] : [D, lintel];
        seg(-L, -wide / 2, y0, y1);
        seg(wide / 2, L, y0, y1);
        if (arch) seg(-wide / 2, wide / 2, y0, door.level - ABYSS.foot); // under the steps' mass, the cross wall closes the void's ends
        if (door.link?.kind === 'drop') { // round 125: the ledge's face, from the lower floor to the doorway's sill...
          seg(-wide / 2, wide / 2, y0, door.level, 'wall', T / 2, door.link.to === r ? -T / 4 : T / 4, false); // ...drawn in the lower room's half of the wall (the upper floor runs to the wall's middle: their tops lie side by side, not one in the other)...
          seg(-wide / 2, wide / 2, y0, door.level, 'none'); // ...and solid through its whole thickness, so a body stepping past the wall's middle is put out on the lower side, and falls
        }
        if (y1 > door.level + high) seg(-wide / 2, wide / 2, door.level + high, y1);
        if (door.hidden) pieces.push(doorPiece(door, doorName(d, door), door.hidden));
      }
    }
  }
}
