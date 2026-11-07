/**
 * Round 110: the parts a town house has beyond its walls (a lower wing, a bay window, a porch's posts; world/houseAddons.ts) are solid,
 * and no foe is placed in a solid or walks into one. Before, a wing was drawn with no collider, and a foe was placed at its end: the
 * troglodyte at the library's door stood half in a house's wing, as if it came out of the model.
 */
import { describe, expect, it } from 'vitest';
import { bodyOf } from '../src/data/bodies';
import { REGIONS } from '../src/data/regions';
import { getEntity } from '../src/data/registry';
import { chunkContent } from '../src/world/chunks';
import { colliderGap, resolveCapsule, type CollisionWorld } from '../src/world/colliders';
import { houseAddons, houseSolids } from '../src/world/houseAddons';
import { propColliders, type Prop } from '../src/world/props';
import { createWorldCollision } from '../src/world/worldCollision';
import { chunkOf, regionRect } from '../src/world/worldMap';
import { housePieces } from '../src/render/houseMesh';

/** Every town house and every spawn point the open world plans, each region's chunks read once. */
const world = (() => {
  const houses: Prop[] = [];
  const spawns: { id: string; entity: string; x: number; z: number }[] = [];
  const seen = new Set<string>();
  for (const r of REGIONS) {
    const rect = regionRect(r);
    for (let cx = chunkOf(rect.x0); cx <= chunkOf(rect.x1 - 1); cx++) {
      for (let cz = chunkOf(rect.z0); cz <= chunkOf(rect.z1 - 1); cz++) {
        const cc = chunkContent(cx, cz);
        for (const p of cc.props) if (p.kind === 'house') houses.push(p);
        for (const s of cc.spawns) {
          const key = `${s.id}|${s.at.x}|${s.at.z}`;
          if (!seen.has(key)) {
            seen.add(key);
            spawns.push({ id: s.id, entity: s.entity, x: s.at.x, z: s.at.z });
          }
        }
      }
    }
  }
  return { houses, spawns };
})();

describe('a house is solid beyond its walls', () => {
  it('the walls, the wing and the bay of every town house stand inside its colliders', () => {
    expect(world.houses.filter((h) => houseAddons(h).wing).length).toBeGreaterThan(20); // (the test has houses with wings to read)
    const bad: string[] = [];
    for (const p of world.houses) {
      const walls = housePieces(p, [0.5, 0.5, 0.5])[0]; // the first piece: the walls, the wing's and the bay's, and the gables above them
      const geo = walls?.geo;
      if (!geo) continue;
      const cs = propColliders(p);
      const [s, c] = [Math.sin(p.yaw), Math.cos(p.yaw)];
      const pos = geo.getAttribute('position');
      let worst = 0;
      for (let i = 0; i < pos.count; i++) {
        const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        if (y < 0.8 || y > 2.2) continue; // the body's band: above the footing, below the eaves
        const [wx, wz] = [p.x + x * c + z * s, p.z - x * s + z * c]; // turned as the model is (rotateY)
        worst = Math.max(worst, Math.min(...cs.map((k) => colliderGap(k, wx, wz))));
      }
      if (worst > 0.15) bad.push(`${p.x.toFixed(1)},${p.z.toFixed(1)} (${p.style}): a drawn wall ${worst.toFixed(2)} m from its colliders`);
    }
    expect(bad).toEqual([]);
  });

  it('a body walking into a wing from outside is stopped at its wall', () => {
    const p = world.houses.find((h) => houseAddons(h).wing)!;
    const wing = houseAddons(p).wing!;
    const [s, k] = [Math.sin(p.yaw), Math.cos(p.yaw)];
    const at = (lx: number, lz: number): { x: number; z: number } => ({ x: p.x + lx * k + lz * s, z: p.z - lx * s + lz * k }); // (in the house's frame, turned as the model is)
    const wingBox = houseSolids(p)[0]; // a wing's walls come first among a house's solid parts
    const cs = propColliders(p);
    const y = p.y; // the body stands on the land where the house stands (its wing's walls start half a metre below that)
    const w: CollisionWorld = { colliders: cs, off: new Set(), ground: () => y, contain: () => undefined };
    const from = at(wing.at + wing.side * (wing.ww + 2), wing.z0); // two metres beyond the wing's outer end, along its middle
    const to = at(wing.at, wing.z0); // the middle of the wing
    const [dx, dz] = [to.x - from.x, to.z - from.z];
    const len = Math.hypot(dx, dz);
    const pos = { x: from.x, y, z: from.z };
    let closest = Infinity;
    for (let step = 0; step < Math.ceil(len / 0.1) + 5; step++) {
      pos.x += (dx / len) * 0.1;
      pos.z += (dz / len) * 0.1;
      resolveCapsule(w, pos, 0.4, 1.8);
      closest = Math.min(closest, colliderGap(wingBox, pos.x, pos.z));
    }
    expect(closest).toBeGreaterThanOrEqual(0.39); // never within the wing's walls: its outer wall held the body
  });
});

describe('no foe is placed in a wall', () => {
  it('every spawn point is clear of every solid by its own body: pushed out, it does not move', () => {
    const w = { ...createWorldCollision(), contain: () => undefined }; // the open world's colliders, read as the game reads them
    const pushed: string[] = [];
    for (const sp of world.spawns) {
      const def = getEntity(sp.entity);
      if (!def) continue;
      const { radius, height } = bodyOf(def);
      const at = { x: sp.x, y: w.ground(sp.x, sp.z), z: sp.z }; // (a foe stands on the ground there: spawnCombatant)
      const pos = { ...at };
      resolveCapsule(w, pos, radius, height, false);
      const moved = Math.hypot(pos.x - at.x, pos.z - at.z);
      if (moved >= 0.02) pushed.push(`${sp.id} (${sp.entity}) at ${sp.x.toFixed(1)},${sp.z.toFixed(1)}: a body of radius ${radius.toFixed(2)} m pushed ${moved.toFixed(2)} m`);
    }
    expect(pushed).toEqual([]);
  });
});
