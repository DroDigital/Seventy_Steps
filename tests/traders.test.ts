// The trader at the lamps (2026-11-06): Morgan met again at every second Elder Sign on the land, against a street lamp of his own.
import { describe, expect, it } from 'vitest';
import { distXZ, wrapAngle } from '../src/core/geom';
import { ACTS } from '../src/data/npcActs';
import { NPCS, TRADERS, TRADER_SITES, npcDef } from '../src/data/npcs';
import { performed } from '../src/data/speechLines';
import { TRADER_EVERY } from '../src/data/traders';
import { REGIONS } from '../src/data/regions';
import { SITES } from '../src/data/sites';
import { SHOPS, WARES } from '../src/data/wares';
import { actFor } from '../src/systems/actFor';
import { createWorldGame } from '../src/systems/game';
import { npcEntity, npcPlace, talk } from '../src/systems/npcs';
import { buy } from '../src/systems/trade';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';
import { segmentDistance } from '../src/world/roads';
import { restPoint } from '../src/world/shrine';
import { traderSpot } from '../src/world/traderAt';
import { chunkKey, chunkOf, toWorld } from '../src/world/worldMap';
import { createWorldCollision } from '../src/world/worldCollision';
import { record } from './worldHelpers';

const signsOnTheLand = REGIONS.flatMap((r) => (SITES[r.id]?.signs ?? []).map((s) => s.id));
const MERCHANTS = NPCS.filter((n) => n.shop).map((n) => n.sign);

describe('where the trader stands', () => {
  it('is at every second sign on the land, the first included, and where no merchant stands already', () => {
    const counted = signsOnTheLand.filter((_, i) => i % TRADER_EVERY === 0);
    expect(counted[0]).toBe('hub_quad');
    expect(MERCHANTS.every((m) => counted.includes(m))).toBe(true); // Morgan, Curtis and Dyer already fall on the count
    expect(TRADER_SITES.map((t) => t.sign)).toEqual(counted.filter((s) => !MERCHANTS.includes(s)));
    expect(TRADERS.map((t) => t.sign)).toEqual(TRADER_SITES.map((t) => t.sign));
  });

  it('never leaves two signs in a row without a trader or a merchant, and none three apart', () => {
    const has = new Set([...MERCHANTS, ...TRADER_SITES.map((t) => t.sign)]);
    signsOnTheLand.forEach((s, i) => {
      if (!has.has(s)) expect(has.has(signsOnTheLand[i - 1]) || has.has(signsOnTheLand[i + 1]), s).toBe(true);
    });
    expect(has.has('hub_quad')).toBe(true);
  });

  it('is not among the people met: nothing counts him as a person to meet', () => {
    for (const t of TRADERS) expect(NPCS.some((n) => n.id === t.id), t.id).toBe(false);
    for (const t of TRADERS) expect(npcDef(t.id)?.id).toBe(t.id);
  });

  it('is found by the plan of his region, clear of roads, houses and foes, with a lamp raised at his back (none under the earth)', () => {
    for (const site of TRADER_SITES) {
      const spot = traderSpot(site.id);
      expect(spot, site.id).toBeDefined();
      const region = REGIONS.find((r) => r.id === site.region)!;
      const plan = regionPlan(region);
      const lamps = [...plan.props.get(chunkKey(chunkOf(spot!.lamp.x), chunkOf(spot!.lamp.z))) ?? []].filter((p) => p.kind === 'lamp' && distXZ(p, spot!.lamp) < 0.01);
      expect(lamps.length, `${site.id}: a lamp`).toBe(site.region === 'kn_yan' ? 0 : 1);
      for (const p of [spot!, spot!.lamp]) {
        for (const r of plan.roads) for (let i = 1; i < r.pts.length; i++) expect(segmentDistance(p.x, p.z, r.pts[i - 1], r.pts[i]) - r.width / 2, `${site.id}: road`).toBeGreaterThan(0.85);
      }
      const posts = plan.spawns.get(chunkKey(chunkOf(spot!.x), chunkOf(spot!.z))) ?? [];
      for (const s of posts) expect(distXZ(s.at, spot!), `${site.id}: ${s.id}`).toBeGreaterThan(3);
    }
  });

  it('is in sight and within a few steps of where the investigator rises, facing it, and not on top of the sign or its person', () => {
    const w = worldLayout();
    for (const t of TRADERS) {
      const spot = traderSpot(t.id)!;
      const sign = w.signs.find((s) => s.id === t.sign)!;
      expect(distXZ(spot, sign.rest), t.id).toBeGreaterThan(2.5);
      expect(distXZ(spot, sign.rest), t.id).toBeLessThan(10);
      expect(distXZ(spot, sign), t.id).toBeGreaterThan(4.5);
      expect(Math.abs(wrapAngle(spot.yaw - Math.atan2(sign.rest.x - spot.x, sign.rest.z - spot.z))), t.id).toBeLessThan(0.01);
      for (const n of NPCS.filter((x) => x.sign === t.sign)) expect(distXZ(spot, npcPlace(n)!), `${t.id} / ${n.id}`).toBeGreaterThan(2.4);
    }
  });

  it('keeps clear of every wall, stone and tree: no collider but his own lamp within his body', () => {
    const w = createWorldCollision();
    for (const t of TRADERS) {
      const spot = traderSpot(t.id)!;
      const near = w.near!(spot.x - 1, spot.z - 1, spot.x + 1, spot.z + 1).filter((c) => !(c.kind === 'cylinder' && c.radius < 0.2 && distXZ(c, spot.lamp) < 0.05));
      for (const c of near) {
        const b = c.kind === 'cylinder' ? { x0: c.x - c.radius, x1: c.x + c.radius, z0: c.z - c.radius, z1: c.z + c.radius } : c.kind === 'box' ? { x0: c.min.x, x1: c.max.x, z0: c.min.z, z1: c.max.z } : { x0: c.x - c.hx, x1: c.x + c.hx, z0: c.z - c.hz, z1: c.z + c.hz };
        const inside = spot.x > b.x0 - 0.35 && spot.x < b.x1 + 0.35 && spot.z > b.z0 - 0.35 && spot.z < b.z1 + 0.35;
        expect(inside, `${t.id}: ${c.kind} at ${b.x0.toFixed(1)}, ${b.z0.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('agrees with the sign\'s own rising point (the helper both use)', () => {
    for (const s of worldLayout().signs) {
      const site = REGIONS.flatMap((r) => (SITES[r.id]?.signs ?? []).map((x) => ({ r, x }))).find((o) => o.x.id === s.id);
      if (!site) continue;
      const p = toWorld(site.r, site.x.at);
      expect(restPoint(p.x, p.z, site.x.face)).toEqual({ x: s.rest.x, z: s.rest.z });
    }
  });
});

describe('the trader as a person', () => {
  it('says only what Morgan says and has recorded, in his voice, and brings no rumour', () => {
    const g = createWorldGame();
    for (const t of TRADERS) {
      for (const topic of t.topics) for (const line of topic.lines) expect(performed('morgan', line), t.id).toBeDefined();
      expect(t.voice).toBe('morgan');
      const heard = record(g, 'Talked');
      g.overworld!.slain.add('boss:keziah_mason');
      talk(g, t.id);
      expect(heard[heard.length - 1], t.id).toMatchObject({ npc: t.id, voice: 'morgan', shop: 'wayside' });
      expect(heard[heard.length - 1].rumor).toBeUndefined();
      g.overworld!.slain.clear();
    }
  });

  it('sells lamp oil and cartridges without end, and none of the rare things Morgan keeps', () => {
    expect(SHOPS.wayside).toEqual(['oil', 'rounds']);
    for (const w of SHOPS.wayside) expect(WARES[w].stock).toBeUndefined();
    const g = createWorldGame();
    g.player.echoes = WARES.oil.price * 2;
    g.player.oil = 0;
    expect(buy(g, 'oil')).toBe(true);
    expect(g.player.oil).toBe(1);
  });

  it('is standing in the world, against his lamp, at his place, all night', () => {
    const g = createWorldGame();
    for (const t of TRADERS) {
      const e = npcEntity(g, t.id);
      expect(e, t.id).toBeDefined();
      const act = actFor(t.id)!;
      expect(act.kind).toBe('lounge');
      expect(act.post?.fixture).toBe('post');
      expect(act.post?.rise).toBe(ACTS.morgan.post!.rise);
      expect(npcPlace(t)).toMatchObject({ x: act.post!.x, z: act.post!.z });
      expect(distXZ(g.ecs.c.transform.get(e!)!.pos, act.post!)).toBeLessThan(0.01);
    }
  });
});
