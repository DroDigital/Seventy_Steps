/**
 * The pillars standing in a court (round 105: the cave-in falls about their feet): every collider in it that stands up taller than a body and is
 * no wider than a pillar or a monolith, not a wall or a house; hidden geometry that is not there and a drop are left out. Pure: no Three.js.
 */

import { colliderBounds, type Collider, type CollisionWorld } from '../world/colliders';
import type { Court, Post } from './courtPlans';

const WIDEST = 4; // metres across: a pillar, a column, a monolith; not a wall's run
const LEAST = 1.6; // metres tall: it stands over a body

const heightOf = (c: Collider): number => (c.kind === 'box' ? c.max.y - c.min.y : c.y1 - c.y0);

export function postsIn(w: CollisionWorld, court: Court): Post[] {
  const r = court.radius;
  const list = [...w.colliders, ...(w.near?.(court.x - r, court.z - r, court.x + r, court.z + r) ?? [])];
  const posts: Post[] = [];
  for (const c of list) {
    if (w.off.has(c) || c.fall || c.lightPass || heightOf(c) < LEAST) continue;
    const b = colliderBounds(c);
    const [sx, sz] = [b.x1 - b.x0, b.z1 - b.z0];
    if (Math.max(sx, sz) > WIDEST) continue;
    const p = { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, r: Math.max(sx, sz) / 2 };
    if (Math.hypot(p.x - court.x, p.z - court.z) > r - p.r - 1) continue;
    if (posts.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 0.5)) continue; // one pillar, built of several solids
    posts.push(p);
  }
  return posts;
}
