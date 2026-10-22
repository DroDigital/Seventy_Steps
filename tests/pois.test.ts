/**
 * The points of interest (round 61: data/pois.ts, world/poiPlan.ts, systems/pois.ts, ui/poiMarks.ts, render/poiFx.ts): the places the map
 * shows as a grey "?" until they are found. Each is a place Lovecraft wrote, set where the land has its like; each is found by coming
 * to it, once, and kept; a chest of Echoes is set down about it, and its foes stand at their posts.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { POI_KINDS, POIS, hoardName, poiKey, poisOf } from '../src/data/pois';
import { REGIONS } from '../src/data/regions';
import { ENTITIES, getEntity } from '../src/data/registry';
import { START_SIGN } from '../src/data/sites';
import { POI } from '../src/data/tuning';
import { explore } from '../src/systems/exploration';
import { createWorldGame } from '../src/systems/game';
import { poiMark, reachOf } from '../src/systems/pois';
import { parseSave, snapshot } from '../src/systems/save';
import { CELLS, mazeWalls } from '../src/world/poiPlan';
import { allPoiSites, poiSitesOf } from '../src/world/poiSites';
import { FIRST_HOUR, gentle, groundOf } from '../src/world/planSpawns';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';
import { regionRect } from '../src/world/worldMap';
import { goTo, record, run } from './worldHelpers';

const ANOMALY_HUES = ['magenta', 'purple', 'green', 'bone'];
const bosses = new Set(ENTITIES.filter((e) => e.bossScript).map((e) => e.id));

describe('the points of interest: what is written', () => {
  it('every place has a name, a story, a line, a region of the world and a kind; no two share an id or a name', () => {
    expect(POIS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(POIS.map((p) => p.id)).size).toBe(POIS.length);
    expect(new Set(POIS.map((p) => p.name)).size).toBe(POIS.length);
    for (const p of POIS) {
      expect(REGIONS.some((r) => r.id === p.region), p.id).toBe(true);
      expect(POI_KINDS, p.id).toContain(p.kind);
      expect(p.name.length, p.id).toBeGreaterThan(3);
      expect(p.story.length, p.id).toBeGreaterThan(3);
      expect(p.line.length, `${p.id}'s line`).toBeGreaterThan(30);
      expect(p.line.length, `${p.id}'s line is read in a few seconds`).toBeLessThan(230);
      if (p.again) expect(p.again.length, p.id).toBeLessThan(160);
    }
  });

  it('each region has a few (the university, where the first hour is spent, the fewest), and every kind of place is among them', () => {
    for (const r of REGIONS) expect(poisOf(r.id).length, r.id).toBeGreaterThanOrEqual(r.id === 'hub' ? 2 : 3);
    const kinds = new Set(POIS.map((p) => p.kind));
    expect([...kinds].sort()).toEqual([...POI_KINDS].sort()); // a place of every kind
    expect(POIS.filter((p) => p.maze).length).toBeGreaterThanOrEqual(2); // mazes
    for (const need of ['graveyard', 'circle', 'ruin', 'grove', 'outcrop', 'landmark'] as const) expect(POIS.some((p) => 'feature' in p.at && p.at.feature === need), need).toBe(true);
    for (const as of ['shore', 'cliff', 'clearing'] as const) expect(POIS.some((p) => 'near' in p.at && p.at.as === as), as).toBe(true);
  });

  it('guards are real lesser foes, chests hold a fair number of Echoes, and phenomena keep to the anomaly hues', () => {
    for (const p of POIS) {
      for (const id of p.foes?.ids ?? []) {
        expect(getEntity(id), `${p.id}: ${id}`).toBeDefined();
        expect(bosses.has(id), `${p.id}: ${id} is a boss`).toBe(false);
      }
      if (p.foes) expect(p.foes.n, p.id).toBeGreaterThan(0);
      if (p.hoard !== undefined) {
        expect(p.hoard, p.id).toBeGreaterThanOrEqual(60);
        expect(p.hoard, p.id).toBeLessThanOrEqual(2500);
      }
      if (p.fx) expect(ANOMALY_HUES, p.id).toContain(p.fx.hue);
      if (p.kind === 'anomaly') expect(p.fx, `${p.id} is an anomaly with nothing to see`).toBeDefined();
      if (p.kind === 'hoard') expect(p.hoard, `${p.id} is a hoard with no chest`).toBeDefined();
      if (p.kind === 'den') expect(p.foes, `${p.id} is a den with no foes`).toBeDefined();
    }
    expect(POIS.filter((p) => (p.aura ?? 0) > 0).length).toBeGreaterThanOrEqual(2); // comfort as well as dread
    expect(POIS.filter((p) => (p.aura ?? 0) < 0).length).toBeGreaterThanOrEqual(20);
  });
});

describe('the points of interest: where they stand', () => {
  const sites = allPoiSites();

  it('every one resolves on the land of its own region, with its chest and its guard', () => {
    expect(sites.length).toBe(POIS.length);
    for (const s of sites) {
      const region = REGIONS.find((r) => r.id === s.def.region)!;
      const rc = regionRect(region);
      expect(s.x > rc.x0 && s.x < rc.x1 && s.z > rc.z0 && s.z < rc.z1, s.def.id).toBe(true);
      if (s.def.hoard) expect(s.chest, `${s.def.id}'s chest`).not.toBeNull();
      if (s.chest) expect(Math.hypot(s.chest.x - s.x, s.chest.z - s.z), `${s.def.id}'s chest is at its heart`).toBeLessThan(s.r + 8);
      const guard = [...regionPlan(region).spawns.values()].flat().filter((x) => x.id.startsWith(`poi:${s.def.id}:`));
      expect(guard.length, `${s.def.id}'s guard`).toBe(s.def.foes?.n ?? 0);
      for (const f of guard) expect(Math.hypot(f.at.x - s.x, f.at.z - s.z), f.id).toBeLessThan(s.r + 12);
    }
  });

  it('every guard and every chest stands free of the props, the signs and each other, and where a body can walk out', () => {
    for (const r of REGIONS) {
      const plan = regionPlan(r);
      const base = groundOf(r, [...plan.props.values()].flat());
      const mine = poiSitesOf(r.id);
      const posts = [...plan.spawns.values()].flat();
      for (const s of mine) {
        if (s.chest) expect(base.clear(s.chest.x, s.chest.z), `${s.def.id}'s chest`).toBe(true);
        for (const f of posts.filter((x) => x.id.startsWith(`poi:${s.def.id}:`))) {
          expect(base.clear(f.at.x, f.at.z), f.id).toBe(true);
          for (const o of posts) if (o !== f) expect(Math.hypot(o.at.x - f.at.x, o.at.z - f.at.z), `${f.id} with ${o.id}`).toBeGreaterThan(1.2);
        }
      }
      const ids = posts.map((x) => x.id);
      expect(new Set(ids).size, `${r.id}'s posts have each an id of their own`).toBe(ids.length);
    }
  });

  it('a maze is all passages: every cell is reached from the mouth, and its walls are set about it', () => {
    for (const seed of [1, 2, 3, 99, 4242]) {
      const { right, up, mouth } = mazeWalls(createRng(seed));
      const seen = new Set<number>([mouth]);
      const stack = [mouth];
      while (stack.length) {
        const k = stack.pop()!;
        const [i, j] = [Math.floor(k / CELLS), k % CELLS];
        const to: [number, number][] = [];
        if (i + 1 < CELLS && !right[i][j]) to.push([i + 1, j]);
        if (i > 0 && !right[i - 1][j]) to.push([i - 1, j]);
        if (j + 1 < CELLS && !up[i][j]) to.push([i, j + 1]);
        if (j > 0 && !up[i][j - 1]) to.push([i, j - 1]);
        for (const [a, b] of to) if (!seen.has(a * CELLS + b)) {
          seen.add(a * CELLS + b);
          stack.push(a * CELLS + b);
        }
      }
      expect(seen.size, `seed ${seed}`).toBe(CELLS * CELLS);
    }
    for (const def of POIS.filter((p) => p.maze)) {
      const plan = regionPlan(REGIONS.find((r) => r.id === def.region)!);
      const s = plan.pois.find((x) => x.def.id === def.id)!;
      const walls = [...plan.props.values()].flat().filter((p) => p.kind === 'wall' && Math.hypot(p.x - s.x, p.z - s.z) < s.r * 1.6);
      expect(walls.length, def.id).toBeGreaterThan(CELLS);
    }
  });

  it('the first hour is kept gentle: near the opening, only the gentle foes', () => {
    const start = worldLayout().signs.find((x) => x.id === START_SIGN)!;
    let early = 0;
    for (const s of sites.filter((x) => Math.hypot(x.x - start.x, x.z - start.z) < FIRST_HOUR)) {
      early++;
      const plan = regionPlan(REGIONS.find((r) => r.id === s.def.region)!);
      for (const f of [...plan.spawns.values()].flat().filter((x) => x.id.startsWith(`poi:${s.def.id}:`))) expect(gentle(f.entity), `${f.id}: ${f.entity}`).toBe(true);
    }
  });

  it('they are planned after everything else: the ordinary posts keep their ids, running on from 0', () => {
    for (const r of REGIONS) {
      const ids = [...regionPlan(r).spawns.values()].flat().filter((x) => x.id.startsWith(`p:${r.id}:`)).map((x) => Number(x.id.split(':')[2])).sort((a, b) => a - b);
      expect(ids, r.id).toEqual(ids.map((_, k) => k));
    }
  });
});

describe('the points of interest: found by coming to them', () => {
  const site = poiSitesOf('arkham').find((s) => s.def.hoard && !s.def.aura) ?? poiSitesOf('arkham')[0];
  const key = poiKey(site.def.id);

  it('coming within reach finds a place once, says its name and its line, and a save keeps it', () => {
    const g = createWorldGame();
    const found = record(g, 'PoiFound');
    goTo(g, site.x + reachOf(site) + 30, site.z);
    run(g, 40);
    expect(found).toHaveLength(0); // near is not there
    goTo(g, site.x, site.z);
    run(g, 40);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ id: site.def.id, name: site.def.name, region: 'arkham', kind: site.def.kind, line: site.def.line });
    expect(found[0].found).toBeGreaterThanOrEqual(1);
    expect(found[0].of).toBeGreaterThanOrEqual(3);
    expect(g.overworld!.told.has(key)).toBe(true);
    run(g, 200);
    expect(found).toHaveLength(1); // once
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(loaded.overworld!.told.has(key)).toBe(true);
    const again = record(loaded, 'PoiFound');
    goTo(loaded, site.x, site.z);
    run(loaded, 60);
    expect(again).toHaveLength(0);
  });

  it('a strange place gives a little insight; one that is only a den gives none', () => {
    const strange = POIS.find((p) => (p.kind === 'anomaly' || p.kind === 'tale') && p.region === 'arkham' && p.insight === undefined);
    const den = POIS.find((p) => p.kind === 'den' && p.region === 'arkham' && p.insight === undefined);
    for (const [def, want] of [[strange, POI.insight], [den, 0]] as const) {
      if (!def) continue;
      const g = createWorldGame();
      const s = poiSitesOf('arkham').find((x) => x.def.id === def.id)!;
      goTo(g, s.x, s.z);
      run(g, 40);
      expect(g.mind.insight, def.id).toBe(want);
    }
  });

  it('its chest is set down as one nears, once, taken for good, and a load does not set it down again', () => {
    const g = createWorldGame();
    const chest = site.chest!;
    const named = (): number => [...g.ecs.c.tome.values()].filter((t) => t.name === hoardName(site.def.id)).length;
    goTo(g, site.x + POI.range + 40, site.z);
    run(g, 40);
    expect(named()).toBe(0);
    goTo(g, site.x + 30, site.z);
    run(g, 40);
    expect(named()).toBe(1);
    run(g, 120);
    expect(named()).toBe(1);
    const before = g.player.echoes;
    goTo(g, chest.x, chest.z);
    run(g, 20);
    expect(g.player.echoes).toBe(before + site.def.hoard!);
    expect(named()).toBe(0);
    expect(g.overworld!.read.has(hoardName(site.def.id))).toBe(true);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    goTo(loaded, site.x, site.z);
    run(loaded, 40);
    expect([...loaded.ecs.c.tome.values()].filter((t) => t.name === hoardName(site.def.id))).toHaveLength(0);
  });

  it('a place that speaks twice says its second line on coming back, not at once and not within the minute', () => {
    const def = POIS.find((p) => p.again && p.region === 'arkham') ?? POIS.find((p) => p.again && p.region === 'hub');
    expect(def).toBeDefined();
    const g = createWorldGame();
    const s = poiSitesOf(def!.region).find((x) => x.def.id === def!.id)!;
    const titles = record(g, 'Title');
    goTo(g, s.x, s.z);
    run(g, 40);
    expect(titles.map((t) => t.text)).not.toContain(def!.again);
    goTo(g, s.x + 200, s.z);
    run(g, 20);
    goTo(g, s.x, s.z);
    run(g, 40);
    expect(titles.map((t) => t.text)).not.toContain(def!.again); // too soon
    goTo(g, s.x + 200, s.z);
    run(g, 20);
    g.frame += POI.hear * 60 + 60; // the minute and more passes
    goTo(g, s.x, s.z);
    run(g, 40);
    expect(titles.map((t) => t.text)).toContain(def!.again);
  });

  it('dread drains the mind and comfort mends it, unless a swallow of Laudanum holds it', () => {
    const dread = POIS.find((p) => (p.aura ?? 0) < 0 && p.region === 'arkham');
    expect(dread).toBeDefined();
    const g = createWorldGame();
    const s = poiSitesOf('arkham').find((x) => x.def.id === dread!.id)!;
    g.mind.sanity = 90;
    goTo(g, s.x, s.z);
    run(g, 120);
    expect(g.mind.sanity).toBeLessThan(90);
    const held = createWorldGame();
    held.mind.sanity = 90;
    held.player.steady = 99999;
    goTo(held, s.x, s.z);
    run(held, 120);
    expect(held.mind.sanity).toBeGreaterThanOrEqual(90);
    const dream = POIS.find((p) => (p.aura ?? 0) > 0)!;
    const d = createWorldGame();
    const ds = poiSitesOf(dream.region).find((x) => x.def.id === dream.id)!;
    d.mind.sanity = 40;
    goTo(d, ds.x, ds.z);
    run(d, 120);
    expect(d.mind.sanity).toBeGreaterThan(40);
  });

  it('the demo keeps to its own realms: a place beyond them is not found, and no mark is shown of it', () => {
    const g = createWorldGame({ demo: true });
    const far = poiSitesOf('dunwich')[0];
    expect(poiMark(g, far)).toBe('hidden');
    const found = record(g, 'PoiFound');
    goTo(g, far.x, far.z);
    run(g, 40);
    expect(found).toHaveLength(0);
  });
});

describe('the points of interest on the map', () => {
  const site = poiSitesOf('dunwich')[0];

  it('nothing shows until ground near is charted; then a "?"; once found its mark; dim once its chest is taken', () => {
    const g = createWorldGame();
    const ow = g.overworld!;
    expect(poiMark(g, site)).toBe('hidden');
    explore(ow.explored, { x: site.x + POI.hint * 0.9, z: site.z });
    expect(poiMark(g, site)).toBe('rumour');
    const far = createWorldGame();
    explore(far.overworld!.explored, { x: site.x + POI.hint * 3, z: site.z });
    expect(poiMark(far, site)).toBe('hidden');
    ow.told.add(poiKey(site.def.id));
    expect(poiMark(g, site)).toBe(site.def.hoard ? 'found' : 'found');
    if (site.def.hoard) {
      ow.read.add(hoardName(site.def.id));
      expect(poiMark(g, site)).toBe('spent');
    }
  });

  it('the secrets are not among the named places, nor do they count toward the searcher', () => {
    for (const r of REGIONS) expect(regionPlan(r).pois.length).toBe(poisOf(r.id).length);
    const g = createWorldGame();
    expect([...g.overworld!.places].some((x) => x.startsWith('poi'))).toBe(false);
  });
});
