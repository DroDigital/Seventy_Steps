/**
 * What hangs under a boss hall's roof (round 108; data/hallLore.ts says what): a dome's ribs running out from its boss, an oculus of
 * the night over the middle, painted stars, chandeliers of iron and candles, chains, hanging lamps, the Terrible Old Man's bottles on
 * their strings, icicles from the cold room's pipes, frayed ropes; and over an open hall (Beyond the Gate) only shards adrift in the
 * air. Nothing roofed hangs lower than 3.5 m over the floor, and none of it over the middle of the fight but the dome's and the sky's
 * flat faces. Render only.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { HallLore, RoofThing } from '../data/hallLore';
import { DUNGEON } from '../data/tuning';
import { floorRange, roomPoint, type RoomLayout } from '../world/dungeonKit';
import type { HallOut } from './hallWalls';
import { tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

const IRON: Rgb = [0.24, 0.24, 0.27];
const WAX: Rgb = [0.86, 0.82, 0.7];
const ROPE: Rgb = [0.46, 0.4, 0.3];
const LOWEST = 3.5; // metres over the floor nothing hung comes lower than

type Ctx = { r: RoomLayout; top: number; floor: number; c: Rgb; glow: Rgb; out: HallOut; rng: Rng; all: readonly RoofThing[] };

/** A vertical piece hung from `top` at room-local (u, v), `len` long. */
const drop = (r: RoomLayout, u: number, v: number, top: number, len: number, w: number, c: Rgb): THREE.BufferGeometry => {
  const p = roomPoint(r, u, v);
  return tint(new THREE.BoxGeometry(w, len, w).translate(p.x, top - len / 2, p.z), c);
};
/** A flat disc facing down at height `y`. */
const ceilingDisc = (r: RoomLayout, u: number, v: number, y: number, rad: number, c: Rgb, sides = 16): THREE.BufferGeometry => {
  const p = roomPoint(r, u, v);
  return tint(new THREE.CircleGeometry(rad, sides).rotateX(Math.PI / 2).translate(p.x, y, p.z), c);
};
/** A beam under the ceiling from (u0, v0) to (u1, v1), its top at `y`. */
const rib = (r: RoomLayout, u0: number, v0: number, u1: number, v1: number, y: number, w: number, h: number, c: Rgb): THREE.BufferGeometry => {
  const [a, b] = [roomPoint(r, u0, v0), roomPoint(r, u1, v1)];
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  return tint(new THREE.BoxGeometry(w, h, len).rotateY(Math.atan2(b.x - a.x, b.z - a.z)).translate((a.x + b.x) / 2, y - h / 2, (a.z + b.z) / 2), c);
};

const THINGS: Record<RoofThing, (x: Ctx) => void> = {
  dome({ r, top, c, out, all }) { // ribs from a boss in the middle out to the walls, and rings of them
    const h = r.half - 0.6;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      out.trim.push(rib(r, Math.sin(a) * 1.6, Math.cos(a) * 1.6, Math.sin(a) * h, Math.cos(a) * h, top - 0.02, 0.3, 0.45, scaleRgb(c, 0.9)));
    }
    for (const rr of [8, 16]) for (let k = 0; k < 16; k++) {
      const [a, b] = [(k / 16) * Math.PI * 2, ((k + 1) / 16) * Math.PI * 2];
      out.trim.push(rib(r, Math.sin(a) * rr, Math.cos(a) * rr, Math.sin(b) * rr, Math.cos(b) * rr, top - 0.02, 0.24, 0.32, scaleRgb(c, 0.84)));
    }
    const p = roomPoint(r, 0, 0);
    if (!all.includes('oculus')) out.trim.push(tint(new THREE.CylinderGeometry(1.7, 1.2, 0.6, 16).translate(p.x, top - 0.3, p.z), scaleRgb(c, 0.8))); // its boss, where no eye is open
  },
  oculus({ r, top, c, glow, out }) { // the night through an eye in the roof, in a ring of stone
    const p = roomPoint(r, 0, 0);
    out.trim.push(tint(new THREE.TorusGeometry(1.5, 0.22, 6, 16).rotateX(Math.PI / 2).translate(p.x, top - 0.24, p.z), scaleRgb(c, 0.8)));
    out.shine.push(ceilingDisc(r, 0, 0, top - 0.04, 1.4, scaleRgb(glow, 0.55)));
  },
  stars({ r, top, glow, out, rng }) {
    for (let k = 0; k < 90; k++) {
      const [u, v] = [(rng() * 2 - 1) * (r.half - 1.5), (rng() * 2 - 1) * (r.half - 1.5)];
      if (Math.hypot(u, v) < 2.2) continue;
      out.shine.push(ceilingDisc(r, u, v, top - 0.01, 0.05 + rng() * 0.08, scaleRgb(glow, 0.7 + rng() * 0.3), 5));
    }
  },
  chandelier({ r, top, floor, glow, out }) {
    for (const v of [-9, 9]) {
      const y = Math.max(floor + LOWEST + 0.2, top - 2.2);
      const p = roomPoint(r, 0, v);
      out.wall.push(tint(new THREE.TorusGeometry(1.4, 0.06, 4, 16).rotateX(Math.PI / 2).translate(p.x, y, p.z), IRON));
      for (let k = 0; k < 3; k++) { // its chains up to the roof
        const a = (k / 3) * Math.PI * 2;
        out.trim.push(drop(r, Math.sin(a) * 1.3, v + Math.cos(a) * 1.3, top, top - y, 0.04, IRON));
      }
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const q = roomPoint(r, Math.sin(a) * 1.4, v + Math.cos(a) * 1.4);
        out.wall.push(tint(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 5).translate(q.x, y + 0.19, q.z), WAX));
        out.glow.push(tint(new THREE.IcosahedronGeometry(0.05, 0).scale(1, 1.6, 1).translate(q.x, y + 0.4, q.z), scaleRgb(glow, 1.05)));
      }
    }
  },
  chains({ r, top, floor, out, rng }) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + rng() * 0.3;
      const rr = 15 + rng() * 5;
      const len = Math.min(1 + rng() * 1.5, top - floor - LOWEST);
      for (let y = top; y > top - len; y -= 0.18) out.trim.push(drop(r, Math.sin(a) * rr, Math.cos(a) * rr, y, 0.16, Math.round(y / 0.18) % 2 ? 0.1 : 0.05, IRON));
      out.wall.push(drop(r, Math.sin(a) * rr, Math.cos(a) * rr, top - len, 0.3, 0.08, scaleRgb(IRON, 1.3)));
    }
  },
  lamps({ r, top, floor, glow, out }) {
    for (const [u, v] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) {
      const len = Math.min(1.8, top - floor - LOWEST - 0.4);
      out.trim.push(drop(r, u, v, top, len, 0.04, IRON));
      const p = roomPoint(r, u, v);
      out.wall.push(tint(new THREE.CylinderGeometry(0.16, 0.24, 0.22, 8).translate(p.x, top - len - 0.11, p.z), [0.56, 0.44, 0.24]));
      out.glow.push(tint(new THREE.IcosahedronGeometry(0.15, 1).translate(p.x, top - len - 0.32, p.z), glow));
    }
  },
  pendulums({ r, top, floor, out, rng }) { // bottles on their strings, a lead pendulum in each
    for (let k = 0; k < 16; k++) {
      const a = rng() * Math.PI * 2;
      const rr = 6 + rng() * 14;
      const [u, v] = [Math.sin(a) * rr, Math.cos(a) * rr];
      const len = Math.min(0.6 + rng() * 1.2, top - floor - LOWEST - 0.5);
      out.trim.push(drop(r, u, v, top, len, 0.02, ROPE));
      const p = roomPoint(r, u, v);
      const y = top - len;
      out.wall.push(tint(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6).translate(p.x, y - 0.06, p.z), [0.2, 0.3, 0.24]), tint(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 8).translate(p.x, y - 0.27, p.z), [0.16, 0.26, 0.2]));
      out.wall.push(tint(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8).translate(p.x, y - 0.36, p.z), [0.42, 0.42, 0.44]));
    }
  },
  icicles({ r, top, floor, out, rng }) {
    for (let k = 0; k < 70; k++) {
      const [u, v] = [(rng() > 0.5 ? 1 : -1) * (r.half - 1.2 - rng() * 2.6), (rng() * 2 - 1) * (r.half - 1)];
      const [pu, pv] = rng() > 0.5 ? [u, v] : [v, u];
      const len = Math.min(0.3 + rng() * 1.1, top - floor - LOWEST);
      const p = roomPoint(r, pu, pv);
      out.wall.push(tint(new THREE.CylinderGeometry(0.06 + rng() * 0.05, 0.01, len, 5).translate(p.x, top - 0.65 - len / 2, p.z), [0.82, 0.88, 0.94]));
    }
  },
  ropes({ r, top, floor, out, rng }) {
    for (let k = 0; k < 9; k++) {
      const [u, v] = [(rng() * 2 - 1) * (r.half - 3), (rng() * 2 - 1) * (r.half - 3)];
      if (Math.hypot(u, v) < 9) continue;
      out.beam.push(drop(r, u, v, top, Math.min(1.2 + rng() * 1.2, top - floor - LOWEST), 0.05, ROPE));
    }
  },
  shards({ r, floor, glow, out, rng }) { // beyond the gate: what is left of something, adrift overhead
    for (let k = 0; k < 22; k++) {
      const a = rng() * Math.PI * 2;
      const rr = 4 + rng() * 17;
      const p = roomPoint(r, Math.sin(a) * rr, Math.cos(a) * rr);
      const y = floor + 7.5 + rng() * 7;
      const s = 0.5 + rng() * 1.4;
      out.wall.push(tint(new THREE.OctahedronGeometry(s, 0).scale(0.4, 1.4, 0.4).rotateZ(rng() - 0.5).rotateY(rng() * 3).translate(p.x, y, p.z), [0.1, 0.1, 0.14]));
      if (k % 3 === 0) out.glow.push(tint(new THREE.OctahedronGeometry(s * 0.18, 0).translate(p.x, y, p.z), glow));
    }
  },
};

/** Things that hang in the air, with nothing to hang from: all an open hall takes. */
const FLOATS = new Set<RoofThing>(['shards']);

/** What a boss hall's lore hangs under its roof (or in its air), into `out`. */
export function hallRoof(r: RoomLayout, lore: HallLore, c: Rgb, open: boolean, out: HallOut, rng: Rng): void {
  const top = floorRange(r)[1] + DUNGEON.height - 0.05;
  for (const thing of lore.roof) {
    if (open && !FLOATS.has(thing)) continue;
    if (!open && FLOATS.has(thing)) continue;
    THINGS[thing]({ r, top, floor: floorRange(r)[1], c, glow: lore.glow, out, rng, all: lore.roof });
  }
}
