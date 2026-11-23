/**
 * Where a figure stands, for actorViews.ts: the lie of the land under its feet (render/gait.ts and poses.ts bend the legs to it), and a
 * person with a chair or a post of their own (data/npcActs.ts) stepping clear of it as they stand, the chair and table kept where they
 * were set. Read-only on the simulation. (Taken out of actorViews.ts in round 116.)
 */

import type * as THREE from 'three';
import { wrapAngle } from '../core/geom';
import type { Post } from '../data/npcActs';
import type { Game } from '../systems/components';
import type { Figure } from './figures';
import type { Ground } from './gait';

/** The lie of the land about a figure standing on it (none on a floor, deck or step: those are level). */
export function groundAbout(g: Game, root: THREE.Object3D): Ground | undefined {
  const [rx, ry, rz, yaw] = [root.position.x, root.position.y, root.position.z, root.rotation.y];
  if (Math.abs(g.world.ground(rx, rz) - ry) > 0.05) return undefined;
  const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
  return (x, z) => Math.min(0.3, Math.max(-0.3, g.world.ground(rx + x * c + z * s, rz - x * s + z * c) - ry));
}

/** One with a chair or a post of their own, `actK` into their act: they step clear of it as they stand, and the chair and table stay where they were set, whichever way the figure turns. */
export function placeAt(g: Game, f: Figure, actK: number, post: Post): void {
  const up = 1 - Math.min(1, Math.max(0, actK));
  const away = post.rise * up * up * (3 - 2 * up);
  const yaw = f.root.rotation.y;
  f.root.position.x += Math.sin(yaw) * away;
  f.root.position.z += Math.cos(yaw) * away;
  const fx = f.fixture;
  if (!fx) return;
  const [dx, dz] = [post.x - f.root.position.x, post.z - f.root.position.z];
  const [s, c] = [f.root.scale, Math.cos(yaw)];
  const sn = Math.sin(yaw);
  fx.position.set((dx * c - dz * sn) / s.x, (g.world.ground(post.x, post.z) - f.root.position.y) / s.y, (dx * sn + dz * c) / s.z);
  fx.rotation.y = wrapAngle(post.yaw - yaw);
  fx.scale.set(1 / s.x, 1 / s.y, 1 / s.z);
}
