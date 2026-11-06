// Lamp oil lies about the world, at fitting places, for whoever does not buy it (2026-11-06, asked; round 106).
import { describe, expect, it } from 'vitest';
import { distXZ } from '../src/core/geom';
import { POIS, flaskName } from '../src/data/pois';
import { OIL } from '../src/data/tuning';
import { SHOPS, WARES } from '../src/data/wares';
import { createWorldGame } from '../src/systems/game';
import { poiSite } from '../src/systems/pois';
import { parseSave, snapshot } from '../src/systems/save';
import type { Collider } from '../src/world/colliders';
import { createWorldCollision } from '../src/world/worldCollision';
import { goTo, record, run } from './worldHelpers';

const FITTING = ['arkham_ghoul_warren', 'dunwich_farmhouse', 'hub_laboratory', 'innsmouth_refinery', 'mountains_wrecked_camp', 'providence_catacombs', 'vermont_martense'];

/** Whether (x, z), with a margin `m`, lies inside a collider's footprint (its own frame for a turned box). */
function inside(c: Collider, x: number, z: number, m: number): boolean {
  if (c.kind === 'box') return x > c.min.x - m && x < c.max.x + m && z > c.min.z - m && z < c.max.z + m;
  if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) < c.radius + m;
  const [s, k] = [Math.sin(c.yaw), Math.cos(c.yaw)];
  const [dx, dz] = [(x - c.x) * k - (z - c.z) * s, (x - c.x) * s + (z - c.z) * k];
  return Math.abs(dx) < c.hx + m && Math.abs(dz) < c.hz + m;
}

/** The pickups of a place's oil, as the tomes that hold them, with their entities. */
const flasksOf = (g: ReturnType<typeof createWorldGame>, id: string) => [...g.ecs.c.tome].filter(([, t]) => t.name === flaskName(id));
const spotOf = (g: ReturnType<typeof createWorldGame>, e: number) => g.ecs.c.transform.get(e)!.pos;

describe('lamp oil lies about the world (round 106)', () => {
  it('lies only at places it fits, a flask or two each; the shop sells it too', () => {
    expect(POIS.filter((p) => p.flasks).map((p) => p.id).sort()).toEqual(FITTING);
    expect(POIS.filter((p) => p.flasks).every((p) => p.flasks! >= 1 && p.flasks! <= 2)).toBe(true);
    expect(SHOPS.morgan).toContain('oil');
    expect(WARES.oil.stock).toBeUndefined();
  });

  it('is laid on the land of its place, off its chest and clear of anything built', () => {
    const w = createWorldCollision();
    for (const id of FITTING) {
      const s = poiSite(id)!;
      expect(s.flask, id).not.toBeNull();
      expect(distXZ(s.flask!, s), id).toBeLessThan(s.r + 12);
      if (s.chest) expect(distXZ(s.flask!, s.chest), id).toBeGreaterThan(2);
      const p = s.flask!;
      for (const c of w.near!(p.x - 1, p.z - 1, p.x + 1, p.z + 1)) expect(inside(c, p.x, p.z, 0.25), `${id}: a flask inside ${c.kind}`).toBe(false);
    }
  });

  it('is set down as the investigator nears the place, and taken for good on touch, all of it as the pockets hold', () => {
    const g = createWorldGame();
    const site = poiSite('mountains_wrecked_camp')!;
    goTo(g, site.x, site.z);
    run(g, 40);
    const [[e, t]] = flasksOf(g, site.def.id);
    expect(t.oil).toBe(site.def.flasks);
    const at = spotOf(g, e);
    const read = record(g, 'Read');
    g.player.oil = 0;
    goTo(g, at.x, at.z);
    run(g, 5);
    expect(g.player.oil).toBe(site.def.flasks);
    expect(flasksOf(g, site.def.id)).toHaveLength(0);
    expect(g.overworld!.read.has(flaskName(site.def.id))).toBe(true);
    expect(read, 'a flask is not read as a tome').toHaveLength(0);
  });

  it('when the pockets cannot hold all of it, none is taken: the cache stays whole where it lies, and is taken once all of it fits', () => {
    const g = createWorldGame();
    const site = poiSite('mountains_wrecked_camp')!;
    goTo(g, site.x, site.z);
    run(g, 40);
    const [[e, t]] = flasksOf(g, site.def.id);
    const at = spotOf(g, e);
    g.player.oil = OIL.carry - 1;
    goTo(g, at.x, at.z);
    run(g, 5);
    expect(g.player.oil).toBe(OIL.carry - 1);
    expect(t.oil).toBe(site.def.flasks);
    expect(g.overworld!.read.has(flaskName(site.def.id))).toBe(false);
    g.player.oil = 0;
    run(g, 5);
    expect(g.player.oil).toBe(site.def.flasks);
    expect(flasksOf(g, site.def.id)).toHaveLength(0);
  });

  it('a save keeps them taken: a load does not set them down again', () => {
    const g = createWorldGame();
    const site = poiSite('mountains_wrecked_camp')!;
    goTo(g, site.x, site.z);
    run(g, 40);
    const [[e]] = flasksOf(g, site.def.id);
    const at = spotOf(g, e);
    goTo(g, at.x, at.z);
    run(g, 5);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    goTo(loaded, site.x, site.z);
    run(loaded, 40);
    expect(flasksOf(loaded, site.def.id)).toHaveLength(0);
  });

  it('a cache left whole when the pockets are short is still whole after a load: no flask is doubled', () => {
    const g = createWorldGame();
    const site = poiSite('mountains_wrecked_camp')!;
    goTo(g, site.x, site.z);
    run(g, 40);
    const [[e]] = flasksOf(g, site.def.id);
    const at = spotOf(g, e);
    g.player.oil = OIL.carry - 1;
    goTo(g, at.x, at.z);
    run(g, 5);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(loaded.player.oil).toBe(OIL.carry - 1);
    goTo(loaded, site.x, site.z);
    run(loaded, 40);
    const [[, t]] = flasksOf(loaded, site.def.id);
    expect(t.oil).toBe(site.def.flasks);
    expect(flasksOf(loaded, site.def.id)).toHaveLength(1);
  });
});
