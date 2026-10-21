import { describe, expect, it } from 'vitest';
import { ARENA_SETS } from '../src/data/arenaSetsAll';
import { ARENA_WAYS } from '../src/data/arenaWaysAll';
import { MODEL_INFO } from '../src/data/models/index';
import { PROP_KINDS, REGIONS } from '../src/data/regions';
import { SET_KITS } from '../src/data/setKits';
import { along, pointAt, WAY } from '../src/world/arenaWay';
import { reach } from '../src/world/arenaDecor';
import { worldLayout } from '../src/world/placements';
import { regionPlan, roadShare } from '../src/world/regionPlan';
import { propCollider } from '../src/world/props';
import { segmentDistance } from '../src/world/roads';

/** Round 62: the way to each open arena (data/arenaWays.ts; world/arenaWay.ts). */
describe('the ways to the open arenas', () => {
  const w = worldLayout();
  const plansOf = (region: string) => regionPlan(REGIONS.find((r) => r.id === region)!).ways;
  const plans = w.arenas.flatMap((a) => plansOf(a.region).filter((p) => p.boss === a.bosses[0]));

  it('give each open arena that has a set a way of its own, and name no arena that has none', () => {
    for (const a of w.arenas) if (ARENA_SETS[a.bosses[0]]) expect(ARENA_WAYS[a.bosses[0]], a.bosses[0]).toBeDefined();
    for (const id of Object.keys(ARENA_WAYS)) expect(w.arenas.some((a) => a.bosses[0] === id), id).toBe(true);
  });

  it('name only pieces that are there: a baked model, a built piece, a world prop', () => {
    for (const [id, way] of Object.entries(ARENA_WAYS)) {
      for (const p of [way.head, ...way.marks.map((m) => m.piece)]) {
        const known = p.of.startsWith('prop:') ? (PROP_KINDS as readonly string[]).includes(p.of.slice(5)) : !!MODEL_INFO[p.of] || !!SET_KITS[p.of];
        expect(known, `${id}: ${p.of}`).toBe(true);
      }
    }
  });

  it('run from the arena\'s fog down its way in, and on to the road they join', () => {
    expect(plans.length).toBe(Object.keys(ARENA_WAYS).length);
    for (const p of plans) {
      const a = w.arenas.find((x) => x.bosses[0] === p.boss)!;
      const start = p.path[0];
      expect(Math.hypot(start.x - a.x, start.z - a.z), `${p.boss}: begins at the fog`).toBeCloseTo(a.radius + WAY.fog, 3);
      const lane = pointAt(p, WAY.lane - 1, 0);
      expect(Math.hypot(lane.x - (start.x + a.front.x * (WAY.lane - 1)), lane.z - (start.z + a.front.z * (WAY.lane - 1))), `${p.boss}: straight down the way in at first`).toBeLessThan(0.5);
      expect(p.length, `${p.boss}: long enough to be walked`).toBeGreaterThanOrEqual(WAY.least - 1);
    }
  });

  it('are laid in the region\'s roads, so the ground shows the trail', () => {
    for (const p of plans) {
      const plan = plansOf(p.region);
      const segs = new Map<number, ReturnType<typeof regionPlan>['segs'] extends Map<number, infer S> ? S : never>();
      void segs;
      const mid = pointAt(p, p.length / 2, 0);
      const road = regionPlan(REGIONS.find((r) => r.id === p.region)!).roads.some((r) => r.pts.some((q, i) => i > 0 && segmentDistance(mid.x, mid.z, r.pts[i - 1], q) < 0.01));
      expect(road, `${p.boss}: a road runs where the way does`).toBe(true);
      expect(plan.length).toBeGreaterThan(0);
      expect(roadShare([{ a: p.path[0], b: p.path[1], width: p.width }], p.path[0].x, p.path[0].z)).toBeGreaterThan(0.9);
    }
  });

  it('stand its marks clear of the trail by their own breadth, outside the ring, and on land', () => {
    for (const p of plans) {
      const a = w.arenas.find((x) => x.bosses[0] === p.boss)!;
      const props = regionPlan(REGIONS.find((r) => r.id === p.region)!).props;
      for (const list of props.values()) {
        for (const q of list) {
          if (q.kind !== 'set' || !q.set) continue;
          const at = along(p, q.x, q.z);
          if (at.dist > 40 || !propCollider(q) || plansOf(p.region).some((o) => o !== p && along(o, q.x, q.z).dist < at.dist)) continue; // (the nearest way's own)
          if (Math.hypot(q.x - a.x, q.z - a.z) > a.radius + 3 && (q.set.id in (MODEL_INFO as object) || q.set.id in SET_KITS) && at.d > 0 && at.d < p.length) {
            expect(Math.abs(at.off) - reach(q), `${p.boss}: ${q.set.id} at ${at.d.toFixed(0)} m`).toBeGreaterThanOrEqual(p.width / 2 - 0.05);
          }
        }
      }
    }
  });

  it('keep every hazard and light on the way, outside the fight, and never on the ring', () => {
    for (const p of plans) {
      const a = w.arenas.find((x) => x.bosses[0] === p.boss)!;
      const spots = [...(p.way.hazards ?? []).flatMap((h) => ('plates' in h ? h.plates : 'at' in h && Array.isArray(h.at) ? (h.at as readonly { d: number; side: number }[]) : 'from' in h ? [{ d: h.from, side: 0 }, { d: h.to, side: 0 }] : [])), ...(p.way.rite?.at ?? [])];
      for (const s of spots) {
        const at = pointAt(p, s.d, s.side);
        expect(Math.hypot(at.x - a.x, at.z - a.z), `${p.boss}: ${s.d}, ${s.side}`).toBeGreaterThan(a.radius + WAY.fog + 4);
        expect(s.d, `${p.boss}: on the way`).toBeLessThan(p.length - 4);
      }
    }
  });

  it('say two omens at the least, in capitals as the others of the game are', () => {
    for (const p of plans) {
      expect(p.way.omens.length, p.boss).toBeGreaterThanOrEqual(2);
      for (const o of p.way.omens) {
        expect(o.at, `${p.boss}: ${o.words}`).toBeGreaterThan(0);
        expect(o.words, p.boss).toBe(o.words.toUpperCase());
      }
    }
  });
});
