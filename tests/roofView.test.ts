import { describe, expect, it } from 'vitest';
import { worldLayout } from '../src/world/placements';
import { auditRoof } from './roofAudit';

/** The tops of the dungeons seen from outside (round 45): no sky through a heap, no bare wall or floor on top, no two faces fighting. */
describe('what the eye meets above a dungeon (round 45)', () => {
  it('every roofed room has a whole top', () => {
    const found = worldLayout().dungeons.flatMap((d) => auditRoof(d));
    expect(found.map((f) => `${f.kind} ${f.dungeon}/${f.room}: ${f.key} ${f.at}`)).toEqual([]);
  }, 300000);
});
