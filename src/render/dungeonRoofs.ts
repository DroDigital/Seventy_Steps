/**
 * What hangs under a roofed room's ceiling (round 30's ribs and joists; round 108, each dungeon its own: data/dungeonLooks.ts): the
 * vault's transverse ribs or the beams' joists as before, a groined vault's diagonal ribs crossing each bay, a coffered ceiling's grid,
 * a church's or a garret's trusses (a tie beam and its raking struts), stalactites dripping from a drowned vault, roots hanging from a
 * tomb's, and the pipes of a refrigerating plant run along it. Nothing of it hangs lower than 2.4 m under the ceiling (3.5 m over the
 * higher floor), above where an eye stands. Render only.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { RoofDress } from '../data/dungeonLooks';
import type { DungeonKit } from '../data/kits';
import { DUNGEON } from '../data/tuning';
import { floorRange, roomPoint, type RoomLayout } from '../world/dungeonKit';
import { DIRS } from '../world/worldMap';
import type { Out } from './dungeonFurniture';
import { box, tint, worldUv } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

type Origin = { x: number; z: number };
const IRON: Rgb = [0.3, 0.31, 0.33];
const ROOT: Rgb = [0.28, 0.22, 0.17];

/** A beam from room-local (u0, v0) to (u1, v1) at height `y`, `w` wide and `h` deep, its ends `dy` apart in height. */
function beam(r: RoomLayout, u0: number, v0: number, u1: number, v1: number, y: number, w: number, h: number, c: Rgb, at: Origin, dy = 0): THREE.BufferGeometry {
  const [a, b] = [roomPoint(r, u0, v0), roomPoint(r, u1, v1)];
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const g = new THREE.BoxGeometry(w, h, len).rotateX(-Math.atan2(dy, len)).rotateY(Math.atan2(b.x - a.x, b.z - a.z)).translate((a.x + b.x) / 2, y + dy / 2, (a.z + b.z) / 2);
  return worldUv(tint(g, c), at);
}

/** A cone hung point down from `top` at room-local (u, v): a stalactite, a root's tip. */
const hang = (r: RoomLayout, u: number, v: number, top: number, len: number, rad: number, c: Rgb, sides = 5): THREE.BufferGeometry => {
  const p = roomPoint(r, u, v);
  return tint(new THREE.CylinderGeometry(rad, 0.02, len, sides).translate(p.x, top - len / 2 + 0.05, p.z), c);
};

/** The ribs or joists of round 30: across the room every few metres, and a ridge along it. */
function ribs(r: RoomLayout, kit: DungeonKit, c: Rgb, at: Origin, out: Out, top: number): void {
  const [span, step, depth, drop] = kit.roof === 'vault' ? [r.half - 0.1, r.size === 3 ? 6 : 4, 0.5, 0.6] : [r.half - 0.1, 2.5, 0.28, 0.42];
  const alongX = DIRS[r.axis].x !== 0;
  const put = (u: number, v: number, du: number, dv: number, h: number, y: number, col: Rgb, to: THREE.BufferGeometry[]): void => {
    const p = roomPoint(r, u, v);
    to.push(worldUv(box(alongX ? dv : du, h, alongX ? du : dv, p.x, y, p.z, col), at));
  };
  const col = kit.roof === 'vault' ? scaleRgb(c, 0.95) : scaleRgb(c, 0.5);
  const to = kit.roof === 'vault' ? out.trim : out.beam;
  for (let v = -r.half + step / 2; v < r.half; v += step) put(0, v, span * 2, depth, drop, top - drop / 2, col, to);
  put(0, 0, depth * 0.8, r.half * 2 - 0.2, drop * 0.7, top - (drop * 0.7) / 2, col, to);
}

/** Under a roofed room's ceiling, as its dungeon dresses it. */
export function roofDress(dress: RoofDress, r: RoomLayout, kit: DungeonKit, c: Rgb, at: Origin, out: Out, rng: Rng): void {
  const top = floorRange(r)[1] + DUNGEON.height - 0.05;
  const h = r.half - 0.1;
  const vault = kit.roof === 'vault';
  const stone = scaleRgb(c, 0.92);
  const wood = scaleRgb(c, 0.5);
  switch (dress) {
    case 'ribs':
      return ribs(r, kit, c, at, out, top);
    case 'groin': { // a transverse rib at each bay's edge, and two diagonals crossing in it, a boss where they meet
      const step = r.size === 3 ? 8 : 8;
      for (let v = -h; v <= h + 1e-6; v += step) out.trim.push(beam(r, -h, v, h, v, top - 0.5, 0.4, 0.5, stone, at));
      for (let v = -h; v < h - 1e-6; v += step) {
        for (let u = -h; u < h - 1e-6; u += step) {
          const [u1, v1] = [Math.min(u + step, h), Math.min(v + step, h)];
          out.trim.push(beam(r, u, v, u1, v1, top - 0.36, 0.26, 0.34, scaleRgb(stone, 0.95), at), beam(r, u1, v, u, v1, top - 0.36, 0.26, 0.34, scaleRgb(stone, 0.95), at));
          const p = roomPoint(r, (u + u1) / 2, (v + v1) / 2);
          out.trim.push(worldUv(box(0.6, 0.3, 0.6, p.x, top - 0.6, p.z, scaleRgb(stone, 0.85)), at));
        }
      }
      return;
    }
    case 'coffers': { // a grid of beams both ways, deep coffers between
      const step = r.size === 3 ? 4 : 3.2;
      const to = vault ? out.trim : out.beam;
      const col = vault ? stone : wood;
      for (let v = -h + step; v < h - 0.5; v += step) to.push(beam(r, -h, v, h, v, top - 0.45, 0.32, 0.45, col, at));
      for (let u = -h + step; u < h - 0.5; u += step) to.push(beam(r, u, -h, u, h, top - 0.36, 0.3, 0.36, scaleRgb(col, 0.94), at));
      return;
    }
    case 'rafters': { // trusses across: a tie beam low under the ceiling, its king post, and two raking struts up from its ends
      const step = r.size === 3 ? 6 : 4;
      const tie = top - 1.7;
      for (let v = -h + step / 2; v < h; v += step) {
        out.beam.push(beam(r, -h, v, h, v, tie, 0.3, 0.32, wood, at));
        out.beam.push(beam(r, -h + 0.2, v, -0.2, v, tie + 0.16, 0.22, 0.24, scaleRgb(wood, 0.9), at, 1.4), beam(r, h - 0.2, v, 0.2, v, tie + 0.16, 0.22, 0.24, scaleRgb(wood, 0.9), at, 1.4));
        const p = roomPoint(r, 0, v);
        out.beam.push(worldUv(box(0.26, 1.6, 0.26, p.x, tie + 0.85, p.z, scaleRgb(wood, 0.85)), at));
      }
      out.beam.push(beam(r, 0, -h, 0, h, top - 0.15, 0.3, 0.3, scaleRgb(wood, 0.8), at));
      return;
    }
    case 'stalactites': { // the vault drips: stalactites in clusters, and the ribs they grew on
      ribs(r, kit, c, at, out, top);
      const n = r.size === 3 ? 60 : 12;
      for (let k = 0; k < n; k++) {
        const [u, v] = [(rng() * 2 - 1) * (h - 0.6), (rng() * 2 - 1) * (h - 0.6)];
        out.wall.push(hang(r, u, v, top, 0.5 + rng() * 1.6, 0.12 + rng() * 0.2, scaleRgb(c, 0.75 + rng() * 0.2)));
      }
      return;
    }
    case 'roots': { // roots through the vault, hanging
      ribs(r, kit, c, at, out, top);
      const n = r.size === 3 ? 70 : 14;
      for (let k = 0; k < n; k++) {
        const [u, v] = [(rng() * 2 - 1) * (h - 0.4), (rng() * 2 - 1) * (h - 0.4)];
        out.beam.push(hang(r, u, v, top, 0.6 + rng() * 1.7, 0.04 + rng() * 0.06, scaleRgb(ROOT, 0.8 + rng() * 0.4), 4));
      }
      return;
    }
    case 'pipes': { // the plant's pipes along the room, in brackets
      ribs(r, kit, c, at, out, top);
      for (const u of r.size === 3 ? [-h + 1.2, -h + 1.8, h - 1.4] : [-h + 1, h - 1.2]) {
        const [a, b] = [roomPoint(r, u, -h), roomPoint(r, u, h)];
        const alongX = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        const g = new THREE.CylinderGeometry(0.14, 0.14, len, 8).rotateZ(Math.PI / 2);
        if (!alongX) g.rotateY(Math.PI / 2);
        out.wall.push(tint(g.translate((a.x + b.x) / 2, top - 0.7, (a.z + b.z) / 2), IRON));
        for (let v = -h + 2; v < h; v += 3) {
          const p = roomPoint(r, u, v);
          out.trim.push(tint(new THREE.BoxGeometry(0.36, 0.7, 0.36).translate(p.x, top - 0.35, p.z), scaleRgb(IRON, 1.2)));
        }
      }
      return;
    }
  }
}
