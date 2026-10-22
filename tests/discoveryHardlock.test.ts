import { expect, it } from 'vitest';
import { ARENA_WAYS } from '../src/data/arenaWaysAll';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { FOUND } from '../src/data/discoveries';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { kindsOf } from '../src/systems/weather';
import type { Collider } from '../src/world/colliders';
import { stepPlace } from '../src/world/discoveryPlan';
import { worldLayout } from '../src/world/placements';
import { goTo, run } from './worldHelpers';

/** Round 66: a discovery's gate must be openable. Each vigil's sky comes in its region, each rite has a way that holds one, and each vigil or altar can be stood near: a point within its reach is clear of solids. */

const inside = (c: Collider, x: number, z: number): boolean => {
  if (c.kind === 'box') return x > c.min.x && x < c.max.x && z > c.min.z && z < c.max.z;
  if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) < c.radius;
  const dx = x - c.x, dz = z - c.z;
  const k = Math.cos(c.yaw), s = Math.sin(c.yaw);
  return Math.abs(dx * k - dz * s) < c.hx && Math.abs(dx * s + dz * k) < c.hz;
};

it('every vigil sky comes in its house\'s region, and every rite step has a rite in its way', () => {
  const bad: string[] = [];
  for (const a of worldLayout().arenas) {
    const boss = a.bosses[0];
    if (!boss || !DISCOVERIES[boss]) continue;
    const have = kindsOf(a.region).map(([k]) => k);
    DISCOVERIES[boss]!.steps.forEach((s, i) => {
      if (s.kind === 'vigil' && s.when.sky && !s.when.sky.some((k) => have.includes(k))) bad.push(`${boss} ${i}: sky ${s.when.sky.join('/')} not in ${a.region}`);
      if (s.kind === 'rite' && !ARENA_WAYS[boss]?.rite) bad.push(`${boss} ${i}: rite step, no rite in its way`);
    });
  }
  expect(bad).toEqual([]);
});

it('every vigil and altar can be stood near: some point within its reach is clear of solids', () => {
  const g: Game = createWorldGame();
  const bad: string[] = [];
  for (const a of worldLayout().arenas) {
    const boss = a.bosses[0];
    if (!boss || !DISCOVERIES[boss]) continue;
    goTo(g, a.x, a.z);
    run(g, 4); // streams the solids about the house
    DISCOVERIES[boss]!.steps.forEach((s, i) => {
      if (s.kind !== 'vigil' && s.kind !== 'offer') return;
      const p = stepPlace(a, s);
      if (!p) return void bad.push(`${boss} ${i}: no place`);
      const reach = s.kind === 'vigil' ? FOUND.vigil : FOUND.altar;
      const near = [...(g.world.near?.(p.x - reach, p.z - reach, p.x + reach, p.z + reach) ?? []), ...g.world.colliders].filter((c) => !g.world.off.has(c));
      const stood = Array.from({ length: 16 }, (_, k) => {
        const t = (k / 16) * Math.PI * 2;
        return [p.x + Math.cos(t) * reach * 0.7, p.z + Math.sin(t) * reach * 0.7] as const;
      }).some(([x, z]) => !near.some((c) => inside(c, x, z)));
      if (!stood) bad.push(`${boss} ${i}: no clear standing point within reach`);
    });
  }
  expect(bad).toEqual([]);
});
