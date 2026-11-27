/**
 * 2026-11-27, the playtest at Benefit Street: "walls go through the buildings". Hutchinson's avenue of hedges ran from his gate into the
 * town and through its houses, a graveyard's lane of stones and trees did the same in Providence, and a few trees and rocks stood in a
 * house's wing. In every realm nothing solid stands in a house: its walls, wing, bay or porch.
 */
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { regionPlan } from '../src/world/regionPlan';
import { propsMeet } from '../src/world/footprints';

describe('nothing stands in a house (2026-11-27)', () => {
  it('keeps every prop of every realm out of its houses', () => {
    const inside: string[] = [];
    for (const region of REGIONS) {
      const props = [...regionPlan(region).props.values()].flat();
      const houses = props.filter((p) => p.kind === 'house');
      for (const p of props) {
        if (p.kind === 'house') continue;
        for (const h of houses) if (Math.hypot(h.x - p.x, h.z - p.z) < 40 && propsMeet(p, h)) inside.push(`${region.id}: ${p.set?.id ?? p.kind} at ${p.x.toFixed(0)}, ${p.z.toFixed(0)}`);
      }
    }
    expect(inside).toEqual([]);
  });

  it('ends a court\'s avenue before the town: Hutchinson\'s hedges stand clear of Benefit Street\'s houses', () => {
    const props = [...regionPlan(REGIONS.find((r) => r.id === 'providence')!).props.values()].flat();
    const hedges = props.filter((p) => p.set?.id === 'hedge');
    expect(hedges.length).toBeGreaterThan(20);
    const houses = props.filter((p) => p.kind === 'house');
    for (const p of hedges) expect(houses.every((h) => !propsMeet(p, h, 0.5))).toBe(true);
  });
});
