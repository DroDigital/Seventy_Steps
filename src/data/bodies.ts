/**
 * A creature's body: its capsule's height and radius, from its silhouette and scale or, for an assembly, its size. Round 110: kept here
 * (it was in systems/creatures.ts) so the world's spawn places can clear each foe by its own body, not by one margin for all. Pure.
 */

import type { EntityDef, Silhouette } from './schema';

/** Body height and capsule radius as fractions of the sprite's scale (a recipe's own `body` comes first: its art's). */
export const BODY: Record<Silhouette, readonly [height: number, radius: number]> = {
  humanoid: [0.9, 0.18],
  hunched: [0.85, 0.22],
  robed: [0.9, 0.2],
  quadruped: [0.55, 0.3],
  serpent: [0.5, 0.25],
  winged: [0.7, 0.25],
  crustacean: [0.7, 0.28],
  barrel: [0.85, 0.24],
  cone: [0.95, 0.26],
  blob: [0.7, 0.36],
  orb: [0.7, 0.3],
  swarm: [0.35, 0.4],
  cephalopod: [0.95, 0.26],
  giant: [0.95, 0.2],
  toad: [0.6, 0.36],
  spectre: [0.9, 0.22],
};

/** Capsule radius of an assembly as a fraction of its height (see render/assemblies.ts). */
export const ASSEMBLY_RADIUS = { lathe: 0.3, spheres: 0.38, mound: 0.5 } as const;

export function bodyOf(def: EntityDef): { height: number; radius: number } {
  if (def.sprite) {
    const [h, r] = def.sprite.body ?? BODY[def.sprite.silhouette];
    return { height: def.sprite.scale * h, radius: Math.max(0.2, def.sprite.scale * r) };
  }
  const { scale, body } = def.assembly!;
  return { height: scale, radius: scale * ASSEMBLY_RADIUS[body] }; // as wide as it looks: nothing walks inside a colossus
}
