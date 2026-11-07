/**
 * A house's wing can shut a yard in (round 110: houseAddons.ts walls it, and the planner laid its fences, field walls and trees without it).
 * A body inside such a yard could not walk out (tests/enclosedAudit.test.ts: Arkham, a pocket of 817 cells closed by two wings, two fences
 * and a tree). So each wing is tried in turn: where the ground about it is shut in with the wing and open without it, the wing is taken off
 * its house (`noWing`). A wing that shuts nothing stays, and nothing else about a house changes. Pure.
 */

import { colliderBounds, colliderGap, type Collider } from './colliders';
import { ESCAPE_STEP, walkOut } from './escape';
import { houseAddons } from './houseAddons';
import { propColliders, propWalls, type Prop } from './props';
import { ground } from './terrain';

const REACH = 14; // metres a walk must come to be out (the enclosed audit's)
const BODY = 0.55; // metres: a body's width, as the audit walks it (tests/enclosedHelpers.ts)
const HEIGHT = 1.8; // metres: a body's height, as the audit's push-out reads it (a bay's underside above it is no wall)
const NOOK = 100; // cells: a pocket of fewer is a nook between stones, not a yard (the audit's line)
const NEAR = 40; // metres from a house within which a prop's colliders may close a yard about its wing
const CELL = 4; // metres: the colliders are filed in cells this wide, so a body's test looks only at those near it
const DIRS: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * Whether a body cannot stand at (x, z) among `cs`: a collider blocks where a body's width is within it, and where its height reaches the body
 * (the push-out of the audit, read the same way). The colliders are filed by cell once, so each test looks at the few near it.
 */
function solidsAmong(cs: readonly Collider[]): (x: number, z: number) => boolean {
  const cell = (x: number, z: number): number => Math.floor(x / CELL) * 65536 + Math.floor(z / CELL);
  const grid = new Map<number, Collider[]>();
  for (const c of cs) {
    const b = colliderBounds(c);
    for (let i = Math.floor((b.x0 - BODY) / CELL); i <= Math.floor((b.x1 + BODY) / CELL); i++) {
      for (let j = Math.floor((b.z0 - BODY) / CELL); j <= Math.floor((b.z1 + BODY) / CELL); j++) {
        const k = i * 65536 + j;
        grid.get(k)?.push(c) ?? grid.set(k, [c]);
      }
    }
  }
  return (x, z) => {
    const near = grid.get(cell(x, z));
    if (!near) return false;
    let y: number | undefined; // (the ground is read only where a collider is near)
    return near.some((c) => {
      if (colliderGap(c, x, z) >= BODY) return false;
      y ??= ground(x, z);
      const [y0, y1] = c.kind === 'box' ? [c.min.y, c.max.y] : [c.y0, c.y1];
      return y + HEIGHT > y0 && y < y1;
    });
  };
}

/** Whether a body can go straight out from (x, z) for REACH metres along one of eight lines: then a walk from there is out, and needs no search. */
function clearLine(blocked: (x: number, z: number) => boolean, x: number, z: number): boolean {
  return DIRS.some(([a, b]) => {
    for (let k = 1; ; k++) {
      if (blocked(x + a * k * ESCAPE_STEP, z + b * k * ESCAPE_STEP)) return false;
      if (Math.hypot(a * k, b * k) * ESCAPE_STEP >= REACH) return true;
    }
  });
}

/**
 * The places about a wing, on a grid of 0.6 m out to 2.4 m past its walls: a yard it shuts in is walked from one of them, on whichever side the
 * yard lies, and through a passage a body only just fits (a thin passage beside the wing is joined to the yard past 1.4 m, so a nearer band misses it).
 * Given in the house's frame: the wing's middle at (cx, cz), half sizes hx and hz.
 */
function placesAbout(cx: number, cz: number, hx: number, hz: number): [number, number][] {
  const out: [number, number][] = [];
  const M = 2.4;
  for (let i = 0; i <= (2 * (hx + M)) / 0.6; i++) {
    for (let j = 0; j <= (2 * (hz + M)) / 0.6; j++) {
      const [x, z] = [cx - hx - M + i * 0.6, cz - hz - M + j * 0.6];
      if (Math.abs(x - cx) > hx + 0.5 || Math.abs(z - cz) > hz + 0.5) out.push([x, z]); // (none of it inside the wing)
    }
  }
  return out;
}

/**
 * Takes off the wing of each house whose wing shuts a yard in. Each house is judged by its own wing, with every other solid about it as it
 * stands; the houses are tried in the order of `props`, so where two wings each shut a yard alone, the first is taken off and the second kept.
 * Mutates `props` (`noWing`).
 */
export function sealWings(props: readonly Prop[]): void {
  for (const h of props) {
    if (h.kind !== 'house' || h.noWing) continue;
    const wing = houseAddons(h).wing;
    if (!wing) continue;
    const others = props.filter((p) => p !== h && Math.hypot(p.x - h.x, p.z - h.z) < NEAR).flatMap((p) => propColliders(p));
    const own = propColliders(h);
    const wingAt = propWalls(h).length; // (houseSolids lists a house's wing first of its solids)
    const withWing = solidsAmong([...others, ...own]);
    const withoutWing = solidsAmong([...others, ...own.filter((_, i) => i !== wingAt)]);
    const [s, k] = [Math.sin(h.yaw), Math.cos(h.yaw)];
    const world = (lx: number, lz: number): { x: number; z: number } => ({ x: h.x + lx * k + lz * s, z: h.z - lx * s + lz * k }); // turned as the model is (rotateY)
    const { ww, wwd, at, z0 } = wing;
    for (const [lx, lz] of placesAbout(at, z0, ww, wwd + 0.3)) { // (its gables overhang its back and front by 0.3 m)
      const { x, z } = world(lx, lz);
      if (withWing(x, z) || clearLine(withWing, x, z)) continue; // (no place in a wall is ground to walk from; a clear line out is open)
      const walk = walkOut(withWing, x, z, REACH);
      if (walk.out || walk.cells < NOOK) continue;
      if (walkOut(withoutWing, x, z, REACH).out) {
        h.noWing = true;
        break;
      }
    }
  }
}
