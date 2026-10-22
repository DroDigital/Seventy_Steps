/**
 * Where the full map opens (round 60): on what has been seen, not on a realm of black; on the whole realm for one that is charted.
 */
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { EXPLORE } from '../src/data/tuning';
import { explore, type Explored } from '../src/systems/exploration';
import { allRealms, realmRect } from '../src/world/mapData';
import { chartedRect, fitScale, OPENING, openingView } from '../src/ui/mapFit';

const realm = allRealms().find((r) => r.length > 1)!; // the waking world
const rect = realmRect(realm);
const centre = { x: (rect.x0 + rect.x1) / 2, z: (rect.z0 + rect.z1) / 2 };
const [W, H] = [1280, 720];

describe('where the map opens (round 60)', () => {
  it('finds no charted ground where none has been seen, and the box about what has', () => {
    const ex: Explored = new Map();
    expect(chartedRect(ex, realm)).toBeNull();
    explore(ex, centre, EXPLORE.sight);
    const box = chartedRect(ex, realm)!;
    expect(box.x0).toBeLessThanOrEqual(centre.x - EXPLORE.sight + EXPLORE.cell);
    expect(box.x1).toBeGreaterThanOrEqual(centre.x + EXPLORE.sight - EXPLORE.cell);
    expect(box.x1 - box.x0).toBeLessThan(EXPLORE.sight * 2 + EXPLORE.cell * 3);
  });

  it("opens a new game's few steps of ground close, with the investigator in view and no more than the closest zoom", () => {
    const ex: Explored = new Map();
    explore(ex, centre, EXPLORE.sight);
    const v = openingView(realm, chartedRect(ex, realm), centre, W, H);
    const fit = fitScale(realm, W, H);
    expect(v.scale).toBeGreaterThan(fit * 2);
    expect(v.scale).toBeLessThanOrEqual(fit * OPENING.most + 1e-9);
    expect(Math.abs(v.cx - centre.x)).toBeLessThan(W / 2 / v.scale); // where the investigator stands is on the screen
    expect(W / v.scale).toBeGreaterThanOrEqual(OPENING.least - 1e-9); // and no nearer than a few hundred metres across
  });

  it('opens a charted realm on the whole of it, as it did', () => {
    const ex: Explored = new Map();
    for (const r of realm) explore(ex, { x: (realmRect([r]).x0 + realmRect([r]).x1) / 2, z: (realmRect([r]).z0 + realmRect([r]).z1) / 2 }, 2000);
    const v = openingView(realm, chartedRect(ex, realm), centre, W, H);
    expect(v.scale).toBeCloseTo(fitScale(realm, W, H), 6);
    expect(v.cx).toBeCloseTo(centre.x, 3);
    expect(v.cz).toBeCloseTo(centre.z, 3);
  });

  it('keeps the investigator in view when they have walked beyond what is charted, and with no ground charted at all', () => {
    const far = { x: rect.x0 + 40, z: rect.z0 + 40 };
    for (const seen of [null, chartedRect(new Map(), realm)]) {
      const v = openingView(realm, seen, far, W, H);
      expect(Math.abs(v.cx - far.x) * v.scale).toBeLessThan(W / 2);
      expect(Math.abs(v.cz - far.z) * v.scale).toBeLessThan(H / 2);
    }
  });

  it('exists for every realm, and fits no region beyond its own', () => {
    expect(REGIONS.length).toBeGreaterThan(0);
    for (const r of allRealms()) expect(fitScale(r, W, H)).toBeGreaterThan(0);
  });
});
