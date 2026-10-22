import { expect, it } from 'vitest';
import { FOUND } from '../src/data/discoveries';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { REGIONS } from '../src/data/regions';
import { PLAYER } from '../src/data/tuning';
import { along, pointAt } from '../src/world/arenaWay';
import { resolveCapsule, type CollisionWorld } from '../src/world/colliders';
import { worldLayout } from '../src/world/placements';
import { discoveryProps, stepPlace } from '../src/world/discoveryPlan';
import { propCollider } from '../src/world/props';
import { regionPlan } from '../src/world/regionPlan';
import { ground } from '../src/world/terrain';
import { chunkOf, regionAt, walkableChunk } from '../src/world/worldMap';

it('keeps a walkable approach from the court to every rite light', () => {
  const w = worldLayout();
  const failures: string[] = [];
  for (const region of REGIONS) {
    const plan = regionPlan(region);
    const props = [...plan.props.values()].flat();
    const colliders = props.flatMap((p) => { const c = propCollider(p); return c ? [c] : []; });
    const world: CollisionWorld = { colliders, off: new Set(), ground, contain() {}, near: (x, z) => w.chunk(chunkOf(x), chunkOf(z)).colliders };
    for (const way of plan.ways) for (const [i, light] of (way.way.rite?.at ?? []).entries()) {
      const from = pointAt(way, light.d, 0);
      const to = pointAt(way, light.d, light.side);
      for (let f = 0; f <= 20; f++) {
        const t = f / 20;
        const p = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t, y: 0 };
        p.y = ground(p.x, p.z);
        const before = { ...p };
        resolveCapsule(world, p, PLAYER.radius, PLAYER.height);
        if (Math.hypot(p.x - before.x, p.z - before.z) > 0.01 || !walkableChunk(chunkOf(p.x), chunkOf(p.z)) || regionAt(p.x, p.z)?.id !== region.id) {
          failures.push(`${way.boss} light ${i}: blocked at ${t.toFixed(2)}`);
          break;
        }
      }
    }
  }
  expect(failures).toEqual([]);
});

it('lets a body approach every discovery page, vigil and offering within its interaction range', () => {
  const w = worldLayout();
  const failures: string[] = [];
  for (const region of REGIONS) {
    const plan = regionPlan(region);
    const props = [...plan.props.values()].flat();
    const colliders = props.flatMap((p) => { const c = propCollider(p); return c ? [c] : []; });
    const world: CollisionWorld = { colliders, off: new Set(), ground, contain() {}, near: (x, z) => w.chunk(chunkOf(x), chunkOf(z)).colliders };
    for (const a of w.arenas.filter((a) => a.region === region.id && a.house)) {
      const boss = a.bosses[0]!;
      const way = plan.ways.find((p) => p.boss === boss)!;
      for (const mark of discoveryProps(a)) {
        if (!props.some((p) => p.x === mark.x && p.z === mark.z && p.kind === mark.kind && p.set?.id === mark.set?.id)) failures.push(`${boss}: missing discovery mark`);
      }
      const targets = [
        ...a.court!.leaves.map((at, i) => ({ at, range: PLAYER.pickupRadius, name: `page ${i}` })),
        ...DISCOVERIES[boss]!.steps.flatMap((s, i) => s.kind === 'vigil' || s.kind === 'offer' ? [{ at: stepPlace(a, s)!, range: s.kind === 'vigil' ? FOUND.vigil : FOUND.altar, name: `${s.kind} ${i}` }] : []),
      ];
      for (const target of targets) {
        const from = pointAt(way, along(way, target.at.x, target.at.z).d, 0);
        const pos = { x: from.x, z: from.z, y: ground(from.x, from.z) };
        for (let step = 0; step < 300 && Math.hypot(pos.x - target.at.x, pos.z - target.at.z) > target.range - 0.01; step++) {
          const dx = target.at.x - pos.x, dz = target.at.z - pos.z;
          const d = Math.hypot(dx, dz);
          pos.x += dx / d * 0.1;
          pos.z += dz / d * 0.1;
          pos.y = ground(pos.x, pos.z);
          resolveCapsule(world, pos, PLAYER.radius, PLAYER.height);
        }
        if (Math.hypot(pos.x - target.at.x, pos.z - target.at.z) > target.range) failures.push(`${boss}: ${target.name}`);
      }
    }
  }
  expect(failures).toEqual([]);
});
