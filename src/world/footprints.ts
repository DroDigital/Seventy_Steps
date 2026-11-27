/**
 * Whether two props' footprints meet (2026-11-27, the playtest at Benefit Street: "walls go through the buildings"). The hedges of
 * Hutchinson's avenue ran their 118 metres out from his gate into the town and through its houses, and a few trees and rocks stood in a
 * house's wing: a court's marks were cleared of what stands on its way, but never kept off a house, and the land's scatter was laid
 * before the wings were. Read on the xz plane, by the props' colliders (a turned box by its sides, a column by its round), a margin apart.
 * Pure: no Three.js.
 */

import { colliderGap, type Collider, type OrientedBoxCollider } from './colliders';
import { propColliders, type Prop } from './props';

/** A collider as a turned box (an axis-aligned box is one turned by nothing), or null for a column. */
function asTurned(c: Collider): OrientedBoxCollider | null {
  if (c.kind === 'cylinder') return null;
  if (c.kind === 'obox') return c;
  return { kind: 'obox', x: (c.min.x + c.max.x) / 2, z: (c.min.z + c.max.z) / 2, hx: (c.max.x - c.min.x) / 2, hz: (c.max.z - c.min.z) / 2, yaw: 0, y0: c.min.y, y1: c.max.y };
}

/** A turned box's span along a unit axis (ax, az). */
function span(b: OrientedBoxCollider, ax: number, az: number): [number, number] {
  const [s, k] = [Math.sin(b.yaw), Math.cos(b.yaw)];
  const mid = b.x * ax + b.z * az;
  const half = b.hx * Math.abs(k * ax - s * az) + b.hz * Math.abs(s * ax + k * az); // its own x is (cos, -sin), its own z (sin, cos)
  return [mid - half, mid + half];
}

/** Whether two colliders' outlines on the ground come within `m` metres of each other. */
export function collidersMeet(a: Collider, b: Collider, m = 0): boolean {
  const [ta, tb] = [asTurned(a), asTurned(b)];
  if (!ta && a.kind === 'cylinder') return colliderGap(b, a.x, a.z) < a.radius + m;
  if (!tb && b.kind === 'cylinder') return colliderGap(a, b.x, b.z) < b.radius + m;
  if (!ta || !tb) return false;
  for (const t of [ta, tb]) {
    const [s, k] = [Math.sin(t.yaw), Math.cos(t.yaw)];
    for (const [ax, az] of [[k, -s], [s, k]] as const) { // the axes that may part them: each box's own two
      const [a0, a1] = span(ta, ax, az);
      const [b0, b1] = span(tb, ax, az);
      if (a1 + m < b0 || b1 + m < a0) return false;
    }
  }
  return true;
}

/** Whether two props' footprints come within `m` metres of each other (a prop walked through has none, and meets nothing). */
export function propsMeet(a: Prop, b: Prop, m = 0): boolean {
  const [ca, cb] = [propColliders(a), propColliders(b)];
  return ca.some((x) => cb.some((y) => collidersMeet(x, y, m)));
}

/** The land's scatter, which a house's walls or wing take the place of: a tree, a rock, a bush, a stump, a log. */
const SCATTER: ReadonlySet<Prop['kind']> = new Set(['tree', 'pine', 'rock', 'bush', 'stump', 'log']);

/** What a court's rows stop at, and what stands no scatter in it: the buildings and walls of the land. */
export const BUILT: ReadonlySet<Prop['kind']> = new Set(['house', 'ruin', 'wall', 'fence']);

/** Takes up every piece of the land's scatter that stands in a house (its walls, wing, bay or porch), in place. */
export function clearHouses(props: Prop[]): void {
  const houses = props.filter((p) => p.kind === 'house');
  const inHouse = (p: Prop): boolean => houses.some((h) => Math.hypot(h.x - p.x, h.z - p.z) < Math.hypot(h.w, h.d) * 2.2 + Math.max(p.w, p.d) + 1 && propsMeet(p, h, 0.1));
  for (let i = props.length - 1; i >= 0; i--) if (SCATTER.has(props[i]!.kind) && inHouse(props[i]!)) props.splice(i, 1);
}
