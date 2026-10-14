/**
 * Walled in (round 49: "two foes stood inside a ruin and could not get out, nor could I get in"): the ruin's four walls
 * met, and the foes were posted inside. No feature shuts itself, no foe is posted where it cannot walk out, and no place
 * someone stands or comes to (a sign, a gate, a tome, an arena, a dungeon's door) is shut in. Run against the generators
 * over many seeds, and against the world as it is laid (the whole land, on a grid, is `enclosedAudit.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { escapes, walkOut } from '../src/world/escape';
import { featureProps, local, type Feature, type FeatureContext, type FeatureKind, type FillerKind } from '../src/world/features';
import { worldLayout } from '../src/world/placements';
import { propCollider } from '../src/world/props';
import { regionPlan } from '../src/world/regionPlan';
import { amongBlocked, worldBlocked } from './enclosedHelpers';

/** A pocket of fewer cells than this is a nook between a stone and a wall, where nothing stands (and no foe is posted: planSpawns walks each post out); more is a place. */
const NOOK = 100;

const ctx: FeatureContext = { pines: false, free: () => true, landmark: 'monolith' };

describe('a feature never shuts itself', () => {
  /** Points inside a feature, in its own frame, that someone may stand at. */
  const inside: Partial<Record<FeatureKind | FillerKind, (r: number) => [number, number][]>> = {
    ruin: (r) => [[0, 0], [-0.3 * r, -0.25 * r], [0.3 * r, -0.25 * r], [-0.3 * r, 0.25 * r], [0.3 * r, 0.25 * r]],
    farm: (r) => [[0, -0.3 * r], [-0.35 * r, -0.3 * r], [0.35 * r, -0.3 * r], [0, -0.4 * r]], // the yard
    graveyard: (r) => [[0, 0], [-0.4 * r, 0], [0.4 * r, 0], [0, -0.3 * r]],
  };
  for (const kind of ['ruin', 'farm', 'graveyard'] as const) {
    it(`${kind}: from inside, over 400 seeds, a body can walk out`, () => {
      const bad: string[] = [];
      for (let seed = 1; seed <= 700; seed++) {
        const r = kind === 'ruin' ? 8 : kind === 'farm' ? 17 : 16;
        const yaw = (seed * 0.7) % (Math.PI * 2);
        const f = { kind, x: 300, z: 300, r, yaw, seed } as Feature;
        const colliders = featureProps(f, ctx).flatMap((p) => propCollider(p) ?? []);
        const blocked = amongBlocked(colliders);
        for (const [lx, lz] of inside[kind]!(r)) {
          const p = local(f, lx, lz);
          if (blocked(p.x, p.z)) continue; // (a stone, a grave: nobody stands there)
          const w = walkOut(blocked, p.x, p.z, 14);
          if (!w.out && w.cells >= NOOK) bad.push(`${kind} seed ${seed} yaw ${yaw.toFixed(2)}: shut in at its (${lx.toFixed(1)}, ${lz.toFixed(1)}), a pocket of ${w.cells} cells`);
        }
      }
      expect(bad.slice(0, 8)).toEqual([]);
    });
  }
});

describe('the world as it is laid', () => {
  const blocked = worldBlocked();
  const stuck = (label: string, x: number, z: number, reach: number, out: string[]): void => {
    if (blocked(x, z)) return; // (stands against a stone or a post, and is not a place to walk out of)
    const w = walkOut(blocked, x, z, reach);
    if (!w.out && w.cells >= NOOK) out.push(`${label} is walled in at ${x.toFixed(0)}, ${z.toFixed(0)} (a pocket of ${w.cells} cells)`);
  };

  it('no foe is posted where it cannot walk out', () => {
    const bad: string[] = [];
    for (const r of REGIONS) for (const s of [...regionPlan(r).spawns.values()].flat()) stuck(`${r.id} ${s.id} (${s.entity})`, s.at.x, s.at.z, 20, bad);
    expect(bad).toEqual([]);
  });

  it('no sign, gate, tome, arena or dungeon door is shut in', () => {
    const w = worldLayout();
    const bad: string[] = [];
    for (const s of w.signs) stuck(`sign ${s.id}`, s.rest.x, s.rest.z, 16, bad);
    for (const g of w.gates) stuck(`gate ${g.id}`, g.arrive.x, g.arrive.z, 16, bad);
    for (const t of w.tomes) stuck(`tome ${t.name}`, t.at.x, t.at.z, 16, bad);
    for (const a of w.arenas) for (const k of [0, 1, 2, 3]) stuck(`arena of ${a.bosses.join(' & ')}`, a.x + Math.sin(k * 1.57) * a.radius * 0.6, a.z + Math.cos(k * 1.57) * a.radius * 0.6, a.radius + 6, bad);
    for (const d of w.dungeons) {
      for (const door of d.layout.doors) {
        if (door.b !== null) continue;
        const out = { e: [3, 0], w: [-3, 0], n: [0, 3], s: [0, -3] }[door.side];
        stuck(`the door of ${d.layout.def.id}`, door.x + out[0], door.z + out[1], 12, bad);
      }
    }
    expect(bad).toEqual([]);
  });

  it('the search itself: a closed ring holds, a ring with a gap lets out', () => {
    const ring = (gap: boolean) => (x: number, z: number): boolean => {
      const d = Math.hypot(x, z);
      return d > 4 && d < 5 && !(gap && x > 0 && Math.abs(z) < 1.5);
    };
    expect(escapes(ring(false), 0, 0, 12)).toBe(false);
    expect(escapes(ring(true), 0, 0, 12)).toBe(true);
    expect(escapes(() => false, 0, 0, 12)).toBe(true);
  });
});
