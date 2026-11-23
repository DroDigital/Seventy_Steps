/**
 * What the things along a dungeon hall's walls are built with (round 117, from dungeonFurniture.ts): the groups their geometry goes
 * into, a wall's frame (`s` along it, `d` out from its face, `y` up from the floor), a box, a cylinder and a lump set on it, and, new,
 * a piece built in the item's own frame and stood on the wall (`onWall`), a lathe turned about the upright, and a book's or a board's
 * row. Pure but for the geometry it makes.
 */

import * as THREE from 'three';
import type { XZ } from '../core/geom';
import type { Rng } from '../core/rng';
import { box, tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

/** The groups an item's geometry goes into (siteMeshes.ts gives each its material). */
export interface Out {
  wall: THREE.BufferGeometry[]; // the kit's stone
  wood: THREE.BufferGeometry[];
  beam: THREE.BufferGeometry[]; // relief on wood: drawn nearer (books on a shelf, planks)
  trim: THREE.BufferGeometry[]; // relief on a wall: drawn nearer
  glow: THREE.BufferGeometry[];
  shine: THREE.BufferGeometry[]; // (round 108) light on a surface: drawn nearer than it
}

/** A wall's frame: where (s along it, d out from it into the room) is in the world, and which way it runs. */
export interface Wall {
  at(s: number, d: number): XZ;
  alongX: boolean;
}

export interface Frame {
  wall: Wall;
  s: number;
  y: number; // the floor
  c: Rgb; // the kit's stone
  rng: Rng;
  out: Out;
}

export const DARK: Rgb = [0.34, 0.27, 0.2];
export const IRON: Rgb = [0.24, 0.23, 0.25];
export const BONE: Rgb = [0.78, 0.74, 0.64];
export const BOOKS: readonly Rgb[] = [[0.5, 0.2, 0.18], [0.22, 0.32, 0.4], [0.62, 0.52, 0.3], [0.3, 0.38, 0.24], [0.4, 0.3, 0.42], [0.55, 0.45, 0.35]];

/** A box on the wall: `ws` along it, `wd` out from it, `h` high, its middle at `s`, `d`, its foot `y` over the floor. */
export const wb = (f: Frame, s: number, d: number, ws: number, wd: number, h: number, y: number, c: Rgb): THREE.BufferGeometry => {
  const p = f.wall.at(f.s + s, d);
  return box(f.wall.alongX ? ws : wd, h, f.wall.alongX ? wd : ws, p.x, f.y + y + h / 2, p.z, c);
};
/** An upright cylinder (or a cone, by `top`) on the wall, its foot `y` over the floor. */
export const round = (f: Frame, s: number, d: number, r: number, h: number, y: number, c: Rgb, sides = 8, top = r): THREE.BufferGeometry => {
  const p = f.wall.at(f.s + s, d);
  return tint(new THREE.CylinderGeometry(top, r, h, sides).translate(p.x, f.y + y + h / 2, p.z), c);
};
/** A lump of radius `r` with its middle `y` over the floor, squashed by `squash`. */
export const blob = (f: Frame, s: number, d: number, r: number, y: number, c: Rgb, squash = 0.7): THREE.BufferGeometry => {
  const p = f.wall.at(f.s + s, d);
  return tint(new THREE.IcosahedronGeometry(r, 0).scale(1, squash, 1).translate(p.x, f.y + y, p.z), c);
};

/**
 * A geometry built in the item's own frame (x along the wall, y up from the floor, z out from the wall's face) stood on the wall at
 * `s` along it and `d` out from it, its foot `y` over the floor: turned so its +z looks into the room. A piece whose two halves along
 * x differ may come out mirrored on some walls, which is all the same for what is built here (each is drawn as it falls).
 */
export function onWall(f: Frame, g: THREE.BufferGeometry, s: number, d: number, y = 0): THREE.BufferGeometry {
  const [o, n] = [f.wall.at(f.s + s, d), f.wall.at(f.s + s, d + 1)];
  return g.rotateY(Math.atan2(n.x - o.x, n.z - o.z)).translate(o.x, f.y + y, o.z);
}

/** +1 if a piece's own +x runs along the wall's `s` once stood on it by `onWall`, -1 if against it (so a lean can be turned the way it is meant). */
export function alongSign(f: Frame): number {
  const [o, n, a] = [f.wall.at(f.s, 0), f.wall.at(f.s, 1), f.wall.at(f.s + 1, 0)];
  const t = Math.atan2(n.x - o.x, n.z - o.z);
  return Math.cos(t) * (a.x - o.x) - Math.sin(t) * (a.z - o.z) >= 0 ? 1 : -1;
}

/** A solid turned about the upright from [radius, height] points, foot to top, closed at both ends by points on the axis. */
export const lathe = (points: readonly (readonly [number, number])[], sides: number, c: Rgb): THREE.BufferGeometry =>
  tint(new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), sides), c);

/** The radius of a lathe's profile at height `y` (its outermost points), for a hoop or a band laid round it. */
export function radiusAt(points: readonly (readonly [number, number])[], y: number): number {
  for (let i = 1; i < points.length; i++) {
    const [[r0, y0], [r1, y1]] = [points[i - 1], points[i]];
    if (y1 > y0 && y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return Math.max(...points.map(([r]) => r));
}

/** Darkens every other column of a lathe's points about its axis by `k`: the staves of a cask, the folds of a robe. */
export function staves(g: THREE.BufferGeometry, sides: number, k: number): THREE.BufferGeometry {
  const [pos, col] = [g.getAttribute('position'), g.getAttribute('color')];
  for (let i = 0; i < pos.count; i++) {
    const n = Math.round(Math.atan2(pos.getX(i), pos.getZ(i)) / ((Math.PI * 2) / sides));
    if (((n % 2) + 2) % 2) col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return g;
}

/**
 * Books stood along a shelf from `s0` to `s1`, on `y`, at most `room` high, their spines flush at `front` (out from the wall) and at
 * most `deep`: no two alike, a gap where one was taken, now and then one leaning on its neighbour and a short pile laid flat. Relief.
 */
export function books(f: Frame, s0: number, s1: number, y: number, room: number, front: number, deep: number): void {
  for (let s = s0; s < s1 - 0.06; ) {
    const roll = f.rng();
    if (roll < 0.07) { // a gap where a book was taken
      s += 0.06 + f.rng() * 0.1;
      continue;
    }
    const c = scaleRgb(BOOKS[Math.floor(f.rng() * BOOKS.length)], 0.75 + 0.45 * f.rng());
    const bd = deep * (0.7 + 0.3 * f.rng());
    if (roll > 0.94 && s1 - s > 0.4) { // a short pile laid flat
      let top = y;
      for (let k = 0; k < 2 + Math.floor(f.rng() * 3); k++) {
        const t = 0.04 + f.rng() * 0.03;
        f.out.beam.push(wb(f, s + 0.14 + (f.rng() - 0.5) * 0.03, front - bd / 2, 0.24 + f.rng() * 0.06, bd, t, top, scaleRgb(BOOKS[Math.floor(f.rng() * BOOKS.length)], 0.8 + 0.4 * f.rng())));
        top += t;
      }
      s += 0.34;
      continue;
    }
    const [bw, bh] = [0.035 + f.rng() * 0.05, Math.min(room, room * (0.62 + 0.36 * f.rng()))];
    if (roll > 0.88 && s > s0 + 0.2 && s + bw + bh * 0.32 < s1) { // one leaning back on the last, a space opened beside it
      const g = new THREE.BoxGeometry(bw, bh, bd).translate(0, bh / 2, 0).rotateZ(0.32 * alongSign(f));
      f.out.beam.push(onWall(f, tint(g, c), s + bh * 0.31 + bw / 2, front - bd / 2, y));
      s += bw + bh * 0.31 + 0.02;
      continue;
    }
    f.out.beam.push(wb(f, s + bw / 2, front - bd / 2, bw, bd, bh, y, c));
    s += bw + 0.004;
  }
}
