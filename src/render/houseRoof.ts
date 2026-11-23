/**
 * A house's roof from its profile (round 117: out of houseMesh.ts, which was at its length): the slopes, seen from above and below,
 * and the two gable ends; and the roof's height at a point of its depth, for what stands on it (render/houseExtras.ts).
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Profile = readonly (readonly [number, number])[];

/** The roof's height at `z` across its depth: the profile's line there (its end's height beyond it). */
export function roofAt(profile: Profile, z: number): number {
  if (z <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [[z0, y0], [z1, y1]] = [profile[i - 1], profile[i]];
    if (z <= z1) return y0 + ((y1 - y0) * (z - z0)) / Math.max(z1 - z0, 1e-6);
  }
  return profile[profile.length - 1][1];
}

/** The profile from `floor` up: a slope that starts below it starts where it crosses it. */
function above(profile: readonly (readonly [number, number])[], floor: number): [number, number][] {
  const out: [number, number][] = [];
  const cross = (a: readonly [number, number], b: readonly [number, number]): [number, number] => [a[0] + ((b[0] - a[0]) * (floor - a[1])) / (b[1] - a[1]), floor];
  profile.forEach((p, i) => {
    if (p[1] < floor) return;
    if (i > 0 && profile[i - 1][1] < floor) out.push(cross(profile[i - 1], p));
    out.push([p[0], p[1]]);
    if (i + 1 < profile.length && profile[i + 1][1] < floor) out.push(cross(p, profile[i + 1]));
  });
  return out;
}

/**
 * A roof and its two gable ends from a profile across the depth: [z, y] points from eave to eave.
 * Round 21: the roof is seen from below too (its eaves were open sky from beneath), and a gable
 * begins where the wall ends, at `floor` (it began 20 cm under it, and lay in the wall's own plane
 * over that band, the two fighting).
 */
export function roof(profile: readonly (readonly [number, number])[], w: number, over: number, floor: number, wallHalf = 0): { roof: THREE.BufferGeometry; gables: THREE.BufferGeometry } {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let run = 0;
  for (let i = 1; i < profile.length; i++) {
    const [[z0, y0], [z1, y1]] = [profile[i - 1], profile[i]];
    const len = Math.hypot(z1 - z0, y1 - y0);
    const base = pos.length / 3;
    pos.push(-w - over, y0, z0, w + over, y0, z0, -w - over, y1, z1, w + over, y1, z1);
    uv.push(0, run / 2, (w + over) / 1, run / 2, 0, (run + len) / 2, (w + over) / 1, (run + len) / 2);
    run += len;
    idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); // outward (up) faces
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  r.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  r.setIndex(idx);
  r.computeVertexNormals();
  const under = r.clone();
  const turned = under.getIndex()!;
  for (let i = 0; i < turned.count; i += 3) {
    const b = turned.getX(i + 1);
    turned.setX(i + 1, turned.getX(i + 2));
    turned.setX(i + 2, b);
  }
  under.computeVertexNormals();
  // Gables: a fan from the eave line's middle, at both ends.
  const pts = above(profile, floor);
  const gp: number[] = [];
  const gu: number[] = [];
  const gi: number[] = [];
  for (const side of [-1, 1]) {
    const base = gp.length / 3;
    gp.push(side * w, floor, 0);
    gu.push(wallHalf, floor - 0.4);
    for (const [z, y] of pts) {
      gp.push(side * w, y, z * 0.995); // a hair inside the roof's edge (0.97 left a sliver of open air along each slope)
      gu.push(z + wallHalf, y - 0.4); // metres, as the wall's own (tileUv halves them): the courses run on into the gable (round 35: its bricks were four times the wall's, and began afresh at the eaves)
    }
    for (let i = 1; i < pts.length; i++) side < 0 ? gi.push(base, base + i + 1, base + i) : gi.push(base, base + i, base + i + 1); // facing out
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2));
  g.setIndex(gi);
  g.computeVertexNormals();
  return { roof: mergeGeometries([r, under]), gables: g };
}
